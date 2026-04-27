-- Drop system: catálogo, tabela de drops por inimigo e inventário de drops do aluno.
-- Segue o padrão de RLS de student_inventory: read aberto, writes por professor,
-- e escrita em runtime (fim de batalha) via RPC SECURITY DEFINER.

CREATE TYPE drop_rarity AS ENUM (
  'comum',
  'incomum',
  'raro',
  'epico',
  'lendario',
  'mitico',
  '???'
);

CREATE TABLE public.drop_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  rarity          drop_rarity NOT NULL,
  floor_theme     TEXT NOT NULL,
  base_sell_value INTEGER NOT NULL CHECK (base_sell_value >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX drop_items_floor_theme_idx ON public.drop_items (floor_theme);
CREATE INDEX drop_items_rarity_idx      ON public.drop_items (rarity);

CREATE TABLE public.enemy_drop_table (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enemy_id      UUID NOT NULL REFERENCES public.enemies(id)    ON DELETE CASCADE,
  drop_item_id  UUID NOT NULL REFERENCES public.drop_items(id) ON DELETE CASCADE,
  drop_chance   REAL    NOT NULL CHECK (drop_chance >= 0 AND drop_chance <= 1),
  min_quantity  INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
  max_quantity  INTEGER NOT NULL DEFAULT 1 CHECK (max_quantity >= min_quantity),
  UNIQUE (enemy_id, drop_item_id)
);

CREATE INDEX enemy_drop_table_enemy_idx ON public.enemy_drop_table (enemy_id);

CREATE TABLE public.student_drop_inventory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id)   ON DELETE CASCADE,
  drop_item_id  UUID NOT NULL REFERENCES public.drop_items(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  acquired_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, drop_item_id)
);

CREATE INDEX student_drop_inventory_student_idx ON public.student_drop_inventory (student_id);

ALTER TABLE public.drop_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enemy_drop_table       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_drop_inventory ENABLE ROW LEVEL SECURITY;

-- Catálogo: leitura aberta (segue padrão de challenges/items).
CREATE POLICY "Anyone can read drop_items"
  ON public.drop_items FOR SELECT USING (true);

CREATE POLICY "Anyone can read enemy_drop_table"
  ON public.enemy_drop_table FOR SELECT USING (true);

-- Inventário de drops do aluno: mesmo padrão de student_inventory.
CREATE POLICY "Anyone can read drop inventory"
  ON public.student_drop_inventory FOR SELECT USING (true);

CREATE POLICY "Teachers can insert drop inventory"
  ON public.student_drop_inventory FOR INSERT
  WITH CHECK (is_teacher_of_student(student_id));

CREATE POLICY "Teachers can update drop inventory"
  ON public.student_drop_inventory FOR UPDATE
  USING (is_teacher_of_student(student_id));

CREATE POLICY "Teachers can delete drop inventory"
  ON public.student_drop_inventory FOR DELETE
  USING (is_teacher_of_student(student_id));

-- RPC para rolagem de drops ao fim da batalha.
-- Roda como SECURITY DEFINER para contornar a RLS de write do inventário,
-- já que o aluno autenticado não tem permissão direta.
CREATE OR REPLACE FUNCTION public.apply_battle_drops(
  p_student_id UUID,
  p_enemy_id   UUID
)
RETURNS TABLE (
  drop_item_id    UUID,
  name            TEXT,
  rarity          drop_rarity,
  floor_theme     TEXT,
  base_sell_value INTEGER,
  quantity        INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row   RECORD;
  v_qty   INTEGER;
  v_roll  REAL;
BEGIN
  FOR v_row IN
    SELECT edt.drop_item_id,
           edt.drop_chance,
           edt.min_quantity,
           edt.max_quantity,
           di.name,
           di.rarity,
           di.floor_theme,
           di.base_sell_value
    FROM public.enemy_drop_table edt
    JOIN public.drop_items di ON di.id = edt.drop_item_id
    WHERE edt.enemy_id = p_enemy_id
  LOOP
    v_roll := random();
    IF v_roll <= v_row.drop_chance THEN
      IF v_row.max_quantity = v_row.min_quantity THEN
        v_qty := v_row.min_quantity;
      ELSE
        v_qty := v_row.min_quantity
               + floor(random() * (v_row.max_quantity - v_row.min_quantity + 1))::int;
      END IF;

      INSERT INTO public.student_drop_inventory (student_id, drop_item_id, quantity)
      VALUES (p_student_id, v_row.drop_item_id, v_qty)
      ON CONFLICT (student_id, drop_item_id)
      DO UPDATE SET quantity    = public.student_drop_inventory.quantity + EXCLUDED.quantity,
                    acquired_at = NOW();

      drop_item_id    := v_row.drop_item_id;
      name            := v_row.name;
      rarity          := v_row.rarity;
      floor_theme     := v_row.floor_theme;
      base_sell_value := v_row.base_sell_value;
      quantity        := v_qty;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_battle_drops(UUID, UUID) TO anon, authenticated;
