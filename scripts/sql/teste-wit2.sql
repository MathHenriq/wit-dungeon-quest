-- Cenário: professor, dois alunos; carregar, gravar progresso (com conflito
-- de versão), duelos, pacote, ticket, aula com entrega e código.
\set ON_ERROR_STOP on
INSERT INTO teachers (id, user_id) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111');
INSERT INTO students (id, user_id, teacher_id, name, character_name) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001', 'Ana', 'Aninha'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001', 'Beto', 'Betão');

-- aluno 1
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT (wit2_load()->>'coins')::int = 0 AS "load: começa com 0 moedas";
SELECT (wit2_save_progress('{"fome": 80, "coins": 999999}'::jsonb, 0)->>'ok')::boolean AS "save v0 ok";
SELECT (wit2_save_progress('{"fome": 70}'::jsonb, 0)->>'ok')::boolean = false AS "save com versão velha devolve conflito";
SELECT (wit2_load()->'data' ? 'coins') = false AND (wit2_load()->>'coins')::int = 0 AS "moedas do JSON são ignoradas";
SELECT (wit2_duel_result(1, 'mesa', 1, true)->>'coins')::int = 6 AS "mesa andar 1: 6 moedas na 1ª vez";
SELECT (wit2_duel_result(1, 'mesa', 1, true)->>'coins')::int = 1 AS "mesa repetida: 20%";
DO $$ BEGIN PERFORM wit2_duel_result(5, 'mesa', 1, true); RAISE EXCEPTION 'devia recusar andar trancado'; EXCEPTION WHEN others THEN IF SQLERRM <> 'andar ainda trancado' THEN RAISE; END IF; END $$;
SELECT (wit2_duel_result(1, 'chefe', 0, true)->>'unlocked')::int = 2 AS "chefe libera o andar 2";
SELECT (wit2_load()->'tower'->>'towerMax')::int = 2 AS "towerMax = 2";
DO $$ BEGIN PERFORM wit2_buy_pack('comum'); RAISE EXCEPTION 'devia recusar sem moedas'; EXCEPTION WHEN others THEN IF SQLERRM <> 'moedas insuficientes' THEN RAISE; END IF; END $$;
UPDATE wit2_wallet SET coins = 5000 WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
SELECT array_length(wit2_buy_pack('raro'), 1) = 5 AS "pacote raro: 5 cartas";
SELECT (wit2_load()->>'coins')::int = 5000 - 1500 AS "pacote cobrou 1500";
SELECT length(wit2_buy_reward('musica')) = 4 AS "ticket com código de 4";
-- outro aluno não lê as tabelas do primeiro (RLS)
SET ROLE authenticated;
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT count(*) = 0 AS "RLS: Beto não vê a carteira da Ana" FROM wit2_wallet WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
UPDATE wit2_wallet SET coins = 1000000;
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT (wit2_load()->>'coins')::int = 2900 AS "RLS: escrita direta na carteira não muda nada";
DO $$ BEGIN PERFORM wit2_draw_pack('bbbbbbbb-0000-0000-0000-000000000001', 'mitico'); RAISE EXCEPTION 'devia recusar função interna'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
RESET ROLE;
-- professor: aula do dia, entrega com pacotes, código
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
SELECT jsonb_array_length(wit2_teacher_lesson(current_date)->'students') = 2 AS "aula lista os 2 alunos";
SELECT jsonb_array_length(wit2_teacher_lesson(current_date)->'tickets') = 1 AS "professor vê o ticket esperando";
SELECT wit2_teacher_deliver((wit2_teacher_lesson(current_date)->>'lesson')::uuid,
  '[{"student":"bbbbbbbb-0000-0000-0000-000000000001","status":"foi_bem","pack":"raro"},{"student":"bbbbbbbb-0000-0000-0000-000000000002","status":"faltou"}]'::jsonb) = 2 AS "entrega 2 linhas";
SELECT wit2_teacher_deliver((wit2_teacher_lesson(current_date)->>'lesson')::uuid,
  '[{"student":"bbbbbbbb-0000-0000-0000-000000000001","status":"excepcional","pack":"epico"}]'::jsonb) = 1 AS "refazer corrige";
SELECT (SELECT qty FROM wit2_packs WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND pack_id = 'raro') = 0
   AND (SELECT qty FROM wit2_packs WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND pack_id = 'epico') = 1 AS "refazer tira o raro e dá o épico";
SELECT length(wit2_class_code((wit2_teacher_lesson(current_date)->>'lesson')::uuid)) = 4 AS "código de 4 dígitos";
SELECT wit2_teacher_deliver_ticket((SELECT code FROM wit2_tickets LIMIT 1)) AS "professor entrega o ticket";
-- aluno abre o pacote guardado
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT array_length(wit2_open_saved_pack('epico'), 1) = 5 AS "abre o épico guardado";
SELECT (SELECT count(*) FROM wit2_events) > 0 AS "eventos gravados";
