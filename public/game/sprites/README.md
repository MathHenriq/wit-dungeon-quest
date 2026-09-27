# Sprites do WIT Dungeon 2

Estilo: pixel art 32×32 no padrão Pokémon HGSS/BW (cabeça grande, contorno
preto). Exibir sempre ampliado por número inteiro (2× ou 3×) e com
`image-rendering: pixelated`.

| Pasta | O quê |
|---|---|
| `modelos/` | **Personagem atual** (jogador e moradores): 10 modelos-base, `modelo-XX.png` com 4 × 4 quadros de 32 × 40 (linhas frente, esquerda, direita, costas; colunas parado, pé esquerdo, parado, pé direito) pintados na paleta-molde. Gerado por `scripts/arte/importar-personagem.py`; o jogo repinta com `src/game/world/outfit.ts`. |
| `base/` | Boneco base neutro. `south/west/east/north.png` parado; `andar-<direção>-<0..5>.png` caminhada em 6 quadros. Todas as camadas de customização (cabelo, roupa, acessório) são desenhadas por cima destes quadros. |
| `pets/raposa-chama/` | Pet: 4 direções + caminhada (6 quadros). |
| `pets/pintinho-broto/` | Pet: 4 direções (sem caminhada ainda). |
| `referencia/` | `estilo-menina-coques.png`: sprite de referência de estilo. `base-editada.png`: a base antes de girar. |

## Como foram feitos

1. PixelLab (`/generate-with-style-v2`) gerou 64 variações de uma personagem
   original usando sprites de Pokémon só como referência de estilo.
2. A escolhida foi editada por código para virar o boneco base (sem coques,
   camiseta branca, bermuda cinza).
3. PixelLab `/create-character-v3` girou para as 4 direções (1 geração) e
   `/animate-character` com `walking` fez a caminhada (1 geração por direção).
4. Pets: `/create-character-v3` só por texto + `walk-6-frames` (quadrúpedes).

Cores de cabelo, camiseta e bermuda trocam por código, sem gerar de novo.

Plano gratuito da PixelLab: 5 gerações por dia depois do teste.
A chave da API nunca vai para o repositório.
