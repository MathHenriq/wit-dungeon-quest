-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: placar do PvP online (src/game/pvp-online.ts). A partida roda nos dois
-- aparelhos; cada um manda o resultado. Vale quando os dois batem (um diz que
-- ganhou, o outro que perdeu); se discordarem, fica sem vencedor. Não dá
-- moedas nem cartas: é só o placar (e o ranking da turma).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE IF NOT EXISTS public.wit2_pvp_matches (
  key         text PRIMARY KEY CHECK (length(key) <= 80),
  a           uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  b           uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  a_says      boolean,            -- o que A disse: ganhei?
  b_says      boolean,
  winner      uuid REFERENCES public.students(id) ON DELETE SET NULL,
  at          timestamptz NOT NULL DEFAULT now(),
  CHECK (a <> b)
);
ALTER TABLE public.wit2_pvp_matches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wit2_pvp_matches FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.wit2_pvp_report(p_key text, p_opp text, p_won boolean) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); other uuid := wit2_by_handle(p_opp); m wit2_pvp_matches%ROWTYPE;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF other IS NULL OR other = me OR NOT wit2_classmate(me, other) THEN RAISE EXCEPTION 'colega não encontrado'; END IF;
  INSERT INTO wit2_pvp_matches (key, a, b) VALUES (p_key, me, other) ON CONFLICT (key) DO NOTHING;
  SELECT * INTO m FROM wit2_pvp_matches WHERE key = p_key FOR UPDATE;
  IF NOT ((m.a = me AND m.b = other) OR (m.a = other AND m.b = me)) THEN RAISE EXCEPTION 'partida não é sua'; END IF;
  IF m.a = me THEN m.a_says := coalesce(m.a_says, p_won); ELSE m.b_says := coalesce(m.b_says, p_won); END IF;
  m.winner := CASE WHEN m.a_says AND m.b_says IS FALSE THEN m.a WHEN m.b_says AND m.a_says IS FALSE THEN m.b ELSE NULL END;
  UPDATE wit2_pvp_matches SET a_says = m.a_says, b_says = m.b_says, winner = m.winner WHERE key = p_key;
  RETURN m.winner IS NOT NULL;
END $$;

-- ranking da turma (vitórias confirmadas)
CREATE OR REPLACE FUNCTION public.wit2_pvp_ranking() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); tid uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT teacher_id INTO tid FROM students WHERE id = me;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('nick', p.nick, 'handle', p.handle, 'vitorias', w.n, 'eu', p.student_id = me) ORDER BY w.n DESC)
    FROM (SELECT winner, count(*) AS n FROM wit2_pvp_matches WHERE winner IS NOT NULL GROUP BY winner) w
    JOIN students s ON s.id = w.winner AND s.teacher_id = tid
    JOIN wit2_profile p ON p.student_id = w.winner), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.wit2_pvp_report(text, text, boolean), public.wit2_pvp_ranking() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wit2_pvp_report(text, text, boolean), public.wit2_pvp_ranking() TO authenticated;

COMMIT;
