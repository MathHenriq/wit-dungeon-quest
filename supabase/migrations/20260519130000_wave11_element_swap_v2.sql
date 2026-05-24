-- ============================================================
-- WIT DUNGEON — ONDA 11.7
-- 1) Estende check_element_mastery: cria pending_reward + action_log
-- 2) Reescreve swap_secondary_element com refund integral + slot
--    flexível (substitui primário OU secundário) + auditoria.
--
-- Migration: 20260519130000_wave11_element_swap_v2.sql
-- ============================================================

-- ============================================================
-- check_element_mastery V2
-- Mesmo comportamento da V1 (Onda 11.1) mas agora, pra cada
-- elemento recém-dominado:
--   * insere uma linha em student_pending_rewards (kind='element_mastered')
--   * loga em action_log
-- Idempotente: se já existe entrada de mastery não dispara de novo.
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_element_mastery(
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_element        TEXT;
  v_count          INTEGER;
  v_newly_mastered TEXT[] := ARRAY[]::TEXT[];
  v_student_name   TEXT;
  v_user_id        UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  SELECT name, user_id INTO v_student_name, v_user_id
    FROM public.students WHERE id = p_student_id;

  FOREACH v_element IN ARRAY ARRAY[
    'fire','water','grass','electric','ice','fighting',
    'poison','ground','flying','ghost','steel','dark'
  ] LOOP
    SELECT count(*) INTO v_count
      FROM public.student_unlocked_skills
     WHERE student_id = p_student_id
       AND skill_id LIKE v_element || '_slot%';

    IF v_count >= 13 AND NOT EXISTS (
      SELECT 1 FROM public.element_mastery_log
       WHERE student_id = p_student_id AND element = v_element
    ) THEN
      INSERT INTO public.element_mastery_log (student_id, element)
        VALUES (p_student_id, v_element);
      v_newly_mastered := v_newly_mastered || v_element;

      -- pending reward / notificação
      INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
        VALUES (
          p_student_id,
          'element_mastered',
          'Elemento Dominado: ' || initcap(v_element),
          'Você desbloqueou todos os 13 slots de ' || initcap(v_element) || '. Um novo elemento pode ser escolhido.',
          jsonb_build_object('element', v_element)
        );

      -- audit log
      INSERT INTO public.action_log
        (actor_user_id, actor_role, actor_name, action, target_table, target_id, target_label, payload)
      VALUES
        (v_user_id, 'student', v_student_name,
         'element_mastered', 'element_mastery_log', p_student_id,
         initcap(v_element),
         jsonb_build_object('element', v_element));
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'newly_mastered', to_jsonb(v_newly_mastered)
  );
END;
$$;

COMMENT ON FUNCTION public.check_element_mastery(UUID) IS
  'V2: além de marcar mastery, cria entrada em student_pending_rewards (kind=element_mastered) e action_log a cada elemento recém-dominado. Idempotente.';

GRANT EXECUTE ON FUNCTION public.check_element_mastery(UUID) TO authenticated;

