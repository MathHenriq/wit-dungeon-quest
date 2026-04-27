-- ─────────────────────────────────────────────────────────────────────────────
-- Diamonds currency: add diamond_cost to shop_items
-- and update purchase_item RPC to support diamond payment
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add diamond_cost column to shop_items
ALTER TABLE public.shop_items
  ADD COLUMN IF NOT EXISTS diamond_cost INTEGER NOT NULL DEFAULT 0;

-- 2. Replace purchase_item to support buying with diamonds
CREATE OR REPLACE FUNCTION purchase_item(
  p_student_id   UUID,
  p_item_id      UUID,
  p_use_diamonds BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cost            INTEGER;
  v_diamond_cost    INTEGER;
  v_is_active       BOOLEAN;
  v_forca           INTEGER;
  v_destreza        INTEGER;
  v_inteligencia    INTEGER;
  v_carisma         INTEGER;
  v_agilidade       INTEGER;
  v_resistencia     INTEGER;
  v_student_coins   INTEGER;
  v_student_diamonds INTEGER;
BEGIN
  -- Fetch item
  SELECT cost, diamond_cost, is_active,
         attr_forca, attr_destreza, attr_inteligencia,
         attr_carisma, attr_agilidade, attr_resistencia
  INTO v_cost, v_diamond_cost, v_is_active,
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

  -- Fetch student wallet (with lock to prevent race conditions)
  SELECT coins, COALESCE(diamonds, 0)
  INTO v_student_coins, v_student_diamonds
  FROM students
  WHERE id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aluno não encontrado');
  END IF;

  IF p_use_diamonds THEN
    -- Validate diamond cost is configured
    IF v_diamond_cost <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este item não pode ser comprado com diamantes');
    END IF;

    IF v_student_diamonds < v_diamond_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Diamantes insuficientes');
    END IF;

    -- Deduct diamonds and apply attribute bonuses
    UPDATE students
    SET
      diamonds          = diamonds          - v_diamond_cost,
      attr_forca        = attr_forca        + v_forca,
      attr_destreza     = attr_destreza     + v_destreza,
      attr_inteligencia = attr_inteligencia + v_inteligencia,
      attr_carisma      = attr_carisma      + v_carisma,
      attr_agilidade    = attr_agilidade    + v_agilidade,
      attr_resistencia  = attr_resistencia  + v_resistencia
    WHERE id = p_student_id;
  ELSE
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
  END IF;

  -- Add to inventory
  INSERT INTO student_inventory (student_id, item_id)
  VALUES (p_student_id, p_item_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION purchase_item(UUID, UUID, BOOLEAN) TO anon, authenticated;
