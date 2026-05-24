// POST /gsa-refresh-token  { teacher_id: uuid }
//
// Exchanges the stored refresh_token for a fresh access_token via Google's
// OAuth endpoint, updates google_classroom_connections, and returns the new
// access_token to the caller.
//
// Why this exists
//   provider_token returned by signInWithOAuth lives ~1h. Without this flow
//   the teacher had to manually reconnect every hour — which is the actual
//   "Google Classroom parou de funcionar" symptom.
//
// Security
//   - Caller must be authenticated.
//   - If caller is NOT admin, they may only refresh their OWN teacher row.
//   - Service role is used internally to read the refresh_token (RLS would
//     hide it from the caller's session anyway because the column is
//     considered sensitive by our existing policy model).

import {
  adminClient, corsHeaders, handleCors, jsonResponse,
} from '../_shared/admin.ts';

interface Body { teacher_id?: string }

const GOOGLE_CLIENT_ID     = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')     ?? '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') ?? '';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return jsonResponse({
      error: 'server misconfigured',
      detail: 'GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET secrets missing',
    }, 500);
  }

  // ── 1. Resolve caller ───────────────────────────────────────────
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return jsonResponse({ error: 'missing bearer token' }, 401);

  const admin = adminClient();
  const { data: userResp, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userResp?.user) return jsonResponse({ error: 'invalid token' }, 401);
  const callerUserId = userResp.user.id;

  const { data: callerTeacher, error: tErr } = await admin
    .from('teachers')
    .select('id, is_admin')
    .eq('user_id', callerUserId)
    .maybeSingle();
  if (tErr) return jsonResponse({ error: 'teacher lookup failed', detail: tErr.message }, 500);
  if (!callerTeacher) return jsonResponse({ error: 'forbidden: caller is not a teacher' }, 403);

  // ── 2. Validate body ────────────────────────────────────────────
  let body: Body;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid JSON body' }, 400); }
  const targetTeacherId = body.teacher_id ?? callerTeacher.id;
  if (targetTeacherId !== callerTeacher.id && !callerTeacher.is_admin) {
    return jsonResponse({ error: 'forbidden: cannot refresh another teacher\'s token' }, 403);
  }

  // ── 3. Load refresh_token ───────────────────────────────────────
  const { data: conn, error: cErr } = await admin
    .from('google_classroom_connections')
    .select('refresh_token, access_token, token_expires_at')
    .eq('teacher_id', targetTeacherId)
    .maybeSingle();
  if (cErr) return jsonResponse({ error: 'connection lookup failed', detail: cErr.message }, 500);
  if (!conn) return jsonResponse({ error: 'no_connection', detail: 'No Google Classroom connection saved for this teacher' }, 404);
  if (!conn.refresh_token) {
    return jsonResponse({
      error: 'no_refresh_token',
      detail: 'Refresh token is missing — teacher must reconnect with access_type=offline + prompt=consent',
    }, 409);
  }

  // ── 4. Exchange with Google ─────────────────────────────────────
  const form = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    grant_type:    'refresh_token',
    refresh_token: conn.refresh_token,
  });

  let googleResp: Response;
  try {
    googleResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: 'google_unreachable', detail: msg }, 502);
  }

  const googleData = await googleResp.json().catch(() => null) as
    | { access_token?: string; expires_in?: number; refresh_token?: string; error?: string; error_description?: string }
    | null;

  if (!googleResp.ok || !googleData?.access_token) {
    // If Google revoked the refresh_token (invalid_grant) clear it so the UI
    // surfaces a clean "reconnect required" state instead of looping.
    if (googleData?.error === 'invalid_grant') {
      await admin
        .from('google_classroom_connections')
        .update({ refresh_token: null, token_expires_at: null })
        .eq('teacher_id', targetTeacherId);
    }
    return jsonResponse({
      error: 'google_refresh_failed',
      detail: googleData?.error_description ?? googleData?.error ?? `HTTP ${googleResp.status}`,
      code:   googleData?.error ?? null,
    }, 400);
  }

  // ── 5. Persist new access_token ─────────────────────────────────
  const expiresInSec = typeof googleData.expires_in === 'number' ? googleData.expires_in : 3600;
  const newExpiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

  // Google sometimes returns a NEW refresh_token (rare). Keep the old one if not.
  const updates: Record<string, unknown> = {
    access_token:     googleData.access_token,
    token_expires_at: newExpiresAt,
    last_sync_at:     new Date().toISOString(),
  };
  if (googleData.refresh_token) updates.refresh_token = googleData.refresh_token;

  const { error: uErr } = await admin
    .from('google_classroom_connections')
    .update(updates)
    .eq('teacher_id', targetTeacherId);
  if (uErr) return jsonResponse({ error: 'persist failed', detail: uErr.message }, 500);

  return new Response(JSON.stringify({
    ok: true,
    access_token: googleData.access_token,
    expires_at:   newExpiresAt,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
