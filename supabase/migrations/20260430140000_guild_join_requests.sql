-- ============================================================
-- Guild join requests
--
-- Today any authenticated student can INSERT directly into
-- guild_members and silently land in any guild. We replace
-- that with an explicit request → approval flow handled by
-- the guild's leader / vice-leader.
--
-- Tables added:
--   guild_join_requests (id, guild_id, student_id, status,
--                         created_at, resolved_at, resolved_by)
--
-- RPC:
--   respond_guild_join_request(p_request_id, p_approve)
--     - SECURITY DEFINER, runs as table owner so it can write
--       guild_members (which RLS would let it write anyway,
--       but we want one atomic step).
--     - validates the caller is leader OR vice_lider of the
--       guild, then either:
--         * marks the request approved + INSERTs guild_members
--         * marks the request rejected
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guild_join_requests (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id     UUID         NOT NULL REFERENCES public.guilds(id)   ON DELETE CASCADE,
  student_id   UUID         NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status       TEXT         NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','rejected','cancelled')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID         REFERENCES public.students(id) ON DELETE SET NULL
);

-- A student can have only ONE pending request per guild at a time
-- (after rejection they may try again later).
CREATE UNIQUE INDEX IF NOT EXISTS idx_guild_join_requests_pending_unique
  ON public.guild_join_requests (guild_id, student_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_guild_join_requests_guild
  ON public.guild_join_requests (guild_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_guild_join_requests_student
  ON public.guild_join_requests (student_id);

ALTER TABLE public.guild_join_requests ENABLE ROW LEVEL SECURITY;

-- ── SELECT ────────────────────────────────────────────────────
-- The student sees their own requests; leaders / vice-leaders
-- of the guild see all requests for that guild.
DROP POLICY IF EXISTS "Read guild join requests" ON public.guild_join_requests;
CREATE POLICY "Read guild join requests"
  ON public.guild_join_requests FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.guild_members gm
      JOIN public.students s ON s.id = gm.student_id
      WHERE gm.guild_id   = guild_join_requests.guild_id
        AND s.user_id     = auth.uid()
        AND gm.role IN ('lider','vice_lider')
    )
  );

-- ── INSERT ────────────────────────────────────────────────────
-- A student may create a request only for themselves and only
-- if they are not already in some guild.
DROP POLICY IF EXISTS "Students create own join request" ON public.guild_join_requests;
CREATE POLICY "Students create own join request"
  ON public.guild_join_requests FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.guild_members gm
      JOIN public.students s ON s.id = gm.student_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ── UPDATE ────────────────────────────────────────────────────
-- The requester may cancel their own pending request. Leaders /
-- vice-leaders may approve or reject (also handled atomically by
-- the RPC below).
DROP POLICY IF EXISTS "Update guild join request" ON public.guild_join_requests;
CREATE POLICY "Update guild join request"
  ON public.guild_join_requests FOR UPDATE TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.guild_members gm
      JOIN public.students s ON s.id = gm.student_id
      WHERE gm.guild_id   = guild_join_requests.guild_id
        AND s.user_id     = auth.uid()
        AND gm.role IN ('lider','vice_lider')
    )
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.guild_members gm
      JOIN public.students s ON s.id = gm.student_id
      WHERE gm.guild_id   = guild_join_requests.guild_id
        AND s.user_id     = auth.uid()
        AND gm.role IN ('lider','vice_lider')
    )
  );


-- ── RPC: respond to a join request atomically ─────────────────
CREATE OR REPLACE FUNCTION public.respond_guild_join_request(
  p_request_id UUID,
  p_approve    BOOLEAN
)
RETURNS public.guild_join_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_req       public.guild_join_requests;
  v_resolver  UUID;
  v_member_count INT;
  v_max_members  INT;
BEGIN
  SELECT * INTO v_req FROM public.guild_join_requests WHERE id = p_request_id;
  IF v_req IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Solicitação já resolvida';
  END IF;

  -- caller must be leader / vice-leader of v_req.guild_id
  SELECT s.id INTO v_resolver
  FROM   public.guild_members gm
  JOIN   public.students s ON s.id = gm.student_id
  WHERE  gm.guild_id = v_req.guild_id
    AND  s.user_id   = v_uid
    AND  gm.role IN ('lider','vice_lider')
  LIMIT 1;

  IF v_resolver IS NULL THEN
    RAISE EXCEPTION 'Apenas líder ou vice-líder podem responder solicitações';
  END IF;

  IF p_approve THEN
    -- Don't approve if requester is already in some guild.
    IF EXISTS (SELECT 1 FROM public.guild_members WHERE student_id = v_req.student_id) THEN
      UPDATE public.guild_join_requests
      SET    status = 'rejected', resolved_at = now(), resolved_by = v_resolver
      WHERE  id = p_request_id
      RETURNING * INTO v_req;
      RETURN v_req;
    END IF;

    -- Don't approve if guild is full.
    SELECT COUNT(*) INTO v_member_count
    FROM   public.guild_members WHERE guild_id = v_req.guild_id;
    SELECT max_members INTO v_max_members
    FROM   public.guilds WHERE id = v_req.guild_id;
    IF v_member_count >= v_max_members THEN
      RAISE EXCEPTION 'Guilda cheia';
    END IF;

    INSERT INTO public.guild_members (guild_id, student_id, role)
    VALUES (v_req.guild_id, v_req.student_id, 'soldado')
    ON CONFLICT (student_id) DO NOTHING;

    UPDATE public.guild_join_requests
    SET    status = 'approved', resolved_at = now(), resolved_by = v_resolver
    WHERE  id = p_request_id
    RETURNING * INTO v_req;
  ELSE
    UPDATE public.guild_join_requests
    SET    status = 'rejected', resolved_at = now(), resolved_by = v_resolver
    WHERE  id = p_request_id
    RETURNING * INTO v_req;
  END IF;

  RETURN v_req;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_guild_join_request(UUID, BOOLEAN) TO anon, authenticated;
