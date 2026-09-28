# Prompts dos interiores e dos pets (GPT)

Mesmo método da cidade: o GPT faz as **peças** (piso, parede, móveis) e eu monto a sala por código, com colisão,
portas, luz de noite e animação. Uma imagem por prompt, fundo magenta `#FF00FF`.

- Salve em `public/Novos assets/interiores/<lugar>/` (casa, torre, arena, loja, oficina, castelo) com o nome indicado.
- Pisos e paredes: uma textura por imagem, que se repete sem emenda.
- Móveis: folha com vários objetos separados, com espaço vazio entre eles (eu corto cada um). Se vierem grudados, peça: "more empty space between the objects".
- Tudo original: o clima lembra torre de torneio e arena de campeões/caçadores, sem personagem, símbolo ou prédio de obra nenhuma.
- Público infantil: sem sangue, sem arma.

---

## Sua Casa (aconchegante)

Casa quentinha, madeira e plantas. Pisos e paredes em 4 opções (o aluno escolhe). Pasta: `interiores/casa/`.

**casa-piso.png**
```
A seamless tileable top-down pixel art texture of a cozy warm wooden floor, honey-colored planks running horizontally with subtle grain and small knots, soft warm lighting, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**casa-piso-2.png**
```
A seamless tileable top-down pixel art texture of a cozy checkered kitchen floor with cream and soft sage green tiles, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**casa-piso-3.png**
```
A seamless tileable top-down pixel art texture of a soft beige carpet floor with a subtle woven texture, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**casa-piso-4.png**
```
A seamless tileable top-down pixel art texture of light green tatami mats with dark borders, in a cozy Japanese style room, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**casa-parede.png**
```
A seamless horizontally tileable pixel art texture of a cozy bedroom wall: cream wallpaper with a small pale green leaf pattern on the upper part, a wooden wainscot panel on the lower third and a thin dark wooden baseboard at the very bottom, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**casa-parede-2.png**
```
A seamless horizontally tileable pixel art texture of a cozy wall with warm red brick on the lower half, light peach plaster on the upper half, and a wooden baseboard, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**casa-parede-3.png**
```
A seamless horizontally tileable pixel art texture of a cozy wall with pastel blue wallpaper covered in tiny white stars, a white wainscot and a baseboard, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**casa-parede-4.png**
```
A seamless horizontally tileable pixel art texture of a cozy wooden cabin wall made of horizontal warm log planks with a darker baseboard, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

---

## Móveis da casa (catálogo)

Cada móvel que gira aparece em 2 vistas (frente e lado; o outro lado é espelhado). Tecido em ciano/verde = o jogo pinta em 11 cores (6 sofás viram 66). Tapetes e mesas não giram. Pasta: `interiores/casa/`.

**casa-sofas.png**
```
A sprite sheet of 6 different sofas for a cozy home in a top-down 3/4 view pixel art game, arranged in a grid of 4 columns and 3 rows with plenty of empty space between objects. Each sofa appears twice, side by side: first facing down (front view), then turned to face right (side view), so each row holds two sofas in both views. The 6 sofas: 1) a classic two-seat sofa with round arms, 2) a modern flat three-seat sofa with thin wooden legs, 3) a puffy cloud-shaped sofa, 4) an L-shaped corner sofa, 5) a retro sofa with buttoned back, 6) a small loveseat with a wooden frame. Paint every fabric part (cushions, upholstery, blankets, pillows) in flat bright cyan (#20B4C8) with 3 shades, and any secondary fabric detail in flat bright green (#3CB44A), so the game can recolor them; wood, metal and plants keep their natural colors. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all (a regular sofa is 2 tiles wide), crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text, no shadow on the background.
```

