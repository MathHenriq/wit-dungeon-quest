# Prompts dos interiores e dos pets (GPT)

Mesmo método da cidade: o GPT faz as **peças** (piso, parede, móveis) e eu monto a sala por código,
com colisão, portas, luz de noite e animação. Uma imagem por prompt, fundo magenta `#FF00FF`.

- Salve em `public/Novos assets/interiores/<lugar>/` (casa, torre, arena, loja, oficina, castelo) e os pets em
  `public/Novos assets/pets/`, com o nome indicado em cada prompt.
- Pisos e paredes: **uma textura por imagem**, que se repete sem emenda (como os tiles de chão da cidade).
- Móveis: **folha com vários objetos separados**, com espaço vazio entre eles (eu corto cada um).
- Tudo original: nada copiado de anime ou jogo existente. A Torre lembra "torre de torneio de luta" e a
  Arena lembra "arena sombria de caçadores", mas sem personagem, símbolo ou prédio de obra nenhuma.
- Público infantil: sem sangue, sem arma realista.

---

## Sua Casa (aconchegante)

**casa-piso.png**
```
A seamless tileable top-down pixel art texture of a cozy warm wooden floor, honey-colored planks running horizontally with subtle grain and small knots, soft warm lighting, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no shadows, no text.
```

**casa-parede.png**
```
A seamless horizontally tileable pixel art texture of a cozy bedroom wall seen from the front, cream wallpaper with a small pale green leaf pattern on the upper part, a wooden wainscot panel on the lower third, and a thin dark wooden baseboard at the very bottom. Style of Pokémon HeartGold/SoulSilver house interiors, crisp pixel art, limited warm palette, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no windows, no objects, no text.
```

**casa-moveis-1.png**
```
A sprite sheet of 8 separate cozy bedroom furniture pieces for a top-down 3/4 view pixel art game, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a single bed with a green and white checkered blanket and a fluffy pillow, 2) a wooden desk with a small computer and a desk lamp, 3) a tall bookshelf full of colorful books and a small plant, 4) a soft green two-seat sofa with cushions, 5) a round wooden coffee table with a mug, 6) a big leafy potted plant, 7) a wooden wardrobe with two doors, 8) a small TV on a low cabinet with a game console. Warm cozy colors with small lime green accents. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects (a bed is 1 tile wide and 2 tiles tall), crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow on the background, no text.
```

**casa-moveis-2.png**
```
A sprite sheet of 8 separate cozy home decoration pieces for a top-down 3/4 view pixel art game, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a round braided rug in warm orange and cream, 2) a rectangular rug with a simple green geometric pattern, 3) a window with light curtains seen from the front, 4) a framed poster of a trading card, 5) a floor lamp with a warm yellow shade, 6) a small fireplace with a cozy fire, 7) a wall shelf with trophies and card boxes, 8) a pet bed cushion. Warm cozy colors with small lime green accents. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text on the objects, no shadow on the background.
```

---

## Torre dos 100 Andares (salão de desafiantes)

Clima: torre alta de torneio, chão de pedra polida, arquibancada, número do andar, mesas de duelo de cartas
com tapete de jogo em cima. O chefe do andar fica numa plataforma no fundo.

**torre-piso.png**
```
A seamless tileable top-down pixel art texture of a polished gray stone tournament hall floor, large square slabs with thin dark joints and faint glowing lime green tech lines along some joints, slightly reflective, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no text.
```

**torre-parede.png**
```
A seamless horizontally tileable pixel art texture of the inner wall of a tall tournament tower seen from the front: dark gray stone blocks, tall narrow windows showing a bright blue sky with clouds far below (the room is very high up), thin lime green light strips between the windows, and a dark metal baseboard at the bottom. Style of Pokémon HeartGold/SoulSilver interiors with a futuristic touch, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no text.
```

**torre-moveis-1.png**
```
A sprite sheet of 6 separate objects for a card game tournament hall, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a grid of 3 columns and 2 rows: 1) a square duel table for two players with a green trading card game playmat on top showing card zones, and a few face-down cards, 2) the same duel table with a dark blue playmat and cards laid out, 3) a sturdy chair with a lime green cushion (front view), 4) the same chair seen from the back, 5) a tall stone pillar with a glowing lime green light strip, 6) a big wall screen showing a large floor number and two player silhouettes. Style of Pokémon HeartGold/SoulSilver interiors with a futuristic tournament feel, same scale for all objects (a duel table is 2 tiles wide), crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**torre-moveis-2.png**
```
A sprite sheet of 6 separate objects for the top floor of a card game tournament tower, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a grid of 3 columns and 2 rows: 1) a raised circular boss platform with glowing edges and three steps, 2) a grand boss duel table with a golden trim and a purple playmat, 3) an elevator door in metal with lime green lights and an up arrow, 4) a row of spectator bleachers (three steps of wooden benches), 5) a tall banner with an abstract card symbol in green and white, 6) a small referee podium with a bell. Style of Pokémon HeartGold/SoulSilver interiors with a futuristic tournament feel, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Arena (PvP)

Clima: arena sombria e dramática, pedra escura com runas azul-violeta que brilham, portões de luz,
arquibancada no escuro, placar de ranking.

**arena-piso.png**
```
A seamless tileable top-down pixel art texture of a dark dramatic arena floor: large cracked black-blue stone slabs with thin glowing blue-violet rune lines running through the joints, subtle mist, in the style of Pokémon HeartGold/SoulSilver indoor floors but darker and more dramatic, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, no objects, no text.
```

