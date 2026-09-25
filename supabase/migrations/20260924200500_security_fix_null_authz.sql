-- ============================================================================
-- Segurança — correção: checagens de autorização com NULL
--
-- Encontrado ao testar em produção como aluno: get_analytics_overview aceitava
-- o id de qualquer professor. Para um aluno, get_teacher_id() é NULL, então
-- `p_teacher_id = get_teacher_id()` dava NULL, e `IF NOT (NULL OR false)`
-- não levanta erro (IF só dispara com TRUE). Os helpers agora devolvem
-- sempre true/false.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.can_act_for_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.is_server_context(), false)
      OR EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id AND user_id = auth.uid())
      OR coalesce(public.is_teacher_of_student(p_student_id), false)
      OR coalesce(public.is_caller_admin(), false)
$$;

CREATE OR REPLACE FUNCTION public.can_act_for_teacher(p_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.is_server_context(), false)
      OR coalesce(p_teacher_id = public.get_teacher_id(), false)
      OR coalesce(public.is_caller_admin(), false)
$$;

COMMIT;
