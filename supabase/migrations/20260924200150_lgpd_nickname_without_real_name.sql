-- ============================================================================
-- LGPD — 2b/5: nickname não pode conter o nome real
--
-- O nickname é o único nome que outros alunos veem. Na base havia 66 alunos
-- cujo nickname continha o próprio primeiro nome (alguns eram o nome
-- completo), o que anulava a anonimização. Esses nicknames voltam para
-- "Aventureiro XXXX" — o aluno escolhe outro no editor de personagem — e as
-- RPCs de cadastro/edição passam a recusar nickname com o nome do aluno.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.nickname_contains_name(p_nick text, p_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(regexp_split_to_array(lower(coalesce(p_name, '')), '\s+')) AS w
    WHERE length(w) >= 3
      AND lower(coalesce(p_nick, '')) ~ ('(^|[^a-zà-ÿ])' || w || '([^a-zà-ÿ]|$)')
  )
$$;

ALTER TABLE public.students DISABLE TRIGGER enforce_student_character_update_only;

UPDATE public.students
SET    character_name = 'Aventureiro ' || upper(substr(replace(id::text, '-', ''), 1, 4))
WHERE  public.nickname_contains_name(character_name, name);

ALTER TABLE public.students ENABLE TRIGGER enforce_student_character_update_only;

UPDATE public.weekly_rankings_snapshot w
SET    entity_name = coalesce(nullif(btrim(s.character_name), ''), 'Aventureiro')
FROM   public.students s
WHERE  s.id = w.entity_id
  AND  w.ranking_type IN ('geral', 'sala', 'pvp')
  AND  w.entity_name IS DISTINCT FROM coalesce(nullif(btrim(s.character_name), ''), 'Aventureiro');

-- Cadastro: além de "igual ao nome", recusa nickname que contenha o nome.
DO $$
DECLARE d text := pg_get_functiondef('public.register_my_student(text, text, uuid, uuid)'::regprocedure);
BEGIN
  IF strpos(d, 'IF lower(v_nick) = lower(v_name) THEN') = 0 THEN
    RAISE EXCEPTION 'register_my_student: trecho esperado não encontrado';
  END IF;
  EXECUTE replace(d, 'IF lower(v_nick) = lower(v_name) THEN',
                     'IF public.nickname_contains_name(v_nick, v_name) THEN');
END $$;

-- Edição do personagem: recusa nickname com o nome do aluno.
CREATE OR REPLACE FUNCTION public.update_my_character(
  p_character_name  text,
  p_race            text,
  p_character_class text,
  p_motivation      text,
  p_lore            text,
  p_appearance      text,
  p_personality     text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_student_id uuid;
  v_name       text;
  v_nick       text := nullif(btrim(regexp_replace(coalesce(p_character_name, ''), '\s+', ' ', 'g')), '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING HINT = 'Sessão expirada. Faça login novamente.';
  END IF;

  SELECT id, name INTO v_student_id, v_name FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND_FOR_USER'
      USING HINT = 'Sua conta de aluno não está vinculada a este login. Contate o professor.';
  END IF;

  IF v_nick IS NOT NULL AND (char_length(v_nick) NOT BETWEEN 3 AND 20
                             OR v_nick !~ '^[0-9A-Za-zÀ-ÖØ-öø-ÿ _.-]+$') THEN
    RAISE EXCEPTION 'INVALID_NICKNAME'
      USING HINT = 'O nickname deve ter de 3 a 20 caracteres: letras, números, espaço, _ . ou -.';
  END IF;
  IF v_nick IS NOT NULL AND public.nickname_contains_name(v_nick, v_name) THEN
    RAISE EXCEPTION 'NICKNAME_HAS_REAL_NAME'
      USING HINT = 'O nickname não pode ter o seu nome. Outros jogadores veem o nickname.';
  END IF;

  UPDATE public.students
  SET character_name  = coalesce(v_nick, character_name),
      race            = nullif(p_race, ''),
      character_class = nullif(p_character_class, ''),
      motivation      = nullif(btrim(p_motivation), ''),
      lore            = nullif(btrim(p_lore), ''),
      appearance      = nullif(btrim(p_appearance), ''),
      personality     = nullif(p_personality, '')
  WHERE id = v_student_id;

  RETURN v_student_id;
END;
$$;

COMMIT;
