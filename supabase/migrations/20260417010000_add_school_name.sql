-- Add school_name to students so ranking "Escola" filters by real school
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS school_name text;
