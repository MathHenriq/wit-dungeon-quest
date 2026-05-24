-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: Reescreve as descrições das 38 cartas Lendária/Mítica/???
-- agora que o engine ganhou mecânicas criativas REAIS (não só dmg/stat boost).
--
-- Cada UPDATE alinha o texto do DB com o que o handler novo realmente faz.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ??? (8 IPs) ────────────────────────────────────────────────────────────

UPDATE public.shop_items
SET ability_name = 'Retorno pela Morte',
    ability_description = 'Cria um SAVE POINT do estado atual. Se cair nos próximos 10 turnos, a batalha volta a este momento exato MAS o inimigo perde 25% do HP máx PERMANENTE a cada respawn. Até 3 loops. O custo é só a memória.'
WHERE ability_key = 'return-by-death_unique';

UPDATE public.shop_items
SET ability_name = 'Requiem (King Crimson)',
    ability_description = 'APAGA o último turno completo: HP e status de ambos voltam ao que eram no início do turno passado. O tempo simplesmente ignorou. Il risultato sarà zero.'
WHERE ability_key = 'requiem_unique';

UPDATE public.shop_items
SET ability_name = 'Za Warudo — Time Stop',
    ability_description = '4 ataques sequenciais sem que o inimigo possa reagir + inimigo perde 2 turnos depois. DIO para o tempo enquanto golpeia livremente. Yare yare daze.'
WHERE ability_key = 'time-stop_unique';

UPDATE public.shop_items
SET ability_name = 'Ultra Instinto',
    ability_description = 'MODO BENGALA — por 5 turnos, TODO ataque inimigo é auto-esquivado E seguido de contra-ataque (60% do dano original em true damage). Você joga pura reação. O corpo age antes do pensamento.'
WHERE ability_key = 'ultra-instinct_unique';

UPDATE public.shop_items
SET ability_name = 'Olho do Geass',
    ability_description = 'ORDEM ABSOLUTA — força o inimigo a usar SUA PRÓPRIA ability mais forte contra si mesmo (1× por batalha). Plus atordoa por 2 turnos. "Eu ordeno: autodestrua-se!"'
WHERE ability_key = 'geass-eye_unique';

UPDATE public.shop_items
SET ability_name = 'Kamish, o Dragão Nacional',
    ability_description = 'INVOCA Kamish como COMPANION: por 5 turnos, ao início de cada turno seu, o dragão também ataca por conta própria. Plus dano inicial + queimadura 15 HP/turno por 4 turnos.'
WHERE ability_key = 'kamish_unique';

UPDATE public.shop_items
SET ability_name = 'Fúria de Kamish (Monarca)',
    ability_description = 'AURA DO MONARCA — cada phase HP do boss derrubada (75/50/25%) concede +30% multiplicador de dano PERMANENTE nesta batalha (stack). Plus dano inicial + lifesteal 50% por 3 ataques.'
WHERE ability_key = 'kamishs-wrath_unique';

UPDATE public.shop_items
SET ability_name = 'Enuma Elish — Reality Marble',
    ability_description = 'Reescreve a fundação do mundo: por 3 turnos, TODOS os seus ataques são tratados como SUPER-EFETIVOS (×2). Plus dano inicial massivo (acerto garantido). Herói ou monstro, irrelevante.'
WHERE ability_key = 'enuma-elish_unique';

-- ── MÍTICA (11 IPs) ────────────────────────────────────────────────────────

UPDATE public.shop_items
SET ability_name = 'Avalon — Fortaleza',
    ability_description = 'Cura inicial 40% HP + próximo hit ANULADO + imune a magia 2 turnos. Por 6 ataques, o dano recebido VIRA CURA (120% do dano absorvido como HP). Tank reverso.'
WHERE ability_key = 'avalon_unique';

UPDATE public.shop_items
SET ability_name = 'Domínio Aberto',
    ability_description = 'Por 3 turnos, o combate trava no seu domínio: inimigo tem 50% de FALHAR cada ability + seus elementos amplificados ×1,5. Plus dano garantido inicial.'
