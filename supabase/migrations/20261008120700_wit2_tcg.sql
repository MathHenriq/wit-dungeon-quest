-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: evolução de cartas (src/lib/tcg/evolve.ts e forge.ts).
-- 2 cópias repetidas (a 1ª fica no álbum: precisa ter 3) + pó da raridade
-- (metade do custo de forjar; Desconhecida: o dobro do que ela dá de pó, ÷2)
-- viram 1 versão "+" (id + '+', já no catálogo com base = false).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE OR REPLACE FUNCTION public.wit2_evolve(p_card text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); rar text; cost int; have int; dust int;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT c.rarity, round(coalesce(d.costs, d.gives * 2) / 2.0) INTO rar, cost
    FROM wit2_card_catalog c JOIN wit2_dust_rules d ON d.rarity = c.rarity WHERE c.id = p_card AND c.base;
  IF rar IS NULL OR NOT EXISTS (SELECT 1 FROM wit2_card_catalog WHERE id = p_card || '+') THEN RAISE EXCEPTION 'essa carta não evolui'; END IF;
  PERFORM wit2_ensure(me);
  SELECT coalesce((po->>rar)::int, 0) INTO dust FROM wit2_wallet WHERE student_id = me FOR UPDATE;
  SELECT qty INTO have FROM wit2_cards WHERE student_id = me AND card_id = p_card FOR UPDATE;
  IF coalesce(have, 0) < 3 THEN RAISE EXCEPTION 'precisa de 3 cópias'; END IF;
  IF dust < cost THEN RAISE EXCEPTION 'pó insuficiente'; END IF;
  UPDATE wit2_wallet SET po = jsonb_set(po, ARRAY[rar], to_jsonb(dust - cost)), updated_at = now() WHERE student_id = me;
  PERFORM wit2_add_card(me, p_card, -2);
  PERFORM wit2_event(me, 'evolucao', 1);
  RETURN jsonb_build_object('qty', (SELECT qty FROM wit2_cards WHERE student_id = me AND card_id = p_card),
    'plus', wit2_add_card(me, p_card || '+', 1), 'po', (SELECT po FROM wit2_wallet WHERE student_id = me));
END $$;

REVOKE ALL ON FUNCTION public.wit2_evolve(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wit2_evolve(text) TO authenticated;

COMMIT;
