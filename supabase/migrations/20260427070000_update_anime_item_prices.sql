-- Update anime item economy and keep diamond prices at 10 coins = 1 diamond.

ALTER TABLE public.shop_items
  ALTER COLUMN diamond_cost TYPE NUMERIC(10,1) USING diamond_cost::NUMERIC(10,1),
  ALTER COLUMN diamond_cost SET DEFAULT 0;

ALTER TABLE public.students
  ALTER COLUMN diamonds TYPE NUMERIC(10,1) USING diamonds::NUMERIC(10,1),
  ALTER COLUMN diamonds SET DEFAULT 0;

UPDATE public.shop_items
SET
  cost = CASE rarity
    WHEN 'common' THEN 50
    WHEN 'uncommon' THEN 125
    WHEN 'rare' THEN 200
    WHEN 'epic' THEN 400
    WHEN 'legendary' THEN 700
    WHEN 'mythic' THEN 1000
    WHEN 'unknown' THEN 1500
    ELSE cost
  END,
  diamond_cost = CASE rarity
    WHEN 'common' THEN 5
    WHEN 'uncommon' THEN 12.5
    WHEN 'rare' THEN 20
    WHEN 'epic' THEN 40
    WHEN 'legendary' THEN 70
    WHEN 'mythic' THEN 100
    WHEN 'unknown' THEN 150
    ELSE diamond_cost
  END
WHERE source_anime IS NOT NULL;

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
  v_cost             INTEGER;
  v_diamond_cost     NUMERIC(10,1);
  v_is_active        BOOLEAN;
  v_forca            INTEGER;
  v_destreza         INTEGER;
  v_inteligencia     INTEGER;
  v_carisma          INTEGER;
  v_agilidade        INTEGER;
  v_resistencia      INTEGER;
  v_student_coins    INTEGER;
  v_student_diamonds NUMERIC(10,1);
BEGIN
  SELECT cost, diamond_cost, is_active,
         attr_forca, attr_destreza, attr_inteligencia,
         attr_carisma, attr_agilidade, attr_resistencia
  INTO v_cost, v_diamond_cost, v_is_active,
       v_forca, v_destreza, v_inteligencia,
       v_carisma, v_agilidade, v_resistencia
  FROM shop_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item nao encontrado');
  END IF;

  IF NOT v_is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item nao disponivel');
  END IF;

  SELECT coins, COALESCE(diamonds, 0)
  INTO v_student_coins, v_student_diamonds
  FROM students
  WHERE id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aluno nao encontrado');
  END IF;

  IF p_use_diamonds THEN
    IF v_diamond_cost <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este item nao pode ser comprado com diamantes');
    END IF;

    IF v_student_diamonds < v_diamond_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Diamantes insuficientes');
    END IF;

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

  INSERT INTO student_inventory (student_id, item_id)
  VALUES (p_student_id, p_item_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION purchase_item(UUID, UUID, BOOLEAN) TO anon, authenticated;
