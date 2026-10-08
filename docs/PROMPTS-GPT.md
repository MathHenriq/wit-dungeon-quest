# TODOS OS PROMPTS QUE FALTAM (GPT) — um lugar só

Tudo o que ainda precisa de imagem do GPT, na ordem de fazer. Cada prompt está
num bloco de código: copie o bloco inteiro, cole no ChatGPT, baixe a imagem e
salve **com o nome e na pasta indicados** (o jogo troca sozinho pelo nome).

Regras de todas as imagens:
- fundo **magenta liso (#FF00FF)**, sem sombra no fundo;
- **sem texto, letra ou logo** (só onde o prompt pede uma placa);
- pixel art nítida, contorno escuro; tudo **original** (nada de personagem de anime/jogo existente);
- **público infantil**: descarte qualquer coisa sensual ou estranha e gere de novo;
- o Matheus revisa uma por uma antes de subir para o git.

Ordem: **1. Pacotinhos → 2. Mundo (138 peças) → 3. Lote 2 (poses, ícones, cenas...) → 4. Tapetes.**

Quando terminar, cada parte tem o seu importador (anotado na parte). Os
arquivos antigos (`prompts-mundo.md`, `prompts-lote2.md`, `prompts-tapetes.md`)
foram juntados aqui.

---

# 1. Pacotinhos

### Pacotinhos (abrir pacote) — refeito em 03/10

Hoje o pacote é desenhado em código (`src/game/world/packs-art.ts`) e ficou "mais ou menos".
Com a imagem do GPT, o jogo troca sozinho (procura `public/game/packs/<id>.png` antes).

**Onde salvar:** `public/Novos assets/pacotes/` com os nomes da tabela, **ou** uma folha só
`public/Novos assets/pacotes/folha.png` com os 7 lado a lado, na ordem da tabela (melhor: o
estilo fica igual nos 7). Depois: `python3 scripts/arte/importar-pacotes.py --folha revisao.png`.

| Arquivo | Cor | Emblema no medalhão |
|---|---|---|
| `comum.png` | silver grey | a simple round coin |
| `incomum.png` | emerald green | a diamond shape (rhombus) |
| `raro.png` | sapphire blue | a cut gemstone |
| `epico.png` | royal purple, violet sparkles | a five-pointed star |
| `lendario.png` | shiny gold, orange glow, holographic shine | a crown |
| `mitico.png` | iridescent pink and cyan holographic | an eight-pointed starburst |
| `desconhecido.png` | black with tiny white stars, purple glow | a glowing eye (no letters) |

**O que o jogo espera** (para a animação de abrir funcionar): pacote em pé, de frente, inteiro
na imagem, proporção 5:7; o **selo de cima ocupa o 1/7 de cima** (é a tira que sai voando quando
o aluno rasga); nada de texto.

Um pacote:
```
A single sealed trading card booster pack standing upright, seen straight from the front, filling the image, proportion 5 wide by 7 tall, for a cheerful kids card game. Shiny [COR] foil wrapper puffed like a pillow, with a crimped silver seal strip across the top (exactly the top seventh of the pack, with a dotted tear line just below it) and another crimped silver seal at the bottom. In the center a round medallion with [EMBLEMA] in white and gold. Soft diagonal shine on the foil, a few small sparkles. No text, no letters, no numbers, no logos, no characters. Crisp pixel art in the style of a 16-bit game, clean dark outline around the pack, gentle 3D shading, no anti-aliasing, no drop shadow. Flat solid magenta background (#FF00FF).
```

Os 7 numa folha (recomendado):
```
A sprite sheet of 7 sealed trading card booster packs side by side in one row, evenly spaced, all the same size and the same style, standing upright, seen from the front, proportion 5 wide by 7 tall each, for a cheerful kids card game. Each has a crimped silver seal strip across the top seventh with a dotted tear line below it, a crimped silver seal at the bottom, and a round medallion in the center. From left to right: 1) silver grey foil with a round coin emblem; 2) emerald green foil with a rhombus emblem; 3) sapphire blue foil with a cut gemstone emblem; 4) royal purple foil with violet sparkles and a five-pointed star emblem; 5) shiny gold foil with orange glow and a crown emblem; 6) iridescent pink and cyan holographic foil with an eight-pointed starburst emblem; 7) black foil with tiny white stars, purple glow and a glowing eye emblem. No text, no letters, no numbers, no logos, no characters. Crisp 16-bit pixel art, clean dark outlines, gentle 3D shading, no anti-aliasing, no drop shadows. Flat solid magenta background (#FF00FF) between and around the packs.
```

Opcional (deixa a abertura mais bonita): `public/Novos assets/pacotes/rasgado.png`
```
The same kind of booster pack seen from the front but with the top seal torn off and missing, bright white-gold light rays shining out of the open top, a few small sparkles flying out. Silver grey foil (the game recolors it). No text. Crisp 16-bit pixel art, clean dark outlines. Flat solid magenta background (#FF00FF).
```



---

# 2. Mundo grande: Lago Azul, Fazenda do Vale, Cidade WIT (138 peças)

## Prompts do mundo grande: Lago, Fazenda e Cidade WIT (GPT)

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

### Lago (leste)

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

### Fazenda (oeste)

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

### Cidade WIT (sul)

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

**robo-gari.png** — folha (**4 objetos, nesta ordem**): o robô gari que cata lixo na Cidade WIT (treinado pelos alunos de IA) e 3 lixinhos do chão
```
A sprite sheet of 4 separate objects, each isolated with plenty of empty space between them, in one row: 1) a cute small cleaning robot facing right: a green trash-bin body with a white recycling symbol, a round white head with a dark visor screen and two green glowing eyes, a little antenna, a mechanical arm with a grabber claw in front, tank treads instead of feet, 2) a crushed red soda can lying on the ground, 3) a crumpled ball of white paper, 4) a small empty green plastic bottle lying on its side. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, no anti-aliasing, the robot about twice as tall as the bottle is long. Flat solid magenta background (#FF00FF). No text, no logos.
```

**casinhas-wit.png** — folha (**7 casas, nesta ordem**, cada uma 5 × 3 blocos, porta no meio embaixo)
```
A sprite sheet of 7 separate small modern buildings for a technology student town, each isolated with plenty of empty space between them, grid of 4 columns and 2 rows (last row has 3), each with the front door centered at the bottom: 1) a coworking office with glass windows and a lime green trim, 2) a purple music studio with a big music note sign (no letters), 3) a cream art studio with a paint palette sign (no letters), 4) a teal student house, 5) a peach student house, 6) a light blue student house, 7) a yellow student house. Style of Pokémon HeartGold/SoulSilver towns, top-down 3/4 view, crisp pixel art, clean dark outlines, limited palette, no anti-aliasing. Flat solid magenta background (#FF00FF). No text.
```


---

# 3. Lote 2: poses, reações, Torre, ícones, cenas dos minijogos, forja, veículos

## Prompts do GPT: lote 2 (01/10)

O que o Matheus pediu em 01/10 que **precisa de imagem** (o código já está
pronto para receber quase tudo). Regras de sempre:

- fundo **magenta liso (#FF00FF)**, sem sombra no chão, sem texto, sem logo;
- pixel art nítida no estilo Pokémon HeartGold/SoulSilver;
- personagens **originais** (nada de anime/jogo existente), roupa adequada para crianças;
- revisar uma por uma antes de subir (`git add` por arquivo).

Ordem sugerida: **A (poses do 01 e 02)** → B → C → o resto. Gere o modelo 01 e o
02 de cada folha primeiro: eu testo o encaixe e só depois você faz os outros 8.

---

### A. Poses do personagem (sentar, deitar, carregar, emotes)

Hoje o boneco só tem os 16 quadros de andar. Por isso, ao sentar, ele é
"espremido" no banco, e moradores com caixa ou pão ficam com o objeto
flutuando. Com estas folhas: senta de verdade, deita na cama, carrega com os
braços e faz emotes. Usam as mesmas **cores-molde** dos modelos (o jogo pinta).

Anexe **a folha do modelo** (`public/Novos assets/personagem/modelos/modelo-01.png` etc.)
e salve em `public/Novos assets/personagem/poses/` como `modelo-01-sentar.png`,
`modelo-01-carregar.png`, `modelo-01-emotes.png` (e 02...10).

**modelo-XX-sentar.png** (4 × 2 quadros)
```
Using the attached sprite sheet as the exact reference for this character (same hair shape, same clothes, same placeholder colors: skin #E8B48C, hair flat cyan #20B4C8, top flat green #3CB44A, bottom flat royal blue #3456C8, white sneakers; same frame size, same proportions, same outline), draw a new sprite sheet of the SAME character in a grid of 4 columns and 2 rows, each frame the same size as the reference frames. Row 1: sitting on an invisible chair seen from the front (knees bent forward, feet on the ground, hands on the knees), frame 1 and frame 2 (frame 2 breathing: shoulders 1 pixel lower); then sitting seen from the back (back view, facing away), frame 3 and frame 4. Row 2: sitting seen from the left side (facing left, knees bent), frame 1 and 2; then lying down on the back, sleeping, seen from above as if on a bed, eyes closed, frame 3 and frame 4 (breathing). Keep only the placeholder colors, 3 shades each. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No chair, no bed, no shadow, no text.
```

**modelo-XX-carregar.png** (4 × 4 quadros, igual à folha de andar)
```
Using the attached sprite sheet as the exact reference for this character (same hair, clothes, placeholder colors, frame size and grid of 4 rows and 4 columns), draw the SAME walk cycle but with BOTH ARMS held forward at chest height, hands together as if carrying something in front of the body (the hands are empty: the game draws the object). Row 1 walking toward the viewer, row 2 walking left, row 3 walking right, row 4 walking away (back view, arms hidden in front). Frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward. Only the placeholder colors, 3 shades each. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No objects, no shadow, no text.
```

**modelo-XX-emotes.png** (4 × 4 quadros, todos de frente)
```
Using the attached sprite sheet as the exact reference for this character (same hair, clothes, placeholder colors and frame size), draw 4 short animations of the SAME character facing the viewer, in a grid of 4 rows and 4 columns (4 frames per row, played in a loop). Row 1: waving goodbye with the right hand raised, hand moving side to side, big smile. Row 2: a fun, silly dance (bouncy steps side to side, arms swinging, like a playful viral dance step), very energetic. Row 3: crying, hands near the eyes, small blue tear drops falling, sad mouth. Row 4: thumbs up with one hand, confident wink and smile, small bounce. Only the placeholder colors (tears may be light blue), 3 shades each. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no effects outside the character except the tears.
```

### B. Desafiantes no duelo (reações)

O adversário do duelo agora é maior e reage com tremidas e saltos, mas para
"levar a mão na cabeça" e "tomar um susto" de verdade precisa do desenho.
Uma folha por desafiante (`npc-desafiante-01` a `12`), anexando a folha dele
(`public/game/sprites/npcs/npc-desafiante-XX.png`). Salve em
`public/Novos assets/npcs/reacoes/npc-desafiante-XX-reacoes.png`.

```
Using the attached sprite sheet as the exact reference for this character (same face, hair, clothes and colors), draw a sprite sheet of the SAME character, upper body and full body visible, facing the viewer, in a grid of 4 columns and 2 rows, all frames the same size. Row 1: (1) calm idle, holding a small fan of 3 playing cards in one hand; (2) thinking, hand on the chin, eyes looking up; (3) throwing a card forward with one arm stretched toward the viewer; (4) both hands on the head, eyes squeezed shut, hurt by a big hit. Row 2: (1) startled, jumping back with wide eyes and a small "shock" pose, arms up; (2) cheering, fist raised, happy; (3) sad after losing, head down, shoulders low; (4) sitting on a chair seen from the front (no chair drawn). Original character, age-appropriate. Crisp pixel art like Pokémon HeartGold/SoulSilver, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no cards on the ground.
```

### C. Torre nova (mais larga, com a telinha do andar)

Já ampliei a Torre atual (8 blocos de largura), mas para uma torre de 100
andares ela ainda parece fina, e a telinha em cima da porta é pequena para o
número. Salve como `public/Novos assets/predios/torre.png` (substitui).

```
A huge futuristic skyscraper called the Tower of 100 Floors, the main landmark of a cheerful tech city, seen from the front in a slightly top-down RPG view (like buildings in Pokémon HeartGold/SoulSilver). It must look WIDE and massive at the base: the base is about 2/3 as wide as the whole image is tall, with stepped wings on both sides, then the tower narrows in tiers as it rises to a glowing antenna at the top. Teal glass, white and silver frames, lime green neon accents. At the bottom center: a big double glass entrance door, and right above the door a LARGE empty dark horizontal digital screen (black-green, wide, clearly rectangular, about as wide as the door) where the game will draw the floor number. Many windows, some lit. Crisp pixel art, clean dark outlines, no anti-aliasing, no text, no numbers, no people. Flat solid magenta background (#FF00FF).
```

### D. Mercado Central gigante (Cidade WIT)

`public/Novos assets/mundo/wit/mercado-central.png` (substitui o prompt do lote do mundo). No jogo ele ocupa uns 20 × 9 blocos.
```
A gigantic covered market hall for a cheerful tech city, seen from the front in a slightly top-down RPG view (Pokémon HeartGold/SoulSilver style). Very wide building (about 2.2 times wider than tall): a big arched glass-and-steel roof with green solar panels, a long front facade with many colorful market stalls under awnings visible through big open arches (fruits, bread, fish on ice, flowers, electronics), a big main entrance in the center with wide steps, hanging lamps, crates and baskets near the door, a large empty sign panel above the entrance (no text). Bright and inviting. Crisp pixel art, clean dark outlines, no anti-aliasing, no people, no text. Flat solid magenta background (#FF00FF).
```

### E. Elevador da Torre (interior)

`public/Novos assets/interiores/torre-elevador.png`
```
An elevator for the inside of a fantasy-tech tower, front view for a top-down RPG interior (Pokémon HeartGold/SoulSilver style): two closed metal sliding doors with a golden frame, a small empty digital floor display above the doors (dark green screen, no numbers), and a panel with up and down call buttons on the right side, built into a wall segment. Second version next to it: the same elevator with the doors open, warm light inside. Crisp pixel art, clean outlines, no text, no numbers, no people. Flat solid magenta background (#FF00FF).
```

### F. Estruturas tecnológicas da Cidade WIT (folha 4 × 4)

`public/Novos assets/mundo/wit/wit-tech-3.png` — uma folha com 16 objetos, um por célula, em ordem de leitura:
```
A sprite sheet of 16 separate futuristic city props for a cheerful kids tech city, in a 4 by 4 grid, each prop centered in its cell with empty space around it, seen from the front in a slightly top-down RPG view (Pokémon HeartGold/SoulSilver style), teal, white and lime green color scheme: 1 small data center building with blinking server lights, 2 tall 5G antenna tower, 3 wind turbine, 4 row of solar panels on a frame, 5 electric car charging station with cable, 6 small round delivery robot on wheels, 7 holographic information totem, 8 glowing light bridge segment, 9 big 3D printer in a glass showcase printing a small toy, 10 smart bus stop with a digital screen, 11 drone landing pad with a parked drone, 12 robot arm in a glass box, 13 smart trash bin with a display, 14 bike sharing station with two bikes, 15 weather station with sensors, 16 big satellite dish. Crisp pixel art, clean dark outlines, no anti-aliasing, no text, no logos, no people. Flat solid magenta background (#FF00FF).
```

### G. Ícones do jogo (no lugar dos provisórios)

Hoje os ícones vêm de pacotes pixel art gratuitos (CC0); servem, mas não têm a
cara do jogo. Quatro folhas, cada prompt já com a lista completa (cole como
está). Salve em `public/Novos assets/icones/` com o nome do título. A ordem
importa: o importador corta na ordem de leitura.

**icones-1.png** (comida e fazenda, 36 ícones, 6 × 6)
```
A sprite sheet of 36 separate item icons for a cute pixel-art life-sim game, in a 6 by 6 grid (6 columns, 6 rows), each icon centered in its own square cell with empty space around it, all the same size and style, bright colors, crisp pixel art with clean dark outlines, no anti-aliasing, no text, no numbers, no logos, no existing game or anime characters. Flat solid magenta background (#FF00FF). Icons in reading order (left to right, top to bottom): 1) a French bread roll, 2) a baguette, 3) a round loaf of bread, 4) a loaf of sliced sandwich bread, 5) a braided bread, 6) a slice of chocolate cake, 7) an omelette in a frying pan, 8) a salad bowl, 9) a paper bag of popcorn, 10) a baked fish on a plate, 11) a glass of fruit smoothie, 12) a carrot cake with icing, 13) a pumpkin pie, 14) a juice box with a straw, 15) a donut, 16) an ice cream cone, 17) a lollipop, 18) a popsicle, 19) a chocolate bar, 20) a cupcake, 21) a carrot, 22) a head of lettuce, 23) a strawberry, 24) a tomato, 25) a corn cob, 26) a sunflower, 27) a pumpkin, 28) an egg, 29) a milk bottle, 30) a ball of wool yarn, 31) an apple, 32) an orange, 33) a peach, 34) a lemon, 35) a seed packet, 36) a raw fish.
```

**icones-2.png** (profissões e produtos, 36 ícones, 6 × 6)
```
A sprite sheet of 36 separate item icons for a cute pixel-art life-sim game, in a 6 by 6 grid (6 columns, 6 rows), each icon centered in its own square cell with empty space around it, all the same size and style, bright colors, crisp pixel art with clean dark outlines, no anti-aliasing, no text, no numbers, no logos, no existing game or anime characters. Flat solid magenta background (#FF00FF). Icons in reading order (left to right, top to bottom): 1) a vinyl record, 2) a golden record, 3) a framed painting, 4) a glowing AI chip, 5) a small IoT sensor, 6) an automatic sprinkler, 7) a holographic cube, 8) an arcade ticket, 9) a folded small newspaper, 10) a photo camera, 11) a microphone, 12) a game controller, 13) a delivery package, 14) a small drone, 15) a small green cleaning robot, 16) a clipboard with a bar chart, 17) a basket of bread, 18) a watering can, 19) a garden hoe, 20) a fishing rod, 21) a paintbrush with paint, 22) a small music keyboard, 23) an acoustic guitar, 24) a drum, 25) a flute, 26) a xylophone, 27) a screwdriver, 28) a smart light bulb, 29) a laptop, 30) VR goggles, 31) a magnifying glass, 32) a trophy, 33) a medal, 34) a star, 35) a heart, 36) a padlock.
```

**icones-3.png** (pacotinhos, cartas e símbolos, 36 ícones, 6 × 6)
```
A sprite sheet of 36 separate item icons for a cute pixel-art life-sim game, in a 6 by 6 grid (6 columns, 6 rows), each icon centered in its own square cell with empty space around it, all the same size and style, bright colors, crisp pixel art with clean dark outlines, no anti-aliasing, no text, no numbers, no logos, no existing game or anime characters. Flat solid magenta background (#FF00FF). Icons in reading order (left to right, top to bottom): 1) a grey card pack, 2) a green card pack, 3) a blue card pack, 4) a purple card pack, 5) a golden card pack, 6) an iridescent pink card pack, 7) a black card pack with little stars, 8) a face-down playing card (card back), 9) a glowing playing card, 10) a small pile of sparkling card dust, 11) an anvil, 12) a hammer, 13) a treasure chest, 14) a golden key, 15) a folded map, 16) a guild flag, 17) a guild shield, 18) two crossed swords, 19) a crown, 20) a bell, 21) an envelope, 22) a gift box, 23) a speech bubble, 24) a waving hand, 25) a broken heart, 26) a thumbs up hand, 27) a music note, 28) a lightning bolt, 29) a snowflake, 30) a flame, 31) a green leaf, 32) a water drop, 33) a cute cartoon skull, 34) a crescent moon, 35) a cute little ghost, 36) a small tornado.
```

**icones-4.png** (sobras, potes de pó da forja e os 8 de Comunicação e IA da seção M, 19 ícones, 5 × 4)
```
A sprite sheet of 19 separate item icons for a cute pixel-art life-sim game, in a 5 by 4 grid (5 columns, 4 rows), each icon centered in its own square cell with empty space around it, all the same size and style, bright colors, crisp pixel art with clean dark outlines, no anti-aliasing, no text, no numbers, no logos, no existing game or anime characters. Flat solid magenta background (#FF00FF). Icons in reading order (left to right, top to bottom): 1) an earthworm bait, 2) a chicken drumstick, 3) a blue water drop, 4) a gold coin, 5) a glass jar of grey glitter dust, 6) a glass jar of green glitter dust, 7) a glass jar of blue glitter dust, 8) a glass jar of purple glitter dust, 9) a glass jar of golden glitter dust, 10) a glass jar of iridescent pink glitter dust, 11) a glass jar of black glitter dust with little stars, 12) a compact photo camera, 13) a handheld reporter microphone, 14) an instant polaroid photo, 15) the face of a friendly green cleaning robot with a dark visor and green eyes, 16) a blue puzzle block with a white forward arrow, 17) a purple puzzle block with a white curved turn arrow, 18) a green puzzle block with a white grabber claw, 19) an orange puzzle block with a white circular repeat arrow. The remaining cells are left empty.
```

### H. Cenas dos minijogos (Padeiro e Músico primeiro)

O Matheus reprovou os minijogos atuais (feios e sem graça). Os dois primeiros
a refazer são o **pão de verdade** e o **compor música** (ver
`docs/profissoes-tarefas.md`). Precisam de cena bonita:

`public/Novos assets/minijogos/padaria-cena.png`
```
A cozy bakery kitchen counter seen from the front, wide horizontal scene for a cooking mini-game, cute cozy pixel art (Stardew Valley / Pokémon HeartGold style): wooden counter in the foreground with an empty mixing bowl in the center, a flour sack, a jar of yeast, eggs in a basket, a pitcher of water, a rolling pin, a measuring cup; behind the counter a brick oven with a round opening and warm fire inside, shelves with jars and bread baskets, a window with morning light. Leave the center of the counter clear. Crisp pixel art, clean outlines, no people, no text. Flat solid magenta background (#FF00FF) only outside the scene borders.
```
`public/Novos assets/minijogos/padaria-massa.png` (folha 6 × 3, uma peça por célula)
```
A sprite sheet of bread-making stages for a cooking mini-game, 6 columns by 3 rows, each item centered in its own cell, cute pixel art with clean outlines: row 1: flour pile in a bowl, egg cracked into flour, shaggy wet dough in a bowl, smooth dough ball, dough ball being pressed by a hand, dough with flour dust; row 2: long baguette dough (raw), braided dough (raw), round loaf dough (raw), loaf in a bread tin (raw), the same doughs risen bigger (2 cells); row 3: baguette baked golden, braided bread baked, round loaf baked, tin loaf baked, a burnt dark loaf, a pale undercooked loaf. No text. Flat solid magenta background (#FF00FF).
```
`public/Novos assets/minijogos/musica-instrumentos.png` (folha 5 × 2)
```
A sprite sheet of musical instruments for a music-making mini-game, 5 columns by 2 rows, each instrument centered in its own cell, cute colorful pixel art with clean outlines: row 1: small keyboard piano, drum kit, acoustic guitar, flute, xylophone; row 2: the same 5 instruments in a "playing" frame (slight glow and small music notes around them). No text, no people. Flat solid magenta background (#FF00FF).
```
`public/Novos assets/minijogos/musica-palco.png`
```
A small outdoor stage in a town square for a music mini-game, front view, wide horizontal scene, cute pixel art: wooden stage with colorful string lights, two speakers, a microphone stand, a banner with no text, and a happy crowd of small chibi townspeople silhouettes in front (simple, original). Crisp pixel art, clean outlines, no text. Flat solid magenta background (#FF00FF) outside the scene.
```

### I. Loja de Pacotinhos (mini shopping)

A sala vai ser refeita com corredores largos e a loja de pacotinhos na
entrada, com destaque e movimento. Precisa de:
`public/Novos assets/interiores/loja-pacotinhos.png`
```
The front of a card pack shop inside a small shopping mall, top-down RPG interior style (Pokémon HeartGold/SoulSilver), wide storefront: a glowing counter, a huge decorative card pack display behind it with packs in 7 rarity colors (grey, green, blue, purple, gold, iridescent pink, black with stars), shelves with packs, spotlights, a small rotating pedestal with a giant golden pack on top. Bright, eye-catching, magical sparkle. Crisp pixel art, clean outlines, no text, no logos, no people. Flat solid magenta background (#FF00FF).
```

### K. Forja do Prof. Ian (Oficina) — 01/10

A tela da forja funciona; falta a cara dela. `public/Novos assets/interiores/forja-tela.png`
```
A cozy fantasy card forge workshop seen from the front, wide horizontal scene for a menu background: a glowing brick furnace with orange fire, an anvil with a hammer, shelves with seven glass jars of glittering dust in seven colors (grey, green, blue, purple, gold, pink, black with stars), a playing card floating above the anvil surrounded by sparkles, warm light. Cute pixel art, clean outlines, no people, no text. Flat solid magenta background (#FF00FF) outside the scene.
```
Os 7 potes de pó como ícones já estão na folha **icones-4** da seção G.

### L. Estúdio de Música e Padaria (complementos) — 01/10

Os dois minijogos novos já funcionam (compor com som de verdade; fazer pão
em 6 passos). Além das cenas da seção H, precisam:
- **Ícones dos instrumentos** (botões do compositor), na folha **icones-2**, nesta ordem: teclado, violão, flauta, xilofone (já estão na lista; o jogo usa `inst-teclado`, `inst-violao`, `inst-flauta`, `inst-xilofone`).
- **Padaria, folha extra** `public/Novos assets/minijogos/padaria-extras.png` (4 × 2):
```
A sprite sheet of bakery mini-game props, 4 columns by 2 rows, each item centered in its own cell, cute pixel art with clean outlines: row 1: an empty clear glass measuring cup with marks, a big empty mixing bowl (blue ceramic), a wooden spoon, a sack of flour; row 2: a jar of yeast, a pitcher of warm water, a milk bottle, a baker's peel (wooden paddle). No text, no numbers. Flat solid magenta background (#FF00FF).
```

### M. Comunicação e IA (câmera, jornal, programar o robô) — 01/10

Já funciona: câmera (tecla F / botão FOTO) com álbum de 8 fotos, fotos no
telão, escrever matéria (lide: quem, o quê, onde, quando), jornalzinho de 1
moeda, programar o robô com blocos e o robô gari na Cidade WIT. O robô gari e
os lixinhos estão em `docs/prompts-mundo.md` (folha **robo-gari.png**). Falta:
- **Ícones** (câmera, microfone, foto, robô gari e os 4 blocos de programar): já estão na folha **icones-4** da seção G. Não precisa de folha separada.
- **Testemunhas da matéria** (bustos 64 × 64, roupa completa, nada de anime), folha `public/Novos assets/minijogos/testemunhas.png` (4 × 2), nesta ordem: Seu Tião (pescador idoso de chapéu), recepcionista da Torre (uniforme azul), WIT-Bot (robô branco de tela), morador (rapaz de moletom), dona da padaria (avental e touca), entregador (boné e colete laranja), vizinha da fazenda (chapéu de palha), moça da Central de Entregas (headset).
```
A sprite sheet of 8 bust portraits (head and shoulders), 4 columns by 2 rows, each centered in its own cell, friendly original characters for a children's game, fully clothed, cute pixel art with clean outlines, facing the viewer and smiling: 1) an old fisherman with a bucket hat, 2) a receptionist in a blue uniform, 3) a white robot with a screen face, 4) a young man in a hoodie, 5) a baker woman with an apron and a cap, 6) a delivery man with a cap and an orange vest, 7) a farm woman with a straw hat, 8) a young woman with a headset. No text. Flat solid magenta background (#FF00FF).
```
- **Tabuleiro do robô** (opcional): o chão de rua e o canteiro do minijogo usam as texturas da Cidade WIT quando a arte do mundo chegar.

### N. Veículos (patinete, bicicleta, moto, carro, aviãozinho) — 02/10

As regras e a simulação já estão prontas (`src/game/vehicles.ts`,
`npx vite-node scripts/veiculos.ts`): o veículo só economiza tempo (as
entregas pagas têm limite por dia), então o preço é de cosmético. Falta a
arte para o boneco aparecer montado. Uma folha por veículo, **4 linhas
(baixo, esquerda, direita, cima) × 4 quadros** de movimento, o personagem
base (modelo 01, cores-molde) montado, no mesmo tamanho dos quadros do
personagem (32 × 40 por quadro, a folha maior pode ser em 2×):

Anexe **`modelo-01.png`** em cada um (o boneco tem de sair nas cores-molde, o jogo pinta). Salve em `public/Novos assets/veiculos/` com o nome do título (o mesmo id de `src/game/vehicles.ts`). O avião não leva boneco nem anexo.

**veiculo-patinete.png**
```
Using the attached sprite sheet as the exact reference for this character (same hair shape, same clothes, same placeholder colors: skin #E8B48C, hair flat cyan #20B4C8, top flat green #3CB44A, bottom flat royal blue #3456C8, white sneakers; same proportions and outline), draw a pixel art sprite sheet of the SAME character riding a small electric scooter, 4 rows (row 1 facing down toward the viewer, row 2 facing left, row 3 facing right, row 4 facing away) by 4 animation frames, top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, same proportions as a 32x40 overworld character, clean dark outlines, limited palette, no anti-aliasing. Fully clothed, friendly, original, no text, no logos. Flat solid magenta background (#FF00FF).
```

**veiculo-bicicleta.png**
```
Using the attached sprite sheet as the exact reference for this character (same hair shape, same clothes, same placeholder colors: skin #E8B48C, hair flat cyan #20B4C8, top flat green #3CB44A, bottom flat royal blue #3456C8, white sneakers; same proportions and outline), draw a pixel art sprite sheet of the SAME character riding a bicycle, 4 rows (row 1 facing down toward the viewer, row 2 facing left, row 3 facing right, row 4 facing away) by 4 animation frames, top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, same proportions as a 32x40 overworld character, clean dark outlines, limited palette, no anti-aliasing. Fully clothed, friendly, original, no text, no logos. Flat solid magenta background (#FF00FF).
```

**veiculo-moto.png**
```
Using the attached sprite sheet as the exact reference for this character (same hair shape, same clothes, same placeholder colors: skin #E8B48C, hair flat cyan #20B4C8, top flat green #3CB44A, bottom flat royal blue #3456C8, white sneakers; same proportions and outline), draw a pixel art sprite sheet of the SAME character riding a small electric motorbike, wearing a helmet, 4 rows (row 1 facing down toward the viewer, row 2 facing left, row 3 facing right, row 4 facing away) by 4 animation frames, top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, same proportions as a 32x40 overworld character, clean dark outlines, limited palette, no anti-aliasing. Fully clothed, friendly, original, no text, no logos. Flat solid magenta background (#FF00FF).
```

**veiculo-carro.png**
```
Using the attached sprite sheet as the exact reference for this character (same hair shape, same clothes, same placeholder colors: skin #E8B48C, hair flat cyan #20B4C8, top flat green #3CB44A, bottom flat royal blue #3456C8, white sneakers; same proportions and outline), draw a pixel art sprite sheet of the SAME character riding a small round electric car, the kid visible through the open roof, 4 rows (row 1 facing down toward the viewer, row 2 facing left, row 3 facing right, row 4 facing away) by 4 animation frames, top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, same proportions as a 32x40 overworld character, clean dark outlines, limited palette, no anti-aliasing. Fully clothed, friendly, original, no text, no logos. Flat solid magenta background (#FF00FF).
```

**veiculo-aviao.png** (sem o boneco)
```
A pixel art sprite sheet of a small cute propeller plane seen from above, 4 rows (flying down, left, right, up) by 4 animation frames (propeller spinning), top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, limited palette, no anti-aliasing, no people, no text, no logos. Flat solid magenta background (#FF00FF).
```

### O. Masmorra (estilo Soul Knight) — 08/10

A masmorra já é jogável com arte **provisória**: o piso e a parede do
castelo, os pets como monstrinhos e um desafiante como chefe
(`src/game/dungeon.ts`, tela `src/components/dungeon/DungeonView.tsx`,
`?sala=arena&masmorra`). A sala tem 15 × 9 blocos de 32 px (em hd), vista de
cima em 3/4 como a cidade. Salve em `public/Novos assets/masmorra/` com o
nome do título.

- Tudo **original** (sem criatura de obra nenhuma), fofo e nada assustador
  demais: o público é infantil. Sem sangue, sem texto.
- Fundo **magenta (#FF00FF)** nos sprites; os pisos e paredes cobrem a
  imagem toda.

**masmorra-piso.png** (piso que se repete)
```
A seamless tileable pixel art floor texture for a cute fantasy dungeon, old mossy stone tiles with small cracks and a few glowing blue crystals, top-down view like Pokémon HeartGold/SoulSilver, 256x256 pixels that tile perfectly on all sides, limited palette, no anti-aliasing, no text.
```

**masmorra-parede.png** (faixa de parede, repete na horizontal)
```
A seamless horizontal pixel art wall strip for a cute fantasy dungeon seen in top-down 3/4 view like Pokémon HeartGold/SoulSilver, dark stone bricks with torches and hanging vines, 288x96 pixels, tiles left to right, limited palette, no anti-aliasing, no text.
```

**masmorra-objetos.png** (folha 4 × 4, um objeto por quadro de 64 × 64)
```
A pixel art sprite sheet, 4 by 4 grid, each cell 64x64, of cute fantasy dungeon objects seen in top-down 3/4 view like Pokémon HeartGold/SoulSilver: stone pillar, broken pillar, wooden barrel, crate, pile of rocks, crystal cluster, small campfire, wooden treasure chest closed, the same chest open with gold glow, locked iron gate (horizontal), locked iron gate (vertical), magic portal swirl, spike trap, potion bottle red, heart pickup, gold coin pile. Clean dark outlines, limited palette, no anti-aliasing, no text, flat solid magenta background (#FF00FF).
```

**masmorra-monstros.png** (folha 4 × 4 por monstro: baixo, esquerda, direita, cima × 4 quadros; quadro de 48 × 48)
```
Three separate pixel art sprite sheets of ORIGINAL cute dungeon monsters for a kids game, each 4 rows (facing down, left, right, up) by 4 walking frames, each frame 48x48, top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites: (1) a bouncy green jelly slime with a leaf on top, (2) a small purple bat with big ears flapping, (3) a little hooded mushroom archer holding a tiny bow. Friendly faces, not scary, clean dark outlines, limited palette, no anti-aliasing, no text, flat solid magenta background (#FF00FF).
```

**masmorra-chefe.png** (4 linhas × 4 quadros; quadro de 96 × 96)
```
A pixel art sprite sheet of an ORIGINAL cute but imposing dungeon boss for a kids game: a big stone golem knight with glowing crystal eyes and a mossy shield, 4 rows (facing down, left, right, up) by 4 walking frames, each frame 96x96, top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, friendly cartoon proportions, not scary, clean dark outlines, limited palette, no anti-aliasing, no text, flat solid magenta background (#FF00FF).
```

**masmorra-tiros.png** (folha 4 × 2, quadro de 16 × 16)
```
A pixel art sprite sheet, 4 by 2 grid, each cell 16x16: row 1 a small glowing yellow magic bolt in 4 animation frames, row 2 a small pink enemy energy ball in 4 animation frames. Clean outlines, no anti-aliasing, flat solid magenta background (#FF00FF).
```

### P. Efeitos das cartas de Ataque Épica+ (masmorra nova) — 08/10

Plano: `docs/plano-masmorra.md`. São **67 cartas**, cuja lista e ordem estão na tabela do fim
do plano. Gere uma folha por carta e salve em `public/Novos assets/efeitos/<id>.png`, com o id
da tabela.

Troque `{CARTA}`, `{ELEMENTO}` e `{DESCRICAO}`. Na descrição, diga em uma frase o que o golpe
**faz na tela**, sem nome de personagem. Exemplos:

- "a giant thorny vine bursts from the ground and whips forward";
- "a huge blue energy beam fired in a straight line";
- "a black lightning spark that cracks the air".

```
A pixel art visual effect sprite sheet for a kids action RPG, 6 frames in a single row, each frame 96x96, top-down 3/4 view. The effect: {DESCRICAO}. Element colors: {ELEMENTO}. Frames go from wind-up to impact to fade-out. Only the effect itself, no character, no weapon holder, no blood, no gore, not scary. Clean dark outlines, limited palette, strong glow colors, no anti-aliasing, no text, no letters, flat solid magenta background (#FF00FF).
```

---

# 4. Tapetes do duelo

## Prompts dos tapetes do duelo (GPT)

O tapete é a mesa do duelo: o aluno compra com moedas e escolhe qual usa
(aba **TAPETES** na tela do deck). Os tapetes feitos em código já estão no
jogo; estes aqui são os de **imagem** (anime, cartas, monstrinhos), que
aparecem como EM BREVE até a arte chegar.

- Salve em `public/Novos assets/tapetes/<id>.png` e rode
  `python3 scripts/arte/importar-tapetes.py` (gera `public/game/tapetes/<id>.webp`).
  Depois é só tirar o `emBreve` do tapete em `src/game/playmats.ts`.
- Formato **paisagem 3:2** (1536 × 1024). O jogo mostra a faixa do meio,
  inclinada, então **o centro precisa ser calmo e mais escuro** (as cartas
  ficam por cima) e os detalhes bonitos vão para as **bordas e cantos**.
- **Tudo original**: estilo anime, mas sem personagem, logo, símbolo ou
  criatura de obra nenhuma (nada de Pokémon, Naruto, One Piece etc.). O GPT
  costuma recusar ou copiar; se aparecer algo reconhecível, refaça.
- Sem texto, sem letras, sem números na imagem.
- Público infantil: nada sensual, sem sangue. Reviso uma por uma antes de subir.

---

**arena-heroi.png** (Anime)
```
A top-down view of a trading card game playmat, anime style illustration, landscape 3:2. Theme: a shonen tournament arena seen from above at dusk — a stone fighting ring in the center with faint glowing lines, the crowd stands and colorful banners only around the outer edges, dramatic orange and purple sky light spilling from the corners. The center area is darker and calm with low detail so cards can be placed on top. Original design, no existing characters, logos or symbols, no text, no letters, no numbers. Rich colors, clean lineart, soft glow.
```

**espiritos.png** (Anime)
```
A top-down view of a trading card game playmat, anime film style illustration, landscape 3:2. Theme: an enchanted spirit forest at night — mossy ground in the center fading into darkness, giant tree roots, glowing mushrooms, fireflies and small cute original forest spirits peeking only from the edges and corners, soft teal and green light. The center is calm, dark and low detail so cards can be placed on top. Original design, no existing characters or symbols, no text, no letters. Painterly, warm and magical.
```

**cidade-neon.png** (Anime)
```
A top-down view of a trading card game playmat, anime cyberpunk style illustration, landscape 3:2. Theme: rooftops of a futuristic city at night seen from above — the center is a dark rooftop floor with subtle hexagon pattern, glowing pink and cyan neon signs without letters, holograms and city lights only along the edges and corners. The center is calm and darker so cards can be placed on top. Original design, no logos, no text, no letters, no numbers. Crisp lineart, vivid neon glow.
```

**cartas-lendarias.png** (Cartas)
```
A top-down view of a trading card game playmat, fantasy anime style, landscape 3:2. Theme: legendary cards — a dark velvet table surface with a large faint golden magic circle in the center, fans of glowing golden card backs (plain ornate backs, no faces, no text) and floating runes around the edges, sparkles and light rays from the corners. The center is calm, dark and low detail so cards can be placed on top. Original design, no existing symbols or logos, no text, no letters. Elegant gold and deep purple palette.
```

**monstrinhos.png** (Monstrinhos)
```
A top-down view of a trading card game playmat, cute anime monster-battle style, landscape 3:2. Theme: an outdoor battle field seen from above — soft grass field with a large faint white battle circle in the center, rocks, flowers and a small pond at the edges, and a few cute ORIGINAL little monsters (invented designs, not from any existing franchise) peeking from the corners. The center is calm, slightly darker and low detail so cards can be placed on top. No Pokémon or any existing creature, no pokéball, no logos, no text, no letters. Bright friendly colors, clean lineart.
```

