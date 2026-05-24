-- Patch 10.2 — Performance indexes called out by the audit (10.1).
--
-- Both indexes back read paths used on every login:
--   • chest_openings: ChestSection lists the last 10 openings ordered by
--     opened_at for the current student. Without this index PG falls back to
--     a bitmap heap scan + sort over the partial student_id index.
--   • student_inventory: open_chest()'s rarity pick + the "first_obtained"
--     trigger from 8.1 both ask "does this student own this item?" — a hot
--     lookup that was previously a seq filter on the student_id index.

CREATE INDEX IF NOT EXISTS idx_chest_openings_student_time
  ON public.chest_openings (student_id, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_inventory_student_item
  ON public.student_inventory (student_id, item_id);
