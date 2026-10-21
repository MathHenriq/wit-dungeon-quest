-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: painel do professor, as ações que tiram coisas do banco (21/10).
--  * zerar o progresso do WIT 2 (conta de teste, ou recomeçar);
--  * apagar aluno (também quem tem personagem do WIT 1, cujas tabelas filhas
--    não têm cascata, e as partidas de PvP que o histórico do adversário cita);
--  * recusar cadastro (só quem espera; apaga como acima);
--  * as fotos saem junto com o aluno (cascata em wit2_photos).
-- Separada da _wit2_salvar_tudo.sql: o conector do Supabase pede confirmação
-- para SQL que remove linhas.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- fotos de quem já não existe (apagado por outro caminho antes desta) saem antes da ligação
DELETE FROM public.wit2_photos p WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = p.student_id);
ALTER TABLE public.wit2_photos
  ADD CONSTRAINT wit2_photos_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- zera o progresso do WIT 2 (conta de teste, ou recomeçar): a próxima abertura
-- começa com a coleção inicial. O perfil, os amigos e a guilda ficam.
CREATE OR REPLACE FUNCTION public.wit2_teacher_reset(p_student uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT wit2_teacher_can(p_student) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  DELETE FROM wit2_progress WHERE student_id = p_student;
  DELETE FROM wit2_wallet WHERE student_id = p_student;
  DELETE FROM wit2_cards WHERE student_id = p_student;
  DELETE FROM wit2_packs WHERE student_id = p_student;
  DELETE FROM wit2_tickets WHERE student_id = p_student;
  DELETE FROM wit2_house WHERE student_id = p_student;
  DELETE FROM wit2_photos WHERE student_id = p_student;
  PERFORM log_action_v2('wit2_teacher_reset', 'students', p_student, NULL, '{}'::jsonb, NULL, NULL);
  RETURN true;
END $$;

-- apaga o aluno. O login continua: ele pode se cadastrar de novo. O personagem
-- do WIT 1 sai antes (as tabelas filhas dele não têm cascata).
CREATE OR REPLACE FUNCTION public.wit2_teacher_delete(p_student uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid; v_name text; v_before jsonb;
BEGIN
  IF NOT wit2_teacher_can(p_student) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT s.user_id, coalesce(nullif(s.character_name, ''), s.name), to_jsonb(s.*) INTO v_user, v_name, v_before
    FROM students s WHERE s.id = p_student;
  IF v_user IS NOT NULL THEN
    DELETE FROM character_abilities WHERE character_id IN (SELECT id FROM characters WHERE user_id = v_user);
    DELETE FROM character_progress WHERE character_id IN (SELECT id FROM characters WHERE user_id = v_user);
    DELETE FROM character_inventory WHERE character_id IN (SELECT id FROM characters WHERE user_id = v_user);
    DELETE FROM battle_history WHERE character_id IN (SELECT id FROM characters WHERE user_id = v_user);
    DELETE FROM pvp_stats WHERE character_id IN (SELECT id FROM characters WHERE user_id = v_user);
    DELETE FROM pvp_rating_history WHERE character_id IN (SELECT id FROM characters WHERE user_id = v_user);
    DELETE FROM pvp_weekly_rewards WHERE character_id IN (SELECT id FROM characters WHERE user_id = v_user);
    DELETE FROM character_achievements WHERE character_id IN (SELECT id FROM characters WHERE user_id = v_user);
    DELETE FROM characters WHERE user_id = v_user;
  END IF;
  UPDATE pvp_matches SET winner_id = NULL WHERE winner_id = p_student;
  -- as partidas dele saem junto (cascata): o histórico de pontos do adversário deixa de apontar para elas
  UPDATE pvp_rating_history SET match_id = NULL
    WHERE match_id IN (SELECT id FROM pvp_matches WHERE challenger_id = p_student OR opponent_id = p_student);
  DELETE FROM students WHERE id = p_student;
  PERFORM log_action_v2('wit2_teacher_delete', 'students', p_student, v_name, jsonb_build_object('auth_user_id', v_user), v_before, NULL);
  RETURN true;
END $$;

-- recusar um cadastro: só os que esperam; apaga como acima
CREATE OR REPLACE FUNCTION public.wit2_teacher_reject(p_student uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT wit2_teacher_can(p_student) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM students WHERE id = p_student AND status = 'pending') THEN RETURN false; END IF;
  RETURN wit2_teacher_delete(p_student);
END $$;

-- ── permissões ────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.wit2_teacher_reset(uuid), public.wit2_teacher_delete(uuid), public.wit2_teacher_reject(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wit2_teacher_reset(uuid), public.wit2_teacher_delete(uuid), public.wit2_teacher_reject(uuid) TO authenticated;

COMMIT;
