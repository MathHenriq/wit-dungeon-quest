-- Cenário: professor, dois alunos; carregar, sincronizar (moedas por diferença
-- com teto, conflito de versão), pacote, Caminho, carta do chefe, forja,
-- ticket, aula com entrega e código. Cada SELECT tem de dar "t".
\set ON_ERROR_STOP on
INSERT INTO teachers (id, user_id) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111');
INSERT INTO students (id, user_id, teacher_id, name, character_name) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001', 'Ana', 'Aninha'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001', 'Beto', 'Betão');

-- aluno 1
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT (wit2_load()->>'coins')::int = 0 AS "load: começa com 0 moedas";
SELECT (SELECT count(*) FROM jsonb_object_keys(wit2_load()->'collection')) = (SELECT count(*) FROM wit2_starter) AS "ganha a coleção inicial";
SELECT (wit2_sync(50, '{"fome": 80, "coins": 999999, "towerMax": 2}'::jsonb, 0)->>'coins')::int = 50 AS "sync: +50 moedas";
SELECT (wit2_sync(0, '{"fome": 70}'::jsonb, 0)->>'ok')::boolean = false AS "sync com versão velha devolve conflito";
SELECT (wit2_load()->'data' ? 'coins') = false AS "moedas do JSON são ignoradas";
SELECT (wit2_sync(-20, NULL, 0)->>'coins')::int = 30 AS "gasto: -20";
SELECT (wit2_sync(-500, NULL, 0)->>'coins')::int = 0 AS "gasto nunca deixa negativo";
SELECT (wit2_sync(9000, NULL, 0)->>'coins')::int = wit2_daily_cap() - 50 AS "ganho para no teto do dia";
SELECT EXISTS (SELECT 1 FROM wit2_events WHERE kind = 'suspeita') AS "passar do teto anota suspeita";
SELECT (wit2_sync(10, NULL, 0)->>'coins')::int = wit2_daily_cap() - 50 AS "teto vale o dia todo";
UPDATE wit2_wallet SET earned_day = current_date - 1 WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
SELECT (wit2_sync(10, NULL, 0)->>'coins')::int = wit2_daily_cap() - 40 AS "dia novo, teto novo";
DO $$ BEGIN PERFORM wit2_buy_pack('mitico'); RAISE EXCEPTION 'devia recusar sem moedas'; EXCEPTION WHEN others THEN IF SQLERRM <> 'moedas insuficientes' THEN RAISE; END IF; END $$;
SELECT jsonb_array_length(wit2_buy_pack('comum')->'cards') = 5 AS "pacote comum: 5 cartas";
SELECT (wit2_load()->>'coins')::int = wit2_daily_cap() - 40 - 300 AS "pacote cobrou 300";
UPDATE wit2_wallet SET sem_epica = 9 WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
WITH b AS MATERIALIZED (SELECT wit2_buy_pack('comum') AS r)
SELECT (SELECT rarity FROM wit2_card_catalog, b WHERE id = b.r->'cards'->>4) IN ('epic','legendary','mythic','unknown') AS "garantia: 10º pacote tem Épica";
SELECT (wit2_load()->>'semEpica')::int = 0 AS "garantia zera a conta";
-- Caminho: uma vez só
WITH c AS MATERIALIZED (SELECT wit2_choose_path('sabio') AS col)
SELECT bool_and((c.col->>card_id)::int >= qty) AS "Caminho dá o deck dele" FROM wit2_path_cards, c WHERE path_id = 'sabio';
DO $$ BEGIN PERFORM wit2_choose_path('louco'); RAISE EXCEPTION 'devia recusar 2º caminho'; EXCEPTION WHEN others THEN IF SQLERRM <> 'caminho já escolhido' THEN RAISE; END IF; END $$;
-- carta do chefe
SELECT wit2_boss_card(1, (SELECT card_id FROM wit2_boss_cards WHERE andar = 1 LIMIT 1)) >= 1 AS "carta do chefe do andar 1";
DO $$ BEGIN PERFORM wit2_boss_card(1, (SELECT card_id FROM wit2_boss_cards WHERE andar = 1 LIMIT 1)); RAISE EXCEPTION 'devia recusar rápido demais'; EXCEPTION WHEN others THEN IF SQLERRM <> 'devagar' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_boss_card(9, (SELECT card_id FROM wit2_boss_cards WHERE andar = 9 LIMIT 1)); RAISE EXCEPTION 'devia recusar andar trancado'; EXCEPTION WHEN others THEN IF SQLERRM NOT IN ('andar ainda trancado') THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_boss_card(1, (SELECT id FROM wit2_card_catalog WHERE id NOT IN (SELECT card_id FROM wit2_boss_cards WHERE andar = 1) LIMIT 1)); RAISE EXCEPTION 'devia recusar carta de fora'; EXCEPTION WHEN others THEN IF SQLERRM <> 'carta não é do chefe' THEN RAISE; END IF; END $$;
-- forja: desmancha a repetida, forja com o pó
UPDATE wit2_cards SET qty = 3 WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND card_id = (SELECT id FROM wit2_card_catalog WHERE rarity = 'common' ORDER BY id LIMIT 1);
INSERT INTO wit2_cards (student_id, card_id, qty) SELECT 'bbbbbbbb-0000-0000-0000-000000000001', id, 3 FROM wit2_card_catalog WHERE rarity = 'common' ORDER BY id LIMIT 1 ON CONFLICT (student_id, card_id) DO UPDATE SET qty = 3;
SELECT (wit2_dust((SELECT id FROM wit2_card_catalog WHERE rarity = 'common' ORDER BY id LIMIT 1), 99)->>'qty')::int = 1 AS "desmanchar deixa 1 no álbum";
SELECT (wit2_load()->'po'->>'common')::int = 10 AS "2 comuns viram 10 de pó";
DO $$ BEGIN PERFORM wit2_forge((SELECT id FROM wit2_card_catalog WHERE rarity = 'common' ORDER BY id LIMIT 1)); RAISE EXCEPTION 'devia faltar pó'; EXCEPTION WHEN others THEN IF SQLERRM <> 'pó insuficiente' THEN RAISE; END IF; END $$;
UPDATE wit2_wallet SET po = '{"common": 45}' WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
SELECT (wit2_forge((SELECT id FROM wit2_card_catalog WHERE rarity = 'common' ORDER BY id LIMIT 1))->'po'->>'common')::int = 5 AS "forjar comum custa 40";
-- ticket e cancelar devolve
UPDATE wit2_wallet SET coins = 5000 WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
SELECT length(wit2_buy_reward('musica')->>'code') = 4 AS "ticket com código de 4";
SELECT (wit2_cancel_ticket((SELECT code FROM wit2_tickets LIMIT 1))->>'coins')::int = 5000 AS "cancelar devolve as moedas";
SELECT length(wit2_buy_reward('musica')->>'code') = 4 AS "ticket de novo";
-- outro aluno não lê nem escreve nas tabelas do primeiro (RLS e grants)
SET ROLE authenticated;
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT count(*) = 0 AS "RLS: Beto não vê a carteira da Ana" FROM wit2_wallet WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
DO $$ BEGIN UPDATE wit2_wallet SET coins = 1000000; RAISE EXCEPTION 'devia recusar escrita direta'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
DO $$ BEGIN INSERT INTO wit2_cards VALUES ('bbbbbbbb-0000-0000-0000-000000000002', 'enma', 99); RAISE EXCEPTION 'devia recusar carta direta'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
DO $$ BEGIN PERFORM wit2_draw_pack('bbbbbbbb-0000-0000-0000-000000000001', 'mitico'); RAISE EXCEPTION 'devia recusar função interna'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
DO $$ BEGIN PERFORM wit2_add_card('bbbbbbbb-0000-0000-0000-000000000002', 'enma', 5); RAISE EXCEPTION 'devia recusar função interna'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN PERFORM wit2_load(); RAISE EXCEPTION 'anon não chama'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
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
SELECT jsonb_array_length(wit2_open_saved_pack('epico')->'cards') = 5 AS "abre o épico guardado";
SELECT (SELECT count(*) FROM wit2_events) > 0 AS "eventos gravados";
