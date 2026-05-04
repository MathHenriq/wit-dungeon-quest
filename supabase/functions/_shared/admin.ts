// Shared helpers used by every admin Edge Function.
//
// Responsibilities:
// 1. CORS pre-flight handling (we call these from the browser).
// 2. Resolve the calling auth user from the bearer token.
// 3. Verify the caller is an admin (teachers.is_admin = true) before
//    handing the function a service-role client to do its work.
//
// IMPORTANT: every admin endpoint MUST call requireAdmin() before it
// touches anything destructive.  The admin check uses service_role to
// bypass RLS but trusts the JWT for identity.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AdminContext {
  /** Service-role client — bypasses RLS, use for the actual mutations. */
  admin: SupabaseClient;
  /** auth.users.id of the calling admin. */
  callerUserId: string;
}

/**
 * Verify the request bearer token belongs to an admin teacher.
 * Returns either an AdminContext or a Response to send back immediately.
 */
export async function requireAdmin(req: Request): Promise<AdminContext | Response> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return jsonResponse({ error: 'missing bearer token' }, 401);

  const admin = adminClient();
  const { data: userResp, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userResp?.user) {
    return jsonResponse({ error: 'invalid token' }, 401);
  }

  const { data: teacher, error: teacherErr } = await admin
    .from('teachers')
    .select('is_admin')
    .eq('user_id', userResp.user.id)
    .maybeSingle();
  if (teacherErr) return jsonResponse({ error: 'lookup failed', detail: teacherErr.message }, 500);
  if (!teacher?.is_admin) return jsonResponse({ error: 'forbidden' }, 403);

  return { admin, callerUserId: userResp.user.id };
}
