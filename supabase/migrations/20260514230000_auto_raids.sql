-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 7.2 — Automated monthly + event-driven boss raid spawning.
--
-- Two spawners:
--   • spawn_monthly_raids() — runs day 1 of every month at 00:00 BRT.
--     For each guild with at least 1 member, spawns a 5-day raid with a
--     rotating boss picked deterministically by `month_idx % boss_count`.
--   • spawn_event_boss_raids(event_id) — fires when an event starts (manual
--     start_event or auto via event_lifecycle_tick). Uses
--     events.event_boss_id when set; falls back to monthly rotation logic.
--
-- Notifications: a `student_pending_rewards` row is inserted for every
-- guild member, so they get a toast on their next login.
--
-- Idempotency: each spawner checks for an existing active raid in the same
-- guild for the same "spawn window" (monthly key or event id) before
-- inserting. Re-running is safe.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Optional thematic boss reference on events.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_boss_id UUID REFERENCES public.enemies(id) ON DELETE SET NULL;

-- 2. Helper: pick the canonical monthly boss for a given month index. Uses
--    `enemies` filtered by is_boss=true ordered by id, OFFSET by month_idx.
CREATE OR REPLACE FUNCTION public._pick_monthly_boss(p_month_idx INTEGER)
RETURNS UUID
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_count INTEGER;
  v_off   INTEGER;
  v_id    UUID;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.enemies WHERE is_boss = TRUE;
  IF v_count = 0 THEN RETURN NULL; END IF;
  v_off := COALESCE(p_month_idx, 0) % v_count;
  SELECT id INTO v_id FROM public.enemies
   WHERE is_boss = TRUE
   ORDER BY id
   OFFSET v_off LIMIT 1;
  RETURN v_id;
END;
$$;

