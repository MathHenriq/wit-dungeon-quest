-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: 30 cartas NOVAS (IPs diversas: Naruto, OP, MHA, JJK, AoT, etc)
--
-- Distribuição:
--   ??? (3)       — só via baú Mítico (não aparece na loja)
--   Mítica (5)    — só via baú Mítico
--   Lendária (7)  — vende na loja por 4000 coins / 350 diamonds
--   Épica (10)    — vende na loja por 1500 coins / 100 diamonds
--   Rara (5)      — vende na loja por 600 coins / 30 diamonds
--
-- Cada carta tem ability_key pareado com o handler em equipmentAbilityRegistry.ts
-- (PRs anteriores adicionaram os 30 handlers correspondentes).
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.shop_items
  (name, description, cost, diamond_cost, item_type, category, rarity,
   ability_mode, ability_key, ability_name, ability_description,
   attr_forca, attr_destreza, attr_inteligencia, attr_carisma, attr_agilidade, attr_resistencia,
   is_active, source_anime, teacher_id)
VALUES
  -- ??? (3)
  ('Coordenadas do Titã Fundador', 'O poder de Eren Yeager — controle absoluto sobre todos os titãs em existência.',
   10000, 500, 'weapon', 'armamento', 'unknown',
   'unique', 'coordenadas-titan_unique', 'Coordenadas do Titã Fundador',
   'Inimigo perde 4 turnos + por 3 ataques sofridos, contra-ataque 100% true damage. Plus dano inicial 40% HP máx. Todos os titãs respondem ao grito.',
   0, 0, 10, 0, 0, 8, true, 'Attack on Titan', NULL),

  ('Time Leap', 'A capacidade de Okabe de pular entre World Lines — reescrever o passado.',
   10000, 500, 'weapon', 'armamento', 'unknown',
   'unique', 'time-leap_unique', 'Time Leap (World Line Jump)',
   'REWIND completo do turno anterior — HP/status de ambos voltam. Plus marca próxima ability como Requiem (×2). El Psy Kongroo.',
   0, 0, 12, 0, 6, 0, true, 'Steins;Gate', NULL),

  ('Modo 100%', 'Quando Mob libera tudo de uma vez — a explosão de poder reprimido.',
   10000, 500, 'weapon', 'habilidade', 'unknown',
   'unique', '100-percent-mode_unique', '100% Mode (Mob Explosion)',
   'Dano = HP perdido × 3 + 50. Reseta seu HP a 50% + remove todos debuffs. "Você quer parar? ...100%."',
   0, 0, 15, 0, 0, 5, true, 'Mob Psycho 100', NULL),

  -- MÍTICA (5)
  ('Kyoka Suigetsu', 'A Zanpakuto de Sosuke Aizen — hipnose absoluta de quem ver o Shikai.',
   8000, 400, 'weapon', 'armamento', 'mythic',
   'unique', 'kyoka-suigetsu_unique', 'Kyoka Suigetsu (Aizen)',
   'Por 4 turnos, 95% dos ataques inimigos falham + você esquiva tudo. "A partir do momento que viu meu Shikai..."',
   0, 5, 8, 4, 4, 0, true, 'Bleach', NULL),

  ('Haki do Rei Conquistador', 'A pressão suprema de Luffy — fracos desmaiam só de senti-la.',
   8000, 400, 'weapon', 'habilidade', 'mythic',
   'unique', 'conquerors-haki_unique', 'Haki do Rei Conquistador',
   'Atordoa 2 turnos + APAGA 2 abilities aleatórias do inimigo permanentemente + dano inicial 25% HP máx + 30.',
   8, 0, 4, 6, 0, 4, true, 'One Piece', NULL),

  ('Modo Sábio dos Seis Caminhos', 'Naruto canaliza chakra de Kurama e Hagoromo — o ápice do shinobi.',
   8000, 400, 'weapon', 'armadura', 'mythic',
   'unique', 'six-paths-mode_unique', 'Modo Sábio dos Seis Caminhos',
   'Cura 30% HP + por 5 turnos: dano ×1,8 + lifesteal 40% + aura permanente. Chakra puro.',
   6, 0, 8, 0, 4, 6, true, 'Naruto', NULL),

  ('Kagune Liberado', 'Quando Kaneki Ken aceita o ghoul dentro de si — apêndices de violência pura.',
   8000, 400, 'weapon', 'armamento', 'mythic',
   'unique', 'kagune-liberated_unique', 'Kagune Liberado (Ghoul Form)',
   '4 cortes (40% HP máx total) + 4 sangramentos independentes 10/turno por 5 turnos + próximos 5 ataques ×1,5. "1000-7?"',
   10, 4, 0, 0, 4, 0, true, 'Tokyo Ghoul', NULL),

  ('Contrato com o Diabo', 'Denji ativa Pochita — a fusão demoníaca que paga em sangue.',
   8000, 400, 'weapon', 'habilidade', 'mythic',
   'unique', 'devil-contract_unique', 'Contrato com o Diabo (Chainsaw)',
   'Sacrifica 50% HP atual; dano direto = HP sacrificado × 4. High risk, high return. "Apenas amasse meus seios..."',
   12, 0, 0, 0, 0, 0, true, 'Chainsaw Man', NULL),

  -- LENDÁRIA (7)
  ('Edo Tensei', 'A técnica proibida de Orochimaru — invoca almas mortas em corpos imortais.',
   4000, 350, 'weapon', 'habilidade', 'legendary',
   'unique', 'edo-tensei_unique', 'Edo Tensei (Reanimação)',
   'Invoca espectro companion que ataca 28 HP/turno por 6 turnos. Plus dano inicial 40. Imortalidade emprestada.',
   4, 0, 6, 0, 0, 4, true, 'Naruto', NULL),

  ('Bungee Gum', 'A Nen elastico-pegajoso de Hisoka — a borracha que aprisiona.',
   4000, 350, 'weapon', 'armamento', 'legendary',
   'unique', 'bungee-gum_unique', 'Bungee Gum (Hisoka)',
   'Aplica VULNERÁVEL no inimigo: ×2 dano em todos os hits que receber por 4 turnos + dano inicial 60.',
   6, 4, 0, 4, 0, 0, true, 'Hunter x Hunter', NULL),

  ('Espírito da Besta', 'A Respiração da Besta de Inosuke — instinto puro e crítico devastador.',
   4000, 350, 'weapon', 'armamento', 'legendary',
   'unique', 'beast-spirit_unique', 'Espírito da Besta (Inosuke)',
   '70 de dano + próximos 4 ataques físicos ×1,8 com chance ALTA de crítico. Respiração da Besta!',
   8, 4, 0, 0, 4, 0, true, 'Demon Slayer', NULL),

  ('Black Whip', 'O segundo Quirk de Izuku — chicotes pretos de energia gravitacional.',
   4000, 350, 'weapon', 'armamento', 'legendary',
   'unique', 'black-whip_unique', 'Black Whip (Izuku)',
   '3 chicotes de 35 cada (105 total) + defesa do inimigo −30 PERMANENTE nesta batalha. Multi-uso amortizado.',
   6, 4, 0, 0, 0, 4, true, 'My Hero Academia', NULL),

  ('Gáe Bolg', 'A lança de Cu Chulainn — reverte a causalidade: encontra o coração antes de ser jogada.',
   4000, 350, 'weapon', 'armamento', 'legendary',
   'unique', 'gae-bolg_unique', 'Gáe Bolg (Lança da Causalidade)',
   '30% do HP MÁXIMO do inimigo + 25 em TRUE DAMAGE com ACERTO GARANTIDO. Reverte tudo.',
   12, 6, 0, 0, 0, 0, true, 'Fate/stay night', NULL),

  ('Big Bang Attack', 'A técnica suprema de Vegeta — energia condensada que cresce com o tempo.',
   4000, 350, 'weapon', 'habilidade', 'legendary',
   'unique', 'big-bang-attack_unique', 'Big Bang Attack (Vegeta)',
   'Dano = (turno × 25) + 60. Escala com o tempo da batalha. Quanto mais tempo o Saiyajin acumula, maior o estouro.',
   0, 0, 12, 0, 4, 0, true, 'Dragon Ball', NULL),

  ('Jaula de Espinhos', 'A magia élfica antiga de Frieren — aprisiona o inimigo entre espinhos de mana.',
   4000, 350, 'weapon', 'habilidade', 'legendary',
   'unique', 'cage-of-thorns_unique', 'Jaula de Espinhos (Frieren)',
   'Inimigo skip 2 turnos + 30 HP/turno por 3 turnos + dano inicial 50. Magia élfica antiga.',
   0, 0, 10, 0, 0, 6, true, 'Frieren', NULL),

  -- ÉPICA (10)
  ('Soul Switch', 'Técnica de troca de almas — você fica com a vida do inimigo e vice-versa.',
   1500, 100, 'weapon', 'habilidade', 'epic',
   'unique', 'soul-switch_unique', 'Soul Switch (Jujutsu)',
   'TROCA HP atual entre você e o inimigo (limitado pelo HP máx de cada). High risk, high reward.',
   0, 4, 8, 0, 0, 0, true, 'Jujutsu Kaisen', NULL),

  ('Pacto Demoníaco', 'O contrato de equivalência demoníaca — paga em sangue, recebe em proteção.',
   1500, 100, 'weapon', 'armadura', 'epic',
   'unique', 'devils-bargain_unique', 'Pacto Demoníaco',
   'Custa 20% do HP máx; recebe escudo de 200 HP. A balança da equivalência.',
   0, 0, 0, 0, 0, 12, true, 'Chainsaw Man', NULL),

  ('Magia de Roswaal', 'A combinação proibida dos 6 elementos — magia que escala com vitalidade.',
   1500, 100, 'weapon', 'habilidade', 'epic',
   'unique', 'roswaals-spell_unique', 'Magia de Roswaal (Re:Zero)',
   'Dano = 50% do seu HP atual em TRUE DAMAGE. Quanto mais vida, mais magia.',
   0, 0, 10, 0, 0, 4, true, 'Re:Zero', NULL),

  ('Toque de Decadência', 'O Quirk de Shigaraki — tudo que toca desintegra.',
   1500, 100, 'weapon', 'armamento', 'epic',
   'unique', 'decay-touch_unique', 'Toque de Decadência (Shigaraki)',
   '45 de dano + defesa do inimigo −80 por 4 turnos. Tudo vira cinzas.',
   6, 0, 0, 0, 0, 6, true, 'My Hero Academia', NULL),

  ('Fogo Infernal', 'Magia ofensiva proibida — queima o inimigo mas também o conjurador.',
   1500, 100, 'weapon', 'habilidade', 'epic',
   'unique', 'hellfire_unique', 'Fogo Infernal',
   '50 de dano + inimigo queima 30 HP/turno por 5 turnos. Custo: você queima 5/turno por 3 turnos.',
   0, 0, 8, 0, 0, 4, true, 'Mushoku Tensei', NULL),

  ('Ope Ope no Mi (ROOM)', 'A Akuma no Mi de Trafalgar Law — uma cirurgia esperando para acontecer.',
   1500, 100, 'weapon', 'habilidade', 'epic',
   'unique', 'ope-ope-room_unique', 'Ope Ope no Mi — ROOM',
   '40 de dano (acerto garantido) + 3 próximas abilities NUNCA erram dentro da ROOM. Doctor de operações.',
   4, 4, 4, 0, 0, 0, true, 'One Piece', NULL),

  ('Golpe Conquistador', 'A versão menor do Haki do Rei — atordoa e enfraquece em um soco.',
   1500, 100, 'weapon', 'armamento', 'epic',
   'unique', 'conqueror-strike_unique', 'Golpe Conquistador (Mini-Haki)',
   '55 de dano + atordoado 1 turno + defesa do inimigo −30 por 3 turnos.',
   8, 0, 0, 4, 0, 0, true, 'One Piece', NULL),

  ('Rugido do Titã Fundador', 'O grito de Eren que ressoa pela terra — atordoa e cura ao mesmo tempo.',
   1500, 100, 'weapon', 'habilidade', 'epic',
   'unique', 'founding-titan-roar_unique', 'Rugido do Titã Fundador',
   '40 de dano + atordoa 1 turno + cura 25% do seu HP máx. A terra tremeu.',
   4, 0, 4, 0, 0, 6, true, 'Attack on Titan', NULL),

  ('Caixão das Estrelas', 'Magia élfica que silencia toda magia inimiga — vasto silêncio.',
   1500, 100, 'weapon', 'habilidade', 'epic',
   'unique', 'coffin-of-stars_unique', 'Caixão das Estrelas (Frieren)',
   '65 de dano + CANCELA todos os buffs do inimigo (limpa stats positivos). Vasto silêncio.',
   0, 0, 10, 0, 0, 4, true, 'Frieren', NULL),

  ('Punho de Ferro', 'A técnica de Thorfinn — experiência acumulada que vira força permanente.',
   1500, 100, 'weapon', 'armamento', 'epic',
   'unique', 'iron-fist-vinland_unique', 'Punho de Ferro (Vinland Saga)',
   'Cada uso empilha: 40 + (stacks × 20) dano. Até 5 stacks PERMANENTES nesta batalha. Punho cresce.',
   8, 0, 0, 0, 0, 4, true, 'Vinland Saga', NULL),

  -- RARA (5)
  ('Campo de Hidratação', 'Respiração da Água acalma o campo — cura constante por absorção.',
   600, 30, 'weapon', 'habilidade', 'rare',
   'unique', 'hydration-field_unique', 'Campo de Hidratação',
   '35 de dano + lifesteal 20% nos próximos 4 ataques. Respiração da Água, primeira forma.',
   0, 0, 4, 0, 0, 4, true, 'Demon Slayer', NULL),

  ('Passo Leve', 'Técnica de evasão e contra-ataque — 2 esquivas garantidas + crítico.',
   600, 30, 'weapon', 'armadura', 'rare',
   'unique', 'light-step_unique', 'Passo Leve',
   '2 esquivas garantidas + próximo ataque físico ×1,3 com bônus de crítico.',
   0, 4, 0, 0, 6, 0, true, 'Generic Fantasy', NULL),

  ('Pele de Pedra', 'Magia clássica de proteção — pele endurece como pedra por 3 turnos.',
   600, 30, 'weapon', 'armadura', 'rare',
   'unique', 'stone-skin_unique', 'Pele de Pedra',
   'Escudo de 80 HP. Magia clássica de proteção.',
   0, 0, 0, 0, 0, 8, true, 'Generic Fantasy', NULL),

  ('Marca Espectral', 'Marca o inimigo com um selo fantasmagórico — próxima ability vira true damage.',
   600, 30, 'weapon', 'habilidade', 'rare',
   'unique', 'spectral-mark_unique', 'Marca Espectral',
   'Sua próxima ability causa TRUE DAMAGE + inimigo vulnerável ×2 dano por 1 turno.',
   0, 0, 6, 0, 0, 0, true, 'Generic Fantasy', NULL),

  ('Surto de Mana', 'Restaura energia mística completa — toda a pool de abilities recarrega.',
   600, 30, 'weapon', 'habilidade', 'rare',
   'unique', 'mana-surge_unique', 'Surto de Mana',
   'Restaura PP de todas as suas abilities ao máximo + próximos 2 ataques mágicos ×1,5.',
   0, 0, 6, 0, 4, 0, true, 'Generic Fantasy', NULL);

NOTIFY pgrst, 'reload schema';
