-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: tudo salvo no banco e o painel novo do professor (21/10).
--
-- Até aqui a produção rodava com o jogo só no navegador (VITE_WIT2_DB
-- desligada): cada computador tinha um progresso. Agora o aluno em /wit2 só
-- joga depois de carregar daqui, e tudo vem para cá:
--  * wit2_progress.session: um computador por vez. Quem abre o jogo assume a
--    sessão (wit2_load(p_session)); o wit2_sync de outra sessão é recusado sem
--    mexer em nada (nem nas moedas) e a janela antiga pede para recarregar.
--  * wit2_load(p_session) devolve também os tickets e a casa; aluno suspenso
--    não abre (e suspender fecha a janela aberta).
--  * wit2_photos: o álbum de fotos (até 8), numa linha por aluno.
--  * wit2_crystals_dust: cristal da masmorra vira pó (o pó é do servidor).
--  * professor: lista (busca e páginas), aprovar e suspender. Zerar, recusar e
--    apagar ficam na migração seguinte (_wit2_professor_apagar.sql): o conector
--    do Supabase pede confirmação para SQL que remove linhas.
-- Sem a palavra que remove objeto: o conector do Supabase trava nela.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

ALTER TABLE public.wit2_progress ADD COLUMN IF NOT EXISTS session uuid;

-- ── ao abrir o jogo: assume a sessão e traz tudo ─────────────────────────────
CREATE OR REPLACE FUNCTION public.wit2_load(p_session uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_session IS NULL THEN RAISE EXCEPTION 'sessão inválida'; END IF;
  -- suspenso pelo professor: não abre (o portal mostra até quando)
  IF EXISTS (SELECT 1 FROM students WHERE id = me AND suspended_until > now()) THEN RAISE EXCEPTION 'suspenso'; END IF;
  PERFORM wit2_ensure(me);
  UPDATE wit2_progress SET session = p_session WHERE student_id = me;
  RETURN wit2_load() || jsonb_build_object(
    'tickets', coalesce((SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'code', t.code, 'reward', t.reward_id, 'preco', t.preco,
        'dia', floor(extract(epoch FROM t.created_at) / 86400)::int,
        'entregue', CASE WHEN t.delivered_at IS NULL THEN NULL ELSE floor(extract(epoch FROM t.delivered_at) / 86400)::int END))
      ORDER BY t.created_at) FROM wit2_tickets t WHERE t.student_id = me), '[]'::jsonb),
    'house', (SELECT layout FROM wit2_house WHERE student_id = me));
END $$;

-- ── gravar: só a sessão que abriu por último ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.wit2_sync(p_coins_delta int, p_data jsonb, p_version int, p_session uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); cur uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT session INTO cur FROM wit2_progress WHERE student_id = me FOR UPDATE;
  -- outro computador abriu o jogo (ou o professor zerou o progresso): nada muda
  IF cur IS NULL OR cur IS DISTINCT FROM p_session THEN
    RETURN jsonb_build_object('ok', false, 'sessao', true);
  END IF;
  RETURN wit2_sync(p_coins_delta, p_data, p_version);
END $$;

-- ── álbum de fotos ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_photos (
  student_id  uuid PRIMARY KEY,   -- a ligação com students (em cascata) vem na _wit2_professor_apagar.sql
  list        jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(list) = 'array' AND octet_length(list::text) < 700000),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wit2_photos ENABLE ROW LEVEL SECURITY;   -- sem política: só pelas funções
REVOKE ALL ON public.wit2_photos FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.wit2_photos_save(p_list jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF jsonb_typeof(p_list) IS DISTINCT FROM 'array' OR jsonb_array_length(p_list) > 8 OR octet_length(p_list::text) >= 700000 THEN
    RAISE EXCEPTION 'fotos inválidas';
  END IF;
  INSERT INTO wit2_photos (student_id, list) VALUES (me, p_list)
    ON CONFLICT (student_id) DO UPDATE SET list = EXCLUDED.list, updated_at = now();
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_photos_get() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT list FROM wit2_photos WHERE student_id = me), '[]'::jsonb);
END $$;

-- ── cristal da masmorra vira pó (o cristal fica no JSON; o pó, aqui) ──────────
-- O servidor não vê os cristais: o teto do dia segura (600 de pó por dia). Usa
-- só os cristais que cabem no teto e diz quantos usou (o resto fica no baú).
-- Valor de cada cristal: o mesmo de CRYSTAL_DUST (src/game/hunter.ts).
CREATE OR REPLACE FUNCTION public.wit2_crystals_dust(p_item text, p_n int) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); hoje int; rar text; cada int; usa int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT v.r, v.po INTO rar, cada
    FROM (VALUES ('cristal:azul', 'common', 4), ('cristal:roxo', 'rare', 4), ('cristal:dourado', 'epic', 6)) v(item, r, po)
    WHERE v.item = p_item;
  IF rar IS NULL OR p_n IS NULL OR p_n NOT BETWEEN 1 AND 9999 THEN RAISE EXCEPTION 'cristal inválido'; END IF;
  PERFORM wit2_ensure(me);
  PERFORM 1 FROM wit2_wallet WHERE student_id = me FOR UPDATE;
  SELECT coalesce(sum(value), 0) INTO hoje FROM wit2_events
    WHERE student_id = me AND kind = 'cristal-po' AND at >= date_trunc('day', now());
  usa := least(p_n, greatest(0, 600 - hoje) / cada);
  IF usa <= 0 THEN RAISE EXCEPTION 'limite de pó do dia'; END IF;
  UPDATE wit2_wallet SET po = jsonb_set(coalesce(po, '{}'::jsonb), ARRAY[rar], to_jsonb(coalesce((po->>rar)::int, 0) + usa * cada)), updated_at = now()
    WHERE student_id = me;
  PERFORM wit2_event(me, 'cristal-po', usa * cada);
  RETURN jsonb_build_object('po', (SELECT po FROM wit2_wallet WHERE student_id = me), 'usados', usa, 'ganho', usa * cada);
