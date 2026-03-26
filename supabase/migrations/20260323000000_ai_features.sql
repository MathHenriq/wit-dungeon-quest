-- ============================================================
-- ONDA 5A — AI Features, Adaptive Difficulty, Time Capsule, Daily Dungeon
-- ============================================================

-- 1. Adaptive difficulty column on students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS difficulty_level TEXT NOT NULL DEFAULT 'normal';

-- 2. Daily dungeon attempts table
CREATE TABLE IF NOT EXISTS public.daily_dungeon_attempts (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  day_seed    INTEGER NOT NULL, -- floor(epoch_ms / 86400000)
  floors_completed INTEGER NOT NULL DEFAULT 0,
  coins_earned     INTEGER NOT NULL DEFAULT 0,
  xp_earned        INTEGER NOT NULL DEFAULT 0,
  completed        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, day_seed)
);

ALTER TABLE public.daily_dungeon_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read own dungeon attempts' AND tablename = 'daily_dungeon_attempts') THEN
    CREATE POLICY "Anyone can read own dungeon attempts" ON public.daily_dungeon_attempts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can insert dungeon attempts' AND tablename = 'daily_dungeon_attempts') THEN
    CREATE POLICY "Students can insert dungeon attempts" ON public.daily_dungeon_attempts FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can update own dungeon attempts' AND tablename = 'daily_dungeon_attempts') THEN
    CREATE POLICY "Students can update own dungeon attempts" ON public.daily_dungeon_attempts FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated students can insert dungeon attempts' AND tablename = 'daily_dungeon_attempts') THEN
    CREATE POLICY "Authenticated students can insert dungeon attempts" ON public.daily_dungeon_attempts FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated students can update dungeon attempts' AND tablename = 'daily_dungeon_attempts') THEN
    CREATE POLICY "Authenticated students can update dungeon attempts" ON public.daily_dungeon_attempts FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- 3. RPC: complete daily dungeon (upsert attempt, award coins/xp)
CREATE OR REPLACE FUNCTION public.complete_daily_dungeon(
  p_student_id UUID,
  p_day_seed   INTEGER,
  p_floors     INTEGER,
  p_coins      INTEGER,
  p_xp         INTEGER,
  p_completed  BOOLEAN
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO daily_dungeon_attempts (student_id, day_seed, floors_completed, coins_earned, xp_earned, completed)
  VALUES (p_student_id, p_day_seed, p_floors, p_coins, p_xp, p_completed)
  ON CONFLICT (student_id, day_seed) DO NOTHING; -- uma tentativa por dia

  UPDATE students
  SET coins = COALESCE(coins, 0) + p_coins,
      xp    = COALESCE(xp, 0)    + p_xp
  WHERE id = p_student_id;
END;
$$;
GRANT EXECUTE ON FUNCTION complete_daily_dungeon TO anon, authenticated;

-- 4. RPC: update student difficulty
CREATE OR REPLACE FUNCTION public.update_student_difficulty(
  p_student_id    UUID,
  p_new_difficulty TEXT
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE students SET difficulty_level = p_new_difficulty WHERE id = p_student_id;
END;
$$;
GRANT EXECUTE ON FUNCTION update_student_difficulty TO anon, authenticated;

-- 5. Time capsule: ensure open_date is nullable and add teacher activation column
ALTER TABLE public.time_capsules ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- RLS policies for time_capsules (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can read own time capsules' AND tablename = 'time_capsules') THEN
    CREATE POLICY "Students can read own time capsules" ON public.time_capsules FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can insert time capsules' AND tablename = 'time_capsules') THEN
    CREATE POLICY "Students can insert time capsules" ON public.time_capsules FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can update own time capsules' AND tablename = 'time_capsules') THEN
    CREATE POLICY "Students can update own time capsules" ON public.time_capsules FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated students can insert time capsules' AND tablename = 'time_capsules') THEN
    CREATE POLICY "Authenticated students can insert time capsules" ON public.time_capsules FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated students can update time capsules' AND tablename = 'time_capsules') THEN
    CREATE POLICY "Authenticated students can update time capsules" ON public.time_capsules FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can manage time capsules' AND tablename = 'time_capsules') THEN
    CREATE POLICY "Teachers can manage time capsules" ON public.time_capsules FOR ALL TO authenticated USING (true);
  END IF;
END $$;

ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;
