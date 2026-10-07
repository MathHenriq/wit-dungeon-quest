-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: banco (PROPOSTA, NÃO APLICADA). Desenho em docs/banco-wit2.md.
--
-- Fica em docs/sql de propósito (fora de supabase/migrations) para nunca subir
-- num deploy sem o OK do Matheus. RPC, LGPD e segurança são da outra sessão:
-- este arquivo usa as funções que já existem lá (my_student_id,
-- can_act_for_student, can_act_for_teacher, get_teacher_id, is_caller_admin)
-- e não muda nenhuma delas.
--
-- Testado num Postgres 16 local com dublês dessas funções
-- (scripts/sql/testar-wit2.sh). Depende de docs/sql/wit2-seed.sql (catálogo
-- das cartas e dos pacotinhos, gerado do TypeScript).
--
-- Regras:
--  * moeda, carta e pacote só mudam aqui dentro (security definer);
--  * o resto do progresso é um JSON por aluno com número de versão;
--  * sorteio do pacotinho é no servidor;
--  * nada de dado pessoal novo.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── catálogo (preenchido por wit2-seed.sql) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_card_catalog (
  id      text PRIMARY KEY,
  rarity  text NOT NULL CHECK (rarity IN ('common','uncommon','rare','epic','legendary','mythic','unknown'))
);
CREATE TABLE IF NOT EXISTS public.wit2_pack_defs (
  id         text PRIMARY KEY,
  price      int  NOT NULL CHECK (price > 0),
  rarity     text NOT NULL,
  base       jsonb NOT NULL,       -- [[raridade, peso], ...] das 4 cartas de base
  highlight  jsonb NOT NULL        -- [[raridade, peso], ...] da carta destaque
);
CREATE TABLE IF NOT EXISTS public.wit2_room_rewards (
  id      text PRIMARY KEY,
  nome    text NOT NULL,
  preco   int  NOT NULL CHECK (preco > 0)
);

