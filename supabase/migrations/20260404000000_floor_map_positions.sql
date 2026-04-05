-- ============================================================
-- FLOOR MAP: Add visual positions and icon types to enemies
-- Add individual defeat tracking for the floor map system
-- ============================================================

-- Add map position columns to existing enemies table
ALTER TABLE enemies
  ADD COLUMN IF NOT EXISTS position_x FLOAT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS position_y FLOAT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS icon_type  TEXT  NOT NULL DEFAULT 'skull';

-- Track which specific enemies a character has defeated
-- (character_progress only stores a count; we need per-enemy granularity for the map)
CREATE TABLE IF NOT EXISTS floor_enemy_defeats (
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  enemy_id     UUID NOT NULL REFERENCES enemies(id)    ON DELETE CASCADE,
  defeated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id, enemy_id)
);

-- RLS
ALTER TABLE floor_enemy_defeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own enemy defeats"
  ON floor_enemy_defeats FOR SELECT
  USING (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "student inserts own enemy defeats"
  ON floor_enemy_defeats FOR INSERT
  WITH CHECK (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

-- Index for fast floor-map queries
CREATE INDEX IF NOT EXISTS idx_floor_enemy_defeats_character
  ON floor_enemy_defeats (character_id);
