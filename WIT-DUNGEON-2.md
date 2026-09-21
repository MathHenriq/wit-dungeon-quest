# WIT Dungeon 2 — a virada para TCG

> Plano escrito em 21/09/2026, com leitura direta do banco de produção
> (`pvnzfiyxwvfmmhvpvrrk`) e do código na `main`. O `ROADMAP.md` continua
> valendo para o estado atual e a dívida técnica; este documento é só a
> transformação.

---

## 0. O medo da arte, respondido com número

A preocupação era: *"é MUITA arte pra criar"*. Fui ao banco ver quanta arte o
jogo realmente precisa. A resposta muda o projeto.

| | |
|---|---|
| Cartas cadastradas na loja | 854 |
| Cartas que **algum** aluno já teve | **229** |
| Cartas que alguém já **equipou** | **68** |
| Cartas que ninguém nunca tocou | **625** |
| Alunos com algum item no inventário | 138 de 685 |

E a concentração:

| Recorte | Cobertura da posse total |
|---|---|
| 30 cartas mais possuídas | 38% |
| 60 cartas | **58%** |
| 100 cartas | 74% |
| 150 cartas | 84% |

**Você não precisa de 854 artes. Precisa de ~130.**

As 625 cartas que ninguém nunca teve não são acervo — são entulho. A raridade
`unknown` tem 51 cartas cadastradas e **zero** posse. Aposentar isso não é
perda, é foco: um TCG com 150 cartas boas ganha de um com 854 de enchimento.

Esse é o primeiro passo do plano, e é de graça: nenhuma arte nova, só decidir
o que fica.

---

## 1. Por que a arte de hoje não serve

Não é questão de gosto. São três fatos medidos.

**Resolução.** As 162 artes têm 225–260 px de largura e 4–10 kB. São
miniaturas. Uma carta em destaque num TCG ocupa ~260×360 na tela; em tela 2×
isso pede ~520×720 de arte. No momento em que a carta vira o centro do jogo —
que é a proposta inteira — ela borra.

**Repetição.** 842 cartas dividem 162 artes: 5,1 cartas por ilustração. Numa
loja de itens ninguém nota. Num TCG, abrir um pacote e ver a mesma imagem
cinco vezes mata a sensação de coleção.

**Origem.** Os nomes dos arquivos são de obras licenciadas — Fire Force,
Berserk, Dragon Ball, Fullmetal Alchemist, Black Clover, My Hero Academia,
Fate. Serve para um projeto interno de 685 alunos; não serve para o jogo com
identidade própria que você descreveu, e o risco cresce junto com a
visibilidade.

Os três problemas têm **uma solução só**: gerar arte original em alta
resolução, num estilo único. Resolve resolução, repetição e origem de uma vez
— e de quebra dá ao WIT a identidade visual que hoje não existe.

---

## 2. A estratégia que torna a arte viável

A conta assustadora é "854 cartas × 1 arte cada". A conta real é outra.

### 2.1 Nem toda carta merece o mesmo investimento

| Faixa | Quantas | Tratamento | Arte nova |
|---|---|---|---|
| Assinatura (lendária/mítica) | ~30 | Ilustração única, animação própria, moldura animada | 30 |
| Núcleo (épica/rara) | ~40 | Ilustração única, moldura com brilho | 40 |
| Base (comum/incomum) | ~60 | **Famílias visuais** — mesmo motivo elemental com variações | ~20 famílias |
| **Total de artes a gerar** | | | **~90–130** |

As cartas base são o truque. Doze cartas de fogo comuns não precisam de doze
ilustrações: precisam de uma linguagem de fogo com variações de composição e
cor. Isso é mais barato **e** lê melhor como conjunto — é assim que TCG de
verdade organiza o visual.

### 2.2 A moldura multiplica a arte

A mesma ilustração numa moldura comum e numa moldura lendária com foil,
partículas e brilho animado **lê como duas cartas diferentes**. Molduras são
CSS e shader: meu lado, custo único, reuso infinito.

