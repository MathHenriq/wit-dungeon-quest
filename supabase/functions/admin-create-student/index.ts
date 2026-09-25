// POST /admin-create-student
// {
//   teacher_id: uuid,
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

import { handleCors, isMasterAdminUserId, jsonResponse, requireAdmin } from '../_shared/admin.ts';

interface Body {
  teacher_id?: string;
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
  const { admin, callerUserId } = ctx;

  let body: Body;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid JSON body' }, 400); }
  const { teacher_id, name, email, password } = body;
  const status = body.status ?? 'active';

  if (!teacher_id || !name?.trim() || !email?.trim() || !password) {
    return jsonResponse({ error: 'teacher_id, name, email and password are required' }, 400);
  }
  // Minimização de dados: só os dois primeiros nomes. O banco também recusa
  // (constraint students_name_first_two), aqui é só para a mensagem ser clara.
  const cleanName = name.trim().replace(/\s+/g, ' ');
  if (cleanName.split(' ').length > 2 || /\d/.test(cleanName)) {
    return jsonResponse({ error: 'use apenas os dois primeiros nomes do aluno, sem sobrenome' }, 400);
  }

  // 1) Valida o professor.
  const { data: targetTeacher, error: targetErr } = await admin
    .from('teachers')
    .select('id')
    .eq('id', teacher_id)
    .maybeSingle();
  if (targetErr) return jsonResponse({ error: 'teacher lookup failed', detail: targetErr.message }, 500);
  if (!targetTeacher) return jsonResponse({ error: 'teacher not found' }, 404);
  if (!isMasterAdminUserId(callerUserId)) {
    const { data: callerTeacher, error: callerErr } = await admin
      .from('teachers')
      .select('id')
      .eq('user_id', callerUserId)
      .maybeSingle();
    if (callerErr) return jsonResponse({ error: 'teacher lookup failed', detail: callerErr.message }, 500);
    if (!callerTeacher) return jsonResponse({ error: 'forbidden: caller is not a teacher' }, 403);
    if (teacher_id !== callerTeacher.id) {
      return jsonResponse({ error: 'forbidden: student would not be yours' }, 403);
    }
  }

  // 2) Create the auth user (email_confirm = true so they can sign in immediately).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    // Nada de nome nos metadados do auth: o nome fica só em `students`.
    user_metadata: { role: 'student' },
  });
  if (createErr || !created?.user) {
    return jsonResponse({ error: 'auth create failed', detail: createErr?.message ?? 'unknown' }, 400);
  }
  const authUserId = created.user.id;

  // 3) Insert the student row.  Roll back the auth user if this fails.
  const { data: student, error: studentErr } = await admin
    .from('students')
    .insert({
      name: cleanName,
      teacher_id,
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
    p_target_label: cleanName,
    p_payload:      { teacher_id, auth_user_id: authUserId },
  });

  return jsonResponse({ ok: true, student, auth_user_id: authUserId });
});
