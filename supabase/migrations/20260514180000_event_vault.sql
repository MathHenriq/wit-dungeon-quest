-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 5.3 — Event Vault (Fragment system).
--
-- During an active event:
--   • Each battle the student wins has a 30% chance to drop 1 fragment
--     (boss battles: guaranteed 5 fragments).
-- At event end:
--   • The vault opens for every student with fragments > 0.
--   • Rewards are issued for every threshold reached (cumulative).
--
-- Ladder
--   50  → Baú Comum  (chest_key global_common)
--   200 → Baú Raro   (chest_key global_rare)
--   500 → Baú Mítico (chest_key global_mythic)
--   1000 → Carta exclusiva Lendária do evento, garantida.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_fragments (
  event_id      UUID        NOT NULL REFERENCES public.events(id)   ON DELETE CASCADE,
  student_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fragments     INTEGER     NOT NULL DEFAULT 0,
  last_drop_at  TIMESTAMPTZ,
  PRIMARY KEY (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_event_fragments_student
  ON public.event_fragments (student_id);
CREATE INDEX IF NOT EXISTS idx_event_fragments_event
  ON public.event_fragments (event_id);

ALTER TABLE public.event_fragments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read event_fragments"
  ON public.event_fragments FOR SELECT USING (true);

-- Vault openings — historical record of rewards delivered + idempotency.
CREATE TABLE IF NOT EXISTS public.event_vault_openings (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id           UUID        NOT NULL REFERENCES public.events(id)   ON DELETE CASCADE,
  student_id         UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fragments_total    INTEGER     NOT NULL,
  rewards            JSONB       NOT NULL DEFAULT '[]'::jsonb,
  opened_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  shown_at           TIMESTAMPTZ,                          -- when student saw the cinematic
  UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_vault_openings_student
  ON public.event_vault_openings (student_id, shown_at);

ALTER TABLE public.event_vault_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read event_vault_openings"
  ON public.event_vault_openings FOR SELECT USING (true);

-- ─── Drop fragments on battle victory ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_battle_event_fragments(p_is_boss BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_student_id UUID;
  v_drops     JSONB := '[]'::JSONB;
  v_evt       RECORD;
  v_inc       INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('drops', v_drops); END IF;
  SELECT id INTO v_student_id FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_student_id IS NULL THEN RETURN jsonb_build_object('drops', v_drops); END IF;

  -- For each currently active event, roll for a fragment drop.
  FOR v_evt IN
    SELECT id, name FROM public.events WHERE status = 'active'
  LOOP
    -- 30% for normal battles, guaranteed 5 for bosses.
    IF p_is_boss THEN
      v_inc := 5;
    ELSIF random() < 0.30 THEN
      v_inc := 1;
    ELSE
      v_inc := 0;
    END IF;

    IF v_inc > 0 THEN
      INSERT INTO public.event_fragments (event_id, student_id, fragments, last_drop_at)
      VALUES (v_evt.id, v_student_id, v_inc, now())
      ON CONFLICT (event_id, student_id) DO UPDATE
        SET fragments    = event_fragments.fragments + EXCLUDED.fragments,
            last_drop_at = EXCLUDED.last_drop_at;

      v_drops := v_drops || jsonb_build_object(
        'event_id', v_evt.id, 'event_name', v_evt.name, 'amount', v_inc
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('drops', v_drops);
END;
$$;
GRANT EXECUTE ON FUNCTION public.apply_battle_event_fragments(BOOLEAN) TO authenticated;

-- ─── Reader for the progress bar ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_event_fragments()
RETURNS TABLE (
  event_id        UUID,
  event_name      TEXT,
  color_primary   TEXT,
  fragments       INTEGER,
  ends_at         TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;

  -- Include events that are active OR ended-but-not-yet-shown. Active drives
  -- the progress bar; ended drives "your fragments at end" for the modal.
  RETURN QUERY
  SELECT e.id, e.name, e.color_primary,
         COALESCE(f.fragments, 0)::INT,
         e.ends_at
    FROM public.events e
    LEFT JOIN public.event_fragments f
           ON f.event_id = e.id AND f.student_id = v_sid
   WHERE e.status = 'active'
      OR (e.status = 'ended' AND COALESCE(f.fragments, 0) > 0)
   ORDER BY e.starts_at DESC NULLS LAST;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_event_fragments() TO authenticated;

-- ─── Vault opening: distribute rewards based on accumulated fragments ───────
-- Idempotent via UNIQUE (event_id, student_id) on event_vault_openings.
CREATE OR REPLACE FUNCTION public.open_event_vault_for(
  p_event_id UUID,
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_frag        INTEGER;
  v_event       events%ROWTYPE;
  v_existing    event_vault_openings%ROWTYPE;
  v_rewards     JSONB := '[]'::jsonb;
  v_grant_id    UUID;
  v_pick_id     UUID;
  v_pick_name   TEXT;
BEGIN
  -- Already opened? Return existing payload (idempotent).
  SELECT * INTO v_existing FROM public.event_vault_openings
   WHERE event_id = p_event_id AND student_id = p_student_id
   LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'already_opened', true,
      'fragments_total', v_existing.fragments_total, 'rewards', v_existing.rewards);
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'evento_nao_encontrado'); END IF;

  SELECT COALESCE(fragments, 0) INTO v_frag
    FROM public.event_fragments
   WHERE event_id = p_event_id AND student_id = p_student_id;
  IF v_frag IS NULL THEN v_frag := 0; END IF;
  IF v_frag <= 0 THEN
    -- Still record the "open" so we don't recheck.
    INSERT INTO public.event_vault_openings (event_id, student_id, fragments_total, rewards)
    VALUES (p_event_id, p_student_id, 0, '[]'::jsonb)
    ON CONFLICT (event_id, student_id) DO NOTHING;
    RETURN jsonb_build_object('success', true, 'fragments_total', 0, 'rewards', '[]'::jsonb);
  END IF;

  -- Ladder: 50 / 200 / 500 / 1000 (cumulative, all reached marks fire).
  IF v_frag >= 50 THEN
    INSERT INTO public.student_chest_grants (student_id, chest_key, reason, source_payload)
    VALUES (p_student_id, 'global_common',
      format('Cofre do evento — %s', v_event.name),
      jsonb_build_object('event_id', p_event_id, 'threshold', 50))
    RETURNING id INTO v_grant_id;
    v_rewards := v_rewards || jsonb_build_object(
      'threshold', 50, 'kind', 'chest_grant', 'chest_key', 'global_common', 'grant_id', v_grant_id);
  END IF;

  IF v_frag >= 200 THEN
    INSERT INTO public.student_chest_grants (student_id, chest_key, reason, source_payload)
    VALUES (p_student_id, 'global_rare',
      format('Cofre do evento — %s', v_event.name),
      jsonb_build_object('event_id', p_event_id, 'threshold', 200))
    RETURNING id INTO v_grant_id;
    v_rewards := v_rewards || jsonb_build_object(
      'threshold', 200, 'kind', 'chest_grant', 'chest_key', 'global_rare', 'grant_id', v_grant_id);
  END IF;

  IF v_frag >= 500 THEN
    INSERT INTO public.student_chest_grants (student_id, chest_key, reason, source_payload)
    VALUES (p_student_id, 'global_mythic',
      format('Cofre do evento — %s', v_event.name),
      jsonb_build_object('event_id', p_event_id, 'threshold', 500))
    RETURNING id INTO v_grant_id;
    v_rewards := v_rewards || jsonb_build_object(
      'threshold', 500, 'kind', 'chest_grant', 'chest_key', 'global_mythic', 'grant_id', v_grant_id);
  END IF;

  IF v_frag >= 1000 THEN
    -- Pick a random legendary event card the student does NOT already own.
    SELECT si.id, si.name INTO v_pick_id, v_pick_name
      FROM public.event_cards ec
      JOIN public.shop_items si ON si.id = ec.shop_item_id
     WHERE ec.event_id = p_event_id
       AND si.rarity = 'legendary'
       AND NOT EXISTS (
         SELECT 1 FROM public.student_inventory inv
          WHERE inv.student_id = p_student_id AND inv.item_id = si.id
       )
     ORDER BY random() LIMIT 1;

    IF v_pick_id IS NOT NULL THEN
      INSERT INTO public.student_inventory (student_id, item_id)
      VALUES (p_student_id, v_pick_id)
      ON CONFLICT DO NOTHING;
      v_rewards := v_rewards || jsonb_build_object(
        'threshold', 1000, 'kind', 'card', 'card_id', v_pick_id, 'card_name', v_pick_name);
    ELSE
      -- All legendaries already owned — fallback to an extra Mythic chest.
      INSERT INTO public.student_chest_grants (student_id, chest_key, reason, source_payload)
      VALUES (p_student_id, 'global_mythic',
        format('Cofre do evento — %s (fallback)', v_event.name),
        jsonb_build_object('event_id', p_event_id, 'threshold', 1000, 'fallback', true))
      RETURNING id INTO v_grant_id;
      v_rewards := v_rewards || jsonb_build_object(
        'threshold', 1000, 'kind', 'chest_grant_fallback', 'chest_key', 'global_mythic', 'grant_id', v_grant_id);
    END IF;
  END IF;

  INSERT INTO public.event_vault_openings (event_id, student_id, fragments_total, rewards)
  VALUES (p_event_id, p_student_id, v_frag, v_rewards)
  ON CONFLICT (event_id, student_id) DO NOTHING;

  -- Pending reward notification so the student sees a toast on next login.
  INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
  VALUES (
    p_student_id, 'event_vault',
    format('Cofre do evento %s aberto!', v_event.name),
    format('Você acumulou %s fragmentos e recebeu %s recompensa(s).',
           v_frag, jsonb_array_length(v_rewards)),
    jsonb_build_object('event_id', p_event_id, 'fragments_total', v_frag, 'rewards', v_rewards)
  );

  RETURN jsonb_build_object('success', true, 'fragments_total', v_frag, 'rewards', v_rewards);
END;
$$;
GRANT EXECUTE ON FUNCTION public.open_event_vault_for(UUID, UUID) TO authenticated;

-- Bulk: open the vault for every student with fragments > 0 in the event.
CREATE OR REPLACE FUNCTION public.open_event_vault_for_all(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row     RECORD;
  v_count   INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT student_id FROM public.event_fragments
     WHERE event_id = p_event_id AND fragments > 0
  LOOP
    PERFORM public.open_event_vault_for(p_event_id, v_row.student_id);
    v_count := v_count + 1;
  END LOOP;

  BEGIN
    PERFORM public.log_action('open_event_vault_for_all', 'events', p_event_id, NULL,
      jsonb_build_object('vaults_opened', v_count));
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN jsonb_build_object('vaults_opened', v_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.open_event_vault_for_all(UUID) TO authenticated;

-- ─── Re-wire end_event + event_lifecycle_tick to auto-open vaults ───────────
CREATE OR REPLACE FUNCTION public.end_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evt events%ROWTYPE;
  v_migrated INTEGER;
  v_vaults INTEGER := 0;
  v_vault_result JSONB;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  SELECT * INTO v_evt FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Evento não encontrado'); END IF;
  IF v_evt.status NOT IN ('active','scheduled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Evento já encerrado');
  END IF;

  UPDATE public.events SET status = 'ended', ended_at = now() WHERE id = p_event_id;
  UPDATE public.shop_items SET is_event_exclusive = false WHERE event_id = p_event_id AND is_event_exclusive = true;
  UPDATE public.event_cards SET migrated_to_pool = true, migrated_at = now()
   WHERE event_id = p_event_id AND migrated_to_pool = false;
  GET DIAGNOSTICS v_migrated = ROW_COUNT;
  UPDATE public.chest_types SET is_active = false WHERE event_id = p_event_id;

  -- Open vaults for participants.
  v_vault_result := public.open_event_vault_for_all(p_event_id);
  v_vaults := (v_vault_result->>'vaults_opened')::INT;

  PERFORM log_action('end_event', 'events', p_event_id, v_evt.name,
    jsonb_build_object('cards_migrated', v_migrated, 'vaults_opened', v_vaults));
  RETURN jsonb_build_object('success', true, 'cards_migrated', v_migrated, 'vaults_opened', v_vaults);
END;
$$;
GRANT EXECUTE ON FUNCTION public.end_event(UUID) TO authenticated;

-- Re-wire event_lifecycle_tick to also open vaults on auto-end.
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
    PERFORM public.open_event_vault_for_all(v_row.id);
    BEGIN PERFORM log_action('auto_end_event','events', v_row.id, v_row.name, '{}'::jsonb); EXCEPTION WHEN OTHERS THEN NULL; END;
    v_ended := v_ended + 1;
  END LOOP;

  RETURN jsonb_build_object('started', v_started, 'ended', v_ended);
END;
$$;
GRANT EXECUTE ON FUNCTION public.event_lifecycle_tick() TO authenticated;

-- ─── Student-facing: list unread vault openings (for cinematic) + history ────
CREATE OR REPLACE FUNCTION public.get_my_unread_vaults()
RETURNS TABLE (
  opening_id    UUID,
  event_id      UUID,
  event_name    TEXT,
  color_primary TEXT,
  fragments_total INTEGER,
  rewards       JSONB,
  opened_at     TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT vo.id, vo.event_id, e.name, e.color_primary,
         vo.fragments_total, vo.rewards, vo.opened_at
    FROM public.event_vault_openings vo
    JOIN public.events e ON e.id = vo.event_id
   WHERE vo.student_id = v_sid AND vo.shown_at IS NULL
   ORDER BY vo.opened_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_unread_vaults() TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_vault_shown(p_opening_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID; v_n INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN 0; END IF;
  UPDATE public.event_vault_openings
     SET shown_at = now()
   WHERE id = p_opening_id AND student_id = v_sid AND shown_at IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_vault_shown(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_vault_history()
RETURNS TABLE (
  event_id        UUID,
  event_name      TEXT,
  fragments_total INTEGER,
  rewards         JSONB,
  opened_at       TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT vo.event_id, e.name, vo.fragments_total, vo.rewards, vo.opened_at
    FROM public.event_vault_openings vo
    JOIN public.events e ON e.id = vo.event_id
   WHERE vo.student_id = v_sid
   ORDER BY vo.opened_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_vault_history() TO authenticated;
