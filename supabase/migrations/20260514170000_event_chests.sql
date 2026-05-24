-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 5.2 — Event-themed chests with custom card pools.
--
-- Extends chest_types with card_pool (JSONB) — when set, the chest ignores
-- the rarity-bucket randomizer and instead samples directly from a weighted
-- list of shop_item ids. Useful for tightly curated event drops.
--
-- card_pool format:
--   [
--     { "shop_item_id": "<uuid>", "weight": <int> },
--     ...
--   ]
-- Weights are summed and rolled proportionally. Items already owned by the
-- student are skipped (with up to N re-rolls); if exhausted, refund kicks in
-- with the same formula as the rarity-based path.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.chest_types
  ADD COLUMN IF NOT EXISTS card_pool JSONB;

CREATE INDEX IF NOT EXISTS idx_chest_types_card_pool
  ON public.chest_types ((card_pool IS NOT NULL))
  WHERE card_pool IS NOT NULL;

-- Master RPC: create or update an event-themed chest. Idempotent on chest_key.
CREATE OR REPLACE FUNCTION public.master_upsert_event_chest(
  p_event_id      UUID,
  p_chest_key     TEXT,
  p_name          TEXT,
  p_tier          INTEGER DEFAULT 3,
  p_cost_coins    INTEGER DEFAULT 0,
  p_cost_diamonds INTEGER DEFAULT 0,
  p_min_level     INTEGER DEFAULT 1,
  p_description   TEXT    DEFAULT NULL,
  p_card_pool     JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id     UUID;
  v_evt_st TEXT;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  IF p_event_id IS NULL OR p_chest_key IS NULL OR p_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Parâmetros obrigatórios ausentes');
  END IF;
  SELECT status INTO v_evt_st FROM public.events WHERE id = p_event_id;
  IF v_evt_st IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Evento não encontrado'); END IF;

  -- Insert or update by (chest_key, event_id) — chest_key alone is also unique
  -- for global chests via partial index in 3.2; we add an event-scoped lookup.
  INSERT INTO public.chest_types (
    teacher_id, event_id, chest_key, name, tier, description,
    cost_coins, cost_diamonds, min_level, min_items, max_items,
    drop_common, drop_uncommon, drop_rare, drop_epic, drop_legendary, drop_mythic, drop_unknown,
    is_active, card_pool
  )
  VALUES (
    NULL, p_event_id, p_chest_key, p_name, COALESCE(p_tier, 3), p_description,
    COALESCE(p_cost_coins, 0), COALESCE(p_cost_diamonds, 0), COALESCE(p_min_level, 1),
    1, 1,
    -- Default rarity weights for chests *without* a custom pool. These
    -- mirror global_rare's payout. Ignored entirely when card_pool is set.
    0, 50, 35, 10, 4, 1, 0,
    -- is_active follows event lifecycle: active while event is, otherwise off.
    (v_evt_st = 'active'),
    p_card_pool
  )
  ON CONFLICT (chest_key)
  WHERE teacher_id IS NULL
  DO UPDATE SET
    event_id      = EXCLUDED.event_id,
    name          = EXCLUDED.name,
    tier          = EXCLUDED.tier,
    description   = EXCLUDED.description,
    cost_coins    = EXCLUDED.cost_coins,
    cost_diamonds = EXCLUDED.cost_diamonds,
    min_level     = EXCLUDED.min_level,
    card_pool     = EXCLUDED.card_pool,
    is_active     = EXCLUDED.is_active
  RETURNING id INTO v_id;

  BEGIN
    PERFORM log_action('master_upsert_event_chest', 'chest_types', v_id, p_name,
      jsonb_build_object('event_id', p_event_id, 'chest_key', p_chest_key));
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN jsonb_build_object('success', true, 'chest_id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_upsert_event_chest(UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, JSONB) TO authenticated;

-- Master RPC: list shop_items eligible to be attached to an event (the master
-- needs a quick picker when authoring card_pool).
CREATE OR REPLACE FUNCTION public.list_event_eligible_items(p_event_id UUID)
RETURNS TABLE (id UUID, name TEXT, rarity TEXT, image_url TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_caller_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT si.id, si.name, si.rarity, si.image_url
    FROM public.shop_items si
   WHERE si.is_active = true
     AND (si.event_id = p_event_id OR si.event_id IS NULL)
   ORDER BY si.name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_event_eligible_items(UUID) TO authenticated;

-- ── Patch open_chest with weighted card_pool support ──────────────────────────
DROP FUNCTION IF EXISTS public.open_chest(TEXT, INTEGER, UUID);
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
  v_pool_total      BIGINT;
  v_pool_roll       BIGINT;
  v_pool_pick_id    UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501'; END IF;
  v_count := COALESCE(p_count, 1);
  IF v_count NOT IN (1, 10) THEN RAISE EXCEPTION 'count_must_be_1_or_10' USING ERRCODE = '22023'; END IF;
  IF v_count = 10 THEN v_discount_pct := 5; END IF;

  SELECT * INTO v_student FROM students WHERE user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0002'; END IF;

  IF p_grant_id IS NOT NULL THEN
    SELECT * INTO v_grant_row FROM student_chest_grants
     WHERE id = p_grant_id AND student_id = v_student.id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'grant_not_found' USING ERRCODE = 'P0002'; END IF;
    IF v_grant_row.opened_at IS NOT NULL THEN RAISE EXCEPTION 'grant_already_used' USING ERRCODE = '22023'; END IF;
    IF v_grant_row.chest_key <> p_chest_key THEN RAISE EXCEPTION 'grant_chest_mismatch' USING ERRCODE = '22023'; END IF;
    IF v_count <> 1 THEN RAISE EXCEPTION 'grant_count_must_be_1' USING ERRCODE = '22023'; END IF;
    v_is_grant := TRUE;
  END IF;

  SELECT * INTO v_chest FROM chest_types
   WHERE chest_key = p_chest_key AND is_active = true
   ORDER BY (teacher_id IS NULL) DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'chest_not_found' USING ERRCODE = 'P0002'; END IF;

  IF v_is_grant THEN
    v_total_coins := 0; v_total_diamonds := 0;
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

    -- ── Path A: custom card_pool (event chests). ──
    IF v_chest.card_pool IS NOT NULL AND jsonb_typeof(v_chest.card_pool) = 'array'
       AND jsonb_array_length(v_chest.card_pool) > 0 THEN

      SELECT COALESCE(SUM((entry->>'weight')::INT), 0)
        INTO v_pool_total
        FROM jsonb_array_elements(v_chest.card_pool) AS entry;

      IF v_pool_total <= 0 THEN
        -- Misconfigured pool; refund.
        v_refund_coins := v_refund_coins
          + GREATEST(0, v_per_item_cost_coins / 2)
          + GREATEST(0, v_per_item_cost_diamonds * 5);
        v_items := v_items || jsonb_build_object('item_id', NULL, 'item_name', '(pool vazio)', 'rarity', NULL, 'refunded', true);
        CONTINUE;
      END IF;

      v_attempts := 0; v_pick := NULL;
      LOOP
        v_pool_roll := floor(random() * v_pool_total)::BIGINT;
        v_pool_pick_id := NULL;

        SELECT (entry->>'shop_item_id')::UUID
          INTO v_pool_pick_id
          FROM (
            SELECT entry,
                   SUM((entry->>'weight')::INT)
                     OVER (ORDER BY ord)        AS cum
              FROM (
                SELECT row_number() OVER () AS ord, e AS entry
                  FROM jsonb_array_elements(v_chest.card_pool) e
              ) z
          ) t
         WHERE t.cum > v_pool_roll
         ORDER BY t.cum LIMIT 1;

        IF v_pool_pick_id IS NULL THEN EXIT; END IF;

        SELECT si.id, si.name, si.rarity
          INTO v_pick
          FROM shop_items si
         WHERE si.id = v_pool_pick_id
           AND si.is_active = true
           AND NOT EXISTS (
             SELECT 1 FROM student_inventory inv
              WHERE inv.student_id = v_student.id AND inv.item_id = si.id
           )
         LIMIT 1;
        EXIT WHEN v_pick.id IS NOT NULL;

        v_attempts := v_attempts + 1;
        EXIT WHEN v_attempts >= v_max_attempts;
      END LOOP;

      IF v_pick.id IS NULL THEN
        v_refund_coins := v_refund_coins
          + GREATEST(0, v_per_item_cost_coins / 2)
          + GREATEST(0, v_per_item_cost_diamonds * 5);
        v_items := v_items || jsonb_build_object('item_id', NULL, 'item_name', '(coleção do evento completa)', 'rarity', NULL, 'refunded', true);
        CONTINUE;
      END IF;

      INSERT INTO student_inventory (student_id, item_id) VALUES (v_student.id, v_pick.id);
      v_items := v_items || jsonb_build_object('item_id', v_pick.id, 'item_name', v_pick.name, 'rarity', v_pick.rarity, 'refunded', false);
      CONTINUE; -- next iteration
    END IF;

    -- ── Path B: standard rarity-based picker. ──
    v_roll_bp := _crypto_rand_int(10000);
    IF v_roll_bp >= v_sub_main_bp THEN
      v_sub_rare_bp := v_roll_bp - v_sub_main_bp;
      SELECT rarity INTO v_rarity FROM (
        SELECT rarity, SUM(weight_bp) OVER (ORDER BY rarity) AS cum
        FROM chest_subpercent_weights WHERE chest_key = v_chest.chest_key
      ) t WHERE cum > v_sub_rare_bp ORDER BY cum LIMIT 1;
      IF v_rarity IS NULL THEN v_rarity := 'mythic'; END IF;
    ELSE
      DECLARE v_pct_sum INTEGER; v_acc INTEGER := 0; v_target INTEGER;
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

    v_attempts := 0; v_pick := NULL;
    LOOP
      SELECT si.id, si.name, si.rarity
        INTO v_pick
        FROM shop_items si
       WHERE si.rarity = v_rarity
         AND si.is_active = true
         AND (
           si.is_event_exclusive = false
           OR (si.event_id IS NOT NULL AND si.event_id = v_chest.event_id)
         )
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
        + GREATEST(0, v_per_item_cost_coins / 2)
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

  IF v_is_grant THEN
    UPDATE student_chest_grants SET opened_at = now() WHERE id = p_grant_id;
  END IF;

  PERFORM log_action(
    'open_chest', 'chest_types', v_chest.id, v_chest.name,
    jsonb_build_object('chest_key', v_chest.chest_key, 'count', v_count,
                       'paid_coins', v_total_coins, 'paid_diamonds', v_total_diamonds,
                       'refunded_coins', v_refund_coins, 'grant_id', p_grant_id,
                       'pool_mode', (v_chest.card_pool IS NOT NULL))
  );

  RETURN jsonb_build_object('success', true, 'chest_name', v_chest.name, 'tier', v_chest.tier,
                            'items', v_items, 'refunded_coins', v_refund_coins, 'granted', v_is_grant);
END;
$$;
GRANT EXECUTE ON FUNCTION public.open_chest(TEXT, INTEGER, UUID) TO authenticated;
