# Prompts do personagem (GPT)

## Modelos-base (caminho aprovado)

O boneco que anda na cidade é um **personagem inteiro** gerado de uma vez (16 quadros), não montado por peças.
O aluno escolhe o modelo (penteado + estilo de roupa) e o jogo pinta cada parte pela rampa de cor
(pele, cabelo, parte de cima, parte de baixo), como em `src/game/world/recolor.ts`.

Por isso as cores do prompt são **cores-molde**, fáceis de separar por código: cabelo ciano, parte de cima verde,
parte de baixo azul, tênis branco, pele bege. O boneco sai com cara estranha; é de propósito.

- Anexe a folha do menino de cabelo castanho aprovado (ou, se não tiver mais, `corpos/corpo-pele-4.png`, que usa o mesmo grid).
- Salve em `public/Novos assets/personagem/modelos/` com o nome indicado.
- **Gere o 01 e o 02 primeiro.** Eu testo a separação e a troca de cor neles; se funcionar, você gera os outros 8.

**modelo-01.png** (cabelo curto espetado, camiseta, bermuda)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with short spiky hair painted in flat bright cyan (#20B4C8), wearing a short-sleeve t-shirt painted in flat bright green (#3CB44A), knee-length shorts painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-02.png** (cabelo bagunçado com topete, moletom, calça)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with messy short hair with a cowlick on top painted in flat bright cyan (#20B4C8), wearing a hoodie with the hood down painted in flat bright green (#3CB44A), long straight pants painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-03.png** (rabo de cavalo alto, camiseta, saia no joelho)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with a long high ponytail painted in flat bright cyan (#20B4C8), wearing a short-sleeve t-shirt painted in flat bright green (#3CB44A), a knee-length pleated skirt painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-04.png** (chanel com franja reta, jaqueta com zíper, calça)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with a chin-length bob cut with straight bangs painted in flat bright cyan (#20B4C8), wearing a zip-up jacket painted in flat bright green (#3CB44A), long straight pants painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-05.png** (cacheado curto, camisa polo, bermuda)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with short curly hair painted in flat bright cyan (#20B4C8), wearing a polo shirt painted in flat bright green (#3CB44A), knee-length shorts painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-06.png** (black power redondo, camiseta de manga longa, calça jogger)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with a round afro painted in flat bright cyan (#20B4C8), wearing a long-sleeve t-shirt painted in flat bright green (#3CB44A), jogger pants painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-07.png** (maria-chiquinha (duas), suéter, bermuda)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with twin pigtails painted in flat bright cyan (#20B4C8), wearing a crew-neck sweater painted in flat bright green (#3CB44A), knee-length shorts painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-08.png** (cabelo longo liso com franja, jaqueta college, calça)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with long straight hair with bangs, reaching the middle of the back painted in flat bright cyan (#20B4C8), wearing a varsity jacket painted in flat bright green (#3CB44A), long straight pants painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-09.png** (raspado, camisa de time, short esportivo)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with a very short buzz cut painted in flat bright cyan (#20B4C8), wearing a short-sleeve sports jersey painted in flat bright green (#3CB44A), athletic shorts painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-10.png** (coque no alto da cabeça, camisa de botão, bermuda cargo)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful 10-year-old chibi kid with light tan skin (#E8B48C) and simple dot eyes, with a top bun painted in flat bright cyan (#20B4C8), wearing a short-sleeve button-up shirt painted in flat bright green (#3CB44A), knee-length cargo shorts painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest, age-appropriate clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, big head chibi proportions, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

## Peças soltas (teste de montagem, descartado para o boneco andando)

As peças abaixo já foram geradas e ficam em `personagem/` (corpos, cabelos, acessórios, cima, baixo).
A montagem por peças não funcionou: cada peça saiu de uma imagem com escala e traço diferentes e as roupas
foram desenhadas "deitadas", sem os quadros da caminhada. Elas continuam úteis como **ícone de item**
(inventário, pacotinho, coleção). Sapatos não foram feitos.

Regras: uma imagem por prompt; anexe a **folha do corpo base de pele média** (`corpo-pele-4.png`) em todas as peças; nos corpos, anexe a folha do menino de cabelo castanho como referência de pose.
Salve em `public/Novos assets/personagem/<pasta>/` (corpos, cabelos, acessorios, cima, baixo, sapatos; personagens completos em `prontos/`) com o nome indicado em cada prompt.

| Parte | Arrumação | Imagens |
|---|---|---|
| Corpo | 16 quadros (4 direções × 4 passos) | 6 |
| Cabelo, acessório, parte de cima | 5 peças por imagem, uma por linha, colunas = frente, esquerda, direita, costas | 4 cada |
| Parte de baixo, sapato | 2 peças por imagem, 3 direções (frente, esquerda, costas) × 3 poses (parado, pé esquerdo, pé direito); a direita é espelhada | 10 cada |

## Corpos (6)

**corpo-pele-1.png** (very light peach)
```
Using the attached sprite sheet ONLY as a reference for grid, size, poses and walk cycle, draw a new sprite sheet of a plain base body for a character creator: a bald chibi kid with no hair, very light peach skin, wearing a plain light gray simple bodysuit (short sleeves, shorts), bare simple feet, no backpack, no accessories, simple dot eyes. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 facing down, row 2 walking left, row 3 walking right, row 4 facing up (back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**corpo-pele-2.png** (light)
```
Using the attached sprite sheet ONLY as a reference for grid, size, poses and walk cycle, draw a new sprite sheet of a plain base body for a character creator: a bald chibi kid with no hair, light skin, wearing a plain light gray simple bodysuit (short sleeves, shorts), bare simple feet, no backpack, no accessories, simple dot eyes. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 facing down, row 2 walking left, row 3 walking right, row 4 facing up (back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**corpo-pele-3.png** (light tan)
```
Using the attached sprite sheet ONLY as a reference for grid, size, poses and walk cycle, draw a new sprite sheet of a plain base body for a character creator: a bald chibi kid with no hair, light tan skin, wearing a plain light gray simple bodysuit (short sleeves, shorts), bare simple feet, no backpack, no accessories, simple dot eyes. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 facing down, row 2 walking left, row 3 walking right, row 4 facing up (back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**corpo-pele-4.png** (medium tan)
```
Using the attached sprite sheet ONLY as a reference for grid, size, poses and walk cycle, draw a new sprite sheet of a plain base body for a character creator: a bald chibi kid with no hair, medium tan skin, wearing a plain light gray simple bodysuit (short sleeves, shorts), bare simple feet, no backpack, no accessories, simple dot eyes. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 facing down, row 2 walking left, row 3 walking right, row 4 facing up (back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**corpo-pele-5.png** (brown)
```
Using the attached sprite sheet ONLY as a reference for grid, size, poses and walk cycle, draw a new sprite sheet of a plain base body for a character creator: a bald chibi kid with no hair, brown skin, wearing a plain light gray simple bodysuit (short sleeves, shorts), bare simple feet, no backpack, no accessories, simple dot eyes. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 facing down, row 2 walking left, row 3 walking right, row 4 facing up (back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**corpo-pele-6.png** (dark brown)
```
Using the attached sprite sheet ONLY as a reference for grid, size, poses and walk cycle, draw a new sprite sheet of a plain base body for a character creator: a bald chibi kid with no hair, dark brown skin, wearing a plain light gray simple bodysuit (short sleeves, shorts), bare simple feet, no backpack, no accessories, simple dot eyes. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 facing down, row 2 walking left, row 3 walking right, row 4 facing up (back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

## Cabelos (20 peças, 4 imagens)

**cabelos-1.png** (peças 1 a 5: short spiky hair, messy short hair, bowl cut, buzz cut, side-swept fringe)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different hairstyles only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one hairstyle; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the hairstyles floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) short spiky hair, 2) messy short hair, 3) bowl cut, 4) buzz cut, 5) side-swept fringe. All hair in one medium brown color so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**cabelos-2.png** (peças 6 a 10: curly short hair, afro, long straight hair, high ponytail, twin pigtails)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different hairstyles only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one hairstyle; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the hairstyles floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) curly short hair, 2) afro, 3) long straight hair, 4) high ponytail, 5) twin pigtails. All hair in one medium brown color so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**cabelos-3.png** (peças 11 a 15: bob cut, twin braids, top bun, wavy shoulder-length hair, mohawk with short sides)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different hairstyles only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one hairstyle; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the hairstyles floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) bob cut, 2) twin braids, 3) top bun, 4) wavy shoulder-length hair, 5) mohawk with short sides. All hair in one medium brown color so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**cabelos-4.png** (peças 16 a 20: long hair with bangs, side ponytail, short hair with a single antenna strand, fluffy hair, long hair with a headband)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different hairstyles only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one hairstyle; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the hairstyles floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) long hair with bangs, 2) side ponytail, 3) short hair with a single antenna strand, 4) fluffy hair, 5) long hair with a headband. All hair in one medium brown color so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

