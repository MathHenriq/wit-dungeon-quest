-- =============================================
-- MULTIPLICADOR DE MOEDAS POR SEQUÊNCIA DE PRESENÇA
-- Ao aprovar presença:
--   nova_sequência = presencas_consecutivas + 1
--   moedas ganhas  = nova_sequência × 10
-- =============================================

CREATE OR REPLACE FUNCTION public.approve_attendance_request(p_request_id UUID)
RETURNS INTEGER  -- returns coins earned
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_new_streak INTEGER;
  v_coins_earned INTEGER;
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

  -- Increment streak and award streak × 10 coins atomically.
  -- In PostgreSQL UPDATE, all SET expressions use the original row values,
  -- so (presencas_consecutivas + 1) here equals the NEW streak value.
  UPDATE public.students
  SET
    presencas_consecutivas = presencas_consecutivas + 1,
    coins = coins + (presencas_consecutivas + 1) * 10
  WHERE id = v_student_id
  RETURNING presencas_consecutivas INTO v_new_streak;

  v_coins_earned := v_new_streak * 10;
  RETURN v_coins_earned;
END;
$$;
