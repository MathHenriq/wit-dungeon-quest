-- Update password using pgcrypto from the extensions schema
UPDATE auth.users
SET
  encrypted_password = extensions.crypt('Aluno@123', extensions.gen_salt('bf')),
  updated_at = now()
WHERE email = 'aluno.teste@wit.com';
