// POST /compute-weekly-rankings
//
// Finalizes the previous BRT week into weekly_rankings_snapshot and refreshes
// XP baselines for the new week. Idempotent — safe to run multiple times.
//
// Two ways this gets invoked in production:
//   1. pg_cron schedule 'compute_weekly_rankings' (preferred, no HTTP roundtrip).
//      Cron line: `1 3 * * 1` = Monday 00:01 BRT.
//   2. Manually / from Supabase Dashboard's scheduled function trigger, by
//      hitting this endpoint. Useful for ad-hoc reruns or external schedulers.
//
// Security
//   No request body. Caller must include the service role key in the
//   Authorization header (Supabase Dashboard scheduler does this automatically).
//   We don't expose any data — only kick off the SQL function — so there is no
//   user-data leak risk on auth misconfig.

import { adminClient, corsHeaders, handleCors, jsonResponse } from '../_shared/admin.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'method not allowed' }, 405);
  }

  // Service-role auth gate: only allow invocations that present the service
  // role key (Supabase Dashboard's scheduler attaches it). Anonymous callers
  // are rejected to keep this endpoint from being hammered.
  const auth = req.headers.get('authorization') ?? '';
  const expected = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!expected || !auth.includes(expected)) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  try {
    const sb = adminClient();
    const { data, error } = await sb.rpc('compute_weekly_rankings');
    if (error) {
      console.error('[compute-weekly-rankings] rpc error', error);
      return jsonResponse({ error: error.message }, 500);
    }
    return jsonResponse({ ok: true, result: data }, 200);
  } catch (err) {
    console.error('[compute-weekly-rankings] unexpected', err);
    return jsonResponse({ error: String(err) }, 500);
  }
});
