-- ============================================================
-- Patch 1.2 — RPC: update_my_character(...)
--
-- Why
--   The "Salvar Personagem" button in CharacterCustomization
--   issued a direct UPDATE on public.students. For legacy
--   accounts (orphan rows where user_id ≠ auth.uid(), or where
--   the enforce_student_character_update_only trigger evaluates
--   v_is_self as NULL because OLD.user_id IS NULL), the trigger
--   silently no-ops or RLS filters the row out — the client
--   sees error=null + 0 rows affected and shows a misleading
--   "Personagem atualizado!" toast while nothing actually
--   persisted. Same root cause that was already fixed for
--   profile_photo via update_my_profile_photo.
--
-- Fix
--   SECURITY DEFINER RPC that resolves the student via auth.uid()
--   (single source of truth), updates ONLY whitelisted character
--   fields, and raises clear errors on each failure mode.
--
-- Safety
--   - Only character description/cosmetic columns are writable.
--   - id / user_id / class_id / teacher_id / coins / xp / level /
--     diamonds / pontos_disponiveis are NOT in the column list and
--     can never be touched by this RPC.
--   - Any authenticated user may call it, but only their own row
--     is targeted (resolved server-side via auth.uid()).
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_my_character(
  p_character_name TEXT,
  p_race           TEXT,
  p_character_class TEXT,
  p_motivation     TEXT,
  p_lore           TEXT,
  p_appearance     TEXT,
  p_personality    TEXT,
  p_school_name    TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_student_id UUID;
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

  UPDATE public.students
  SET
    character_name  = nullif(btrim(p_character_name),  ''),
    race            = nullif(p_race,            ''),
    character_class = nullif(p_character_class, ''),
    motivation      = nullif(btrim(p_motivation),      ''),
    lore            = nullif(btrim(p_lore),            ''),
    appearance      = nullif(btrim(p_appearance),      ''),
    personality     = nullif(p_personality,     ''),
    school_name     = nullif(btrim(p_school_name),     '')
  WHERE id = v_student_id;

  RETURN v_student_id;
END;
$$;

REVOKE ALL    ON FUNCTION public.update_my_character(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_character(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO authenticated;
