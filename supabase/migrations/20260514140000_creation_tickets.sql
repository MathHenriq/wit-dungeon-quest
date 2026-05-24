-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 4.2 — Creation Tickets
--
-- Top 1 weekly winners (sala / geral / pvp) earn a "Ticket de Criação" — a
-- consumable token that lets the student request a real-life session with the
-- master to co-design a new card.
--
-- Lifecycle:
--   granted_at  → ticket created by compute_weekly_rankings (top 1 only)
--   requested_at → student clicked "Solicitar Uso" (modal confirmed)
--   used_at      → master marked as fulfilled (and optionally linked the
--                  resulting shop_items row via card_created_id)
--
-- Constraint: a student can hold at most ONE *unused* ticket per ranking_type.
-- Re-winning the same ranking next week does not stack — the ticket simply
-- stays granted. This is enforced by a partial unique index.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creation_tickets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  ranking_type    TEXT        NOT NULL CHECK (ranking_type IN ('sala','geral','pvp')),
  week_start      DATE        NOT NULL,                 -- the week that earned the ticket
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_at    TIMESTAMPTZ,                          -- student clicked "Solicitar"
  used_at         TIMESTAMPTZ,                          -- master fulfilled
  card_created_id UUID                 REFERENCES public.shop_items(id) ON DELETE SET NULL,
  master_notes    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Don't grant a second ticket for the same week+ranking to the same student.
CREATE UNIQUE INDEX IF NOT EXISTS uq_creation_tickets_grant
  ON public.creation_tickets (student_id, ranking_type, week_start);

-- Enforce "at most one active (unused) ticket per ranking_type per student".
CREATE UNIQUE INDEX IF NOT EXISTS uq_creation_tickets_active_per_type
  ON public.creation_tickets (student_id, ranking_type)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_creation_tickets_pending
  ON public.creation_tickets (requested_at)
  WHERE used_at IS NULL AND requested_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_creation_tickets_student
  ON public.creation_tickets (student_id);

ALTER TABLE public.creation_tickets ENABLE ROW LEVEL SECURITY;

-- Reads: anyone with a session can read; writes go strictly through RPCs.
CREATE POLICY "Anyone can read creation_tickets"
  ON public.creation_tickets FOR SELECT USING (true);

