-- ============================================================
-- Patch 3.3 — Forge (materials → consumables / temporary buffs)
--
-- Parallel to the existing craft_recipes (which uses skill-tree
-- nodes as ingredients). This forge consumes materials seeded by
-- Patch 3.1 to produce either a one-shot consumable or a buff
-- that lasts N battles.
-- ============================================================

-- ── Effect catalogs ──────────────────────────────────────────
-- consumables: used inside a battle (heal, cure, revive, etc).
-- temporary_buffs: applied at battle start while battles_left > 0.

CREATE TABLE IF NOT EXISTS public.consumables (
  id           UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key          TEXT            NOT NULL UNIQUE,
  name         TEXT            NOT NULL,
  description  TEXT            NOT NULL DEFAULT '',
  -- engine maps these onto BattleEngine.useItem ItemEffect
  effect       TEXT            NOT NULL CHECK (effect IN ('heal_flat','heal_percent','cure','revive','recharge')),
  effect_value NUMERIC         NOT NULL DEFAULT 0,  -- % is 0..1; flat is HP/energy amount
  icon         TEXT            NOT NULL DEFAULT 'potion',
  rarity       material_rarity NOT NULL DEFAULT 'common',
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT now()
);
ALTER TABLE public.consumables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads consumables" ON public.consumables;
CREATE POLICY "Anyone reads consumables" ON public.consumables FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS public.temporary_buffs (
  id               UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key              TEXT            NOT NULL UNIQUE,
  name             TEXT            NOT NULL,
  description      TEXT            NOT NULL DEFAULT '',
  -- engine adds these to playerMods when battle starts
  effect           TEXT            NOT NULL CHECK (effect IN ('evade_bonus','physical_dmg','magic_dmg','proc_bonus','damage_reduction','crit_bonus')),
  effect_value     NUMERIC         NOT NULL DEFAULT 0,  -- 0.10 = +10% (or -10% for reduction)
  duration_battles INTEGER         NOT NULL DEFAULT 1 CHECK (duration_battles > 0),
  icon             TEXT            NOT NULL DEFAULT 'star',
  rarity           material_rarity NOT NULL DEFAULT 'common',
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT now()
);
ALTER TABLE public.temporary_buffs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads temporary_buffs" ON public.temporary_buffs;
CREATE POLICY "Anyone reads temporary_buffs" ON public.temporary_buffs FOR SELECT USING (true);


-- ── Recipes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.forge_recipes (
  id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key           TEXT         NOT NULL UNIQUE,
  name          TEXT         NOT NULL,
  description   TEXT         NOT NULL DEFAULT '',
  result_type   TEXT         NOT NULL CHECK (result_type IN ('consumable','buff')),
  consumable_id UUID         REFERENCES public.consumables(id)     ON DELETE CASCADE,
  buff_id       UUID         REFERENCES public.temporary_buffs(id) ON DELETE CASCADE,
  -- [{"material_key":"fragmento-arcano","qty":3}, ...]  (material_key matches materials.name lowered-slug; we keep ids in JSONB resolved via name lookup at forge time)
  ingredients   JSONB        NOT NULL DEFAULT '[]'::jsonb,
  icon          TEXT         NOT NULL DEFAULT 'potion',
  rarity        material_rarity NOT NULL DEFAULT 'common',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT forge_recipes_one_result CHECK (
    (result_type = 'consumable' AND consumable_id IS NOT NULL AND buff_id IS NULL) OR
    (result_type = 'buff'       AND buff_id       IS NOT NULL AND consumable_id IS NULL)
  )
);
ALTER TABLE public.forge_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads forge_recipes" ON public.forge_recipes;
CREATE POLICY "Anyone reads forge_recipes" ON public.forge_recipes FOR SELECT USING (true);


