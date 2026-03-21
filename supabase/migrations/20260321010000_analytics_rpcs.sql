-- ============================================================
-- ANALYTICS RPCs — WIT Dungeon Quest
-- Migration: 20260321010000_analytics_rpcs.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- get_analytics_overview — KPIs gerais
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_overview(
  p_teacher_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_start_date TIMESTAMPTZ := now() - (p_days || ' days')::INTERVAL;
BEGIN
  SELECT jsonb_build_object(
    'total_students',            (SELECT count(*) FROM students WHERE teacher_id = p_teacher_id AND status = 'active'),
    'active_students_period',    (SELECT count(DISTINCT student_id) FROM analytics_events WHERE teacher_id = p_teacher_id AND created_at >= v_start_date),
    'total_events',              (SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND created_at >= v_start_date),
    'total_logins',              (SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'login' AND created_at >= v_start_date),
    'total_missions_completed',  (SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'mission_complete' AND created_at >= v_start_date),
    'total_challenges_completed',(SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'challenge_complete' AND created_at >= v_start_date),
    'total_shop_purchases',      (SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'shop_purchase' AND created_at >= v_start_date),
    'avg_daily_logins', (
      SELECT COALESCE(round(count(*)::numeric / GREATEST(p_days, 1), 1), 0)
      FROM analytics_events
      WHERE teacher_id = p_teacher_id AND event_type = 'login' AND created_at >= v_start_date
    ),
    'avg_session_minutes', (
      SELECT COALESCE(round(avg((event_data->>'duration_minutes')::numeric), 1), 0)
      FROM analytics_events
      WHERE teacher_id = p_teacher_id AND event_type = 'session_end' AND created_at >= v_start_date
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- get_engagement_heatmap — Dados para heatmap de atividade
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_engagement_heatmap(
  p_teacher_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(row_data)
    FROM (
      SELECT jsonb_build_object(
        'day_of_week', EXTRACT(DOW FROM created_at)::INTEGER,
        'hour',        EXTRACT(HOUR FROM created_at)::INTEGER,
        'count',       count(*)
      ) AS row_data
      FROM analytics_events
      WHERE teacher_id = p_teacher_id
        AND created_at >= now() - (p_days || ' days')::INTERVAL
      GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at)
      ORDER BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at)
    ) sub
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- get_student_risk_scores — Predição de alunos em risco
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_student_risk_scores(
  p_teacher_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(student_risk)
    FROM (
      SELECT jsonb_build_object(
        'student_id',          s.id,
        'student_name',        s.name,
        'class_id',            s.class_id,
        'level',               s.level,
        'days_since_last_login', COALESCE(
          EXTRACT(DAY FROM now() - (SELECT max(created_at) FROM analytics_events WHERE student_id = s.id AND event_type = 'login')),
          999
        )::INTEGER,
        'logins_last_14_days', (SELECT count(*) FROM analytics_events WHERE student_id = s.id AND event_type = 'login' AND created_at >= now() - interval '14 days'),
        'missions_last_14_days',(SELECT count(*) FROM analytics_events WHERE student_id = s.id AND event_type = 'mission_complete' AND created_at >= now() - interval '14 days'),
        'streak_current',      s.streak_current,
        'risk_score', (
          LEAST(100, GREATEST(0,
            LEAST(40, COALESCE(EXTRACT(DAY FROM now() - (SELECT max(created_at) FROM analytics_events WHERE student_id = s.id AND event_type = 'login')), 30)::INTEGER * 4 / 3) +
            GREATEST(0, 30 - (SELECT count(*) FROM analytics_events WHERE student_id = s.id AND event_type = 'login' AND created_at >= now() - interval '14 days') * 5) +
            CASE WHEN (SELECT count(*) FROM analytics_events WHERE student_id = s.id AND event_type = 'mission_complete' AND created_at >= now() - interval '14 days') = 0 THEN 20 ELSE 0 END +
            CASE WHEN COALESCE(s.streak_current, 0) = 0 THEN 10 ELSE 0 END
          ))
        )
      ) AS student_risk
      FROM students s
      WHERE s.teacher_id = p_teacher_id AND s.status = 'active'
      ORDER BY (
        LEAST(100, GREATEST(0,
          LEAST(40, COALESCE(EXTRACT(DAY FROM now() - (SELECT max(created_at) FROM analytics_events WHERE student_id = s.id AND event_type = 'login')), 30)::INTEGER * 4 / 3) +
          GREATEST(0, 30 - (SELECT count(*) FROM analytics_events WHERE student_id = s.id AND event_type = 'login' AND created_at >= now() - interval '14 days') * 5) +
          CASE WHEN (SELECT count(*) FROM analytics_events WHERE student_id = s.id AND event_type = 'mission_complete' AND created_at >= now() - interval '14 days') = 0 THEN 20 ELSE 0 END +
          CASE WHEN COALESCE(s.streak_current, 0) = 0 THEN 10 ELSE 0 END
        ))
      ) DESC
    ) sub
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- get_class_comparison — Comparativo entre turmas
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_class_comparison(
  p_teacher_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(class_data)
    FROM (
      SELECT jsonb_build_object(
        'class_id',       c.id,
        'class_name',     c.name,
        'student_count',  (SELECT count(*) FROM students WHERE class_id = c.id AND status = 'active'),
        'avg_level',      (SELECT COALESCE(round(avg(level)::numeric, 1), 0) FROM students WHERE class_id = c.id AND status = 'active'),
        'total_logins',   (SELECT count(*) FROM analytics_events WHERE class_id = c.id AND event_type = 'login' AND created_at >= now() - (p_days || ' days')::INTERVAL),
        'total_missions', (SELECT count(*) FROM analytics_events WHERE class_id = c.id AND event_type = 'mission_complete' AND created_at >= now() - (p_days || ' days')::INTERVAL),
        'active_students',(SELECT count(DISTINCT student_id) FROM analytics_events WHERE class_id = c.id AND created_at >= now() - (p_days || ' days')::INTERVAL),
        'avg_streak',     (SELECT COALESCE(round(avg(streak_current)::numeric, 1), 0) FROM students WHERE class_id = c.id AND status = 'active')
      ) AS class_data
      FROM classes c
      WHERE c.teacher_id = p_teacher_id
      ORDER BY c.name
    ) sub
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- get_student_dna — DNA do aluno (radar chart)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_student_dna(
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'consistency', LEAST(100, (
      COALESCE((SELECT streak_current FROM students WHERE id = p_student_id), 0) * 5 +
      LEAST(50, (SELECT count(*) FROM analytics_events WHERE student_id = p_student_id AND event_type = 'login' AND created_at >= now() - interval '30 days') * 4)
    )),
    'speed', LEAST(100, (
      (SELECT count(*) FROM analytics_events WHERE student_id = p_student_id AND event_type = 'mission_complete' AND created_at >= now() - interval '14 days') * 12
    )),
    'collaboration', LEAST(100, (
      COALESCE((SELECT mentor_xp FROM students WHERE id = p_student_id), 0) +
      (SELECT count(*) FROM achievement_reactions WHERE student_id = p_student_id) * 5 +
      (SELECT count(*) FROM guild_posts WHERE student_id = p_student_id) * 3
    )),
    'creativity', LEAST(100, (
      COALESCE((SELECT total_crafts FROM students WHERE id = p_student_id), 0) * 15 +
      CASE WHEN (SELECT lore FROM students WHERE id = p_student_id) IS NOT NULL THEN 20 ELSE 0 END +
      CASE WHEN (SELECT appearance FROM students WHERE id = p_student_id) IS NOT NULL THEN 15 ELSE 0 END +
      CASE WHEN (SELECT character_name FROM students WHERE id = p_student_id) IS NOT NULL THEN 15 ELSE 0 END
    )),
    'leadership', LEAST(100, (
      CASE WHEN (SELECT is_mentor FROM students WHERE id = p_student_id) THEN 30 ELSE 0 END +
      CASE WHEN EXISTS(SELECT 1 FROM guild_members WHERE student_id = p_student_id AND role = 'leader') THEN 30 ELSE 0 END +
      COALESCE((SELECT mentor_xp FROM students WHERE id = p_student_id), 0) / 2
    )),
    'resilience', LEAST(100, (
      COALESCE((SELECT streak_best FROM students WHERE id = p_student_id), 0) * 3 +
      (SELECT count(*) FROM analytics_events WHERE student_id = p_student_id AND event_type = 'boss_attempt' AND created_at >= now() - interval '30 days') * 8 +
      COALESCE((SELECT total_boss_kills FROM students WHERE id = p_student_id), 0) * 5
    ))
  ) INTO result;

  RETURN result;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- get_daily_activity — Atividade diária (gráfico de linha)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_daily_activity(
  p_teacher_id UUID,
  p_days INTEGER DEFAULT 30,
  p_class_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(day_data ORDER BY day)
    FROM (
      SELECT jsonb_build_object(
        'date',            d.day::DATE,
        'logins',          COALESCE((SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'login'             AND created_at::date = d.day AND (p_class_id IS NULL OR class_id = p_class_id)), 0),
        'missions',        COALESCE((SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'mission_complete'  AND created_at::date = d.day AND (p_class_id IS NULL OR class_id = p_class_id)), 0),
        'challenges',      COALESCE((SELECT count(*) FROM analytics_events WHERE teacher_id = p_teacher_id AND event_type = 'challenge_complete' AND created_at::date = d.day AND (p_class_id IS NULL OR class_id = p_class_id)), 0),
        'unique_students', COALESCE((SELECT count(DISTINCT student_id) FROM analytics_events WHERE teacher_id = p_teacher_id AND created_at::date = d.day AND (p_class_id IS NULL OR class_id = p_class_id)), 0)
      ) AS day_data,
      d.day
      FROM generate_series(
        (now() - (p_days || ' days')::INTERVAL)::DATE,
        now()::DATE,
        '1 day'::INTERVAL
      ) AS d(day)
    ) sub
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- GRANTS
-- ────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_analytics_overview   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_engagement_heatmap   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_risk_scores  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_comparison     TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_dna          TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_activity       TO authenticated;
