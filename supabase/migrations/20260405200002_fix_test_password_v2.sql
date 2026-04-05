DO $$
DECLARE
  h text;
BEGIN
  -- Generate real bcrypt hash using extensions schema
  h := extensions.crypt('Aluno@123', extensions.gen_salt('bf', 10));
  
  UPDATE auth.users
  SET encrypted_password = h, updated_at = now()
  WHERE email = 'aluno.teste@wit.com';
  
  RAISE NOTICE 'Password updated. Hash: %', h;
END $$;
