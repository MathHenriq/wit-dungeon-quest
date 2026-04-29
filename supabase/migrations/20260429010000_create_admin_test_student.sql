-- Admin test student account.
-- Login: teste@teste
-- Password: 123123

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diamonds NUMERIC(10,1) DEFAULT 0;

ALTER TABLE public.character_progress
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DO $$
DECLARE
  v_email        TEXT := 'teste@teste';
  v_password     TEXT := '123123';
  v_xp_level_100 INTEGER := 16912500;
  v_user_id      UUID;
  v_student_id   UUID;
  v_character_id UUID;
  v_teacher_id   UUID;
  v_class_id     UUID;
  v_item_id      UUID;
  v_has_trigger  BOOLEAN;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_user_meta_data, raw_app_meta_data,
      aud, role, is_super_admin,
      confirmation_token, recovery_token
    ) VALUES (
      gen_random_uuid(),
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf', 10)),
      now(), now(), now(),
      '{"name": "Conta ADM Teste"}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      'authenticated', 'authenticated', false,
      '', ''
    )
    RETURNING id INTO v_user_id;
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"name": "Conta ADM Teste"}'::jsonb,
      raw_app_meta_data  = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider": "email", "providers": ["email"]}'::jsonb,
      aud = 'authenticated',
      role = 'authenticated',
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  IF to_regclass('auth.identities') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM auth.identities
      WHERE user_id = v_user_id
        AND provider = 'email'
    ) THEN
      INSERT INTO auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        v_user_id::text,
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
        'email',
        now(), now(), now()
      );
    END IF;
  END IF;

  SELECT c.id, c.teacher_id
  INTO v_class_id, v_teacher_id
  FROM public.classes c
  WHERE c.id = 'f535221f-f28a-4a2c-8813-0f054bc19e3f'::uuid
  LIMIT 1;

  IF v_class_id IS NULL THEN
    SELECT c.id, c.teacher_id
    INTO v_class_id, v_teacher_id
    FROM public.classes c
    ORDER BY c.created_at ASC
    LIMIT 1;
  END IF;

  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Cannot create teste@teste student: no class exists in public.classes';
  END IF;

  SELECT id INTO v_student_id
  FROM public.students
  WHERE user_id = v_user_id
  LIMIT 1;

  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.students'::regclass
      AND tgname = 'enforce_student_character_update_only'
      AND NOT tgisinternal
  ) INTO v_has_trigger;

  IF v_has_trigger THEN
    EXECUTE 'ALTER TABLE public.students DISABLE TRIGGER enforce_student_character_update_only';
  END IF;

  IF v_student_id IS NULL THEN
    INSERT INTO public.students (
      user_id, name, character_name, class_id, teacher_id, status,
      level, xp, coins, diamonds,
      presencas_consecutivas, streak_current, streak_best,
      total_boss_kills, total_pvp_wins, total_missions_completed, total_crafts,
      is_mentor, mentor_xp,
      character_class, race, motivation, lore, appearance, personality,
      attr_forca, attr_destreza, attr_inteligencia, attr_carisma, attr_agilidade, attr_resistencia,
      difficulty_level
    ) VALUES (
      v_user_id, 'Conta ADM Teste', 'Admin Teste', v_class_id, v_teacher_id, 'active',
      100, v_xp_level_100, 999999, 99999.9,
      999, 999, 999,
      999, 999, 999, 999,
      true, 999999,
      'Guerreiro', 'Humano', 'Testar todas as funcionalidades', 'Conta administrativa de testes.',
      'Aventureiro de testes com acesso completo.', 'Curioso, persistente e pronto para quebrar cenarios.',
      999, 999, 999, 999, 999, 999,
      'normal'
    )
    RETURNING id INTO v_student_id;
  ELSE
    UPDATE public.students
    SET
      name = 'Conta ADM Teste',
      character_name = 'Admin Teste',
      class_id = v_class_id,
      teacher_id = v_teacher_id,
      status = 'active',
      level = 100,
      xp = v_xp_level_100,
      coins = 999999,
      diamonds = 99999.9,
      presencas_consecutivas = GREATEST(COALESCE(presencas_consecutivas, 0), 999),
      streak_current = GREATEST(COALESCE(streak_current, 0), 999),
      streak_best = GREATEST(COALESCE(streak_best, 0), 999),
      total_boss_kills = GREATEST(COALESCE(total_boss_kills, 0), 999),
      total_pvp_wins = GREATEST(COALESCE(total_pvp_wins, 0), 999),
      total_missions_completed = GREATEST(COALESCE(total_missions_completed, 0), 999),
      total_crafts = GREATEST(COALESCE(total_crafts, 0), 999),
      is_mentor = true,
      mentor_xp = GREATEST(COALESCE(mentor_xp, 0), 999999),
      character_class = 'Guerreiro',
      race = COALESCE(race, 'Humano'),
      motivation = 'Testar todas as funcionalidades',
      lore = 'Conta administrativa de testes.',
      appearance = 'Aventureiro de testes com acesso completo.',
      personality = 'Curioso, persistente e pronto para quebrar cenarios.',
      attr_forca = 999,
      attr_destreza = 999,
      attr_inteligencia = 999,
      attr_carisma = 999,
      attr_agilidade = 999,
      attr_resistencia = 999,
      difficulty_level = 'normal'
    WHERE id = v_student_id;
  END IF;

  IF v_has_trigger THEN
    EXECUTE 'ALTER TABLE public.students ENABLE TRIGGER enforce_student_character_update_only';
  END IF;

  SELECT id INTO v_character_id
  FROM public.characters
  WHERE user_id = v_user_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_character_id IS NULL THEN
    INSERT INTO public.characters (
      user_id, name, class, level, xp,
      hp_current, hp_max, energy_max,
      forca, inteligencia, destreza, carisma, agilidade, resistencia,
      pts_fire, pts_water, pts_electric, pts_grass, pts_ice, pts_ground,
      pts_fighting, pts_steel, pts_poison, pts_dark, pts_ghost, pts_flying,
      free_points, coins, diamonds
    ) VALUES (
      v_user_id, 'Admin Teste', 'Guerreiro', 100, v_xp_level_100,
      9999, 9999, 9999,
      999, 999, 999, 999, 999, 999,
      999, 999, 999, 999, 999, 999,
      999, 999, 999, 999, 999, 999,
      9999, 999999, 99999.9
    )
    RETURNING id INTO v_character_id;
  ELSE
    UPDATE public.characters
    SET
      name = 'Admin Teste',
      class = 'Guerreiro',
      level = 100,
      xp = v_xp_level_100,
      hp_current = 9999,
      hp_max = 9999,
      energy_max = 9999,
      forca = 999,
      inteligencia = 999,
      destreza = 999,
      carisma = 999,
      agilidade = 999,
      resistencia = 999,
      pts_fire = 999,
      pts_water = 999,
      pts_electric = 999,
      pts_grass = 999,
      pts_ice = 999,
      pts_ground = 999,
      pts_fighting = 999,
      pts_steel = 999,
      pts_poison = 999,
      pts_dark = 999,
      pts_ghost = 999,
      pts_flying = 999,
      free_points = 9999,
      coins = 999999,
      diamonds = 99999.9,
      updated_at = now()
    WHERE id = v_character_id;
  END IF;

  DELETE FROM public.character_abilities
  WHERE character_id = v_character_id;

  INSERT INTO public.character_abilities (character_id, ability_id, slot)
  SELECT v_character_id, a.id, row_number() OVER (ORDER BY a.tier DESC, a.base_damage DESC NULLS LAST, a.id)::int
  FROM public.abilities a
  ORDER BY a.tier DESC, a.base_damage DESC NULLS LAST, a.id
  LIMIT 4
  ON CONFLICT (character_id, slot) DO UPDATE
    SET ability_id = EXCLUDED.ability_id;

  INSERT INTO public.student_inventory (student_id, item_id, is_equipped, equipped_slot)
  SELECT v_student_id, si.id, false, NULL
  FROM public.shop_items si
  WHERE si.is_active = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.student_inventory inv
      WHERE inv.student_id = v_student_id
        AND inv.item_id = si.id
    );

  SELECT id INTO v_item_id
  FROM public.shop_items
  WHERE is_active = true
  ORDER BY
    CASE rarity
      WHEN 'unknown' THEN 7
      WHEN 'mythic' THEN 6
      WHEN 'legendary' THEN 5
      WHEN 'epic' THEN 4
      WHEN 'rare' THEN 3
      WHEN 'uncommon' THEN 2
      ELSE 1
    END DESC,
    cost DESC
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    UPDATE public.student_inventory
    SET is_equipped = false, equipped_slot = NULL
    WHERE student_id = v_student_id;

    UPDATE public.student_inventory
    SET is_equipped = true, equipped_slot = 'weapon'
    WHERE student_id = v_student_id
      AND item_id = v_item_id;
  END IF;

  INSERT INTO public.character_progress (
    character_id, floor_id, enemies_defeated, boss_defeated,
    times_completed, best_time_seconds, completed_at
  )
  SELECT
    v_character_id,
    f.id,
    COALESCE(enemy_counts.total_enemies, 0),
    true,
    1,
    1,
    now()
  FROM public.floors f
  LEFT JOIN (
    SELECT floor_id, count(*)::int AS total_enemies
    FROM public.enemies
    GROUP BY floor_id
  ) enemy_counts ON enemy_counts.floor_id = f.id
  ON CONFLICT (character_id, floor_id) DO UPDATE
    SET enemies_defeated = GREATEST(public.character_progress.enemies_defeated, EXCLUDED.enemies_defeated),
        boss_defeated = true,
        times_completed = GREATEST(public.character_progress.times_completed, 1),
        best_time_seconds = COALESCE(LEAST(public.character_progress.best_time_seconds, 1), 1),
        completed_at = COALESCE(public.character_progress.completed_at, now());

  INSERT INTO public.floor_enemy_defeats (character_id, enemy_id, defeated_at)
  SELECT v_character_id, e.id, now()
  FROM public.enemies e
  ON CONFLICT (character_id, enemy_id) DO NOTHING;
END $$;