**casa-camas.png**
```
A sprite sheet of 6 different beds for a cozy home in a top-down 3/4 view pixel art game, arranged in a grid of 4 columns and 3 rows with plenty of empty space between objects. Each bed appears twice, side by side: first facing down (front view), then turned to face right (side view), so each row holds two beds in both views. The 6 beds: 1) a single bed with a patchwork blanket, 2) a double bed with two pillows, 3) a bunk bed, 4) a cozy futon on the floor, 5) a canopy bed with light curtains, 6) a car-shaped kids bed. Paint every fabric part (cushions, upholstery, blankets, pillows) in flat bright cyan (#20B4C8) with 3 shades, and any secondary fabric detail in flat bright green (#3CB44A), so the game can recolor them; wood, metal and plants keep their natural colors. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all (a single bed is 1 tile wide and 2 tiles long), crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text, no shadow on the background.
```

**casa-poltronas.png**
```
A sprite sheet of 6 different armchairs and chairs for a cozy home in a top-down 3/4 view pixel art game, arranged in a grid of 4 columns and 3 rows with plenty of empty space between objects. Each seat appears twice, side by side: first facing down (front view), then turned to face right (side view), so each row holds two armchairs and chairs in both views. The 6 armchairs and chairs: 1) a fluffy armchair, 2) a rocking chair, 3) a round bean bag, 4) a gaming chair, 5) a simple wooden dining chair with a cushion, 6) a hanging egg chair on a stand. Paint every fabric part (cushions, upholstery, blankets, pillows) in flat bright cyan (#20B4C8) with 3 shades, and any secondary fabric detail in flat bright green (#3CB44A), so the game can recolor them; wood, metal and plants keep their natural colors. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all (an armchair is 1 tile wide), crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text, no shadow on the background.
```

**casa-mesas.png**
```
A sprite sheet of 8 separate objects for a cozy home, all symmetrical so they never need rotating, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a round wooden coffee table with a mug, 2) a square dining table, 3) a long rectangular dining table, 4) a low Japanese tea table with cushions around, 5) a glass coffee table, 6) a small side table with a lamp, 7) a kitchen island counter, 8) a desk with a computer and a desk lamp. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**casa-armarios.png**
```
A sprite sheet of 8 separate objects for a cozy home, placed against the wall and seen from the front, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a wooden wardrobe with two doors, 2) a tall bookshelf full of colorful books, 3) a low dresser with drawers, 4) a kitchen counter with a sink, 5) a small fridge, 6) a stove with an oven, 7) a display cabinet with card collections, 8) a toy chest. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**casa-tapetes-1.png**
```
A sprite sheet of 5 different rugs for a cozy home, seen from above in a top-down pixel art game, each rug isolated with plenty of empty space between them, arranged in one clean row: 1) a round braided rug, 2) a rectangular rug with a geometric pattern, 3) an oval rug with a flower border, 4) a long hallway runner rug, 5) a square rug with a checker pattern. Paint the main color of every rug in flat bright cyan (#20B4C8) with 3 shades and the pattern or border in flat bright green (#3CB44A), so the game can recolor them. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text, no shadow on the background.
```

**casa-tapetes-2.png**
```
A sprite sheet of 5 different rugs for a cozy home, seen from above in a top-down pixel art game, each rug isolated with plenty of empty space between them, arranged in one clean row: 1) a star-shaped rug, 2) a cloud-shaped rug, 3) a rug with a big playing card design, 4) a round rug with a spiral pattern, 5) a fluffy shag rug. Paint the main color of every rug in flat bright cyan (#20B4C8) with 3 shades and the pattern or border in flat bright green (#3CB44A), so the game can recolor them. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text, no shadow on the background.
```

