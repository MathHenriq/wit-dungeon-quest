-- Add profile photo URL column to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- Create student inventory table
CREATE TABLE public.student_inventory (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    item_id uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
    added_at timestamp with time zone NOT NULL DEFAULT now(),
    added_by uuid REFERENCES public.teachers(id),
    UNIQUE(student_id, item_id)
);

-- Enable RLS
ALTER TABLE public.student_inventory ENABLE ROW LEVEL SECURITY;

-- Anyone can read inventory (students need to see their own)
CREATE POLICY "Anyone can read inventory"
ON public.student_inventory
FOR SELECT
USING (true);

-- Only teachers can manage inventory of their students
CREATE POLICY "Teachers can insert inventory items"
ON public.student_inventory
FOR INSERT
WITH CHECK (is_teacher_of_student(student_id));

CREATE POLICY "Teachers can delete inventory items"
ON public.student_inventory
FOR DELETE
USING (is_teacher_of_student(student_id));

-- Update trigger to allow profile_photo_url edits by students
CREATE OR REPLACE FUNCTION public.enforce_student_character_update_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Teachers are authenticated; they may update any fields allowed by existing RLS.
  IF auth.uid() IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Anonymous updates are allowed ONLY for character/narrative fields + profile photo.
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    RAISE EXCEPTION 'Not allowed: cannot change student name';
  END IF;

  IF NEW.class_id IS DISTINCT FROM OLD.class_id THEN
    RAISE EXCEPTION 'Not allowed: cannot change class';
  END IF;

  IF NEW.coins IS DISTINCT FROM OLD.coins THEN
    RAISE EXCEPTION 'Not allowed: cannot change coins';
  END IF;

  IF NEW.level IS DISTINCT FROM OLD.level THEN
    RAISE EXCEPTION 'Not allowed: cannot change level';
  END IF;

  IF NEW.presencas_consecutivas IS DISTINCT FROM OLD.presencas_consecutivas THEN
    RAISE EXCEPTION 'Not allowed: cannot change attendance';
  END IF;

  -- profile_photo_url IS allowed for anonymous users (students)

  RETURN NEW;
END;
$function$;