/**
 * O que desenhar em cada carta: personagem e cena, em tags no formato do
 * Danbooru (é assim que o Animagine XL reconhece personagens).
 *
 * Ordem das tags: quantidade de pessoas, personagem, obra, e só então a cena.
 * O estilo e a qualidade são acrescentados pelo gerador, iguais para todas.
 */

export const ART_PROMPTS: Record<string, string> = {
  // ── Equipamentos sem obra ──────────────────────────────────────────────────
  'manto-da-aurora': 'no humans, flowing cloak, aurora borealis fabric, glowing green and purple, floating in snowy night, fantasy item',
  'aegis-celestial': 'no humans, ornate golden shield, celestial engravings, glowing halo, clouds, divine light, fantasy item',
  'botas-de-couro': 'no humans, pair of brown leather boots, adventurer gear, wooden floor, warm lantern light, fantasy item',
  'peitoral-de-couro': 'no humans, leather breastplate armor on stand, adventurer gear, blacksmith workshop, warm light, fantasy item',
  'lamina-estelar': 'no humans, crystal sword, starry night sky inside the blade, floating, sparkles, fantasy item',
  'espada-simples': 'no humans, simple steel sword stuck in ground, grassy hill, sunlight, fantasy item',
  'espadinha': 'no humans, short sword, dagger, on stone pedestal, dungeon, torchlight, fantasy item',
  'pequena-espada': 'no humans, small sword with leather grip, on wooden table, map, candle, fantasy item',
  'coroa-do-crepusculo': 'no humans, dark golden crown, purple gemstones, twilight sky, floating, glowing, fantasy item',
  'orbe-cromatico': 'no humans, glowing crystal orb, rainbow prismatic light, floating above hands of light, magic circle, fantasy item',
  'selo-do-vazio': 'no humans, black void seal, magic circle, swirling darkness, purple runes, floating, fantasy item',

  // ── Chainsaw Man ───────────────────────────────────────────────────────────
  'pacto-demoniaco': '1girl, makima (chainsaw man), chainsaw man, red hair, braided ponytail, ringed eyes, fully clothed, white shirt, black tie, black coat, portrait, holding contract paper, demonic shadows behind',
  'contrato-com-o-diabo': '1boy, denji (chainsaw man), chainsaw man, chainsaw man (character), chainsaws from head and arms, blood splatter, sparks, roaring',

  // ── Naruto ─────────────────────────────────────────────────────────────────
  'modo-sabio-dos-seis-caminhos': '1boy, uzumaki naruto, naruto (series), six paths sage mode, glowing orange cloak, truth-seeking balls, floating, rinnegan-style aura',
  'foice-tripla': '1boy, hidan (naruto), naruto (series), akatsuki cloak, slicked back grey hair, triple-bladed red scythe, blood ritual circle',
  'marionete-venenosa': '1boy, sasori (naruto), naruto (series), red hair, puppet master, chakra strings, wooden puppet with poison blades',
  'samehada': '1boy, hoshigaki kisame, naruto (series), blue skin, gills, akatsuki cloak, samehada, shark sword, water splash',
  'sharingan': '1boy, uchiha itachi, naruto (series), sharingan, red eyes, glowing eyes, crows, akatsuki cloak, close-up',
  'kunai': '1boy, uzumaki naruto, naruto (series), throwing kunai, forest, leaf village headband, motion blur',
  'kunai-do-deus-do-trovao': '1boy, namikaze minato, naruto (series), yellow hair, white haori with flames, three-pronged kunai, yellow flash, teleport',
  'papel-explosivo': '1boy, deidara (naruto), naruto (series), blonde hair, explosive tags, paper talismans, explosion, akatsuki cloak',
  'edo-tensei': '1boy, orochimaru (naruto), naruto (series), long black hair, snake eyes, summoning coffins, reanimated shinobi, dark ritual',

  // ── Fire Force ─────────────────────────────────────────────────────────────
  'excalibur-de-arthur': '1boy, arthur boyle, enen no shouboutai, blonde hair, knight, plasma sword, electric blade, cape',
  'adolla-burst': '1boy, kusakabe shinra, enen no shouboutai, fire from feet, flying, adolla burst, flames, grin',
  'lua-carmesim-de-benimaru': '1boy, shinmon benimaru, enen no shouboutai, black hair, red eyes, crimson moon, fire matoi, night sky',

  // ── Berserk ────────────────────────────────────────────────────────────────
  'furia-berserker': '1boy, guts (berserk), berserk, black swordsman, rage, screaming, black armor, dark red aura',
  'braco-canhao': '1boy, guts (berserk), berserk, mechanical arm cannon, firing, smoke, black cape, night',
  'matadora-de-dragoes': '1boy, guts (berserk), berserk, dragonslayer (sword), huge sword, swinging, black cape, eclipse sky',
  'espada-do-cavaleiro-da-caveira': '1boy, skull knight, berserk, skull helmet, spiked armor, sword of beherit, riding black horse, moon',
  'behelit': 'no humans, behelit, berserk, small egg-shaped red stone, human face features on stone, close-up, held in palm, dark background, eclipse glow',
  'armadura-berserker': '1boy, guts (berserk), berserk, berserker armor, wolf-shaped helmet, glowing eyes, dark aura, blood',

  // ── Yu-Gi-Oh! ──────────────────────────────────────────────────────────────
  'mago-negro': '1boy, dark magician, yu-gi-oh!, purple armor, pointed hat, staff, dark magic attack, magic circle',
  'enigma-do-milenio': '1boy, mutou yuugi, yu-gi-oh!, millennium puzzle, glowing golden pyramid, eye of wdjat, holding cards',

  // ── Seven Deadly Sins ──────────────────────────────────────────────────────
  'disaster': '1boy, estarossa (nanatsu no taizai), nanatsu no taizai, silver hair, demon marks, dark swords, disaster',
  'sol-cruel': '1boy, escanor (nanatsu no taizai), nanatsu no taizai, muscular, mustache, small sun above hand, blazing heat, noon',
  'rhitta': '1boy, escanor (nanatsu no taizai), nanatsu no taizai, giant axe rhitta, sun behind, arrogant pose, glowing',
  'gideon': 'no humans, nanatsu no taizai, giant war hammer embedded in cracked ground, flying rocks, dust, shockwave, mountains',
  'chastiefol': '1boy, king (nanatsu no taizai), nanatsu no taizai, fairy king, floating, giant spear chastiefol, sunflower, forest',
  'lostvayne': '1boy, meliodas, nanatsu no taizai, blond hair, green eyes, lostvayne, multiple clones, sword slash',
  'full-counter': '1boy, meliodas, nanatsu no taizai, blond hair, green eyes, from front, facing viewer, demon mark on forehead, sword raised, deflecting giant energy blast, counter',

  // ── One Piece ──────────────────────────────────────────────────────────────
  'enma': '1boy, roronoa zoro, one piece, green hair, one eye closed, enma (sword), haki aura, three sword style',
  'gomu-gomu-no-mi': '1boy, monkey d. luffy, one piece, straw hat, stretching arm punch, gum-gum pistol, grin',
  'gura-gura-no-mi': '1boy, edward newgate, one piece, white mustache, bisento, quake punch, cracking air, shockwave',
  'mera-mera-no-mi': '1boy, portgas d. ace, one piece, orange hat, shirtless, fire fist, flames, freckles',
  'golpe-conquistador': '1boy, monkey d. luffy, one piece, gear fourth, conqueror\'s haki, black lightning, punch',
  'room': '1boy, trafalgar law, one piece, fluffy spotted hat, standing, holding nodachi, blue translucent dome, room (one piece), sliced objects floating',
  'haki-do-rei': '1boy, monkey d. luffy, one piece, straw hat, conqueror\'s haki, red black lightning, enemies fainting, intimidating',

  // ── My Hero Academia ───────────────────────────────────────────────────────
  'apagar': '1boy, aizawa shouta, boku no hero academia, adult, long messy black hair, stubble, yellow goggles, glowing red eyes, grey capture scarf floating, black jumpsuit',
  'explosion-rush': '1boy, bakugou katsuki, boku no hero academia, spiky blond hair, red eyes, explosions from palms, grin',
  'metade-gelo-metade-fogo': '1boy, todoroki shouto, boku no hero academia, split hair red and white, heterochromia, ice and fire',
  'smash-do-one-for-all': '1boy, midoriya izuku, boku no hero academia, green hair, one for all, green lightning, punch, shockwave',
  'chicote-negro': '1boy, midoriya izuku, boku no hero academia, green hair, hero costume, black whip, black energy tendrils from arms, jumping between buildings',
  'toque-de-decadencia': '1boy, shigaraki tomura, boku no hero academia, messy blue-white hair, hand on face, decay, crumbling ground',
  'dark-shadow': '1boy, tokoyami fumikage, boku no hero academia, bird head, dark shadow, shadow monster, glowing eyes',

  // ── JoJo ───────────────────────────────────────────────────────────────────
  'hamon-overdrive': '1boy, jonathan joestar, jojo no kimyou na bouken, hamon, golden ripple energy, punch, sunlight',
  'ora-ora-ora': '1boy, kujo jotaro, star platinum, jojo no kimyou na bouken, stand, rush of punches, menacing',
  'esferas-de-aco': '1boy, gyro zeppeli, jojo no kimyou na bouken, steel ball run, spinning steel balls, hat, cowboy',
  'flecha-do-stand': 'no humans, stand arrow, jojo no kimyou na bouken, golden arrowhead, beetle design, glowing, dark background',
  'mascara-de-pedra': 'no humans, stone mask (jojo), jojo no kimyou na bouken, ancient aztec stone mask on stone pedestal, close-up, bone spikes, moonlight, museum',
  'flecha-requiem': '1boy, giorno giovanna, gold experience requiem, jojo no kimyou na bouken, golden arrow, glowing, ladybug',
  'king-crimson': '1boy, diavolo, king crimson (stand), jojo no kimyou na bouken, pink hair, time erased, red sky',
  'za-warudo': '1boy, dio brando, the world (stand), jojo no kimyou na bouken, time stop, knives floating, monochrome world, menacing',

  // ── Dragon Ball ────────────────────────────────────────────────────────────
  'teletransporte': '1boy, son goku, dragon ball z, spiky black hair, orange dougi, index and middle fingers on forehead, instant transmission, afterimage, blue sky',
  'kamehameha': '1boy, son goku, dragon ball z, orange dougi, spiky black hair, kamehameha, blue energy beam from cupped hands, from front',
  'kaioken': '1boy, son goku, dragon ball z, kaioken, red aura, flexing, screaming, orange dougi',
  'final-flash': '1boy, vegeta, dragon ball z, super saiyan, arms extended, final flash, yellow energy beam',
  'big-bang-attack': '1boy, vegeta, dragon ball z, super saiyan, one arm extended, big bang attack, blue energy sphere',
  'espada-z': '1boy, son gohan, dragon ball z, z sword, sword stuck in rock, sacred world of the kai',
  'bastao-magico': '1boy, son goku, dragon ball, child, kid goku, monkey tail, blue dougi, extending red staff, nyoibo, riding flying nimbus, clouds',
  'brincos-potara': '1boy, vegito, dragon ball super, potara earrings, blue aura, confident smirk',
  'esferas-do-dragao': 'no humans, shenron, dragon ball, seven dragon balls, green eternal dragon, night sky, glowing',
  'scouter': '1boy, vegeta, dragon ball z, scouter, saiyan armor, reading power level',
  'semente-dos-deuses': 'no humans, still life, small green beans in a small brown cloth bag on wooden table, soft light, cozy',
  'instinto-superior': '1boy, son goku, dragon ball super, ultra instinct, silver hair, silver eyes, dodging, calm expression',

  // ── Solo Leveling ──────────────────────────────────────────────────────────
  'matadora-de-cavaleiros': '1boy, sung jin-woo, ore dake level up na ken, black coat, dagger, glowing blue eyes, dungeon',
  'adaga-de-baruka': '1boy, sung jin-woo, ore dake level up na ken, twin daggers, ice elf dagger, blue glow, frost',
  'presa-venenosa-de-kasaka': '1boy, sung jin-woo, ore dake level up na ken, black coat, holding dagger dripping purple poison, giant blue serpent coiled behind, cave',
  'orbe-da-avareza': '1boy, sung jin-woo, ore dake level up na ken, glowing dark orb, magic amplification, purple energy',
  'kamish-o-dragao': 'no humans, dragon, ore dake level up na ken, giant black dragon, fire breath, ruined city',
  'furia-de-kamish': '1boy, sung jin-woo, ore dake level up na ken, shadow monarch, dragon shadow behind, purple flames',
  'sede-de-sangue': '1boy, sung jin-woo, ore dake level up na ken, killing intent, glowing purple eyes, dark aura, menacing',
  'autoridade-do-governante': '1boy, sung jin-woo, ore dake level up na ken, telekinesis, floating debris, outstretched hand',
  'furtividade': '1boy, sung jin-woo, ore dake level up na ken, stealth, fading into shadows, dagger, smoke',
  'extracao-de-sombras': '1boy, sung jin-woo, ore dake level up na ken, arise, shadow soldiers rising from ground, purple eyes',

  // ── Hunter x Hunter ────────────────────────────────────────────────────────
  'correntes-de-kurapika': '1boy, kurapika, hunter x hunter, blonde hair, blue tabard, chains from fingers, scarlet eyes',
  'prisao-de-correntes': '1boy, kurapika, hunter x hunter, scarlet eyes, chain jail, chains binding, emperor time',
  'chiclete-elastico': '1boy, hisoka morow, hunter x hunter, red hair, face paint, bungee gum, pink aura, playing card',
  'cartas-do-hisoka': '1boy, hisoka morow, hunter x hunter, face paint, throwing playing cards, smirk, cards in air',
  'vara-de-pesca-do-gon': '1boy, gon freecss, hunter x hunter, spiky black hair, green jacket, fishing rod, lake, smile',
  'ioios-do-killua': '1boy, killua zoldyck, hunter x hunter, white hair, yo-yo, electricity, blue eyes',
  'velocidade-divina': '1boy, killua zoldyck, hunter x hunter, godspeed, white hair, blue lightning aura, afterimages',
  'corte-do-dragao': '1boy, isaac netero, hunter x hunter, old man, bald, long white beard, white martial arts gi, praying hands, giant golden guanyin statue behind',
  'jajanken': '1boy, gon freecss, hunter x hunter, jajanken, rock, fist glowing with nen, yellow aura',

  // ── Black Clover ───────────────────────────────────────────────────────────
  'zona-de-mana': '1boy, yuno (black clover), black clover, wind spirit, mana zone, green wind swirling, grimoire',
  'black-divider': '1boy, asta (black clover), black clover, demon slayer sword, black divider, anti-magic, black aura',
  'corte-antimagia': '1boy, asta (black clover), black clover, demon form, anti-magic slash, black horn, grimoire',
  'corte-dimensional': '1boy, yami sukehiro, black clover, katana, dark magic, dimension slash, cigarette',

  // ── Demon Slayer ───────────────────────────────────────────────────────────
  'lamina-nichirin': '1boy, kamado tanjirou, kimetsu no yaiba, checkered haori, nichirin sword, earring, determined',
  'hinokami-kagura': '1boy, kamado tanjirou, kimetsu no yaiba, hinokami kagura, fire dance, flaming sword, checkered haori',
  'respiracao-da-agua': '1boy, kamado tanjirou, kimetsu no yaiba, water breathing, water dragon, sword slash, checkered haori',
  'espirito-da-besta': '1boy, hashibira inosuke, kimetsu no yaiba, boar mask, shirtless, twin jagged swords, beast breathing',
  'primeira-forma-relampago': '1boy, agatsuma zenitsu, kimetsu no yaiba, yellow hair, thunder breathing, lightning, sheathed sword, iaido',
  'campo-de-hidratacao': '1boy, tomioka giyuu, kimetsu no yaiba, half-and-half haori, water breathing, dead calm, water surface',

  // ── Tokyo Ghoul ────────────────────────────────────────────────────────────
  'quinque': '1boy, suzuya juuzou, tokyo ghoul, white hair, stitches, quinque, scythe weapon, ccg',
  'kagune-rinkaku': '1boy, kaneki ken, tokyo ghoul, white hair, kakugan, rinkaku, red tentacles, eyepatch',
  'forma-kakuja': '1boy, kaneki ken, tokyo ghoul, kakuja, centipede armor, red kagune, monstrous',
  'kagune-liberado': '1boy, kaneki ken, tokyo ghoul, white hair, kakugan, many kagune tentacles, cracking finger, rain',

  // ── Noragami / Frieren / Blue Lock / Haikyuu ───────────────────────────────
  'sekki': '1boy, yato (noragami), noragami, blue eyes, tracksuit, scarf, katana sekki, slash, glowing',
  'cajado-de-frieren': '1girl, frieren, sousou no frieren, white hair, twin tails, elf, fully clothed, white capelet, long skirt, standing, holding magic staff, flower field',
  'caixao-das-estrelas': 'no humans, sousou no frieren, coffin made of starlight, constellations, glowing magic circle, night sky, falling stars',
  'jaula-de-espinhos': '1girl, fully clothed, upper body, long sleeves, frieren, sousou no frieren, white hair, elf, thorn vines cage, magic, forest',
  'zoltraak': '1girl, fully clothed, upper body, long sleeves, frieren, sousou no frieren, white hair, elf, zoltraak, violet magic beam, staff',
  'olho-de-predador': '1boy, barou shouei, blue lock, black hair, sharp eyes, intense glare, soccer uniform, dribbling soccer ball, stadium, dark aura',
  'chute-direto': '1boy, isagi yoichi, blue lock, soccer uniform, direct shot, kicking soccer ball, stadium',
  'meta-visao': '1boy, isagi yoichi, blue lock, glowing eyes, meta vision, tactical lines, stadium',
  'ataque-rapido': '1boy, hinata shouyou, haikyuu!!, orange hair, jumping, spike, volleyball, quick attack',

  // ── Jujutsu Kaisen ─────────────────────────────────────────────────────────
  'fala-amaldicoada': '1boy, inumaki toge, jujutsu kaisen, white hair, high collar lowered, cursed speech marks, glowing',
  'lanca-invertida-do-ceu': '1boy, fushiguro touji, jujutsu kaisen, scar on mouth, inverted spear of heaven, smirk, black shirt',
  'katana-parte-alma': '1girl, fully clothed, upper body, long sleeves, zen\'in maki, jujutsu kaisen, glasses, green hair, ponytail, split soul katana, slash',
  'nuvem-brincalhona': '1girl, zen\'in maki, jujutsu kaisen, glasses, green hair, ponytail, fully clothed, jujutsu high uniform, fighting stance, swinging three-section staff, motion blur',
  'reino-da-prisao': 'no humans, prison realm, jujutsu kaisen, cursed cube, eyes, glowing cube, dark subway',
  'dez-sombras': '1boy, fushiguro megumi, jujutsu kaisen, spiky black hair, hand shadow sign, divine dogs, shadows',
  'black-flash': '1boy, itadori yuuji, jujutsu kaisen, pink hair, black flash, black lightning punch, red sparks',
  'troca-de-almas': '1boy, todou aoi, jujutsu kaisen, muscular, school uniform, clapping hands, boogie woogie, battlefield, afterimages swapping places',
  'vazio-roxo': '1boy, gojou satoru, jujutsu kaisen, white hair, blue eyes, hollow purple, red and blue orbs merging',
  'ilimitado': '1boy, gojou satoru, jujutsu kaisen, white hair, blindfold, infinity, hand raised, attacks stopped in air',
  'expansao-de-dominio': '1boy, gojou satoru, jujutsu kaisen, white hair, blue eyes, domain expansion, infinite void, hand sign',

  // ── Fairy Tail / Magi / Mushoku / Avatar ───────────────────────────────────
  'rugido-do-dragao-de-fogo': '1boy, natsu dragneel, fairy tail, pink hair, scarf, fire dragon roar, flames from mouth',
  'dragon-force': '1boy, natsu dragneel, fairy tail, dragon force, scales, fire aura, pink hair',
  'ice-make': '1boy, gray fullbuster, fairy tail, shirtless, ice make, ice lances, cold mist',
  'marca-da-fairy-tail': 'no humans, fairy tail logo, fairy tail, guild emblem, red banner, guild hall, warm light',
  'lacrima-de-dragao': 'no humans, lacrima, fairy tail, glowing crystal with dragon inside, fire, magic',
  'armaduras-da-erza': '1girl, fully clothed, erza scarlet, fairy tail, red hair, heaven\'s wheel armor, floating swords',
  'recipiente-de-metal': '1boy, alibaba saluja, magi: the labyrinth of magic, blonde hair, metal vessel, djinn equip, fire sword',
  'fogo-infernal': '1boy, rudeus greyrat, mushoku tensei, wand, massive fire magic, inferno, robe',
  'estado-avatar': 'no humans, avatar: the last airbender, four elements swirling in a ring, air water earth fire, glowing blue arrow symbol in center, sky temple',

  // ── Vinland / Soul Eater / Fate / Record of Ragnarok / Akame ───────────────
  'punho-de-ferro': '1boy, thorfinn, vinland saga, blond hair, bare fists, scars, fighting stance, snow',
  'foice-da-morte': 'no humans, soul eater, death scythe, large red and black scythe with eye, crescent moon with grinning face, graveyard, night',
  'espada-demoniaca-ragnarok': '1other, crona (soul eater), soul eater, black dress, pink hair, black blood sword, ragnarok',
  'ressonancia-de-almas': '1girl, 1boy, maka albarn, soul evans, soul eater, fully clothed, school uniform, back to back, soul resonance, glowing scythe, blue souls',
  'gae-bolg': '1boy, cu chulainn (fate), fate/stay night, blue hair, red spear, gae bolg, blue armor',
  'volundr': 'no humans, divine forge, fate (series), glowing weapons being forged, anvil, sparks, golden light',
  'avalon': '1girl, fully clothed, artoria pendragon (fate), fate/stay night, blonde hair, blue armor, avalon, golden scabbard, glowing shield',
  'excalibur': '1girl, fully clothed, upper body, long sleeves, artoria pendragon (fate), fate/stay night, blonde hair, excalibur, golden light beam, raising sword',
  'unlimited-blade-works': '1boy, archer (fate), fate/stay night, white hair, red cloak, unlimited blade works, swords in ground, gears in sky',
  'enuma-elish': '1boy, gilgamesh (fate), fate/stay night, golden armor, ea (fate), spinning sword, red wind, gate of babylon',
  'mjolnir': '1boy, thor (shuumatsu no valkyrie), shuumatsu no valkyrie, red hair, mjolnir, lightning, gauntlets',
  'murasame': '1girl, fully clothed, upper body, long sleeves, akame (akame ga kill!), akame ga kill!, long black hair, red eyes, murasame, katana, cursed marks',

  // ── Bleach ─────────────────────────────────────────────────────────────────
  'hyorinmaru': '1boy, hitsugaya toushirou, bleach, white hair, ice dragon, daiguren hyourinmaru, ice wings',
  'senbonzakura': '1boy, kuchiki byakuya, bleach, long black hair, senbonzakura kageyoshi, cherry blossom petals, blades',
  'tensa-zangetsu': '1boy, kurosaki ichigo, bleach, orange hair, bankai, tensa zangetsu, black sword, black coat',
  'kyoka-suigetsu': '1boy, aizen sousuke, bleach, brown hair, glasses off, kyouka suigetsu, illusion, shattering mirror',
  'mascara-hollow': '1boy, kurosaki ichigo, bleach, hollow mask, red markings, glowing yellow eyes, dark aura',

  // ── Yu Yu Hakusho / Mob / Re:Zero / Steins;Gate / Code Geass ───────────────
  'dragao-das-chamas-negras': '1boy, hiei (yuu yuu hakusho), yuu yuu hakusho, spiky black hair, jagan eye, black dragon flame, bandaged arm',
  'reigan': '1boy, urameshi yuusuke, yuu yuu hakusho, black hair, green uniform, spirit gun, finger pointing, blue energy',
  'modo-100': '1boy, kageyama shigeo, mob psycho 100, bowl cut, black gakuran, school uniform pants, psychic aura, explosion of colors, floating, 100%',
  'retorno-pela-morte': '1boy, natsuki subaru, re:zero kara hajimeru isekai seikatsu, tracksuit, black hands from shadows, clock',
  'magia-de-roswaal': '1boy, roswaal l. mathers, re:zero kara hajimeru isekai seikatsu, clown makeup, heterochromia, floating, fire magic',
  'time-leap': '1boy, okabe rintarou, steins;gate, lab coat, phone to ear, divergence meter, time distortion',
  'olho-do-geass': '1boy, lelouch lamperouge, code geass, geass, red bird symbol in eye, cape, commanding pose',

  // ── Fullmetal Alchemist ────────────────────────────────────────────────────
  'lamina-de-automail': '1boy, edward elric, fullmetal alchemist, blonde braid, red coat, automail arm blade, alchemy sparks',
  'pedra-filosofal': 'no humans, philosopher\'s stone, fullmetal alchemist, glowing red stone, transmutation circle, souls',
  'relogio-de-alquimista-federal': 'no humans, pocket watch, fullmetal alchemist, silver state alchemist watch, dragon engraving, alchemy circle',
  'troca-equivalente': '1boy, edward elric, fullmetal alchemist, clapping hands, transmutation circle, blue lightning, alchemy',
  'alquimia-das-chamas': '1boy, roy mustang, fullmetal alchemist, military uniform, snapping fingers, flame alchemy, explosion',

  // ── Attack on Titan ────────────────────────────────────────────────────────
  'lancas-trovao': '1girl, fully clothed, mikasa ackerman, shingeki no kyojin, thunder spears, explosion, survey corps',
  'laminas-de-aco-ultraduro': '1boy, levi (shingeki no kyojin), shingeki no kyojin, dual blades, spinning attack, survey corps',
  'coordenada': '1boy, eren yeager, shingeki no kyojin, long hair, paths, glowing tree of light, desert of stars',
  'capa-da-tropa-de-exploracao': 'no humans, survey corps cloak, shingeki no kyojin, wings of freedom emblem, wind, walls',
  'soro-de-tita': 'no humans, syringe, shingeki no kyojin, glowing titan serum, box, dark cellar',
  'equipamento-3d': '1boy, levi (shingeki no kyojin), shingeki no kyojin, omni-directional mobility gear, flying between buildings, cables',
  'transformacao-em-tita': '1boy, eren yeager, shingeki no kyojin, titan shifting, lightning strike, attack titan emerging',
  'rugido-do-tita-fundador': 'no humans, founding titan, shingeki no kyojin, colossal titans, rumbling, roaring, massive',

  // ── Katekyo Hitman Reborn! ─────────────────────────────────────────────────
  'luvas-de-ignicao': '1boy, sawada tsunayoshi, katekyo hitman reborn!, dying will flame, x gloves, orange flame on forehead',
};

