-- ── Guild Missions table ──────────────────────────────────────────────────────
-- Teacher creates missions that appear for all guilds in their class.

CREATE TABLE IF NOT EXISTS public.guild_missions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   uuid        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  description  text,
  difficulty   text        NOT NULL DEFAULT 'normal'
                           CHECK (difficulty IN ('easy', 'normal', 'hard')),
  reward_xp    integer     NOT NULL DEFAULT 100,
  reward_coins integer     NOT NULL DEFAULT 50,
  required     integer     NOT NULL DEFAULT 5,   -- participants needed
  deadline_days integer,                          -- days until expiry (NULL = no deadline)
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guild_missions ENABLE ROW LEVEL SECURITY;

-- Teachers: full access to their own missions
CREATE POLICY "Teachers manage their guild missions"
  ON public.guild_missions FOR ALL
  TO authenticated
  USING  (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Students (anon): read active missions only
CREATE POLICY "Students view active guild missions"
  ON public.guild_missions FOR SELECT
  TO anon
  USING (is_active = true);