-- ── Per-student stocks ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_consumables (
  student_id    UUID        NOT NULL REFERENCES public.students(id)    ON DELETE CASCADE,
  consumable_id UUID        NOT NULL REFERENCES public.consumables(id) ON DELETE CASCADE,
  quantity      INTEGER     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, consumable_id)
);
ALTER TABLE public.student_consumables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own consumables stock" ON public.student_consumables;
CREATE POLICY "Read own consumables stock"
  ON public.student_consumables FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_consumables.student_id AND s.user_id = auth.uid()
  ));


CREATE TABLE IF NOT EXISTS public.student_active_buffs (
  student_id     UUID        NOT NULL REFERENCES public.students(id)       ON DELETE CASCADE,
  buff_id        UUID        NOT NULL REFERENCES public.temporary_buffs(id) ON DELETE CASCADE,
  battles_left   INTEGER     NOT NULL CHECK (battles_left >= 0),
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, buff_id)
);
ALTER TABLE public.student_active_buffs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own active buffs" ON public.student_active_buffs;
CREATE POLICY "Read own active buffs"
  ON public.student_active_buffs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_active_buffs.student_id AND s.user_id = auth.uid()
  ));


-- ── Seed: 5 consumables + 5 buffs + 10 recipes ───────────────
-- Generic fantasy/RPG vocabulary; all ingredients reference materials
-- already seeded in Patch 3.1 by name. Rename freely via UPDATE.

INSERT INTO public.consumables (key, name, description, effect, effect_value, icon, rarity) VALUES
  ('potion_minor',  'Poção Menor',     'Restaura 30% do HP em batalha. 1 uso.',                'heal_percent', 0.30, 'potion', 'common'),
  ('elixir_full',   'Elixir Pleno',    'Restaura todo o HP em batalha. 1 uso.',                'heal_percent', 1.00, 'potion', 'epic'),
  ('balm_cura',     'Bálsamo de Cura', 'Restaura 50% do HP em batalha. 1 uso.',                'heal_percent', 0.50, 'potion', 'uncommon'),
  ('phoenix_dust',  'Pó de Fênix',     'Revive uma vez ao morrer. Consumido na ressurreição.', 'revive',       1.00, 'flame',  'epic'),
  ('purify_charm',  'Talismã Purificador', 'Remove todos os efeitos negativos do portador.',   'cure',         0,    'scroll', 'uncommon')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  effect = EXCLUDED.effect, effect_value = EXCLUDED.effect_value;

INSERT INTO public.temporary_buffs (key, name, description, effect, effect_value, duration_battles, icon, rarity) VALUES
  ('buff_evade',    'Selo de Esquiva',   '+10% chance de esquiva por 3 batalhas.',     'evade_bonus',     0.10, 3, 'star',   'uncommon'),
  ('buff_physical', 'Manto de Sombras',  '+20% dano físico por 1 batalha.',            'physical_dmg',    0.20, 1, 'sword',  'rare'),
  ('buff_proc',     'Catalisador do Vazio', '+15% chance de proc de efeito por 2 batalhas.', 'proc_bonus', 0.15, 2, 'gem',    'rare'),
  ('buff_defense',  'Talismã de Defesa', '-25% dano recebido por 2 batalhas.',         'damage_reduction', 0.25, 2, 'shield', 'rare'),
  ('buff_crit',     'Sopro Glacial',     '+25% chance de crítico por 2 batalhas.',     'crit_bonus',      0.25, 2, 'bow',    'rare')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  effect = EXCLUDED.effect, effect_value = EXCLUDED.effect_value,
  duration_battles = EXCLUDED.duration_battles;

-- 10 recipes (idempotent via key).
-- Ingredients reference materials by their `name` (matches Patch 3.1 seed).
INSERT INTO public.forge_recipes (key, name, description, result_type, consumable_id, ingredients, icon, rarity)
SELECT 'recipe_potion_minor', 'Forjar Poção Menor', 'Cura rápida em batalha.', 'consumable',
       c.id, '[{"material":"Fragmento Arcano","qty":3}]'::jsonb, 'potion', 'common'
