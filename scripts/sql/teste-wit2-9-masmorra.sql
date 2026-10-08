-- Carta da masmorra: sai do deck do chefe do andar, no máximo 1 a cada 90 s e 3 por dia.
\set ON_ERROR_STOP on
SELECT set_config('test.email', '', false);
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
CREATE TEMP TABLE mz AS SELECT wit2_dungeon_claim() AS c;
SELECT EXISTS (SELECT 1 FROM wit2_boss_cards b JOIN mz ON mz.c = b.card_id
  WHERE b.andar = (SELECT least(100, greatest(1, coalesce((data->>'towerMax')::int, 1))) FROM wit2_progress WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002')) AS "carta do deck do chefe do andar";
DO $$ BEGIN PERFORM wit2_dungeon_claim(); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'devagar' THEN RAISE; END IF; END $$;
-- 3 por dia (envelhece as anteriores para passar dos 90 s)
UPDATE wit2_events SET at = now() - interval '5 minutes' WHERE kind = 'masmorra';
SELECT wit2_dungeon_claim() IS NOT NULL AS "2ª do dia";
UPDATE wit2_events SET at = greatest(date_trunc('day', now()), now() - interval '5 minutes') WHERE kind = 'masmorra';
SELECT wit2_dungeon_claim() IS NOT NULL AS "3ª do dia";
UPDATE wit2_events SET at = greatest(date_trunc('day', now()), now() - interval '5 minutes') WHERE kind = 'masmorra';
DO $$ BEGIN PERFORM wit2_dungeon_claim(); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'masmorra: limite do dia' THEN RAISE; END IF; END $$;
SELECT set_config('test.uid', '', false);
