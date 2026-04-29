-- ═══════════════════════════════════════════════════════════════════════════
-- 1) FIX EXISTING FLOORS 2-15: fill NULL stats, fix element_types, add abilities
-- ═══════════════════════════════════════════════════════════════════════════

-- Fix remaining Portuguese element_types → English
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
WHERE element_type IN ('fogo','água','elétrico','planta','gelo','terra','veneno','sombra','ar','luz','normal');

-- Normalize case: lowercase → title case
UPDATE enemies SET element_type = 'Poison'   WHERE element_type = 'poison';
UPDATE enemies SET element_type = 'Ground'   WHERE element_type = 'ground';
UPDATE enemies SET element_type = 'Flying'   WHERE element_type = 'flying';
UPDATE enemies SET element_type = 'Grass'    WHERE element_type = 'grass';

-- Fill NULL level = floor's floor_number
UPDATE enemies e
SET level = f.floor_number
FROM floors f
WHERE e.floor_id = f.id AND e.level IS NULL;

-- Fill NULL def_fisica based on level + boss status
UPDATE enemies e
SET def_fisica = CASE
  WHEN e.is_boss THEN e.level * 2 + 8
  ELSE e.level + 5
END
FROM floors f
WHERE e.floor_id = f.id AND e.def_fisica IS NULL;

-- Fill NULL def_magica
UPDATE enemies SET def_magica = def_fisica + 2 WHERE def_magica IS NULL;

-- Fill NULL velocidade
UPDATE enemies SET velocidade = CASE
  WHEN is_boss THEN 8 + (level / 3)
  ELSE 10 + (level / 4)
END
WHERE velocidade IS NULL;

-- Fill NULL abilities for existing enemies based on element_type
-- Regular enemies: 2-3 abilities (tier 1-2)
-- Bosses: 3-4 abilities (tier 2-3)
UPDATE enemies SET
  ability_1 = CASE element_type
    WHEN 'Fire'     THEN 'fire_01'
    WHEN 'Water'    THEN 'water_01'
    WHEN 'Electric' THEN 'electric_01'
    WHEN 'Grass'    THEN 'grass_01'
    WHEN 'Ice'      THEN 'ice_01'
    WHEN 'Ground'   THEN 'ground_01'
    WHEN 'Fighting' THEN 'fighting_01'
    WHEN 'Steel'    THEN 'steel_01'
    WHEN 'Poison'   THEN 'poison_01'
    WHEN 'Dark'     THEN 'dark_01'
    WHEN 'Ghost'    THEN 'ghost_01'
    WHEN 'Flying'   THEN 'flying_01'
  END
WHERE ability_1 IS NULL;

UPDATE enemies SET
  ability_2 = CASE element_type
    WHEN 'Fire'     THEN 'fire_05'
    WHEN 'Water'    THEN 'water_05'
    WHEN 'Electric' THEN 'electric_05'
    WHEN 'Grass'    THEN 'grass_05'
    WHEN 'Ice'      THEN 'ice_05'
    WHEN 'Ground'   THEN 'ground_05'
    WHEN 'Fighting' THEN 'fighting_05'
    WHEN 'Steel'    THEN 'steel_05'
    WHEN 'Poison'   THEN 'poison_05'
    WHEN 'Dark'     THEN 'dark_05'
    WHEN 'Ghost'    THEN 'ghost_05'
    WHEN 'Flying'   THEN 'flying_05'
  END
WHERE ability_2 IS NULL;

UPDATE enemies SET
  ability_3 = CASE element_type
    WHEN 'Fire'     THEN 'fire_08'
    WHEN 'Water'    THEN 'water_08'
    WHEN 'Electric' THEN 'electric_08'
    WHEN 'Grass'    THEN 'grass_08'
    WHEN 'Ice'      THEN 'ice_08'
    WHEN 'Ground'   THEN 'ground_08'
    WHEN 'Fighting' THEN 'fighting_08'
    WHEN 'Steel'    THEN 'steel_08'
    WHEN 'Poison'   THEN 'poison_08'
    WHEN 'Dark'     THEN 'dark_08'
    WHEN 'Ghost'    THEN 'ghost_08'
    WHEN 'Flying'   THEN 'flying_08'
  END