FROM   public.consumables c WHERE c.key = 'potion_minor'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forge_recipes (key, name, description, result_type, consumable_id, ingredients, icon, rarity)
SELECT 'recipe_elixir_full', 'Forjar Elixir Pleno', 'Cura completa. Raro.', 'consumable',
       c.id, '[{"material":"Coração Arcano","qty":5}]'::jsonb, 'potion', 'epic'
FROM   public.consumables c WHERE c.key = 'elixir_full'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forge_recipes (key, name, description, result_type, consumable_id, ingredients, icon, rarity)
SELECT 'recipe_balm_cura', 'Forjar Bálsamo de Cura', 'Cura intermediária.', 'consumable',
       c.id, '[{"material":"Caco Glacial","qty":3},{"material":"Faísca Dourada","qty":1}]'::jsonb, 'potion', 'uncommon'
FROM   public.consumables c WHERE c.key = 'balm_cura'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forge_recipes (key, name, description, result_type, consumable_id, ingredients, icon, rarity)
SELECT 'recipe_phoenix_dust', 'Forjar Pó de Fênix', 'Salva da morte uma vez.', 'consumable',
       c.id, '[{"material":"Coração Arcano","qty":2},{"material":"Trono Glacial","qty":3}]'::jsonb, 'flame', 'epic'
FROM   public.consumables c WHERE c.key = 'phoenix_dust'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forge_recipes (key, name, description, result_type, consumable_id, ingredients, icon, rarity)
SELECT 'recipe_purify', 'Forjar Talismã Purificador', 'Remove efeitos negativos.', 'consumable',
       c.id, '[{"material":"Pó do Vazio","qty":4}]'::jsonb, 'scroll', 'uncommon'
FROM   public.consumables c WHERE c.key = 'purify_charm'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forge_recipes (key, name, description, result_type, buff_id, ingredients, icon, rarity)
SELECT 'recipe_buff_evade', 'Forjar Selo de Esquiva', '+10% esquiva, 3 batalhas.', 'buff',
       b.id, '[{"material":"Lasca Carmesim","qty":5},{"material":"Pétala Glacial","qty":2}]'::jsonb, 'star', 'uncommon'
FROM   public.temporary_buffs b WHERE b.key = 'buff_evade'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forge_recipes (key, name, description, result_type, buff_id, ingredients, icon, rarity)
SELECT 'recipe_buff_physical', 'Forjar Manto de Sombras', '+20% dano físico, 1 batalha.', 'buff',
       b.id, '[{"material":"Pó do Vazio","qty":4}]'::jsonb, 'sword', 'rare'
FROM   public.temporary_buffs b WHERE b.key = 'buff_physical'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forge_recipes (key, name, description, result_type, buff_id, ingredients, icon, rarity)
SELECT 'recipe_buff_proc', 'Forjar Catalisador do Vazio', '+15% proc, 2 batalhas.', 'buff',
       b.id, '[{"material":"Resíduo do Vazio","qty":3}]'::jsonb, 'gem', 'rare'
FROM   public.temporary_buffs b WHERE b.key = 'buff_proc'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forge_recipes (key, name, description, result_type, buff_id, ingredients, icon, rarity)
SELECT 'recipe_buff_defense', 'Forjar Talismã de Defesa', '-25% dano recebido, 2 batalhas.', 'buff',
       b.id, '[{"material":"Sigilo Carmesim","qty":4}]'::jsonb, 'shield', 'rare'
FROM   public.temporary_buffs b WHERE b.key = 'buff_defense'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forge_recipes (key, name, description, result_type, buff_id, ingredients, icon, rarity)
SELECT 'recipe_buff_crit', 'Forjar Sopro Glacial', '+25% crítico, 2 batalhas.', 'buff',
       b.id, '[{"material":"Lâmina Glacial","qty":5}]'::jsonb, 'bow', 'rare'
FROM   public.temporary_buffs b WHERE b.key = 'buff_crit'
ON CONFLICT (key) DO NOTHING;


