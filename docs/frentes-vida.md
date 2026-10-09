# Frentes de vida do Vale — Fazenda, Lago, Casa, Passarela e História

> Escrito em 09/10/2026 e revisto no mesmo dia com o retorno do Matheus (história refeita,
> professores andando pela cidade, mais funções na fazenda e no lago, ajuste visual). Pedido: dar à fazenda, ao lago, à casa e a uma área
> de moda o mesmo peso da Torre de cartas, com uma história que passe por tudo. Base: o
> código da branch `claude/masmorra` e a pesquisa abaixo (§8). Este arquivo é o índice;
> o detalhe está em cada documento.

| Documento | O quê |
|---|---|
| `docs/fazenda-3.md` | bichos com nome e afeto, silo e silagem, ~55 plantas, máquinas, preço por época, quem compra o quê, variedades raras, Feira; **rodada 2**: sítio personalizado, coleta na mata, raças e flores de cruzamento, barraca na feira, trator, clima forte; **visual** (§18) |
| `docs/lago-2.md` | **mergulho**, gemas brasileiras raríssimas, lapidação e joias, pesca 2.0, lendários, piracema, Museu; **rodada 2**: tarrafa, peixes de aquário e cruzamento, Aquário Público, praia (detector, quiosque, esportes), acampamento, resgate; **visual** (§11) |
| `docs/casa-2.md` | móvel por unidade, kit inicial, **comprar e trocar de casa, andares com escada**, nota da casa, festa 2.0, correio |
| `docs/passarela.md` | o "Dress to Impress" do Vale: camarim, temas, voto seguro, rank, Ateliê de estilista |
| `docs/historia.md` | **Cartas Marcadas**: a Ordem do Verso, traidores entre os moradores, 7 reviravoltas, investigação (caderno, suspeitos, alerta, disfarce, pistas da turma), mistérios paralelos |
| `docs/professores-no-jogo.md` | os professores do WIT andando pela cidade todo dia, com visual feito a partir da foto |
| `docs/prints-frentes/` | prints de hoje da fazenda e do lago (o "antes" do ajuste visual) |

---

## 1. Respostas diretas ao que o Matheus perguntou

- **Trocar ou comprar outra casa: não existe e não funciona.** Os 10 desenhos de casa
  existem e o mapa sabe trocar a fachada, mas não há tela de compra, nem onde guardar a
  escolha, e por dentro toda casa é o mesmo cômodo único. Solução: `docs/casa-2.md` §2.
- **"Tem muito móvel disponível":** a regra atual é "comprou uma vez, põe quantas cópias
  quiser", e os 16 da casa inicial são de graça. Solução: móvel por unidade e kit inicial
  com 2–3 opções por essencial (`docs/casa-2.md` §1).
- **"A casa: entra, decora e acabou":** os móveis já fazem 25 coisas, mas nada tem meta.
  Solução: nota da casa, conjuntos, tarefas, correio, festa (`docs/casa-2.md` §3–5).

---

## 2. Princípios que valem para todas as frentes

### 2.1 Três camadas de progresso (o antídoto do "jogou uma semana e acabou")
| Camada | Pergunta que responde | Exemplo na fazenda |
|---|---|---|
| **Hoje** (10–20 min) | o que eu faço agora? | ovos, ordenha, regar, colher, máquinas |
| **Semanas** | o que estou juntando? | celeiro, silo cheio para o inverno, tear |
| **Meses** | quem eu quero ser? | Mestre do Vale, álbuns completos, prêmios da Feira |

Cada frente tem as três. Cada uma tem um **rank que leva cerca de 1 ano** para o aluno de
2 aulas por semana (Nível do Sítio 30, Licença de Mergulho Mestre, Lenda da Passarela,
Mansão) e **coleções** que só fecham com estação, clima e sorte.

