-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 7.1 — Cooperative Guild Boss Raids.
--
-- Shared HP pool that every guild member can chip away at via individual
-- battles. The boss has 4 mechanical phases driven by current_hp / total_hp
-- thresholds; the phase is recomputed on every successful damage write so
-- clients fetching the raid row always see the current phase atomically.
--
-- Concurrency: HP decrement happens inside a single `UPDATE … RETURNING`
-- against the raid row using GREATEST(0, current_hp - $delta). The WHERE
-- clause also pins status='active' so a "killshot" by one player and a
-- simultaneous attack by another cannot both apply damage past zero.
--
-- Per-member attack cap is enforced by an UPSERT on
-- boss_raid_contributions with attacks_count incremented; the RPC rejects
-- the call if the count would exceed the cap.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.boss_raids (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id      UUID        NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  boss_id       UUID        NOT NULL REFERENCES public.enemies(id),
  boss_name     TEXT        NOT NULL,
  boss_sprite   TEXT,
  total_hp      INTEGER     NOT NULL,
  current_hp    INTEGER     NOT NULL,
  phase         INTEGER     NOT NULL DEFAULT 1 CHECK (phase BETWEEN 1 AND 4),
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','defeated','expired')),
  max_attacks_per_member INTEGER NOT NULL DEFAULT 5,
  starts_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at       TIMESTAMPTZ NOT NULL,
  defeated_at   TIMESTAMPTZ,
  created_by    UUID                 REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boss_raids_guild  ON public.boss_raids (guild_id, status);
CREATE INDEX IF NOT EXISTS idx_boss_raids_ends   ON public.boss_raids (status, ends_at);

ALTER TABLE public.boss_raids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read boss_raids" ON public.boss_raids FOR SELECT USING (true);

-- Contributions per member.
CREATE TABLE IF NOT EXISTS public.boss_raid_contributions (
  raid_id        UUID        NOT NULL REFERENCES public.boss_raids(id) ON DELETE CASCADE,
  student_id     UUID        NOT NULL REFERENCES public.students(id)   ON DELETE CASCADE,
  damage_dealt   INTEGER     NOT NULL DEFAULT 0,
  attacks_count  INTEGER     NOT NULL DEFAULT 0,
  last_attack_at TIMESTAMPTZ,
  PRIMARY KEY (raid_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_raid_contrib_raid
  ON public.boss_raid_contributions (raid_id, damage_dealt DESC);

ALTER TABLE public.boss_raid_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read boss_raid_contributions"
  ON public.boss_raid_contributions FOR SELECT USING (true);

-- Per-attack audit log (also helps with "concurrent double-attack" forensics).
CREATE TABLE IF NOT EXISTS public.boss_raid_attacks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id     UUID        NOT NULL REFERENCES public.boss_raids(id) ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES public.students(id)   ON DELETE CASCADE,
  damage      INTEGER     NOT NULL,
  phase       INTEGER     NOT NULL,
  was_killshot BOOLEAN    NOT NULL DEFAULT FALSE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_raid_attacks_raid ON public.boss_raid_attacks (raid_id, occurred_at);
ALTER TABLE public.boss_raid_attacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read raid_attacks" ON public.boss_raid_attacks FOR SELECT USING (true);

-- Helper: phase from hp ratio.
CREATE OR REPLACE FUNCTION public._raid_phase(p_current INTEGER, p_total INTEGER)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_total <= 0 OR p_current >= p_total * 0.75 THEN 1
    WHEN p_current >= p_total * 0.50 THEN 2
    WHEN p_current >= p_total * 0.25 THEN 3
    ELSE 4
  END;
$$;

-- ─── Master: create a raid for a guild ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.master_create_boss_raid(
  p_guild_id  UUID,
  p_boss_id   UUID,
  p_hours     INTEGER DEFAULT 24,
  p_total_hp  INTEGER DEFAULT NULL,
  p_max_per_member INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    UUID := auth.uid();
  v_id     UUID;
  v_boss   enemies%ROWTYPE;
  v_hp     INTEGER;
  v_member_count INTEGER;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  SELECT * INTO v_boss FROM public.enemies WHERE id = p_boss_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inimigo não encontrado');
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM public.guild_members WHERE guild_id = p_guild_id;

  -- Default total_hp scales with guild member count: boss base HP × members × 8
  -- (so a raid is meant to take ~all members spending most attacks).
  v_hp := COALESCE(p_total_hp, GREATEST(2000, COALESCE(v_boss.hp_max, 500) * GREATEST(v_member_count, 3) * 8));

  INSERT INTO public.boss_raids (
    guild_id, boss_id, boss_name, boss_sprite,
    total_hp, current_hp, phase, status, max_attacks_per_member,
    starts_at, ends_at, created_by
  ) VALUES (
    p_guild_id, p_boss_id, v_boss.name, v_boss.sprite_url,
    v_hp, v_hp, 1, 'active', COALESCE(p_max_per_member, 5),
    now(), now() + (p_hours || ' hours')::interval, v_uid
  ) RETURNING id INTO v_id;

  PERFORM log_action('master_create_boss_raid', 'boss_raids', v_id, v_boss.name,
    jsonb_build_object('guild_id', p_guild_id, 'total_hp', v_hp, 'hours', p_hours));

  RETURN jsonb_build_object('success', true, 'raid_id', v_id, 'total_hp', v_hp);
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_create_boss_raid(UUID, UUID, INTEGER, INTEGER, INTEGER) TO authenticated;

-- ─── Student attack RPC ─────────────────────────────────────────────────────
-- Atomic: locks the raid row, validates membership + attack cap + status,
-- applies clamped damage, recomputes phase, marks defeated if HP drops to 0.
--
-- Server caps damage at student.level * 80 + 400 to neutralize a tampered
-- client. Honest clients computed `damage` from a real battle simulation.
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

  -- Lock the raid row for serial decrement.
  SELECT * INTO v_raid FROM public.boss_raids
   WHERE id = p_raid_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Raid não encontrada');
  END IF;
  IF v_raid.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Raid já encerrada');
  END IF;
  IF v_raid.ends_at <= now() THEN
    -- Auto-expire if the cron hasn't fired yet.
    UPDATE public.boss_raids SET status = 'expired' WHERE id = p_raid_id;
    RETURN jsonb_build_object('success', false, 'error', 'Raid expirada');
  END IF;

  -- Caller must be in the same guild as the raid.
  SELECT guild_id INTO v_member_g FROM public.guild_members WHERE student_id = v_student.id LIMIT 1;
  IF v_member_g IS NULL OR v_member_g <> v_raid.guild_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pertence à guilda do raid');
  END IF;

  -- Attack cap check.
  SELECT attacks_count INTO v_attacks
    FROM public.boss_raid_contributions
   WHERE raid_id = p_raid_id AND student_id = v_student.id;
  IF v_attacks IS NULL THEN v_attacks := 0; END IF;
  IF v_attacks >= v_raid.max_attacks_per_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'Limite de ataques atingido');
  END IF;

  -- Damage cap.
  v_cap := GREATEST(200, COALESCE(v_student.level, 1) * 80 + 400);
  v_dmg := LEAST(p_damage, v_cap);

  -- Clamp against remaining HP for clean accounting + killshot detection.
  v_new_hp := GREATEST(0, v_raid.current_hp - v_dmg);
  IF v_new_hp = 0 THEN
    v_killshot := TRUE;
    v_dmg := v_raid.current_hp;  -- only what was needed counts in the log
  END IF;

  v_new_phase  := public._raid_phase(v_new_hp, v_raid.total_hp);
  v_new_status := CASE WHEN v_new_hp = 0 THEN 'defeated' ELSE 'active' END;

  UPDATE public.boss_raids
     SET current_hp   = v_new_hp,
         phase        = v_new_phase,
         status       = v_new_status,
         defeated_at  = CASE WHEN v_new_status = 'defeated' THEN now() ELSE defeated_at END
   WHERE id = p_raid_id;

  -- Upsert contribution.
  INSERT INTO public.boss_raid_contributions
    (raid_id, student_id, damage_dealt, attacks_count, last_attack_at)
  VALUES (p_raid_id, v_student.id, v_dmg, 1, now())
  ON CONFLICT (raid_id, student_id) DO UPDATE
    SET damage_dealt   = boss_raid_contributions.damage_dealt + EXCLUDED.damage_dealt,
        attacks_count  = boss_raid_contributions.attacks_count + 1,
        last_attack_at = EXCLUDED.last_attack_at;

  INSERT INTO public.boss_raid_attacks (raid_id, student_id, damage, phase, was_killshot)
  VALUES (p_raid_id, v_student.id, v_dmg, v_new_phase, v_killshot);

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

-- ─── Read RPCs ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_active_raid_for_guild(p_guild_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_raid JSONB;
  v_contrib JSONB;
BEGIN
  SELECT to_jsonb(r) INTO v_raid FROM public.boss_raids r
   WHERE r.guild_id = p_guild_id AND r.status = 'active'
   ORDER BY r.created_at DESC LIMIT 1;
  IF v_raid IS NULL THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'student_id', c.student_id,
    'student_name', COALESCE(s.character_name, s.name),
    'damage_dealt', c.damage_dealt,
    'attacks_count', c.attacks_count
  ) ORDER BY c.damage_dealt DESC), '[]'::jsonb)
    INTO v_contrib
    FROM public.boss_raid_contributions c
    JOIN public.students s ON s.id = c.student_id
   WHERE c.raid_id = (v_raid->>'id')::UUID;

  RETURN jsonb_build_object('raid', v_raid, 'contributions', v_contrib);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_active_raid_for_guild(UUID) TO authenticated;

-- ─── Cron: auto-expire raids whose ends_at has passed ───────────────────────
CREATE OR REPLACE FUNCTION public.expire_raids_tick()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_n INTEGER := 0;
BEGIN
  UPDATE public.boss_raids
     SET status = 'expired'
   WHERE status = 'active' AND ends_at <= now();
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n > 0 THEN
    BEGIN PERFORM log_action('expire_raids_tick', NULL, NULL, NULL, jsonb_build_object('count', v_n));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  RETURN jsonb_build_object('expired', v_n);
END;
$$;
GRANT EXECUTE ON FUNCTION public.expire_raids_tick() TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('expire_raids_tick')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire_raids_tick');
    PERFORM cron.schedule('expire_raids_tick', '*/15 * * * *',
      $cron$SELECT public.expire_raids_tick();$cron$);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$$;

-- ─── Enable Realtime publication for boss_raids ────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.boss_raids;
  EXCEPTION WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.boss_raid_contributions;
  EXCEPTION WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END;
$$;
