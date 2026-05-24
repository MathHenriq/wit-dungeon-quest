-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 8.4 — Daily quests with streak.
--
-- Three quests per student per day (one per category: combate / social /
-- academica), assigned at 00:00 BRT by cron. Counter table lets RPCs from
-- battle / PvP / raid / login flows bump deterministic counters; the quest
-- evaluator reads those counters and flips quests to completed.
--
-- Streak logic:
--   • Completing all 3 quests of the day increments current_streak (or
--     resets if the gap to last_completed_date was > 1 day).
--   • Reaching 7 streak grants a Rare chest grant (student_chest_grants)
--     and resets the streak to 0 so the cycle continues.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_quest_pool (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT        NOT NULL UNIQUE,
  category        TEXT        NOT NULL CHECK (category IN ('combate','social','academica')),
  description     TEXT        NOT NULL,
  condition_type  TEXT        NOT NULL,                -- maps to counter key
  condition_value INTEGER     NOT NULL,
  reward_coins    INTEGER     NOT NULL DEFAULT 30,
  reward_diamonds INTEGER     NOT NULL DEFAULT 5,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dqp_cat ON public.daily_quest_pool (category) WHERE is_active = TRUE;
ALTER TABLE public.daily_quest_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read daily_quest_pool" ON public.daily_quest_pool FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.student_daily_quests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  quest_id        UUID        NOT NULL REFERENCES public.daily_quest_pool(id) ON DELETE CASCADE,
  assigned_date   DATE        NOT NULL,
  progress        INTEGER     NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  UNIQUE (student_id, assigned_date, quest_id)
);

-- "One quest per (student, day, category)" is enforced inside
-- assign_daily_quests_for() — it checks for an existing quest of the same
-- category before inserting, so a runtime constraint isn't required.

CREATE INDEX IF NOT EXISTS idx_sdq_student_date
  ON public.student_daily_quests (student_id, assigned_date DESC);

ALTER TABLE public.student_daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read student_daily_quests" ON public.student_daily_quests FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.student_quest_streak (
  student_id          UUID        PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  current_streak      INTEGER     NOT NULL DEFAULT 0,
  longest_streak      INTEGER     NOT NULL DEFAULT 0,
  last_completed_date DATE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_quest_streak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read student_quest_streak" ON public.student_quest_streak FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.student_daily_counters (
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  counter_type  TEXT NOT NULL,
  value         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, date, counter_type)
);
ALTER TABLE public.student_daily_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read daily_counters" ON public.student_daily_counters FOR SELECT USING (true);

