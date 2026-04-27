-- ─────────────────────────────────────────────────────────────────────────────
-- Guild Enhancements
-- • emblem_color column
-- • Expanded role hierarchy (lider, vice_lider, capitao, major, tenente, soldado)
-- • Composite guild score function + global ranking view
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. emblem_color column -------------------------------------------------------
ALTER TABLE public.guilds
  ADD COLUMN IF NOT EXISTS emblem_color TEXT NOT NULL DEFAULT '#825ADB';

-- 2. Expanded role hierarchy ---------------------------------------------------
-- Drop old CHECK constraint (name may vary, so use a DO block to be safe)
DO $$
DECLARE
  v_con TEXT;
BEGIN
  SELECT conname INTO v_con
  FROM pg_constraint
  WHERE conrelid = 'public.guild_members'::regclass
    AND contype = 'c'
    AND conname ILIKE '%role%'
  LIMIT 1;

  IF v_con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.guild_members DROP CONSTRAINT %I', v_con);
  END IF;
END;
$$;

-- Migrate existing data to new role names
UPDATE public.guild_members SET role = 'lider'     WHERE role = 'leader';
UPDATE public.guild_members SET role = 'capitao'   WHERE role = 'officer';
UPDATE public.guild_members SET role = 'soldado'   WHERE role = 'member';

-- Add new constraint
ALTER TABLE public.guild_members
  ADD CONSTRAINT guild_members_role_check
  CHECK (role IN ('lider','vice_lider','capitao','major','tenente','soldado'));

-- 3. Composite guild score function -------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_guild_score(p_guild_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      -- 40% : total XP of all members
      (SUM(s.xp) * 0.4)
      -- 30% : average level × 500
      + (AVG(s.level) * 500.0 * 0.3)
      -- 20% : total PvP wins × 50
      + (
          COALESCE((
            SELECT SUM(ps.wins)
            FROM   public.pvp_student_stats ps
            WHERE  ps.student_id IN (
              SELECT student_id FROM public.guild_members WHERE guild_id = p_guild_id
            )
          ), 0) * 50.0 * 0.2
        )
      -- 10% : member count × 200
      + (COUNT(gm.student_id) * 200.0 * 0.1)
    )::BIGINT,
    0
  )
  FROM  public.guild_members gm
  JOIN  public.students s ON s.id = gm.student_id
  WHERE gm.guild_id = p_guild_id;
$$;

-- 4. Global ranking view (no teacher filter) ----------------------------------
CREATE OR REPLACE VIEW public.guild_ranking_global AS
SELECT
  g.id,
  g.name,
  g.emblem,
  g.emblem_color,
  g.level,
  g.xp,
  g.teacher_id,
  g.created_at,
  COUNT(gm.id)::INTEGER                                        AS member_count,
  COALESCE(SUM(pvp.wins), 0)::INTEGER                         AS total_pvp_wins,
  COALESCE(SUM(s.xp),  0)::BIGINT                             AS total_member_xp,
  COALESCE(AVG(s.level), 1)::NUMERIC(6,1)                     AS avg_member_level,
  public.calculate_guild_score(g.id)                           AS score
FROM  public.guilds         g
LEFT  JOIN public.guild_members     gm  ON gm.guild_id  = g.id
LEFT  JOIN public.students          s   ON s.id         = gm.student_id
LEFT  JOIN public.pvp_student_stats pvp ON pvp.student_id = gm.student_id
GROUP BY g.id;

-- Grant anonymous read access
GRANT SELECT ON public.guild_ranking_global TO anon, authenticated;
