// POST /teacher-reset-student-password
// {
//   student_id: uuid,
//   new_password: string
// }
//
// Lets a teacher reset the password of a student WHO BELONGS TO THEM.
// Mirrors admin-reset-password but the gate is teacher-of-student instead
// of is_admin. The teacher tells the student the new password directly.

import {
  adminClient, corsHeaders, handleCors, jsonResponse,
} from '../_shared/admin.ts';

interface Body {
  student_id?:   string;
  new_password?: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  // 1. Resolve the calling teacher from the bearer token.
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return jsonResponse({ error: 'missing bearer token' }, 401);

  const admin = adminClient();
  const { data: userResp, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userResp?.user) return jsonResponse({ error: 'invalid token' }, 401);
  const callerUserId = userResp.user.id;

  const { data: teacher, error: tErr } = await admin
    .from('teachers')
    .select('id, name')
    .eq('user_id', callerUserId)
    .maybeSingle();
  if (tErr) return jsonResponse({ error: 'teacher lookup failed', detail: tErr.message }, 500);
  if (!teacher) return jsonResponse({ error: 'forbidden: caller is not a teacher' }, 403);

  // 2. Validate body.
  let body: Body;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid JSON body' }, 400); }
  const { student_id, new_password } = body;
  if (!student_id || !new_password) {
    return jsonResponse({ error: 'student_id and new_password required' }, 400);
  }
  if (new_password.length < 6) {
    return jsonResponse({ error: 'password too short (min 6)' }, 400);
  }

  // 3. Confirm the student belongs to this teacher AND has an auth user.
  const { data: student, error: sErr } = await admin
    .from('students')
    .select('id, name, user_id, teacher_id')
    .eq('id', student_id)
    .maybeSingle();
  if (sErr) return jsonResponse({ error: 'student lookup failed', detail: sErr.message }, 500);
  if (!student) return jsonResponse({ error: 'student not found' }, 404);
  if (student.teacher_id !== teacher.id) {
    return jsonResponse({ error: 'forbidden: student belongs to another teacher' }, 403);
  }
  if (!student.user_id) {
    return jsonResponse({ error: 'student has no login (no auth user)' }, 400);
  }

  // 4. Reset.
  const { error: rErr } = await admin.auth.admin.updateUserById(student.user_id, { password: new_password });
  if (rErr) return jsonResponse({ error: 'reset failed', detail: rErr.message }, 400);

  // 5. Audit trail.
  await admin.rpc('log_action', {
    p_action:       'teacher_reset_student_password',
    p_target_table: 'students',
    p_target_id:    student.id,
    p_target_label: student.name,
    p_payload:      { auth_user_id: student.user_id, by_teacher_id: teacher.id, by_teacher_name: teacher.name },
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
