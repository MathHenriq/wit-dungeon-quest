-- ============================================================
-- WIT Dungeon — sensitive RPCs migrated to log_action_v2.
-- Captures before_state / after_state for the six destructive/financial RPCs
-- requested by the audit playbook. Bodies are otherwise byte-equivalent to the
-- prior definitions in 20260510150000_action_log_and_full_crud.sql and
-- 20260510160000_prof_panel_xp_and_suspension.sql — only the audit call and
-- the before/after capture changed.
-- ============================================================

-- 1. master_adjust_currency — before/after = {coins, diamonds}
CREATE OR REPLACE FUNCTION public.master_adjust_currency(
  p_student_id UUID, p_amount INTEGER, p_currency TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
  v_student_name TEXT;
  v_before JSONB;
  v_after  JSONB;
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

  SELECT name, jsonb_build_object('coins', COALESCE(coins, 0), 'diamonds', COALESCE(diamonds, 0))
    INTO v_student_name, v_before
    FROM students WHERE id = p_student_id;
  IF v_student_name IS NULL THEN
    RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_currency = 'coins' THEN
    UPDATE students SET coins = GREATEST(0, COALESCE(coins,0) + p_amount)
     WHERE id = p_student_id RETURNING coins INTO v_new_balance;
  ELSE
    UPDATE students SET diamonds = GREATEST(0, COALESCE(diamonds,0) + p_amount)
     WHERE id = p_student_id RETURNING diamonds INTO v_new_balance;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002'; END IF;

  SELECT jsonb_build_object('coins', COALESCE(coins, 0), 'diamonds', COALESCE(diamonds, 0))
    INTO v_after
    FROM students WHERE id = p_student_id;

  PERFORM log_action_v2(
    'master_adjust_currency', 'students', p_student_id, v_student_name,
    jsonb_build_object('currency', p_currency, 'amount', p_amount, 'new_balance', v_new_balance),
    v_before, v_after
  );
  RETURN v_new_balance;
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_adjust_currency(UUID, INTEGER, TEXT) TO authenticated, service_role;


-- 2. master_spawn_card — before/after = inventory count of the item for that student
CREATE OR REPLACE FUNCTION public.master_spawn_card(p_student_id UUID, p_item_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inv_id UUID;
  v_student_name TEXT;
  v_item_name TEXT;
  v_before_count INTEGER;
  v_after_count  INTEGER;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT name INTO v_student_name FROM students   WHERE id = p_student_id;
  IF v_student_name IS NULL THEN RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002'; END IF;
  SELECT name INTO v_item_name    FROM shop_items WHERE id = p_item_id;
  IF v_item_name IS NULL    THEN RAISE EXCEPTION 'item not found'    USING ERRCODE = 'P0002'; END IF;

  SELECT COUNT(*)::INT INTO v_before_count
    FROM student_inventory
   WHERE student_id = p_student_id AND item_id = p_item_id;

  SELECT id INTO v_inv_id
  FROM student_inventory
  WHERE student_id = p_student_id AND item_id = p_item_id LIMIT 1;

  IF v_inv_id IS NULL THEN
    INSERT INTO student_inventory (student_id, item_id)
    VALUES (p_student_id, p_item_id) RETURNING id INTO v_inv_id;
  END IF;

  SELECT COUNT(*)::INT INTO v_after_count
    FROM student_inventory
   WHERE student_id = p_student_id AND item_id = p_item_id;

  PERFORM log_action_v2(
    'master_spawn_card', 'student_inventory', v_inv_id, v_item_name,
    jsonb_build_object('student_id', p_student_id, 'student_name', v_student_name, 'item_id', p_item_id),
    jsonb_build_object('inventory_count', v_before_count),
    jsonb_build_object('inventory_count', v_after_count, 'inventory_id', v_inv_id, 'item_id', p_item_id)
  );
  RETURN v_inv_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_spawn_card(UUID, UUID) TO authenticated, service_role;


-- 3. teacher_delete_student — before = full student row, after = null
CREATE OR REPLACE FUNCTION public.teacher_delete_student(p_student_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_teacher_id UUID;
  v_student_user_id   UUID;
  v_student_name      TEXT;
  v_student_teacher   UUID;
  v_before            JSONB;
BEGIN
  SELECT id INTO v_caller_teacher_id
  FROM   teachers WHERE user_id = auth.uid() LIMIT 1;
  IF v_caller_teacher_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: caller is not a teacher' USING ERRCODE = '42501';
  END IF;

  SELECT teacher_id, user_id, name, to_jsonb(s.*)
  INTO   v_student_teacher, v_student_user_id, v_student_name, v_before
  FROM   students s WHERE id = p_student_id;
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

  PERFORM log_action_v2(
    'teacher_delete_student',
    'students', p_student_id, v_student_name,
    jsonb_build_object('auth_user_id', v_student_user_id),
    v_before, NULL
  );

  RETURN v_student_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.teacher_delete_student(UUID) TO authenticated;


-- 4. master_delete_class — before = class row, after = null
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
  v_before          JSONB;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT name, teacher_id, to_jsonb(c.*) INTO v_class_name, v_class_teacher_id, v_before
  FROM classes c WHERE id = p_class_id;
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

  PERFORM log_action_v2(
    'master_delete_class', 'classes', p_class_id, v_class_name,
    jsonb_build_object(
      'students_reassigned', v_student_count,
      'reassign_to_class_id', p_reassign_to_class_id,
      'former_teacher_id', v_class_teacher_id
    ),
    v_before, NULL
  );

  RETURN v_student_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_delete_class(UUID, UUID) TO authenticated;


-- 5. prof_adjust_student_xp — before/after = {xp, level}
CREATE OR REPLACE FUNCTION public.prof_adjust_student_xp(
  p_student_id UUID,
  p_delta_xp   INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_teacher_id UUID;
  v_student_teacher   UUID;
  v_student_name      TEXT;
  v_old_xp            INTEGER;
  v_old_level         INTEGER;
  v_new_xp            INTEGER;
  v_after             JSONB;
BEGIN
  IF p_delta_xp = 0 THEN
    RAISE EXCEPTION 'delta_xp must be non-zero' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_caller_teacher_id
  FROM   teachers WHERE user_id = auth.uid() LIMIT 1;
  IF v_caller_teacher_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: caller is not a teacher' USING ERRCODE = '42501';
  END IF;

  SELECT teacher_id, name, COALESCE(xp, 0), COALESCE(level, 1)
    INTO v_student_teacher, v_student_name, v_old_xp, v_old_level
    FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found: %', p_student_id USING ERRCODE = 'P0002';
  END IF;
  IF v_student_teacher IS DISTINCT FROM v_caller_teacher_id THEN
    RAISE EXCEPTION 'forbidden: student belongs to another teacher' USING ERRCODE = '42501';
  END IF;

  v_new_xp := GREATEST(0, v_old_xp + p_delta_xp);

  -- Plain UPDATE: the auto_level_up BEFORE-UPDATE trigger on `xp`
  -- recomputes NEW.level for us.
  UPDATE students SET xp = v_new_xp WHERE id = p_student_id;

  SELECT jsonb_build_object('xp', COALESCE(xp, 0), 'level', COALESCE(level, 1))
    INTO v_after
    FROM students WHERE id = p_student_id;

  PERFORM log_action_v2(
    'prof_adjust_student_xp', 'students', p_student_id, v_student_name,
    jsonb_build_object('delta_xp', p_delta_xp, 'old_xp', v_old_xp, 'new_xp', v_new_xp),
    jsonb_build_object('xp', v_old_xp, 'level', v_old_level),
    v_after
  );
  RETURN v_new_xp;
END;
$$;
GRANT EXECUTE ON FUNCTION public.prof_adjust_student_xp(UUID, INTEGER) TO authenticated;


-- 6. prof_suspend_student — before/after = {suspended_until, suspended_reason}
CREATE OR REPLACE FUNCTION public.prof_suspend_student(
  p_student_id UUID,
  p_days       INTEGER,
  p_reason     TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_teacher_id UUID;
  v_student_teacher   UUID;
  v_student_name      TEXT;
  v_until             TIMESTAMPTZ;
  v_old_until         TIMESTAMPTZ;
  v_old_reason        TEXT;
BEGIN
  IF p_days IS NULL OR p_days < 1 OR p_days > 365 THEN
    RAISE EXCEPTION 'days must be between 1 and 365' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_caller_teacher_id
  FROM   teachers WHERE user_id = auth.uid() LIMIT 1;
  IF v_caller_teacher_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: caller is not a teacher' USING ERRCODE = '42501';
  END IF;

  SELECT teacher_id, name, suspended_until, suspended_reason
    INTO v_student_teacher, v_student_name, v_old_until, v_old_reason
    FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_student_teacher IS DISTINCT FROM v_caller_teacher_id THEN
    RAISE EXCEPTION 'forbidden: student belongs to another teacher' USING ERRCODE = '42501';
  END IF;

  v_until := now() + (p_days || ' days')::INTERVAL;

  UPDATE students
     SET suspended_until  = v_until,
         suspended_reason = nullif(btrim(p_reason), '')
   WHERE id = p_student_id;

  PERFORM log_action_v2(
    'prof_suspend_student', 'students', p_student_id, v_student_name,
    jsonb_build_object('days', p_days, 'until', v_until, 'reason', p_reason),
    jsonb_build_object('suspended_until', v_old_until, 'suspended_reason', v_old_reason),
    jsonb_build_object('suspended_until', v_until, 'suspended_reason', nullif(btrim(p_reason), ''))
  );
  RETURN v_until;
END;
$$;
GRANT EXECUTE ON FUNCTION public.prof_suspend_student(UUID, INTEGER, TEXT) TO authenticated;
