// POST /admin-delete-student  { student_id: uuid }
//
// Cascade-deletes a student row, their character, and (if they had one)
// the linked auth.users entry. Admin-only.

import { handleCors, jsonResponse, requireAdmin } from '../_shared/admin.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;
  const { admin, callerUserId } = ctx;

  let body: { student_id?: string };
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid JSON body' }, 400); }
  const studentId = body.student_id;
  if (!studentId) return jsonResponse({ error: 'student_id required' }, 400);

  // RPC: deletes student + character, returns the auth user_id (or null).
  const { data: authUserId, error: rpcErr } = await admin.rpc('admin_delete_student_as', {
    p_student_id: studentId,
    p_caller_user_id: callerUserId,
  });
  if (rpcErr) return jsonResponse({ error: 'delete failed', detail: rpcErr.message }, 400);

  let authDeleted = false;
  if (authUserId) {
    const { error: authErr } = await admin.auth.admin.deleteUser(authUserId);
    if (authErr) {
      // Student/character are already gone — surface but don't fail the whole op.
      return jsonResponse({
        ok: true,
        student_deleted: true,
        auth_deleted: false,
        auth_user_id: authUserId,
        warning: `auth user delete failed: ${authErr.message}`,
      });
    }
    authDeleted = true;
  }

  return jsonResponse({
    ok: true,
    student_deleted: true,
    auth_deleted: authDeleted,
    auth_user_id: authUserId ?? null,
  });
});
