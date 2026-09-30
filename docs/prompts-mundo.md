# Prompts do mundo grande: Lago, Fazenda e Cidade WIT (GPT)

O mundo novo (plano §3.7) já funciona com prédios **feitos por código**. Estas
imagens servem para trocar essa arte pela do GPT, que fica mais bonita. Mesmo
método da cidade:

- Uma imagem por prompt, **fundo magenta liso `#FF00FF`**, sem sombra no fundo.
- Salve em `public/Novos assets/mundo/<área>/` (`lago`, `fazenda`, `wit`) com o nome indicado.
- Prédio: vista de cima em 3/4, **porta de frente no meio da parede de baixo**, no estilo das casas que já estão no jogo.
- Folhas de objetos: bastante espaço vazio entre eles (eu corto cada um). Se vierem grudados, peça "more empty space between the objects".
- **Tudo original**: nada de logo, personagem ou símbolo de marca ou jogo existente.
- Texto: só onde o prompt pede (placas curtas). Se o GPT errar a letra, eu escrevo a placa por código.
- Público infantil. Reviso uma por uma antes de entrar no jogo.

Frase de estilo usada em todos (já está nos prompts): *Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing.*

---

## Lago (leste)

**casa-pesca.png** — Casa de Pesca (6 × 5 blocos)
```
A single building: a cozy wooden fishing house on a lakeside, raised on short wooden stilts, blue-grey wooden walls, dark teal shingled roof, fishing nets and a life ring hanging on the front wall, a big chalkboard next to the door listing fish (only small fish icons, no readable text), wooden crates of fish and a small awning over the entrance, a wooden sign above the door with a fish icon. Front door centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**farol.png** — Farol (2 × 4 blocos, alto)
```
A single tall lighthouse on a rocky base: white and red striped tower, a glass lamp room on top with a yellow lamp, a small balcony with a railing, a little wooden door at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**lago-objetos.png** — folha (4 colunas × 2 linhas)
```
A sprite sheet of 8 separate objects for a lakeside fishing village, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a small wooden rowboat seen from above pointing up, 2) the same rowboat pointing right, 3) the same rowboat pointing down, 4) a fish market stall with a striped awning and ice with fish, 5) a stack of wooden fish crates, 6) a fishing rod leaning on a wooden barrel, 7) a round life ring on a wooden post, 8) a floating group of green lily pads with a pink flower. Style of Pokémon HeartGold/SoulSilver towns, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**peixes.png** — folha dos peixes (6 colunas × 3 linhas, ícones)
```
A sprite sheet of 18 separate fish icons for a fishing game, side view, each fish isolated with empty space between them, grid of 6 columns and 3 rows, from common to rare: small silver lambari, brown tilapia, spotted catfish, green piranha-like fish (friendly, no teeth showing), orange goldfish, striped bass, golden dourado, big pirarucu, blue discus, rainbow trout, pink salmon, crab, shrimp, old boot, tin can, seaweed, glowing crystal fish, legendary golden koi with sparkles. Crisp pixel art icons, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

---

## Fazenda (oeste)

**casa-fazenda.png** — Casa da Fazenda (6 × 5 blocos)
```
A single building: a charming two-story farmhouse, light wooden walls, red gabled roof with a chimney, a front porch with a bench and flower pots, green shutters on the windows. Front door centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**celeiro.png** — Celeiro (6 × 5 blocos)
```
A single building: a big classic red barn with white trim, a large double door with a white X pattern centered at the bottom, a hay loft door with hay sticking out near the roof peak, a small weather vane with a rooster on top. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**galinheiro.png** — Galinheiro (4 × 3 blocos)
```
A single small building: a wooden chicken coop with a slanted roof, a little ramp to a small round door, straw on the ground in front, a tiny fence around. Front door centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**estufa.png** — Estufa (6 × 4 blocos)
```
A single building: a glass greenhouse with a white metal frame and a curved glass roof, green plants and flowers visible inside through the glass, a glass door centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**moinho.png** — Moinho (3 × 4 blocos) — duas imagens
```
A single tall wooden windmill tower with a stone base and a small door at the bottom, WITHOUT the blades (the blades will be a separate image). Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```
**moinho-pas.png**
```
Only the four wooden windmill blades with cloth sails, seen from the front, arranged like a big X, centered, nothing else. Crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**fazenda-objetos.png** — folha (4 × 3)
```
A sprite sheet of 12 separate farm objects, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, grid of 4 columns and 3 rows: 1) a tall grey metal grain silo with a cone roof, 2) a stone water well with a small wooden roof and a bucket, 3) a wooden shipping bin with a lid, 4) a friendly scarecrow with a straw hat, 5) a round hay bale, 6) a wooden seed stand with little seed packets and a striped awning, 7) a wooden wheelbarrow with vegetables, 8) a water trough, 9) a stack of firewood, 10) a wooden farm gate, 11) a beehive box, 12) a small wooden sign with a carrot icon. Style of Pokémon HeartGold/SoulSilver towns, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**plantacoes.png** — folha das plantações (5 colunas = estágios × 8 linhas = plantas)
```
A sprite sheet of crop growth stages for a farming game, each small plant on its own tile of dark tilled soil, 5 columns (seed in soil, sprout, young plant, grown plant, ready to harvest with the crop visible) and 8 rows, one row per crop: carrot, corn, tomato, strawberry, pumpkin, lettuce, sunflower, watermelon. All tiles the same size, isolated with empty space between them. Style of Pokémon HeartGold/SoulSilver, top-down 3/4 view, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**animais.png** — folha (4 direções × 3 animais)
```
A sprite sheet of farm animals for a top-down pixel art game, each animal isolated with empty space between them, 4 columns (facing down, left, right, up) and 3 rows: a white chicken, a brown and white cow, a pink pig. Cute and friendly, same scale proportions (chicken small, cow big). Style of Pokémon HeartGold/SoulSilver overworld sprites, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

