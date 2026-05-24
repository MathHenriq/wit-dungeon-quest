-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: Pós-wipe o aluno precisa de pontos pra destravar pelo menos
-- a primeira skill. Sem pontos a árvore fica inutilizável.
--
-- Concede 10 pontos de starter pra todo aluno depois do reset de skills.
-- ═══════════════════════════════════════════════════════════════════════════

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
  v_refund_high  INTEGER := 0;
  v_refund_low   INTEGER := 0;
  v_rec          RECORD;
  v_char_id      UUID;
  v_inv_count    INTEGER;
  v_refund       INTEGER;
  v_starter_pts  CONSTANT INTEGER := 10;
BEGIN
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

    SET LOCAL session_replication_role = 'replica';

    -- 1. Inventário comprado da loja
    DELETE FROM student_inventory WHERE student_id = v_rec.id;

    -- 2. Skill tree Wave11
    DELETE FROM student_unlocked_skills WHERE student_id = v_rec.id;
    DELETE FROM student_skill_progress  WHERE student_id = v_rec.id;
    DELETE FROM student_skill_points    WHERE student_id = v_rec.id;

    -- 2b. Patch 2.0 — concede pontos de starter pra árvore não ficar
    -- inutilizável. 10 pontos cobre as primeiras skills do elemento principal.
    INSERT INTO student_skill_points (student_id, available_points, total_earned)
    VALUES (v_rec.id, v_starter_pts, v_starter_pts);

    -- 3. Abilities equipadas
    FOR v_char_id IN
      SELECT id FROM characters
      WHERE user_id = (SELECT user_id FROM students WHERE id = v_rec.id)
    LOOP
      DELETE FROM character_abilities WHERE character_id = v_char_id;
    END LOOP;

    -- 4. Credita refund + marca wipado.
    UPDATE students
    SET coins              = COALESCE(coins, 0) + v_refund,
        wiped_at_patch_1_1 = now(),
        patch_1_1_refund   = v_refund,
        seen_patch_1_1     = false
    WHERE id = v_rec.id;

    v_processed := v_processed + 1;
  END LOOP;

  SELECT COUNT(*) INTO v_skipped
  FROM students
  WHERE wiped_at_patch_1_1 IS NOT NULL;

  PERFORM log_action(
    'patch11_wipe',
    'students',
    NULL,
    'Patch 1.1 launch wipe (v3 — concede 10 pts iniciais)',
    jsonb_build_object(
      'processed',    v_processed,
      'already_done', v_skipped - v_processed,
      'refund_850',   v_refund_high,
      'refund_250',   v_refund_low,
      'starter_pts',  v_starter_pts,
      'invoked_at',   now()
    )
  );

  RETURN jsonb_build_object(
    'ok',           true,
    'processed',    v_processed,
    'refund_850',   v_refund_high,
    'refund_250',   v_refund_low,
    'starter_pts',  v_starter_pts
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
