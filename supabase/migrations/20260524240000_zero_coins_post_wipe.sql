-- Patch 2.0: zera moedas pos-wipe.
-- Usa SECURITY DEFINER + session_replication_role pra bypass do trigger
-- enforce_student_character_update_only (mesma tecnica do apply_patch11_wipe).

DO $$
BEGIN
  SET LOCAL session_replication_role = 'replica';
  UPDATE public.students
  SET coins = 0,
      patch_1_1_refund = 0
  WHERE wiped_at_patch_1_1 IS NOT NULL;
END $$;
