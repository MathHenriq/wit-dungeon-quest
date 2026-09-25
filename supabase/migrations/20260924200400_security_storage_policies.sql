-- ============================================================================
-- Segurança — 5/5: Storage
--
-- Antes:
--   * profile-photos: qualquer pessoa, SEM login, podia enviar ou sobrescrever
--     qualquer arquivo do bucket (INSERT/UPDATE para `public` sem checar
--     caminho) e listar o bucket inteiro (SELECT para `public`);
--   * shop-items: qualquer aluno logado podia subir ou apagar imagens da loja.
--
-- Depois:
--   * profile-photos: cada aluno só escreve/lê via API a própria pasta
--     (`<student_id>/...` e `sprites/<student_id>/...`); o professor dele e o
--     admin também. A listagem pública acaba.
--   * shop-items: só professores escrevem.
--
-- Observação: o bucket profile-photos continua `public = true` porque também
-- guarda os sprites dos personagens, exibidos nas batalhas por URL pública.
-- As fotos não são mais expostas a outros alunos (student_profiles devolve
-- profile_photo_url NULL) e os caminhos não são listáveis.
-- ============================================================================

BEGIN;

-- Dono de um objeto em profile-photos: "<student_id>/..." ou
-- "sprites/<student_id>/...". NULL se o caminho não seguir o padrão.
CREATE OR REPLACE FUNCTION public.storage_owner_student(p_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  parts text[] := string_to_array(p_name, '/');
  seg   text;
BEGIN
  seg := CASE WHEN parts[1] = 'sprites' THEN parts[2] ELSE parts[1] END;
  IF seg ~ '^[0-9a-fA-F-]{36}$' THEN
    RETURN seg::uuid;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.storage_owner_student(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.storage_owner_student(text) TO authenticated, service_role;

-- profile-photos
DROP POLICY IF EXISTS "Public read profile photos"  ON storage.objects;
DROP POLICY IF EXISTS "Students upload own photo"   ON storage.objects;
DROP POLICY IF EXISTS "Students update own photo"   ON storage.objects;

CREATE POLICY "Profile photos: owner reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos'
         AND public.can_act_for_student(public.storage_owner_student(name)));

CREATE POLICY "Profile photos: owner uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos'
              AND public.can_act_for_student(public.storage_owner_student(name)));

CREATE POLICY "Profile photos: owner updates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos'
         AND public.can_act_for_student(public.storage_owner_student(name)))
  WITH CHECK (bucket_id = 'profile-photos'
              AND public.can_act_for_student(public.storage_owner_student(name)));

CREATE POLICY "Profile photos: owner deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos'
         AND public.can_act_for_student(public.storage_owner_student(name)));

-- shop-items
DROP POLICY IF EXISTS "Authenticated can upload shop item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete shop item images" ON storage.objects;

CREATE POLICY "Teachers upload shop item images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-items'
              AND EXISTS (SELECT 1 FROM public.teachers WHERE user_id = auth.uid()));

CREATE POLICY "Teachers delete shop item images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'shop-items'
         AND EXISTS (SELECT 1 FROM public.teachers WHERE user_id = auth.uid()));

COMMIT;
