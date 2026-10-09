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
-- amizade e trocas seguem por turma
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
DO $$ BEGIN PERFORM wit2_friend_request((SELECT handle FROM wit2_profile WHERE nick = 'Aninha')); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'colega não encontrado' THEN RAISE; END IF; END $$;

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
