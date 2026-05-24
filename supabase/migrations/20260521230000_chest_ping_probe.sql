-- Probe to diagnose the persistent 404 on open_chest/open_chest_v2.
-- Trivial function, no body, just returns 'pong'. If this also 404s from the
-- frontend after a hard refresh, the issue is PostgREST/gateway level, not
-- our function definitions.

CREATE OR REPLACE FUNCTION public.chest_ping()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$ SELECT 'pong'::TEXT $$;

GRANT EXECUTE ON FUNCTION public.chest_ping() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
