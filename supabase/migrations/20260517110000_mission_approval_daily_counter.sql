-- ============================================================
-- WIT Dungeon — daily quests wiring
-- Bump the `missions_approved` daily counter for the student whose
-- mission was just approved by their teacher. Mirrors the wiring
-- pattern of public.increment_daily_counter but writes the row
-- directly so it works under a teacher's auth context.
-- ============================================================

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
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
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

  -- Bump daily quest counter for the student (teacher context — direct upsert).
  INSERT INTO public.student_daily_counters (student_id, date, counter_type, value)
  VALUES (v_student_id, v_today, 'missions_approved', 1)
  ON CONFLICT (student_id, date, counter_type) DO UPDATE
    SET value = student_daily_counters.value + 1;
END;
$$;

-- Mirror: bump `gsa_activities` when a Classroom submission is credited.
CREATE OR REPLACE FUNCTION public.award_classroom_activity(
  p_link_id        UUID,
  p_student_id     UUID,
  p_submission_state TEXT,
  p_reward_coins   INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.classroom_activity_completions
    WHERE link_id = p_link_id AND student_id = p_student_id
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.students
  SET coins = coins + p_reward_coins
  WHERE id = p_student_id;

  INSERT INTO public.classroom_activity_completions (link_id, student_id, submission_state)
  VALUES (p_link_id, p_student_id, p_submission_state);

  -- Daily quest counter (teacher context — direct upsert).
  INSERT INTO public.student_daily_counters (student_id, date, counter_type, value)
  VALUES (p_student_id, v_today, 'gsa_activities', 1)
  ON CONFLICT (student_id, date, counter_type) DO UPDATE
    SET value = student_daily_counters.value + 1;

  RETURN TRUE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.award_classroom_activity TO authenticated;
