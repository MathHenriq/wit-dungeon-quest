# Pacote do GPT: Masmorra (Soul Knight do WIT, tema Solo Leveling)

Texto para mandar ao Cowork. Cada bloco de código é um prompt; o título em negrito é o **nome do arquivo**.
Plano completo: `docs/plano-masmorra.md`.

## Regras (vale para todas as imagens)

- Salvar em `public/Novos assets/masmorra/<pasta>/<arquivo>.png` (a pasta vem em cada seção).
- Fundo **magenta chapado #FF00FF** (o importador recorta). Nada encostando na borda do quadro.
- Pixel art limpa, contorno escuro, **sem anti-aliasing**, vista de cima em 3/4 (como Pokémon HeartGold/SoulSilver).
- Público infantil: **sem sangue, sem gore, nada sexualizado, nada assustador demais**; inimigos fofos-bravos.
- **Sem texto, letras ou números** na imagem. Nada de personagem ou logo de anime existente: tudo original.
- Grade exata: quadros do mesmo tamanho, sem espaço entre eles, na ordem pedida.
- Revisar cada imagem antes de mandar (o Claude revisa de novo na importação).
- Devolver: zip no rascunho de Release `Assets` do GitHub, ou direto na pasta.

## Ordem de prioridade

1. Inimigos (§3) e piso/parede do rank E (§4) — trocam a arte provisória do que mais aparece.
2. Boneco: golpe, tiro e esquiva (§2).
3. Armas e tiros (§5).
4. Portal, saguão e itens (§4, §6, §7).
5. Efeitos das 67 cartas (§1) — pode ir aos poucos; enquanto falta, o jogo usa o efeito do elemento.
6. Chefes dos outros ranks, sombras do Arise (§3, §8).

---

## 1. Efeitos das cartas de Ataque Épica+ (67 folhas)

Pasta `efeitos/`, arquivo `<id>.png`. Uma folha por carta: **6 quadros em linha, cada um 96 × 96** (folha 576 × 96).
Troque `{DESCRICAO}` e `{CORES}` pela linha da tabela.

```
A pixel art visual effect sprite sheet for a kids action RPG, 6 frames in a single row, each frame exactly 96x96 pixels (sheet 576x96), top-down 3/4 view. The effect: {DESCRICAO}. Main colors: {CORES}. Frames go from wind-up (frame 1) to full impact (frames 3-4) to fade-out (frame 6). Only the effect itself: no character, no hands holding it, no ground, no blood, no gore, not scary. Original design, no existing anime characters or symbols. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters. Flat solid magenta background (#FF00FF).
```

Cores por elemento (para `{CORES}`):
Fire = orange, red and yellow · Water = deep blue, cyan and white · Grass = leaf green, pink and white · Electric = bright yellow, white and light blue · Ice = icy cyan, white and pale blue · Fighting = orange, white and golden yellow · Poison = purple, toxic green and black · Ground = sand brown, ochre and dark brown · Flying = white, sky cyan and pale grey · Ghost = violet, lilac and dark purple · Dark = black, deep purple and crimson · Steel = silver, steel blue and white.