WHERE ability_key = 'domain-expansion_unique';

UPDATE public.shop_items
SET ability_name = 'Esferas do Dragão (Pedir Desejo)',
    ability_description = 'Shenlong sorteia 1 de 4 desejos: (1) RESSURREIÇÃO total + revive / (2) APAGAR 2 abilities inimigas / (3) HP do inimigo pela metade / (4) TURNO EXTRA — próxima ability ×2 + esquiva grátis.'
WHERE ability_key = 'dragon-balls_unique';

UPDATE public.shop_items
SET ability_name = 'Dragão das Trevas em Chamas',
    ability_description = 'Dano + queimadura PERMANENTE (10 HP/turno) + por 3 turnos, fogo crescente alimenta o inimigo (20 → 35 → 50 HP/turno). O que o dragão queima não se apaga.'
WHERE ability_key = 'dragon-of-the-darkness-flame_unique';

UPDATE public.shop_items
SET ability_name = 'Excalibur — Julgamento do Rei',
    ability_description = 'Dano CONDICIONAL ao seu HP: (>80%) DANO MASSIVO 65% HP máx + cura 30% / (30-80%) Equilíbrio: 40% HP máx + cura 15% / (<30%) SACRIFÍCIO: inimigo cai a 1 HP MAS você fica atordoado 1 turno.'
WHERE ability_key = 'excalibur_unique';

UPDATE public.shop_items
SET ability_name = 'Hollow Purple (Cadeia 3 Estágios)',
    ability_description = 'Cadeia de 3 castadas: (1º) Lapse Azul = drena 20% HP inimigo + cura você. (2º) Reversal Red = acumula (×2 próximo). (3º) HOLLOW PURPLE = ACERTO GARANTIDO de 40% HP máx + 80 + soma acumulada. O mais bonito e destrutivo.'
WHERE ability_key = 'hollow-purple_unique';

UPDATE public.shop_items
SET ability_name = 'Limitless — Infinity',
    ability_description = 'Por 4 turnos, o inimigo NUNCA chega em você: auto-dodge integral + 5 esquivas extras + imune a magia. Plus dano inicial 35% HP máx + 25. Nada toca Satoru Gojo.'
WHERE ability_key = 'limitless_unique';

UPDATE public.shop_items
SET ability_name = 'Flecha Requiem',
    ability_description = 'Sua PRÓXIMA ability sai em versão REQUIEM: dano ×2 garantido + esquiva pra chegar viva + amp 2× dos próximos 1 físico e 1 mágico. Use sua melhor carta logo após. Stand evolui.'
WHERE ability_key = 'requiem-arrow_unique';

UPDATE public.shop_items
SET ability_name = 'Reigan (Pistola Espiritual)',
    ability_description = 'CARGA — começa com 2 cargas. Cada hit recebido nos próximos 5 turnos = +1 carga. Dispara em 5 turnos OU se cair pra <25% HP: 35 × cargas em TRUE DAMAGE. Apanhe pra ficar forte.'
WHERE ability_key = 'spirit-gun_unique';

UPDATE public.shop_items
SET ability_name = 'Unlimited Blade Works',
    ability_description = '7 LÂMINAS materializadas: 1 hit grátis (25 dmg) no início de cada turno seu por 7 turnos, sem usar sua ação. Quando todas usadas: PRÓXIMA ABILITY ×3. "Trace, on."'
WHERE ability_key = 'unlimited-blade-works_unique';

UPDATE public.shop_items
SET ability_name = 'Zoltraak — Magia Universal',
    ability_description = 'Por 4 turnos, TODAS as suas abilities (não só Zoltraak) IGNORAM defesa mágica do inimigo + def física −50. Plus dano inicial 40% HP máx + 30. Magia de uma era anterior.'
WHERE ability_key = 'zoltraak_unique';

-- ── LENDÁRIA (19 IPs) ──────────────────────────────────────────────────────

