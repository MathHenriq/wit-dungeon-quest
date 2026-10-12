-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: social (perfil, amizades, visitas, denúncias, guilda).
--
-- Privacidade (público infantil, LGPD): o colega só vê o APELIDO do jogo, o
-- visual, o título e números do jogo. Nada de nome, e-mail ou id do aluno:
-- quem aparece para os outros é um `handle` aleatório. Tudo é limitado à
-- turma do mesmo professor (`wit2_classmate`). Escrita só por função.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── perfil público (o que os colegas veem) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_profile (
  student_id  uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  handle      text NOT NULL UNIQUE DEFAULT substr(md5(gen_random_uuid()::text), 1, 10),
  nick        text NOT NULL DEFAULT 'Desafiante' CHECK (length(nick) BETWEEN 1 AND 16),
  title       text CHECK (length(title) <= 24),
  look        jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(look::text) < 4000),
  favs        text[] NOT NULL DEFAULT '{}' CHECK (cardinality(favs) <= 3),
  andar       int NOT NULL DEFAULT 1,
  caminho     text,
  muted_until timestamptz,                -- o professor silenciou o balão
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── amizades (a pediu para b; vira 'amigos' quando b aceita) ─────────────────
CREATE TABLE IF NOT EXISTS public.wit2_friends (
  a        uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  b        uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status   text NOT NULL CHECK (status IN ('pedido','amigos')),
  at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (a, b),
  CHECK (a <> b)
);

