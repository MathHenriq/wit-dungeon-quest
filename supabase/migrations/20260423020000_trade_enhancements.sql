-- ============================================================
-- Trading enhancements: multi-item trades + coin-based trades
-- ============================================================

-- 1. Add coins_amount column to trades
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS coins_amount INTEGER NOT NULL DEFAULT 0;

-- 2. trade_items junction table (holds all items per trade side)
CREATE TABLE IF NOT EXISTS public.trade_items (
  id       UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  side     TEXT NOT NULL CHECK (side IN ('proposer', 'receiver')),
  item_id  UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_trade_items_trade ON public.trade_items(trade_id);
ALTER TABLE public.trade_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read trade_items' AND tablename = 'trade_items') THEN
    CREATE POLICY "Anyone can read trade_items" ON public.trade_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can insert trade_items' AND tablename = 'trade_items') THEN
    CREATE POLICY "Anon can insert trade_items" ON public.trade_items FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can insert trade_items' AND tablename = 'trade_items') THEN
    CREATE POLICY "Authenticated can insert trade_items" ON public.trade_items FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- 3. Replace execute_trade RPC — supports multi-item + coin transfers
CREATE OR REPLACE FUNCTION public.execute_trade(p_trade_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_trade       trades%ROWTYPE;
  v_item_id     UUID;
  v_prop_items  UUID[];
  v_recv_items  UUID[];
BEGIN
  SELECT * INTO v_trade FROM trades WHERE id = p_trade_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Troca nao encontrada');
  END IF;

  -- Resolve proposer items: trade_items table takes priority, fall back to legacy column
  SELECT ARRAY(SELECT item_id FROM trade_items WHERE trade_id = p_trade_id AND side = 'proposer')
  INTO v_prop_items;
  IF v_prop_items IS NULL OR array_length(v_prop_items, 1) IS NULL THEN
    IF v_trade.proposer_item_id IS NOT NULL THEN
      v_prop_items := ARRAY[v_trade.proposer_item_id];
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Nenhum item do proponente');
    END IF;
  END IF;

  -- Verify proposer owns all their items
  FOREACH v_item_id IN ARRAY v_prop_items LOOP
    IF NOT EXISTS (
      SELECT 1 FROM student_inventory
      WHERE student_id = v_trade.proposer_id AND item_id = v_item_id LIMIT 1
    ) THEN
      UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
      RETURN jsonb_build_object('success', false, 'error', 'Proponente nao tem o item');
    END IF;
  END LOOP;

  -- Resolve receiver items: trade_items table takes priority, fall back to legacy column
  SELECT ARRAY(SELECT item_id FROM trade_items WHERE trade_id = p_trade_id AND side = 'receiver')
  INTO v_recv_items;
  IF v_recv_items IS NULL OR array_length(v_recv_items, 1) IS NULL THEN
    IF v_trade.receiver_item_id IS NOT NULL THEN
      v_recv_items := ARRAY[v_trade.receiver_item_id];
    ELSE
      v_recv_items := ARRAY[]::UUID[];
    END IF;
  END IF;

  -- Verify receiver owns all their items
  FOREACH v_item_id IN ARRAY v_recv_items LOOP
    IF NOT EXISTS (
      SELECT 1 FROM student_inventory
      WHERE student_id = v_trade.receiver_id AND item_id = v_item_id LIMIT 1
    ) THEN
      UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
      RETURN jsonb_build_object('success', false, 'error', 'Receptor nao tem o item');
    END IF;
  END LOOP;

  -- Verify receiver has enough coins (if coin trade)
  IF v_trade.coins_amount > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM students
      WHERE id = v_trade.receiver_id AND COALESCE(coins, 0) >= v_trade.coins_amount
    ) THEN
      UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
      RETURN jsonb_build_object('success', false, 'error', 'Receptor nao tem moedas suficientes');
    END IF;
  END IF;

  -- Transfer proposer items → receiver
  FOREACH v_item_id IN ARRAY v_prop_items LOOP
    DELETE FROM student_inventory
    WHERE ctid = (
      SELECT ctid FROM student_inventory
      WHERE student_id = v_trade.proposer_id AND item_id = v_item_id LIMIT 1
    );
    INSERT INTO student_inventory (student_id, item_id) VALUES (v_trade.receiver_id, v_item_id);
  END LOOP;

  -- Transfer receiver items → proposer
  FOREACH v_item_id IN ARRAY v_recv_items LOOP
    DELETE FROM student_inventory
    WHERE ctid = (
      SELECT ctid FROM student_inventory
      WHERE student_id = v_trade.receiver_id AND item_id = v_item_id LIMIT 1
    );
    INSERT INTO student_inventory (student_id, item_id) VALUES (v_trade.proposer_id, v_item_id);
  END LOOP;

  -- Transfer coins: receiver pays proposer
  IF v_trade.coins_amount > 0 THEN
    UPDATE students SET coins = COALESCE(coins, 0) - v_trade.coins_amount WHERE id = v_trade.receiver_id;
    UPDATE students SET coins = COALESCE(coins, 0) + v_trade.coins_amount WHERE id = v_trade.proposer_id;
  END IF;

  UPDATE trades SET status = 'accepted', resolved_at = now() WHERE id = p_trade_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION execute_trade TO anon, authenticated;
