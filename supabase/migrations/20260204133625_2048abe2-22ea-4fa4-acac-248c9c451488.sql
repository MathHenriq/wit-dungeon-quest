-- Allow anyone to read teachers for the student login dropdown
CREATE POLICY "Anyone can read teachers for login"
ON public.teachers
FOR SELECT
USING (true);