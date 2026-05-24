-- ============================================================
-- Patch 2.4 — Reprice shop items per the new rarity curve
--
-- Old curve:  Common 50 / Uncommon 130 / Rare 200 / Epic 400 /
--             Legendary 700 / Mythic 1000 / ??? 1500
-- New curve:  Common 80 / Uncommon 250 / Rare 600 / Epic 1500 /
--             Legendary 4000
-- Mythic and ??? are no longer sold by the shop (chests only),
-- but we keep their rows + bump cost to a coherent ceiling so
-- nothing turns up cheaper than a Legendary if shown anywhere.
--
-- Visibility in the shop UI is enforced by the client filter
-- (see ShopScreen.tsx). The DB row stays present so students
-- who already own a Mythic / ??? still see it in their
-- inventory through the shop_items join.
-- ============================================================

UPDATE public.shop_items SET cost =    80 WHERE rarity = 'common';
UPDATE public.shop_items SET cost =   250 WHERE rarity = 'uncommon';
UPDATE public.shop_items SET cost =   600 WHERE rarity = 'rare';
UPDATE public.shop_items SET cost =  1500 WHERE rarity = 'epic';
UPDATE public.shop_items SET cost =  4000 WHERE rarity = 'legendary';
-- Above shop tier — only obtainable via chests. Keep a sane
-- monetary value in case some other system reads it (sell-back,
-- ranking heuristics, etc).
UPDATE public.shop_items SET cost = 10000 WHERE rarity = 'mythic';
UPDATE public.shop_items SET cost = 25000 WHERE rarity = 'unknown';
