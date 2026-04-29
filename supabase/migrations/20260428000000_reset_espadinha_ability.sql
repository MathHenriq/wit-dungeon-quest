-- Remove ability config from Espadinha and unequip from all students

-- 1. Clear ability fields on the item
--    ability_mode is NOT NULL (default 'combo') so we reset it to default;
--    ability_key = NULL is what the engine checks to decide if a slot exists.
UPDATE public.shop_items
   SET ability_key         = NULL,
       ability_name        = NULL,
       ability_mode        = 'combo',
       ability_config      = '{}'::jsonb,
       ability_description = NULL
 WHERE id = '6e70147a-bb81-4b7f-935c-d4558f0adec1';

-- 2. Unequip Espadinha from every student who has it equipped
UPDATE public.student_inventory
   SET is_equipped  = false,
       equipped_slot = NULL
 WHERE item_id = '6e70147a-bb81-4b7f-935c-d4558f0adec1'
   AND is_equipped = true;
