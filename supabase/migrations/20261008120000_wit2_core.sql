-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: banco (aprovado pelo Matheus em 08/10). Desenho em docs/banco-wit2.md.
--
-- Usa as funções de segurança que já existem (my_student_id,
-- can_act_for_student, can_act_for_teacher, get_teacher_id, is_caller_admin)
-- e não muda nenhuma delas.
--
-- Testado num Postgres 16 local com dublês dessas funções
-- (scripts/sql/testar-wit2.sh). O catálogo (cartas, pacotinhos, coleção
-- inicial, decks dos Caminhos e dos chefes, regras da forja) vem na migração
-- seguinte (_wit2_seed.sql, gerada do TypeScript).
--
-- Quem manda em quê:
--  * cartas, pó, pacotes guardados: SÓ o servidor (pacote sorteado aqui,
--    carta do chefe conferida contra o deck dele, forja com as regras daqui);
--  * moedas: o jogo ganha moedas em muitos lugares (Torre, pesca, minijogos,
--    entregas...); manda só a diferença (wit2_sync) e o servidor põe um teto
--    de ganho por dia (gasto não tem teto). Passou do teto: corta e anota
--    'suspeita' para o professor ver;
--  * o resto do progresso (Torre, fazenda, profissões...) é um JSON por aluno
--    com número de versão;
--  * nada de dado pessoal novo.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── catálogo (preenchido por _wit2_seed.sql) ─────────────────────────────────
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
CREATE TABLE IF NOT EXISTS public.wit2_starter (
  card_id text PRIMARY KEY REFERENCES public.wit2_card_catalog(id),
  qty     int NOT NULL CHECK (qty > 0)
);
CREATE TABLE IF NOT EXISTS public.wit2_path_cards (
  path_id text NOT NULL,
  card_id text NOT NULL REFERENCES public.wit2_card_catalog(id),
  qty     int NOT NULL CHECK (qty > 0),
  PRIMARY KEY (path_id, card_id)
);
CREATE TABLE IF NOT EXISTS public.wit2_boss_cards (
  andar   int  NOT NULL CHECK (andar BETWEEN 1 AND 100),
  card_id text NOT NULL REFERENCES public.wit2_card_catalog(id),
  PRIMARY KEY (andar, card_id)
);
CREATE TABLE IF NOT EXISTS public.wit2_dust_rules (
  rarity  text PRIMARY KEY,
  gives   int NOT NULL,
  costs   int            -- NULL: não se forja
);
-- usados pela migração de trocas (_wit2_trades.sql)
CREATE TABLE IF NOT EXISTS public.wit2_price_bands (
  rarity  text PRIMARY KEY,
  lo      int NOT NULL,
  hi      int NOT NULL CHECK (hi >= lo)
);
CREATE TABLE IF NOT EXISTS public.wit2_market_items (
  item    text PRIMARY KEY,
  price   int NOT NULL
);

-- ── do aluno ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wit2_wallet (
  student_id    uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  coins         int  NOT NULL DEFAULT 0 CHECK (coins >= 0),
  po            jsonb NOT NULL DEFAULT '{}'::jsonb,
  sem_epica     int  NOT NULL DEFAULT 0,
  caminho       text,
  earned_day    date NOT NULL DEFAULT current_date,
  earned_today  int  NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now()
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
  FOREACH t IN ARRAY ARRAY['wit2_wallet','wit2_cards','wit2_packs','wit2_progress','wit2_tickets','wit2_events','wit2_attendance']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_act_for_student(student_id))', t || '_read', t);
  END LOOP;
  -- catálogos: todo mundo logado lê
  FOREACH t IN ARRAY ARRAY['wit2_card_catalog','wit2_pack_defs','wit2_room_rewards','wit2_starter','wit2_path_cards','wit2_boss_cards','wit2_dust_rules','wit2_price_bands','wit2_market_items']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', t || '_read', t);
  END LOOP;
