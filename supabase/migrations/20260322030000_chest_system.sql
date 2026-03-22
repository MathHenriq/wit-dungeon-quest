-- ============================================================
-- CHEST SYSTEM — WIT Dungeon Quest
-- Migration: 20260322030000_chest_system.sql
-- ============================================================

-- Adicionar raridade 'mythic' ao enum de shop_items
ALTER TABLE public.shop_items DROP CONSTRAINT IF EXISTS shop_items_rarity_check;
ALTER TABLE public.shop_items ADD CONSTRAINT shop_items_rarity_check
  CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'));

-- Tabela de tipos de baú
CREATE TABLE IF NOT EXISTS public.chest_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  cost_coins INTEGER NOT NULL DEFAULT 0,
  cost_diamonds INTEGER NOT NULL DEFAULT 0,
  min_level INTEGER NOT NULL DEFAULT 1,
  min_items INTEGER NOT NULL DEFAULT 1,
  max_items INTEGER NOT NULL DEFAULT 1,
  drop_common INTEGER NOT NULL DEFAULT 0,
  drop_uncommon INTEGER NOT NULL DEFAULT 0,
  drop_rare INTEGER NOT NULL DEFAULT 0,
  drop_epic INTEGER NOT NULL DEFAULT 0,
  drop_legendary INTEGER NOT NULL DEFAULT 0,
  drop_mythic INTEGER NOT NULL DEFAULT 0,
  bonus_coins_min INTEGER NOT NULL DEFAULT 0,
  bonus_coins_max INTEGER NOT NULL DEFAULT 0,
  bonus_xp_min INTEGER NOT NULL DEFAULT 0,
  bonus_xp_max INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_limited BOOLEAN NOT NULL DEFAULT false,
  stock INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chest_types_teacher ON public.chest_types(teacher_id);
ALTER TABLE public.chest_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read chest_types" ON public.chest_types FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own chest_types" ON public.chest_types FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id()) WITH CHECK (teacher_id = get_teacher_id());

-- Pool de itens por baú (opcional — se vazio, usa todos os itens do professor)
CREATE TABLE IF NOT EXISTS public.chest_item_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chest_type_id UUID NOT NULL REFERENCES public.chest_types(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  weight INTEGER NOT NULL DEFAULT 1,
  UNIQUE(chest_type_id, item_id)
);

ALTER TABLE public.chest_item_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read chest_item_pool" ON public.chest_item_pool FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own chest_item_pool" ON public.chest_item_pool FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM chest_types ct WHERE ct.id = chest_type_id AND ct.teacher_id = get_teacher_id()));

-- Histórico de aberturas
CREATE TABLE IF NOT EXISTS public.chest_openings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  chest_type_id UUID NOT NULL REFERENCES public.chest_types(id) ON DELETE CASCADE,
  items_received JSONB NOT NULL DEFAULT '[]',
  bonus_coins INTEGER NOT NULL DEFAULT 0,
  bonus_xp INTEGER NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chest_openings_student ON public.chest_openings(student_id);
ALTER TABLE public.chest_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read chest_openings" ON public.chest_openings FOR SELECT USING (true);
CREATE POLICY "System can insert chest_openings" ON public.chest_openings FOR INSERT TO anon WITH CHECK (true);

