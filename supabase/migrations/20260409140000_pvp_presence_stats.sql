-- ============================================================
-- PvP Presence + Stats for student-level PvP
-- Migration: 20260409140000_pvp_presence_stats.sql
-- ============================================================

-- Track which students are currently in the PvP arena
CREATE TABLE IF NOT EXISTS public.pvp_presence (
  student_id  UUID        PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pvp_presence ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_presence' AND policyname='Anyone can read pvp_presence') THEN
    CREATE POLICY "Anyone can read pvp_presence" ON public.pvp_presence FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_presence' AND policyname='Students can upsert own pvp_presence') THEN
    CREATE POLICY "Students can upsert own pvp_presence" ON public.pvp_presence FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_presence' AND policyname='Students can update own pvp_presence') THEN
    CREATE POLICY "Students can update own pvp_presence" ON public.pvp_presence FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_presence' AND policyname='Students can delete own pvp_presence') THEN
    CREATE POLICY "Students can delete own pvp_presence" ON public.pvp_presence FOR DELETE TO anon USING (true);
  END IF;
  -- authenticated variants
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_presence' AND policyname='Auth students can upsert own pvp_presence') THEN
    CREATE POLICY "Auth students can upsert own pvp_presence" ON public.pvp_presence FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_presence' AND policyname='Auth students can update own pvp_presence') THEN
    CREATE POLICY "Auth students can update own pvp_presence" ON public.pvp_presence FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_presence' AND policyname='Auth students can delete own pvp_presence') THEN
    CREATE POLICY "Auth students can delete own pvp_presence" ON public.pvp_presence FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Student-level PvP stats (separate from character-level pvp_stats)
CREATE TABLE IF NOT EXISTS public.pvp_student_stats (
  student_id   UUID    PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL DEFAULT 1000,
  wins         INTEGER NOT NULL DEFAULT 0,
  losses       INTEGER NOT NULL DEFAULT 0,
  win_streak   INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pvp_student_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_student_stats' AND policyname='Anyone can read pvp_student_stats') THEN
    CREATE POLICY "Anyone can read pvp_student_stats" ON public.pvp_student_stats FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_student_stats' AND policyname='Students can upsert own pvp_student_stats') THEN
    CREATE POLICY "Students can upsert own pvp_student_stats" ON public.pvp_student_stats FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_student_stats' AND policyname='Students can update own pvp_student_stats') THEN
    CREATE POLICY "Students can update own pvp_student_stats" ON public.pvp_student_stats FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_student_stats' AND policyname='Auth students can upsert own pvp_student_stats') THEN
    CREATE POLICY "Auth students can upsert own pvp_student_stats" ON public.pvp_student_stats FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pvp_student_stats' AND policyname='Auth students can update own pvp_student_stats') THEN
    CREATE POLICY "Auth students can update own pvp_student_stats" ON public.pvp_student_stats FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- Enable Realtime for presence and challenges
ALTER PUBLICATION supabase_realtime ADD TABLE public.pvp_presence;

-- Add pvp_matches realtime if not already there (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'pvp_matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pvp_matches;
  END IF;
END $$;
