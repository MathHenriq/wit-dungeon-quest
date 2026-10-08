-- Professor: alunos, ficha, missão da sala, master (depois dos outros testes).
\set ON_ERROR_STOP on
-- o professor cria a missão; depois a Ana grava contadores: 3 mesas e 2 peixes viram eventos
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
SELECT wit2_teacher_mission_create('Vençam 5 mesas', 'mesas', 5, 'comum', 7) > 0 AS "missão criada";
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT (wit2_sync(0, '{"towerMax": 2, "stats": {"mesas": 3, "peixes": 2}}', (wit2_load()->>'version')::int)->>'ok')::boolean AS "sync com contadores";
SELECT (SELECT sum(value) FROM wit2_events WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND kind = 'stat:mesas') = 3 AS "3 mesas viram evento";
-- professor cria a missão e vê a turma
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
DO $$ BEGIN PERFORM wit2_teacher_mission_create('x', 'hackear', 5, 'comum', 7); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM NOT IN ('missão inválida', 'new row for relation "wit2_class_missions" violates check constraint "wit2_class_missions_title_check"') THEN RAISE; END IF; END $$;
SELECT jsonb_array_length(wit2_teacher_students()) = 2 AS "professor lista os 2 alunos";
SELECT (wit2_teacher_student('bbbbbbbb-0000-0000-0000-000000000001')->>'andar')::int = 2 AS "ficha da Ana";
DO $$ BEGIN PERFORM wit2_teacher_student('bbbbbbbb-0000-0000-0000-000000000003'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
DO $$ BEGIN PERFORM wit2_teacher_students('aaaaaaaa-0000-0000-0000-000000000002'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
-- a Ana ainda não pode pegar; o Beto vence 2 mesas e a turma chega a 5
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
DO $$ BEGIN PERFORM wit2_mission_claim((SELECT max(id) FROM wit2_class_missions)); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'a turma ainda não chegou lá' THEN RAISE; END IF; END $$;
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT (wit2_sync(0, '{"stats": {"mesas": 2}}', (wit2_load()->>'version')::int)->>'ok')::boolean AS "Beto grava 2 mesas";
SELECT (wit2_class_missions_mine()->0->>'progress')::int = 5 AS "turma chegou a 5";
SELECT wit2_mission_claim((SELECT max(id) FROM wit2_class_missions)) AND NOT wit2_mission_claim((SELECT max(id) FROM wit2_class_missions)) AS "pega 1 vez só";
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
DO $$ BEGIN PERFORM wit2_mission_claim((SELECT max(id) FROM wit2_class_missions)); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'missão não encontrada' THEN RAISE; END IF; END $$;
-- master pelo e-mail vê a outra turma
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
SELECT set_config('test.email', 'master@exemplo.com', false);
INSERT INTO wit2_masters VALUES ('master@exemplo.com');
SELECT wit2_is_master() AND jsonb_array_length(wit2_master_teachers()) = 2 AS "master vê os 2 professores";
SELECT jsonb_array_length(wit2_teacher_students('aaaaaaaa-0000-0000-0000-000000000002')) = 1 AS "master vê a turma do outro";
SELECT set_config('test.email', 'outro@exemplo.com', false);
SELECT NOT wit2_is_master() AND jsonb_array_length(wit2_master_teachers()) = 0 AS "quem não é master não vê";