-- ── casa (para as visitas dos amigos) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_house (
  student_id  uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  layout      jsonb NOT NULL CHECK (octet_length(layout::text) < 60000),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── denúncias (caem na fila do professor do denunciado) ──────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_reports (
  id           bigserial PRIMARY KEY,
  reporter     uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  target       uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reason       text NOT NULL CHECK (reason IN ('apelido','balao','troca','outro')),
  at           timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  action       text CHECK (action IN ('ok','silenciar','apelido'))
);

-- ── guilda ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_guilds (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (length(name) BETWEEN 3 AND 20),
  code        text NOT NULL UNIQUE,
  emblem      int NOT NULL DEFAULT 0 CHECK (emblem BETWEEN 0 AND 11),
  boss_week   date NOT NULL DEFAULT date_trunc('week', now())::date,
  boss_hp     int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wit2_guild_members (
  guild_id    uuid NOT NULL REFERENCES public.wit2_guilds(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'membro' CHECK (role IN ('lider','membro')),
  mentor      uuid REFERENCES public.students(id) ON DELETE SET NULL,
  hits_week   int NOT NULL DEFAULT 0,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, student_id)
);
-- prêmio do chefe da semana: um por aluno por semana
CREATE TABLE IF NOT EXISTS public.wit2_guild_rewards (
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week        date NOT NULL,
  PRIMARY KEY (student_id, week)
);

-- tudo fechado para leitura direta: o jogo lê pelas funções (que só devolvem
-- apelido, visual e números do jogo)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['wit2_profile','wit2_friends','wit2_house','wit2_reports','wit2_guilds','wit2_guild_members','wit2_guild_rewards']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- ═══ internas ════════════════════════════════════════════════════════════════

-- mesmo professor = mesma turma
CREATE OR REPLACE FUNCTION public.wit2_classmate(p_a uuid, p_b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM students x JOIN students y ON y.teacher_id = x.teacher_id
                 WHERE x.id = p_a AND y.id = p_b AND x.teacher_id IS NOT NULL);
$$;

CREATE OR REPLACE FUNCTION public.wit2_by_handle(p_handle text) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT student_id FROM wit2_profile WHERE handle = p_handle;
$$;

-- apelido: letras (com acento), números e espaço; sem palavrão da lista
CREATE OR REPLACE FUNCTION public.wit2_nick_ok(p text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT p ~ '^[A-Za-zÀ-ÿ0-9 ]{2,16}$'
     AND lower(translate(p, 'ÀÁÂÃÉÊÍÓÔÕÚÇàáâãéêíóôõúç013457', 'AAAAEEIOOOUCaaaaeeiooouc0ieast'))
         !~ '(merd|bost|porr|caralh|puta|put4|fod|cuz|buce|piroc|viad|otari|idiot|burr|lix[oa]|retardad|xot|pint[oa]|cacet|desgra|arromb)';
$$;

CREATE OR REPLACE FUNCTION public.wit2_public(p_student uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('handle', handle, 'nick', nick, 'title', title, 'look', look, 'favs', to_jsonb(favs),
    'andar', andar, 'caminho', caminho,
    'guilda', (SELECT g.name FROM wit2_guild_members m JOIN wit2_guilds g ON g.id = m.guild_id WHERE m.student_id = p_student))
  FROM wit2_profile WHERE student_id = p_student;
$$;

-- chefe da guilda da semana: vida = 30 por membro (cada vitória na Torre tira 1)
CREATE OR REPLACE FUNCTION public.wit2_guild_week(p_guild uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE wk date := date_trunc('week', now())::date;
BEGIN
  UPDATE wit2_guilds SET boss_week = wk,
    boss_hp = 30 * greatest(1, (SELECT count(*) FROM wit2_guild_members WHERE guild_id = p_guild))
    WHERE id = p_guild AND boss_week <> wk;
  IF FOUND THEN UPDATE wit2_guild_members SET hits_week = 0 WHERE guild_id = p_guild; END IF;
END $$;

-- ═══ do aluno ════════════════════════════════════════════════════════════════

-- meu perfil público (cria na primeira vez) e o handle
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
    'sala', (SELECT teacher_id FROM students WHERE id = me));
END $$;

-- cartão de um colega da turma (pelo handle que veio na presença)
CREATE OR REPLACE FUNCTION public.wit2_profile_of(p_handle text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF other IS NULL OR NOT wit2_classmate(me, other) THEN RETURN NULL; END IF;
  RETURN wit2_public(other) || jsonb_build_object('amizade',
    (SELECT CASE WHEN status = 'amigos' THEN 'amigos' WHEN a = me THEN 'enviado' ELSE 'recebido' END
     FROM wit2_friends WHERE (a = me AND b = other) OR (a = other AND b = me)));
END $$;

CREATE OR REPLACE FUNCTION public.wit2_friend_request(p_handle text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF other IS NULL OR other = me OR NOT wit2_classmate(me, other) THEN RAISE EXCEPTION 'colega não encontrado'; END IF;
  -- o outro já tinha pedido: vira amizade
  UPDATE wit2_friends SET status = 'amigos', at = now() WHERE a = other AND b = me AND status = 'pedido';
  IF FOUND THEN RETURN 'amigos'; END IF;
  IF (SELECT count(*) FROM wit2_friends WHERE a = me AND status = 'pedido') >= 20 THEN RAISE EXCEPTION 'pedidos demais'; END IF;
  INSERT INTO wit2_friends (a, b, status) VALUES (me, other, 'pedido') ON CONFLICT DO NOTHING;
  RETURN 'enviado';
END $$;

-- aceitar (true) ou recusar/desfazer (false)
CREATE OR REPLACE FUNCTION public.wit2_friend_answer(p_handle text, p_ok boolean) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_ok THEN
    UPDATE wit2_friends SET status = 'amigos', at = now() WHERE a = other AND b = me AND status = 'pedido';
    RETURN CASE WHEN FOUND THEN 'amigos' ELSE 'nada' END;
  END IF;
  DELETE FROM wit2_friends WHERE (a = me AND b = other) OR (a = other AND b = me);
  RETURN 'removido';
END $$;

CREATE OR REPLACE FUNCTION public.wit2_friends_list() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((
    SELECT jsonb_agg(wit2_public(CASE WHEN f.a = me THEN f.b ELSE f.a END)
      || jsonb_build_object('estado', CASE WHEN f.status = 'amigos' THEN 'amigos' WHEN f.a = me THEN 'enviado' ELSE 'recebido' END)
      ORDER BY f.status, f.at DESC)
    FROM wit2_friends f WHERE (f.a = me OR f.b = me)
      AND EXISTS (SELECT 1 FROM wit2_profile WHERE student_id = CASE WHEN f.a = me THEN f.b ELSE f.a END)), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_save_house(p_layout jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  INSERT INTO wit2_house (student_id, layout) VALUES (me, p_layout)
    ON CONFLICT (student_id) DO UPDATE SET layout = EXCLUDED.layout, updated_at = now();
  RETURN true;
END $$;

-- visita: só a casa de um amigo
CREATE OR REPLACE FUNCTION public.wit2_visit(p_handle text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM wit2_friends WHERE status = 'amigos' AND ((a = me AND b = other) OR (a = other AND b = me))) THEN
    RAISE EXCEPTION 'só amigos visitam';
  END IF;
  RETURN jsonb_build_object('layout', (SELECT layout FROM wit2_house WHERE student_id = other), 'dono', wit2_public(other));
END $$;

CREATE OR REPLACE FUNCTION public.wit2_report(p_handle text, p_reason text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF other IS NULL OR NOT wit2_classmate(me, other) THEN RAISE EXCEPTION 'colega não encontrado'; END IF;
  -- uma denúncia aberta por par basta
  IF EXISTS (SELECT 1 FROM wit2_reports WHERE reporter = me AND target = other AND resolved_at IS NULL) THEN RETURN true; END IF;
  INSERT INTO wit2_reports (reporter, target, reason) VALUES (me, other, p_reason);
  RETURN true;
END $$;

-- ── guilda ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.wit2_guild_create(p_name text, p_emblem int) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); g uuid; v_code text; alphabet CONSTANT text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int; name text := btrim(p_name);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM wit2_guild_members WHERE student_id = me) THEN RAISE EXCEPTION 'já está numa guilda'; END IF;
  IF NOT wit2_nick_ok(left(name, 16)) OR length(name) < 3 THEN RAISE EXCEPTION 'nome não permitido'; END IF;
  LOOP
    v_code := '';
    FOR i IN 1..5 LOOP v_code := v_code || substr(alphabet, 1 + floor(random() * 32)::int, 1); END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM wit2_guilds WHERE code = v_code);
  END LOOP;
  INSERT INTO wit2_guilds (teacher_id, name, code, emblem, boss_hp)
    VALUES ((SELECT teacher_id FROM students WHERE id = me), name, v_code, coalesce(p_emblem, 0) % 12, 30) RETURNING id INTO g;
  INSERT INTO wit2_guild_members (guild_id, student_id, role) VALUES (g, me, 'lider');
  RETURN jsonb_build_object('code', v_code);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_guild_join(p_code text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); g wit2_guilds%ROWTYPE;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT * INTO g FROM wit2_guilds WHERE code = upper(btrim(p_code));
  -- só guildas da mesma turma
  IF g.id IS NULL OR g.teacher_id IS DISTINCT FROM (SELECT teacher_id FROM students WHERE id = me) THEN RAISE EXCEPTION 'guilda não encontrada'; END IF;
  IF EXISTS (SELECT 1 FROM wit2_guild_members WHERE student_id = me) THEN RAISE EXCEPTION 'já está numa guilda'; END IF;
  IF (SELECT count(*) FROM wit2_guild_members WHERE guild_id = g.id) >= 12 THEN RAISE EXCEPTION 'guilda cheia'; END IF;
  INSERT INTO wit2_guild_members (guild_id, student_id) VALUES (g.id, me);
  UPDATE wit2_guilds SET boss_hp = boss_hp + 30 WHERE id = g.id AND boss_hp > 0;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_guild_leave() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); g uuid; was text;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  DELETE FROM wit2_guild_members WHERE student_id = me RETURNING guild_id, role INTO g, was;
  IF g IS NULL THEN RETURN false; END IF;
  UPDATE wit2_guild_members SET mentor = NULL WHERE guild_id = g AND mentor = me;
  IF NOT EXISTS (SELECT 1 FROM wit2_guild_members WHERE guild_id = g) THEN DELETE FROM wit2_guilds WHERE id = g;
  ELSIF was = 'lider' THEN
    UPDATE wit2_guild_members SET role = 'lider' WHERE guild_id = g
      AND student_id = (SELECT student_id FROM wit2_guild_members WHERE guild_id = g ORDER BY joined_at LIMIT 1);
  END IF;
  RETURN true;
END $$;

-- mentor: um colega da guilda pelo menos 5 andares acima (ou nenhum)
CREATE OR REPLACE FUNCTION public.wit2_guild_mentor(p_handle text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle); g uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO g FROM wit2_guild_members WHERE student_id = me;
  IF p_handle IS NULL THEN UPDATE wit2_guild_members SET mentor = NULL WHERE student_id = me; RETURN true; END IF;
  IF g IS NULL OR other = me OR NOT EXISTS (SELECT 1 FROM wit2_guild_members WHERE guild_id = g AND student_id = other) THEN RAISE EXCEPTION 'mentor precisa ser da guilda'; END IF;
  IF (SELECT andar FROM wit2_profile WHERE student_id = other) < coalesce((SELECT andar FROM wit2_profile WHERE student_id = me), 1) + 5 THEN
    RAISE EXCEPTION 'mentor precisa estar 5 andares acima';
  END IF;
  UPDATE wit2_guild_members SET mentor = other WHERE student_id = me;
  RETURN true;
END $$;

-- a guilda do aluno: membros, presença da semana (meta: cada um em 1 aula),
-- chefe da semana e se já pegou o prêmio
CREATE OR REPLACE FUNCTION public.wit2_guild_info() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); g wit2_guilds%ROWTYPE; wk date := date_trunc('week', now())::date;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT gg.* INTO g FROM wit2_guilds gg JOIN wit2_guild_members m ON m.guild_id = gg.id WHERE m.student_id = me;
  IF g.id IS NULL THEN RETURN NULL; END IF;
  PERFORM wit2_guild_week(g.id);
  SELECT * INTO g FROM wit2_guilds WHERE id = g.id;
  RETURN jsonb_build_object(
    'name', g.name, 'code', g.code, 'emblem', g.emblem, 'bossHp', g.boss_hp,
    'bossMax', 30 * (SELECT count(*) FROM wit2_guild_members WHERE guild_id = g.id),
    'premio', EXISTS (SELECT 1 FROM wit2_guild_rewards WHERE student_id = me AND week = wk),
    'members', (SELECT jsonb_agg(wit2_public(m.student_id) || jsonb_build_object(
        'role', m.role, 'hits', m.hits_week, 'eu', m.student_id = me,
        'mentor', (SELECT handle FROM wit2_profile WHERE student_id = m.mentor),
        'presente', EXISTS (SELECT 1 FROM wit2_attendance a JOIN wit2_lessons l ON l.id = a.lesson_id
                            WHERE a.student_id = m.student_id AND a.status <> 'faltou' AND l.day >= wk))
        ORDER BY m.role, m.joined_at)
      FROM wit2_guild_members m WHERE m.guild_id = g.id));
END $$;

-- vitória na Torre bate no chefe da guilda; derrubou: todo mundo pode pegar
-- 1 Pacotinho Comum guardado nesta semana (wit2_guild_claim)
CREATE OR REPLACE FUNCTION public.wit2_guild_hit() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); g uuid; hp int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO g FROM wit2_guild_members WHERE student_id = me;
  IF g IS NULL THEN RETURN NULL; END IF;
  PERFORM wit2_guild_week(g);
  -- no máximo 15 golpes por aluno por semana (ninguém derruba sozinho)
  UPDATE wit2_guild_members SET hits_week = hits_week + 1 WHERE student_id = me AND hits_week < 15;
  IF NOT FOUND THEN RETURN jsonb_build_object('bossHp', (SELECT boss_hp FROM wit2_guilds WHERE id = g), 'limite', true); END IF;
  UPDATE wit2_guilds SET boss_hp = greatest(0, boss_hp - 1) WHERE id = g RETURNING boss_hp INTO hp;
  RETURN jsonb_build_object('bossHp', hp);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_guild_claim() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); g uuid; wk date := date_trunc('week', now())::date;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO g FROM wit2_guild_members WHERE student_id = me;
  IF g IS NULL OR (SELECT boss_hp FROM wit2_guilds WHERE id = g AND boss_week = wk) <> 0 THEN RAISE EXCEPTION 'o chefe ainda está de pé'; END IF;
  INSERT INTO wit2_guild_rewards (student_id, week) VALUES (me, wk) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM wit2_ensure(me);
  INSERT INTO wit2_packs (student_id, pack_id, qty) VALUES (me, 'comum', 1)
    ON CONFLICT (student_id, pack_id) DO UPDATE SET qty = wit2_packs.qty + 1;
  PERFORM wit2_event(me, 'guilda', 1);
  RETURN true;
END $$;

-- mentoria: quando o aprendiz libera um andar novo, o mentor ganha 25 moedas
-- (fora do teto do dia; chamado pela carta do chefe)
CREATE OR REPLACE FUNCTION public.wit2_mentor_bonus(p_student uuid, p_andar int) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m uuid;
BEGIN
  SELECT mentor INTO m FROM wit2_guild_members WHERE student_id = p_student;
  IF m IS NULL THEN RETURN; END IF;
  IF (SELECT count(*) FROM wit2_events WHERE student_id = p_student AND kind = 'chefe' AND value = p_andar) <> 1 THEN RETURN; END IF;
  PERFORM wit2_ensure(m);
  UPDATE wit2_wallet SET coins = coins + 25 WHERE student_id = m;
  PERFORM wit2_event(m, 'mentoria', 25);
END $$;

-- a carta do chefe passa a avisar o mentor (mesma função do core + 1 linha)
CREATE OR REPLACE FUNCTION public.wit2_boss_card(p_andar int, p_card text) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); top int; n int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM wit2_boss_cards WHERE andar = p_andar AND card_id = p_card) THEN RAISE EXCEPTION 'carta não é do chefe'; END IF;
  PERFORM wit2_ensure(me);
  PERFORM 1 FROM wit2_wallet WHERE student_id = me FOR UPDATE;
  SELECT coalesce((data->>'towerMax')::int, 1) INTO top FROM wit2_progress WHERE student_id = me;
  IF p_andar > top THEN RAISE EXCEPTION 'andar ainda trancado'; END IF;
  IF EXISTS (SELECT 1 FROM wit2_events WHERE student_id = me AND kind = 'chefe' AND at > now() - interval '60 seconds') THEN
    PERFORM wit2_event(me, 'suspeita', p_andar);
    RAISE EXCEPTION 'devagar';
  END IF;
  n := wit2_add_card(me, p_card, 1);
  PERFORM wit2_event(me, 'chefe', p_andar);
  PERFORM wit2_mentor_bonus(me, p_andar);
  RETURN n;
