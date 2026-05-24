-- ============================================================
-- Patch 3.2 — Chest system v2
--
-- Builds on the existing 20260322030000_chest_system. Adds:
--   - Global chests (teacher_id NULL = system chest available to all)
--   - The ??? (unknown) rarity tier
--   - chest_key (stable id for client-side reference)
--   - Multi-open with 5% discount at count=10
--   - Duplicate handling: re-roll up to 10× inside same rarity, then
--     refund 50% of the cost-per-item as coins if still colliding
--   - Cryptographic RNG via gen_random_bytes
-- ============================================================

-- 1. Allow 'unknown' rarity in shop_items
ALTER TABLE public.shop_items DROP CONSTRAINT IF EXISTS shop_items_rarity_check;
ALTER TABLE public.shop_items ADD CONSTRAINT shop_items_rarity_check
  CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'));

-- 2. Schema extensions
ALTER TABLE public.chest_types ALTER COLUMN teacher_id DROP NOT NULL;
ALTER TABLE public.chest_types ADD COLUMN IF NOT EXISTS chest_key   TEXT;
ALTER TABLE public.chest_types ADD COLUMN IF NOT EXISTS drop_unknown INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_chest_types_global_key
  ON public.chest_types (chest_key) WHERE teacher_id IS NULL;

-- 3. Seed the 3 global chests (idempotent via chest_key + WHERE teacher_id IS NULL).
-- Probabilities are stored as INTEGER × 100 in the existing columns, so we
-- use the *_BASE_POINTS convention: 70% → 70, 0.09% → preserved by jumping
-- to the FALLBACK arm of the percentile dispatcher in the RPC. To stay
-- compatible we keep the granularity at 1% here and let the RPC special-case
-- the < 1% tiers via a separate weight table (chest_subpercent_weights).
INSERT INTO public.chest_types (
  teacher_id, chest_key, name, tier, description,
  cost_coins, cost_diamonds,
  min_level, min_items, max_items,
  drop_common, drop_uncommon, drop_rare, drop_epic,
  drop_legendary, drop_mythic, drop_unknown,
  is_active
)
SELECT NULL::UUID, 'global_common',  'Baú Comum',  1, 'Disponível pra todos. Maior chance de Comum/Incomum.',
       200, 0, 1, 1, 1,
       70, 25, 4, 1, 0, 0, 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.chest_types WHERE teacher_id IS NULL AND chest_key = 'global_common');

INSERT INTO public.chest_types (
  teacher_id, chest_key, name, tier, description,
  cost_coins, cost_diamonds, min_level, min_items, max_items,
  drop_common, drop_uncommon, drop_rare, drop_epic,
  drop_legendary, drop_mythic, drop_unknown, is_active
)
SELECT NULL, 'global_rare', 'Baú Raro', 2, 'Foco em Rara e Épica. Pequena chance de Mítica.',
       0, 50, 1, 1, 1,
       0, 30, 50, 15, 4, 1, 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.chest_types WHERE teacher_id IS NULL AND chest_key = 'global_rare');

INSERT INTO public.chest_types (
  teacher_id, chest_key, name, tier, description,
  cost_coins, cost_diamonds, min_level, min_items, max_items,
  drop_common, drop_uncommon, drop_rare, drop_epic,
  drop_legendary, drop_mythic, drop_unknown, is_active
)
SELECT NULL, 'global_mythic', 'Baú Mítico', 3, 'Apenas raridades altas. Única forma de pegar ???.',
       0, 200, 1, 1, 1,
       0, 0, 30, 40, 25, 4, 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.chest_types WHERE teacher_id IS NULL AND chest_key = 'global_mythic');

-- 4. Sub-percent weight table — for the <1% tiers we can't express in
-- INTEGER %. RPC reads this BEFORE the rough INTEGER buckets for the
-- listed chest_keys; the rough buckets handle the >1% tiers.
CREATE TABLE IF NOT EXISTS public.chest_subpercent_weights (
  chest_key   TEXT    NOT NULL,
  rarity      TEXT    NOT NULL,
  weight_bp   INTEGER NOT NULL,  -- basis points (1 bp = 0.01%)
  PRIMARY KEY (chest_key, rarity)
);

