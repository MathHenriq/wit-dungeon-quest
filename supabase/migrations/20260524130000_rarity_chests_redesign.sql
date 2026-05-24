-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: Redesign dos baús de loja em 6 tiers de raridade
--
-- Antes (3 globais):
--   global_common (200c) / global_rare (50d) / global_mythic (200d)
--
-- Depois (6 globais — um por raridade, sem ??? exceto Lendário e Mítico):
--   global_common     150c + 5d
--   global_uncommon   350c + 10d   ← NOVO
--   global_rare       800c + 25d
--   global_epic       70d           ← NOVO
--   global_legendary  180d          ← NOVO
--   global_mythic     400d          (única forma habitual de ???)
--
-- Calibragem de ???:
--   - Sai só em Lendário (0.3%) e Mítico (1%).
--   - ~5 míticos abertos ≈ 4.9% chance de pegar uma ???.
--   - Atinge o alvo "uns 5/100 players com cartas ???".
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Reweight + repreço dos 3 globais existentes ────────────────────────
UPDATE public.chest_types
SET name           = 'Baú Comum',
    description    = 'Foco em Comum. Pequena chance de Rara.',
    cost_coins     = 150,
    cost_diamonds  = 5,
    tier           = 1,
    drop_common    = 78, drop_uncommon = 19, drop_rare = 3,
    drop_epic      = 0,  drop_legendary = 0, drop_mythic = 0, drop_unknown = 0,
    is_active      = true
WHERE chest_key = 'global_common';

UPDATE public.chest_types
SET name           = 'Baú Raro',
    description    = 'Foco em Rara. Pequena chance de Lendária.',
    cost_coins     = 800,
    cost_diamonds  = 25,
    tier           = 3,
    drop_common    = 0,  drop_uncommon = 25, drop_rare = 55,
    drop_epic      = 17, drop_legendary = 3,  drop_mythic = 0, drop_unknown = 0,
    is_active      = true
WHERE chest_key = 'global_rare';

UPDATE public.chest_types
SET name           = 'Baú Mítico',
    description    = 'Foco em Mítica. Pequena chance de ???.',
    cost_coins     = 0,
    cost_diamonds  = 400,
    tier           = 6,
    drop_common    = 0,  drop_uncommon = 0,  drop_rare = 0,
    drop_epic      = 10, drop_legendary = 35, drop_mythic = 55, drop_unknown = 0,
    is_active      = true
WHERE chest_key = 'global_mythic';

-- ── 3 novos baús ───────────────────────────────────────────────────────
-- chest_types não tem UNIQUE em chest_key, então deletamos antes de inserir
-- pra ser idempotente (segura roda múltipla da migration).
DELETE FROM public.chest_types
WHERE chest_key IN ('global_uncommon','global_epic','global_legendary')
  AND teacher_id IS NULL;

INSERT INTO public.chest_types
  (chest_key, name, description, tier, cost_coins, cost_diamonds,
   drop_common, drop_uncommon, drop_rare, drop_epic, drop_legendary, drop_mythic, drop_unknown,
   min_items, max_items, min_level, is_active, is_limited, teacher_id)
VALUES
  ('global_uncommon', 'Baú Incomum',
   'Foco em Incomum. Boa chance de Rara.', 2, 350, 10,
   25, 55, 16, 4, 0, 0, 0,
   1, 1, 1, true, false, NULL),
  ('global_epic', 'Baú Épico',
   'Foco em Épica. Pequena chance de Mítica.', 4, 0, 70,
   0, 0, 25, 55, 18, 2, 0,
   1, 1, 1, true, false, NULL),
  ('global_legendary', 'Baú Lendário',
   'Foco em Lendária. Chance baixa de Mítica e ínfima de ???.', 5, 0, 180,
   0, 0, 0, 25, 60, 15, 0,
   1, 1, 1, true, false, NULL);

-- ── Reset + reseed subpercent (??? só em Lendário e Mítico) ────────────
DELETE FROM public.chest_subpercent_weights
WHERE chest_key IN ('global_common','global_uncommon','global_rare','global_epic','global_legendary','global_mythic');

INSERT INTO public.chest_subpercent_weights (chest_key, rarity, weight_bp) VALUES
  ('global_legendary', 'unknown', 30),   -- 0.30%
  ('global_mythic',    'unknown', 100);  -- 1.00%

NOTIFY pgrst, 'reload schema';
