-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: o lado social todo é global (pedido do Matheus em 09/10) e os 3
-- rankings do Salão dos Campeões (Arena): guildas, PvP e jogadores.
--
-- Global agora (qualquer aluno, de qualquer professor):
--   amizade e visita, trocas, vitrine de cartas, guilda (entrar pelo código),
--   mural e fases do fliperama, ranking do PvP.
-- Continua por turma, de propósito:
--   * tudo do professor (alunos, login, senha, aula, missões, votação, moderação):
--     o professor só mexe nos alunos dele; a denúncia e a foto do mural vão para
--     o professor de quem fez;
--   * o Mercado de itens dos moradores (wit2_market_*): o preço cai conforme a
--     turma vende; com a escola inteira vendendo, cairia rápido demais para todos.
-- Contas de teste (students.is_test_account) não entram nos rankings.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- "colega" passa a ser qualquer aluno: amizade, visita, trocas e compra na vitrine
-- usam esta função para conferir o outro lado
CREATE OR REPLACE FUNCTION public.wit2_classmate(p_a uuid, p_b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM students WHERE id = p_a) AND EXISTS (SELECT 1 FROM students WHERE id = p_b);
$$;

-- guilda: entra pelo código, de qualquer turma
CREATE OR REPLACE FUNCTION public.wit2_guild_join(p_code text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); g wit2_guilds%ROWTYPE;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT * INTO g FROM wit2_guilds WHERE code = upper(btrim(p_code));
  IF g.id IS NULL THEN RAISE EXCEPTION 'guilda não encontrada'; END IF;
  IF EXISTS (SELECT 1 FROM wit2_guild_members WHERE student_id = me) THEN RAISE EXCEPTION 'já está numa guilda'; END IF;
  IF (SELECT count(*) FROM wit2_guild_members WHERE guild_id = g.id) >= 12 THEN RAISE EXCEPTION 'guilda cheia'; END IF;
  INSERT INTO wit2_guild_members (guild_id, student_id) VALUES (g.id, me);
  UPDATE wit2_guilds SET boss_hp = boss_hp + 30 WHERE id = g.id AND boss_hp > 0;
  RETURN true;
END $$;

-- vitrine: o que todos estão vendendo (as minhas marcadas)
CREATE OR REPLACE FUNCTION public.wit2_vitrine() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'card', l.card_id, 'price', l.price, 'minha', l.seller = me,
      'nick', (SELECT nick FROM wit2_profile WHERE student_id = l.seller), 'at', l.at) ORDER BY l.at DESC)
    FROM (SELECT * FROM wit2_listings WHERE NOT closed ORDER BY at DESC LIMIT 120) l), '[]'::jsonb);
END $$;

-- mural de todos (o que já pode aparecer) + as minhas (mesmo esperando aprovação)
CREATE OR REPLACE FUNCTION public.wit2_mural() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'frase', p.frase, 'foto', p.foto, 'fase', p.fase,
      'titulo', p.titulo, 'plays', p.plays, 'at', p.at, 'minha', p.student_id = me, 'esperando', NOT p.approved,
      'nick', (SELECT nick FROM wit2_profile WHERE student_id = p.student_id),
      'handle', (SELECT handle FROM wit2_profile WHERE student_id = p.student_id)) ORDER BY p.at DESC)
    FROM (SELECT * FROM wit2_posts WHERE NOT hidden AND (approved OR student_id = me)
          ORDER BY at DESC LIMIT 40) p), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_level_played(p_id bigint) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE wit2_posts SET plays = plays + 1 WHERE id = p_id AND kind = 'fase' AND approved AND NOT hidden
    AND my_student_id() IS NOT NULL;
$$;

-- ═══ rankings (Salão dos Campeões) ═══════════════════════════════════════════
-- Cada um devolve { top: [...até 50], eu: {...posição} | null }.

-- jogadores: maior andar da Torre; desempate, mais cartas diferentes na coleção
CREATE OR REPLACE FUNCTION public.wit2_rank_players() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN (WITH r AS (
      SELECT p.student_id, p.handle, p.nick, p.title, p.look, p.andar,
             (SELECT count(*) FROM wit2_cards c WHERE c.student_id = p.student_id AND c.qty > 0) AS cartas,
             (SELECT g.name FROM wit2_guild_members m JOIN wit2_guilds g ON g.id = m.guild_id WHERE m.student_id = p.student_id) AS guilda
      FROM wit2_profile p JOIN students s ON s.id = p.student_id
      WHERE NOT coalesce(s.is_test_account, false)
    ), o AS (
      SELECT r.*, rank() OVER (ORDER BY andar DESC, cartas DESC) AS pos,
             row_number() OVER (ORDER BY andar DESC, cartas DESC, nick) AS n
      FROM r
    )
    SELECT jsonb_build_object(
      'top', coalesce((SELECT jsonb_agg(jsonb_build_object('pos', pos, 'handle', handle, 'nick', nick, 'title', title, 'look', look,
               'andar', andar, 'cartas', cartas, 'guilda', guilda, 'eu', student_id = me) ORDER BY n) FROM o WHERE n <= 50), '[]'::jsonb),
      'eu', (SELECT jsonb_build_object('pos', pos, 'andar', andar, 'cartas', cartas) FROM o WHERE student_id = me),
      'total', (SELECT count(*) FROM o)));
