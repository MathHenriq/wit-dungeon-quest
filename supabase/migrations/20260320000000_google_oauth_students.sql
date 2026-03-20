-- Migration: Google OAuth support for students
-- Run this in the Supabase SQL Editor

-- 1. Add user_id and status columns to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) UNIQUE,
  ADD COLUMN IF NOT EXISTS status  TEXT NOT NULL DEFAULT 'active';

-- 2. Add check constraint (safe to add even if some rows already exist with 'active')
ALTER TABLE students
  DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE students
  ADD CONSTRAINT students_status_check
    CHECK (status IN ('pending', 'active', 'rejected'));

-- 3. Fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- 4. Authenticated students can read their own row (for session restore after OAuth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'students'
      AND policyname = 'student_select_own_by_user_id'
  ) THEN
    CREATE POLICY "student_select_own_by_user_id"
      ON students FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 5. Authenticated students can self-register (insert their own pending row)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'students'
      AND policyname = 'student_insert_own_pending'
  ) THEN
    CREATE POLICY "student_insert_own_pending"
      ON students FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid() AND status = 'pending');
  END IF;
END $$;
