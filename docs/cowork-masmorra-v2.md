# Cowork: arte da masmorra (visual v2), pedido de 16/10

Para o Cowork gerar no ChatGPT, salvar no PC e devolver, igual às outras levas.
Cada bloco de código é **um prompt pronto** (nada para trocar); o título em negrito é o **nome do arquivo**.
Origem: `docs/gpt-masmorra.md` §2, §9 e §10.

## Como fazer

1. Gerar cada imagem no ChatGPT com o prompt do bloco. Quando o item pedir anexo, anexar o arquivo indicado.
2. Salvar no PC, na pasta do projeto, em `public/Novos assets/masmorra/<pasta>/<arquivo>.png` (a pasta vem em cada seção).
3. **Revisar cada imagem antes de salvar** e refazer a que falhar em qualquer item:
   - fundo magenta chapado (#FF00FF) e nada encostando na borda do quadro;
   - grade certa (colunas × linhas pedidas, quadros do mesmo tamanho, sem espaço entre eles);
   - pixel art limpa, contorno escuro, sem borrado;
   - **público infantil**: sem sangue, sem gore, nada sexualizado, nada assustador demais;
   - sem texto, letras ou números; nada de personagem ou logo de anime existente.
4. Ao terminar (ou a cada parte pronta), zipar a pasta `public/Novos assets/masmorra/` como `masmorra-v2.zip` e subir no rascunho de Release **"Assets Dungeon"** do GitHub (o mesmo da leva anterior). Depois avisar o Claude: ele baixa, revisa e importa.

Ordem de prioridade (se não der tempo de tudo, parar no fim de uma parte):

| Parte | O quê | Folhas |
|---|---|---|
| A | Golpes do caçador (corte, giro, estocada, poeira, faísca, clarão) | 1 |
| B | Efeitos por elemento (12 elementos) | 12 |
| C | Objetos que as cartas comuns jogam | 1 |
| D | Inimigos novos, perigos e salas | 9 |
| E | Poses de luta dos modelos 02 a 10 | 27 |

---

## Parte A: golpes do caçador

Pasta `golpes/`.

**golpes-jogador.png** (6 colunas × 6 linhas, quadro 64 × 64, folha 384 × 384)
```
A pixel art sprite sheet of melee and movement effects for a kids action RPG hero, top-down 3/4 view, grid of 6 columns and 6 rows, each cell exactly 64x64 pixels (sheet 384x384). Row 1: a light sword slash smear arc swinging from upper left to lower right, white core and light blue edge, 4 frames (thick crescent, then thinning from the tail, then a thin sliver, then small sparkles), cells 5-6 empty. Row 2: the same slash mirrored (lower left to upper right), 4 frames, cells 5-6 empty. Row 3: a big finishing slash, wider and brighter, white and golden, 4 frames, cells 5-6 empty. Row 4: a full 360-degree spin slash ring seen from above (flattened circle), orange and white, 6 frames from start to fade. Row 5: (1-4) a straight forward thrust streak pointing right, white and light blue, 4 frames; (5-6) a small dust puff, 2 frames. Row 6: (1-3) a hit spark star burst, white and yellow, 3 frames; (4-6) a gun muzzle flash pointing right, yellow and white, 3 frames. Only the effects, no character, no weapon, no blood. Clean dark outlines, limited palette, no anti-aliasing, no text. Flat solid magenta background (#FF00FF).
```

---

## Parte B: efeitos por elemento (12 folhas)

Pasta `efeitos-elemento/`. Cada folha: **6 colunas × 4 linhas, quadro 64 × 64** (folha 384 × 256).
- linha 1: projétil voando (4 quadros);
- linha 2: impacto (6 quadros);
- linha 3: área no chão (4 quadros);
- linha 4: feixe (início, corpo emendável, ponta).

Sugestão: anexar a primeira folha pronta nas seguintes, para manter o mesmo estilo.

**fire.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: fire. Main colors: orange, red and yellow. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small round fire projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a fire impact burst, 6 frames from small flash to full burst to fading sparks. Row 3: a fire ground area effect seen from above (a flat circle of flames on the floor with rising embers), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a fire energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (burst on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**water.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: water. Main colors: deep blue, cyan and white. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small round water projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a water splash impact burst, 6 frames from small flash to full splash to fading droplets. Row 3: a water ground area effect seen from above (a flat swirling puddle on the floor with rising droplets), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a water energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (splash on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**grass.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: grass and nature. Main colors: leaf green, pink and white. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small round leaf-and-petal projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a leafy impact burst, 6 frames from small flash to full burst of leaves and petals to fading. Row 3: a grass ground area effect seen from above (a flat circle of sprouting leaves and flowers on the floor), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a green nature energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (burst of leaves on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**electric.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: electric. Main colors: bright yellow, white and light blue. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small crackling electric orb projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: an electric impact burst, 6 frames from small spark to full lightning burst to fading sparks. Row 3: an electric ground area effect seen from above (a flat circle of crackling sparks on the floor), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a lightning energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (burst on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**ice.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: ice. Main colors: icy cyan, white and pale blue. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small ice shard projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: an ice impact burst, 6 frames from small flash to full burst of crystals to fading snowflakes. Row 3: an ice ground area effect seen from above (a flat frosty circle on the floor with small crystals growing), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a freezing energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (burst of crystals on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**fighting.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: martial arts energy. Main colors: orange, white and golden yellow. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small round fist-shaped energy projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a punch impact shockwave burst, 6 frames from small flash to full burst with a ring to fading sparks. Row 3: a ground area effect seen from above (a flat cracked shockwave circle on the floor with small pebbles), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a golden energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (burst on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**poison.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: poison. Main colors: purple, toxic green and black. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small round bubbling poison blob projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a poison splash impact burst, 6 frames from small flash to full splash of bubbles to fading. Row 3: a poison ground area effect seen from above (a flat bubbling purple puddle on the floor with small green bubbles rising), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a poison energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (bubbly burst on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture, nothing scary. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**ground.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: earth and sand. Main colors: sand brown, ochre and dark brown. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small spinning rock projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a rock and dust impact burst, 6 frames from small flash to full burst of pebbles and dust to fading. Row 3: an earth ground area effect seen from above (a flat swirling sand circle on the floor with small rocks), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a sand energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (dust burst on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture. Clean dark outlines, limited palette, strong colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**flying.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: wind. Main colors: white, sky cyan and pale grey. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small spinning wind blade projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a gust impact burst, 6 frames from small puff to full swirl to fading wisps. Row 3: a wind ground area effect seen from above (a flat swirling breeze circle on the floor with small leaves spinning), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a wind energy beam lying horizontally: cell 1 the beam origin (round swirl, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (swirl burst on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture. Clean dark outlines, limited palette, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**ghost.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: spirit magic. Main colors: violet, lilac and dark purple. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small round glowing spirit wisp projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a spirit impact burst, 6 frames from small flash to full burst of glowing wisps to fading. Row 3: a spirit ground area effect seen from above (a flat glowing magic circle on the floor with wisps rising), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a violet energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (burst on the right side), cells 4-6 empty. Only the effect: no characters, no faces, no hands, no ground texture, nothing scary. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**dark.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: shadow magic. Main colors: black, deep purple and crimson. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small round shadow orb projectile with a crimson glow flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a shadow impact burst, 6 frames from small flash to full burst of dark sparks to fading. Row 3: a shadow ground area effect seen from above (a flat dark swirling circle on the floor with purple sparks rising), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a shadow energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (burst on the right side), cells 4-6 empty. Only the effect: no characters, no faces, no hands, no ground texture, no blood, nothing scary. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

**steel.png**
```
A pixel art visual effect sprite sheet for a kids action RPG, element: steel blades. Main colors: silver, steel blue and white. Grid of 6 columns and 4 rows, each cell exactly 64x64 pixels (sheet 384x256), top-down 3/4 view. Row 1: a small spinning metal blade projectile flying to the right, 4 animation frames (cells 1-4), cells 5-6 empty. Row 2: a metal clash impact burst, 6 frames from small flash to full burst of sparks and shards to fading. Row 3: a steel ground area effect seen from above (a flat circle of glinting blade marks on the floor with sparks), 4 looping frames (cells 1-4), cells 5-6 empty. Row 4: a silver energy beam lying horizontally: cell 1 the beam origin (round glow, beam starting at the right edge), cell 2 a seamless beam body segment that touches the left and right edges and can repeat, cell 3 the beam tip hitting (spark burst on the right side), cells 4-6 empty. Only the effect: no characters, no hands, no ground texture. Clean dark outlines, limited palette, strong shine, no anti-aliasing, no text, no letters, original design. Flat solid magenta background (#FF00FF).
```

---

## Parte C: objetos que as cartas comuns jogam

Pasta `golpes/`.

**projeteis.png** (8 colunas × 6 linhas, quadro 32 × 32, folha 256 × 192)
```
A pixel art icon sheet of small magic projectiles for a kids action RPG, grid of 8 columns and 6 rows, each cell exactly 32x32 pixels (sheet 256x192), every object pointing to the right, in this order left to right, top to bottom: ball, blade crescent, spear, shark, playing card, hammer, star, shuriken, glowing orb sphere, dragon head, flower petal, water drop, water wave, moon crescent, fist, rock, snowball, needle, kunai, small sword, beetle, heart, crystal shard, arrow, lightning bolt, meteor, open palm hand, small sun, sand cloud, root tendril, ice shard, shadow wisp, stone pillar, tiger head, wings, lizard head, cloud, crater crack, wind swirl, decay mist, spider web, smoke puff, steam puff, light ray, magic orb. Bright readable colors, clean dark outline, limited palette, no anti-aliasing, no text, no letters, original designs, cute and not scary, no blood. The last 3 cells empty. Flat solid magenta background (#FF00FF).
```

---

## Parte D: inimigos novos, perigos e salas

Pasta `inimigos/` (7 folhas, **4 colunas × 4 linhas, quadro 48 × 48**; linha 1 de frente, 2 esquerda, 3 direita, 4 de costas; quadros 1–2 andando, 3–4 atacando).

**goblin-escudeiro.png**
```
A pixel art sprite sheet of an ORIGINAL cute-but-grumpy dungeon enemy for a kids game: a stocky green goblin holding a big round wooden shield with metal rim in front of him and a short spear; attack frames bash forward with the shield. Grid of 4 columns and 4 rows, each frame exactly 48x48. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. Frames 1-2 walking, frames 3-4 attacking. Top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, chunky friendly proportions, clean dark outlines, limited palette, no anti-aliasing, no blood, not scary. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**goblin-bombardeiro.png**
```
A pixel art sprite sheet of an ORIGINAL cute-but-grumpy dungeon enemy for a kids game: a small green goblin with goggles and a bag of round black cartoon bombs with short fuses; attack frames throw a bomb in an arc. Grid of 4 columns and 4 rows, each frame exactly 48x48. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. Frames 1-2 walking, frames 3-4 attacking. Top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, chunky friendly proportions, clean dark outlines, limited palette, no anti-aliasing, no blood, not scary. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**goblin-mago.png**
```
A pixel art sprite sheet of an ORIGINAL cute-but-grumpy dungeon enemy for a kids game: a small green goblin wizard with a pointy purple hat and a floating glowing playing card above his hand; attack frames flip the card. Grid of 4 columns and 4 rows, each frame exactly 48x48. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. Frames 1-2 walking, frames 3-4 attacking. Top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, chunky friendly proportions, clean dark outlines, limited palette, no anti-aliasing, no blood, not scary. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**invocador.png**
```
A pixel art sprite sheet of an ORIGINAL cute-but-grumpy dungeon enemy for a kids game: a hooded goblin summoner with a staff topped by a glowing violet orb and a small magic circle at his feet; attack frames raise the staff with sparkles. Grid of 4 columns and 4 rows, each frame exactly 48x48. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. Frames 1-2 walking, frames 3-4 attacking. Top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, chunky friendly proportions, clean dark outlines, limited palette, no anti-aliasing, no blood, not scary. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**toupeira-cavadora.png**
```
A pixel art sprite sheet of an ORIGINAL cute-but-grumpy dungeon enemy for a kids game: a grumpy brown mole with a tiny miner helmet and big claws; frames 1-2 walking, frame 3 half buried with only the helmet showing, frame 4 popping out of a dirt mound. Grid of 4 columns and 4 rows, each frame exactly 48x48. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. Top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, chunky friendly proportions, clean dark outlines, limited palette, no anti-aliasing, no blood, not scary. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**espirito.png**
```
A pixel art sprite sheet of an ORIGINAL cute-but-grumpy dungeon enemy for a kids game: a small round floating ghost wisp, pale lilac with a cute angry face and a wavy tail; attack frames lunge forward. Grid of 4 columns and 4 rows, each frame exactly 48x48. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. Frames 1-2 floating, frames 3-4 attacking. Top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, chunky friendly proportions, clean dark outlines, limited palette, no anti-aliasing, no blood, not scary. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**planta-torreta.png**
```
A pixel art sprite sheet of an ORIGINAL cute-but-grumpy dungeon enemy for a kids game: a rooted carnivorous-looking flower turret (cute, not scary) with a big round bud that opens to shoot leaves; frames 1-2 swaying, frames 3-4 opening and shooting. Grid of 4 columns and 4 rows, each frame exactly 48x48. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. Top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, chunky friendly proportions, clean dark outlines, limited palette, no anti-aliasing, no blood, not scary. Flat solid magenta background (#FF00FF). No shadow, no text.
```

Pasta `lugares/`.

**perigos.png** (4 colunas × 2 linhas, quadro 32 × 32)
```
A pixel art tileset of dungeon floor hazards for a kids game, grid of 4 columns and 2 rows, each tile exactly 32x32, top-down 3/4 view: row 1: (1) floor plate with small holes (spikes hidden), (2) the same plate glowing red (spikes about to rise), (3) the same plate with sharp silver spikes up, (4) a bubbling purple poison puddle; row 2: (1) a slippery light blue ice patch with shine, (2) a glowing orange lava tile with bubbles, (3) the same lava tile in a second bubble frame, (4) a red explosive barrel with a yellow warning stripe (no letters). Clean dark outlines, limited palette, no anti-aliasing, no text. Flat solid magenta background (#FF00FF) only around the barrel.
```

**salas.png** (4 colunas × 2 linhas, quadro 64 × 64)
```
A pixel art sprite sheet of special dungeon room objects for a kids fantasy game, grid of 4 columns and 2 rows, each cell exactly 64x64, top-down 3/4 view: row 1: (1) a stone blessing statue of a kneeling knight holding a glowing blue orb, (2) a mysterious hooded merchant with glowing yellow eyes sitting behind a small rug with items (friendly, not scary), (3) a standing iron lantern with a bright warm flame, (4) the same lantern with the flame out and a wisp of smoke; row 2: (1) a golden resurrection stone, a shiny gem with a small white cross of light inside (no letters), (2) a cracked stone wall section with light coming through the cracks, (3) a red challenge chest with a gold lock, (4) a round dark trapdoor with glowing blue runes (no letters). Clean dark outlines, limited palette, no anti-aliasing, no text. Flat solid magenta background (#FF00FF).
```

---

## Parte E: poses de luta dos modelos 02 a 10 (27 folhas)

Pasta `personagem/`. Para **cada modelo de 02 a 10**, gerar as 3 folhas abaixo **anexando o modelo** no ChatGPT:
`public/Novos assets/personagem/modelos/modelo-0N.png` (o modelo 10 é `modelo-10.png`).
Os nomes seguem o número do modelo: `modelo-02-combate.png`, `modelo-02-esquiva.png`, `modelo-02-magia.png`, ..., `modelo-10-magia.png`.
O mesmo boneco do anexo, com as **mesmas cores-molde** (o jogo pinta as cores do aluno por cima) e o mesmo tamanho de quadro da folha de andar.
O modelo 01 já está pronto e serve de exemplo de como deve ficar.

**modelo-0N-combate.png** (4 colunas × 4 linhas: linha 1 de frente, 2 para a esquerda, 3 para a direita, 4 de costas)
```
Using the attached sprite sheet as the exact reference for this character (same hair, clothes, placeholder colors: skin #E8B48C, hair flat cyan #20B4C8, top flat green #3CB44A, bottom flat royal blue #3456C8, white sneakers; same frame size, proportions and outline), draw a combat sprite sheet of the SAME character in a grid of 4 columns and 4 rows. Row 1 facing the viewer, row 2 facing left, row 3 facing right, row 4 facing away. In every row: frame 1 sword wind-up (arm pulled back, empty hand gripping an invisible handle), frame 2 sword swing mid-motion, frame 3 sword swing follow-through, frame 4 shooting pose (one arm stretched forward, hand gripping an invisible gun). The hands are empty: the game draws the weapon. Only the placeholder colors, 3 shades each. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No weapon, no effects, no shadow, no text.
```

**modelo-0N-esquiva.png** (4 colunas × 4 linhas, mesma ordem de direções)
```
Using the attached sprite sheet as the exact reference for this character (same hair, clothes, placeholder colors, frame size and outline), draw a dodge-roll sprite sheet of the SAME character in a grid of 4 columns and 4 rows. Row 1 rolling toward the viewer, row 2 rolling left, row 3 rolling right, row 4 rolling away. Frames 1 to 4: crouch, curled ball mid-roll, curled ball upside down, landing crouch. Only the placeholder colors, 3 shades each. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No motion lines, no shadow, no text.
```

**modelo-0N-magia.png** (4 colunas × 1 linha, de frente)
```
Using the attached sprite sheet as the exact reference for this character (same hair, clothes, placeholder colors, frame size and outline), draw 4 frames of the SAME character facing the viewer in a single row: frame 1 holding a playing card up in one hand, frame 2 throwing the card forward with the arm stretched, frame 3 hurt (leaning back, eyes squeezed shut), frame 4 knocked down sitting on the floor, dizzy. The card is plain white with no drawing. Only the placeholder colors, 3 shades each. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

---

## Conferência final (antes de zipar)

| Pasta | Arquivos esperados |
|---|---|
| `golpes/` | `golpes-jogador.png`, `projeteis.png` |
| `efeitos-elemento/` | `fire`, `water`, `grass`, `electric`, `ice`, `fighting`, `poison`, `ground`, `flying`, `ghost`, `dark`, `steel` (`.png`) |
| `inimigos/` | `goblin-escudeiro`, `goblin-bombardeiro`, `goblin-mago`, `invocador`, `toupeira-cavadora`, `espirito`, `planta-torreta` (`.png`) |
| `lugares/` | `perigos.png`, `salas.png` |
| `personagem/` | `modelo-02-combate.png` … `modelo-10-magia.png` (27) |

Total: 50 folhas. Os nomes precisam ser exatamente estes (minúsculas, com hífen): o importador procura por eles.
