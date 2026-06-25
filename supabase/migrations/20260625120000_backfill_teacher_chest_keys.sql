-- Teacher-created chests were being inserted without a chest_key. The current
-- open_chest / open_chest_v2 RPCs identify chests by chest_key, and the legacy
-- open_chest(UUID, UUID) overload was dropped — so any teacher chest with a
-- NULL chest_key fails to open ("Erro ao abrir o baú").
--
-- Backfill a stable, unique chest_key for every teacher chest still missing one.
-- Using the row id guarantees uniqueness and idempotency.

UPDATE public.chest_types
SET chest_key = 'tchest_' || id::text
WHERE chest_key IS NULL
  AND teacher_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
