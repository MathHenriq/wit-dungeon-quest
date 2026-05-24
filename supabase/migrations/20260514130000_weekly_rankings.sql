-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 4.1 — Weekly Rankings (Sala / Geral / PvP / Guildas)
--
-- Design notes
-- ──────────────
-- * There is no event log for XP gains today — students.xp is only a current
--   total. To support a weekly "XP earned" ranking we capture a baseline of
--   each student's XP at the start of every week. Delta = current - baseline.
-- * Week boundaries are Brazilian (America/Sao_Paulo). A "week" starts at
--   Monday 00:00 BRT (ISO week start) and ends Sunday 23:59:59.999 BRT.
-- * The compute job runs once a week and (a) finalizes the previous week into
--   weekly_rankings_snapshot then (b) refreshes baselines for the new week.
-- * Live (in-progress) rankings are computed on demand from the current XP
--   minus the current-week baseline — no snapshot needed for the live view.
-- * Indexes prioritize the two read paths used by the UI:
--      WHERE week_start = ? AND ranking_type = ? AND scope_id = ? ORDER BY position
--      WHERE entity_id = ?  (my positions)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. XP baseline per student (one row per student, mutated each Monday).
CREATE TABLE IF NOT EXISTS public.weekly_xp_baseline (
  student_id    UUID        PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  week_start    DATE        NOT NULL,                  -- Monday (BRT) the baseline was captured for
  baseline_xp   INTEGER     NOT NULL DEFAULT 0,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_xp_baseline_week
  ON public.weekly_xp_baseline (week_start);

ALTER TABLE public.weekly_xp_baseline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read xp baseline"
  ON public.weekly_xp_baseline FOR SELECT USING (true);

-- 2. Snapshot of finalized weekly rankings.
CREATE TABLE IF NOT EXISTS public.weekly_rankings_snapshot (
  id            BIGSERIAL   PRIMARY KEY,
  teacher_id    UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id      UUID                 REFERENCES public.classes(id) ON DELETE SET NULL, -- only for 'sala'
  week_start    DATE        NOT NULL,
  week_end      DATE        NOT NULL,
  ranking_type  TEXT        NOT NULL CHECK (ranking_type IN ('sala','geral','pvp','guildas')),
  entity_id     UUID        NOT NULL,                  -- student_id or guild_id
  entity_name   TEXT,                                  -- denormalized for cheap reads
  score         INTEGER     NOT NULL,
  position      INTEGER     NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per entity per (week, type, scope). class_id NULL for non-sala.
CREATE UNIQUE INDEX IF NOT EXISTS uq_weekly_rankings_entry
  ON public.weekly_rankings_snapshot
     (week_start, ranking_type, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_id);

CREATE INDEX IF NOT EXISTS idx_weekly_rankings_lookup
  ON public.weekly_rankings_snapshot (week_start, ranking_type, teacher_id, position);

CREATE INDEX IF NOT EXISTS idx_weekly_rankings_class
  ON public.weekly_rankings_snapshot (week_start, ranking_type, class_id, position)
  WHERE class_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_weekly_rankings_entity
  ON public.weekly_rankings_snapshot (entity_id, week_start DESC);

ALTER TABLE public.weekly_rankings_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weekly rankings"
  ON public.weekly_rankings_snapshot FOR SELECT USING (true);

-- 3. Helper: current "week_start" in BRT (Monday ISO).
CREATE OR REPLACE FUNCTION public.brt_week_start(p_at TIMESTAMPTZ DEFAULT now())
RETURNS DATE
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (date_trunc('week', (p_at AT TIME ZONE 'America/Sao_Paulo')::timestamp))::date;
$$;

-- 4. Compute/finalize previous week + refresh baselines for current week.
--    Idempotent: re-running on the same Monday is safe (uses ON CONFLICT).
CREATE OR REPLACE FUNCTION public.compute_weekly_rankings()
RETURNS JSONB
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
BEGIN
  -- ── A. GERAL + SALA: XP delta vs baseline captured at prev_week_start ──
  WITH deltas AS (
    SELECT
      s.id           AS student_id,
      s.teacher_id,
      s.class_id,
      s.name,
      s.character_name,
      GREATEST(0, s.xp - COALESCE(b.baseline_xp, s.xp)) AS delta_xp
    FROM public.students s
    LEFT JOIN public.weekly_xp_baseline b
           ON b.student_id = s.id AND b.week_start = v_prev_week_start
    WHERE s.teacher_id IS NOT NULL
  ),
  geral_ranked AS (
    SELECT
      teacher_id, NULL::UUID AS class_id, student_id AS entity_id,
      COALESCE(character_name, name) AS entity_name,
      delta_xp AS score,
      ROW_NUMBER() OVER (PARTITION BY teacher_id ORDER BY delta_xp DESC, student_id) AS position
    FROM deltas
  ),
  sala_ranked AS (
    SELECT
      teacher_id, class_id, student_id AS entity_id,
      COALESCE(character_name, name) AS entity_name,
      delta_xp AS score,
      ROW_NUMBER() OVER (PARTITION BY class_id ORDER BY delta_xp DESC, student_id) AS position
    FROM deltas
    WHERE class_id IS NOT NULL
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, class_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'geral', entity_id, entity_name, score, position
    FROM geral_ranked
   UNION ALL
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'sala',  entity_id, entity_name, score, position
    FROM sala_ranked
  ON CONFLICT (week_start, ranking_type, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- ── B. PVP: wins per student in the previous week ──
  WITH wins AS (
    SELECT
      m.teacher_id,
      m.winner_id              AS student_id,
      COUNT(*)::INT            AS win_count
    FROM public.pvp_matches m
    WHERE m.winner_id IS NOT NULL
      AND m.finished_at >= v_prev_window_lo
      AND m.finished_at <  v_prev_window_hi
      AND m.status = 'finished'
    GROUP BY m.teacher_id, m.winner_id
  ),
  pvp_ranked AS (
    SELECT
      w.teacher_id, NULL::UUID AS class_id,
      w.student_id            AS entity_id,
      COALESCE(s.character_name, s.name) AS entity_name,
      w.win_count             AS score,
      ROW_NUMBER() OVER (PARTITION BY w.teacher_id ORDER BY w.win_count DESC, w.student_id) AS position
    FROM wins w
    JOIN public.students s ON s.id = w.student_id
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, class_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'pvp', entity_id, entity_name, score, position
    FROM pvp_ranked
  ON CONFLICT (week_start, ranking_type, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  -- ── C. GUILDAS: sum of member XP deltas in the previous week ──
  WITH member_deltas AS (
    SELECT
      g.teacher_id,
      g.id          AS guild_id,
      g.name        AS guild_name,
      g.emblem,
      gm.student_id,
      GREATEST(0, s.xp - COALESCE(b.baseline_xp, s.xp)) AS delta_xp
    FROM public.guilds g
    JOIN public.guild_members gm ON gm.guild_id = g.id
    JOIN public.students s ON s.id = gm.student_id
    LEFT JOIN public.weekly_xp_baseline b
           ON b.student_id = s.id AND b.week_start = v_prev_week_start
  ),
  guild_totals AS (
    SELECT teacher_id, guild_id, MAX(guild_name) AS guild_name, SUM(delta_xp)::INT AS total_xp
    FROM member_deltas
    GROUP BY teacher_id, guild_id
  ),
  guild_ranked AS (
    SELECT
      teacher_id, NULL::UUID AS class_id, guild_id AS entity_id,
      guild_name AS entity_name,
      total_xp   AS score,
      ROW_NUMBER() OVER (PARTITION BY teacher_id ORDER BY total_xp DESC, guild_id) AS position
    FROM guild_totals
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, class_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'guildas', entity_id, entity_name, score, position
    FROM guild_ranked
  ON CONFLICT (week_start, ranking_type, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  -- ── D. Refresh baselines for the new (current) week ──
  INSERT INTO public.weekly_xp_baseline (student_id, week_start, baseline_xp, captured_at)
  SELECT s.id, v_this_week_start, s.xp, now()
    FROM public.students s
   WHERE s.teacher_id IS NOT NULL
  ON CONFLICT (student_id)
  DO UPDATE SET week_start  = EXCLUDED.week_start,
                baseline_xp = EXCLUDED.baseline_xp,
                captured_at = EXCLUDED.captured_at
    WHERE public.weekly_xp_baseline.week_start < EXCLUDED.week_start;

  -- Audit
  BEGIN
    PERFORM public.log_action(
      'compute_weekly_rankings', NULL, NULL, NULL,
      jsonb_build_object(
        'week_finalized', v_prev_week_start,
        'new_baseline_week', v_this_week_start,
        'snapshot_rows', v_inserted
      )
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'week_finalized', v_prev_week_start,
    'new_baseline_week', v_this_week_start
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_weekly_rankings() TO authenticated;

-- 5. RPC: paginated read of a ranking (finalized or live).
--
--    For p_finalized=TRUE we read from weekly_rankings_snapshot.
--    For p_finalized=FALSE we compute on-the-fly using current XP - current
--    baseline (or pvp_matches counted within this week).
CREATE OR REPLACE FUNCTION public.get_weekly_ranking(
  p_ranking_type TEXT,
  p_finalized    BOOLEAN DEFAULT FALSE,
  p_teacher_id   UUID    DEFAULT NULL,   -- scope: school
  p_class_id     UUID    DEFAULT NULL,   -- scope for 'sala'
  p_limit        INT     DEFAULT 50,
  p_offset       INT     DEFAULT 0
)
RETURNS TABLE (
  rank        INT,
  entity_id   UUID,
  entity_name TEXT,
  score       INT,
  week_start  DATE,
  week_end    DATE
)
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
  IF p_ranking_type NOT IN ('sala','geral','pvp','guildas') THEN
    RAISE EXCEPTION 'invalid ranking_type';
  END IF;

  IF p_finalized THEN
    RETURN QUERY
    SELECT s.position AS rank, s.entity_id, s.entity_name, s.score, s.week_start, s.week_end
      FROM public.weekly_rankings_snapshot s
     WHERE s.week_start    = v_prev_week_start
       AND s.ranking_type  = p_ranking_type
       AND (p_class_id   IS NULL OR s.class_id   = p_class_id)
       AND (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)
     ORDER BY s.position
     LIMIT p_limit OFFSET p_offset;
    RETURN;
  END IF;

  -- LIVE (in-progress)
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
    joined AS (
      SELECT w.student_id, COALESCE(st.character_name, st.name) AS nm, w.win_count
        FROM wins w
        JOIN public.students st ON st.id = w.student_id
       WHERE p_class_id IS NULL OR st.class_id = p_class_id
    ),
    ranked AS (
      SELECT
        ROW_NUMBER() OVER (ORDER BY win_count DESC, student_id)::INT AS position,
        student_id AS entity_id, nm AS entity_name, win_count AS score
      FROM joined
    )
    SELECT r.position, r.entity_id, r.entity_name, r.score, v_this_week_start, (v_this_week_start + 6)
      FROM ranked r
     ORDER BY r.position
     LIMIT p_limit OFFSET p_offset;

  ELSIF p_ranking_type = 'guildas' THEN
    RETURN QUERY
    WITH member_deltas AS (
      SELECT g.id AS guild_id, g.name AS gname, g.teacher_id,
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
        FROM member_deltas
       GROUP BY guild_id
    ),
    ranked AS (
      SELECT
        ROW_NUMBER() OVER (ORDER BY total DESC, guild_id)::INT AS position,
        guild_id AS entity_id, gname AS entity_name, total AS score
        FROM totals
    )
    SELECT r.position, r.entity_id, r.entity_name, r.score, v_this_week_start, (v_this_week_start + 6)
      FROM ranked r
     ORDER BY r.position
     LIMIT p_limit OFFSET p_offset;

  ELSE
    -- 'sala' or 'geral'
    RETURN QUERY
    WITH deltas AS (
      SELECT st.id AS student_id, st.teacher_id, st.class_id,
             COALESCE(st.character_name, st.name) AS nm,
             GREATEST(0, st.xp - COALESCE(b.baseline_xp, st.xp)) AS delta_xp
        FROM public.students st
        LEFT JOIN public.weekly_xp_baseline b
               ON b.student_id = st.id AND b.week_start = v_this_week_start
       WHERE st.teacher_id IS NOT NULL
         AND (p_teacher_id IS NULL OR st.teacher_id = p_teacher_id)
         AND (p_ranking_type <> 'sala' OR (p_class_id IS NOT NULL AND st.class_id = p_class_id))
    ),
    ranked AS (
      SELECT
        ROW_NUMBER() OVER (ORDER BY delta_xp DESC, student_id)::INT AS position,
        student_id AS entity_id, nm AS entity_name, delta_xp AS score
        FROM deltas
    )
    SELECT r.position, r.entity_id, r.entity_name, r.score, v_this_week_start, (v_this_week_start + 6)
      FROM ranked r
     ORDER BY r.position
     LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_ranking(TEXT, BOOLEAN, UUID, UUID, INT, INT)
  TO authenticated, anon;

-- 6. RPC: "my positions" — the 4 rankings for the calling student.
CREATE OR REPLACE FUNCTION public.get_my_weekly_positions(p_finalized BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_student   public.students;
  v_guild_id  UUID;
  v_out       JSONB := jsonb_build_object();
  v_row       RECORD;
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
    SELECT 'sala'::TEXT AS rt, r.rank AS position, r.score
      FROM public.get_weekly_ranking('sala', p_finalized, v_student.teacher_id, v_student.class_id, 10000, 0) r
     WHERE r.entity_id = v_student.id
    UNION ALL
    SELECT 'geral', r.rank, r.score
      FROM public.get_weekly_ranking('geral', p_finalized, v_student.teacher_id, NULL, 10000, 0) r
     WHERE r.entity_id = v_student.id
    UNION ALL
    SELECT 'pvp', r.rank, r.score
      FROM public.get_weekly_ranking('pvp', p_finalized, v_student.teacher_id, NULL, 10000, 0) r
     WHERE r.entity_id = v_student.id
    UNION ALL
    SELECT 'guildas', r.rank, r.score
      FROM public.get_weekly_ranking('guildas', p_finalized, v_student.teacher_id, NULL, 10000, 0) r
     WHERE v_guild_id IS NOT NULL AND r.entity_id = v_guild_id
  LOOP
    v_out := v_out || jsonb_build_object(
      v_row.rt,
      jsonb_build_object('position', v_row.position, 'score', v_row.score)
    );
  END LOOP;

  RETURN v_out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_weekly_positions(BOOLEAN) TO authenticated;

-- 7. Bootstrap: seed initial baselines for the current week so live rankings
--    have a meaningful zero point starting *now* (before the first scheduled run).
INSERT INTO public.weekly_xp_baseline (student_id, week_start, baseline_xp, captured_at)
SELECT s.id, brt_week_start(), s.xp, now()
  FROM public.students s
 WHERE s.teacher_id IS NOT NULL
ON CONFLICT (student_id) DO NOTHING;

-- 8. Schedule the weekly compute via pg_cron (every Monday 03:01 UTC = 00:01 BRT).
--    Using DO blocks so the migration succeeds even when pg_cron isn't installed
--    (e.g., local emulators). Production Supabase has pg_cron available.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Drop previous schedule if it exists, then re-create.
    PERFORM cron.unschedule('compute_weekly_rankings')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'compute_weekly_rankings');
    PERFORM cron.schedule(
      'compute_weekly_rankings',
      '1 3 * * 1', -- 03:01 UTC every Monday = 00:01 America/Sao_Paulo
      $cron$SELECT public.compute_weekly_rankings();$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Non-fatal; admin can schedule manually later.
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$$;