### 2.2 As frentes se alimentam (a economia do Stardew)
```
 FAZENDA ──algodão, lã, seda, corantes──▶ PASSARELA ◀──pérolas e gemas── LAGO
    │  ▲                                     │                            │  ▲
 comida│ minhoca (isca), tanque de peixe      │ roupas no closet     minério│ │ farinha (isca)
    ▼  │                                     ▼                            ▼  │
   CASA ◀──troféus, aquário, geodo, luminária de cristal──────────────── LAGO │
    │                                                                        │
    └── cozinha: comida dá fôlego no mergulho e sorte na pesca ──────────────┘
 Tudo raro ──▶ MUSEU ◀── insetos da fazenda, fósseis, artefatos
 Tudo ──▶ HISTÓRIA (pistas em todas as áreas, presentes para moradores, disfarce na Passarela)
```
O minério do lago (e o da Masmorra) melhora as ferramentas da fazenda. O minhocário da
fazenda faz a isca do lago. A seda da fazenda e a gema do lago fazem a roupa mais nobre
da Passarela. Quem gosta de uma frente acaba precisando de um pouco das outras.

### 2.3 As cartas continuam no centro
- Decisão de 26/09: nenhum sistema pesa tanto quanto uma carta lendária. As frentes de
  vida dão **moedas, cosméticos, casa, títulos e história**; nunca força no duelo.
- Renda por hora parecida com a pesca de hoje (~340/h); o teto de ganho do dia (2500)
  vale para tudo.
- Pacotinho como prêmio de marco (Museu, Feira) é coerente com "carta só de chefe ou
  pacotinho".

### 2.4 Raridade de verdade precisa do servidor
O progresso de fazenda, lago e casa ainda mora no navegador. Tudo que é raro e vale muito
(Turmalina Paraíba, colheita Dourada, ovo dourado, "Descoberta por", nota do desfile)
precisa ser **sorteado e guardado no servidor**, no molde da carta do chefe
(`wit2_boss_card`) e da masmorra (`wit2_dungeon_claim`). Senão o aluno edita o navegador.

### 2.5 Público infantil
Nada morre, nada se perde para sempre (bicho com fome só não produz; oxigênio acabou, o
Marinho resgata). Voto sem crueldade (ninguém vê quem deu quanto; professor pode
desligar). Peças de roupa adequadas por construção. Sem texto livre. História com vilões
de verdade, mas sem sangue nem susto de terror.

### 2.6 O que ensina (sem virar aula)
| Frente | Temas |
|---|---|
| Fazenda | estações, rotação de culturas, compostagem, polinização, fermentação, oferta e procura, dados |
| Lago | pressão, densidade, geologia e geografia do Brasil, simetria, ecologia, piracema |
| Casa | orçamento, à vista ou parcelado, círculo de cores, área e perímetro, automação |
| Passarela | teoria das cores, proporção, história da moda, cultura brasileira, moda sustentável |

---

## 3. Livro do Vale (o 100%)

Como a "Perfeição" do Stardew: uma porcentagem só que soma o álbum de cartas, peixes,
gemas, Museu, plantas e variedades, bichos com 5 corações, receitas, móveis, peças de
roupa, desfiles premiados, Páginas do Diário e amizades. Fica na mochila. 100% dá estátua
na casa e título **Lenda do Vale**. É a meta para quem já fez tudo.

---

## 4. Calendário do Vale (datas de verdade, para a turma toda)

| Quando | Festa | Frentes |
|---|---|---|
| Fevereiro | **Carnaval**: desfile de fantasia | Passarela |
| Março/abril | **Caça aos Ovos** (Páscoa) | Fazenda |
| Maio | Dia das Mães: flores valem mais | Fazenda, Casa |
| Junho | **Festa Junina** + **Festa do Farol** (final do Ato 3): quadrilha, comidas, Desfile Caipira, correio elegante | todas |
| 22 de agosto | **Dia do Folclore**: Saci, Curupira, Iara | Lago, Passarela |
| Setembro | **Festa das Flores** (primavera) | Fazenda, Passarela |
| 12 de outubro | Dia das Crianças: teaser da história (o farol pisca uma vez à noite) | História |
| 31 de outubro | Dia do Saci: desfile de folclore | Passarela |
| Novembro | **Feira Agropecuária** | Fazenda |
| Dezembro | **Festival das Lanternas** (fim do Ato 1), casa decorada de Natal, amigo secreto | Lago, Casa |

