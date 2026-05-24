-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: 266 cartas Lendária/Mítica/??? estavam com texto placeholder
-- ("Habilidade unica de X. Reservada para efeitos especiais de batalha.")
--
-- A MECÂNICA dessas cartas já está implementada no engine
-- (equipmentAbilityRegistry.ts), mas o DB exibia só placeholder ao aluno.
--
-- Esta migration sincroniza ability_name + ability_description com o que o
-- handler realmente faz, pra o aluno enxergar o flavour text e o efeito.
--
-- Cada UPDATE filtra por ability_key, então pega todas as 7 variantes
-- elementais de cada IP automaticamente.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── LENDÁRIA (≈19 IPs × 7 = 133 cartas) ───────────────────────────────────

UPDATE public.shop_items
SET ability_name = 'Armadura Berserker',
    ability_description = 'Remove todos os limitadores: dano físico ×3 por 3 turnos. Custo: 8 HP/turno em sangramento interno. Guts ignora a dor e age como uma fera.'
WHERE ability_key = 'berserker-armor_unique';

UPDATE public.shop_items
SET ability_name = 'Tesouro Sagrado: Chastiefol',
    ability_description = '80 de dano + inimigo atordoado por 2 turnos + escudo de 40 HP. A lança do Rei das Fadas em forma de Cama de Conforto.'
WHERE ability_key = 'chastiefol_unique';

UPDATE public.shop_items
SET ability_name = 'Foice da Morte',
    ability_description = 'Execução instantânea se o inimigo estiver abaixo de 35% HP. Acima: 35% do HP atual + 30 de dano. A alma é ceifada sem cerimônia.'
WHERE ability_key = 'death-scythe_unique';

UPDATE public.shop_items
SET ability_name = 'Espada Demoníaca Ragnarok',
    ability_description = '55 de dano + próximos 3 ataques absorvem 40% do dano como HP. Crona e Ragnarok em sincronia perfeita.'
WHERE ability_key = 'demon-sword-ragnarok_unique';

UPDATE public.shop_items
SET ability_name = 'Dragon Slayer',
    ability_description = '100 de dano puro + atordoa por 1 turno. A massa de ferro pesada demais pra ser chamada de espada. O inimigo não processa o que o acertou.'
WHERE ability_key = 'dragon-slayer_unique';

UPDATE public.shop_items
SET ability_name = 'Gideon',
    ability_description = '75 de dano puro + atordoa por 1 turno. Peso colossal despenca sobre o inimigo. Ninguém fica em pé.'
WHERE ability_key = 'gideon_unique';

UPDATE public.shop_items
SET ability_name = 'Hyorinmaru — Bankai',
    ability_description = '50 de dano + campo de gelo eterno por 4 turnos: Ice ×2,5, Fire ×0,5, 12 HP/turno em DoT glacial. O céu e a terra congelam.'
WHERE ability_key = 'hyorinmaru_unique';

UPDATE public.shop_items
SET ability_name = 'Lostvayne',
    ability_description = 'Reflete os próximos 3 ataques recebidos com 150% do dano. Meliodas fragmenta a alma em clones espirituais.'
WHERE ability_key = 'lostvayne_unique';

UPDATE public.shop_items
SET ability_name = 'Mjolnir',
    ability_description = '25% do HP atual + 40 de dano + atordoa por 2 turnos. Apenas o digno pode empunhá-la. Raio divino de Thor.'
WHERE ability_key = 'mjolnir_unique';

UPDATE public.shop_items
SET ability_name = 'Murasame',
    ability_description = 'Marca o inimigo com Maldição da Morte. Cada dano recebido alimenta a marca; com 5 cargas, execução abaixo de 35% HP. Akame não falha.'
WHERE ability_key = 'murasame_unique';

UPDATE public.shop_items
SET ability_name = 'Pedra Filosofal',
    ability_description = 'Cura 60% do HP máximo + remove TODOS os debuffs (poison/burn/bleed/stun/freeze/vulnerable/death_curse). O custo moral é outra história.'
WHERE ability_key = 'philosophers-stone_unique';

UPDATE public.shop_items
SET ability_name = 'Brincos Potara',
    ability_description = 'FUSÃO PERMANENTE: dano físico e mágico ×2 até o fim da batalha + escudo de 80 HP. Gogeta ou Vegito — você decide na batalha.'
WHERE ability_key = 'potara-earrings_unique';

UPDATE public.shop_items
SET ability_name = 'Rhitta — Machado do Orgulho',
    ability_description = 'Dano escala com o turno (15/turno, cap 90) + 40 base. Quanto mais tarde, mais forte. Escanor ao meio-dia.'
