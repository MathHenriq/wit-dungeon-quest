-- ROOT CAUSE of the persistent open_chest 404:
-- The function uses `_crypto_rand_int()` which calls `gen_random_bytes()`
-- from the pgcrypto extension. On Supabase, pgcrypto lives in the
-- `extensions` schema. The function had `SET search_path = public`, which
-- shuts out the `extensions` schema; the call to gen_random_bytes() then
-- fails with "function does not exist", and PostgREST surfaces that as a
-- 404 to the client.
--
-- Fix: include `extensions` in search_path for every function that
-- transitively touches pgcrypto.

ALTER FUNCTION public.open_chest(TEXT, INTEGER, UUID)
  SET search_path = public, extensions;

ALTER FUNCTION public.open_chest_v2(TEXT, INTEGER, UUID)
  SET search_path = public, extensions;

ALTER FUNCTION public._crypto_rand_int(INTEGER)
  SET search_path = public, extensions;

NOTIFY pgrst, 'reload schema';