END $$;
ALTER TABLE public.wit2_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wit2_lessons_read ON public.wit2_lessons;
CREATE POLICY wit2_lessons_read ON public.wit2_lessons FOR SELECT TO authenticated USING (public.can_act_for_teacher(teacher_id));

-- ═══ funções internas (não expostas) ═════════════════════════════════════════

-- teto de moedas ganhas por dia fora das funções do servidor (docs/economia.md:
-- uma tarde longa jogando dá ~1500; o teto deixa folga)
CREATE OR REPLACE FUNCTION public.wit2_daily_cap() RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT 2500 $$;

-- garante as linhas do aluno; na primeira vez dá a coleção inicial
CREATE OR REPLACE FUNCTION public.wit2_ensure(p_student uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO wit2_wallet (student_id) VALUES (p_student) ON CONFLICT DO NOTHING;
  IF FOUND THEN
    INSERT INTO wit2_cards (student_id, card_id, qty) SELECT p_student, card_id, qty FROM wit2_starter
      ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO wit2_progress (student_id) VALUES (p_student) ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_event(p_student uuid, p_kind text, p_value int) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO wit2_events (student_id, kind, value) VALUES (p_student, left(p_kind, 24), p_value);
$$;

CREATE OR REPLACE FUNCTION public.wit2_add_card(p_student uuid, p_card text, p_n int) RETURNS int
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO wit2_cards (student_id, card_id, qty) VALUES (p_student, p_card, greatest(0, p_n))
    ON CONFLICT (student_id, card_id) DO UPDATE SET qty = greatest(0, wit2_cards.qty + p_n)
  RETURNING qty;
$$;

-- contadores do jogo que contam para as missões da sala (progress.stats)
CREATE OR REPLACE FUNCTION public.wit2_stat_keys() RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['mesas','peixes','colheitas','entregas','minijogos','vendas','pvpVitorias']
$$;
CREATE OR REPLACE FUNCTION public.wit2_stat_events(p_student uuid, p_old jsonb, p_new jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text; d numeric;
BEGIN
  IF p_new IS NULL OR jsonb_typeof(p_new) <> 'object' THEN RETURN; END IF;
  FOREACH k IN ARRAY wit2_stat_keys() LOOP
    IF jsonb_typeof(p_new->k) <> 'number' THEN CONTINUE; END IF;
    d := (p_new->>k)::numeric - CASE WHEN jsonb_typeof(p_old->k) = 'number' THEN (p_old->>k)::numeric ELSE 0 END;
    IF d >= 1 THEN PERFORM wit2_event(p_student, 'stat:' || k, least(30, floor(d))::int); END IF;
  END LOOP;
END $$;

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
CREATE OR REPLACE FUNCTION public.wit2_draw_pack(p_student uuid, p_pack text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  def wit2_pack_defs%ROWTYPE; r text; card text; cards text[] := '{}'; i int;
  pity int; got_epic boolean := false; forced boolean := false;
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
      IF pity >= 9 AND NOT got_epic AND array_position(rank, r) < 4 THEN r := 'epic'; forced := true; END IF;
    END IF;
    IF array_position(rank, r) >= 4 THEN got_epic := true; END IF;
    SELECT id INTO card FROM wit2_card_catalog WHERE rarity = r ORDER BY random() LIMIT 1;
    cards := cards || card;
    PERFORM wit2_add_card(p_student, card, 1);
  END LOOP;
  UPDATE wit2_wallet SET sem_epica = CASE WHEN got_epic THEN 0 ELSE sem_epica + 1 END, updated_at = now()
    WHERE student_id = p_student RETURNING sem_epica INTO pity;
  PERFORM wit2_event(p_student, 'pacote:' || p_pack, 1);
  RETURN jsonb_build_object('cards', to_jsonb(cards), 'pity', forced, 'semEpica', pity,
    'coins', (SELECT coins FROM wit2_wallet WHERE student_id = p_student));
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
    'caminho', (SELECT caminho FROM wit2_wallet WHERE student_id = me),
    'collection', coalesce((SELECT jsonb_object_agg(card_id, qty) FROM wit2_cards WHERE student_id = me AND qty > 0), '{}'::jsonb),
    'pacotes', coalesce((SELECT jsonb_object_agg(pack_id, qty) FROM wit2_packs WHERE student_id = me AND qty > 0), '{}'::jsonb),
    'data', (SELECT data FROM wit2_progress WHERE student_id = me),
    'version', (SELECT version FROM wit2_progress WHERE student_id = me)
  );
END $$;

-- grava o JSON do progresso e a diferença de moedas desde a última vez.
-- Ganho tem teto por dia; gasto não (mas o saldo nunca fica negativo).
-- O JSON só entra se a versão bater (outro aparelho gravou antes: devolve o
-- do banco para juntar); as moedas entram sempre (são diferença, não saldo).
CREATE OR REPLACE FUNCTION public.wit2_sync(p_coins_delta int, p_data jsonb, p_version int) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); w wit2_wallet%ROWTYPE; cur int; give int; clean jsonb;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_data IS NOT NULL AND octet_length(p_data::text) > 200000 THEN RAISE EXCEPTION 'progresso grande demais'; END IF;
  IF abs(p_coins_delta) > 100000 THEN RAISE EXCEPTION 'diferença de moedas inválida'; END IF;
  PERFORM wit2_ensure(me);
  SELECT * INTO w FROM wit2_wallet WHERE student_id = me FOR UPDATE;
  IF w.earned_day <> current_date THEN w.earned_day := current_date; w.earned_today := 0; END IF;
  IF p_coins_delta > 0 THEN
    give := least(p_coins_delta, greatest(0, wit2_daily_cap() - w.earned_today));
    IF give < p_coins_delta THEN PERFORM wit2_event(me, 'suspeita', p_coins_delta - give); END IF;
    w.coins := w.coins + give; w.earned_today := w.earned_today + give;
  ELSIF p_coins_delta < 0 THEN
    w.coins := greatest(0, w.coins + p_coins_delta);
  END IF;
  UPDATE wit2_wallet SET coins = w.coins, earned_day = w.earned_day, earned_today = w.earned_today, updated_at = now() WHERE student_id = me;
  IF p_data IS NULL THEN RETURN jsonb_build_object('ok', true, 'coins', w.coins); END IF;
  SELECT version INTO cur FROM wit2_progress WHERE student_id = me FOR UPDATE;
  IF p_version <> cur THEN
    RETURN jsonb_build_object('ok', false, 'coins', w.coins, 'version', cur, 'data', (SELECT data FROM wit2_progress WHERE student_id = me));
  END IF;
  clean := p_data - ARRAY['coins','collection','pacotes','po','semEpica','tickets'];
  -- o quanto cada contador do jogo andou desde a última gravação vira evento
  -- (missões da sala e relatório do professor); no máximo 30 por gravação
  PERFORM wit2_stat_events(me, (SELECT data->'stats' FROM wit2_progress WHERE student_id = me), clean->'stats');
  UPDATE wit2_progress SET data = clean, version = cur + 1, updated_at = now() WHERE student_id = me;
  RETURN jsonb_build_object('ok', true, 'coins', w.coins, 'version', cur + 1);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_buy_pack(p_pack text) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.wit2_open_saved_pack(p_pack text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  UPDATE wit2_packs SET qty = qty - 1 WHERE student_id = me AND pack_id = p_pack AND qty > 0;
  IF NOT FOUND THEN RAISE EXCEPTION 'sem esse pacote guardado'; END IF;
  RETURN wit2_draw_pack(me, p_pack);
END $$;

-- Caminho (primeiro acesso): as cartas do deck dele entram na coleção, uma vez só
CREATE OR REPLACE FUNCTION public.wit2_choose_path(p_path text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); r record;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM wit2_path_cards WHERE path_id = p_path) THEN RAISE EXCEPTION 'caminho não existe'; END IF;
  PERFORM wit2_ensure(me);
  UPDATE wit2_wallet SET caminho = p_path WHERE student_id = me AND caminho IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'caminho já escolhido'; END IF;
  FOR r IN SELECT card_id, qty FROM wit2_path_cards WHERE path_id = p_path LOOP
    INSERT INTO wit2_cards (student_id, card_id, qty) VALUES (me, r.card_id, r.qty)
      ON CONFLICT (student_id, card_id) DO UPDATE SET qty = greatest(wit2_cards.qty, EXCLUDED.qty);
  END LOOP;
  PERFORM wit2_event(me, 'caminho', 1);
  RETURN coalesce((SELECT jsonb_object_agg(card_id, qty) FROM wit2_cards WHERE student_id = me AND qty > 0), '{}'::jsonb);
END $$;

-- carta do chefe: o jogo sorteia do deck do chefe; aqui confere que a carta é
-- daquele deck, que o andar já foi aberto e o ritmo (no máximo 1 a cada 60 s)
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
  RETURN n;
END $$;

-- forja (src/game/forge.ts): desmanchar a cópia extra vira pó da raridade dela
CREATE OR REPLACE FUNCTION public.wit2_dust(p_card text, p_n int) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); rar text; have int; k int; give int; bonus numeric := 1;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT rarity INTO rar FROM wit2_card_catalog WHERE id = p_card;
  IF rar IS NULL THEN RAISE EXCEPTION 'carta não existe'; END IF;
  SELECT qty INTO have FROM wit2_cards WHERE student_id = me AND card_id = p_card FOR UPDATE;
  k := least(greatest(p_n, 0), coalesce(have, 0) - 1);
  IF k <= 0 THEN RAISE EXCEPTION 'só cartas repetidas'; END IF;
  IF (SELECT data->'grimorio' ? 'po-extra' FROM wit2_progress WHERE student_id = me) THEN bonus := 1.25; END IF;
  give := round((SELECT gives FROM wit2_dust_rules WHERE rarity = rar) * k * bonus);
  UPDATE wit2_cards SET qty = qty - k WHERE student_id = me AND card_id = p_card;
  UPDATE wit2_wallet SET po = jsonb_set(po, ARRAY[rar], to_jsonb(coalesce((po->>rar)::int, 0) + give)), updated_at = now() WHERE student_id = me;
  PERFORM wit2_event(me, 'po', give);
  RETURN jsonb_build_object('dust', give, 'rarity', rar, 'qty', have - k, 'po', (SELECT po FROM wit2_wallet WHERE student_id = me));