## Acessórios (20 peças, 4 imagens)

**acessorios-1.png** (peças 1 a 5: baseball cap, beanie, round glasses, backpack, headphones)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different accessories only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one accessory; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the accessories floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) baseball cap, 2) beanie, 3) round glasses, 4) backpack, 5) headphones. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**acessorios-2.png** (peças 6 a 10: bucket hat, scarf, hair bow, visor, goggles on head)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different accessories only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one accessory; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the accessories floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) bucket hat, 2) scarf, 3) hair bow, 4) visor, 5) goggles on head. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**acessorios-3.png** (peças 11 a 15: crossbody bag, wristband, star hair clip, cat-ear headband, sunglasses)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different accessories only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one accessory; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the accessories floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) crossbody bag, 2) wristband, 3) star hair clip, 4) cat-ear headband, 5) sunglasses. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**acessorios-4.png** (peças 16 a 20: bandana, flower crown, sports headband, winter earmuffs, small side bag)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different accessories only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one accessory; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the accessories floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) bandana, 2) flower crown, 3) sports headband, 4) winter earmuffs, 5) small side bag. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

## Parte de cima (20 peças, 4 imagens)

**cima-1.png** (peças 1 a 5: basic t-shirt, long sleeve shirt, polo shirt, hoodie, zip jacket)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different tops only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one top; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the tops floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) basic t-shirt, 2) long sleeve shirt, 3) polo shirt, 4) hoodie, 5) zip jacket. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**cima-2.png** (peças 6 a 10: sweater, school uniform shirt with tie, sports jersey, tank top over t-shirt, button-up shirt)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different tops only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one top; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the tops floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) sweater, 2) school uniform shirt with tie, 3) sports jersey, 4) tank top over t-shirt, 5) button-up shirt. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**cima-3.png** (peças 11 a 15: vest over t-shirt, raincoat, denim jacket, lab coat, sundress with short sleeves)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different tops only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one top; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the tops floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) vest over t-shirt, 2) raincoat, 3) denim jacket, 4) lab coat, 5) sundress with short sleeves. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**cima-4.png** (peças 16 a 20: puffer jacket, cardigan, striped t-shirt, varsity jacket, t-shirt with three small squares on the chest)
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different tops only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one top; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the tops floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) puffer jacket, 2) cardigan, 3) striped t-shirt, 4) varsity jacket, 5) t-shirt with three small squares on the chest. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

