-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: metas das guildas (pedido do Matheus em 09/10).
--
-- Toda semana (zera na segunda, como o chefe da guilda) cada guilda tem as
-- mesmas metas: vencer duelos no PvP, subir andares da Torre, terminar
-- trabalhos... Cada meta cumprida vale pontos; o ranking das guildas é a soma.
-- Cada membro resgata 1 pacotinho por meta cumprida (uma vez por semana).
--
-- Conta só o que o membro fez DEPOIS de entrar na guilda (trocar de guilda
-- não leva os pontos junto) e só o que o servidor registra:
--   pvp      vitórias confirmadas pelos dois lados (wit2_pvp_matches)
--   andar    andares novos da Torre (evento 'andar', gatilho abaixo)
--   trabalho entregas + minijogos de profissão (eventos do wit2_sync)
--   aula     presenças na aula marcadas pelo professor (wit2_attendance)
--   chefe    o chefe da guilda desta semana caiu
--   stat:*   os outros contadores do jogo (peixes, colheitas, mesas...)
-- As metas ficam numa tabela: mudar número, pontos ou pacotinho é um UPDATE.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE IF NOT EXISTS public.wit2_guild_goal_defs (
  id      text PRIMARY KEY,
  titulo  text NOT NULL,
  fonte   text NOT NULL CHECK (fonte IN ('pvp','andar','trabalho','aula','chefe') OR fonte LIKE 'stat:%'),
  meta    int  NOT NULL CHECK (meta > 0),
  pontos  int  NOT NULL CHECK (pontos > 0),
  pack    text NOT NULL REFERENCES public.wit2_pack_defs(id),
  icone   text NOT NULL DEFAULT 'estrela',
  ordem   int  NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.wit2_guild_goal_claims (
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week        date NOT NULL,
  goal_id     text NOT NULL REFERENCES public.wit2_guild_goal_defs(id) ON DELETE CASCADE,
  at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, week, goal_id)
);
ALTER TABLE public.wit2_guild_goal_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wit2_guild_goal_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wit2_guild_goal_defs, public.wit2_guild_goal_claims FROM anon, authenticated;

INSERT INTO public.wit2_guild_goal_defs (id, titulo, fonte, meta, pontos, pack, icone, ordem) VALUES
  ('pvp',       'Vencer 20 duelos no PvP',        'pvp',            20, 30, 'incomum', 'espadas',   1),
  ('andares',   'Subir 5 andares da Torre',       'andar',           5, 20, 'comum',   'coroa',     2),
  ('trabalhos', 'Terminar 30 trabalhos',          'trabalho',       30, 20, 'comum',   'martelo',   3),
  ('aula',      'Somar 8 presenças na aula',      'aula',            8, 25, 'incomum', 'livro',     4),
  ('chefe',     'Derrubar o chefe da guilda',     'chefe',           1, 40, 'raro',    'caveira',   5),
  ('mesas',     'Vencer 25 duelos nas mesas',     'stat:mesas',     25, 15, 'comum',   'carta-verso', 6),
  ('peixes',    'Pescar 40 peixes',               'stat:peixes',    40, 10, 'comum',   'peixe',     7),
  ('colheitas', 'Fazer 40 colheitas',             'stat:colheitas', 40, 10, 'comum',   'colheita_milho', 8)
ON CONFLICT (id) DO NOTHING;

-- andar novo da Torre vira evento (o progresso chega pelo wit2_sync). Na primeira
-- gravação não conta (o que já tinha antes não é desta semana); no máximo 3 por vez.
CREATE OR REPLACE FUNCTION public.wit2_progress_andar() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a int; b int;
BEGIN
  IF jsonb_typeof(OLD.data->'towerMax') <> 'number' OR jsonb_typeof(NEW.data->'towerMax') <> 'number' THEN RETURN NEW; END IF;
  a := (OLD.data->>'towerMax')::numeric; b := (NEW.data->>'towerMax')::numeric;
  IF b > a THEN PERFORM wit2_event(NEW.student_id, 'andar', least(3, b - a)); END IF;
  RETURN NEW;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'wit2_progress_andar' AND tgrelid = 'public.wit2_progress'::regclass) THEN
    CREATE TRIGGER wit2_progress_andar AFTER UPDATE OF data ON public.wit2_progress FOR EACH ROW EXECUTE FUNCTION public.wit2_progress_andar();
  END IF;
END $$;

