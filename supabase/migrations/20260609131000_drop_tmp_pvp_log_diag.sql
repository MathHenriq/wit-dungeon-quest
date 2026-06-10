-- Drop the temporary PvP telemetry diagnostic function used while tracing the
-- "can't challenge" bug. No longer needed in production.
DROP FUNCTION IF EXISTS public._pvp_log_diag();
NOTIFY pgrst, 'reload schema';
