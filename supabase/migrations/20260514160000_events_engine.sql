-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 5.1 — Events Engine
--
-- Tables
--   • events            — seasonal/on-demand event with lifecycle state.
--   • event_cards       — exclusive cards available *only* during the event.
--                         When the event ends they migrate to the regular pool.
--
-- We don't fork shop_items. Instead, shop_items gains an event_id (nullable)
-- + is_event_exclusive flag — when an event ends we just flip the flag to
-- false so the items become normal pool drops. This avoids data duplication
-- and keeps the existing chest randomizer unchanged from the consumer side.
-- Filtering happens at the SELECT site (open_chest, shop list) by ignoring
-- rows where is_event_exclusive = true.
--
-- Lifecycle
--   draft     → master created the event but hasn't agendado nem ativado.
--   scheduled → starts_at is set; cron auto-flips to active when due.
--   active    → cards/chests are obtainable. Auto-ends when ends_at passes.
--   ended     → cards migrated to pool, event chests deactivated.
--   cancelled → master killed the event before it ran.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id        UUID                 REFERENCES public.teachers(id) ON DELETE SET NULL, -- NULL = global
  name              TEXT        NOT NULL,
  theme             TEXT,
  description       TEXT,
  banner_image_url  TEXT,
  color_primary     TEXT        DEFAULT '#f59e0b',
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  status            TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','scheduled','active','ended','cancelled')),
  created_by        UUID                 REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_events_status_starts ON public.events (status, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_status_ends   ON public.events (status, ends_at);
CREATE INDEX IF NOT EXISTS idx_events_teacher       ON public.events (teacher_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);

-- event_cards: join table tracking which shop_items belong to the event +
-- whether they've been migrated back to the common pool.
CREATE TABLE IF NOT EXISTS public.event_cards (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id           UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  shop_item_id       UUID        NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  migrated_to_pool   BOOLEAN     NOT NULL DEFAULT FALSE,
  migrated_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, shop_item_id)
);

CREATE INDEX IF NOT EXISTS idx_event_cards_event ON public.event_cards (event_id);
CREATE INDEX IF NOT EXISTS idx_event_cards_item  ON public.event_cards (shop_item_id);

ALTER TABLE public.event_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read event_cards" ON public.event_cards FOR SELECT USING (true);

-- Add event_id + is_event_exclusive to shop_items (idempotent).
ALTER TABLE public.shop_items
  ADD COLUMN IF NOT EXISTS event_id            UUID    REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_event_exclusive  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_shop_items_event
  ON public.shop_items (event_id) WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shop_items_exclusive
  ON public.shop_items (is_event_exclusive) WHERE is_event_exclusive = TRUE;

-- Add event_id to chest_types so a chest can be tagged as event-specific.
ALTER TABLE public.chest_types
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chest_types_event
  ON public.chest_types (event_id) WHERE event_id IS NOT NULL;

