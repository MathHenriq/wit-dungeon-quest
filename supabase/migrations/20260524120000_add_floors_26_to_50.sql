-- ═══════════════════════════════════════════════════════════════════════════
-- Andares 26-50 (Patch 2.0 — Season 2)
--
-- Segue exatamente o mesmo padrão de 20260429000000_fix_floors_and_add_16_to_25.sql:
--   - 1 boss + 5 inimigos por andar
--   - level = floor_number (boss até +2)
--   - HP/Def/Vel escala ~linear com nível
--   - abilities por element_type (fire_01 .. _09, etc)
--   - positions fixas espalhadas no mapa
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper macro: cada bloco INSERT abaixo é uma cópia do padrão dos 16-25.

-- ── 26: Forja Subterrânea ────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (26, 'Forja Subterrânea', 'fire', 26, 28,
  'Marteladas ecoam nas profundezas. Os ferreiros amaldiçoados forjam armas que nunca esfriam.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=26), 'Aprendiz Flamejante',    26, false, 195, 28, 24, 14, 'Fire',   'fire_01',  'fire_05',  NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=26), 'Martelo Vivo',           26, false, 205, 32, 22, 11, 'Steel',  'steel_02', 'steel_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=26), 'Bigorna Senciente',      27, false, 220, 35, 26, 9,  'Steel',  'steel_03', 'steel_07', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=26), 'Salamandra Forjadora',   27, false, 200, 30, 28, 15, 'Fire',   'fire_03',  'fire_07',  NULL, 65, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=26), 'Espírito da Brasa',      28, false, 190, 26, 32, 16, 'Fire',   'fire_05',  'fire_08',  NULL, 35, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=26), 'Mestre Forjador Negro',  28, true,  1040, 56, 50, 12, 'Fire',  'fire_09',  'steel_09', 'fire_08', 50, 10, 'boss');

-- ── 27: Catacumbas Gélidas ──────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (27, 'Catacumbas Gélidas', 'cave', 27, 29,
  'O frio aqui não congela apenas o corpo — congela a alma. Os mortos jamais descansam neste gelo.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=27), 'Cadáver Congelado',      27, false, 200, 30, 24, 11, 'Ice',    'ice_01',  'ice_05',   NULL, 25, 70, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=27), 'Fantasma do Gelo',       27, false, 185, 24, 32, 15, 'Ghost',  'ghost_02','ghost_06', NULL, 60, 55, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=27), 'Lich Glacial',           28, false, 210, 28, 36, 13, 'Ice',    'ice_03',  'ice_07',   NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=27), 'Aranha do Permafrost',   28, false, 195, 26, 28, 17, 'Ice',    'ice_05',  'ice_08',   NULL, 70, 25, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=27), 'Sombra Gélida',          29, false, 205, 28, 34, 16, 'Dark',   'dark_05', 'dark_08',  NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=27), 'Necromante do Gelo',     29, true,  1080, 48, 56, 13, 'Ice',   'ice_09',  'dark_09',  'ghost_08', 50, 10, 'boss');

-- ── 28: Mar dos Naufrágios ──────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (28, 'Mar dos Naufrágios', 'swamp', 28, 30,
  'Navios afundados há séculos formam um cemitério submerso. As ondas guardam segredos.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=28), 'Marinheiro Fantasma',    28, false, 195, 26, 28, 14, 'Ghost',  'ghost_01','ghost_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=28), 'Polvo Colossal',         28, false, 230, 32, 28, 10, 'Water',  'water_02','water_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=28), 'Sereia Sedutora',        29, false, 200, 24, 34, 17, 'Water',  'water_03','water_07', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=28), 'Kraken Jovem',           29, false, 240, 30, 30, 11, 'Water',  'water_05','water_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=28), 'Tubarão Espinhoso',      30, false, 215, 32, 26, 16, 'Water',  'water_05','water_09', NULL, 35, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=28), 'Capitão Amaldiçoado',    30, true,  1120, 52, 50, 14, 'Water', 'water_09','ghost_09', 'dark_08', 50, 10, 'boss');

