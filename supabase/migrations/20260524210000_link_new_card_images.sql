-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: Liga as 30 cartas novas às imagens em public/images/Itens/
--
-- IMPORTANTE: rodar SOMENTE depois que o usuário tiver colocado os 30 jpgs
-- na pasta public/images/Itens/ com os nomes exatos abaixo. Caso contrário
-- as cartas vão exibir 404 e cair pro fallback gráfico (que já funciona).
-- ═══════════════════════════════════════════════════════════════════════════

-- Atualiza image_url pra cada uma das 30 cartas via ability_key.
-- Convenção: /images/Itens/{Nome}.jpg
UPDATE public.shop_items
SET image_url = CASE ability_key
  -- ??? (3)
  WHEN 'coordenadas-titan_unique'           THEN '/images/Itens/Coordenadas do Titã Fundador.jpg'
  WHEN 'time-leap_unique'                   THEN '/images/Itens/Time Leap.jpg'
  WHEN '100-percent-mode_unique'            THEN '/images/Itens/Modo 100%.jpg'
  -- MÍTICA (5)
  WHEN 'kyoka-suigetsu_unique'              THEN '/images/Itens/Kyoka Suigetsu.jpg'
  WHEN 'conquerors-haki_unique'             THEN '/images/Itens/Haki do Rei Conquistador.jpg'
  WHEN 'six-paths-mode_unique'              THEN '/images/Itens/Modo Sábio dos Seis Caminhos.jpg'
  WHEN 'kagune-liberated_unique'            THEN '/images/Itens/Kagune Liberado.jpg'
  WHEN 'devil-contract_unique'              THEN '/images/Itens/Contrato com o Diabo.jpg'
  -- LENDÁRIA (7)
  WHEN 'edo-tensei_unique'                  THEN '/images/Itens/Edo Tensei.jpg'
  WHEN 'bungee-gum_unique'                  THEN '/images/Itens/Bungee Gum.jpg'
  WHEN 'beast-spirit_unique'                THEN '/images/Itens/Espírito da Besta.jpg'
  WHEN 'black-whip_unique'                  THEN '/images/Itens/Black Whip.jpg'
  WHEN 'gae-bolg_unique'                    THEN '/images/Itens/Gáe Bolg.jpg'
  WHEN 'big-bang-attack_unique'             THEN '/images/Itens/Big Bang Attack.jpg'
  WHEN 'cage-of-thorns_unique'              THEN '/images/Itens/Jaula de Espinhos.jpg'
  -- ÉPICA (10)
  WHEN 'soul-switch_unique'                 THEN '/images/Itens/Soul Switch.jpg'
  WHEN 'devils-bargain_unique'              THEN '/images/Itens/Pacto Demoníaco.jpg'
  WHEN 'roswaals-spell_unique'              THEN '/images/Itens/Magia de Roswaal.jpg'
  WHEN 'decay-touch_unique'                 THEN '/images/Itens/Toque de Decadência.jpg'
  WHEN 'hellfire_unique'                    THEN '/images/Itens/Fogo Infernal.jpg'
  WHEN 'ope-ope-room_unique'                THEN '/images/Itens/Ope Ope no Mi (ROOM).jpg'
  WHEN 'conqueror-strike_unique'            THEN '/images/Itens/Golpe Conquistador.jpg'
  WHEN 'founding-titan-roar_unique'         THEN '/images/Itens/Rugido do Titã Fundador.jpg'
  WHEN 'coffin-of-stars_unique'             THEN '/images/Itens/Caixão das Estrelas.jpg'
  WHEN 'iron-fist-vinland_unique'           THEN '/images/Itens/Punho de Ferro.jpg'
  -- RARA (5)
  WHEN 'hydration-field_unique'             THEN '/images/Itens/Campo de Hidratação.jpg'
  WHEN 'light-step_unique'                  THEN '/images/Itens/Passo Leve.jpg'
  WHEN 'stone-skin_unique'                  THEN '/images/Itens/Pele de Pedra.jpg'
  WHEN 'spectral-mark_unique'               THEN '/images/Itens/Marca Espectral.jpg'
  WHEN 'mana-surge_unique'                  THEN '/images/Itens/Surto de Mana.jpg'
  ELSE image_url
END
WHERE ability_key IN (
  'coordenadas-titan_unique','time-leap_unique','100-percent-mode_unique',
  'kyoka-suigetsu_unique','conquerors-haki_unique','six-paths-mode_unique',
  'kagune-liberated_unique','devil-contract_unique',
  'edo-tensei_unique','bungee-gum_unique','beast-spirit_unique','black-whip_unique',
  'gae-bolg_unique','big-bang-attack_unique','cage-of-thorns_unique',
  'soul-switch_unique','devils-bargain_unique','roswaals-spell_unique',
  'decay-touch_unique','hellfire_unique','ope-ope-room_unique',
  'conqueror-strike_unique','founding-titan-roar_unique','coffin-of-stars_unique',
  'iron-fist-vinland_unique',
  'hydration-field_unique','light-step_unique','stone-skin_unique',
  'spectral-mark_unique','mana-surge_unique'
);

NOTIFY pgrst, 'reload schema';
