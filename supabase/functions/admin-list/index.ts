// POST /admin-list
//
// Returns the data the admin panel needs to render in a single
// round-trip:  all teachers (with email), all classes, all students
// (with email).  Admin-only.

import { handleCors, isMasterAdminUserId, jsonResponse, requireAdmin, type AdminContext } from '../_shared/admin.ts';

async function mapAuthEmailsById(
  admin: AdminContext['admin'],
  userIds: string[],
): Promise<Map<string, string | null>> {
  const emailById = new Map<string, string | null>();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  // auth.admin.listUsers() can fail for the whole project if GoTrue hits a
  // bad auth row. Fetching by id keeps the admin panel usable and still gives
  // e-mails for the rows being rendered.
  const batchSize = 10;
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize);
    await Promise.all(batch.map(async (id) => {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (!error) emailById.set(id, data.user?.email ?? null);
    }));
  }

  return emailById;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;
  const { admin, callerUserId } = ctx;

  const { data: callerTeacher, error: callerTeacherErr } = await admin
    .from('teachers')
    .select('id')
    .eq('user_id', callerUserId)
    .maybeSingle();
  if (callerTeacherErr) return jsonResponse({ error: 'teacher lookup failed', detail: callerTeacherErr.message }, 500);
  if (!callerTeacher) return jsonResponse({ error: 'forbidden: caller is not a teacher' }, 403);

  const isMaster = isMasterAdminUserId(callerUserId);

  const teachersQuery = admin
    .from('teachers')
    .select('id, name, user_id, is_admin, created_at')
    .order('name');
  const classesQuery = admin
    .from('classes')
    .select('id, name, teacher_id, biome, description, created_at')
    .order('name');
  const studentsQuery = admin
    .from('students')
    .select('id, name, class_id, teacher_id, user_id, status, level, xp, created_at')
    .order('name');

  if (!isMaster) {
    teachersQuery.eq('id', callerTeacher.id);
    classesQuery.eq('teacher_id', callerTeacher.id);
    studentsQuery.eq('teacher_id', callerTeacher.id);
  }

  const [teachersRes, classesRes, studentsRes] = await Promise.all([
    teachersQuery,
    classesQuery,
    studentsQuery,
  ]);

  for (const r of [teachersRes, classesRes, studentsRes]) {
    if (r.error) return jsonResponse({ error: 'list failed', detail: r.error.message }, 500);
  }

  const authUserIds = [
    ...(teachersRes.data ?? []).map(t => t.user_id),
    ...(studentsRes.data ?? []).map(s => s.user_id),
  ].filter((id): id is string => Boolean(id));
  const emailById = await mapAuthEmailsById(admin, authUserIds);

  const teachers = (teachersRes.data ?? []).map(t => ({
    ...t,
    email: t.user_id ? emailById.get(t.user_id) ?? null : null,
  }));
  const students = (studentsRes.data ?? []).map(s => ({
    ...s,
    email: s.user_id ? emailById.get(s.user_id) ?? null : null,
  }));

  return jsonResponse({
    ok: true,
    teachers,
    classes: classesRes.data ?? [],
    students,
  });
});
