-- ============================================================
-- WIT DUNGEON — ONDA 11.9
-- RPCs administrativas para gerenciamento de classes da Season 2.
--
-- Padrão dos demais master_*: SECURITY DEFINER, is_caller_admin()
-- como guard, log_action_v2() para auditoria.
--
-- Migration: 20260519150000_wave11_master_class_admin.sql
-- ============================================================

-- ============================================================
-- RPC: master_reset_class(student_id)
--   * Apaga student_class_profile (mantém linha, zera campos)
--   * Apaga student_unlocked_skills (TODOS elementos)
--   * Restaura available_points = total_earned (re-investível)
--   * Apaga element_mastery_log (perdeu a mestria do reset)
--   * MANTÉM: student_attribute_points, student_unlocked_evolutions
--   * Próximo login do aluno → cai no Wave11ClassSelectionScreen
-- ============================================================
CREATE OR REPLACE FUNCTION public.master_reset_class(
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_name   TEXT;
  v_before         JSONB;
  v_after          JSONB;
  v_removed_skills INTEGER;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;

  SELECT name INTO v_student_name FROM public.students WHERE id = p_student_id;
  IF v_student_name IS NULL THEN
    RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002';
  END IF;

  -- Snapshot before
  SELECT jsonb_build_object(
    'class_type',        scp.class_type,
    'primary_element',   scp.primary_element,
    'secondary_element', scp.secondary_element,
    'unlocked_skills',   (SELECT count(*) FROM public.student_unlocked_skills WHERE student_id = p_student_id),
    'available_points',  ssp.available_points,
    'total_earned',      ssp.total_earned
  )
  INTO v_before
  FROM public.student_class_profile scp
  LEFT JOIN public.student_skill_points ssp ON ssp.student_id = scp.student_id
  WHERE scp.student_id = p_student_id;

  -- Zera o class_profile (mantém a linha pra trigger não recriar)
  UPDATE public.student_class_profile
     SET class_type             = NULL,
         primary_element        = NULL,
         secondary_element      = NULL,
         chose_class_at         = NULL,
         is_veteran_onboarded   = false,
         last_element_reset_at  = NULL
   WHERE student_id = p_student_id;

  -- Apaga skills
  WITH d AS (
    DELETE FROM public.student_unlocked_skills WHERE student_id = p_student_id RETURNING 1
  )
  SELECT count(*) INTO v_removed_skills FROM d;

  -- Apaga mestria
  DELETE FROM public.element_mastery_log WHERE student_id = p_student_id;

  -- Pool: available = total_earned (refund total dos pontos investidos em skill)
  UPDATE public.student_skill_points
     SET available_points = total_earned
   WHERE student_id = p_student_id;

  -- Snapshot after
  SELECT jsonb_build_object(
    'class_type',        NULL,
    'primary_element',   NULL,
    'secondary_element', NULL,
    'unlocked_skills',   0,
    'available_points',  ssp.available_points,
    'total_earned',      ssp.total_earned
  )
  INTO v_after
  FROM public.student_skill_points ssp
  WHERE ssp.student_id = p_student_id;

  PERFORM public.log_action_v2(
    'master_reset_class', 'students', p_student_id, v_student_name,
    jsonb_build_object('removed_skills', v_removed_skills),
    v_before, v_after
  );

  RETURN jsonb_build_object(
    'success',         true,
    'student_id',      p_student_id,
    'removed_skills',  v_removed_skills
  );
END;
$$;

COMMENT ON FUNCTION public.master_reset_class(UUID) IS
  'Reset administrativo de classe: zera class_type/element no perfil, apaga skills e mestria, restaura available_points = total_earned. MANTÉM atributos e evoluções. Master-only.';

GRANT EXECUTE ON FUNCTION public.master_reset_class(UUID) TO authenticated;

-- ============================================================
-- RPC: master_grant_skill_points(student_id, points)
--   Adiciona N pontos no pool do aluno (compensação manual).
--   Aceita p_points negativo para descontar (mas trata como erro
--   se ficar < 0).
-- ============================================================
CREATE OR REPLACE FUNCTION public.master_grant_skill_points(
  p_student_id UUID,
  p_points     INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_name TEXT;
  v_new_avail    INTEGER;
  v_new_total    INTEGER;
  v_before       JSONB;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING ERRCODE = '42501';
  END IF;
  IF p_points = 0 THEN
    RAISE EXCEPTION 'amount must be non-zero' USING ERRCODE = '22023';
  END IF;

  SELECT name INTO v_student_name FROM public.students WHERE id = p_student_id;
  IF v_student_name IS NULL THEN
    RAISE EXCEPTION 'student not found' USING ERRCODE = 'P0002';
  END IF;

  -- garante a linha
  INSERT INTO public.student_skill_points (student_id) VALUES (p_student_id)
    ON CONFLICT (student_id) DO NOTHING;

  SELECT jsonb_build_object('available_points', available_points, 'total_earned', total_earned)
    INTO v_before
    FROM public.student_skill_points WHERE student_id = p_student_id;

  UPDATE public.student_skill_points
     SET available_points = GREATEST(0, available_points + p_points),
         total_earned     = GREATEST(0, total_earned     + GREATEST(0, p_points))
   WHERE student_id = p_student_id
   RETURNING available_points, total_earned INTO v_new_avail, v_new_total;

  PERFORM public.log_action_v2(
    'master_grant_skill_points', 'student_skill_points', p_student_id, v_student_name,
    jsonb_build_object('amount', p_points, 'new_available', v_new_avail, 'new_total', v_new_total),
    v_before,
    jsonb_build_object('available_points', v_new_avail, 'total_earned', v_new_total)
  );

  RETURN jsonb_build_object(
    'success', true,
    'available_points', v_new_avail,
    'total_earned',     v_new_total
  );
END;
$$;

COMMENT ON FUNCTION public.master_grant_skill_points(UUID, INTEGER) IS
  'Concede ou desconta pontos de skill manualmente (master-only). Quando p_points > 0, também incrementa total_earned. Quando negativo, só desconta available (não mexe em total). Auditado em action_log_v2.';

GRANT EXECUTE ON FUNCTION public.master_grant_skill_points(UUID, INTEGER) TO authenticated;

-- ============================================================
-- View auxiliar: master_wave11_classes_view
--   Tabela achatada para o painel administrativo. Lista aluno +
--   class_profile + pool + total investido por elemento.
-- ============================================================
CREATE OR REPLACE VIEW public.master_wave11_classes_view AS
SELECT
  s.id                              AS student_id,
  s.name                            AS student_name,
  s.class_id                        AS class_id,
  c.name                            AS class_name,
  scp.class_type                    AS wave11_class,
  scp.primary_element               AS primary_element,
  scp.secondary_element             AS secondary_element,
  scp.chose_class_at                AS chose_class_at,
  COALESCE(ssp.available_points, 0) AS available_points,
  COALESCE(ssp.total_earned,     0) AS total_earned,
  (SELECT count(*) FROM public.student_unlocked_skills sus WHERE sus.student_id = s.id) AS skills_unlocked,
  (SELECT count(*) FROM public.element_mastery_log eml    WHERE eml.student_id = s.id) AS elements_mastered
FROM public.students s
LEFT JOIN public.classes c                ON c.id  = s.class_id
LEFT JOIN public.student_class_profile scp ON scp.student_id = s.id
LEFT JOIN public.student_skill_points  ssp ON ssp.student_id = s.id;

COMMENT ON VIEW public.master_wave11_classes_view IS
  'Achata aluno + perfil de classe da Season 2 + pool + contagens. Usada na aba Classes do painel master.';

GRANT SELECT ON public.master_wave11_classes_view TO authenticated;
