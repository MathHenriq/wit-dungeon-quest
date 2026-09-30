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
- As classes viram **Caminhos**: estilos de jogo com um **deck inicial
  temático** (seção 5.3). Nada de Mago ou Guerreiro.
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
- **O que o aluno vê antes de ter a carta:** Comum até Épica aparecem
  inteiras na vitrine e no álbum. Lendária e Mítica aparecem como **espaço
  vazio com a cor da raridade e uma dica** ("um poder que vem da força de um
  guerreiro lendário"). Desconhecida aparece só como "???", sem dica.
  Quando o aluno ganha a carta, ela se revela para ele.
- **"Descoberta por":** o primeiro aluno do jogo a tirar cada Lendária ou
  Mítica fica com o nick gravado na carta ("Descoberta por Nick"). Os outros
  alunos passam a ver a carta revelada, com esse crédito.
- **Coleções temáticas** (ex.: "Girl Power", magical girl, idol/k-pop).

### Sistemas: fica, muda ou sai
| Sistema | Destino |
|---|---|
| Guilda | **Fica e vira equipe.** Foco: *o aluno cobra o aluno que faltou.* Raids entram aqui. |
| Quests + Missões + Diárias | **Viram um Quadro de Missões**: diárias e semanais de jogo + missões de sala do professor. |
| Talentos | Vira o **Grimório** (seção 5.4). Pequeno; nunca o principal. |
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

**Regra do 2D × semi-3D:** 2D só se ficar praticamente igual ao Black &
White. Entre um 2D muito bonito e um semi-3D mediano, fica o 2D. O protótipo
da fase 1 decide.

**A cidade inicial é a mais bonita do jogo.** No futuro pode haver outras
cidades liberadas por progresso (ex.: andar 20 libera a cidade X).

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

A **cidade é uma só para todos os jogadores**, de todos os professores: mais
gente nas áreas públicas deixa a cidade viva. Os alunos se veem andando em
tempo real, com o título sobre o nick. Se muita gente estiver no mesmo lugar,
o jogo abre automaticamente um "canal" paralelo do mesmo mapa (como em MMO),
para não pesar. Clicar em alguém abre o **perfil** (estilo cartão de
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
- **Chefes são montados à mão** e têm peças exclusivas que o aluno ganha ao
  derrotá-los.
- **NPCs** (vendedores, NPC de brinde com pergunta, NPC de evento) usam o
  mesmo sistema de camadas. Todo mundo no jogo é humano no mesmo padrão.
- **Cosméticos são economia:** roupa e acessório vêm da loja, de eventos,
  de títulos e de chefes, e aparecem no perfil, na cidade e na batalha.
- **Um padrão único de arte, criado por nós.** Nada de misturar catálogos de
  terceiros. Definimos o boneco base (tamanho, proporção chibi, paleta,
  poses, 4 direções) e toda peça segue esse padrão.

### 3.3 Sua casa
- Casa em grade com móveis que o aluno compra, gira, pinta e posiciona.
- Pode comprar uma casa maior.
- Pode convidar amigos para visitar.
- Espaço para minigames no futuro.

### 3.4 Amizades e conversa
- Pedido de amizade e visita à casa.
- **Conversa em balão sobre a cabeça**, na cidade ou na casa, que some depois
  de alguns segundos.
- Frases prontas + **texto livre curto desde a primeira versão**, com filtro de
  palavrões.
- **Todo texto fica gravado** e o aluno pode denunciar. A denúncia vai para o professor
  de quem escreveu e para o master. Não existe chat privado.

### 3.5 Pets (~50)
- Seguem o personagem na cidade e aparecem ao lado dele na batalha.
- Efeito pequeno e igual em importância para todos (ex.: 1 carta extra na mão
  inicial para um tipo). **Nunca** mais forte que uma carta.
- Vêm de pacotinhos de pet, de eventos e de metas de guilda.

### 3.6 Vida na cidade: profissões, mercado, fome e veículos (30/09)

**Direção:** TCG + Stardew Valley. O aluno escolhe como ganhar moedas:
**trabalhando numa profissão, jogando o TCG, ou os dois.** Quem quiser focar
só no TCG pode; a cidade nunca vira obrigação para duelar.

#### Profissões
- O aluno escolhe um cargo (pode trocar; regra de troca a definir) e vai à
  cidade trabalhar. **Cada profissão tem um minigame próprio e funcional.**
- O que ele produz vira item que **outros alunos compram**. É a economia
  entre alunos (as moedas circulam, não só nascem do sistema).
- Primeiras profissões (proposta; mais virão):

| Profissão | Onde | Minigame | Produz |
|---|---|---|---|
| Pescador | Riacho grande à direita do mapa + casa no lago (onde vende) | Pesca com tempo de fisgada | Peixes (comida) |
| Padeiro | Padaria da Dona Rosa | Massa, forno no ponto, decorar bolo | Pães e bolos (comida) |
| Músico | Casa do Músico | Gravar a música (ritmo) | Discos que tocam dentro da casa de quem compra |
| Fazendeiro | Casa do Fazendeiro + plantação | Plantar, regar, colher | Frutas e verduras (comida, ingrediente do padeiro) |
| Florista | Floricultura | Montar buquê pela encomenda | Flores e vasos (decoração) |
| Inventor | Oficina do Inventor | Montar circuito (quebra-cabeça) | Móveis e objetos tech |
| Artista | Ateliê | Pintar por referência | Quadros para a casa |
| Bibliotecária | Casa da Bibliotecária | Organizar / perguntas da aula | Livros (bônus pequenos, missões) |

Encadeamento pensado para a economia: o fazendeiro vende ao padeiro, o
padeiro vende a todos (fome).

#### Mercado real
- Preço de cada item sobe quando está em falta e desce quando sobra
  (oferta × procura das últimas horas), dentro de um piso e um teto.
- Quem produz o que falta ganha mais: isso guia os alunos para as
  profissões que a cidade precisa.
- Precisa de banco (itens e preços compartilhados entre todos) → entra
  junto com o Supabase, **com o OK do Matheus**. Antes disso, simular a
  economia (como já foi feito com as moedas da Torre) para não inflacionar.

#### Fome
- Barra de fome que desce com o tempo de jogo e com esforço (correr,
  veículos, trabalhar).
- **Fome baixa impede correr e usar veículos.** Nunca impede andar, duelar
  nem entrar nas salas (a criança não fica travada).
- Come-se o que os colegas produzem (pão, peixe, fruta): move a economia.

#### Veículos
- Bicicleta (X moedas) → moto → carro → avião, cada um mais rápido e mais
  caro, com variações (cores, modelos) para colecionar.
- Avião precisa de regra própria (pistas/pontos de pouso, ou voo rápido
  entre pontos da cidade). Veículos exigem ruas largas o bastante no mapa.

#### Cidade mais viva
- **Moradores trabalhando:** lojista arrumando a loja, pescadores no lago,
  músico tocando, padeiro fazendo pão, gente passeando.
- **Objetos interativos:** sentar em bancos, abrir baús/caixas de correio,
  mexer em fontes, placas; animações maiores no que já existe.
- **Postes que acendem** ao anoitecer (apagados de dia).
- **Música e fotos dos alunos:** trilha da cidade e murais/quadros com fotos
  reais dos alunos no WIT. ⚠ **Foto de aluno é dado pessoal de criança**:
  só com autorização dos responsáveis e passando pela sessão de LGPD
  (`docs/LGPD_SEGURANCA.md`). A automação (foto enviada pelo professor
  aparece no jogo) depende disso; sem autorização, entram só desenhos.
- Mais estruturas no mapa, sempre pensando nos locais das profissões
  (riacho, plantação, feira).

#### Interiores
- Deixar mais agradáveis e fáceis de navegar (caminhos mais largos,
  menos móveis no caminho, saída sempre à vista, tocar para andar).

#### Dungeon (estilo Soul Knight)
- Área para explorar em tempo real, com salas, inimigos e tesouros; as
  **cartas do deck viram poderes** (ataque, escudo, armadilha, campo).
- É um modo novo, grande: motor de ação próprio (movimento livre,
  colisão, projéteis) ligado ao catálogo de cartas. Vem depois da tela do
  duelo e das profissões básicas.

#### Qualidade visual
- Avaliar dobrar a resolução (hoje o jogo desenha em 2×) para ficar mais
  próximo das imagens originais do GPT. Medir memória e FPS no celular antes
  de decidir; se ficar pesado, subir só personagens e prédios.

### 3.7 O mundo grande (30/09)

O mapa cresce para **~4× o tamanho da cidade atual**, em **áreas ligadas
pelas bordas** (como no Stardew Valley e no Pokémon: andou até a borda,
passa para a área do lado com uma transição rápida). Cada área tem o
tamanho de uma cidade; só a área em que o aluno está fica carregada, o que
mantém o celular a 60 fps e já separa os **canais do multijogador** por área.

```
              ┌──────────────┐
 ┌──────────┐ │   CIDADE     │ ┌──────────┐
 │ FAZENDA  │═│ (Torre, Loja,│═│   LAGO   │
 │  oeste   │ │  Arena...)   │ │  leste   │
 └──────────┘ └──────╥───────┘ └──────────┘
              ┌──────╨───────┐
              │  CIDADE WIT  │
              │ (sul: cursos │
              │ e profissões)│
              └──────────────┘
```

Mapa-múndi na tecla **M** (e no botão MAPA), com "você está aqui".

#### Lago (leste)
- Lago enorme com margem de praia, ilha no meio (só se chega de barco) e farol.
- **Casa de Pesca**: onde os pescadores anunciam e vendem os peixes
  (**quadro de peixes** com o que cada um pescou, preço e raridade).
- Píeres e pontos de pesca na margem; pescadores trabalhando.
- **Barquinho**: embarca no cais, navega pelo lago todo, desembarca em outro
  cais (ilha, margem leste).
- Vida: patos nadando, peixe pulando, gaivotas, taboas, vitórias-régias.

#### Fazenda (oeste) — o "Stardew Valley" do WIT
Quanto mais, melhor. Entra em ondas:
- **Base (agora):** casa da fazenda, celeiro, silo, galinheiro, estufa,
  moinho, poço, espantalhos, cercas, pomar e lago; **campos para plantar**:
  arar com a enxada, plantar a semente, **regar todo dia**, a planta cresce
  um estágio por dia regado, colher, vender na **caixa de envio** (paga no
  fim do dia). Sementes na barraca da fazenda. Galinhas e vacas andando.
- **Depois:** estações do ano com safras diferentes, chuva (rega sozinha),
  animais que dão ovo/leite (alimentar, pegar), árvores frutíferas,
  apicultura (mel), máquinas (queijo, geleia), irrigador automático
  (vem da IoT), adubo, qualidade da colheita (prata/ouro), trator,
  feira de fim de mês, lote próprio de cada aluno no multijogador.

#### Cidade WIT (sul) — onde os alunos trabalham
Os prédios são das **profissões**, e o destaque são os **cursos do Núcleo
WIT**: IA, IoT (ambientes inteligentes), Metaverso, Comunicação Digital e
Oficina de Games.

| Prédio | Curso | Profissões | O que a tecnologia faz no jogo |
|---|---|---|---|
| **Núcleo WIT** (sede) | todos | Professor (Matheus), monitor | Aulas, quadro de missões dos cursos, onde o aluno escolhe a profissão |
| **Laboratório de IA** | IA | Treinador de IA, cientista de dados | Minigame de rotular dados e treinar modelo; o **WIT-Bot** (robô assistente) anda pela praça e responde dúvidas; modelos treinados viram itens (ex.: "previsão de preço" no mercado, "detector de peixe raro") |
| **Casa Inteligente** | IoT | Técnico de IoT, instalador | Minigame de ligar sensores e circuitos; fabrica **irrigador automático** (fazenda), **sonar de peixe** (lago), **lâmpada e casa inteligentes** (Sua Casa), estação do tempo |
| **Metaverso** | Metaverso | Arquiteto do metaverso, designer 3D | **Portal VR** para a Sala Virtual (encontros e eventos); cria salas e cosméticos virtuais |
| **Estúdio de Comunicação** | Comunicação Digital | Repórter, criador de conteúdo, locutor | **Jornal WIT** no telão da praça (notícias automáticas do jogo: quem pescou o quê, preços em alta), **Rádio WIT** (toca os discos do músico), mural de postagens com moderação |
| **Oficina de Games** | Oficina de Games | Desenvolvedor de games, testador | **Fliperamas** com minijogos que dão tíquetes; fases criadas pelos alunos |
| Mercado Central | — | Comerciante | **Bolsa de preços** (oferta e procura, §3.6) no painel |
| Central de Entregas | IoT | Entregador | **Drones** levando encomendas entre os jogadores |
| Estúdio de Música, Ateliê, Padaria | — | Músico, artista, padeiro | Os minigames da §3.6 |

A praça da Cidade WIT tem o **telão** com o Jornal WIT, postes e semáforos
inteligentes, drones cruzando o céu, árvores solares e carregador de patinete.

#### Arte
Os prédios novos saem primeiro **feitos por código** (mesmo estilo dos atuais)
e podem ser trocados pela arte do GPT quando ela for aprovada
(`docs/prompts-mundo.md`).

---

## 4. Economia (proposta)

### 4.1 Uma moeda só (decidido em 26/09: diamantes saem)
- **Moedas** vêm do jogo (batalhas, andares, diárias) e da sala.
- **Sem teto diário por enquanto**: deixamos livre e avaliamos com os dados.
- Todos os pacotes, do Comum ao Mítico, **podem ser comprados com moedas**.
  O Desconhecido ainda não tem pacote (a decidir).
- A sala continua valendo mais porque o professor **dá pacotes direto**, sem
  o aluno gastar moeda nenhuma.
- As moedas também compram cosméticos, móveis e Recompensas da Sala. As
  Recompensas da Sala só são usadas **dentro da sala**.
- Diamantes atuais viram moedas na migração: **1 diamante = 20 moedas**.

### 4.2 Pacotes (preços e chances em proposta; tudo configurável)
Cada pacote tem 5 cartas: 4 comuns do nível dele e 1 **destaque**. A carta
destaque é **no mínimo** da raridade do nome do pacote, com chance pequena de
vir acima.

| Pacote | 4 cartas | Destaque | Moedas |
|---|---|---|---|
| Comum | Comuns (20% Incomum) | Comum 60 · Incomum 25 · Rara 12 · Épica 2,5 · Lendária 0,5 | 300 |
| Incomum | Comum/Incomum | Incomum 75 · Rara 20 · Épica 4 · Lendária 1 | 700 |
| Raro | Comum/Incomum | Rara 80 · Épica 16 · Lendária 3 · Mítica 1 | 1.500 |
| Épico | Incomum/Rara | Épica 85 · Lendária 12 · Mítica 2,5 · Desconhecida 0,5 | 4.000 |
| Lendário | Rara/Épica | Lendária 90 · Mítica 9 · Desconhecida 1 | 10.000 |
| Mítico | Épica/Lendária | **Mítica garantida** (2% de virar Desconhecida) | 25.000 |
| Evento | Cartas da coleção do evento | — | Tempo limitado |

- **Tudo é configurável pelo master no painel, sem deploy**: quantas cartas
  vem no pacote, a raridade de cada posição e as chances.
- **O professor pode dar qualquer pacote**, inclusive o Mítico.
- Padrão da "Aula de hoje": presente = Comum · foi bem = Raro ·
  excepcional = Épico. O professor troca por outro quando quiser.
- **Garantia:** 10 pacotes sem Épica ou melhor → o próximo destaque é Épica
  ou melhor.
- Preços validados por simulação da economia antes do lançamento.

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

**Nenhuma carta vira pó automaticamente.** Duplicata pode ser trocada com
outro aluno; só vira pó quando o próprio aluno escolhe desmanchar.

### 4.4 Recompensas da Sala (tickets físicos)
Compradas com moedas e resgatadas com um toque do professor. Preço
proporcional a tempo e trabalho. O professor ajusta os preços do próprio
catálogo.

| Exemplo | Preço |
|---|---|
| Tablet ou celular, 15 min | 600 moedas (≈ 2 Pacotes Comuns) |
| Alexa: escolher a música da aula | 600 moedas |
| Óculos VR, 10 min | 2.000 moedas |

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
- **Caminhos:** o aluno escolhe um estilo de jogo e ganha o deck inicial
  dele (20 cartas comuns e incomuns). **Qualquer aluno usa qualquer carta**;
  o Caminho é só o ponto de partida, sem bônus de poder.

  | Caminho | Estilo | Mecânicas do deck inicial |
  |---|---|---|
  | **O Desafiante** | Equilibrado, bom para começar | Um pouco de tudo |
  | **O Sábio** | Estratégia: prepara e explode | Compra, bônus guardado, combos |
  | **O Louco** | Tudo ou nada: paga vida para bater forte | Pagar vida, dano alto, ataque rápido |
  | **O Guardião** | Aguenta tudo e vira o jogo | Escudo, cura, armadura, refletir |
  | **O Alquimista** | Dano que corrói aos poucos | Queimadura, veneno, sangramento |
  | **O Ceifador** | O cemitério é a arma | Moer o deck, banir, dano que escala |
  | **O Trapaceiro** | Pega o oponente desprevenido | Armadilhas, travas, roubo |
  | **O Forjador** | Monta o arsenal | Equipamentos e Campo |

- Na migração, o aluno escolhe o Caminho no primeiro login, com uma sugestão
  baseada na classe antiga (Mago → Sábio, Necromante → Ceifador, Espião →
  Trapaceiro...). 305 alunos nem tinham classe.
- **Decks dos chefes:** temáticos, 20 cartas. Derrotar o chefe dá uma carta
  do deck dele (repetível).
- **Construtor de deck:** filtros, contagem por tipo, aviso de deck
  injogável (pouco Ataque), sugestão automática para quem não quer montar,
  vários decks salvos.

### 5.4 Grimório (os antigos "talentos")
Pequenos, no máximo o peso de uma Comum. Um ponto por nível, ramos com
nomes de carta:

- **Coleção:** +1 deck salvo, álbum com recompensa extra.
- **Estilo:** efeitos cosméticos (verso da carta, animação de jogar).
- **Duelo:** bônus mínimos (ex.: 1 vez por partida, olhar a carta do topo).

Nada de +dano ou +vida que decida uma partida.

### 5.5 Tela do duelo (esboço aprovado em 30/09; tela pronta aprovada em 30/09)
Esboço aprovado: https://claude.ai/artifact/UETfaivdHLuKTuheZd849g
(referências: Master Duel, TCG Pocket, Marvel Snap, Hearthstone, Balatro,
Shadowverse WB, Slay the Spire, Pokémon TCG do GBC).

Decisões: mesa inclinada com as vagas marcadas; jogar carta arrastando ou
tocando; animação forte nos momentos-chave e rápida no resto; efeitos de som
curtos e simples, com mudo; computador e **celular deitado**.

Peças: placa de cada jogador (retrato de frente com moldura dourada e
elemento, apelido, título, vida em número e barra em gomos, efeitos em
ícones com duração); desafiante atrás da mesa; conta do dano estilo Balatro
(azul = dano somado, vermelho = multiplicador, dourado = total, e de onde veio
cada parte); mão em leque; carta em foco; botão ENCERRAR TURNO com o número do
turno e o atalho.

**Tudo que muda tem animação, nada "pula":**
- **Jogar carta:** a carta sai da mão, gira e pousa na vaga (ou voa até o
  alvo e bate) com efeito bonito.
- **Custos:** cada custo acontece à vista: a vida desce animada com o
  pedaço perdido sumindo devagar e o número contando; a carta descartada
  voa para o cemitério; as cartas do deck viram e caem no cemitério; a
  carta banida se desfaz; a compra pulada aparece riscada.
- **Cemitério e compra (estilo Balatro):** a carta comprada sai do deck,
  vira no ar e desliza para o lugar dela na mão, que se reorganiza; o
  cemitério empilha as cartas com um leve giro, e o contador de deck e de
  cemitério pula a cada mudança. Tocar no cemitério abre as cartas dele.
- **Boneco do adversário (padrão para todos):** anima os braços ao pensar e
  ao jogar a carta, se encolhe ao tomar dano, comemora quando vence e cai
  quando perde. Como os bonecos só mudam roupa e acessório (o formato do
  corpo é o mesmo nos 10 modelos), as animações são uma só, aplicada por
  cima de qualquer visual.

Etapas (cada uma fecha com prints aprovados): (1) estrutura da tela ligada
ao motor e à IA (**feita em 30/09**: palco 16:9 em `DuelView.tsx` + `.css`, celular em pé pede para girar); (2) jogar carta e custos animados (**feita em 30/09**: arrastar para a mesa, que acende verde/vermelho; cada carta que muda de lugar voa, pelo `diffMoves` em `src/components/duel/moves.ts`: descarte mão → cemitério, deck → cemitério virando, banida se desfaz, compra deck → mão; o cemitério só conta quando a carta chega); (3) compra e cemitério; (4) conta do dano, golpe, armadilha e SUPER EFETIVO;
(5) turno do inimigo e animações do boneco; (6) abertura (VS, quem começa) e fim
(vitória/derrota, moedas, carta do chefe); (7) som; (8) desempenho no celular,
testes, demo. **Etapas 3 a 8 feitas em 30/09**: mão se reorganiza e as cartas
chegam distribuídas, contadores pulam, tocar no cemitério abre as cartas; o
motor registra a conta de cada golpe (`LogEntry.calc`) e a tela mostra em
fichas (azul × vermelho = dourado), com tremida, clarão na cor do elemento e
carimbo COMBO ×N / ESCUDO (sem fraqueza de elemento desde 30/09); armadilha revelada vira
no centro; o desafiante pensa, joga mexendo os braços, apanha, comemora e cai
(uma animação só para qualquer visual); abertura com VS e moeda; fim com
carimbo e raios, moedas contando e a carta do chefe virando; sons sintetizados
(`src/game/sfx.ts`, sem arquivo) com botão SOM/MUDO; ~58–60 fps com a CPU 4×
mais lenta no celular deitado.

### 5.6 Tapetes do duelo (cosmético, 30/09)
O tapete é a mesa do duelo. **Não muda regra nenhuma**: é estilo, comprado
com moedas na aba TAPETES da tela do deck (e, no futuro, numa das lojas do
shopping). Começa com o **Clássico** (grátis, muda de cor com o elemento do
desafiante); os feitos em código custam 600–1.200 moedas (Circuito WIT,
Tatame, Noite Estrelada, Sakura, Fundo do Mar, Vulcão).

Os temáticos de **anime, cartas e monstrinhos** (1.500–2.000) usam arte do
GPT (`docs/prompts-tapetes.md`), sempre **originais**: estilo anime, sem
personagem, logo ou criatura de franquia. Entram como EM BREVE e são
liberados quando a arte for aprovada. Ideias para depois: tapete animado
(brilho, partículas), tapete de evento e de chefe (prêmio), tapete da guilda.

---

## 6. Guilda: "o aluno cobra o aluno que faltou"

- Guilda = equipe de 4 a 8 alunos **do mesmo professor** (a cidade é global,
  mas a meta de presença só faz sentido entre quem tem aula junto).
- **Meta semanal coletiva:** presença somada dos membros. Todo mundo que
  foi à aula enche a barra. **Se a barra enche, a guilda inteira ganha**
  (pacote). Quem faltou atrasa a equipe, e a equipe sabe.
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
   foi bem / excepcional. Isso define o pacote dele.
4. **"Entregar"** grava tudo de uma vez, numa única função no servidor, com
   histórico por aula.
5. O aluno recebe um aviso no jogo ("Você foi bem hoje! Pacote Raro").

### 7.3 Outras telas
- **Alunos:** busca instantânea, ajustar, dar pacote ou moedas, resetar
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
| **Professor** | Os próprios alunos: ajustar, dar pacotes e moedas, suspender, resetar senha. **Não exclui.** |
| **Aluno** | O próprio personagem |

O master é identificado pelo e-mail, e o `is_admin` dos outros professores
deixa de dar acesso a todos os alunos.

### 7.5 Desempenho
- Lista de alunos numa só consulta, filtrada pelo professor, **sem** buscar
  e-mail um por um no Auth.
- Nada de recarregar tudo a cada mudança de qualquer aluno.
- Toda escrita de moeda e pacote numa função do servidor (nunca
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
  (90 dias, apagadas automaticamente por rotina diária, para não pesar).

---

## 9. Dados e métricas (para o Matheus medir o impacto)

A pergunta que o relatório responde: **o WIT 2 aumentou a presença e a
dedicação?**

- **Medir a presença por aula** (fase 11): a presença por aula
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
| Classe | O aluno escolhe um dos 8 **Caminhos** no primeiro login, com sugestão baseada na classe antiga. |
| Nível e XP | Mantidos. Pacotes de Legado por nível: **a definir na etapa de migração**. |
| Moedas | Mantidas; 1 diamante = 20 moedas. Sem teto: o único saldo absurdo é de conta de teste (`is_test_account`), que fica fora da migração. |
| Títulos | Mantidos + título "Veterano WIT 1" para todos |
| Pontos de atributo e de skill | Pontos de Talento |
| Materiais e consumíveis da forja antiga | Convertidos em pó |

O WIT 1 continua no ar enquanto o WIT 2 é construído em rotas novas. No dia
da virada, a migração roda uma vez e o jogo troca.

---

## 11. Técnica

| Decisão | Escolha (proposta) | Por quê |
|---|---|---|
| Motor da cidade | **Canvas próprio** (`src/game/world` + `src/pages/CityDemo.tsx`), sem dependência nova | Decidido em 27/09: cena pré-composta, só redesenha o que fica na frente dos personagens; 60 fps com CPU 4× |
| Mapas | **Planta em código** (`town.ts`): terrenos, prédios e objetos por coordenada de bloco, com teste de portas alcançáveis | Mais simples que editor externo enquanto a cidade é uma só |
| Arte do mapa (chão, árvores, prédios, objetos) | **Gerada por código** no estilo HeartGold/SoulSilver com toque tecnológico (`src/game/world`) | Decidido em 27/09: custo zero, variações por parâmetro, padrão único. Horde e PixelLab testados para prédios: perspectiva e estilo inconsistentes |
| Identidade visual da cidade | **Verde da marca WIT** (verde escuro → lima, quadradinhos da logo) nos detalhes tecnológicos: letreiros, totens, postes, portal, coroa da Torre, circuitos na calçada | Pedido do Matheus em 27/09: de dia só um toque leve de tecnologia |
| Prédios com a forma do tema | Loja de Pacotinhos = pacotinho gigante (único lugar que vende); Oficina de Cartas (ex-Centro de Cartas: deck, álbum, forja, trocas; não vende) = carta gigante com ala do álbum e forja; Castelo das Guildas; Arena com refletores e telão | Pedido do Matheus em 27/09: reconhecer cada lugar sem ler placa e não parecer duas lojas |
| Planta da cidade | 64×48 blocos em 4 faixas (prédios em cima, rua embaixo, porta sempre olhando para a rua), praça da Torre no centro, 14 casas de moradores espalhadas, lago, mato alto nas saídas. Os 10 modelos de casa **não ficam no mapa**: a Sua Casa usa o modelo escolhido (3 iniciais, 7 à venda) | Pedido do Matheus em 27/09: cidade distribuída como as de Pokémon, sem vitrine de casas |
| Dia e noite | Relógio do jogo (12 min por dia). Cada objeto tem uma camada "noite"; à noite a cena é multiplicada por uma tinta azul, as luzes acendem por cima e um halo (borrão das luzes) é somado. Circuitos com pulsos saindo da Torre | Pedido do Matheus em 27/09: à noite a cidade fica colorida com LED |
| Arte de personagens e pets | **PixelLab** (32 px, estilo HGSS) a partir de uma referência de estilo; direções (1 geração) e caminhada (1 por direção); cores trocadas por código (`recolor.ts`) | Decidido em 27/09: único caminho que chegou no nível dos exemplos. Cota grátis de 5 gerações/dia; chave da API nunca no repositório |
| Cidade compartilhada | **Supabase Realtime**, uma cidade global dividida por mapa e por canal; envia só "fui para o ponto X", não a posição a cada quadro | Já está no projeto. Medir o limite de conexões do plano na fase 2. |
| Batalha | Motor do TCG existente (`src/lib/tcg/engine.ts`) + IA nova | O motor já é puro e testado |
| Celular | **Tudo pensado para toque desde o início** (tocar para andar, cartas arrastáveis) | O jogo hoje não funciona no celular |

---

## 12. Fases

> **30/09: TCG + Stardew Valley** (ideias em §3.6). As fases abaixo foram
> reordenadas: a tela do duelo segue primeiro; profissões, fome e mercado
> entram antes do lançamento; mais ideias ainda virão.

**Visual primeiro** (decidido em 26/09): o Matheus quer ver o mundo pronto
antes; as funções depois são ligadas no que já existe visualmente. Cada fase
termina com **prints aprovados pelo Matheus** antes da próxima.

| Fase | O quê |
|---|---|
| **1 — Identidade e boneco base** | Guia visual (paleta, tipografia, marca). Boneco base parado e andando nas 4 direções. Teste: 2D no nível do Black & White ou não. |
| **2 — Protótipo da cidade** | Um pedaço da cidade inicial, o boneco andando **no celular e no PC**, 2 jogadores se vendo em tempo real. Mede FPS e o limite do Realtime. **Feito em 27/09 (sem multijogador): `/cidade-demo`.** |
| **3 — Cidade inicial completa** | Todos os prédios, praça, NPCs e interiores, com as portas levando às telas (ainda vazias). **Exterior feito em 27/09 (estilo HGSS, verde WIT, dia e noite); faltam interiores e multijogador.** Todo imóvel terá interior próprio; o da Torre substitui a tela de andares atual (o boneco anda até mesas de desafio, vence os desafiantes do andar e chega ao chefe). |
| **4 — Customização** | Peças de roupa, cabelo e acessório; editor do personagem; casa com móveis; perfil estilo cartão de treinador |
| **5 — Telas do jogo (visual)** | Batalha, loja e abertura de pacote, álbum, Centro de Cartas, Torre, Quadro de Missões, guilda |
| **6 — Batalha funcional** | Motor ligado, batalha curta, IA de 3 níveis, decks dos Caminhos e dos chefes, construtor de deck, 100 inimigos gerados |
| **7 — Mundo grande e cidade viva** | **Mundo ~4× maior em áreas (§3.7): Lago a leste, Fazenda a oeste, Cidade WIT ao sul**, mapa-múndi; moradores trabalhando e passeando, postes acendendo, sentar e mexer em objetos, interiores mais fáceis de navegar. **30/09: postes acendendo um a um, 6 moradores trabalhando + 3 passeando, sentar nos bancos.** |
| **8 — Profissões e minigames** | Escolha de cargo; minigames de pescador, padeiro, músico e fazendeiro primeiro, depois os outros; itens produzidos |
| **9 — Economia e coleção** | Pacotes configuráveis, garantia, forja, loja, Recompensas da Sala, títulos, **mercado com preço por oferta e procura**, **fome**, **veículos** (simulação antes) |
| **10 — Social** | Cidade global com canais, amizades, conversa em balão com moderação, guilda nova, pedir ajuda, **compra e venda entre alunos** |
| **11 — Pets e cosméticos em volume** | ~50 pets, loja de roupas e móveis, discos e quadros na casa |
| **12 — PvP** | Assíncrono com IA usando o deck exato do colega + online em tempo real |
| **13 — Professor rápido e métricas** | "Aula de hoje", presença no servidor com histórico, entrega em lote, lista rápida, master por e-mail, permissões, relatório, fotos da turma (com autorização) |
| **14 — Virada** | Migração, remoção dos sistemas antigos, `test:build`, medição de desempenho |
| **15 — Lançamento** | **Comercial de lançamento** (gravação de tela + narração, como no projeto integrador) |

Em avaliação (encaixar quando decidido): **Dungeon estilo Soul Knight** com
as cartas como poderes; **resolução 2× maior**; música da cidade.

Custo de deixar o professor para o fim: a presença só passa a ser medida
direito perto do lançamento, então o "antes" do relatório fica curto.

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
| A cidade ficar feia ou lenta | Boneco base (fase 1) e protótipo (fase 2) antes de tudo; medir FPS no celular |
| Conversa entre crianças | Só balão, texto gravado, filtro, denúncia, professor vê |
| Economia quebrada (inflação ou frustração) | Simular antes; ajustar preços no banco sem deploy |
| Escopo gigante | Fases fechadas, cada uma aprovada por print antes da próxima |
| Limite do plano gratuito do Supabase (Realtime) com cidade global | Canais automáticos por mapa; medir na fase 2 |
| Profissões, fome e mercado deixarem o TCG de lado | TCG sempre rende moedas sozinho; fome nunca bloqueia duelo; minigames curtos |
| Fotos de alunos no jogo | Só com autorização dos responsáveis, via sessão de LGPD |
| Volume de arte própria (centenas de peças) | Boneco base aprovado primeiro; peças em lote, sempre no mesmo padrão; começar com poucas peças bem feitas |
