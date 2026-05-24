-- ============================================================
-- Patch 1.1 — Fix trade duplication bug
--
-- Symptom: after accept, both proposer and receiver kept the item.
-- Root causes hardened here:
--   (a) duplicate item_ids in trade_items would silently no-op the
--       second DELETE while the INSERT raised UNIQUE and rolled back
--       AFTER the trade row had already been observed as 'accepted'
--       on a stale realtime client;
--   (b) when receiver already owned the item, INSERT raised UNIQUE
--       and rolled back, but the client surfaced no clear error;
--   (c) no row-count assertion after DELETE, so a no-op delete
--       could ship the INSERT through and "duplicate" the item.
--
-- Fix: dedupe item lists, pre-check receiver does not already own
-- the items (and vice-versa), assert ROW_COUNT=1 after each DELETE,
-- wrap in EXCEPTION block so any failure returns a clean error JSON
-- without leaving the trade in a half-applied state.
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_trade(p_trade_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_trade        trades%ROWTYPE;
  v_item_id      UUID;
  v_prop_items   UUID[];
  v_recv_items   UUID[];
  v_deleted      INTEGER;
BEGIN
  -- Lock trade row; bail if not pending
  SELECT * INTO v_trade
  FROM trades
  WHERE id = p_trade_id AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Troca nao encontrada ou ja resolvida');
  END IF;

  -- Resolve + dedupe proposer items (trade_items table preferred, legacy column fallback)
  SELECT ARRAY(
    SELECT DISTINCT item_id FROM trade_items
    WHERE trade_id = p_trade_id AND side = 'proposer'
  ) INTO v_prop_items;
  IF v_prop_items IS NULL OR array_length(v_prop_items, 1) IS NULL THEN
    IF v_trade.proposer_item_id IS NOT NULL THEN
      v_prop_items := ARRAY[v_trade.proposer_item_id];
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Nenhum item do proponente');
    END IF;
  END IF;

  -- Resolve + dedupe receiver items
  SELECT ARRAY(
    SELECT DISTINCT item_id FROM trade_items
    WHERE trade_id = p_trade_id AND side = 'receiver'
  ) INTO v_recv_items;
  IF v_recv_items IS NULL OR array_length(v_recv_items, 1) IS NULL THEN
    IF v_trade.receiver_item_id IS NOT NULL THEN
      v_recv_items := ARRAY[v_trade.receiver_item_id];
    ELSE
      v_recv_items := ARRAY[]::UUID[];
    END IF;
  END IF;

  -- Verify proposer owns every item they offer
  FOREACH v_item_id IN ARRAY v_prop_items LOOP
    IF NOT EXISTS (
      SELECT 1 FROM student_inventory
      WHERE student_id = v_trade.proposer_id AND item_id = v_item_id
    ) THEN
      UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
      RETURN jsonb_build_object('success', false, 'error', 'Proponente nao possui mais o item ofertado');
    END IF;
    -- Receiver must NOT already own it (UNIQUE constraint would otherwise abort the swap)
    IF EXISTS (
      SELECT 1 FROM student_inventory
      WHERE student_id = v_trade.receiver_id AND item_id = v_item_id
    ) THEN
      UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
      RETURN jsonb_build_object('success', false, 'error', 'Receptor ja possui um dos itens da oferta');
    END IF;
  END LOOP;

  -- Same checks the other direction
  FOREACH v_item_id IN ARRAY v_recv_items LOOP
    IF NOT EXISTS (
      SELECT 1 FROM student_inventory
      WHERE student_id = v_trade.receiver_id AND item_id = v_item_id
    ) THEN
      UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
      RETURN jsonb_build_object('success', false, 'error', 'Receptor nao possui mais o item solicitado');
    END IF;
    IF EXISTS (
      SELECT 1 FROM student_inventory
      WHERE student_id = v_trade.proposer_id AND item_id = v_item_id
    ) THEN
      UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
      RETURN jsonb_build_object('success', false, 'error', 'Proponente ja possui um dos itens solicitados');
    END IF;
  END LOOP;

  -- Verify coin balance (when applicable)
  IF v_trade.coins_amount > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM students
      WHERE id = v_trade.receiver_id AND COALESCE(coins, 0) >= v_trade.coins_amount
    ) THEN
      UPDATE trades SET status = 'cancelled', resolved_at = now() WHERE id = p_trade_id;
      RETURN jsonb_build_object('success', false, 'error', 'Receptor nao tem moedas suficientes');
    END IF;
  END IF;

  -- Transfer proposer items → receiver. Assert exactly one row was removed each time.
  FOREACH v_item_id IN ARRAY v_prop_items LOOP
    DELETE FROM student_inventory
    WHERE student_id = v_trade.proposer_id AND item_id = v_item_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    IF v_deleted <> 1 THEN
      RAISE EXCEPTION 'Falha ao remover item % do proponente (linhas removidas: %)', v_item_id, v_deleted;
    END IF;
    INSERT INTO student_inventory (student_id, item_id)
    VALUES (v_trade.receiver_id, v_item_id);
  END LOOP;

  -- Transfer receiver items → proposer
  FOREACH v_item_id IN ARRAY v_recv_items LOOP
    DELETE FROM student_inventory
    WHERE student_id = v_trade.receiver_id AND item_id = v_item_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    IF v_deleted <> 1 THEN
      RAISE EXCEPTION 'Falha ao remover item % do receptor (linhas removidas: %)', v_item_id, v_deleted;
    END IF;
    INSERT INTO student_inventory (student_id, item_id)
    VALUES (v_trade.proposer_id, v_item_id);
  END LOOP;

  -- Coin transfer
  IF v_trade.coins_amount > 0 THEN
    UPDATE students SET coins = COALESCE(coins, 0) - v_trade.coins_amount WHERE id = v_trade.receiver_id;
    UPDATE students SET coins = COALESCE(coins, 0) + v_trade.coins_amount WHERE id = v_trade.proposer_id;
  END IF;

  UPDATE trades SET status = 'accepted', resolved_at = now() WHERE id = p_trade_id;
  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  -- Any failure inside the transfer block rolls the whole function back.
  -- Surface the SQL error to the client so the UI can react instead of
  -- silently leaving inventories in a half-applied state.
  RAISE WARNING 'execute_trade failed for trade %: %', p_trade_id, SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', 'Erro interno ao executar troca: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION execute_trade TO anon, authenticated;
