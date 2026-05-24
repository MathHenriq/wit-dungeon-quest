-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 8.2 — Títulos colecionáveis.
--
-- We don't reuse the legacy `student_titles` table (Patch 0 — temporary
-- teacher-granted titles with expires_at). Different model. New tables:
--   • title_catalog            — full catalog with condition spec + colour.
--   • student_unlocked_titles  — what each student has collected + which one
--                                is currently active (only 1 active per
--                                student, enforced by a trigger similar to
--                                Patch 5.5's skin trigger).
--
-- Condition evaluator (`check_my_title_conditions`) is meant to be invoked:
--   • On login (cheap query, runs once per session).
--   • Daily via pg_cron for the whole student set, so titles unlock even
--     when the student doesn't log in.
-- Idempotent everywhere — already-unlocked titles are skipped.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.title_catalog (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  description     TEXT,
  category        TEXT        NOT NULL CHECK (category IN ('combatente','colecionador','estudante','especial')),
  color           TEXT        NOT NULL CHECK (color IN ('silver','gold','purple','holo')),
  condition_type  TEXT        NOT NULL,
  condition_value INTEGER,
  condition_payload JSONB     NOT NULL DEFAULT '{}'::jsonb,
  auto_unlock     BOOLEAN     NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_title_catalog_category ON public.title_catalog (category);
ALTER TABLE public.title_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read title_catalog" ON public.title_catalog FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.student_unlocked_titles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES public.students(id)      ON DELETE CASCADE,
  title_id     UUID        NOT NULL REFERENCES public.title_catalog(id) ON DELETE CASCADE,
  is_active    BOOLEAN     NOT NULL DEFAULT FALSE,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, title_id)
);

CREATE INDEX IF NOT EXISTS idx_sut_student ON public.student_unlocked_titles (student_id);
ALTER TABLE public.student_unlocked_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read unlocked_titles" ON public.student_unlocked_titles FOR SELECT USING (true);

-- Trigger: only one active title per student.
CREATE OR REPLACE FUNCTION public.tg_unique_active_title()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.student_unlocked_titles
       SET is_active = FALSE
     WHERE student_id = NEW.student_id AND id <> NEW.id AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_unique_active_title ON public.student_unlocked_titles;
CREATE TRIGGER trg_unique_active_title
AFTER INSERT OR UPDATE OF is_active ON public.student_unlocked_titles
FOR EACH ROW WHEN (NEW.is_active = TRUE)
EXECUTE FUNCTION public.tg_unique_active_title();

