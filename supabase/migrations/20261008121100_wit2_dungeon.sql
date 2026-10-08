-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: a carta da masmorra (src/game/dungeon.ts). Com o banco ligado, a
-- carta do chefe da masmorra só sai daqui: uma do deck do chefe do andar mais
-- alto do aluno, até 3 por dia e no máximo 1 a cada 90 s (uma masmorra não
-- termina mais rápido que isso). As moedas vão pelo wit2_sync, como as outras.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE OR REPLACE FUNCTION public.wit2_dungeon_claim() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); top int; v_card text;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  PERFORM wit2_ensure(me);
  PERFORM 1 FROM wit2_wallet WHERE student_id = me FOR UPDATE;
  IF (SELECT count(*) FROM wit2_events WHERE student_id = me AND kind = 'masmorra' AND at >= date_trunc('day', now())) >= 3 THEN
    RAISE EXCEPTION 'masmorra: limite do dia';
  END IF;
  IF EXISTS (SELECT 1 FROM wit2_events WHERE student_id = me AND kind = 'masmorra' AND at > now() - interval '90 seconds') THEN
    PERFORM wit2_event(me, 'suspeita', 0);
    RAISE EXCEPTION 'devagar';
  END IF;
  SELECT least(100, greatest(1, coalesce((data->>'towerMax')::int, 1))) INTO top FROM wit2_progress WHERE student_id = me;
  SELECT card_id INTO v_card FROM wit2_boss_cards WHERE andar = top ORDER BY random() LIMIT 1;
  IF v_card IS NULL THEN RAISE EXCEPTION 'sem carta'; END IF;
  PERFORM wit2_add_card(me, v_card, 1);
  PERFORM wit2_event(me, 'masmorra', top);
  RETURN v_card;
END $$;

REVOKE ALL ON FUNCTION public.wit2_dungeon_claim() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wit2_dungeon_claim() TO authenticated;

COMMIT;