END $$;

-- ═══ professor ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.wit2_teacher_reports() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', r.id, 'reason', r.reason, 'at', r.at,
      'alvo', coalesce(t.character_name, t.name), 'alvoApelido', (SELECT nick FROM wit2_profile WHERE student_id = r.target),
      'quem', coalesce(f.character_name, f.name)) ORDER BY r.at DESC)
    FROM wit2_reports r JOIN students t ON t.id = r.target JOIN students f ON f.id = r.reporter
    WHERE t.teacher_id = me AND r.resolved_at IS NULL), '[]'::jsonb);
END $$;

-- 'ok' (nada), 'silenciar' (balão desligado por 7 dias), 'apelido' (volta para "Desafiante")
CREATE OR REPLACE FUNCTION public.wit2_teacher_resolve(p_report bigint, p_action text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id(); tg uuid;
BEGIN
  IF me IS NULL OR p_action NOT IN ('ok','silenciar','apelido') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT r.target INTO tg FROM wit2_reports r JOIN students s ON s.id = r.target WHERE r.id = p_report AND s.teacher_id = me;
  IF tg IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  UPDATE wit2_reports SET resolved_at = now(), action = p_action WHERE target = tg AND resolved_at IS NULL;
  IF p_action = 'silenciar' THEN UPDATE wit2_profile SET muted_until = now() + interval '7 days' WHERE student_id = tg; END IF;
  IF p_action = 'apelido' THEN UPDATE wit2_profile SET nick = 'Desafiante' WHERE student_id = tg; END IF;
  RETURN true;
END $$;

-- ── canais em tempo real (cidade compartilhada, PvP): só a própria turma ─────
-- Os canais do jogo são privados e se chamam 'wit2-<id do professor>-...';
-- quem não é aluno daquele professor não entra nem escuta.
DO $$
BEGIN
  IF to_regclass('realtime.messages') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS wit2_turma_le ON realtime.messages';
    EXECUTE 'DROP POLICY IF EXISTS wit2_turma_manda ON realtime.messages';
    EXECUTE $p$CREATE POLICY wit2_turma_le ON realtime.messages FOR SELECT TO authenticated
      USING (realtime.topic() LIKE 'wit2-' || (SELECT teacher_id::text FROM public.students WHERE user_id = auth.uid() LIMIT 1) || '-%')$p$;
    EXECUTE $p$CREATE POLICY wit2_turma_manda ON realtime.messages FOR INSERT TO authenticated
      WITH CHECK (realtime.topic() LIKE 'wit2-' || (SELECT teacher_id::text FROM public.students WHERE user_id = auth.uid() LIMIT 1) || '-%')$p$;
  END IF;
END $$;

-- ── quem pode chamar o quê ───────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.wit2_classmate(uuid, uuid), public.wit2_by_handle(text), public.wit2_public(uuid),
  public.wit2_guild_week(uuid), public.wit2_mentor_bonus(uuid, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION
  public.wit2_nick_ok(text), public.wit2_set_profile(text, text, jsonb, text[]), public.wit2_profile_of(text),
  public.wit2_friend_request(text), public.wit2_friend_answer(text, boolean), public.wit2_friends_list(),
  public.wit2_save_house(jsonb), public.wit2_visit(text), public.wit2_report(text, text),
  public.wit2_guild_create(text, int), public.wit2_guild_join(text), public.wit2_guild_leave(), public.wit2_guild_mentor(text),
  public.wit2_guild_info(), public.wit2_guild_hit(), public.wit2_guild_claim(), public.wit2_boss_card(int, text),
  public.wit2_teacher_reports(), public.wit2_teacher_resolve(bigint, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.wit2_nick_ok(text), public.wit2_set_profile(text, text, jsonb, text[]), public.wit2_profile_of(text),
  public.wit2_friend_request(text), public.wit2_friend_answer(text, boolean), public.wit2_friends_list(),
  public.wit2_save_house(jsonb), public.wit2_visit(text), public.wit2_report(text, text),
  public.wit2_guild_create(text, int), public.wit2_guild_join(text), public.wit2_guild_leave(), public.wit2_guild_mentor(text),
  public.wit2_guild_info(), public.wit2_guild_hit(), public.wit2_guild_claim(), public.wit2_boss_card(int, text),
  public.wit2_teacher_reports(), public.wit2_teacher_resolve(bigint, text)
TO authenticated;

COMMIT;