-- RPC: Abrir baú (toda a lógica server-side)
CREATE OR REPLACE FUNCTION public.open_chest(p_student_id UUID, p_chest_type_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_chest chest_types%ROWTYPE;
  v_student students%ROWTYPE;
  v_num_items INTEGER;
  v_items JSONB := '[]'::JSONB;
  v_rarity TEXT;
  v_roll INTEGER;
  v_item RECORD;
  v_bonus_coins INTEGER := 0;
  v_bonus_xp INTEGER := 0;
  v_i INTEGER;
BEGIN
  -- Buscar baú
  SELECT * INTO v_chest FROM chest_types WHERE id = p_chest_type_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bau nao encontrado ou inativo');
  END IF;

  -- Buscar aluno
  SELECT * INTO v_student FROM students WHERE id = p_student_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aluno nao encontrado');
  END IF;

  -- Verificar nível mínimo
  IF v_student.level < v_chest.min_level THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nivel insuficiente');
  END IF;

  -- Verificar moedas
  IF v_chest.cost_coins > 0 AND v_student.coins < v_chest.cost_coins THEN
    RETURN jsonb_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  -- Verificar diamantes
  IF v_chest.cost_diamonds > 0 AND COALESCE(v_student.diamonds, 0) < v_chest.cost_diamonds THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diamantes insuficientes');
  END IF;

  -- Verificar estoque
  IF v_chest.is_limited AND COALESCE(v_chest.stock, 0) <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bau esgotado');
  END IF;

  -- Deduzir custo
  UPDATE students SET
    coins = coins - v_chest.cost_coins,
    diamonds = COALESCE(diamonds, 0) - v_chest.cost_diamonds
  WHERE id = p_student_id;

  -- Reduzir estoque se limitado
  IF v_chest.is_limited THEN
    UPDATE chest_types SET stock = stock - 1 WHERE id = p_chest_type_id;
  END IF;

  -- Número de itens
  v_num_items := v_chest.min_items + floor(random() * (v_chest.max_items - v_chest.min_items + 1))::INTEGER;

  -- Sortear cada item
  FOR v_i IN 1..v_num_items LOOP
    v_roll := floor(random() * 100)::INTEGER;

    IF v_roll < v_chest.drop_common THEN v_rarity := 'common';
    ELSIF v_roll < v_chest.drop_common + v_chest.drop_uncommon THEN v_rarity := 'uncommon';
    ELSIF v_roll < v_chest.drop_common + v_chest.drop_uncommon + v_chest.drop_rare THEN v_rarity := 'rare';
    ELSIF v_roll < v_chest.drop_common + v_chest.drop_uncommon + v_chest.drop_rare + v_chest.drop_epic THEN v_rarity := 'epic';
    ELSIF v_roll < v_chest.drop_common + v_chest.drop_uncommon + v_chest.drop_rare + v_chest.drop_epic + v_chest.drop_legendary THEN v_rarity := 'legendary';
    ELSE v_rarity := 'mythic';
    END IF;

    -- Buscar item aleatório da pool ou dos itens gerais
    SELECT si.id, si.name, si.rarity INTO v_item
    FROM shop_items si
    LEFT JOIN chest_item_pool cip ON cip.item_id = si.id AND cip.chest_type_id = p_chest_type_id
    WHERE si.teacher_id = v_chest.teacher_id
      AND si.rarity = v_rarity
      AND si.is_active = true
    ORDER BY COALESCE(cip.weight, 1) * random() DESC
    LIMIT 1;

    -- Fallback: qualquer item ativo
    IF NOT FOUND THEN
      SELECT si.id, si.name, si.rarity INTO v_item
      FROM shop_items si
      WHERE si.teacher_id = v_chest.teacher_id AND si.is_active = true
      ORDER BY random()
      LIMIT 1;
    END IF;

    IF FOUND THEN
      INSERT INTO student_inventory (student_id, item_id) VALUES (p_student_id, v_item.id);
      v_items := v_items || jsonb_build_object('item_id', v_item.id, 'item_name', v_item.name, 'rarity', v_item.rarity);
    END IF;
  END LOOP;

  -- Bônus moedas/XP
  IF v_chest.bonus_coins_max > 0 THEN
    v_bonus_coins := v_chest.bonus_coins_min + floor(random() * (v_chest.bonus_coins_max - v_chest.bonus_coins_min + 1))::INTEGER;
    UPDATE students SET coins = coins + v_bonus_coins WHERE id = p_student_id;
  END IF;
  IF v_chest.bonus_xp_max > 0 THEN
    v_bonus_xp := v_chest.bonus_xp_min + floor(random() * (v_chest.bonus_xp_max - v_chest.bonus_xp_min + 1))::INTEGER;
    UPDATE students SET xp = COALESCE(xp, 0) + v_bonus_xp WHERE id = p_student_id;
  END IF;

  -- Feed de conquistas para itens raros
  IF jsonb_array_length(v_items) > 0 AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_items) elem
    WHERE elem->>'rarity' IN ('legendary', 'mythic')
  ) THEN
    INSERT INTO achievement_feed (student_id, teacher_id, achievement_type, achievement_data, message)
    VALUES (
      p_student_id,
      v_chest.teacher_id,
      'rare_loot',
      jsonb_build_object('chest_name', v_chest.name, 'items', v_items),
      (SELECT name FROM students WHERE id = p_student_id) || ' encontrou um item ' ||
      (SELECT elem->>'rarity' FROM jsonb_array_elements(v_items) elem
       WHERE elem->>'rarity' IN ('legendary', 'mythic') LIMIT 1) ||
      ' no ' || v_chest.name || '!'
    );
  END IF;

  -- Histórico
  INSERT INTO chest_openings (student_id, chest_type_id, items_received, bonus_coins, bonus_xp)
  VALUES (p_student_id, p_chest_type_id, v_items, v_bonus_coins, v_bonus_xp);

  RETURN jsonb_build_object(
    'success', true,
    'items', v_items,
    'bonus_coins', v_bonus_coins,
    'bonus_xp', v_bonus_xp,
    'num_items', v_num_items
  );
END; $$;

GRANT EXECUTE ON FUNCTION open_chest TO anon, authenticated;
