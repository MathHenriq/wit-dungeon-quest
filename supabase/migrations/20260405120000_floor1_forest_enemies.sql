-- ============================================================
-- ANDAR 1 — FLORESTA INICIAL: atualiza tema e inimigos
-- Layout horizontal (esq→dir), 6 inimigos + 1 boss
-- ============================================================

-- Atualiza tema do andar 1 para "forest" (usado pelo FloorMap/FloorSelect)
UPDATE floors
SET theme = 'forest'
WHERE id = 1;

-- Remove inimigos antigos sem posições definidas
DELETE FROM enemies WHERE floor_id = 1;

-- ─── Inimigos regulares ───────────────────────────────────────

-- 1. Lobo Cinzento (pos esquerda, linha do meio)
INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, position_x, position_y, icon_type,
                     lore)
VALUES (gen_random_uuid(), 1, 'Lobo Cinzento', 2, FALSE, 85, 6, 4, 12,
        'flying', 'flying_01', 'flying_02', 22, 50, 'wolf',
        'Um lobo ágil que patrulha a entrada da floresta. Seus ataques são rápidos mas previsíveis.');

-- 2. Aranha Venenosa (pos centro-esquerda, topo)
INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, position_x, position_y, icon_type,
                     lore)
VALUES (gen_random_uuid(), 1, 'Aranha Venenosa', 2, FALSE, 75, 5, 7, 10,
        'poison', 'poison_01', 'poison_03', 34, 22, 'spider',
        'Uma aranha que tece emboscadas nas copas das árvores. Seu veneno é lento mas debilitante.');

-- 3. Morcego Sombrio (pos centro-esquerda, baixo)
INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type,
                     lore)
VALUES (gen_random_uuid(), 1, 'Morcego Sombrio', 3, FALSE, 110, 7, 8, 15,
        'flying', 'flying_01', 'flying_02', 'flying_03', 34, 78, 'bat',
        'Morcego que habita as cavernas ao sul da floresta. Extremamente veloz em ambientes escuros.');

-- 4. Golem de Rocha (pos centro, linha do meio)
INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type,
                     lore)
VALUES (gen_random_uuid(), 1, 'Golem de Rocha', 3, FALSE, 145, 18, 5, 6,
        'ground', 'ground_01', 'ground_02', 'ground_08', 52, 50, 'shield',
        'Um antigo construto de pedra que protege o coração da floresta. Lento, mas praticamente impenetrável.');

-- 5. Treant Ancião (pos centro-direita, topo)
INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type,
                     lore)
VALUES (gen_random_uuid(), 1, 'Treant Ancião', 4, FALSE, 165, 13, 15, 8,
        'grass', 'grass_04', 'grass_05', 'grass_08', 64, 22, 'tree',
        'Uma árvore milenar que ganhou consciência. Seus galhos atingem com força esmagadora e absorve vida dos inimigos.');

-- 6. Cobra Venenosa (pos centro-direita, baixo)
INSERT INTO enemies (id, floor_id, name, level, is_boss, hp_max, def_fisica, def_magica, velocidade,
                     element_type, ability_1, ability_2, ability_3, position_x, position_y, icon_type,
                     lore)
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
