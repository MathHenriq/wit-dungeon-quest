-- apply_battle_materials was failing at the INSERT...ON CONFLICT step with
-- "column reference 'material_id' is ambiguous". The function returns a
-- TABLE with an out column named material_id, which shadows the same-named
-- column on student_inventory_materials inside the function body. When the
-- planner sees `ON CONFLICT (student_id, material_id)`, it can't decide
-- which `material_id` we mean.
--
-- Fix: rename every OUT column to an unambiguous out_* alias.

DROP FUNCTION IF EXISTS public.apply_battle_materials(UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.apply_battle_materials(
  p_student_id UUID,
  p_enemy_id   UUID,
  p_floor_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  out_material_id UUID,
  out_name        TEXT,
  out_rarity      material_rarity,
  out_theme       TEXT,
  out_icon_url    TEXT,
  out_quantity    INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_is_boss       BOOLEAN := false;
  v_drops_needed  INTEGER;
  v_rarity        material_rarity;
  v_picked        UUID;
  v_pick_name     TEXT;
  v_pick_rarity   material_rarity;
  v_pick_theme    TEXT;
  v_pick_icon     TEXT;
  v_floor         INTEGER := GREATEST(1, COALESCE(p_floor_number, 1));
  v_roll          REAL;
  v_i             INTEGER;
BEGIN
  SELECT COALESCE(e.is_boss, false) INTO v_is_boss
  FROM public.enemies e WHERE e.id = p_enemy_id;

  IF v_is_boss THEN
    v_drops_needed := 1 + floor(random() * 3)::INT;
  ELSE
    IF random() > 0.30 THEN RETURN; END IF;
    v_drops_needed := 1;
  END IF;

  FOR v_i IN 1..v_drops_needed LOOP
    v_roll := random();

    IF NOT v_is_boss THEN
      v_rarity := 'common';
    ELSIF v_floor <= 10 THEN
      v_rarity := CASE WHEN v_roll < 0.80 THEN 'common' ELSE 'uncommon' END::material_rarity;
    ELSIF v_floor <= 20 THEN
      v_rarity := CASE
        WHEN v_roll < 0.40 THEN 'common'
        WHEN v_roll < 0.85 THEN 'uncommon'
        ELSE                      'rare'
      END::material_rarity;
    ELSIF v_floor <= 30 THEN
      v_rarity := CASE
        WHEN v_roll < 0.15 THEN 'common'
        WHEN v_roll < 0.55 THEN 'uncommon'
        WHEN v_roll < 0.90 THEN 'rare'
        ELSE                      'epic'
      END::material_rarity;
    ELSE
      v_rarity := CASE
        WHEN v_roll < 0.30 THEN 'uncommon'
        WHEN v_roll < 0.80 THEN 'rare'
        ELSE                      'epic'
      END::material_rarity;
    END IF;

    SELECT m.id, m.name, m.rarity, m.theme, m.icon_url
      INTO v_picked, v_pick_name, v_pick_rarity, v_pick_theme, v_pick_icon
    FROM   public.materials m
    WHERE  m.rarity = v_rarity
    ORDER  BY random()
    LIMIT  1;

    IF v_picked IS NULL THEN
      SELECT m.id, m.name, m.rarity, m.theme, m.icon_url
        INTO v_picked, v_pick_name, v_pick_rarity, v_pick_theme, v_pick_icon
      FROM   public.materials m
      WHERE  m.rarity = 'common'
      ORDER  BY random()
      LIMIT  1;
    END IF;

    IF v_picked IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.student_inventory_materials (student_id, material_id, quantity)
    VALUES (p_student_id, v_picked, 1)
    ON CONFLICT (student_id, material_id)
    DO UPDATE SET quantity   = student_inventory_materials.quantity + 1,
                  updated_at = now();

    out_material_id := v_picked;
    out_name        := v_pick_name;
    out_rarity      := v_pick_rarity;
    out_theme       := v_pick_theme;
    out_icon_url    := v_pick_icon;
    out_quantity    := 1;
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_battle_materials(UUID, UUID, INTEGER)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