As estações da fazenda continuam pessoais (7 dias da fazenda); as festas são da turma.

---

## 5. Ordem de construção (proposta)

A masmorra está sendo feita em outra sessão e mexe nos mesmos arquivos grandes
(`CityDemo.tsx`, `progress.ts`). Melhor juntar a masmorra antes ou trabalhar em arquivos
novos e ligar no fim.

| Fase | O quê | Arte nova | Por quê nessa ordem |
|---|---|---|---|
| **1** | Casa C1–C2 (móvel por unidade, kit, comprar casa e fachada) · motor da história (rastreador, caderno, quadro de suspeitos, alerta) + amizade + correio · **professores andando pela cidade** (bonecos pelas fotos) · **pedir ao GPT** a arte das fases 2–3 · **protótipo da Passarela (M0)** | bonecos dos professores | responde às reclamações de hoje; a história liga tudo; a arte demora para voltar |
| **2** | **Visual da fazenda e do lago** (3v, Lv) · Fazenda 3a (bichos, silo, tarefas) e 3b (plantas, preços, compradores) · **Ato 1** da história | objetos de fazenda e da vila, água, bichos, plantas | a fazenda é o foco; o Ato 1 sai em novembro |
| **3** | Lago L1–L2 (iscas, varas, mergulho raso) · Casa C3–C4 (sobrado, nota) · Passarela M1–M2 (se a M0 for aprovada) | fundo do lago, escada, camarim | |
| **4** | Fazenda 3c–3d (máquinas, variedades, Feira) · Lago L3–L4 (gemas, Museu, Fossa) · Passarela M3–M5 · **Ato 2** | máquinas, gemas, museu | fevereiro |
| **5** | **Ato 3** e Final · Festa 2.0 · Livro do Vale | Aurora, o Vale de papel, encartados libertados | junho |

Cada tela nova passa pelo de sempre: prints para o Matheus aprovar antes da próxima.

---

## 6. Decisões

### Já decididas (09/10)
- **História:** a versão "O Eco do Vale" saiu; entrou **Cartas Marcadas**, com vilões entre
  os moradores e investigação longa.
- **Professores:** todos andam pela cidade todo dia, com visual a partir das fotos
  (autorizado).
- **Nomes repetidos:** trocados no jogo (estudante Léo → Enzo, monitora Ana → Yasmin,
  mensageiro Téo → Nico; nas salas, Rafa → Luna, Caio → Ravi, Iris → Sofia).
- **Fazenda e lago:** direção aprovada; mais funções e ajuste visual entraram.
- **História no jogo:** o Prólogo e o Ato 1 já estão jogáveis (`historia.md` §13); Atos 2
  e 3 na ordem do §14 de lá.
- **Vilão derrotado dá carta** (a ??? dele, na primeira vitória).
- **Professores:** os 12 da lista (Dante, Mayara, Matheus Macedo, Guilherme Rodrigues,
  Matheus Servilha, Leticia, Vitor, Felipe Oliveira, Maycon, Grazyelle, Wellington,
  Miguel) já andam pela cidade com rotina, casa e passatempo; falta o boneco pela foto
  (`professores-no-jogo.md`).

