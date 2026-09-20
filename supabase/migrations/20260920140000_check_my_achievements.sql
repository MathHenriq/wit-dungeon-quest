-- ============================================================
-- check_my_achievements — desbloqueio de conquistas + feed
--
-- Contexto
--   A tabela `achievements` tem 18 conquistas semeadas. A tabela
--   `character_achievements` tem ZERO linhas e a `achievement_feed` tem ZERO
--   linhas. Ou seja: o conteudo existe, ninguem nunca desbloqueou nada, e as
--   duas telas que leem o feed (modo apresentacao do professor e o resumo do
--   portal dos pais, via get_parent_child_summary) mostram vazio desde sempre.
--
--   Existia um src/lib/achievements/achievementChecker.ts no cliente, so que
--   ele nunca foi chamado por ninguem — e nao daria para chamar como estava:
--     - creditava em characters.coins, mas a fonte de verdade e students.coins;
--     - fazia read-modify-write (o mesmo bug de corrida corrigido em
--       apply_battle_rewards);
--     - confiava em numeros vindos do cliente, que o aluno poderia forjar.
--
-- Desenho
--   Tudo no servidor. A funcao nao aceita contadores como parametro: ela
--   calcula os totais das tabelas de origem, entao nao ha o que falsificar.
--
--   Recompensa integral, os dois tipos. Decisao do Matheus em 20/09/2026:
--
--   - Moedas NAO passam pelo apply_daily_coin_cap. O teto diario existe contra
--     farm de boss; conquista e uma vez na vida e nao da para repetir, entao o
--     motivo nao se aplica. Como a funcao nem chama o cap, o premio tambem nao
--     consome o orcamento de moedas do dia do aluno.
--
--   - Diamantes SAO creditados. Isso abre uma excecao a regra do commit
--     d0bd712 ("diamante vem so do professor, nunca de batalha"): a excecao e
--     conquista, que tambem e evento unico. p_grant_diamonds => false desliga
--     sem precisar de migration.
--
-- Requisitos cobertos
--   wins, boss_wins, level, pvp_matches, pvp_wins, pvp_rating, element_points
--   (13 das 18 conquistas). Ficam de fora por falta de fonte confiavel:
--   abilities_unlocked, perfect_wins, fast_wins, elements_used — precisam de
--   contador de evento que ainda nao existe.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_my_achievements(
  p_grant_diamonds BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_sid        UUID;
  v_cid        UUID;
  v_tid        UUID;
  v_totais     JSONB;
  v_ach        RECORD;
  v_coins_ok   INTEGER;
  v_diam_ok    INTEGER;
  v_novas      JSONB := '[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT s.id, s.teacher_id INTO v_sid, v_tid
  FROM students s WHERE s.user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN
    RETURN jsonb_build_object('error', 'no_student', 'unlocked', '[]'::jsonb);
  END IF;

  SELECT c.id INTO v_cid FROM characters c WHERE c.user_id = v_uid LIMIT 1;
  IF v_cid IS NULL THEN
    RETURN jsonb_build_object('error', 'no_character', 'unlocked', '[]'::jsonb);
  END IF;

  -- ── Totais, sempre recalculados da fonte ─────────────────────────────────
  SELECT jsonb_build_object(
    'wins', (
      SELECT count(*) FROM floor_enemy_defeats d WHERE d.character_id = v_cid
    ),
    'boss_wins', (
      SELECT count(*)
      FROM floor_enemy_defeats d
      JOIN enemies e ON e.id = d.enemy_id
      WHERE d.character_id = v_cid AND e.is_boss IS TRUE
    ),
    'level',        (SELECT COALESCE(s.level, 1) FROM students s WHERE s.id = v_sid),
    'pvp_wins',     (SELECT COALESCE(p.wins, 0) FROM pvp_student_stats p WHERE p.student_id = v_sid),
    'pvp_matches',  (SELECT COALESCE(p.wins, 0) + COALESCE(p.losses, 0)
                       FROM pvp_student_stats p WHERE p.student_id = v_sid),
    'pvp_rating',   (SELECT COALESCE(p.rating, 0) FROM pvp_student_stats p WHERE p.student_id = v_sid),
    'element_points', (
      SELECT COALESCE(c.pts_fire, 0) + COALESCE(c.pts_water, 0) + COALESCE(c.pts_electric, 0)
           + COALESCE(c.pts_grass, 0) + COALESCE(c.pts_ice, 0) + COALESCE(c.pts_ground, 0)
           + COALESCE(c.pts_fighting, 0) + COALESCE(c.pts_steel, 0) + COALESCE(c.pts_poison, 0)
           + COALESCE(c.pts_dark, 0) + COALESCE(c.pts_ghost, 0) + COALESCE(c.pts_flying, 0)
      FROM characters c WHERE c.id = v_cid
    )
  ) INTO v_totais;

  -- ── Desbloqueia o que foi atingido e ainda nao consta ────────────────────
  FOR v_ach IN
    SELECT a.id, a.name, a.description, a.category, a.requirement_type,
           a.requirement_value, COALESCE(a.reward_coins, 0)    AS reward_coins,
           COALESCE(a.reward_diamonds, 0) AS reward_diamonds
    FROM achievements a
    WHERE a.requirement_type IS NOT NULL
      AND v_totais ? a.requirement_type
      AND (v_totais ->> a.requirement_type)::numeric >= a.requirement_value
      AND NOT EXISTS (
        SELECT 1 FROM character_achievements ca
        WHERE ca.character_id = v_cid AND ca.achievement_id = a.id::text
      )
    ORDER BY a.requirement_value
  LOOP
    -- A insercao vem primeiro: se duas chamadas correrem juntas, a segunda
    -- perde a corrida aqui e nao chega a creditar de novo.
    INSERT INTO character_achievements (character_id, achievement_id, progress)
    VALUES (v_cid, v_ach.id::text, v_ach.requirement_value)
    ON CONFLICT DO NOTHING;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    -- Integral, sem passar pelo teto diario (ver cabecalho).
    v_coins_ok := v_ach.reward_coins;
    v_diam_ok  := CASE WHEN p_grant_diamonds THEN v_ach.reward_diamonds ELSE 0 END;

    UPDATE students
       SET coins    = coins + v_coins_ok,
           diamonds = diamonds + v_diam_ok
     WHERE id = v_sid;

    INSERT INTO achievement_feed (student_id, teacher_id, achievement_type, achievement_data, message)
    VALUES (
      v_sid,
      v_tid,
      v_ach.category,
      jsonb_build_object(
        'achievement_id',     v_ach.id,
        'name',               v_ach.name,
        'requirement_type',   v_ach.requirement_type,
        'requirement_value',  v_ach.requirement_value,
        'coins_creditadas',     v_coins_ok,
        'diamantes_creditados', v_diam_ok
      ),
      v_ach.name
    );

    v_novas := v_novas || jsonb_build_object(
      'id',             v_ach.id,
      'name',           v_ach.name,
      'description',    v_ach.description,
      'category',       v_ach.category,
      'reward_coins',    v_coins_ok,
      'reward_diamonds', v_diam_ok
    );
  END LOOP;

  RETURN jsonb_build_object('unlocked', v_novas, 'totals', v_totais);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_my_achievements(BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
