# Os professores do WIT dentro do jogo

> Atualizado em 09/10/2026. Já está no jogo (branch `claude/fazenda-lago-casa-lore`):
> os 12 professores andam pela cidade com rotina por hora, entregam as tarefas do curso,
> almoçam juntos, têm passatempo e casa. Falta só o visual de cada um (feito a partir da
> foto, §5). Código: `src/game/world/professores.ts` (+ testes).

---

## 1. Quem é quem

O curso de cada um é **proposta lógica** (o Matheus disse "faça da forma lógica"): IA
como ele tinha dito; os três gamers na Oficina de Games; foto, leitura e música na
Comunicação Digital. Trocar é uma linha em `professores.ts`.

| Professor | Curso (proposta) | Mora em | Passatempo |
|---|---|---|---|
| Prof. Dante | IA | Centro, casa laranja | **anda de moto** com o Wellington (casaco preto) |
| Prof. Wellington | IoT | Centro, casa roxa | **anda de moto** com o Dante |
| Profa. Mayara | IA | Cidade WIT, Moradia 3 | **jiu-jitsu** em casa |
| Prof. Matheus Macedo | IA | Centro, casa verde | **PC gamer** e, no fim da tarde, **churrasco** |
| Prof. Guilherme Rodrigues | IoT | Cidade WIT, Moradia 4 | **muay thai** em casa |
| Prof. Matheus Servilha | Oficina de Games | Centro, casa vermelha | **joga games em casa** (o Vitor e o Miguel vão para lá) |
| Prof. Vitor | Oficina de Games | Cidade WIT, Moradia 1 (divide com o Miguel) | joga na casa do Servilha |
| Prof. Miguel | Oficina de Games | Cidade WIT, Moradia 1 | joga com o Vitor e o Servilha |
| Profa. Leticia | Comunicação Digital | Centro, casa azul | **lê livros** na praia do Lago |
| Prof. Felipe Oliveira | Comunicação Digital | Centro, Casa do Músico | **toca guitarra** na praça |
| Prof. Maycon | Metaverso | Cidade WIT, Moradia 2 | **vende cachorro-quente** na praça |
| Profa. Grazyelle | Comunicação Digital | Centro, Ateliê | **tira fotos** pelo Lago |

---

## 2. A rotina (relógio do jogo)

| Hora | Onde | O que acontece quando o aluno fala com ele |
|---|---|---|
| 0h–8h | em casa | bater na porta: ele atende |
| **8h–12h** | **na porta do prédio do curso**, na Cidade WIT | **abre as tarefas do curso** (o professor entrega o trabalho) |
| 12h–14h | **almoço em volta do carrinho do Maycon**, na praça do Centro | conversa |
| 14h–19h | **passatempo** (no mapa ou em casa) | fala do passatempo; o Maycon **vende cachorro-quente** (enche a barriga); a Grazyelle **tira uma foto sua** (vai para o álbum) |
| 19h–24h | em casa | bater na porta: ele atende |

