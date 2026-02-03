-- Add consecutive attendance field to students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS presencas_consecutivas integer NOT NULL DEFAULT 0;

-- Add attendance request type to the enum
ALTER TYPE public.request_type ADD VALUE IF NOT EXISTS 'attendance';

-- Update the trigger to also block changes to presencas_consecutivas by students
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

  -- Anonymous updates are allowed ONLY for character/narrative fields.
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

  RETURN NEW;
END;
$function$;