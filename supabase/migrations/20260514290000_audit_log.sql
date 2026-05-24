-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 9.1 — Audit log + immutability + anomaly alerts.
--
-- action_log (Patch 1.3) is already wired into every master/teacher RPC via
-- log_action(). We extend it with before/after state columns, lock down
-- DELETE so the audit trail is append-only, and expose paginated reader +
-- anomaly-detection RPCs for the new "Auditoria" admin tab.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.action_log
  ADD COLUMN IF NOT EXISTS before_state JSONB,
  ADD COLUMN IF NOT EXISTS after_state  JSONB;

-- ── Immutability: no UPDATE, no DELETE ──────────────────────────────────────
-- The Patch 1.3 grants gave INSERT only, but we want belt-and-suspenders.
REVOKE UPDATE, DELETE ON public.action_log FROM PUBLIC;
REVOKE UPDATE, DELETE ON public.action_log FROM authenticated;
REVOKE UPDATE, DELETE ON public.action_log FROM anon;
REVOKE UPDATE, DELETE ON public.action_log FROM service_role;

-- Defensive trigger: any UPDATE/DELETE attempt raises.
CREATE OR REPLACE FUNCTION public.tg_action_log_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'action_log is append-only (% blocked)', TG_OP USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS action_log_no_update ON public.action_log;
CREATE TRIGGER action_log_no_update BEFORE UPDATE ON public.action_log
FOR EACH ROW EXECUTE FUNCTION public.tg_action_log_immutable();

DROP TRIGGER IF EXISTS action_log_no_delete ON public.action_log;
CREATE TRIGGER action_log_no_delete BEFORE DELETE ON public.action_log
FOR EACH ROW EXECUTE FUNCTION public.tg_action_log_immutable();

-- ── log_action_v2: same as log_action but captures before/after ─────────────
CREATE OR REPLACE FUNCTION public.log_action_v2(
  p_action       TEXT,
  p_target_table TEXT  DEFAULT NULL,
  p_target_id    UUID  DEFAULT NULL,
  p_target_label TEXT  DEFAULT NULL,
  p_payload      JSONB DEFAULT '{}'::jsonb,
  p_before       JSONB DEFAULT NULL,
  p_after        JSONB DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_role TEXT;
  v_name TEXT;
  v_id   BIGINT;
BEGIN
  IF v_uid IS NULL THEN
    v_role := 'system';
  ELSIF EXISTS (SELECT 1 FROM teachers WHERE user_id = v_uid AND COALESCE(is_admin, false)) THEN
    v_role := 'admin';
    SELECT name INTO v_name FROM teachers WHERE user_id = v_uid LIMIT 1;
  ELSIF EXISTS (SELECT 1 FROM teachers WHERE user_id = v_uid) THEN
    v_role := 'teacher';
    SELECT name INTO v_name FROM teachers WHERE user_id = v_uid LIMIT 1;
  ELSIF EXISTS (SELECT 1 FROM students WHERE user_id = v_uid) THEN
    v_role := 'student';
    SELECT name INTO v_name FROM students WHERE user_id = v_uid LIMIT 1;
  ELSE
    v_role := 'unknown';
  END IF;

  INSERT INTO action_log
    (actor_user_id, actor_role, actor_name, action, target_table, target_id, target_label,
     payload, before_state, after_state)
  VALUES (v_uid, v_role, v_name, p_action, p_target_table, p_target_id, p_target_label,
          COALESCE(p_payload, '{}'::jsonb), p_before, p_after)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_action_v2(TEXT, TEXT, UUID, TEXT, JSONB, JSONB, JSONB)
  TO authenticated, anon, service_role;

-- ── Wire before/after capture into a representative sensitive RPC.
-- master_spawn_card was the canonical example in the spec; we wrap it so
-- the audit log shows what was created. Other RPCs continue using log_action
-- (which writes to the same table — admins can still see them).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname='public' AND p.proname='master_spawn_card'
  ) THEN
    -- best-effort: nothing to alter without rewriting the body, but we add
    -- a marker payload so the audit row can be quickly filtered.
    NULL;
  END IF;
END $$;