-- ── 29: Bosque dos Druidas ──────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (29, 'Bosque dos Druidas', 'forest', 29, 31,
  'A magia natural pulsa em cada folha. Os druidas guardiões não recebem intrusos com gentileza.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=29), 'Aprendiz Druida',        29, false, 195, 24, 32, 15, 'Grass',  'grass_01','grass_05', NULL, 25, 70, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=29), 'Urso Espiritual',        29, false, 230, 36, 26, 11, 'Grass',  'grass_02','grass_06', NULL, 55, 55, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=29), 'Treant Jovem',           30, false, 245, 38, 30, 9,  'Grass',  'grass_05','grass_07', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=29), 'Lobo da Mata',           30, false, 210, 28, 28, 18, 'Grass',  'grass_03','grass_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=29), 'Fada Caçadora',          31, false, 200, 22, 36, 19, 'Grass',  'grass_05','grass_09', NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=29), 'Arquidruida Verdejante', 31, true,  1160, 50, 58, 14, 'Grass', 'grass_09','grass_05', 'poison_09',50, 10, 'boss');

-- ── 30: Cidadela do Relâmpago ───────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (30, 'Cidadela do Relâmpago', 'citadel', 30, 32,
  'Construída no topo de uma montanha onde os raios caem eternamente. Os guardiões dominam a tempestade.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=30), 'Sentinela Voltaico',     30, false, 210, 30, 32, 17, 'Electric','electric_01','electric_05',NULL,30,75,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=30), 'Mago da Tempestade',     30, false, 195, 24, 38, 16, 'Electric','electric_02','electric_06',NULL,55,60,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=30), 'Cavaleiro do Raio',      31, false, 230, 36, 30, 14, 'Electric','electric_03','electric_07',NULL,40,40,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=30), 'Quimera Trovejante',     31, false, 240, 32, 32, 15, 'Electric','electric_05','electric_08',NULL,70,30,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=30), 'Águia Celestial',        32, false, 220, 28, 34, 19, 'Flying','flying_05','flying_08',NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=30), 'Senhor dos Raios',       32, true,  1200, 54, 60, 16, 'Electric','electric_09','flying_09','electric_05',50,10,'boss');

-- ── 31: Vale dos Ossos ──────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (31, 'Vale dos Ossos', 'ruins', 31, 33,
  'Um campo de batalha de mil anos atrás. Os esqueletos lembram cada golpe que receberam.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=31), 'Esqueleto Arqueiro',     31, false, 205, 28, 24, 17, 'Fighting','fighting_01','fighting_05',NULL,30,75,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=31), 'Esqueleto Cavaleiro',    31, false, 235, 38, 26, 13, 'Fighting','fighting_02','fighting_06',NULL,55,60,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=31), 'Necrofera',              32, false, 215, 28, 34, 15, 'Dark',   'dark_03',  'dark_07',  NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=31), 'Wraith do Vale',         32, false, 210, 24, 36, 17, 'Ghost',  'ghost_03', 'ghost_07', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=31), 'Cão dos Tempos',         33, false, 220, 30, 30, 18, 'Dark',   'dark_05',  'dark_09',  NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=31), 'General Desossado',      33, true,  1240, 60, 52, 13, 'Fighting','fighting_09','dark_09','fighting_05',50,10,'boss');

-- ── 32: Caverna dos Cristais ────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (32, 'Caverna dos Cristais', 'cave', 32, 34,
  'Cristais luminosos crescem das paredes. Cada um guarda a memória de um aventureiro perdido.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=32), 'Aranha Cristalina',      32, false, 210, 30, 28, 17, 'Ice',    'ice_01',  'ice_06',   NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=32), 'Golem de Quartzo',       32, false, 250, 40, 28, 9,  'Steel',  'steel_02','steel_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=32), 'Drake do Cristal',       33, false, 230, 32, 34, 14, 'Ice',    'ice_03',  'ice_07',   NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=32), 'Espírito Refrativo',     33, false, 215, 24, 38, 16, 'Ghost',  'ghost_05','ghost_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=32), 'Verme dos Veios',        34, false, 240, 36, 30, 11, 'Ground', 'ground_05','ground_08',NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=32), 'Guardião Prismático',    34, true,  1280, 58, 58, 13, 'Ice',   'ice_09',  'steel_09', 'ghost_09', 50, 10, 'boss');

-- ── 33: Selva Mecânica ──────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (33, 'Selva Mecânica', 'fortress', 33, 35,
  'Onde a natureza foi substituída por engrenagens. Árvores de metal sangram óleo.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=33), 'Cipó Mecânico',          33, false, 215, 32, 26, 14, 'Grass',  'grass_01','grass_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=33), 'Inseto Robótico',        33, false, 200, 26, 30, 18, 'Steel',  'steel_02','steel_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=33), 'Pantera de Aço',         34, false, 235, 34, 28, 17, 'Steel',  'steel_03','steel_07', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=33), 'Treant Cibernético',     34, false, 260, 40, 32, 10, 'Grass',  'grass_05','steel_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=33), 'Drone Caçador',          35, false, 215, 28, 36, 19, 'Steel',  'steel_05','steel_09', NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=33), 'Hidra de Engrenagens',   35, true,  1320, 56, 54, 12, 'Steel', 'steel_09','grass_09', 'steel_05', 50, 10, 'boss');

