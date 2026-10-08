-- Evolução de cartas (depois dos outros testes).
\set ON_ERROR_STOP on
SELECT (SELECT count(*) FROM wit2_card_catalog WHERE base) = 350 AND (SELECT count(*) FROM wit2_card_catalog WHERE NOT base) > 200 AS "catálogo com as versões +";
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
INSERT INTO wit2_cards VALUES ('bbbbbbbb-0000-0000-0000-000000000002', 'manto-da-aurora', 3) ON CONFLICT (student_id, card_id) DO UPDATE SET qty = 3;
UPDATE wit2_wallet SET po = '{"uncommon": 100}' WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002';
SELECT (wit2_evolve('manto-da-aurora')->>'plus')::int = 1 AS "evolui: ganha a +";
SELECT (SELECT qty FROM wit2_cards WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002' AND card_id = 'manto-da-aurora') = 1
   AND (SELECT (po->>'uncommon')::int FROM wit2_wallet WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 60 AS "gastou 2 cópias e 40 de pó";
DO $$ BEGIN PERFORM wit2_evolve('manto-da-aurora'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'precisa de 3 cópias' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_evolve('manto-da-aurora+'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'essa carta não evolui' THEN RAISE; END IF; END $$;
SELECT NOT EXISTS (SELECT 1 FROM wit2_cards c JOIN wit2_card_catalog k ON k.id = c.card_id WHERE NOT k.base AND c.student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND c.card_id NOT LIKE '%+') AS "pacotes não sorteiam a +";
