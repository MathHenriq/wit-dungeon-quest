-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: Bosses dos andares 26-50 ganham segundo elemento
--
-- Inimigos comuns continuam mono-elemento. Apenas o boss de cada andar
-- pós-25 ganha um element_type_secondary, criando matchups duplos
-- (multiplicação ao estilo Pokémon).
--
-- O engine TS lê esta coluna em useFloors.ts e calcula a efetividade
-- de cada ataque multiplicando os dois elementos do defensor.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.enemies
  ADD COLUMN IF NOT EXISTS element_type_secondary TEXT
    CHECK (element_type_secondary IN (
      'Fire','Water','Electric','Grass','Ice','Ground',
      'Fighting','Steel','Poison','Dark','Ghost','Flying'
    ));

-- Atribuições temáticas (boss de cada andar 26-50)
WITH boss_assignments(floor_num, secondary) AS (VALUES
  (26, 'Steel'),     -- Mestre Forjador Negro
  (27, 'Dark'),      -- Necromante do Gelo
  (28, 'Ghost'),     -- Capitão Amaldiçoado
  (29, 'Poison'),    -- Arquidruida Verdejante
  (30, 'Flying'),    -- Senhor dos Raios
  (31, 'Dark'),      -- General Desossado
  (32, 'Steel'),     -- Guardião Prismático
  (33, 'Grass'),     -- Hidra de Engrenagens
  (34, 'Dark'),      -- Rainha do Veneno
  (35, 'Electric'),  -- Roca Ancestral
  (36, 'Ghost'),     -- Deusa Submersa
  (37, 'Poison'),    -- Senhora dos Espinhos
  (38, 'Ground'),    -- Sultão das Cinzas
  (39, 'Ghost'),     -- Rei das Tumbas
  (40, 'Fighting'),  -- Senhor da Fortaleza
  (41, 'Poison'),    -- Voz do Caos
  (42, 'Ghost'),     -- Rei Coroado de Cinzas
  (43, 'Ghost'),     -- Senhor dos Pesadelos
  (44, 'Steel'),     -- Imperador do Coliseu
  (45, 'Dark'),      -- Jardineiro Devorado
  (46, 'Ground'),    -- Coração do Vulcão
  (47, 'Flying'),    -- Senhora das Estrelas
  (48, 'Ghost'),     -- Avatar do Vazio
  (49, 'Ghost'),     -- Guardião do Portal
  (50, 'Dark')       -- O Arquiteto
)
UPDATE public.enemies e
SET element_type_secondary = ba.secondary
FROM boss_assignments ba
JOIN public.floors f ON f.floor_number = ba.floor_num
WHERE e.floor_id = f.id
  AND e.is_boss   = true
  AND e.element_type <> ba.secondary;  -- nunca igual ao primário

NOTIFY pgrst, 'reload schema';
