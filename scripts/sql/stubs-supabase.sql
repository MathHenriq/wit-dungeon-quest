-- Dublês mínimos do Supabase e das funções do WIT 1 para testar as migrações do WIT 2
-- num Postgres local (scripts/sql/testar-wit2.sh). Não usar em produção.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;
DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- como no Supabase: authenticated pode tudo nas tabelas do public; quem barra é o RLS
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, anon;
GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT 'authenticated' $$;
CREATE TABLE public.teachers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, is_admin boolean DEFAULT false);
CREATE TABLE public.students (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, teacher_id uuid REFERENCES public.teachers(id), name text, character_name text);
CREATE FUNCTION public.my_student_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT id FROM students WHERE user_id = auth.uid() LIMIT 1 $$;
CREATE FUNCTION public.get_teacher_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT id FROM teachers WHERE user_id = auth.uid() $$;
CREATE FUNCTION public.is_caller_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT coalesce((SELECT is_admin FROM teachers WHERE user_id = auth.uid()), false) $$;
CREATE FUNCTION public.can_act_for_student(p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM students WHERE id = p AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM students s JOIN teachers t ON t.id = s.teacher_id WHERE s.id = p AND t.user_id = auth.uid()) $$;
CREATE FUNCTION public.can_act_for_teacher(p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT p = get_teacher_id() $$;
