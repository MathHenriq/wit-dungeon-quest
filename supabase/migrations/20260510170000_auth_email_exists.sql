-- ============================================================
-- Patch 1.5 — auth_email_exists(email) helper
--
-- Why
--   Supabase Auth deliberately collapses "email not registered"
--   and "wrong password" into a single 'invalid_credentials'
--   error to avoid leaking whether an account exists. In our
--   closed school context the user wants the friendlier UX of
--   distinguishing the two. This RPC lets the LoginScreen drill
--   down on a failed login to show the right message.
--
--   Public (anon) callers may invoke it. School context = low
--   abuse risk; if this ever goes wider, add rate limiting.
-- ============================================================

CREATE OR REPLACE FUNCTION public.auth_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(btrim(p_email))
  );
$$;

GRANT EXECUTE ON FUNCTION public.auth_email_exists(TEXT) TO anon, authenticated;
