-- Cidade aberta (_wit2_cidade_aberta.sql): todo aluno vê e duela com todos;
-- professor continua só com os alunos dele. Roda por último. Cada SELECT tem de dar "t".
-- Ana e Beto: professor 1111; Caio: professor 4444 (criados em teste-wit2-1-social.sql).
\set ON_ERROR_STOP on
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
SELECT (wit2_set_profile('Caio', NULL, '{}', '{}')->>'sala') = 'todos' AS "todo aluno vai para o canal geral";
SELECT wit2_report((SELECT handle FROM wit2_profile WHERE nick = 'Aninha'), 'apelido') AS "Caio denuncia a Ana (outra turma)";
DO $$ BEGIN PERFORM wit2_report((SELECT handle FROM wit2_profile WHERE nick = 'Caio'), 'apelido'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'colega não encontrado' THEN RAISE; END IF; END $$;
-- a denúncia vai para o professor da Ana, não para o do Caio
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
SELECT jsonb_array_length(wit2_teacher_reports()) = 1 AS "professor da Ana vê a denúncia";
SELECT set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
SELECT jsonb_array_length(wit2_teacher_reports()) = 0 AS "professor do Caio não vê";
-- tudo global (_wit2_tudo_global.sql): amizade, troca e guilda com outra turma
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
SELECT wit2_friend_request((SELECT handle FROM wit2_profile WHERE nick = 'Aninha')) = 'enviado' AS "Caio pede amizade à Ana (outra turma)";
SELECT (wit2_trade_view((SELECT handle FROM wit2_profile WHERE nick = 'Aninha'))->>'nick') = 'Aninha' AS "Caio vê as repetidas da Ana";
SELECT wit2_guild_join((SELECT code FROM wit2_guilds LIMIT 1)) AS "Caio entra na guilda de outra turma";
SELECT wit2_guild_leave() AS "Caio sai da guilda";
-- votação continua da turma: o Caio não vê a do professor da Ana
SELECT wit2_vote_current() IS NULL OR (wit2_vote_current() = 'null'::jsonb) AS "votação: só a da própria turma";

-- canais em tempo real
INSERT INTO realtime.messages (topic) VALUES ('wit2-todos-praca');
SET ROLE authenticated;
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
SELECT set_config('test.topic', 'wit2-todos-praca', false);
SELECT (SELECT count(*) FROM realtime.messages) > 0 AS "aluno escuta o canal geral";
INSERT INTO realtime.messages (topic) VALUES ('wit2-todos-praca');
SELECT true AS "aluno manda no canal geral";
SELECT set_config('test.topic', 'wit2-aaaaaaaa-0000-0000-0000-000000000001-praca', false);
SELECT (SELECT count(*) FROM realtime.messages) = 0 AS "canal antigo por turma: fechado";
DO $$ BEGIN INSERT INTO realtime.messages (topic) VALUES ('x'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
SELECT set_config('test.topic', 'wit2-todos-praca', false);
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
SELECT (SELECT count(*) FROM realtime.messages) = 0 AS "professor não entra no canal dos alunos";
SELECT set_config('test.uid', '', false);
SELECT (SELECT count(*) FROM realtime.messages) = 0 AS "sem login: não entra";
RESET ROLE;

-- rankings do Salão dos Campeões (todos os professores juntos)
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
SELECT jsonb_array_length(wit2_rank_players()->'top') = 3 AS "ranking de jogadores: as 3 turmas juntas";
SELECT (wit2_rank_players()->'eu'->>'pos')::int >= 1 AND (wit2_rank_players()->'total')::int = 3 AS "minha posição no ranking";
SELECT NOT (wit2_rank_players()->'top'->0 ?| ARRAY['student_id','name','id']) AS "ranking só com apelido";
UPDATE wit2_profile SET andar = 40 WHERE nick = 'Caio';
SELECT wit2_rank_players()->'top'->0->>'nick' = 'Caio' AND (wit2_rank_players()->'top'->0->>'eu')::boolean AS "maior andar em 1º";
UPDATE students SET is_test_account = true WHERE id = 'bbbbbbbb-0000-0000-0000-000000000003';
SELECT wit2_rank_players()->'eu' IS NULL OR wit2_rank_players()->'eu' = 'null'::jsonb AS "conta de teste fica fora";
UPDATE students SET is_test_account = false WHERE id = 'bbbbbbbb-0000-0000-0000-000000000003';
SELECT wit2_rank_pvp()->'top'->0->>'nick' = 'Aninha' AND (wit2_rank_pvp()->'top'->0->>'vitorias')::int = 1 AS "PvP: Ana em 1º com 1 vitória";
SELECT (wit2_rank_pvp()->'top'->0->>'semana')::int = 1 AND (wit2_rank_pvp()->'top'->0->>'duelos')::int >= 1 AS "PvP: vitórias da semana e duelos";
SELECT jsonb_array_length(wit2_pvp_ranking()) = jsonb_array_length(wit2_rank_pvp()->'top') AS "ranking antigo do PvP = o global";
SELECT jsonb_array_length(wit2_rank_guilds()->'top') = 1 AND NOT (wit2_rank_guilds()->'top'->0->>'minha')::boolean AS "guildas: Caio vê a guilda da outra turma";
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT (wit2_rank_guilds()->'top'->0->>'minha')::boolean AND (wit2_rank_guilds()->'eu'->>'pos')::int = 1 AS "guildas: Ana vê a dela em 1º";
SELECT (wit2_rank_guilds()->'top'->0->>'membros')::int = 2 AS "guildas: membros";
