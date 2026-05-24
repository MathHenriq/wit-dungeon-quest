-- ─────────────────────────────────────────────────────────────────────────────
-- Patch 3.4 — Premium currency & premium shop
--
-- Diamond becomes a strict premium currency:
--   • One-way conversion diamonds → coins at 1:5 (loses premium status).
--   • Exclusive cosmetic premium cards purchasable only with diamonds.
--
-- Implementation:
--   1. Allow shop_items.teacher_id to be NULL (global/system items, same
--      pattern used by chest_types in 20260510230000_chest_system_v2.sql).
--   2. Add shop_items.is_premium flag for the new premium tab.
--   3. RPC convert_diamonds_to_coins(p_amount).
--   4. Seed 6 generic premium variants (NULL teacher_id, cost=0, diamond_cost>0).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop NOT NULL on teacher_id so global items can exist.
ALTER TABLE public.shop_items ALTER COLUMN teacher_id DROP NOT NULL;

-- 2. Premium flag.
ALTER TABLE public.shop_items
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_shop_items_premium
  ON public.shop_items (is_premium) WHERE is_premium = TRUE;

-- 3. Conversion RPC.
CREATE OR REPLACE FUNCTION public.convert_diamonds_to_coins(p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid              UUID := auth.uid();
  v_student_id       UUID;
  v_diamonds         INTEGER;
  v_coins_gained     INTEGER;
  v_new_coins        INTEGER;
  v_new_diamonds     INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sessão expirada');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantidade inválida');
  END IF;

  SELECT id, COALESCE(diamonds, 0)
    INTO v_student_id, v_diamonds
    FROM public.students
   WHERE user_id = v_uid
   FOR UPDATE;

  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aluno não encontrado');
  END IF;

  IF v_diamonds < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diamantes insuficientes');
  END IF;

  v_coins_gained := p_amount * 5;

  UPDATE public.students
     SET diamonds = diamonds - p_amount,
         coins    = coins    + v_coins_gained
   WHERE id = v_student_id
  RETURNING coins, diamonds INTO v_new_coins, v_new_diamonds;

  -- Audit (log_action exists from 20260510150000)
  BEGIN
    PERFORM public.log_action(
      'convert_diamonds_to_coins', 'students', v_student_id, NULL,
      jsonb_build_object('diamonds_spent', p_amount, 'coins_gained', v_coins_gained)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- audit must never break the transaction
  END;

  RETURN jsonb_build_object(
    'success', true,
    'diamonds_spent', p_amount,
    'coins_gained', v_coins_gained,
    'new_coins', v_new_coins,
    'new_diamonds', v_new_diamonds
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_diamonds_to_coins(INTEGER) TO authenticated;

-- 4. Seed premium cards (idempotent by name + is_premium + teacher_id IS NULL).
-- Cosmetic variants of common archetypes, mechanically equivalent to regular
-- equipment but flagged premium and exclusively sold for diamonds.
INSERT INTO public.shop_items (
  teacher_id, name, description, category, cost, diamond_cost,
  min_level, rarity, icon, image_url, is_active, is_premium,
  attr_forca, attr_destreza, attr_inteligencia, attr_carisma, attr_agilidade, attr_resistencia
)
SELECT * FROM (VALUES
  (NULL::UUID, 'Lâmina Estelar (Edição Premium)',  'Forjada em cristal estelar. Brilha em batalha. Estatísticas idênticas à lâmina padrão, com aura premium exclusiva.', 'armamento'::text,  0, 10,  3, 'rare'::text,      'sword',  NULL::text, TRUE, TRUE, 5::int,  2::int,  0::int,  0::int,  1::int, 0::int),
  (NULL::UUID, 'Aegis Celestial (Edição Premium)', 'Escudo coberto por runas douradas. Bloqueia ataques com efeitos visuais únicos.',                            'armadura'::text,   0, 15,  5, 'rare'::text,      'shield', NULL::text, TRUE, TRUE, 0::int,  0::int,  0::int,  1::int,  0::int, 6::int),
  (NULL::UUID, 'Orbe Cromático (Edição Premium)',  'Esfera arcana que muda de cor a cada conjuração. Puramente cosmético.',                                       'habilidade'::text, 0, 20,  8, 'epic'::text,      'wand',   NULL::text, TRUE, TRUE, 0::int,  1::int,  6::int,  2::int,  0::int, 0::int),
  (NULL::UUID, 'Manto da Aurora (Edição Premium)', 'Tecido tingido pelas luzes do norte. Estatísticas idênticas ao manto comum.',                                  'armadura'::text,   0, 25, 10, 'epic'::text,      'shield', NULL::text, TRUE, TRUE, 0::int,  3::int,  2::int,  3::int,  3::int, 2::int),
  (NULL::UUID, 'Coroa do Crepúsculo (Premium)',    'Diadema usado apenas pelos campeões. Confere prestígio, não poder extra.',                                     'colecao'::text,    0, 35, 15, 'legendary'::text, 'star',   NULL::text, TRUE, TRUE, 2::int,  2::int,  2::int,  5::int,  2::int, 2::int),
  (NULL::UUID, 'Selo do Vazio (Premium)',          'Token mítico forjado para colecionadores. Idêntico em mecânica ao selo padrão.',                              'token'::text,      0, 50, 20, 'legendary'::text, 'scroll', NULL::text, TRUE, TRUE, 3::int,  3::int,  3::int,  3::int,  3::int, 3::int)
) AS v(teacher_id, name, description, category, cost, diamond_cost, min_level, rarity, icon, image_url, is_active, is_premium,
       attr_forca, attr_destreza, attr_inteligencia, attr_carisma, attr_agilidade, attr_resistencia)
WHERE NOT EXISTS (
  SELECT 1 FROM public.shop_items s
   WHERE s.is_premium = TRUE
     AND s.teacher_id IS NULL
     AND s.name = v.name
);
