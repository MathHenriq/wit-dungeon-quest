-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: masmorra nova (src/game/dungeon.ts + hunter.ts). A carta do chefe do
-- PORTAL (rank E…S) só sai daqui: o portal tem de estar aberto para o aluno
-- (o E sempre; os outros só com o chefe do portal anterior vencido, guardado
-- em masmorra.vitorias no progresso), a carta vem do deck do chefe do andar
-- que o rank representa, até 3 por dia e no máximo 1 a cada 60 s. Moedas e
-- itens do pet vão pelo wit2_sync, como sempre.
-- Troca a função antiga (sem argumento) por esta.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.wit2_dungeon_claim();

CREATE OR REPLACE FUNCTION public.wit2_dungeon_claim(p_rank int) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := my_student_id(); prev int; v_card text;
  -- mesma tabela de src/game/dungeon-map.ts (RANK_ANDAR)
  rank_andar int[] := ARRAY[5, 15, 30, 50, 75, 95];
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_rank IS NULL OR p_rank < 0 OR p_rank > 5 THEN RAISE EXCEPTION 'rank inválido'; END IF;
  PERFORM wit2_ensure(me);
  PERFORM 1 FROM wit2_wallet WHERE student_id = me FOR UPDATE;
  -- portal aberto: o E sempre; os outros, com o chefe do portal anterior vencido (hunter.ts portalOpen)
  IF p_rank > 0 THEN
    SELECT coalesce((data->'masmorra'->'vitorias'->>(p_rank - 1))::int, 0) INTO prev FROM wit2_progress WHERE student_id = me;
    IF coalesce(prev, 0) <= 0 THEN RAISE EXCEPTION 'portal fechado'; END IF;
  END IF;
  IF (SELECT count(*) FROM wit2_events WHERE student_id = me AND kind = 'masmorra' AND at >= date_trunc('day', now())) >= 3 THEN
    RAISE EXCEPTION 'masmorra: limite do dia';
  END IF;
  IF EXISTS (SELECT 1 FROM wit2_events WHERE student_id = me AND kind = 'masmorra' AND at > now() - interval '60 seconds') THEN
    PERFORM wit2_event(me, 'suspeita', 0);
    RAISE EXCEPTION 'devagar';
  END IF;
  SELECT card_id INTO v_card FROM wit2_boss_cards WHERE andar = rank_andar[p_rank + 1] ORDER BY random() LIMIT 1;
  IF v_card IS NULL THEN RAISE EXCEPTION 'sem carta'; END IF;
  PERFORM wit2_add_card(me, v_card, 1);
  PERFORM wit2_event(me, 'masmorra', p_rank);
  RETURN v_card;
END $$;

REVOKE ALL ON FUNCTION public.wit2_dungeon_claim(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wit2_dungeon_claim(int) TO authenticated;

COMMIT;
