import { supabase } from "@/integrations/supabase/client";

// Thin client for the admin-* Edge Functions.
//
// Every endpoint forwards the current user's bearer token via
// `supabase.functions.invoke`, which the function then validates
// (must belong to a teacher with is_admin = true).

export interface DeleteStudentResult {
  ok: boolean;
  student_deleted: boolean;
  auth_deleted: boolean;
  auth_user_id: string | null;
  warning?: string;
}

export interface DeleteTeacherResult {
  ok: boolean;
  teacher_deleted: boolean;
  auth_deleted: boolean;
  auth_user_id: string | null;
  warning?: string;
}

export interface AdminTeacherRow {
  id: string;
  name: string;
  user_id: string | null;
  is_admin: boolean;
  email: string | null;
  created_at: string;
}

export interface AdminClassRow {
  id: string;
  name: string;
  teacher_id: string;
  biome: string | null;
  description: string | null;
  created_at: string;
}

export interface AdminStudentRow {
  id: string;
  name: string;
  class_id: string;
  teacher_id: string;
  user_id: string | null;
  status: string;
  level: number;
  xp: number;
  email: string | null;
  created_at: string;
}

export interface AdminListResult {
  ok: boolean;
  teachers: AdminTeacherRow[];
  classes: AdminClassRow[];
  students: AdminStudentRow[];
}

export interface CreateStudentInput {
  class_id: string;
  name: string;
  email: string;
  password: string;
  status?: "active" | "pending";
}

async function call<TIn extends Record<string, unknown>, TOut>(
  fn: string,
  body: TIn,
): Promise<TOut> {
  const { data, error } = await supabase.functions.invoke<TOut>(fn, { body });
  if (error) {
    // The Edge Function may have returned a JSON error body. Try to surface it.
    let detail: string | undefined;
    const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (ctx?.json) {
      try {
        const j = await ctx.json();
        detail = (j as { detail?: string; error?: string }).detail
              ?? (j as { error?: string }).error;
      } catch { /* ignore */ }
    }
    throw new Error(detail ?? error.message ?? `${fn} failed`);
  }
  return data as TOut;
}

export const adminApi = {
  list: () => call<Record<string, never>, AdminListResult>("admin-list", {}),

  deleteStudent: (student_id: string) =>
    call<{ student_id: string }, DeleteStudentResult>("admin-delete-student", { student_id }),

  deleteTeacher: (teacher_id: string) =>
    call<{ teacher_id: string }, DeleteTeacherResult>("admin-delete-teacher", { teacher_id }),

  createStudent: (input: CreateStudentInput) =>
    call<CreateStudentInput, { ok: boolean; student: unknown; auth_user_id: string }>(
      "admin-create-student",
      input,
    ),

  resetPassword: (auth_user_id: string, new_password: string) =>
    call<{ auth_user_id: string; new_password: string }, { ok: boolean }>(
      "admin-reset-password",
      { auth_user_id, new_password },
    ),

  /** Move a student between classes, bypassing the "cannot change class" trigger. */
  moveStudentToClass: async (student_id: string, class_id: string) => {
    const { error } = await supabase.rpc("admin_assign_student_to_class", {
      p_student_id: student_id,
      p_class_id: class_id,
    });
    if (error) throw new Error(error.message);
  },
};