**casa-plantas.png**
```
A sprite sheet of 8 separate objects for a cozy home, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a big leafy monstera in a pot, 2) a small cactus on a stand, 3) a hanging plant basket, 4) a tall palm in a basket, 5) a flower vase with tulips, 6) a bonsai on a small table, 7) a shelf with three tiny succulents, 8) a lemon tree in a big pot. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**casa-luz.png**
```
A sprite sheet of 8 separate objects for a cozy home, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a floor lamp with a warm yellow shade, 2) a table lamp shaped like a mushroom, 3) a lava lamp, 4) a string of fairy lights for a wall, 5) a round paper lantern, 6) a desk lamp, 7) a candle holder with three candles, 8) a small star-shaped night light. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**casa-eletronicos.png**
```
A sprite sheet of 8 separate objects for a cozy gamer home, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a flat TV on a low cabinet with a game console, 2) a gaming computer desk with two screens and RGB lights, 3) a retro arcade cabinet, 4) a big speaker, 5) a record player on a cabinet, 6) a small robot vacuum, 7) a fish tank on a stand, 8) a telescope on a tripod. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**casa-parede-deco.png**
```
A sprite sheet of 8 separate objects for decorating the wall of a cozy home, seen from the front, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a window with light curtains, 2) a round window, 3) a framed poster of a trading card showing an original cute creature (not from any existing franchise), 4) a wall clock, 5) a wall shelf with trophies and plain colored card boxes (no logos), 6) a framed family picture with a sun, 7) a cork board with photos and drawings, 8) a small fireplace with a cozy fire. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**casa-extras.png**
```
A sprite sheet of 8 separate objects for a cozy home, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a pet bed cushion, 2) a pet food bowl and water bowl, 3) a pile of plush toys, 4) a guitar on a stand, 5) an easel with a painting, 6) a small bookshelf ladder, 7) a laundry basket, 8) a welcome door mat. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Torre dos 100 Andares

Clima de torre de torneio de luta tradicional: madeira, pedra, lanternas, janelas altas com o céu lá embaixo. Cada andar: 8 mesas de duelo (um desafiante em cada) e o chefe no fundo. O visual muda de leve por faixa de andares (3 pisos). Nada tecnológico. Pasta: `interiores/torre/`.

**torre-piso-1.png**
```
A seamless tileable top-down pixel art texture of worn dark wooden floorboards of a traditional martial arts tournament hall, wide planks with visible grain (floors 1 to 30), in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**torre-piso-2.png**
```
A seamless tileable top-down pixel art texture of large old sand-colored stone slabs of an ancient fighting tower, with thin dark joints and small cracks (floors 31 to 70), in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**torre-piso-3.png**
```
A seamless tileable top-down pixel art texture of a rich dark red carpet with a thin gold diamond pattern, for the prestigious top floors of a tournament tower (floors 71 to 100), in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**torre-parede.png**
```
A seamless horizontally tileable pixel art texture of the inner wall of a tall old tournament tower: warm tan stone blocks, big arched windows showing the bright sky with clouds far below (the room is very high up), red paper lanterns hanging between the windows, and a dark wooden baseboard, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**torre-mesas.png**
```
A sprite sheet of 8 separate objects for a card game tournament hall in an old fighting tower, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a sturdy wooden duel table for two players with a green card playmat and a few face-down cards, 2) the same duel table with a red playmat, 3) the same duel table with a blue playmat, 4) the same duel table with a purple playmat, 5) a wooden stool with a red cushion (front view), 6) the same stool seen from the back, 7) a small stand with a card deck box and a sand timer, 8) a floor tile marker circle painted on the floor where a challenger waits. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**torre-chefe.png**
```
A sprite sheet of 6 separate objects for the boss area of each floor of a card game tournament tower, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 3 columns and 2 rows: 1) a raised square duel stage with wooden stairs and four corner posts with rope, 2) a grand boss duel table with gold trim and a black playmat, 3) a big hanging tournament bracket board made of wood (no readable text), 4) a large bronze gong on a stand, 5) a wooden staircase going up to the next floor, 6) a floor number plaque on a wooden stand (blank plate). Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**torre-deco.png**
```
A sprite sheet of 8 separate objects for decorating an old card game tournament tower, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a wooden spectator bench, 2) a tall vertical banner with a card suit symbol (spade), 3) the same banner with a heart symbol, 4) the same banner with a diamond symbol, 5) the same banner with a club symbol, 6) a big stone statue of a hand holding a card, 7) a potted bonsai tree, 8) a standing paper lantern. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Arena

