-- =============================================
-- APROVAÇÕES ATÔMICAS - WIT Dungeon
-- Garante que aprovação de request/missão e
-- crédito de moedas ocorram na mesma transação
-- =============================================

-- 1. Aprovação atômica de desafio
CREATE OR REPLACE FUNCTION public.approve_challenge_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_challenge_id UUID;
  v_reward INTEGER;
BEGIN
  SELECT sr.student_id, sr.challenge_id, c.reward
  INTO v_student_id, v_challenge_id, v_reward
  FROM public.student_requests sr
  JOIN public.challenges c ON c.id = sr.challenge_id
  WHERE sr.id = p_request_id AND sr.status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
  END IF;

  IF NOT public.is_teacher_of_student(v_student_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  UPDATE public.student_requests
  SET
    status = 'approved',
    resolved_at = now(),
    resolved_by = public.get_teacher_id()
  WHERE id = p_request_id;

  UPDATE public.students
  SET coins = coins + v_reward
  WHERE id = v_student_id;
END;
$$;

-- 2. Aprovação atômica de presença
CREATE OR REPLACE FUNCTION public.approve_attendance_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT student_id INTO v_student_id
  FROM public.student_requests
  WHERE id = p_request_id
    AND status = 'pending'
    AND request_type = 'attendance';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
  END IF;

  IF NOT public.is_teacher_of_student(v_student_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  UPDATE public.student_requests
  SET
    status = 'approved',
    resolved_at = now(),
    resolved_by = public.get_teacher_id()
  WHERE id = p_request_id;

  UPDATE public.students
  SET presencas_consecutivas = presencas_consecutivas + 1
  WHERE id = v_student_id;
END;
$$;

-- 3. Aprovação atômica de missão
CREATE OR REPLACE FUNCTION public.approve_mission_completion(p_completion_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_reward INTEGER;
  v_is_return_mission BOOLEAN;
BEGIN
  SELECT mc.student_id, sm.reward, sm.is_return_mission
  INTO v_student_id, v_reward, v_is_return_mission
  FROM public.mission_completions mc
  JOIN public.student_missions sm ON sm.id = mc.mission_id
  WHERE mc.id = p_completion_id AND mc.status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conclusão não encontrada ou já processada';
  END IF;

  IF NOT public.is_teacher_of_student(v_student_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  UPDATE public.mission_completions
  SET
    status = 'approved',
    resolved_at = now(),
    resolved_by = public.get_teacher_id()
  WHERE id = p_completion_id;

  UPDATE public.students
  SET coins = coins + v_reward
  WHERE id = v_student_id;

  IF v_is_return_mission THEN
    UPDATE public.students
    SET needs_return_mission = false
    WHERE id = v_student_id;
  END IF;
END;
$$;
