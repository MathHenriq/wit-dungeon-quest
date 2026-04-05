DO $$
DECLARE
  new_user_id uuid;
  pwd_hash text := '$2a$10$PdNWCrBiKHFTTnVlS1Mc4./jq7r7xZbMJHjqPsZMDDDOEoYBT5aqK';
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'aluno.teste@wit.com';

  IF new_user_id IS NULL THEN
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_user_meta_data, raw_app_meta_data,
      aud, role, is_super_admin,
      confirmation_token, recovery_token
    ) VALUES (
      gen_random_uuid(),
      'aluno.teste@wit.com',
      pwd_hash,
      now(), now(), now(),
      '{"name": "Aluno Teste"}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      'authenticated', 'authenticated', false,
      '', ''
    )
    RETURNING id INTO new_user_id;
    RAISE NOTICE 'Created auth user: %', new_user_id;
  ELSE
    RAISE NOTICE 'User already exists: %', new_user_id;
  END IF;

  -- Create student record if not exists
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE user_id = new_user_id) THEN
    INSERT INTO public.students (
      user_id, name, character_name,
      class_id, teacher_id,
      status, level, coins, xp,
      presencas_consecutivas, character_class
    ) VALUES (
      new_user_id, 'Aluno Teste', 'Heroi Teste',
      'f535221f-f28a-4a2c-8813-0f054bc19e3f',
      'be9ab312-02bb-49a7-a49b-1aae60f4e60b',
      'active', 3, 150, 200, 2, 'Guerreiro'
    );
    RAISE NOTICE 'Created student record for user: %', new_user_id;
  END IF;
END $$;
