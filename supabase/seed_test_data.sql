-- ============================================================
-- SEED: Dados de Teste — Personagem, Habilidades e Andar
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. PERSONAGEM DE TESTE (level 10, pontos distribuídos)
-- Usa DO $$ para capturar o UUID gerado
DO $$
DECLARE
  char_id UUID;
  floor_id INTEGER;
  enemy_id UUID;
BEGIN

  INSERT INTO characters (
    name, class, level, xp,
    hp_current, hp_max, energy_max,
    forca, inteligencia, destreza, carisma, agilidade, resistencia,
    pts_fire, pts_electric, pts_water,
    free_points
  ) VALUES (
    'Ignar', 'Mago do Fogo', 10, 4500,
    320, 320, 130,
    12, 22, 15, 10, 14, 18,
    8, 4, 3,
    5
  )
  RETURNING id INTO char_id;

  RAISE NOTICE 'Personagem criado: %', char_id;

  -- 2. HABILIDADES EQUIPADAS (slots 1–4)
  -- fire_05 = Lança-Chamas (Tier 2, req 60pts → ajustado para teste)
  -- Usamos habilidades Tier 1 e 2 compatíveis com level 10

  INSERT INTO character_abilities (character_id, ability_id, slot) VALUES
    (char_id, 'fire_04', 1),       -- Chama Giratória  (Tier 1)
    (char_id, 'fire_05', 2),       -- Lança-Chamas     (Tier 2)
    (char_id, 'electric_01', 3),   -- Faísca           (Tier 1)
    (char_id, 'water_01', 4);      -- Jato d'Água      (Tier 1)

  RAISE NOTICE 'Habilidades equipadas para personagem %', char_id;

  -- 3. ANDAR DE TESTE (Andar 1 — sem IA, criado manualmente)
  INSERT INTO floors (
    floor_number, name, theme, level_min, level_max, lore
  ) VALUES (
    1,
    'Caverna das Brasas',
    'Uma caverna vulcânica com paredes que irradiam calor. O chão racha e expele vapor.',
    1, 15,
    'Os primeiros aventureiros que entraram relataram sentir o cheiro de enxofre e ouvir ruídos estranhos nas profundezas.'
  )
  ON CONFLICT (floor_number) DO UPDATE
    SET name = EXCLUDED.name,
        theme = EXCLUDED.theme,
        level_min = EXCLUDED.level_min,
        level_max = EXCLUDED.level_max,
        lore = EXCLUDED.lore
  RETURNING id INTO floor_id;

  RAISE NOTICE 'Andar criado: floor_id = %', floor_id;

  -- 4. INIMIGO SIMPLES no Andar 1
  INSERT INTO enemies (
    floor_id, name, level, is_boss, lore,
    hp_max, def_fisica, def_magica, velocidade,
    element_type,
    ability_1, ability_2
  ) VALUES (
    floor_id,
    'Salamandra das Cinzas', 5, FALSE,
    'Uma lagartixa de fogo que habita as frestas da caverna. Pequena, mas incandescente.',
    120, 8, 5, 12,
    'Fire',
    'fire_01', 'fire_03'   -- Brasa + Cinzas
  );

  RAISE NOTICE 'Inimigo criado no andar %', floor_id;

  -- 5. BOSS do Andar 1
  INSERT INTO enemies (
    floor_id, name, level, is_boss, lore,
    hp_max, def_fisica, def_magica, velocidade,
    element_type,
    ability_1, ability_2, ability_3,
    special_ability_name, special_ability_effect, special_trigger
  ) VALUES (
    floor_id,
    'Ignikar, o Guardião da Brasa', 10, TRUE,
    'Um dragão de pedra que despertou depois de séculos. Suas escamas estão fundidas com lava solidificada.',
    420, 18, 12, 8,
    'Fire',
    'fire_05', 'fire_07', 'fire_03',    -- Lança-Chamas + Explosão de Calor + Cinzas
    'Erupção Final',
    'Causa 80% do HP máximo do alvo como dano de fogo. Só ativa uma vez por batalha.',
    'hp_below_30_percent'
  );

  RAISE NOTICE 'Boss criado no andar %', floor_id;

END $$;

-- Verificação final
SELECT 'PERSONAGENS' AS tabela, count(*) AS total FROM characters
UNION ALL
SELECT 'HABILIDADES_EQUIPADAS', count(*) FROM character_abilities
UNION ALL
SELECT 'ANDARES', count(*) FROM floors
UNION ALL
SELECT 'INIMIGOS', count(*) FROM enemies;
