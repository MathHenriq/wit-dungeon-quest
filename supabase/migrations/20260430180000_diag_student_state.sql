-- Temporary diagnostic RPC: returns the full character/progress state
-- for a given student. SECURITY DEFINER bypasses anon GRANT/RLS so the
-- terminal scripts can see what we actually have.
-- Will be dropped after the relink work finishes.
CREATE OR REPLACE FUNCTION public.diag_student_state(p_student_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH s AS (
    SELECT * FROM public.students WHERE id = p_student_id
  ),
  cur AS (
    SELECT c.id AS cur_char_id
    FROM   public.characters c
    WHERE  c.user_id = (SELECT user_id FROM s)
  )
  SELECT jsonb_build_object(
    'student',
      (SELECT to_jsonb(s.*) FROM public.students s WHERE s.id = p_student_id),
    'current_chars',
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name, 'level', c.level, 'xp', c.xp,
          'created_at', c.created_at, 'updated_at', c.updated_at,
          'defeats',       (SELECT count(*) FROM public.floor_enemy_defeats fed WHERE fed.character_id = c.id),
          'progress_rows', (SELECT count(*) FROM public.character_progress    cp WHERE cp.character_id = c.id),
          'progress',      (SELECT jsonb_agg(jsonb_build_object(
                              'floor_id', cp.floor_id,
                              'enemies_defeated', cp.enemies_defeated,
                              'boss_defeated', cp.boss_defeated,
                              'completed_at', cp.completed_at))
                            FROM public.character_progress cp WHERE cp.character_id = c.id)
        ))
        FROM   public.characters c
        WHERE  c.user_id = (SELECT user_id FROM s)
      ), '[]'::jsonb),
    'orphan_chars_with_progress',
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.id, 'user_id', c.user_id, 'name', c.name,
          'level', c.level, 'xp', c.xp, 'updated_at', c.updated_at,
          'defeats',       (SELECT count(*) FROM public.floor_enemy_defeats fed WHERE fed.character_id = c.id),
          'progress_rows', (SELECT count(*) FROM public.character_progress    cp WHERE cp.character_id = c.id)
        ))
        FROM   public.characters c
        WHERE  c.user_id IS DISTINCT FROM (SELECT user_id FROM s)
          AND  (
                c.user_id IS NULL
             OR NOT EXISTS (SELECT 1 FROM public.students s3 WHERE s3.user_id = c.user_id)
          )
          AND  (
                EXISTS (SELECT 1 FROM public.floor_enemy_defeats fed WHERE fed.character_id = c.id)
             OR EXISTS (SELECT 1 FROM public.character_progress cp WHERE cp.character_id = c.id)
          )
      ), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.diag_student_state(UUID) TO anon, authenticated;
