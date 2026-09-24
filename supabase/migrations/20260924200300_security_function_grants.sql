-- ============================================================================
-- Segurança — 4/5: funções (RPC)
--
-- Antes: 176 funções SECURITY DEFINER executáveis por `anon` via
-- /rest/v1/rpc/*, e ~60 delas sem checar quem chama. Exemplos reais:
--   * admin_delete_student_as(p_student_id, p_caller_user_id) confiava no
--     "quem sou eu" enviado pelo próprio cliente — com o UUID do admin (que
--     estava no HANDOFF.md) qualquer pessoa apagava qualquer aluno, sem login;
--   * teacher_reset_skill_points, admin_assign_student_to_class,
--     give_boss_rewards, complete_daily_dungeon, purchase_item... aceitavam
--     qualquer p_student_id;
--   * execute_trade aceitava a troca de qualquer pessoa;
--   * rankings, feed e cartão de perfil caíam no nome real
--     (COALESCE(character_name, name)).
--
-- Agora:
--   1. nenhuma função do schema public é executável por `anon`/PUBLIC;
--   2. funções internas (jobs, triggers, helpers) só pelo servidor;
--   3. funções chamáveis pelo app checam se quem chama pode agir sobre o
--      aluno/professor/troca informado;
--   4. nada devolve nome real para outros alunos;
--   5. search_path fixo em todas as funções.
-- ============================================================================

BEGIN;

-- ─── Helpers de autorização ─────────────────────────────────────────────────

-- Contexto de servidor: service_role (Edge Functions) ou sem JWT (pg_cron,
-- chamadas internas como dono). Nunca verdadeiro para o app.
CREATE OR REPLACE FUNCTION public.is_server_context()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(auth.role(), '') NOT IN ('anon', 'authenticated')
$$;

CREATE OR REPLACE FUNCTION public.can_act_for_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_server_context()
      OR EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id AND user_id = auth.uid())
      OR public.is_teacher_of_student(p_student_id)
      OR public.is_caller_admin()
$$;

CREATE OR REPLACE FUNCTION public.can_act_for_teacher(p_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_server_context()
      OR p_teacher_id = public.get_teacher_id()
      OR public.is_caller_admin()
$$;

-- Injeta uma checagem logo após o BEGIN de uma função plpgsql existente.
-- Idempotente (marca "-- authz-guard"). Falha alto se não achar o BEGIN.
CREATE OR REPLACE FUNCTION pg_temp.add_guard(p_fn regprocedure, p_guard text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  d   text := pg_get_functiondef(p_fn);
  pos int;
BEGIN
  IF strpos(d, '-- authz-guard') > 0 THEN RETURN; END IF;
  pos := regexp_instr(d, '\n[ \t]*BEGIN[ \t]*\n', strpos(d, '$function$'), 1, 1);
  IF pos = 0 THEN
    RAISE EXCEPTION 'add_guard: BEGIN not found in %', p_fn;
  END IF;
  EXECUTE substr(d, 1, pos - 1) || '  -- authz-guard' || E'\n  ' || p_guard || E'\n' || substr(d, pos);
END;
$$;

-- Troca um trecho exato no corpo de uma função. Falha se o trecho não existir.
CREATE OR REPLACE FUNCTION pg_temp.patch_fn(p_fn regprocedure, p_from text, p_to text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  d text := pg_get_functiondef(p_fn);
BEGIN
  IF strpos(d, p_from) = 0 THEN
    RAISE EXCEPTION 'patch_fn: pattern not found in %: %', p_fn, p_from;
  END IF;
  EXECUTE replace(d, p_from, p_to);
END;
$$;

-- ─── 1. anon e PUBLIC não executam nada ─────────────────────────────────────

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT  EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

-- ─── 2. Funções internas: só servidor ───────────────────────────────────────

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (
        p.prorettype = 'trigger'::regtype
        OR p.proname LIKE '\_%'
        OR p.proname IN (
          'admin_delete_student_as', 'admin_delete_teacher_as',
          'assign_daily_quests_for', 'assign_daily_quests_tick',
          'award_skill_points', 'add_class_war_points',
          'check_all_title_conditions', 'check_title_conditions_for',
          'chest_ping', 'list_open_chest_funcs',
          'compute_weekly_rankings', 'distribute_weekly_rewards', 'distribute_raid_rewards',
          'event_lifecycle_tick', 'expire_raids_tick', 'spawn_monthly_raids',
          'spawn_event_boss_raids', 'open_event_vault_for', 'open_event_vault_for_all',
          'grant_top1_creation_tickets', 'issue_top1_card_tickets',
          'rls_auto_enable', 'get_student_teacher_id', 'student_belongs_to_teacher',
          'apply_patch11_wipe', 'gen_group_code', 'is_server_context'
        )
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
  END LOOP;
END $$;

-- ─── 3. Checagem de quem chama ──────────────────────────────────────────────

-- Agem sobre um aluno: só o próprio, o professor dele, o admin ou o servidor.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('apply_battle_drops', 'apply_battle_materials', 'complete_daily_dungeon',
                        'complete_skill_node', 'craft_item', 'give_boss_rewards', 'give_pet_xp',
                        'purchase_item', 'check_element_mastery', 'update_student_difficulty',
                        'get_student_dna')
  LOOP
    PERFORM pg_temp.add_guard(r.sig,
      'IF NOT public.can_act_for_student(p_student_id) THEN RAISE EXCEPTION ''forbidden'' USING ERRCODE = ''42501''; END IF;');
  END LOOP;
END $$;

-- Painéis do professor: só os dados do próprio professor (ou admin).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_analytics_overview', 'get_class_comparison', 'get_daily_activity',
                        'get_engagement_heatmap', 'get_student_risk_scores', 'create_mentorship')
  LOOP
    PERFORM pg_temp.add_guard(r.sig,
      'IF NOT public.can_act_for_teacher(p_teacher_id) THEN RAISE EXCEPTION ''forbidden'' USING ERRCODE = ''42501''; END IF;');
  END LOOP;
END $$;

SELECT pg_temp.add_guard('public.teacher_reset_skill_points(uuid)'::regprocedure,
  'IF NOT (public.is_server_context() OR public.is_caller_admin() OR EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = p_student_user_id AND public.is_teacher_of_student(s.id))) THEN RAISE EXCEPTION ''forbidden'' USING ERRCODE = ''42501''; END IF;');

SELECT pg_temp.add_guard('public.admin_assign_student_to_class(uuid, uuid)'::regprocedure,
  'IF NOT (public.is_server_context() OR public.is_caller_admin()) THEN RAISE EXCEPTION ''forbidden'' USING ERRCODE = ''42501''; END IF;');

-- Aceitar troca: só quem recebeu a proposta.
SELECT pg_temp.add_guard('public.execute_trade(uuid)'::regprocedure,
  'IF NOT (public.is_server_context() OR EXISTS (SELECT 1 FROM public.trades t WHERE t.id = p_trade_id AND t.receiver_id = public.my_student_id())) THEN RAISE EXCEPTION ''forbidden'' USING ERRCODE = ''42501''; END IF;');

SELECT pg_temp.add_guard('public.finalize_class_war(uuid)'::regprocedure,
  'IF NOT (public.is_server_context() OR public.is_caller_admin() OR EXISTS (SELECT 1 FROM public.class_wars w WHERE w.id = p_war_id AND w.teacher_id = public.get_teacher_id())) THEN RAISE EXCEPTION ''forbidden'' USING ERRCODE = ''42501''; END IF;');

-- ─── 4. Nunca devolver nome real para outros alunos ─────────────────────────

-- Estas duas eram SECURITY INVOKER e liam `students` direto. Com o RLS novo
-- (aluno só vê a própria linha) a pontuação de guilda e a lista de dano da
-- raid ficariam erradas. Como dono, elas agregam todos os membros — e só
-- devolvem número e nickname (patch abaixo).
ALTER FUNCTION public.calculate_guild_score(uuid) SECURITY DEFINER;
ALTER FUNCTION public.get_active_raid_for_guild(uuid) SECURITY DEFINER;

SELECT pg_temp.patch_fn('public.get_active_raid_for_guild(uuid)'::regprocedure,
  'COALESCE(s.character_name, s.name)', 'COALESCE(NULLIF(btrim(s.character_name), ''''), ''Aventureiro'')');

SELECT pg_temp.patch_fn(p.oid::regprocedure,
  'COALESCE(s.character_name, s.name)', 'COALESCE(NULLIF(btrim(s.character_name), ''''), ''Aventureiro'')')
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'get_school_feed';

SELECT pg_temp.patch_fn('public.compute_weekly_rankings()'::regprocedure,
  'COALESCE(character_name, name)', 'COALESCE(NULLIF(btrim(character_name), ''''), ''Aventureiro'')');
SELECT pg_temp.patch_fn('public.compute_weekly_rankings()'::regprocedure,
  'COALESCE(s.character_name, s.name)', 'COALESCE(NULLIF(btrim(s.character_name), ''''), ''Aventureiro'')');

SELECT pg_temp.patch_fn(p.oid::regprocedure,
  'COALESCE(st.character_name, st.name)', 'COALESCE(NULLIF(btrim(st.character_name), ''''), ''Aventureiro'')')
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'get_weekly_ranking';

-- Cartão de perfil: nome real só para o próprio aluno, o professor e o admin.
SELECT pg_temp.patch_fn('public.get_profile_card(uuid)'::regprocedure,
  '''name'',         v_s.name,',
  '''name'', CASE WHEN v_s.user_id = auth.uid() OR public.is_teacher_of_student(v_s.id) OR public.is_caller_admin() THEN v_s.name ELSE COALESCE(NULLIF(btrim(v_s.character_name), ''''), ''Aventureiro'') END,');

-- ─── 5. search_path fixo em todas as funções ────────────────────────────────

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', r.sig);
  END LOOP;
END $$;

COMMIT;
