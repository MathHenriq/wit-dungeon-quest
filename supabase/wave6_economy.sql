-- WAVE 6: Items, Inventory, Loot, Battle History

CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  type VARCHAR(20) CHECK (type IN ('potion_hp', 'potion_energy', 'revive', 'buff', 'material')),
  effect_type VARCHAR(20),
  effect_value INTEGER,
  rarity VARCHAR(10) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  icon_url TEXT,
  shop_price_coins INTEGER,
  shop_price_diamonds INTEGER
);

CREATE TABLE IF NOT EXISTS character_inventory (
  character_id UUID REFERENCES characters(id),
  item_id VARCHAR(20) REFERENCES items(id),
  quantity INTEGER DEFAULT 0,
  PRIMARY KEY (character_id, item_id)
);

CREATE TABLE IF NOT EXISTS loot_tables (
  id SERIAL PRIMARY KEY,
  floor_id INTEGER REFERENCES floors(id),
  is_boss BOOLEAN DEFAULT FALSE,
  item_id VARCHAR(20) REFERENCES items(id),
  drop_chance DECIMAL(3,2) CHECK (drop_chance BETWEEN 0 AND 1),
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS battle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id),
  enemy_name VARCHAR(100),
  enemy_level INTEGER,
  is_boss BOOLEAN DEFAULT FALSE,
  result VARCHAR(10) CHECK (result IN ('victory', 'defeat', 'flee')),
  xp_gained INTEGER,
  coins_gained INTEGER,
  diamonds_gained INTEGER,
  items_dropped JSONB,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO items VALUES
('hp_potion_small',    'Poção de HP Pequena',        'Restaura 50 HP',            'potion_hp',     'heal',       50,   'common',   '/items/hp_small.png',      20,   NULL),
('hp_potion_medium',   'Poção de HP Média',           'Restaura 150 HP',           'potion_hp',     'heal',       150,  'uncommon', '/items/hp_medium.png',     60,   NULL),
('hp_potion_large',    'Poção de HP Grande',          'Restaura 300 HP',           'potion_hp',     'heal',       300,  'rare',     '/items/hp_large.png',      150,  NULL),
('hp_potion_full',     'Poção de HP Completa',        'Restaura HP ao máximo',     'potion_hp',     'heal',       9999, 'epic',     '/items/hp_full.png',       NULL, 5),
('energy_potion_small','Poção de Energia Pequena',    'Restaura 20 energia',       'potion_energy', 'energy',     20,   'common',   '/items/energy_small.png',  15,   NULL),
('energy_potion_medium','Poção de Energia Média',     'Restaura 50 energia',       'potion_energy', 'energy',     50,   'uncommon', '/items/energy_medium.png', 40,   NULL),
('energy_potion_full', 'Poção de Energia Completa',   'Restaura energia ao máximo','potion_energy', 'energy',     9999, 'rare',     '/items/energy_full.png',   100,  NULL),
('revive',             'Reviver',                     'Ressuscita com 50% HP',     'revive',        'revive',     50,   'rare',     '/items/revive.png',        NULL, 10),
('buff_attack',        'Elixir de Força',             'Aumenta ataque 50% / 3t',   'buff',          'attack_up',  50,   'uncommon', '/items/buff_attack.png',   80,   NULL),
('buff_defense',       'Elixir de Resistência',       'Aumenta defesa 50% / 3t',   'buff',          'defense_up', 50,   'uncommon', '/items/buff_defense.png',  80,   NULL),
('buff_speed',         'Elixir de Agilidade',         'Aumenta velocidade 50% / 3t','buff',         'speed_up',   50,   'uncommon', '/items/buff_speed.png',    80,   NULL)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION add_item_to_inventory(
  p_character_id UUID,
  p_item_id VARCHAR(20),
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO character_inventory (character_id, item_id, quantity)
  VALUES (p_character_id, p_item_id, p_quantity)
  ON CONFLICT (character_id, item_id)
  DO UPDATE SET quantity = character_inventory.quantity + p_quantity;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS diamonds INTEGER DEFAULT 0;

-- Verificação
SELECT
  (SELECT count(*) FROM items)           AS total_items,
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('character_inventory','loot_tables','battle_history')) AS new_tables,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'characters'
    AND column_name IN ('coins','diamonds'))  AS new_columns_characters;