| # | id (arquivo) | Elemento | {DESCRICAO} |
|---|---|---|---|
| 1 | black-flash | Fighting* | a single punch impact that bursts into crackling black lightning sparks with a red outline (colors: black, red, white) |
| 2 | dragao-das-chamas-negras | Dark | a coiling serpent dragon made of black flames with a purple glow, shooting forward |
| 3 | espada-demoniaca-ragnarok | Dark | a huge dark sword slash that leaves a black and crimson crescent wave |
| 4 | espada-z | Steel | a bright silver blade slash leaving a white and gold arc of light |
| 5 | final-flash | Electric | a massive yellow energy beam fired in a straight line, with crackling edges |
| 6 | fogo-infernal | Fire | a pillar of roaring flames erupting from the ground |
| 7 | foice-da-morte | Ghost | a ghostly scythe sweeping in a wide crescent, leaving purple wisps |
| 8 | funeral-do-deserto | Ground | a wave of sand rising from the ground and closing like a giant hand, then collapsing into dust |
| 9 | furia-de-kamish | Fire | a giant beam of fire shaped like a roaring lizard head (original creature) rushing forward |
| 10 | gae-bolg | Steel | a crimson spear thrown forward that splits into many small red spear tips (colors: crimson, silver) |
| 11 | golpe-conquistador | Fighting | a powerful downward fist slam that creates a golden shockwave ring |
| 12 | hakka-no-togame | Ice | white frost spreading in a circle and freezing into beautiful ice flowers |
| 13 | hinokami-kagura | Fire | a sword swing leaving a spiral ribbon of flame like a sun dance |
| 14 | howitzer-impact | Fire | a spinning tornado of fire that crashes into the ground and explodes |
| 15 | kagune-liberado | Dark | four glossy dark red crystal tendrils lashing forward like blades (crystal look, not organic) |
| 16 | kamehameha | Water | a glowing blue energy ball that fires a wide blue energy wave forward |
| 17 | katana-parte-alma | Steel | a quick katana slash that leaves a glowing blue soul-wisp line |
| 18 | konjiki-ashisogi-jizo | Poison | a golden halo appears in the air and releases a heavy purple poison cloud |
| 19 | lanca-invertida-do-ceu | Steel | a jagged silver spear thrust that shatters a glowing blue magic barrier into shards |
| 20 | mil-tubaroes | Water | a swarm of many small cute cartoon water sharks rushing forward in a wave |
| 21 | mjolnir | Electric | a heavy hammer strike from above that calls down a thick yellow lightning bolt |
| 22 | murasame | Poison | a dark green katana slash leaving drops of purple poison |
| 23 | punho-divergente | Fighting | a punch impact followed by a delayed second ring of blue-white energy |
| 24 | punho-kaiju | Fighting | a giant monster fist made of orange energy slamming the ground |
| 25 | railgun | Electric | a coin flicked into the air and fired as a thin orange and yellow electric beam |
| 26 | rasenshuriken | Flying | a spinning wind shuriken made of white-cyan air blades around a glowing blue core |
| 27 | rhitta | Fire | a giant axe swing that leaves a huge sun-like fire explosion |
| 28 | senbonzakura | Grass | a storm of thousands of tiny pink cherry blossom petals swirling forward like blades |
| 29 | smash-do-one-for-all | Fighting | a punch surrounded by green lightning sparks that releases a huge wind blast (colors: green, white, yellow) |
| 30 | turbo | Ghost | a violet ghostly speed streak with spectral afterimages and a glowing wheel trail |
| 31 | united-states-of-smash | Fighting | a double-fisted overhead smash that creates a massive white wind crater |
| 32 | ataque-giratorio | Flying | a spinning whirlwind blade slash in a full circle |
| 33 | beru-o-rei-formiga | Poison | a shadow silhouette of an original ant knight slashing with glowing purple claws |
| 34 | big-bang-attack | Electric | a blue-white energy sphere fired from an open palm that explodes into a big blast |
| 35 | buda-de-mil-maos | Grass | a giant golden wooden palm made of many hands slamming down from above |
| 36 | buraikan | Water | a giant spinning water vortex rising like a tornado |
| 37 | contrato-com-o-diabo | Dark | a dark magic circle on the ground that summons a horned shadow (original, cute but menacing) which slashes once |
| 38 | enuma-elish | Flying | a red and black spiral wind drill that tears the air with red cracks |
| 39 | excalibur | Steel | a huge golden light beam from a raised holy sword, sweeping forward (colors: gold, white) |
| 40 | genki-dama | Flying | a giant blue-white glowing energy sphere descending from above |
| 41 | kamui-raikiri | Electric | a blue lightning blade thrust with a small swirling dark portal behind it |
| 42 | kirin | Electric | a giant lightning bolt shaped like an original sky dragon striking down from above |
| 43 | kong-gun | Fighting | a giant inflated orange fist punch that releases a ring shockwave |
| 44 | makankosappo | Dark | a thin drill beam of yellow light wrapped by a spiraling purple coil |
| 45 | matadora-de-dragoes | Steel | a massive iron greatsword horizontal swing with a heavy black and silver trail |
| 46 | nevoa-obscura | Flying | a swirling grey-white fog that spreads over the area, with sparkles inside |
| 47 | nona-forma-rengoku | Fire | a giant flame slash shaped like a roaring tiger (original) |
| 48 | raigo | Electric | a large dragon head (original) made of pure electricity, biting forward |
| 49 | red-hawk | Fire | a fiery punch whose flames spread like bird wings |
| 50 | reigan | Ghost | a small spirit bullet of glowing teal and purple energy fired from a fingertip, leaving a trail |
| 51 | sessenta-e-quatro-palmas | Fighting | a rapid burst of many light-blue palm strike marks appearing in a circle (colors: light blue, white) |
| 52 | star-burst-stream | Steel | a rapid flurry of 16 blue and black dual-sword slashes |
| 53 | tensa-zangetsu | Dark | a black crescent energy slash with a red outline flying forward |
| 54 | tita-de-ataque | Fighting | a giant stomp from a huge cartoon foot (only the foot) that cracks the ground |
| 55 | zoltraak | Dark | a white and purple magic beam fired from a glowing magic circle, in a straight line |
| 56 | amaterasu | Fire | black flames that appear on the target and burn steadily (colors: black, dark red) |
| 57 | bajrang-gun | Fighting | an enormous golden fist falling from the sky like a meteor |
| 58 | decima-terceira-forma | Fire | twelve flame sword arcs appearing one after another and forming a circle of fire |
| 59 | fuga | Fire | an arrow of fire launched from a bow made of flames, exploding into a dome of fire |
| 60 | gon-adulto | Fighting | a giant punch charged with a yellow aura that explodes on impact |
| 61 | modo-demonio | Dark | a dark red and black aura bursting outward with a horned shadow silhouette (not scary) |
| 62 | sanzen-sekai | Steel | a three-blade tornado slash with green and silver arcs |
| 63 | tengai-shinsei | Ground | a huge rock meteor falling from the sky and crashing into the ground |
| 64 | tita-colossal | Fire | a giant column of steam and fire exploding from the ground with a huge shockwave |
| 65 | vazio-roxo | Ghost | a red orb and a blue orb merging into a purple sphere that erases everything in a straight line |
| 66 | modo-100 | Ghost | an explosion of violet psychic energy waves radiating outward |
| 67 | soco-serio | Fighting | one simple punch that creates a gigantic white shockwave splitting the clouds |

