-- ============================================================
-- ADMIN PANEL: super-admin role + cascade delete RPCs
-- ============================================================
-- Adds is_admin flag on teachers and SECURITY DEFINER helpers used
-- by Edge Functions to perform full-cascade deletes and admin-only
-- mutations.  The Edge Function is responsible for re-checking the
-- caller is admin before invoking any of these helpers.
-- ============================================================

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Bootstrap: mark the developer's own teacher rows as admin.
UPDATE public.teachers
   SET is_admin = true
 WHERE id IN (
   '43e51ee5-50e6-410b-b1a4-a3023ec37494',  -- Matheus Macedo
   'b5c8d6b2-b606-4930-aa12-0631570f28e7'   -- Matheus "Macedo" Henrique
 );

-- ----------------------------------------------------------------
-- Helper: is the calling auth user an admin?
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_caller_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.teachers WHERE user_id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_caller_admin() TO authenticated, anon, service_role;

-- ----------------------------------------------------------------
-- admin_delete_student(student_id)
-- Deletes a student row, the linked character (if any), and all
-- dependents that don't already have ON DELETE CASCADE.
-- Returns the auth user_id that should be deleted alongside (NULL
-- if the student wasn't bound to an auth user).
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_student(p_student_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT user_id INTO v_user_id FROM public.students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found: %', p_student_id USING ERRCODE = 'P0002';
  END IF;

  -- Drop the linked character first (FK has no ON DELETE CASCADE).
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.characters WHERE user_id = v_user_id;
  END IF;

  DELETE FROM public.students WHERE id = p_student_id;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_student(UUID) TO authenticated, service_role;

-- ----------------------------------------------------------------
-- admin_delete_teacher(teacher_id)
-- Deletes a teacher row.  Most descendants (classes -> students,
-- challenges, shop_items, etc.) cascade through the existing FKs.
-- Returns the auth user_id.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_teacher(p_teacher_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_self    BOOLEAN;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, (user_id = auth.uid()) INTO v_user_id, v_self
    FROM public.teachers WHERE id = p_teacher_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'teacher not found: %', p_teacher_id USING ERRCODE = 'P0002';
  END IF;

  IF v_self THEN
    RAISE EXCEPTION 'refusing to delete the calling admin' USING ERRCODE = '42501';
  END IF;

  -- Clean up character rows linked to any students under this teacher's classes
  -- (FK from characters.user_id -> auth.users has no cascade).
  DELETE FROM public.characters
   WHERE user_id IN (
     SELECT s.user_id FROM public.students s
      WHERE s.teacher_id = p_teacher_id AND s.user_id IS NOT NULL
   );

  DELETE FROM public.teachers WHERE id = p_teacher_id;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_teacher(UUID) TO authenticated, service_role;

-- ----------------------------------------------------------------
-- admin_assign_student_to_class(student_id, class_id)
-- Bypasses the "cannot change class" trigger so admins can move a
-- student between classes when needed.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_assign_student_to_class(
  p_student_id UUID,
  p_class_id   UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  -- Disable the protective trigger for this transaction.
  SET LOCAL session_replication_role = 'replica';
  UPDATE public.students SET class_id = p_class_id WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found: %', p_student_id USING ERRCODE = 'P0002';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_student_to_class(UUID, UUID)
  TO authenticated, service_role;
