-- ============================================================
-- WIT DUNGEON — ONDA 11.1
-- Schema: Sistema de Classes, Elementos, Skills e Evoluções
-- Migration: 20260518120000_wave11_class_element_skills_schema.sql
--
-- 6 novas tabelas + 6 RPCs (SECURITY DEFINER) + 1 trigger.
-- NÃO altera tabelas existentes (students, student_inventory, etc).
--
-- Referências canônicas (mantidas em src/lib/skills/):
--   - 12 classes:  guerreiro, arqueiro, mago, assassino, monge, paladino,
--                  curandeiro, invocador, samurai, bardo, lanceiro, alquimista
--   - 12 elementos: fire, water, grass, electric, ice, fighting,
--                   poison, ground, flying, ghost, steel, dark
--   - 6 atributos:  forca, destreza, inteligencia, carisma, agilidade, resistencia
--   - skill_id     formato '{element}_slot{N}'  (N = 1..13)
--   - evolution_id formato '{attribute}_{milestone}'  (milestone = 30|60|90)
-- ============================================================

-- ============================================================
-- 1) student_class_profile (1 linha por aluno)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_class_profile (
  student_id            UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  class_type            TEXT,
  primary_element       TEXT,
  secondary_element     TEXT,
  chose_class_at        TIMESTAMPTZ,
  is_veteran_onboarded  BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT student_class_profile_class_type_check
    CHECK (class_type IS NULL OR class_type IN (
      'guerreiro','arqueiro','mago','assassino','monge','paladino',
      'curandeiro','invocador','samurai','bardo','lanceiro','alquimista'
    )),
  CONSTRAINT student_class_profile_primary_element_check
    CHECK (primary_element IS NULL OR primary_element IN (
      'fire','water','grass','electric','ice','fighting',
      'poison','ground','flying','ghost','steel','dark'
    )),
  CONSTRAINT student_class_profile_secondary_element_check
    CHECK (secondary_element IS NULL OR secondary_element IN (
      'fire','water','grass','electric','ice','fighting',
      'poison','ground','flying','ghost','steel','dark'
    )),
  CONSTRAINT student_class_profile_distinct_elements
    CHECK (secondary_element IS NULL OR secondary_element <> primary_element)
);

COMMENT ON TABLE  public.student_class_profile IS
  'Perfil de classe/elemento do aluno (1:1 com students). class_type NULL = ainda não escolheu no onboarding.';
COMMENT ON COLUMN public.student_class_profile.class_type           IS 'Uma das 12 classes do skillsRegistry.';
COMMENT ON COLUMN public.student_class_profile.primary_element      IS 'Elemento principal (1 dos 12). Definido no onboarding, imutável.';
COMMENT ON COLUMN public.student_class_profile.secondary_element    IS 'Elemento secundário (desbloqueado após dominar um elemento). Trocável via swap_secondary_element.';
COMMENT ON COLUMN public.student_class_profile.is_veteran_onboarded IS 'true se aluno veterano (pré-Onda 11) já passou pelo fluxo retroativo.';

-- ============================================================
-- 2) student_attribute_points (1 linha por aluno)
--    Cumulativo: total de pontos investidos em cada atributo.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_attribute_points (
  student_id    UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  forca         INTEGER NOT NULL DEFAULT 0 CHECK (forca >= 0),
  destreza      INTEGER NOT NULL DEFAULT 0 CHECK (destreza >= 0),
  inteligencia  INTEGER NOT NULL DEFAULT 0 CHECK (inteligencia >= 0),
  carisma       INTEGER NOT NULL DEFAULT 0 CHECK (carisma >= 0),
  agilidade     INTEGER NOT NULL DEFAULT 0 CHECK (agilidade >= 0),
  resistencia   INTEGER NOT NULL DEFAULT 0 CHECK (resistencia >= 0)
);

COMMENT ON TABLE public.student_attribute_points IS
  'Total acumulado de pontos investidos em cada um dos 6 atributos (forca, destreza, inteligencia, carisma, agilidade, resistencia). Usado para checar marcos 30/60/90 de evoluções.';