UPDATE public.shop_items
SET ability_name = 'Armadura Berserker (Escalante)',
    ability_description = 'Dano físico escala com HP perdido: >60% HP = ×2,5 / 30-60% = ×3,5 / <30% = ×5 (FÚRIA TOTAL). Por 3 turnos + imune a controle. Custo: sangramento interno proporcional (6 → 15 HP/turno).'
WHERE ability_key = 'berserker-armor_unique';

UPDATE public.shop_items
SET ability_name = 'Chastiefol (3 Formas)',
    ability_description = 'Sorteia 1 das 3 formas icônicas: (Forma 4 SUNFLOWER) 6 girassóis multi-hit / (Forma 6 SUBLIME) escudo 150 + cura 30% + invul / (Forma 10 COSMOS) explosão estelar 50% HP máx + atordoa 3 turnos. Tesouro Sagrado do Rei das Fadas.'
WHERE ability_key = 'chastiefol_unique';

UPDATE public.shop_items
SET ability_name = 'Foice da Morte (Ceifadora)',
    ability_description = 'Acima de 35% HP: 30% do HP atual + 30 dmg + MARCA pela Ceifadora (cai abaixo de 40% → execução). Abaixo de 35% HP: EXECUÇÃO instantânea. A alma é ceifada sem cerimônia.'
WHERE ability_key = 'death-scythe_unique';

UPDATE public.shop_items
SET ability_name = 'Espada Demoníaca Ragnarok',
    ability_description = '50 dmg + por 5 ataques seus: dano ×1,5 + 50% absorvido como HP + inimigo sangra 12/turno por 5 turnos. Crona e Ragnarok em sincronia.'
WHERE ability_key = 'demon-sword-ragnarok_unique';

UPDATE public.shop_items
SET ability_name = 'Dragon Slayer (3 Golpes)',
    ability_description = '3 golpes escalantes: 40 + 55 + 70 = 165 de dano + atordoa 2 turnos. Contra BOSS: bônus de sangramento 25 HP/turno por 4 turnos. A espada que não deveria existir.'
WHERE ability_key = 'dragon-slayer_unique';

UPDATE public.shop_items
SET ability_name = 'Gideon (Peso Colossal)',
    ability_description = '70 dmg + atordoa 1 turno + defesa do inimigo −30 PERMANENTE + Gravidade Aumentada: 8 → 24 HP/turno em DoT crescente por 5 turnos. O inimigo afunda no chão.'
WHERE ability_key = 'gideon_unique';

UPDATE public.shop_items
SET ability_name = 'Hyorinmaru — Eterno Gelo',
    ability_description = 'Dano + campo glacial por 4 turnos (Ice ×2,5, Fire ×0,5, 15 HP/turno) + uma ability inimiga aleatória CONGELADA PERMANENTEMENTE (banimento). Daiguren Hyorinmaru.'
WHERE ability_key = 'hyorinmaru_unique';

UPDATE public.shop_items
SET ability_name = 'Lostvayne (4 Clones)',
    ability_description = '4 clones espirituais simultâneos por 3 turnos: contra-ataque ×2 (3 hits) + próximos 3 físicos ×2 + lifesteal 40% + auto-counter 50% true damage. Meliodas fragmenta a alma.'
WHERE ability_key = 'lostvayne_unique';

UPDATE public.shop_items
SET ability_name = 'Mjolnir (Prova do Digno)',
    ability_description = 'Condicional ao SEU HP: <60% HP = "DIGNO" — dano ×2 + atordoa 3 turnos + purifica seus debuffs. >60% = básico: dano normal + atordoa 2. Apenas quem prova merecimento empunha.'
WHERE ability_key = 'mjolnir_unique';

UPDATE public.shop_items
SET ability_name = 'Murasame (Maldição da Morte)',
    ability_description = 'Marca o inimigo + 35 dmg + sangramento PERMANENTE (15 HP/turno). Cada uso = +1 carga (até 5). Com 5 cargas, abaixo de 40% HP → EXECUÇÃO automática. Akame não falha.'
WHERE ability_key = 'murasame_unique';

