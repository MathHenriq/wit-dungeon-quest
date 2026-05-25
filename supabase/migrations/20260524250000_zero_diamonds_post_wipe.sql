-- Patch 2.0: zera tambem os diamantes (alunos comecam Season 2 sem nada).
DO $$
BEGIN
  SET LOCAL session_replication_role = 'replica';
  UPDATE public.students
  SET diamonds = 0
  WHERE wiped_at_patch_1_1 IS NOT NULL;
END $$;
