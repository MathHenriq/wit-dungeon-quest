-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 5.5 — Card skins (cosmetic only).
--
-- A skin overrides the visual presentation of a base card. Mechanics are
-- identical to the underlying shop_item — skins never touch stats or
-- abilities; they only swap image / border / animation metadata.
--
-- Tables
--   • card_skins              — catalog of skins per base shop_item.
--   • student_unlocked_skins  — per-student unlock + equipped state.
--   • student_card_usage      — usage counter per card (drives mastery).
--
-- Mastery thresholds default to 50 / 100 / 500 uses but each skin can
-- override via mastery_threshold.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.card_skins (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  base_card_id       UUID        NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  name               TEXT        NOT NULL,
  description        TEXT,
  unlock_condition   TEXT        NOT NULL CHECK (unlock_condition IN ('event','mastery','achievement','admin_grant')),
  unlock_payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- e.g. {"event_id": "...", "mastery_threshold": 100}
  visual_data        JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- image_url, frame_style, animation, etc
  is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_skins_base ON public.card_skins (base_card_id);
CREATE INDEX IF NOT EXISTS idx_card_skins_cond ON public.card_skins (unlock_condition) WHERE is_active = TRUE;

ALTER TABLE public.card_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read card_skins" ON public.card_skins FOR SELECT USING (true);

-- Student → skin: unlocked + which one is equipped per base card.
CREATE TABLE IF NOT EXISTS public.student_unlocked_skins (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skin_id       UUID        NOT NULL REFERENCES public.card_skins(id) ON DELETE CASCADE,
  equipped      BOOLEAN     NOT NULL DEFAULT FALSE,
  unlocked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  source        TEXT,                                            -- 'event' | 'mastery' | 'admin' | 'achievement'
  UNIQUE (student_id, skin_id)
);

CREATE INDEX IF NOT EXISTS idx_unlocked_skins_student
  ON public.student_unlocked_skins (student_id);

-- Only one skin equipped per base_card per student. Enforced via a partial
-- unique index keyed by (student_id, base_card_id) when equipped = true.
-- base_card_id isn't on this row directly, so we use a generated key via
-- function index: combine student_id with the skin's base_card_id.
-- Simpler approach: trigger that unequips siblings when one is equipped.
CREATE OR REPLACE FUNCTION public.tg_unique_equipped_skin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_base UUID;
BEGIN
  IF NEW.equipped THEN
    SELECT base_card_id INTO v_base FROM public.card_skins WHERE id = NEW.skin_id;
    UPDATE public.student_unlocked_skins
       SET equipped = FALSE
     WHERE student_id = NEW.student_id
       AND id <> NEW.id
       AND equipped = TRUE
       AND skin_id IN (SELECT id FROM public.card_skins WHERE base_card_id = v_base);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unique_equipped_skin ON public.student_unlocked_skins;
CREATE TRIGGER trg_unique_equipped_skin
AFTER INSERT OR UPDATE OF equipped ON public.student_unlocked_skins
FOR EACH ROW WHEN (NEW.equipped = TRUE)
EXECUTE FUNCTION public.tg_unique_equipped_skin();

ALTER TABLE public.student_unlocked_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read unlocked_skins"
  ON public.student_unlocked_skins FOR SELECT USING (true);

-- Card usage counter (drives mastery unlocks).
CREATE TABLE IF NOT EXISTS public.student_card_usage (
  student_id     UUID        NOT NULL REFERENCES public.students(id)   ON DELETE CASCADE,
  shop_item_id   UUID        NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  usage_count    INTEGER     NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, shop_item_id)
);

CREATE INDEX IF NOT EXISTS idx_card_usage_student ON public.student_card_usage (student_id);

ALTER TABLE public.student_card_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read card_usage"
  ON public.student_card_usage FOR SELECT USING (true);