WHERE ability_3 IS NULL AND is_boss = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) CREATE FLOORS 16-25 WITH ENEMIES
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Floor 16: Abismo Vulcânico ──────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (16, 'Abismo Vulcânico', 'fire', 16, 18,
  'Rios de lava cortam as cavernas profundas. O calor derrete até os pensamentos mais frios.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=16), 'Salamandra Ardente',     16, false, 140, 21, 18, 13, 'Fire', 'fire_01', 'fire_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=16), 'Golem de Magma',          16, false, 165, 26, 15, 9,  'Fire', 'fire_02', 'fire_06', NULL, 50, 55, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=16), 'Espectro da Fumaça',      17, false, 130, 18, 24, 14, 'Ghost','ghost_01','ghost_05',NULL, 35, 35, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=16), 'Serpente de Cinzas',       17, false, 145, 20, 20, 15, 'Fire', 'fire_03', 'fire_07', NULL, 65, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=16), 'Elemental de Lava',        18, false, 155, 24, 22, 11, 'Fire', 'fire_05', 'fire_08', NULL, 70, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=16), 'Dragão Menor das Cinzas', 18, true,  620, 38, 32, 11, 'Fire', 'fire_09', 'fire_05', 'fire_08', 50, 10, 'boss');

-- ── Floor 17: Selva Maldita ─────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (17, 'Selva Maldita', 'forest', 17, 19,
  'Árvores retorcidas sussurram segredos antigos. Raízes se movem como tentáculos na escuridão.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=17), 'Trepadeira Senciente',    17, false, 135, 20, 22, 12, 'Grass', 'grass_01','grass_05', NULL, 25, 70, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=17), 'Fungo Parasita',          17, false, 120, 18, 25, 10, 'Poison','poison_01','poison_05',NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=17), 'Lobo Sombrio da Mata',    18, false, 150, 22, 19, 16, 'Dark',  'dark_01', 'dark_05',  NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=17), 'Espírito da Floresta',     18, false, 140, 17, 27, 13, 'Grass', 'grass_03','grass_07', NULL, 70, 35, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=17), 'Coruja Necromante',        19, false, 145, 19, 28, 14, 'Ghost', 'ghost_02','ghost_06', NULL, 30, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=17), 'Ent Corrompido',           19, true,  660, 40, 35, 9,  'Grass', 'grass_09','grass_05', 'dark_08', 50, 10, 'boss');

-- ── Floor 18: Pico Glacial ──────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (18, 'Pico Glacial', 'cave', 18, 20,
  'Ventos congelantes cortam como lâminas. O topo da montanha esconde um trono de gelo eterno.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=18), 'Yeti das Neves',          18, false, 170, 28, 18, 10, 'Ice',  'ice_01', 'ice_05',  NULL, 35, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=18), 'Harpia Gélida',           18, false, 130, 17, 22, 17, 'Flying','flying_01','flying_06',NULL,60, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=18), 'Golem de Gelo',           19, false, 180, 30, 20, 8,  'Ice',  'ice_02', 'ice_06',  NULL, 25, 45, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=18), 'Espírito do Blizzard',    19, false, 140, 19, 28, 14, 'Ice',  'ice_03', 'ice_07',  NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=18), 'Lobo de Cristal',         20, false, 155, 24, 24, 15, 'Ice',  'ice_05', 'ice_08',  NULL, 45, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=18), 'Rainha do Gelo Eterno',   20, true,  700, 42, 38, 12, 'Ice',  'ice_09', 'ice_05',  'water_08', 50, 10, 'boss');

-- ── Floor 19: Profundezas Abissais ──────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (19, 'Profundezas Abissais', 'swamp', 19, 21,
  'Onde a luz do sol nunca alcança. Criaturas milenares espreitam nas águas escuras.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=19), 'Enguia Elétrica Abissal', 19, false, 140, 19, 24, 16, 'Electric','electric_01','electric_06',NULL, 30, 70, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=19), 'Polvo das Sombras',       19, false, 150, 22, 26, 11, 'Water','water_02','water_06',  NULL, 60, 55, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=19), 'Caranguejo Blindado',     20, false, 185, 32, 18, 8,  'Water','water_01','water_05',  NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=19), 'Medusa Venenosa',         20, false, 135, 18, 28, 14, 'Poison','poison_02','poison_07',NULL, 65, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=19), 'Tubarão Espectral',       21, false, 160, 25, 22, 17, 'Water','water_05','water_08',  NULL, 35, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=19), 'Leviatã das Profundezas', 21, true,  740, 44, 40, 10, 'Water','water_09','water_05', 'poison_08',50, 10, 'boss');

-- ── Floor 20: Santuário Celeste ─────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (20, 'Santuário Celeste', 'tower', 20, 22,
  'Acima das nuvens, relâmpagos dançam entre pilares dourados. Os guardiões do céu testam os dignos.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=20), 'Grifo Trovejante',        20, false, 155, 24, 24, 16, 'Flying','flying_02','flying_07',NULL, 25, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=20), 'Sentinela do Raio',       20, false, 145, 22, 26, 14, 'Electric','electric_02','electric_07',NULL,55,60,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=20), 'Quimera Celestial',       21, false, 170, 26, 28, 13, 'Flying','flying_05','flying_08',NULL, 40, 45, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=20), 'Anjo Caído',              21, false, 160, 23, 30, 15, 'Ghost', 'ghost_05','ghost_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=20), 'Fênix Menor',             22, false, 175, 25, 27, 16, 'Fire',  'fire_05', 'fire_09',  NULL, 30, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=20), 'Tempestade Viva',         22, true,  780, 46, 42, 14, 'Electric','electric_09','electric_05','flying_08',50,10,'boss');

-- ── Floor 21: Criptas da Escuridão ──────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (21, 'Criptas da Escuridão', 'ruins', 21, 23,
  'Tumbas seladas há milênios foram abertas. Os mortos caminham e sussurram maldições esquecidas.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=21), 'Esqueleto Guerreiro',     21, false, 150, 26, 20, 13, 'Fighting','fighting_02','fighting_06',NULL,35,70,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=21), 'Sombra Faminta',          21, false, 135, 19, 28, 16, 'Dark',   'dark_02', 'dark_06',  NULL, 60, 55, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=21), 'Banshee Lamentosa',       22, false, 140, 18, 32, 15, 'Ghost',  'ghost_03','ghost_07', NULL, 25, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=21), 'Cavaleiro Sem Cabeça',    22, false, 175, 30, 24, 12, 'Dark',   'dark_03', 'dark_07',  NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=21), 'Múmia Amaldiçoada',       23, false, 165, 28, 26, 10, 'Ghost',  'ghost_05','ghost_08', NULL, 45, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=21), 'Lich do Abismo',          23, true,  820, 40, 50, 11, 'Dark',   'dark_09', 'dark_05',  'ghost_08', 50, 10, 'boss');

-- ── Floor 22: Deserto de Aço ────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (22, 'Deserto de Aço', 'fortress', 22, 24,
  'Ruínas de máquinas colossais emergem das dunas metálicas. Autômatos patrulham sem fim.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=22), 'Autômato Sentinela',      22, false, 175, 32, 22, 11, 'Steel',  'steel_01','steel_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=22), 'Escorpião Mecânico',      22, false, 155, 28, 20, 15, 'Steel',  'steel_02','steel_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=22), 'Verme de Areia',          23, false, 185, 26, 24, 9,  'Ground', 'ground_02','ground_06',NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=22), 'Falcão de Titânio',       23, false, 145, 24, 26, 18, 'Steel',  'steel_03','steel_07', NULL, 65, 25, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=22), 'Colosso Enferrujado',     24, false, 200, 35, 20, 7,  'Steel',  'steel_05','steel_08', NULL, 35, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=22), 'Titan Mecânico',          24, true,  860, 52, 40, 10, 'Steel',  'steel_09','steel_05', 'ground_08',50, 10, 'boss');

-- ── Floor 23: Tempestade Perpétua ───────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (23, 'Tempestade Perpétua', 'plains', 23, 25,
  'Relâmpagos caem sem parar. A chuva ácida corrói até mesmo a esperança dos mais fortes.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=23), 'Elemental da Chuva',      23, false, 155, 22, 30, 14, 'Water',   'water_03','water_07', NULL, 25, 70, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=23), 'Raio Vivo',               23, false, 140, 20, 28, 19, 'Electric','electric_03','electric_08',NULL,60,55,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=23), 'Tornado Senciente',       24, false, 170, 24, 26, 16, 'Flying',  'flying_03','flying_08',NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=23), 'Serpente do Trovão',      24, false, 165, 26, 28, 15, 'Electric','electric_05','electric_09',NULL,70,30,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=23), 'Hidra Relampejante',      25, false, 190, 28, 30, 13, 'Water',   'water_05','water_09', NULL, 35, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=23), 'Deus da Tempestade',      25, true,  900, 48, 48, 13, 'Electric','electric_09','water_09','flying_08',50,10,'boss');

-- ── Floor 24: Nexus do Caos ─────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (24, 'Nexus do Caos', 'labyrinth', 24, 26,
  'Realidades se sobrepõem neste lugar. Cada corredor leva a uma dimensão diferente.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=24), 'Aberração Dimensional',   24, false, 170, 24, 30, 14, 'Ghost',  'ghost_05','ghost_08', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=24), 'Quimera do Vazio',        24, false, 180, 28, 26, 12, 'Dark',   'dark_05', 'dark_08',  NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=24), 'Doppelganger',            25, false, 165, 26, 28, 17, 'Ghost',  'ghost_03','ghost_09', NULL, 40, 45, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=24), 'Arauto do Caos',          25, false, 175, 25, 32, 15, 'Poison', 'poison_05','poison_08',NULL, 65, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=24), 'Serpente do Caos',        26, false, 195, 30, 30, 14, 'Dark',   'dark_05', 'dark_09',  NULL, 35, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=24), 'Senhor do Caos',          26, true,  940, 50, 52, 12, 'Dark',   'dark_09', 'poison_09','ghost_09', 50, 10, 'boss');

-- ── Floor 25: Torre do Julgamento ───────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (25, 'Torre do Julgamento', 'citadel', 25, 27,
  'O topo da dungeon. Apenas os mais fortes chegam aqui. O juiz final aguarda na sala do trono.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=25), 'Guardião do Primeiro Selo', 25, false, 185, 30, 28, 14, 'Fighting','fighting_05','fighting_09',NULL,25,75,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=25), 'Guardião do Segundo Selo',  25, false, 180, 28, 32, 13, 'Fire',    'fire_05',   'fire_09',    NULL, 60, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=25), 'Guardião do Terceiro Selo', 26, false, 190, 32, 30, 15, 'Ice',     'ice_05',    'ice_09',     NULL, 40, 45, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=25), 'Guardião do Quarto Selo',   26, false, 195, 30, 34, 14, 'Electric','electric_05','electric_09',NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=25), 'Sentinela do Trono',        27, false, 210, 34, 32, 16, 'Steel',   'steel_05',  'steel_09',   NULL, 35, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=25), 'Juiz Supremo',              27, true,  1000,55, 55, 14, 'Fighting','fighting_09','fire_09',   'steel_09', 50, 10, 'boss');
