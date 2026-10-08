-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: trocas, Vitrine (venda entre alunos) e Mercado da turma.
--
-- Regras (as mesmas de src/game/trades.ts, conferidas aqui de novo):
--  * só entre alunos do mesmo professor;
--  * só cartas REPETIDAS (a primeira cópia fica no álbum dos dois lados);
--  * no máximo 5 cartas e 1000 moedas de cada lado; até 5 ofertas abertas;
--  * a troca é feita de uma vez só quando o outro aceita (ou não acontece);
--  * Vitrine: a carta sai do álbum enquanto está à venda (volta se cancelar),
--    preço dentro da faixa da raridade, até 5 à venda por aluno.
-- Mercado da turma: quanto a turma vendeu de cada item (derruba o preço para
-- todos, esquece 30% por dia), em vez de só o que o próprio aluno vendeu.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE IF NOT EXISTS public.wit2_trades (
  id        bigserial PRIMARY KEY,
  a         uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,   -- quem ofereceu
  b         uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,   -- para quem
  a_cards   jsonb NOT NULL DEFAULT '{}'::jsonb,
  a_coins   int NOT NULL DEFAULT 0 CHECK (a_coins BETWEEN 0 AND 1000),
  b_cards   jsonb NOT NULL DEFAULT '{}'::jsonb,
  b_coins   int NOT NULL DEFAULT 0 CHECK (b_coins BETWEEN 0 AND 1000),
  status    text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','feita','recusada','cancelada')),
  at        timestamptz NOT NULL DEFAULT now(),
  done_at   timestamptz,
  CHECK (a <> b)
);
CREATE INDEX IF NOT EXISTS wit2_trades_b ON public.wit2_trades (b, status);
CREATE INDEX IF NOT EXISTS wit2_trades_a ON public.wit2_trades (a, status);

