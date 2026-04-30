-- ============================================================
-- Rebuild character_progress from floor_enemy_defeats.
--
-- Why
--   The client used `.update(...).eq('id', existing.id)` against
--   public.character_progress, but this table has NO `id` column —
--   its PRIMARY KEY is the composite (character_id, floor_id).
--   So every UPDATE after the first defeat silently no-op'd. The
--   floor_enemy_defeats row WAS written (different code path that
--   uses a real upsert), but the aggregate enemies_defeated /
--   boss_defeated never grew. Result: a student with 25 real
--   defeats spread over 5 floors only had 1 row in
--   character_progress with enemies_defeated=1 — the FloorSelect
--   UI saw zero floors completed and dropped him back to floor 1.
--
-- This migration regenerates the aggregate from the granular
-- table:
--   for each (character_id, floor_id) in floor_enemy_defeats:
--     enemies_defeated = count of NON-boss defeats
--     boss_defeated    = at least one boss enemy is in defeats
--     completed_at     = max defeated_at of the boss (if any),
--                        else preserved (existing value)
--
-- It does NOT touch floor_enemy_defeats nor characters. It is
-- idempotent: running again rebuilds the same aggregate.
--
-- Code change paired with this migration:
--   useFloors.ts and useFloorMapData.ts now upsert on
--   (character_id, floor_id) so future defeats actually land.
-- ============================================================

-- Snapshot before rewrite (for safety)
CREATE TABLE IF NOT EXISTS public.character_progress_backup_20260430 AS
SELECT * FROM public.character_progress;


-- Build the correct aggregates per (character_id, floor_id).
WITH defeats_with_meta AS (
  SELECT fed.character_id,
         e.floor_id,
         e.is_boss,
         fed.defeated_at
  FROM   public.floor_enemy_defeats fed
  JOIN   public.enemies e ON e.id = fed.enemy_id
),
aggregated AS (
  SELECT character_id,
         floor_id,
         COUNT(*) FILTER (WHERE is_boss IS NOT TRUE) AS enemies_defeated,
         BOOL_OR(is_boss)                            AS boss_defeated,
         MAX(defeated_at) FILTER (WHERE is_boss)     AS boss_defeated_at
  FROM   defeats_with_meta
  GROUP  BY character_id, floor_id
)
INSERT INTO public.character_progress (
  character_id, floor_id,
  enemies_defeated, boss_defeated, completed_at,
  times_completed
)
SELECT a.character_id,
       a.floor_id,
       a.enemies_defeated,
       a.boss_defeated,
       CASE WHEN a.boss_defeated THEN COALESCE(a.boss_defeated_at, now()) END,
       CASE WHEN a.boss_defeated THEN 1 ELSE 0 END
FROM   aggregated a
ON CONFLICT (character_id, floor_id) DO UPDATE
SET    enemies_defeated  = EXCLUDED.enemies_defeated,
       boss_defeated     = EXCLUDED.boss_defeated,
       completed_at      = COALESCE(EXCLUDED.completed_at, public.character_progress.completed_at),
       times_completed   = GREATEST(public.character_progress.times_completed, EXCLUDED.times_completed);


-- Visibility log
DO $$
DECLARE
  v_total INT;
  v_with_boss INT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE boss_defeated)
  INTO   v_total, v_with_boss
  FROM   public.character_progress;
  RAISE NOTICE 'character_progress rows after rebuild: % (% with boss defeated)', v_total, v_with_boss;
END $$;