-- ─── Pool seed (~10 per category) ────────────────────────────────────────────
INSERT INTO public.daily_quest_pool (key, category, description, condition_type, condition_value, reward_coins, reward_diamonds)
VALUES
  -- Combate
  ('cb_battles_1',     'combate',   'Vença 1 batalha hoje.',                 'battles_won',     1,  30, 5),
  ('cb_battles_3',     'combate',   'Vença 3 batalhas hoje.',                'battles_won',     3,  30, 5),
  ('cb_battles_5',     'combate',   'Vença 5 batalhas hoje.',                'battles_won',     5,  30, 5),
  ('cb_boss_1',        'combate',   'Derrote 1 boss hoje.',                  'bosses_won',      1,  30, 5),
  ('cb_flawless',      'combate',   'Vença 1 batalha sem perder HP.',        'flawless_battles',1,  30, 5),
  ('cb_rare_use',      'combate',   'Use uma carta Rara+ em batalha.',       'rare_card_uses',  1,  30, 5),
  ('cb_dungeon_floor', 'combate',   'Avance 1 andar na dungeon.',            'floors_cleared',  1,  30, 5),
  ('cb_battles_7',     'combate',   'Vença 7 batalhas hoje.',                'battles_won',     7,  30, 5),
  ('cb_pet_battle',    'combate',   'Vença 1 batalha com seu pet ativo.',    'pet_battles_won', 1,  30, 5),
  ('cb_combo_3',       'combate',   'Vença 3 batalhas em sequência.',        'battle_combo',    3,  30, 5),
  -- Social
  ('sc_pvp_1',         'social',    'Vença 1 batalha PvP.',                  'pvp_wins',        1,  30, 5),
  ('sc_pvp_3',         'social',    'Vença 3 batalhas PvP.',                 'pvp_wins',        3,  30, 5),
  ('sc_raid_attack',   'social',    'Participe de 1 ataque em boss raid.',   'raid_attacks',    1,  30, 5),
  ('sc_raid_attack_3', 'social',    'Participe de 3 ataques em boss raid.',  'raid_attacks',    3,  30, 5),
  ('sc_profile_3',     'social',    'Visite 3 perfis de colegas.',           'profile_visits',  3,  30, 5),
  ('sc_profile_5',     'social',    'Visite 5 perfis de colegas.',           'profile_visits',  5,  30, 5),
  ('sc_guild_post',    'social',    'Faça 1 publicação no chat da guilda.',  'guild_posts',     1,  30, 5),
  ('sc_feed_view',     'social',    'Veja 3 itens no Mural.',                'feed_views',      3,  30, 5),
  ('sc_trade',         'social',    'Complete 1 trade com colega.',          'trades_done',     1,  30, 5),
  ('sc_mural_view_5',  'social',    'Veja 5 itens no Mural.',                'feed_views',      5,  30, 5),
  -- Academica
  ('ac_gsa_1',         'academica', 'Conclua 1 atividade no Classroom (GSA).','gsa_activities', 1,  30, 5),
  ('ac_gsa_3',         'academica', 'Conclua 3 atividades no Classroom.',    'gsa_activities',  3,  30, 5),
  ('ac_login',         'academica', 'Faça login no jogo hoje.',              'login',           1,  30, 5),
  ('ac_mission',       'academica', 'Tenha 1 missão aprovada hoje.',         'missions_approved',1, 30, 5),
  ('ac_mission_2',     'academica', 'Tenha 2 missões aprovadas hoje.',       'missions_approved',2, 30, 5),
  ('ac_capsule',       'academica', 'Abra a Cápsula do Tempo.',              'capsule_opens',   1,  30, 5),
  ('ac_examine',       'academica', 'Examine 3 cartas no inventário.',       'cards_examined',  3,  30, 5),
  ('ac_skill_unlock',  'academica', 'Desbloqueie 1 nó na Skill Tree.',       'skills_unlocked', 1,  30, 5),
  ('ac_streak_log',    'academica', 'Mantenha o login do dia anterior.',     'login_streak',    1,  30, 5),
  ('ac_event_mission', 'academica', 'Complete 1 missão de evento.',          'event_missions_done',1, 30, 5)
ON CONFLICT (key) DO UPDATE SET
  category        = EXCLUDED.category,
  description     = EXCLUDED.description,
  condition_type  = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value;

-- ─── Helper: BRT date ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._brt_today()
RETURNS DATE LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date;
$$;

