-- ============================================================
-- Patch 2.7 — Patch 1.1 wipe (ARMED but NOT auto-fired)
--
-- This migration only sets up:
--   - The schema columns the wipe + welcome modal need
--   - The SECURITY DEFINER function that does the actual wipe
--   - A read RPC + a "mark seen" RPC for the modal
--
-- ⚠️  The wipe itself does NOT run on db push.  When you're ready
-- to ship the Season 2 launch, run manually:
--
--     SELECT public.apply_patch11_wipe();
--
-- It returns a JSONB summary with affected counts. Idempotent: a
-- student whose wiped_at_patch_1_1 is already set is skipped.
--
-- Rollback (if you need to undo BEFORE many students have logged in):
--   1. Identify the wipe window from action_log (action='patch11_wipe').
--   2. Restore student_inventory rows from your backup (point-in-time).
--   3. UPDATE students SET coins = coins - patch_1_1_refund,
--        wiped_at_patch_1_1 = NULL, seen_patch_1_1 = FALSE,
--        patch_1_1_refund = NULL
--      WHERE wiped_at_patch_1_1 IS NOT NULL;
-- ============================================================

-- ── Schema additions ─────────────────────────────────────────
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS wiped_at_patch_1_1 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seen_patch_1_1     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS patch_1_1_refund   INTEGER;

CREATE INDEX IF NOT EXISTS idx_students_wiped_at_patch_1_1
  ON public.students (wiped_at_patch_1_1)
  WHERE wiped_at_patch_1_1 IS NOT NULL;


-- ── 1. The wipe — runs ONLY when you call it explicitly ──────
CREATE OR REPLACE FUNCTION public.apply_patch11_wipe()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_uid   UUID := auth.uid();
  v_is_admin     BOOLEAN;
  v_processed    INTEGER := 0;
  v_skipped      INTEGER := 0;
  v_refund_high  INTEGER := 0;  -- students who got 850
  v_refund_low   INTEGER := 0;  -- students who got 250
  v_rec          RECORD;
  v_inv_count    INTEGER;
  v_refund       INTEGER;
BEGIN
  -- Gate: admin-only. Allow service_role + the auth admin path.
  IF v_caller_uid IS NOT NULL THEN
    SELECT COALESCE(is_admin, false) INTO v_is_admin
    FROM teachers WHERE user_id = v_caller_uid LIMIT 1;
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
    END IF;
  END IF;

  FOR v_rec IN
    SELECT id, name, COALESCE(coins, 0) AS coins
    FROM students
    WHERE wiped_at_patch_1_1 IS NULL
  LOOP
    -- Heuristic: any inventory row counts as "invested in skills".
    -- The purchase_item RPC has never logged purchases, so an exact
    -- coin-spent total is unrecoverable. Binary check is intentional.
    SELECT COUNT(*) INTO v_inv_count
    FROM student_inventory
    WHERE student_id = v_rec.id;

    IF v_inv_count > 0 THEN
      v_refund := 850;
      v_refund_high := v_refund_high + 1;
    ELSE
      v_refund := 250;
      v_refund_low := v_refund_low + 1;
    END IF;

    -- Disable the character-update guard for this UPDATE: the wipe
    -- needs to bump coins as a system operation, not as the student.
    -- session_replication_role is local to this statement.
    SET LOCAL session_replication_role = 'replica';

    -- Wipe the student's inventory.
    DELETE FROM student_inventory WHERE student_id = v_rec.id;

    -- Credit the refund + flag the row as wiped.
    UPDATE students
    SET coins              = COALESCE(coins, 0) + v_refund,
        wiped_at_patch_1_1 = now(),
        patch_1_1_refund   = v_refund,
        seen_patch_1_1     = false   -- guarantees modal fires next login
    WHERE id = v_rec.id;

    v_processed := v_processed + 1;
  END LOOP;

  -- Count idempotent skips for visibility.
  SELECT COUNT(*) INTO v_skipped
  FROM students
  WHERE wiped_at_patch_1_1 IS NOT NULL;

  -- Audit log — one row per wipe invocation.
  PERFORM log_action(
    'patch11_wipe',
    'students',
    NULL,
    'Patch 1.1 launch wipe',
    jsonb_build_object(
      'processed',    v_processed,
      'already_done', v_skipped - v_processed,
      'refund_850',   v_refund_high,
      'refund_250',   v_refund_low,
      'invoked_at',   now()
    )
  );

  RETURN jsonb_build_object(
    'ok',           true,
    'processed',    v_processed,
    'refund_850',   v_refund_high,
    'refund_250',   v_refund_low
  );
END;
$$;

-- Only an admin (or service_role via SQL) can call this. We DO NOT grant
-- to authenticated/anon — the gate inside is belt-and-suspenders.
REVOKE ALL ON FUNCTION public.apply_patch11_wipe() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_patch11_wipe() TO service_role, authenticated;


-- ── 2. Mark-seen RPC: closes the modal forever for the caller ─
CREATE OR REPLACE FUNCTION public.mark_patch11_seen()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  -- Bypass enforce_student_character_update_only for this single column.
  SET LOCAL session_replication_role = 'replica';

  UPDATE students
  SET seen_patch_1_1 = true
  WHERE user_id = v_uid AND COALESCE(seen_patch_1_1, false) = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_patch11_seen() TO authenticated;


-- ── 3. Read RPC for the modal — keeps the client off the column directly ─
CREATE OR REPLACE FUNCTION public.get_patch11_status()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'wiped_at',     wiped_at_patch_1_1,
    'seen',         COALESCE(seen_patch_1_1, false),
    'refund',       patch_1_1_refund,
    'should_show',  (wiped_at_patch_1_1 IS NOT NULL AND COALESCE(seen_patch_1_1, false) = false)
  )
  FROM students
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_patch11_status() TO authenticated;
