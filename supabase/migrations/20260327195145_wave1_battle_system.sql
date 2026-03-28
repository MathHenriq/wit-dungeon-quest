-- ============================================================
-- WAVE 1: BATTLE SYSTEM - Elementos e Habilidades
-- 12 tipos elementais, 156 habilidades (13 por elemento)
-- ============================================================

-- TIPOS E ELEMENTOS
CREATE TABLE IF NOT EXISTS elements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL,
  icon_url TEXT,
  color_hex VARCHAR(7)
);

-- HABILIDADES
CREATE TABLE IF NOT EXISTS abilities (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  element_id INTEGER REFERENCES elements(id),
  tier INTEGER CHECK (tier BETWEEN 1 AND 4),
  damage_type VARCHAR(10) CHECK (damage_type IN ('Physical', 'Special', 'Status')),
  base_damage INTEGER,
  energy_cost INTEGER,
  accuracy INTEGER CHECK (accuracy BETWEEN 0 AND 100),
  requirement INTEGER,
  effect_type VARCHAR(20),
  effect_chance DECIMAL(3,2),
  effect_value DECIMAL(5,2),
  description TEXT
);

-- PERSONAGENS
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(50),
  class VARCHAR(20),
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  hp_current INTEGER,
  hp_max INTEGER,
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
  sprite_normal TEXT,
  sprite_pixel_front TEXT,
  sprite_pixel_back TEXT,
  sprite_pixel_attack TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- HABILIDADES EQUIPADAS
CREATE TABLE IF NOT EXISTS character_abilities (
  character_id UUID REFERENCES characters(id),
  ability_id VARCHAR(20) REFERENCES abilities(id),
  slot INTEGER CHECK (slot BETWEEN 1 AND 4),
  PRIMARY KEY (character_id, slot),
  UNIQUE (character_id, ability_id)
);

