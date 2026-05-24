-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 7.3 — Boss raid reward distribution.
--
-- Hooks into the two raid resolution paths:
--   • Killshot inside attack_boss_raid → status='defeated'.
--   • expire_raids_tick → status='expired'.
-- Both call distribute_raid_rewards(raid_id), which is idempotent via the
-- UNIQUE constraint on boss_raid_rewards(raid_id, student_id).
--
-- Reward ladder (per spec):
--   Vitória → 1 Baú Raro p/ todos os membros que contribuíram
--              + 100 moedas + 5 diamantes por % de contribuição (cap 50%)
--              + top contribuidor ganha 1 Baú Mítico extra
--   Derrota/expira → 50 moedas + 1 diamante por % de contribuição (sem chest)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.boss_raid_rewards (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id        UUID        NOT NULL REFERENCES public.boss_raids(id) ON DELETE CASCADE,
  student_id     UUID        NOT NULL REFERENCES public.students(id)   ON DELETE CASCADE,
  victory        BOOLEAN     NOT NULL,
  contribution_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  coins_awarded  INTEGER     NOT NULL DEFAULT 0,
  diamonds_awarded INTEGER   NOT NULL DEFAULT 0,
  chests_awarded JSONB       NOT NULL DEFAULT '[]'::jsonb,   -- ['global_rare', 'global_mythic']
  is_top         BOOLEAN     NOT NULL DEFAULT FALSE,
  awarded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (raid_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_raid_rewards_raid    ON public.boss_raid_rewards (raid_id);
CREATE INDEX IF NOT EXISTS idx_raid_rewards_student ON public.boss_raid_rewards (student_id, awarded_at DESC);

ALTER TABLE public.boss_raid_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read raid_rewards" ON public.boss_raid_rewards FOR SELECT USING (true);

-- ─── Reward distributor (idempotent) ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.distribute_raid_rewards(p_raid_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raid          boss_raids%ROWTYPE;
  v_total_damage  BIGINT;
  v_victory       BOOLEAN;
  v_top_student   UUID;
  v_paid          INTEGER := 0;
  v_already       INTEGER;
  v_row           RECORD;
  v_pct           NUMERIC;
  v_coins         INTEGER;
  v_diams         INTEGER;
  v_chests        JSONB;
  v_grant_id      UUID;
BEGIN
  SELECT * INTO v_raid FROM public.boss_raids WHERE id = p_raid_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'raid_not_found'); END IF;
  IF v_raid.status NOT IN ('defeated','expired') THEN
    RETURN jsonb_build_object('success', false, 'error', 'raid_not_resolved');
  END IF;

  -- Idempotency: if any row already exists for this raid we skip.
  SELECT COUNT(*) INTO v_already FROM public.boss_raid_rewards WHERE raid_id = p_raid_id;
  IF v_already > 0 THEN
    RETURN jsonb_build_object('success', true, 'already_distributed', true, 'count', v_already);
  END IF;

  v_victory := (v_raid.status = 'defeated');

  -- Total contribution; use 1 to avoid divide-by-zero. If nobody contributed
  -- (raid expired with no attacks), there's nothing to distribute.
  SELECT COALESCE(SUM(damage_dealt), 0) INTO v_total_damage
    FROM public.boss_raid_contributions
   WHERE raid_id = p_raid_id;

  IF v_total_damage = 0 THEN
    BEGIN
      PERFORM public.log_action('distribute_raid_rewards', 'boss_raids', p_raid_id, NULL,
        jsonb_build_object('victory', v_victory, 'awarded', 0, 'reason', 'no_contributions'));
    EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN jsonb_build_object('success', true, 'awarded', 0);
  END IF;

  -- Identify top contributor (tie-break by earliest last_attack_at then student_id).
  SELECT student_id INTO v_top_student
    FROM public.boss_raid_contributions
   WHERE raid_id = p_raid_id
   ORDER BY damage_dealt DESC, last_attack_at ASC, student_id ASC
   LIMIT 1;

  FOR v_row IN
    SELECT c.student_id, c.damage_dealt
      FROM public.boss_raid_contributions c
     WHERE c.raid_id = p_raid_id AND c.damage_dealt > 0
  LOOP
    -- Contribution % capped at 50.
    v_pct := LEAST(50.00, (v_row.damage_dealt::NUMERIC / v_total_damage) * 100);
    v_chests := '[]'::jsonb;

    IF v_victory THEN
      v_coins := ROUND(100 * v_pct)::INT;
      v_diams := ROUND(5   * v_pct)::INT;

      -- Everyone who contributed gets 1 Rare chest grant.
      INSERT INTO public.student_chest_grants (student_id, chest_key, reason, source_payload)
      VALUES (v_row.student_id, 'global_rare',
              format('Vitória em raid — %s', v_raid.boss_name),
              jsonb_build_object('raid_id', p_raid_id, 'kind', 'raid_victory'))
      RETURNING id INTO v_grant_id;
      v_chests := v_chests || jsonb_build_object('chest_key','global_rare','grant_id', v_grant_id);

      IF v_row.student_id = v_top_student THEN
        INSERT INTO public.student_chest_grants (student_id, chest_key, reason, source_payload)
        VALUES (v_row.student_id, 'global_mythic',
                format('Top contribuidor — %s', v_raid.boss_name),
                jsonb_build_object('raid_id', p_raid_id, 'kind', 'raid_top'))
        RETURNING id INTO v_grant_id;
        v_chests := v_chests || jsonb_build_object('chest_key','global_mythic','grant_id', v_grant_id);
      END IF;
    ELSE
      v_coins := ROUND(50 * v_pct)::INT;
      v_diams := ROUND(1  * v_pct)::INT;
    END IF;

    UPDATE public.students
       SET coins    = coins    + v_coins,
           diamonds = COALESCE(diamonds, 0) + v_diams
     WHERE id = v_row.student_id;

    INSERT INTO public.boss_raid_rewards
      (raid_id, student_id, victory, contribution_pct, coins_awarded, diamonds_awarded,
       chests_awarded, is_top)
    VALUES (p_raid_id, v_row.student_id, v_victory, v_pct, v_coins, v_diams,
            v_chests, v_row.student_id = v_top_student);

    INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
    VALUES (
      v_row.student_id, 'raid_reward',
      CASE WHEN v_victory THEN format('Vitória! Boss %s caiu', v_raid.boss_name)
                          ELSE format('Raid encerrada — %s', v_raid.boss_name) END,
      format('Sua contribuição: %s%%. Recompensa: %s moedas, %s diamantes%s%s.',
             round(v_pct, 1)::TEXT, v_coins, v_diams,
             CASE WHEN v_victory THEN ', 1 Baú Raro' ELSE '' END,
             CASE WHEN v_row.student_id = v_top_student AND v_victory
                  THEN ', 1 Baú Mítico (Top!)' ELSE '' END),
      jsonb_build_object('raid_id', p_raid_id, 'victory', v_victory,
                         'pct', v_pct, 'coins', v_coins, 'diamonds', v_diams,
                         'chests', v_chests, 'is_top', v_row.student_id = v_top_student)
    );

    v_paid := v_paid + 1;
  END LOOP;

  BEGIN
    PERFORM public.log_action('distribute_raid_rewards', 'boss_raids', p_raid_id, v_raid.boss_name,
      jsonb_build_object('victory', v_victory, 'awarded', v_paid, 'top', v_top_student, 'total_damage', v_total_damage));
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN jsonb_build_object('success', true, 'victory', v_victory, 'awarded', v_paid, 'top_student_id', v_top_student);
END;
$$;
GRANT EXECUTE ON FUNCTION public.distribute_raid_rewards(UUID) TO authenticated;

-- ─── Hook 1: auto-distribute on killshot via attack_boss_raid ───────────────
CREATE OR REPLACE FUNCTION public.attack_boss_raid(
  p_raid_id UUID,
  p_damage  INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_student   students%ROWTYPE;
  v_raid      boss_raids%ROWTYPE;
  v_member_g  UUID;
  v_dmg       INTEGER;
  v_cap       INTEGER;
  v_killshot  BOOLEAN := FALSE;
  v_new_hp    INTEGER;
  v_new_phase INTEGER;
  v_new_status TEXT;
  v_attacks   INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Sessão expirada'); END IF;
  IF p_damage IS NULL OR p_damage <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dano inválido');
  END IF;

  SELECT * INTO v_student FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_student.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aluno não encontrado');
  END IF;

  SELECT * INTO v_raid FROM public.boss_raids WHERE id = p_raid_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Raid não encontrada');
  END IF;
  IF v_raid.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Raid já encerrada');
  END IF;
  IF v_raid.ends_at <= now() THEN
    UPDATE public.boss_raids SET status = 'expired' WHERE id = p_raid_id;
    -- Patch 7.3: distribute consolation rewards on the spot.
    PERFORM public.distribute_raid_rewards(p_raid_id);
    RETURN jsonb_build_object('success', false, 'error', 'Raid expirada');
  END IF;

  SELECT guild_id INTO v_member_g FROM public.guild_members WHERE student_id = v_student.id LIMIT 1;
  IF v_member_g IS NULL OR v_member_g <> v_raid.guild_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pertence à guilda do raid');
  END IF;

  SELECT attacks_count INTO v_attacks
    FROM public.boss_raid_contributions
   WHERE raid_id = p_raid_id AND student_id = v_student.id;
  IF v_attacks IS NULL THEN v_attacks := 0; END IF;
  IF v_attacks >= v_raid.max_attacks_per_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'Limite de ataques atingido');
  END IF;

  v_cap := GREATEST(200, COALESCE(v_student.level, 1) * 80 + 400);
  v_dmg := LEAST(p_damage, v_cap);

  v_new_hp := GREATEST(0, v_raid.current_hp - v_dmg);
  IF v_new_hp = 0 THEN
    v_killshot := TRUE;
    v_dmg := v_raid.current_hp;
  END IF;

  v_new_phase  := public._raid_phase(v_new_hp, v_raid.total_hp);
  v_new_status := CASE WHEN v_new_hp = 0 THEN 'defeated' ELSE 'active' END;

  UPDATE public.boss_raids
     SET current_hp   = v_new_hp,
         phase        = v_new_phase,
         status       = v_new_status,
         defeated_at  = CASE WHEN v_new_status = 'defeated' THEN now() ELSE defeated_at END
   WHERE id = p_raid_id;

  INSERT INTO public.boss_raid_contributions
    (raid_id, student_id, damage_dealt, attacks_count, last_attack_at)
  VALUES (p_raid_id, v_student.id, v_dmg, 1, now())
  ON CONFLICT (raid_id, student_id) DO UPDATE
    SET damage_dealt   = boss_raid_contributions.damage_dealt + EXCLUDED.damage_dealt,
        attacks_count  = boss_raid_contributions.attacks_count + 1,
        last_attack_at = EXCLUDED.last_attack_at;

  INSERT INTO public.boss_raid_attacks (raid_id, student_id, damage, phase, was_killshot)
  VALUES (p_raid_id, v_student.id, v_dmg, v_new_phase, v_killshot);

  -- Patch 7.3: on killshot, distribute victory rewards immediately.
  IF v_killshot THEN
    PERFORM public.distribute_raid_rewards(p_raid_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'damage', v_dmg,
    'capped', v_dmg < p_damage,
    'new_hp', v_new_hp,
    'phase', v_new_phase,
    'status', v_new_status,
    'killshot', v_killshot
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.attack_boss_raid(UUID, INTEGER) TO authenticated;

-- ─── Hook 2: auto-distribute on cron expiry ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_raids_tick()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired INTEGER := 0;
  v_row     RECORD;
BEGIN
  FOR v_row IN
    SELECT id FROM public.boss_raids
     WHERE status = 'active' AND ends_at <= now()
     FOR UPDATE
  LOOP
    UPDATE public.boss_raids SET status = 'expired' WHERE id = v_row.id;
    PERFORM public.distribute_raid_rewards(v_row.id);
    v_expired := v_expired + 1;
  END LOOP;

  IF v_expired > 0 THEN
    BEGIN PERFORM log_action('expire_raids_tick', NULL, NULL, NULL, jsonb_build_object('count', v_expired));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  RETURN jsonb_build_object('expired', v_expired);
END;
$$;
GRANT EXECUTE ON FUNCTION public.expire_raids_tick() TO authenticated;

-- ─── Reader for the per-student history panel ───────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_raid_rewards()
RETURNS TABLE (
  raid_id         UUID,
  boss_name       TEXT,
  victory         BOOLEAN,
  contribution_pct NUMERIC,
  coins_awarded   INTEGER,
  diamonds_awarded INTEGER,
  chests_awarded  JSONB,
  is_top          BOOLEAN,
  awarded_at      TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT r.raid_id, br.boss_name, r.victory, r.contribution_pct,
         r.coins_awarded, r.diamonds_awarded, r.chests_awarded, r.is_top, r.awarded_at
    FROM public.boss_raid_rewards r
    JOIN public.boss_raids br ON br.id = r.raid_id
   WHERE r.student_id = v_sid
   ORDER BY r.awarded_at DESC LIMIT 50;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_raid_rewards() TO authenticated;
