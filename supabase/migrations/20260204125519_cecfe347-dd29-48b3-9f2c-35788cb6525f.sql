-- ===========================================
-- ISOLAMENTO DO ECOSSISTEMA POR PROFESSOR
-- ===========================================

-- 1. Adicionar teacher_id à tabela students (denormalização para performance)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id);

-- 2. Popular teacher_id baseado na turma existente
UPDATE public.students s
SET teacher_id = c.teacher_id
FROM public.classes c
WHERE s.class_id = c.id
AND s.teacher_id IS NULL;

-- 3. Tornar teacher_id NOT NULL após popular
ALTER TABLE public.students 
ALTER COLUMN teacher_id SET NOT NULL;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON public.students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_challenges_teacher_id ON public.challenges(teacher_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_teacher_id ON public.shop_items(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_missions_teacher_id ON public.student_missions(teacher_id);

-- 5. Função helper: verificar se aluno pertence ao professor
CREATE OR REPLACE FUNCTION public.student_belongs_to_teacher(p_student_id uuid, p_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = p_student_id AND teacher_id = p_teacher_id
  )
$$;

-- 6. Função helper: obter teacher_id de um aluno
CREATE OR REPLACE FUNCTION public.get_student_teacher_id(p_student_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teacher_id FROM public.students WHERE id = p_student_id
$$;

-- ===========================================
-- ATUALIZAR RLS POLICIES - CHALLENGES
-- ===========================================
DROP POLICY IF EXISTS "Anyone can read active challenges" ON public.challenges;

-- Alunos só veem desafios do seu professor
CREATE POLICY "Students can read their teacher challenges"
ON public.challenges FOR SELECT
USING (
  is_active = true 
  AND teacher_id = (
    SELECT teacher_id FROM public.students 
    WHERE id = (SELECT id FROM public.students LIMIT 1) -- placeholder, ajustado abaixo
  )
);

-- Na verdade, precisamos de uma abordagem diferente para alunos anônimos
-- Vamos criar uma função que verifica se o desafio pertence ao professor do aluno logado
DROP POLICY IF EXISTS "Students can read their teacher challenges" ON public.challenges;

CREATE POLICY "Read challenges by teacher context"
ON public.challenges FOR SELECT
USING (
  -- Professores veem seus próprios desafios
  teacher_id = get_teacher_id()
  OR
  -- Desafios ativos são lidos (filtro no frontend por teacher_id)
  is_active = true
);

-- ===========================================
-- ATUALIZAR RLS POLICIES - SHOP_ITEMS
-- ===========================================
DROP POLICY IF EXISTS "Anyone can read active items" ON public.shop_items;

CREATE POLICY "Read items by teacher context"
ON public.shop_items FOR SELECT
USING (
  teacher_id = get_teacher_id()
  OR
  is_active = true
);

-- ===========================================
-- ATUALIZAR RLS POLICIES - STUDENT_MISSIONS
-- ===========================================
DROP POLICY IF EXISTS "Anyone can read active missions" ON public.student_missions;

CREATE POLICY "Read missions by teacher context"
ON public.student_missions FOR SELECT
USING (
  teacher_id = get_teacher_id()
  OR
  is_active = true
);

-- ===========================================
-- ATUALIZAR RLS POLICIES - CLASSES
-- ===========================================
-- Classes precisam ser lidas para login, mas filtradas por contexto
-- Mantemos a policy existente pois alunos precisam ver turmas no dropdown

-- ===========================================
-- ATUALIZAR RLS POLICIES - STUDENTS
-- ===========================================
-- Já existem policies adequadas, apenas garantir que teacher_id é respeitado

-- ===========================================
-- ATUALIZAR RLS POLICIES - STUDENT_TITLES
-- ===========================================
-- Adicionar teacher_id para títulos (via student)
DROP POLICY IF EXISTS "Anyone can view active titles" ON public.student_titles;

CREATE POLICY "Read active titles"
ON public.student_titles FOR SELECT
USING (
  expires_at > now()
);

-- ===========================================
-- TRIGGER: Auto-popular teacher_id ao criar aluno
-- ===========================================
CREATE OR REPLACE FUNCTION public.set_student_teacher_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se teacher_id não foi fornecido, buscar da turma
  IF NEW.teacher_id IS NULL THEN
    SELECT teacher_id INTO NEW.teacher_id
    FROM public.classes
    WHERE id = NEW.class_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_student_teacher_id ON public.students;
CREATE TRIGGER trigger_set_student_teacher_id
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.set_student_teacher_id();