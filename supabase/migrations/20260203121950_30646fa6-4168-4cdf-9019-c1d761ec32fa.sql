-- Fix RLS policy role scoping (anon vs authenticated) to avoid restrictive cross-intersection

-- ========== classes ==========
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read classes for login" ON public.classes;
CREATE POLICY "Anyone can read classes for login"
ON public.classes
AS PERMISSIVE
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;
CREATE POLICY "Teachers can view own classes"
ON public.classes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (teacher_id = get_teacher_id());

DROP POLICY IF EXISTS "Teachers can insert own classes" ON public.classes;
CREATE POLICY "Teachers can insert own classes"
ON public.classes
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (teacher_id = get_teacher_id());

DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
CREATE POLICY "Teachers can update own classes"
ON public.classes
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (teacher_id = get_teacher_id())
WITH CHECK (teacher_id = get_teacher_id());

DROP POLICY IF EXISTS "Teachers can delete own classes" ON public.classes;
CREATE POLICY "Teachers can delete own classes"
ON public.classes
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (teacher_id = get_teacher_id());


-- ========== shop_items ==========
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active items" ON public.shop_items;
CREATE POLICY "Anyone can read active items"
ON public.shop_items
AS PERMISSIVE
FOR SELECT
TO anon
USING (is_active = true);

DROP POLICY IF EXISTS "Teachers can manage own items" ON public.shop_items;
CREATE POLICY "Teachers can manage own items"
ON public.shop_items
AS PERMISSIVE
FOR ALL
TO authenticated
USING (teacher_id = get_teacher_id())
WITH CHECK (teacher_id = get_teacher_id());


-- ========== challenges ==========
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active challenges" ON public.challenges;
CREATE POLICY "Anyone can read active challenges"
ON public.challenges
AS PERMISSIVE
FOR SELECT
TO anon
USING (is_active = true);

DROP POLICY IF EXISTS "Teachers can manage own challenges" ON public.challenges;
CREATE POLICY "Teachers can manage own challenges"
ON public.challenges
AS PERMISSIVE
FOR ALL
TO authenticated
USING (teacher_id = get_teacher_id())
WITH CHECK (teacher_id = get_teacher_id());


-- ========== students ==========
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read students for identification" ON public.students;
CREATE POLICY "Anyone can read students for identification"
ON public.students
AS PERMISSIVE
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Anyone can update student character" ON public.students;
CREATE POLICY "Anyone can update student character"
ON public.students
AS PERMISSIVE
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers can manage students in their classes" ON public.students;
CREATE POLICY "Teachers can manage students in their classes"
ON public.students
AS PERMISSIVE
FOR ALL
TO authenticated
USING (is_teacher_of_class(class_id))
WITH CHECK (is_teacher_of_class(class_id));


-- ========== student_requests ==========
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert requests for existing students" ON public.student_requests;
CREATE POLICY "Allow insert requests for existing students"
ON public.student_requests
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.students
    WHERE students.id = student_requests.student_id
  )
);

DROP POLICY IF EXISTS "Anyone can view their own requests" ON public.student_requests;
CREATE POLICY "Anyone can view their own requests"
ON public.student_requests
AS PERMISSIVE
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Teachers can update requests from their students" ON public.student_requests;
CREATE POLICY "Teachers can update requests from their students"
ON public.student_requests
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (is_teacher_of_student(student_id));

DROP POLICY IF EXISTS "Teachers can view requests from their students" ON public.student_requests;
CREATE POLICY "Teachers can view requests from their students"
ON public.student_requests
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_teacher_of_student(student_id));