-- ─── Master RPC: upsert a skin ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.master_upsert_card_skin(
  p_base_card_id     UUID,
  p_name             TEXT,
  p_unlock_condition TEXT,
  p_visual_data      JSONB    DEFAULT '{}'::jsonb,
  p_unlock_payload   JSONB    DEFAULT '{}'::jsonb,
  p_description      TEXT     DEFAULT NULL,
  p_skin_id          UUID     DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID := p_skin_id;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  IF p_unlock_condition NOT IN ('event','mastery','achievement','admin_grant') THEN
    RETURN jsonb_build_object('success', false, 'error', 'unlock_condition inválido');
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.card_skins (base_card_id, name, description, unlock_condition, unlock_payload, visual_data)
    VALUES (p_base_card_id, p_name, p_description, p_unlock_condition, p_unlock_payload, p_visual_data)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.card_skins SET
      base_card_id     = p_base_card_id,
      name             = p_name,
      description      = p_description,
      unlock_condition = p_unlock_condition,
      unlock_payload   = p_unlock_payload,
      visual_data      = p_visual_data
    WHERE id = v_id;
  END IF;

  PERFORM log_action('master_upsert_card_skin', 'card_skins', v_id, p_name, '{}'::jsonb);
  RETURN jsonb_build_object('success', true, 'skin_id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_upsert_card_skin(UUID, TEXT, TEXT, JSONB, JSONB, TEXT, UUID) TO authenticated;

-- ─── Master RPC: grant a skin directly to a student ─────────────────────────
CREATE OR REPLACE FUNCTION public.master_grant_skin(p_student_id UUID, p_skin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  INSERT INTO public.student_unlocked_skins (student_id, skin_id, source)
  VALUES (p_student_id, p_skin_id, 'admin')
  ON CONFLICT (student_id, skin_id) DO NOTHING;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_grant_skin(UUID, UUID) TO authenticated;

-- ─── Student-side: equip / unequip ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.equip_skin(p_skin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID; v_owns BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Sessão expirada'); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Aluno não encontrado'); END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.student_unlocked_skins
     WHERE student_id = v_sid AND skin_id = p_skin_id
  ) INTO v_owns;
  IF NOT v_owns THEN RETURN jsonb_build_object('success', false, 'error', 'Skin não desbloqueada'); END IF;

  UPDATE public.student_unlocked_skins
     SET equipped = TRUE
   WHERE student_id = v_sid AND skin_id = p_skin_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.equip_skin(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.unequip_skin(p_skin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Sessão expirada'); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Aluno não encontrado'); END IF;
  UPDATE public.student_unlocked_skins SET equipped = FALSE
   WHERE student_id = v_sid AND skin_id = p_skin_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.unequip_skin(UUID) TO authenticated;

-- ─── Reader: list skins for a card (locked + unlocked + equipped) ───────────
CREATE OR REPLACE FUNCTION public.get_card_skins_for(p_base_card_id UUID)
RETURNS TABLE (
  skin_id          UUID,
  name             TEXT,
  description      TEXT,
  unlock_condition TEXT,
  unlock_payload   JSONB,
  visual_data      JSONB,
  unlocked         BOOLEAN,
  equipped         BOOLEAN,
  usage_count      INTEGER
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID; v_usage INTEGER;
BEGIN
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  SELECT COALESCE(usage_count, 0) INTO v_usage
    FROM public.student_card_usage
   WHERE student_id = v_sid AND shop_item_id = p_base_card_id;
  IF v_usage IS NULL THEN v_usage := 0; END IF;

  RETURN QUERY
  SELECT
    cs.id, cs.name, cs.description, cs.unlock_condition, cs.unlock_payload, cs.visual_data,
    EXISTS (SELECT 1 FROM public.student_unlocked_skins us
             WHERE us.student_id = v_sid AND us.skin_id = cs.id) AS unlocked,
    COALESCE((SELECT us.equipped FROM public.student_unlocked_skins us
               WHERE us.student_id = v_sid AND us.skin_id = cs.id), false) AS equipped,
    v_usage AS usage_count
  FROM public.card_skins cs
  WHERE cs.base_card_id = p_base_card_id
    AND cs.is_active = true
  ORDER BY cs.created_at;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_card_skins_for(UUID) TO authenticated;

-- Bulk: caller's equipped skins keyed by base_card_id, so the UI can resolve
-- effective visuals in one query.
CREATE OR REPLACE FUNCTION public.get_my_equipped_skins()
RETURNS TABLE (base_card_id UUID, skin_id UUID, visual_data JSONB)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_sid UUID;
BEGIN
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT cs.base_card_id, cs.id, cs.visual_data
    FROM public.student_unlocked_skins us
    JOIN public.card_skins cs ON cs.id = us.skin_id
   WHERE us.student_id = v_sid AND us.equipped = TRUE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_equipped_skins() TO authenticated;

-- ─── Mastery tracking ──────────────────────────────────────────────────────
-- Called from client at battle end with the equipped item_ids. Increments
-- usage_count for each and auto-unlocks any mastery skin whose threshold is
-- now reached.
CREATE OR REPLACE FUNCTION public.increment_my_card_usage(p_item_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_sid       UUID;
  v_unlocked  JSONB := '[]'::jsonb;
  v_iid       UUID;
  v_new_count INTEGER;
  v_skin      RECORD;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('unlocked', v_unlocked); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('unlocked', v_unlocked); END IF;
  IF p_item_ids IS NULL OR cardinality(p_item_ids) = 0 THEN
    RETURN jsonb_build_object('unlocked', v_unlocked);
  END IF;

  FOREACH v_iid IN ARRAY p_item_ids LOOP
    INSERT INTO public.student_card_usage (student_id, shop_item_id, usage_count, updated_at)
    VALUES (v_sid, v_iid, 1, now())
    ON CONFLICT (student_id, shop_item_id) DO UPDATE
      SET usage_count = student_card_usage.usage_count + 1,
          updated_at  = now()
    RETURNING usage_count INTO v_new_count;

    -- Auto-unlock any mastery skins whose threshold is now met.
    FOR v_skin IN
      SELECT cs.id, cs.name,
             COALESCE((cs.unlock_payload->>'mastery_threshold')::INT, 100) AS threshold
        FROM public.card_skins cs
       WHERE cs.base_card_id = v_iid
         AND cs.unlock_condition = 'mastery'
         AND cs.is_active = TRUE
    LOOP
      IF v_new_count >= v_skin.threshold THEN
        INSERT INTO public.student_unlocked_skins (student_id, skin_id, source)
        VALUES (v_sid, v_skin.id, 'mastery')
        ON CONFLICT (student_id, skin_id) DO NOTHING;

        IF FOUND THEN
          v_unlocked := v_unlocked || jsonb_build_object(
            'skin_id', v_skin.id, 'skin_name', v_skin.name, 'item_id', v_iid, 'usage', v_new_count
          );
          INSERT INTO public.student_pending_rewards (student_id, kind, title, body, payload)
          VALUES (
            v_sid, 'skin_unlock',
            format('Nova skin desbloqueada: %s', v_skin.name),
            format('Mestria atingida com %s usos. Equipe pela tela da carta!', v_new_count),
            jsonb_build_object('skin_id', v_skin.id, 'item_id', v_iid)
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('unlocked', v_unlocked);
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_my_card_usage(UUID[]) TO authenticated;
