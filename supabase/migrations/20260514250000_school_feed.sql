-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 8.1 — Mural de Feitos da Escola.
--
-- Auto-feed of notable achievements: rare chest pulls, first-obtains, raid
-- defeats, dungeon floor milestones. Filtered by Turma / Guilda / Escola.
-- No comments, no replies — only a silent 👁️ view counter (anti-bullying).
--
-- Why a new table instead of reusing achievement_feed:
-- - achievement_feed is already used by the parent portal with a fixed shape.
-- - We need denormalized class_id + guild_id for the 3 filter scopes to be
--   served by a single index without joins.
-- - We need a per-(event, viewer) uniqueness so view counts can't be inflated.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.school_feed_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id     UUID                 REFERENCES public.classes(id)   ON DELETE SET NULL,
  guild_id     UUID                 REFERENCES public.guilds(id)    ON DELETE SET NULL,
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_type   TEXT        NOT NULL CHECK (event_type IN ('chest_open_rare','first_obtained','raid_defeated','floor_milestone')),
  event_data   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  views_count  INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sfe_teacher_created   ON public.school_feed_events (teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sfe_class_created     ON public.school_feed_events (class_id, created_at DESC) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sfe_guild_created     ON public.school_feed_events (guild_id, created_at DESC) WHERE guild_id IS NOT NULL;

ALTER TABLE public.school_feed_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read school_feed_events"
  ON public.school_feed_events FOR SELECT USING (true);

-- One row per viewer per event — silent counter, no comments.
CREATE TABLE IF NOT EXISTS public.school_feed_views (
  event_id    UUID        NOT NULL REFERENCES public.school_feed_events(id) ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES public.students(id)           ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, student_id)
);

ALTER TABLE public.school_feed_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read school_feed_views"
  ON public.school_feed_views FOR SELECT USING (true);

