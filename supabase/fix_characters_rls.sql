-- ============================================================
-- FIX: Garante que a tabela characters existe com RLS correto
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(50) DEFAULT 'Aventureiro',
  class VARCHAR(20) DEFAULT 'Guerreiro',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  hp_current INTEGER DEFAULT 100,
  hp_max INTEGER DEFAULT 100,
  energy_max INTEGER DEFAULT 100,
  forca INTEGER DEFAULT 10,
  inteligencia INTEGER DEFAULT 10,
  destreza INTEGER DEFAULT 10,
  carisma INTEGER DEFAULT 10,
  agilidade INTEGER DEFAULT 10,
  resistencia INTEGER DEFAULT 10,
  pts_fire INTEGER DEFAULT 0,
  pts_water INTEGER DEFAULT 0,
  pts_electric INTEGER DEFAULT 0,
  pts_grass INTEGER DEFAULT 0,
  pts_ice INTEGER DEFAULT 0,
  pts_ground INTEGER DEFAULT 0,
  pts_fighting INTEGER DEFAULT 0,
  pts_steel INTEGER DEFAULT 0,
  pts_poison INTEGER DEFAULT 0,
  pts_dark INTEGER DEFAULT 0,
  pts_ghost INTEGER DEFAULT 0,
  pts_flying INTEGER DEFAULT 0,
  free_points INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  diamonds INTEGER DEFAULT 0,
  sprite_normal TEXT,
  sprite_pixel_front TEXT,
  sprite_pixel_back TEXT,
  sprite_pixel_attack TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Adicionar colunas que podem estar faltando (Wave 6)
ALTER TABLE characters ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS diamonds INTEGER DEFAULT 0;

-- 3. Habilitar RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- 4. Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "students_select_own_character" ON characters;
DROP POLICY IF EXISTS "students_insert_own_character" ON characters;
DROP POLICY IF EXISTS "students_update_own_character" ON characters;
DROP POLICY IF EXISTS "service_role_all" ON characters;

-- 5. Criar policies para aluno autenticado (anon key com JWT do Google OAuth)
CREATE POLICY "students_select_own_character"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "students_insert_own_character"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "students_update_own_character"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Verificar resultado
SELECT
  table_name,
  (SELECT COUNT(*) FROM characters) AS total_rows
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'characters';

SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'characters';
