-- ============================================================
-- apply_battle_rewards — credito atomico de XP e moedas
--
-- Problema
--   useApplyBattleRewards fazia read-modify-write no cliente:
--
--     SELECT coins, xp FROM students ...        -- le
--     newTotal = lido + delta                   -- soma no JS
--     UPDATE students SET coins = newTotal ...  -- escreve
--
--   Entre o SELECT e o UPDATE cabe qualquer outra escrita, e ela e perdida.
--   Na sala isso acontece o tempo todo: o aluno termina uma batalha no mesmo
--   instante em que o professor da moedas pelo painel, ou em que uma compra
--   na loja debita — e um dos dois some sem deixar rastro. Pior: o
--   apply_daily_coin_cap ja tinha debitado o teto diario do aluno, entao ele
--   perde as moedas E o espaco no limite do dia.
--
-- Solucao
--   Uma RPC unica que aplica o teto diario e soma no banco (coins = coins + N),
--   dentro da mesma transacao. Concorrencia vira serializacao pelo Postgres em
--   vez de ultima-escrita-vence.
--
--   O nivel continua sendo decidido no cliente: a curva de XP mora em
--   src/lib/progression/xpCalculator.ts e duplicar ela em SQL so criaria duas
--   fontes de verdade que divergem. Como o nivel e derivado do XP total — que
--   agora e autoritativo — um SET direto e seguro e se autocorrige.
-- ============================================================

CREATE OR REPLACE FUNCTION public.apply_battle_rewards(
  p_xp    INTEGER,
  p_coins INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_sid       UUID;
  v_cap       JSONB := NULL;
  v_effective INTEGER := 0;
  v_xp        INTEGER := GREATEST(COALESCE(p_xp, 0), 0);
  v_coins_in  INTEGER := GREATEST(COALESCE(p_coins, 0), 0);
  v_coins     INTEGER;
  v_total_xp  INTEGER;
  v_level     INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_sid FROM students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN
    RETURN jsonb_build_object('error', 'no_student');
  END IF;

  -- Teto diario primeiro: ele decide QUANTO de fato entra na carteira.
  -- Roda na mesma transacao, entao se o UPDATE abaixo falhar o debito do
  -- teto tambem volta atras (antes isso podia ficar dessincronizado).
  IF v_coins_in > 0 THEN
    v_cap := public.apply_daily_coin_cap(v_coins_in);
    v_effective := GREATEST(COALESCE((v_cap->>'effective')::INTEGER, 0), 0);
  END IF;

  UPDATE students
     SET coins = coins + v_effective,
         xp    = xp + v_xp
   WHERE id = v_sid
   RETURNING coins, xp, level INTO v_coins, v_total_xp, v_level;

  RETURN jsonb_build_object(
    'coins',          v_coins,
    'xp',             v_total_xp,
    'level',          v_level,
    'coins_credited', v_effective,
    'coins_requested', v_coins_in,
    'xp_credited',    v_xp,
    'cap',            v_cap
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_battle_rewards(INTEGER, INTEGER) TO authenticated;

NOTIFY pgrst, 'reload schema';
