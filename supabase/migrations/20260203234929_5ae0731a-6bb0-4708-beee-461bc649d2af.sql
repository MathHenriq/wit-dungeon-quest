-- =============================================
-- MÓDULO PEDAGÓGICO DE RETENÇÃO - WIT Dungeon
-- =============================================

-- 1. Enum para tipos de títulos de reconhecimento
CREATE TYPE public.student_title_type AS ENUM (
  'helper_of_week',      -- Ajudante da Semana
  'presence_guardian',   -- Guardião da Presença
  'attitude_example'     -- Exemplo de Atitude
);

-- 2. Tabela: Missões do Bom Aluno (criadas pelo professor)
CREATE TABLE public.student_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reward INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_return_mission BOOLEAN NOT NULL DEFAULT false, -- Missão de retorno após falta
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_missions ENABLE ROW LEVEL SECURITY;

-- Policies for student_missions
CREATE POLICY "Anyone can read active missions"
ON public.student_missions
FOR SELECT
USING (is_active = true);

CREATE POLICY "Teachers can manage own missions"
ON public.student_missions
FOR ALL
USING (teacher_id = get_teacher_id())
WITH CHECK (teacher_id = get_teacher_id());

-- 3. Tabela: Completions de missões (solicitações dos alunos)
CREATE TABLE public.mission_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.student_missions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.teachers(id)
);

-- Enable RLS
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;

-- Policies for mission_completions
CREATE POLICY "Anyone can view completions"
ON public.mission_completions
FOR SELECT
USING (true);

CREATE POLICY "Students can request mission completion"
ON public.mission_completions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM students WHERE students.id = mission_completions.student_id
));

CREATE POLICY "Teachers can update completions for their students"
ON public.mission_completions
FOR UPDATE
USING (is_teacher_of_student(student_id));

-- 4. Tabela: Títulos de reconhecimento (temporários)
CREATE TABLE public.student_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title_type public.student_title_type NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_by UUID NOT NULL REFERENCES public.teachers(id)
);

-- Enable RLS
ALTER TABLE public.student_titles ENABLE ROW LEVEL SECURITY;

-- Policies for student_titles
CREATE POLICY "Anyone can view active titles"
ON public.student_titles
FOR SELECT
USING (expires_at > now());

CREATE POLICY "Teachers can manage titles for their students"
ON public.student_titles
FOR ALL
USING (is_teacher_of_student(student_id))
WITH CHECK (is_teacher_of_student(student_id));

-- 5. Adicionar campo para controlar missão de retorno pendente
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS needs_return_mission BOOLEAN NOT NULL DEFAULT false;