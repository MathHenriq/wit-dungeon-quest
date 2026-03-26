-- ============================================================
-- ONDA 5B — PvP Arena, Class Wars, Trading, Presentation Mode
-- ============================================================

-- 1. Trades table
CREATE TABLE IF NOT EXISTS public.trades (
  id               UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id       UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  proposer_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receiver_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  proposer_item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  receiver_item_id UUID REFERENCES public.shop_items(id),
  status           TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, cancelled
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_trades_proposer ON public.trades(proposer_id);
CREATE INDEX IF NOT EXISTS idx_trades_receiver ON public.trades(receiver_id);
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read trades' AND tablename = 'trades') THEN
    CREATE POLICY "Anyone can read trades" ON public.trades FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can insert trades' AND tablename = 'trades') THEN
    CREATE POLICY "Students can insert trades" ON public.trades FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can update trades' AND tablename = 'trades') THEN
    CREATE POLICY "Students can update trades" ON public.trades FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated students can insert trades' AND tablename = 'trades') THEN
    CREATE POLICY "Authenticated students can insert trades" ON public.trades FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated students can update trades' AND tablename = 'trades') THEN
    CREATE POLICY "Authenticated students can update trades" ON public.trades FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- 2. RPC: execute trade (server-side atomic swap)
CREATE OR REPLACE FUNCTION public.execute_trade(p_trade_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_trade trades%ROWTYPE;
BEGIN
  SELECT * INTO v_trade FROM trades WHERE id = p_trade_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Troca nao encontrada');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM student_inventory
    WHERE student_id = v_trade.proposer_id AND item_id = v_trade.proposer_item_id
    LIMIT 1
  ) THEN
    UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
    RETURN jsonb_build_object('success', false, 'error', 'Proponente nao tem o item');
  END IF;

  IF v_trade.receiver_item_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM student_inventory
    WHERE student_id = v_trade.receiver_id AND item_id = v_trade.receiver_item_id
    LIMIT 1
  ) THEN
    UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
    RETURN jsonb_build_object('success', false, 'error', 'Receptor nao tem o item');
  END IF;

  -- Remove proposer's item, give to receiver
  DELETE FROM student_inventory
  WHERE ctid = (
    SELECT ctid FROM student_inventory
    WHERE student_id = v_trade.proposer_id AND item_id = v_trade.proposer_item_id
    LIMIT 1
  );
  INSERT INTO student_inventory (student_id, item_id) VALUES (v_trade.receiver_id, v_trade.proposer_item_id);

  -- Remove receiver's item, give to proposer (if not open offer)
  IF v_trade.receiver_item_id IS NOT NULL THEN
    DELETE FROM student_inventory
    WHERE ctid = (
      SELECT ctid FROM student_inventory
      WHERE student_id = v_trade.receiver_id AND item_id = v_trade.receiver_item_id
      LIMIT 1
    );
    INSERT INTO student_inventory (student_id, item_id) VALUES (v_trade.proposer_id, v_trade.receiver_item_id);
  END IF;

  UPDATE trades SET status = 'accepted', resolved_at = now() WHERE id = p_trade_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION execute_trade TO anon, authenticated;

-- 3. RPC: add class war points
CREATE OR REPLACE FUNCTION public.add_class_war_points(p_class_id UUID, p_points INTEGER)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE class_wars SET
    class_a_score = CASE WHEN class_a_id = p_class_id THEN class_a_score + p_points ELSE class_a_score END,
    class_b_score = CASE WHEN class_b_id = p_class_id THEN class_b_score + p_points ELSE class_b_score END
  WHERE status = 'active'
    AND (class_a_id = p_class_id OR class_b_id = p_class_id)
    AND starts_at <= now()
    AND ends_at >= now();
END;
$$;
GRANT EXECUTE ON FUNCTION add_class_war_points TO anon, authenticated;

-- 4. RPC: finalize class war (teacher closes it, awards coins to winners)
CREATE OR REPLACE FUNCTION public.finalize_class_war(p_war_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_war class_wars%ROWTYPE;
  v_winner_class UUID;
  v_reward INTEGER;
BEGIN
  SELECT * INTO v_war FROM class_wars WHERE id = p_war_id AND status = 'active';
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Guerra nao encontrada'); END IF;

  IF v_war.class_a_score > v_war.class_b_score THEN
    v_winner_class := v_war.class_a_id;
  ELSIF v_war.class_b_score > v_war.class_a_score THEN
    v_winner_class := v_war.class_b_id;
  ELSE
    v_winner_class := NULL; -- draw
  END IF;

  v_reward := COALESCE(v_war.reward_coins, 15);

  UPDATE class_wars
  SET status = 'finished', winner_class_id = v_winner_class, ends_at = now()
  WHERE id = p_war_id;

  IF v_winner_class IS NOT NULL THEN
    UPDATE students SET coins = COALESCE(coins, 0) + v_reward
    WHERE class_id = v_winner_class;
  END IF;

  RETURN jsonb_build_object('success', true, 'winner_class_id', v_winner_class);
END;
$$;
GRANT EXECUTE ON FUNCTION finalize_class_war TO authenticated;

-- 5. RLS for pvp_matches (idempotent)
ALTER TABLE IF EXISTS public.pvp_matches ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read pvp matches' AND tablename = 'pvp_matches') THEN
    CREATE POLICY "Anyone can read pvp matches" ON public.pvp_matches FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can insert pvp matches' AND tablename = 'pvp_matches') THEN
    CREATE POLICY "Students can insert pvp matches" ON public.pvp_matches FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can update pvp matches' AND tablename = 'pvp_matches') THEN
    CREATE POLICY "Students can update pvp matches" ON public.pvp_matches FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated students can insert pvp matches' AND tablename = 'pvp_matches') THEN
    CREATE POLICY "Authenticated students can insert pvp matches" ON public.pvp_matches FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated students can update pvp matches' AND tablename = 'pvp_matches') THEN
    CREATE POLICY "Authenticated students can update pvp matches" ON public.pvp_matches FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- RLS for class_wars
ALTER TABLE IF EXISTS public.class_wars ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read class wars' AND tablename = 'class_wars') THEN
    CREATE POLICY "Anyone can read class wars" ON public.class_wars FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can manage class wars' AND tablename = 'class_wars') THEN
    CREATE POLICY "Teachers can manage class wars" ON public.class_wars FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can update class war scores' AND tablename = 'class_wars') THEN
    CREATE POLICY "Anon can update class war scores" ON public.class_wars FOR UPDATE TO anon USING (true);
  END IF;
END $$;

-- 6. Enable Realtime for new tables (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'trades'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'class_wars'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_wars;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'pvp_matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pvp_matches;
  END IF;
END $$;
