# Prompts do GPT: lote 2 (01/10)

O que o Matheus pediu em 01/10 que **precisa de imagem** (o código já está
pronto para receber quase tudo). Regras de sempre:

- fundo **magenta liso (#FF00FF)**, sem sombra no chão, sem texto, sem logo;
- pixel art nítida no estilo Pokémon HeartGold/SoulSilver;
- personagens **originais** (nada de anime/jogo existente), roupa adequada para crianças;
- revisar uma por uma antes de subir (`git add` por arquivo).

Ordem sugerida: **A (poses do 01 e 02)** → B → C → o resto. Gere o modelo 01 e o
02 de cada folha primeiro: eu testo o encaixe e só depois você faz os outros 8.

---

## A. Poses do personagem (sentar, deitar, carregar, emotes)

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

## B. Desafiantes no duelo (reações)

O adversário do duelo agora é maior e reage com tremidas e saltos, mas para
"levar a mão na cabeça" e "tomar um susto" de verdade precisa do desenho.
Uma folha por desafiante (`npc-desafiante-01` a `12`), anexando a folha dele
(`public/game/sprites/npcs/npc-desafiante-XX.png`). Salve em
`public/Novos assets/npcs/reacoes/npc-desafiante-XX-reacoes.png`.

```
Using the attached sprite sheet as the exact reference for this character (same face, hair, clothes and colors), draw a sprite sheet of the SAME character, upper body and full body visible, facing the viewer, in a grid of 4 columns and 2 rows, all frames the same size. Row 1: (1) calm idle, holding a small fan of 3 playing cards in one hand; (2) thinking, hand on the chin, eyes looking up; (3) throwing a card forward with one arm stretched toward the viewer; (4) both hands on the head, eyes squeezed shut, hurt by a big hit. Row 2: (1) startled, jumping back with wide eyes and a small "shock" pose, arms up; (2) cheering, fist raised, happy; (3) sad after losing, head down, shoulders low; (4) sitting on a chair seen from the front (no chair drawn). Original character, age-appropriate. Crisp pixel art like Pokémon HeartGold/SoulSilver, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no cards on the ground.
```

## C. Torre nova (mais larga, com a telinha do andar)

Já ampliei a Torre atual (8 blocos de largura), mas para uma torre de 100
andares ela ainda parece fina, e a telinha em cima da porta é pequena para o
número. Salve como `public/Novos assets/predios/torre.png` (substitui).

```
A huge futuristic skyscraper called the Tower of 100 Floors, the main landmark of a cheerful tech city, seen from the front in a slightly top-down RPG view (like buildings in Pokémon HeartGold/SoulSilver). It must look WIDE and massive at the base: the base is about 2/3 as wide as the whole image is tall, with stepped wings on both sides, then the tower narrows in tiers as it rises to a glowing antenna at the top. Teal glass, white and silver frames, lime green neon accents. At the bottom center: a big double glass entrance door, and right above the door a LARGE empty dark horizontal digital screen (black-green, wide, clearly rectangular, about as wide as the door) where the game will draw the floor number. Many windows, some lit. Crisp pixel art, clean dark outlines, no anti-aliasing, no text, no numbers, no people. Flat solid magenta background (#FF00FF).
```

## D. Mercado Central gigante (Cidade WIT)

`public/Novos assets/mundo/wit/mercado-central.png` (substitui o prompt do lote do mundo). No jogo ele ocupa uns 20 × 9 blocos.
```
A gigantic covered market hall for a cheerful tech city, seen from the front in a slightly top-down RPG view (Pokémon HeartGold/SoulSilver style). Very wide building (about 2.2 times wider than tall): a big arched glass-and-steel roof with green solar panels, a long front facade with many colorful market stalls under awnings visible through big open arches (fruits, bread, fish on ice, flowers, electronics), a big main entrance in the center with wide steps, hanging lamps, crates and baskets near the door, a large empty sign panel above the entrance (no text). Bright and inviting. Crisp pixel art, clean dark outlines, no anti-aliasing, no people, no text. Flat solid magenta background (#FF00FF).
```

## E. Elevador da Torre (interior)

`public/Novos assets/interiores/torre-elevador.png`
```
An elevator for the inside of a fantasy-tech tower, front view for a top-down RPG interior (Pokémon HeartGold/SoulSilver style): two closed metal sliding doors with a golden frame, a small empty digital floor display above the doors (dark green screen, no numbers), and a panel with up and down call buttons on the right side, built into a wall segment. Second version next to it: the same elevator with the doors open, warm light inside. Crisp pixel art, clean outlines, no text, no numbers, no people. Flat solid magenta background (#FF00FF).
```

## F. Estruturas tecnológicas da Cidade WIT (folha 4 × 4)

`public/Novos assets/mundo/wit/wit-tech-3.png` — uma folha com 16 objetos, um por célula, em ordem de leitura:
```
A sprite sheet of 16 separate futuristic city props for a cheerful kids tech city, in a 4 by 4 grid, each prop centered in its cell with empty space around it, seen from the front in a slightly top-down RPG view (Pokémon HeartGold/SoulSilver style), teal, white and lime green color scheme: 1 small data center building with blinking server lights, 2 tall 5G antenna tower, 3 wind turbine, 4 row of solar panels on a frame, 5 electric car charging station with cable, 6 small round delivery robot on wheels, 7 holographic information totem, 8 glowing light bridge segment, 9 big 3D printer in a glass showcase printing a small toy, 10 smart bus stop with a digital screen, 11 drone landing pad with a parked drone, 12 robot arm in a glass box, 13 smart trash bin with a display, 14 bike sharing station with two bikes, 15 weather station with sensors, 16 big satellite dish. Crisp pixel art, clean dark outlines, no anti-aliasing, no text, no logos, no people. Flat solid magenta background (#FF00FF).
```

## G. Ícones do jogo (no lugar dos provisórios)

Hoje os ícones vêm de pacotes pixel art gratuitos (CC0); servem, mas não têm a
cara do jogo. Três folhas 6 × 6 (36 ícones cada), **na ordem da lista** (o
nome do arquivo final é o da lista; o importador corta em ordem).
`public/Novos assets/icones/icones-1.png`, `-2`, `-3`.

```
A sprite sheet of 36 separate item icons for a cute pixel-art life-sim game, in a 6 by 6 grid, each icon centered in its own square cell with empty space around it, all the same size and style, bright colors, crisp pixel art with clean dark outlines, no anti-aliasing, no text, no numbers. Flat solid magenta background (#FF00FF). Icons in reading order: [LISTA]
```
(As folhas passam de 36 se precisar: faça uma folha a mais com o que sobrar, na mesma ordem.)

- **icones-1** (comida): pão francês, bisnaga, pão redondo, pão de forma, pão trançado, bolo de chocolate (fatia), omelete na frigideira, salada na tigela, pipoca no saquinho, peixe assado no prato, copo de vitamina de fruta, bolo de cenoura com cobertura, torta de abóbora, caixinha de suco, rosquinha, sorvete de casquinha, pirulito, picolé, barra de chocolate, cupcake, cenoura, alface, morango, tomate, espiga de milho, girassol, abóbora, ovo, garrafa de leite, novelo de lã, maçã, laranja, pêssego, limão, saquinho de sementes, peixe cru, isca de minhoca, coxinha de frango (ícone de fome), gota d'água, moeda dourada.
- **icones-2** (profissões e produtos): disco de vinil, disco de ouro, quadro emoldurado, chip de IA brilhante, sensor IoT pequeno, irrigador automático, cubo holográfico, tíquete de fliperama, jornalzinho dobrado, câmera fotográfica, microfone, controle de videogame, pacote de entrega, drone pequeno, robozinho gari, prancheta com gráfico, cesta de pão, regador, enxada, vara de pesca, pincel com tinta, teclado musical, violão, tambor, flauta, xilofone, chave de fenda, lâmpada inteligente, notebook, óculos de realidade virtual, lupa, troféu, medalha, estrela, coração, cadeado.
- **icones-3** (pacotinhos e cartas): pacotinho de cartas comum (cinza), incomum (verde), raro (azul), épico (roxo), lendário (dourado), mítico (rosa iridescente), desconhecido (preto com estrelas); carta virada (verso), carta brilhando, pó de carta, bigorna, martelo, baú, chave dourada, mapa, bandeira de guilda, escudo de guilda, espada cruzada, coroa, sino, envelope, presente, balão de fala, mão acenando, coração partido, joinha, nota musical, raio, floco de neve, chama, folha, gota, caveira fofa, lua, fantasma fofo, tornado.

## H. Cenas dos minijogos (Padeiro e Músico primeiro)

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

## I. Loja de Pacotinhos (mini shopping)

A sala vai ser refeita com corredores largos e a loja de pacotinhos na
entrada, com destaque e movimento. Precisa de:
`public/Novos assets/interiores/loja-pacotinhos.png`
```
The front of a card pack shop inside a small shopping mall, top-down RPG interior style (Pokémon HeartGold/SoulSilver), wide storefront: a glowing counter, a huge decorative card pack display behind it with packs in 7 rarity colors (grey, green, blue, purple, gold, iridescent pink, black with stars), shelves with packs, spotlights, a small rotating pedestal with a giant golden pack on top. Bright, eye-catching, magical sparkle. Crisp pixel art, clean outlines, no text, no logos, no people. Flat solid magenta background (#FF00FF).
```

## J. Pacotinhos (abrir pacote) — 01/10

A loja e a animação de abrir já funcionam com um pacote desenhado em código
(provisório). Com a arte, cada pacote vira a imagem do GPT (o jogo troca
sozinho pelo nome). Uma imagem por pacote, em pé, sem fundo:
`public/Novos assets/pacotes/comum.png`, `incomum.png`, `raro.png`,
`epico.png`, `lendario.png`, `mitico.png` (e `desconhecido.png`, para o futuro).

```
A sealed trading card booster pack standing upright, front view, for a cheerful kids card game called WIT: shiny foil wrapper with crimped top and bottom edges, a big glowing gem emblem in the center, sparkles, and the color theme [COR]. No text, no letters, no logos, no characters on it. Crisp pixel art with clean dark outlines, slight 3D shading, no anti-aliasing. Flat solid magenta background (#FF00FF).
```
Cores: comum = silver grey; incomum = emerald green; raro = sapphire blue; épico = royal purple with violet sparkles; lendário = shiny gold with orange glow; mítico = iridescent pink and cyan holographic; desconhecido = black with tiny white stars and a purple glow.

Também para a abertura (opcional, deixa mais bonito):
`public/Novos assets/pacotes/rasgado.png`
```
The same kind of booster pack seen from the front but with the top strip torn open, bright light rays shining out of the opening, a few small sparkles flying out. Silver grey color (the game recolors it). No text. Crisp pixel art, clean outlines. Flat solid magenta background (#FF00FF).
```

## K. Forja do Prof. Ian (Oficina) — 01/10

A tela da forja funciona; falta a cara dela. `public/Novos assets/interiores/forja-tela.png`
```
A cozy fantasy card forge workshop seen from the front, wide horizontal scene for a menu background: a glowing brick furnace with orange fire, an anvil with a hammer, shelves with seven glass jars of glittering dust in seven colors (grey, green, blue, purple, gold, pink, black with stars), a playing card floating above the anvil surrounded by sparkles, warm light. Cute pixel art, clean outlines, no people, no text. Flat solid magenta background (#FF00FF) outside the scene.
```
E os 7 potes de pó como ícones (entram na folha **icones-3**, depois do último): pote de pó comum (cinza), incomum (verde), raro (azul), épico (roxo), lendário (dourado), mítico (rosa iridescente), desconhecido (preto com estrelas).

## L. Estúdio de Música e Padaria (complementos) — 01/10

Os dois minijogos novos já funcionam (compor com som de verdade; fazer pão
em 6 passos). Além das cenas da seção H, precisam:
- **Ícones dos instrumentos** (botões do compositor), na folha **icones-2**, nesta ordem: teclado, violão, flauta, xilofone (já estão na lista; o jogo usa `inst-teclado`, `inst-violao`, `inst-flauta`, `inst-xilofone`).
- **Padaria, folha extra** `public/Novos assets/minijogos/padaria-extras.png` (4 × 2):
```
A sprite sheet of bakery mini-game props, 4 columns by 2 rows, each item centered in its own cell, cute pixel art with clean outlines: row 1: an empty clear glass measuring cup with marks, a big empty mixing bowl (blue ceramic), a wooden spoon, a sack of flour; row 2: a jar of yeast, a pitcher of warm water, a milk bottle, a baker's peel (wooden paddle). No text, no numbers. Flat solid magenta background (#FF00FF).
```

## M. Comunicação e IA (câmera, jornal, programar o robô) — 01/10

Já funciona: câmera (tecla F / botão FOTO) com álbum de 8 fotos, fotos no
telão, escrever matéria (lide: quem, o quê, onde, quando), jornalzinho de 1
moeda, programar o robô com blocos e o robô gari na Cidade WIT. O robô gari e
os lixinhos estão em `docs/prompts-mundo.md` (folha **robo-gari.png**). Falta:
- **Ícones** (folha **icones-3**, 32 × 32, nesta ordem): `camera` (câmera fotográfica), `microfone` (microfone de repórter), `foto` (foto polaroide), `robo-gari` (rosto do robô gari), `bloco-andar` (seta para a frente num bloquinho azul), `bloco-virar` (seta curva num bloquinho roxo), `bloco-pegar` (pinça num bloquinho verde), `bloco-repetir` (seta circular num bloquinho laranja).
```
A sprite sheet of 8 game icons, 4 columns by 2 rows, each icon centered in its own cell, cute pixel art 32x32 style with clean dark outlines: 1) a compact photo camera, 2) a handheld reporter microphone, 3) an instant polaroid photo, 4) the face of a friendly green cleaning robot with a dark visor and green eyes, 5) a blue puzzle block with a white forward arrow, 6) a purple puzzle block with a white curved turn arrow, 7) a green puzzle block with a white grabber claw, 8) an orange puzzle block with a white circular repeat arrow. No text, no numbers. Flat solid magenta background (#FF00FF).
```
- **Testemunhas da matéria** (bustos 64 × 64, roupa completa, nada de anime), folha `public/Novos assets/minijogos/testemunhas.png` (4 × 2), nesta ordem: Seu Tião (pescador idoso de chapéu), recepcionista da Torre (uniforme azul), WIT-Bot (robô branco de tela), morador (rapaz de moletom), dona da padaria (avental e touca), entregador (boné e colete laranja), vizinha da fazenda (chapéu de palha), moça da Central de Entregas (headset).
```
A sprite sheet of 8 bust portraits (head and shoulders), 4 columns by 2 rows, each centered in its own cell, friendly original characters for a children's game, fully clothed, cute pixel art with clean outlines, facing the viewer and smiling: 1) an old fisherman with a bucket hat, 2) a receptionist in a blue uniform, 3) a white robot with a screen face, 4) a young man in a hoodie, 5) a baker woman with an apron and a cap, 6) a delivery man with a cap and an orange vest, 7) a farm woman with a straw hat, 8) a young woman with a headset. No text. Flat solid magenta background (#FF00FF).
```
- **Tabuleiro do robô** (opcional): o chão de rua e o canteiro do minijogo usam as texturas da Cidade WIT quando a arte do mundo chegar.

## N. Veículos (patinete, bicicleta, moto, carro, aviãozinho) — 02/10

As regras e a simulação já estão prontas (`src/game/vehicles.ts`,
`npx vite-node scripts/veiculos.ts`): o veículo só economiza tempo (as
entregas pagas têm limite por dia), então o preço é de cosmético. Falta a
arte para o boneco aparecer montado. Uma folha por veículo, **4 linhas
(baixo, esquerda, direita, cima) × 4 quadros** de movimento, o personagem
base (modelo 01, cores-molde) montado, no mesmo tamanho dos quadros do
personagem (32 × 40 por quadro, a folha maior pode ser em 2×):

```
A pixel art sprite sheet of a kid character riding a small electric scooter, 4 rows (facing down, left, right, up) by 4 animation frames, top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, same proportions as a 32x40 overworld character, clean dark outlines, limited palette, no anti-aliasing. Fully clothed, friendly, no text, no logos. Flat solid magenta background (#FF00FF).
```
Trocar "a small electric scooter" por: "a bicycle", "a small electric motorbike with a helmet on", "a small round electric car (the kid visible through the open roof)" e, para o avião, uma folha só de "a small cute propeller plane seen from above, 4 directions" (sem o boneco).
