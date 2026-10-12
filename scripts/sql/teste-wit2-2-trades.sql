-- Trocas, Vitrine e Mercado da turma (depois de teste-wit2.sql e -social).
\set ON_ERROR_STOP on
-- Ana tem 3 'enma'; Beto tem 2 'apagar' e 500 moedas
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT wit2_load() IS NOT NULL AS "Beto entra";
INSERT INTO wit2_cards VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'enma', 3) ON CONFLICT (student_id, card_id) DO UPDATE SET qty = 3;
INSERT INTO wit2_cards VALUES ('bbbbbbbb-0000-0000-0000-000000000002', 'apagar', 2) ON CONFLICT (student_id, card_id) DO UPDATE SET qty = 2;
UPDATE wit2_wallet SET coins = 500 WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002';
SELECT wit2_bag_ok('{"enma": 2}') AND NOT wit2_bag_ok('{"enma": 6}') AND NOT wit2_bag_ok('{"nao-existe": 1}') AND NOT wit2_bag_ok('{"enma": 1.5}') AND NOT wit2_bag_ok('{"enma": -1}') AS "pacote de cartas: validação";
-- Ana oferece 2 enma + 0 moedas por 1 apagar + 50 moedas
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT ((wit2_trade_view((SELECT handle FROM wit2_profile WHERE nick = 'Betao'))->'spare'->>'apagar')::int) = 1 AS "vê só a repetida do Beto";
DO $$ BEGIN PERFORM wit2_trade_offer((SELECT handle FROM wit2_profile WHERE nick = 'Betao'), '{"enma": 3}', 0, '{"apagar": 1}', 0); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'só cartas repetidas' THEN RAISE; END IF; END $$;
SELECT wit2_trade_offer((SELECT handle FROM wit2_profile WHERE nick = 'Betao'), '{"enma": 2}', 0, '{"apagar": 1}', 50) > 0 AS "Ana oferece";
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT jsonb_array_length(wit2_trades_mine()) = 1 AND wit2_trades_mine()->0->>'eu' = 'recebi' AS "Beto vê a oferta";
SELECT wit2_trade_answer((SELECT id FROM wit2_trades LIMIT 1), true) = 'feita' AS "Beto aceita";
SELECT (SELECT qty FROM wit2_cards WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND card_id = 'enma') = 1
   AND (SELECT qty FROM wit2_cards WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002' AND card_id = 'enma') >= 2
   AND (SELECT qty FROM wit2_cards WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002' AND card_id = 'apagar') = 1
   AND (SELECT coins FROM wit2_wallet WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 450 AS "cartas e moedas trocaram de mão";
DO $$ BEGIN PERFORM wit2_trade_answer((SELECT id FROM wit2_trades LIMIT 1), true); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'troca não encontrada' THEN RAISE; END IF; END $$;
-- oferta que perdeu a validade (Ana já não tem a repetida) é cancelada ao aceitar
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
INSERT INTO wit2_cards VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'enma', 2) ON CONFLICT (student_id, card_id) DO UPDATE SET qty = 2;
SELECT wit2_trade_offer((SELECT handle FROM wit2_profile WHERE nick = 'Betao'), '{"enma": 1}', 0, '{}', 10) > 0 AS "oferta por moedas";
UPDATE wit2_cards SET qty = 1 WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND card_id = 'enma';
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
DO $$ BEGIN PERFORM wit2_trade_answer((SELECT max(id) FROM wit2_trades), true); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'troca não vale mais' THEN RAISE; END IF; END $$;
-- Vitrine: Beto vende a 2ª enma por preço da faixa; Ana compra
DO $$ BEGIN PERFORM wit2_list_card('enma', 5000); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'preço fora da faixa' THEN RAISE; END IF; END $$;
SELECT wit2_list_card('enma', 40) > 0 AS "Beto põe à venda";
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT jsonb_array_length(wit2_vitrine()) = 1 AS "Ana vê a Vitrine da turma";
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
SELECT jsonb_array_length(wit2_vitrine()) = 0 AS "outra turma não vê";
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT (wit2_buy_listing((SELECT id FROM wit2_listings LIMIT 1))->>'card') = 'enma' AS "Ana compra";
SELECT (SELECT coins FROM wit2_wallet WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 490 AS "Beto recebeu 40";
DO $$ BEGIN PERFORM wit2_buy_listing((SELECT id FROM wit2_listings LIMIT 1)); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'já foi vendida' THEN RAISE; END IF; END $$;
-- Mercado da turma
SELECT ((wit2_market_sold('ovo', 5)->'sat'->>'ovo')::numeric) = 5 AS "Ana vende 5 ovos";
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT ((wit2_market_state()->'sat'->>'ovo')::numeric) = 5 AS "Beto vê o mercado cheio de ovo";
UPDATE wit2_market_sat SET day = day - 1;
SELECT ((wit2_market_state()->'sat'->>'ovo')::numeric) = 3.5 AS "esquece 30% por dia";
DO $$ BEGIN PERFORM wit2_market_sold('ovo', 999); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'venda inválida' THEN RAISE; END IF; END $$;