-- ── Forge RPC ────────────────────────────────────────────────
-- Validates the recipe + ingredient inventory atomically, debits
-- materials, credits the resulting consumable or extends the buff.
CREATE OR REPLACE FUNCTION public.forge_recipe(p_recipe_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_student   students%ROWTYPE;
  v_recipe    forge_recipes%ROWTYPE;
  v_ing       JSONB;
  v_mat_name  TEXT;
  v_qty       INTEGER;
  v_mat_id    UUID;
  v_have      INTEGER;
  v_missing   JSONB := '[]'::jsonb;
  v_buff      temporary_buffs%ROWTYPE;
  v_cons      consumables%ROWTYPE;
  v_existing_battles INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_student FROM students WHERE user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_recipe FROM forge_recipes WHERE key = p_recipe_key;
  IF NOT FOUND THEN RAISE EXCEPTION 'recipe_not_found' USING ERRCODE = 'P0002'; END IF;

  -- Pass 1: verify all ingredients available
  FOR v_ing IN SELECT * FROM jsonb_array_elements(v_recipe.ingredients) LOOP
    v_mat_name := v_ing->>'material';
    v_qty      := (v_ing->>'qty')::INTEGER;

    SELECT id INTO v_mat_id FROM materials WHERE name = v_mat_name LIMIT 1;
    IF v_mat_id IS NULL THEN
      v_missing := v_missing || jsonb_build_object('material', v_mat_name, 'reason', 'unknown_material');
      CONTINUE;
    END IF;

    SELECT COALESCE(quantity, 0) INTO v_have
    FROM   student_inventory_materials
    WHERE  student_id = v_student.id AND material_id = v_mat_id;
    v_have := COALESCE(v_have, 0);

    IF v_have < v_qty THEN
      v_missing := v_missing || jsonb_build_object(
        'material', v_mat_name, 'need', v_qty, 'have', v_have
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(v_missing) > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_materials', 'missing', v_missing);
  END IF;

  -- Pass 2: debit materials
  FOR v_ing IN SELECT * FROM jsonb_array_elements(v_recipe.ingredients) LOOP
    v_mat_name := v_ing->>'material';
    v_qty      := (v_ing->>'qty')::INTEGER;
    SELECT id INTO v_mat_id FROM materials WHERE name = v_mat_name LIMIT 1;

    UPDATE student_inventory_materials
    SET    quantity = quantity - v_qty,
           updated_at = now()
    WHERE  student_id = v_student.id AND material_id = v_mat_id;
  END LOOP;

  -- Credit result
  IF v_recipe.result_type = 'consumable' THEN
    SELECT * INTO v_cons FROM consumables WHERE id = v_recipe.consumable_id;
    INSERT INTO student_consumables (student_id, consumable_id, quantity)
    VALUES (v_student.id, v_recipe.consumable_id, 1)
    ON CONFLICT (student_id, consumable_id)
    DO UPDATE SET quantity   = student_consumables.quantity + 1,
                  updated_at = now();

    PERFORM log_action('forge_recipe', 'forge_recipes', v_recipe.id, v_recipe.name,
      jsonb_build_object('result_type','consumable','consumable_key', v_cons.key));

    RETURN jsonb_build_object(
      'success', true, 'result_type', 'consumable',
      'consumable', jsonb_build_object('key', v_cons.key, 'name', v_cons.name, 'icon', v_cons.icon, 'rarity', v_cons.rarity)
    );
  ELSE
    SELECT * INTO v_buff FROM temporary_buffs WHERE id = v_recipe.buff_id;

    -- Stack: if buff already active, extend by duration; else insert.
    SELECT battles_left INTO v_existing_battles
    FROM student_active_buffs
    WHERE student_id = v_student.id AND buff_id = v_recipe.buff_id;

    IF v_existing_battles IS NOT NULL THEN
      UPDATE student_active_buffs
      SET    battles_left = battles_left + v_buff.duration_battles,
             granted_at   = now()
      WHERE  student_id = v_student.id AND buff_id = v_recipe.buff_id;
    ELSE
      INSERT INTO student_active_buffs (student_id, buff_id, battles_left)
      VALUES (v_student.id, v_recipe.buff_id, v_buff.duration_battles);
    END IF;

    PERFORM log_action('forge_recipe', 'forge_recipes', v_recipe.id, v_recipe.name,
      jsonb_build_object('result_type','buff','buff_key', v_buff.key,
                         'duration', v_buff.duration_battles));

    RETURN jsonb_build_object(
      'success', true, 'result_type', 'buff',
      'buff', jsonb_build_object('key', v_buff.key, 'name', v_buff.name, 'icon', v_buff.icon,
                                 'rarity', v_buff.rarity, 'duration', v_buff.duration_battles)
    );
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.forge_recipe(TEXT) TO authenticated;


-- ── Decrement-on-battle-end helper (for future engine wiring) ──
CREATE OR REPLACE FUNCTION public.tick_my_active_buffs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_student_id UUID;
  v_count INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501'; END IF;
  SELECT id INTO v_student_id FROM students WHERE user_id = v_uid LIMIT 1;
  IF v_student_id IS NULL THEN RETURN 0; END IF;

  WITH ticked AS (
    UPDATE student_active_buffs
    SET    battles_left = battles_left - 1
    WHERE  student_id = v_student_id AND battles_left > 0
    RETURNING student_id, buff_id, battles_left
  )
  SELECT COUNT(*) INTO v_count FROM ticked;

  DELETE FROM student_active_buffs
  WHERE student_id = v_student_id AND battles_left <= 0;

  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.tick_my_active_buffs() TO authenticated;


-- ── Read helpers for the UI ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_forge_state()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_student_id UUID;
  v_materials JSONB;
  v_consumables JSONB;
  v_buffs JSONB;
  v_recipes JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501'; END IF;
  SELECT id INTO v_student_id FROM students WHERE user_id = v_uid LIMIT 1;

  -- Recipe catalog with resolved result name
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'key', r.key, 'name', r.name, 'description', r.description, 'icon', r.icon,
    'rarity', r.rarity, 'result_type', r.result_type,
    'ingredients', r.ingredients,
    'result_name', COALESCE(c.name, b.name),
    'result_icon', COALESCE(c.icon, b.icon)
  ) ORDER BY r.rarity, r.name), '[]'::jsonb)
  INTO v_recipes
  FROM forge_recipes r
  LEFT JOIN consumables c     ON c.id = r.consumable_id
  LEFT JOIN temporary_buffs b ON b.id = r.buff_id;

  -- Current material counts (only those the student has)
  SELECT COALESCE(jsonb_object_agg(m.name, sim.quantity), '{}'::jsonb)
  INTO   v_materials
  FROM   student_inventory_materials sim
  JOIN   materials m ON m.id = sim.material_id
  WHERE  sim.student_id = v_student_id AND sim.quantity > 0;

  -- Owned consumables
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'key', c.key, 'name', c.name, 'icon', c.icon, 'rarity', c.rarity,
    'quantity', sc.quantity
  )), '[]'::jsonb)
  INTO   v_consumables
  FROM   student_consumables sc
  JOIN   consumables c ON c.id = sc.consumable_id
  WHERE  sc.student_id = v_student_id AND sc.quantity > 0;

  -- Active buffs
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'key', b.key, 'name', b.name, 'icon', b.icon, 'rarity', b.rarity,
    'battles_left', sab.battles_left
  )), '[]'::jsonb)
  INTO   v_buffs
  FROM   student_active_buffs sab
  JOIN   temporary_buffs b ON b.id = sab.buff_id
  WHERE  sab.student_id = v_student_id;

  RETURN jsonb_build_object(
    'recipes',     v_recipes,
    'materials',   v_materials,
    'consumables', v_consumables,
    'active_buffs', v_buffs
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_forge_state() TO authenticated;
