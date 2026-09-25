-- ============================================================================
-- Remove turmas por completo.
--
-- Depois da nota do Ministério Público as turmas já tinham virado códigos
-- neutros (GRUPO-XXXX). Nem isso é mais necessário: o aluno escolhe só o
-- professor. Tudo que era "da turma" passa a ser "do professor":
--   * cadastro: register_my_student(nomes, nickname, professor);
--   * ranking semanal "sala" deixa de existir — o "geral" já é por professor;
--   * feed da escola: filtro padrão passa a ser o do professor;
--   * RLS do professor: pelo teacher_id do aluno;
--   * guerra de turmas, comparação entre turmas e RPCs de turma: removidos.
--
-- Sem coluna vazia para trás: `classes`, `class_wars` e todas as colunas
-- class_id são apagadas.
-- ============================================================================

BEGIN;

-- ─── 1. Quem depende de students.class_id primeiro ──────────────────────────

DROP VIEW IF EXISTS public.student_profiles;
DROP VIEW IF EXISTS public.master_wave11_classes_view;

DROP POLICY IF EXISTS "Teachers can manage students in their classes" ON public.students;
CREATE POLICY "Teachers manage own students" ON public.students
  FOR ALL TO authenticated
  USING (teacher_id = public.get_teacher_id())
  WITH CHECK (teacher_id = public.get_teacher_id());

CREATE OR REPLACE FUNCTION public.is_teacher_of_student(student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teachers t ON t.id = s.teacher_id
    WHERE s.id = is_teacher_of_student.student_id
      AND t.user_id = auth.uid()
  )
$$;

-- Guarda de escrita direta: mesma regra, sem class_id.
CREATE OR REPLACE FUNCTION public.enforce_student_character_update_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.teachers WHERE user_id = v_uid) THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Not allowed: cannot change user_id' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Not allowed: students may only update their own record' USING ERRCODE = '42501';
  END IF;

  IF NEW.user_id                  IS DISTINCT FROM OLD.user_id
  OR NEW.teacher_id               IS DISTINCT FROM OLD.teacher_id
  OR NEW.name                     IS DISTINCT FROM OLD.name
  OR NEW.status                   IS DISTINCT FROM OLD.status
  OR NEW.coins                    IS DISTINCT FROM OLD.coins
  OR NEW.diamonds                 IS DISTINCT FROM OLD.diamonds
  OR NEW.xp                       IS DISTINCT FROM OLD.xp
  OR NEW.level                    IS DISTINCT FROM OLD.level
  OR NEW.suspended_until          IS DISTINCT FROM OLD.suspended_until
  OR NEW.suspended_reason         IS DISTINCT FROM OLD.suspended_reason
  OR NEW.is_mentor                IS DISTINCT FROM OLD.is_mentor
  OR NEW.mentor_xp                IS DISTINCT FROM OLD.mentor_xp
  OR NEW.presencas_consecutivas   IS DISTINCT FROM OLD.presencas_consecutivas
  OR NEW.total_boss_kills         IS DISTINCT FROM OLD.total_boss_kills
  OR NEW.total_pvp_wins           IS DISTINCT FROM OLD.total_pvp_wins
  OR NEW.total_missions_completed IS DISTINCT FROM OLD.total_missions_completed
  OR NEW.total_crafts             IS DISTINCT FROM OLD.total_crafts
  OR NEW.is_test_account          IS DISTINCT FROM OLD.is_test_account
  THEN
    RAISE EXCEPTION 'Not allowed: this field is managed by the server' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- teacher_id agora é sempre informado; o trigger que o copiava da turma sai.
DROP TRIGGER IF EXISTS trigger_set_student_teacher_id ON public.students;
DROP FUNCTION IF EXISTS public.set_student_teacher_id();

