-- ============================================================
-- Audit log + RLS hardening for public.students
--
-- Why:
--   - The current security model lets ANY authenticated user
--     write to ANY student row (RLS USING (true) + the
--     enforce_student_character_update_only trigger only
--     guards the anonymous path with auth.uid() IS NULL).
--   - There is no record of who changed what.
--
-- This migration:
--   1. Resets the test student "FEFE" (id 35e6b2e1-…) back to
--      a clean level-1 state.
--   2. Adds public.student_audit_log + a trigger that logs
--      every change to level / xp / coins / diamonds /
--      pontos_disponiveis on public.students.
--   3. Tightens enforce_student_character_update_only so:
--        - anon path keeps its existing column whitelist;
--        - authenticated students can only update their OWN
--          row (no cross-row writes), and cannot rewrite
--          `level` directly without an accompanying `xp`
--          change (the auto_level_up trigger remains the
--          only legitimate way to change level);
--        - teachers and SECURITY DEFINER RPCs continue to
--          work with no restriction.
-- ============================================================

-- ── 1. Reset FEFE ────────────────────────────────────────────
ALTER TABLE public.students DISABLE TRIGGER enforce_student_character_update_only;

UPDATE public.students
SET    xp = 0,
       level = 1,
       pontos_disponiveis = 0,
       attr_forca = 0,
       attr_destreza = 0,
       attr_inteligencia = 0,
       attr_carisma = 0,
       attr_agilidade = 0,
       attr_resistencia = 0
WHERE  id = '35e6b2e1-ea83-414f-8cd3-293e11f53025'::uuid;

ALTER TABLE public.students ENABLE TRIGGER enforce_student_character_update_only;


-- ── 2. Audit log table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_audit_log (
  id                  BIGSERIAL    PRIMARY KEY,
  student_id          UUID         NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  changed_by_user_id  UUID,
  changed_by_role     TEXT,
  column_name         TEXT         NOT NULL,
  old_value           TEXT,
  new_value           TEXT,
  changed_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_audit_log_student_id ON public.student_audit_log (student_id);
CREATE INDEX IF NOT EXISTS idx_student_audit_log_changed_at ON public.student_audit_log (changed_at DESC);

ALTER TABLE public.student_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers read own students audit" ON public.student_audit_log;
CREATE POLICY "Teachers read own students audit"
  ON public.student_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.teachers t ON t.id = s.teacher_id
      WHERE s.id = student_audit_log.student_id
        AND t.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.student_audit_log TO authenticated;


-- ── 3. Audit trigger function ────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_student_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_role TEXT;
BEGIN
  IF v_uid IS NULL THEN
    v_role := 'system_or_anon';
  ELSIF EXISTS (SELECT 1 FROM public.teachers WHERE user_id = v_uid) THEN
    v_role := 'teacher';
  ELSIF EXISTS (SELECT 1 FROM public.students WHERE user_id = v_uid AND id = NEW.id) THEN
    v_role := 'self';
  ELSIF EXISTS (SELECT 1 FROM public.students WHERE user_id = v_uid) THEN
    v_role := 'other_student';
  ELSE
    v_role := 'unknown';
  END IF;

  IF NEW.level IS DISTINCT FROM OLD.level THEN
    INSERT INTO public.student_audit_log (student_id, changed_by_user_id, changed_by_role, column_name, old_value, new_value)
    VALUES (NEW.id, v_uid, v_role, 'level', OLD.level::TEXT, NEW.level::TEXT);
  END IF;

  IF NEW.xp IS DISTINCT FROM OLD.xp THEN
    INSERT INTO public.student_audit_log (student_id, changed_by_user_id, changed_by_role, column_name, old_value, new_value)
    VALUES (NEW.id, v_uid, v_role, 'xp', OLD.xp::TEXT, NEW.xp::TEXT);
  END IF;

  IF NEW.coins IS DISTINCT FROM OLD.coins THEN
    INSERT INTO public.student_audit_log (student_id, changed_by_user_id, changed_by_role, column_name, old_value, new_value)
    VALUES (NEW.id, v_uid, v_role, 'coins', OLD.coins::TEXT, NEW.coins::TEXT);
  END IF;

  IF NEW.diamonds IS DISTINCT FROM OLD.diamonds THEN
    INSERT INTO public.student_audit_log (student_id, changed_by_user_id, changed_by_role, column_name, old_value, new_value)
    VALUES (NEW.id, v_uid, v_role, 'diamonds', OLD.diamonds::TEXT, NEW.diamonds::TEXT);
  END IF;

  IF NEW.pontos_disponiveis IS DISTINCT FROM OLD.pontos_disponiveis THEN
    INSERT INTO public.student_audit_log (student_id, changed_by_user_id, changed_by_role, column_name, old_value, new_value)
    VALUES (NEW.id, v_uid, v_role, 'pontos_disponiveis', OLD.pontos_disponiveis::TEXT, NEW.pontos_disponiveis::TEXT);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_student_sensitive_fields_trg ON public.students;
CREATE TRIGGER audit_student_sensitive_fields_trg
AFTER UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.audit_student_sensitive_fields();


-- ── 4. Hardened guard trigger ────────────────────────────────
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

  v_is_self := (OLD.user_id = v_uid);

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

  -- Identity fields are off-limits for the student themselves.
  IF NEW.user_id   IS DISTINCT FROM OLD.user_id   THEN RAISE EXCEPTION 'Not allowed: cannot change user_id'; END IF;
  IF NEW.teacher_id IS DISTINCT FROM OLD.teacher_id THEN RAISE EXCEPTION 'Not allowed: cannot change teacher_id'; END IF;
  IF NEW.class_id  IS DISTINCT FROM OLD.class_id  THEN RAISE EXCEPTION 'Not allowed: cannot change class'; END IF;

  RETURN NEW;
END;
$$;

-- The trigger itself is already defined; we only replaced the function.