WHERE ability_key = 'rhitta_unique';

UPDATE public.shop_items
SET ability_name = 'Senbonzakura Kageyoshi',
    ability_description = '5 hits de 4% do HP atual + 6 cada + bleed 10 HP/turno por 5 turnos. Mil pétalas de aço dançam — Bankai de Byakuya.'
WHERE ability_key = 'senbonzakura_unique';

UPDATE public.shop_items
SET ability_name = 'Flecha do Stand',
    ability_description = 'Efeito ALEATÓRIO (1 em 5): combate (90 dano) / tempo (inimigo skip 3 turnos) / velocidade (4 esquivas) / restauração (cura 50% HP) / Requiem (HP inimigo → 10%).'
WHERE ability_key = 'stand-arrow_unique';

UPDATE public.shop_items
SET ability_name = 'Máscara de Pedra',
    ability_description = 'Cura 35% do HP máximo + próximos 5 ataques absorvem 50% do dano causado como vida. Transformação vampírica completa.'
WHERE ability_key = 'stone-mask_unique';

UPDATE public.shop_items
SET ability_name = 'Tensa Zangetsu — Bankai',
    ability_description = '25% do HP atual + 25 de dano + Bankai por 4 turnos: dano físico ×2, ataques convertidos pra Dark, 2 esquivas garantidas. Velocidade absoluta.'
WHERE ability_key = 'tensa-zanguetsu_unique';

UPDATE public.shop_items
SET ability_name = 'Völundr',
    ability_description = '65 de dano + escudo de 60 HP forjado em batalha. Forja divina dos deuses nórdicos.'
WHERE ability_key = 'volundr_unique';

UPDATE public.shop_items
SET ability_name = 'Espada Z',
    ability_description = '70 de dano + próximos 3 ataques físicos com o DOBRO de força. A espada dos Kaioshin que Gohan quebrou sem querer.'
WHERE ability_key = 'z-sword_unique';

-- ── MÍTICA (11 IPs × 7 = 77 cartas) ────────────────────────────────────────

UPDATE public.shop_items
SET ability_name = 'Avalon — Bainha Sagrada',
    ability_description = 'Restaura HP ao máximo + próximo hit anulado (invincible) + imune a magia por 2 turnos. A bainha de Excalibur separa o portador do mundo dos mortais.'
WHERE ability_key = 'avalon_unique';

UPDATE public.shop_items
SET ability_name = 'Expansão do Território',
    ability_description = '45% do HP máximo + 20 de dano (ACERTO GARANTIDO) + campo por 2 turnos com TODOS os elementos amplificados ×1,5. Dentro do domínio, todo ataque conecta.'
WHERE ability_key = 'domain-expansion_unique';

UPDATE public.shop_items
SET ability_name = 'Esferas do Dragão (Shenlong)',
    ability_description = 'Restaura HP ao máximo + remove TODOS os debuffs + concede 1 revive extra. Uma vez por batalha. Shenlong atende o chamado.'
WHERE ability_key = 'dragon-balls_unique';

UPDATE public.shop_items
SET ability_name = 'Dragão das Trevas em Chamas',
    ability_description = '45% do HP máximo + 20 de dano + queimadura PERMANENTE (18 HP/turno até o fim da batalha). O que o dragão queima não se apaga.'
WHERE ability_key = 'dragon-of-the-darkness-flame_unique';

UPDATE public.shop_items
SET ability_name = 'Excalibur',
    ability_description = '50% do HP máximo + 30 de dano sagrado + cura 20% do próprio HP máximo. IN LUMINIS ET METALLUM.'
WHERE ability_key = 'excalibur_unique';

UPDATE public.shop_items
SET ability_name = 'Hollow Purple',
    ability_description = '55% do HP máximo + 20 de dano (ACERTO GARANTIDO). A convergência perfeita de Lapse Azul e Vermelho de Gojo. Inevitável.'
WHERE ability_key = 'hollow-purple_unique';

UPDATE public.shop_items
SET ability_name = 'Limitless — O Infinito',
    ability_description = '45% do HP máximo + 25 de dano + 3 esquivas automáticas. Lapse Azul e Vermelho combinados. Nada pode tocá-lo.'
WHERE ability_key = 'limitless_unique';

UPDATE public.shop_items
SET ability_name = 'Flecha Requiem',
    ability_description = 'Roleta de 4 efeitos (25% cada): EXECUÇÃO instantânea / 70% do HP máximo / HP completo + invincible / TODO dano ×3 por 5 ataques. Stand além do Stand.'
