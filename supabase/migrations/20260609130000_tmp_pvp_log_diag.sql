-- TEMPORARY diagnostic. Dropped by a follow-up migration.
CREATE OR REPLACE FUNCTION public._pvp_log_diag()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_counts json;
  v_recent json;
  v_cols   json;
BEGIN
  -- does action_log exist?
  IF to_regclass('public.action_log') IS NULL THEN
    RETURN json_build_object('error','no action_log table');
  END IF;

  SELECT json_object_agg(action, c) INTO v_counts FROM (
    SELECT action, count(*) c FROM public.action_log
    WHERE action LIKE 'pvp_%' GROUP BY action
  ) t;

  SELECT json_agg(row_to_json(r)) INTO v_recent FROM (
    SELECT action, payload, created_at FROM public.action_log
    WHERE action LIKE 'pvp_%'
      AND action ~ 'fail|error|abort|missing|disconnect'
    ORDER BY created_at DESC LIMIT 25
  ) r;

  RETURN json_build_object('counts', v_counts, 'recent_failures', v_recent);
END;
$$;
GRANT EXECUTE ON FUNCTION public._pvp_log_diag() TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