END $$;

CREATE OR REPLACE FUNCTION public.wit2_forge(p_card text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); rar text; cost int; have int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT c.rarity, d.costs INTO rar, cost FROM wit2_card_catalog c JOIN wit2_dust_rules d ON d.rarity = c.rarity WHERE c.id = p_card;
  IF rar IS NULL THEN RAISE EXCEPTION 'carta não existe'; END IF;
  IF cost IS NULL THEN RAISE EXCEPTION 'não se forja'; END IF;
  PERFORM wit2_ensure(me);
  SELECT coalesce((po->>rar)::int, 0) INTO have FROM wit2_wallet WHERE student_id = me FOR UPDATE;
  IF have < cost THEN RAISE EXCEPTION 'pó insuficiente'; END IF;
  UPDATE wit2_wallet SET po = jsonb_set(po, ARRAY[rar], to_jsonb(have - cost)), updated_at = now() WHERE student_id = me;
  PERFORM wit2_event(me, 'forja', cost);
  RETURN jsonb_build_object('qty', wit2_add_card(me, p_card, 1), 'po', (SELECT po FROM wit2_wallet WHERE student_id = me));
END $$;

-- Recompensas da Sala (src/game/room-rewards.ts): no máximo 3 esperando
CREATE OR REPLACE FUNCTION public.wit2_buy_reward(p_reward text) RETURNS jsonb
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
  RETURN jsonb_build_object('code', v_code, 'coins', (SELECT coins FROM wit2_wallet WHERE student_id = me));
