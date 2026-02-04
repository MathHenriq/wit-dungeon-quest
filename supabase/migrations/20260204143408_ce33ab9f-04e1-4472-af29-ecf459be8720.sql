-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for teacher reward configuration
CREATE TABLE public.teacher_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL UNIQUE REFERENCES public.teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Moedas',
  icon TEXT NOT NULL DEFAULT '🪙',
  unit_label_singular TEXT NOT NULL DEFAULT 'moeda',
  unit_label_plural TEXT NOT NULL DEFAULT 'moedas',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_rewards ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own reward config
CREATE POLICY "Teachers can manage own rewards"
ON public.teacher_rewards
FOR ALL
USING (teacher_id = get_teacher_id())
WITH CHECK (teacher_id = get_teacher_id());

-- Anyone can read rewards (for students to see their teacher's config)
CREATE POLICY "Anyone can read rewards"
ON public.teacher_rewards
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_teacher_rewards_updated_at
BEFORE UPDATE ON public.teacher_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();