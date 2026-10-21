-- Tudo salvo no banco (sessão por computador, tickets e casa no load, fotos,
-- cristal → pó) e o painel novo do professor (lista, aprovar, recusar,
-- suspender, zerar, apagar). Cada SELECT tem de dar "t".
\set ON_ERROR_STOP on
INSERT INTO teachers (id, user_id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'f1f1f1f1-0000-0000-0000-000000000001', 'Profa Salva'),
  ('aaaaaaaa-0000-0000-0000-0000000000f2', 'f2f2f2f2-0000-0000-0000-000000000002', 'Outro');
INSERT INTO students (id, user_id, teacher_id, name, character_name, status) VALUES
  ('ffffffff-0000-0000-0000-000000000001', 'f0f0f0f0-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000f1', 'Caio', 'Caiozinho', 'active'),
  ('ffffffff-0000-0000-0000-000000000002', 'f0f0f0f0-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-0000000000f1', 'Duda', 'Duda', 'pending'),
  ('ffffffff-0000-0000-0000-000000000003', 'f0f0f0f0-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-0000000000f2', 'Eva', 'Eva', 'active');

-- aluno: um computador por vez
SELECT set_config('test.email', '', false);
SELECT set_config('test.uid', 'f0f0f0f0-0000-0000-0000-000000000001', false);
SELECT (wit2_load('11111111-aaaa-0000-0000-000000000001'::uuid)->>'coins')::int = 0 AS "load com sessão: começa com 0";
SELECT jsonb_typeof(wit2_load('11111111-aaaa-0000-0000-000000000001'::uuid)->'tickets') = 'array' AS "load traz os tickets";
SELECT (wit2_sync(30, '{"fome": 60}'::jsonb, 0, '11111111-aaaa-0000-0000-000000000001'::uuid)->>'coins')::int = 30 AS "sync da sessão certa grava";
SELECT wit2_load('22222222-bbbb-0000-0000-000000000002'::uuid) IS NOT NULL AS "outro computador abre o jogo";
SELECT (wit2_sync(500, '{"fome": 10}'::jsonb, 1, '11111111-aaaa-0000-0000-000000000001'::uuid)->>'sessao')::boolean AS "a janela antiga é recusada";
SELECT (SELECT coins FROM wit2_wallet WHERE student_id = 'ffffffff-0000-0000-0000-000000000001') = 30 AS "e as moedas não mudaram";
SELECT (SELECT data->>'fome' FROM wit2_progress WHERE student_id = 'ffffffff-0000-0000-0000-000000000001') = '60' AS "nem o progresso";
SELECT (wit2_sync(0, '{"fome": 50}'::jsonb, 1, '22222222-bbbb-0000-0000-000000000002'::uuid)->>'ok')::boolean AS "a sessão nova grava";
-- a casa volta no load
SELECT wit2_save_house('{"items": [{"id": "cama", "tx": 2, "ty": 3}]}'::jsonb) AS "salva a casa";
SELECT (wit2_load('22222222-bbbb-0000-0000-000000000002'::uuid)->'house'->'items'->0->>'id') = 'cama' AS "a casa volta no load";
-- fotos
SELECT wit2_photos_save('[{"id": "f1", "data": "data:image/jpeg;base64,AAAA"}]'::jsonb) AS "salva as fotos";
SELECT jsonb_array_length(wit2_photos_get()) = 1 AS "as fotos voltam";
DO $$ BEGIN PERFORM wit2_photos_save((SELECT jsonb_agg(x) FROM generate_series(1, 9) x)); RAISE EXCEPTION 'devia recusar 9 fotos'; EXCEPTION WHEN others THEN IF SQLERRM <> 'fotos inválidas' THEN RAISE; END IF; END $$;
-- cristal vira pó, com teto do dia (usa só os que cabem)
SELECT (wit2_crystals_dust('cristal:roxo', 2)->'po'->>'rare')::int = 8 AS "2 cristais roxos viram 8 de pó raro";
SELECT (wit2_crystals_dust('cristal:azul', 999)->>'usados')::int = 148 AS "muitos cristais: usa só os 148 que cabem no teto";
SELECT (SELECT (po->>'common')::int FROM wit2_wallet WHERE student_id = 'ffffffff-0000-0000-0000-000000000001') = 592 AS "e o pó comum chega a 592";
DO $$ BEGIN PERFORM wit2_crystals_dust('cristal:dourado', 1); RAISE EXCEPTION 'devia parar no teto'; EXCEPTION WHEN others THEN IF SQLERRM <> 'limite de pó do dia' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_crystals_dust('cristal:verde', 1); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'cristal inválido' THEN RAISE; END IF; END $$;
-- aluno não usa o painel
DO $$ BEGIN PERFORM wit2_teacher_list('active'); RAISE EXCEPTION 'aluno não lista'; EXCEPTION WHEN others THEN IF SQLERRM <> 'forbidden' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_teacher_reset('ffffffff-0000-0000-0000-000000000001'); RAISE EXCEPTION 'aluno não zera'; EXCEPTION WHEN others THEN IF SQLERRM <> 'forbidden' THEN RAISE; END IF; END $$;
SELECT NOT has_function_privilege('authenticated', 'public.wit2_teacher_can(uuid)', 'EXECUTE') AS "a conferência de dono é interna";

