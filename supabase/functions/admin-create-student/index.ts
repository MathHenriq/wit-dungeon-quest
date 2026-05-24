// POST /admin-create-student
// {
//   class_id: uuid,
//   name: string,
//   email: string,
//   password: string,
//   status?: 'active' | 'pending'   // default 'active'
// }
//
// Creates an auth.users row + students row, bypassing the normal
// pending/approval flow.  Used when self-signup fails (trigger
// blocking, dup row, etc.) and the admin needs to register a student
// manually.

import { handleCors, jsonResponse, requireAdmin } from '../_shared/admin.ts';

interface Body {
  class_id?: string;
  name?: string;
  email?: string;
  password?: string;
  status?: 'active' | 'pending';
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
  const { class_id, name, email, password } = body;
  const status = body.status ?? 'active';

  if (!class_id || !name?.trim() || !email?.trim() || !password) {
    return jsonResponse({ error: 'class_id, name, email and password are required' }, 400);
  }

  // 1) Look up the class to derive teacher_id and validate.
  const { data: klass, error: klassErr } = await admin
    .from('classes')
    .select('id, teacher_id')
    .eq('id', class_id)
    .maybeSingle();
  if (klassErr) return jsonResponse({ error: 'class lookup failed', detail: klassErr.message }, 500);
  if (!klass) return jsonResponse({ error: 'class not found' }, 404);

  // 2) Create the auth user (email_confirm = true so they can sign in immediately).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), role: 'student' },
  });
  if (createErr || !created?.user) {
    return jsonResponse({ error: 'auth create failed', detail: createErr?.message ?? 'unknown' }, 400);
  }
  const authUserId = created.user.id;

  // 3) Insert the student row.  Roll back the auth user if this fails.
  const { data: student, error: studentErr } = await admin
    .from('students')
    .insert({
      name: name.trim(),
      class_id,
      teacher_id: klass.teacher_id,
      user_id: authUserId,
      status,
      coins: 0,
      level: 1,
      presencas_consecutivas: 0,
    })
    .select()
    .maybeSingle();

  if (studentErr) {
    // Best-effort rollback so we don't leave a dangling auth user.
    await admin.auth.admin.deleteUser(authUserId);
    return jsonResponse({ error: 'student insert failed', detail: studentErr.message }, 400);
  }

  await admin.rpc('log_action', {
    p_action:       'admin_create_student',
    p_target_table: 'students',
    p_target_id:    student?.id ?? null,
    p_target_label: name.trim(),
    p_payload:      { class_id, teacher_id: klass.teacher_id, auth_user_id: authUserId, email: email.trim().toLowerCase() },
  });

  return jsonResponse({ ok: true, student, auth_user_id: authUserId });
});
