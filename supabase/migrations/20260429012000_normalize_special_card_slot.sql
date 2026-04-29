-- Battle item abilities are now driven only by the Carta Especial slot.
-- Keep one equipped ability item per student in equipped_slot = 'carta_especial'.

WITH equipped_ability_items AS (
  SELECT
    inv.id,
    inv.student_id,
    row_number() OVER (
      PARTITION BY inv.student_id
      ORDER BY
        CASE WHEN inv.equipped_slot = 'carta_especial' THEN 0 ELSE 1 END,
        inv.added_at DESC,
        inv.id
    ) AS rn
  FROM public.student_inventory inv
  JOIN public.shop_items item ON item.id = inv.item_id
  WHERE inv.is_equipped = true
    AND item.ability_key IS NOT NULL
)
UPDATE public.student_inventory inv
SET
  is_equipped = ranked.rn = 1,
  equipped_slot = CASE WHEN ranked.rn = 1 THEN 'carta_especial' ELSE NULL END
FROM equipped_ability_items ranked
WHERE inv.id = ranked.id;
