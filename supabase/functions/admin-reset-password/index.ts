// POST /admin-reset-password
// {
//   auth_user_id: uuid,
//   new_password: string
// }
//
// Sets a new password for any auth.users entry. The admin tells the
// user the new password directly. (We deliberately do NOT use email
// recovery so this works for students whose Classroom emails aren't
// reachable.)

import { handleCors, jsonResponse, requireAdmin } from '../_shared/admin.ts';

interface Body {
  auth_user_id?: string;
  new_password?: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;
  const { admin } = ctx;

  let body: Body;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid JSON body' }, 400); }
  const { auth_user_id, new_password } = body;
  if (!auth_user_id || !new_password) {
    return jsonResponse({ error: 'auth_user_id and new_password required' }, 400);
  }
  if (new_password.length < 6) {
    return jsonResponse({ error: 'password too short (min 6)' }, 400);
  }

  const { error } = await admin.auth.admin.updateUserById(auth_user_id, { password: new_password });
  if (error) return jsonResponse({ error: 'reset failed', detail: error.message }, 400);

  // Best-effort label lookup so the audit log shows who got reset.
  let label: string | null = null;
  let table: string = 'auth.users';
  let target_id: string = auth_user_id;
  const { data: stu } = await admin.from('students').select('id, name').eq('user_id', auth_user_id).maybeSingle();
  if (stu) { label = stu.name; table = 'students'; target_id = stu.id; }
  else {
    const { data: tch } = await admin.from('teachers').select('id, name').eq('user_id', auth_user_id).maybeSingle();
    if (tch) { label = tch.name; table = 'teachers'; target_id = tch.id; }
  }

  await admin.rpc('log_action', {
    p_action:       'admin_reset_password',
    p_target_table: table,
    p_target_id:    target_id,
    p_target_label: label,
    p_payload:      { auth_user_id },
  });

  return jsonResponse({ ok: true });
});
