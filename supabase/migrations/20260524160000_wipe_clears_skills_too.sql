-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: O wipe original só limpava student_inventory.
-- Mas o aluno ainda ficava com:
--   - character_abilities  (slots equipados apontando pra abilities antigas)
--   - student_unlocked_skills (nós de árvore Wave11 desbloqueados antes)
--   - student_skill_progress (pontos gastos por elemento)
--   - student_skill_points   (pontos disponíveis acumulados)
--
-- Resultado: depois do wipe, slots vazios mostravam abilities órfãs, e
-- abilities elétricas antigas ficavam visíveis pro aluno que escolheu Dark.
--
-- Esta migration sobreescreve apply_patch11_wipe() pra fazer o reset
-- completo. Idempotente igual à versão anterior (já checa wiped_at_patch_1_1).
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
BEGIN
  -- Gate: admin-only.
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

    -- 2. Skill tree Wave11 (nós desbloqueados + pontos por elemento + pool)
    DELETE FROM student_unlocked_skills WHERE student_id = v_rec.id;
    DELETE FROM student_skill_progress  WHERE student_id = v_rec.id;
    DELETE FROM student_skill_points    WHERE student_id = v_rec.id;

    -- 3. Abilities equipadas — character_abilities é por character, não por student.
    --    Pega TODOS os characters do aluno (pode ter mais de um).
    FOR v_char_id IN SELECT id FROM characters WHERE user_id = (SELECT user_id FROM students WHERE id = v_rec.id) LOOP
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
    'Patch 1.1 launch wipe (v2 — limpa skills/abilities equipadas)',
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

NOTIFY pgrst, 'reload schema';
