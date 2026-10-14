-- Metas das guildas (_wit2_guild_metas.sql). Roda depois de teste-wit2-cidade.sql:
-- Ana e Beto na guilda "Os Brabos" (o chefe da semana já caiu em teste-wit2-1-social.sql).
\set ON_ERROR_STOP on
SELECT set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
SELECT jsonb_array_length(wit2_guild_goals()->'metas') = 8 AS "8 metas na semana";
SELECT (SELECT (m->>'feita')::boolean FROM jsonb_array_elements(wit2_guild_goals()->'metas') m WHERE m->>'id' = 'chefe') AS "chefe derrubado: meta cumprida";
SELECT (SELECT (m->>'valor')::int FROM jsonb_array_elements(wit2_guild_goals()->'metas') m WHERE m->>'id' = 'pvp') = 1 AS "PvP: a vitória confirmada da Ana conta";
SELECT (wit2_guild_goals()->>'pontos')::int = 40 AS "pontos = metas cumpridas";
SELECT (wit2_guild_goal_claim('chefe')->>'pack') = 'raro' AS "resgata o pacotinho da meta";
SELECT (SELECT qty FROM wit2_packs WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND pack_id = 'raro') = 1 AS "pacotinho guardado";
DO $$ BEGIN PERFORM wit2_guild_goal_claim('chefe'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'já resgatou' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_guild_goal_claim('pvp'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'meta ainda não cumprida' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM wit2_guild_goal_claim('nada'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN others THEN IF SQLERRM <> 'meta não existe' THEN RAISE; END IF; END $$;
-- andares: cada andar novo da Torre vira evento (no máximo 3 por gravação)
UPDATE wit2_progress SET data = jsonb_set(data, '{towerMax}', '1') WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
UPDATE wit2_progress SET data = jsonb_set(data, '{towerMax}', '3') WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
UPDATE wit2_progress SET data = jsonb_set(data, '{towerMax}', '12') WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000001';
SELECT (SELECT sum(value) FROM wit2_events WHERE kind = 'andar' AND student_id = 'bbbbbbbb-0000-0000-0000-000000000001') = 5 AS "andares: 2 + 3 (teto por gravação)";
SELECT (SELECT (m->>'feita')::boolean FROM jsonb_array_elements(wit2_guild_goals()->'metas') m WHERE m->>'id' = 'andares') AS "subir 5 andares: cumprida";
SELECT (wit2_guild_goals()->>'pontos')::int = 60 AS "pontos somam (40 + 20)";
-- o Beto resgata a dele também (cada membro, 1 por meta)
SELECT set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
SELECT (wit2_guild_goal_claim('andares')->>'pack') = 'comum' AS "cada membro resgata o seu";
-- quem entra depois não traz o que fez antes de entrar
SELECT set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
INSERT INTO wit2_events (student_id, kind, value, at) VALUES ('bbbbbbbb-0000-0000-0000-000000000003', 'stat:peixes', 30, now() - interval '1 minute');
CREATE TEMP TABLE antes AS SELECT valor FROM wit2_guild_goal_state((SELECT id FROM wit2_guilds LIMIT 1)) WHERE goal_id = 'peixes';
SELECT wit2_guild_join((SELECT code FROM wit2_guilds LIMIT 1)) AS "Caio entra";
SELECT (SELECT (m->>'valor')::int FROM jsonb_array_elements(wit2_guild_goals()->'metas') m WHERE m->>'id' = 'peixes') = (SELECT valor FROM antes) AS "peixes de antes de entrar não contam";
INSERT INTO wit2_events (student_id, kind, value) VALUES ('bbbbbbbb-0000-0000-0000-000000000003', 'stat:peixes', 4);
SELECT (SELECT (m->>'valor')::int FROM jsonb_array_elements(wit2_guild_goals()->'metas') m WHERE m->>'id' = 'peixes') = least(40, (SELECT valor FROM antes) + 4) AS "os de depois contam";
SELECT wit2_guild_leave() AS "Caio sai";
-- ranking das guildas pelos pontos
SELECT (wit2_rank_guilds()->'top'->0->>'pontos')::int = 60 AND (wit2_rank_guilds()->'top'->0->>'metas')::int = 2 AS "ranking: pontos e metas cumpridas";
SELECT (wit2_rank_guilds()->'top'->0->>'totalMetas')::int = 8 AS "ranking: total de metas";
-- de fora: as funções internas fechadas
SELECT NOT has_function_privilege('authenticated', 'public.wit2_guild_goal_state(uuid)', 'EXECUTE') AS "estado das metas: só pelo servidor";