END $$;

-- ═══ painel do professor ═════════════════════════════════════════════════════

-- o aluno é do professor que chama (ou quem chama é o master)
CREATE OR REPLACE FUNCTION public.wit2_teacher_can(p_student uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM students s WHERE s.id = p_student
    AND ((s.teacher_id IS NOT NULL AND s.teacher_id = get_teacher_id()) OR wit2_is_master()));
$$;

-- uma página da lista: cadastros esperando (pending) ou alunos (active)
CREATE OR REPLACE FUNCTION public.wit2_teacher_list(p_status text, p_q text DEFAULT '', p_limit int DEFAULT 50, p_offset int DEFAULT 0,
  p_teacher uuid DEFAULT NULL, p_todos boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := get_teacher_id(); master boolean := wit2_is_master(); tid uuid;
  pat text := '%' || coalesce(trim(p_q), '') || '%';
  lim int := least(greatest(coalesce(p_limit, 50), 1), 100); off int := greatest(coalesce(p_offset, 0), 0);
BEGIN
  IF me IS NULL AND NOT master THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('pending', 'active') THEN RAISE EXCEPTION 'situação inválida'; END IF;
  IF (coalesce(p_todos, false) OR (p_teacher IS NOT NULL AND p_teacher IS DISTINCT FROM me)) AND NOT master THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  tid := CASE WHEN coalesce(p_todos, false) THEN NULL ELSE coalesce(p_teacher, me) END;
  RETURN jsonb_build_object(
    'total', (SELECT count(*) FROM students s
      WHERE coalesce(s.status, 'active') = p_status AND (tid IS NULL OR s.teacher_id = tid)
        AND coalesce(nullif(s.character_name, ''), s.name, '') ILIKE pat),
    'rows', coalesce((SELECT jsonb_agg(r) FROM (
      SELECT s.id, coalesce(nullif(s.character_name, ''), s.name, 'Sem nome') AS nome, coalesce(s.status, 'active') AS status,
        s.created_at AS criado, CASE WHEN s.suspended_until > now() THEN s.suspended_until END AS suspenso,
        coalesce((wp.data->>'towerMax')::int, 1) AS andar, coalesce(ww.coins, 0) AS moedas, wp.updated_at AS ultimo,
        t.name AS professor, s.user_id AS login
      FROM students s
      LEFT JOIN wit2_progress wp ON wp.student_id = s.id
      LEFT JOIN wit2_wallet ww ON ww.student_id = s.id
      LEFT JOIN teachers t ON t.id = s.teacher_id
      WHERE coalesce(s.status, 'active') = p_status AND (tid IS NULL OR s.teacher_id = tid)
        AND coalesce(nullif(s.character_name, ''), s.name, '') ILIKE pat
      ORDER BY CASE WHEN p_status = 'pending' THEN s.created_at END DESC NULLS LAST,
        lower(coalesce(nullif(s.character_name, ''), s.name, '')), s.id
      LIMIT lim OFFSET off) r), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.wit2_teacher_approve(p_student uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT wit2_teacher_can(p_student) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  UPDATE students SET status = 'active' WHERE id = p_student AND status = 'pending';
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM log_action_v2('wit2_teacher_approve', 'students', p_student, NULL, '{}'::jsonb, NULL, NULL);
  RETURN true;
END $$;

-- 0 dias = reativa
CREATE OR REPLACE FUNCTION public.wit2_teacher_suspend(p_student uuid, p_days int) RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ate timestamptz;
BEGIN
  IF NOT wit2_teacher_can(p_student) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_days IS NULL OR p_days NOT BETWEEN 0 AND 365 THEN RAISE EXCEPTION 'dias inválidos'; END IF;
  ate := CASE WHEN p_days = 0 THEN NULL ELSE now() + make_interval(days => p_days) END;
  UPDATE students SET suspended_until = ate, suspended_reason = CASE WHEN ate IS NULL THEN NULL ELSE 'Suspenso pelo professor' END
    WHERE id = p_student;
  -- a janela aberta para de gravar e, ao recarregar, cai na tela de suspensão
  IF ate IS NOT NULL THEN UPDATE wit2_progress SET session = NULL WHERE student_id = p_student; END IF;
  PERFORM log_action_v2('wit2_teacher_suspend', 'students', p_student, NULL, jsonb_build_object('dias', p_days), NULL, NULL);
  RETURN ate;
END $$;

-- ── permissões ────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.wit2_load(uuid), public.wit2_sync(int, jsonb, int, uuid),
  public.wit2_photos_save(jsonb), public.wit2_photos_get(), public.wit2_crystals_dust(text, int),
  public.wit2_teacher_list(text, text, int, int, uuid, boolean), public.wit2_teacher_approve(uuid),
  public.wit2_teacher_suspend(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wit2_load(uuid), public.wit2_sync(int, jsonb, int, uuid),
  public.wit2_photos_save(jsonb), public.wit2_photos_get(), public.wit2_crystals_dust(text, int),
  public.wit2_teacher_list(text, text, int, int, uuid, boolean), public.wit2_teacher_approve(uuid),
  public.wit2_teacher_suspend(uuid, int) TO authenticated;
-- a conferência de dono é interna (só as funções acima chamam)
REVOKE ALL ON FUNCTION public.wit2_teacher_can(uuid) FROM PUBLIC, anon, authenticated;

COMMIT;
