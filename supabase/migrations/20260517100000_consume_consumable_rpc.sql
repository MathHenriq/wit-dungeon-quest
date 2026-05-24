-- ============================================================
-- WIT Dungeon — Forge wiring into battle
-- RPC to consume one unit of a student_consumables row by key,
-- returning the resulting effect so the BattleEngine can apply it
-- on the client without a second round-trip.
-- ============================================================

CREATE OR REPLACE FUNCTION public.consume_my_consumable(p_consumable_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          UUID := auth.uid();
  v_student_id   UUID;
  v_cons         consumables%ROWTYPE;
  v_remaining    INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_student_id FROM students WHERE user_id = v_uid LIMIT 1;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_cons FROM consumables WHERE key = p_consumable_key;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'consumable_not_found');
  END IF;

  UPDATE student_consumables
  SET    quantity   = quantity - 1,
         updated_at = now()
  WHERE  student_id = v_student_id
    AND  consumable_id = v_cons.id
    AND  quantity > 0
  RETURNING quantity INTO v_remaining;

  IF v_remaining IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'out_of_stock');
  END IF;

  IF v_remaining <= 0 THEN
    DELETE FROM student_consumables
    WHERE student_id = v_student_id AND consumable_id = v_cons.id;
  END IF;

  RETURN jsonb_build_object(
    'success',      true,
    'remaining',    COALESCE(v_remaining, 0),
    'consumable',   jsonb_build_object(
      'key',          v_cons.key,
      'name',         v_cons.name,
      'effect',       v_cons.effect,
      'effect_value', v_cons.effect_value,
      'icon',         v_cons.icon,
      'rarity',       v_cons.rarity
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.consume_my_consumable(TEXT) TO authenticated;
