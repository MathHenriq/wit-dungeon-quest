
-- Add challenge_type column: 'simples' (repeatable) or 'unica' (one completion per student)
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS challenge_type text NOT NULL DEFAULT 'simples';
