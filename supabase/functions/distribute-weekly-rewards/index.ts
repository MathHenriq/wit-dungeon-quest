// POST /distribute-weekly-rewards
//
// Distributes weekly rewards for the previous BRT week:
//   • Sala/Geral/PvP top 1 → Ticket de Criação (already granted by
//     compute-weekly-rankings; this just logs + posts notifications).
//   • Guildas top 1 → free Mythic chest grant per member.
// Optional body { week_start: 'YYYY-MM-DD' } targets a specific week (defaults
// to previous BRT week). Idempotent — re-runs are no-ops thanks to
// weekly_rewards_log's unique key.
//
// Scheduling:
//   pg_cron job 'distribute_weekly_rewards' runs at 03:05 UTC every Monday
//   (00:05 BRT) — that's 4 minutes after compute_weekly_rankings finishes.
//   This HTTP wrapper exists for manual reruns / external schedulers.

import { adminClient, corsHeaders, handleCors, jsonResponse } from '../_shared/admin.ts';

interface Body { week_start?: string }

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'method not allowed' }, 405);
  }

  const auth = req.headers.get('authorization') ?? '';
  const expected = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!expected || !auth.includes(expected)) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  let body: Body = {};
  if (req.method === 'POST') {
    try { body = await req.json() as Body; } catch { /* empty body is fine */ }
  }

  try {
    const sb = adminClient();
    const { data, error } = await sb.rpc('distribute_weekly_rewards', {
      p_week_start: body.week_start ?? null,
    });
    if (error) {
      console.error('[distribute-weekly-rewards] rpc error', error);
      return jsonResponse({ error: error.message }, 500);
    }
    return jsonResponse({ ok: true, result: data }, 200);
  } catch (err) {
    console.error('[distribute-weekly-rewards] unexpected', err);
    return jsonResponse({ error: String(err) }, 500);
  }
});
