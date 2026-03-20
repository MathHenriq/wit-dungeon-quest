-- Migration: Shop & Inventory features
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add category + attribute columns to shop_items
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE shop_items
  ADD COLUMN IF NOT EXISTS category      TEXT NOT NULL DEFAULT 'colecao',
  ADD COLUMN IF NOT EXISTS attr_forca       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_destreza    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_inteligencia INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_carisma     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_agilidade   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_resistencia INTEGER NOT NULL DEFAULT 0;

-- Category check constraint
ALTER TABLE shop_items
  DROP CONSTRAINT IF EXISTS shop_items_category_check;
ALTER TABLE shop_items
  ADD CONSTRAINT shop_items_category_check
    CHECK (category IN ('armamento','armadura','utilizavel','colecao','habilidade','token'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add attribute columns to students
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS attr_forca        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_destreza     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_inteligencia INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_carisma      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_agilidade    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attr_resistencia  INTEGER NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Allow multiple purchases of the same item (needed for tokens)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE student_inventory
  DROP CONSTRAINT IF EXISTS student_inventory_student_id_item_id_key;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPC: purchase_item — atomic coin deduction + inventory insert + attr apply
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION purchase_item(
  p_student_id UUID,
  p_item_id    UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cost            INTEGER;
  v_is_active       BOOLEAN;
  v_forca           INTEGER;
  v_destreza        INTEGER;
  v_inteligencia    INTEGER;
  v_carisma         INTEGER;
  v_agilidade       INTEGER;
  v_resistencia     INTEGER;
  v_student_coins   INTEGER;
BEGIN
  -- Fetch item
  SELECT cost, is_active,
         attr_forca, attr_destreza, attr_inteligencia,
         attr_carisma, attr_agilidade, attr_resistencia
  INTO v_cost, v_is_active,
       v_forca, v_destreza, v_inteligencia,
       v_carisma, v_agilidade, v_resistencia
  FROM shop_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item não encontrado');
  END IF;

  IF NOT v_is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item não disponível');
  END IF;

  -- Fetch student coins (with lock to prevent race conditions)
  SELECT coins INTO v_student_coins
  FROM students
  WHERE id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aluno não encontrado');
  END IF;

  IF v_student_coins < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  -- Deduct coins and apply attribute bonuses
  UPDATE students
  SET
    coins             = coins             - v_cost,
    attr_forca        = attr_forca        + v_forca,
    attr_destreza     = attr_destreza     + v_destreza,
    attr_inteligencia = attr_inteligencia + v_inteligencia,
    attr_carisma      = attr_carisma      + v_carisma,
    attr_agilidade    = attr_agilidade    + v_agilidade,
    attr_resistencia  = attr_resistencia  + v_resistencia
  WHERE id = p_student_id;

  -- Add to inventory
  INSERT INTO student_inventory (student_id, item_id)
  VALUES (p_student_id, p_item_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Allow anon and authenticated users to call this RPC
GRANT EXECUTE ON FUNCTION purchase_item TO anon, authenticated;