CREATE TABLE IF NOT EXISTS public.wit2_listings (
  id          bigserial PRIMARY KEY,
  seller      uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id  uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  card_id     text NOT NULL REFERENCES public.wit2_card_catalog(id),
  price       int NOT NULL CHECK (price > 0),
  at          timestamptz NOT NULL DEFAULT now(),
  buyer       uuid REFERENCES public.students(id) ON DELETE SET NULL,
  sold_at     timestamptz,
  closed      boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS wit2_listings_open ON public.wit2_listings (teacher_id) WHERE NOT closed;

CREATE TABLE IF NOT EXISTS public.wit2_market_sat (
  teacher_id  uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  item        text NOT NULL REFERENCES public.wit2_market_items(item),
  sat         double precision NOT NULL DEFAULT 0,
  day         int NOT NULL,
  PRIMARY KEY (teacher_id, item)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['wit2_trades','wit2_listings','wit2_market_sat']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- ═══ internas ════════════════════════════════════════════════════════════════

-- {carta: n} válido: cartas que existem, n inteiro positivo, até 5 no total
CREATE OR REPLACE FUNCTION public.wit2_bag_ok(p jsonb) RETURNS boolean
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT jsonb_typeof(coalesce(p, '{}'::jsonb)) = 'object'
     AND NOT EXISTS (SELECT 1 FROM jsonb_each(coalesce(p, '{}'::jsonb)) e
                     WHERE jsonb_typeof(e.value) <> 'number' OR (e.value::text)::numeric <> floor((e.value::text)::numeric)
                        OR (e.value::text)::int < 1 OR NOT EXISTS (SELECT 1 FROM wit2_card_catalog WHERE id = e.key))
     AND coalesce((SELECT sum((e.value::text)::int) FROM jsonb_each(coalesce(p, '{}'::jsonb)) e), 0) <= 5;
$$;

-- o aluno tem estas cartas repetidas? (trava as linhas)
CREATE OR REPLACE FUNCTION public.wit2_has_spare(p_student uuid, p jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e record; have int;
BEGIN
  FOR e IN SELECT key, (value::text)::int AS n FROM jsonb_each(coalesce(p, '{}'::jsonb)) LOOP
    SELECT qty INTO have FROM wit2_cards WHERE student_id = p_student AND card_id = e.key FOR UPDATE;
    IF coalesce(have, 0) - 1 < e.n THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_move_cards(p_from uuid, p_to uuid, p jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e record;
BEGIN
  FOR e IN SELECT key, (value::text)::int AS n FROM jsonb_each(coalesce(p, '{}'::jsonb)) LOOP
    PERFORM wit2_add_card(p_from, e.key, -e.n);
    PERFORM wit2_add_card(p_to, e.key, e.n);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_day() RETURNS int LANGUAGE sql STABLE AS $$ SELECT (current_date - date '1970-01-01') $$;

-- ═══ trocas ══════════════════════════════════════════════════════════════════

-- as cartas repetidas de um colega (o que dá para pedir)
CREATE OR REPLACE FUNCTION public.wit2_trade_view(p_handle text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF other IS NULL OR NOT wit2_classmate(me, other) THEN RAISE EXCEPTION 'colega não encontrado'; END IF;
  RETURN jsonb_build_object('nick', (SELECT nick FROM wit2_profile WHERE student_id = other),
    'spare', coalesce((SELECT jsonb_object_agg(card_id, qty - 1) FROM wit2_cards WHERE student_id = other AND qty > 1), '{}'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.wit2_trade_offer(p_handle text, p_give jsonb, p_give_coins int, p_want jsonb, p_want_coins int) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_handle); v_id bigint;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF other IS NULL OR other = me OR NOT wit2_classmate(me, other) THEN RAISE EXCEPTION 'colega não encontrado'; END IF;
  IF NOT wit2_bag_ok(p_give) OR NOT wit2_bag_ok(p_want) OR p_give_coins NOT BETWEEN 0 AND 1000 OR p_want_coins NOT BETWEEN 0 AND 1000 THEN RAISE EXCEPTION 'troca inválida'; END IF;
  IF (p_give = '{}'::jsonb AND p_give_coins = 0) OR (p_want = '{}'::jsonb AND p_want_coins = 0) THEN RAISE EXCEPTION 'troca inválida'; END IF;
  IF (SELECT count(*) FROM wit2_trades WHERE a = me AND status = 'aberta') >= 5 THEN RAISE EXCEPTION 'ofertas demais'; END IF;
  IF NOT wit2_has_spare(me, p_give) THEN RAISE EXCEPTION 'só cartas repetidas'; END IF;
  INSERT INTO wit2_trades (a, b, a_cards, a_coins, b_cards, b_coins) VALUES (me, other, p_give, p_give_coins, p_want, p_want_coins) RETURNING wit2_trades.id INTO v_id;
  RETURN v_id;
END $$;

-- quem recebeu aceita (tudo de uma vez) ou recusa
CREATE OR REPLACE FUNCTION public.wit2_trade_answer(p_id bigint, p_accept boolean) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); t wit2_trades%ROWTYPE; ca int; cb int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT * INTO t FROM wit2_trades WHERE id = p_id AND b = me AND status = 'aberta' FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'troca não encontrada'; END IF;
  IF NOT p_accept THEN UPDATE wit2_trades SET status = 'recusada', done_at = now() WHERE id = t.id; RETURN 'recusada'; END IF;
  PERFORM wit2_ensure(t.a); PERFORM wit2_ensure(t.b);
  -- trava as duas carteiras sempre na mesma ordem (sem impasse)
  PERFORM 1 FROM wit2_wallet WHERE student_id IN (t.a, t.b) ORDER BY student_id FOR UPDATE;
  SELECT coins INTO ca FROM wit2_wallet WHERE student_id = t.a;
  SELECT coins INTO cb FROM wit2_wallet WHERE student_id = t.b;
  IF ca < t.a_coins OR cb < t.b_coins OR NOT wit2_has_spare(t.a, t.a_cards) OR NOT wit2_has_spare(t.b, t.b_cards) THEN
    UPDATE wit2_trades SET status = 'cancelada', done_at = now() WHERE id = t.id;
    RAISE EXCEPTION 'troca não vale mais';
  END IF;
  PERFORM wit2_move_cards(t.a, t.b, t.a_cards);
  PERFORM wit2_move_cards(t.b, t.a, t.b_cards);
  UPDATE wit2_wallet SET coins = coins - t.a_coins + t.b_coins, updated_at = now() WHERE student_id = t.a;
  UPDATE wit2_wallet SET coins = coins - t.b_coins + t.a_coins, updated_at = now() WHERE student_id = t.b;
  UPDATE wit2_trades SET status = 'feita', done_at = now() WHERE id = t.id;
  PERFORM wit2_event(t.a, 'troca', 1); PERFORM wit2_event(t.b, 'troca', 1);
  RETURN 'feita';
END $$;

CREATE OR REPLACE FUNCTION public.wit2_trade_cancel(p_id bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  UPDATE wit2_trades SET status = 'cancelada', done_at = now() WHERE id = p_id AND a = me AND status = 'aberta';
  RETURN FOUND;
END $$;

-- ofertas abertas (recebidas e enviadas) e as últimas 10 fechadas
CREATE OR REPLACE FUNCTION public.wit2_trades_mine() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(x ORDER BY (x->>'aberta')::boolean DESC, x->>'at' DESC) FROM (
    SELECT jsonb_build_object('id', t.id, 'eu', CASE WHEN t.a = me THEN 'ofereci' ELSE 'recebi' END,
      'com', (SELECT jsonb_build_object('handle', handle, 'nick', nick) FROM wit2_profile WHERE student_id = CASE WHEN t.a = me THEN t.b ELSE t.a END),
      'daCards', CASE WHEN t.a = me THEN t.a_cards ELSE t.b_cards END, 'daCoins', CASE WHEN t.a = me THEN t.a_coins ELSE t.b_coins END,
      'recebeCards', CASE WHEN t.a = me THEN t.b_cards ELSE t.a_cards END, 'recebeCoins', CASE WHEN t.a = me THEN t.b_coins ELSE t.a_coins END,
      'status', t.status, 'aberta', t.status = 'aberta', 'at', t.at) AS x
    FROM wit2_trades t WHERE (t.a = me OR t.b = me) AND (t.status = 'aberta' OR t.done_at > now() - interval '7 days')
    ORDER BY t.at DESC LIMIT 30) q), '[]'::jsonb);
END $$;

-- ═══ Vitrine ═════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.wit2_list_card(p_card text, p_price int) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); lo int; hi int; v_id bigint;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT b.lo, b.hi INTO lo, hi FROM wit2_card_catalog c JOIN wit2_price_bands b ON b.rarity = c.rarity WHERE c.id = p_card;
  IF lo IS NULL THEN RAISE EXCEPTION 'carta não existe'; END IF;
  IF p_price NOT BETWEEN lo AND hi THEN RAISE EXCEPTION 'preço fora da faixa'; END IF;
  IF (SELECT count(*) FROM wit2_listings WHERE seller = me AND NOT closed) >= 5 THEN RAISE EXCEPTION 'vitrine cheia'; END IF;
  IF NOT wit2_has_spare(me, jsonb_build_object(p_card, 1)) THEN RAISE EXCEPTION 'só cartas repetidas'; END IF;
  PERFORM wit2_add_card(me, p_card, -1);
  INSERT INTO wit2_listings (seller, teacher_id, card_id, price) VALUES (me, (SELECT teacher_id FROM students WHERE id = me), p_card, p_price)
    RETURNING wit2_listings.id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_unlist(p_id bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); card text;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  UPDATE wit2_listings SET closed = true WHERE id = p_id AND seller = me AND NOT closed RETURNING card_id INTO card;
  IF card IS NULL THEN RETURN false; END IF;
  PERFORM wit2_add_card(me, card, 1);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_buy_listing(p_id bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); l wit2_listings%ROWTYPE;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT * INTO l FROM wit2_listings WHERE id = p_id AND NOT closed FOR UPDATE;
  IF l.id IS NULL OR l.seller = me OR NOT wit2_classmate(me, l.seller) THEN RAISE EXCEPTION 'já foi vendida'; END IF;
  PERFORM wit2_ensure(me); PERFORM wit2_ensure(l.seller);
  PERFORM 1 FROM wit2_wallet WHERE student_id IN (me, l.seller) ORDER BY student_id FOR UPDATE;
  UPDATE wit2_wallet SET coins = coins - l.price, updated_at = now() WHERE student_id = me AND coins >= l.price;
  IF NOT FOUND THEN RAISE EXCEPTION 'moedas insuficientes'; END IF;
  UPDATE wit2_wallet SET coins = coins + l.price, updated_at = now() WHERE student_id = l.seller;
  PERFORM wit2_add_card(me, l.card_id, 1);
  UPDATE wit2_listings SET closed = true, buyer = me, sold_at = now() WHERE id = l.id;
  PERFORM wit2_event(me, 'compra', l.price); PERFORM wit2_event(l.seller, 'venda', l.price);
  RETURN jsonb_build_object('card', l.card_id, 'coins', (SELECT coins FROM wit2_wallet WHERE student_id = me));
END $$;

-- o que a turma está vendendo (as minhas marcadas)
CREATE OR REPLACE FUNCTION public.wit2_vitrine() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'card', l.card_id, 'price', l.price, 'minha', l.seller = me,
      'nick', (SELECT nick FROM wit2_profile WHERE student_id = l.seller), 'at', l.at) ORDER BY l.at DESC)
    FROM wit2_listings l WHERE NOT l.closed AND l.teacher_id = (SELECT teacher_id FROM students WHERE id = me)), '[]'::jsonb);
