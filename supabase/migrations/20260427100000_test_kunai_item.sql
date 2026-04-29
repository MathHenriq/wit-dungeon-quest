-- Test data: equip "Espadinha" with the kunai_throw equipment ability handler.
-- Used to validate the end-to-end equipment-ability flow before populating real items.

UPDATE public.shop_items
SET
  ability_mode        = 'unique',
  ability_key         = 'kunai_throw',
  ability_name        = 'Arremesso de Kunai',
  ability_description = 'Arremessa uma kunai causando 20 de dano direto',
  ability_config      = '{"once_per_battle": false}'::jsonb
WHERE id = '6e70147a-bb81-4b7f-935c-d4558f0adec1';
