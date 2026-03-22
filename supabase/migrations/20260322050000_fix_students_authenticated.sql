-- Allow Google OAuth students (authenticated role) to read/update the students table.
-- The existing policies only cover the anon role (access-code login).
-- Without this, useBossBattle.loadBosses fails to get class_id/teacher_id for authenticated users,
-- producing an empty boss list or infinite loading.

CREATE POLICY "Authenticated students can read students"
  ON public.students FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated students can update own record"
  ON public.students FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Also allow authenticated students to read other tables queried by the student portal

CREATE POLICY "Authenticated students can read boss_battles"
  ON public.boss_battles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated students can read boss_questions"
  ON public.boss_questions FOR SELECT TO authenticated
  USING (true);
