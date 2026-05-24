-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 4.1 — Persist pg_cron extension + schedule for compute_weekly_rankings.
-- Split from the main migration because pg_cron wasn't installed in the
-- project yet and the conditional block in 20260514130000 silently skipped.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- Replace existing schedule if any.
  PERFORM cron.unschedule('compute_weekly_rankings')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'compute_weekly_rankings');

  PERFORM cron.schedule(
    'compute_weekly_rankings',
    '1 3 * * 1', -- Monday 03:01 UTC = 00:01 America/Sao_Paulo
    $cron$SELECT public.compute_weekly_rankings();$cron$
  );
END;
$$;