-- professora
SELECT set_config('test.uid', 'f1f1f1f1-0000-0000-0000-000000000001', false);
SELECT (wit2_teacher_list('active')->>'total')::int = 1 AS "lista só os alunos dela";
SELECT (wit2_teacher_list('pending')->'rows'->0->>'nome') = 'Duda' AS "o cadastro esperando aparece";
SELECT (wit2_teacher_list('active', 'caio')->>'total')::int = 1 AND (wit2_teacher_list('active', 'zzz')->>'total')::int = 0 AS "busca pelo nome";
SELECT (wit2_teacher_list('active')->'rows'->0->>'moedas')::int = 30 AS "mostra as moedas";
DO $$ BEGIN PERFORM wit2_teacher_list('active', '', 50, 0, NULL, true); RAISE EXCEPTION 'só o master vê todos'; EXCEPTION WHEN others THEN IF SQLERRM <> 'forbidden' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_teacher_suspend('ffffffff-0000-0000-0000-000000000003', 3); RAISE EXCEPTION 'aluno de outro professor'; EXCEPTION WHEN others THEN IF SQLERRM <> 'forbidden' THEN RAISE; END IF; END $$;
SELECT wit2_teacher_approve('ffffffff-0000-0000-0000-000000000002') AS "aprova o cadastro";
SELECT (SELECT status FROM students WHERE id = 'ffffffff-0000-0000-0000-000000000002') = 'active' AS "virou aluno";
SELECT wit2_teacher_suspend('ffffffff-0000-0000-0000-000000000001', 3) > now() AS "suspende por 3 dias";
SELECT (SELECT session FROM wit2_progress WHERE student_id = 'ffffffff-0000-0000-0000-000000000001') IS NULL AS "suspender fecha a janela aberta";
SELECT set_config('test.uid', 'f0f0f0f0-0000-0000-0000-000000000001', false);
DO $$ BEGIN PERFORM wit2_load('44444444-dddd-0000-0000-000000000004'::uuid); RAISE EXCEPTION 'suspenso não abre'; EXCEPTION WHEN others THEN IF SQLERRM <> 'suspenso' THEN RAISE; END IF; END $$;
SELECT set_config('test.uid', 'f1f1f1f1-0000-0000-0000-000000000001', false);
SELECT wit2_teacher_suspend('ffffffff-0000-0000-0000-000000000001', 0) IS NULL AS "reativa";
SELECT set_config('test.uid', 'f0f0f0f0-0000-0000-0000-000000000001', false);
SELECT (wit2_load('22222222-bbbb-0000-0000-000000000002'::uuid)->>'coins')::int = 30 AS "reativado, abre de novo";
SELECT set_config('test.uid', 'f1f1f1f1-0000-0000-0000-000000000001', false);
-- zerar: o progresso volta ao começo e a janela aberta pede para recarregar
SELECT wit2_teacher_reset('ffffffff-0000-0000-0000-000000000001') AS "zera o progresso";
SELECT NOT EXISTS (SELECT 1 FROM wit2_wallet WHERE student_id = 'ffffffff-0000-0000-0000-000000000001')
   AND NOT EXISTS (SELECT 1 FROM wit2_photos WHERE student_id = 'ffffffff-0000-0000-0000-000000000001') AS "carteira e fotos zeradas";
