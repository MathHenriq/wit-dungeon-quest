-- ============================================================
-- Patch 1.3+ — Full master CRUD, teacher self-service ops, action log
--
-- Why
--   1. Master needs a complete CRUD from the panel (no more
--      AnyDesk → Claude Code shortcut to delete data).
--   2. Teachers need to reset/delete/move their OWN students
--      without escalating to master.
--   3. Master needs visibility into every admin/teacher
--      action: a Logs tab.
--
-- This migration:
--   1. action_log table + log_action() helper.
--   2. Teacher-scoped RPCs:
--        teacher_delete_student(student_id)
--        teacher_move_student_to_own_class(student_id, class_id)
--      Both gate on ownership (students.teacher_id =
--      caller's teacher.id).
--   3. Master class CRUD:
--        master_create_class(teacher_id, name, biome)
--        master_update_class(class_id, name, biome)
--        master_delete_class(class_id, reassign_to_class_id)
--   4. Master teacher mutations:
--        master_update_teacher(teacher_id, name)
--        master_set_admin(teacher_id, is_admin)
--      with self-demotion guard.
--   5. Wrap existing master_*/admin_* RPCs to call log_action
--      on success.
-- ============================================================

-- ── 1. action_log + log_action helper ────────────────────────
CREATE TABLE IF NOT EXISTS public.action_log (
  id             BIGSERIAL    PRIMARY KEY,
  actor_user_id  UUID,
  actor_role     TEXT         NOT NULL,
  actor_name     TEXT,
  action         TEXT         NOT NULL,
  target_table   TEXT,
  target_id      UUID,
  target_label   TEXT,
  payload        JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_log_created_at ON public.action_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_log_actor      ON public.action_log (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_action_log_action     ON public.action_log (action);

ALTER TABLE public.action_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read action_log" ON public.action_log;
CREATE POLICY "Admins read action_log"
  ON public.action_log FOR SELECT TO authenticated
  USING (public.is_caller_admin());

GRANT SELECT ON public.action_log TO authenticated;
GRANT INSERT ON public.action_log TO authenticated, anon, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.action_log_id_seq TO authenticated, anon, service_role;


CREATE OR REPLACE FUNCTION public.log_action(
  p_action       TEXT,
  p_target_table TEXT  DEFAULT NULL,
  p_target_id    UUID  DEFAULT NULL,
  p_target_label TEXT  DEFAULT NULL,
  p_payload      JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_role TEXT;
  v_name TEXT;
  v_id   BIGINT;
BEGIN
  IF v_uid IS NULL THEN
    v_role := 'system';
  ELSIF EXISTS (SELECT 1 FROM teachers WHERE user_id = v_uid AND COALESCE(is_admin, false)) THEN
    v_role := 'admin';
    SELECT name INTO v_name FROM teachers WHERE user_id = v_uid LIMIT 1;
  ELSIF EXISTS (SELECT 1 FROM teachers WHERE user_id = v_uid) THEN
    v_role := 'teacher';
    SELECT name INTO v_name FROM teachers WHERE user_id = v_uid LIMIT 1;
  ELSIF EXISTS (SELECT 1 FROM students WHERE user_id = v_uid) THEN
    v_role := 'student';
    SELECT name INTO v_name FROM students WHERE user_id = v_uid LIMIT 1;
  ELSE
    v_role := 'unknown';
  END IF;

  INSERT INTO action_log (actor_user_id, actor_role, actor_name, action, target_table, target_id, target_label, payload)
  VALUES (v_uid, v_role, v_name, p_action, p_target_table, p_target_id, p_target_label, COALESCE(p_payload, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_action(TEXT, TEXT, UUID, TEXT, JSONB)
  TO authenticated, anon, service_role;


-- ── 2. Teacher-scoped self-service RPCs ──────────────────────
CREATE OR REPLACE FUNCTION public.teacher_delete_student(p_student_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_teacher_id UUID;
  v_student_user_id   UUID;
  v_student_name      TEXT;
  v_student_teacher   UUID;
BEGIN
  SELECT id INTO v_caller_teacher_id
  FROM   teachers WHERE user_id = auth.uid() LIMIT 1;
  IF v_caller_teacher_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: caller is not a teacher' USING ERRCODE = '42501';
  END IF;

  SELECT teacher_id, user_id, name
  INTO   v_student_teacher, v_student_user_id, v_student_name
  FROM   students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found: %', p_student_id USING ERRCODE = 'P0002';
  END IF;
  IF v_student_teacher IS DISTINCT FROM v_caller_teacher_id THEN
    RAISE EXCEPTION 'forbidden: student belongs to another teacher' USING ERRCODE = '42501';
  END IF;

  IF v_student_user_id IS NOT NULL THEN
    DELETE FROM characters WHERE user_id = v_student_user_id;
  END IF;
  DELETE FROM students WHERE id = p_student_id;

  PERFORM log_action(
    'teacher_delete_student',
    'students', p_student_id, v_student_name,
    jsonb_build_object('auth_user_id', v_student_user_id)
  );

  RETURN v_student_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.teacher_delete_student(UUID) TO authenticated;


CREATE OR REPLACE FUNCTION public.teacher_move_student_to_own_class(
  p_student_id UUID,
  p_class_id   UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_teacher_id UUID;
  v_student_teacher   UUID;
  v_student_name      TEXT;
  v_class_teacher     UUID;
  v_class_name        TEXT;
BEGIN
  SELECT id INTO v_caller_teacher_id
  FROM   teachers WHERE user_id = auth.uid() LIMIT 1;
  IF v_caller_teacher_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: caller is not a teacher' USING ERRCODE = '42501';
  END IF;

  SELECT teacher_id, name INTO v_student_teacher, v_student_name FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002'; END IF;
  IF v_student_teacher IS DISTINCT FROM v_caller_teacher_id THEN
    RAISE EXCEPTION 'forbidden: student belongs to another teacher' USING ERRCODE = '42501';
  END IF;

  SELECT teacher_id, name INTO v_class_teacher, v_class_name FROM classes WHERE id = p_class_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'class not found' USING ERRCODE = 'P0002'; END IF;
  IF v_class_teacher IS DISTINCT FROM v_caller_teacher_id THEN
    RAISE EXCEPTION 'forbidden: target class belongs to another teacher' USING ERRCODE = '42501';
  END IF;

  -- Bypass the "cannot change class" trigger for this transaction.
  SET LOCAL session_replication_role = 'replica';
  UPDATE students SET class_id = p_class_id WHERE id = p_student_id;

  PERFORM log_action(
    'teacher_move_student',
    'students', p_student_id, v_student_name,
    jsonb_build_object('to_class_id', p_class_id, 'to_class_name', v_class_name)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.teacher_move_student_to_own_class(UUID, UUID) TO authenticated;


-- ── 3. Master class CRUD ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.master_create_class(
  p_teacher_id UUID,
  p_name       TEXT,
  p_biome      TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;
  IF nullif(btrim(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'class name required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM teachers WHERE id = p_teacher_id) THEN
    RAISE EXCEPTION 'teacher not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO classes (teacher_id, name, biome)
  VALUES (p_teacher_id, btrim(p_name), nullif(p_biome, ''))
  RETURNING id INTO v_id;

  PERFORM log_action(
    'master_create_class',
    'classes', v_id, btrim(p_name),
    jsonb_build_object('teacher_id', p_teacher_id, 'biome', p_biome)
  );
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_create_class(UUID, TEXT, TEXT) TO authenticated;


CREATE OR REPLACE FUNCTION public.master_update_class(
  p_class_id UUID,
  p_name     TEXT,
  p_biome    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  UPDATE classes
     SET name  = COALESCE(nullif(btrim(p_name), ''), name),
         biome = COALESCE(nullif(p_biome, ''), biome)
   WHERE id = p_class_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'class not found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM log_action(
    'master_update_class', 'classes', p_class_id, p_name,
    jsonb_build_object('biome', p_biome)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_update_class(UUID, TEXT, TEXT) TO authenticated;


CREATE OR REPLACE FUNCTION public.master_delete_class(
  p_class_id            UUID,
  p_reassign_to_class_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_class_name      TEXT;
  v_student_count   INTEGER;
  v_dest_teacher_id UUID;
  v_class_teacher_id UUID;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT name, teacher_id INTO v_class_name, v_class_teacher_id
  FROM classes WHERE id = p_class_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'class not found' USING ERRCODE = 'P0002'; END IF;

  SELECT COUNT(*) INTO v_student_count FROM students WHERE class_id = p_class_id;

  IF v_student_count > 0 THEN
    IF p_reassign_to_class_id IS NULL THEN
      RAISE EXCEPTION 'class has % student(s); pass p_reassign_to_class_id to move them first', v_student_count
        USING ERRCODE = '23503';
    END IF;
    IF p_reassign_to_class_id = p_class_id THEN
      RAISE EXCEPTION 'reassign target cannot be the class being deleted' USING ERRCODE = '22023';
    END IF;
    SELECT teacher_id INTO v_dest_teacher_id FROM classes WHERE id = p_reassign_to_class_id;
    IF v_dest_teacher_id IS NULL THEN
      RAISE EXCEPTION 'reassign target class not found' USING ERRCODE = 'P0002';
    END IF;

    SET LOCAL session_replication_role = 'replica';
    UPDATE students
       SET class_id = p_reassign_to_class_id,
           teacher_id = v_dest_teacher_id
     WHERE class_id = p_class_id;
  END IF;

  DELETE FROM classes WHERE id = p_class_id;

  PERFORM log_action(
    'master_delete_class', 'classes', p_class_id, v_class_name,
    jsonb_build_object(
      'students_reassigned', v_student_count,
      'reassign_to_class_id', p_reassign_to_class_id,
      'former_teacher_id', v_class_teacher_id
    )
  );

  RETURN v_student_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_delete_class(UUID, UUID) TO authenticated;


-- ── 4. Master teacher mutations ──────────────────────────────
CREATE OR REPLACE FUNCTION public.master_update_teacher(
  p_teacher_id UUID,
  p_name       TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  UPDATE teachers SET name = nullif(btrim(p_name), '') WHERE id = p_teacher_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'teacher not found' USING ERRCODE = 'P0002'; END IF;

  PERFORM log_action(
    'master_update_teacher', 'teachers', p_teacher_id, p_name,
    '{}'::jsonb
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_update_teacher(UUID, TEXT) TO authenticated;


CREATE OR REPLACE FUNCTION public.master_set_admin(
  p_teacher_id UUID,
  p_is_admin   BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_target_user_id UUID;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT user_id INTO v_target_user_id FROM teachers WHERE id = p_teacher_id;
  IF v_target_user_id IS NULL AND NOT EXISTS (SELECT 1 FROM teachers WHERE id = p_teacher_id) THEN
    RAISE EXCEPTION 'teacher not found' USING ERRCODE = 'P0002';
  END IF;

  -- Refuse to demote yourself (would lock you out of the panel).
  IF p_is_admin = false AND v_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot demote yourself' USING ERRCODE = '42501';
  END IF;

  UPDATE teachers SET is_admin = p_is_admin WHERE id = p_teacher_id;

  PERFORM log_action(
    'master_set_admin', 'teachers', p_teacher_id, NULL,
    jsonb_build_object('is_admin', p_is_admin)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_set_admin(UUID, BOOLEAN) TO authenticated;


-- ── 5. Wrap existing master_*/admin_* RPCs to log on success ─

-- master_spawn_card: re-define with logging
CREATE OR REPLACE FUNCTION public.master_spawn_card(p_student_id UUID, p_item_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inv_id UUID;
  v_student_name TEXT;
  v_item_name TEXT;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT name INTO v_student_name FROM students   WHERE id = p_student_id;
  IF v_student_name IS NULL THEN RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002'; END IF;
  SELECT name INTO v_item_name    FROM shop_items WHERE id = p_item_id;
  IF v_item_name IS NULL    THEN RAISE EXCEPTION 'item not found'    USING ERRCODE = 'P0002'; END IF;

  SELECT id INTO v_inv_id
  FROM student_inventory
  WHERE student_id = p_student_id AND item_id = p_item_id LIMIT 1;

  IF v_inv_id IS NULL THEN
    INSERT INTO student_inventory (student_id, item_id)
    VALUES (p_student_id, p_item_id) RETURNING id INTO v_inv_id;
  END IF;

  PERFORM log_action(
    'master_spawn_card', 'student_inventory', v_inv_id, v_item_name,
    jsonb_build_object('student_id', p_student_id, 'student_name', v_student_name, 'item_id', p_item_id)
  );
  RETURN v_inv_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_spawn_card(UUID, UUID) TO authenticated, service_role;


-- master_adjust_currency: re-define with logging
CREATE OR REPLACE FUNCTION public.master_adjust_currency(
  p_student_id UUID, p_amount INTEGER, p_currency TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
  v_student_name TEXT;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;
  IF p_currency NOT IN ('coins', 'diamonds') THEN
    RAISE EXCEPTION 'invalid currency: %', p_currency USING ERRCODE = '22023';
  END IF;
  IF p_amount = 0 THEN
    RAISE EXCEPTION 'amount must be non-zero' USING ERRCODE = '22023';
  END IF;

  SELECT name INTO v_student_name FROM students WHERE id = p_student_id;

  IF p_currency = 'coins' THEN
    UPDATE students SET coins = GREATEST(0, COALESCE(coins,0) + p_amount)
     WHERE id = p_student_id RETURNING coins INTO v_new_balance;
  ELSE
    UPDATE students SET diamonds = GREATEST(0, COALESCE(diamonds,0) + p_amount)
     WHERE id = p_student_id RETURNING diamonds INTO v_new_balance;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002'; END IF;

  PERFORM log_action(
    'master_adjust_currency', 'students', p_student_id, v_student_name,
    jsonb_build_object('currency', p_currency, 'amount', p_amount, 'new_balance', v_new_balance)
  );
  RETURN v_new_balance;
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_adjust_currency(UUID, INTEGER, TEXT) TO authenticated, service_role;


-- admin_assign_student_to_class: re-define with logging
CREATE OR REPLACE FUNCTION public.admin_assign_student_to_class(
  p_student_id UUID, p_class_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_name TEXT;
  v_class_name   TEXT;
  v_class_teacher_id UUID;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT name INTO v_student_name FROM students WHERE id = p_student_id;
  IF v_student_name IS NULL THEN RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002'; END IF;
  SELECT name, teacher_id INTO v_class_name, v_class_teacher_id FROM classes WHERE id = p_class_id;
  IF v_class_name IS NULL THEN RAISE EXCEPTION 'class not found' USING ERRCODE = 'P0002'; END IF;

  SET LOCAL session_replication_role = 'replica';
  UPDATE students
     SET class_id = p_class_id,
         teacher_id = v_class_teacher_id
   WHERE id = p_student_id;

  PERFORM log_action(
    'admin_assign_student_to_class', 'students', p_student_id, v_student_name,
    jsonb_build_object('class_id', p_class_id, 'class_name', v_class_name, 'teacher_id', v_class_teacher_id)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_assign_student_to_class(UUID, UUID) TO authenticated, service_role;


-- admin_delete_student: re-define with logging
CREATE OR REPLACE FUNCTION public.admin_delete_student(p_student_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_name    TEXT;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, name INTO v_user_id, v_name FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'student not found: %', p_student_id USING ERRCODE = 'P0002'; END IF;

  IF v_user_id IS NOT NULL THEN
    DELETE FROM characters WHERE user_id = v_user_id;
  END IF;
  DELETE FROM students WHERE id = p_student_id;

  PERFORM log_action(
    'admin_delete_student', 'students', p_student_id, v_name,
    jsonb_build_object('auth_user_id', v_user_id)
  );
  RETURN v_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_student(UUID) TO authenticated, service_role;


-- admin_delete_teacher: re-define with logging
CREATE OR REPLACE FUNCTION public.admin_delete_teacher(p_teacher_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_self    BOOLEAN;
  v_name    TEXT;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, (user_id = auth.uid()), name
  INTO v_user_id, v_self, v_name
  FROM teachers WHERE id = p_teacher_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'teacher not found: %', p_teacher_id USING ERRCODE = 'P0002'; END IF;
  IF v_self THEN
    RAISE EXCEPTION 'refusing to delete the calling admin' USING ERRCODE = '42501';
  END IF;

  DELETE FROM characters
   WHERE user_id IN (
     SELECT s.user_id FROM students s
      WHERE s.teacher_id = p_teacher_id AND s.user_id IS NOT NULL
   );
  DELETE FROM teachers WHERE id = p_teacher_id;

  PERFORM log_action(
    'admin_delete_teacher', 'teachers', p_teacher_id, v_name,
    jsonb_build_object('auth_user_id', v_user_id)
  );
  RETURN v_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_teacher(UUID) TO authenticated, service_role;