Duas áreas: o saguão de campeões (claro, bonito, mesas onde os jogadores sentam e esperam alguém desafiar) e o salão de treino dos Rank S (escuro, portões azuis, cristais), onde os mais fortes treinam antes de sair em expedição. Tudo original. Pasta: `interiores/arena/`.

**arena-piso-1.png**
```
A seamless tileable top-down pixel art texture of a polished white and silver championship stadium lobby floor with thin gold inlay lines, shiny and grand, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**arena-piso-2.png**
```
A seamless tileable top-down pixel art texture of dark obsidian stone slabs with thin glowing blue rune cracks, the floor of a secret training hall for the strongest duelists, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**arena-parede-1.png**
```
A seamless horizontally tileable pixel art texture of the wall of a grand championship stadium lobby: tall glass windows showing a stadium full of lights, gold columns between them and big hanging banners in green, white and gold, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**arena-parede-2.png**
```
A seamless horizontally tileable pixel art texture of the wall of a dark secret training hall: massive black stone blocks, glowing blue crystals set into the wall and tall stone arches with a faint blue mist, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**arena-saguao.png**
```
A sprite sheet of 8 separate objects for a grand card game championship lobby where players sit and wait to be challenged, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a waiting duel table for two players with a small glowing lamp on it (lamp on, meaning waiting for a challenger), 2) the same table with the lamp off, 3) a comfortable lobby chair (front view), 4) the same chair seen from the back, 5) a big ranking screen on a stand with glowing player slots (no readable text), 6) a reception counter with a bell, 7) a golden trophy on a marble pedestal, 8) a stage spotlight on a stand. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**arena-treino.png**
```
A sprite sheet of 8 separate objects for a dark secret training hall where the strongest card duelists train before an expedition, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a big glowing blue portal gate inside a black stone frame, 2) a dark stone duel platform with glowing blue rune edges, 3) a dark duel table with a glowing blue playmat, 4) a tall crystal pillar glowing blue with an abstract rank emblem, 5) a training dummy made of blue crystal, 6) a tall brazier with a blue flame, 7) a stone board with glowing rank slots (no readable text), 8) a weapon-free equipment rack holding card cases and capes. Dramatic but kid friendly. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Loja de Pacotinhos (shopping)

Quase um shopping: bem chamativo, com várias lojinhas, cada uma com um ícone grande em cima para deixar claro o que vende. Pasta: `interiores/loja/`.

