-- ============================================================
-- RPC: update_my_profile_photo(p_url text) → text
--
-- Why
--   Direct UPDATE from the student client on `students.profile_photo_url`
--   keeps failing for some legacy accounts despite the relink migration:
--     - if students.user_id ≠ auth.uid(), the
--       enforce_student_character_update_only trigger raises
--       'students may only update their own record'
--     - we can't always pinpoint the exact reason from the toast
--
-- Fix
--   SECURITY DEFINER RPC that:
--     - resolves the student row via auth.uid() (one source of truth)
--     - updates ONLY profile_photo_url
--     - returns the new URL on success
--     - raises a clear, distinct error on each failure mode
--
-- Safety
--   Only one column is writable; no parameters can target a different
--   student. Any auth user can call it, but only their own row is
--   touched (and only one column).
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_my_profile_photo(p_url text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          UUID := auth.uid();
  v_student_id   UUID;
  v_clean_url    TEXT := nullif(btrim(p_url), '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED'
      USING HINT = 'Sessão expirada. Faça login novamente.';
  END IF;

  SELECT id INTO v_student_id
  FROM   public.students
  WHERE  user_id = v_uid
  LIMIT  1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND_FOR_USER'
      USING HINT = 'Sua conta de aluno não está vinculada a este login. Contate o professor.';
  END IF;

  -- Direct UPDATE bypasses the enforce_student_character_update_only
  -- guard for this column because we run as definer; the audit trigger
  -- still fires (but profile_photo_url is not in its watched columns).
  UPDATE public.students
  SET    profile_photo_url = v_clean_url
  WHERE  id = v_student_id;

  RETURN COALESCE(v_clean_url, '');
END;
$$;

REVOKE ALL    ON FUNCTION public.update_my_profile_photo(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile_photo(text) TO authenticated;
