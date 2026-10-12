-- Carta do chefe do portal: só de portal aberto (o anterior vencido), do deck do
-- chefe do andar do rank, no máximo 1 a cada 60 s e 3 por dia.
\set ON_ERROR_STOP on
SELECT set_config('test.email', '', false);
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
-- portal S fechado para quem está no começo
DO $$ BEGIN PERFORM wit2_dungeon_claim(5); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'portal fechado' THEN RAISE; END IF; END $$;
CREATE TEMP TABLE mz AS SELECT wit2_dungeon_claim(0) AS c;
SELECT EXISTS (SELECT 1 FROM wit2_boss_cards b JOIN mz ON mz.c = b.card_id WHERE b.andar = 5) AS "carta do deck do chefe do rank E (andar 5)";
DO $$ BEGIN PERFORM wit2_dungeon_claim(0); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'devagar' THEN RAISE; END IF; END $$;
-- XP alto e Torre alta não abrem: só o chefe do portal anterior vencido
UPDATE wit2_progress SET data = data || '{"towerMax": 99, "masmorra": {"xp": 99999, "vitorias": [1, 0, 0, 0, 0, 0]}}'::jsonb WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002';
UPDATE wit2_events SET at = now() - interval '5 minutes' WHERE kind = 'masmorra';
DO $$ BEGIN PERFORM wit2_dungeon_claim(2); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'portal fechado' THEN RAISE; END IF; END $$;
UPDATE wit2_progress SET data = data || '{"masmorra": {"vitorias": [1, 1, 0, 0, 0, 0]}}'::jsonb WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002';
CREATE TEMP TABLE mc AS SELECT wit2_dungeon_claim(2) AS c;
SELECT EXISTS (SELECT 1 FROM wit2_boss_cards b JOIN mc ON mc.c = b.card_id WHERE b.andar = 30) AS "rank C com o chefe do D vencido (andar 30)";
UPDATE wit2_events SET at = greatest(date_trunc('day', now()), now() - interval '5 minutes') WHERE kind = 'masmorra';
SELECT wit2_dungeon_claim(0) IS NOT NULL AS "3ª do dia";
UPDATE wit2_events SET at = greatest(date_trunc('day', now()), now() - interval '5 minutes') WHERE kind = 'masmorra';
DO $$ BEGIN PERFORM wit2_dungeon_claim(0); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'masmorra: limite do dia' THEN RAISE; END IF; END $$;
SELECT set_config('test.uid', '', false);
