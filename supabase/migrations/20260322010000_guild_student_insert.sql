-- Allow anon role (students) to INSERT guilds
-- Without this, students get "Erro ao criar guilda" because only authenticated (teacher) role
-- has INSERT permission on the guilds table.

CREATE POLICY "Students can create guilds"
  ON public.guilds FOR INSERT TO anon
  WITH CHECK (true);
