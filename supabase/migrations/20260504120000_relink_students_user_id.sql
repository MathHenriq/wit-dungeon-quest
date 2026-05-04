-- ============================================================
-- Re-link orphaned `students.user_id` after Google-OAuth removal.
--
-- Problem
--   The 20260430120000 migration re-linked `characters.user_id`
--   by email, but `students.user_id` itself was left pointing to
--   the OLD (Google OAuth) auth.users id for accounts that
--   pre-date the email/password switch.
--
--   When such a student logs in with email/password, Supabase
--   issues a NEW auth.users id. At UPDATE time on `students`:
--     - the RLS policy "Authenticated students can update own
--       record" passes (USING true), but
--     - the trigger enforce_student_character_update_only checks
--       `OLD.user_id = auth.uid()` and raises:
--         'Not allowed: students may only update their own record'
--
--   Visible symptom: profile photo upload preview works, click
--   "Salvar" → toast error → row never persists. Same for any
--   other self-edit (character customization, sprites via
--   characters table, etc. — characters worked because that
--   table was already re-linked).
--
-- Strategy
--   1. Snapshot students into a backup table (idempotent).
--   2. Build (old_uid, new_uid) pairs by joining auth.users on
--      lower(email). "new" = the auth user currently referenced
--      by some students.user_id is treated as canonical only
--      when it's the most recently created one for that email.
--      We pick the newest auth.users.id per email as the target
--      and rewrite any student still pointing at an older one.
--   3. UPDATE students.user_id to the newest id for that email.
--
-- Safe to re-run: backup uses IF NOT EXISTS; UPDATE is naturally
-- idempotent (no-op once aligned).
-- ============================================================

-- ── 1. Snapshot ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students_user_id_backup_20260504 AS
SELECT id, user_id, name, status, created_at
FROM   public.students;


-- ── 2 & 3. Re-link to newest auth user per email ─────────────
WITH newest_per_email AS (
  SELECT DISTINCT ON (lower(email))
         lower(email) AS email_key,
         id           AS new_uid
  FROM   auth.users
  WHERE  email IS NOT NULL
  ORDER  BY lower(email), created_at DESC
),
candidates AS (
  SELECT s.id        AS student_id,
         s.user_id   AS old_uid,
         npe.new_uid AS new_uid
  FROM   public.students s
  JOIN   auth.users      au_old ON au_old.id = s.user_id
  JOIN   newest_per_email npe   ON npe.email_key = lower(au_old.email)
  WHERE  s.user_id IS DISTINCT FROM npe.new_uid
)
UPDATE public.students s
SET    user_id = c.new_uid
FROM   candidates c
WHERE  s.id = c.student_id
  -- avoid colliding with another student already on the new uid
  AND NOT EXISTS (
        SELECT 1 FROM public.students s2
        WHERE  s2.user_id = c.new_uid
          AND  s2.id <> c.student_id
      );


-- ── 4. Visibility log ────────────────────────────────────────
DO $$
DECLARE
  v_aligned   INTEGER;
  v_orphans   INTEGER;
  v_no_user   INTEGER;
BEGIN
  SELECT count(*) INTO v_aligned
  FROM   public.students s
  WHERE  s.user_id IS NOT NULL
    AND  EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id);

  SELECT count(*) INTO v_orphans
  FROM   public.students s
  WHERE  s.user_id IS NOT NULL
    AND  NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id);

  SELECT count(*) INTO v_no_user
  FROM   public.students s
  WHERE  s.user_id IS NULL;

  RAISE NOTICE 'students with valid auth user link: %', v_aligned;
  RAISE NOTICE 'students with broken user_id (auth user missing): %', v_orphans;
  RAISE NOTICE 'students with NULL user_id (never logged in): %', v_no_user;
END $$;
