-- Mural, fases do fliperama e festa (depois dos outros testes).
\set ON_ERROR_STOP on
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT wit2_post('frase', 2, NULL, NULL, NULL) > 0 AS "Beto posta frase";
SELECT wit2_post('foto', NULL, 'data:image/jpeg;base64,AAAA', NULL, NULL) > 0 AS "Beto posta foto";
SELECT wit2_post('fase', NULL, NULL, '{"w":6,"h":5,"t":"s.....#####......o####.....e"}'::jsonb || '{"t":"s......####.......o####......e"}'::jsonb, 3) > 0 AS "Beto posta fase";
DO $$ BEGIN PERFORM wit2_post('fase', NULL, NULL, '{"w":6,"h":5,"t":"......"}', 1); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'fase inválida' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_post('foto', NULL, 'javascript:alert(1)', NULL, NULL); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN check_violation THEN NULL; END $$;
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT jsonb_array_length(wit2_mural()) = 2 AS "Ana vê frase e fase (a foto espera o professor)";
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT jsonb_array_length(wit2_mural()) = 3 AS "Beto vê também a foto dele (esperando)";
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
SELECT wit2_teacher_post_moderate((SELECT id FROM wit2_posts WHERE kind = 'foto'), true) AS "professor aprova a foto";
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT jsonb_array_length(wit2_mural()) = 3 AS "Ana vê a foto aprovada";
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
SELECT jsonb_array_length(wit2_mural()) = 3 AS "outra turma também vê o mural (global)";
-- festa: Ana avisa os amigos (o Beto)
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT wit2_set_profile('Aninha', NULL, '{}', '{}') IS NOT NULL AS "Ana com apelido de volta";
SELECT wit2_party() = 1 AS "festa avisa 1 amigo";
DO $$ BEGIN PERFORM wit2_party(); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'uma festa por hora' THEN RAISE; END IF; END $$;
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT (wit2_notices_mine()->0->>'nick') = 'Aninha' AS "Beto recebe o convite";