-- ============================================================
-- 3) student_skill_points (pool único — fonte das skills e atributos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_skill_points (
  student_id        UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  available_points  INTEGER NOT NULL DEFAULT 0 CHECK (available_points >= 0),
  total_earned      INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0)
);

COMMENT ON TABLE public.student_skill_points IS
  'Pool de pontos do aluno. Gastos em unlock_skill (árvore de skills) ou spend_attribute_point (evoluções). available_points = saldo atual; total_earned = histórico acumulado.';

-- ============================================================
-- 4) student_unlocked_skills
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_unlocked_skills (
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_id      TEXT NOT NULL,
  unlocked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_student_unlocked_skills_student
  ON public.student_unlocked_skills (student_id);

COMMENT ON TABLE public.student_unlocked_skills IS
  'Skills desbloqueadas pelo aluno. skill_id segue o formato "{element}_slot{N}" (ex: fire_slot1).';

-- ============================================================
-- 5) student_unlocked_evolutions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_unlocked_evolutions (
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  evolution_id  TEXT NOT NULL,
  unlocked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, evolution_id)
);

CREATE INDEX IF NOT EXISTS idx_student_unlocked_evolutions_student
  ON public.student_unlocked_evolutions (student_id);

COMMENT ON TABLE public.student_unlocked_evolutions IS
  'Evoluções de atributo desbloqueadas. evolution_id segue o formato "{attribute}_{milestone}" (ex: forca_30, forca_60, forca_90).';

-- ============================================================
-- 6) element_mastery_log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.element_mastery_log (
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  element       TEXT NOT NULL,
  mastered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, element),
  CONSTRAINT element_mastery_log_element_check
    CHECK (element IN (
      'fire','water','grass','electric','ice','fighting',
      'poison','ground','flying','ghost','steel','dark'
    ))
);

CREATE INDEX IF NOT EXISTS idx_element_mastery_log_student
  ON public.element_mastery_log (student_id);

COMMENT ON TABLE public.element_mastery_log IS
  'Registro de elementos dominados (todos os 13 slots desbloqueados). Dominar um elemento libera o aluno a escolher um secondary_element.';

-- ============================================================
-- RLS — leitura pelo dono (aluno/professor), escrita só via RPC
-- ============================================================
ALTER TABLE public.student_class_profile         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attribute_points      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skill_points          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_unlocked_skills       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_unlocked_evolutions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.element_mastery_log           ENABLE ROW LEVEL SECURITY;

-- Policy genérica: aluno lê o próprio; professor lê os alunos dele.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'student_class_profile',
    'student_attribute_points',
    'student_skill_points',
    'student_unlocked_skills',
    'student_unlocked_evolutions',
    'element_mastery_log'
  ] LOOP
    EXECUTE format($f$
      DROP POLICY IF EXISTS "%1$s_select_owner_or_teacher" ON public.%1$I;
      CREATE POLICY "%1$s_select_owner_or_teacher"
        ON public.%1$I
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = %1$I.student_id
              AND (s.user_id = auth.uid() OR s.teacher_id = auth.uid())
          )
        );
    $f$, t);
  END LOOP;
END $$;

