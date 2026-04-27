-- Anime item catalog support.
-- Keeps low/mid rarity items data-driven and allows legendary+ items to point
-- to unique battle handlers later.

ALTER TABLE public.shop_items
  ADD COLUMN IF NOT EXISTS ability_mode TEXT NOT NULL DEFAULT 'combo',
  ADD COLUMN IF NOT EXISTS ability_key TEXT,
  ADD COLUMN IF NOT EXISTS ability_name TEXT,
  ADD COLUMN IF NOT EXISTS ability_description TEXT,
  ADD COLUMN IF NOT EXISTS ability_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_anime TEXT;

ALTER TABLE public.shop_items
  DROP CONSTRAINT IF EXISTS shop_items_ability_mode_check;
ALTER TABLE public.shop_items
  ADD CONSTRAINT shop_items_ability_mode_check
    CHECK (ability_mode IN ('combo', 'unique'));

ALTER TABLE public.shop_items
  DROP CONSTRAINT IF EXISTS shop_items_rarity_check;
ALTER TABLE public.shop_items
  ADD CONSTRAINT shop_items_rarity_check
    CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'));

CREATE INDEX IF NOT EXISTS idx_shop_items_ability_key
  ON public.shop_items(ability_key);

CREATE INDEX IF NOT EXISTS idx_shop_items_source_anime
  ON public.shop_items(source_anime);
