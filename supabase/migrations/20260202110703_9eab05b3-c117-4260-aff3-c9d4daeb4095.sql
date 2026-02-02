-- Allow unauthenticated students to persist character customization
-- (without allowing them to change identity/economy fields)

-- 1) RLS: allow UPDATEs on students (guarded by trigger below)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'students'
      AND policyname = 'Anyone can update student character'
  ) THEN
    CREATE POLICY "Anyone can update student character"
      ON public.students
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 2) Trigger: for anonymous users, block updates to sensitive fields
CREATE OR REPLACE FUNCTION public.enforce_student_character_update_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Teachers are authenticated; they may update any fields allowed by existing RLS.
  IF auth.uid() IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Anonymous updates are allowed ONLY for character/narrative fields.
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    RAISE EXCEPTION 'Not allowed: cannot change student name';
  END IF;

  IF NEW.class_id IS DISTINCT FROM OLD.class_id THEN
    RAISE EXCEPTION 'Not allowed: cannot change class';
  END IF;

  IF NEW.coins IS DISTINCT FROM OLD.coins THEN
    RAISE EXCEPTION 'Not allowed: cannot change coins';
  END IF;

  IF NEW.level IS DISTINCT FROM OLD.level THEN
    RAISE EXCEPTION 'Not allowed: cannot change level';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_student_character_update_only ON public.students;
CREATE TRIGGER enforce_student_character_update_only
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.enforce_student_character_update_only();
