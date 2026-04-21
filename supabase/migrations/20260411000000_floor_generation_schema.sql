-- =====================================================
-- MIGRAÇÃO: Sistema de Geração de Andares WIT Dungeon
-- Corrigido: floors.id é INTEGER, não UUID
-- =====================================================

-- Campos de lore e visual na tabela floors
ALTER TABLE floors ADD COLUMN IF NOT EXISTS lore_description       TEXT;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS lore_history           TEXT;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS lore_warning           TEXT;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS visual_primary_color   TEXT;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS visual_accent_color    TEXT;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS visual_fog_color       TEXT;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS visual_fog_opacity     DECIMAL(4,3) DEFAULT 0.06;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS visual_particle_type   TEXT DEFAULT 'dust';

-- Campos adicionais em enemies (atk e def para o sistema de geração)
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS sprite_id    TEXT;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS skills       JSONB DEFAULT '[]';
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS title        TEXT;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS atk          INT;

-- Campos adicionais em boss_questions
ALTER TABLE boss_questions ADD COLUMN IF NOT EXISTS explanation  TEXT;
ALTER TABLE boss_questions ADD COLUMN IF NOT EXISTS topic        TEXT;
ALTER TABLE boss_questions ADD COLUMN IF NOT EXISTS difficulty   INT DEFAULT 1;

-- Tabela de vínculo floor <-> quiz
-- ATENÇÃO: floors.id é INTEGER
CREATE TABLE IF NOT EXISTS floor_boss_quizzes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id       INT  REFERENCES floors(id)       ON DELETE CASCADE NOT NULL,
  boss_battle_id UUID REFERENCES boss_battles(id) ON DELETE CASCADE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(floor_id)
);

-- RLS
ALTER TABLE floor_boss_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers manage floor quizzes" ON floor_boss_quizzes;
CREATE POLICY "Teachers manage floor quizzes"
  ON floor_boss_quizzes FOR ALL
  USING (
    boss_battle_id IN (
      SELECT id FROM boss_battles WHERE teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view floor quizzes" ON floor_boss_quizzes;
CREATE POLICY "Anyone can view floor quizzes"
  ON floor_boss_quizzes FOR SELECT
  USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_floor_boss_quizzes_floor  ON floor_boss_quizzes(floor_id);
CREATE INDEX IF NOT EXISTS idx_floor_boss_quizzes_battle ON floor_boss_quizzes(boss_battle_id);
CREATE INDEX IF NOT EXISTS idx_enemies_is_boss           ON enemies(is_boss);
CREATE INDEX IF NOT EXISTS idx_floors_number             ON floors(floor_number);