-- ── Grant hook called from compute_weekly_rankings ───────────────────────────
-- Auto-grants Top 1 of sala/geral/pvp the week that just finalized.
CREATE OR REPLACE FUNCTION public.grant_top1_creation_tickets(p_week_start DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_granted INTEGER := 0;
BEGIN
  WITH ins AS (
    INSERT INTO public.creation_tickets (student_id, ranking_type, week_start)
    SELECT s.entity_id, s.ranking_type, s.week_start
      FROM public.weekly_rankings_snapshot s
     WHERE s.week_start   = p_week_start
       AND s.ranking_type IN ('sala','geral','pvp')
       AND s.position     = 1
       AND s.score        > 0    -- skip top1 with zero score (no real winner)
    ON CONFLICT (student_id, ranking_type, week_start) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_granted FROM ins;

  RETURN v_granted;
END;
$$;

-- Re-wire compute_weekly_rankings to call the grant hook after snapshot inserts.
-- Easiest: replace the function with an identical body + tail call.
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
  v_tickets_granted INTEGER := 0;
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

  -- ── B. PVP wins in previous week ──
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
    SELECT w.teacher_id, NULL::UUID AS class_id, w.student_id AS entity_id,
           COALESCE(s.character_name, s.name) AS entity_name,
           w.win_count AS score,
           ROW_NUMBER() OVER (PARTITION BY w.teacher_id ORDER BY w.win_count DESC, w.student_id) AS position
      FROM wins w JOIN public.students s ON s.id = w.student_id
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, class_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'pvp', entity_id, entity_name, score, position
    FROM pvp_ranked
  ON CONFLICT (week_start, ranking_type, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  -- ── C. Guildas: sum of member XP deltas ──
  WITH member_deltas AS (
    SELECT g.teacher_id, g.id AS guild_id, g.name AS guild_name, g.emblem,
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
      FROM member_deltas GROUP BY teacher_id, guild_id
  ),
  guild_ranked AS (
    SELECT teacher_id, NULL::UUID AS class_id, guild_id AS entity_id,
           guild_name AS entity_name, total_xp AS score,
           ROW_NUMBER() OVER (PARTITION BY teacher_id ORDER BY total_xp DESC, guild_id) AS position
      FROM guild_totals
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, class_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'guildas', entity_id, entity_name, score, position
    FROM guild_ranked
  ON CONFLICT (week_start, ranking_type, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  -- ── D. Refresh baselines for the new week ──
  INSERT INTO public.weekly_xp_baseline (student_id, week_start, baseline_xp, captured_at)
  SELECT s.id, v_this_week_start, s.xp, now()
    FROM public.students s
   WHERE s.teacher_id IS NOT NULL
  ON CONFLICT (student_id)
  DO UPDATE SET week_start  = EXCLUDED.week_start,
                baseline_xp = EXCLUDED.baseline_xp,
                captured_at = EXCLUDED.captured_at
    WHERE public.weekly_xp_baseline.week_start < EXCLUDED.week_start;

  -- ── E. Grant Top-1 creation tickets ──
  v_tickets_granted := public.grant_top1_creation_tickets(v_prev_week_start);

  -- Audit
  BEGIN
    PERFORM public.log_action(
      'compute_weekly_rankings', NULL, NULL, NULL,
      jsonb_build_object(
        'week_finalized', v_prev_week_start,
        'new_baseline_week', v_this_week_start,
        'snapshot_rows', v_inserted,
        'tickets_granted', v_tickets_granted
      )
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'week_finalized', v_prev_week_start,
    'new_baseline_week', v_this_week_start,
    'tickets_granted', v_tickets_granted
  );
END;
$$;

-- ── Student-side RPC: list my tickets ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_creation_tickets()
RETURNS TABLE (
  id            UUID,
  ranking_type  TEXT,
  week_start    DATE,
  granted_at    TIMESTAMPTZ,
  requested_at  TIMESTAMPTZ,
  used_at       TIMESTAMPTZ,
  status        TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_student_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT s.id INTO v_student_id FROM public.students s WHERE s.user_id = v_uid LIMIT 1;
  IF v_student_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT t.id, t.ranking_type, t.week_start, t.granted_at, t.requested_at, t.used_at,
         CASE
           WHEN t.used_at      IS NOT NULL THEN 'used'
           WHEN t.requested_at IS NOT NULL THEN 'pending'
           ELSE 'granted'
         END AS status
    FROM public.creation_tickets t
   WHERE t.student_id = v_student_id
   ORDER BY t.granted_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_creation_tickets() TO authenticated;

-- ── Student-side RPC: request use of a ticket ────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_creation_ticket(p_ticket_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    UUID := auth.uid();
  v_ticket public.creation_tickets;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Sessão expirada'); END IF;

  SELECT t.* INTO v_ticket
    FROM public.creation_tickets t
    JOIN public.students s ON s.id = t.student_id
   WHERE t.id = p_ticket_id AND s.user_id = v_uid
   FOR UPDATE;

  IF v_ticket.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket não encontrado');
  END IF;
  IF v_ticket.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket já utilizado');
  END IF;
  IF v_ticket.requested_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_requested', true);
  END IF;

  UPDATE public.creation_tickets
     SET requested_at = now()
   WHERE id = p_ticket_id;

  BEGIN
    PERFORM public.log_action(
      'request_creation_ticket', 'creation_tickets', p_ticket_id, NULL,
      jsonb_build_object('ranking_type', v_ticket.ranking_type, 'week_start', v_ticket.week_start)
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_creation_ticket(UUID) TO authenticated;

-- ── Master RPCs ──────────────────────────────────────────────────────────────
-- Auth: caller must be in admins table (re-uses pattern from master RPCs).
CREATE OR REPLACE FUNCTION public.master_list_pending_tickets()
RETURNS TABLE (
  ticket_id     UUID,
  student_id    UUID,
  student_name  TEXT,
  character_name TEXT,
  class_name    TEXT,
  teacher_id    UUID,
  ranking_type  TEXT,
  week_start    DATE,
  granted_at    TIMESTAMPTZ,
  requested_at  TIMESTAMPTZ,
  used_at       TIMESTAMPTZ,
  status        TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT t.id, t.student_id,
         s.name, s.character_name,
         c.name AS class_name, s.teacher_id,
         t.ranking_type, t.week_start, t.granted_at, t.requested_at, t.used_at,
         CASE
           WHEN t.used_at      IS NOT NULL THEN 'used'
           WHEN t.requested_at IS NOT NULL THEN 'pending'
           ELSE 'granted'
         END AS status
    FROM public.creation_tickets t
    JOIN public.students s ON s.id = t.student_id
    LEFT JOIN public.classes c ON c.id = s.class_id
   ORDER BY
     CASE
       WHEN t.used_at IS NULL AND t.requested_at IS NOT NULL THEN 0  -- pending first
       WHEN t.used_at IS NULL THEN 1                                  -- granted next
       ELSE 2                                                         -- used last
     END,
     t.requested_at DESC NULLS LAST, t.granted_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.master_list_pending_tickets() TO authenticated;

CREATE OR REPLACE FUNCTION public.master_mark_ticket_used(
  p_ticket_id      UUID,
  p_card_created_id UUID DEFAULT NULL,
  p_notes          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_ok  BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Sessão expirada'); END IF;
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  UPDATE public.creation_tickets
     SET used_at         = now(),
         card_created_id = COALESCE(p_card_created_id, card_created_id),
         master_notes    = COALESCE(p_notes, master_notes)
   WHERE id = p_ticket_id
     AND used_at IS NULL
  RETURNING TRUE INTO v_ok;

  IF NOT v_ok THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket não encontrado ou já utilizado');
  END IF;

  BEGIN
    PERFORM public.log_action(
      'master_mark_ticket_used', 'creation_tickets', p_ticket_id, NULL,
      jsonb_build_object('card_created_id', p_card_created_id, 'notes', p_notes)
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.master_mark_ticket_used(UUID, UUID, TEXT) TO authenticated;
