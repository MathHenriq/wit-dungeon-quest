-- Trigger to synchronize students table stats to characters table
-- Ensures coins, diamonds, level, and XP stay in sync regardless of where they are updated (Teacher Panel, Shop, etc.)

CREATE OR REPLACE FUNCTION public.sync_student_to_character()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We only sync if there is a linked character record via user_id
  UPDATE public.characters
  SET 
    coins = NEW.coins,
    diamonds = NEW.diamonds,
    level = NEW.level,
    xp = NEW.xp,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists to ensure idempotency
DROP TRIGGER IF EXISTS trg_sync_student_to_character ON public.students;

CREATE TRIGGER trg_sync_student_to_character
  AFTER UPDATE OF coins, diamonds, level, xp
  ON public.students
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_student_to_character();

-- Ensure diamonds is also synced for existing records if needed
-- (Optional: uncomment if there's a risk of current divergence)
-- UPDATE public.characters c
-- SET diamonds = s.diamonds
-- FROM public.students s
-- WHERE c.user_id = s.user_id AND c.diamonds IS DISTINCT FROM s.diamonds;