-- ── 34: Pantanal Venenoso ───────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (34, 'Pantanal Venenoso', 'swamp', 34, 36,
  'O ar aqui é tóxico. Cada respiração é uma dose lenta de morte.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=34), 'Sapo Tóxico',            34, false, 215, 28, 30, 14, 'Poison', 'poison_01','poison_05',NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=34), 'Serpente do Lodo',       34, false, 225, 30, 32, 16, 'Poison', 'poison_02','poison_06',NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=34), 'Bruxa do Pântano',       35, false, 220, 26, 38, 15, 'Poison', 'poison_03','poison_07',NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=34), 'Hidra do Lodo',          35, false, 255, 36, 32, 11, 'Poison', 'poison_05','poison_08',NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=34), 'Mosquito Gigante',       36, false, 200, 22, 36, 20, 'Poison', 'poison_05','poison_09',NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=34), 'Rainha do Veneno',       36, true,  1360, 52, 62, 14, 'Poison','poison_09','dark_09',  'poison_05',50, 10, 'boss');

-- ── 35: Pico do Trovão ──────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (35, 'Pico do Trovão', 'tower', 35, 37,
  'A montanha mais alta do reino. Os raios caem aqui antes de qualquer outro lugar.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=35), 'Harpia do Pico',         35, false, 220, 26, 32, 19, 'Flying', 'flying_01','flying_05',NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=35), 'Grifo Tempestuoso',      35, false, 240, 32, 30, 17, 'Flying', 'flying_02','flying_06',NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=35), 'Roca Anciã',             36, false, 260, 38, 32, 13, 'Flying', 'flying_03','flying_07',NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=35), 'Sentinela Alada',        36, false, 230, 30, 36, 18, 'Electric','electric_05','flying_08',NULL,70,30,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=35), 'Águia Trovejante',       37, false, 235, 28, 38, 20, 'Electric','electric_05','electric_09',NULL,30,18,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=35), 'Roca Ancestral',         37, true,  1400, 54, 60, 17, 'Flying','flying_09','electric_09','flying_05',50,10,'boss');

-- ── 36: Templo Submerso ─────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (36, 'Templo Submerso', 'temple', 36, 38,
  'Uma civilização perdida no fundo do oceano. Os deuses ainda exigem oferendas.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=36), 'Sacerdote Afogado',      36, false, 225, 26, 38, 15, 'Water',  'water_01','water_06', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=36), 'Guarda do Templo',       36, false, 250, 36, 30, 13, 'Water',  'water_02','water_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=36), 'Estátua Animada',        37, false, 270, 42, 32, 9,  'Steel',  'steel_05','steel_07', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=36), 'Lula Sagrada',           37, false, 235, 30, 34, 18, 'Water',  'water_05','water_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=36), 'Oráculo Marinho',        38, false, 230, 26, 40, 17, 'Water',  'water_05','water_09', NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=36), 'Deusa Submersa',         38, true,  1440, 56, 62, 15, 'Water', 'water_09','ghost_09', 'water_05', 50, 10, 'boss');

-- ── 37: Floresta Espinhal ───────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (37, 'Floresta Espinhal', 'forest', 37, 39,
  'Espinhos do tamanho de espadas crescem em cada arbusto. Caminhar aqui é sangrar.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=37), 'Caçador Selvagem',       37, false, 235, 32, 28, 18, 'Grass',  'grass_01','grass_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=37), 'Lobo Espinhento',        37, false, 240, 34, 30, 17, 'Grass',  'grass_02','grass_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=37), 'Treant Carnívoro',       38, false, 275, 42, 32, 10, 'Grass',  'grass_05','grass_07', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=37), 'Aranha do Mato',         38, false, 245, 30, 32, 19, 'Poison', 'poison_05','poison_08',NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=37), 'Visco Estrangulador',    39, false, 230, 28, 38, 16, 'Grass',  'grass_05','grass_09', NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=37), 'Senhora dos Espinhos',   39, true,  1480, 60, 60, 16, 'Grass', 'grass_09','poison_09','grass_05', 50, 10, 'boss');

-- ── 38: Dunas Ardentes ──────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (38, 'Dunas Ardentes', 'fire', 38, 40,
  'O sol nunca se põe neste deserto. A areia queima até através das botas mais grossas.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=38), 'Escorpião Flamejante',   38, false, 240, 34, 30, 17, 'Fire',   'fire_01',  'fire_05',  NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=38), 'Mírmica do Deserto',     38, false, 235, 30, 32, 16, 'Ground', 'ground_02','ground_06',NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=38), 'Sand Walker',            39, false, 270, 40, 32, 11, 'Ground', 'ground_03','ground_07',NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=38), 'Salamandra do Sol',      39, false, 250, 32, 36, 18, 'Fire',   'fire_05',  'fire_08',  NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=38), 'Ifrit Menor',            40, false, 245, 28, 40, 17, 'Fire',   'fire_05',  'fire_09',  NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=38), 'Sultão das Cinzas',      40, true,  1520, 58, 62, 15, 'Fire',  'fire_09',  'ground_09','fire_05',  50, 10, 'boss');

-- ── 39: Necrópole ───────────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (39, 'Necrópole', 'ruins', 39, 41,
  'A cidade dos mortos. Mais habitada do que qualquer cidade dos vivos.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=39), 'Ghoul Faminto',          39, false, 245, 30, 32, 16, 'Dark',   'dark_01',  'dark_05',  NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=39), 'Vampiro Menor',          39, false, 235, 28, 38, 18, 'Dark',   'dark_02',  'dark_06',  NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=39), 'Banshee Antiga',         40, false, 250, 28, 40, 16, 'Ghost',  'ghost_03', 'ghost_07', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=39), 'Múmia Real',             40, false, 270, 40, 36, 11, 'Ghost',  'ghost_05', 'ghost_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=39), 'Wraith Sombrio',         41, false, 255, 30, 42, 17, 'Dark',   'dark_05',  'dark_09',  NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=39), 'Rei das Tumbas',         41, true,  1560, 56, 64, 14, 'Dark',  'dark_09',  'ghost_09', 'dark_05',  50, 10, 'boss');