END $$;

-- PvP: vitórias confirmadas (as duas pontas concordaram); também as da semana
CREATE OR REPLACE FUNCTION public.wit2_rank_pvp() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); wk timestamptz := date_trunc('week', now());
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN (WITH w AS (
      SELECT winner AS student_id, count(*) AS vitorias, count(*) FILTER (WHERE at >= wk) AS semana
      FROM wit2_pvp_matches WHERE winner IS NOT NULL GROUP BY winner
    ), d AS (
      SELECT x.student_id, count(*) AS duelos FROM (
        SELECT a AS student_id FROM wit2_pvp_matches WHERE winner IS NOT NULL
        UNION ALL SELECT b FROM wit2_pvp_matches WHERE winner IS NOT NULL) x GROUP BY x.student_id
    ), o AS (
      SELECT w.*, d.duelos, p.handle, p.nick, p.title, p.look,
             rank() OVER (ORDER BY w.vitorias DESC, w.semana DESC) AS pos,
             row_number() OVER (ORDER BY w.vitorias DESC, w.semana DESC, p.nick) AS n
      FROM w JOIN d USING (student_id) JOIN wit2_profile p USING (student_id) JOIN students s ON s.id = w.student_id
      WHERE NOT coalesce(s.is_test_account, false)
    )
    SELECT jsonb_build_object(
      'top', coalesce((SELECT jsonb_agg(jsonb_build_object('pos', pos, 'handle', handle, 'nick', nick, 'title', title, 'look', look,
               'vitorias', vitorias, 'semana', semana, 'duelos', duelos, 'eu', student_id = me) ORDER BY n) FROM o WHERE n <= 50), '[]'::jsonb),
      'eu', (SELECT jsonb_build_object('pos', pos, 'vitorias', vitorias, 'semana', semana) FROM o WHERE student_id = me),
      'total', (SELECT count(*) FROM o)));
END $$;

-- o ranking antigo do PvP (da turma) passa a ser o global
CREATE OR REPLACE FUNCTION public.wit2_pvp_ranking() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT jsonb_agg(jsonb_build_object('nick', e->>'nick', 'handle', e->>'handle', 'vitorias', (e->>'vitorias')::int, 'eu', (e->>'eu')::boolean))
    FROM jsonb_array_elements(wit2_rank_pvp()->'top') e), '[]'::jsonb);
$$;

-- guildas: golpes no chefe da guilda nesta semana (cada vitória na Torre de um
-- membro é 1 golpe); desempate, quem tem mais membros
CREATE OR REPLACE FUNCTION public.wit2_rank_guilds() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); wk date := date_trunc('week', now())::date; mine uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO mine FROM wit2_guild_members WHERE student_id = me;
  RETURN (WITH r AS (
      SELECT g.id, g.name, g.emblem,
             count(m.student_id) AS membros,
             CASE WHEN g.boss_week = wk THEN coalesce(sum(m.hits_week), 0) ELSE 0 END AS golpes,
             (g.boss_week = wk AND g.boss_hp = 0) AS chefe_caiu
      FROM wit2_guilds g JOIN wit2_guild_members m ON m.guild_id = g.id
      GROUP BY g.id
    ), o AS (
      SELECT r.*, rank() OVER (ORDER BY golpes DESC, membros DESC) AS pos,
             row_number() OVER (ORDER BY golpes DESC, membros DESC, name) AS n
      FROM r
    )
    SELECT jsonb_build_object(
      'top', coalesce((SELECT jsonb_agg(jsonb_build_object('pos', pos, 'name', name, 'emblem', emblem, 'membros', membros,
               'golpes', golpes, 'chefeCaiu', chefe_caiu, 'minha', id = mine) ORDER BY n) FROM o WHERE n <= 30), '[]'::jsonb),
      'eu', (SELECT jsonb_build_object('pos', pos, 'golpes', golpes, 'name', name) FROM o WHERE id = mine),
      'total', (SELECT count(*) FROM o)));
END $$;

REVOKE ALL ON FUNCTION public.wit2_rank_players(), public.wit2_rank_pvp(), public.wit2_rank_guilds() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wit2_rank_players(), public.wit2_rank_pvp(), public.wit2_rank_guilds() TO authenticated;

COMMIT;