-- 3. Helper: spawn a single raid for a guild + boss with notifications.
--    Idempotent on (guild_id, source_key) — won't double-spawn for the
--    same monthly cycle / event.
CREATE OR REPLACE FUNCTION public._spawn_raid_for_guild(
  p_guild_id   UUID,
  p_boss_id    UUID,
  p_hours      INTEGER,
  p_source     TEXT,                -- 'monthly:2026-05' | 'event:<uuid>'
  p_title      TEXT,
  p_body       TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id          UUID;
  v_existing    UUID;
  v_boss        enemies%ROWTYPE;
  v_members     INTEGER;
  v_total_hp    INTEGER;
  v_row         RECORD;
BEGIN
  -- Skip if there's already an active raid for this guild from the same
  -- source (we encode source in the boss_raids audit via log_action, so we
  -- detect duplicates by querying the action_log).
  SELECT br.id INTO v_existing
    FROM public.boss_raids br
    JOIN public.action_log al
      ON al.target_table = 'boss_raids' AND al.target_id = br.id
   WHERE br.guild_id = p_guild_id
     AND br.status = 'active'
     AND al.action = 'spawn_raid'
     AND al.payload->>'source' = p_source
   ORDER BY br.created_at DESC LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  SELECT * INTO v_boss FROM public.enemies WHERE id = p_boss_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COUNT(*) INTO v_members FROM public.guild_members WHERE guild_id = p_guild_id;
  IF v_members = 0 THEN RETURN NULL; END IF;

  v_total_hp := GREATEST(2000, COALESCE(v_boss.hp_max, 500) * GREATEST(v_members, 3) * 8);

  INSERT INTO public.boss_raids (
    guild_id, boss_id, boss_name, boss_sprite,
    total_hp, current_hp, phase, status, max_attacks_per_member,
    starts_at, ends_at
  ) VALUES (
    p_guild_id, p_boss_id, v_boss.name, v_boss.sprite_url,
    v_total_hp, v_total_hp, 1, 'active', 5,
    now(), now() + (p_hours || ' hours')::interval
  ) RETURNING id INTO v_id;

  -- Tag the raid in action_log so the idempotency check above can see it.
  BEGIN
    PERFORM public.log_action(
      'spawn_raid', 'boss_raids', v_id, v_boss.name,
      jsonb_build_object('source', p_source, 'guild_id', p_guild_id, 'total_hp', v_total_hp)
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Notify every guild member via the pending_rewards inbox.
  FOR v_row IN
    SELECT gm.student_id FROM public.guild_members gm WHERE gm.guild_id = p_guild_id
  LOOP
    INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
    VALUES (
      v_row.student_id, 'raid_spawn',
      p_title, p_body,
      jsonb_build_object('raid_id', v_id, 'boss_name', v_boss.name, 'source', p_source)
    );
  END LOOP;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public._spawn_raid_for_guild(UUID, UUID, INTEGER, TEXT, TEXT, TEXT) TO authenticated;

-- 4. Monthly spawner.
CREATE OR REPLACE FUNCTION public.spawn_monthly_raids()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brt_now  TIMESTAMP := (now() AT TIME ZONE 'America/Sao_Paulo')::timestamp;
  v_month_idx INTEGER;
  v_source   TEXT;
  v_boss_id  UUID;
  v_g        RECORD;
  v_spawned  INTEGER := 0;
  v_skipped  INTEGER := 0;
  v_id       UUID;
BEGIN
  v_month_idx := EXTRACT(YEAR FROM v_brt_now)::INT * 12 + EXTRACT(MONTH FROM v_brt_now)::INT;
  v_source   := 'monthly:' || to_char(v_brt_now, 'YYYY-MM');
  v_boss_id  := public._pick_monthly_boss(v_month_idx);
  IF v_boss_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no boss defined');
  END IF;

  FOR v_g IN SELECT id, name FROM public.guilds LOOP
    v_id := public._spawn_raid_for_guild(
      v_g.id, v_boss_id, 24 * 5, v_source,
      'Sua guilda foi convocada!',
      format('Boss mensal — %s. A guilda %s tem 5 dias para derrotá-lo.',
             (SELECT name FROM public.enemies WHERE id = v_boss_id), v_g.name)
    );
    IF v_id IS NULL THEN v_skipped := v_skipped + 1;
    ELSE v_spawned := v_spawned + 1; END IF;
  END LOOP;

  BEGIN
    PERFORM public.log_action(
      'spawn_monthly_raids', NULL, NULL, NULL,
      jsonb_build_object('source', v_source, 'spawned', v_spawned, 'skipped', v_skipped)
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN jsonb_build_object('success', true, 'spawned', v_spawned, 'skipped', v_skipped, 'source', v_source);
END;
$$;
GRANT EXECUTE ON FUNCTION public.spawn_monthly_raids() TO authenticated;

-- 5. Event spawner.
CREATE OR REPLACE FUNCTION public.spawn_event_boss_raids(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event   events%ROWTYPE;
  v_boss_id UUID;
  v_g       RECORD;
  v_spawned INTEGER := 0;
  v_skipped INTEGER := 0;
  v_id      UUID;
  v_source  TEXT;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'event_not_found'); END IF;

  v_boss_id := COALESCE(
    v_event.event_boss_id,
    public._pick_monthly_boss(EXTRACT(YEAR FROM now())::INT * 12 + EXTRACT(MONTH FROM now())::INT)
  );
  IF v_boss_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'no_boss'); END IF;

  v_source := 'event:' || p_event_id::text;

  FOR v_g IN SELECT id, name FROM public.guilds LOOP
    v_id := public._spawn_raid_for_guild(
      v_g.id, v_boss_id, 24 * 7, v_source,
      'Boss do evento surgiu!',
      format('Evento "%s" — Boss %s convocado para a guilda %s. 7 dias.',
             v_event.name, (SELECT name FROM public.enemies WHERE id = v_boss_id), v_g.name)
    );
    IF v_id IS NULL THEN v_skipped := v_skipped + 1;
    ELSE v_spawned := v_spawned + 1; END IF;
  END LOOP;

  BEGIN
    PERFORM public.log_action(
      'spawn_event_boss_raids', 'events', p_event_id, v_event.name,
      jsonb_build_object('spawned', v_spawned, 'skipped', v_skipped, 'boss_id', v_boss_id)
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN jsonb_build_object('success', true, 'spawned', v_spawned, 'skipped', v_skipped);
END;
$$;
GRANT EXECUTE ON FUNCTION public.spawn_event_boss_raids(UUID) TO authenticated;

-- 6. Wire into event lifecycle. We extend start_event (manual) and
--    event_lifecycle_tick (auto) to call spawn_event_boss_raids on event
--    activation. Both are safe to re-run thanks to the idempotency check
--    in _spawn_raid_for_guild.
CREATE OR REPLACE FUNCTION public.start_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_evt events%ROWTYPE;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  SELECT * INTO v_evt FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Evento não encontrado'); END IF;
  IF v_evt.status NOT IN ('draft','scheduled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Evento não pode ser iniciado neste estado');
  END IF;

  UPDATE public.events
     SET status = 'active', started_at = now(),
         starts_at = COALESCE(starts_at, now())
   WHERE id = p_event_id;

  UPDATE public.chest_types SET is_active = true WHERE event_id = p_event_id;
  UPDATE public.shop_items
     SET is_event_exclusive = true, is_active = true
   WHERE event_id = p_event_id;

  -- Patch 7.2: convoca boss do evento para todas as guildas.
  PERFORM public.spawn_event_boss_raids(p_event_id);

  PERFORM log_action('start_event', 'events', p_event_id, v_evt.name, '{}'::jsonb);
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.start_event(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.event_lifecycle_tick()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started INTEGER := 0;
  v_ended   INTEGER := 0;
  v_row     RECORD;
BEGIN
  FOR v_row IN
    SELECT id, name FROM public.events
     WHERE status = 'scheduled' AND starts_at IS NOT NULL AND starts_at <= now()
     FOR UPDATE
  LOOP
    UPDATE public.events SET status = 'active', started_at = now() WHERE id = v_row.id;
    UPDATE public.chest_types SET is_active = true WHERE event_id = v_row.id;
    UPDATE public.shop_items SET is_event_exclusive = true, is_active = true WHERE event_id = v_row.id;
    UPDATE public.student_missions SET is_active = true WHERE event_id = v_row.id;
    -- Patch 7.2: spawn event boss raid on auto-start.
    PERFORM public.spawn_event_boss_raids(v_row.id);
    BEGIN PERFORM log_action('auto_start_event','events', v_row.id, v_row.name, '{}'::jsonb); EXCEPTION WHEN OTHERS THEN NULL; END;
    v_started := v_started + 1;
  END LOOP;

  FOR v_row IN
    SELECT id, name FROM public.events
     WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at <= now()
     FOR UPDATE
  LOOP
    UPDATE public.events SET status = 'ended', ended_at = now() WHERE id = v_row.id;
    UPDATE public.shop_items SET is_event_exclusive = false WHERE event_id = v_row.id AND is_event_exclusive = true;
    UPDATE public.event_cards SET migrated_to_pool = true, migrated_at = now()
     WHERE event_id = v_row.id AND migrated_to_pool = false;
    UPDATE public.chest_types SET is_active = false WHERE event_id = v_row.id;
    UPDATE public.student_missions SET is_active = false WHERE event_id = v_row.id;
    PERFORM public.open_event_vault_for_all(v_row.id);
    BEGIN PERFORM log_action('auto_end_event','events', v_row.id, v_row.name, '{}'::jsonb); EXCEPTION WHEN OTHERS THEN NULL; END;
    v_ended := v_ended + 1;
  END LOOP;

  RETURN jsonb_build_object('started', v_started, 'ended', v_ended);
END;
$$;
GRANT EXECUTE ON FUNCTION public.event_lifecycle_tick() TO authenticated;

-- 7. Schedule monthly cron (day 1, 03:00 UTC = 00:00 BRT).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('spawn_monthly_raids')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'spawn_monthly_raids');
    PERFORM cron.schedule(
      'spawn_monthly_raids',
      '0 3 1 * *',
      $cron$SELECT public.spawn_monthly_raids();$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$$;
