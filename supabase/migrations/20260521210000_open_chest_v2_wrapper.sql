-- The 3-arg open_chest exists on the remote per migration history, but
-- PostgREST still returns 404 for it from the client. Could be schema-cache
-- staleness, a missing GRANT, or a function defined in a non-public schema.
-- Rather than chase the gateway, expose a v2 wrapper under a fresh name —
-- a new function is guaranteed to appear in the PostgREST schema.

CREATE OR REPLACE FUNCTION public.open_chest_v2(
  p_chest_key TEXT,
  p_count     INTEGER DEFAULT 1,
  p_grant_id  UUID    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.open_chest(p_chest_key, p_count, p_grant_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_chest_v2(TEXT, INTEGER, UUID) TO authenticated;

-- Re-grant the original too, in case a previous migration silently revoked it.
GRANT EXECUTE ON FUNCTION public.open_chest(TEXT, INTEGER, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
