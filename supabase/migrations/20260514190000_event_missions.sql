-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 5.4 — Event Missions
--
-- Extends student_missions with event_id + a condition spec so missions can
-- auto-complete based on game state during an active event.
--
-- Supported condition_type values:
--   • 'battles_won'        — N battles won during the event
--   • 'bosses_defeated'    — N boss defeats during the event
--   • 'event_chests_opened'— N chests of this event opened
--   • 'floor_reached'      — reach dungeon floor >= N
--   • 'card_obtained'      — own a specific shop_item (condition_payload.shop_item_id)
--
-- Reward additions to missions: coins (existing 'reward'), diamonds,
-- fragments (credited to event_fragments), and a chest_key grant.
--
-- Auto-complete RPC: check_my_event_missions() iterates the caller's active
-- missions and (a) inserts an approved mission_completions row and
-- (b) pays out rewards atomically when targets are met. Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.student_missions
  ADD COLUMN IF NOT EXISTS event_id           UUID    REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS condition_type     TEXT,
  ADD COLUMN IF NOT EXISTS condition_target   INTEGER,
  ADD COLUMN IF NOT EXISTS condition_payload  JSONB,
  ADD COLUMN IF NOT EXISTS reward_diamonds    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_fragments   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_chest_key   TEXT;

CREATE INDEX IF NOT EXISTS idx_student_missions_event
  ON public.student_missions (event_id) WHERE event_id IS NOT NULL;

-- Battle counter per event (used by battles_won/bosses_defeated conditions).
-- Piggybacks on the event_fragments PK so we don't need another table.
ALTER TABLE public.event_fragments
  ADD COLUMN IF NOT EXISTS battles_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bosses_count  INTEGER NOT NULL DEFAULT 0;

