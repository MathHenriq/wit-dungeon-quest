// POST /admin-delete-teacher  { teacher_id: uuid }
//
// Cascade-deletes a teacher: the teacher row (FKs cascade to classes,
// students, challenges, shop_items, etc.), any orphan character rows,
// and the auth.users entry. Refuses to delete the calling admin.

import { handleCors, jsonResponse, requireAdmin } from '../_shared/admin.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;
  const { admin } = ctx;

  let body: { teacher_id?: string };
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid JSON body' }, 400); }
  const teacherId = body.teacher_id;
  if (!teacherId) return jsonResponse({ error: 'teacher_id required' }, 400);

  const { data: authUserId, error: rpcErr } = await admin.rpc('admin_delete_teacher', {
    p_teacher_id: teacherId,
  });
  if (rpcErr) return jsonResponse({ error: 'delete failed', detail: rpcErr.message }, 400);

  let authDeleted = false;
  if (authUserId) {
    const { error: authErr } = await admin.auth.admin.deleteUser(authUserId);
    if (authErr) {
      return jsonResponse({
        ok: true,
        teacher_deleted: true,
        auth_deleted: false,
        auth_user_id: authUserId,
        warning: `auth user delete failed: ${authErr.message}`,
      });
    }
    authDeleted = true;
  }

  return jsonResponse({
    ok: true,
    teacher_deleted: true,
    auth_deleted: authDeleted,
    auth_user_id: authUserId ?? null,
  });
});
