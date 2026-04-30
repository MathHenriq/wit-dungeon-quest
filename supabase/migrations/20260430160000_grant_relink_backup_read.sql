-- Temporary grant: allow authenticated/anon to SELECT the relink backup so
-- diagnostic scripts can find characters that were not auto-relinked.
-- The backup is read-only historical data; no RLS needed.
GRANT SELECT ON public.characters_relink_backup_20260430 TO anon, authenticated;