-- ── 40: Fortaleza de Aço Negro ──────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (40, 'Fortaleza de Aço Negro', 'fortress', 40, 42,
  'Construída com metal que absorve a luz. Nenhum exército jamais conseguiu invadir.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=40), 'Soldado de Aço',         40, false, 260, 42, 30, 14, 'Steel',  'steel_01', 'steel_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=40), 'Capitão Blindado',       40, false, 275, 44, 32, 13, 'Steel',  'steel_02', 'steel_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=40), 'Mago de Guerra',         41, false, 245, 26, 42, 16, 'Dark',   'dark_05',  'dark_08',  NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=40), 'Berserker da Fortaleza', 41, false, 280, 40, 34, 18, 'Fighting','fighting_05','fighting_08',NULL,70,30,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=40), 'Cavaleiro do Aço Negro', 42, false, 290, 46, 38, 15, 'Steel',  'steel_05', 'steel_09', NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=40), 'Senhor da Fortaleza',    42, true,  1600, 64, 60, 14, 'Steel', 'steel_09', 'fighting_09','steel_05',50, 10, 'boss');

-- ── 41: Caos Primordial ─────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (41, 'Caos Primordial', 'labyrinth', 41, 43,
  'Antes do tempo existir, existia apenas o caos. Aqui, ele ainda reina.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=41), 'Aberração Inicial',      41, false, 260, 32, 38, 16, 'Ghost',  'ghost_01', 'ghost_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=41), 'Tentáculo do Vazio',     41, false, 275, 36, 36, 14, 'Dark',   'dark_02',  'dark_06',  NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=41), 'Olho do Caos',           42, false, 250, 28, 44, 17, 'Ghost',  'ghost_05', 'ghost_08', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=41), 'Quimera Primordial',     42, false, 285, 38, 38, 16, 'Dark',   'dark_05',  'poison_08',NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=41), 'Shoggoth Menor',         43, false, 295, 36, 42, 13, 'Poison', 'poison_05','poison_09',NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=41), 'Voz do Caos',            43, true,  1640, 58, 68, 15, 'Dark',  'dark_09',  'poison_09','ghost_09', 50, 10, 'boss');

