-- ============================================================
-- LEVEL UP TRIGGER SYSTEM — WIT Dungeon Quest
-- Migration: 20260409120000_level_up_trigger.sql
--
-- Problem: students.xp is updated by multiple RPCs but
--          students.level is NEVER updated automatically.
-- Fix:
--   1. calculate_level_from_xp() — pure function, new quadratic curve
--   2. auto_level_up()           — trigger function
--   3. trg_auto_level_up         — BEFORE UPDATE OF xp trigger on students
--   4. Backup + backfill all existing students
-- ============================================================

-- ── 1. Pure level calculation function ──────────────────────────────────────
--
-- New curve: XP_for_level(n) = 50*n² + 100*n
--   Level 1  → 150 XP
--   Level 2  → 400 XP  (cumulative: 550)
--   Level 5  → 1750 XP (cumulative: 4,250)
--   Level 10 → 6000 XP (cumulative: 20,500)
--   Level 20 → 22000 XP (cumulative: 93,000)
--

CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(total_xp BIGINT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  current_level   INT    := 1;
  xp_accumulated  BIGINT := 0;
  xp_needed       BIGINT;
BEGIN
  LOOP
    xp_needed := 50 * current_level * current_level + 100 * current_level;

    IF xp_accumulated + xp_needed > total_xp THEN
      RETURN current_level;
    END IF;

    xp_accumulated := xp_accumulated + xp_needed;
    current_level  := current_level + 1;

    -- Hard cap at level 100
    IF current_level > 100 THEN
      RETURN 100;
    END IF;
  END LOOP;
END;
$$;

-- ── 2. Trigger function ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_level_up()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Fire only when xp actually changed
  IF NEW.xp IS DISTINCT FROM OLD.xp AND NEW.xp IS NOT NULL THEN
    NEW.level := public.calculate_level_from_xp(NEW.xp::BIGINT);
  END IF;
  RETURN NEW;
END;
$$;

-- ── 3. Trigger on students ───────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_auto_level_up ON public.students;

CREATE TRIGGER trg_auto_level_up
  BEFORE UPDATE OF xp
  ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_level_up();

-- ── 4. Backup existing levels ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.students_level_backup_20260409 AS
SELECT id, name, level, xp
FROM public.students;

-- ── 5. Backfill: recalculate level for all existing students ─────────────────
-- The security trigger (enforce_student_character_update_only) blocks direct
-- level changes when auth.uid() is NULL (migration context). Disable it for
-- the backfill only, then re-enable.

ALTER TABLE public.students DISABLE TRIGGER enforce_student_character_update_only;

UPDATE public.students
SET level = public.calculate_level_from_xp(COALESCE(xp, 0)::BIGINT);

ALTER TABLE public.students ENABLE TRIGGER enforce_student_character_update_only;

-- ── Grant ────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.calculate_level_from_xp TO anon, authenticated;