**arena-parede.png**
```
A seamless horizontally tileable pixel art texture of the wall of a dark duel arena seen from the front: massive dark stone blocks, rows of spectator seats fading into shadow above, glowing blue-violet crystals set into the wall, and a thick stone ledge at the bottom. Dramatic lighting, style of Pokémon HeartGold/SoulSilver interiors but darker, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**arena-moveis.png**
```
A sprite sheet of 6 separate objects for a dark dramatic card duel arena, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a grid of 3 columns and 2 rows: 1) a glowing circular portal gate made of blue-violet light inside a dark stone frame, 2) a raised square duel platform of dark stone with glowing rune edges, 3) a dark stone duel table with a glowing blue playmat, 4) a tall brazier with a blue flame, 5) a big stone ranking board with glowing slots (no readable text), 6) a crystal pillar glowing violet. Dramatic dark fantasy mood, kid friendly, style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Loja de Pacotinhos

**loja-piso.png**
```
A seamless tileable top-down pixel art texture of a bright shop floor with white and pale green checkered tiles, clean and shiny, in the style of Pokémon HeartGold/SoulSilver Poké Mart floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, no objects, no text.
```

**loja-moveis.png**
```
A sprite sheet of 8 separate objects for a trading card booster pack shop, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a grid of 4 columns and 2 rows: 1) a shop counter with a cash register, 2) a tall shelf full of colorful booster packs, 3) a round display stand with a giant booster pack on top, 4) a glass showcase with rare cards glowing inside, 5) a table for opening packs with sparkles, 6) a poster board with pictures of cards (no readable text), 7) a basket full of small booster packs, 8) a potted plant. Bright cheerful colors with lime green accents. Style of Pokémon HeartGold/SoulSilver shop interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Oficina de Cartas (álbum e forja)

**oficina-piso.png**
```
A seamless tileable top-down pixel art texture of a craftsman workshop floor: warm dark wooden planks with a few scattered sparkles of card dust and faint scorch marks, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, no objects, no text.
```

**oficina-moveis.png**
```
A sprite sheet of 8 separate objects for a magical trading card workshop, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a grid of 4 columns and 2 rows: 1) a stone forge with a glowing card-shaped mold in the fire, 2) an anvil with a glowing card on top, 3) a workbench with tools, card frames and a magnifying glass, 4) a tall bookshelf of thick card albums, 5) a lectern holding a big open card album, 6) shelves with glass jars of glowing colorful card dust, 7) a display frame holding one shiny card, 8) a barrel of blank cards. Warm workshop colors with glowing magical accents. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Castelo das Guildas

**castelo-piso.png**
```
A seamless tileable top-down pixel art texture of a castle great hall floor: large warm gray stone tiles with a long royal blue carpet feel at the edges, a few worn tiles, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, no objects, no text.
```

**castelo-moveis.png**
```
A sprite sheet of 8 separate objects for a guild hall inside a friendly castle, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a grid of 4 columns and 2 rows: 1) a long wooden banquet table with benches, 2) a mission board with pinned papers (no readable text), 3) a big stone fireplace with a warm fire, 4) a wooden throne with blue cushions, 5) a tall guild banner in blue and gold with an abstract shield, 6) a trophy stand with cups and medals, 7) a suit of armor statue (kid friendly), 8) a round red carpet with a golden border. Warm medieval colors. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Pets (um por elemento para começar; depois vamos até ~50)

Mesma folha dos personagens: 4 linhas (frente, esquerda, direita, costas) × 4 quadros de caminhada. Anexe a
folha de um personagem (ex.: `modelos/modelo-01.png`) **só como referência de tamanho e grade**: o pet deve
ter mais ou menos metade da altura do personagem. Salve como `pet-<nome>.png`.

Cada prompt abaixo já está completo.

**pet-raposa-chama.png** (Fogo)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a small fox with cream fur and a tail tip that looks like a gentle orange flame, round amber eyes. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-lontra-bolha.png** (Água)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a small blue otter with a bubble-shaped tuft on its head and a wavy striped tail. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-furao-faisca.png** (Elétrico)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a small yellow ferret with zigzag ear tips and a tiny glowing spark at the tail. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-broto-tartaruga.png** (Planta)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a small turtle with a mossy shell and a little two-leaf sprout on top. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-pinguim-neve.png** (Gelo)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a round little penguin chick with icy blue cheeks and a snowflake pattern on its belly. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-toupeira-pedra.png** (Terra)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a chubby mole with sandy brown fur, small digging claws and a pebble-like nose. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-filhote-lutador.png** (Lutador)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a small red panda cub wearing a tiny sweatband and sporty wrist wraps. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-robo-besouro.png** (Metal)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a little silver beetle robot with round lime green eyes and small bolt details. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-sapinho-roxo.png** (Veneno)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a small purple frog with light lilac spots and a friendly smile. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-gato-sombra.png** (Sombrio)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a small dark gray cat with glowing yellow eyes and a star-shaped patch on its chest. The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-fantasminha.png** (Fantasma)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a tiny round floating ghost pup with a curly wispy tail and floppy ears (floats instead of walking, with a gentle bob). The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**pet-corujinha-vento.png** (Voador)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size and walk cycle, draw a new ORIGINAL cute pet creature for a kids game, not based on any existing Pokémon, Digimon or other franchise creature: a small round owl chick with teal feathers and a swirl-shaped crest (hops instead of walking). The pet is about half the height of the reference character and fits inside the same frame size. Exactly 4 rows and 4 columns, 16 frames, the same creature in every frame: row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left paw forward, frame 3 standing, frame 4 right paw forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```