WHERE ability_key = 'requiem-arrow_unique';

UPDATE public.shop_items
SET ability_name = 'Reigan — Pistola Espiritual',
    ability_description = '48% do HP máximo + 30 de dano VERDADEIRO (ignora toda defesa). Energia espiritual pura de Yusuke concentrada no indicador.'
WHERE ability_key = 'spirit-gun_unique';

UPDATE public.shop_items
SET ability_name = 'Unlimited Blade Works',
    ability_description = '7 hits de 16 = 112 de dano total + próximos 2 ataques físicos com o DOBRO de força. "Trace, on." Espadas de heróis do passado materializam.'
WHERE ability_key = 'unlimited-blade-works_unique';

UPDATE public.shop_items
SET ability_name = 'Zoltraak',
    ability_description = '47% do HP máximo + 30 de dano + defesa mágica do inimigo ZERADA permanentemente. Magia de uma era anterior, devastadora e esquecida.'
WHERE ability_key = 'zoltraak_unique';

-- ── ??? (8 IPs × 7 = 56 cartas) ────────────────────────────────────────────

UPDATE public.shop_items
SET ability_name = 'Enuma Elish — Ea',
    ability_description = '70% do HP máximo + 25 de dano. O vento primordial que rasgou o caos e criou o mundo. Herói ou monstro, irrelevante.'
WHERE ability_key = 'enuma-elish_unique';

UPDATE public.shop_items
SET ability_name = 'Olho do Geass',
    ability_description = '40% do HP máximo + atordoa por 1 turno. "Eu ordeno: AUTODESTRUA-SE!" — o inimigo obedece à ordem absoluta de Lelouch.'
WHERE ability_key = 'geass-eye_unique';

UPDATE public.shop_items
SET ability_name = 'Kamish — Dragão Nacional',
    ability_description = '60% do HP máximo + 20 + queimadura 25 HP/turno por 4 turnos. O dragão que destruiu a Coreia do Sul. Sung Jin-Woo herda o poder.'
WHERE ability_key = 'kamish_unique';

UPDATE public.shop_items
SET ability_name = 'Fúria de Kamish',
    ability_description = '60% do HP máximo + 15 + próximos 3 ataques absorvem 50% do dano como HP. Sung Jin-Woo empunhando o poder do dragão.'
WHERE ability_key = 'kamishs-wrath_unique';

UPDATE public.shop_items
SET ability_name = 'Requiem (King Crimson)',
    ability_description = 'HP do inimigo reduzido a 8% do máximo + TODOS os status apagados. "O resultado será zero." Giorno Giovanna non si fermerà.'
WHERE ability_key = 'requiem_unique';

UPDATE public.shop_items
SET ability_name = 'Retorno pela Morte',
    ability_description = 'Concede 1 carga de revive. Na próxima vez que cair, Subaru retorna com 50% do HP. O custo é apenas a memória.'
WHERE ability_key = 'return-by-death_unique';

UPDATE public.shop_items
SET ability_name = 'Za Warudo — Time Stop',
    ability_description = '25% do HP atual + 20 de dano + inimigo perde 3 turnos completos. DIO para o tempo enquanto golpeia livremente. Yare yare daze.'
WHERE ability_key = 'time-stop_unique';

UPDATE public.shop_items
SET ability_name = 'Ultra Instinto',
    ability_description = 'Dano cresce com HP perdido (30%+30% missing) + dano físico/mágico ×1,75 + 4 esquivas automáticas por 4 turnos. O corpo age antes do pensamento.'
WHERE ability_key = 'ultra-instinct_unique';

-- ── COMBO bonus (gate-of-babylon era _combo) ───────────────────────────────

UPDATE public.shop_items
SET ability_description = '5 relíquias arremessadas: 6% do HP máximo + 10 cada (ACERTO GARANTIDO). "Mongrels." Gilgamesh abre o tesouro dos reis.'
WHERE ability_key = 'gate-of-babylon_combo'
  AND (ability_description LIKE '%Reservada%' OR ability_description IS NULL);

-- ── Verificação final ──────────────────────────────────────────────────────
-- Após esta migration, espera-se:
--   SELECT rarity, COUNT(*) FILTER (WHERE ability_description LIKE '%Reservada%')
--     FROM shop_items WHERE is_active=true GROUP BY rarity;
-- → todos os counts em 0.

NOTIFY pgrst, 'reload schema';
