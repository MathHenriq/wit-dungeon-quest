# Plano completo — WIT Dungeon 2

> Escrito em 26/09/2026 a partir das conversas com o Matheus. Substitui a
> seção de fases do `WIT-DUNGEON-2.md`. Regras do jogo de cartas:
> `docs/regras-tcg.md`. Tudo marcado **(proposta)** tem número a validar por
> simulação ou por teste com alunos antes de virar regra.

---

## 1. A ideia em uma frase

**O que tem valor no WIT Dungeon nasce na sala de aula; o jogo é onde esse
valor vira diversão.** O aluno que vai à aula e se dedica sai na frente. O
aluno que só joga em casa progride, mas mais devagar.

### Por que mudar (dados de produção, 26/09/2026)

| | |
|---|---|
| Mudanças de moedas feitas pelo próprio jogo | 18.905 (92%) |
| Mudanças de moedas feitas pelo professor | 1.527 (8%) |
| Presenças aprovadas pelo professor, na história toda | 90 (para 683 alunos) |

A recompensa da sala praticamente não existe no sistema porque dar
recompensa é lento. **Deixar o professor rápido é o conserto do problema
principal**, não um detalhe do painel.

Jogar pouco (30 min/mês) é esperado: a aula é de IA, não de jogo, e o jogo
hoje não funciona no celular. O WIT 2 precisa **funcionar no celular**, para o
aluno jogar em casa com o que ganhou na sala.

---

## 2. Decisões registradas

### Jogo
- **As cartas são sempre o centro.** Nenhum sistema de progressão pode pesar
  tanto quanto uma carta lendária.
- **Qualquer herói usa qualquer carta.** Elemento nunca limita o deck.
- Atributos saem. Árvore de skills sai do jeito que é hoje.
- As classes viram **Heróis**, cada um com um **deck inicial temático**.
  O aluno **mantém todas as cartas que já tem**.
- Batalha comum: dá para vencer em **~2 min**. Chefe: **no máximo ~7 min**.
- Nada de brilho exagerado. Visual com marca própria.

### Onde se ganha carta
- Conquistando chefes e abrindo pacotinhos (já decidido em `regras-tcg.md`).
- **Garantia no pacotinho:** a cada 10 pacotes sem Épica ou melhor, o próximo
  garante uma.
- **Forja:** duplicata vira pó; o pó cria a carta escolhida.
- **Álbum** de coleção com espaços vazios visíveis e recompensa por página
  completa.
- **Coleções temáticas** (ex.: "Girl Power", magical girl, idol/k-pop).

### Sistemas: fica, muda ou sai
| Sistema | Destino |
|---|---|
| Guilda | **Fica e vira equipe.** Foco: *o aluno cobra o aluno que faltou.* Raids entram aqui. |
| Quests + Missões + Diárias | **Viram um Quadro de Missões**: diárias e semanais de jogo + missões de sala do professor. |
| Talentos | **Fica em outro formato**, ligado às cartas (seção 5.4). Pequeno; nunca o principal. |
| Forja | **Fica**: pó de duplicatas → carta escolhida. |
| Baús | Viram pacotinhos. |
| Loja | Vitrine de todas as cartas + pacotes + cosméticos + **Recompensas da Sala** (tickets físicos). |
| PvP | **Assíncrono** (IA jogando com o deck exato do colega) + **online em tempo real**. 2×2 fica para depois. |
| Trocas | Ficam, reconstruídas e com teste de ponta a ponta. |
| Títulos | Ficam e ganham peso; aparecem acima ou abaixo do nick no lobby. |
| Eventos | Ficam: coleção temática + pacote próprio + **decoração da cidade**. |
| Mural | Fica: avisos do professor + feitos da escola. |
| Mentoria | **Muda:** "pedir ajuda" no jogo; quem ajuda ganha moedas. |
| Pets | **Novos**, ~50, visíveis na cidade e na batalha. |
| Ticket de criação | Fica, com fluxo completo (o top 1 propõe, o master aprova, a carta entra com o nome do aluno). |
| Cápsula do tempo | **Sai.** |
| Gerador de IA do professor | **Sai.** |
| Modo apresentação | **Sai.** |
| Cenários, conquistas antigas | **Saem** (o que valia vira título). |
| Imagens enviadas pelo aluno ou pelo professor | **Saem.** Todo visual vem de dentro do jogo. |

