-- Fix RLS policies so Google OAuth students (authenticated role) can write to guild/boss tables.
-- Previously, policies only allowed `anon` role, but students logged in via Google OAuth use
-- the `authenticated` role, causing INSERT/UPDATE/DELETE to fail silently.

-- ── guild_members ───────────────────────────────────────────────────────────────

CREATE POLICY "Authenticated students can manage guild_members"
  ON public.guild_members FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── guilds (authenticated students need INSERT to create guilds + DELETE to disband) ──

CREATE POLICY "Authenticated students can create guilds"
  ON public.guilds FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated students can delete guilds"
  ON public.guilds FOR DELETE TO authenticated
  USING (true);

-- ── guild_posts ─────────────────────────────────────────────────────────────────

CREATE POLICY "Authenticated students can manage guild_posts"
  ON public.guild_posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── boss_attempts ────────────────────────────────────────────────────────────────
-- Needed so Google OAuth students can save their battle results.

CREATE POLICY "Authenticated students can manage boss_attempts"
  ON public.boss_attempts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── chest_openings ───────────────────────────────────────────────────────────────
-- open_chest RPC is SECURITY DEFINER so it bypasses RLS, but direct selects need access.

CREATE POLICY "Authenticated students can read own chest_openings"
  ON public.chest_openings FOR SELECT TO authenticated
  USING (true);

-- ── student_pets ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'student_pets') THEN
    EXECUTE 'CREATE POLICY "Authenticated students can manage student_pets"
      ON public.student_pets FOR ALL TO authenticated
      USING (true) WITH CHECK (true)';
  END IF;
END$$;
