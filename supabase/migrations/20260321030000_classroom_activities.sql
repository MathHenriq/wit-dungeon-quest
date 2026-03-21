-- Add Google Classroom user tracking to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS classroom_user_id TEXT,
  ADD COLUMN IF NOT EXISTS classroom_email   TEXT;

CREATE INDEX IF NOT EXISTS idx_students_classroom_user_id
  ON public.students(classroom_user_id);

-- Links a Classroom coursework item to WIT Dungeon (with coin reward)
CREATE TABLE IF NOT EXISTS public.classroom_activity_links (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id     UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  course_id      TEXT        NOT NULL,
  coursework_id  TEXT        NOT NULL,
  title          TEXT        NOT NULL,
  class_id       UUID        REFERENCES public.classes(id) ON DELETE SET NULL,
  reward_coins   INTEGER     NOT NULL DEFAULT 10,
  last_synced_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, coursework_id)
);

ALTER TABLE public.classroom_activity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own activity links"
  ON public.classroom_activity_links FOR ALL TO authenticated
  USING  (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- Tracks which students have already been rewarded per activity (idempotent)
CREATE TABLE IF NOT EXISTS public.classroom_activity_completions (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id          UUID        NOT NULL REFERENCES public.classroom_activity_links(id) ON DELETE CASCADE,
  student_id       UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  submission_state TEXT        NOT NULL,
  rewarded_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(link_id, student_id)
);

ALTER TABLE public.classroom_activity_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read completions"
  ON public.classroom_activity_completions FOR SELECT USING (true);

CREATE POLICY "Teachers manage own completions"
  ON public.classroom_activity_completions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.classroom_activity_links
    WHERE id = link_id AND teacher_id = get_teacher_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.classroom_activity_links
    WHERE id = link_id AND teacher_id = get_teacher_id()
  ));

-- Atomic: award coins to a student for completing a Classroom activity (idempotent)
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
BEGIN
  -- Already rewarded → skip
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

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_classroom_activity TO authenticated;
