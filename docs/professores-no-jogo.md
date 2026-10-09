# Os professores do WIT dentro do jogo

> Atualizado em 09/10/2026 com o retorno do Matheus: **todos os professores são moradores
> que andam pela cidade todos os dias**, e o visual de cada um é feito **a partir da foto
> real** (uso autorizado por todos).

---

## 1. O que existe hoje

Na Cidade WIT, a porta de cada prédio de curso abre direto o painel de trabalho
(`WORK_DOORS` em `CityDemo.tsx`): não há sala por dentro nem ninguém entregando a tarefa.
O único "professor" é um morador genérico chamado "Professor" na praça (`content.ts`),
que sai quando os professores de verdade entrarem.

---

## 2. Quem é quem

| Sala (prédio que já existe) | Curso | Professores | Tarefas que entregam (já existem) |
|---|---|---|---|
| Estúdio de Comunicação (`estudio`) | Comunicação Digital | **Prof. Gabriel, Prof. Matheus Camilo, Profa. Joyce** | escrever matéria, jornalzinho, fato ou boato, notícia, entrevista |
| Laboratório de IA (`lab-ia`) | IA | **Prof. Matheus Macedo, Profa. Mayara, Prof. Dante** *(a confirmar)* | programar o robô, testar o modelo, rotular dados, caça aos dados |
| Casa Inteligente (`casa-iot`) | IoT | *faltam os nomes* | regra SE/ENTÃO, circuito, sensores, conserto dos postes |
| Metaverso (`metaverso`) | Metaverso | *faltam os nomes* | coordenadas 3D, Sala Virtual, pares 3D, escanear a cidade |
| Oficina de Games (`oficina-games`) | Oficina de Games | *faltam os nomes* | lógica do jogo, teste de jogo, caça-bugs |

Trabalhos de fora do WIT (Padaria da Dona Rosa, Doces da Dona Ana, Casa de Pesca, Fazenda)
continuam com um morador só.

---

## 3. A rotina de cada professor (todos os dias)

Como os moradores do Stardew: cada professor tem **horário**. O motor da cidade já move
moradores por rotas entre áreas (`job.route` em `content.ts`, `zona` para a área).

| Hora do jogo | Onde está | O que faz |
|---|---|---|
| 7h–8h | sai de casa (Bairro Novo) | passa pela padaria, cumprimenta quem encontra |
| 8h–12h | **na sala do curso**, na mesa dele | entrega as tarefas do curso |
| 12h–14h | almoço: praça, padaria ou quiosque do lago | conversa |
| 14h–18h | **o passatempo dele**, em qualquer área | ver abaixo |
| 18h–20h | volta pela cidade | |
| 20h–7h | em casa (cada um tem uma casa no Bairro Novo, com interior) | |

**Passatempo de cada um, escolhido pelo próprio professor:** pescar no cais, cuidar da
horta na fazenda, duelar na Arena, correr em volta do lago, desenhar no Ateliê, tocar no
Estúdio de Música, passear de bicicleta... Encontrar o professor no lugar favorito dele
vira assunto na escola ("o Prof. Dante pesca toda tarde no cais!").

### O que o aluno ganha falando com eles
- **Tarefas** na sala do curso (o painel de hoje, agora entregue por uma pessoa).
- **O professor da turma do aluno reconhece ele** e cumprimenta pelo apelido (o banco já
  separa os alunos por professor): "E aí, <apelido>! Bom te ver depois da aula de terça."
- **Recado da semana:** um campo novo no painel do professor; o boneco fala o recado para
  a turma dele.
- As **Missões da sala** (já existem) passam a ser entregues pela boca do professor.
- **Amizade** como com qualquer morador (corações, presentes, aniversário), com cenas
  curtas escritas junto com cada professor.
- **Falas do dia** que mudam com a estação, o clima e o capítulo da história, sempre
  aprovadas pelo próprio professor.

---

## 4. O visual a partir da foto

O boneco segue o padrão dos moradores que já existem: **uma folha 4 × 4 do GPT** (16
quadros de andar: frente, esquerda, direita, costas), cores de verdade, importada para
`public/game/sprites/npcs/` como os desafiantes (`npc-desafiante-XX`, quadros de 64 × 80).

### Passo a passo
1. Cada professor manda **uma foto de frente e uma de corpo inteiro**, com a roupa que
   costuma usar.
