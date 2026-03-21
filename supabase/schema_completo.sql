-- ============================================================
-- WIT DUNGEON - SCHEMA COMPLETO
-- Cole este arquivo inteiro no SQL Editor do Supabase
-- e clique em Run (Ctrl+Enter)
-- ============================================================


-- ============================================================
-- 1. TIPOS (ENUMs)
-- ============================================================

CREATE TYPE public.request_type AS ENUM ('challenge', 'item', 'attendance');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.student_title_type AS ENUM (
  'helper_of_week',
  'presence_guardian',
  'attitude_example'
);


-- ============================================================
-- 2. TABELAS
-- ============================================================

CREATE TABLE public.teachers (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.classes (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, name)
);

CREATE TABLE public.students (
  id                      UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id                UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id              UUID REFERENCES public.teachers(id) NOT NULL,
  name                    TEXT NOT NULL,
  character_name          TEXT,
  coins                   INTEGER NOT NULL DEFAULT 50,
  level                   INTEGER NOT NULL DEFAULT 1,
  race                    TEXT,
  character_class         TEXT,
  motivation              TEXT,
  lore                    TEXT,
  appearance              TEXT,
  personality             TEXT,
  profile_photo_url       TEXT,
  presencas_consecutivas  INTEGER NOT NULL DEFAULT 0,
  needs_return_mission    BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, name)
);

