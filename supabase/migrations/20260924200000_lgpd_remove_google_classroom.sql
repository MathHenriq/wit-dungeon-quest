-- ============================================================================
-- LGPD / nota do Ministério Público (set/2026) — 1/5
-- Remove por completo a integração com o Google Sala de Aula.
--
-- A integração trazia do Google para o nosso banco: nome completo do aluno,
-- e-mail institucional, ID do aluno no Classroom, turmas (com código da turma
-- e nome do professor) e tokens OAuth do professor. Nada disso pode mais ficar
-- aqui. Esta migration apaga os dados e as estruturas; o frontend e a Edge
-- Function gsa-refresh-token foram removidos no mesmo commit.
-- ============================================================================

BEGIN;

-- Tokens OAuth (access/refresh) dos professores e vínculos de atividades.
DROP TABLE IF EXISTS public.classroom_activity_completions CASCADE;
DROP TABLE IF EXISTS public.classroom_activity_links       CASCADE;
DROP TABLE IF EXISTS public.google_classroom_connections   CASCADE;

DROP FUNCTION IF EXISTS public.award_classroom_activity(uuid, uuid, text, integer);

-- Identificadores do Google gravados no aluno.
DROP INDEX IF EXISTS public.idx_students_classroom_user_id;
ALTER TABLE public.students DROP COLUMN IF EXISTS classroom_user_id;
ALTER TABLE public.students DROP COLUMN IF EXISTS classroom_email;

-- Turmas importadas carregavam "Importada do Google Classroom (ID: ...)".
UPDATE public.classes SET description = NULL WHERE description IS NOT NULL;

COMMIT;
