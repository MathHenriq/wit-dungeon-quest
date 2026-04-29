-- Make floor progress visible/editable to the owning student and re-apply the
-- admin test account floor unlocks.

ALTER TABLE public.character_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'character_progress'
      AND policyname = 'student reads own floor progress'
  ) THEN
    CREATE POLICY "student reads own floor progress"
      ON public.character_progress
      FOR SELECT
      USING (
        character_id IN (
          SELECT id FROM public.characters WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'character_progress'
      AND policyname = 'student inserts own floor progress'
  ) THEN
    CREATE POLICY "student inserts own floor progress"
      ON public.character_progress
      FOR INSERT
      WITH CHECK (
        character_id IN (
          SELECT id FROM public.characters WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'character_progress'
      AND policyname = 'student updates own floor progress'
  ) THEN
    CREATE POLICY "student updates own floor progress"
      ON public.character_progress
      FOR UPDATE
      USING (
        character_id IN (
          SELECT id FROM public.characters WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        character_id IN (
          SELECT id FROM public.characters WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
DECLARE
  v_user_id      UUID;
  v_character_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('teste@teste')
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'teste@teste auth user not found; skipping floor progress backfill';
    RETURN;
  END IF;

  SELECT id INTO v_character_id
  FROM public.characters
  WHERE user_id = v_user_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_character_id IS NULL THEN
    RAISE NOTICE 'teste@teste character not found; skipping floor progress backfill';
    RETURN;
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
END $$;
