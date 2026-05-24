-- Patch 2.0: nivel minimo por raridade
UPDATE public.shop_items SET min_level = 6  WHERE rarity = 'rare';
UPDATE public.shop_items SET min_level = 10 WHERE rarity = 'epic';
UPDATE public.shop_items SET min_level = 14 WHERE rarity = 'legendary';
UPDATE public.shop_items SET min_level = 20 WHERE rarity = 'mythic';
UPDATE public.shop_items SET min_level = 25 WHERE rarity = 'unknown';

NOTIFY pgrst, 'reload schema';