-- Re-wire apply_battle_event_fragments to also bump the battle counter, so the
-- counter is always populated even when the fragment roll fails.
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

  FOR v_evt IN SELECT id, name FROM public.events WHERE status = 'active' LOOP
    IF p_is_boss THEN v_inc := 5;
    ELSIF random() < 0.30 THEN v_inc := 1;
    ELSE v_inc := 0; END IF;

    INSERT INTO public.event_fragments
      (event_id, student_id, fragments, last_drop_at, battles_count, bosses_count)
    VALUES (
      v_evt.id, v_student_id, v_inc, CASE WHEN v_inc > 0 THEN now() ELSE NULL END,
      1, CASE WHEN p_is_boss THEN 1 ELSE 0 END
    )
    ON CONFLICT (event_id, student_id) DO UPDATE
      SET fragments     = event_fragments.fragments     + EXCLUDED.fragments,
          last_drop_at  = COALESCE(EXCLUDED.last_drop_at, event_fragments.last_drop_at),
          battles_count = event_fragments.battles_count + 1,
          bosses_count  = event_fragments.bosses_count  + CASE WHEN p_is_boss THEN 1 ELSE 0 END;

    IF v_inc > 0 THEN
      v_drops := v_drops || jsonb_build_object(
        'event_id', v_evt.id, 'event_name', v_evt.name, 'amount', v_inc
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('drops', v_drops);
END;
$$;
GRANT EXECUTE ON FUNCTION public.apply_battle_event_fragments(BOOLEAN) TO authenticated;

-- ─── Master: create / upsert an event mission ───────────────────────────────
CREATE OR REPLACE FUNCTION public.master_upsert_event_mission(
  p_event_id          UUID,
  p_title             TEXT,
  p_description       TEXT,
  p_condition_type    TEXT,
  p_condition_target  INTEGER,
  p_condition_payload JSONB    DEFAULT NULL,
  p_reward_coins      INTEGER  DEFAULT 0,
  p_reward_diamonds   INTEGER  DEFAULT 0,
  p_reward_fragments  INTEGER  DEFAULT 0,
  p_reward_chest_key  TEXT     DEFAULT NULL,
  p_mission_id        UUID     DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID := p_mission_id;
  v_evt events%ROWTYPE;
  v_teacher UUID;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  IF p_condition_type NOT IN ('battles_won','bosses_defeated','event_chests_opened','floor_reached','card_obtained') THEN
    RETURN jsonb_build_object('success', false, 'error', 'condition_type inválido');
  END IF;
  IF COALESCE(p_condition_target, 0) <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'condition_target precisa ser > 0');
  END IF;
  SELECT * INTO v_evt FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Evento não encontrado'); END IF;

  -- student_missions.teacher_id is NOT NULL — pin to the event's teacher
  -- when set, else fall back to the calling admin's teacher row.
  v_teacher := v_evt.teacher_id;
  IF v_teacher IS NULL THEN
    SELECT t.id INTO v_teacher FROM public.teachers t WHERE t.user_id = auth.uid() LIMIT 1;
  END IF;
  IF v_teacher IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'teacher_id não resolvido');
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.student_missions (
      teacher_id, title, description, reward,
      event_id, condition_type, condition_target, condition_payload,
      reward_diamonds, reward_fragments, reward_chest_key,
      is_active, is_return_mission
    ) VALUES (
      v_teacher, p_title, p_description, COALESCE(p_reward_coins, 0),
      p_event_id, p_condition_type, p_condition_target, p_condition_payload,
      COALESCE(p_reward_diamonds, 0), COALESCE(p_reward_fragments, 0), p_reward_chest_key,
      true, false
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.student_missions SET
      title              = p_title,
      description        = p_description,
      reward             = COALESCE(p_reward_coins, 0),
      event_id           = p_event_id,
      condition_type     = p_condition_type,
      condition_target   = p_condition_target,
      condition_payload  = p_condition_payload,
      reward_diamonds    = COALESCE(p_reward_diamonds, 0),
      reward_fragments   = COALESCE(p_reward_fragments, 0),
      reward_chest_key   = p_reward_chest_key
    WHERE id = v_id;
  END IF;

  PERFORM log_action('master_upsert_event_mission', 'student_missions', v_id, p_title,
    jsonb_build_object('event_id', p_event_id, 'condition_type', p_condition_type, 'target', p_condition_target));

  RETURN jsonb_build_object('success', true, 'mission_id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_upsert_event_mission(
  UUID, TEXT, TEXT, TEXT, INTEGER, JSONB, INTEGER, INTEGER, INTEGER, TEXT, UUID
) TO authenticated;

-- ─── List event missions (for admin drawer + student missions board) ────────
CREATE OR REPLACE FUNCTION public.list_event_missions(p_event_id UUID)
RETURNS TABLE (
  id UUID, title TEXT, description TEXT,
  condition_type TEXT, condition_target INTEGER, condition_payload JSONB,
  reward INTEGER, reward_diamonds INTEGER, reward_fragments INTEGER, reward_chest_key TEXT,
  is_active BOOLEAN
)
LANGUAGE sql STABLE
AS $$
  SELECT id, title, description, condition_type, condition_target, condition_payload,
         reward, reward_diamonds, reward_fragments, reward_chest_key, is_active
    FROM public.student_missions
   WHERE event_id = p_event_id
   ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_event_missions(UUID) TO authenticated, anon;

-- ─── Auto-completion evaluator ──────────────────────────────────────────────
-- For the caller, evaluate every active event mission and complete + pay out
-- when targets are reached. Idempotent (skips missions already approved).
CREATE OR REPLACE FUNCTION public.check_my_event_missions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_student   students%ROWTYPE;
  v_completed JSONB := '[]'::jsonb;
  v_m         RECORD;
  v_progress  INTEGER;
  v_already   BOOLEAN;
  v_card_uuid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('completed', v_completed); END IF;
  SELECT * INTO v_student FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_student.id IS NULL THEN RETURN jsonb_build_object('completed', v_completed); END IF;

  FOR v_m IN
    SELECT sm.*, e.status AS event_status, e.starts_at AS event_starts_at
      FROM public.student_missions sm
      JOIN public.events e ON e.id = sm.event_id
     WHERE sm.event_id IS NOT NULL
       AND sm.is_active = true
       AND e.status = 'active'
       AND sm.condition_type IS NOT NULL
       AND sm.condition_target IS NOT NULL
  LOOP
    -- Skip if already completed (approved) for this student.
    SELECT EXISTS (
      SELECT 1 FROM public.mission_completions mc
       WHERE mc.mission_id = v_m.id AND mc.student_id = v_student.id
         AND mc.status = 'approved'
    ) INTO v_already;
    IF v_already THEN CONTINUE; END IF;

    v_progress := 0;

    IF v_m.condition_type = 'battles_won' THEN
      SELECT COALESCE(battles_count, 0) INTO v_progress
        FROM public.event_fragments
       WHERE event_id = v_m.event_id AND student_id = v_student.id;

    ELSIF v_m.condition_type = 'bosses_defeated' THEN
      SELECT COALESCE(bosses_count, 0) INTO v_progress
        FROM public.event_fragments
       WHERE event_id = v_m.event_id AND student_id = v_student.id;

    ELSIF v_m.condition_type = 'event_chests_opened' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.chest_openings co
        JOIN public.chest_types ct ON ct.id = co.chest_type_id
       WHERE co.student_id = v_student.id
         AND ct.event_id = v_m.event_id
         AND co.opened_at >= v_m.event_starts_at;

    ELSIF v_m.condition_type = 'floor_reached' THEN
      SELECT COALESCE(MAX(cp.floor_id), 0)::INT INTO v_progress
        FROM public.character_progress cp
        JOIN public.characters c ON c.id = cp.character_id
       WHERE c.user_id = v_uid;

    ELSIF v_m.condition_type = 'card_obtained' THEN
      v_card_uuid := NULLIF(v_m.condition_payload->>'shop_item_id','')::UUID;
      IF v_card_uuid IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.student_inventory si
         WHERE si.student_id = v_student.id AND si.item_id = v_card_uuid
      ) THEN v_progress := 1; END IF;
    END IF;

    -- Did we hit the target?
    IF v_progress < v_m.condition_target THEN CONTINUE; END IF;

    -- Approve + pay out atomically.
    INSERT INTO public.mission_completions (mission_id, student_id, status, resolved_at)
    VALUES (v_m.id, v_student.id, 'approved', now())
    ON CONFLICT DO NOTHING;

    UPDATE public.students
       SET coins    = coins    + COALESCE(v_m.reward, 0),
           diamonds = COALESCE(diamonds, 0) + COALESCE(v_m.reward_diamonds, 0)
     WHERE id = v_student.id;

    IF COALESCE(v_m.reward_fragments, 0) > 0 THEN
      INSERT INTO public.event_fragments (event_id, student_id, fragments)
      VALUES (v_m.event_id, v_student.id, v_m.reward_fragments)
      ON CONFLICT (event_id, student_id) DO UPDATE
        SET fragments = event_fragments.fragments + EXCLUDED.fragments;
    END IF;

    IF v_m.reward_chest_key IS NOT NULL THEN
      INSERT INTO public.student_chest_grants (student_id, chest_key, reason, source_payload)
      VALUES (v_student.id, v_m.reward_chest_key,
              format('Missão do evento — %s', v_m.title),
              jsonb_build_object('mission_id', v_m.id, 'event_id', v_m.event_id));
    END IF;

    INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
    VALUES (
      v_student.id, 'event_mission',
      format('Missão concluída: %s', v_m.title),
      format('Recompensa: %s moedas%s%s%s.',
        COALESCE(v_m.reward, 0),
        CASE WHEN COALESCE(v_m.reward_diamonds,0)  > 0 THEN format(', %s diamantes',  v_m.reward_diamonds)  ELSE '' END,
        CASE WHEN COALESCE(v_m.reward_fragments,0) > 0 THEN format(', %s fragmentos', v_m.reward_fragments) ELSE '' END,
        CASE WHEN v_m.reward_chest_key IS NOT NULL    THEN format(', baú %s',         v_m.reward_chest_key) ELSE '' END
      ),
      jsonb_build_object('mission_id', v_m.id, 'event_id', v_m.event_id)
    );

    v_completed := v_completed || jsonb_build_object(
      'mission_id', v_m.id, 'title', v_m.title,
      'reward_coins', v_m.reward, 'reward_diamonds', v_m.reward_diamonds,
      'reward_fragments', v_m.reward_fragments, 'reward_chest_key', v_m.reward_chest_key
    );
  END LOOP;

  RETURN jsonb_build_object('completed', v_completed);
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_my_event_missions() TO authenticated;

-- ─── Deactivate event missions when their event ends ────────────────────────
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

  -- Patch 5.4: hide event missions when event ends.
  UPDATE public.student_missions SET is_active = false WHERE event_id = p_event_id;

  v_vault_result := public.open_event_vault_for_all(p_event_id);
  v_vaults := (v_vault_result->>'vaults_opened')::INT;

  PERFORM log_action('end_event', 'events', p_event_id, v_evt.name,
    jsonb_build_object('cards_migrated', v_migrated, 'vaults_opened', v_vaults));
  RETURN jsonb_build_object('success', true, 'cards_migrated', v_migrated, 'vaults_opened', v_vaults);
END;
$$;
GRANT EXECUTE ON FUNCTION public.end_event(UUID) TO authenticated;

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
    -- 5.4: re-activate event missions on auto-start in case they were paused.
    UPDATE public.student_missions SET is_active = true WHERE event_id = v_row.id;
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
