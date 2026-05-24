-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 4.3 — Weekly Rewards Distribution
--
-- Adds:
--   • weekly_rewards_log     — idempotency + audit of every reward issued.
--   • student_chest_grants   — free-granted chests (no payment) redeemable
--                              through open_chest(p_grant_id).
--   • student_pending_rewards — inbox of unclaimed reward notifications shown
--                              to the student on next login.
--   • distribute_weekly_rewards()  — runs the distribution.
--   • Patches compute_weekly_rankings() to use RANK() instead of ROW_NUMBER()
--     so ties at #1 produce multiple winners (per spec — ties win together).
--   • Patches open_chest() to accept p_grant_id so granted chests open free.
--
-- Idempotency: weekly_rewards_log has a UNIQUE (week_start, ranking_type,
-- entity_id, reward_kind). Re-running the distributor is a no-op.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Reward log (idempotency + audit).
CREATE TABLE IF NOT EXISTS public.weekly_rewards_log (
  id              BIGSERIAL   PRIMARY KEY,
  week_start      DATE        NOT NULL,
  ranking_type    TEXT        NOT NULL CHECK (ranking_type IN ('sala','geral','pvp','guildas')),
  entity_id       UUID        NOT NULL,                 -- student_id or guild_id
  reward_kind     TEXT        NOT NULL,                 -- 'ticket' | 'chest_grant'
  reward_payload  JSONB       NOT NULL DEFAULT '{}'::JSONB,
  distributed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_weekly_rewards_log
  ON public.weekly_rewards_log (week_start, ranking_type, entity_id, reward_kind);

CREATE INDEX IF NOT EXISTS idx_weekly_rewards_log_week
  ON public.weekly_rewards_log (week_start);

ALTER TABLE public.weekly_rewards_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read weekly_rewards_log"
  ON public.weekly_rewards_log FOR SELECT USING (true);

-- 2. Chest grants — free chest tokens earned through events.
CREATE TABLE IF NOT EXISTS public.student_chest_grants (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  chest_key     TEXT        NOT NULL,
  reason        TEXT,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at     TIMESTAMPTZ,
  source_payload JSONB       NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_chest_grants_student
  ON public.student_chest_grants (student_id, opened_at);

ALTER TABLE public.student_chest_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read student_chest_grants"
  ON public.student_chest_grants FOR SELECT USING (true);

-- 3. Pending reward notifications (student inbox).
CREATE TABLE IF NOT EXISTS public.student_pending_rewards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  kind        TEXT        NOT NULL,           -- 'ticket' | 'chest_grant' | 'info'
  title       TEXT        NOT NULL,
  body        TEXT,
  payload     JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_rewards_inbox
  ON public.student_pending_rewards (student_id, claimed_at);

ALTER TABLE public.student_pending_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pending_rewards"
  ON public.student_pending_rewards FOR SELECT USING (true);

-- 4. Patch compute_weekly_rankings: switch ROW_NUMBER → RANK so ties at #1
--    produce multiple winners and the reward distributor picks them all.
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
  -- GERAL + SALA via RANK (ties → same position).
  WITH deltas AS (
    SELECT s.id AS student_id, s.teacher_id, s.class_id, s.name, s.character_name,
           GREATEST(0, s.xp - COALESCE(b.baseline_xp, s.xp)) AS delta_xp
      FROM public.students s
      LEFT JOIN public.weekly_xp_baseline b
             ON b.student_id = s.id AND b.week_start = v_prev_week_start
     WHERE s.teacher_id IS NOT NULL
  ),
  geral_ranked AS (
    SELECT teacher_id, NULL::UUID AS class_id, student_id AS entity_id,
           COALESCE(character_name, name) AS entity_name,
           delta_xp AS score,
           RANK() OVER (PARTITION BY teacher_id ORDER BY delta_xp DESC) AS position
      FROM deltas
  ),
  sala_ranked AS (
    SELECT teacher_id, class_id, student_id AS entity_id,
           COALESCE(character_name, name) AS entity_name,
           delta_xp AS score,
           RANK() OVER (PARTITION BY class_id ORDER BY delta_xp DESC) AS position
      FROM deltas WHERE class_id IS NOT NULL
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, class_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'geral', entity_id, entity_name, score, position FROM geral_ranked
  UNION ALL
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'sala',  entity_id, entity_name, score, position FROM sala_ranked
  ON CONFLICT (week_start, ranking_type, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- PVP via RANK.
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
           RANK() OVER (PARTITION BY w.teacher_id ORDER BY w.win_count DESC) AS position
      FROM wins w JOIN public.students s ON s.id = w.student_id
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, class_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'pvp', entity_id, entity_name, score, position FROM pvp_ranked
  ON CONFLICT (week_start, ranking_type, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  -- GUILDAS via RANK.
  WITH member_deltas AS (
    SELECT g.teacher_id, g.id AS guild_id, g.name AS guild_name, gm.student_id,
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
           RANK() OVER (PARTITION BY teacher_id ORDER BY total_xp DESC) AS position
      FROM guild_totals
  )
  INSERT INTO public.weekly_rankings_snapshot
    (teacher_id, class_id, week_start, week_end, ranking_type, entity_id, entity_name, score, position)
  SELECT teacher_id, class_id, v_prev_week_start, v_prev_week_end, 'guildas', entity_id, entity_name, score, position FROM guild_ranked
  ON CONFLICT (week_start, ranking_type, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid), entity_id)
  DO UPDATE SET score = EXCLUDED.score, position = EXCLUDED.position, entity_name = EXCLUDED.entity_name;

  -- Refresh baselines for the new week.
  INSERT INTO public.weekly_xp_baseline (student_id, week_start, baseline_xp, captured_at)
  SELECT s.id, v_this_week_start, s.xp, now()
    FROM public.students s WHERE s.teacher_id IS NOT NULL
  ON CONFLICT (student_id)
  DO UPDATE SET week_start  = EXCLUDED.week_start,
                baseline_xp = EXCLUDED.baseline_xp,
                captured_at = EXCLUDED.captured_at
    WHERE public.weekly_xp_baseline.week_start < EXCLUDED.week_start;

  -- Grant Top-1 creation tickets (sala/geral/pvp).
  v_tickets_granted := public.grant_top1_creation_tickets(v_prev_week_start);

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
    'tickets_granted', v_tickets_granted
  );
END;
$$;

-- 5. Patch open_chest to support free grant redemption.
DROP FUNCTION IF EXISTS public.open_chest(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION public.open_chest(
  p_chest_key TEXT,
  p_count     INTEGER DEFAULT 1,
  p_grant_id  UUID    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid             UUID := auth.uid();
  v_student         students%ROWTYPE;
  v_chest           chest_types%ROWTYPE;
  v_count           INTEGER;
  v_total_coins     INTEGER;
  v_total_diamonds  INTEGER;
  v_items           JSONB := '[]'::JSONB;
  v_refund_coins    INTEGER := 0;
  v_rarity          TEXT;
  v_pick            RECORD;
  v_roll_bp         INTEGER;
  v_sub_total_bp    INTEGER;
  v_sub_rare_bp     INTEGER;
  v_sub_main_bp     INTEGER;
  v_i               INTEGER;
  v_attempts        INTEGER;
  v_max_attempts    CONSTANT INTEGER := 10;
  v_discount_pct    INTEGER := 0;
  v_per_item_cost_coins INTEGER;
  v_per_item_cost_diamonds INTEGER;
  v_is_grant        BOOLEAN := FALSE;
  v_grant_row       student_chest_grants%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501'; END IF;

  v_count := COALESCE(p_count, 1);
  IF v_count NOT IN (1, 10) THEN RAISE EXCEPTION 'count_must_be_1_or_10' USING ERRCODE = '22023'; END IF;
  IF v_count = 10 THEN v_discount_pct := 5; END IF;

  SELECT * INTO v_student FROM students WHERE user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0002'; END IF;

  -- ── Grant validation ──
  IF p_grant_id IS NOT NULL THEN
    SELECT * INTO v_grant_row
      FROM student_chest_grants
     WHERE id = p_grant_id AND student_id = v_student.id
     FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'grant_not_found' USING ERRCODE = 'P0002'; END IF;
    IF v_grant_row.opened_at IS NOT NULL THEN RAISE EXCEPTION 'grant_already_used' USING ERRCODE = '22023'; END IF;
    IF v_grant_row.chest_key <> p_chest_key THEN RAISE EXCEPTION 'grant_chest_mismatch' USING ERRCODE = '22023'; END IF;
    IF v_count <> 1 THEN RAISE EXCEPTION 'grant_count_must_be_1' USING ERRCODE = '22023'; END IF;
    v_is_grant := TRUE;
  END IF;

  -- Resolve chest by key.
  SELECT * INTO v_chest FROM chest_types
   WHERE chest_key = p_chest_key AND is_active = true
   ORDER BY (teacher_id IS NULL) DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'chest_not_found' USING ERRCODE = 'P0002'; END IF;

  IF v_is_grant THEN
    v_total_coins := 0;
    v_total_diamonds := 0;
  ELSE
    v_total_coins    := v_chest.cost_coins    * v_count * (100 - v_discount_pct) / 100;
    v_total_diamonds := v_chest.cost_diamonds * v_count * (100 - v_discount_pct) / 100;

    IF v_total_coins    > 0 AND v_student.coins    < v_total_coins
    OR v_total_diamonds > 0 AND COALESCE(v_student.diamonds, 0) < v_total_diamonds THEN
      RAISE EXCEPTION 'insufficient_balance' USING ERRCODE = '22023';
    END IF;

    UPDATE students SET
      coins    = coins    - v_total_coins,
      diamonds = COALESCE(diamonds, 0) - v_total_diamonds
    WHERE id = v_student.id;
  END IF;

  SELECT COALESCE(SUM(weight_bp), 0) INTO v_sub_total_bp
    FROM chest_subpercent_weights WHERE chest_key = v_chest.chest_key;
  v_sub_main_bp := 10000 - v_sub_total_bp;

  v_per_item_cost_coins    := CASE WHEN v_is_grant THEN 0 ELSE (v_total_coins    / v_count) END;
  v_per_item_cost_diamonds := CASE WHEN v_is_grant THEN 0 ELSE (v_total_diamonds / v_count) END;

  FOR v_i IN 1..v_count LOOP
    v_roll_bp := _crypto_rand_int(10000);

    IF v_roll_bp >= v_sub_main_bp THEN
      v_sub_rare_bp := v_roll_bp - v_sub_main_bp;
      SELECT rarity INTO v_rarity
      FROM (
        SELECT rarity, SUM(weight_bp) OVER (ORDER BY rarity) AS cum
        FROM chest_subpercent_weights WHERE chest_key = v_chest.chest_key
      ) t
      WHERE cum > v_sub_rare_bp
      ORDER BY cum LIMIT 1;
      IF v_rarity IS NULL THEN v_rarity := 'mythic'; END IF;
    ELSE
      -- Main >=1% tiers (same logic as the original v2 chest function).
      DECLARE
        v_pct_sum INTEGER;
        v_acc     INTEGER := 0;
        v_target  INTEGER;
      BEGIN
        v_pct_sum := v_chest.drop_common + v_chest.drop_uncommon + v_chest.drop_rare
                   + v_chest.drop_epic + v_chest.drop_legendary + v_chest.drop_mythic + v_chest.drop_unknown;
        IF v_pct_sum = 0 THEN v_pct_sum := 100; END IF;
        v_target := (v_roll_bp::BIGINT * v_pct_sum / GREATEST(v_sub_main_bp, 1))::INTEGER;

        v_acc := v_acc + v_chest.drop_common;     IF v_target < v_acc THEN v_rarity := 'common';
        ELSE v_acc := v_acc + v_chest.drop_uncommon; IF v_target < v_acc THEN v_rarity := 'uncommon';
        ELSE v_acc := v_acc + v_chest.drop_rare;     IF v_target < v_acc THEN v_rarity := 'rare';
        ELSE v_acc := v_acc + v_chest.drop_epic;     IF v_target < v_acc THEN v_rarity := 'epic';
        ELSE v_acc := v_acc + v_chest.drop_legendary;IF v_target < v_acc THEN v_rarity := 'legendary';
        ELSE v_acc := v_acc + v_chest.drop_mythic;   IF v_target < v_acc THEN v_rarity := 'mythic';
        ELSE v_rarity := 'unknown';
        END IF; END IF; END IF; END IF; END IF; END IF;
      END;
    END IF;

    v_attempts := 0;
    v_pick     := NULL;
    LOOP
      SELECT si.id, si.name, si.rarity
        INTO v_pick
        FROM shop_items si
       WHERE si.rarity = v_rarity
         AND si.is_active = true
         AND (
           (v_chest.teacher_id IS NOT NULL AND si.teacher_id = v_chest.teacher_id)
           OR (v_chest.teacher_id IS NULL AND (si.teacher_id IS NULL OR si.teacher_id = v_student.teacher_id))
         )
         AND NOT EXISTS (
           SELECT 1 FROM student_inventory inv
           WHERE inv.student_id = v_student.id AND inv.item_id = si.id
         )
       ORDER BY random() LIMIT 1;

      EXIT WHEN v_pick.id IS NOT NULL;
      v_attempts := v_attempts + 1;
      EXIT WHEN v_attempts >= v_max_attempts;
    END LOOP;

    IF v_pick.id IS NULL THEN
      v_refund_coins := v_refund_coins
        + GREATEST(0, v_per_item_cost_coins    / 2)
        + GREATEST(0, v_per_item_cost_diamonds * 5);
      v_items := v_items || jsonb_build_object('item_id', NULL, 'item_name', '(coleção completa)', 'rarity', v_rarity, 'refunded', true);
      CONTINUE;
    END IF;

    INSERT INTO student_inventory (student_id, item_id) VALUES (v_student.id, v_pick.id);
    v_items := v_items || jsonb_build_object('item_id', v_pick.id, 'item_name', v_pick.name, 'rarity', v_pick.rarity, 'refunded', false);
  END LOOP;

  IF v_refund_coins > 0 THEN
    UPDATE students SET coins = coins + v_refund_coins WHERE id = v_student.id;
  END IF;

  INSERT INTO chest_openings (student_id, chest_type_id, items_received, bonus_coins)
  VALUES (v_student.id, v_chest.id, v_items, v_refund_coins);

  -- Mark the grant consumed.
  IF v_is_grant THEN
    UPDATE student_chest_grants SET opened_at = now() WHERE id = p_grant_id;
  END IF;

  PERFORM log_action(
    'open_chest', 'chest_types', v_chest.id, v_chest.name,
    jsonb_build_object(
      'chest_key', v_chest.chest_key, 'count', v_count,
      'paid_coins', v_total_coins, 'paid_diamonds', v_total_diamonds,
      'refunded_coins', v_refund_coins,
      'grant_id', p_grant_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'chest_name', v_chest.name,
    'tier', v_chest.tier,
    'items', v_items,
    'refunded_coins', v_refund_coins,
    'granted', v_is_grant
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_chest(TEXT, INTEGER, UUID) TO authenticated;

-- 6. distribute_weekly_rewards — the actual prize distribution.
--    Idempotent via weekly_rewards_log unique key.
CREATE OR REPLACE FUNCTION public.distribute_weekly_rewards(p_week_start DATE DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start  DATE := COALESCE(p_week_start, brt_week_start() - 7);
  v_tickets_ok  INTEGER := 0;
  v_chests_ok   INTEGER := 0;
  v_notifs      INTEGER := 0;
  v_row         RECORD;
  v_inserted_id BIGINT;
BEGIN
  -- ─── A. SALA / GERAL / PVP: top 1 each → ticket notification ───
  -- Tickets themselves are granted by grant_top1_creation_tickets (called from
  -- compute_weekly_rankings). Here we (a) log it and (b) post the notification.
  FOR v_row IN
    SELECT s.ranking_type, s.entity_id, s.entity_name, s.class_id, s.score
      FROM public.weekly_rankings_snapshot s
     WHERE s.week_start    = v_week_start
       AND s.ranking_type IN ('sala','geral','pvp')
       AND s.position      = 1
       AND s.score         > 0
  LOOP
    INSERT INTO public.weekly_rewards_log
      (week_start, ranking_type, entity_id, reward_kind, reward_payload)
    VALUES
      (v_week_start, v_row.ranking_type, v_row.entity_id, 'ticket',
       jsonb_build_object('score', v_row.score))
    ON CONFLICT (week_start, ranking_type, entity_id, reward_kind) DO NOTHING
    RETURNING id INTO v_inserted_id;

    IF v_inserted_id IS NOT NULL THEN
      v_tickets_ok := v_tickets_ok + 1;

      INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
      VALUES (
        v_row.entity_id, 'ticket',
        'Você conquistou um Ticket de Criação!',
        format('Parabéns! Você foi Top 1 em %s. Recompensa: 1 Ticket de Criação.',
               CASE v_row.ranking_type
                 WHEN 'sala'  THEN 'Sala'
                 WHEN 'geral' THEN 'Geral'
                 WHEN 'pvp'   THEN 'PvP'
               END),
        jsonb_build_object('ranking_type', v_row.ranking_type, 'week_start', v_week_start, 'score', v_row.score)
      );
      v_notifs := v_notifs + 1;
    END IF;

    v_inserted_id := NULL;
  END LOOP;

  -- ─── B. GUILDAS: each member of top 1 → free Mythic chest ───
  FOR v_row IN
    SELECT s.entity_id AS guild_id, s.entity_name AS guild_name, s.score, gm.student_id
      FROM public.weekly_rankings_snapshot s
      JOIN public.guild_members gm ON gm.guild_id = s.entity_id
     WHERE s.week_start    = v_week_start
       AND s.ranking_type  = 'guildas'
       AND s.position      = 1
       AND s.score         > 0
  LOOP
    INSERT INTO public.weekly_rewards_log
      (week_start, ranking_type, entity_id, reward_kind, reward_payload)
    VALUES
      (v_week_start, 'guildas', v_row.student_id, 'chest_grant',
       jsonb_build_object('chest_key', 'global_mythic', 'guild_id', v_row.guild_id, 'guild_name', v_row.guild_name, 'score', v_row.score))
    ON CONFLICT (week_start, ranking_type, entity_id, reward_kind) DO NOTHING
    RETURNING id INTO v_inserted_id;

    IF v_inserted_id IS NOT NULL THEN
      INSERT INTO public.student_chest_grants (student_id, chest_key, reason, source_payload)
      VALUES (
        v_row.student_id, 'global_mythic',
        format('Top 1 Guilda — %s (semana %s)', v_row.guild_name, v_week_start::text),
        jsonb_build_object('guild_id', v_row.guild_id, 'week_start', v_week_start)
      );
      v_chests_ok := v_chests_ok + 1;

      INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
      VALUES (
        v_row.student_id, 'chest_grant',
        'Baú Mítico para a guilda vencedora!',
        format('Parabéns! Sua guilda %s foi Top 1 da semana. Recompensa: 1 Baú Mítico (grátis).', v_row.guild_name),
        jsonb_build_object('chest_key', 'global_mythic', 'guild_id', v_row.guild_id, 'week_start', v_week_start)
      );
      v_notifs := v_notifs + 1;
    END IF;

    v_inserted_id := NULL;
  END LOOP;

  BEGIN
    PERFORM public.log_action(
      'distribute_weekly_rewards', NULL, NULL, NULL,
      jsonb_build_object(
        'week_start', v_week_start,
        'tickets_logged', v_tickets_ok,
        'chests_granted', v_chests_ok,
        'notifications_sent', v_notifs
      )
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'week_start', v_week_start,
    'tickets_logged', v_tickets_ok,
    'chests_granted', v_chests_ok,
    'notifications_sent', v_notifs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.distribute_weekly_rewards(DATE) TO authenticated;

-- 7. Student-facing reward inbox RPCs.
CREATE OR REPLACE FUNCTION public.get_my_pending_rewards()
RETURNS TABLE (
  id UUID, kind TEXT, title TEXT, body TEXT, payload JSONB, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT s.id INTO v_sid FROM public.students s WHERE s.user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT r.id, r.kind, r.title, r.body, r.payload, r.created_at
    FROM public.student_pending_rewards r
   WHERE r.student_id = v_sid AND r.claimed_at IS NULL
   ORDER BY r.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_pending_rewards() TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_my_pending_rewards(p_ids UUID[] DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_sid UUID;
  v_count INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;
  SELECT s.id INTO v_sid FROM public.students s WHERE s.user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN 0; END IF;

  IF p_ids IS NULL OR cardinality(p_ids) = 0 THEN
    UPDATE public.student_pending_rewards
       SET claimed_at = now()
     WHERE student_id = v_sid AND claimed_at IS NULL;
  ELSE
    UPDATE public.student_pending_rewards
       SET claimed_at = now()
     WHERE student_id = v_sid AND claimed_at IS NULL AND id = ANY(p_ids);
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_my_pending_rewards(UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_chest_grants()
RETURNS TABLE (id UUID, chest_key TEXT, reason TEXT, granted_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT s.id INTO v_sid FROM public.students s WHERE s.user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT g.id, g.chest_key, g.reason, g.granted_at
    FROM public.student_chest_grants g
   WHERE g.student_id = v_sid AND g.opened_at IS NULL
   ORDER BY g.granted_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_chest_grants() TO authenticated;

-- 8. Cron schedule for the distributor (Monday 00:05 BRT = 03:05 UTC).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('distribute_weekly_rewards')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'distribute_weekly_rewards');
    PERFORM cron.schedule(
      'distribute_weekly_rewards',
      '5 3 * * 1',
      $cron$SELECT public.distribute_weekly_rewards();$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$$;
