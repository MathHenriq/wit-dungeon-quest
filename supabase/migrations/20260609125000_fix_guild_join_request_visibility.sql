-- ============================================================
-- Fix: guild leaders / vice-leaders never saw pending join requests
--
-- Root cause
--   guild_join_requests has TWO foreign keys to students:
--     - student_id   (the requester)
--     - resolved_by  (who approved/rejected)
--   The leader's client query embeds the requester with the implicit
--   alias `student:students(...)`. With two FKs to the same table,
--   PostgREST cannot decide which relationship to use and returns
--   PGRST201 ("Could not embed because more than one relationship was
--   found"). The whole SELECT fails, the client swallows the error and
--   shows an empty list — so leaders never "received" the 41 pending
--   requests that actually exist (40 more were cancelled by students
--   who gave up waiting).
--
-- Fix (DB side, takes effect with the already-deployed client)
--   Drop the resolved_by foreign-key constraint. The column stays
--   (audit only). With a single FK to students, the implicit embed
--   resolves unambiguously and the leader's query succeeds. The client
--   query is also being disambiguated for durability, but this DB fix
--   unblocks every already-deployed client immediately.
--
-- Plus: repair guilds that have members but lost their leader, so the
--   pending requests pointing at them become actionable. Promote the
--   earliest-joined member to 'lider'.
-- ============================================================

-- 1) Remove the ambiguous second FK to students.
ALTER TABLE public.guild_join_requests
  DROP CONSTRAINT IF EXISTS guild_join_requests_resolved_by_fkey;

-- Defensive: drop any other FK from guild_join_requests.resolved_by -> students
-- in case the constraint was created under a different name in some env.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class      rel ON rel.oid = con.conrelid
    JOIN pg_namespace  ns  ON ns.oid  = rel.relnamespace
    WHERE ns.nspname = 'public'
      AND rel.relname = 'guild_join_requests'
      AND con.contype = 'f'
      AND con.confrelid = 'public.students'::regclass
      AND (SELECT attname FROM pg_attribute
            WHERE attrelid = con.conrelid AND attnum = con.conkey[1]) = 'resolved_by'
  LOOP
    EXECUTE format('ALTER TABLE public.guild_join_requests DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 2) Repair leaderless guilds: promote the earliest-joined member to 'lider'
--    so their pending requests can actually be approved.
UPDATE public.guild_members gm
   SET role = 'lider'
 WHERE gm.id IN (
   SELECT DISTINCT ON (g.id) m.id
   FROM   public.guilds g
   JOIN   public.guild_members m ON m.guild_id = g.id
   WHERE  NOT EXISTS (
            SELECT 1 FROM public.guild_members l
            WHERE l.guild_id = g.id AND l.role IN ('lider','vice_lider')
          )
   ORDER BY g.id, m.joined_at ASC NULLS LAST
 );

-- 3) Remove temporary diagnostic functions used while tracing these bugs.
DROP FUNCTION IF EXISTS public._pvp_diag();
DROP FUNCTION IF EXISTS public._guild_diag();
DROP FUNCTION IF EXISTS public._guild_diag2();

NOTIFY pgrst, 'reload schema';