---

## 3. O mundo: a cidade

A virada visual e o maior diferencial do WIT 2. **Referência de estilo:
Pokémon Black & White**: visão de cima em 3/4, personagem pequeno e
expressivo, prédios com cara de semi-3D.

### 3.1 A cidade é o menu
Cada tela do jogo é um lugar que o aluno visita andando:

| Lugar | Função |
|---|---|
| **Loja** (o "Pokémart") | Pacotinhos, cosméticos, móveis, Recompensas da Sala |
| **Torre de 100 andares** | A dungeon (seleção de andar + mapa, que já funcionam, com visual novo) |
| **Centro de Cartas** | Montar deck, álbum, forja, trocas |
| **Arena / casa do vizinho** | PvP (assíncrono e online) |
| **Sede das guildas** | Guilda, meta coletiva, chefe de guilda |
| **Quadro de avisos na praça** | Mural + Quadro de Missões |
| **NPCs** | Vendedores, brindes por acertar perguntas, eventos |
| **Sua casa** | Customização do personagem e da casa |

A **cidade é compartilhada**: os alunos se veem andando em tempo real, com o
título sobre o nick. Clicar em alguém abre o **perfil** (estilo cartão de
treinador): moldura customizada, título, deck favorito, vitórias, álbum,
pet.

**Atalhos:** a cidade é o charme, não pode virar pedágio. O aluno com pressa
tem um menu rápido que leva direto a qualquer lugar.

### 3.2 Personagem: customização em camadas
- Boneco montado em camadas: corpo e cor de pele, cabelo (corte e cor),
  olhos, roupa de cima, roupa de baixo, calçado, cabeça, acessório.
- Centenas de combinações. É o que atrai o público feminino, e quase ninguém
  pensa nisso em jogo educacional.
- **Os inimigos resolvem-se sozinhos:** ~100 Desafiantes gerados sorteando
  as mesmas camadas, com nome e deck. Nada de importar imagem por inimigo.
- Os chefes podem ter peças exclusivas (ganháveis ao derrotá-los).

### 3.3 Sua casa
- Casa em grade com móveis que o aluno compra, gira, pinta e posiciona.
- Pode comprar uma casa maior.
- Pode convidar amigos para visitar.
- Espaço para minigames no futuro.

### 3.4 Amizades e conversa
- Pedido de amizade e visita à casa.
- **Conversa em balão sobre a cabeça**, na cidade ou na casa, que some depois
  de alguns segundos.
- Frases prontas + texto curto com filtro de palavrões.
- **Todo texto fica gravado** e o aluno pode denunciar. O professor vê as
  denúncias dos alunos dele. Não existe chat privado.

### 3.5 Pets (~50)
- Seguem o personagem na cidade e aparecem ao lado dele na batalha.
- Efeito pequeno e igual em importância para todos (ex.: 1 carta extra na mão
  inicial para um tipo). **Nunca** mais forte que uma carta.
- Vêm de pacotinhos de pet, de eventos e de metas de guilda.

---

## 4. Economia (proposta)

### 4.1 Duas moedas, papéis claros
| Moeda | De onde vem | Para que serve |
|---|---|---|
| **Moedas** | Jogo (batalhas, andares, diárias) + sala | Pacote Comum, cosméticos, móveis |
| **Diamantes** | **Só da sala** (presença, desempenho, missões do professor) e metas de guilda | Pacotes melhores, Recompensas da Sala (físicas) |

Os diamantes já existem e hoje vêm quase só do professor (338 × 72). Só
fixamos a regra.

### 4.2 Pacotes (proposta)
| Pacote | Conteúdo | Como conseguir |
|---|---|---|
| Comum | 3 C + 1 I + 1 Rara ou melhor | 300 moedas · presença |
| Raro | 2 I + 2 R + 1 Épica ou melhor | 15 diamantes · "foi bem" em sala |
| Épico | 1 R + 3 É ou melhor + 1 Lendária ou melhor com chance maior | 50 diamantes · "excepcional" em sala · eventos |
| Evento | Cartas da coleção do evento | Tempo limitado |

- **Ritmo de jogo:** um dia de jogo dedicado rende ~300–500 moedas, ou seja,
  ~1 Pacote Comum por dia. Ninguém fica "30 moedas contra um pacote de 10 mil".
- **Ritmo de sala:** uma aula com bom desempenho vale mais que vários dias
  de jogo em casa.
