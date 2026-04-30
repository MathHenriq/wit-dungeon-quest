-- ============================================================
-- Re-link orphaned `characters` rows after the Google-OAuth
-- removal (commit 89f5cbe, 2026-04-28).
--
-- Problem
--   When OAuth was removed, students re-registered with email
--   + password. Supabase issued them a NEW auth.users.id, but
--   their `characters.user_id` still pointed to the old Google
--   auth user. Result:
--     - useBattleCharacter (.eq('user_id', auth.uid())) found
--       no character → created a fresh one at floor 1.
--     - character_progress and floor_enemy_defeats stayed
--       attached to the orphan character_id.
--     - Yesterday's RLS migration on character_progress made
--       the orphan rows invisible too.
--
-- Strategy
--   1. Snapshot current characters into a backup table.
--   2. Build (old_uid, new_uid) pairs joining auth.users by
--      lower(email). Old = any auth user with the same email
--      that ISN'T the current students.user_id.
--   3. If the new uid already has a character that has no
--      progress, delete it so the old (rich) character can be
--      re-attached.
--   4. UPDATE characters.user_id = new_uid where (a) the row
--      currently sits on old_uid AND (b) no character row
--      remains for new_uid.
--
-- Safe to re-run: backup uses IF NOT EXISTS; DELETE/UPDATE are
-- naturally idempotent.
-- ============================================================

-- ── 1. Snapshot ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.characters_relink_backup_20260430 AS
SELECT * FROM public.characters;


-- ── 2. Resolve conflicts: drop empty "new" characters that
--      block the re-link, but only when the corresponding old
--      character holds the actual progress.
WITH email_map AS (
  SELECT old_au.id AS old_uid,
         s.user_id AS new_uid
  FROM   public.students s
  JOIN   auth.users new_au ON new_au.id = s.user_id
  JOIN   auth.users old_au ON lower(old_au.email) = lower(new_au.email)
                          AND old_au.id <> new_au.id
)
DELETE FROM public.characters c
USING email_map em
WHERE c.user_id = em.new_uid
  -- empty new character: never advanced past starter state
  AND NOT EXISTS (
        SELECT 1 FROM public.character_progress  cp WHERE cp.character_id = c.id
      )
  AND NOT EXISTS (
        SELECT 1 FROM public.floor_enemy_defeats fed WHERE fed.character_id = c.id
      )
  -- and the old character actually exists to take its place
  AND EXISTS (
        SELECT 1 FROM public.characters c_old WHERE c_old.user_id = em.old_uid
      );


-- ── 3. Re-link ───────────────────────────────────────────────
UPDATE public.characters c
SET    user_id    = em.new_uid,
       updated_at = now()
FROM (
  SELECT old_au.id AS old_uid,
         s.user_id AS new_uid
  FROM   public.students s
  JOIN   auth.users new_au ON new_au.id = s.user_id
  JOIN   auth.users old_au ON lower(old_au.email) = lower(new_au.email)
                          AND old_au.id <> new_au.id
) em
WHERE c.user_id = em.old_uid
  -- the new uid has no character now (either never had one,
  -- or step 2 just removed an empty one).
  AND NOT EXISTS (
        SELECT 1 FROM public.characters c2 WHERE c2.user_id = em.new_uid
      );


-- ── 4. Visibility log ────────────────────────────────────────
DO $$
DECLARE
  v_relinked  INTEGER;
  v_orphans   INTEGER;
BEGIN
  SELECT count(*) INTO v_relinked
  FROM   public.characters c
  WHERE  EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = c.user_id);

  SELECT count(*) INTO v_orphans
  FROM   public.characters c
  WHERE  c.user_id IS NULL
     OR  NOT EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = c.user_id);

  RAISE NOTICE 'characters linked to a current student: %', v_relinked;
  RAISE NOTICE 'characters still orphaned (no matching student.user_id): %', v_orphans;
END $$;