END $$;

-- ═══ Mercado da turma ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.wit2_market_state() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); tid uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT teacher_id INTO tid FROM students WHERE id = me;
  RETURN jsonb_build_object('day', wit2_day(), 'sat', coalesce((SELECT jsonb_object_agg(item, round((sat * power(0.7, greatest(0, wit2_day() - day)))::numeric, 3))
    FROM wit2_market_sat WHERE teacher_id = tid), '{}'::jsonb));
END $$;

-- vendi `n` de um item no Mercado: soma na conta da turma (até 50 por vez)
CREATE OR REPLACE FUNCTION public.wit2_market_sold(p_item text, p_n int) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); tid uuid; d int := wit2_day();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_n NOT BETWEEN 1 AND 50 OR NOT EXISTS (SELECT 1 FROM wit2_market_items WHERE item = p_item) THEN RAISE EXCEPTION 'venda inválida'; END IF;
  SELECT teacher_id INTO tid FROM students WHERE id = me;
  IF tid IS NULL THEN RETURN wit2_market_state(); END IF;
  INSERT INTO wit2_market_sat (teacher_id, item, sat, day) VALUES (tid, p_item, p_n, d)
  ON CONFLICT (teacher_id, item) DO UPDATE SET sat = wit2_market_sat.sat * power(0.7, greatest(0, d - wit2_market_sat.day)) + p_n, day = d;
  RETURN wit2_market_state();
END $$;

-- ── quem pode chamar o quê ───────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.wit2_bag_ok(jsonb), public.wit2_has_spare(uuid, jsonb), public.wit2_move_cards(uuid, uuid, jsonb), public.wit2_day()
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION
  public.wit2_trade_view(text), public.wit2_trade_offer(text, jsonb, int, jsonb, int), public.wit2_trade_answer(bigint, boolean),
  public.wit2_trade_cancel(bigint), public.wit2_trades_mine(), public.wit2_list_card(text, int), public.wit2_unlist(bigint),
  public.wit2_buy_listing(bigint), public.wit2_vitrine(), public.wit2_market_state(), public.wit2_market_sold(text, int)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.wit2_trade_view(text), public.wit2_trade_offer(text, jsonb, int, jsonb, int), public.wit2_trade_answer(bigint, boolean),
  public.wit2_trade_cancel(bigint), public.wit2_trades_mine(), public.wit2_list_card(text, int), public.wit2_unlist(bigint),
  public.wit2_buy_listing(bigint), public.wit2_vitrine(), public.wit2_market_state(), public.wit2_market_sold(text, int)
TO authenticated;

COMMIT;
