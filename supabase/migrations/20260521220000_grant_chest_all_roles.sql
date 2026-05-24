-- Anon (curl test) hits the function and gets 401 NOT_AUTHENTICATED — meaning
-- PostgREST sees and executes it.
-- Authenticated user gets 404 — that's a PostgREST quirk when EXECUTE is
-- denied for the calling role: it hides the function from the schema for
-- that role and returns 404 instead of 403. So `authenticated` is missing
-- the GRANT.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.open_chest(TEXT, INTEGER, UUID)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.open_chest_v2(TEXT, INTEGER, UUID)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_enemy_defeat(UUID, BIGINT, UUID, BOOLEAN)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