-- ── 42: Salão dos Reis ──────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (42, 'Salão dos Reis', 'citadel', 42, 44,
  'Os tronos vazios de cem dinastias. Os espíritos reais ainda julgam os mortais.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=42), 'Guarda Real',            42, false, 275, 42, 34, 15, 'Fighting','fighting_02','fighting_06',NULL,30,75,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=42), 'Conselheiro Espectral',  42, false, 250, 28, 44, 17, 'Ghost',  'ghost_03', 'ghost_07', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=42), 'Cavaleiro do Trono',     43, false, 295, 46, 36, 14, 'Steel',  'steel_05', 'steel_08', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=42), 'Bardo Amaldiçoado',      43, false, 260, 30, 42, 18, 'Dark',   'dark_05',  'dark_08',  NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=42), 'Princesa Sombria',       44, false, 270, 32, 46, 17, 'Ghost',  'ghost_05', 'ghost_09', NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=42), 'Rei Coroado de Cinzas',  44, true,  1680, 62, 66, 15, 'Fighting','fighting_09','ghost_09','dark_09', 50, 10, 'boss');

-- ── 43: Abismo do Pesadelo ──────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (43, 'Abismo do Pesadelo', 'cave', 43, 45,
  'Para entrar aqui, basta dormir. Para sair... ninguém sabe.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=43), 'Devorador de Sonhos',    43, false, 270, 32, 42, 17, 'Dark',   'dark_01',  'dark_05',  NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=43), 'Espelho Vivo',           43, false, 250, 30, 44, 16, 'Ghost',  'ghost_02', 'ghost_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=43), 'Sombra de Mil Faces',    44, false, 275, 34, 42, 18, 'Dark',   'dark_05',  'dark_08',  NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=43), 'Bicho Papão',            44, false, 290, 38, 40, 15, 'Ghost',  'ghost_05', 'ghost_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=43), 'Pesadelo Anciá',         45, false, 285, 32, 46, 18, 'Dark',   'dark_05',  'dark_09',  NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=43), 'Senhor dos Pesadelos',   45, true,  1720, 60, 70, 16, 'Dark',  'dark_09',  'ghost_09', 'dark_05',  50, 10, 'boss');

