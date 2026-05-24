-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: Remove as 4 cartas Raras genéricas (sem IP anime).
--
-- Motivo: catálogo é 100% anime-themed; cartas genéricas (Passo Leve, Pele
-- de Pedra, Marca Espectral, Surto de Mana) destoam visualmente e
-- mecanicamente do resto.
--
-- Os handlers correspondentes permanecem no equipmentAbilityRegistry.ts
-- (são código morto até que cartas com esses ability_keys sejam re-criadas
-- — não atrapalha nada). Pode-se removê-los depois se quiser limpeza total.
-- ═══════════════════════════════════════════════════════════════════════════

DELETE FROM public.shop_items
WHERE ability_key IN (
  'light-step_unique',
  'stone-skin_unique',
  'spectral-mark_unique',
  'mana-surge_unique'
);

NOTIFY pgrst, 'reload schema';
