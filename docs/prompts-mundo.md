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

**Como entra no jogo:** salve a imagem com o nome indicado, rode
`python3 scripts/arte/importar-gpt.py --folha revisao.png` e confira a folha.
Cada sprite gerado substitui sozinho a arte por código de mesmo nome (a lista
completa, com o que é cada um, está em `src/game/world/art-list.ts`).
`npx vite-node scripts/arte/falta-arte.ts` mostra o que ainda falta.
**Nas folhas, a ordem importa** (o importador lê linha a linha, da esquerda
para a direita) e o número de objetos tem de bater.

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

**lago-objetos.png** — folha (4 colunas × 2 linhas, **8 objetos**)
```
A sprite sheet of 8 separate objects for a lakeside fishing village, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, arranged in a clean grid of 4 columns and 2 rows: 1) a small empty wooden rowboat seen from above pointing up, 2) the same rowboat pointing right, 3) the same rowboat pointing down, 4) a fish market stall with a striped awning and ice with fish, 5) a stack of wooden fish crates, 6) a fishing rod leaning on a wooden barrel, 7) a round red and white life ring on a wooden post, 8) a floating group of green lily pads with a pink flower. Style of Pokémon HeartGold/SoulSilver towns, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**lago-objetos-2.png** — folha (4 colunas × 3 linhas, **11 objetos**)
```
A sprite sheet of 11 separate objects for a lakeside village, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, grid of 4 columns and 3 rows (last row has 3): 1) one square section of a wooden pier with planks running vertically, 2) one section of a wooden pier with planks running horizontally, 3) a small wooden footbridge with railings crossing left to right, 4) a campfire with stones and logs, 5) a striped beach umbrella with a beach towel under it, 6) a small sandcastle with a flag, 7) a small camping tent, 8) a wooden barrel, 9) two posts with a rope and drying fish hanging, 10) a few grey shore rocks, 11) a small white duck swimming, facing left. Style of Pokémon HeartGold/SoulSilver towns, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**peixes.png** — folha dos peixes (4 colunas × 4 linhas, **16 ícones, nesta ordem**)
```
A sprite sheet of 16 separate fish and item icons for a fishing game, side view facing left, each isolated with empty space between them, grid of 4 columns and 4 rows, in this exact order: 1) small silver lambari fish with a yellow tail, 2) grey-green tilapia with dark stripes, 3) big golden-brown carp with scales, 4) small pink freshwater shrimp, 5) grey catfish with long whiskers and dark spots, 6) green trahira fish with dark spots, 7) yellow piau fish with three black spots, 8) round blue-grey pacu fish with an orange belly, 9) green peacock bass with dark stripes and an eye spot on the tail, 10) shiny golden dourado fish, 11) white koi carp with red patches, 12) huge pirarucu fish with red scales near the tail, 13) glowing pale-blue crystal fish with sparkles, 14) legendary golden koi with sparkles, 15) an old brown boot, 16) an empty tin can. Crisp pixel art icons, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**casinhas-lago.png** — folha (4 casas, **nesta ordem**, cada uma 5 × 3 blocos)
```
A sprite sheet of 4 separate small houses for a lakeside fishing village, each isolated with plenty of empty space between them, in one row, each with the front door centered at the bottom: 1) a small bait and tackle shop with a blue striped awning and a fish-shaped sign (no letters), 2) a blue-grey wooden fisherman cottage with nets on the wall, 3) a cream plaster cottage with a green roof and red shutters, 4) a log cabin with a purple roof and a small boat oar by the door. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
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

**fazenda-objetos.png** — folha (4 × 3, **12 objetos, nesta ordem**)
```
A sprite sheet of 12 separate farm objects, top-down 3/4 view pixel art, each object isolated with plenty of empty space between them, grid of 4 columns and 3 rows: 1) a tall grey metal grain silo with a red dome roof, 2) a stone water well with a small wooden roof and a bucket, 3) a wooden shipping bin with a lid, 4) a friendly scarecrow with a straw hat, 5) a round hay bale, 6) a wooden seed stand with little seed packets and a green striped awning, 7) a wooden wheelbarrow, 8) a wooden water trough, 9) a stack of firewood, 10) a wooden farm gate, 11) a beehive box, 12) a picnic table with a red checkered cloth. Style of Pokémon HeartGold/SoulSilver towns, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**terra.png** — folha (**3 peças**)
```
A sprite sheet of 3 separate square tiles for a farming game, each isolated with empty space between them, in one row: 1) a square tile of dry light-brown tilled soil with furrows, 2) the same tile of tilled soil but wet and dark brown, 3) a short piece of wooden fence seen from the side standing vertically (a post with two rails going up and down). Top-down 3/4 view, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**plantacoes.png** — folha das plantações (5 colunas = estágios × **7 linhas = plantas, nesta ordem**)
```
A sprite sheet of crop growth stages for a farming game, each plant alone WITHOUT soil (just the plant, standing on its base), 5 columns (seeds just planted, small sprout, young plant, grown plant, ready to harvest with the crop visible) and 7 rows, one row per crop in this order: carrot, corn (tall), tomato on a wooden stake, strawberry, pumpkin, lettuce, sunflower (tall). Same scale for all, isolated with empty space between them. Style of Pokémon HeartGold/SoulSilver, top-down 3/4 view, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**animais.png** — folha (2 colunas × 3 linhas: **olhando para a esquerda, para a direita**)
```
A sprite sheet of farm animals for a top-down pixel art game, each animal isolated with empty space between them, 2 columns (facing left, facing right) and 3 rows: a white hen, a black and white cow, a fluffy white sheep with a dark face. Cute and friendly, correct proportions (hen small, cow big). Style of Pokémon HeartGold/SoulSilver overworld sprites, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
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

**wit-objetos-2.png** — folha (**4 objetos, nesta ordem**)
```
A sprite sheet of 4 separate objects for a technology town park, each isolated with plenty of empty space between them, in one row: 1) a small outdoor sports court seen from above (blue floor, white lines, no hoops), 2) a basketball hoop on a pole facing right, 3) a raised planter with flowers and a small moisture sensor with a cyan light, 4) a small weather station on a pole with a wind cup anemometer and a little screen. Style of Pokémon HeartGold/SoulSilver towns, same scale for all objects, crisp pixel art, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```

**casinhas-wit.png** — folha (**7 casas, nesta ordem**, cada uma 5 × 3 blocos, porta no meio embaixo)
```
A sprite sheet of 7 separate small modern buildings for a technology student town, each isolated with plenty of empty space between them, grid of 4 columns and 2 rows (last row has 3), each with the front door centered at the bottom: 1) a coworking office with glass windows and a lime green trim, 2) a purple music studio with a big music note sign (no letters), 3) a cream art studio with a paint palette sign (no letters), 4) a teal student house, 5) a peach student house, 6) a light blue student house, 7) a yellow student house. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```