-- ── do aluno ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_wallet (
  student_id  uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  coins       int  NOT NULL DEFAULT 0 CHECK (coins >= 0),
  po          jsonb NOT NULL DEFAULT '{}'::jsonb,
  sem_epica   int  NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wit2_cards (
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  card_id     text NOT NULL REFERENCES public.wit2_card_catalog(id),
  qty         int  NOT NULL CHECK (qty >= 0),
  PRIMARY KEY (student_id, card_id)
);
CREATE TABLE IF NOT EXISTS public.wit2_packs (
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pack_id     text NOT NULL REFERENCES public.wit2_pack_defs(id),
  qty         int  NOT NULL CHECK (qty >= 0),
  PRIMARY KEY (student_id, pack_id)
);
CREATE TABLE IF NOT EXISTS public.wit2_tower (
  student_id  uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  tower_max   int  NOT NULL DEFAULT 1 CHECK (tower_max BETWEEN 1 AND 100),
  andar       int  NOT NULL DEFAULT 1,
  wins        jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS public.wit2_progress (
  student_id  uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  version     int  NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wit2_tickets (
  code        text PRIMARY KEY,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reward_id   text NOT NULL REFERENCES public.wit2_room_rewards(id),
  preco       int  NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);

-- ── aula ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_lessons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  day           date NOT NULL,
  delivered_at  timestamptz,
  UNIQUE (teacher_id, day)
);
CREATE TABLE IF NOT EXISTS public.wit2_attendance (
  lesson_id   uuid NOT NULL REFERENCES public.wit2_lessons(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status      text NOT NULL CHECK (status IN ('faltou','presente','foi_bem','excepcional')),
  pack_id     text REFERENCES public.wit2_pack_defs(id),
  via_code    boolean NOT NULL DEFAULT false,
  PRIMARY KEY (lesson_id, student_id)
);

-- ── eventos (métricas, plano §9) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_events (
  id          bigserial PRIMARY KEY,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (length(kind) <= 24),
  value       int  NOT NULL DEFAULT 0,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wit2_events_student_at ON public.wit2_events (student_id, at DESC);

-- ── acesso: ler só o próprio (ou o professor dele); escrever só pelas funções ─
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['wit2_wallet','wit2_cards','wit2_packs','wit2_tower','wit2_progress','wit2_tickets','wit2_events']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_act_for_student(student_id))', t || '_read', t);
  END LOOP;
END $$;
ALTER TABLE public.wit2_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wit2_attendance_read ON public.wit2_attendance;
CREATE POLICY wit2_attendance_read ON public.wit2_attendance FOR SELECT TO authenticated USING (public.can_act_for_student(student_id));
ALTER TABLE public.wit2_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wit2_lessons_read ON public.wit2_lessons;
CREATE POLICY wit2_lessons_read ON public.wit2_lessons FOR SELECT TO authenticated USING (public.can_act_for_teacher(teacher_id));
-- catálogos: todo mundo lê
ALTER TABLE public.wit2_card_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wit2_pack_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wit2_room_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wit2_card_catalog_read ON public.wit2_card_catalog;
DROP POLICY IF EXISTS wit2_pack_defs_read ON public.wit2_pack_defs;
DROP POLICY IF EXISTS wit2_room_rewards_read ON public.wit2_room_rewards;
CREATE POLICY wit2_card_catalog_read ON public.wit2_card_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY wit2_pack_defs_read ON public.wit2_pack_defs FOR SELECT TO authenticated USING (true);
CREATE POLICY wit2_room_rewards_read ON public.wit2_room_rewards FOR SELECT TO authenticated USING (true);

-- ═══ funções internas (não expostas) ═════════════════════════════════════════

-- garante as linhas do aluno
CREATE OR REPLACE FUNCTION public.wit2_ensure(p_student uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO wit2_wallet (student_id) VALUES (p_student) ON CONFLICT DO NOTHING;
  INSERT INTO wit2_tower (student_id) VALUES (p_student) ON CONFLICT DO NOTHING;
  INSERT INTO wit2_progress (student_id) VALUES (p_student) ON CONFLICT DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.wit2_event(p_student uuid, p_kind text, p_value int) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO wit2_events (student_id, kind, value) VALUES (p_student, left(p_kind, 24), p_value);
$$;

-- sorteio ponderado: [[valor, peso], ...]
CREATE OR REPLACE FUNCTION public.wit2_weighted(p_list jsonb) RETURNS text
LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE total numeric := 0; x numeric; e jsonb;
BEGIN
  FOR e IN SELECT * FROM jsonb_array_elements(p_list) LOOP total := total + (e->>1)::numeric; END LOOP;
  x := random() * total;
  FOR e IN SELECT * FROM jsonb_array_elements(p_list) LOOP
    IF x < (e->>1)::numeric THEN RETURN e->>0; END IF;
    x := x - (e->>1)::numeric;
  END LOOP;
  RETURN p_list->-1->>0;
END $$;

-- abre um pacote para o aluno (regras de src/game/packs.ts, com a garantia do 10º)
CREATE OR REPLACE FUNCTION public.wit2_draw_pack(p_student uuid, p_pack text) RETURNS text[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  def wit2_pack_defs%ROWTYPE; r text; card text; cards text[] := '{}'; i int;
  pity int; got_epic boolean := false;
  rank CONSTANT text[] := ARRAY['common','uncommon','rare','epic','legendary','mythic','unknown'];
BEGIN
  SELECT * INTO def FROM wit2_pack_defs WHERE id = p_pack;
  IF NOT FOUND THEN RAISE EXCEPTION 'pacote não existe'; END IF;
  SELECT sem_epica INTO pity FROM wit2_wallet WHERE student_id = p_student FOR UPDATE;
  FOR i IN 1..5 LOOP
    IF i < 5 THEN r := wit2_weighted(def.base);
    ELSE
      r := wit2_weighted(def.highlight);
      -- garantia: 10 pacotes sem Épica ou melhor → destaque Épica ou melhor
      IF pity >= 9 AND array_position(rank, r) < 4 THEN r := 'epic'; END IF;
    END IF;
    IF array_position(rank, r) >= 4 THEN got_epic := true; END IF;
    SELECT id INTO card FROM wit2_card_catalog WHERE rarity = r ORDER BY random() LIMIT 1;
    cards := cards || card;
    INSERT INTO wit2_cards (student_id, card_id, qty) VALUES (p_student, card, 1)
      ON CONFLICT (student_id, card_id) DO UPDATE SET qty = wit2_cards.qty + 1;
  END LOOP;
  UPDATE wit2_wallet SET sem_epica = CASE WHEN got_epic THEN 0 ELSE sem_epica + 1 END, updated_at = now() WHERE student_id = p_student;
  PERFORM wit2_event(p_student, 'pacote:' || p_pack, 1);
  RETURN cards;
END $$;

-- ═══ funções do aluno ════════════════════════════════════════════════════════

-- tudo de uma vez ao abrir o jogo
CREATE OR REPLACE FUNCTION public.wit2_load() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  PERFORM wit2_ensure(me);
  RETURN jsonb_build_object(
    'coins', (SELECT coins FROM wit2_wallet WHERE student_id = me),
    'po', (SELECT po FROM wit2_wallet WHERE student_id = me),
    'semEpica', (SELECT sem_epica FROM wit2_wallet WHERE student_id = me),
    'collection', coalesce((SELECT jsonb_object_agg(card_id, qty) FROM wit2_cards WHERE student_id = me AND qty > 0), '{}'::jsonb),
    'pacotes', coalesce((SELECT jsonb_object_agg(pack_id, qty) FROM wit2_packs WHERE student_id = me AND qty > 0), '{}'::jsonb),
    'tower', (SELECT jsonb_build_object('towerMax', tower_max, 'andar', andar, 'wins', wins) FROM wit2_tower WHERE student_id = me),
    'data', (SELECT data FROM wit2_progress WHERE student_id = me),
    'version', (SELECT version FROM wit2_progress WHERE student_id = me)
  );
END $$;

-- grava o JSON do progresso (sem moedas, cartas, pacotes e Torre: essas só pelas funções)
CREATE OR REPLACE FUNCTION public.wit2_save_progress(p_data jsonb, p_version int) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); cur int; clean jsonb;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF octet_length(p_data::text) > 200000 THEN RAISE EXCEPTION 'progresso grande demais'; END IF;
  PERFORM wit2_ensure(me);
  SELECT version INTO cur FROM wit2_progress WHERE student_id = me FOR UPDATE;
  IF p_version <> cur THEN
    -- outro aparelho gravou antes: devolve o do banco para juntar
    RETURN jsonb_build_object('ok', false, 'version', cur, 'data', (SELECT data FROM wit2_progress WHERE student_id = me));
  END IF;
  clean := p_data - ARRAY['coins','collection','pacotes','po','semEpica','towerMax','andar','wins','tickets'];
  UPDATE wit2_progress SET data = clean, version = cur + 1, updated_at = now() WHERE student_id = me;
  RETURN jsonb_build_object('ok', true, 'version', cur + 1);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_buy_pack(p_pack text) RETURNS text[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); cost int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  PERFORM wit2_ensure(me);
  SELECT price INTO cost FROM wit2_pack_defs WHERE id = p_pack;
  IF cost IS NULL THEN RAISE EXCEPTION 'pacote não existe'; END IF;
  UPDATE wit2_wallet SET coins = coins - cost WHERE student_id = me AND coins >= cost;
  IF NOT FOUND THEN RAISE EXCEPTION 'moedas insuficientes'; END IF;
  RETURN wit2_draw_pack(me, p_pack);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_open_saved_pack(p_pack text) RETURNS text[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  UPDATE wit2_packs SET qty = qty - 1 WHERE student_id = me AND pack_id = p_pack AND qty > 0;
  IF NOT FOUND THEN RAISE EXCEPTION 'sem esse pacote guardado'; END IF;
  RETURN wit2_draw_pack(me, p_pack);
END $$;

-- resultado de um duelo da Torre (regras de applyDuel/coinsFor em src/game/progress.ts e opponents.ts)
-- p_kind: 'mesa' ou 'chefe'; p_mesa: 1..8 (0 para o chefe)
CREATE OR REPLACE FUNCTION public.wit2_duel_result(p_andar int, p_kind text, p_mesa int, p_won boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := my_student_id(); t wit2_tower%ROWTYPE; foe text; before int; base int; v_coins int;
  card text; unlocked int; last_hour int;
  tier int; rar text;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_kind NOT IN ('mesa','chefe') OR p_andar NOT BETWEEN 1 AND 100 OR p_mesa NOT BETWEEN 0 AND 12 THEN RAISE EXCEPTION 'duelo inválido'; END IF;
  PERFORM wit2_ensure(me);
  SELECT * INTO t FROM wit2_tower WHERE student_id = me FOR UPDATE;
  IF p_andar > t.tower_max THEN RAISE EXCEPTION 'andar ainda trancado'; END IF;
  IF NOT p_won THEN RETURN jsonb_build_object('won', false, 'coins', 0); END IF;
  -- teto: no máximo 40 vitórias pagas por hora (um duelo leva ~2 min)
  SELECT count(*) INTO last_hour FROM wit2_events WHERE student_id = me AND kind = 'duelo' AND at > now() - interval '1 hour';
  IF last_hour >= 40 THEN PERFORM wit2_event(me, 'suspeita', p_andar); RETURN jsonb_build_object('won', true, 'coins', 0, 'limite', true); END IF;
  foe := 'torre-' || p_andar || '-' || CASE WHEN p_kind = 'chefe' THEN 'chefe' ELSE 'mesa-' || p_mesa END;
  before := coalesce((t.wins->>foe)::int, 0);
  base := 6 + round(p_andar * 0.4);
  IF p_kind = 'chefe' THEN base := base * CASE WHEN p_andar % 10 = 0 THEN 6 ELSE 3 END; END IF;
  v_coins := CASE WHEN before = 0 THEN base ELSE greatest(1, round(base * 0.2)) END;
  UPDATE wit2_wallet SET coins = wit2_wallet.coins + v_coins, updated_at = now() WHERE student_id = me;
  t.wins := jsonb_set(t.wins, ARRAY[foe], to_jsonb(before + 1));
  IF p_kind = 'chefe' THEN
    -- carta do chefe: uma carta da raridade do andar (o deck do chefe é gerado no jogo)
    tier := CASE WHEN p_andar <= 10 THEN 1 WHEN p_andar <= 25 THEN 2 WHEN p_andar <= 45 THEN 3 WHEN p_andar <= 70 THEN 4 WHEN p_andar <= 90 THEN 5 ELSE 6 END;
    rar := (ARRAY['uncommon','rare','epic','legendary','mythic','unknown'])[tier];
    SELECT id INTO card FROM wit2_card_catalog WHERE rarity = rar ORDER BY random() LIMIT 1;
    INSERT INTO wit2_cards (student_id, card_id, qty) VALUES (me, card, 1)
      ON CONFLICT (student_id, card_id) DO UPDATE SET qty = wit2_cards.qty + 1;
    IF t.tower_max <= p_andar AND p_andar < 100 THEN t.tower_max := p_andar + 1; unlocked := p_andar + 1; END IF;
  END IF;
  UPDATE wit2_tower SET wins = t.wins, tower_max = t.tower_max WHERE student_id = me;
  PERFORM wit2_event(me, 'duelo', v_coins);
  RETURN jsonb_build_object('won', true, 'coins', v_coins, 'firstWin', before = 0, 'card', card, 'unlocked', unlocked);
END $$;

-- Recompensas da Sala (src/game/room-rewards.ts): no máximo 3 esperando
CREATE OR REPLACE FUNCTION public.wit2_buy_reward(p_reward text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); cost int; v_code text; alphabet CONSTANT text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT preco INTO cost FROM wit2_room_rewards WHERE id = p_reward;
  IF cost IS NULL THEN RAISE EXCEPTION 'recompensa não existe'; END IF;
  IF (SELECT count(*) FROM wit2_tickets WHERE student_id = me AND delivered_at IS NULL) >= 3 THEN RAISE EXCEPTION 'já tem 3 tickets esperando'; END IF;
  PERFORM wit2_ensure(me);
  UPDATE wit2_wallet SET coins = coins - cost WHERE student_id = me AND coins >= cost;
  IF NOT FOUND THEN RAISE EXCEPTION 'moedas insuficientes'; END IF;
  LOOP
    v_code := '';
    FOR i IN 1..4 LOOP v_code := v_code || substr(alphabet, 1 + floor(random() * 32)::int, 1); END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM wit2_tickets WHERE wit2_tickets.code = v_code);
  END LOOP;
  INSERT INTO wit2_tickets (code, student_id, reward_id, preco) VALUES (v_code, me, p_reward, cost);
  PERFORM wit2_event(me, 'recompensa', cost);
  RETURN v_code;
END $$;

-- ═══ funções do professor ════════════════════════════════════════════════════

-- abre (ou cria) a aula do dia e devolve os alunos dele numa consulta só
CREATE OR REPLACE FUNCTION public.wit2_teacher_lesson(p_day date) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id(); lesson uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  INSERT INTO wit2_lessons (teacher_id, day) VALUES (me, p_day) ON CONFLICT (teacher_id, day) DO NOTHING;
  SELECT id INTO lesson FROM wit2_lessons WHERE teacher_id = me AND day = p_day;
  RETURN jsonb_build_object(
    'lesson', lesson,
    'delivered', (SELECT delivered_at FROM wit2_lessons WHERE id = lesson),
    'students', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', s.id, 'nome', coalesce(s.character_name, s.name),
        'status', a.status, 'pack', a.pack_id, 'viaCode', coalesce(a.via_code, false)) ORDER BY coalesce(s.character_name, s.name))
      FROM students s LEFT JOIN wit2_attendance a ON a.lesson_id = lesson AND a.student_id = s.id
      WHERE s.teacher_id = me), '[]'::jsonb),
    'tickets', coalesce((
      SELECT jsonb_agg(jsonb_build_object('code', t.code, 'student', t.student_id, 'reward', t.reward_id, 'at', t.created_at) ORDER BY t.created_at)
      FROM wit2_tickets t JOIN students s ON s.id = t.student_id
      WHERE s.teacher_id = me AND t.delivered_at IS NULL), '[]'::jsonb)
  );
END $$;

-- grava presença e desempenho de todos e entrega os pacotes, numa transação.
-- p_rows: [{"student": uuid, "status": "presente", "pack": "comum"}, ...]
-- Refazer a entrega corrige: devolve os pacotes da entrega anterior antes.
CREATE OR REPLACE FUNCTION public.wit2_teacher_deliver(p_lesson uuid, p_rows jsonb) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id(); r jsonb; st uuid; n int := 0; old record;
BEGIN
  IF me IS NULL OR NOT EXISTS (SELECT 1 FROM wit2_lessons WHERE id = p_lesson AND teacher_id = me) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  -- desfaz a entrega anterior (só os pacotes ainda fechados)
  FOR old IN SELECT student_id, pack_id FROM wit2_attendance WHERE lesson_id = p_lesson AND pack_id IS NOT NULL LOOP
    UPDATE wit2_packs SET qty = greatest(0, qty - 1) WHERE student_id = old.student_id AND pack_id = old.pack_id;
  END LOOP;
  DELETE FROM wit2_attendance WHERE lesson_id = p_lesson;
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    st := (r->>'student')::uuid;
    IF NOT EXISTS (SELECT 1 FROM students WHERE id = st AND teacher_id = me) THEN CONTINUE; END IF;
    INSERT INTO wit2_attendance (lesson_id, student_id, status, pack_id, via_code)
      VALUES (p_lesson, st, r->>'status', nullif(r->>'pack', ''), coalesce((r->>'viaCode')::boolean, false));
    IF nullif(r->>'pack', '') IS NOT NULL THEN
      PERFORM wit2_ensure(st);
      INSERT INTO wit2_packs (student_id, pack_id, qty) VALUES (st, r->>'pack', 1)
        ON CONFLICT (student_id, pack_id) DO UPDATE SET qty = wit2_packs.qty + 1;
    END IF;
    PERFORM wit2_event(st, 'aula:' || (r->>'status'), 1);
    n := n + 1;
  END LOOP;
  UPDATE wit2_lessons SET delivered_at = now() WHERE id = p_lesson;
  RETURN n;
END $$;

-- código da aula: 4 dígitos que trocam a cada 30 s (o atual ou o anterior valem)
CREATE OR REPLACE FUNCTION public.wit2_code_at(p_lesson uuid, p_slot bigint) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lpad((('x' || substr(md5(p_lesson::text || ':' || p_slot), 1, 8))::bit(32)::bigint % 10000)::text, 4, '0');
$$;
CREATE OR REPLACE FUNCTION public.wit2_class_code(p_lesson uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM wit2_lessons WHERE id = p_lesson AND teacher_id = get_teacher_id()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN wit2_code_at(p_lesson, floor(extract(epoch FROM now()) / 30)::bigint);
END $$;
CREATE OR REPLACE FUNCTION public.wit2_join_code(p_code text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); lesson uuid; slot bigint := floor(extract(epoch FROM now()) / 30)::bigint;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT l.id INTO lesson FROM wit2_lessons l JOIN students s ON s.teacher_id = l.teacher_id
    WHERE s.id = me AND l.day = current_date AND l.delivered_at IS NULL
      AND p_code IN (wit2_code_at(l.id, slot), wit2_code_at(l.id, slot - 1));
  IF lesson IS NULL THEN RETURN false; END IF;
  INSERT INTO wit2_attendance (lesson_id, student_id, status, via_code) VALUES (lesson, me, 'presente', true)
    ON CONFLICT (lesson_id, student_id) DO NOTHING;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_teacher_deliver_ticket(p_code text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE wit2_tickets t SET delivered_at = now() FROM students s
    WHERE t.code = p_code AND s.id = t.student_id AND s.teacher_id = get_teacher_id() AND t.delivered_at IS NULL;
  RETURN FOUND;
END $$;

-- ── quem pode chamar o quê ───────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.wit2_ensure(uuid), public.wit2_event(uuid, text, int), public.wit2_draw_pack(uuid, text), public.wit2_weighted(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  public.wit2_load(), public.wit2_save_progress(jsonb, int), public.wit2_buy_pack(text), public.wit2_open_saved_pack(text),
  public.wit2_duel_result(int, text, int, boolean), public.wit2_buy_reward(text), public.wit2_join_code(text),
  public.wit2_teacher_lesson(date), public.wit2_teacher_deliver(uuid, jsonb), public.wit2_class_code(uuid), public.wit2_teacher_deliver_ticket(text)
TO authenticated;

COMMIT;