-- ============================================================
-- swap_secondary_element V2
--
-- Renomeada conceitualmente para "swap_element" (mantém o nome
-- antigo por compatibilidade). Nova assinatura:
--
--   swap_secondary_element(p_new_element, p_remove_element, p_refund)
--
-- Comportamento:
--   * Aluno precisa ter primary_element setado (onboarding feito).
--   * p_new_element precisa estar dominado (element_mastery_log).
--   * p_new_element não pode ser igual a primary/secondary atuais.
--   * Se p_remove_element é NULL → atribui ao slot vago (define secondary
--     se não tem; falha se ambos preenchidos).
--   * Se p_remove_element está preenchido → precisa bater com o slot
--     que tem aquele valor (primário OU secundário). DELETE de todas
--     as skills do elemento removido + credit p_refund (100%) +
--     remove mastery (aluno precisa re-dominar se quiser de volta).
--   * Atualiza primary_element ou secondary_element conforme o slot.
--   * Loga em action_log.
--
-- Drop da V1 antes para evitar coexistência de assinaturas.
-- ============================================================
DROP FUNCTION IF EXISTS public.swap_secondary_element(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.swap_secondary_element(
  p_new_element    TEXT,
  p_remove_element TEXT    DEFAULT NULL,
  p_refund         INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id    UUID;
  v_student_name  TEXT;
  v_user_id       UUID;
  v_profile       public.student_class_profile%ROWTYPE;
  v_target_slot   TEXT;            -- 'primary' | 'secondary'
  v_removed_count INTEGER := 0;
  v_credited      INTEGER := 0;
BEGIN
  SELECT id, name, user_id INTO v_student_id, v_student_name, v_user_id
    FROM public.students WHERE user_id = auth.uid() LIMIT 1;
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  IF p_new_element NOT IN (
    'fire','water','grass','electric','ice','fighting',
    'poison','ground','flying','ghost','steel','dark'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_element');
  END IF;

  SELECT * INTO v_profile
    FROM public.student_class_profile WHERE student_id = v_student_id;

  IF v_profile.primary_element IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'class_not_chosen');
  END IF;

  -- novo precisa estar dominado
  IF NOT EXISTS (
    SELECT 1 FROM public.element_mastery_log
     WHERE student_id = v_student_id AND element = p_new_element
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'element_not_mastered');
  END IF;

  -- novo não pode ser igual a um já ativo
  IF p_new_element IN (v_profile.primary_element, COALESCE(v_profile.secondary_element, '')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'new_already_active');
  END IF;

  -- Caso A: NÃO remove ninguém (secundário vago)
  IF p_remove_element IS NULL THEN
    IF v_profile.secondary_element IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'remove_required',
                                'message', 'Slot secundário ocupado; informe p_remove_element.');
    END IF;
    UPDATE public.student_class_profile
       SET secondary_element = p_new_element
     WHERE student_id = v_student_id;

    INSERT INTO public.action_log
      (actor_user_id, actor_role, actor_name, action, target_table, target_id, target_label, payload, before_state, after_state)
    VALUES
      (v_user_id, 'student', v_student_name, 'element_secondary_added',
       'student_class_profile', v_student_id, initcap(p_new_element),
       jsonb_build_object('new', p_new_element),
       jsonb_build_object('primary', v_profile.primary_element, 'secondary', v_profile.secondary_element),
       jsonb_build_object('primary', v_profile.primary_element, 'secondary', p_new_element));

    RETURN jsonb_build_object(
      'success', true,
      'mode', 'add_secondary',
      'primary_element', v_profile.primary_element,
      'secondary_element', p_new_element,
      'refund', 0
    );
  END IF;

  -- Caso B: substitui um elemento existente
  IF p_remove_element = v_profile.primary_element THEN
    v_target_slot := 'primary';
  ELSIF p_remove_element = COALESCE(v_profile.secondary_element, '') THEN
    v_target_slot := 'secondary';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'remove_not_active',
                              'message', 'p_remove_element não é o primário nem o secundário atual.');
  END IF;

  -- Apaga skills do elemento removido
  WITH deleted AS (
    DELETE FROM public.student_unlocked_skills
     WHERE student_id = v_student_id
       AND skill_id LIKE p_remove_element || '_slot%'
    RETURNING 1
  )
  SELECT count(*) INTO v_removed_count FROM deleted;

  -- Remove mastery do elemento abandonado (aluno precisará re-dominar)
  DELETE FROM public.element_mastery_log
   WHERE student_id = v_student_id AND element = p_remove_element;

  -- Credita refund (100% — cliente passa o total exato do registry)
  v_credited := GREATEST(0, COALESCE(p_refund, 0));
  IF v_credited > 0 THEN
    UPDATE public.student_skill_points
       SET available_points = available_points + v_credited
     WHERE student_id = v_student_id;
  END IF;

  -- Troca o slot
  IF v_target_slot = 'primary' THEN
    UPDATE public.student_class_profile
       SET primary_element = p_new_element
     WHERE student_id = v_student_id;
  ELSE
    UPDATE public.student_class_profile
       SET secondary_element = p_new_element
     WHERE student_id = v_student_id;
  END IF;

  INSERT INTO public.action_log
    (actor_user_id, actor_role, actor_name, action, target_table, target_id, target_label, payload, before_state, after_state)
  VALUES
    (v_user_id, 'student', v_student_name,
     'element_swapped_' || v_target_slot,
     'student_class_profile', v_student_id,
     initcap(p_remove_element) || ' → ' || initcap(p_new_element),
     jsonb_build_object('new', p_new_element, 'removed', p_remove_element, 'refund', v_credited, 'skills_removed', v_removed_count),
     jsonb_build_object('primary', v_profile.primary_element, 'secondary', v_profile.secondary_element),
     CASE
       WHEN v_target_slot = 'primary' THEN jsonb_build_object('primary', p_new_element,           'secondary', v_profile.secondary_element)
       ELSE                                jsonb_build_object('primary', v_profile.primary_element, 'secondary', p_new_element)
     END);

  RETURN jsonb_build_object(
    'success',           true,
    'mode',              'swap',
    'slot',              v_target_slot,
    'primary_element',   CASE WHEN v_target_slot = 'primary' THEN p_new_element ELSE v_profile.primary_element END,
    'secondary_element', CASE WHEN v_target_slot = 'secondary' THEN p_new_element ELSE v_profile.secondary_element END,
    'removed',           p_remove_element,
    'skills_removed',    v_removed_count,
    'refund',            v_credited
  );
END;
$$;

COMMENT ON FUNCTION public.swap_secondary_element(TEXT, TEXT, INTEGER) IS
  'V2 (Onda 11.7): unifica adição/substituição de elemento (primário OU secundário). Apaga skills do elemento abandonado, credita refund integral (cliente calcula via skillsRegistry), atualiza slot, loga em action_log.';

GRANT EXECUTE ON FUNCTION public.swap_secondary_element(TEXT, TEXT, INTEGER) TO authenticated;