END $$;

-- cancelar um ticket ainda não entregue devolve as moedas
CREATE OR REPLACE FUNCTION public.wit2_cancel_ticket(p_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); back int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  DELETE FROM wit2_tickets WHERE code = p_code AND student_id = me AND delivered_at IS NULL RETURNING preco INTO back;
  IF back IS NULL THEN RAISE EXCEPTION 'ticket não encontrado'; END IF;
  UPDATE wit2_wallet SET coins = coins + back WHERE student_id = me;
  RETURN jsonb_build_object('coins', (SELECT coins FROM wit2_wallet WHERE student_id = me));
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
        'status', a.status, 'pack', a.pack_id, 'viaCode', coalesce(a.via_code, false),
          'andar', coalesce((SELECT (data->>'towerMax')::int FROM wit2_progress WHERE student_id = s.id), 1)) ORDER BY coalesce(s.character_name, s.name))
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
-- (no Supabase, função nova nasce executável por todos: tira de todo mundo e
-- devolve só as públicas para quem está logado)
REVOKE ALL ON FUNCTION
  public.wit2_ensure(uuid), public.wit2_event(uuid, text, int), public.wit2_draw_pack(uuid, text),
  public.wit2_weighted(jsonb), public.wit2_add_card(uuid, text, int), public.wit2_daily_cap(),
  public.wit2_stat_keys(), public.wit2_stat_events(uuid, jsonb, jsonb)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION
  public.wit2_load(), public.wit2_sync(int, jsonb, int), public.wit2_buy_pack(text), public.wit2_open_saved_pack(text),
  public.wit2_choose_path(text), public.wit2_boss_card(int, text), public.wit2_dust(text, int), public.wit2_forge(text),
  public.wit2_buy_reward(text), public.wit2_cancel_ticket(text), public.wit2_join_code(text),
  public.wit2_teacher_lesson(date), public.wit2_teacher_deliver(uuid, jsonb), public.wit2_class_code(uuid), public.wit2_teacher_deliver_ticket(text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.wit2_load(), public.wit2_sync(int, jsonb, int), public.wit2_buy_pack(text), public.wit2_open_saved_pack(text),
  public.wit2_choose_path(text), public.wit2_boss_card(int, text), public.wit2_dust(text, int), public.wit2_forge(text),
  public.wit2_buy_reward(text), public.wit2_cancel_ticket(text), public.wit2_join_code(text),
  public.wit2_teacher_lesson(date), public.wit2_teacher_deliver(uuid, jsonb), public.wit2_class_code(uuid), public.wit2_teacher_deliver_ticket(text)
TO authenticated;
-- tabelas: escrita só pelas funções (o RLS já barra; isto deixa explícito)
REVOKE INSERT, UPDATE, DELETE ON
  public.wit2_wallet, public.wit2_cards, public.wit2_packs, public.wit2_progress, public.wit2_tickets,
  public.wit2_lessons, public.wit2_attendance, public.wit2_events,
  public.wit2_card_catalog, public.wit2_pack_defs, public.wit2_room_rewards, public.wit2_starter,
  public.wit2_path_cards, public.wit2_boss_cards, public.wit2_dust_rules, public.wit2_price_bands, public.wit2_market_items
FROM anon, authenticated;
REVOKE ALL ON public.wit2_wallet, public.wit2_cards, public.wit2_packs, public.wit2_progress, public.wit2_tickets,
  public.wit2_lessons, public.wit2_attendance, public.wit2_events FROM anon;

COMMIT;
