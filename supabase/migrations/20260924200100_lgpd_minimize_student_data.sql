-- ============================================================================
-- LGPD / nota do Ministério Público (set/2026) — 2/5
-- Minimização dos dados do aluno.
--
-- Regra nova: do aluno o sistema guarda só e-mail (login), os DOIS primeiros
-- nomes e um nickname de personagem. Nada de nome completo, documento, escola
-- ou turma real. Esta migration:
--   1. reduz os nomes existentes aos dois primeiros e impõe isso por CHECK;
--   2. apaga `school_name`;
--   3. troca o nome das turmas por códigos neutros (GRUPO-XXXX) e impede que
--      o professor volte a digitar um nome;
--   4. dá nickname a quem não tem (o nickname é o único nome que outros
--      alunos veem);
--   5. limpa nomes completos que sobraram em rankings, logs, backups e
--      metadados do auth;
--   6. remove o portal dos pais (expunha aluno + turma por código de convite);
--   7. cria o cadastro por RPC (register_my_student), que valida tudo isso.
--
-- IRREVERSÍVEL de propósito: os nomes completos deixam de existir no banco.
-- ============================================================================

BEGIN;

-- ─── 0. Utilitários ─────────────────────────────────────────────────────────

-- Dois primeiros nomes, pulando partículas ("Maria de Souza Lima" → "Maria
-- Souza") e descartando o que não for letra. Espelha toFirstTwoNames() em
-- src/lib/privacy.ts.
CREATE OR REPLACE FUNCTION public.first_two_names(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT nullif(array_to_string((ARRAY(
    SELECT w
    FROM unnest(regexp_split_to_array(
           btrim(regexp_replace(coalesce(p, ''), '[^A-Za-zÀ-ÖØ-öø-ÿ'' -]', '', 'g')),
           '\s+')) WITH ORDINALITY AS t(w, i)
    WHERE w ~ '^[A-Za-zÀ-ÖØ-öø-ÿ]' AND lower(w) NOT IN ('da', 'das', 'de', 'do', 'dos', 'e', 'd''')
    ORDER BY i
  ))[1:2], ' '), '')
$$;

-- Código neutro de grupo: sem letras/dígitos ambíguos (0/O, 1/I).
CREATE OR REPLACE FUNCTION public.gen_group_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_alphabet CONSTANT text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
BEGIN
  LOOP
    v_code := 'GRUPO-';
    FOR i IN 1..4 LOOP
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.classes WHERE name = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

-- As atualizações em massa abaixo não passam pelos triggers de proteção
-- (que existem para escrita vinda do cliente) nem enchem o audit log.
ALTER TABLE public.students DISABLE TRIGGER enforce_student_character_update_only;
ALTER TABLE public.students DISABLE TRIGGER audit_student_sensitive_fields_trg;

-- ─── 1. Nome: só os dois primeiros ──────────────────────────────────────────

-- Guarda de escrita direta do cliente em `students`. Substitui a versão
-- anterior, que deixava o próprio aluno alterar coins/xp/diamonds via API.
-- Só policia escrita que chega como `anon`/`authenticated` (PostgREST); RPCs
-- SECURITY DEFINER rodam como dono e fazem as próprias checagens.
CREATE OR REPLACE FUNCTION public.enforce_student_character_update_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  -- Professor (o RLS já limitou aos alunos dele): pode gerir, mas não religar
  -- a conta de login de um aluno.
  IF EXISTS (SELECT 1 FROM public.teachers WHERE user_id = v_uid) THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Not allowed: cannot change user_id' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Not allowed: students may only update their own record' USING ERRCODE = '42501';
  END IF;

  -- Identidade, vínculo e economia só mudam por RPC do servidor.
  IF NEW.user_id                  IS DISTINCT FROM OLD.user_id
  OR NEW.teacher_id               IS DISTINCT FROM OLD.teacher_id
  OR NEW.class_id                 IS DISTINCT FROM OLD.class_id
  OR NEW.name                     IS DISTINCT FROM OLD.name
  OR NEW.status                   IS DISTINCT FROM OLD.status
  OR NEW.coins                    IS DISTINCT FROM OLD.coins
  OR NEW.diamonds                 IS DISTINCT FROM OLD.diamonds
  OR NEW.xp                       IS DISTINCT FROM OLD.xp
  OR NEW.level                    IS DISTINCT FROM OLD.level
  OR NEW.suspended_until          IS DISTINCT FROM OLD.suspended_until
  OR NEW.suspended_reason         IS DISTINCT FROM OLD.suspended_reason
  OR NEW.is_mentor                IS DISTINCT FROM OLD.is_mentor
  OR NEW.mentor_xp                IS DISTINCT FROM OLD.mentor_xp
  OR NEW.presencas_consecutivas   IS DISTINCT FROM OLD.presencas_consecutivas
  OR NEW.total_boss_kills         IS DISTINCT FROM OLD.total_boss_kills
  OR NEW.total_pvp_wins           IS DISTINCT FROM OLD.total_pvp_wins
  OR NEW.total_missions_completed IS DISTINCT FROM OLD.total_missions_completed
  OR NEW.total_crafts             IS DISTINCT FROM OLD.total_crafts
  OR NEW.is_test_account          IS DISTINCT FROM OLD.is_test_account
  THEN
    RAISE EXCEPTION 'Not allowed: this field is managed by the server' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- Com nomes curtos, dois "João Pedro" na mesma turma são normais. O nome
-- deixou de ser identificador.
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_name_key;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_test_account boolean NOT NULL DEFAULT false;
UPDATE public.students SET is_test_account = true WHERE name ~* 'teste';

UPDATE public.students
SET    name = coalesce(public.first_two_names(name), 'Aluno')
WHERE  name IS DISTINCT FROM coalesce(public.first_two_names(name), 'Aluno');

ALTER TABLE public.students ADD CONSTRAINT students_name_first_two CHECK (
  char_length(name) BETWEEN 1 AND 61
  AND name ~ '^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ''-]*( [A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ''-]*)?$'
);

-- ─── 2. Escola ──────────────────────────────────────────────────────────────

ALTER TABLE public.students DROP COLUMN IF EXISTS school_name;

-- update_my_character recebia p_school_name. Recriada sem ele.
DROP FUNCTION IF EXISTS public.update_my_character(text, text, text, text, text, text, text, text);
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
  v_nick       text := nullif(btrim(regexp_replace(coalesce(p_character_name, ''), '\s+', ' ', 'g')), '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING HINT = 'Sessão expirada. Faça login novamente.';
  END IF;

  SELECT id INTO v_student_id FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND_FOR_USER'
      USING HINT = 'Sua conta de aluno não está vinculada a este login. Contate o professor.';
  END IF;

  IF v_nick IS NOT NULL AND (char_length(v_nick) NOT BETWEEN 3 AND 20
                             OR v_nick !~ '^[0-9A-Za-zÀ-ÖØ-öø-ÿ _.-]+$') THEN
    RAISE EXCEPTION 'INVALID_NICKNAME'
      USING HINT = 'O nickname deve ter de 3 a 20 caracteres: letras, números, espaço, _ . ou -.';
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

-- ─── 3. Turmas → grupos com código neutro ───────────────────────────────────

-- Linha a linha: gen_group_code() checa colisão contra o que já foi gravado.
UPDATE public.classes SET name = 'TMP-' || id::text, description = NULL;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.classes LOOP
    UPDATE public.classes SET name = public.gen_group_code() WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS classes_name_key ON public.classes (name);

-- O nome não pode mais ser escolhido por ninguém: nem pela UI do professor,
-- nem pelo painel master, nem por API direta.
CREATE OR REPLACE FUNCTION public.classes_force_neutral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.name := public.gen_group_code();
  ELSE
    NEW.name := OLD.name;
  END IF;
  NEW.description := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS classes_force_neutral_code ON public.classes;
CREATE TRIGGER classes_force_neutral_code
  BEFORE INSERT OR UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.classes_force_neutral_code();

-- ─── 4. Nickname para todos ─────────────────────────────────────────────────

UPDATE public.students
SET    character_name = 'Aventureiro ' || upper(substr(replace(id::text, '-', ''), 1, 4))
WHERE  coalesce(btrim(character_name), '') = '';

ALTER TABLE public.students ENABLE TRIGGER enforce_student_character_update_only;
ALTER TABLE public.students ENABLE TRIGGER audit_student_sensitive_fields_trg;

-- ─── 5. Nomes completos que sobraram em outros lugares ──────────────────────

-- Rankings semanais congelados com COALESCE(character_name, name).
UPDATE public.weekly_rankings_snapshot w
SET    entity_name = coalesce(nullif(btrim(s.character_name), ''), 'Aventureiro')
FROM   public.students s
WHERE  s.id = w.entity_id
  AND  w.ranking_type IN ('geral', 'sala', 'pvp');

UPDATE public.weekly_rankings_snapshot
SET    entity_name = 'Aventureiro'
WHERE  ranking_type IN ('geral', 'sala', 'pvp')
  AND  NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = entity_id);

-- Log de ações: rótulo e fotos do registro (to_jsonb(s.*) guardava tudo).
-- O log é append-only (trigger action_log_no_update); a trava é suspensa só
-- durante esta limpeza, dentro da mesma transação.
ALTER TABLE public.action_log DISABLE TRIGGER action_log_no_update;

UPDATE public.action_log
SET    target_label = public.first_two_names(target_label)
WHERE  target_table = 'students' AND target_label IS NOT NULL;

UPDATE public.action_log
SET    before_state = (before_state - 'school_name' - 'classroom_email' - 'classroom_user_id')
                      || CASE WHEN before_state ? 'name'
                              THEN jsonb_build_object('name', public.first_two_names(before_state->>'name'))
                              ELSE '{}'::jsonb END
WHERE  target_table = 'students' AND before_state IS NOT NULL;

UPDATE public.action_log
SET    after_state = (after_state - 'school_name' - 'classroom_email' - 'classroom_user_id')
                     || CASE WHEN after_state ? 'name'
                             THEN jsonb_build_object('name', public.first_two_names(after_state->>'name'))
                             ELSE '{}'::jsonb END
WHERE  target_table = 'students' AND after_state IS NOT NULL;

UPDATE public.action_log
SET    payload = payload - 'school_name' - 'classroom_email' - 'classroom_user_id' - 'email'
WHERE  target_table = 'students' AND payload IS NOT NULL;

ALTER TABLE public.action_log ENABLE TRIGGER action_log_no_update;

-- Tabelas de backup de migrations antigas: cópias com nome completo.
DROP TABLE IF EXISTS public.students_level_backup_20260409;
DROP TABLE IF EXISTS public.students_user_id_backup_20260504;
DROP TABLE IF EXISTS public.characters_relink_backup_20260430;
DROP TABLE IF EXISTS public.characters_relink_namepass_backup_20260430;
DROP TABLE IF EXISTS public.character_progress_backup_20260430;

-- Metadados do auth: nome e foto vindos de login Google / cadastro antigo.
UPDATE auth.users u
SET    raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
                            - 'full_name' - 'name' - 'picture' - 'avatar_url'
FROM   public.students s
WHERE  s.user_id = u.id;

UPDATE auth.identities i
SET    identity_data = i.identity_data - 'full_name' - 'name' - 'picture' - 'avatar_url'
FROM   public.students s
WHERE  s.user_id = i.user_id;

-- ─── 6. Portal dos pais ─────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.generate_parent_invite(uuid);
DROP FUNCTION IF EXISTS public.redeem_parent_invite(text, text);
DROP FUNCTION IF EXISTS public.generate_parent_report(uuid, date, date, text);
DROP FUNCTION IF EXISTS public.get_parent_child_summary(uuid, integer);
DROP TABLE IF EXISTS public.parent_reports       CASCADE;
DROP TABLE IF EXISTS public.parent_student_links CASCADE;
DROP TABLE IF EXISTS public.parent_invites       CASCADE;
DROP TABLE IF EXISTS public.parent_accounts      CASCADE;

-- Devolvia a linha inteira do aluno (to_jsonb(s.*)) para qualquer um.
DROP FUNCTION IF EXISTS public.diag_student_state(uuid);

-- Oráculo de "este e-mail é de aluno?" chamável sem login.
DROP FUNCTION IF EXISTS public.auth_email_exists(text);

-- ─── 7. Cadastro do aluno por RPC ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.register_my_student(
  p_first_names text,
  p_nickname    text,
  p_teacher_id  uuid,
  p_class_id    uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_name text := btrim(regexp_replace(coalesce(p_first_names, ''), '\s+', ' ', 'g'));
  v_nick text := btrim(regexp_replace(coalesce(p_nickname, ''), '\s+', ' ', 'g'));
  v_row  public.students%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sessão expirada. Entre novamente.');
  END IF;
  IF EXISTS (SELECT 1 FROM public.teachers WHERE user_id = v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta conta é de professor.');
  END IF;

  IF v_name !~ '^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ''-]*( [A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ''-]*)?$'
     OR v_name IS DISTINCT FROM public.first_two_names(v_name)
     OR char_length(v_name) > 61 THEN
    RETURN jsonb_build_object('success', false,
      'error', 'Use só os seus dois primeiros nomes (ex.: João Miguel), sem sobrenome.');
  END IF;

  IF char_length(v_nick) NOT BETWEEN 3 AND 20 OR v_nick !~ '^[0-9A-Za-zÀ-ÖØ-öø-ÿ _.-]+$' THEN
    RETURN jsonb_build_object('success', false,
      'error', 'O nickname deve ter de 3 a 20 caracteres: letras, números, espaço, _ . ou -.');
  END IF;
  IF lower(v_nick) = lower(v_name) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Escolha um nickname diferente do seu nome.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE id = p_class_id AND teacher_id = p_teacher_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Grupo inválido para este professor.');
  END IF;

  SELECT * INTO v_row FROM public.students WHERE user_id = v_uid;

  IF FOUND THEN
    IF v_row.status = 'active' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Seu cadastro já foi aprovado.');
    END IF;
    UPDATE public.students
    SET    name = v_name, character_name = v_nick,
           teacher_id = p_teacher_id, class_id = p_class_id, status = 'pending'
    WHERE  id = v_row.id;
  ELSE
    INSERT INTO public.students
      (name, character_name, teacher_id, class_id, user_id, status, coins, level, presencas_consecutivas)
    VALUES
      (v_name, v_nick, p_teacher_id, p_class_id, v_uid, 'pending', 0, 1, 0);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Lista de professores para o cadastro: só id e nome (a tabela tem user_id e
-- is_admin, que aluno não precisa ver).
CREATE OR REPLACE FUNCTION public.list_teachers_for_signup()
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name FROM public.teachers t ORDER BY t.name
$$;

COMMIT;
