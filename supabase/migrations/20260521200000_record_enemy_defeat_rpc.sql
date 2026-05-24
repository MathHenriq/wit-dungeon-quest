-- Floor unlock was broken: useRecordEnemyDefeat does
--   1. INSERT INTO floor_enemy_defeats (RLS-checked)
--   2. count enemies
--   3. UPSERT character_progress (RLS-checked)
-- If step 1 throws because of an RLS quirk (characters.user_id mismatch,
-- admin/legacy student, etc.), the boss_defeated flag never gets to true
-- and the next floor stays locked even after killing the boss.
--
-- This RPC does all three atomically with SECURITY DEFINER, ownership
-- verified once at the top via characters.user_id = auth.uid().

CREATE OR REPLACE FUNCTION public.record_enemy_defeat(
  p_character_id UUID,
  p_floor_id     BIGINT,
  p_enemy_id     UUID,
  p_is_boss      BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid              UUID := auth.uid();
  v_owner            UUID;
  v_real_defeated    INTEGER;
  v_prev_boss        BOOLEAN;
  v_prev_completed   TIMESTAMPTZ;
  v_new_boss         BOOLEAN;
  v_new_completed    TIMESTAMPTZ;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Ownership: must be the character's owner.
  SELECT user_id INTO v_owner FROM characters WHERE id = p_character_id;
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
  END IF;
  IF v_owner <> v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  -- 1. Record the individual defeat (idempotent on the PK).
  INSERT INTO floor_enemy_defeats (character_id, enemy_id)
    VALUES (p_character_id, p_enemy_id)
    ON CONFLICT (character_id, enemy_id) DO NOTHING;

  -- 2. Recount non-boss defeats for the floor.
  SELECT COUNT(*) INTO v_real_defeated
    FROM floor_enemy_defeats fed
    JOIN enemies e ON e.id = fed.enemy_id
   WHERE fed.character_id = p_character_id
     AND e.floor_id       = p_floor_id
     AND e.is_boss        = false;

  -- 3. Read existing progress (if any).
  SELECT boss_defeated, completed_at
    INTO v_prev_boss, v_prev_completed
    FROM character_progress
   WHERE character_id = p_character_id
     AND floor_id     = p_floor_id;

  v_prev_boss      := COALESCE(v_prev_boss, false);
  v_new_boss       := p_is_boss OR v_prev_boss;
  v_new_completed  := CASE
    WHEN p_is_boss AND NOT v_prev_boss THEN NOW()
    ELSE v_prev_completed
  END;

  -- 4. Upsert the floor summary.
  INSERT INTO character_progress (character_id, floor_id, enemies_defeated, boss_defeated, completed_at)
    VALUES (p_character_id, p_floor_id, v_real_defeated, v_new_boss, v_new_completed)
    ON CONFLICT (character_id, floor_id) DO UPDATE
      SET enemies_defeated = EXCLUDED.enemies_defeated,
          boss_defeated    = EXCLUDED.boss_defeated,
          completed_at     = EXCLUDED.completed_at;

  RETURN jsonb_build_object(
    'success', true,
    'enemies_defeated', v_real_defeated,
    'boss_defeated',    v_new_boss,
    'completed_at',     v_new_completed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_enemy_defeat(UUID, BIGINT, UUID, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
