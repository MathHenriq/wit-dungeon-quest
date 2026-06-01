-- Floors 7, 8 and 9 had two normal enemies stacked on the same X column
-- (positions (50,50) and (50,70)). Visually they overlapped enough that
-- students perceived only 3 normal markers + boss. Defeating "the third"
-- killed one of the overlapping pair while the other stayed alive in the
-- same spot, so:
--   - the marker appeared not to fade
--   - isBossUnlocked() never flipped (one normal still alive)
--   - the next floor stayed locked
--
-- Reposition the inner pair so no two normals share an X column, matching
-- the spread used on floors 1-6 and 10+.
--
-- Affected enemies (by name within their floor):
--   "... II"  at (50,50) -> stay
--   second normal at (50,70) -> moved to (60,75)

UPDATE public.enemies
   SET position_x = 60,
       position_y = 75
 WHERE floor_id IN (9, 10, 11)  -- floor_number 7, 8, 9
   AND is_boss = false
   AND position_x = 50
   AND position_y = 70;

NOTIFY pgrst, 'reload schema';
