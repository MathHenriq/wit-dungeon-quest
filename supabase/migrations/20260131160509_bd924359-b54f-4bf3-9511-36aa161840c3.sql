-- WIT Dungeon Database Schema
-- Simple gamification system for classroom use

-- Enum for request types
CREATE TYPE public.request_type AS ENUM ('challenge', 'item');

-- Enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');

-- Teachers profile table (linked to auth.users)
CREATE TABLE public.teachers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Classes managed by teachers
CREATE TABLE public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(teacher_id, name)
);

-- Students (no auth, identified by name + class)
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    character_name TEXT,
    coins INTEGER NOT NULL DEFAULT 50,
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(class_id, name)
);

-- Challenges created by teachers
CREATE TABLE public.challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    reward INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shop items created by teachers
CREATE TABLE public.shop_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL DEFAULT 10,
    min_level INTEGER NOT NULL DEFAULT 1,
    item_type TEXT NOT NULL DEFAULT 'weapon',
    icon TEXT NOT NULL DEFAULT '⚔️',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student requests (for challenges and items)
CREATE TABLE public.student_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    request_type request_type NOT NULL,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
    item_id UUID REFERENCES public.shop_items(id) ON DELETE SET NULL,
    status request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;

-- Helper function: Get teacher ID from auth user
CREATE OR REPLACE FUNCTION public.get_teacher_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.teachers WHERE user_id = auth.uid()
$$;

-- Helper function: Check if current user is teacher of a class
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE c.id = class_id AND t.user_id = auth.uid()
    )
$$;

-- Helper function: Check if current user is teacher of a student
CREATE OR REPLACE FUNCTION public.is_teacher_of_student(student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE s.id = student_id AND t.user_id = auth.uid()
    )
$$;

-- RLS Policies for teachers
CREATE POLICY "Teachers can view own profile" ON public.teachers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can insert own profile" ON public.teachers
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can update own profile" ON public.teachers
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for classes
CREATE POLICY "Teachers can view own classes" ON public.classes
    FOR SELECT USING (teacher_id = public.get_teacher_id());

CREATE POLICY "Teachers can insert own classes" ON public.classes
    FOR INSERT WITH CHECK (teacher_id = public.get_teacher_id());

CREATE POLICY "Teachers can update own classes" ON public.classes
    FOR UPDATE USING (teacher_id = public.get_teacher_id());

CREATE POLICY "Teachers can delete own classes" ON public.classes
    FOR DELETE USING (teacher_id = public.get_teacher_id());

-- RLS Policies for students (teachers manage, public read for identification)
CREATE POLICY "Teachers can manage students in their classes" ON public.students
    FOR ALL USING (public.is_teacher_of_class(class_id));

CREATE POLICY "Anyone can read students for identification" ON public.students
    FOR SELECT USING (true);

-- RLS Policies for challenges
CREATE POLICY "Teachers can manage own challenges" ON public.challenges
    FOR ALL USING (teacher_id = public.get_teacher_id());

CREATE POLICY "Anyone can read active challenges" ON public.challenges
    FOR SELECT USING (is_active = true);

-- RLS Policies for shop_items
CREATE POLICY "Teachers can manage own items" ON public.shop_items
    FOR ALL USING (teacher_id = public.get_teacher_id());

CREATE POLICY "Anyone can read active items" ON public.shop_items
    FOR SELECT USING (is_active = true);

-- RLS Policies for student_requests
CREATE POLICY "Teachers can view requests from their students" ON public.student_requests
    FOR SELECT USING (public.is_teacher_of_student(student_id));

CREATE POLICY "Teachers can update requests from their students" ON public.student_requests
    FOR UPDATE USING (public.is_teacher_of_student(student_id));

CREATE POLICY "Anyone can insert requests" ON public.student_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view their own requests" ON public.student_requests
    FOR SELECT USING (true);

-- Trigger to create teacher profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_teacher()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.teachers (user_id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: This trigger will be attached when teacher signs up with metadata

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_requests;