-- merge_student checava is_teacher_of_class.
CREATE OR REPLACE FUNCTION public.merge_student(p_pending_id uuid, p_existing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.students
  WHERE id = p_pending_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aluno pendente não encontrado ou já processado';
  END IF;

  IF NOT (public.is_teacher_of_student(p_pending_id) AND public.is_teacher_of_student(p_existing_id)) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  UPDATE public.students SET user_id = NULL WHERE id = p_pending_id;
  UPDATE public.students SET user_id = v_user_id, status = 'active' WHERE id = p_existing_id;
  DELETE FROM public.students WHERE id = p_pending_id;
END;
$$;

-- Cadastro: só professor.
DROP FUNCTION IF EXISTS public.register_my_student(text, text, uuid, uuid);
CREATE OR REPLACE FUNCTION public.register_my_student(
  p_first_names text,
  p_nickname    text,
  p_teacher_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_name text := btrim(regexp_replace(coalesce(p_first_names, ''), '\s+', ' ', 'g'));
  v_nick text := btrim(regexp_replace(coalesce(p_nickname, ''), '\s+', ' ', 'g'));
  v_row  public.students%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sessão expirada. Entre novamente.');
  END IF;
  IF EXISTS (SELECT 1 FROM public.teachers WHERE user_id = v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta conta é de professor.');
  END IF;

  IF v_name !~ '^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ''-]*( [A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ''-]*)?$'
     OR v_name IS DISTINCT FROM public.first_two_names(v_name)
     OR char_length(v_name) > 61 THEN
    RETURN jsonb_build_object('success', false,
      'error', 'Use só os seus dois primeiros nomes (ex.: João Miguel), sem sobrenome.');
  END IF;

  IF char_length(v_nick) NOT BETWEEN 3 AND 20 OR v_nick !~ '^[0-9A-Za-zÀ-ÖØ-öø-ÿ _.-]+$' THEN
    RETURN jsonb_build_object('success', false,
      'error', 'O nickname deve ter de 3 a 20 caracteres: letras, números, espaço, _ . ou -.');
  END IF;
  IF public.nickname_contains_name(v_nick, v_name) THEN
    RETURN jsonb_build_object('success', false,
      'error', 'O nickname não pode ter o seu nome. Outros jogadores veem o nickname.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = p_teacher_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Professor inválido.');
  END IF;

  SELECT * INTO v_row FROM public.students WHERE user_id = v_uid;

  IF FOUND THEN
    IF v_row.status = 'active' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Seu cadastro já foi aprovado.');
    END IF;
    UPDATE public.students
    SET    name = v_name, character_name = v_nick, teacher_id = p_teacher_id, status = 'pending'
    WHERE  id = v_row.id;
  ELSE
    INSERT INTO public.students
      (name, character_name, teacher_id, user_id, status, coins, level, presencas_consecutivas)
    VALUES
      (v_name, v_nick, p_teacher_id, v_uid, 'pending', 0, 1, 0);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── 2. Rankings semanais: sem "sala" ───────────────────────────────────────

DROP FUNCTION IF EXISTS public.get_my_weekly_positions(boolean);
DROP FUNCTION IF EXISTS public.get_weekly_ranking(text, boolean, uuid, uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_weekly_ranking(
  p_ranking_type text,
  p_finalized    boolean DEFAULT false,
  p_teacher_id   uuid    DEFAULT NULL,
  p_limit        integer DEFAULT 50,
  p_offset       integer DEFAULT 0
)
RETURNS TABLE(rank integer, entity_id uuid, entity_name text, score integer, week_start date, week_end date)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_this_week_start DATE := brt_week_start();
  v_prev_week_start DATE := v_this_week_start - 7;
  v_window_lo       TIMESTAMPTZ := (v_this_week_start::timestamp) AT TIME ZONE 'America/Sao_Paulo';
  v_window_hi       TIMESTAMPTZ := ((v_this_week_start + 7)::timestamp) AT TIME ZONE 'America/Sao_Paulo';
BEGIN
  IF p_ranking_type NOT IN ('geral', 'pvp', 'guildas') THEN
    RAISE EXCEPTION 'invalid ranking_type';
  END IF;

  IF p_finalized THEN
    RETURN QUERY
    SELECT s.position AS rank, s.entity_id, s.entity_name, s.score, s.week_start, s.week_end
      FROM public.weekly_rankings_snapshot s
     WHERE s.week_start   = v_prev_week_start
       AND s.ranking_type = p_ranking_type
       AND (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)
     ORDER BY s.position
     LIMIT p_limit OFFSET p_offset;
    RETURN;
  END IF;

  IF p_ranking_type = 'pvp' THEN
    RETURN QUERY
    WITH wins AS (
      SELECT m.winner_id AS student_id, COUNT(*)::INT AS win_count
        FROM public.pvp_matches m
       WHERE m.winner_id IS NOT NULL
         AND m.finished_at >= v_window_lo
         AND m.finished_at <  v_window_hi
         AND m.status = 'finished'
         AND (p_teacher_id IS NULL OR m.teacher_id = p_teacher_id)
       GROUP BY m.winner_id
    ),
    ranked AS (
      SELECT ROW_NUMBER() OVER (ORDER BY w.win_count DESC, w.student_id)::INT AS position,
             w.student_id AS entity_id,
             COALESCE(NULLIF(btrim(st.character_name), ''), 'Aventureiro') AS entity_name,
             w.win_count AS score
        FROM wins w JOIN public.students st ON st.id = w.student_id
    )
    SELECT r.position, r.entity_id, r.entity_name, r.score, v_this_week_start, (v_this_week_start + 6)
      FROM ranked r ORDER BY r.position LIMIT p_limit OFFSET p_offset;

  ELSIF p_ranking_type = 'guildas' THEN
    RETURN QUERY
    WITH member_deltas AS (
      SELECT g.id AS guild_id, g.name AS gname,
             GREATEST(0, st.xp - COALESCE(b.baseline_xp, st.xp)) AS delta_xp
        FROM public.guilds g
        JOIN public.guild_members gm ON gm.guild_id = g.id
        JOIN public.students st ON st.id = gm.student_id
        LEFT JOIN public.weekly_xp_baseline b
               ON b.student_id = st.id AND b.week_start = v_this_week_start
       WHERE p_teacher_id IS NULL OR g.teacher_id = p_teacher_id
    ),
    totals AS (
      SELECT guild_id, MAX(gname) AS gname, SUM(delta_xp)::INT AS total
        FROM member_deltas GROUP BY guild_id
    ),
    ranked AS (
      SELECT ROW_NUMBER() OVER (ORDER BY total DESC, guild_id)::INT AS position,
             guild_id AS entity_id, gname AS entity_name, total AS score
        FROM totals
    )
    SELECT r.position, r.entity_id, r.entity_name, r.score, v_this_week_start, (v_this_week_start + 6)
      FROM ranked r ORDER BY r.position LIMIT p_limit OFFSET p_offset;

  ELSE
    RETURN QUERY
    WITH deltas AS (
      SELECT st.id AS student_id,
             COALESCE(NULLIF(btrim(st.character_name), ''), 'Aventureiro') AS nm,
             GREATEST(0, st.xp - COALESCE(b.baseline_xp, st.xp)) AS delta_xp
        FROM public.students st
        LEFT JOIN public.weekly_xp_baseline b
               ON b.student_id = st.id AND b.week_start = v_this_week_start
       WHERE st.teacher_id IS NOT NULL
         AND (p_teacher_id IS NULL OR st.teacher_id = p_teacher_id)
    ),
    ranked AS (
      SELECT ROW_NUMBER() OVER (ORDER BY delta_xp DESC, student_id)::INT AS position,
             student_id AS entity_id, nm AS entity_name, delta_xp AS score
        FROM deltas
    )
    SELECT r.position, r.entity_id, r.entity_name, r.score, v_this_week_start, (v_this_week_start + 6)
      FROM ranked r ORDER BY r.position LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_weekly_positions(p_finalized boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_student  public.students;
  v_guild_id uuid;
  v_out      jsonb := jsonb_build_object();
  v_row      record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;

  SELECT * INTO v_student FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_student.id IS NULL THEN
    RETURN jsonb_build_object('error', 'student_not_found');
  END IF;

  SELECT guild_id INTO v_guild_id FROM public.guild_members WHERE student_id = v_student.id LIMIT 1;

  FOR v_row IN
    SELECT 'geral'::text AS rt, r.rank AS position, r.score
      FROM public.get_weekly_ranking('geral', p_finalized, v_student.teacher_id, 10000, 0) r
     WHERE r.entity_id = v_student.id
    UNION ALL
    SELECT 'pvp', r.rank, r.score
      FROM public.get_weekly_ranking('pvp', p_finalized, v_student.teacher_id, 10000, 0) r
     WHERE r.entity_id = v_student.id
    UNION ALL
    SELECT 'guildas', r.rank, r.score
      FROM public.get_weekly_ranking('guildas', p_finalized, v_student.teacher_id, 10000, 0) r
     WHERE v_guild_id IS NOT NULL AND r.entity_id = v_guild_id
  LOOP
    v_out := v_out || jsonb_build_object(v_row.rt,
      jsonb_build_object('position', v_row.position, 'score', v_row.score));
  END LOOP;

  RETURN v_out;
END;
$$;

-- Snapshot: sem class_id, sem linhas "sala".
DELETE FROM public.weekly_rankings_snapshot WHERE ranking_type = 'sala';
DROP INDEX IF EXISTS public.uq_weekly_rankings_entry;
DROP INDEX IF EXISTS public.idx_weekly_rankings_class;
ALTER TABLE public.weekly_rankings_snapshot DROP COLUMN IF EXISTS class_id;
CREATE UNIQUE INDEX uq_weekly_rankings_entry
  ON public.weekly_rankings_snapshot (week_start, ranking_type, entity_id);

CREATE OR REPLACE FUNCTION public.compute_weekly_rankings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_this_week_start DATE := brt_week_start();
  v_prev_week_start DATE := v_this_week_start - 7;
  v_prev_week_end   DATE := v_this_week_start - 1;
  v_prev_window_lo  TIMESTAMPTZ := (v_prev_week_start::timestamp) AT TIME ZONE 'America/Sao_Paulo';
  v_prev_window_hi  TIMESTAMPTZ := (v_this_week_start::timestamp) AT TIME ZONE 'America/Sao_Paulo';
  v_inserted        INTEGER := 0;
  v_tickets         INTEGER := 0;
BEGIN
  -- A. GERAL (por professor)
  WITH deltas AS (
    SELECT s.id AS student_id, s.teacher_id, s.character_name,
           GREATEST(0, s.xp - COALESCE(b.baseline_xp, s.xp)) AS delta_xp
      FROM public.students s
      LEFT JOIN public.weekly_xp_baseline b
             ON b.student_id = s.id AND b.week_start = v_prev_week_start
     WHERE s.teacher_id IS NOT NULL
  ),
  geral_ranked AS (
    SELECT teacher_id, student_id AS entity_id,
           COALESCE(NULLIF(btrim(character_name), ''), 'Aventureiro') AS entity_name, delta_xp AS score,
           ROW_NUMBER() OVER (PARTITION BY teacher_id ORDER BY delta_xp DESC, student_id) AS position
      FROM deltas
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, v_prev_week_start, v_prev_week_end, 'geral', entity_id, entity_name, score, position
    FROM geral_ranked
  ON CONFLICT (week_start, ranking_type, entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- B. PVP
  WITH wins AS (
    SELECT m.teacher_id, m.winner_id AS student_id, COUNT(*)::INT AS win_count
      FROM public.pvp_matches m
     WHERE m.winner_id IS NOT NULL
       AND m.finished_at >= v_prev_window_lo
       AND m.finished_at <  v_prev_window_hi
       AND m.status = 'finished'
     GROUP BY m.teacher_id, m.winner_id
  ),
  pvp_ranked AS (
    SELECT w.teacher_id, w.student_id AS entity_id,
           COALESCE(NULLIF(btrim(s.character_name), ''), 'Aventureiro') AS entity_name, w.win_count AS score,
           ROW_NUMBER() OVER (PARTITION BY w.teacher_id ORDER BY w.win_count DESC, w.student_id) AS position
      FROM wins w JOIN public.students s ON s.id = w.student_id
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, v_prev_week_start, v_prev_week_end, 'pvp', entity_id, entity_name, score, position
    FROM pvp_ranked
  ON CONFLICT (week_start, ranking_type, entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  -- C. GUILDAS
  WITH member_deltas AS (
    SELECT g.teacher_id, g.id AS guild_id, g.name AS guild_name,
           GREATEST(0, s.xp - COALESCE(b.baseline_xp, s.xp)) AS delta_xp
      FROM public.guilds g
      JOIN public.guild_members gm ON gm.guild_id = g.id
      JOIN public.students s ON s.id = gm.student_id
      LEFT JOIN public.weekly_xp_baseline b
             ON b.student_id = s.id AND b.week_start = v_prev_week_start
  ),
  guild_totals AS (
    SELECT teacher_id, guild_id, MAX(guild_name) AS guild_name, SUM(delta_xp)::INT AS total_xp
      FROM member_deltas GROUP BY teacher_id, guild_id
  ),
  guild_ranked AS (
    SELECT teacher_id, guild_id AS entity_id, guild_name AS entity_name, total_xp AS score,
           ROW_NUMBER() OVER (PARTITION BY teacher_id ORDER BY total_xp DESC, guild_id) AS position
      FROM guild_totals
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, v_prev_week_start, v_prev_week_end, 'guildas', entity_id, entity_name, score, position
    FROM guild_ranked
  ON CONFLICT (week_start, ranking_type, entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  -- D. Baselines da semana nova
  INSERT INTO public.weekly_xp_baseline (student_id, week_start, baseline_xp, captured_at)
  SELECT s.id, v_this_week_start, s.xp, now()
    FROM public.students s WHERE s.teacher_id IS NOT NULL
  ON CONFLICT (student_id) DO UPDATE
     SET week_start = EXCLUDED.week_start,
         baseline_xp = EXCLUDED.baseline_xp,
         captured_at = EXCLUDED.captured_at
   WHERE public.weekly_xp_baseline.week_start < EXCLUDED.week_start;

  -- E. Tickets de carta para os top 1
  v_tickets := public.issue_top1_card_tickets(v_prev_week_start);

  BEGIN
    PERFORM public.log_action(
      'compute_weekly_rankings', NULL, NULL, NULL,
      jsonb_build_object('week_finalized', v_prev_week_start, 'new_baseline_week', v_this_week_start,
                         'snapshot_rows', v_inserted, 'card_tickets_issued', v_tickets));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object('success', true, 'week_finalized', v_prev_week_start,
                            'new_baseline_week', v_this_week_start, 'card_tickets_issued', v_tickets);
END;
$$;

-- distribute_weekly_rewards lia s.class_id.
DO $$
DECLARE d text := pg_get_functiondef('public.distribute_weekly_rewards(date)'::regprocedure);
BEGIN
  IF strpos(d, 's.entity_name, s.class_id, s.score') = 0 THEN
    RAISE EXCEPTION 'distribute_weekly_rewards: trecho esperado não encontrado';
  END IF;
  EXECUTE replace(d, 's.entity_name, s.class_id, s.score', 's.entity_name, s.score');
END $$;

-- ─── 3. Feed da escola ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._emit_feed_event(p_student_id uuid, p_event_type text, p_event_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id      uuid;
  v_teacher uuid;
  v_guild   uuid;
BEGIN
  SELECT teacher_id INTO v_teacher FROM public.students WHERE id = p_student_id;
  IF v_teacher IS NULL THEN RETURN NULL; END IF;

  SELECT guild_id INTO v_guild FROM public.guild_members WHERE student_id = p_student_id LIMIT 1;

  INSERT INTO public.school_feed_events (teacher_id, guild_id, student_id, event_type, event_data)
  VALUES (v_teacher, v_guild, p_student_id, p_event_type, COALESCE(p_event_data, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

DROP FUNCTION IF EXISTS public.get_school_feed(text, integer, integer);
CREATE OR REPLACE FUNCTION public.get_school_feed(
  p_filter text    DEFAULT 'school',
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(id uuid, event_type text, event_data jsonb, views_count integer,
              created_at timestamp with time zone, student_id uuid, student_name text,
              guild_id uuid, guild_name text, viewed_by_me boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_me    public.students%ROWTYPE;
  v_guild uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT * INTO v_me FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_me.id IS NULL THEN RETURN; END IF;
  SELECT gm.guild_id INTO v_guild FROM public.guild_members gm WHERE gm.student_id = v_me.id LIMIT 1;

  RETURN QUERY
  SELECT e.id, e.event_type, e.event_data, e.views_count, e.created_at,
         e.student_id, COALESCE(NULLIF(btrim(s.character_name), ''), 'Aventureiro') AS student_name,
         e.guild_id, g.name AS guild_name,
         EXISTS (SELECT 1 FROM public.school_feed_views v
                  WHERE v.event_id = e.id AND v.student_id = v_me.id) AS viewed_by_me
    FROM public.school_feed_events e
    JOIN public.students s ON s.id = e.student_id
    LEFT JOIN public.guilds g ON g.id = e.guild_id
   WHERE CASE p_filter
           WHEN 'guild' THEN v_guild IS NOT NULL AND e.guild_id = v_guild
           ELSE e.teacher_id = v_me.teacher_id
         END
   ORDER BY e.created_at DESC
   LIMIT p_limit OFFSET p_offset;
END;
$$;

DROP INDEX IF EXISTS public.idx_sfe_class_created;
ALTER TABLE public.school_feed_events DROP COLUMN IF EXISTS class_id;

-- ─── 4. Analytics do professor ──────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.get_class_comparison(uuid, integer);

DROP FUNCTION IF EXISTS public.get_daily_activity(uuid, integer, uuid);
CREATE OR REPLACE FUNCTION public.get_daily_activity(p_teacher_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_act_for_teacher(p_teacher_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN (
    SELECT jsonb_agg(day_data ORDER BY day)
    FROM (
      SELECT jsonb_build_object(
        'date',            d.day::DATE,
        'logins',          COALESCE((SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'login'              AND created_at::date = d.day), 0),
        'missions',        COALESCE((SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'mission_complete'   AND created_at::date = d.day), 0),
        'challenges',      COALESCE((SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'challenge_complete' AND created_at::date = d.day), 0),
        'unique_students', COALESCE((SELECT count(DISTINCT student_id) FROM analytics_events WHERE teacher_id = p_teacher_id AND created_at::date = d.day), 0)
      ) AS day_data,
      d.day
      FROM generate_series((now() - (p_days || ' days')::INTERVAL)::DATE, now()::DATE, '1 day'::INTERVAL) AS d(day)
    ) sub
  );
END;
$$;

DO $$
DECLARE d text := pg_get_functiondef('public.get_student_risk_scores(uuid)'::regprocedure);
BEGIN
  IF strpos(d, '''class_id'',            s.class_id,') = 0 THEN
    RAISE EXCEPTION 'get_student_risk_scores: trecho esperado não encontrado';
  END IF;
  EXECUTE replace(d, '''class_id'',            s.class_id,', '');
END $$;

DROP INDEX IF EXISTS public.idx_analytics_events_class;
ALTER TABLE public.analytics_events DROP COLUMN IF EXISTS class_id;

-- ─── 5. Admin ───────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.master_list_pending_tickets();
CREATE OR REPLACE FUNCTION public.master_list_pending_tickets()
RETURNS TABLE(ticket_id uuid, student_id uuid, student_name text, character_name text,
              teacher_id uuid, ranking_type text, week_start date, granted_at timestamp with time zone,
              requested_at timestamp with time zone, used_at timestamp with time zone, status text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT public.is_caller_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;

  RETURN QUERY
  SELECT t.id, t.student_id, s.name, s.character_name, s.teacher_id,
         t.ranking_type, t.week_start, t.granted_at, t.requested_at, t.used_at,
         CASE
           WHEN t.used_at      IS NOT NULL THEN 'used'
           WHEN t.requested_at IS NOT NULL THEN 'pending'
           ELSE 'granted'
         END AS status
    FROM public.creation_tickets t
    JOIN public.students s ON s.id = t.student_id
   ORDER BY
     CASE
       WHEN t.used_at IS NULL AND t.requested_at IS NOT NULL THEN 0
       WHEN t.used_at IS NULL THEN 1
       ELSE 2
     END,
     t.requested_at DESC NULLS LAST, t.granted_at DESC;
END;
$$;

CREATE OR REPLACE VIEW public.master_wave11_classes_view AS
SELECT s.id AS student_id,
       s.name AS student_name,
       s.teacher_id,
       scp.class_type AS wave11_class,
       scp.primary_element,
       scp.secondary_element,
       scp.chose_class_at,
       COALESCE(ssp.available_points, 0) AS available_points,
       COALESCE(ssp.total_earned, 0) AS total_earned,
       (SELECT count(*) FROM public.student_unlocked_skills sus WHERE sus.student_id = s.id) AS skills_unlocked,
       (SELECT count(*) FROM public.element_mastery_log eml WHERE eml.student_id = s.id) AS elements_mastered
FROM public.students s
LEFT JOIN public.student_class_profile scp ON scp.student_id = s.id
LEFT JOIN public.student_skill_points ssp ON ssp.student_id = s.id
WHERE public.is_caller_admin();

REVOKE ALL ON public.master_wave11_classes_view FROM PUBLIC, anon;
GRANT SELECT ON public.master_wave11_classes_view TO authenticated;

-- ─── 6. Funções e tabelas de turma ──────────────────────────────────────────

DROP FUNCTION IF EXISTS public.is_teacher_of_class(uuid);
DROP FUNCTION IF EXISTS public.add_class_war_points(uuid, integer);
DROP FUNCTION IF EXISTS public.finalize_class_war(uuid);
DROP FUNCTION IF EXISTS public.admin_assign_student_to_class(uuid, uuid);
DROP FUNCTION IF EXISTS public.teacher_move_student_to_own_class(uuid, uuid);
DROP FUNCTION IF EXISTS public.master_create_class(uuid, text, text);
DROP FUNCTION IF EXISTS public.master_update_class(uuid, text, text);
DROP FUNCTION IF EXISTS public.master_delete_class(uuid, uuid);

DROP TABLE IF EXISTS public.class_wars;

DROP INDEX IF EXISTS public.idx_boss_battles_class;
ALTER TABLE public.boss_battles DROP COLUMN IF EXISTS class_id;

ALTER TABLE public.students DROP COLUMN IF EXISTS class_id;

DROP TABLE IF EXISTS public.classes;
DROP FUNCTION IF EXISTS public.classes_force_neutral_code();
DROP FUNCTION IF EXISTS public.gen_group_code();

-- Admin move um aluno de professor (substitui admin_assign_student_to_class).
CREATE OR REPLACE FUNCTION public.admin_assign_student_to_teacher(p_student_id uuid, p_teacher_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = p_teacher_id) THEN
    RAISE EXCEPTION 'teacher not found' USING ERRCODE = 'P0002';
  END IF;
  UPDATE public.students SET teacher_id = p_teacher_id WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_assign_student_to_teacher(uuid, uuid) FROM PUBLIC, anon;

-- ─── 7. Perfil público: professor em comum em vez de turma ──────────────────

CREATE VIEW public.student_profiles
WITH (security_barrier = true)
AS
WITH me AS (
  SELECT teacher_id FROM public.students WHERE user_id = auth.uid() LIMIT 1
)
SELECT
  s.id,
  coalesce(nullif(btrim(s.character_name), ''), 'Aventureiro') AS name,
  s.character_name,
  s.character_class,
  s.race,
  NULL::text AS profile_photo_url,
  s.level,
  s.xp,
  s.coins,
  s.presencas_consecutivas,
  s.streak_current,
  s.streak_best,
  s.total_boss_kills,
  s.total_pvp_wins,
  s.total_missions_completed,
  s.total_crafts,
  s.is_mentor,
  s.active_banner_key,
  s.status,
  s.is_test_account,
  s.attr_forca,
  s.attr_destreza,
  s.attr_inteligencia,
  s.attr_carisma,
  s.attr_agilidade,
  s.attr_resistencia,
  CASE WHEN s.teacher_id = (SELECT teacher_id FROM me) THEN s.teacher_id END AS teacher_id
FROM public.students s
WHERE s.status = 'active';

REVOKE ALL ON public.student_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.student_profiles TO authenticated;

-- Funções recriadas acima: mesmas regras de execução da migration de grants.
REVOKE EXECUTE ON FUNCTION public._emit_feed_event(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_weekly_rankings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.register_my_student(text, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_weekly_ranking(text, boolean, uuid, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_weekly_positions(boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_school_feed(text, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_daily_activity(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.master_list_pending_tickets() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.merge_student(uuid, uuid) FROM PUBLIC, anon;

COMMIT;