**loja-piso.png**
```
A seamless tileable top-down pixel art texture of a glossy shopping mall floor with big white tiles and thin gold and lime green lines, very shiny, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**loja-parede.png**
```
A seamless horizontally tileable pixel art texture of the inner wall of a colorful shopping mall: big glass shop windows, colorful light strips above them and potted palms between them, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**loja-lojas-1.png**
```
A sprite sheet of 4 separate objects for a colorful card game shopping mall, each one a small shop front 3 tiles wide with a counter and a big clear icon sign above it, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 2 columns and 2 rows: 1) a booster pack shop in red and gold with a giant card pack icon, 2) a pet shop in pastel colors with a big paw icon and pet eggs on the shelves, 3) a clothes boutique in pink and purple with a big shirt icon and clothes on racks, 4) a furniture shop in warm wood and green with a big sofa icon. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**loja-lojas-2.png**
```
A sprite sheet of 4 separate objects for a colorful card game shopping mall, each one a small shop front 3 tiles wide with a counter and a big clear icon sign above it, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 2 columns and 2 rows: 1) a card accessories shop in blue with a big star icon, card sleeves and binders on display, 2) an event shop in orange with a big ticket icon, 3) a prize exchange counter in green with a big gift box icon, 4) an information desk in white and lime with a big question mark icon. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**loja-moveis.png**
```
A sprite sheet of 8 separate objects for a colorful card game shopping mall, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a tall tower display full of booster packs, 2) a giant booster pack statue, 3) a small indoor fountain, 4) a mall bench, 5) a cluster of colorful balloons, 6) a potted palm tree, 7) a mall map kiosk with a screen (no readable text), 8) a rotating glass showcase with a rare glowing card. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Oficina de Cartas (lugar de trocas)

Aconchegante, tipo café: mesinhas para trocar cartas com outros jogadores, poltronas, lareira, estantes de álbuns e o cantinho da forja. Pasta: `interiores/oficina/`.

**oficina-piso.png**
```
A seamless tileable top-down pixel art texture of a cozy warm herringbone wooden floor of a card collectors cafe, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**oficina-parede.png**
```
A seamless horizontally tileable pixel art texture of the wall of a cozy card collectors cafe: exposed red brick on the lower half, warm cream plaster above, wooden shelves with card albums and small hanging plants, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**oficina-trocas.png**
```
A sprite sheet of 8 separate objects for a cozy card trading cafe, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a small round trading table for two players with two open card binders on it, 2) a square trading table with cards spread out and two cups of hot chocolate, 3) a cozy armchair (front view), 4) the same armchair seen from the back, 5) a trade counter with a small scale and card boxes, 6) a cork board full of trade offers with card pictures (no readable text), 7) a sofa corner with cushions, 8) a cake display counter with cookies. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**oficina-forja.png**
```
A sprite sheet of 8 separate objects for the magical card forge corner of a cozy card cafe, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a stone forge with a glowing card-shaped mold in the fire, 2) an anvil with a glowing card on top, 3) a workbench with tools, card frames and a magnifying glass, 4) a tall bookshelf of thick card albums, 5) a lectern holding a big open card album, 6) shelves with glass jars of glowing colorful card dust, 7) a display frame holding one shiny card, 8) a sleeping cat on a cushion. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

---

## Castelo das Guildas

Medieval e agradável: pedra quente, tapeçarias, lareira, mesa de reunião da guilda e o quadro de missões. Pasta: `interiores/castelo/`.

**castelo-piso.png**
```
A seamless tileable top-down pixel art texture of a castle great hall floor of large warm gray stone tiles, a few worn tiles, cozy and clean, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**castelo-tapete.png**
```
A seamless tileable top-down pixel art texture of a long royal red carpet with a thin gold border running vertically, for a castle hall, in the style of Pokémon HeartGold/SoulSilver indoor floors, crisp pixel art, limited palette, no anti-aliasing. The texture must tile perfectly on all four edges. Square image, flat even lighting, no objects, no people, no text.
```

**castelo-parede.png**
```
A seamless horizontally tileable pixel art texture of a friendly castle hall wall: warm gray stone, colorful tapestries with shields, lit torches in iron holders and a stained glass window, seen from the front. Style of Pokémon HeartGold/SoulSilver interiors, crisp pixel art, no anti-aliasing. The left and right edges must tile perfectly. Wide rectangle image, no people, no text.
```

**castelo-moveis-1.png**
```
A sprite sheet of 8 separate objects for a pleasant medieval guild hall, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a long wooden banquet table with benches, 2) a round meeting table with a map and small guild figures on it, 3) a mission board with pinned papers (no readable text), 4) a big stone fireplace with a warm fire, 5) a wooden throne with blue cushions, 6) a trophy stand with cups and medals, 7) a friendly suit of armor statue, 8) an iron chandelier with candles. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
```

**castelo-moveis-2.png**
```
A sprite sheet of 8 separate objects for a pleasant medieval guild hall, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a tall guild banner in blue and gold, 2) the same banner in red and gold, 3) the same banner in green and gold, 4) the same banner in purple and gold, 5) a wooden bookshelf with old books and scrolls, 6) a pair of wooden barrels, 7) a big flower pot with red flowers, 8) a treasure chest. Style of Pokémon HeartGold/SoulSilver interiors, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No readable text, no shadow on the background.
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
