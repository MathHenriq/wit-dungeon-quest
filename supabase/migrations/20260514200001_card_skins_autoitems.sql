-- Patch 5.5 (follow-up) — When increment_my_card_usage is called without an
-- explicit item list, derive the list from the student's currently equipped
-- inventory rows. Lets the battle-end hook call the RPC with no payload.

CREATE OR REPLACE FUNCTION public.increment_my_card_usage(p_item_ids UUID[] DEFAULT NULL)
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
  v_ids       UUID[];
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('unlocked', v_unlocked); END IF;
  SELECT id INTO v_sid FROM public.students WHERE user_id = v_uid LIMIT 1;
  IF v_sid IS NULL THEN RETURN jsonb_build_object('unlocked', v_unlocked); END IF;

  IF p_item_ids IS NULL OR cardinality(p_item_ids) = 0 THEN
    -- Default: every currently equipped inventory item.
    SELECT COALESCE(array_agg(DISTINCT item_id), ARRAY[]::UUID[]) INTO v_ids
      FROM public.student_inventory
     WHERE student_id = v_sid AND is_equipped = TRUE;
  ELSE
    v_ids := p_item_ids;
  END IF;

  IF v_ids IS NULL OR cardinality(v_ids) = 0 THEN
    RETURN jsonb_build_object('unlocked', v_unlocked);
  END IF;

  FOREACH v_iid IN ARRAY v_ids LOOP
    INSERT INTO public.student_card_usage (student_id, shop_item_id, usage_count, updated_at)
    VALUES (v_sid, v_iid, 1, now())
    ON CONFLICT (student_id, shop_item_id) DO UPDATE
      SET usage_count = student_card_usage.usage_count + 1,
          updated_at  = now()
    RETURNING usage_count INTO v_new_count;

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
