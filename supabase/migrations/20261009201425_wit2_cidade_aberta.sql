-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: cidade e PvP abertos para TODOS os alunos (pedido do Matheus em 09/10).
--
-- Antes: cada turma tinha os próprios canais ('wit2-<professor>-...'), e só
-- colegas do mesmo professor se viam na cidade, no balão e nas mesas da Arena.
-- Agora: um canal só para todos os alunos logados ('wit2-todos-...'). A cidade
-- fica cheia: quem está online aparece, de qualquer professor.
--
-- Continua igual:
--  * professor só administra os alunos dele (ficha, login, senha, presença);
--  * denúncia vai para o professor do aluno DENUNCIADO (wit2_teacher_reports);
--  * na cidade só aparecem apelido, título e visual; o balão só tem frases
--    prontas (src/game/presence.ts). Nada de texto livre nem dado pessoal;
--  * amizade, visita, trocas, vitrine, guilda e mural: abertos depois, em
--    _wit2_tudo_global.sql.
--
-- Policies do Realtime: só criar (o Supabase não deixa alterar nem apagar lá).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- o jogo usa 'sala' só para montar o nome do canal: todo aluno vai para o mesmo
CREATE OR REPLACE FUNCTION public.wit2_set_profile(p_nick text, p_title text, p_look jsonb, p_favs text[]) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); nick text := btrim(p_nick); top int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF NOT wit2_nick_ok(nick) THEN RAISE EXCEPTION 'apelido não permitido'; END IF;
  SELECT coalesce((data->>'towerMax')::int, 1) INTO top FROM wit2_progress WHERE student_id = me;
  INSERT INTO wit2_profile (student_id, nick, title, look, favs, andar, caminho)
  VALUES (me, nick, left(p_title, 24), coalesce(p_look, '{}'), coalesce(p_favs[1:3], '{}'), coalesce(top, 1),
          (SELECT caminho FROM wit2_wallet WHERE student_id = me))
  ON CONFLICT (student_id) DO UPDATE SET nick = EXCLUDED.nick, title = EXCLUDED.title, look = EXCLUDED.look,
    favs = EXCLUDED.favs, andar = EXCLUDED.andar, caminho = EXCLUDED.caminho, updated_at = now();
  RETURN jsonb_build_object('handle', (SELECT handle FROM wit2_profile WHERE student_id = me),
    'muted', coalesce((SELECT muted_until > now() FROM wit2_profile WHERE student_id = me), false),
    'sala', 'todos');
END $$;

-- cartão de qualquer aluno que aparece na cidade (pelo handle da presença)
CREATE OR REPLACE FUNCTION public.wit2_profile_of(p_handle text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF other IS NULL THEN RETURN NULL; END IF;
  RETURN wit2_public(other) || jsonb_build_object('amizade',
    (SELECT CASE WHEN status = 'amigos' THEN 'amigos' WHEN a = me THEN 'enviado' ELSE 'recebido' END
     FROM wit2_friends WHERE (a = me AND b = other) OR (a = other AND b = me)));
END $$;

-- denunciar qualquer aluno que se vê; vai para o professor dele
CREATE OR REPLACE FUNCTION public.wit2_report(p_handle text, p_reason text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF other IS NULL OR other = me THEN RAISE EXCEPTION 'colega não encontrado'; END IF;
  -- uma denúncia aberta por par basta
  IF EXISTS (SELECT 1 FROM wit2_reports WHERE reporter = me AND target = other AND resolved_at IS NULL) THEN RETURN true; END IF;
  INSERT INTO wit2_reports (reporter, target, reason) VALUES (me, other, p_reason);
  RETURN true;
END $$;

-- placar do PvP: duelo entre alunos de qualquer professor
CREATE OR REPLACE FUNCTION public.wit2_pvp_report(p_key text, p_opp text, p_won boolean) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_opp); m wit2_pvp_matches%ROWTYPE;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF other IS NULL OR other = me THEN RAISE EXCEPTION 'colega não encontrado'; END IF;
  INSERT INTO wit2_pvp_matches (key, a, b) VALUES (p_key, me, other) ON CONFLICT (key) DO NOTHING;
  SELECT * INTO m FROM wit2_pvp_matches WHERE key = p_key FOR UPDATE;
  IF NOT ((m.a = me AND m.b = other) OR (m.a = other AND m.b = me)) THEN RAISE EXCEPTION 'partida não é sua'; END IF;
  IF m.a = me THEN m.a_says := coalesce(m.a_says, p_won); ELSE m.b_says := coalesce(m.b_says, p_won); END IF;
  m.winner := CASE WHEN m.a_says AND m.b_says IS FALSE THEN m.a WHEN m.b_says AND m.a_says IS FALSE THEN m.b ELSE NULL END;
  UPDATE wit2_pvp_matches SET a_says = m.a_says, b_says = m.b_says, winner = m.winner WHERE key = p_key;
  RETURN m.winner IS NOT NULL;
END $$;

-- canais em tempo real (cidade, balão, mesas da Arena): todo aluno logado entra
-- nos 'wit2-todos-...'; professor e anônimo não. my_student_id() é SECURITY DEFINER.
-- Policies NOVAS: no Supabase dá para criar policy em realtime.messages, mas não
-- alterar nem apagar (a tabela é do supabase_realtime_admin). As antigas
-- wit2_turma_* ficam: só liberam o canal 'wit2-<professor>-...', que o jogo não usa mais.
DO $$
BEGIN
  IF to_regclass('realtime.messages') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'realtime' AND tablename = 'messages' AND policyname = 'wit2_todos_le') THEN
      EXECUTE $p$CREATE POLICY wit2_todos_le ON realtime.messages FOR SELECT TO authenticated
        USING (realtime.topic() LIKE 'wit2-todos-%' AND public.my_student_id() IS NOT NULL)$p$;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'realtime' AND tablename = 'messages' AND policyname = 'wit2_todos_manda') THEN
      EXECUTE $p$CREATE POLICY wit2_todos_manda ON realtime.messages FOR INSERT TO authenticated
        WITH CHECK (realtime.topic() LIKE 'wit2-todos-%' AND public.my_student_id() IS NOT NULL)$p$;
    END IF;
  END IF;
END $$;

COMMIT;