-- quanto a guilda já fez de cada meta nesta semana
CREATE OR REPLACE FUNCTION public.wit2_guild_goal_state(p_guild uuid)
RETURNS TABLE (goal_id text, titulo text, icone text, valor int, meta int, pontos int, pack text, feita boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH wk AS (SELECT date_trunc('week', now()) AS w),
  mem AS (SELECT m.student_id, greatest((SELECT w FROM wk), m.joined_at) AS since FROM wit2_guild_members m WHERE m.guild_id = p_guild),
  ev AS (SELECT e.kind, sum(e.value) AS n FROM wit2_events e JOIN mem ON mem.student_id = e.student_id AND e.at >= mem.since GROUP BY e.kind),
  v AS (
    SELECT d.*, CASE
      WHEN d.fonte = 'pvp' THEN (SELECT count(*) FROM wit2_pvp_matches x JOIN mem ON mem.student_id = x.winner AND x.at >= mem.since)
      WHEN d.fonte = 'trabalho' THEN (SELECT coalesce(sum(n), 0) FROM ev WHERE kind IN ('stat:entregas', 'stat:minijogos'))
      WHEN d.fonte = 'aula' THEN (SELECT count(*) FROM wit2_attendance a JOIN wit2_lessons l ON l.id = a.lesson_id JOIN mem ON mem.student_id = a.student_id
                                  WHERE a.status <> 'faltou' AND l.day >= mem.since::date)
      WHEN d.fonte = 'chefe' THEN (SELECT CASE WHEN g.boss_week = (SELECT w FROM wk)::date AND g.boss_hp = 0 THEN 1 ELSE 0 END FROM wit2_guilds g WHERE g.id = p_guild)
      WHEN d.fonte = 'andar' THEN (SELECT coalesce(sum(n), 0) FROM ev WHERE kind = 'andar')
      ELSE (SELECT coalesce(sum(n), 0) FROM ev WHERE kind = d.fonte)
    END AS n
    FROM wit2_guild_goal_defs d
  )
  SELECT id, titulo, icone, least(n, meta)::int, meta, pontos, pack, n >= meta FROM v ORDER BY ordem, id;
$$;

-- as metas da minha guilda (e o que eu já resgatei)
CREATE OR REPLACE FUNCTION public.wit2_guild_goals() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); g uuid; wk date := date_trunc('week', now())::date;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO g FROM wit2_guild_members WHERE student_id = me;
  IF g IS NULL THEN RETURN NULL; END IF;
  PERFORM wit2_guild_week(g);
  RETURN (SELECT jsonb_build_object(
    'pontos', coalesce(sum(s.pontos) FILTER (WHERE s.feita), 0),
    'metas', jsonb_agg(jsonb_build_object('id', s.goal_id, 'titulo', s.titulo, 'icone', s.icone, 'valor', s.valor, 'meta', s.meta,
      'pontos', s.pontos, 'pack', s.pack, 'feita', s.feita,
      'resgatada', EXISTS (SELECT 1 FROM wit2_guild_goal_claims c WHERE c.student_id = me AND c.week = wk AND c.goal_id = s.goal_id))))
    FROM wit2_guild_goal_state(g) s);
END $$;

-- resgatar o pacotinho de uma meta cumprida (1 por meta por semana, por aluno)
CREATE OR REPLACE FUNCTION public.wit2_guild_goal_claim(p_goal text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); g uuid; wk date := date_trunc('week', now())::date; s record;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO g FROM wit2_guild_members WHERE student_id = me;
  IF g IS NULL THEN RAISE EXCEPTION 'guilda não encontrada'; END IF;
  PERFORM wit2_guild_week(g);
  SELECT * INTO s FROM wit2_guild_goal_state(g) x WHERE x.goal_id = p_goal;
  IF s.goal_id IS NULL THEN RAISE EXCEPTION 'meta não existe'; END IF;
  IF NOT s.feita THEN RAISE EXCEPTION 'meta ainda não cumprida'; END IF;
  INSERT INTO wit2_guild_goal_claims (student_id, week, goal_id) VALUES (me, wk, p_goal) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'já resgatou'; END IF;
  PERFORM wit2_ensure(me);
  INSERT INTO wit2_packs (student_id, pack_id, qty) VALUES (me, s.pack, 1)
    ON CONFLICT (student_id, pack_id) DO UPDATE SET qty = wit2_packs.qty + 1;
  PERFORM wit2_event(me, 'meta:' || p_goal, 1);
  RETURN jsonb_build_object('pack', s.pack);
END $$;

-- ranking das guildas: soma dos pontos das metas cumpridas nesta semana
CREATE OR REPLACE FUNCTION public.wit2_rank_guilds() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); mine uuid; total_metas int := (SELECT count(*) FROM wit2_guild_goal_defs);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO mine FROM wit2_guild_members WHERE student_id = me;
  RETURN (WITH r AS (
      SELECT g.id, g.name, g.emblem,
             (SELECT count(*) FROM wit2_guild_members m WHERE m.guild_id = g.id) AS membros,
             s.pontos, s.metas, s.parcial
      FROM wit2_guilds g
      CROSS JOIN LATERAL (
        SELECT coalesce(sum(x.pontos) FILTER (WHERE x.feita), 0) AS pontos, count(*) FILTER (WHERE x.feita) AS metas,
               coalesce(sum(x.valor::numeric / x.meta), 0) AS parcial
        FROM wit2_guild_goal_state(g.id) x) s
      WHERE EXISTS (SELECT 1 FROM wit2_guild_members m WHERE m.guild_id = g.id)
    ), o AS (
      SELECT r.*, rank() OVER (ORDER BY pontos DESC, parcial DESC) AS pos,
             row_number() OVER (ORDER BY pontos DESC, parcial DESC, membros DESC, name) AS n
      FROM r
    )
    SELECT jsonb_build_object(
      'top', coalesce((SELECT jsonb_agg(jsonb_build_object('pos', pos, 'name', name, 'emblem', emblem, 'membros', membros,
               'pontos', pontos, 'metas', metas, 'totalMetas', total_metas, 'minha', id = mine) ORDER BY n) FROM o WHERE n <= 30), '[]'::jsonb),
      'eu', (SELECT jsonb_build_object('pos', pos, 'pontos', pontos, 'name', name) FROM o WHERE id = mine),
      'total', (SELECT count(*) FROM o)));
END $$;

REVOKE ALL ON FUNCTION public.wit2_progress_andar(), public.wit2_guild_goal_state(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wit2_guild_goals(), public.wit2_guild_goal_claim(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wit2_guild_goals(), public.wit2_guild_goal_claim(text) TO authenticated;

COMMIT;