\* Quando a linha traz `(colors: ...)`, use essas cores no lugar das do elemento.

---

## 2. Boneco do aluno: golpe, tiro, esquiva, conjurar

Pasta `personagem/`. **Anexar `public/Novos assets/personagem/modelos/modelo-01.png`** (depois repetir com 02…10).
Mesmas cores-molde dos modelos (o jogo pinta). Quadro do mesmo tamanho da folha de andar.

**modelo-01-combate.png** (4 colunas × 4 linhas: linha 1 de frente, 2 para a esquerda, 3 para a direita, 4 de costas)
```
Using the attached sprite sheet as the exact reference for this character (same hair, clothes, placeholder colors: skin #E8B48C, hair flat cyan #20B4C8, top flat green #3CB44A, bottom flat royal blue #3456C8, white sneakers; same frame size, proportions and outline), draw a combat sprite sheet of the SAME character in a grid of 4 columns and 4 rows. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. In every row: frame 1 sword wind-up (arm pulled back, empty hand gripping an invisible handle), frame 2 sword swing mid-motion, frame 3 sword swing follow-through, frame 4 shooting pose (one arm stretched forward, hand gripping an invisible gun). The hands are empty: the game draws the weapon. Only the placeholder colors, 3 shades each. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No weapon, no effects, no shadow, no text.
```

**modelo-01-esquiva.png** (4 colunas × 4 linhas, mesma ordem de direções)
```
Using the attached sprite sheet as the exact reference for this character (same hair, clothes, placeholder colors, frame size and outline), draw a dodge-roll sprite sheet of the SAME character in a grid of 4 columns and 4 rows. Row 1 rolling toward the viewer, row 2 rolling left, row 3 rolling right, row 4 rolling away. Frames 1 to 4: crouch, curled ball mid-roll, curled ball upside down, landing crouch. Only the placeholder colors, 3 shades each. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No motion lines, no shadow, no text.
```