UPDATE public.shop_items
SET ability_name = 'Pedra Filosofal (Equivalência)',
    ability_description = 'Cura TOTAL + remove TODOS debuffs + imune a magia 3 turnos + por 3 turnos, 100% do dano sofrido vira contra-ataque true damage. O preço das almas é pago em retorno.'
WHERE ability_key = 'philosophers-stone_unique';

UPDATE public.shop_items
SET ability_name = 'Brincos Potara (Fusão dos Deuses)',
    ability_description = 'FUSÃO PERMANENTE: dano físico/mágico ×2 + escudo 100 + cura inicial 30% HP. Bônus oculto: se Reigan estiver carregando, dano por carga é dobrado. Gogeta ou Vegito?'
WHERE ability_key = 'potara-earrings_unique';

UPDATE public.shop_items
SET ability_name = 'Rhitta (Sol do Meio-Dia)',
    ability_description = 'Dano escala com turno (18/turno, cap 120) + 40. Se HP cheio (INVICTO) = ×2. Se turno ≥ 8 (MEIO-DIA) = dano DIVINO true damage. "Quem me deu esse poder?"'
WHERE ability_key = 'rhitta_unique';

UPDATE public.shop_items
SET ability_name = 'Senbonzakura Kageyoshi',
    ability_description = '8 hits de mil pétalas: 5% HP atual + 8 cada. Cada hit tem 40% de aplicar BLEED INDEPENDENTE (8/turno × 4 turnos). Pode acumular até 8 sangramentos simultâneos.'
WHERE ability_key = 'senbonzakura_unique';

UPDATE public.shop_items
SET ability_name = 'Flecha do Stand (Persistente)',
    ability_description = 'Stand sorteado fica ATIVO o resto da batalha: (1) STAR PLATINUM companion bate 22/turno / (2) THE WORLD skip 3 + auto-counter 5 turnos / (3) SILVER CHARIOT 5 turnos auto-dodge / (4) CRAZY DIAMOND cura + lifesteal 30% perm / (5) GOLD REQUIEM HP inimigo → 8% + próxima ability Requiem.'
WHERE ability_key = 'stand-arrow_unique';

UPDATE public.shop_items
SET ability_name = 'Máscara de Pedra (Vampirismo Eterno)',
    ability_description = 'Cura 40% HP + lifesteal PERMANENTE 60% + escudo 80 + imune a magia 6 turnos + remove debuffs. O sangue alimenta — transformação completa.'
WHERE ability_key = 'stone-mask_unique';

UPDATE public.shop_items
SET ability_name = 'Tensa Zangetsu (Bankai → Mugetsu)',
    ability_description = '1ª uso = BANKAI: dano + físico ×2, ataques Dark, 3 esquivas por 4 turnos. 2ª uso no mesmo combate = MUGETSU (Final Getsuga Tenshou): sacrifício do seu HP para 10% + dano massivo + 3 abilities inimigas APAGADAS.'
WHERE ability_key = 'tensa-zanguetsu_unique';

UPDATE public.shop_items
SET ability_name = 'Völundr (Forja Divina)',
    ability_description = 'Sorteia 3 buffs diferentes entre 6: Espada do Sol (físico ×2) / Cetro Arcano (mágico ×2) / Égide de Mjölnir (escudo 120) / Mantos de Loki (esquiva ×4) / Anel de Odin (lifesteal 50% × 5) / Coração de Surtr (burn 25/turno × 4). Aplica todos.'
WHERE ability_key = 'volundr_unique';

UPDATE public.shop_items
SET ability_name = 'Espada Z (Velho Kaioshin Desperto)',
    ability_description = 'Dano + próximos 3 físicos ×2. Se o golpe ATRAVESSAR 50% HP do inimigo, a espada QUEBRA e desperta o Velho Kaioshin: +1 revive + próximos 3 mágicos ×2. A espada dos deuses se sacrifica.'
WHERE ability_key = 'z-sword_unique';

NOTIFY pgrst, 'reload schema';