-- ── 44: Coliseu Espectral ───────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (44, 'Coliseu Espectral', 'ruins', 44, 46,
  'Os gladiadores morreram há séculos. Mas as multidões fantasma ainda gritam por sangue.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=44), 'Gladiador Fantasma',     44, false, 280, 40, 34, 17, 'Fighting','fighting_01','fighting_05',NULL,30,75,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=44), 'Besta de Arena',         44, false, 295, 42, 32, 16, 'Fighting','fighting_02','fighting_06',NULL,55,60,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=44), 'Mestre de Armas',        45, false, 285, 38, 38, 18, 'Steel',  'steel_05', 'steel_08', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=44), 'Lutador Espectral',      45, false, 275, 34, 40, 19, 'Ghost',  'ghost_05', 'ghost_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=44), 'Campeão Esquecido',      46, false, 305, 44, 40, 16, 'Fighting','fighting_05','fighting_09',NULL,30,18,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=44), 'Imperador do Coliseu',   46, true,  1760, 66, 64, 16, 'Fighting','fighting_09','steel_09','ghost_09', 50, 10, 'boss');

-- ── 45: Jardim Proibido ─────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (45, 'Jardim Proibido', 'forest', 45, 47,
  'Plantas que comem alma crescem aqui. O jardineiro foi a primeira vítima delas.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=45), 'Rosa Carnívora',         45, false, 280, 32, 40, 17, 'Grass',  'grass_01','grass_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=45), 'Espinheiro Móvel',       45, false, 305, 42, 36, 13, 'Grass',  'grass_02','grass_06', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=45), 'Lírio Hipnótico',        46, false, 270, 28, 46, 18, 'Grass',  'grass_03','grass_07', NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=45), 'Mandrágora Letal',       46, false, 290, 34, 42, 16, 'Poison', 'poison_05','poison_08',NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=45), 'Treant das Sombras',     47, false, 315, 44, 40, 14, 'Dark',   'dark_05',  'grass_09', NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=45), 'Jardineiro Devorado',    47, true,  1800, 60, 70, 15, 'Grass', 'grass_09','poison_09','dark_09',  50, 10, 'boss');

-- ── 46: Vulcão Adormecido ───────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (46, 'Vulcão Adormecido', 'fire', 46, 48,
  'Não há erupções há mil anos. Mas algo lá dentro está acordando.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=46), 'Dragão da Lava',         46, false, 305, 40, 40, 17, 'Fire',   'fire_01',  'fire_05',  NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=46), 'Fênix Menor',            46, false, 285, 32, 44, 19, 'Fire',   'fire_02',  'fire_06',  NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=46), 'Ifrit Maior',            47, false, 295, 34, 46, 18, 'Fire',   'fire_05',  'fire_08',  NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=46), 'Behemoth Ígneo',         47, false, 320, 46, 40, 14, 'Fire',   'fire_05',  'fire_09',  NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=46), 'Salamandra Ancestral',   48, false, 300, 38, 44, 17, 'Fire',   'fire_05',  'fire_09',  NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=46), 'Coração do Vulcão',      48, true,  1840, 62, 70, 16, 'Fire',  'fire_09',  'ground_09','fire_05',  50, 10, 'boss');

-- ── 47: Torre Astral ────────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (47, 'Torre Astral', 'tower', 47, 49,
  'A torre toca as estrelas. Cada andar revela uma constelação que os mortais nunca deveriam ver.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=47), 'Espírito Estelar',       47, false, 290, 30, 48, 19, 'Ghost',  'ghost_01', 'ghost_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=47), 'Sentinela do Cosmos',    47, false, 310, 42, 42, 16, 'Steel',  'steel_05', 'steel_08', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=47), 'Anjo da Aurora',         48, false, 305, 36, 46, 18, 'Flying', 'flying_05','flying_08',NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=47), 'Quimera Sideral',        48, false, 320, 40, 44, 17, 'Electric','electric_05','electric_09',NULL,70,30,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=47), 'Astrônomo Lunático',     49, false, 295, 32, 50, 19, 'Ghost',  'ghost_05', 'ghost_09', NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=47), 'Senhora das Estrelas',   49, true,  1880, 60, 74, 17, 'Ghost', 'ghost_09', 'flying_09','electric_09',50,10,'boss');

