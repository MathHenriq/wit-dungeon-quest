# O que falta do GPT para os professores (16/10)

Os professores hoje são montados **só com a arte que já está no jogo**: os 10 modelos,
as cores e os acessórios do GPT, todos com a camisa verde (`look` em
`src/game/world/professores.ts`, folha `docs/professores-visual.png`). O que a arte do
jogo ainda não tem fica para estas 6 imagens. São peças genéricas, não uma por professor:
o jogo pinta cada uma com as cores de quem usa.

Anexe a folha `public/Novos assets/personagem/modelos/modelo-01.png` em todas. Fundo
magenta. Salve com o nome do título em `public/Novos assets/personagem/` (as de veículo
em `public/Novos assets/veiculos/`). Eu escrevo o importador quando chegarem.

| Imagem | Para quem |
|---|---|
| `acessorios-5.png`: óculos de grau (4 tipos) + capacete aberto | Macedo, Mayara, Dante, Vitor, Felipe, Grazyelle; capacete de quem anda de moto |
| `acessorios-6.png`: barbas (5 tipos) | Macedo, Dante, Guilherme, Vitor, Felipe, Wellington, Maycon, Servilha, Valton, Lucatto |
| `modelo-11.png`: cacheado médio feminino | Mayara, Leticia |
| `modelo-12.png`: ondulado comprido feminino | Grazyelle |
| `veiculo-carro.png`: carrinho compacto preto | Valton |
| `veiculo-moto.png`: moto vermelha e branca | Lucatto (e Dante e Wellington) |

A camisa com **WIT escrito** também não existe na arte: hoje é só a camisa verde. Para ter
as letras, peça a camisa com "WIT" nos modelos novos ou me diga se pode ser escrito por
código.

**acessorios-5.png**
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different accessories only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one accessory; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the accessories floating exactly where they would sit on the body, same size and position as on the base body's standing frame for each direction. Do NOT draw the body, skin or face. The 5 pieces, one per row: 1) thin round prescription eyeglasses, 2) large round prescription eyeglasses, 3) large square prescription eyeglasses, 4) small rectangular prescription eyeglasses, 5) open-face motorcycle helmet with one stripe in the middle. The eyeglasses sit exactly at eye level and have clear see-through lenses: draw only the thin frame, so the eyes will stay visible; in the back view only the temple arms show at the sides of the head. All in plain white and light gray tones so it can be recolored in the game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**acessorios-6.png**
```
Using the attached base body sprite sheet as reference for size and proportions, draw a sprite sheet of 5 different facial hair pieces only, arranged in a grid of 5 rows and 4 columns with empty space between cells. Each ROW is one piece; the 4 COLUMNS are the 4 directions of that same piece, in this exact order: facing down (front), facing left, facing right, facing up (back). Draw ONLY the facial hair floating exactly where it would sit on the face of the base body's standing frame for each direction, same size and position. Do NOT draw the body, skin, eyes or face. The 5 pieces, one per row: 1) mustache, 2) small goatee on the chin, 3) mustache connected to a goatee, 4) short full beard along the jaw, 5) big thick full beard. In the side views the beard follows the jaw line; in the back view (column 4) draw only what would show at the sides of the head, or leave the cell empty. All in plain white and light gray tones so it can be recolored in the game with the hair color. Neat, friendly, cartoon style for a kids game. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text.
```

**modelo-11.png** (cacheado médio feminino, camiseta, calça)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful young woman in big-head chibi style, with light tan skin (#E8B48C), simple dot eyes with small eyelashes, with shoulder-length voluminous curly hair painted in flat bright cyan (#20B4C8), clearly feminine, wearing a short-sleeve t-shirt painted in flat bright green (#3CB44A), long straight pants painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**modelo-12.png** (ondulado comprido feminino, camiseta, calça)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, draw a new ORIGINAL character, not based on any existing game or anime character: a cheerful young woman in big-head chibi style, with light tan skin (#E8B48C), simple dot eyes with small eyelashes, with long wavy hair past the shoulders painted in flat bright cyan (#20B4C8), clearly feminine, wearing a short-sleeve t-shirt painted in flat bright green (#3CB44A), long straight pants painted in flat royal blue (#3456C8), and plain white sneakers. These are placeholder colors for a character creator that recolors each part inside the game: use ONLY these colors for the hair, the top and the bottom, each with just 3 shades of the same hue (shadow, base, highlight). No other colors, no patterns, no stripes, no logos, no backpack, no hat, no accessories. Modest clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (facing up, back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row, including row 1. The hair keeps exactly the same shape in all frames of the same direction. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

**veiculo-carro.png** (Valton)
```
Using the attached sprite sheet as the exact reference for this character (same hair shape, same clothes, same placeholder colors: skin #E8B48C, hair flat cyan #20B4C8, top flat green #3CB44A, bottom flat royal blue #3456C8; same proportions and outline), draw a pixel art sprite sheet of the SAME character driving a small rounded black hatchback city car with a closed roof and big round headlights (no brand, no logo), the driver's head and shoulders clearly visible through the windshield and side window, 4 rows (row 1 driving down toward the viewer, row 2 driving left, row 3 driving right, row 4 driving away) by 4 animation frames (wheels turning), top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, the car about two times the width of the character, clean dark outlines, limited palette, no anti-aliasing. The car body is glossy black; only the driver uses the placeholder colors. Friendly, original, no text. Flat solid magenta background (#FF00FF).
```

**veiculo-moto.png** (Lucatto, Dante, Wellington)
```
Using the attached sprite sheet as the exact reference for this character (same clothes, same placeholder colors: skin #E8B48C, top flat green #3CB44A, bottom flat royal blue #3456C8; same proportions and outline), draw a pixel art sprite sheet of the SAME character riding a small street motorcycle painted red and white, wearing a white open-face helmet that covers the hair, sitting on the seat with both hands on the handlebar, 4 rows (row 1 riding down toward the viewer, row 2 riding left, row 3 riding right, row 4 riding away) by 4 animation frames (wheels turning), top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, same scale as the character, clean dark outlines, limited palette, no anti-aliasing. Only the rider's skin, top and bottom use the placeholder colors. Friendly, original, no text, no logos. Flat solid magenta background (#FF00FF).
```
