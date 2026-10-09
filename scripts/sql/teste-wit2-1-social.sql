-- Social: perfil, amizade, visita, denúncia, guilda (roda depois de teste-wit2.sql,
-- com os mesmos alunos). Cada SELECT tem de dar "t".
\set ON_ERROR_STOP on
INSERT INTO teachers (id, user_id) VALUES ('aaaaaaaa-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444');
INSERT INTO students (id, user_id, teacher_id, name, character_name) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-0000-0000-0000-000000000002', 'Caio', 'Caio');
SELECT wit2_nick_ok('Aninha 2') AND NOT wit2_nick_ok('merda') AND NOT wit2_nick_ok('a') AND NOT wit2_nick_ok('<script>') AS "apelido: filtro";
-- Ana, Beto (mesma turma) e Caio (outra turma) criam perfil
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT length(wit2_set_profile('Aninha', 'Novata', '{"modelo":"modelo-01"}', ARRAY['enma'])->>'handle') = 10 AS "perfil da Ana";
DO $$ BEGIN PERFORM wit2_set_profile('bosta', NULL, '{}', '{}'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'apelido não permitido' THEN RAISE; END IF; END $$;
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT wit2_set_profile('Betao', NULL, '{}', '{}') IS NOT NULL AS "perfil do Beto";
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
SELECT wit2_set_profile('Caio', NULL, '{}', '{}') IS NOT NULL AS "perfil do Caio";
SELECT (wit2_profile_of((SELECT handle FROM wit2_profile WHERE nick = 'Aninha'))->>'nick') = 'Aninha' AS "outra turma vê o cartão (cidade aberta)";
DO $$ BEGIN PERFORM wit2_friend_request((SELECT handle FROM wit2_profile WHERE nick = 'Aninha')); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'colega não encontrado' THEN RAISE; END IF; END $$;
-- Beto vê a Ana sem dado pessoal e pede amizade
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT (wit2_profile_of((SELECT handle FROM wit2_profile WHERE nick = 'Aninha'))->>'nick') = 'Aninha'
   AND NOT (wit2_profile_of((SELECT handle FROM wit2_profile WHERE nick = 'Aninha')) ?| ARRAY['name','student_id','id','user_id']) AS "cartão só com apelido";
SELECT wit2_friend_request((SELECT handle FROM wit2_profile WHERE nick = 'Aninha')) = 'enviado' AS "pedido enviado";
DO $$ BEGIN PERFORM wit2_visit((SELECT handle FROM wit2_profile WHERE nick = 'Aninha')); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'só amigos visitam' THEN RAISE; END IF; END $$;
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT (wit2_friends_list()->0->>'estado') = 'recebido' AS "Ana vê o pedido";
SELECT wit2_friend_answer((SELECT handle FROM wit2_profile WHERE nick = 'Betao'), true) = 'amigos' AS "Ana aceita";
SELECT wit2_save_house('{"items":[]}') AS "Ana salva a casa";
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT (wit2_visit((SELECT handle FROM wit2_profile WHERE nick = 'Aninha'))->'layout') = '{"items":[]}'::jsonb AS "Beto visita a casa da Ana";
SELECT wit2_report((SELECT handle FROM wit2_profile WHERE nick = 'Aninha'), 'apelido') AS "Beto denuncia";
-- guilda
SELECT length(wit2_guild_create('Os Brabos', 3)->>'code') = 5 AS "Beto cria a guilda";
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
DO $$ BEGIN PERFORM wit2_guild_join((SELECT code FROM wit2_guilds LIMIT 1)); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'guilda não encontrada' THEN RAISE; END IF; END $$;
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT wit2_guild_join((SELECT code FROM wit2_guilds LIMIT 1)) AS "Ana entra";
SELECT jsonb_array_length(wit2_guild_info()->'members') = 2 AND (wit2_guild_info()->>'bossMax')::int = 60 AS "guilda com 2 e chefe de 60";
UPDATE wit2_guilds SET boss_hp = 1;
SELECT (wit2_guild_hit()->>'bossHp')::int = 0 AS "golpe derruba o chefe";
SELECT wit2_guild_claim() AND NOT wit2_guild_claim() AS "prêmio 1 vez por semana";
SELECT (SELECT qty FROM wit2_packs WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND pack_id = 'comum') >= 1 AS "prêmio: pacotinho guardado";
-- mentoria: Ana (andar 1) escolhe o Beto quando ele está 5 andares acima
UPDATE wit2_profile SET andar = 9 WHERE nick = 'Betao';
SELECT wit2_guild_mentor((SELECT handle FROM wit2_profile WHERE nick = 'Betao')) AS "Ana escolhe mentor";
-- professor resolve a denúncia
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
SELECT jsonb_array_length(wit2_teacher_reports()) = 1 AS "professor vê a denúncia";
SELECT wit2_teacher_resolve((SELECT id FROM wit2_reports LIMIT 1), 'apelido') AS "professor reseta o apelido";
SELECT (SELECT nick FROM wit2_profile WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001') = 'Desafiante' AS "apelido voltou ao padrão";
SELECT jsonb_array_length(wit2_teacher_reports()) = 0 AS "fila vazia";
-- leitura direta das tabelas fechada
SET ROLE authenticated;
DO $$ BEGIN PERFORM * FROM wit2_profile; RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
DO $$ BEGIN PERFORM wit2_public('bbbbbbbb-0000-0000-0000-000000000001'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
RESET ROLE;