Sete raridades já existem no banco. Sete molduras bem feitas valem mais, para
a sensação de coleção, do que cinquenta ilustrações medianas.

### 2.3 Geração em lote, curadoria humana

O fluxo que eu montaria:

1. Você aprova **um** estilo (fase 0 abaixo).
2. Eu escrevo o pipeline: prompt-base com o estilo travado + variação por
   elemento/tema, geração em lote, corte, upscale, compressão, nomeação e
   inserção no banco.
3. Cada carta gera 4–6 opções. Você aprova numa tela de curadoria — sim/não,
   rápido.
4. O que passa entra no jogo automaticamente.

130 artes × 5 opções = ~650 gerações. Isso é trabalho de algumas horas de
processamento e algumas sessões de curadoria sua. Não é um ano de ilustração.

### 2.4 Os bonequinhos

Hoje são **1.258 sprites de 96×96 px**. Num TCG eles não precisam existir
nessa forma: o personagem vira um **retrato de carta**, no mesmo estilo do
resto.

E a distribuição de classes ajuda muito:

| Classe | Alunos |
|---|---|
| Mago | 115 |
| Guerreiro | 84 |
| Samurai | 26 |
| Necromante | 25 |
| Arqueiro | 25 |
| *(outras 13 classes)* | 1–18 cada |

As 5 primeiras cobrem ~72% dos alunos. Com **8 retratos de classe**, cada um
com tratamento de cor por elemento, você cobre praticamente todo mundo. Oito
artes substituem 1.258 sprites.

> Achado de dados no caminho: existem `Espiao` (18 alunos) e `Espião` (17)
> como classes separadas. São a mesma, divididas por acento. Corrigir é uma
> migração de uma linha.

---

## 3. As fases

Cada fase entrega algo jogável. Nenhuma depende de terminar toda a arte.

### Fase 0 — A decisão de estilo · 1 tarde

**Nada começa antes disto.** É a decisão mais importante do projeto inteiro,
e a mais barata de tomar.

- Eu gero **3 direções visuais** para a mesma carta (a mesma habilidade,
  três estilos: por exemplo, pintura digital dramática / arte vetorial limpa
  e moderna / pixel art refinada de alta resolução).
- Renderizo as três dentro da moldura de lendária, no campo de batalha.
- Você olha e escolhe uma.

Sai daqui: um **guia de estilo** travado — paleta, tratamento de luz,
enquadramento, ritmo de detalhe. Tudo depois se ancora nele.

**Sua parte:** escolher. **Minha parte:** gerar e renderizar.

---

### Fase 1 — A fatia vertical · 2 a 3 semanas

Uma batalha completa, linda, pequena. O objetivo é sentir se funciona.

- **12 cartas** na identidade escolhida (arte + moldura + efeito)
- **Deck de 8**, mão de 4, um recurso de turno
- **Campo de batalha TCG**: hoje é layout Pokémon (sprites frente a frente,
  diálogo embaixo, 4 botões). Vira mesa: mão na base, campo no centro,
  recursos e vida nas laterais
- **Uma família de animação** completa (proponho fogo) — invocação, impacto,
  resolução
- **Um retrato de classe** novo no lugar do bonequinho

Arte nova nesta fase: **13 peças.** É isso.

Se uma turma vibrar com essa batalha, o resto do plano tem direção. Se não
vibrar, você descobriu barato.

---

### Fase 2 — Identidade completa · 4 a 6 semanas

- **7 molduras** de raridade com tratamento próprio (foil, brilho, partículas)
- **Renderizador de carta** único: frente, verso, estados (na mão, jogada,
  destruída, no deck)
- **~60 artes** no total (as 12 da fase 1 + 48)
- **Famílias de animação** por elemento, parametrizadas — não uma animação por
  carta, mas uma linguagem por elemento com variações
- **8 retratos de classe**
- Limpeza do catálogo: aposentar as 625 cartas mortas