ALTER TABLE public.chest_subpercent_weights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads chest weights" ON public.chest_subpercent_weights;
CREATE POLICY "Anyone reads chest weights"
  ON public.chest_subpercent_weights FOR SELECT USING (true);

-- Per the prompt's distributions:
--   Common chest:  legendary 0.09% (9 bp), mythic 0.01% (1 bp)
--   Rare chest:    mythic 0.95% (95 bp), unknown 0.05% (5 bp)
--   Mythic chest:  mythic 4.5% (450 bp), unknown 0.5% (50 bp)
-- Insert idempotent.
INSERT INTO public.chest_subpercent_weights (chest_key, rarity, weight_bp) VALUES
  ('global_common', 'legendary', 9),
  ('global_common', 'mythic',    1),
  ('global_rare',   'mythic',    95),
  ('global_rare',   'unknown',   5),
  ('global_mythic', 'mythic',    450),
  ('global_mythic', 'unknown',   50)
ON CONFLICT (chest_key, rarity) DO UPDATE SET weight_bp = EXCLUDED.weight_bp;

-- 5. Helper: cryptographically-seeded random in [0, n)
CREATE OR REPLACE FUNCTION public._crypto_rand_int(p_n INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_n <= 0 THEN RETURN 0; END IF;
  -- 4 bytes → uint32, mod n. Slight modulo bias for non-power-of-2 n but
  -- well under 1 LSB at our scale (n ≤ 10 000).
  RETURN (
    (get_byte(gen_random_bytes(4), 0)::BIGINT << 24)
  | (get_byte(gen_random_bytes(4), 1)::BIGINT << 16)
  | (get_byte(gen_random_bytes(4), 2)::BIGINT << 8)
  |  get_byte(gen_random_bytes(4), 3)::BIGINT
  ) % p_n;
END;
$$;
GRANT EXECUTE ON FUNCTION public._crypto_rand_int(INTEGER) TO authenticated;

-- 6. Rewrite open_chest:
--    - identifies the chest by key (preferred) OR id
--    - accepts p_count (1 or 10)
--    - applies 5% discount for count=10
--    - duplicate handling: re-roll inside same rarity ≤10x; if still
--      collides, refund the per-item cost / 2 as coins
--    - returns full items array + refund total

DROP FUNCTION IF EXISTS public.open_chest(UUID, UUID);
CREATE OR REPLACE FUNCTION public.open_chest(
  p_chest_key TEXT,
  p_count     INTEGER DEFAULT 1
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
  v_roll_bp         INTEGER;  -- 0..9999
  v_sub_total_bp    INTEGER;
  v_sub_rare_bp     INTEGER;
  v_sub_main_bp     INTEGER;  -- 10000 - sub_total
  v_i               INTEGER;
  v_attempts        INTEGER;
  v_max_attempts    CONSTANT INTEGER := 10;
  v_discount_pct    INTEGER := 0;
  v_per_item_cost_coins INTEGER;
  v_per_item_cost_diamonds INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  v_count := COALESCE(p_count, 1);
  IF v_count NOT IN (1, 10) THEN
    RAISE EXCEPTION 'count_must_be_1_or_10' USING ERRCODE = '22023';
  END IF;
  IF v_count = 10 THEN v_discount_pct := 5; END IF;

  SELECT * INTO v_student FROM students WHERE user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Resolve chest by key. Global (teacher_id IS NULL) preferred; else any with the key.
  SELECT * INTO v_chest FROM chest_types
   WHERE chest_key = p_chest_key AND is_active = true
   ORDER BY (teacher_id IS NULL) DESC  -- prefer global
   LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'chest_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_total_coins    := v_chest.cost_coins    * v_count * (100 - v_discount_pct) / 100;
  v_total_diamonds := v_chest.cost_diamonds * v_count * (100 - v_discount_pct) / 100;

  IF v_total_coins    > 0 AND v_student.coins    < v_total_coins
  OR v_total_diamonds > 0 AND COALESCE(v_student.diamonds, 0) < v_total_diamonds THEN
    RAISE EXCEPTION 'insufficient_balance' USING ERRCODE = '22023';
  END IF;

  -- Atomic debit
  UPDATE students SET
    coins    = coins    - v_total_coins,
    diamonds = COALESCE(diamonds, 0) - v_total_diamonds
  WHERE id = v_student.id;

  -- Sub-percent weights for this chest (∑ in bp).
  SELECT COALESCE(SUM(weight_bp), 0) INTO v_sub_total_bp
  FROM chest_subpercent_weights WHERE chest_key = v_chest.chest_key;
  v_sub_main_bp := 10000 - v_sub_total_bp;

  v_per_item_cost_coins    := (v_total_coins    / v_count);
  v_per_item_cost_diamonds := (v_total_diamonds / v_count);

  FOR v_i IN 1..v_count LOOP
    v_roll_bp := _crypto_rand_int(10000); -- 0..9999

    -- First check sub-percent tiers (legendary <1%, mythic <1%, unknown <1%).
    IF v_roll_bp >= v_sub_main_bp THEN
      -- Inside the sub-percent slice — pick which sub-tier proportionally.
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
      -- Main >=1% tiers, distributed by drop_* INTEGER percentages over v_sub_main_bp.
      DECLARE
        v_pct_sum INTEGER;
        v_acc     INTEGER := 0;
        v_target  INTEGER;
      BEGIN
        v_pct_sum := v_chest.drop_common + v_chest.drop_uncommon + v_chest.drop_rare
                   + v_chest.drop_epic + v_chest.drop_legendary + v_chest.drop_mythic + v_chest.drop_unknown;
        IF v_pct_sum = 0 THEN v_pct_sum := 100; END IF;
        v_target := (v_roll_bp::BIGINT * v_pct_sum / v_sub_main_bp)::INTEGER;

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

    -- Pick an item of the rolled rarity that the student does NOT already own.
    -- Re-roll within rarity up to N times. Items come from the chest's owning
    -- teacher if set; otherwise from the calling student's teacher pool.
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
          OR (v_chest.teacher_id IS NULL AND si.teacher_id = v_student.teacher_id)
        )
        AND NOT EXISTS (
          SELECT 1 FROM student_inventory inv
          WHERE inv.student_id = v_student.id AND inv.item_id = si.id
        )
      ORDER BY random()
      LIMIT 1;

      EXIT WHEN v_pick.id IS NOT NULL;
      v_attempts := v_attempts + 1;
      EXIT WHEN v_attempts >= v_max_attempts;
    END LOOP;

    IF v_pick.id IS NULL THEN
      -- Refund half the per-item cost as coins (we always refund in coins,
      -- even for diamond chests, because that's the wallet most students
      -- can immediately spend).
      v_refund_coins := v_refund_coins
        + GREATEST(0, v_per_item_cost_coins    / 2)
        + GREATEST(0, v_per_item_cost_diamonds * 5);  -- 1 diamond ≈ 10 coins
      v_items := v_items || jsonb_build_object(
        'item_id', NULL,
        'item_name', '(coleção completa)',
        'rarity', v_rarity,
        'refunded', true
      );
      CONTINUE;
    END IF;

    INSERT INTO student_inventory (student_id, item_id)
    VALUES (v_student.id, v_pick.id);

    v_items := v_items || jsonb_build_object(
      'item_id', v_pick.id,
      'item_name', v_pick.name,
      'rarity', v_pick.rarity,
      'refunded', false
    );
  END LOOP;

  IF v_refund_coins > 0 THEN
    UPDATE students SET coins = coins + v_refund_coins WHERE id = v_student.id;
  END IF;

  INSERT INTO chest_openings (student_id, chest_type_id, items_received, bonus_coins)
  VALUES (v_student.id, v_chest.id, v_items, v_refund_coins);

  -- Audit
  PERFORM log_action(
    'open_chest', 'chest_types', v_chest.id, v_chest.name,
    jsonb_build_object(
      'chest_key', v_chest.chest_key,
      'count', v_count,
      'paid_coins', v_total_coins,
      'paid_diamonds', v_total_diamonds,
      'refunded_coins', v_refund_coins,
      'items', v_items
    )
  );

  RETURN jsonb_build_object(
    'success',        true,
    'chest_key',      v_chest.chest_key,
    'count',          v_count,
    'paid_coins',     v_total_coins,
    'paid_diamonds',  v_total_diamonds,
    'refunded_coins', v_refund_coins,
    'items',          v_items
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.open_chest(TEXT, INTEGER) TO authenticated;
