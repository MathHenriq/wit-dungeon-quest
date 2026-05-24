-- ============================================================
-- WIT DUNGEON — ONDA 11.8
-- Flag de tutorial de combate concluído.
-- Migration: 20260519140000_wave11_tutorial_flag.sql
-- ============================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.students.tutorial_completed IS
  'True quando o aluno terminou OU pulou o tutorial de combate da Onda 11.8.';

-- ============================================================
-- RPC: complete_my_tutorial
-- Marca o tutorial como concluído no aluno atualmente autenticado.
-- Idempotente; sem efeitos colaterais.
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_my_tutorial()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT id INTO v_student_id
    FROM public.students WHERE user_id = auth.uid() LIMIT 1;
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  UPDATE public.students
     SET tutorial_completed = true
   WHERE id = v_student_id;

  RETURN jsonb_build_object('success', true, 'student_id', v_student_id);
END;
$$;

COMMENT ON FUNCTION public.complete_my_tutorial() IS
  'Marca o tutorial de combate como concluído (idempotente) para o aluno autenticado.';

GRANT EXECUTE ON FUNCTION public.complete_my_tutorial() TO authenticated;