-- ─── Master RPCs ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_event(
  p_name        TEXT,
  p_theme       TEXT,
  p_description TEXT,
  p_starts_at   TIMESTAMPTZ DEFAULT NULL,
  p_ends_at     TIMESTAMPTZ DEFAULT NULL,
  p_banner_url  TEXT DEFAULT NULL,
  p_color       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id  UUID;
  v_status TEXT;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Sessão expirada'); END IF;
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nome obrigatório');
  END IF;
  IF p_ends_at IS NOT NULL AND p_starts_at IS NOT NULL AND p_ends_at <= p_starts_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data final deve ser depois da inicial');
  END IF;

  v_status := CASE
    WHEN p_starts_at IS NOT NULL AND p_starts_at <= now() THEN 'draft' -- still draft until master starts
    WHEN p_starts_at IS NOT NULL THEN 'scheduled'
    ELSE 'draft'
  END;

  INSERT INTO public.events (
    name, theme, description, starts_at, ends_at,
    banner_image_url, color_primary, status, created_by
  ) VALUES (
    trim(p_name), p_theme, p_description, p_starts_at, p_ends_at,
    p_banner_url, COALESCE(p_color, '#f59e0b'), v_status, v_uid
  ) RETURNING id INTO v_id;

  PERFORM log_action('create_event', 'events', v_id, p_name,
    jsonb_build_object('status', v_status, 'starts_at', p_starts_at, 'ends_at', p_ends_at));

  RETURN jsonb_build_object('success', true, 'event_id', v_id, 'status', v_status);
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_event(TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evt events%ROWTYPE;
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

  -- Activate event chests + mark event cards as exclusive.
  UPDATE public.chest_types SET is_active = true WHERE event_id = p_event_id;
  UPDATE public.shop_items
     SET is_event_exclusive = true, is_active = true
   WHERE event_id = p_event_id;

  PERFORM log_action('start_event', 'events', p_event_id, v_evt.name, '{}'::jsonb);
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.start_event(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.end_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evt events%ROWTYPE;
  v_migrated INTEGER;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  SELECT * INTO v_evt FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Evento não encontrado'); END IF;
  IF v_evt.status NOT IN ('active','scheduled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Evento já encerrado');
  END IF;

  UPDATE public.events
     SET status = 'ended', ended_at = now()
   WHERE id = p_event_id;

  -- Migrate cards: flip exclusivity off so the regular pool starts dropping them.
  UPDATE public.shop_items
     SET is_event_exclusive = false
   WHERE event_id = p_event_id AND is_event_exclusive = true;

  UPDATE public.event_cards
     SET migrated_to_pool = true, migrated_at = now()
   WHERE event_id = p_event_id AND migrated_to_pool = false
  RETURNING 1 INTO v_migrated;
  GET DIAGNOSTICS v_migrated = ROW_COUNT;

  -- Deactivate event chests (they're not for sale anymore).
  UPDATE public.chest_types SET is_active = false WHERE event_id = p_event_id;

  PERFORM log_action('end_event', 'events', p_event_id, v_evt.name,
    jsonb_build_object('cards_migrated', v_migrated));
  RETURN jsonb_build_object('success', true, 'cards_migrated', v_migrated);
END;
$$;
GRANT EXECUTE ON FUNCTION public.end_event(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_evt events%ROWTYPE;
BEGIN
  IF NOT public.is_caller_admin() THEN RETURN jsonb_build_object('success', false, 'error', 'Acesso negado'); END IF;
  SELECT * INTO v_evt FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Não encontrado'); END IF;
  IF v_evt.status NOT IN ('draft','scheduled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas eventos não iniciados podem ser cancelados');
  END IF;
  UPDATE public.events SET status = 'cancelled' WHERE id = p_event_id;
  PERFORM log_action('cancel_event','events', p_event_id, v_evt.name, '{}'::jsonb);
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_event(UUID) TO authenticated;

-- Link / unlink a card to/from an event (master only).
CREATE OR REPLACE FUNCTION public.attach_event_card(p_event_id UUID, p_shop_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_status TEXT;
BEGIN
  IF NOT public.is_caller_admin() THEN RETURN jsonb_build_object('success', false, 'error', 'Acesso negado'); END IF;
  SELECT status INTO v_status FROM public.events WHERE id = p_event_id;
  IF v_status IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Evento não encontrado'); END IF;
  IF v_status = 'ended' OR v_status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Evento já finalizado');
  END IF;

  INSERT INTO public.event_cards (event_id, shop_item_id) VALUES (p_event_id, p_shop_item_id)
    ON CONFLICT (event_id, shop_item_id) DO NOTHING;
  UPDATE public.shop_items
     SET event_id = p_event_id,
         is_event_exclusive = (v_status = 'active')
   WHERE id = p_shop_item_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.attach_event_card(UUID, UUID) TO authenticated;

-- ─── Lifecycle cron job (hourly) ────────────────────────────────────────────
-- Auto-starts scheduled events whose starts_at has passed and auto-ends
-- active events whose ends_at has passed.
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
  -- Auto-start
  FOR v_row IN
    SELECT id FROM public.events
     WHERE status = 'scheduled' AND starts_at IS NOT NULL AND starts_at <= now()
     FOR UPDATE
  LOOP
    PERFORM public.start_event(v_row.id);
    v_started := v_started + 1;
  END LOOP;

  -- Auto-end
  FOR v_row IN
    SELECT id FROM public.events
     WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at <= now()
     FOR UPDATE
  LOOP
    PERFORM public.end_event(v_row.id);
    v_ended := v_ended + 1;
  END LOOP;

  IF v_started > 0 OR v_ended > 0 THEN
    BEGIN
      PERFORM public.log_action('event_lifecycle_tick', NULL, NULL, NULL,
        jsonb_build_object('started', v_started, 'ended', v_ended));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  RETURN jsonb_build_object('started', v_started, 'ended', v_ended);
END;
$$;
GRANT EXECUTE ON FUNCTION public.event_lifecycle_tick() TO authenticated;

-- BUT start_event / end_event check is_caller_admin(). Inside the cron context
-- auth.uid() is NULL so the gate would block. We need a SECURITY DEFINER wrapper
-- that bypasses the gate. Re-define event_lifecycle_tick to call the table
-- transitions directly rather than the master RPCs.
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
  -- Auto-start
  FOR v_row IN
    SELECT id, name FROM public.events
     WHERE status = 'scheduled' AND starts_at IS NOT NULL AND starts_at <= now()
     FOR UPDATE
  LOOP
    UPDATE public.events
       SET status = 'active', started_at = now()
     WHERE id = v_row.id;
    UPDATE public.chest_types SET is_active = true WHERE event_id = v_row.id;
    UPDATE public.shop_items SET is_event_exclusive = true, is_active = true WHERE event_id = v_row.id;
    BEGIN PERFORM log_action('auto_start_event','events', v_row.id, v_row.name, '{}'::jsonb); EXCEPTION WHEN OTHERS THEN NULL; END;
    v_started := v_started + 1;
  END LOOP;

  -- Auto-end
  FOR v_row IN
    SELECT id, name FROM public.events
     WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at <= now()
     FOR UPDATE
  LOOP
    UPDATE public.events SET status = 'ended', ended_at = now() WHERE id = v_row.id;
    UPDATE public.shop_items
       SET is_event_exclusive = false
     WHERE event_id = v_row.id AND is_event_exclusive = true;
    UPDATE public.event_cards
       SET migrated_to_pool = true, migrated_at = now()
     WHERE event_id = v_row.id AND migrated_to_pool = false;
    UPDATE public.chest_types SET is_active = false WHERE event_id = v_row.id;
    BEGIN PERFORM log_action('auto_end_event','events', v_row.id, v_row.name, '{}'::jsonb); EXCEPTION WHEN OTHERS THEN NULL; END;
    v_ended := v_ended + 1;
  END LOOP;

  RETURN jsonb_build_object('started', v_started, 'ended', v_ended);
END;
$$;

-- Schedule it (hourly at HH:30 — picked to avoid clashing with the Monday
-- weekly cron at HH:01/05). Using pg_cron — already installed by 4.1.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('event_lifecycle_tick')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'event_lifecycle_tick');
    PERFORM cron.schedule(
      'event_lifecycle_tick',
      '30 * * * *', -- every hour at :30
      $cron$SELECT public.event_lifecycle_tick();$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$$;

-- ─── Public read helpers ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_active_events()
RETURNS TABLE (
  id UUID, name TEXT, theme TEXT, description TEXT,
  banner_image_url TEXT, color_primary TEXT,
  starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT id, name, theme, description, banner_image_url, color_primary, starts_at, ends_at
    FROM public.events
   WHERE status = 'active'
   ORDER BY started_at DESC NULLS LAST, created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_active_events() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_event_detail(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_evt JSONB;
  v_cards JSONB;
  v_chests JSONB;
BEGIN
  SELECT to_jsonb(e) INTO v_evt FROM public.events e WHERE e.id = p_event_id;
  IF v_evt IS NULL THEN RETURN jsonb_build_object('error','not_found'); END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', si.id, 'name', si.name, 'rarity', si.rarity, 'image_url', si.image_url,
    'category', si.category, 'description', si.description,
    'migrated_to_pool', ec.migrated_to_pool
  ) ORDER BY si.rarity, si.name), '[]'::jsonb)
    INTO v_cards
    FROM public.event_cards ec
    JOIN public.shop_items si ON si.id = ec.shop_item_id
   WHERE ec.event_id = p_event_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ct.id, 'chest_key', ct.chest_key, 'name', ct.name, 'tier', ct.tier,
    'cost_coins', ct.cost_coins, 'cost_diamonds', ct.cost_diamonds,
    'description', ct.description
  ) ORDER BY ct.tier), '[]'::jsonb)
    INTO v_chests
    FROM public.chest_types ct
   WHERE ct.event_id = p_event_id;

  RETURN jsonb_build_object('event', v_evt, 'cards', v_cards, 'chests', v_chests);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_event_detail(UUID) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.list_events_admin()
RETURNS TABLE (
  id UUID, name TEXT, theme TEXT, status TEXT,
  starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ,
  card_count INT, chest_count INT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_caller_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT e.id, e.name, e.theme, e.status, e.starts_at, e.ends_at,
         e.created_at, e.started_at, e.ended_at,
         (SELECT COUNT(*)::INT FROM public.event_cards ec WHERE ec.event_id = e.id),
         (SELECT COUNT(*)::INT FROM public.chest_types ct WHERE ct.event_id = e.id)
    FROM public.events e
   ORDER BY
     CASE e.status WHEN 'active' THEN 0 WHEN 'scheduled' THEN 1 WHEN 'draft' THEN 2 WHEN 'ended' THEN 3 ELSE 4 END,
     e.starts_at DESC NULLS LAST, e.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_events_admin() TO authenticated;