- Teto diário de moedas continua (já existe: 500/750).
- **Garantia:** 10 pacotes sem Épica ou melhor → o próximo garante.

### 4.3 Forja (pó)
| Raridade | Pó da duplicata | Custo para criar |
|---|---|---|
| Comum | 5 | 40 |
| Incomum | 10 | 80 |
| Rara | 25 | 200 |
| Épica | 60 | 500 |
| Lendária | 150 | 1.200 |
| Mítica | 400 | 3.200 |
| Desconhecida | 1.000 | não pode ser forjada |

A 2ª cópia (até o limite do deck) **não** vira pó automaticamente: o aluno
escolhe o que desmanchar.

### 4.4 Recompensas da Sala (tickets físicos)
Compradas com diamantes e resgatadas com um toque do professor. Preço
proporcional a tempo e trabalho. O professor ajusta os preços do próprio
catálogo.

| Exemplo | Preço |
|---|---|
| Tablet ou celular, 15 min | 15 💎 (≈ Pacote Raro) |
| Alexa: escolher a música da aula | 15 💎 |
| Óculos VR, 10 min | 50 💎 (≈ Pacote Épico) |

---

## 5. Batalha

### 5.1 Duração
O simulador (3.000 partidas, deck contra deck, vida 150) dá **mediana de 10
rodadas** (p10 5 · p90 17), o que dá ~4–5 minutos. Serve para chefe, mas não
para inimigo comum.

| Tipo | Vida do inimigo | Deck do inimigo | Alvo |
|---|---|---|---|
| Inimigo comum | 60 (proposta) | 12 cartas | 3–5 rodadas, ~2 min |
| Elite | 100 | 16 | ~4 min |
| Chefe | 150 | 20 temáticas, com 2ª fase | ≤ 7 min |
| PvP | 150 × 150 | Deck do jogador | Livre; online com 45 s por turno |

A vida do aluno fica em 150 sempre. Turno do inimigo acelerado (animação
curta, sem esperar clique). Botão de "passar" visível.

### 5.2 IA dos inimigos
- Função pura sobre o `GameState` do motor, com semente.
- **Três níveis:** Aprendiz (joga o que puder), Duelista (avalia dano,
  guarda combo, respeita custo) e Mestre (olha um turno à frente).
- A mesma IA joga o **PvP assíncrono** com o deck exato do colega.
- Toda IA passa pelo simulador: a taxa de vitória do aluno contra cada
  inimigo fica numa faixa definida por andar.

### 5.3 Decks
- **Deck inicial por Herói:** 20 cartas comuns e incomuns com o tema da
  classe (o Mago puxa magia), mas **qualquer herói usa qualquer carta**.
- **Decks dos chefes:** temáticos, 20 cartas. Derrotar o chefe dá uma carta
  do deck dele (repetível).
- **Construtor de deck:** filtros, contagem por tipo, aviso de deck
  injogável (pouco Ataque), sugestão automática para quem não quer montar,
  vários decks salvos.

### 5.4 Talentos das cartas (proposta)
Pequenos, no máximo o peso de uma Comum. Um ponto por nível, ramos com
nomes de carta:

- **Coleção:** +1 deck salvo, álbum com recompensa extra.
- **Estilo:** efeitos cosméticos (verso da carta, animação de jogar).
- **Duelo:** bônus mínimos (ex.: 1 vez por partida, olhar a carta do topo).

Nada de +dano ou +vida que decida uma partida.

---

## 6. Guilda: "o aluno cobra o aluno que faltou"

- Guilda = equipe de 4 a 8 alunos do mesmo professor.
- **Meta semanal coletiva:** presença somada dos membros. Todo mundo que
  foi à aula enche a barra. **Se a barra enche, a guilda inteira ganha**
  (pacote + diamantes). Quem faltou atrasa a equipe, e a equipe sabe.
- O painel mostra "faltam 2 presenças para a meta". Não expõe quem faltou
  com nome e data, para não virar humilhação. Mostra só a contagem, e cada
  um vê a própria contribuição.
- **Chefe de guilda:** vida compartilhada, cada vitória de membro causa
  dano. Recompensa para todos.
- **Pedir ajuda (mentoria):** um membro pede ajuda num tópico. Quem ajuda e
  é confirmado pelo pedinte ganha moedas.