CREATE TABLE public.challenges (
  id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id     UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  reward         INTEGER NOT NULL DEFAULT 10,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  challenge_type TEXT NOT NULL DEFAULT 'simples',
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.shop_items (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id  UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  cost        INTEGER NOT NULL DEFAULT 10,
  min_level   INTEGER NOT NULL DEFAULT 1,
  item_type   TEXT NOT NULL DEFAULT 'weapon',
  icon        TEXT NOT NULL DEFAULT '⚔️',
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.student_requests (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  request_type public.request_type NOT NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  item_id      UUID REFERENCES public.shop_items(id) ON DELETE SET NULL,
  status       public.request_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMP WITH TIME ZONE,
  resolved_by  UUID REFERENCES public.teachers(id) ON DELETE SET NULL
);

CREATE TABLE public.student_inventory (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  item_id    UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  added_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by   UUID REFERENCES public.teachers(id),
  UNIQUE(student_id, item_id)
);

CREATE TABLE public.student_missions (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id        UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  reward            INTEGER NOT NULL DEFAULT 5,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_return_mission BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.mission_completions (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id  UUID NOT NULL REFERENCES public.student_missions(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status      public.request_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.teachers(id)
);

CREATE TABLE public.student_titles (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title_type  public.student_title_type NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_by UUID NOT NULL REFERENCES public.teachers(id)
);

CREATE TABLE public.teacher_rewards (
  id                  UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id          UUID NOT NULL UNIQUE REFERENCES public.teachers(id) ON DELETE CASCADE,
  name                TEXT NOT NULL DEFAULT 'Moedas',
  icon                TEXT NOT NULL DEFAULT '🪙',
  unit_label_singular TEXT NOT NULL DEFAULT 'moeda',
  unit_label_plural   TEXT NOT NULL DEFAULT 'moedas',
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. ÍNDICES
-- ============================================================

CREATE INDEX idx_students_teacher_id       ON public.students(teacher_id);
CREATE INDEX idx_challenges_teacher_id     ON public.challenges(teacher_id);
CREATE INDEX idx_shop_items_teacher_id     ON public.shop_items(teacher_id);
CREATE INDEX idx_student_missions_teacher_id ON public.student_missions(teacher_id);


-- ============================================================
-- 4. FUNÇÕES HELPER
-- ============================================================

-- Retorna o UUID do professor logado
CREATE OR REPLACE FUNCTION public.get_teacher_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid()
$$;

-- Verifica se o professor logado é dono de uma turma
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(class_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.teachers t ON c.teacher_id = t.id
    WHERE c.id = class_id AND t.user_id = auth.uid()
  )
$$;

-- Verifica se o professor logado é dono de um aluno
CREATE OR REPLACE FUNCTION public.is_teacher_of_student(student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    JOIN public.teachers t ON c.teacher_id = t.id
    WHERE s.id = student_id AND t.user_id = auth.uid()
  )
$$;

-- Verifica se um aluno pertence a um professor específico
CREATE OR REPLACE FUNCTION public.student_belongs_to_teacher(p_student_id uuid, p_teacher_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = p_student_id AND teacher_id = p_teacher_id
  )
$$;

-- Retorna o teacher_id de um aluno
CREATE OR REPLACE FUNCTION public.get_student_teacher_id(p_student_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT teacher_id FROM public.students WHERE id = p_student_id
$$;

-- Função para updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- ============================================================
-- 5. FUNÇÕES DE APROVAÇÃO ATÔMICA
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_challenge_request(p_request_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student_id UUID; v_challenge_id UUID; v_reward INTEGER;
BEGIN
  SELECT sr.student_id, sr.challenge_id, c.reward
  INTO v_student_id, v_challenge_id, v_reward
  FROM public.student_requests sr
  JOIN public.challenges c ON c.id = sr.challenge_id
  WHERE sr.id = p_request_id AND sr.status = 'pending';

  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada ou já processada'; END IF;
  IF NOT public.is_teacher_of_student(v_student_id) THEN RAISE EXCEPTION 'Não autorizado'; END IF;

  UPDATE public.student_requests
  SET status = 'approved', resolved_at = now(), resolved_by = public.get_teacher_id()
  WHERE id = p_request_id;

  UPDATE public.students SET coins = coins + v_reward WHERE id = v_student_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_attendance_request(p_request_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT student_id INTO v_student_id
  FROM public.student_requests
  WHERE id = p_request_id AND status = 'pending' AND request_type = 'attendance';

  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada ou já processada'; END IF;
  IF NOT public.is_teacher_of_student(v_student_id) THEN RAISE EXCEPTION 'Não autorizado'; END IF;

  UPDATE public.student_requests
  SET status = 'approved', resolved_at = now(), resolved_by = public.get_teacher_id()
  WHERE id = p_request_id;

  UPDATE public.students SET presencas_consecutivas = presencas_consecutivas + 1 WHERE id = v_student_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_mission_completion(p_completion_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student_id UUID; v_reward INTEGER; v_is_return_mission BOOLEAN;
BEGIN
  SELECT mc.student_id, sm.reward, sm.is_return_mission
  INTO v_student_id, v_reward, v_is_return_mission
  FROM public.mission_completions mc
  JOIN public.student_missions sm ON sm.id = mc.mission_id
  WHERE mc.id = p_completion_id AND mc.status = 'pending';

  IF NOT FOUND THEN RAISE EXCEPTION 'Conclusão não encontrada ou já processada'; END IF;
  IF NOT public.is_teacher_of_student(v_student_id) THEN RAISE EXCEPTION 'Não autorizado'; END IF;

  UPDATE public.mission_completions
  SET status = 'approved', resolved_at = now(), resolved_by = public.get_teacher_id()
  WHERE id = p_completion_id;

  UPDATE public.students SET coins = coins + v_reward WHERE id = v_student_id;

  IF v_is_return_mission THEN
    UPDATE public.students SET needs_return_mission = false WHERE id = v_student_id;
  END IF;
END;
$$;


-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Cria perfil de professor automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
    INSERT INTO public.teachers (user_id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bloqueia alunos anônimos de alterar campos protegidos
CREATE OR REPLACE FUNCTION public.enforce_student_character_update_only()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN RETURN NEW; END IF;

  IF NEW.name IS DISTINCT FROM OLD.name THEN RAISE EXCEPTION 'Not allowed: cannot change student name'; END IF;
  IF NEW.class_id IS DISTINCT FROM OLD.class_id THEN RAISE EXCEPTION 'Not allowed: cannot change class'; END IF;
  IF NEW.coins IS DISTINCT FROM OLD.coins THEN RAISE EXCEPTION 'Not allowed: cannot change coins'; END IF;
  IF NEW.level IS DISTINCT FROM OLD.level THEN RAISE EXCEPTION 'Not allowed: cannot change level'; END IF;
  IF NEW.presencas_consecutivas IS DISTINCT FROM OLD.presencas_consecutivas THEN RAISE EXCEPTION 'Not allowed: cannot change attendance'; END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_student_character_update_only ON public.students;
CREATE TRIGGER enforce_student_character_update_only
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.enforce_student_character_update_only();

-- Preenche teacher_id automaticamente ao inserir aluno
CREATE OR REPLACE FUNCTION public.set_student_teacher_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.teacher_id IS NULL THEN
    SELECT teacher_id INTO NEW.teacher_id FROM public.classes WHERE id = NEW.class_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_student_teacher_id ON public.students;
CREATE TRIGGER trigger_set_student_teacher_id
  BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_student_teacher_id();

-- Atualiza updated_at na tabela teacher_rewards
CREATE TRIGGER update_teacher_rewards_updated_at
  BEFORE UPDATE ON public.teacher_rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.teachers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_missions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_titles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_rewards   ENABLE ROW LEVEL SECURITY;

-- teachers
CREATE POLICY "Teachers can view own profile"       ON public.teachers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Teachers can insert own profile"     ON public.teachers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers can update own profile"     ON public.teachers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can read teachers for login"  ON public.teachers FOR SELECT USING (true);

-- classes
CREATE POLICY "Anyone can read classes for login"   ON public.classes AS PERMISSIVE FOR SELECT TO anon        USING (true);
CREATE POLICY "Teachers can view own classes"       ON public.classes AS PERMISSIVE FOR SELECT TO authenticated USING (teacher_id = get_teacher_id());
CREATE POLICY "Teachers can insert own classes"     ON public.classes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (teacher_id = get_teacher_id());
CREATE POLICY "Teachers can update own classes"     ON public.classes AS PERMISSIVE FOR UPDATE TO authenticated USING (teacher_id = get_teacher_id()) WITH CHECK (teacher_id = get_teacher_id());
CREATE POLICY "Teachers can delete own classes"     ON public.classes AS PERMISSIVE FOR DELETE TO authenticated USING (teacher_id = get_teacher_id());

-- students
CREATE POLICY "Anyone can read students for identification" ON public.students AS PERMISSIVE FOR SELECT TO anon        USING (true);
CREATE POLICY "Anyone can update student character"         ON public.students AS PERMISSIVE FOR UPDATE TO anon        USING (true) WITH CHECK (true);
CREATE POLICY "Teachers can manage students in their classes" ON public.students AS PERMISSIVE FOR ALL TO authenticated USING (is_teacher_of_class(class_id)) WITH CHECK (is_teacher_of_class(class_id));

-- challenges
CREATE POLICY "Anyone can read challenges"          ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own challenges"  ON public.challenges AS PERMISSIVE FOR ALL TO authenticated USING (teacher_id = get_teacher_id()) WITH CHECK (teacher_id = get_teacher_id());

-- shop_items
CREATE POLICY "Anyone can read shop items"          ON public.shop_items FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own items"       ON public.shop_items AS PERMISSIVE FOR ALL TO authenticated USING (teacher_id = get_teacher_id()) WITH CHECK (teacher_id = get_teacher_id());

-- student_requests
CREATE POLICY "Allow insert requests for existing students" ON public.student_requests AS PERMISSIVE FOR INSERT TO anon WITH CHECK (EXISTS (SELECT 1 FROM public.students WHERE students.id = student_requests.student_id));
CREATE POLICY "Anyone can view their own requests"          ON public.student_requests AS PERMISSIVE FOR SELECT TO anon        USING (true);
CREATE POLICY "Teachers can view requests from their students"   ON public.student_requests AS PERMISSIVE FOR SELECT TO authenticated USING (is_teacher_of_student(student_id));
CREATE POLICY "Teachers can update requests from their students" ON public.student_requests AS PERMISSIVE FOR UPDATE TO authenticated USING (is_teacher_of_student(student_id));

-- student_inventory
CREATE POLICY "Anyone can read inventory"           ON public.student_inventory FOR SELECT USING (true);
CREATE POLICY "Teachers can insert inventory items" ON public.student_inventory FOR INSERT WITH CHECK (is_teacher_of_student(student_id));
CREATE POLICY "Teachers can delete inventory items" ON public.student_inventory FOR DELETE USING (is_teacher_of_student(student_id));

-- student_missions
CREATE POLICY "Anyone can read missions"            ON public.student_missions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own missions"    ON public.student_missions FOR ALL USING (teacher_id = get_teacher_id()) WITH CHECK (teacher_id = get_teacher_id());

-- mission_completions
CREATE POLICY "Anyone can view completions"         ON public.mission_completions FOR SELECT USING (true);
CREATE POLICY "Students can request mission completion" ON public.mission_completions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = mission_completions.student_id));
CREATE POLICY "Teachers can update completions for their students" ON public.mission_completions FOR UPDATE USING (is_teacher_of_student(student_id));

-- student_titles
CREATE POLICY "Read active titles"                          ON public.student_titles FOR SELECT USING (expires_at > now());
CREATE POLICY "Teachers can manage titles for their students" ON public.student_titles FOR ALL USING (is_teacher_of_student(student_id)) WITH CHECK (is_teacher_of_student(student_id));

-- teacher_rewards
CREATE POLICY "Teachers can manage own rewards"     ON public.teacher_rewards FOR ALL USING (teacher_id = get_teacher_id()) WITH CHECK (teacher_id = get_teacher_id());
CREATE POLICY "Anyone can read rewards"             ON public.teacher_rewards FOR SELECT USING (true);


-- ============================================================
-- 8. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guild_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievement_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievement_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pvp_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.boss_attempts;


-- ============================================================
-- 9. DUNGEON EXPANSION (migration 20260321000000)
-- analytics_events, guilds, guild_members, guild_posts,
-- pet_types, student_pets, boss_battles, boss_questions,
-- boss_attempts, pvp_matches, skill_trees, skill_nodes,
-- student_skill_progress, time_capsules, class_wars,
-- mentorships, achievement_feed, achievement_reactions,
-- craft_recipes, student_crafts, parent_accounts,
-- parent_student_links, parent_reports, lore_tips
-- See: supabase/migrations/20260321000000_dungeon_expansion.sql
-- ============================================================
