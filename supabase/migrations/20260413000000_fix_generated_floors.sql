-- =====================================================
-- Corrige andares gerados pelo script automático
-- =====================================================

-- 1. Expandir constraint de floor_number de 1-20 para 1-50
ALTER TABLE floors DROP CONSTRAINT IF EXISTS floors_floor_number_check;
ALTER TABLE floors ADD CONSTRAINT floors_floor_number_check
  CHECK (floor_number BETWEEN 1 AND 50);

-- 2. Corrigir element_type de português → ElementType do jogo
UPDATE enemies SET element_type = CASE element_type
  WHEN 'fogo'     THEN 'Fire'
  WHEN 'água'     THEN 'Water'
  WHEN 'elétrico' THEN 'Electric'
  WHEN 'planta'   THEN 'Grass'
  WHEN 'gelo'     THEN 'Ice'
  WHEN 'terra'    THEN 'Ground'
  WHEN 'veneno'   THEN 'Poison'
  WHEN 'sombra'   THEN 'Dark'
  WHEN 'ar'       THEN 'Flying'
  WHEN 'luz'      THEN 'Ghost'
  WHEN 'normal'   THEN 'Fighting'
  ELSE element_type
END
WHERE element_type IN (
  'fogo','água','elétrico','planta','gelo',
  'terra','veneno','sombra','ar','luz','normal'
);

-- 3. Preencher stats faltantes com defaults baseados no floor_id
-- level: floor_number do andar
UPDATE enemies e
SET level = f.floor_number
FROM floors f
WHERE e.floor_id = f.id
  AND e.level IS NULL;

-- velocidade: boss = 8, inimigo normal = 10 + aleatoriedade fixada por id
UPDATE enemies SET velocidade = CASE
  WHEN is_boss THEN 8
  ELSE 10
END
WHERE velocidade IS NULL;

-- def_magica: igual def_fisica quando null
UPDATE enemies
SET def_magica = COALESCE(def_fisica, 5)
WHERE def_magica IS NULL;