-- ─── Helper to emit an event (centralizes the denormalization) ───────────────
CREATE OR REPLACE FUNCTION public._emit_feed_event(
  p_student_id UUID,
  p_event_type TEXT,
  p_event_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id        UUID;
  v_teacher   UUID;
  v_class     UUID;
  v_guild     UUID;
BEGIN
  SELECT teacher_id, class_id INTO v_teacher, v_class
    FROM public.students WHERE id = p_student_id;
  IF v_teacher IS NULL THEN RETURN NULL; END IF;

  SELECT guild_id INTO v_guild
    FROM public.guild_members WHERE student_id = p_student_id LIMIT 1;

  INSERT INTO public.school_feed_events
    (teacher_id, class_id, guild_id, student_id, event_type, event_data)
  VALUES (v_teacher, v_class, v_guild, p_student_id, p_event_type, COALESCE(p_event_data, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ─── View RPC (idempotent per viewer) ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.view_feed_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_sid     UUID;
  v_inserted BOOLEAN;
  v_count   INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

  INSERT INTO public.school_feed_views (event_id, student_id)
  VALUES (p_event_id, v_sid)
  ON CONFLICT (event_id, student_id) DO NOTHING
  RETURNING TRUE INTO v_inserted;

  IF v_inserted THEN
    UPDATE public.school_feed_events
       SET views_count = views_count + 1
     WHERE id = p_event_id;
  END IF;

  SELECT views_count INTO v_count FROM public.school_feed_events WHERE id = p_event_id;
  RETURN jsonb_build_object('success', true, 'views_count', v_count, 'was_new', COALESCE(v_inserted, false));
END;
$$;
GRANT EXECUTE ON FUNCTION public.view_feed_event(UUID) TO authenticated;

-- ─── Read RPC with filters ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_school_feed(
  p_filter TEXT DEFAULT 'class',  -- 'class' | 'guild' | 'school'
  p_limit  INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  event_type    TEXT,
  event_data    JSONB,
  views_count   INTEGER,
  created_at    TIMESTAMPTZ,
  student_id    UUID,
  student_name  TEXT,
  class_id      UUID,
  guild_id      UUID,
  guild_name    TEXT,
  viewed_by_me  BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    UUID := auth.uid();
  v_me     students%ROWTYPE;
  v_guild  UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT * INTO v_me FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_me.id IS NULL THEN RETURN; END IF;
  SELECT guild_id INTO v_guild FROM public.guild_members WHERE student_id = v_me.id LIMIT 1;

  RETURN QUERY
  SELECT
    e.id, e.event_type, e.event_data, e.views_count, e.created_at,
    e.student_id, COALESCE(s.character_name, s.name) AS student_name,
    e.class_id, e.guild_id, g.name AS guild_name,
    EXISTS (SELECT 1 FROM public.school_feed_views v
             WHERE v.event_id = e.id AND v.student_id = v_me.id) AS viewed_by_me
    FROM public.school_feed_events e
    JOIN public.students s ON s.id = e.student_id
    LEFT JOIN public.guilds g ON g.id = e.guild_id
   WHERE
     CASE p_filter
       WHEN 'guild'  THEN v_guild IS NOT NULL AND e.guild_id = v_guild
       WHEN 'school' THEN e.teacher_id = v_me.teacher_id
       ELSE                e.class_id = v_me.class_id
     END
   ORDER BY e.created_at DESC
   LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_school_feed(TEXT, INTEGER, INTEGER) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER 1: chest_open_rare — fires when a chest opening contains an item of
--            rarity 'mythic' or 'unknown'.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.tg_school_feed_chest_open()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item       JSONB;
  v_rarity     TEXT;
  v_name       TEXT;
  v_source     TEXT;
  v_item_id    UUID;
BEGIN
  IF NEW.items_received IS NULL OR jsonb_typeof(NEW.items_received) <> 'array' THEN
    RETURN NEW;
  END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items_received) LOOP
    v_rarity := v_item->>'rarity';
    IF v_rarity IN ('mythic','unknown') THEN
      v_name := v_item->>'item_name';
      v_item_id := NULLIF(v_item->>'item_id','')::UUID;
      SELECT source_anime INTO v_source FROM public.shop_items WHERE id = v_item_id;
      PERFORM public._emit_feed_event(
        NEW.student_id, 'chest_open_rare',
        jsonb_build_object(
          'item_id', v_item_id,
          'item_name', v_name,
          'rarity', v_rarity,
          'source_anime', v_source,
          'chest_type_id', NEW.chest_type_id
        )
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS school_feed_chest_open ON public.chest_openings;
CREATE TRIGGER school_feed_chest_open
AFTER INSERT ON public.chest_openings
FOR EACH ROW EXECUTE FUNCTION public.tg_school_feed_chest_open();

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER 2: first_obtained — fires when a student is the FIRST in their
--            teacher scope to obtain a Legendary+ item.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.tg_school_feed_first_obtained()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item       shop_items%ROWTYPE;
  v_teacher_id UUID;
  v_prior      INTEGER;
BEGIN
  SELECT * INTO v_item FROM public.shop_items WHERE id = NEW.item_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF v_item.rarity NOT IN ('legendary','mythic','unknown') THEN RETURN NEW; END IF;

  SELECT teacher_id INTO v_teacher_id FROM public.students WHERE id = NEW.student_id;
  IF v_teacher_id IS NULL THEN RETURN NEW; END IF;

  -- Count prior owners of this item within the same teacher scope.
  SELECT COUNT(*) INTO v_prior
    FROM public.student_inventory si
    JOIN public.students s ON s.id = si.student_id
   WHERE si.item_id = NEW.item_id
     AND s.teacher_id = v_teacher_id
     AND si.student_id <> NEW.student_id;

  IF v_prior = 0 THEN
    PERFORM public._emit_feed_event(
      NEW.student_id, 'first_obtained',
      jsonb_build_object(
        'item_id', v_item.id,
        'item_name', v_item.name,
        'rarity', v_item.rarity,
        'source_anime', v_item.source_anime
      )
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS school_feed_first_obtained ON public.student_inventory;
CREATE TRIGGER school_feed_first_obtained
AFTER INSERT ON public.student_inventory
FOR EACH ROW EXECUTE FUNCTION public.tg_school_feed_first_obtained();

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER 3: raid_defeated — fires when a boss raid transitions to defeated.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.tg_school_feed_raid_defeated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guild_name TEXT;
  v_top_student UUID;
  v_teacher    UUID;
BEGIN
  IF OLD.status = 'defeated' OR NEW.status <> 'defeated' THEN
    RETURN NEW;
  END IF;

  SELECT name, teacher_id INTO v_guild_name, v_teacher FROM public.guilds WHERE id = NEW.guild_id;

  -- Pick top contributor as the "owner" of the feed event for student_id.
  SELECT student_id INTO v_top_student
    FROM public.boss_raid_contributions
   WHERE raid_id = NEW.id
   ORDER BY damage_dealt DESC LIMIT 1;
  IF v_top_student IS NULL THEN RETURN NEW; END IF;

  PERFORM public._emit_feed_event(
    v_top_student, 'raid_defeated',
    jsonb_build_object(
      'raid_id', NEW.id,
      'boss_name', NEW.boss_name,
      'boss_sprite', NEW.boss_sprite,
      'guild_id', NEW.guild_id,
      'guild_name', v_guild_name,
      'total_hp', NEW.total_hp
    )
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS school_feed_raid_defeated ON public.boss_raids;
CREATE TRIGGER school_feed_raid_defeated
AFTER UPDATE OF status ON public.boss_raids
FOR EACH ROW EXECUTE FUNCTION public.tg_school_feed_raid_defeated();

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER 4: floor_milestone — first student in teacher scope to reach
--            floor 30 (and 40, 50… every multiple of 10).
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.tg_school_feed_floor_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_floor      INTEGER := NEW.floor_id;
  v_prior      INTEGER;
BEGIN
  -- Only milestone floors (>= 30 and multiple of 10) and only when the boss
  -- is just now defeated on this row.
  IF v_floor < 30 OR (v_floor % 10) <> 0 THEN RETURN NEW; END IF;
  IF NEW.boss_defeated IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.boss_defeated IS TRUE THEN RETURN NEW; END IF;

  SELECT user_id INTO v_student_id FROM public.characters WHERE id = NEW.character_id;
  -- Map character.user_id back to a student row.
  SELECT id, teacher_id INTO v_student_id, v_teacher_id
    FROM public.students WHERE user_id = v_student_id LIMIT 1;
  IF v_student_id IS NULL OR v_teacher_id IS NULL THEN RETURN NEW; END IF;

  -- Has anyone else in the teacher scope already conquered this floor?
  SELECT COUNT(*) INTO v_prior
    FROM public.character_progress cp
    JOIN public.characters c ON c.id = cp.character_id
    JOIN public.students sj ON sj.user_id = c.user_id
   WHERE cp.floor_id = v_floor
     AND cp.boss_defeated = TRUE
     AND sj.teacher_id = v_teacher_id
     AND sj.id <> v_student_id;
  IF v_prior > 0 THEN RETURN NEW; END IF;

  PERFORM public._emit_feed_event(
    v_student_id, 'floor_milestone',
    jsonb_build_object('floor', v_floor)
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS school_feed_floor_milestone ON public.character_progress;
CREATE TRIGGER school_feed_floor_milestone
AFTER INSERT OR UPDATE OF boss_defeated ON public.character_progress
FOR EACH ROW EXECUTE FUNCTION public.tg_school_feed_floor_milestone();

-- Enable realtime for the feed so clients see new events without polling.
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.school_feed_events;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
END;
$$;