- Sede da guilda na cidade com decoração que evolui com as metas batidas.

---

## 7. Professor

### 7.1 Princípio
**Chamada e recompensa para a sala inteira em menos de 1 minuto.** Qualquer
tela do professor abre em menos de 1 segundo.

### 7.2 Tela "Aula de hoje" (a principal)
1. Abre com a lista dos alunos do professor, já carregada.
2. **Código de aula** opcional no projetor (4 dígitos, trocando a cada
   30 s): o aluno digita e a presença marca sozinha.
3. Cada aluno tem **um toque** para o desempenho: faltou / presente /
   foi bem / excepcional. Isso define o pacote e os diamantes dele.
4. **"Entregar"** grava tudo de uma vez, numa única função no servidor, com
   histórico por aula.
5. O aluno recebe um aviso no jogo ("Você foi bem hoje! Pacote Raro").

### 7.3 Outras telas
- **Alunos:** busca instantânea, ajustar, dar pacote ou diamantes, resetar
  senha, suspender. Só os alunos do professor.
- **Missões de sala:** criar, aprovar em lote.
- **Recompensas da Sala:** catálogo e preços, fila de resgates, um toque
  para entregar.
- **Denúncias:** mensagens denunciadas dos alunos dele.
- **Relatório** (seção 9).

### 7.4 Permissões
| Papel | Pode |
|---|---|
| **Master** (e-mail pessoal do Matheus) | Tudo, em todos os professores: excluir aluno ou professor, eventos, coleções, catálogo |
| **Professor** | Os próprios alunos: ajustar, dar pacotes e diamantes, suspender, resetar senha. **Não exclui.** |
| **Aluno** | O próprio personagem |

O master é identificado pelo e-mail, e o `is_admin` dos outros professores
deixa de dar acesso a todos os alunos.

### 7.5 Desempenho
- Lista de alunos numa só consulta, filtrada pelo professor, **sem** buscar
  e-mail um por um no Auth.
- Nada de recarregar tudo a cada mudança de qualquer aluno.
- Toda escrita de moeda, diamante e pacote numa função do servidor (nunca
  "lê, soma e grava" no navegador).

---

## 8. Dados do aluno (Ministério Público)

Já está em produção (ver `docs/LGPD_SEGURANCA.md`): só dois nomes, e-mail,
senha e professor. Sem turma nem escola.

O WIT 2 adiciona coisas sociais, então:
- Nickname público nunca pode ser o nome real (a regra já existe).
- Casa, perfil e amizades mostram só nickname, visual e dados de jogo.
- O histórico de presença é por aluno e professor, **sem** turma, escola ou
  horário de aula que localize o aluno.
- A foto de perfil real sai (o visual do boneco substitui).
- As mensagens gravadas ficam só o tempo necessário para moderação
  (proposta: 90 dias).

---

## 9. Dados e métricas (para o Matheus medir o impacto)

A pergunta que o relatório responde: **o WIT 2 aumentou a presença e a
dedicação?**

- **Começar a medir já, antes do WIT 2** (fase 0): a presença por aula
  passa a ser registrada direito. Sem esse "antes" não há comparação.
- Métricas por professor:
  - taxa de presença por aula e por aluno ao longo do tempo;
  - retorno depois de falta (quantas aulas até voltar);
  - alunos em risco (2+ faltas seguidas);
  - distribuição do desempenho (presente / foi bem / excepcional);
  - tempo de jogo por semana, % de moedas vindas da sala e do jogo;
  - metas de guilda batidas.
- Exportação em CSV para análise externa.
- Eventos de jogo gravados numa tabela única e enxuta (sem 272 mil linhas de
  diárias pré-geradas).

---

## 10. Migração (sem zerar)

| O aluno tem | Vira |
|---|---|
| Cartas da loja antiga | A carta equivalente da Coleção 1 (`catalog.ts` já é essa loja convertida) |
| Classe | O Herói correspondente (`Espiao` e `Espião` unificados) |
| Nível e XP | Mantidos. Cada nível conquistado vale Pacotes de Legado. |
| Moedas e diamantes | Mantidos, com teto para contas com saldo absurdo (ex.: 10.001.794 moedas, teste ou bug) |
| Títulos | Mantidos + título "Veterano WIT 1" para todos |
| Pontos de atributo e de skill | Pontos de Talento |
| Materiais e consumíveis da forja antiga | Convertidos em pó |