- A jogatina na casa do Servilha vai até as 22h, com o Vitor e o Miguel.
- **Bater na porta** de quem não está em casa diz onde ele está ("Ninguém atende. A Profa.
  Mayara deve estar dando aula de Inteligência Artificial na Cidade WIT."). Os alunos
  aprendem a rotina e vão atrás.
- A Casa do Músico e o Ateliê continuam abrindo os trabalhos de música e de arte; quando o
  dono está em casa, aparece "Prof. Felipe Oliveira está aqui: toca guitarra".
- O "Professor" genérico que ficava na praça da Cidade WIT saiu.

### Na história (`docs/historia.md`)
Sempre do bem: nunca suspeitos, nunca vilões, nunca viram carta. No Ato 2 percebem que a
turma anda esquecendo as aulas; no Ato 3 os de IoT ajudam a consertar o farol; no final,
quando o Vale vira carta, a Cidade WIT é o último lugar aceso e **os professores
comandam a resistência**.

---

## 3. O que ainda falta

| Falta | Por quê |
|---|---|
| **O boneco de cada um, feito pela foto** | hoje usam os modelos recoloridos (provisório) |
| As **ações** (moto, jiu-jitsu, muay thai, PC, churrasco, guitarra, leitura, câmera, carrinho) | precisa da arte; hoje eles ficam parados ou andando, e a ação aparece na fala |
| Ver o professor **dentro de casa** fazendo a atividade | com a arte da ação, ele aparece na sala da casa; hoje a porta conta |
| "**Seu** professor te reconhece pelo apelido" e o recado da semana | precisa do banco ligado (saber de qual professor é a turma) |
| Moto de verdade (andando rápido pela rua) | a arte da moto com o boneco (§5) |

---

## 4. As fotos: onde colocar

**Direto no GPT.** A arte do jogo já sai do GPT; a foto só serve de referência lá.
1. No seu computador, uma pasta `fotos-professores/` com uma pasta por professor
   (`dante/`, `mayara/`...). Uma foto de rosto e uma de corpo inteiro bastam.
2. Uma conversa no GPT por professor: anexe a foto + a folha de referência
   (`public/game/sprites/modelos/modelo-01.png`) e cole o prompt do §5.
3. **As fotos nunca entram no repositório** (nem em `public/`): só o boneco pronto.
4. Cada professor vê o próprio boneco antes de entrar no jogo.

A pasta no Cowork não ajuda: quem gera a imagem é o GPT.

---

## 5. Prompts (um professor por vez)

Salve em `public/Novos assets/personagem/professores/` com o nome indicado. Fundo
magenta, como todo o resto. Depois eu importo e troco o visual provisório.

### 5.1 O boneco andando — `prof-<id>.png` (todos os 12)
Troque o `[detalhe]` pelo que está na linha de cada um abaixo.
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, and the attached photo ONLY as a reference for the person's look, draw a friendly chibi pixel-art version of this adult teacher: same skin tone, hair style and hair color, facial hair, glasses and typical clothing style as in the photo, simplified and cute, respectful and recognizable, not a caricature. [detalhe]. Slightly taller than the kid in the reference, still big-head chibi proportions. Modest everyday clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```
| Arquivo | `[detalhe]` |
|---|---|
| `prof-dante.png` | Wearing a black jacket |
| `prof-wellington.png` | Everyday clothes as in the photo |
| `prof-mayara.png` | Everyday clothes as in the photo |
| `prof-macedo.png` | Everyday clothes as in the photo |
| `prof-guilherme.png` | Everyday clothes as in the photo |
| `prof-servilha.png` | Everyday clothes as in the photo, headphones around the neck |
| `prof-vitor.png` | Everyday clothes as in the photo |
| `prof-miguel.png` | Everyday clothes as in the photo |
| `prof-leticia.png` | Everyday clothes as in the photo |
| `prof-felipe.png` | Everyday clothes as in the photo |
| `prof-maycon.png` | Everyday clothes as in the photo |
| `prof-grazyelle.png` | Everyday clothes as in the photo, a camera strap on the shoulder |

### 5.2 A ação — `prof-<id>-acao.png` (anexe a folha do boneco pronta, não a foto)
```
Using the attached character sprite sheet as the exact reference for this character (same face, hair, skin, clothes, proportions and outline), draw a pixel-art animation of the SAME character [ação], 1 row of 4 frames, facing the viewer at a slight 3/4 angle, same frame size and scale as the reference, a simple looping motion. Crisp pixel art like Pokémon HeartGold/SoulSilver, clean dark outlines, no anti-aliasing, friendly and modest. Flat solid magenta background (#FF00FF). No text, no ground, no shadow.
```
| Arquivo | `[ação]` |
|---|---|
| `prof-mayara-acao.png` | practicing jiu-jitsu on a blue mat, wearing a white gi with a belt, doing a drill |
| `prof-guilherme-acao.png` | training muay thai, kicking and punching a hanging heavy bag, wearing hand wraps |
| `prof-macedo-acao.png` | sitting at a gaming PC with RGB lights, playing with keyboard and mouse |
| `prof-macedo-churrasco.png` | grilling skewers at a small brick barbecue grill, a little smoke rising |
| `prof-servilha-acao.png` | sitting on a couch playing a video game with a controller, excited |
| `prof-vitor-acao.png` | sitting on a couch playing a video game with a controller |
| `prof-miguel-acao.png` | sitting on a couch playing a video game with a controller, cheering |
| `prof-leticia-acao.png` | sitting and reading a book, turning a page |
| `prof-felipe-acao.png` | playing an electric guitar, music notes floating |
| `prof-maycon-acao.png` | behind a small red hot dog cart with an umbrella, handing out a hot dog |
| `prof-grazyelle-acao.png` | taking a photo with a camera, a small flash |

### 5.3 Na moto — `prof-dante-moto.png` e `prof-wellington-moto.png`
```
Using the attached character sprite sheet as the exact reference for this character (same face, hair, skin, clothes, proportions and outline), draw a pixel art sprite sheet of the SAME character riding a motorcycle and wearing a helmet, 4 rows (row 1 facing down toward the viewer, row 2 facing left, row 3 facing right, row 4 facing away) by 4 animation frames, top-down 3/4 view like Pokémon HeartGold/SoulSilver overworld sprites, same scale as the reference character, clean dark outlines, limited palette, no anti-aliasing. Friendly, original, no text, no logos. Flat solid magenta background (#FF00FF).
```
(O Dante de casaco preto.)
