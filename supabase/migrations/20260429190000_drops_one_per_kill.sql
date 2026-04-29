-- Limit drops to at most 1 item per enemy kill.
-- Previously every entry in enemy_drop_table was rolled independently,
-- so a forest mob with chances summing to ~3.16 averaged ~3 items
-- per kill and the inventory filled too quickly.
--
-- New behaviour: iterate the eligible drops in random order and
-- return as soon as one of them succeeds. Rarity tiers (drop_chance
-- values) still control how likely each specific item is to be the
-- one picked; quantity ranges (min/max) still apply to the chosen
-- item. With chances totalling >1 the kill almost always yields
-- exactly one drop; with totals <1 there is still a chance of no
-- drop, which keeps the inventory tidy.

DROP FUNCTION IF EXISTS public.apply_battle_drops(UUID, UUID);

CREATE OR REPLACE FUNCTION public.apply_battle_drops(
  p_student_id UUID,
  p_enemy_id   UUID
)
RETURNS TABLE (
  drop_item_id    UUID,
  name            TEXT,
  rarity          drop_rarity,
  floor_theme     TEXT,
  base_sell_value INTEGER,
  quantity        INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_drop_item_id    UUID;
  v_name            TEXT;
  v_rarity          drop_rarity;
  v_floor_theme     TEXT;
  v_base_sell_value INTEGER;
  v_drop_chance     REAL;
  v_min_qty         INTEGER;
  v_max_qty         INTEGER;
  v_qty             INTEGER;
BEGIN
  FOR v_drop_item_id, v_drop_chance, v_min_qty, v_max_qty,
      v_name, v_rarity, v_floor_theme, v_base_sell_value
  IN
    SELECT edt.drop_item_id,
           edt.drop_chance,
           edt.min_quantity,
           edt.max_quantity,
           di.name,
           di.rarity,
           di.floor_theme,
           di.base_sell_value
    FROM   public.enemy_drop_table edt
    JOIN   public.drop_items di ON di.id = edt.drop_item_id
    WHERE  edt.enemy_id = p_enemy_id
    ORDER  BY random()
  LOOP
    IF random() <= v_drop_chance THEN
      IF v_max_qty = v_min_qty THEN
        v_qty := v_min_qty;
      ELSE
        v_qty := v_min_qty
               + floor(random() * (v_max_qty - v_min_qty + 1))::INT;
      END IF;

      INSERT INTO public.student_drop_inventory (student_id, drop_item_id, quantity)
      VALUES (p_student_id, v_drop_item_id, v_qty)
      ON CONFLICT (student_id, drop_item_id)
      DO UPDATE SET quantity    = public.student_drop_inventory.quantity + EXCLUDED.quantity,
                    acquired_at = NOW();

      apply_battle_drops.drop_item_id    := v_drop_item_id;
      apply_battle_drops.name            := v_name;
      apply_battle_drops.rarity          := v_rarity;
      apply_battle_drops.floor_theme     := v_floor_theme;
      apply_battle_drops.base_sell_value := v_base_sell_value;
      apply_battle_drops.quantity        := v_qty;
      RETURN NEXT;
      RETURN;  -- one drop max per kill
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_battle_drops(UUID, UUID) TO anon, authenticated;
