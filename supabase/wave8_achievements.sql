-- WAVE 8: Achievements

CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) CHECK (category IN ('battle', 'progression', 'collection', 'pvp', 'special')),
  icon_url TEXT,
  requirement_type VARCHAR(30),
  requirement_value INTEGER,
  reward_coins INTEGER DEFAULT 0,
  reward_diamonds INTEGER DEFAULT 0,
  is_secret BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS character_achievements (
  character_id UUID REFERENCES characters(id),
  achievement_id VARCHAR(30) REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  PRIMARY KEY (character_id, achievement_id)
);

INSERT INTO achievements VALUES
('first_victory',      'Primeira Vitória',          'Vença sua primeira batalha',                   'battle',      '/achievements/first_win.png',    'wins',             1,    50,   0,  false),
('win_10',             'Guerreiro Iniciante',        'Vença 10 batalhas',                            'battle',      '/achievements/win_10.png',       'wins',             10,   100,  0,  false),
('win_50',             'Guerreiro Veterano',         'Vença 50 batalhas',                            'battle',      '/achievements/win_50.png',       'wins',             50,   500,  5,  false),
('win_100',            'Lenda de Batalha',           'Vença 100 batalhas',                           'battle',      '/achievements/win_100.png',      'wins',             100,  1000, 10, false),
('first_boss',         'Caçador de Chefes',          'Derrote seu primeiro boss',                    'battle',      '/achievements/first_boss.png',   'boss_wins',        1,    100,  1,  false),
('perfect_victory',    'Vitória Perfeita',           'Vença uma batalha sem levar dano',             'battle',      '/achievements/perfect.png',      'perfect_wins',     1,    200,  2,  false),
('level_10',           'Aprendiz Avançado',          'Alcance o level 10',                           'progression', '/achievements/lv10.png',         'level',            10,   100,  0,  false),
('level_25',           'Mestre em Treinamento',      'Alcance o level 25',                           'progression', '/achievements/lv25.png',         'level',            25,   300,  3,  false),
('level_50',           'Grande Mestre',              'Alcance o level 50',                           'progression', '/achievements/lv50.png',         'level',            50,   1000, 10, false),
('level_100',          'Lenda Viva',                 'Alcance o level 100',                          'progression', '/achievements/lv100.png',        'level',            100,  5000, 50, false),
('unlock_10_abilities','Colecionador Iniciante',     'Desbloqueie 10 habilidades',                   'collection',  '/achievements/abilities_10.png', 'abilities_unlocked',10,   50,   0,  false),
('unlock_50_abilities','Mestre das Habilidades',     'Desbloqueie 50 habilidades',                   'collection',  '/achievements/abilities_50.png', 'abilities_unlocked',50,   300,  5,  false),
('master_element',     'Especialista Elemental',     'Alcance 60 pontos em um elemento',             'collection',  '/achievements/element_master.png','element_points',   60,   200,  3,  false),
('first_pvp',          'Primeira Batalha PvP',       'Participe de uma batalha PvP',                 'pvp',         '/achievements/first_pvp.png',    'pvp_matches',      1,    100,  1,  false),
('pvp_win_10',         'Gladiador',                  'Vença 10 batalhas PvP',                        'pvp',         '/achievements/pvp_10.png',       'pvp_wins',         10,   300,  3,  false),
('rating_1500',        'Campeão da Arena',           'Alcance 1500 de rating PvP',                   'pvp',         '/achievements/rating_high.png',  'pvp_rating',       1500, 500,  10, false),
('use_all_elements',   'Mestre dos Elementos',       'Use habilidades de todos os 12 elementos',     'special',     '/achievements/all_elements.png', 'elements_used',    12,   1000, 20, true),
('speed_run',          'Raio Veloz',                 'Vença uma batalha em menos de 1 minuto',       'special',     '/achievements/speedrun.png',     'fast_wins',        1,    300,  5,  true)
ON CONFLICT (id) DO NOTHING;

SELECT
  (SELECT count(*) FROM achievements)             AS total_achievements,
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'character_achievements')    AS table_created;
