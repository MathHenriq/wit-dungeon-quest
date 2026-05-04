// POST /admin-list
//
// Returns the data the admin panel needs to render in a single
// round-trip:  all teachers (with email), all classes, all students
// (with email).  Admin-only.

import { handleCors, jsonResponse, requireAdmin } from '../_shared/admin.ts';

interface AuthUserLite {
  id: string;
  email: string | null;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;
  const { admin } = ctx;

  const [teachersRes, classesRes, studentsRes] = await Promise.all([
    admin.from('teachers').select('id, name, user_id, is_admin, created_at').order('name'),
    admin.from('classes').select('id, name, teacher_id, biome, description, created_at').order('name'),
    admin.from('students').select('id, name, class_id, teacher_id, user_id, status, level, xp, created_at').order('name'),
  ]);

  for (const r of [teachersRes, classesRes, studentsRes]) {
    if (r.error) return jsonResponse({ error: 'list failed', detail: r.error.message }, 500);
  }

  // Pull every auth user once, then join emails locally.  listUsers paginates;
  // this project has < a few thousand users, so we walk pages until empty.
  const emailById = new Map<string, string | null>();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return jsonResponse({ error: 'auth list failed', detail: error.message }, 500);
    const users: AuthUserLite[] = (data.users ?? []).map(u => ({ id: u.id, email: u.email ?? null }));
    if (users.length === 0) break;
    for (const u of users) emailById.set(u.id, u.email);
    if (users.length < 1000) break;
    page += 1;
  }

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