-- ─── Counter increment RPC (any flow that has a hook calls this) ────────────
CREATE OR REPLACE FUNCTION public.increment_daily_counter(p_type TEXT, p_amount INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_sid UUID;
  v_today DATE := _brt_today();
  v_new   INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN jsonb_build_object('success', false); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

  INSERT INTO public.student_daily_counters (student_id, date, counter_type, value)
  VALUES (v_sid, v_today, p_type, p_amount)
  ON CONFLICT (student_id, date, counter_type) DO UPDATE
    SET value = student_daily_counters.value + EXCLUDED.value
  RETURNING value INTO v_new;

  -- Auto-check quests after every counter bump (cheap, indexed).
  PERFORM public.check_my_daily_quests();

  RETURN jsonb_build_object('success', true, 'value', v_new);
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_daily_counter(TEXT, INTEGER) TO authenticated;

-- ─── Assignment: one quest from each category for each student ──────────────
CREATE OR REPLACE FUNCTION public.assign_daily_quests_for(p_student_id UUID, p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat TEXT;
  v_qid UUID;
  v_assigned INTEGER := 0;
BEGIN
  FOR v_cat IN SELECT unnest(ARRAY['combate','social','academica']::TEXT[]) LOOP
    -- Skip if already assigned today for this category.
    IF EXISTS (
      SELECT 1 FROM public.student_daily_quests sdq
        JOIN public.daily_quest_pool dqp ON dqp.id = sdq.quest_id
       WHERE sdq.student_id = p_student_id AND sdq.assigned_date = p_date
         AND dqp.category = v_cat
    ) THEN
      CONTINUE;
    END IF;

    SELECT id INTO v_qid FROM public.daily_quest_pool
     WHERE is_active = TRUE AND category = v_cat
     ORDER BY random() LIMIT 1;
    IF v_qid IS NULL THEN CONTINUE; END IF;

    INSERT INTO public.student_daily_quests (student_id, quest_id, assigned_date)
    VALUES (p_student_id, v_qid, p_date)
    ON CONFLICT (student_id, assigned_date, quest_id) DO NOTHING;
    v_assigned := v_assigned + 1;
  END LOOP;
  RETURN v_assigned;
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_daily_quests_for(UUID, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.ensure_my_daily_quests()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID; v_n INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('assigned', 0); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('assigned', 0); END IF;
  v_n := public.assign_daily_quests_for(v_sid, _brt_today());
  RETURN jsonb_build_object('assigned', v_n);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_my_daily_quests() TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_daily_quests_tick()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_s RECORD; v_total INTEGER := 0; v_today DATE := _brt_today();
BEGIN
  FOR v_s IN SELECT id FROM public.students WHERE teacher_id IS NOT NULL LOOP
    v_total := v_total + public.assign_daily_quests_for(v_s.id, v_today);
  END LOOP;
  BEGIN PERFORM public.log_action('assign_daily_quests_tick', NULL, NULL, NULL,
    jsonb_build_object('total_assigned', v_total, 'date', v_today));
  EXCEPTION WHEN OTHERS THEN NULL; END;
  RETURN jsonb_build_object('assigned', v_total);
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_daily_quests_tick() TO authenticated;

-- ─── Streak update + Rare chest grant ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public._bump_quest_streak(p_student_id UUID, p_today DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_row     student_quest_streak%ROWTYPE;
  v_new     INTEGER;
  v_grant   UUID;
BEGIN
  SELECT * INTO v_row FROM public.student_quest_streak WHERE student_id = p_student_id;
  IF NOT FOUND THEN
    INSERT INTO public.student_quest_streak (student_id, current_streak, longest_streak, last_completed_date)
    VALUES (p_student_id, 1, 1, p_today);
    v_new := 1;
  ELSIF v_row.last_completed_date = p_today THEN
    RETURN v_row.current_streak;
  ELSIF v_row.last_completed_date = p_today - 1 THEN
    v_new := v_row.current_streak + 1;
    UPDATE public.student_quest_streak
       SET current_streak = v_new,
           longest_streak = GREATEST(longest_streak, v_new),
           last_completed_date = p_today,
           updated_at = now()
     WHERE student_id = p_student_id;
  ELSE
    v_new := 1;
    UPDATE public.student_quest_streak
       SET current_streak = 1,
           longest_streak = GREATEST(longest_streak, 1),
           last_completed_date = p_today,
           updated_at = now()
     WHERE student_id = p_student_id;
  END IF;

  -- 7-day milestone: grant 1 Rare chest, post notification, reset to 0.
  IF v_new >= 7 THEN
    INSERT INTO public.student_chest_grants (student_id, chest_key, reason, source_payload)
    VALUES (p_student_id, 'global_rare', 'Streak 7 dias — Quests Diárias',
            jsonb_build_object('source', 'quest_streak_7', 'date', p_today))
    RETURNING id INTO v_grant;
    INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
    VALUES (p_student_id, 'streak_reward',
            'Streak de 7 dias!', 'Você ganhou 1 Baú Raro.',
            jsonb_build_object('chest_key','global_rare','grant_id', v_grant));
    UPDATE public.student_quest_streak SET current_streak = 0, updated_at = now()
     WHERE student_id = p_student_id;
    RETURN 0;
  END IF;
  RETURN v_new;
END;
$$;

-- ─── Quest evaluator ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_my_daily_quests()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_sid UUID;
  v_today DATE := _brt_today();
  v_q RECORD;
  v_counter INTEGER;
  v_completed_now JSONB := '[]'::jsonb;
  v_pending_count INTEGER;
  v_completed_today INTEGER;
  v_total_today INTEGER;
  v_streak INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

  FOR v_q IN
    SELECT sdq.id AS sdq_id, sdq.quest_id, dqp.condition_type, dqp.condition_value, dqp.reward_coins, dqp.reward_diamonds,
           dqp.description, dqp.category
      FROM public.student_daily_quests sdq
      JOIN public.daily_quest_pool dqp ON dqp.id = sdq.quest_id
     WHERE sdq.student_id = v_sid
       AND sdq.assigned_date = v_today
       AND sdq.completed_at IS NULL
  LOOP
    SELECT value INTO v_counter
      FROM public.student_daily_counters
     WHERE student_id = v_sid AND date = v_today AND counter_type = v_q.condition_type;
    IF v_counter IS NULL THEN v_counter := 0; END IF;

    UPDATE public.student_daily_quests SET progress = v_counter WHERE id = v_q.sdq_id;

    IF v_counter >= v_q.condition_value THEN
      UPDATE public.student_daily_quests SET completed_at = now() WHERE id = v_q.sdq_id;
      UPDATE public.students
         SET coins    = coins    + v_q.reward_coins,
             diamonds = COALESCE(diamonds, 0) + v_q.reward_diamonds
       WHERE id = v_sid;
      INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
      VALUES (v_sid, 'daily_quest',
              format('Quest concluída: %s', v_q.description),
              format('+%s moedas, +%s diamantes.', v_q.reward_coins, v_q.reward_diamonds),
              jsonb_build_object('quest_id', v_q.quest_id, 'category', v_q.category));
      v_completed_now := v_completed_now || jsonb_build_object('description', v_q.description, 'category', v_q.category);
    END IF;
  END LOOP;

  -- Check 3/3 bonus + streak.
  SELECT COUNT(*) FILTER (WHERE completed_at IS NOT NULL),
         COUNT(*)
    INTO v_completed_today, v_total_today
    FROM public.student_daily_quests
   WHERE student_id = v_sid AND assigned_date = v_today;

  IF v_total_today >= 3 AND v_completed_today = v_total_today THEN
    -- Award 3/3 bonus only once per day. Use a sentinel via student_pending_rewards lookup.
    IF NOT EXISTS (
      SELECT 1 FROM public.student_pending_rewards
       WHERE student_id = v_sid AND kind = 'daily_3of3'
         AND (payload->>'date')::DATE = v_today
    ) THEN
      UPDATE public.students
         SET coins    = coins    + 50,
             diamonds = COALESCE(diamonds, 0) + 10
       WHERE id = v_sid;
      INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
      VALUES (v_sid, 'daily_3of3',
              'Quests 3/3 do dia!',
              'Bônus: +50 moedas, +10 diamantes.',
              jsonb_build_object('date', v_today));
      v_streak := public._bump_quest_streak(v_sid, v_today);
    ELSE
      SELECT current_streak INTO v_streak FROM public.student_quest_streak WHERE student_id = v_sid;
    END IF;
  ELSE
    SELECT current_streak INTO v_streak FROM public.student_quest_streak WHERE student_id = v_sid;
  END IF;

  v_pending_count := v_total_today - v_completed_today;

  RETURN jsonb_build_object(
    'success', true,
    'completed_now', v_completed_now,
    'pending_count', v_pending_count,
    'completed_today', v_completed_today,
    'total_today', v_total_today,
    'streak', COALESCE(v_streak, 0)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_my_daily_quests() TO authenticated;

-- ─── Read RPC for the UI ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_daily_quests()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_sid UUID;
  v_today DATE := _brt_today();
  v_quests JSONB;
  v_streak INTEGER;
  v_last DATE;
  v_completed INTEGER;
  v_total INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('error','unauthenticated'); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('error','no_student'); END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', sdq.id,
    'quest_id', sdq.quest_id,
    'category', dqp.category,
    'description', dqp.description,
    'condition_type', dqp.condition_type,
    'condition_value', dqp.condition_value,
    'progress', LEAST(sdq.progress, dqp.condition_value),
    'completed_at', sdq.completed_at,
    'reward_coins', dqp.reward_coins,
    'reward_diamonds', dqp.reward_diamonds
  ) ORDER BY dqp.category), '[]'::jsonb)
  INTO v_quests
  FROM public.student_daily_quests sdq
  JOIN public.daily_quest_pool dqp ON dqp.id = sdq.quest_id
  WHERE sdq.student_id = v_sid AND sdq.assigned_date = v_today;

  SELECT current_streak, last_completed_date INTO v_streak, v_last
    FROM public.student_quest_streak WHERE student_id = v_sid;

  SELECT COUNT(*) FILTER (WHERE completed_at IS NOT NULL), COUNT(*)
    INTO v_completed, v_total
    FROM public.student_daily_quests WHERE student_id = v_sid AND assigned_date = v_today;

  RETURN jsonb_build_object(
    'date', v_today,
    'quests', v_quests,
    'streak', COALESCE(v_streak, 0),
    'last_completed_date', v_last,
    'completed', COALESCE(v_completed, 0),
    'total', COALESCE(v_total, 0)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_daily_quests() TO authenticated;

-- ─── Daily cron (00:00 BRT = 03:00 UTC) ─────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('assign_daily_quests_tick')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'assign_daily_quests_tick');
    PERFORM cron.schedule(
      'assign_daily_quests_tick',
      '0 3 * * *',
      $cron$SELECT public.assign_daily_quests_tick();$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$$;
