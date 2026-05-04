-- ============================================================
-- Allow authenticated students to "claim" an orphan students row
-- (one with user_id = NULL) on first registration.
--
-- Why
--   Pre-OAuth-removal student rows (pre-2026-04-28) have
--   user_id = NULL. When such a student registers via email/
--   password, the INSERT in registerStudent collides with the
--   UNIQUE (class_id, name) constraint. The recover path tries
--   .update().eq('user_id', auth.uid()) — which matches 0 rows
--   because the orphan has user_id = NULL — so registration
--   silently loops forever and the teacher never sees a request.
--
--   Even if the frontend tries to claim by (class_id, name),
--   the trigger enforce_student_character_update_only blocks it
--   because OLD.user_id (NULL) ≠ auth.uid().
--
-- Fix
--   Treat "I am claiming an orphan row" the same as "self":
--     OLD.user_id IS NULL  AND  NEW.user_id = auth.uid()
--
--   The UNIQUE (class_id, name) constraint already prevents two
--   distinct people from claiming the same name in the same
--   class. Teacher approval (status='pending') remains the
--   final gate before any actual access.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_student_character_update_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_uid        UUID    := auth.uid();
  v_is_teacher BOOLEAN;
  v_is_self    BOOLEAN;
BEGIN
  -- Anonymous path: keep the original narrow whitelist.
  IF v_uid IS NULL THEN
    IF NEW.name     IS DISTINCT FROM OLD.name     THEN RAISE EXCEPTION 'Not allowed: cannot change student name'; END IF;
    IF NEW.class_id IS DISTINCT FROM OLD.class_id THEN RAISE EXCEPTION 'Not allowed: cannot change class';        END IF;
    IF NEW.coins    IS DISTINCT FROM OLD.coins    THEN RAISE EXCEPTION 'Not allowed: cannot change coins';        END IF;
    IF NEW.level    IS DISTINCT FROM OLD.level    THEN RAISE EXCEPTION 'Not allowed: cannot change level';        END IF;
    RETURN NEW;
  END IF;

  v_is_teacher := EXISTS (SELECT 1 FROM public.teachers WHERE user_id = v_uid);
  IF v_is_teacher THEN
    RETURN NEW;  -- teachers may edit any student
  END IF;

  -- Self path: own row, OR claim an unclaimed orphan row by setting user_id to ourselves.
  v_is_self := (OLD.user_id = v_uid)
            OR (OLD.user_id IS NULL AND NEW.user_id = v_uid);

  IF NOT v_is_self THEN
    RAISE EXCEPTION 'Not allowed: students may only update their own record';
  END IF;

  -- Self path: prevent direct rewrites of `level` that don't come
  -- from a corresponding xp change. The auto_level_up trigger sets
  -- NEW.level whenever xp moves, so legitimate flows remain untouched.
  IF NEW.level IS DISTINCT FROM OLD.level
     AND NEW.xp IS NOT DISTINCT FROM OLD.xp THEN
    RAISE EXCEPTION 'Not allowed: level can only change via xp gain';
  END IF;

  -- Identity fields are off-limits for the student themselves —
  -- EXCEPT when claiming an orphan: NEW.user_id may transition
  -- from NULL → auth.uid() (and only that transition).
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    IF NOT (OLD.user_id IS NULL AND NEW.user_id = v_uid) THEN
      RAISE EXCEPTION 'Not allowed: cannot change user_id';
    END IF;
  END IF;
  IF NEW.teacher_id IS DISTINCT FROM OLD.teacher_id THEN RAISE EXCEPTION 'Not allowed: cannot change teacher_id'; END IF;
  IF NEW.class_id   IS DISTINCT FROM OLD.class_id   THEN RAISE EXCEPTION 'Not allowed: cannot change class';      END IF;

  RETURN NEW;
END;
$$;