-- ─── Catalog seed (~25 titles spanning all 4 categories + 4 colors) ──────────
INSERT INTO public.title_catalog (key, name, description, category, color, condition_type, condition_value, condition_payload, auto_unlock)
VALUES
  -- Combatente
  ('first_blood',        'Primeira Vitória',        'Vença sua primeira batalha.',                'combatente',  'silver', 'bosses_defeated',     1,    '{}', TRUE),
  ('boss_hunter_10',     'Caçador de Bosses',       'Derrote 10 bosses na dungeon.',              'combatente',  'silver', 'bosses_defeated',     10,   '{}', TRUE),
  ('boss_slayer_50',     'Carrasco de Titãs',       'Derrote 50 bosses.',                         'combatente',  'gold',   'bosses_defeated',     50,   '{}', TRUE),
  ('pvp_champion',       'Top 1 do PvP',            'Top 1 do ranking PvP em qualquer semana.',   'combatente',  'gold',   'pvp_top1_count',      1,    '{}', TRUE),
  ('pvp_legend',         'Lenda do PvP',            'Top 1 do PvP em 5 semanas diferentes.',      'combatente',  'purple', 'pvp_top1_count',      5,    '{}', TRUE),
  ('raid_destroyer',     'Destruidor de Raids',     'Participe da derrota de 3 raids de guilda.', 'combatente',  'gold',   'raids_won',           3,    '{}', TRUE),
  -- Colecionador
  ('first_unknown',      'Primeiro a Ver o Vazio',  'Possua sua primeira carta ???.',             'colecionador','holo',   'unknown_owned',       1,    '{}', TRUE),
  ('collector_10',       'Iniciante Coletor',       'Colecione 10 cartas únicas.',                'colecionador','silver', 'unique_cards_owned',  10,   '{}', TRUE),
  ('collector_50',       'Collector',               'Colecione 50 cartas únicas.',                'colecionador','gold',   'unique_cards_owned',  50,   '{}', TRUE),
  ('collector_legendary','Caçador de Lendas',       'Possua 5 cartas Lendárias.',                 'colecionador','gold',   'rarity_count',        5,    '{"rarity":"legendary"}', TRUE),
  ('collector_mythic',   'Tocado pelos Mitos',      'Possua 3 cartas Míticas.',                   'colecionador','purple', 'rarity_count',        3,    '{"rarity":"mythic"}', TRUE),
  ('collector_unknown',  'Iluminado',               'Possua 2 cartas ???.',                       'colecionador','holo',   'rarity_count',        2,    '{"rarity":"unknown"}', TRUE),
  -- Estudante
  ('dungeon_floor_10',   'Aventureiro',             'Alcance o andar 10.',                        'estudante',   'silver', 'floor_reached',       10,   '{}', TRUE),
  ('dungeon_floor_25',   'Explorador',              'Alcance o andar 25.',                        'estudante',   'gold',   'floor_reached',       25,   '{}', TRUE),
  ('dungeon_floor_50',   'Profundo',                'Alcance o andar 50.',                        'estudante',   'purple', 'floor_reached',       50,   '{}', TRUE),
  ('dedicated_30',       'Estudante Dedicado',      'Conclua 30 missões aprovadas.',              'estudante',   'gold',   'missions_completed',  30,   '{}', TRUE),
  ('streak_30',          'Sequência Imparável',    'Mantenha streak de 30 dias.',                'estudante',   'gold',   'streak_days',         30,   '{}', FALSE),
  ('curious',            'Curioso',                 'Examine 10 cartas no perfil.',               'estudante',   'silver', 'cards_examined',      10,   '{}', FALSE),
  -- Especial
  ('card_creator',       'Criador de Carta',        'Use um Ticket de Criação.',                  'especial',    'purple', 'tickets_used',        1,    '{}', TRUE),
  ('school_legend',      'Lenda da Escola',         'Top 1 Geral em 5 semanas.',                  'especial',    'holo',   'geral_top1_count',    5,    '{}', TRUE),
  ('event_winner',       'Vencedor de Eventos',     'Atinja 1000 fragmentos de cofre num evento.','especial',    'gold',   'vault_unlocks',       1,    '{}', TRUE),
  ('benevolent',         'Benevolente',             'Concedido pelo mestre por gesto excepcional.','especial',   'holo',   'master_grant',        NULL, '{}', FALSE),
  ('first_creator',      'Pioneiro do Mural',       'Primeira aparição no Mural da Escola.',     'especial',    'gold',   'feed_appearances',    1,    '{}', TRUE),
  ('class_top1',         'Soberano da Sala',        'Top 1 da Sala em 3 semanas.',                'combatente',  'gold',   'sala_top1_count',     3,    '{}', TRUE),
  ('rare_lucky',         'Sortudo',                 'Abra um baú resultando em Mítica.',          'colecionador','purple', 'mythic_chest_opens',  1,    '{}', TRUE)
ON CONFLICT (key) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  category    = EXCLUDED.category,
  color       = EXCLUDED.color,
  condition_type   = EXCLUDED.condition_type,
  condition_value  = EXCLUDED.condition_value,
  condition_payload = EXCLUDED.condition_payload,
  auto_unlock = EXCLUDED.auto_unlock;