### Pendentes
| # | Decisão | Minha proposta |
|---|---|---|
| 1 | Cursos dos professores (proposta lógica em `professores-no-jogo.md` §1) | Confirmar ou trocar |
| 3 | Quais moradores são vilões (Sir Téo, Lia, Kaio, Duda, Dona Ana, Seu Joca) | Trocar algum se for inspirado em gente de verdade |
| 4 | Dois relógios na fazenda (árvores, café, mel e obras em dias de verdade) | Sim |
| 5 | Móvel por unidade, kit de 3 estilos, quem já jogou mantém o que tem | Sim |
| 6 | Preço das casas (até 50 mil) e parcelas que nunca tomam a casa | Sim |
| 7 | Gema mais cara: Turmalina Paraíba lapidada a 2.400, 1 a cada ~90 h de mergulho, sorteada no servidor | Sim |
| 8 | Passarela: voto entre alunos ligado, o professor pode desligar | Sim |
| 9 | Fotos dos professores (direto no GPT, `professores-no-jogo.md` §4) | Quando tiver |
| 10 | Ordem do §5 | Fase 1 já |

---

## 7. O que este plano não resolve

- **Volume de arte.** Bichos, plantas, máquinas, fundo do lago, gemas, camarim, peças de
  roupa, bonecos dos professores, novos moradores (Amaro, Aurora) e prédios. Tudo pela pipeline gratuita que já
  existe (GPT + importadores), com revisão de cada imagem (público infantil).
- **Volume de escrita.** Mais de mil falas (história, moradores, professores). Escrevo
  ato por ato, sempre antes de programar o ato.
- **A Passarela depende de um boneco grande que ainda não existe.** Se o protótipo não
  ficar bom, a Passarela não sai (regra do projeto).
- **Números.** Todo preço e chance aqui é proposta; passa por `scripts/economia.ts` e por
  teste com alunos antes de virar regra.

---

## 8. Fontes da pesquisa

**Dress to Impress**
- [Como subir de rank (esports.gg)](https://esports.gg/news/gaming/how-to-rank-up-in-dress-to-impress-dti/)
- [Guia de temas (BlueStacks)](https://www.bluestacks.com/blog/game-guides/roblox/rl-dress-to-impress-theme-guide-outfit-ideas-en.html)
- [Guia para iniciantes (Pixel Twelve)](https://pixeltwelve.com/articles/dress-to-impress-beginner-guide)
- [Como jogar (SteelSeries)](https://steelseries.com/bg-bg/blog/how-to-play-dress-to-impress)
- [Lana Lore explicada (GameLeap)](https://www.gameleap.com/articles/roblox-dress-to-impress-lana-lore-explained)
- [Missão de Halloween da Lana (Pro Game Guides)](https://progameguides.com/roblox/dress-to-impress-dti-lana-lore-halloween-quest-guide-roblox/)
- [VIP (esports.gg)](https://esports.gg/news/gaming/how-to-get-vip-in-dress-to-impress/)
- [Maquiagem personalizada (Pixel Twelve)](https://pixeltwelve.com/articles/dress-to-impress-custom-makeup-how-it-works-worth-it)

**Grow a Garden (fazenda no Roblox)**
- [Guia para iniciantes (BlueStacks)](https://www.bluestacks.com/blog/game-guides/roblox/rl-grow-a-garden-beginners-guide-en.html)
- [Mutações (Pocket Tactics)](https://www.pockettactics.com/grow-a-garden-mutations)
- [Clima (Deltia's Gaming)](https://deltiasgaming.com/?p=203882)
- [Guia avançado: mutações e animais (PlayNews, jul/2026)](https://www.playnews.gg/en/guides/grow-a-garden-roblox-the-advanced-farming-guide-mutations-animals-and-beanstalk-july-2026)

**Fisch (pesca no Roblox)**
- [Mutações (Deltia's Gaming)](https://deltiasgaming.com/how-to-get-all-mutations-in-fisch-roblox-guide)
- [Wiki (Bloxodes)](https://bloxodes.com/wiki/fisch)

**Stardew Valley, Animal Crossing, Bloxburg, Adopt Me, Dave the Diver:** referências de
conhecimento geral sobre os jogos (estações, Centro Comunitário, museu, carroça do
mascate, reformas da casa, nota da casa, mergulho por bolhas, oxigênio e peso), sem
consulta nova nesta rodada.