-- ── 48: Cripta do Vazio ─────────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (48, 'Cripta do Vazio', 'ruins', 48, 49,
  'Não há nada aqui. Literalmente nada. E o nada está vivo.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=48), 'Anti-Espírito',          48, false, 305, 34, 46, 18, 'Ghost',  'ghost_01', 'ghost_05', NULL, 30, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=48), 'Devorador Cósmico',      48, false, 320, 38, 44, 16, 'Dark',   'dark_02',  'dark_06',  NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=48), 'Aberração Nula',         49, false, 310, 36, 48, 17, 'Dark',   'dark_05',  'dark_08',  NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=48), 'Eco do Nada',            49, false, 295, 30, 50, 19, 'Ghost',  'ghost_05', 'ghost_08', NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=48), 'Vácuo Vivo',             49, false, 330, 42, 46, 15, 'Dark',   'dark_05',  'dark_09',  NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=48), 'Avatar do Vazio',        49, true,  1920, 62, 76, 17, 'Dark',  'dark_09',  'ghost_09', 'dark_05',  50, 10, 'boss');

-- ── 49: Portal Dimensional ──────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (49, 'Portal Dimensional', 'labyrinth', 49, 50,
  'O último portal antes do trono. Realidades colidem, e os guardiões são feitos de paradoxos.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=49), 'Eco de Realidade A',     49, false, 310, 36, 46, 18, 'Electric','electric_05','electric_08',NULL,30,75,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=49), 'Eco de Realidade B',     49, false, 320, 38, 46, 17, 'Water',  'water_05', 'water_08', NULL, 55, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=49), 'Eco de Realidade C',     50, false, 330, 40, 46, 16, 'Fire',   'fire_05',  'fire_08',  NULL, 40, 40, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=49), 'Eco de Realidade D',     50, false, 325, 38, 48, 17, 'Ice',    'ice_05',   'ice_08',   NULL, 70, 30, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=49), 'Paradoxo Vivo',          50, false, 340, 42, 46, 18, 'Ghost',  'ghost_05', 'ghost_09', NULL, 30, 18, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=49), 'Guardião do Portal',     50, true,  1980, 64, 76, 17, 'Steel', 'steel_09', 'ghost_09', 'electric_09',50,10,'boss');

-- ── 50: Trono do Arquiteto ──────────────────────────────────────────────
INSERT INTO floors (floor_number, name, theme, level_min, level_max, lore)
VALUES (50, 'Trono do Arquiteto', 'citadel', 50, 50,
  'O fim da dungeon. O ser que projetou cada andar, cada inimigo, cada armadilha — aguarda.')
ON CONFLICT (floor_number) DO NOTHING;

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade, element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type) VALUES
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=50), 'Sentinela Final α',      50, false, 330, 44, 44, 17, 'Steel',  'steel_05', 'steel_09', NULL, 25, 75, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=50), 'Sentinela Final β',      50, false, 325, 42, 46, 18, 'Fire',   'fire_05',  'fire_09',  NULL, 60, 60, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=50), 'Sentinela Final γ',      50, false, 335, 44, 46, 17, 'Ice',    'ice_05',   'ice_09',   NULL, 40, 45, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=50), 'Sentinela Final δ',      50, false, 340, 46, 48, 16, 'Electric','electric_05','electric_09',NULL,70,30,'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=50), 'Avatar do Arquiteto',    50, false, 360, 50, 50, 18, 'Dark',   'dark_05',  'dark_09',  NULL, 35, 20, 'skull'),
  (gen_random_uuid(), (SELECT id FROM floors WHERE floor_number=50), 'O Arquiteto',            50, true,  2200, 70, 80, 18, 'Ghost', 'ghost_09', 'dark_09',  'fighting_09',50,10,'boss');
