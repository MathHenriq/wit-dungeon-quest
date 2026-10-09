-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: masmorra nova (src/game/dungeon.ts + hunter.ts). A carta do chefe do
-- PORTAL (rank E…S) só sai daqui: o portal tem de estar aberto para o aluno
-- (pelo andar da Torre ou pelo rank de caçador guardado no progresso), a carta
-- vem do deck do chefe do andar que o rank representa, até 3 por dia e no
-- máximo 1 a cada 60 s. Moedas e itens do pet vão pelo wit2_sync, como sempre.
-- Troca a função antiga (sem argumento) por esta.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.wit2_dungeon_claim();

CREATE OR REPLACE FUNCTION public.wit2_dungeon_claim(p_rank int) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := my_student_id(); top int; xp int; v_card text;
  -- mesmas tabelas de src/game/hunter.ts (PORTAL_TOWER, RANK_XP) e dungeon.ts (RANK_ANDAR)
  tower int[] := ARRAY[1, 10, 25, 45, 70, 90];
  rank_xp int[] := ARRAY[0, 300, 900, 2000, 4000, 7000];
  rank_andar int[] := ARRAY[5, 15, 30, 50, 75, 95];
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_rank IS NULL OR p_rank < 0 OR p_rank > 5 THEN RAISE EXCEPTION 'rank inválido'; END IF;
  PERFORM wit2_ensure(me);
  PERFORM 1 FROM wit2_wallet WHERE student_id = me FOR UPDATE;
  SELECT greatest(1, coalesce((data->>'towerMax')::int, 1)), greatest(0, coalesce((data->'masmorra'->>'xp')::int, 0))
    INTO top, xp FROM wit2_progress WHERE student_id = me;
  IF top < tower[p_rank + 1] AND xp < rank_xp[p_rank + 1] THEN RAISE EXCEPTION 'portal fechado'; END IF;
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
