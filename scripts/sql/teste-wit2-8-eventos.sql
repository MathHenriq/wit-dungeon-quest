-- Votação da turma e Carta da Aula (depois de teste-wit2.sql: a aula de hoje já foi entregue,
-- Ana excepcional e Beto fora da lista).
\set ON_ERROR_STOP on
SELECT set_config('test.email', '', false);
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
DO $$ BEGIN PERFORM wit2_teacher_vote_open(ARRAY['dragoes'], 3); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'votação inválida' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_teacher_vote_open(ARRAY['Dragões!', 'robos'], 3); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'votação inválida' THEN RAISE; END IF; END $$;
SELECT wit2_teacher_vote_open(ARRAY['dragoes', 'robos', 'oceano'], 3) > 0 AS "professor abre votação";
-- alunos votam (e trocam o voto)
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT (wit2_vote_current()->>'aberta')::boolean AS "aluno vê a votação aberta";
SELECT wit2_vote_cast((wit2_vote_current()->>'id')::bigint, 'robos')->>'meu' = 'robos' AS "vota";
SELECT (wit2_vote_cast((wit2_vote_current()->>'id')::bigint, 'oceano')->>'total')::int = 1 AS "troca o voto sem contar 2 vezes";
DO $$ BEGIN PERFORM wit2_vote_cast((wit2_vote_current()->>'id')::bigint, 'espaco'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'votação fechada' THEN RAISE; END IF; END $$;
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT (wit2_vote_cast((wit2_vote_current()->>'id')::bigint, 'oceano')->'votos'->>'oceano')::int = 2 AS "contagem por tema";
-- professor fecha; ninguém vota mais
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
SELECT wit2_teacher_vote_close((wit2_teacher_votes()->0->>'id')::bigint) AS "fecha a votação";
SELECT NOT (wit2_teacher_votes()->0->>'aberta')::boolean AS "fechada para o professor";
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
DO $$ BEGIN PERFORM wit2_vote_cast((wit2_vote_current()->>'id')::bigint, 'robos'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'votação fechada' THEN RAISE; END IF; END $$;
-- Carta da Aula
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
CREATE TEMP TABLE ca AS SELECT (SELECT id FROM wit2_card_catalog WHERE base AND rarity = 'common' ORDER BY id LIMIT 1) AS c,
  (SELECT id FROM wit2_card_catalog WHERE base AND rarity = 'epic' ORDER BY id LIMIT 1) AS e,
  coalesce((SELECT qty FROM wit2_cards WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001'
    AND card_id = (SELECT id FROM wit2_card_catalog WHERE base AND rarity = 'common' ORDER BY id LIMIT 1)), 0) AS antes;
DO $$ BEGIN PERFORM wit2_teacher_lesson_card((wit2_teacher_lesson(current_date)->>'lesson')::uuid, (SELECT e FROM ca)); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'carta inválida para a aula' THEN RAISE; END IF; END $$;
SELECT wit2_teacher_lesson_card((wit2_teacher_lesson(current_date)->>'lesson')::uuid, (SELECT c FROM ca)) = 1 AS "carta da aula só para quem veio";
SELECT wit2_teacher_lesson_card((wit2_teacher_lesson(current_date)->>'lesson')::uuid, (SELECT c FROM ca)) = 0 AS "de novo não dá outra";
SELECT (SELECT qty FROM wit2_cards WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND card_id = (SELECT c FROM ca)) = (SELECT antes FROM ca) + 1 AS "Ana ganhou 1 cópia";
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT wit2_lesson_cards_mine()->0->>'card' = (SELECT c FROM ca) AS "Ana vê a Carta da Aula";
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT jsonb_array_length(wit2_lesson_cards_mine()) = 0 AS "Beto (fora da aula) não ganhou";
SELECT set_config('test.uid', '', false);