SELECT set_config('test.uid', 'f0f0f0f0-0000-0000-0000-000000000001', false);
SELECT (wit2_sync(10, '{}'::jsonb, 2, '22222222-bbbb-0000-0000-000000000002'::uuid)->>'sessao')::boolean AS "depois de zerar, a janela aberta é recusada";
SELECT (wit2_load('33333333-cccc-0000-0000-000000000003'::uuid)->>'coins')::int = 0
   AND (SELECT count(*) FROM jsonb_object_keys(wit2_load('33333333-cccc-0000-0000-000000000003'::uuid)->'collection')) = (SELECT count(*) FROM wit2_starter) AS "recomeça com a coleção inicial";
-- recusar e apagar (também com personagem do WIT 1, cujas filhas não têm cascata)
SELECT set_config('test.uid', 'f1f1f1f1-0000-0000-0000-000000000001', false);
INSERT INTO students (id, user_id, teacher_id, name, status) VALUES ('ffffffff-0000-0000-0000-000000000004', 'f0f0f0f0-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-0000000000f1', 'Fred', 'pending');
INSERT INTO characters (id, user_id) VALUES ('cccccccc-0000-0000-0000-000000000001', 'f0f0f0f0-0000-0000-0000-000000000001');
INSERT INTO character_abilities VALUES ('cccccccc-0000-0000-0000-000000000001');
INSERT INTO character_progress VALUES ('cccccccc-0000-0000-0000-000000000001');
INSERT INTO pvp_matches (challenger_id, opponent_id, winner_id) VALUES ('ffffffff-0000-0000-0000-000000000003', 'ffffffff-0000-0000-0000-000000000003', 'ffffffff-0000-0000-0000-000000000001');
-- partida Caio × Eva: o histórico de pontos da Eva aponta para ela (sem cascata, como na produção)
INSERT INTO pvp_matches (id, challenger_id, opponent_id) VALUES ('dddddddd-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000003');
INSERT INTO characters (id, user_id) VALUES ('cccccccc-0000-0000-0000-000000000003', 'f0f0f0f0-0000-0000-0000-000000000003');
INSERT INTO pvp_rating_history (character_id, match_id) VALUES ('cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000001');
SELECT NOT wit2_teacher_reject('ffffffff-0000-0000-0000-000000000001') AS "recusar só vale para quem espera";
SELECT wit2_teacher_reject('ffffffff-0000-0000-0000-000000000004') AS "recusa o cadastro";
SELECT NOT EXISTS (SELECT 1 FROM students WHERE id = 'ffffffff-0000-0000-0000-000000000004') AS "o cadastro recusado some";
SELECT wit2_teacher_delete('ffffffff-0000-0000-0000-000000000001') AS "apaga aluno com personagem do WIT 1";
SELECT NOT EXISTS (SELECT 1 FROM students WHERE id = 'ffffffff-0000-0000-0000-000000000001')
   AND NOT EXISTS (SELECT 1 FROM characters WHERE user_id = 'f0f0f0f0-0000-0000-0000-000000000001') AS "aluno e personagem saíram";
SELECT (SELECT match_id FROM pvp_rating_history WHERE character_id = 'cccccccc-0000-0000-0000-000000000003') IS NULL AS "o histórico do adversário fica, sem a partida";
-- o master vê os alunos de todos os professores
INSERT INTO wit2_masters VALUES ('master@exemplo.com') ON CONFLICT DO NOTHING;
SELECT set_config('test.email', 'master@exemplo.com', false);
SELECT set_config('test.uid', '99999999-0000-0000-0000-000000000009', false);
SELECT (wit2_teacher_list('active', '', 50, 0, NULL, true)->>'total')::int >= 2 AS "o master vê os alunos de todos";
SELECT set_config('test.email', '', false);
SELECT set_config('test.uid', '', false);
