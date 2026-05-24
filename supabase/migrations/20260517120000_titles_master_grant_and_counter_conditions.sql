-- ============================================================
-- WIT Dungeon — title system patches
-- 1. Rename the seeded 'benevolent' title to 'benevolente' (matches client spec).
-- 2. Flip auto_unlock=TRUE on streak_30 + curious so the evaluator processes them.
-- 3. Patch check_title_conditions_for to handle `streak_days` and
--    `cards_examined` condition types — both read from student_daily_counters
--    (Patch 8.4 counters). No rewrite, just two new ELSIF branches.
-- 4. New RPC public.master_grant_title(p_student_id, p_title_key) — admin-only
--    grant flow used by the 'benevolente' title (and any future master_grant
--    titles seeded with auto_unlock=FALSE).
-- ============================================================

-- 1. Key rename. Idempotent — only renames if the legacy row exists and no row
--    already owns the new key (avoids constraint clash on re-runs).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.title_catalog WHERE key = 'benevolent')
     AND NOT EXISTS (SELECT 1 FROM public.title_catalog WHERE key = 'benevolente') THEN
    UPDATE public.title_catalog SET key = 'benevolente' WHERE key = 'benevolent';
  END IF;
END$$;

-- 2. Flip auto_unlock so the daily sweep evaluates them.
UPDATE public.title_catalog SET auto_unlock = TRUE WHERE key IN ('streak_30','curious');

-- 3. Patched evaluator. Same body as the original; only the two new ELSIF
--    branches are added inside the per-title loop.
CREATE OR REPLACE FUNCTION public.check_title_conditions_for(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unlocked JSONB := '[]'::jsonb;
  v_t        RECORD;
  v_progress INTEGER;
BEGIN
  FOR v_t IN
    SELECT * FROM public.title_catalog
     WHERE is_active = TRUE AND auto_unlock = TRUE
       AND id NOT IN (SELECT title_id FROM public.student_unlocked_titles WHERE student_id = p_student_id)
  LOOP
    v_progress := 0;

    IF v_t.condition_type = 'bosses_defeated' THEN
      SELECT COALESCE(COUNT(*), 0) INTO v_progress
        FROM public.character_progress cp
        JOIN public.characters c ON c.id = cp.character_id
        JOIN public.students s ON s.user_id = c.user_id
       WHERE s.id = p_student_id AND cp.boss_defeated = TRUE;

    ELSIF v_t.condition_type = 'floor_reached' THEN
      SELECT COALESCE(MAX(cp.floor_id), 0) INTO v_progress
        FROM public.character_progress cp
        JOIN public.characters c ON c.id = cp.character_id
        JOIN public.students s ON s.user_id = c.user_id
       WHERE s.id = p_student_id;

    ELSIF v_t.condition_type = 'pvp_top1_count' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.weekly_rankings_snapshot
       WHERE ranking_type = 'pvp' AND position = 1 AND entity_id = p_student_id;

    ELSIF v_t.condition_type = 'geral_top1_count' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.weekly_rankings_snapshot
       WHERE ranking_type = 'geral' AND position = 1 AND entity_id = p_student_id;

    ELSIF v_t.condition_type = 'sala_top1_count' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.weekly_rankings_snapshot
       WHERE ranking_type = 'sala' AND position = 1 AND entity_id = p_student_id;

    ELSIF v_t.condition_type = 'raids_won' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.boss_raid_rewards
       WHERE student_id = p_student_id AND victory = TRUE;

    ELSIF v_t.condition_type = 'unique_cards_owned' THEN
      SELECT COUNT(DISTINCT item_id)::INT INTO v_progress
        FROM public.student_inventory WHERE student_id = p_student_id;

    ELSIF v_t.condition_type = 'rarity_count' THEN
      SELECT COUNT(DISTINCT si.item_id)::INT INTO v_progress
        FROM public.student_inventory si
        JOIN public.shop_items sh ON sh.id = si.item_id
       WHERE si.student_id = p_student_id
         AND sh.rarity = (v_t.condition_payload->>'rarity');

    ELSIF v_t.condition_type = 'unknown_owned' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.student_inventory si
        JOIN public.shop_items sh ON sh.id = si.item_id
       WHERE si.student_id = p_student_id AND sh.rarity = 'unknown';

    ELSIF v_t.condition_type = 'missions_completed' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.mission_completions
       WHERE student_id = p_student_id AND status = 'approved';

    ELSIF v_t.condition_type = 'tickets_used' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.creation_tickets WHERE student_id = p_student_id AND used_at IS NOT NULL;

    ELSIF v_t.condition_type = 'vault_unlocks' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.event_vault_openings
       WHERE student_id = p_student_id AND fragments_total >= 1000;

    ELSIF v_t.condition_type = 'feed_appearances' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.school_feed_events WHERE student_id = p_student_id;

    ELSIF v_t.condition_type = 'mythic_chest_opens' THEN
      SELECT COUNT(*)::INT INTO v_progress
        FROM public.chest_openings co
       WHERE co.student_id = p_student_id
         AND co.items_received @> '[{"rarity":"mythic"}]'::jsonb;

    -- ── NEW: counters from student_daily_counters (Patch 8.4) ─────────────
    -- streak_days: highest single-day `login_streak` counter value the student
    -- has ever recorded. Lifetime aggregate is fine since the counter only
    -- grows while the student keeps logging in.
    ELSIF v_t.condition_type = 'streak_days' THEN
      SELECT COALESCE(MAX(value), 0) INTO v_progress
        FROM public.student_daily_counters
       WHERE student_id = p_student_id AND counter_type = 'login_streak';

    -- cards_examined: lifetime sum across days.
    ELSIF v_t.condition_type = 'cards_examined' THEN
      SELECT COALESCE(SUM(value), 0)::INT INTO v_progress
        FROM public.student_daily_counters
       WHERE student_id = p_student_id AND counter_type = 'cards_examined';
    END IF;

    IF v_progress >= COALESCE(v_t.condition_value, 1) THEN
      IF public._unlock_title_if_new(p_student_id, v_t.id) THEN
        v_unlocked := v_unlocked || jsonb_build_object('title_id', v_t.id, 'name', v_t.name, 'color', v_t.color);
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('unlocked', v_unlocked);
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_title_conditions_for(UUID) TO authenticated;

-- 4. Admin-only grant. Uses _unlock_title_if_new which already posts a
--    pending_reward with the proper toast message.
CREATE OR REPLACE FUNCTION public.master_grant_title(p_student_id UUID, p_title_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title  title_catalog%ROWTYPE;
  v_unlocked BOOLEAN;
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  SELECT * INTO v_title FROM public.title_catalog WHERE key = p_title_key AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Título não encontrado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aluno não encontrado');
  END IF;

  v_unlocked := public._unlock_title_if_new(p_student_id, v_title.id);

  PERFORM log_action(
    'master_grant_title',
    'title_catalog',
    v_title.id,
    v_title.name,
    jsonb_build_object('student_id', p_student_id, 'title_key', v_title.key, 'already_owned', NOT v_unlocked)
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_owned', NOT v_unlocked,
    'title', jsonb_build_object('key', v_title.key, 'name', v_title.name, 'color', v_title.color)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_grant_title(UUID, TEXT) TO authenticated;
