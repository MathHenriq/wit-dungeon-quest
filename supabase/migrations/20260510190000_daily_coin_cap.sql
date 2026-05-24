-- ============================================================
-- Patch 2.3 — Daily coin cap (diminishing returns)
--
-- Why
--   Without a daily limit students were farming the same boss
--   hundreds of times. Decision: no absolute cap (still feels
--   open-ended) but multiplicative diminishing returns after
--   500 / 750 coins earned in a day:
--
--     < 500 earned   → 100 % drops
--     500-750 earned → 75  % drops
--     ≥ 750 earned   → 50  % drops
--
--   Resets at midnight America/Sao_Paulo. New day = new log row.
--   Diamonds are NOT affected (prompt restriction).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_currency_log (
  user_id            UUID         NOT NULL,
  log_date           DATE         NOT NULL,
  coins_earned_today INTEGER      NOT NULL DEFAULT 0,
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, log_date)
);

ALTER TABLE public.daily_currency_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own daily coin log read" ON public.daily_currency_log;
CREATE POLICY "Own daily coin log read"
  ON public.daily_currency_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Inserts/updates are only done via the SECURITY DEFINER RPCs below.
-- Granting INSERT to authenticated would let students fake their own
-- daily total to bypass the cap.

-- ─── Apply cap when crediting coins ─────────────────────────────────────────
-- Called once per coin credit. Returns the effective amount the caller
-- should actually add to students.coins after the multiplier was applied.
CREATE OR REPLACE FUNCTION public.apply_daily_coin_cap(p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID    := auth.uid();
  v_today     DATE    := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_earned    INTEGER;
  v_mult      NUMERIC;
  v_effective INTEGER;
  v_new_total INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    SELECT COALESCE(coins_earned_today, 0) INTO v_earned
    FROM daily_currency_log
    WHERE user_id = v_uid AND log_date = v_today;
    RETURN jsonb_build_object(
      'effective', 0, 'requested', COALESCE(p_amount, 0),
      'multiplier', 1.0, 'earned_today', COALESCE(v_earned, 0)
    );
  END IF;

  -- Ensure today's row exists (cheap upsert), then lock it.
  INSERT INTO daily_currency_log (user_id, log_date, coins_earned_today)
  VALUES (v_uid, v_today, 0)
  ON CONFLICT (user_id, log_date) DO NOTHING;

  SELECT coins_earned_today INTO v_earned
  FROM daily_currency_log
  WHERE user_id = v_uid AND log_date = v_today
  FOR UPDATE;

  -- Multiplier derived from earnings BEFORE this credit. This lets a
  -- single big drop spanning a threshold still pay full value — once
  -- the cumulative crosses the line, subsequent drops are docked.
  IF v_earned < 500 THEN
    v_mult := 1.00;
  ELSIF v_earned < 750 THEN
    v_mult := 0.75;
  ELSE
    v_mult := 0.50;
  END IF;

  v_effective := GREATEST(0, FLOOR(p_amount * v_mult)::INTEGER);
  v_new_total := v_earned + v_effective;

  UPDATE daily_currency_log
  SET coins_earned_today = v_new_total, updated_at = now()
  WHERE user_id = v_uid AND log_date = v_today;

  RETURN jsonb_build_object(
    'effective',    v_effective,
    'requested',    p_amount,
    'multiplier',   v_mult,
    'earned_today', v_new_total,
    'cap_zone',     CASE
      WHEN v_new_total >= 750 THEN 'red'
      WHEN v_new_total >= 500 THEN 'yellow'
      ELSE 'green'
    END
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.apply_daily_coin_cap(INTEGER) TO authenticated;

-- ─── Read-only summary for the HUD ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_daily_coins_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    UUID    := auth.uid();
  v_today  DATE    := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_earned INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  SELECT COALESCE(coins_earned_today, 0) INTO v_earned
  FROM daily_currency_log
  WHERE user_id = v_uid AND log_date = v_today;
  v_earned := COALESCE(v_earned, 0);
  RETURN jsonb_build_object(
    'earned_today',       v_earned,
    'cap_zone',           CASE
      WHEN v_earned >= 750 THEN 'red'
      WHEN v_earned >= 500 THEN 'yellow'
      ELSE 'green'
    END,
    'next_threshold',     CASE
      WHEN v_earned < 500 THEN 500
      WHEN v_earned < 750 THEN 750
      ELSE NULL
    END,
    'current_multiplier', CASE
      WHEN v_earned < 500 THEN 1.00
      WHEN v_earned < 750 THEN 0.75
      ELSE 0.50
    END
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_daily_coins_summary() TO authenticated;
