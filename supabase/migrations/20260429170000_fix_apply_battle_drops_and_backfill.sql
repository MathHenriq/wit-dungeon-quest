-- ============================================================
-- Fixes for the drop system
--
-- Problem 1: public.apply_battle_drops always raised
--   "column reference drop_item_id is ambiguous"
--   because the RETURNS TABLE column names collided with the
--   columns selected inside the FOR loop. Result: every call
--   from BattleDungeonView returned an empty array, so drops
--   never reached the player.
--
-- Problem 2: enemy_drop_table was seeded on 2026-04-27, before
--   floors 16-25 were created (migration 20260429000000).
--   Those 60 newer enemies (incl. all bosses on those floors)
--   had no drop rows at all.
--
-- This migration rewrites the function with non-ambiguous
-- aliases and reruns the seed join (idempotent via the
-- existing UNIQUE(enemy_id, drop_item_id) constraint).
-- ============================================================

-- ── 1. Replace the RPC ───────────────────────────────────────
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

      drop_item_id    := v_drop_item_id;
      name            := v_name;
      rarity          := v_rarity;
      floor_theme     := v_floor_theme;
      base_sell_value := v_base_sell_value;
      quantity        := v_qty;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_battle_drops(UUID, UUID) TO anon, authenticated;


-- ── 2. Backfill enemy_drop_table for newer enemies ───────────
-- Same payload as 20260427040000_drop_system_seed.sql; the
-- ON CONFLICT clause makes it idempotent for enemies that
-- already have rows.
INSERT INTO public.enemy_drop_table (enemy_id, drop_item_id, drop_chance, min_quantity, max_quantity)
SELECT
  e.id,
  di.id,
  CASE di.rarity
    WHEN 'comum'    THEN 0.45
    WHEN 'incomum'  THEN 0.18
    WHEN 'raro'     THEN CASE WHEN e.is_boss THEN 0.20 ELSE 0.05 END
    WHEN 'epico'    THEN 0.08
    WHEN 'lendario' THEN 0.03
    WHEN 'mitico'   THEN 0.01
    WHEN '???'      THEN 0.005
  END AS drop_chance,
  1 AS min_quantity,
  CASE di.rarity
    WHEN 'comum'   THEN 3
    WHEN 'incomum' THEN 2
    ELSE 1
  END AS max_quantity
FROM   public.enemies e
JOIN   public.floors     f  ON f.id = e.floor_id
JOIN   public.drop_items di ON di.floor_theme = f.theme
WHERE  (e.is_boss OR di.rarity IN ('comum', 'incomum', 'raro'))
ON CONFLICT (enemy_id, drop_item_id) DO NOTHING;
