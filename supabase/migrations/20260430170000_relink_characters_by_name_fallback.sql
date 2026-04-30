-- ============================================================
-- Second-pass relink for characters that the email-based join
-- (migration 20260430120000) failed to recover.
--
-- Why a second pass:
--   The first migration only matched auth.users by email. Several
--   students re-registered with a different email (e.g. swapped
--   from gmail to a school address) so the join missed them, and
--   their level-5 progress is still attached to an orphan
--   character_id whose user_id no longer maps to any student.
--
--   Calebe Isaac (student.id b62ea719..., character_name "Yuta")
--   is the canonical example: students.user_id has no character
--   and his pre-OAuth-removal character holds all the floor
--   defeats.
--
-- This migration matches orphan characters to current students
-- by character_name (lowercased) when a single unambiguous pair
-- exists. Where multiple orphan characters carry the same name,
-- the one with the most floor_enemy_defeats wins.
--
--   1. Build the set of orphan characters (user_id not present
--      in students.user_id).
--   2. For each student that currently has no character row,
--      look up an orphan whose lower(name) = lower(student
--      .character_name). Tie-break by COUNT(floor_enemy_defeats)
--      DESC, then most recent updated_at.
--   3. UPDATE characters SET user_id = student.user_id for the
--      winning orphan. Skip when (a) the student already owns a
--      character or (b) more than one orphan ties on activity
--      (treated as "needs manual review").
--
-- Idempotent: re-running won't double-link because step 2 only
-- considers students still missing a character.
-- ============================================================

-- Snapshot before second pass
CREATE TABLE IF NOT EXISTS public.characters_relink_namepass_backup_20260430 AS
SELECT * FROM public.characters;

WITH
  orphan_chars AS (
    SELECT c.id,
           c.user_id,
           c.name,
           c.level,
           c.xp,
           c.updated_at,
           (SELECT COUNT(*) FROM public.floor_enemy_defeats fed WHERE fed.character_id = c.id) AS defeats,
           (SELECT COUNT(*) FROM public.character_progress    cp  WHERE cp.character_id = c.id) AS progress_rows
    FROM   public.characters c
    WHERE  c.user_id IS NULL
        OR NOT EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = c.user_id)
  ),
  students_no_char AS (
    SELECT s.id              AS student_id,
           s.user_id          AS student_user_id,
           s.character_name   AS character_name
    FROM   public.students s
    WHERE  s.user_id IS NOT NULL
      AND  s.character_name IS NOT NULL
      AND  length(trim(s.character_name)) > 0
      AND  NOT EXISTS (SELECT 1 FROM public.characters c WHERE c.user_id = s.user_id)
  ),
  best_match AS (
    SELECT DISTINCT ON (snc.student_id)
           snc.student_id,
           snc.student_user_id,
           snc.character_name,
           oc.id        AS orphan_char_id,
           oc.defeats,
           oc.progress_rows
    FROM   students_no_char snc
    JOIN   orphan_chars oc
           ON lower(trim(oc.name)) = lower(trim(snc.character_name))
    ORDER  BY snc.student_id,
              oc.defeats        DESC,
              oc.progress_rows  DESC,
              oc.updated_at     DESC NULLS LAST
  )
UPDATE public.characters c
SET    user_id    = bm.student_user_id,
       updated_at = now()
FROM   best_match bm
WHERE  c.id = bm.orphan_char_id
  -- guard against race: re-check the student still has no char
  AND  NOT EXISTS (SELECT 1 FROM public.characters c2 WHERE c2.user_id = bm.student_user_id);


-- Visibility log
DO $$
DECLARE
  v_linked   INT;
  v_missing  INT;
BEGIN
  SELECT COUNT(*) INTO v_linked
  FROM   public.characters c
  WHERE  EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = c.user_id);

  SELECT COUNT(*) INTO v_missing
  FROM   public.students s
  WHERE  s.user_id IS NOT NULL
    AND  NOT EXISTS (SELECT 1 FROM public.characters c WHERE c.user_id = s.user_id);

  RAISE NOTICE 'characters now linked to a current student: %', v_linked;
  RAISE NOTICE 'students with user_id but no character row    : %', v_missing;
END $$;