O WIT 1 continua no ar enquanto o WIT 2 é construído em rotas novas. No dia
da virada, a migração roda uma vez e o jogo troca.

---

## 11. Técnica

| Decisão | Escolha (proposta) | Por quê |
|---|---|---|
| Motor da cidade | **Phaser 3** dentro do React | Gratuito, feito para mapa em tiles, sprite, câmera, toque; roda bem em PC fraco e celular |
| Mapas | **Tiled** (editor gratuito) | Padrão da indústria para mapa 2D |
| Arte do boneco em camadas | **LPC** (Liberated Pixel Cup) como base, com paleta e ajustes próprios | Milhares de peças livres (CC-BY-SA/GPL) já pensadas para camadas. Gerar camadas consistentes por IA não é viável. Exige tela de créditos. |
| Móveis e prédios | LPC + Kenney (CC0) + ajustes | Gratuito |
| Pets | A avaliar no teste de viabilidade (LPC tem poucos animais; talvez IA em pixel art + revisão) | |
| Cidade compartilhada | **Supabase Realtime** (presença + broadcast), uma sala por professor | Já está no projeto. Verificar o limite de conexões simultâneas do plano. |
| Batalha | Motor do TCG existente (`src/lib/tcg/engine.ts`) + IA nova | O motor já é puro e testado |
| Celular | **Tudo pensado para toque desde o início** (tocar para andar, cartas arrastáveis) | O jogo hoje não funciona no celular |

---

## 12. Fases

Cada fase termina com **prints aprovados pelo Matheus** antes da próxima.

| Fase | O quê | Por que nessa ordem |
|---|---|---|
| **0 — Professor rápido** | "Aula de hoje", presença no servidor com histórico, entrega de recompensa em lote, lista rápida, master por e-mail, permissões, primeiras métricas | Conserta o problema principal **já**, no WIT 1, e começa a medir o "antes" |
| **1 — Identidade e teste de viabilidade** | Guia visual (paleta, tipografia, marca). Protótipo: 1 pedaço de cidade + 1 boneco customizável andando **no celular e no PC**, com 2 alunos se vendo | É o maior risco. Se não ficar bom, ajustamos antes de construir em cima. |
| **2 — Batalha** | Regras da batalha curta, IA (3 níveis), decks dos chefes, decks iniciais dos Heróis, construtor de deck, tela de batalha nova | O coração do jogo. Precisa do guia visual. |
| **3 — Economia e coleção** | Pacotes, garantia, álbum, forja, loja, Recompensas da Sala, Quadro de Missões, títulos novos | Depende da batalha e das cartas |
| **4 — Cidade** | Cidade completa com os prédios levando às telas, NPCs, perfil, títulos sobre o nick, atalhos | Junta tudo |
| **5 — Social** | Guilda nova, pedir ajuda, amizades, casa customizável, balões com moderação | Precisa da cidade |
| **6 — Pets e cosméticos** | ~50 pets, loja de roupas e móveis | Conteúdo em volume |
| **7 — PvP** | Assíncrono com IA + online em tempo real | Precisa da IA e da cidade |
| **8 — Virada** | Migração, remoção dos sistemas antigos, `test:build`, medição de desempenho, relatório | Lançamento |
| **9 — Lançamento** | **Comercial de lançamento** (gravação de tela + narração, como no projeto integrador) | Depois de tudo pronto |

### Depois do lançamento
- Eventos com decoração da cidade + votação da próxima coleção.
- PvP 2×2.
- Minigames na casa.
- Carta da Aula, pergunta no chefe (ideias guardadas).
- Evolução de cartas.

---

## 13. Riscos

| Risco | Como tratar |
|---|---|
| A cidade ficar feia ou lenta | Teste de viabilidade na fase 1, antes de tudo; medir FPS no celular |
| Conversa entre crianças | Só balão, texto gravado, filtro, denúncia, professor vê |
| Economia quebrada (inflação ou frustração) | Simular antes; ajustar preços no banco sem deploy |
| Escopo gigante | Fases fechadas, cada uma usável sozinha; fase 0 dá resultado já |
| Limite do plano gratuito do Supabase (Realtime) | Uma sala por professor; medir na fase 1 |
| Licença da arte (LPC é CC-BY-SA/GPL) | Tela de créditos; peças modificadas continuam na mesma licença |