2. O Matheus anexa no GPT: a foto + `public/game/sprites/modelos/modelo-01.png` (para o
   tamanho e a grade) e usa o prompt abaixo.
3. A folha vai para `public/Novos assets/personagem/prontos/prof-<nome>.png` e passa pelo
   importador do personagem, como as outras.
4. **Revisão com o próprio professor:** ele aprova o boneco antes de entrar no jogo.
5. Opcional: um **retrato** (busto) para a caixa de diálogo, no mesmo estilo.

### Prompt da folha (um por professor)
```
Using the attached sprite sheet ONLY as a reference for grid, frame size, proportions, poses and walk cycle, and the attached photo ONLY as a reference for the person's look, draw a friendly chibi pixel-art version of this adult teacher: same skin tone, hair style and hair color, facial hair, glasses and typical clothing style as in the photo, simplified and cute, respectful and recognizable, not a caricature. Slightly taller than the kid in the reference, still big-head chibi proportions. Modest everyday clothing. Exactly the same grid as the reference: 4 rows and 4 columns, 16 frames, same positions, same size, same poses frame by frame. Row 1 walking toward the viewer (facing down), row 2 walking to the LEFT, row 3 walking to the RIGHT, row 4 walking away from the viewer (back view). Each walk cycle: frame 1 standing, frame 2 left foot forward, frame 3 standing, frame 4 right foot forward, with clearly visible leg movement in every row. Crisp pixel art like Pokémon HeartGold/SoulSilver overworld sprites, clean dark outlines, no anti-aliasing. Flat solid magenta background (#FF00FF). No shadow, no text, no ground.
```

### Prompt do retrato (opcional)
```
Using the attached photo ONLY as a reference for the person's look and the attached sprite sheet for the art style, draw a bust portrait of this adult teacher in the same crisp pixel-art style (Pokémon HeartGold/SoulSilver), friendly smile, facing the viewer, same skin tone, hair, facial hair, glasses and clothing style, respectful and recognizable, not a caricature. Square image, flat solid magenta background (#FF00FF). No text.
```

### Cuidado com as fotos
- **As fotos não entram no repositório**, nem em `public/`. Só o boneco gerado entra.
  Ficam com o Matheus (ou no rascunho de Release `Assets`, como os zips da arte, se ele
  preferir).
- O boneco não leva sobrenome nem nada além do nome que o professor escolher na
  plaquinha.

---

## 5. Na história (`docs/historia.md`)

Os professores são **sempre do bem**: nunca suspeitos, nunca vilões, nunca viram carta.
- **Ato 2:** são os primeiros a perceber que "metade da turma esqueceu a aula de ontem"
  e viram aliados contra o chá do esquecimento.
- **Ato 3:** os de IoT ajudam a consertar o circuito do farol.
- **Final:** quando o Vale inteiro vira carta, **a Cidade WIT é o último lugar aceso** e os
  professores comandam **a resistência**. É o QG do aluno no capítulo final.

---

## 6. Regras

1. Autorização de cada professor (o Matheus confirmou que todos autorizaram).
2. **Professor saiu do WIT?** `ativo: false` no arquivo de configuração tira o boneco na
   hora.
3. Falas fixas aprovadas pelo próprio professor; o recado da semana é escrito por ele.

---

## 7. Construção

| Passo | O quê |
|---|---|
| 1 | `src/game/world/professores.ts`: nome, curso, sala, sprite, casa, rotina por hora, passatempo, falas, `ativo` |
| 2 | Moradores da cidade aceitarem **sprite próprio** (hoje os da rua usam o `Look` com recolor; os de sala já usam `npc-desafiante-XX`) e **rotina por hora** (hoje a rota não depende da hora) |
| 3 | Interior das 5 salas do WIT e das casas dos professores no Bairro Novo (atlas de móveis) |
| 4 | Porta do curso leva à sala; falar com o professor abre as tarefas |
| 5 | Cumprimento do professor da turma pelo apelido; "Recado no jogo" no painel do professor; Missões da sala pelo boneco |

---

## 8. O que ainda preciso

1. Confirmar: "no dia A" = "**na de IA**" (Prof. Matheus Macedo, Profa. Mayara, Prof.
   Dante no Lab de IA)?
2. Os professores de **IoT, Metaverso e Oficina de Games**.
3. O **passatempo** que cada professor quer ter no jogo.
4. As fotos (por fora do repositório).
