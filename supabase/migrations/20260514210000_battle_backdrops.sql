-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 6.2 — Battle backdrops collection.
--
-- Backdrops themselves live client-side (pure CSS/SVG, no assets). The server
-- only tracks which backdrop keys each student has *seen* in battle, plus a
-- favourite flag so they show up first in the profile collection viewer.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_unlocked_backdrops (
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  backdrop_key TEXT        NOT NULL,
  is_favorite  BOOLEAN     NOT NULL DEFAULT FALSE,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, backdrop_key)
);

CREATE INDEX IF NOT EXISTS idx_unlocked_backdrops_student
  ON public.student_unlocked_backdrops (student_id);

ALTER TABLE public.student_unlocked_backdrops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read unlocked_backdrops"
  ON public.student_unlocked_backdrops FOR SELECT USING (true);

-- Idempotent record of the first time the student saw a backdrop.
CREATE OR REPLACE FUNCTION public.unlock_backdrop(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID; v_new BOOLEAN := FALSE;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

  INSERT INTO public.student_unlocked_backdrops (student_id, backdrop_key)
  VALUES (v_sid, p_key)
  ON CONFLICT (student_id, backdrop_key) DO NOTHING
  RETURNING true INTO v_new;

  RETURN jsonb_build_object('success', true, 'new_unlock', COALESCE(v_new, false));
END;
$$;
GRANT EXECUTE ON FUNCTION public.unlock_backdrop(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_favorite_backdrop(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID; v_now BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Sessão'); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Aluno'); END IF;

  UPDATE public.student_unlocked_backdrops
     SET is_favorite = NOT is_favorite
   WHERE student_id = v_sid AND backdrop_key = p_key
  RETURNING is_favorite INTO v_now;

  IF v_now IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Backdrop não desbloqueado');
  END IF;
  RETURN jsonb_build_object('success', true, 'is_favorite', v_now);
END;
$$;
GRANT EXECUTE ON FUNCTION public.toggle_favorite_backdrop(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_backdrops()
RETURNS TABLE (backdrop_key TEXT, is_favorite BOOLEAN, unlocked_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT b.backdrop_key, b.is_favorite, b.unlocked_at
    FROM public.student_unlocked_backdrops b
   WHERE b.student_id = v_sid
   ORDER BY b.is_favorite DESC, b.unlocked_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_backdrops() TO authenticated;