-- ============================================================
-- TRIGGER: ao criar student, criar linhas vazias nas tabelas de perfil
-- ============================================================
CREATE OR REPLACE FUNCTION public.bootstrap_student_class_system()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_class_profile (student_id) VALUES (NEW.id)
    ON CONFLICT (student_id) DO NOTHING;
  INSERT INTO public.student_attribute_points (student_id) VALUES (NEW.id)
    ON CONFLICT (student_id) DO NOTHING;
  INSERT INTO public.student_skill_points (student_id) VALUES (NEW.id)
    ON CONFLICT (student_id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.bootstrap_student_class_system() IS
  'Trigger AFTER INSERT em students: cria a linha vazia em student_class_profile (class_type=NULL), student_attribute_points e student_skill_points.';

DROP TRIGGER IF EXISTS trg_bootstrap_student_class_system ON public.students;
CREATE TRIGGER trg_bootstrap_student_class_system
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.bootstrap_student_class_system();

-- Backfill: garante que alunos já existentes têm as três linhas
INSERT INTO public.student_class_profile (student_id)
  SELECT id FROM public.students
  ON CONFLICT (student_id) DO NOTHING;

INSERT INTO public.student_attribute_points (student_id)
  SELECT id FROM public.students
  ON CONFLICT (student_id) DO NOTHING;

INSERT INTO public.student_skill_points (student_id)
  SELECT id FROM public.students
  ON CONFLICT (student_id) DO NOTHING;

-- ============================================================
-- RPC: choose_class_and_element
-- ============================================================
CREATE OR REPLACE FUNCTION public.choose_class_and_element(
  p_class           TEXT,
  p_primary_element TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_existing   TEXT;
BEGIN
  SELECT id INTO v_student_id
    FROM public.students
    WHERE user_id = auth.uid()
    LIMIT 1;

  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  IF p_class NOT IN (
    'guerreiro','arqueiro','mago','assassino','monge','paladino',
    'curandeiro','invocador','samurai','bardo','lanceiro','alquimista'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_class');
  END IF;

  IF p_primary_element NOT IN (
    'fire','water','grass','electric','ice','fighting',
    'poison','ground','flying','ghost','steel','dark'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_element');
  END IF;

  -- garante linha existente (caso trigger não tenha rodado em algum aluno legado)
  INSERT INTO public.student_class_profile (student_id) VALUES (v_student_id)
    ON CONFLICT (student_id) DO NOTHING;

  SELECT class_type INTO v_existing
    FROM public.student_class_profile WHERE student_id = v_student_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'class_already_chosen');
  END IF;

  UPDATE public.student_class_profile
     SET class_type      = p_class,
         primary_element = p_primary_element,
         chose_class_at  = now()
   WHERE student_id = v_student_id;

  -- pool inicial: 5 pontos
  INSERT INTO public.student_skill_points (student_id, available_points, total_earned)
       VALUES (v_student_id, 5, 5)
  ON CONFLICT (student_id) DO UPDATE
    SET available_points = public.student_skill_points.available_points + 5,
        total_earned     = public.student_skill_points.total_earned     + 5;

  RETURN jsonb_build_object(
    'success', true,
    'student_id', v_student_id,
    'class', p_class,
    'primary_element', p_primary_element,
    'starting_points', 5
  );
END;
$$;

COMMENT ON FUNCTION public.choose_class_and_element(TEXT, TEXT) IS
  'Onboarding: aluno escolhe classe + elemento primário (1 vez só). Concede 5 pontos iniciais. Falha se já escolheu.';
GRANT EXECUTE ON FUNCTION public.choose_class_and_element(TEXT, TEXT) TO authenticated;

-- ============================================================
-- RPC: award_skill_points
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_skill_points(
  p_student_id UUID,
  p_points     INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_available INTEGER;
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_points');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  INSERT INTO public.student_skill_points (student_id, available_points, total_earned)
       VALUES (p_student_id, p_points, p_points)
  ON CONFLICT (student_id) DO UPDATE
    SET available_points = public.student_skill_points.available_points + EXCLUDED.available_points,
        total_earned     = public.student_skill_points.total_earned     + EXCLUDED.total_earned
  RETURNING available_points INTO v_new_available;

  RETURN jsonb_build_object('success', true, 'available_points', v_new_available);
END;
$$;

COMMENT ON FUNCTION public.award_skill_points(UUID, INTEGER) IS
  'Concede N pontos ao aluno. Chamada típica: ao subir de nível.';
GRANT EXECUTE ON FUNCTION public.award_skill_points(UUID, INTEGER) TO authenticated;

-- ============================================================
-- RPC: unlock_skill
--   Valida custo e prerequisitos. Cliente passa os dois do skillsRegistry.
-- ============================================================
CREATE OR REPLACE FUNCTION public.unlock_skill(
  p_skill_id       TEXT,
  p_cost           INTEGER DEFAULT 1,
  p_prerequisites  TEXT[]  DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id      UUID;
  v_available       INTEGER;
  v_missing_prereq  TEXT;
BEGIN
  SELECT id INTO v_student_id
    FROM public.students WHERE user_id = auth.uid() LIMIT 1;
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  IF p_cost IS NULL OR p_cost <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_cost');
  END IF;

  -- já desbloqueada
  IF EXISTS (SELECT 1 FROM public.student_unlocked_skills
              WHERE student_id = v_student_id AND skill_id = p_skill_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_unlocked');
  END IF;

  -- prerequisitos
  IF p_prerequisites IS NOT NULL AND array_length(p_prerequisites, 1) > 0 THEN
    SELECT prereq INTO v_missing_prereq
      FROM unnest(p_prerequisites) AS prereq
     WHERE NOT EXISTS (
       SELECT 1 FROM public.student_unlocked_skills
        WHERE student_id = v_student_id AND skill_id = prereq
     )
     LIMIT 1;

    IF v_missing_prereq IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'prerequisite_missing',
        'missing', v_missing_prereq
      );
    END IF;
  END IF;

  -- pontos
  SELECT available_points INTO v_available
    FROM public.student_skill_points WHERE student_id = v_student_id;
  IF v_available IS NULL OR v_available < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_enough_points');
  END IF;

  UPDATE public.student_skill_points
     SET available_points = available_points - p_cost
   WHERE student_id = v_student_id;

  INSERT INTO public.student_unlocked_skills (student_id, skill_id)
       VALUES (v_student_id, p_skill_id);

  RETURN jsonb_build_object(
    'success', true,
    'skill_id', p_skill_id,
    'spent', p_cost,
    'available_points', v_available - p_cost
  );
END;
$$;

COMMENT ON FUNCTION public.unlock_skill(TEXT, INTEGER, TEXT[]) IS
  'Desbloqueia uma skill: valida pontos disponíveis e que todos os prerequisitos estão desbloqueados. Cliente passa cost e prerequisitos do skillsRegistry.';
GRANT EXECUTE ON FUNCTION public.unlock_skill(TEXT, INTEGER, TEXT[]) TO authenticated;

-- ============================================================
-- RPC: spend_attribute_point
--   Debita 1 ponto do pool, incrementa a contagem no atributo
--   e cria registros em student_unlocked_evolutions se cruzou 30/60/90.
-- ============================================================
CREATE OR REPLACE FUNCTION public.spend_attribute_point(
  p_attribute TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id  UUID;
  v_available   INTEGER;
  v_old_value   INTEGER;
  v_new_value   INTEGER;
  v_evos        TEXT[] := ARRAY[]::TEXT[];
  v_milestone   INTEGER;
BEGIN
  SELECT id INTO v_student_id
    FROM public.students WHERE user_id = auth.uid() LIMIT 1;
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  IF p_attribute NOT IN ('forca','destreza','inteligencia','carisma','agilidade','resistencia') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_attribute');
  END IF;

  SELECT available_points INTO v_available
    FROM public.student_skill_points WHERE student_id = v_student_id;
  IF v_available IS NULL OR v_available < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_enough_points');
  END IF;

  INSERT INTO public.student_attribute_points (student_id) VALUES (v_student_id)
    ON CONFLICT (student_id) DO NOTHING;

  EXECUTE format(
    'SELECT %I FROM public.student_attribute_points WHERE student_id = $1',
    p_attribute
  ) INTO v_old_value USING v_student_id;

  v_new_value := COALESCE(v_old_value, 0) + 1;

  EXECUTE format(
    'UPDATE public.student_attribute_points SET %I = %I + 1 WHERE student_id = $1',
    p_attribute, p_attribute
  ) USING v_student_id;

  UPDATE public.student_skill_points
     SET available_points = available_points - 1
   WHERE student_id = v_student_id;

  -- Marcos: insere apenas os recém-cruzados
  FOREACH v_milestone IN ARRAY ARRAY[30, 60, 90] LOOP
    IF v_old_value < v_milestone AND v_new_value >= v_milestone THEN
      INSERT INTO public.student_unlocked_evolutions (student_id, evolution_id)
           VALUES (v_student_id, p_attribute || '_' || v_milestone::text)
      ON CONFLICT (student_id, evolution_id) DO NOTHING;
      v_evos := v_evos || (p_attribute || '_' || v_milestone::text);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'attribute', p_attribute,
    'new_value', v_new_value,
    'available_points', v_available - 1,
    'unlocked_evolutions', to_jsonb(v_evos)
  );
END;
$$;

COMMENT ON FUNCTION public.spend_attribute_point(TEXT) IS
  'Gasta 1 ponto do pool no atributo informado e, se cruzou marco 30/60/90, registra a evolução correspondente em student_unlocked_evolutions.';
GRANT EXECUTE ON FUNCTION public.spend_attribute_point(TEXT) TO authenticated;

-- ============================================================
-- RPC: check_element_mastery
--   Para cada elemento em que o aluno tem todos os 13 slots,
--   insere uma linha em element_mastery_log (idempotente).
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
  v_element       TEXT;
  v_count         INTEGER;
  v_newly_mastered TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

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
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'newly_mastered', to_jsonb(v_newly_mastered)
  );
END;
$$;

COMMENT ON FUNCTION public.check_element_mastery(UUID) IS
  'Varre os 12 elementos. Para cada um em que o aluno desbloqueou todos os 13 slots, registra em element_mastery_log (libera elegibilidade de secondary_element). Idempotente.';
GRANT EXECUTE ON FUNCTION public.check_element_mastery(UUID) TO authenticated;

-- ============================================================
-- RPC: swap_secondary_element
--   Permite ao aluno definir/trocar o elemento secundário.
--   Regras: máx 2 ativos (primary + secondary), secundário precisa ter sido dominado,
--   não pode coincidir com o primário.
-- ============================================================
CREATE OR REPLACE FUNCTION public.swap_secondary_element(
  p_new_element    TEXT,
  p_remove_element TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id     UUID;
  v_primary        TEXT;
  v_current_sec    TEXT;
BEGIN
  SELECT id INTO v_student_id
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

  SELECT primary_element, secondary_element
    INTO v_primary, v_current_sec
    FROM public.student_class_profile WHERE student_id = v_student_id;

  IF v_primary IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'class_not_chosen');
  END IF;

  IF p_new_element = v_primary THEN
    RETURN jsonb_build_object('success', false, 'error', 'new_equals_primary');
  END IF;

  -- secundário precisa ter sido dominado
  IF NOT EXISTS (
    SELECT 1 FROM public.element_mastery_log
     WHERE student_id = v_student_id AND element = p_new_element
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'element_not_mastered');
  END IF;

  -- Se p_remove_element foi passado, precisa bater com o secundário atual
  IF p_remove_element IS NOT NULL
     AND v_current_sec IS NOT NULL
     AND p_remove_element <> v_current_sec THEN
    RETURN jsonb_build_object('success', false, 'error', 'remove_mismatch');
  END IF;

  UPDATE public.student_class_profile
     SET secondary_element = p_new_element
   WHERE student_id = v_student_id;

  RETURN jsonb_build_object(
    'success', true,
    'primary_element', v_primary,
    'secondary_element', p_new_element,
    'previous_secondary', v_current_sec
  );
END;
$$;

COMMENT ON FUNCTION public.swap_secondary_element(TEXT, TEXT) IS
  'Define/troca o elemento secundário do aluno. Exige que o novo elemento esteja em element_mastery_log e seja diferente do primário. p_remove_element opcional valida qual secundário está sendo substituído (UX safety).';
GRANT EXECUTE ON FUNCTION public.swap_secondary_element(TEXT, TEXT) TO authenticated;