## Parte de baixo (20 peças, 10 imagens)

**baixo-01.png** (jeans, shorts)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are jeans; rows 4 to 6 are shorts. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**baixo-02.png** (cargo pants, pleated skirt)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are cargo pants; rows 4 to 6 are pleated skirt. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**baixo-03.png** (sweatpants, overalls)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are sweatpants; rows 4 to 6 are overalls. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**baixo-04.png** (bermuda shorts, leggings)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are bermuda shorts; rows 4 to 6 are leggings. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**baixo-05.png** (school uniform trousers, rolled-up jeans)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are school uniform trousers; rows 4 to 6 are rolled-up jeans. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**baixo-06.png** (athletic shorts, long skirt)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are athletic shorts; rows 4 to 6 are long skirt. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**baixo-07.png** (joggers, capri pants)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are joggers; rows 4 to 6 are capri pants. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**baixo-08.png** (denim skirt, wide pants)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are denim skirt; rows 4 to 6 are wide pants. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**baixo-09.png** (track pants with side stripes, ripped-knee jeans (kid style))
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are track pants with side stripes; rows 4 to 6 are ripped-knee jeans (kid style). For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**baixo-10.png** (skort, plaid pants)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different bottoms only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are skort; rows 4 to 6 are plaid pants. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the bottoms floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

## Sapatos (20 peças, 10 imagens)

**sapatos-01.png** (sneakers, high-top sneakers)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are sneakers; rows 4 to 6 are high-top sneakers. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**sapatos-02.png** (sandals, boots)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are sandals; rows 4 to 6 are boots. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**sapatos-03.png** (rain boots, school shoes)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are rain boots; rows 4 to 6 are school shoes. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**sapatos-04.png** (slip-ons, soccer cleats)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are slip-ons; rows 4 to 6 are soccer cleats. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**sapatos-05.png** (slippers, running shoes)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are slippers; rows 4 to 6 are running shoes. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**sapatos-06.png** (hiking boots, canvas shoes)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are hiking boots; rows 4 to 6 are canvas shoes. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**sapatos-07.png** (ballet flats, clogs)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are ballet flats; rows 4 to 6 are clogs. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**sapatos-08.png** (snow boots, light-up sneakers)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are snow boots; rows 4 to 6 are light-up sneakers. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**sapatos-09.png** (loafers, flip-flops)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are loafers; rows 4 to 6 are flip-flops. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**sapatos-10.png** (basketball shoes, sock shoes)
```
Using the attached base body sprite sheet as reference for size, proportions and leg poses, draw a sprite sheet of 2 different pairs of shoes only, arranged in a grid of 6 rows and 3 columns with empty space between cells. Rows 1 to 3 are basketball shoes; rows 4 to 6 are sock shoes. For each piece: first row facing down (front), second row facing left, third row facing up (back). The 3 columns are the walk poses matching the base body's legs exactly: standing, left foot forward, right foot forward. Draw ONLY the pairs of shoes floating exactly where they would be on the body's legs and feet in that pose. Do NOT draw the body, skin or anything else. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```
