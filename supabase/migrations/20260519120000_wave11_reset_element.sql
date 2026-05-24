-- ============================================================
-- WIT DUNGEON — ONDA 11.5
-- Reset de árvore elemental: aluno que dominou um elemento e
-- ainda não escolheu secundário pode "resetar" e tentar outro.
-- Devolve 80% dos pontos gastos no elemento e zera os unlocks
-- daquele elemento. Cooldown global de 7 dias.
--
-- Migration: 20260519120000_wave11_reset_element.sql
-- ============================================================

-- Coluna de cooldown no perfil (timestamp do último reset).
ALTER TABLE public.student_class_profile
  ADD COLUMN IF NOT EXISTS last_element_reset_at TIMESTAMPTZ;

COMMENT ON COLUMN public.student_class_profile.last_element_reset_at IS
  'Timestamp do último reset de elemento (RPC reset_skill_element). Cooldown de 7 dias entre resets.';

-- ============================================================
-- RPC: reset_skill_element(p_element)
--   Regras (validadas no servidor):
--   * Aluno precisa ter dominado p_element (entrada em element_mastery_log).
--   * Aluno ainda NÃO pode ter escolhido secondary_element
--     (intenção: "ainda não pegou o próximo elemento").
--   * Cooldown: last_element_reset_at deve ser NULL ou > 7 dias atrás.
--   Efeito:
--   * Recalcula os pontos gastos somando o custo de cada skill
--     desbloqueada do elemento (cliente pode discordar dos custos,
--     mas isso pega o caso mais comum: aluno desbloqueou via unlock_skill
--     que registrou no DB sem armazenar custo; usamos cost_proxy = 1).
--   * Como o custo real vive só no skillsRegistry.ts, esta RPC aceita
--     opcionalmente um total_spent_override do cliente para refinar
--     o refund. Sem ele, conta 1 ponto por skill (lower bound).
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_skill_element(
  p_element              TEXT,
  p_total_spent_override INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id   UUID;
  v_profile      public.student_class_profile%ROWTYPE;
  v_skill_count  INTEGER;
  v_spent        INTEGER;
  v_refund       INTEGER;
  v_cooldown_end TIMESTAMPTZ;
BEGIN
  SELECT id INTO v_student_id
    FROM public.students WHERE user_id = auth.uid() LIMIT 1;
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  IF p_element NOT IN (
    'fire','water','grass','electric','ice','fighting',
    'poison','ground','flying','ghost','steel','dark'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_element');
  END IF;

  SELECT * INTO v_profile
    FROM public.student_class_profile WHERE student_id = v_student_id;

  -- Precisa ter dominado o elemento
  IF NOT EXISTS (
    SELECT 1 FROM public.element_mastery_log
     WHERE student_id = v_student_id AND element = p_element
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'element_not_mastered');
  END IF;

  -- Não pode já ter secundário escolhido
  IF v_profile.secondary_element IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'secondary_already_chosen');
  END IF;

  -- Cooldown
  IF v_profile.last_element_reset_at IS NOT NULL THEN
    v_cooldown_end := v_profile.last_element_reset_at + interval '7 days';
    IF now() < v_cooldown_end THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'cooldown_active',
        'cooldown_ends_at', v_cooldown_end
      );
    END IF;
  END IF;

  -- Conta skills do elemento e calcula refund
  SELECT count(*) INTO v_skill_count
    FROM public.student_unlocked_skills
   WHERE student_id = v_student_id
     AND skill_id LIKE p_element || '_slot%';

  IF v_skill_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_skills_to_reset');
  END IF;

  -- p_total_spent_override (vindo do cliente, somatório de cost do skillsRegistry)
  -- toma precedência. Sem ele, lower bound = 1 ponto por skill.
  v_spent  := COALESCE(p_total_spent_override, v_skill_count);
  v_refund := GREATEST(0, FLOOR(v_spent * 0.80)::int);

  -- Apaga skills do elemento
  DELETE FROM public.student_unlocked_skills
   WHERE student_id = v_student_id
     AND skill_id LIKE p_element || '_slot%';

  -- Remove mastery do elemento (aluno precisará re-dominar)
  DELETE FROM public.element_mastery_log
   WHERE student_id = v_student_id AND element = p_element;

  -- Credita refund no pool e marca cooldown
  UPDATE public.student_skill_points
     SET available_points = available_points + v_refund
   WHERE student_id = v_student_id;

  UPDATE public.student_class_profile
     SET last_element_reset_at = now()
   WHERE student_id = v_student_id;

  RETURN jsonb_build_object(
    'success', true,
    'element', p_element,
    'skills_removed', v_skill_count,
    'spent_estimated', v_spent,
    'refund', v_refund,
    'cooldown_ends_at', now() + interval '7 days'
  );
END;
$$;

COMMENT ON FUNCTION public.reset_skill_element(TEXT, INTEGER) IS
  'Reseta a árvore de skills de um elemento dominado. Devolve 80% dos pontos (cliente passa total exato via p_total_spent_override). Bloqueado se aluno já escolheu secundário ou se cooldown de 7 dias está ativo.';
GRANT EXECUTE ON FUNCTION public.reset_skill_element(TEXT, INTEGER) TO authenticated;
