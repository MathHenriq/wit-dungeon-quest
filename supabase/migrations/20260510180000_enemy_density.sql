-- ============================================================
-- Patch 2.2 — Enemy density bump
--
-- Adds extra enemies per floor following the prompt's rule:
--   floors  1-10  → +1 enemy
--   floors 11-20  → +2 enemies
--   floors 21-30  → +3 enemies
--
-- Strategy
--   For each floor, pick the highest-level non-boss enemy already
--   placed there and clone it N times with a roman-numeral suffix
--   in the name (" II", " III", " IV") so the migration is
--   idempotent — re-running it does nothing once the dupes exist.
--
--   New rows leave position_x / position_y NULL: the FloorMap's
--   fallback positioning (useFloors.ts) lays them out automatically
--   so the designer doesn't have to manually re-author coords.
--
-- HP / def values are kept as the clone's baseline; the runtime
-- scaler (enemyScaling.ts) applies the floor curve on top.
-- ============================================================

DO $$
DECLARE
  v_floor RECORD;
  v_seed  RECORD;
  v_extra INT;
  v_i     INT;
  v_suffix TEXT;
BEGIN
  FOR v_floor IN
    SELECT id, floor_number
    FROM   public.floors
    ORDER BY floor_number
  LOOP
    -- Decide how many extra enemies this floor should get.
    IF    v_floor.floor_number BETWEEN  1 AND 10 THEN v_extra := 1;
    ELSIF v_floor.floor_number BETWEEN 11 AND 20 THEN v_extra := 2;
    ELSIF v_floor.floor_number BETWEEN 21 AND 30 THEN v_extra := 3;
    ELSE  v_extra := 0;
    END IF;

    IF v_extra = 0 THEN CONTINUE; END IF;

    -- Pick a representative non-boss enemy to clone (highest level on the floor).
    SELECT *
    INTO   v_seed
    FROM   public.enemies
    WHERE  floor_id = v_floor.id
      AND  COALESCE(is_boss, false) = false
      AND  name NOT LIKE '% II'
      AND  name NOT LIKE '% III'
      AND  name NOT LIKE '% IV'
    ORDER BY level DESC NULLS LAST, name
    LIMIT 1;

    -- Floor has no eligible enemy (shouldn't happen on seeded data); skip.
    IF v_seed.id IS NULL THEN CONTINUE; END IF;

    FOR v_i IN 1..v_extra LOOP
      v_suffix := CASE v_i WHEN 1 THEN ' II' WHEN 2 THEN ' III' WHEN 3 THEN ' IV' ELSE ' V' END;

      -- Idempotency guard: skip if the clone already exists.
      IF EXISTS (
        SELECT 1 FROM public.enemies
        WHERE floor_id = v_floor.id AND name = v_seed.name || v_suffix
      ) THEN
        CONTINUE;
      END IF;

      INSERT INTO public.enemies (
        id, floor_id, name, level, is_boss, lore,
        hp_max, def_fisica, def_magica, velocidade, element_type, sprite_url,
        ability_1, ability_2, ability_3, ability_4,
        special_ability_name, special_ability_effect, special_trigger,
        position_x, position_y, icon_type
      ) VALUES (
        gen_random_uuid(),
        v_floor.id,
        v_seed.name || v_suffix,
        v_seed.level,
        false,
        v_seed.lore,
        v_seed.hp_max,
        v_seed.def_fisica,
        v_seed.def_magica,
        v_seed.velocidade,
        v_seed.element_type,
        v_seed.sprite_url,
        v_seed.ability_1,
        v_seed.ability_2,
        v_seed.ability_3,
        v_seed.ability_4,
        v_seed.special_ability_name,
        v_seed.special_ability_effect,
        v_seed.special_trigger,
        50,                   -- sentinel; FloorMap fallback positions take over
        50,
        COALESCE(v_seed.icon_type, 'skull')
      );
    END LOOP;
  END LOOP;
END $$;
