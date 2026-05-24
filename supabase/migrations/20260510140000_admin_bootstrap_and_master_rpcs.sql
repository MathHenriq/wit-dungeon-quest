-- ============================================================
-- Patch 1.3 — Make the master/admin panel actually work
--
-- Why
--   The user reported "tem um painel master mas quase nada
--   funciona". The infrastructure (admin RPCs + Edge Functions
--   + AdminPanel UI) was already in place from migration
--   20260430230000_admin_panel.sql. The blocker is that
--   is_caller_admin() returns false for the calling user
--   because the bootstrap UPDATE only flagged two specific
--   teacher IDs as admin, not Matheus's actual current
--   teacher row(s). When that returns false, every admin RPC
--   and Edge Function hard-rejects with 403 → "nada funciona".
--
--   Two missing capabilities also need server-side RPCs:
--     - spawning a card into any student's inventory
--     - adjusting any student's coins / diamonds
--
-- This migration:
--   1. Re-bootstraps admin by auth.users.id (stable identity)
--      instead of teacher row id (which may rotate). The
--      master user is hardcoded:
--          be9ab312-02bb-49a7-a49b-1aae60f4e60b → Matheus.
--      Every teacher row owned by that auth user is flagged
--      is_admin = true. Idempotent.
--   2. Adds master_spawn_card(target_student_id, item_id)
--      → inserts a row in student_inventory, idempotent vs
--      the UNIQUE(student_id, item_id) constraint.
--   3. Adds master_adjust_currency(target_student_id, amount,
--      currency) → moves coins or diamonds by a signed delta.
--      Refuses to drive the balance below zero.
--   Both RPCs gate on is_caller_admin() and raise 42501
--   (insufficient_privilege) for non-admins.
-- ============================================================

-- ── 1. Re-bootstrap admin by auth.uid ────────────────────────
UPDATE public.teachers
   SET is_admin = true
 WHERE user_id = 'be9ab312-02bb-49a7-a49b-1aae60f4e60b'::uuid
   AND COALESCE(is_admin, false) = false;


-- ── 2. master_spawn_card ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.master_spawn_card(
  p_student_id UUID,
  p_item_id    UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv_id UUID;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.students    WHERE id = p_student_id) THEN
    RAISE EXCEPTION 'student not found: %', p_student_id USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shop_items  WHERE id = p_item_id) THEN
    RAISE EXCEPTION 'item not found: %',    p_item_id    USING ERRCODE = 'P0002';
  END IF;

  -- UNIQUE(student_id, item_id) on student_inventory: skip silently
  -- if the student already owns this card.
  SELECT id INTO v_inv_id
  FROM public.student_inventory
  WHERE student_id = p_student_id AND item_id = p_item_id
  LIMIT 1;

  IF v_inv_id IS NOT NULL THEN
    RETURN v_inv_id;
  END IF;

  INSERT INTO public.student_inventory (student_id, item_id)
  VALUES (p_student_id, p_item_id)
  RETURNING id INTO v_inv_id;

  RETURN v_inv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.master_spawn_card(UUID, UUID)
  TO authenticated, service_role;


-- ── 3. master_adjust_currency ────────────────────────────────
CREATE OR REPLACE FUNCTION public.master_adjust_currency(
  p_student_id UUID,
  p_amount     INTEGER,
  p_currency   TEXT  -- 'coins' | 'diamonds'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  IF p_currency NOT IN ('coins', 'diamonds') THEN
    RAISE EXCEPTION 'invalid currency: %', p_currency USING ERRCODE = '22023';
  END IF;

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'amount must be non-zero' USING ERRCODE = '22023';
  END IF;

  -- The audit trigger logs coin/diamond changes automatically.
  -- The character-update trigger blocks anon coin writes but
  -- this function runs SECURITY DEFINER as the function owner,
  -- which bypasses both the trigger guard (auth.uid() returns
  -- the admin's uid → teacher branch → no restriction) and
  -- RLS on public.students.
  IF p_currency = 'coins' THEN
    UPDATE public.students
       SET coins = GREATEST(0, COALESCE(coins, 0) + p_amount)
     WHERE id = p_student_id
     RETURNING coins INTO v_new_balance;
  ELSE
    UPDATE public.students
       SET diamonds = GREATEST(0, COALESCE(diamonds, 0) + p_amount)
     WHERE id = p_student_id
     RETURNING diamonds INTO v_new_balance;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found: %', p_student_id USING ERRCODE = 'P0002';
  END IF;

  RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.master_adjust_currency(UUID, INTEGER, TEXT)
  TO authenticated, service_role;