-- ANDARES
CREATE TABLE IF NOT EXISTS floors (
  id SERIAL PRIMARY KEY,
  floor_number INTEGER UNIQUE CHECK (floor_number BETWEEN 1 AND 20),
  name VARCHAR(100),
  theme TEXT,
  level_min INTEGER,
  level_max INTEGER,
  lore TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- INIMIGOS
CREATE TABLE IF NOT EXISTS enemies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id INTEGER REFERENCES floors(id),
  name VARCHAR(100),
  level INTEGER,
  is_boss BOOLEAN DEFAULT FALSE,
  lore TEXT,
  hp_max INTEGER,
  def_fisica INTEGER,
  def_magica INTEGER,
  velocidade INTEGER,
  element_type VARCHAR(20),
  sprite_url TEXT,
  ability_1 VARCHAR(20) REFERENCES abilities(id),
  ability_2 VARCHAR(20) REFERENCES abilities(id),
  ability_3 VARCHAR(20) REFERENCES abilities(id),
  ability_4 VARCHAR(20) REFERENCES abilities(id),
  special_ability_name VARCHAR(100),
  special_ability_effect TEXT,
  special_trigger VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- PROGRESSO
CREATE TABLE IF NOT EXISTS character_progress (
  character_id UUID REFERENCES characters(id),
  floor_id INTEGER REFERENCES floors(id),
  enemies_defeated INTEGER DEFAULT 0,
  boss_defeated BOOLEAN DEFAULT FALSE,
  times_completed INTEGER DEFAULT 0,
  best_time_seconds INTEGER,
  PRIMARY KEY (character_id, floor_id)
);

-- ============================================================
-- SEED: 12 ELEMENTOS
-- ============================================================
INSERT INTO elements (name, icon_url, color_hex) VALUES
('Fire',     '/icons/fire.png',     '#d94e3f'),
('Water',    '/icons/water.png',    '#4a90e2'),
('Electric', '/icons/electric.png', '#f8d030'),
('Grass',    '/icons/grass.png',    '#78c850'),
('Ice',      '/icons/ice.png',      '#98d8d8'),
('Ground',   '/icons/ground.png',   '#e0c068'),
('Fighting', '/icons/fighting.png', '#c03028'),
('Steel',    '/icons/steel.png',    '#b8b8d0'),
('Poison',   '/icons/poison.png',   '#a040a0'),
('Dark',     '/icons/dark.png',     '#705848'),
('Ghost',    '/icons/ghost.png',    '#705898'),
('Flying',   '/icons/flying.png',   '#a890f0')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED: 156 HABILIDADES (13 por elemento)
-- ============================================================

-- FIRE (element_id = 1)
INSERT INTO abilities VALUES
('fire_01', 'Brasa', 1, 1, 'Special', 40, 10, 100, 25, 'burn', 0.10, NULL, 'Lança uma pequena chama.'),
('fire_02', 'Presa Ígnea', 1, 1, 'Physical', 45, 12, 95, 30, 'burn', 0.15, NULL, 'Morde com presas em chamas.'),
('fire_03', 'Cinzas', 1, 1, 'Status', 0, 10, 100, 25, 'accuracy_down', 0.30, NULL, 'Lança cinzas que reduzem precisão.'),
('fire_04', 'Chama Giratória', 1, 1, 'Special', 35, 15, 100, 35, 'burn', 0.20, NULL, 'Rodopia envolvido em chamas.'),
('fire_05', 'Lança-Chamas', 1, 2, 'Special', 70, 22, 100, 60, 'burn', 0.20, NULL, 'Dispara jato intenso de fogo.'),
('fire_06', 'Roda de Fogo', 1, 2, 'Physical', 65, 20, 100, 65, 'burn', 0.15, NULL, 'Ataque giratório flamejante.'),
('fire_07', 'Explosão de Calor', 1, 2, 'Special', 75, 25, 95, 75, 'burn', 0.25, NULL, 'Explosão que pode queimar.'),
('fire_08', 'Lâmina de Fogo', 1, 2, 'Physical', 80, 24, 100, 80, 'burn', 0.10, NULL, 'Corte com lâmina flamejante.'),
('fire_09', 'Chama Furiosa', 1, 3, 'Physical', 110, 35, 100, 100, 'recoil', 0.25, NULL, 'Ataque devastador que causa dano ao usuário.'),
('fire_10', 'Tempestade de Fogo', 1, 3, 'Special', 100, 38, 90, 110, 'burn', 0.40, NULL, 'Tempestade flamejante.'),
('fire_11', 'Golpe Solar', 1, 3, 'Special', 120, 40, 100, 120, NULL, NULL, NULL, 'Concentra energia solar em ataque poderoso.'),
('fire_12', 'Explosão', 1, 3, 'Special', 115, 36, 100, 130, NULL, NULL, NULL, 'Explosão massiva de energia.'),
('fire_13', 'Inferno Supremo', 1, 4, 'Special', 150, 55, 100, 150, 'burn', 1.00, NULL, 'Invoca chamas ancestrais. AoE que queima sempre.')
ON CONFLICT (id) DO NOTHING;

-- WATER (element_id = 2)
INSERT INTO abilities VALUES
('water_01', 'Jato d''Água', 2, 1, 'Special', 40, 10, 100, 25, 'wet', 0.20, NULL, 'Um jato de água pressurizada que ensopa o alvo.'),
('water_02', 'Bolha Gélida', 2, 1, 'Special', 35, 10, 95, 25, 'freeze', 0.10, NULL, 'Bolhas de água gelada que podem congelar o alvo.'),
('water_03', 'Investida Aquática', 2, 1, 'Physical', 50, 15, 90, 40, NULL, 0.00, NULL, 'Um avanço poderoso impulsionado pela água.'),
('water_04', 'Neblina Úmida', 2, 1, 'Status', 0, 10, 85, 30, 'accuracy_down', 0.80, NULL, 'Uma névoa densa que reduz a precisão do inimigo.'),
('water_05', 'Torrente Furiosa', 2, 2, 'Special', 65, 20, 100, 60, 'wet', 0.30, NULL, 'Uma torrente intensa que encharca o campo de batalha.'),
('water_06', 'Golpe Aquático', 2, 2, 'Physical', 70, 20, 95, 70, NULL, 0.00, NULL, 'Um soco carregado de energia aquática.'),
('water_07', 'Vórtice Submarino', 2, 2, 'Special', 75, 25, 90, 80, 'confuse', 0.20, NULL, 'Um redemoinho subaquático que desorienta o adversário.'),
('water_08', 'Maré Alta', 2, 2, 'Status', 0, 20, 100, 60, 'def_up', 1.00, NULL, 'Convoca a força da maré para elevar a própria defesa.'),
('water_09', 'Cascata Devastadora', 2, 3, 'Special', 95, 35, 100, 100, 'wet', 0.40, NULL, 'Uma cachoeira colossal que destrói tudo em seu caminho.'),
('water_10', 'Pressão Abissal', 2, 3, 'Special', 105, 35, 90, 120, 'def_down', 0.30, NULL, 'A pressão das profundezas esmaga as defesas do alvo.'),
('water_11', 'Pulso Aquático', 2, 3, 'Special', 110, 40, 95, 130, 'confuse', 0.30, NULL, 'Ondas de energia aquática que perturbam a mente inimiga.'),
('water_12', 'Dilúvio Ancestral', 2, 3, 'Physical', 120, 40, 85, 140, NULL, 0.00, NULL, 'A força de um dilúvio primordial concentrada em um golpe.'),
('water_13', 'Tsunami Primordial', 2, 4, 'Special', 160, 55, 90, 150, 'wet', 1.00, NULL, 'O poder destrutivo de um tsunami ancestral liberado de uma vez.')
ON CONFLICT (id) DO NOTHING;

-- ELECTRIC (element_id = 3)
INSERT INTO abilities VALUES
('electric_01', 'Faísca', 3, 1, 'Special', 40, 10, 100, 25, 'paralyze', 0.10, NULL, 'Uma faísca elétrica que pode paralisar o alvo.'),
('electric_02', 'Choque Relâmpago', 3, 1, 'Physical', 45, 10, 95, 30, 'paralyze', 0.15, NULL, 'Um choque veloz como um raio que pode paralisar.'),
('electric_03', 'Descarga Estática', 3, 1, 'Special', 50, 15, 90, 40, NULL, 0.00, NULL, 'Uma descarga de eletricidade estática de alta voltagem.'),
('electric_04', 'Campo Elétrico', 3, 1, 'Status', 0, 10, 100, 25, 'paralyze', 0.60, NULL, 'Cria um campo elétrico ao redor do inimigo que pode paralisá-lo.'),
('electric_05', 'Trovão Cortante', 3, 2, 'Special', 70, 20, 95, 60, 'paralyze', 0.20, NULL, 'Um raio afiado que corta através das defesas inimigas.'),
('electric_06', 'Pulso Elétrico', 3, 2, 'Special', 65, 20, 100, 65, 'stun', 0.25, NULL, 'Ondas de energia elétrica que podem atordoar o adversário.'),
('electric_07', 'Voltagem Máxima', 3, 2, 'Special', 75, 25, 85, 80, NULL, 0.00, NULL, 'Uma sobrecarga elétrica de altíssima voltagem.'),
('electric_08', 'Sobrecarga Nervosa', 3, 2, 'Status', 0, 20, 90, 60, 'speed_down', 0.80, NULL, 'Interfere no sistema nervoso do alvo reduzindo sua velocidade.'),
('electric_09', 'Tempestade Elétrica', 3, 3, 'Special', 95, 35, 90, 100, 'paralyze', 0.30, NULL, 'Uma tempestade de relâmpagos que paralisa o campo de batalha.'),
('electric_10', 'Raio Devastador', 3, 3, 'Special', 110, 40, 85, 120, NULL, 0.00, NULL, 'Um raio de enorme potência que destrói as defesas inimigas.'),
('electric_11', 'Ionização Total', 3, 3, 'Special', 100, 35, 95, 130, 'stun', 0.35, NULL, 'Ioniza completamente o corpo do adversário com energia elétrica.'),
('electric_12', 'Descarga Plasmática', 3, 3, 'Physical', 115, 40, 90, 140, 'paralyze', 0.40, NULL, 'Uma descarga de plasma elétrico de altíssima energia.'),
('electric_13', 'Juízo do Trovão', 3, 4, 'Special', 170, 60, 85, 150, 'paralyze', 1.00, NULL, 'O julgamento dos céus manifestado em um raio destruidor.')
ON CONFLICT (id) DO NOTHING;

-- GRASS (element_id = 4)
INSERT INTO abilities VALUES
('grass_01', 'Folha Afiada', 4, 1, 'Physical', 45, 10, 95, 25, NULL, 0.00, NULL, 'Folhas cortantes lançadas com velocidade e precisão.'),
('grass_02', 'Absorver Vida', 4, 1, 'Special', 30, 10, 100, 25, 'drain', 0.50, NULL, 'Absorve a energia vital do adversário para recuperar vida.'),
('grass_03', 'Esporos Venenosos', 4, 1, 'Status', 0, 10, 85, 30, 'poison', 0.80, NULL, 'Libera esporos tóxicos que envenenam o alvo.'),
('grass_04', 'Chicote Floral', 4, 1, 'Physical', 50, 15, 90, 40, 'def_down', 0.20, NULL, 'Um golpe com galhos floridos que pode reduzir a defesa.'),
('grass_05', 'Tempestade Floral', 4, 2, 'Special', 70, 20, 95, 60, NULL, 0.00, NULL, 'Uma rajada de pétalas afiadas que varre o campo de batalha.'),
('grass_06', 'Raízes Sônicas', 4, 2, 'Physical', 65, 20, 100, 70, 'speed_down', 0.30, NULL, 'Raízes brotam do chão prendendo e desacelerando o inimigo.'),
('grass_07', 'Ramo Explosivo', 4, 2, 'Physical', 75, 25, 90, 80, 'flinch', 0.25, NULL, 'Um golpe brutal de um ramo carregado de energia natural.'),
('grass_08', 'Fotossíntese de Batalha', 4, 2, 'Status', 0, 20, 100, 60, 'heal', 1.00, NULL, 'Usa a energia solar para recuperar parte da própria vida.'),
('grass_09', 'Florescer Selvagem', 4, 3, 'Special', 95, 35, 90, 100, 'poison', 0.25, NULL, 'Uma explosão de energia natural que pode envenenar o alvo.'),
('grass_10', 'Explosão Botânica', 4, 3, 'Special', 105, 35, 85, 120, NULL, 0.00, NULL, 'Uma detonação de energia vegetal de proporções devastadoras.'),
('grass_11', 'Trança de Videiras', 4, 3, 'Physical', 100, 40, 95, 130, 'def_down', 0.30, NULL, 'Videiras gigantes esmagam e enfraquecem as defesas do alvo.'),
('grass_12', 'Maré Verde', 4, 3, 'Special', 115, 40, 90, 140, 'drain', 0.60, NULL, 'Uma onda de energia vital que drena a força do adversário.'),
('grass_13', 'Fúria da Floresta Eterna', 4, 4, 'Special', 165, 55, 85, 150, 'poison', 1.00, NULL, 'O poder irado de uma floresta milenar liberado em um único golpe.')
ON CONFLICT (id) DO NOTHING;

-- ICE (element_id = 5)
INSERT INTO abilities VALUES
('ice_01', 'Rajada Fria', 5, 1, 'Special', 40, 10, 100, 25, 'freeze', 0.10, NULL, 'Uma rajada de ar gelado que pode congelar o alvo.'),
('ice_02', 'Fragmento de Gelo', 5, 1, 'Physical', 45, 10, 95, 25, NULL, 0.00, NULL, 'Fragmentos afiados de gelo lançados contra o adversário.'),
('ice_03', 'Vento Ártico', 5, 1, 'Special', 35, 10, 95, 30, 'speed_down', 0.50, NULL, 'Um vento gelado do ártico que reduz a velocidade do alvo.'),
('ice_04', 'Névoa Glacial', 5, 1, 'Status', 0, 10, 90, 30, 'accuracy_down', 0.70, NULL, 'Uma névoa de gelo que prejudica a visão e precisão do inimigo.'),
('ice_05', 'Avalanche', 5, 2, 'Physical', 70, 20, 90, 60, 'flinch', 0.20, NULL, 'Uma avalanche de blocos de gelo que pode causar tremor.'),
('ice_06', 'Lança de Gelo', 5, 2, 'Special', 75, 20, 95, 70, 'freeze', 0.20, NULL, 'Uma lança afiada formada de gelo puro atirada com força.'),
('ice_07', 'Tempestade de Neve', 5, 2, 'Special', 65, 20, 85, 80, 'freeze', 0.25, NULL, 'Uma tempestade de neve que cobre o campo de batalha.'),
('ice_08', 'Armadura de Gelo', 5, 2, 'Status', 0, 20, 100, 60, 'def_up', 1.00, NULL, 'Cristaliza o próprio corpo em uma armadura de gelo resistente.'),
('ice_09', 'Blizzard Devastadora', 5, 3, 'Special', 100, 35, 80, 100, 'freeze', 0.30, NULL, 'Uma blizzard catastrófica que congela tudo em seu caminho.'),
('ice_10', 'Prisão de Cristal', 5, 3, 'Special', 95, 35, 90, 110, 'freeze', 0.35, NULL, 'Cristais de gelo aprisionam o adversário congelando-o por completo.'),
('ice_11', 'Vendaval Polar', 5, 3, 'Physical', 110, 40, 85, 130, 'speed_down', 0.50, NULL, 'Um vendaval polar de intensidade extrema que retarda o alvo.'),
('ice_12', 'Maelstrom Ártico', 5, 3, 'Special', 115, 40, 85, 140, 'freeze', 0.40, NULL, 'Um redemoinho de gelo e neve de poder devastador.'),
('ice_13', 'Apocalipse Glacial', 5, 4, 'Special', 175, 60, 80, 150, 'freeze', 1.00, NULL, 'Uma era glacial concentrada em um único golpe catastrófico.')
ON CONFLICT (id) DO NOTHING;

-- GROUND (element_id = 6)
INSERT INTO abilities VALUES
('ground_01', 'Arremesso de Pedra', 6, 1, 'Physical', 45, 10, 95, 25, NULL, 0.00, NULL, 'Pedras arrancadas do chão lançadas contra o adversário.'),
('ground_02', 'Tremor Menor', 6, 1, 'Physical', 40, 10, 100, 25, 'flinch', 0.15, NULL, 'Um pequeno tremor de terra que pode fazer o inimigo recuar.'),
('ground_03', 'Areia nos Olhos', 6, 1, 'Status', 0, 10, 90, 25, 'blind', 0.80, NULL, 'Areia lançada nos olhos do adversário cegando-o temporariamente.'),
('ground_04', 'Golpe Telúrico', 6, 1, 'Physical', 50, 15, 90, 40, 'def_down', 0.20, NULL, 'Um golpe que canaliza a força das profundezas da terra.'),
('ground_05', 'Afundamento', 6, 2, 'Physical', 70, 20, 90, 60, 'flinch', 0.25, NULL, 'O chão cede sob o adversário causando dano e tremor.'),
('ground_06', 'Fenda Sísmica', 6, 2, 'Physical', 75, 25, 85, 70, NULL, 0.00, NULL, 'Uma fenda se abre no chão liberando energia sísmica intensa.'),
('ground_07', 'Tempestade de Areia', 6, 2, 'Special', 65, 20, 90, 75, 'blind', 0.40, NULL, 'Uma tempestade de areia que cega e machuca o adversário.'),
('ground_08', 'Fortaleza Rochosa', 6, 2, 'Status', 0, 20, 100, 60, 'def_up', 1.00, NULL, 'Usa a resistência das rochas para elevar drasticamente a defesa.'),
('ground_09', 'Terremoto Devastador', 6, 3, 'Physical', 100, 35, 100, 100, NULL, 0.00, NULL, 'Um terremoto de magnitude devastadora que abala todo o campo.'),
('ground_10', 'Erupção de Lama', 6, 3, 'Special', 95, 35, 90, 110, 'speed_down', 0.40, NULL, 'Uma erupção de lama quente que retarda e queima o adversário.'),
('ground_11', 'Colapso Tectônico', 6, 3, 'Physical', 110, 40, 85, 130, 'flinch', 0.35, NULL, 'O colapso de placas tectônicas concentrado em um único ponto.'),
('ground_12', 'Impacto Sísmico', 6, 3, 'Physical', 120, 40, 90, 140, 'def_down', 0.30, NULL, 'Um impacto de magnitude extrema que racha armaduras e defesas.'),
('ground_13', 'Destruição Continental', 6, 4, 'Physical', 180, 60, 85, 150, 'flinch', 1.00, NULL, 'A força que moldou continentes liberada em um golpe apocalíptico.')
ON CONFLICT (id) DO NOTHING;

-- FIGHTING (element_id = 7)
INSERT INTO abilities VALUES
('fighting_01', 'Soco Direto', 7, 1, 'Physical', 50, 10, 100, 25, NULL, 0.00, NULL, 'Um soco direto e poderoso desferido com técnica precisa.'),
('fighting_02', 'Chute Baixo', 7, 1, 'Physical', 40, 10, 95, 25, 'speed_down', 0.25, NULL, 'Um chute nas pernas do adversário que reduz sua mobilidade.'),
('fighting_03', 'Grito de Guerra', 7, 1, 'Status', 0, 10, 100, 25, 'atk_up', 1.00, NULL, 'Um grito intimidador que eleva o próprio poder de ataque.'),
('fighting_04', 'Jab Relâmpago', 7, 1, 'Physical', 45, 15, 100, 40, 'flinch', 0.15, NULL, 'Uma série de jabs rápidos que podem fazer o inimigo recuar.'),
('fighting_05', 'Arremetida Brutal', 7, 2, 'Physical', 75, 20, 90, 60, 'flinch', 0.25, NULL, 'Uma investida com força bruta que pode derrubar o adversário.'),
('fighting_06', 'Soco do Trovão', 7, 2, 'Physical', 70, 20, 95, 65, NULL, 0.00, NULL, 'Um soco carregado de energia que ecoa como um trovão.'),
('fighting_07', 'Chute Giratório', 7, 2, 'Physical', 65, 20, 90, 70, 'def_down', 0.30, NULL, 'Um chute em rotação que supera as defesas do adversário.'),
('fighting_08', 'Foco Total', 7, 2, 'Status', 0, 20, 100, 60, 'atk_up', 1.00, NULL, 'Concentra toda a energia interna elevando drasticamente o ataque.'),
('fighting_09', 'Golpe Final', 7, 3, 'Physical', 100, 35, 90, 100, 'flinch', 0.40, NULL, 'Um golpe devastador com toda a força acumulada na batalha.'),
('fighting_10', 'Punho do Dragão', 7, 3, 'Physical', 110, 40, 85, 120, NULL, 0.00, NULL, 'Um soco lendário que dizem carregar a força de um dragão.'),
('fighting_11', 'Tempestade de Golpes', 7, 3, 'Physical', 105, 35, 90, 130, 'stun', 0.30, NULL, 'Uma série ininterrupta de golpes poderosos que atordoam o alvo.'),
('fighting_12', 'Rompimento Supremo', 7, 3, 'Physical', 115, 40, 85, 140, 'def_down', 0.40, NULL, 'Um golpe supremo que rompe as mais sólidas defesas.'),
('fighting_13', 'Julgamento do Guerreiro', 7, 4, 'Physical', 180, 60, 90, 150, 'flinch', 1.00, NULL, 'O golpe definitivo de um guerreiro que transcendeu seus limites.')
ON CONFLICT (id) DO NOTHING;

-- STEEL (element_id = 8)
INSERT INTO abilities VALUES
('steel_01', 'Lâmina Metálica', 8, 1, 'Physical', 45, 10, 95, 25, NULL, 0.00, NULL, 'Uma lâmina de metal afiado que corta com precisão cirúrgica.'),
('steel_02', 'Projétil de Aço', 8, 1, 'Physical', 40, 10, 100, 25, 'flinch', 0.15, NULL, 'Projéteis de aço disparados com velocidade e força.'),
('steel_03', 'Polimento de Escudo', 8, 1, 'Status', 0, 10, 100, 25, 'def_up', 1.00, NULL, 'Polimenta a própria armadura aumentando a resistência defensiva.'),
('steel_04', 'Perfuração Metálica', 8, 1, 'Physical', 50, 15, 90, 40, 'def_down', 0.20, NULL, 'Uma perfuração que penetra mesmo as defesas mais sólidas.'),
('steel_05', 'Tempestade de Aço', 8, 2, 'Physical', 70, 20, 90, 60, NULL, 0.00, NULL, 'Uma tempestade de fragmentos metálicos cortantes.'),
('steel_06', 'Golpe Magnético', 8, 2, 'Physical', 65, 20, 95, 65, 'stun', 0.20, NULL, 'Um golpe carregado de energia magnética que pode atordoar.'),
('steel_07', 'Lança de Ferro', 8, 2, 'Special', 75, 25, 90, 80, 'bleed', 0.25, NULL, 'Uma lança de ferro puro arremessada com força devastadora.'),
('steel_08', 'Fortaleza de Titânio', 8, 2, 'Status', 0, 20, 100, 60, 'def_up', 1.00, NULL, 'Transforma o próprio corpo em uma fortaleza de titânio impenetrável.'),
('steel_09', 'Avalanche Metálica', 8, 3, 'Physical', 100, 35, 85, 100, 'flinch', 0.30, NULL, 'Uma avalanche de metal fundido que esmaga tudo em seu caminho.'),
('steel_10', 'Corte Gravitacional', 8, 3, 'Physical', 105, 35, 90, 120, 'bleed', 0.35, NULL, 'Um corte tão poderoso que distorce o espaço ao redor.'),
('steel_11', 'Armadura Omega', 8, 3, 'Status', 0, 35, 100, 120, 'def_up', 1.00, NULL, 'Eleva a própria armadura ao nível máximo de resistência.'),
('steel_12', 'Perfuração Absoluta', 8, 3, 'Physical', 120, 40, 85, 140, 'def_down', 0.40, NULL, 'Uma perfuração que ignora completamente as defesas do adversário.'),
('steel_13', 'Juízo do Aço Eterno', 8, 4, 'Physical', 170, 55, 90, 150, 'bleed', 1.00, NULL, 'O poder do aço eterno manifestado em um golpe que rasga a realidade.')
ON CONFLICT (id) DO NOTHING;

-- POISON (element_id = 9)
INSERT INTO abilities VALUES
('poison_01', 'Cuspe Ácido', 9, 1, 'Special', 40, 10, 100, 25, 'poison', 0.20, NULL, 'Um cuspe de ácido corrosivo que pode envenenar o alvo.'),
('poison_02', 'Aguilhão Venenoso', 9, 1, 'Physical', 45, 10, 95, 25, 'poison', 0.25, NULL, 'Uma picada venenosa que injeta toxinas no adversário.'),
('poison_03', 'Nuvem Tóxica', 9, 1, 'Status', 0, 10, 90, 25, 'poison', 0.80, NULL, 'Uma nuvem de gás tóxico que envenena o adversário.'),
('poison_04', 'Corrosão Ácida', 9, 1, 'Special', 35, 10, 90, 40, 'def_down', 0.40, NULL, 'Ácido corrosivo que destrói a armadura e defesas do alvo.'),
('poison_05', 'Torrente de Veneno', 9, 2, 'Special', 70, 20, 95, 60, 'poison', 0.35, NULL, 'Uma torrente de veneno concentrado lançada contra o adversário.'),
('poison_06', 'Explosão Tóxica', 9, 2, 'Special', 75, 25, 90, 70, 'poison', 0.40, NULL, 'Uma explosão de gás tóxico que contamina a área ao redor.'),
('poison_07', 'Golpe Contaminante', 9, 2, 'Physical', 65, 20, 100, 75, 'poison', 0.30, NULL, 'Um golpe físico que transfere toxinas pelo contato.'),
('poison_08', 'Neblina Paralisante', 9, 2, 'Status', 0, 20, 85, 60, 'paralyze', 0.70, NULL, 'Uma neblina de toxinas que paralisa o sistema nervoso do alvo.'),
('poison_09', 'Dilúvio Venenoso', 9, 3, 'Special', 95, 35, 90, 100, 'poison', 0.50, NULL, 'Uma chuva de veneno puro que cobre completamente o adversário.'),
('poison_10', 'Decomposição Ácida', 9, 3, 'Special', 100, 35, 85, 110, 'def_down', 0.50, NULL, 'Um ácido que decompõe armaduras e carne com igual eficiência.'),
('poison_11', 'Praga Mortal', 9, 3, 'Special', 105, 40, 90, 130, 'curse', 0.30, NULL, 'Uma praga mágica que amaldiçoa o adversário enfraquecendo-o lentamente.'),
('poison_12', 'Nova Tóxica', 9, 3, 'Special', 115, 40, 85, 140, 'poison', 0.60, NULL, 'Uma explosão de veneno tão intensa que contamina o próprio ar.'),
('poison_13', 'Apocalipse Venenoso', 9, 4, 'Special', 165, 55, 85, 150, 'poison', 1.00, NULL, 'O veneno mais letal do mundo concentrado em um único ataque devastador.')
ON CONFLICT (id) DO NOTHING;

-- DARK (element_id = 10)
INSERT INTO abilities VALUES
('dark_01', 'Mordida Sombria', 10, 1, 'Physical', 45, 10, 100, 25, 'flinch', 0.15, NULL, 'Uma mordida sombria que pode assustar o adversário.'),
('dark_02', 'Rasgo das Trevas', 10, 1, 'Physical', 40, 10, 95, 25, NULL, 0.00, NULL, 'Garras das trevas que rasgam o adversário com força sombria.'),
('dark_03', 'Sussurro Sombrio', 10, 1, 'Status', 0, 10, 100, 25, 'fear', 0.80, NULL, 'Sussurros das trevas que instilam medo profundo no adversário.'),
('dark_04', 'Pulso Negro', 10, 1, 'Special', 50, 15, 90, 40, 'confuse', 0.20, NULL, 'Um pulso de energia sombria que pode confundir o adversário.'),
('dark_05', 'Vácuo Sombrio', 10, 2, 'Special', 70, 20, 90, 60, 'confuse', 0.25, NULL, 'Um vácuo de escuridão que absorve a luz e desequilibra o adversário.'),
('dark_06', 'Golpe Traiçoeiro', 10, 2, 'Physical', 75, 20, 95, 70, 'atk_down', 0.30, NULL, 'Um golpe pelas costas que enfraquece o ataque do adversário.'),
('dark_07', 'Maldição Sombria', 10, 2, 'Special', 65, 20, 85, 75, 'curse', 0.40, NULL, 'Uma maldição das trevas que consome lentamente a força vital.'),
('dark_08', 'Véu das Sombras', 10, 2, 'Status', 0, 20, 100, 60, 'evasion_up', 1.00, NULL, 'Um véu de escuridão que aumenta drasticamente a evasão.'),
('dark_09', 'Maré Sombria', 10, 3, 'Special', 95, 35, 90, 100, 'fear', 0.35, NULL, 'Uma onda de escuridão pura que aterroriza o adversário.'),
('dark_10', 'Devorador de Luz', 10, 3, 'Special', 100, 35, 85, 110, 'blind', 0.50, NULL, 'Consome toda a luz ao redor deixando o adversário completamente cego.'),
('dark_11', 'Tempestade das Trevas', 10, 3, 'Special', 110, 40, 85, 130, 'confuse', 0.40, NULL, 'Uma tempestade de energia sombria que perverte a mente inimiga.'),
('dark_12', 'Rasgo Dimensional', 10, 3, 'Physical', 115, 40, 90, 140, 'fear', 0.40, NULL, 'Um golpe que rasga o tecido da realidade causando pavor absoluto.'),
('dark_13', 'Extinção das Estrelas', 10, 4, 'Special', 170, 60, 85, 150, 'fear', 1.00, NULL, 'A escuridão que consome as estrelas condensada em um ataque supremo.')
ON CONFLICT (id) DO NOTHING;

-- GHOST (element_id = 11)
INSERT INTO abilities VALUES
('ghost_01', 'Toque Espectral', 11, 1, 'Special', 40, 10, 100, 25, 'fear', 0.15, NULL, 'Um toque etéreo que drena energia vital e pode causar medo.'),
('ghost_02', 'Chama da Alma', 11, 1, 'Special', 45, 10, 95, 25, 'burn', 0.15, NULL, 'Chamas de origem espiritual que queimam a alma do adversário.'),
('ghost_03', 'Uivo Espectral', 11, 1, 'Status', 0, 10, 90, 25, 'fear', 0.80, NULL, 'Um uivo sobrenatural que paralisa de terror o adversário.'),
('ghost_04', 'Mão Fantasma', 11, 1, 'Physical', 50, 15, 90, 40, 'confuse', 0.20, NULL, 'Uma mão espectral que atravessa defesas físicas e confunde.'),
('ghost_05', 'Bola de Sombra', 11, 2, 'Special', 70, 20, 100, 60, 'def_down', 0.30, NULL, 'Uma bola de energia espectral que pode reduzir a defesa especial.'),
('ghost_06', 'Possessão Parcial', 11, 2, 'Special', 65, 20, 90, 65, 'confuse', 0.40, NULL, 'Uma possessão parcial que confunde completamente o adversário.'),
('ghost_07', 'Garras da Morte', 11, 2, 'Physical', 75, 25, 85, 80, 'curse', 0.30, NULL, 'Garras ectoplásmicas que amaldiçoam o alvo com toque mortal.'),
('ghost_08', 'Véu Etéreo', 11, 2, 'Status', 0, 20, 100, 60, 'evasion_up', 1.00, NULL, 'Um véu espiritual que torna o usuário quase impossível de atingir.'),
('ghost_09', 'Explosão Espectral', 11, 3, 'Special', 100, 35, 90, 100, 'fear', 0.40, NULL, 'Uma explosão de energia etérea que aterroriza o adversário.'),
('ghost_10', 'Maldição Ancestral', 11, 3, 'Special', 95, 35, 85, 110, 'curse', 0.50, NULL, 'Uma maldição de espíritos ancestrais de efeito devastador.'),
('ghost_11', 'Noite dos Mortos', 11, 3, 'Special', 105, 40, 90, 130, 'sleep', 0.30, NULL, 'Invoca a energia dos mortos que faz o adversário cair em sono profundo.'),
('ghost_12', 'Rasgo da Alma', 11, 3, 'Physical', 115, 40, 85, 140, 'drain', 0.50, NULL, 'Um ataque que rasga a própria alma do adversário drenando sua força.'),
('ghost_13', 'Apocalipse Espiritual', 11, 4, 'Special', 165, 55, 85, 150, 'curse', 1.00, NULL, 'O despertar de todos os espíritos do além manifestado em um único golpe.')
ON CONFLICT (id) DO NOTHING;

-- FLYING (element_id = 12)
INSERT INTO abilities VALUES
('flying_01', 'Rajada de Vento', 12, 1, 'Special', 40, 10, 100, 25, 'speed_down', 0.20, NULL, 'Uma rajada de vento cortante que pode reduzir a velocidade do alvo.'),
('flying_02', 'Bicada Afiada', 12, 1, 'Physical', 45, 10, 95, 25, 'bleed', 0.15, NULL, 'Uma bicada precisa que pode causar ferimento no adversário.'),
('flying_03', 'Dança do Vento', 12, 1, 'Status', 0, 10, 100, 25, 'speed_up', 1.00, NULL, 'Uma dança com as correntes de ar que eleva drasticamente a velocidade.'),
('flying_04', 'Giro Aéreo', 12, 1, 'Physical', 50, 15, 90, 40, 'confuse', 0.20, NULL, 'Um giro veloz nas alturas que desequilibra e confunde o adversário.'),
('flying_05', 'Tempestade de Penas', 12, 2, 'Physical', 65, 20, 90, 60, 'bleed', 0.25, NULL, 'Uma tempestade de penas afiadas que corta o adversário.'),
('flying_06', 'Mergulho Rasante', 12, 2, 'Physical', 75, 20, 95, 70, 'flinch', 0.25, NULL, 'Um mergulho em alta velocidade que pode fazer o alvo recuar.'),
('flying_07', 'Turbilhão Aéreo', 12, 2, 'Special', 70, 25, 90, 80, 'confuse', 0.30, NULL, 'Um turbilhão de energia aérea que desequilibra o adversário.'),
('flying_08', 'Corrente Ascendente', 12, 2, 'Status', 0, 20, 100, 60, 'evasion_up', 1.00, NULL, 'Monta em correntes ascendentes tornando-se difícil de atingir.'),
('flying_09', 'Furacão', 12, 3, 'Special', 100, 35, 85, 100, 'confuse', 0.30, NULL, 'Um furacão devastador que destrói tudo em seu caminho.'),
('flying_10', 'Voo Supersônico', 12, 3, 'Physical', 105, 35, 90, 120, 'flinch', 0.40, NULL, 'Um voo em velocidade supersônica que cria uma onda de choque.'),
('flying_11', 'Corte do Horizonte', 12, 3, 'Physical', 110, 40, 90, 130, 'bleed', 0.35, NULL, 'Um golpe aéreo que corta do horizonte até o adversário.'),
('flying_12', 'Tempestade Celestial', 12, 3, 'Special', 115, 40, 85, 140, 'speed_down', 0.50, NULL, 'Uma tempestade dos céus de magnitude catastrófica.'),
('flying_13', 'Fúria do Céu Eterno', 12, 4, 'Special', 160, 55, 90, 150, 'speed_up', 1.00, NULL, 'O poder irrestrito dos céus eternos manifestado em um golpe supremo.')
ON CONFLICT (id) DO NOTHING;
