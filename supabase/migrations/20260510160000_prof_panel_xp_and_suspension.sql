-- ============================================================
-- Patch 1.4 — Professor self-service: XP adjust + suspension
--
-- Why
--   Patch 1.3+ already gave teachers ownership-gated reset/move/
--   delete + an action_log. The remaining gaps from prompt 1.4:
--     - adjust XP (level derives from xp via auto_level_up trigger,
--       so a single XP RPC is the cleanest knob);
--     - temporary suspension that blocks login.
--
--   Currency / cards are intentionally OUT of the teacher panel
--   (master-only), so no RPC for those exists for teachers.
--
-- This migration:
--   1. students.suspended_until + suspended_reason columns.
--   2. prof_adjust_student_xp(student_id, delta_xp)
--      - ownership-gated (students.teacher_id = caller's teacher.id)
--      - delegates the level recompute to auto_level_up trigger;
--      - never below zero.
--   3. prof_suspend_student(student_id, days, reason)
--   4. prof_unsuspend_student(student_id)
--   Each RPC writes to action_log via log_action().
-- ============================================================

-- ── 1. Suspension columns ────────────────────────────────────
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS suspended_until  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT;


-- ── 2. prof_adjust_student_xp ────────────────────────────────
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
  v_new_xp            INTEGER;
BEGIN
  IF p_delta_xp = 0 THEN
    RAISE EXCEPTION 'delta_xp must be non-zero' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_caller_teacher_id
  FROM   teachers WHERE user_id = auth.uid() LIMIT 1;
  IF v_caller_teacher_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: caller is not a teacher' USING ERRCODE = '42501';
  END IF;

  SELECT teacher_id, name, COALESCE(xp, 0)
    INTO v_student_teacher, v_student_name, v_old_xp
    FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found: %', p_student_id USING ERRCODE = 'P0002';
  END IF;
  IF v_student_teacher IS DISTINCT FROM v_caller_teacher_id THEN
    RAISE EXCEPTION 'forbidden: student belongs to another teacher' USING ERRCODE = '42501';
  END IF;

  v_new_xp := GREATEST(0, v_old_xp + p_delta_xp);

  -- Plain UPDATE: the auto_level_up BEFORE-UPDATE trigger on `xp`
  -- recomputes NEW.level for us, which means the
  -- enforce_student_character_update_only guard's "level only via
  -- xp gain" rule remains satisfied even when level changes.
  UPDATE students SET xp = v_new_xp WHERE id = p_student_id;

  PERFORM log_action(
    'prof_adjust_student_xp', 'students', p_student_id, v_student_name,
    jsonb_build_object('delta_xp', p_delta_xp, 'old_xp', v_old_xp, 'new_xp', v_new_xp)
  );
  RETURN v_new_xp;
END;
$$;
GRANT EXECUTE ON FUNCTION public.prof_adjust_student_xp(UUID, INTEGER) TO authenticated;


-- ── 3. prof_suspend_student ──────────────────────────────────
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
BEGIN
  IF p_days IS NULL OR p_days < 1 OR p_days > 365 THEN
    RAISE EXCEPTION 'days must be between 1 and 365' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_caller_teacher_id
  FROM   teachers WHERE user_id = auth.uid() LIMIT 1;
  IF v_caller_teacher_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: caller is not a teacher' USING ERRCODE = '42501';
  END IF;

  SELECT teacher_id, name INTO v_student_teacher, v_student_name
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

  PERFORM log_action(
    'prof_suspend_student', 'students', p_student_id, v_student_name,
    jsonb_build_object('days', p_days, 'until', v_until, 'reason', p_reason)
  );
  RETURN v_until;
END;
$$;
GRANT EXECUTE ON FUNCTION public.prof_suspend_student(UUID, INTEGER, TEXT) TO authenticated;


-- ── 4. prof_unsuspend_student ────────────────────────────────
CREATE OR REPLACE FUNCTION public.prof_unsuspend_student(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_teacher_id UUID;
  v_student_teacher   UUID;
  v_student_name      TEXT;
BEGIN
  SELECT id INTO v_caller_teacher_id
  FROM   teachers WHERE user_id = auth.uid() LIMIT 1;
  IF v_caller_teacher_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: caller is not a teacher' USING ERRCODE = '42501';
  END IF;

  SELECT teacher_id, name INTO v_student_teacher, v_student_name
    FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_student_teacher IS DISTINCT FROM v_caller_teacher_id THEN
    RAISE EXCEPTION 'forbidden: student belongs to another teacher' USING ERRCODE = '42501';
  END IF;

  UPDATE students
     SET suspended_until = NULL,
         suspended_reason = NULL
   WHERE id = p_student_id;

  PERFORM log_action('prof_unsuspend_student', 'students', p_student_id, v_student_name, '{}'::jsonb);
END;
$$;
GRANT EXECUTE ON FUNCTION public.prof_unsuspend_student(UUID) TO authenticated;
