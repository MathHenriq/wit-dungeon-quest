-- Diagnostic: list every open_chest overload in pg_catalog so we can see
-- which ones the gateway sees and whether the authenticated role has
-- EXECUTE on them.

CREATE OR REPLACE FUNCTION public.list_open_chest_funcs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'proname',       p.proname,
    'args',          pg_get_function_arguments(p.oid),
    'secdef',        p.prosecdef,
    'schema',        n.nspname,
    'can_auth_exec', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
    'can_anon_exec', has_function_privilege('anon',          p.oid, 'EXECUTE')
  ))
  INTO v_result
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname IN ('open_chest', 'open_chest_v2', 'chest_ping');

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_open_chest_funcs() TO anon, authenticated, service_role;

-- Aggressively drop every legacy open_chest signature we know of.
DROP FUNCTION IF EXISTS public.open_chest(UUID, UUID);
DROP FUNCTION IF EXISTS public.open_chest(TEXT, INTEGER);

NOTIFY pgrst, 'reload schema';
