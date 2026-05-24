-- ============================================================
-- Patch 3.1 — Materials inventory (for forge crafting)
--
-- Separate from the existing drop_items / student_drop_inventory
-- system (those are sellable loot). Materials are consumables for
-- the forge (Patch 3.3) — never sold, never traded between students.
-- ============================================================

-- ── Catalog ──────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_rarity') THEN
    CREATE TYPE material_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.materials (
  id          UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT            NOT NULL UNIQUE,
  description TEXT            NOT NULL DEFAULT '',
  rarity      material_rarity NOT NULL DEFAULT 'common',
  icon_url    TEXT,
  theme       TEXT            NOT NULL DEFAULT 'arcane',
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materials_rarity ON public.materials (rarity);
CREATE INDEX IF NOT EXISTS idx_materials_theme  ON public.materials (theme);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads materials catalog" ON public.materials;
CREATE POLICY "Anyone reads materials catalog"
  ON public.materials FOR SELECT USING (true);


-- ── Per-student stockpile ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_inventory_materials (
  student_id  UUID        NOT NULL REFERENCES public.students(id)  ON DELETE CASCADE,
  material_id UUID        NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity    INTEGER     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_student_inventory_materials_student
  ON public.student_inventory_materials (student_id);

ALTER TABLE public.student_inventory_materials ENABLE ROW LEVEL SECURITY;

-- Read: the student themselves OR the teacher of that student.
DROP POLICY IF EXISTS "Read own / taught materials" ON public.student_inventory_materials;
CREATE POLICY "Read own / taught materials"
  ON public.student_inventory_materials FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_inventory_materials.student_id
        AND (s.user_id = auth.uid()
             OR s.teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
    )
  );

-- Writes only via SECURITY DEFINER RPCs (drop, forge consumption, admin).
-- No INSERT/UPDATE/DELETE policy for authenticated → blocks trade attempts.


-- ── Seed 20 generic materials (5 themes × 4 rarities) ────────
-- Theme names + material names use neutral fantasy vocabulary so they
-- don't tie to any specific franchise. Rename via UPDATE freely.
INSERT INTO public.materials (name, description, rarity, theme) VALUES
  -- Arcane
  ('Fragmento Arcano',   'Lasca etérea pulsando com energia mística residual.', 'common',   'arcane'),
  ('Cristal Arcano',     'Cristal estável saturado de mana refinada.',          'uncommon', 'arcane'),
  ('Núcleo Arcano',      'Esfera densa de poder arcano concentrado.',           'rare',     'arcane'),
  ('Coração Arcano',     'Relíquia rara, fonte de magia em estado puro.',       'epic',     'arcane'),
  -- Void
  ('Pó do Vazio',        'Partículas escuras coletadas em fronteiras dimensionais.', 'common',   'void'),
  ('Resíduo do Vazio',   'Sedimento estável vindo do nada absoluto.',                'uncommon', 'void'),
  ('Essência do Vazio',  'Concentrado de não-existência em forma manipulável.',      'rare',     'void'),
  ('Selo do Vazio',      'Selo ancestral capaz de conter o vazio em si mesmo.',      'epic',     'void'),
  -- Crimson
  ('Lasca Carmesim',     'Estilhaço afiado tingido de vermelho profundo.',     'common',   'crimson'),
  ('Pluma Carmesim',     'Pena leve com bordas afiadas como navalhas.',        'uncommon', 'crimson'),
  ('Veia Carmesim',      'Fio cristalizado que pulsa em ritmo cardíaco.',      'rare',     'crimson'),
  ('Sigilo Carmesim',    'Marca antiga gravada por sangue ancestral.',         'epic',     'crimson'),
  -- Frost
  ('Caco Glacial',       'Fragmento de gelo que nunca derrete.',                'common',   'frost'),
  ('Pétala Glacial',     'Flor cristalizada de regiões inóspitas.',             'uncommon', 'frost'),
  ('Lâmina Glacial',     'Estilhaço afilado mais frio que o vácuo.',            'rare',     'frost'),
  ('Trono Glacial',      'Fragmento de gelo ancestral, denso e indestrutível.', 'epic',     'frost'),
  -- Golden
  ('Faísca Dourada',     'Centelha quente que se recusa a apagar.',            'common',   'golden'),
  ('Filete Dourado',     'Tira fina de metal puro raríssimo.',                 'uncommon', 'golden'),
  ('Vértebra Dourada',   'Osso fossilizado de uma criatura mítica.',           'rare',     'golden'),
  ('Coroa Dourada',      'Adorno solar de imperadores há muito esquecidos.',   'epic',     'golden')
ON CONFLICT (name) DO NOTHING;


-- ── Drop RPC ─────────────────────────────────────────────────
-- Returns 0+ rows describing what was credited. Caller is the
-- battle-end flow; called once per enemy kill alongside the
-- existing apply_battle_drops.
CREATE OR REPLACE FUNCTION public.apply_battle_materials(
  p_student_id UUID,
  p_enemy_id   UUID,
  p_floor_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  material_id UUID,
  name        TEXT,
  rarity      material_rarity,
  theme       TEXT,
  icon_url    TEXT,
  quantity    INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_boss       BOOLEAN := false;
  v_drops_needed  INTEGER;
  v_rarity        material_rarity;
  v_picked        UUID;
  v_pick_name     TEXT;
  v_pick_rarity   material_rarity;
  v_pick_theme    TEXT;
  v_pick_icon     TEXT;
  v_floor         INTEGER := GREATEST(1, COALESCE(p_floor_number, 1));
  v_roll          REAL;
  v_i             INTEGER;
BEGIN
  SELECT COALESCE(e.is_boss, false) INTO v_is_boss
  FROM public.enemies e WHERE e.id = p_enemy_id;

  IF v_is_boss THEN
    -- Boss: 100% chance, 1–3 materials. Rarity skewed by floor depth.
    v_drops_needed := 1 + floor(random() * 3)::INT; -- 1, 2 or 3
  ELSE
    -- Regular: 30% chance, single common material.
    IF random() > 0.30 THEN RETURN; END IF;
    v_drops_needed := 1;
  END IF;

  FOR v_i IN 1..v_drops_needed LOOP
    v_roll := random();

    IF NOT v_is_boss THEN
      -- Regular drops are always common.
      v_rarity := 'common';
    ELSIF v_floor <= 10 THEN
      -- Floor 1-10: 80% common, 20% uncommon
      v_rarity := CASE WHEN v_roll < 0.80 THEN 'common' ELSE 'uncommon' END::material_rarity;
    ELSIF v_floor <= 20 THEN
      -- Floor 11-20: 40% common, 45% uncommon, 15% rare
      v_rarity := CASE
        WHEN v_roll < 0.40 THEN 'common'
        WHEN v_roll < 0.85 THEN 'uncommon'
        ELSE                      'rare'
      END::material_rarity;
    ELSIF v_floor <= 30 THEN
      -- Floor 21-30: 15% common, 40% uncommon, 35% rare, 10% epic
      v_rarity := CASE
        WHEN v_roll < 0.15 THEN 'common'
        WHEN v_roll < 0.55 THEN 'uncommon'
        WHEN v_roll < 0.90 THEN 'rare'
        ELSE                      'epic'
      END::material_rarity;
    ELSE
      -- Floor 31+: 30% uncommon, 50% rare, 20% epic
      v_rarity := CASE
        WHEN v_roll < 0.30 THEN 'uncommon'
        WHEN v_roll < 0.80 THEN 'rare'
        ELSE                      'epic'
      END::material_rarity;
    END IF;

    -- Random material of the rolled rarity. If none exists (catalog gap)
    -- fall back to a common one.
    SELECT m.id, m.name, m.rarity, m.theme, m.icon_url
      INTO v_picked, v_pick_name, v_pick_rarity, v_pick_theme, v_pick_icon
    FROM   public.materials m
    WHERE  m.rarity = v_rarity
    ORDER  BY random()
    LIMIT  1;

    IF v_picked IS NULL THEN
      SELECT m.id, m.name, m.rarity, m.theme, m.icon_url
        INTO v_picked, v_pick_name, v_pick_rarity, v_pick_theme, v_pick_icon
      FROM   public.materials m
      WHERE  m.rarity = 'common'
      ORDER  BY random()
      LIMIT  1;
    END IF;

    IF v_picked IS NULL THEN
      CONTINUE; -- empty catalog; skip
    END IF;

    INSERT INTO public.student_inventory_materials (student_id, material_id, quantity)
    VALUES (p_student_id, v_picked, 1)
    ON CONFLICT (student_id, material_id)
    DO UPDATE SET quantity   = student_inventory_materials.quantity + 1,
                  updated_at = now();

    material_id := v_picked;
    name        := v_pick_name;
    rarity      := v_pick_rarity;
    theme       := v_pick_theme;
    icon_url    := v_pick_icon;
    quantity    := 1;
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_battle_materials(UUID, UUID, INTEGER)
  TO anon, authenticated;


-- ── Read helper for the UI (full inventory, joined with catalog) ────
CREATE OR REPLACE FUNCTION public.get_my_materials()
RETURNS TABLE (
  material_id UUID,
  name        TEXT,
  description TEXT,
  rarity      material_rarity,
  theme       TEXT,
  icon_url    TEXT,
  quantity    INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.name, m.description, m.rarity, m.theme, m.icon_url,
         COALESCE(sim.quantity, 0) AS quantity
  FROM   public.materials m
  LEFT   JOIN public.student_inventory_materials sim
         ON sim.material_id = m.id
         AND sim.student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
  ORDER  BY
    CASE m.rarity
      WHEN 'epic'     THEN 0
      WHEN 'rare'     THEN 1
      WHEN 'uncommon' THEN 2
      ELSE                 3
    END,
    m.theme, m.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_materials() TO authenticated;