**modelo-01-magia.png** (4 colunas × 1 linha, de frente)
```
Using the attached sprite sheet as the exact reference for this character (same hair, clothes, placeholder colors, frame size and outline), draw 4 frames of the SAME character facing the viewer in a single row: frame 1 holding a playing card up in one hand, frame 2 throwing the card forward with the arm stretched, frame 3 hurt (leaning back, eyes squeezed shut), frame 4 knocked down sitting on the floor, dizzy. The card is plain white with no drawing. Only the placeholder colors, 3 shades each. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

---

## 3. Inimigos e chefes

Pasta `inimigos/`. Inimigo comum: **4 colunas × 4 linhas, quadro 48 × 48** (linha 1 de frente, 2 esquerda, 3 direita, 4 de costas; quadros 1–2 andando, 3–4 atacando).

Prompt base (troque `{BICHO}`):
```
A pixel art sprite sheet of an ORIGINAL cute-but-grumpy dungeon enemy for a kids game: {BICHO}. Grid of 4 columns and 4 rows, each frame exactly 48x48. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. Frames 1-2 walking, frames 3-4 attacking. Top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, chunky friendly proportions, clean dark outlines, limited palette, no anti-aliasing, no blood, not scary. Flat solid magenta background (#FF00FF). No shadow, no text.
```

| Arquivo | {BICHO} |
|---|---|
| goblin.png | a small green goblin with big ears, a leather cap and a wooden club; attack frames swing the club |
| goblin-arqueiro.png | a small green goblin archer with a hood and a short bow; attack frames pull and release an arrow |
| goblin-xama.png | a small green goblin shaman with a bone mask (cute), feathers and a staff with a glowing green gem; attack frames raise the staff |
| slime.png | a round bouncy blue slime with shiny highlights and angry eyebrows; attack frames squash and jump |
| morcego.png | a small purple cave bat with big eyes; attack frames dive with wings folded |
| lobo-sombrio.png | a dark blue shadow wolf with glowing purple eyes and a smoky tail; attack frames lunge forward |
| golem.png | a chunky stone golem with moss and glowing cyan crystal eyes; attack frames slam both fists down |

Chefes: **4 colunas × 3 linhas, quadro 96 × 96** (linha 1 andando de frente, linha 2 atacando, linha 3: pose de fúria da fase 2, cansado, derrotado sentado, desaparecendo em fumaça).
```
A pixel art sprite sheet of an ORIGINAL dungeon boss for a kids game: {CHEFE}. Grid of 4 columns and 3 rows, each frame exactly 96x96, facing the viewer. Row 1: 4 walking frames. Row 2: 4 attack frames. Row 3: (1) enraged power-up pose with aura, (2) tired panting, (3) defeated sitting on the floor dizzy, (4) fading into a puff of purple smoke. Top-down 3/4 view like Pokémon HeartGold/SoulSilver, imposing but friendly cartoon proportions, clean dark outlines, limited palette, no anti-aliasing, no blood, not scary. Flat solid magenta background (#FF00FF). No shadow, no text.
```

| Arquivo | Rank | {CHEFE} |
|---|---|---|
| chefe-e.png | E | a big goblin king with a tiny golden crown, a red cape and a huge spiked wooden club |
| chefe-d.png | D | a giant spider-like crypt guardian made of bones and lanterns (cute skull-less design, made of wood and glowing lanterns) |
| chefe-c.png | C | an ice troll with frosty blue fur and a giant icicle club |
| chefe-b.png | B | a lava golem with cracked black rock skin and glowing orange lava veins |
| chefe-a.png | A | a giant tree spirit knight with bark armor, a leaf cape and a thorny vine whip |
| chefe-s.png | S | a tall shadow monarch knight (original design) with black and violet armor, glowing purple eyes and a cape of smoke |

---

## 4. Lugares da masmorra

Pasta `lugares/`.

**portal.png** (4 quadros em linha, cada 96 × 128)
```
A pixel art animation sheet of a glowing blue dungeon gate, 4 frames in a single row, each frame 96x128: an upright oval portal of swirling blue and violet energy inside a broken stone frame with runes (no letters), sparkles drifting out, frames loop the swirl. Like a magical gate from a fantasy hunter story. Top-down 3/4 view, clean dark outlines, no anti-aliasing, no text. Flat solid magenta background (#FF00FF).
```

**piso-parede-{rank}.png** — uma folha por rank: `e` caverna de pedra cinza com musgo · `d` cripta de tijolo roxo com velas · `c` caverna de gelo azul · `b` caverna de lava preta e laranja · `a` floresta sombria com raízes · `s` castelo das sombras preto e violeta.
```
A pixel art tileset for a top-down 3/4 dungeon in a kids game, theme: {TEMA}. Grid of 4 columns and 3 rows, each tile exactly 32x32. Row 1: 4 floor tile variations that tile seamlessly. Row 2: 4 wall tiles seen from the front (wall top with a dark top edge, wall face), seamless left-right. Row 3: (1) wall corner, (2) floor with a small crack, (3) floor with a puddle or decoration, (4) floor with a glowing rune circle (no letters). Clean dark outlines, limited palette, no anti-aliasing, no text. Flat solid magenta background (#FF00FF) only where there is nothing.
```

**objetos.png** (4 colunas × 4 linhas, cada 64 × 64)
```
A pixel art sprite sheet of dungeon objects for a kids game, grid of 4 columns and 4 rows, each cell exactly 64x64, top-down 3/4 view: row 1: grey rock, cracked grey rock, copper ore vein in a rock, iron ore vein in a rock; row 2: gold ore vein in a rock, blue mana crystal cluster, small healing herb bush with red berries, glowing blue herb; row 3: wooden treasure chest closed, the same chest open with light, stone stairs going down into the floor, a metal elevator platform with a glowing panel; row 4: a closed energy door (blue laser bars), the same door opening, a breakable wooden barrel, a breakable clay pot. Clean dark outlines, limited palette, no anti-aliasing, no text. Flat solid magenta background (#FF00FF).
```

---

## 5. Armas e tiros

Pasta `armas/`. O boneco segura a arma pelo cabo, apontando para a direita (o jogo gira).

**armas-curtas.png** (4 × 2, quadro 48 × 48)
```
A pixel art sprite sheet of 8 ORIGINAL melee weapons for a kids action RPG, grid of 4 columns and 2 rows, each cell exactly 48x48, every weapon drawn horizontally pointing to the right with the handle on the left: (1) short steel sword, (2) katana with a blue wrap, (3) dagger with a green gem, (4) spear, (5) battle axe, (6) big wooden hammer, (7) scythe with a purple blade, (8) pair of metal gauntlets. Clean dark outlines, limited palette, small shine highlight, no anti-aliasing, no text. Flat solid magenta background (#FF00FF).
```

**armas-longas.png** (4 × 2, quadro 48 × 48)
```
A pixel art sprite sheet of 8 ORIGINAL ranged weapons for a kids action RPG, grid of 4 columns and 2 rows, each cell exactly 48x48, every weapon drawn horizontally pointing to the right with the grip on the left: (1) toy-like energy pistol, (2) crossbow, (3) short bow, (4) wooden magic staff with a red gem, (5) small magic wand with a star, (6) chunky hand cannon, (7) futuristic energy rifle with a green glow, (8) open floating magic book. Friendly sci-fi fantasy style, no realistic firearms, clean dark outlines, limited palette, no anti-aliasing, no text. Flat solid magenta background (#FF00FF).
```

**tiros.png** (4 × 4, quadro 16 × 16; cada linha uma animação de 4 quadros)
```
A pixel art sprite sheet of projectiles for a kids action RPG, grid of 4 columns and 4 rows, each cell exactly 16x16, each row one 4-frame animation: row 1 a yellow energy bullet, row 2 a wooden arrow flying right, row 3 a red magic orb, row 4 a pink enemy energy ball. Clean outlines, glowing colors, no anti-aliasing. Flat solid magenta background (#FF00FF).
```

---

## 6. Saguão da Associação

Pasta `saguao/`. Folha **4 × 2, quadro 128 × 128** (móveis grandes vistos de frente em 3/4).
```
A pixel art sprite sheet of furniture for the lobby of a hunters' association in a kids fantasy game, grid of 4 columns and 2 rows, each cell exactly 128x128, top-down 3/4 view: (1) a long reception counter with a glowing blue holographic screen (no letters), (2) a big quest board with blank paper notes and pins, (3) a wall rack of six small portal frames glowing in different colors (grey, purple, cyan, orange, green, black-violet), (4) a blacksmith anvil with a small forge and hammers, (5) a potion shop shelf with colorful bottles, (6) a big pet chest with a paw-print lid, (7) a stone pedestal with a floating blue system crystal, (8) a bench with a banner of a stylized sword and wing emblem (original, no letters). Clean dark outlines, limited palette, no anti-aliasing, no text. Flat solid magenta background (#FF00FF).
```

---

## 7. Ícones dos itens

Pasta `icones/`. Folha **4 × 3, quadro 32 × 32** (mesmo estilo de `public/game/icons/itens/`).
```
A pixel art icon sheet for a kids RPG inventory, grid of 4 columns and 3 rows, each icon exactly 32x32, centered, with a 1-pixel dark outline: row 1: copper ore chunk, iron ore chunk, gold ore chunk, healing herb leaf; row 2: blue glowing herb, small blue mana crystal, purple mana crystal, golden mana crystal; row 3: soft dark wolf fur tuft, a green goblin feather, a red health potion bottle, a blue mana potion bottle. Clean pixel art, limited palette, no anti-aliasing, no text. Flat solid magenta background (#FF00FF).
```

---

## 8. Sombras do Arise

Pasta `sombras/`. Igual aos inimigos comuns (**4 × 4, quadro 48 × 48**).
```
A pixel art sprite sheet of an ORIGINAL friendly shadow soldier ally for a kids game: {SOMBRA}, made of dark navy blue shadow with glowing violet eyes and a wispy smoky outline. Grid of 4 columns and 4 rows, each frame exactly 48x48. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. Frames 1-2 walking, frames 3-4 attacking. Top-down 3/4 view like Pokémon HeartGold/SoulSilver, cool and heroic, not scary, clean outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow on the ground, no text.
```
`sombra-soldado.png` = a shadow knight with a sword and shield · `sombra-arqueira.png` = a shadow archer with a long bow · `sombra-tanque.png` = a big shadow warrior with a huge shield.
