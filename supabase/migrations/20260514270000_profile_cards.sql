-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 8.3 — Customizable profile card.
--
-- Composite of 4 elements:
--   1. Background banner (catalog, unlockable, student-selected)
--   2. Avatar frame    (auto, derived from current weekly ranking; not stored)
--   3. Active title    (from Patch 8.2 — already persisted)
--   4. Guild badge     (from existing guild membership — automatic)
--
-- We persist only what the student actively chooses (banner). Frame is
-- recomputed live in get_profile_card so it "loses" automatically when the
-- student falls out of the bracket — per spec.
--
-- Banners themselves are pure CSS (gradients + ornaments) — image_data is a
-- JSONB describing the recipe so the client can render without assets.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.banner_catalog (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  description     TEXT,
  unlock_condition TEXT       NOT NULL,           -- 'default' | 'level_reached' | 'floor_reached' | 'raids_won' | 'master_grant' | 'event'
  condition_value INTEGER,
  condition_payload JSONB     NOT NULL DEFAULT '{}'::jsonb,
  image_data      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  rarity          TEXT        NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary','mythic','event')),
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read banner_catalog" ON public.banner_catalog FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.student_unlocked_banners (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  banner_id    UUID        NOT NULL REFERENCES public.banner_catalog(id) ON DELETE CASCADE,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  source       TEXT,
  UNIQUE (student_id, banner_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_student ON public.student_unlocked_banners (student_id);
ALTER TABLE public.student_unlocked_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read unlocked_banners" ON public.student_unlocked_banners FOR SELECT USING (true);

-- Active banner reference on students (cheap to read everywhere).
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS active_banner_key TEXT;

-- Seed banners with image_data recipes the client renders. Pure CSS — no
-- assets. Each banner exposes a `style` blob with `bg` (background string) +
-- ornament hints.
INSERT INTO public.banner_catalog (key, name, description, unlock_condition, condition_value, condition_payload, image_data, rarity)
VALUES
  ('default',          'Padrão',                'Banner inicial.',
   'default',          NULL, '{}',
   '{"bg":"linear-gradient(180deg,#0d1424 0%,#060912 100%)","tone":"#475569","ornament":"none"}'::jsonb,
   'common'),

  ('amber_dunes',      'Dunas de Âmbar',        'Conquistado ao atingir o nível 5.',
   'level_reached',    5,    '{}',
   '{"bg":"radial-gradient(ellipse at 50% 100%,rgba(245,158,11,0.5),transparent 70%),linear-gradient(180deg,#1a0e02 0%,#3b1f0a 50%,#1a0e02 100%)","tone":"#f59e0b","ornament":"sand"}'::jsonb,
   'common'),

  ('verdant_glade',    'Clareira Verdejante',   'Conquistado ao atingir o nível 10.',
   'level_reached',    10,   '{}',
   '{"bg":"radial-gradient(ellipse at 30% 30%,rgba(74,222,128,0.35),transparent 60%),linear-gradient(180deg,#04190d 0%,#0a3d1b 50%,#04190d 100%)","tone":"#4ade80","ornament":"leaves"}'::jsonb,
   'rare'),

  ('cobalt_depths',    'Profundezas Cobalto',   'Conquistado ao alcançar o andar 25 da dungeon.',
   'floor_reached',    25,   '{}',
   '{"bg":"radial-gradient(ellipse at 50% 40%,rgba(56,189,248,0.35),transparent 60%),linear-gradient(180deg,#020817 0%,#082138 50%,#020817 100%)","tone":"#38bdf8","ornament":"bubbles"}'::jsonb,
   'rare'),

  ('crimson_storm',    'Tempestade Carmesim',   'Conquistado ao alcançar o andar 40 da dungeon.',
   'floor_reached',    40,   '{}',
   '{"bg":"radial-gradient(ellipse at 50% 100%,rgba(240,80,80,0.5),transparent 70%),linear-gradient(180deg,#1a0204 0%,#3b0a0a 50%,#1a0204 100%)","tone":"#f05050","ornament":"sparks"}'::jsonb,
   'epic'),

  ('arcane_purple',    'Roxo Arcano',           'Conquistado ao vencer 3 raids de guilda.',
   'raids_won',        3,    '{}',
   '{"bg":"radial-gradient(ellipse at 50% 30%,rgba(124,58,237,0.45),transparent 60%),linear-gradient(180deg,#0a0518 0%,#1f0a3b 50%,#0a0518 100%)","tone":"#7c3aed","ornament":"runes"}'::jsonb,
   'epic'),

  ('aurora_voyage',    'Viagem Aurora',         'Conquistado ao acumular 50 cartas únicas.',
   'unique_cards_owned',50,  '{}',
   '{"bg":"linear-gradient(180deg,#020617 0%,#03192a 60%,#020617 100%)","tone":"#22d3ee","ornament":"aurora"}'::jsonb,
   'epic'),

  ('golden_throne',    'Trono Dourado',         'Conquistado por ser top 1 do ranking geral.',
   'geral_top1_count', 1,    '{}',
   '{"bg":"radial-gradient(ellipse at 50% 30%,rgba(245,200,75,0.5),transparent 60%),linear-gradient(180deg,#2a1c05 0%,#11080d 50%,#2a1c05 100%)","tone":"#f5c84b","ornament":"laurels"}'::jsonb,
   'legendary'),

  ('void_horizon',     'Horizonte do Vazio',    'Conquistado ao obter uma carta ???.',
   'unknown_owned',    1,    '{}',
   '{"bg":"radial-gradient(circle at 50% 50%,rgba(148,163,184,0.18) 0%,transparent 30%),linear-gradient(180deg,#020208 0%,#0a0a12 100%)","tone":"#94a3b8","ornament":"glitch"}'::jsonb,
   'mythic'),

  ('event_special',    'Selo do Evento',        'Concedido durante eventos especiais.',
   'master_grant',     NULL, '{}',
   '{"bg":"linear-gradient(110deg,#f87171,#fbbf24,#4ade80,#22d3ee,#c084fc,#f87171);background-size:300% 300%","tone":"#c084fc","ornament":"prism"}'::jsonb,
   'event')
ON CONFLICT (key) DO UPDATE SET
  name             = EXCLUDED.name,
  description      = EXCLUDED.description,
  unlock_condition = EXCLUDED.unlock_condition,
  condition_value  = EXCLUDED.condition_value,
  condition_payload= EXCLUDED.condition_payload,
  image_data       = EXCLUDED.image_data,
  rarity           = EXCLUDED.rarity;

-- ─── Helpers ────────────────────────────────────────────────────────────────
-- Frame derivation: current weekly ranking (geral) position determines frame.
CREATE OR REPLACE FUNCTION public._frame_for_student(p_student_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE v_pos INTEGER; v_top1_count INTEGER;
BEGIN
  -- 5x geral top 1 → holo (permanent legacy honor).
  SELECT COUNT(*) INTO v_top1_count
    FROM public.weekly_rankings_snapshot
   WHERE ranking_type = 'geral' AND position = 1 AND entity_id = p_student_id;
  IF v_top1_count >= 5 THEN RETURN 'holo'; END IF;

  -- Most recent finalized week's geral position.
  SELECT s.position INTO v_pos
    FROM public.weekly_rankings_snapshot s
   WHERE s.ranking_type = 'geral' AND s.entity_id = p_student_id
   ORDER BY s.week_start DESC LIMIT 1;
  IF v_pos IS NULL THEN RETURN 'default'; END IF;
  IF v_pos = 1     THEN RETURN 'gold';   END IF;
  IF v_pos <= 10   THEN RETURN 'silver'; END IF;
  IF v_pos <= 50   THEN RETURN 'bronze'; END IF;
  RETURN 'default';
END;
$$;

-- Unlock checker for banners (mirrors title checker, much smaller pool).
CREATE OR REPLACE FUNCTION public.check_my_banner_conditions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_sid       UUID;
  v_unlocked  JSONB := '[]'::jsonb;
  v_b         RECORD;
  v_progress  INTEGER;
  v_inserted  UUID;
  v_level     INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('unlocked', v_unlocked); END IF;
  SELECT id, level INTO v_sid, v_level FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('unlocked', v_unlocked); END IF;

  FOR v_b IN
    SELECT * FROM public.banner_catalog
     WHERE is_active = TRUE
       AND unlock_condition <> 'master_grant'
       AND id NOT IN (SELECT banner_id FROM public.student_unlocked_banners WHERE student_id = v_sid)
  LOOP
    v_progress := 0;

    IF v_b.key = 'default' THEN
      v_progress := 1;   -- always unlocked

    ELSIF v_b.unlock_condition = 'level_reached' THEN
      v_progress := v_level;

    ELSIF v_b.unlock_condition = 'floor_reached' THEN
      SELECT COALESCE(MAX(cp.floor_id), 0) INTO v_progress
        FROM public.character_progress cp
        JOIN public.characters c ON c.id = cp.character_id
        JOIN public.students s ON s.user_id = c.user_id
       WHERE s.id = v_sid;

    ELSIF v_b.unlock_condition = 'raids_won' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.boss_raid_rewards
       WHERE student_id = v_sid AND victory = TRUE;

    ELSIF v_b.unlock_condition = 'geral_top1_count' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.weekly_rankings_snapshot
       WHERE ranking_type = 'geral' AND position = 1 AND entity_id = v_sid;

    ELSIF v_b.unlock_condition = 'unique_cards_owned' THEN
      SELECT COUNT(DISTINCT item_id)::INT INTO v_progress
        FROM public.student_inventory WHERE student_id = v_sid;

    ELSIF v_b.unlock_condition = 'unknown_owned' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.student_inventory si
        JOIN public.shop_items sh ON sh.id = si.item_id
       WHERE si.student_id = v_sid AND sh.rarity = 'unknown';
    END IF;

    IF v_progress >= COALESCE(v_b.condition_value, 1) THEN
      INSERT INTO public.student_unlocked_banners (student_id, banner_id, source)
      VALUES (v_sid, v_b.id, v_b.unlock_condition)
      ON CONFLICT (student_id, banner_id) DO NOTHING
      RETURNING id INTO v_inserted;
      IF v_inserted IS NOT NULL THEN
        v_unlocked := v_unlocked || jsonb_build_object('banner_key', v_b.key, 'name', v_b.name, 'rarity', v_b.rarity);
        INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
        VALUES (
          v_sid, 'banner_unlock',
          format('Novo banner: %s', v_b.name),
          'Aplique no seu perfil pela tela do herói.',
          jsonb_build_object('banner_key', v_b.key, 'rarity', v_b.rarity)
        );
      END IF;
      v_inserted := NULL;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('unlocked', v_unlocked);
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_my_banner_conditions() TO authenticated;

-- ─── Set active banner ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_my_active_banner(p_banner_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

  IF p_banner_key IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.student_unlocked_banners sub
      JOIN public.banner_catalog bc ON bc.id = sub.banner_id
     WHERE sub.student_id = v_sid AND bc.key = p_banner_key
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Banner não desbloqueado');
  END IF;

  UPDATE public.students SET active_banner_key = p_banner_key WHERE id = v_sid;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_my_active_banner(TEXT) TO authenticated;

-- ─── Composite reader: ANYONE's profile card ────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_profile_card(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_s            students%ROWTYPE;
  v_banner_key   TEXT;
  v_banner       JSONB;
  v_frame        TEXT;
  v_title        JSONB;
  v_guild        JSONB;
BEGIN
  SELECT * INTO v_s FROM public.students WHERE id = p_student_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_banner_key := COALESCE(v_s.active_banner_key, 'default');
  SELECT jsonb_build_object(
    'key', key, 'name', name, 'rarity', rarity, 'image_data', image_data
  ) INTO v_banner
  FROM public.banner_catalog WHERE key = v_banner_key;
  IF v_banner IS NULL THEN
    SELECT jsonb_build_object('key', key, 'name', name, 'rarity', rarity, 'image_data', image_data)
      INTO v_banner FROM public.banner_catalog WHERE key = 'default';
  END IF;

  v_frame := public._frame_for_student(p_student_id);

  -- Active title (from 8.2)
  SELECT jsonb_build_object(
    'title_id', tc.id, 'name', tc.name, 'color', tc.color
  ) INTO v_title
  FROM public.student_unlocked_titles ut
  JOIN public.title_catalog tc ON tc.id = ut.title_id
  WHERE ut.student_id = p_student_id AND ut.is_active = TRUE
  LIMIT 1;

  -- Guild badge
  SELECT jsonb_build_object(
    'id', g.id, 'name', g.name, 'emblem', g.emblem, 'level', g.level
  ) INTO v_guild
  FROM public.guild_members gm
  JOIN public.guilds g ON g.id = gm.guild_id
  WHERE gm.student_id = p_student_id LIMIT 1;

  RETURN jsonb_build_object(
    'student', jsonb_build_object(
      'id',           v_s.id,
      'name',         v_s.name,
      'character_name', v_s.character_name,
      'level',        v_s.level,
      'character_class', v_s.character_class,
      'profile_photo_url', v_s.profile_photo_url
    ),
    'banner', v_banner,
    'frame',  v_frame,
    'title',  v_title,
    'guild',  v_guild
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_profile_card(UUID) TO authenticated, anon;

-- Reader for the caller's own card + the catalog of unlocked banners.
CREATE OR REPLACE FUNCTION public.get_my_banner_catalog()
RETURNS TABLE (
  banner_id    UUID,
  key          TEXT,
  name         TEXT,
  description  TEXT,
  rarity       TEXT,
  image_data   JSONB,
  unlocked     BOOLEAN,
  is_active    BOOLEAN,
  condition_label TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID; v_active TEXT;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT id, active_banner_key INTO v_sid, v_active FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    bc.id, bc.key, bc.name, bc.description, bc.rarity, bc.image_data,
    bc.key = 'default' OR EXISTS (
      SELECT 1 FROM public.student_unlocked_banners sub
       WHERE sub.student_id = v_sid AND sub.banner_id = bc.id
    ) AS unlocked,
    bc.key = COALESCE(v_active, 'default') AS is_active,
    CASE bc.unlock_condition
      WHEN 'default'             THEN 'Sempre disponível'
      WHEN 'level_reached'       THEN format('Nível %s', bc.condition_value)
      WHEN 'floor_reached'       THEN format('Andar %s da dungeon', bc.condition_value)
      WHEN 'raids_won'           THEN format('Vença %s raids', bc.condition_value)
      WHEN 'geral_top1_count'    THEN format('Top 1 Geral em %s semana(s)', bc.condition_value)
      WHEN 'unique_cards_owned'  THEN format('%s cartas únicas', bc.condition_value)
      WHEN 'unknown_owned'       THEN 'Obtenha uma carta ???'
      WHEN 'master_grant'        THEN 'Concedido pelo professor'
      ELSE bc.unlock_condition
    END AS condition_label
  FROM public.banner_catalog bc
  WHERE bc.is_active = TRUE
  ORDER BY
    CASE bc.rarity WHEN 'common' THEN 0 WHEN 'rare' THEN 1 WHEN 'epic' THEN 2
                   WHEN 'legendary' THEN 3 WHEN 'mythic' THEN 4 ELSE 5 END,
    bc.name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_banner_catalog() TO authenticated;

-- Pre-unlock the default banner for everyone.
INSERT INTO public.student_unlocked_banners (student_id, banner_id, source)
SELECT s.id, bc.id, 'default'
  FROM public.students s
  CROSS JOIN public.banner_catalog bc
 WHERE bc.key = 'default'
ON CONFLICT (student_id, banner_id) DO NOTHING;
