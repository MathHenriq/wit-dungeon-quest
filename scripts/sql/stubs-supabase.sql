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
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('email', current_setting('test.email', true)) $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT 'authenticated' $$;
CREATE TABLE public.teachers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, name text NOT NULL DEFAULT 'Prof', is_admin boolean DEFAULT false);
CREATE TABLE public.students (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, teacher_id uuid REFERENCES public.teachers(id), name text, character_name text);
CREATE FUNCTION public.my_student_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT id FROM students WHERE user_id = auth.uid() LIMIT 1 $$;
CREATE FUNCTION public.get_teacher_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT id FROM teachers WHERE user_id = auth.uid() $$;
CREATE FUNCTION public.is_caller_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT coalesce((SELECT is_admin FROM teachers WHERE user_id = auth.uid()), false) $$;
CREATE FUNCTION public.can_act_for_student(p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM students WHERE id = p AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM students s JOIN teachers t ON t.id = s.teacher_id WHERE s.id = p AND t.user_id = auth.uid()) $$;
CREATE FUNCTION public.can_act_for_teacher(p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT p = get_teacher_id() $$;
-- Tabelas do WIT 1 que a virada lê (_wit2_virada.sql), só com as colunas usadas
ALTER TABLE public.students ADD COLUMN coins int NOT NULL DEFAULT 50, ADD COLUMN level int NOT NULL DEFAULT 1, ADD COLUMN xp int NOT NULL DEFAULT 0,
  ADD COLUMN diamonds numeric(10,2) NOT NULL DEFAULT 0, ADD COLUMN character_class text, ADD COLUMN is_test_account boolean NOT NULL DEFAULT false;
CREATE TABLE public.shop_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL);
CREATE TABLE public.student_inventory (student_id uuid REFERENCES public.students(id) ON DELETE CASCADE, item_id uuid REFERENCES public.shop_items(id), UNIQUE (student_id, item_id));
CREATE TABLE public.materials (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, rarity text NOT NULL);
CREATE TABLE public.student_inventory_materials (student_id uuid REFERENCES public.students(id) ON DELETE CASCADE, material_id uuid REFERENCES public.materials(id), quantity int NOT NULL DEFAULT 0);
CREATE TABLE public.student_consumables (student_id uuid REFERENCES public.students(id) ON DELETE CASCADE, consumable_id uuid, quantity int NOT NULL DEFAULT 0);
CREATE TABLE public.student_attribute_points (student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  forca int DEFAULT 0, destreza int DEFAULT 0, inteligencia int DEFAULT 0, carisma int DEFAULT 0, agilidade int DEFAULT 0, resistencia int DEFAULT 0);
CREATE TABLE public.student_skill_points (student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE, available_points int DEFAULT 0, total_earned int DEFAULT 0);
CREATE TABLE public.student_titles (student_id uuid REFERENCES public.students(id) ON DELETE CASCADE, title_type text NOT NULL);
