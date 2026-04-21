-- ============================================================
-- SEED FLOOR 1 — FLORESTA INICIAL
-- Migration: 20260409130000_seed_floor1.sql
--
-- Floor 1 was inserted manually and lost on DB reset.
-- This migration ensures floor 1 always exists.
-- ============================================================

-- Insert floor 1 if it doesn't exist
-- Using id=1 with SERIAL override via sequence reset trick:
-- We INSERT with explicit id to guarantee id=1.
INSERT INTO floors (id, floor_number, name, theme, level_min, level_max, lore)
VALUES (
  1,
  1,
  'Floresta Inicial',
  'forest',
  1,
  5,
  'Uma floresta densa que envolve o portal de entrada da masmorra. Criaturas selvagens guardam os segredos destas matas ancestrais.'
)
ON CONFLICT (id) DO UPDATE
  SET theme     = EXCLUDED.theme,
      name      = EXCLUDED.name,
      level_min = EXCLUDED.level_min,
      level_max = EXCLUDED.level_max,
      lore      = EXCLUDED.lore;

-- Sync the sequence so future INSERTs don't collide with id=1
SELECT setval(pg_get_serial_sequence('floors', 'id'), GREATEST(1, (SELECT MAX(id) FROM floors)));

-- Remove old enemies for floor 1 and re-insert clean set
DELETE FROM enemies WHERE floor_id = 1;

-- ─── Inimigos regulares ───────────────────────────────────────

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, position_x, position_y, icon_type, lore)
VALUES (gen_random_uuid(), 1, 'Lobo Cinzento', 2, FALSE, 85, 6, 4, 12,
        'flying', 'flying_01', 'flying_02', 22, 50, 'wolf',
        'Um lobo ágil que patrulha a entrada da floresta. Seus ataques são rápidos mas previsíveis.');

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, position_x, position_y, icon_type, lore)
VALUES (gen_random_uuid(), 1, 'Aranha Venenosa', 2, FALSE, 75, 5, 7, 10,
        'poison', 'poison_01', 'poison_03', 34, 22, 'spider',
        'Uma aranha que tece emboscadas nas copas das árvores. Seu veneno é lento mas debilitante.');

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type, lore)
VALUES (gen_random_uuid(), 1, 'Morcego Sombrio', 3, FALSE, 110, 7, 8, 15,
        'flying', 'flying_01', 'flying_02', 'flying_03', 34, 78, 'bat',
        'Morcego que habita as cavernas ao sul da floresta. Extremamente veloz em ambientes escuros.');

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type, lore)
VALUES (gen_random_uuid(), 1, 'Golem de Rocha', 3, FALSE, 145, 18, 5, 6,
        'ground', 'ground_01', 'ground_02', 'ground_08', 52, 50, 'shield',
        'Um antigo construto de pedra que protege o coração da floresta. Lento, mas praticamente impenetrável.');

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type, lore)
VALUES (gen_random_uuid(), 1, 'Treant Ancião', 4, FALSE, 165, 13, 15, 8,
        'grass', 'grass_04', 'grass_05', 'grass_08', 64, 22, 'tree',
        'Uma árvore milenar que ganhou consciência. Seus galhos atingem com força esmagadora e absorve vida dos inimigos.');

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type, lore)
VALUES (gen_random_uuid(), 1, 'Cobra Venenosa', 4, FALSE, 130, 8, 13, 14,
        'poison', 'poison_02', 'poison_05', 'poison_08', 64, 78, 'skull',
        'Uma serpente gigante cujo veneno paralisa o sistema nervoso em segundos. Abordá-la de frente é suicídio.');

-- ─── Boss ─────────────────────────────────────────────────────

INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, ability_3, ability_4,
                     special_ability_name, special_ability_effect, special_trigger,
                     position_x, position_y, icon_type, lore)
VALUES (gen_random_uuid(), 1, 'Guardião da Floresta', 5, TRUE, 340, 20, 22, 10,
        'grass', 'grass_05', 'grass_08', 'grass_09', 'grass_12',
        'Fúria Primordial',
        'Quando abaixo de 30% de HP, o Guardião libera uma rajada de espinhos que envenena e causa dano massivo.',
        'hp_below_30',
        78, 50, 'crown',
        'O espírito ancestral da floresta encarnado em forma colossal. Protege estes bosques há milênios e não tolerará invasores.');
