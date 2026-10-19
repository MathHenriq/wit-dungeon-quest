-- Placar do PvP online (depois dos outros testes).
\set ON_ERROR_STOP on
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT wit2_pvp_report('m1', (SELECT handle FROM wit2_profile WHERE nick = 'Betao'), true) = false AS "só um lado: ainda sem vencedor";
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT wit2_pvp_report('m1', (SELECT handle FROM wit2_profile WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001'), false) AS "os dois batem: vale";
SELECT (SELECT winner FROM wit2_pvp_matches WHERE key = 'm1') = 'bbbbbbbb-0000-0000-0000-000000000001' AS "vencedora é a Ana";
SELECT wit2_pvp_report('m2', (SELECT handle FROM wit2_profile WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001'), true) = false AS "m2: Beto diz que ganhou";
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT wit2_pvp_report('m2', (SELECT handle FROM wit2_profile WHERE nick = 'Betao'), true) = false AS "os dois dizem que ganharam: sem vencedor";
SELECT jsonb_array_length(wit2_pvp_ranking()) = 1 AND (wit2_pvp_ranking()->0->>'vitorias')::int = 1 AS "ranking da turma";
SELECT wit2_pvp_report('m1', (SELECT handle FROM wit2_profile WHERE nick = 'Betao'), false) AS "mudar de ideia não muda o resultado";
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
SELECT wit2_pvp_report('m3', (SELECT handle FROM wit2_profile WHERE nick = 'Betao'), true) = false AS "outra turma duela (cidade aberta)";
DO $$ BEGIN PERFORM wit2_pvp_report('m4', (SELECT handle FROM wit2_profile WHERE nick = 'Caio'), true); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'colega não encontrado' THEN RAISE; END IF; END $$;
