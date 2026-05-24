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

  /** Spawn a shop_item card into a student's inventory. Idempotent vs UNIQUE. */
  spawnCard: async (student_id: string, item_id: string) => {
    const { data, error } = await supabase.rpc("master_spawn_card", {
      p_student_id: student_id,
      p_item_id: item_id,
    });
    if (error) throw new Error(error.message);
    return data as string;
  },

  /** Add (positive) or subtract (negative) coins/diamonds. Cannot drive below 0. */
  adjustCurrency: async (
    student_id: string,
    amount: number,
    currency: "coins" | "diamonds",
  ) => {
    const { data, error } = await supabase.rpc("master_adjust_currency", {
      p_student_id: student_id,
      p_amount: amount,
      p_currency: currency,
    });
    if (error) throw new Error(error.message);
    return data as number;
  },

  /** Read shop_items (admin uses this to pick a card to spawn). */
  listShopItems: async () => {
    const { data, error } = await supabase
      .from("shop_items")
      .select("id, name, item_type, cost, min_level, is_active, teacher_id")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as ShopItemLite[];
  },

  // ── Master class CRUD ────────────────────────────────────────
  createClass: async (teacher_id: string, name: string, biome: string | null) => {
    const { data, error } = await supabase.rpc("master_create_class", {
      p_teacher_id: teacher_id, p_name: name, p_biome: biome,
    });
    if (error) throw new Error(error.message);
    return data as string;
  },

  updateClass: async (class_id: string, name: string, biome: string | null) => {
    const { error } = await supabase.rpc("master_update_class", {
      p_class_id: class_id, p_name: name, p_biome: biome,
    });
    if (error) throw new Error(error.message);
  },

  deleteClass: async (class_id: string, reassign_to_class_id: string | null) => {
    const { data, error } = await supabase.rpc("master_delete_class", {
      p_class_id: class_id, p_reassign_to_class_id: reassign_to_class_id,
    });
    if (error) throw new Error(error.message);
    return data as number; // number of students reassigned
  },

  // ── Master teacher mutations ─────────────────────────────────
  updateTeacher: async (teacher_id: string, name: string) => {
    const { error } = await supabase.rpc("master_update_teacher", {
      p_teacher_id: teacher_id, p_name: name,
    });
    if (error) throw new Error(error.message);
  },

  setTeacherAdmin: async (teacher_id: string, is_admin: boolean) => {
    const { error } = await supabase.rpc("master_set_admin", {
      p_teacher_id: teacher_id, p_is_admin: is_admin,
    });
    if (error) throw new Error(error.message);
  },

  // ── Action log ───────────────────────────────────────────────
  listLogs: async (limit = 200) => {
    const { data, error } = await supabase
      .from("action_log")
      .select("id, actor_user_id, actor_role, actor_name, action, target_table, target_id, target_label, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as ActionLogRow[];
  },
};

export interface ActionLogRow {
  id: number;
  actor_user_id: string | null;
  actor_role: string;
  actor_name: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  target_label: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

// ── Teacher self-service API (own students only, gated server-side) ──
export const teacherApi = {
  deleteStudent: async (student_id: string) => {
    const { data, error } = await supabase.rpc("teacher_delete_student", {
      p_student_id: student_id,
    });
    if (error) throw new Error(error.message);
    return data as string | null; // auth user id (or null)
  },

  moveStudentToOwnClass: async (student_id: string, class_id: string) => {
    const { error } = await supabase.rpc("teacher_move_student_to_own_class", {
      p_student_id: student_id, p_class_id: class_id,
    });
    if (error) throw new Error(error.message);
  },

  adjustXp: async (student_id: string, delta_xp: number) => {
    const { data, error } = await supabase.rpc("prof_adjust_student_xp", {
      p_student_id: student_id, p_delta_xp: delta_xp,
    });
    if (error) throw new Error(error.message);
    return data as number;
  },

  suspendStudent: async (student_id: string, days: number, reason: string) => {
    const { data, error } = await supabase.rpc("prof_suspend_student", {
      p_student_id: student_id, p_days: days, p_reason: reason,
    });
    if (error) throw new Error(error.message);
    return data as string; // ISO timestamp until
  },

  unsuspendStudent: async (student_id: string) => {
    const { error } = await supabase.rpc("prof_unsuspend_student", {
      p_student_id: student_id,
    });
    if (error) throw new Error(error.message);
  },

  resetStudentPassword: async (student_id: string, new_password: string) => {
    const { data, error } = await supabase.functions.invoke<{ ok: boolean }>(
      "teacher-reset-student-password",
      { body: { student_id, new_password } },
    );
    if (error) {
      let detail: string | undefined;
      const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
      if (ctx?.json) {
        try {
          const j = await ctx.json();
          detail = (j as { detail?: string; error?: string }).detail
                ?? (j as { error?: string }).error;
        } catch { /* ignore */ }
      }
      throw new Error(detail ?? error.message ?? "reset failed");
    }
    return data as { ok: boolean };
  },
};

export interface ShopItemLite {
  id: string;
  name: string;
  item_type: string;
  cost: number;
  min_level: number;
  is_active: boolean;
  teacher_id: string;
}