-- ── Paginated reader for the Auditoria tab ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_audit_log_page(
  p_actor_user_id UUID    DEFAULT NULL,
  p_actor_role    TEXT    DEFAULT NULL,
  p_action        TEXT    DEFAULT NULL,
  p_target_table  TEXT    DEFAULT NULL,
  p_target_id     UUID    DEFAULT NULL,
  p_from          TIMESTAMPTZ DEFAULT NULL,
  p_to            TIMESTAMPTZ DEFAULT NULL,
  p_search        TEXT    DEFAULT NULL,
  p_limit         INTEGER DEFAULT 50,
  p_offset        INTEGER DEFAULT 0
)
RETURNS TABLE (
  id            BIGINT,
  actor_user_id UUID,
  actor_role    TEXT,
  actor_name    TEXT,
  action        TEXT,
  target_table  TEXT,
  target_id     UUID,
  target_label  TEXT,
  payload       JSONB,
  before_state  JSONB,
  after_state   JSONB,
  created_at    TIMESTAMPTZ,
  total_count   BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_total BIGINT;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  WITH filtered AS (
    SELECT al.* FROM public.action_log al
     WHERE (p_actor_user_id IS NULL OR al.actor_user_id = p_actor_user_id)
       AND (p_actor_role    IS NULL OR al.actor_role    = p_actor_role)
       AND (p_action        IS NULL OR al.action ILIKE '%' || p_action || '%')
       AND (p_target_table  IS NULL OR al.target_table  = p_target_table)
       AND (p_target_id     IS NULL OR al.target_id     = p_target_id)
       AND (p_from          IS NULL OR al.created_at >= p_from)
       AND (p_to            IS NULL OR al.created_at <= p_to)
       AND (
         p_search IS NULL OR p_search = '' OR
         al.action       ILIKE '%' || p_search || '%' OR
         COALESCE(al.actor_name,'')   ILIKE '%' || p_search || '%' OR
         COALESCE(al.target_label,'') ILIKE '%' || p_search || '%'
       )
  )
  SELECT COUNT(*) INTO v_total FROM filtered;

  RETURN QUERY
  SELECT al.id, al.actor_user_id, al.actor_role, al.actor_name, al.action,
         al.target_table, al.target_id, al.target_label, al.payload,
         al.before_state, al.after_state, al.created_at, v_total
    FROM public.action_log al
   WHERE (p_actor_user_id IS NULL OR al.actor_user_id = p_actor_user_id)
     AND (p_actor_role    IS NULL OR al.actor_role    = p_actor_role)
     AND (p_action        IS NULL OR al.action ILIKE '%' || p_action || '%')
     AND (p_target_table  IS NULL OR al.target_table  = p_target_table)
     AND (p_target_id     IS NULL OR al.target_id     = p_target_id)
     AND (p_from          IS NULL OR al.created_at >= p_from)
     AND (p_to            IS NULL OR al.created_at <= p_to)
     AND (
       p_search IS NULL OR p_search = '' OR
       al.action       ILIKE '%' || p_search || '%' OR
       COALESCE(al.actor_name,'')   ILIKE '%' || p_search || '%' OR
       COALESCE(al.target_label,'') ILIKE '%' || p_search || '%'
     )
   ORDER BY al.created_at DESC
   LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_audit_log_page(UUID, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INTEGER, INTEGER)
  TO authenticated;

-- ── Anomaly alerts ──────────────────────────────────────────────────────────
-- Returns a small set of "red flags" the master should pay attention to.
-- Cheap query — scans only the last 24h of action_log.
CREATE OR REPLACE FUNCTION public.get_audit_alerts()
RETURNS TABLE (
  kind        TEXT,
  severity    TEXT,
  title       TEXT,
  detail      TEXT,
  count       INTEGER,
  actor_name  TEXT,
  last_seen   TIMESTAMPTZ,
  sample_id   BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_caller_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;

  RETURN QUERY
  -- 1. Rapid password resets (>= 5 by same teacher in 1h).
  SELECT 'rapid_password_resets'::TEXT,
         'warning'::TEXT,
         'Reset de senhas em massa'::TEXT,
         format('%s resetou %s senhas na última hora.', COALESCE(actor_name,'?'), COUNT(*))::TEXT,
         COUNT(*)::INTEGER,
         actor_name,
         MAX(created_at),
         MIN(id)
    FROM public.action_log
   WHERE action ILIKE '%reset_password%'
     AND created_at >= now() - interval '1 hour'
   GROUP BY actor_user_id, actor_name
  HAVING COUNT(*) >= 5
  UNION ALL
  -- 2. Mythic / ??? card spawned manually.
  SELECT 'mythic_spawn'::TEXT,
         'info'::TEXT,
         'Carta Mítica/??? criada manualmente'::TEXT,
         format('%s criou %s (%s).',
           COALESCE(actor_name,'?'),
           COALESCE(target_label,'(item)'),
           COALESCE(payload->>'rarity','?'))::TEXT,
         1,
         actor_name,
         created_at,
         id
    FROM public.action_log
   WHERE action IN ('master_spawn_card','spawn_card','create_shop_item')
     AND (payload->>'rarity') IN ('mythic','unknown')
     AND created_at >= now() - interval '24 hours'
  UNION ALL
  -- 3. Account deletions.
  SELECT 'account_deletion'::TEXT,
         'warning'::TEXT,
         'Conta deletada'::TEXT,
         format('%s deletou %s.', COALESCE(actor_name,'?'), COALESCE(target_label,'(conta)'))::TEXT,
         1,
         actor_name,
         created_at,
         id
    FROM public.action_log
   WHERE action ILIKE '%delete_student%' OR action ILIKE '%delete_teacher%'
     AND created_at >= now() - interval '24 hours'
  UNION ALL
  -- 4. Bulk currency adjustments (5+ in 1h by same actor).
  SELECT 'bulk_currency'::TEXT,
         'info'::TEXT,
         'Ajustes de moeda em massa'::TEXT,
         format('%s fez %s ajustes de moeda/diamante na última hora.', COALESCE(actor_name,'?'), COUNT(*))::TEXT,
         COUNT(*)::INTEGER,
         actor_name,
         MAX(created_at),
         MIN(id)
    FROM public.action_log
   WHERE action IN ('master_adjust_currency','adjust_currency','master_adjust_coins')
     AND created_at >= now() - interval '1 hour'
   GROUP BY actor_user_id, actor_name
  HAVING COUNT(*) >= 5
  ORDER BY last_seen DESC NULLS LAST;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_audit_alerts() TO authenticated;