/**
 * Coleção 2. Personagens femininas aparecem só em plano aberto ou são trocadas
 * por arte de objeto/cena: o modelo tende a sexualizar, e o público é infantil.
 */
export const ART_PROMPTS_2: Record<string, string> = {
  // Água
  'roda-dagua': '1boy, kamado tanjirou, kimetsu no yaiba, checkered haori, water breathing, water wheel slash, spinning, water splash',
  'tiro-de-tubarao': '1boy, arlong, one piece, fishman, saw nose, shark teeth, firing water bullet, ocean',
  'chicote-dagua': 'no humans, avatar: the last airbender, water whip, waterbending, swirling water tendril, arctic ocean, ice floes',
  'cha-do-tio-iroh': '1boy, iroh, avatar: the last airbender, old man, grey beard, smiling, holding cup of tea, teapot, cozy tea shop',
  'hidrificacao': '1boy, hoozuki suigetsu, naruto (series), white hair, purple eyes, shark teeth, body turning into water, splash',
  'guarda-chuva-do-totoro': 'no humans, totoro, tonari no totoro, giant grey forest spirit, holding umbrella, rain, bus stop, night',
  'mestre-urokodaki': '1boy, urokodaki sakonji, kimetsu no yaiba, red tengu mask, blue haori, pointing, training, mountain mist',
  'chuva-constante': 'no humans, tenki no ko, heavy rain over city, rooftop, light rays through clouds, puddles, reflections',
  'dragao-dagua': '1boy, hatake kakashi, naruto (series), silver hair, mask, headband over eye, water dragon jutsu, giant water dragon, lake',
  'karate-tritao': '1boy, jinbe, one piece, fishman, blue skin, kimono, fishman karate, punching through water shockwave',
  'prisao-de-agua': '1boy, hoshigaki kisame, naruto (series), blue skin, gills, akatsuki cloak, water prison jutsu, sphere of water',
  'calmaria': '1boy, tomioka giyuu, kimetsu no yaiba, half-and-half haori, eleventh form dead calm, still water surface, sword ready',
  'clima-tact': 'no humans, clima-tact, one piece, blue weather staff, small thunder cloud above, rain drops, ship deck',
  'grand-line': 'no humans, one piece, going merry, pirate ship sailing, huge ocean waves, blue sky, grand line',
  'cinco-tubaroes-famintos': '1boy, hoshigaki kisame, naruto (series), akatsuki cloak, five water sharks, sharks attacking, ocean',
  'bencao-da-agua-sagrada': 'no humans, kono subarashii sekai ni shukufuku wo!, holy water fountain, glowing blue water, blessing light, sparkles',
  'contracorrente': 'no humans, avatar: the last airbender, huge water wave rising, deflecting fire blast, ocean, dramatic',
  'mil-tubaroes': '1boy, hoshigaki kisame, naruto (series), samehada, thousand water sharks, water dome, shark swarm',
  'buraikan': '1boy, jinbe, one piece, fishman, blue skin, kimono, buraikan, massive water shockwave punch, ocean splitting',
  // Planta
  'estrela-verde': '1boy, usopp, one piece, long nose, bandana, slingshot kabuto, green star seed, plants sprouting',
  'lanca-de-madeira': '1boy, ishigami senkuu, dr. stone, spiky green-white hair, wooden spear, stone world forest',
  'erva-medicinal': 'no humans, medicinal herbs, mortar and pestle, glowing green leaves, wooden table, sunlight',
  'kodama': 'no humans, kodama, mononoke hime, small white forest spirits, many, mossy forest, sunlight',
  'estilingue-kabuto': 'no humans, kabuto (one piece), one piece, large slingshot, on wooden deck, seeds, sunset',
  'armadura-de-madeira': 'no humans, wooden armor on stand, bark texture, leaves, forest workshop, fantasy item',
  'raizes-presas': 'no humans, mononoke hime, giant tree roots rising from ground, grabbing, forest, glowing moss',
  'floresta-densa': 'no humans, mononoke hime, dense ancient forest, giant trees, mist, sunbeams, deer silhouette',
  'floresta-nativa': 'no humans, wood jutsu, trees erupting from ground, forest growing fast, dramatic, green light',
  'chicote-de-videira': '1boy, black clover, mage, vine whip, green magic, grimoire, forest',
  'arvore-mundial': '1boy, william vangeance, black clover, mask, long hair, world tree magic, giant tree, glowing',
  'polen-sonifero': 'no humans, sousou no frieren, glowing pollen, flower field, sleepy haze, night, fireflies',
  'planta-carnivora': 'no humans, one piece, giant carnivorous plant, venus flytrap, sharp teeth, jungle',
  'espada-de-madeira': '1boy, sakata gintoki, gintama, silver permed hair, white kimono, wooden sword, lazy expression',
  'campo-de-flores': 'no humans, sousou no frieren, endless flower field, blue sky, petals floating, magic sparkles',
  'nascimento-das-arvores': '1boy, senju hashirama, naruto (series), long black hair, red armor, wood release, massive forest birth',
  'modo-sabio-dos-sapos': '1boy, jiraiya (naruto), naruto (series), white long hair, red markings, sage mode, toads on shoulders',
  'espirito-da-floresta': 'no humans, shishigami, mononoke hime, forest spirit deer, glowing, lake, night, flowers blooming under steps',
  'buda-de-mil-maos': '1boy, senju hashirama, naruto (series), red armor, wood release, giant thousand-armed buddha statue, battlefield',
  // Veneno
  'ferrao-de-borboleta': 'no humans, kimetsu no yaiba, thin stinger sword, purple butterfly, wisteria flowers, poison drop, night',
  'picada-de-vespa': 'no humans, giant poison wasp, stinger, purple venom, forest, dramatic lighting',
  'ferroada-de-escorpiao': 'no humans, giant scorpion, poison tail, desert, sand, sunset',
  'bomba-de-gas': '1boy, boku no hero academia, villain, gas mask, green poison gas cloud, school building',
  'antidoto': '1boy, ishigami senkuu, dr. stone, spiky green-white hair, holding glass flask, laboratory, science',
  'nuvem-toxica': 'no humans, purple toxic cloud, swamp, dead trees, glowing, fog',
  'adaga-envenenada': 'no humans, dagger with purple poison dripping, on stone, dark dungeon, fantasy item',
  'pantano-venenoso': 'no humans, poison swamp, bubbling purple water, dead trees, fog, night',
  'hidra': '1boy, magellan (one piece), one piece, demon horns, prison warden, hydra, poison dragon made of venom',
  'ashisogi-jizo': '1boy, kurotsuchi mayuri, bleach, face paint, strange headdress, ashisogi jizou, poison sword',
  'veneno-de-glicinia': 'no humans, kimetsu no yaiba, wisteria flowers, purple petals, butterflies, night, glowing',
  'salamandra-venenosa': 'no humans, naruto (series), giant salamander, poison mist, rain village, dramatic',
  'mascara-de-gas': 'no humans, dr. stone, handmade gas mask, laboratory table, flasks, green smoke',
  'sangue-toxico': '1boy, choso (jujutsu kaisen), jujutsu kaisen, spiky hair tied, mark across nose, blood manipulation, blood spheres',
  'demonio-do-veneno': '1boy, magellan (one piece), one piece, venom demon, giant poison demon behind, prison',
  'mil-insetos': '1boy, aburame shino, naruto (series), sunglasses, high collar coat, swarm of insects, forest',
  'veneno-paralisante': 'no humans, naruto (series), wooden puppet, poison needles, chakra strings, purple mist',
  'konjiki-ashisogi-jizo': '1boy, kurotsuchi mayuri, bleach, bankai, giant golden baby-faced caterpillar, poison mist',
  // Gelo
  'estacas-de-gelo': 'no humans, re:zero kara hajimeru isekai seikatsu, ice spikes erupting, snowy forest, blue glow',
  'ice-make-aguia': '1boy, lyon vastia, fairy tail, white hair, ice make eagles, ice birds flying, snow',
  'bola-de-neve': 'no humans, puck (re:zero), re:zero kara hajimeru isekai seikatsu, small grey cat spirit, snowball, snowflakes, cute',
  'barreira-de-gelo': 'no humans, avatar: the last airbender, ice wall, frozen barrier, arctic, blocking fire',
  'espada-de-cristal-de-gelo': 'no humans, ice crystal sword, frost aura, snowy mountain, fantasy item',
  'armadura-de-gelo': 'no humans, armor made of ice, standing, frost, glacier cave, fantasy item',
  'tundra': 'no humans, frozen tundra, aurora, snow storm, mountains, night',
  'partisan-de-gelo': '1boy, kuzan (aokiji), one piece, tall, curly hair, sleeping mask on forehead, ice spears, frozen sea',
  'primeira-danca-tsukishiro': 'no humans, bleach, white katana, ice circle on ground, ice pillar rising to sky, moon',
  'puck-o-espirito': 'no humans, puck (re:zero), re:zero kara hajimeru isekai seikatsu, small grey cat spirit, glowing, ice magic, snow',
  'espelhos-de-gelo': '1boy, haku (naruto), naruto (series), mask, ice mirrors, surrounding dome of mirrors, mist',
  'era-glacial': 'no humans, one piece, punk hazard, frozen half island, ice and fire, giant glacier',
  'lotus-de-gelo': '1boy, douma (kimetsu no yaiba), kimetsu no yaiba, rainbow eyes, smiling, ice lotus, fans, frost',
  'formacao-de-gelo': 'no humans, jujutsu kaisen, ice formation, giant ice spikes, frozen battlefield, night',
  'hakka-no-togame': 'no humans, bleach, white frozen world, ice crystals, snow, frozen silhouette, silence',
  'ice-age': '1boy, kuzan (aokiji), one piece, tall, curly hair, ice age, freezing the entire sea, epic scale',
  // Terra
  'caixao-de-areia': '1boy, gaara, naruto (series), red hair, kanji tattoo on forehead, sand coffin, sand gourd',
  'muralha-de-pedra': 'no humans, avatar: the last airbender, earthbending, huge rock wall rising, dust, battlefield',
  'punho-de-rocha': '1boy, jura neekis, fairy tail, bald, tall, iron rock fist, rock golem arm',
  'cabaca-de-areia': 'no humans, naruto (series), sand gourd, desert, sand swirling, sunset',
  'areia-movedica': 'no humans, one piece, quicksand, desert, alabasta, sand whirlpool',
  'deserto': 'no humans, one piece, alabasta, endless desert, dunes, blazing sun, ruins',
  'sables': '1boy, crocodile (one piece), one piece, slicked hair, scar, hook hand, fur coat, sand tornado',
  'espinhos-de-pedra': '1boy, edward elric, fullmetal alchemist, blonde braid, red coat, hands on ground, stone spikes erupting',
  'inquebravel': '1boy, kirishima eijirou, boku no hero academia, red spiky hair, hardened skin, rock armor, grinning',
  'couraca-do-tita-encouracado': 'no humans, armored titan, shingeki no kyojin, armored skin, standing, city walls',
  'machado-e-mangual': '1boy, himejima gyoumei, kimetsu no yaiba, tall, prayer beads, tears, spiked flail and axe, chain',
  'alquimia-artistica': '1boy, alex louis armstrong, fullmetal alchemist, bald, mustache, muscular, military uniform, sparkles, stone statue',
  'funeral-do-deserto': '1boy, gaara, naruto (series), red hair, sand tsunami, desert imperial funeral, huge sand wave',
  // Elétrico
  'descarga-de-um-milhao-de-volts': '1boy, kaminari denki, boku no hero academia, blonde hair, black lightning streak, electricity burst',
  'chidori-senbon': '1boy, uchiha sasuke, naruto (series), lightning needles, electricity, sharingan',
  'bateria-caseira': '1boy, ishigami senkuu, dr. stone, spiky hair, homemade battery, sparks, lightbulb',
  'bastao-dourado': 'no humans, one piece, golden staff, lightning crackling, skypiea clouds',
  'chidori': '1boy, uchiha sasuke, naruto (series), black hair, sharingan, chidori, lightning in hand, running',
  'raikiri': '1boy, hatake kakashi, naruto (series), silver hair, mask, raikiri, lightning blade, sharingan',
  'dragao-do-raio': '1boy, laxus dreyar, fairy tail, blonde hair, scar over eye, fur coat, lightning dragon roar',
  'para-raios': 'no humans, one piece, lightning rod on sky island, lightning strike, clouds, dramatic',
  'railgun': 'no humans, toaru kagaku no railgun, coin launched with orange electricity beam, city night, sparks',
  'raigo': '1boy, enel (one piece), one piece, drums on back, earlobes, lightning god, giant thunder cloud ball',
  // Vento
  'respiracao-do-vento': '1boy, shinazugawa sanemi, kimetsu no yaiba, white spiky hair, scars, wind breathing, green wind slash',
  'planador': 'no humans, kaze no tani no nausicaa, small white glider flying over valley, wind, sky, wide shot',
  'penas-afiadas': '1boy, hawks (boku no hero academia), boku no hero academia, red wings, blonde hair, feathers flying',
  'rasengan': '1boy, uzumaki naruto, naruto (series), orange jumpsuit, rasengan, blue spinning sphere in hand',
  'tatsumaki': '1boy, roronoa zoro, one piece, green hair, three swords, tornado slash, wind',
  'dobra-de-ar': '1boy, aang, avatar: the last airbender, child, bald, blue arrow tattoo, orange monk robes, air scooter, wind',
  'rasenshuriken': '1boy, uzumaki naruto, naruto (series), sage mode, rasenshuriken, giant wind shuriken',
  'ceus-de-skypiea': 'no humans, one piece, skypiea, sky island, white clouds sea, giant beanstalk, blue sky',
  // Luta
  'folha-furacao': '1boy, rock lee, naruto (series), bowl cut, thick eyebrows, green jumpsuit, leaf hurricane kick',
  'soco-normal': '1boy, saitama (one-punch man), one-punch man, bald, yellow suit, cape, punching, bored expression',
  'cem-flexoes-por-dia': '1boy, saitama (one-punch man), one-punch man, bald, training, push ups, sweat, park',
  'lotus-primario': '1boy, rock lee, naruto (series), green jumpsuit, primary lotus, bandages unwrapping, high speed',
  'socos-normais-consecutivos': '1boy, saitama (one-punch man), one-punch man, bald, yellow suit, consecutive punches, many fists',
  'roupa-pesada-do-piccolo': '1boy, piccolo, dragon ball, green skin, weighted cape and turban, heavy clothes dropping',
  'oito-portoes': '1boy, might guy, naruto (series), bowl cut, green jumpsuit, eight gates, red steam aura',
  'united-states-of-smash': '1boy, all might, boku no hero academia, muscular, blonde hair, smiling, united states of smash, giant punch',
  // Fogo
  'bola-de-fogo': '1boy, uchiha sasuke, naruto (series), fireball jutsu, huge fireball from mouth, sharingan',
  'calcifer': 'no humans, calcifer, howl no ugoku shiro, fire demon, fireplace, smiling flame, cozy',
  'diable-jambe': '1boy, sanji (one piece), one piece, blonde hair, suit, flaming leg kick, diable jambe',
  'sol-nascente': '1boy, rengoku kyoujurou, kimetsu no yaiba, flame hair, flame haori, flame breathing, rising sun slash',
  'amaterasu': '1boy, uchiha itachi, naruto (series), mangekyou sharingan, black flames, amaterasu, akatsuki cloak',
  // Fantasma, Aço, Sombra
  'dimple': 'no humans, dimple (mob psycho 100), mob psycho 100, green spirit, smiling, floating, city',
  'turbo-vovo': 'no humans, dandadan, ghost, turbo granny silhouette, running at super speed, tunnel, spooky',
  'sem-rosto': 'no humans, kaonashi, sen to chihiro no kamikakushi, no-face spirit, black body, white mask, bathhouse',
  'maldicao-de-rika': 'no humans, orimoto rika, jujutsu kaisen, giant cursed spirit, glowing eyes, dark aura',
  'amor-puro': '1boy, okkotsu yuuta, jujutsu kaisen, white uniform, katana, giant cursed spirit rika behind',
  'shuriken-gigante': 'no humans, naruto (series), giant fuma shuriken spinning, forest, motion blur',
  'afiar-a-lamina': '1boy, haganezuka hotaru, kimetsu no yaiba, hyottoko mask, sharpening sword, blacksmith',
  'oni-giri': '1boy, roronoa zoro, one piece, green hair, three sword style, oni giri, sword in mouth',
  'imitacao-de-sombra': '1boy, nara shikamaru, naruto (series), pineapple hair, shadow possession jutsu, shadows stretching',
  'getsuga-tensho': '1boy, kurosaki ichigo, bleach, orange hair, shinigami robe, getsuga tenshou, blue energy slash',
};