-- ─── Title condition evaluator (per student) ────────────────────────────────
-- Centralizes every condition query. Returns the list of newly-unlocked title
-- ids. Posts a pending_reward notification per unlock so the student gets a
-- toast on their next login.
CREATE OR REPLACE FUNCTION public._unlock_title_if_new(p_student_id UUID, p_title_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID; v_name TEXT; v_color TEXT;
BEGIN
  INSERT INTO public.student_unlocked_titles (student_id, title_id)
  VALUES (p_student_id, p_title_id)
  ON CONFLICT (student_id, title_id) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN FALSE; END IF;

  SELECT name, color INTO v_name, v_color FROM public.title_catalog WHERE id = p_title_id;
  INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
  VALUES (
    p_student_id, 'title_unlock',
    format('Novo título: %s', v_name),
    'Confira no perfil para ativá-lo.',
    jsonb_build_object('title_id', p_title_id, 'color', v_color)
  );
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_title_conditions_for(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unlocked JSONB := '[]'::jsonb;
  v_t        RECORD;
  v_progress INTEGER;
BEGIN
  FOR v_t IN
    SELECT * FROM public.title_catalog
     WHERE is_active = TRUE AND auto_unlock = TRUE
       AND id NOT IN (SELECT title_id FROM public.student_unlocked_titles WHERE student_id = p_student_id)
  LOOP
    v_progress := 0;

    IF v_t.condition_type = 'bosses_defeated' THEN
      SELECT COALESCE(COUNT(*), 0) INTO v_progress
        FROM public.character_progress cp
        JOIN public.characters c ON c.id = cp.character_id
        JOIN public.students s ON s.user_id = c.user_id
       WHERE s.id = p_student_id AND cp.boss_defeated = TRUE;

    ELSIF v_t.condition_type = 'floor_reached' THEN
      SELECT COALESCE(MAX(cp.floor_id), 0) INTO v_progress
        FROM public.character_progress cp
        JOIN public.characters c ON c.id = cp.character_id
        JOIN public.students s ON s.user_id = c.user_id
       WHERE s.id = p_student_id;

    ELSIF v_t.condition_type = 'pvp_top1_count' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.weekly_rankings_snapshot
       WHERE ranking_type = 'pvp' AND position = 1 AND entity_id = p_student_id;

    ELSIF v_t.condition_type = 'geral_top1_count' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.weekly_rankings_snapshot
       WHERE ranking_type = 'geral' AND position = 1 AND entity_id = p_student_id;

    ELSIF v_t.condition_type = 'sala_top1_count' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.weekly_rankings_snapshot
       WHERE ranking_type = 'sala' AND position = 1 AND entity_id = p_student_id;

    ELSIF v_t.condition_type = 'raids_won' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.boss_raid_rewards
       WHERE student_id = p_student_id AND victory = TRUE;

    ELSIF v_t.condition_type = 'unique_cards_owned' THEN
      SELECT COUNT(DISTINCT item_id)::INT INTO v_progress
        FROM public.student_inventory WHERE student_id = p_student_id;

    ELSIF v_t.condition_type = 'rarity_count' THEN
      SELECT COUNT(DISTINCT si.item_id)::INT INTO v_progress
        FROM public.student_inventory si
        JOIN public.shop_items sh ON sh.id = si.item_id
       WHERE si.student_id = p_student_id
         AND sh.rarity = (v_t.condition_payload->>'rarity');

    ELSIF v_t.condition_type = 'unknown_owned' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.student_inventory si
        JOIN public.shop_items sh ON sh.id = si.item_id
       WHERE si.student_id = p_student_id AND sh.rarity = 'unknown';

    ELSIF v_t.condition_type = 'missions_completed' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.mission_completions
       WHERE student_id = p_student_id AND status = 'approved';

    ELSIF v_t.condition_type = 'tickets_used' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.creation_tickets WHERE student_id = p_student_id AND used_at IS NOT NULL;

    ELSIF v_t.condition_type = 'vault_unlocks' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.event_vault_openings
       WHERE student_id = p_student_id AND fragments_total >= 1000;

    ELSIF v_t.condition_type = 'feed_appearances' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.school_feed_events WHERE student_id = p_student_id;

    ELSIF v_t.condition_type = 'mythic_chest_opens' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.chest_openings co
       WHERE co.student_id = p_student_id
         AND co.items_received @> '[{"rarity":"mythic"}]'::jsonb;
    END IF;

    IF v_progress >= COALESCE(v_t.condition_value, 1) THEN
      IF public._unlock_title_if_new(p_student_id, v_t.id) THEN
        v_unlocked := v_unlocked || jsonb_build_object('title_id', v_t.id, 'name', v_t.name, 'color', v_t.color);
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('unlocked', v_unlocked);
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_title_conditions_for(UUID) TO authenticated;

-- Self-service wrapper for the calling student.
CREATE OR REPLACE FUNCTION public.check_my_title_conditions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('unlocked', '[]'::jsonb); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('unlocked', '[]'::jsonb); END IF;
  RETURN public.check_title_conditions_for(v_sid);
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_my_title_conditions() TO authenticated;

-- Daily sweep across all students. Cheap because the inner check skips
-- already-owned titles immediately.
CREATE OR REPLACE FUNCTION public.check_all_title_conditions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_s RECORD; v_total INTEGER := 0;
BEGIN
  FOR v_s IN SELECT id FROM public.students WHERE teacher_id IS NOT NULL LOOP
    PERFORM public.check_title_conditions_for(v_s.id);
    v_total := v_total + 1;
  END LOOP;
  RETURN jsonb_build_object('scanned', v_total);
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_all_title_conditions() TO authenticated;

-- ─── Set active title (or clear with NULL) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_my_active_title(p_title_id UUID)
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

  IF p_title_id IS NULL THEN
    UPDATE public.student_unlocked_titles SET is_active = FALSE
     WHERE student_id = v_sid;
    RETURN jsonb_build_object('success', true, 'active_title_id', NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.student_unlocked_titles
     WHERE student_id = v_sid AND title_id = p_title_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Título não desbloqueado');
  END IF;

  UPDATE public.student_unlocked_titles SET is_active = (title_id = p_title_id)
   WHERE student_id = v_sid;

  RETURN jsonb_build_object('success', true, 'active_title_id', p_title_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_my_active_title(UUID) TO authenticated;

-- ─── Reader: full catalog with unlocked + active flags ─────────────────────
CREATE OR REPLACE FUNCTION public.get_my_titles()
RETURNS TABLE (
  title_id     UUID,
  key          TEXT,
  name         TEXT,
  description  TEXT,
  category     TEXT,
  color        TEXT,
  condition_type TEXT,
  condition_value INTEGER,
  unlocked     BOOLEAN,
  is_active    BOOLEAN,
  unlocked_at  TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    tc.id, tc.key, tc.name, tc.description, tc.category, tc.color,
    tc.condition_type, tc.condition_value,
    EXISTS (SELECT 1 FROM public.student_unlocked_titles ut
             WHERE ut.student_id = v_sid AND ut.title_id = tc.id) AS unlocked,
    COALESCE((SELECT ut.is_active FROM public.student_unlocked_titles ut
               WHERE ut.student_id = v_sid AND ut.title_id = tc.id), false) AS is_active,
    (SELECT ut.unlocked_at FROM public.student_unlocked_titles ut
              WHERE ut.student_id = v_sid AND ut.title_id = tc.id)
    FROM public.title_catalog tc
   WHERE tc.is_active = TRUE
   ORDER BY tc.category, tc.color, tc.name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_titles() TO authenticated;

-- ─── Daily cron sweep ───────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('check_all_title_conditions')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check_all_title_conditions');
    PERFORM cron.schedule(
      'check_all_title_conditions',
      '0 5 * * *', -- 05:00 UTC = 02:00 BRT (after the Monday weekly jobs)
      $cron$SELECT public.check_all_title_conditions();$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$$;
