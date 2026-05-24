-- Patch 7.2 follow-up — RPC to set/clear an event's thematic boss.
CREATE OR REPLACE FUNCTION public.master_set_event_boss(
  p_event_id UUID,
  p_boss_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_caller_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  IF p_boss_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.enemies WHERE id = p_boss_id AND is_boss = TRUE
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Boss não encontrado');
  END IF;

  UPDATE public.events SET event_boss_id = p_boss_id WHERE id = p_event_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Evento não encontrado'); END IF;

  PERFORM log_action('master_set_event_boss', 'events', p_event_id, NULL,
    jsonb_build_object('boss_id', p_boss_id));
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.master_set_event_boss(UUID, UUID) TO authenticated;

-- Surface event_boss_id in get_event_detail's event jsonb (already via to_jsonb).
-- Also expose the boss name as a helper field for the UI.
CREATE OR REPLACE FUNCTION public.get_event_detail(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_evt JSONB;
  v_cards JSONB;
  v_chests JSONB;
  v_boss JSONB;
BEGIN
  SELECT to_jsonb(e) INTO v_evt FROM public.events e WHERE e.id = p_event_id;
  IF v_evt IS NULL THEN RETURN jsonb_build_object('error','not_found'); END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', si.id, 'name', si.name, 'rarity', si.rarity, 'image_url', si.image_url,
    'category', si.category, 'description', si.description,
    'migrated_to_pool', ec.migrated_to_pool
  ) ORDER BY si.rarity, si.name), '[]'::jsonb)
    INTO v_cards
    FROM public.event_cards ec
    JOIN public.shop_items si ON si.id = ec.shop_item_id
   WHERE ec.event_id = p_event_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ct.id, 'chest_key', ct.chest_key, 'name', ct.name, 'tier', ct.tier,
    'cost_coins', ct.cost_coins, 'cost_diamonds', ct.cost_diamonds,
    'description', ct.description
  ) ORDER BY ct.tier), '[]'::jsonb)
    INTO v_chests
    FROM public.chest_types ct
   WHERE ct.event_id = p_event_id;

  SELECT jsonb_build_object('id', en.id, 'name', en.name, 'sprite_url', en.sprite_url, 'hp_max', en.hp_max)
    INTO v_boss
    FROM public.enemies en
   WHERE en.id = (v_evt->>'event_boss_id')::UUID;

  RETURN jsonb_build_object('event', v_evt, 'cards', v_cards, 'chests', v_chests, 'boss', v_boss);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_event_detail(UUID) TO authenticated, anon;