Arte nova nesta fase: **~55 peças.**

---

### Fase 3 — A coleção · 4 semanas

Aqui o TCG vira TCG de verdade.

- **Construtor de deck** — a tela que hoje não existe e que é o coração do
  gênero
- **Tela de coleção** com filtros, progresso, "faltam 12 para completar Fogo"
- **Pacotes/baús** com abertura cinematográfica (o sistema de baús já existe)
- **~130 artes** no total
- Cartas de turma: só funcionam com cooperação entre alunos

Arte nova nesta fase: **~70 peças.**

---

### Fase 4 — 2.5D e 3D · depois

Só depois que o TCG estiver de pé. A base já existe: `three`,
`@react-three/fiber` e `@react-three/drei` estão instalados e em produção.

- **2.5D primeiro**: câmera, profundidade, parallax, iluminação no campo de
  batalha. Roda em qualquer Chromebook
- **Carta em 3D** girando na revelação — alto impacto, escopo pequeno
- **Um mapa 3D** carregado sob demanda, com fallback automático
- **Hub social** por último

> Orçamento medido, não estimado: a tela de batalha saiu de 45 para 60 fps
> nesta sessão **removendo animação simultânea**. Num Chromebook cabe **uma
> animação cinematográfica por vez, com a tela limpa durante ela**. Isso não
> limita o espetáculo — TCG bom já funciona assim, uma carta de cada vez tem
> o palco. Mas mata a ideia de várias animações tocando juntas.

---

## 4. Quem faz o quê

| Meu lado (código) | Seu lado (decisão e curadoria) |
|---|---|
| Pipeline de geração e processamento de arte | Escolher o estilo (fase 0) |
| Tela de curadoria para aprovar/reprovar | Aprovar as artes geradas |
| Renderizador de carta e as 7 molduras | Decidir quais das 625 mortas voltam |
| Campo de batalha TCG | Nomes, textos e sabor das cartas |
| Deck de 8, mão, recurso de turno | Balanceamento |
| Famílias de animação por elemento | |
| Construtor de deck e coleção | |
| Limpeza do catálogo | |

---

## 5. O que precisa ser decidido antes de começar

1. **Estilo visual.** Fase 0. Tudo trava nisso.
2. **Quantas cartas o WIT 2 terá.** Minha proposta: ~150 ativas, das quais 30
   de assinatura. Hoje são 854 com 229 em uso real.
3. **A árvore de skills.** Dado novo: **685 alunos têm pontos, 0 desbloquearam
   qualquer skill.** Ela está morta em produção. Minha recomendação é
   transformá-la em Maestria — modificadores que mudam como as cartas se
   comportam ("Cartas de Fogo aplicam +1 Queimadura") em vez de mais botões de
   ataque. Não se perde nada, porque não há nada em uso.
4. **O que fazer com as 162 artes atuais.** Sugiro manter em produção até a
   fase 2 e substituir em lote, para não deixar o jogo feio no meio do
   caminho.

---

## 6. Pendência que não é deste plano, mas é urgente

Duas RPCs estão abertas em produção, verificadas no banco:

- `award_skill_points(p_student_id, p_points)` — `SECURITY DEFINER`, com
  grant para `anon` e `authenticated`, **sem nenhuma checagem de quem chama**.
  Qualquer pessoa, sem login, pode dar pontos infinitos a qualquer aluno. O
  repositório e o site são públicos, então a URL e a chave do Supabase estão
  ao alcance de quem abrir o DevTools.
- `unlock_skill(p_skill_id, p_cost, p_prerequisites)` — checa `auth.uid()`,
  mas **recebe preço e pré-requisitos do cliente**. Passando custo 1 e
  pré-requisitos nulos, desbloqueia qualquer nó ignorando a árvore.

Não faz parte do WIT 2, e você pediu para não mexer em RPC agora. Registro
aqui porque economia que dá para forjar não sustenta um TCG — e o conserto é
de cerca de meia hora.