---

## Cidade WIT (sul)

Tons do Núcleo WIT: **verde-lima**, roxo, grafite e branco; vidro e LEDs.

**nucleo-wit.png** — Núcleo WIT, a sede (8 × 6 blocos)
```
A single large modern school building for a technology education center: white and graphite walls, big glass windows, lime green accent stripes and LED lights, a rooftop with solar panels and a small antenna, a wide glass entrance centered at the bottom with steps, a large blank lime green sign panel above the entrance (no letters). Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**lab-ia.png** — Laboratório de IA (6 × 5 blocos)
```
A single futuristic laboratory building for artificial intelligence: white walls with purple glass, a glowing neural network pattern on the facade (connected dots and lines), a small friendly round robot statue by the door, server racks with blinking lights visible through a side window, glass door centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**casa-iot.png** — Casa Inteligente / IoT (6 × 5 blocos)
```
A single modern smart house for an Internet of Things school: light grey walls, solar panels on the roof, small sensors and cameras on the walls, a wifi-like antenna, smart LED strips in cyan, a small garden with a sprinkler, a glass door centered at the bottom with a keypad. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**metaverso.png** — Metaverso (6 × 5 blocos)
```
A single futuristic dome building for a virtual reality and metaverse school: a big dark purple dome with glowing cyan grid lines, a giant VR headset sculpture above the entrance, floating holographic cubes around it, a glowing arched doorway centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**estudio-comunicacao.png** — Estúdio de Comunicação Digital (6 × 5 blocos)
```
A single building for a digital communication and media studio: orange and white walls, a tall radio tower with a satellite dish on the roof, a red "on air" light box above the door (just a red light, no letters), a big window showing a camera and a microphone, posters on the wall, glass door centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**oficina-games.png** — Oficina de Games (6 × 5 blocos)
```
A single colorful building for a game development workshop and arcade: dark blue walls with a big pixel art joystick and buttons on the facade, a marquee of colorful bulbs around the roof, arcade cabinets visible through the big front window, glass door centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**mercado-central.png** — Mercado Central (7 × 5 blocos)
```
A single building: a covered market hall with a green and white striped awning along the front, stalls with fruits, vegetables, fish and bread visible under the awning, a big digital price board with up and down arrows above the entrance (no numbers), wide entrance centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**central-entregas.png** — Central de Entregas (5 × 5 blocos)
```
A single building: a small delivery hub with a flat roof that is a drone landing pad (painted circle), two small quadcopter drones parked on the roof, stacked cardboard boxes by the side, a roll-up garage door and a small glass door centered at the bottom. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**wit-objetos.png** — folha (4 × 3)
```
A sprite sheet of 12 separate objects for a futuristic technology town square, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, grid of 4 columns and 3 rows: 1) a giant outdoor LED screen on two metal legs (blank dark screen), 2) a small quadcopter delivery drone carrying a box, 3) a friendly round white helper robot with a screen face (front view), 4) the same robot seen from the back, 5) a solar tree (metal tree with solar panel leaves), 6) a smart street light with a small camera and a green LED ring, 7) a traffic light with a pedestrian signal, 8) an electric scooter charging station, 9) an arcade cabinet, 10) a holographic information totem, 11) a bench with a small solar panel, 12) a recycling station with three colored bins. Style of Pokémon HeartGold/SoulSilver towns, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```
