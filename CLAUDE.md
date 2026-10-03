# WIT Dungeon — guia para o Claude

Jogo educacional do Matheus (professor do Núcleo WIT) para os alunos dele.
React 18 + TypeScript + Vite + Supabase (projeto `pvnzfiyxwvfmmhvpvrrk`).
Responda em português, de forma **curta e direta**, sem bajulação.

## ⚠️ PENDENTE: o visual do mundo novo é provisório (lembrar o Matheus!)

A arte do **Lago Azul, da Fazenda do Vale e da Cidade WIT** (prédios, objetos,
plantas, bichos, peixes, barco, drone, WIT-Bot) ainda é **feita por código** e o
Matheus achou feia: **vai ser trocada pela arte do GPT**. Ele pediu para não
deixar esquecer. Em toda entrega grande, lembre em uma linha quantas peças
ainda faltam (`npx vite-node scripts/arte/falta-arte.ts`; hoje: 138 de 138).

- Prompts prontos, com os nomes e a ordem que o importador espera: `docs/prompts-mundo.md`.
- Salvar em `public/Novos assets/mundo/<área>/` e rodar `python3 scripts/arte/importar-gpt.py --folha revisao.png`.
- A troca é automática pelo nome do sprite (`src/game/world/art-list.ts`); cada imagem é revisada antes de subir (público infantil).
- Depois de importar: prints de cada área (`node scripts/mapa/prints-mundo.mjs <pasta>`) para aprovação.

## Para onde o jogo está indo: WIT Dungeon 2 (TCG)

O jogo virou um **card game (TCG)**: toda a jogabilidade acontece com cartas.
O motor, as regras e as 350 cartas já estão prontos. **O próximo trabalho é
refazer o visual inteiro e as funcionalidades em volta do TCG**; o jogo hoje
parece uma mistura de sistemas sem identidade visual.

Decisões já tomadas (não reabrir sem o Matheus pedir):

- Vida 150 · deck de 20 · mão inicial 5 · compra 1 por turno · mão máxima 7.
- **Sem energia.** Carta forte cobra sacrifício: descartar, mandar cartas do
  deck ao cemitério, pagar vida, banir do cemitério, pular a compra.
- 1 Ataque por turno. Tipos: Ataque, Desafiante (o jogador é o "Desafiante"),
  Equipamento (1 arma + 1 armadura), Armadilha (até 3, viradas), Campo (1).
- **Sem teto de dano.** Multiplicadores se multiplicam.
- 12 elementos **só nas cartas** (cor da moldura e combos). **Sem fraqueza/resistência** e o personagem não tem elemento: o tema dele é o elemento que mais aparece no deck (decidido em 30/09).
- **Inimigos são Desafiantes** com deck próprio: personagens de anime segurando
  ou jogando cartas. Chefe derrotado dá uma carta do deck dele (repetível).
- **Carta só se ganha de 2 jeitos: conquistando (chefes) ou abrindo pacotinho.**
  Os baús viram pacotinhos. Não existe mais loja de cartas. Troca e venda entre
  alunos continuam (destino das duplicatas).
- Raridade = chance no pacotinho, não força. Distribuição das 350:
  90 Comuns · 70 Incomuns · 65 Raras · 50 Épicas · 40 Lendárias · 25 Míticas ·
  10 Desconhecidas.
- Visual da carta: Comum até Épica com moldura na cor do elemento e arte numa
  janela; Lendária para cima em full art com brilho. Verso estilo Yu-Gi-Oh,
  frente estilo Pokémon. Moldura e texto em código; só a ilustração é imagem.
- Árvore de skills, PvP, trocas e outras telas antigas **serão repensadas**
  dentro do TCG (a árvore de skills não faz mais sentido como está).
- Evolução de cartas: fica para depois do básico.

**Plano completo do WIT 2 (fases, economia, cidade, professor): `docs/plano-wit2.md`.**
Prompts do GPT: personagem `docs/prompts-personagem.md`; interiores e pets `docs/prompts-interiores.md`; mundo grande (lago, fazenda, Cidade WIT) `docs/prompts-mundo.md`.
Regras completas: `docs/regras-tcg.md`. Lista das cartas: `docs/cartas-tcg.md`.

**Em aberto:** conteúdo do pacotinho (proposta em `docs/regras-tcg.md`:
3 Comuns + 1 Incomum + 1 Rara ou melhor), IA dos inimigos, decks dos chefes,
construtor de deck.

## Onde fica cada coisa

| O quê | Onde |
|---|---|
| Motor do TCG (funções puras, estado JSON, RNG com semente) | `src/lib/tcg/engine.ts` |
| Tipos (cartas, efeitos, estado) | `src/lib/tcg/types.ts` |
| Texto da carta gerado a partir dos efeitos | `src/lib/tcg/describe.ts` |
| Nomes em português | `src/lib/tcg/labels.ts` |
| Catálogo: Coleção 1 (loja antiga), 2 e 3 | `src/lib/tcg/cards/{catalog,colecao2,colecao3}.ts` |
| Componente da carta e verso | `src/components/tcg/TcgCard.tsx` (+ `.css`) |
| **IA dos inimigos** (4 níveis: Aprendiz, Estudante, Duelista, Mestre; `planTurn` devolve as jogadas do turno) | `src/lib/tcg/ai.ts` |
| **Adversários da Torre** (curva por andar: vida, tamanho do deck, raridade, complexidade, IA; decks temáticos gerados com semente; moedas; deck e coleção iniciais) | `src/lib/tcg/opponents.ts`; ajustar dificuldade e moedas ali e rodar `npx vite-node scripts/tcg-torre.ts 40 3` (vitória, duração e moedas por hora por faixa de andar) |
| **Duelo** (palco 16:9: mesa inclinada, placas, mão em leque que se arrasta, carta em foco; cartas voando entre mão, deck, cemitério e mesa pelo `diffMoves`; conta do golpe em fichas a partir de `LogEntry.calc`; animações do desafiante; abertura VS + moeda; fim com carimbo; sons em `src/game/sfx.ts`; resultado com moedas contando e carta do chefe virando) e **construtor de deck** (coleção, filtros, 3 decks, SUGERIR) | `src/components/duel/{DuelView,DeckBuilder,DuelResult,moves}.tsx`; `/cidade-demo?sala=torre&andar=1&duelo=3` abre o convite da mesa 3 (ou `duelo=chefe`); prints: `node scripts/mapa/prints-duelo.mjs <pasta>` |
| **Tapetes do duelo** (cosmético; Clássico grátis + tapetes em código + de imagem "em breve"; compra e escolha na aba TAPETES da tela do deck, `?tapetes` abre direto) | catálogo `src/game/playmats.ts`, vitrine `src/components/duel/MatShop.tsx`; arte: prompts em `docs/prompts-tapetes.md` → `python3 scripts/arte/importar-tapetes.py` → tirar `emBreve` |
| **Progresso do aluno** (moedas, coleção, decks, andares e vitórias, tapetes; chefe libera com 4 mesas; revencer rende 20%). Por enquanto no navegador (`wit.progresso`); é o ponto a ligar no banco | `src/game/progress.ts` (+ testes) |
| Arte das cartas: um arquivo por carta no jogo; a demo empacotada usa folhas (`python3 scripts/arte/atlas-cartas.py <saída>/cards/atlas`) | `src/components/tcg/cardArt.ts` |
| Vitrine das cartas (`/cartas-demo?q=id1,id2`) | `src/pages/CardsDemo.tsx` |
| Ilustrações das 350 cartas (webp) | `public/cards/art/<id>.webp` |
| Testes do TCG (combos, mecânicas, catálogo) | `src/lib/tcg/__tests__/` |
| Arte do mundo por código (chão, árvores, prédios, objetos, fonte pixel) | `src/game/world/{ground,props,buildings,palette,pixmap}.ts` |
| Casas e prédios no estilo HGSS (os que a cidade usa), com a camada "noite" | `src/game/world/{house-hg,buildings-hg}.ts` |
| **Sprites do GPT (arte principal da cidade)**: originais em `public/Novos assets/` (fundo magenta), convertidos para `public/game/world/*.png` + `*-noite.png` + `manifest.json`, e em 2× (mais detalhe) em `public/game/world/hd/` | `python3 scripts/arte/importar-gpt.py --folha saida.png` (pillow, numpy, scipy); tamanhos e cortes das folhas no topo do script; carregados por `src/game/world/assets.ts` |
| Prédios-tema: Loja = pacotinho gigante, Oficina de Cartas = carta gigante + álbum + forja, Guildas = castelo | `src/game/world/landmarks.ts` (folha: `docs/cidade-wit-predios.png`) |
| Objetos tecnológicos no verde WIT (postes, totens, portal, fonte, mural) | `src/game/world/props-tech.ts` |
| Fonte pixel 5×7 dos letreiros | `src/game/world/font.ts` |
| **Resolução hd**: a lógica é em pixels do mundo (1 bloco = 16), mas o jogo desenha em 2× (`R` em `CityDemo.tsx`). Cada `Pixmap` pode levar `.hd` (a mesma arte em 2×); `padTo`, espelhar, placas e o chão (`groundHd`) repassam a hd; sem ela, a arte é ampliada. Testes e scripts de mapa continuam em 1× | `src/game/world/{pixmap,assets,ground,town}.ts` |
| **Chão pronto**: o chão hd de cada área vem pintado em `public/game/world/<área>/chao.webp` (o jogo não calcula ao abrir). Mudou a planta, o desenho do chão (`GROUND_VERSION` em `ground.ts`) ou as texturas? Rode `npx vite-node scripts/mapa/chao-pronto.ts [área ...]` (um teste avisa qual está velho) | `scripts/mapa/chao-pronto.ts` |
| **Mundo em áreas** (plano §3.7): Centro (`cidade`), Lago Azul (`lago`, leste), Fazenda do Vale (`fazenda`, oeste), Cidade WIT (`wit`, sul). Só a área atual fica montada; andar até a borda troca de área (escurece, nome da área, a hora continua); mapa-múndi na tecla M / botão MAPA (com viagem rápida). Cada área é um `ZoneBuilder` (planta, prédios, mata na borda, `exit`, `spot` de interação, chão pronto); morador de outra área tem `zona` em `content.ts`. `?zona=lago&pos=30,21` abre direto. Teste de todas as áreas: portas, saídas e pontos alcançáveis, saída que leva a bloco livre com volta | `src/game/world/{zone,world}.ts`, `zone-{lago,fazenda,wit}.ts`, `__tests__/zones.test.ts` |
| **Arte nova por código em hd** (até a arte do GPT de `docs/prompts-mundo.md` chegar): kit de telhas, tábuas, tijolo, pedra, vidro, janelas, portas, toldos e placas (`hd-kit.ts`), casinhas com variações (`houses-hd.ts`), prédios do Lago, da Fazenda e da Cidade WIT. Folha de revisão: `npx vite-node scripts/mapa/folha-mundo.ts -- saida.png 2 dia <lago|fazenda|plantas|wit>` | `src/game/world/{hd-kit,houses-hd,buildings-lago,buildings-fazenda,buildings-wit}.ts` |
| **Lago Azul**: barquinho (embarca de frente para ele; anda na água aberta; desce em qualquer margem), pesca em qualquer água aberta (boia, "!", minijogo da agulha no verde), 16 peixes com raridade/água funda/noite (`fishing.ts`, ícones em `fish-art.ts`), Casa de Pesca (quadro do dia, venda, álbum com recordes), patos (`critters.ts`), ondas desenhadas na hora (`water-anim.ts`) | `src/game/{fishing,progress}.ts`, `src/components/city/FishHouse.tsx` |
| **Fazenda do Vale**: campo comunitário (ESPAÇO faz a ação certa: arar, plantar a semente escolhida com Q/E, regar, colher), 7 plantas com estágios, regador de 20 (poço/lagoa), dia vira às 6h e ao voltar depois de 12 min (no máximo 1 dia), caixa de envio paga no dia seguinte, ovos/leite/lã/frutas uma vez por dia. Guardado em `wit.fazenda` | `src/game/farm.ts` (+ testes), `src/components/city/FarmPanel.tsx` |
| **Cidade WIT**: prédios dos cursos (Núcleo WIT com o painel dos cursos e profissões, Lab IA, Casa IoT, Metaverso, Estúdio, Oficina de Games, Mercado, Entregas), telão com o Jornal WIT (manchetes do próprio jogo, `news.ts`), postes inteligentes (fracos à noite, acendem quando alguém passa: `Lamp.smart`), drones, WIT-Bot (dicas de IA/IoT), holograma, horta IoT e estação do tempo | `src/game/news.ts`, `src/components/city/CoursesPanel.tsx` |
| **Vida fora do duelo** (não depende de arte): 12 profissões com níveis e bônus (`professions.ts`), 8 minijogos nas portas dos prédios (`minigames.ts`, telas em `components/work/Minigames.tsx`, porta → jogo em `WORK_DOORS` no `CityDemo.tsx`; `?trabalho=casa-iot` abre direto), fome/comida/receitas/experiência (`life.ts`), Mercado com oferta e procura (`market.ts`, `?loja=mercado`), entregas (`deliveries.ts`, `?loja=entregas`), cozinha da Casa da Fazenda (`?loja=cozinha`), missões do dia (`missions.ts`), mochila (tecla I, `?mochila`). Tudo em `wit.progresso`. Prints: `node scripts/mapa/prints-trabalho.mjs <pasta>` | `src/game/{professions,life,market,missions,minigames,deliveries,items}.ts` (+ testes), `src/components/work/` |
| **Lote 2 (01/10)**: Torre maior (8 blocos) com o andar do aluno na telinha da porta (`town.towerScreen`), andar atual salvo (`progress.andar`, a Torre abre nele), faixa "ANDAR N" ao chegar, indicador fixo e **elevador** (painel na parede, `Talk.action = 'elevador'`). Duelo: faixa de troca de turno, aviso "IMPEDIDO DE ATACAR"/"CONGELADO" com a carta que causou brilhando (`Lock.source`, `ActiveStatus.source` no motor), desafiante maior com reações (`bigHurt`, `shock`, `cheer`, `blocked`); `?mao=id1,id2&comeca=eu|ele` força a mão (testes). Arena 28×20 com 12 mesas de duelo (6 com desafiante, nível = andar do aluno, vitória não conta para a Torre; 6 LIVRES para sentar e esperar o PvP). Oficina: Dona Ana vende doces (`RoomNpc.shop`), mesas de troca vazias para sentar. Pendente de arte: `docs/prompts-lote2.md`; plano das 5 tarefas por profissão: `docs/profissoes-tarefas.md` | `src/game/interior/room.ts`, `src/components/city/InteriorView.tsx`, `src/components/duel/DuelView.tsx` |
| **Pacotinhos, forja e trabalhos novos (01/10)**: 6 pacotinhos (`packs.ts`: preço, 4 cartas de base + destaque, garantia de Épica no 10º sem Épica, `progress.semEpica`), compra e abertura animada (`components/packs/{PackShop,PackOpening}.tsx`; o pacote é desenhado em código até a imagem `public/game/packs/<id>.png` existir). Loja = shopping 32×24 com a loja de pacotinhos de frente para a porta e clientes passeando (`RoomNpc.wander`). Forja do Prof. Ian (`forge.ts`, `ForgePanel.tsx`): duplicata vira pó **da raridade dela** (`progress.po`), pó da mesma raridade forja a carta. Estúdio de Música: **compor** (grade 16 tempos × 8 notas pentatônicas + 4 batidas, sintetizador em `components/work/synth.ts`, música vira disco, `progress.musicas`). Padaria: **fazer pão** em 6 passos (medir com frações, misturar girando, sovar, modelar, crescer, assar; `BreadMaker.tsx`). Porta com vários trabalhos: `WORK_DOORS[porta].also`. `?sala=loja&painel=pacotes`, `?sala=oficina&painel=forja`; prints: `node scripts/mapa/prints-trabalho2.mjs <pasta>` | `src/game/{packs,forge,music}.ts` (+ testes), `src/components/packs/`, `src/components/work/{Composer,BreadMaker,synth}.tsx` |
| **Encomendas, Comunicação e IA (01/10)**: encomendas das profissões (músico leva disco, padeiro pão, pescador peixe, fazendeiro ovos até a porta de um morador; aba ENCOMENDA no trabalho, na Casa de Pesca e na caixa de envio; `deliveries.ts` `takeOrder`). Câmera (tecla F / botão FOTO): retrato da tela em JPEG, álbum de 8 em `wit.fotos` (fora do progresso), fotos passando no telão. Estúdio: **escrever matéria** (a testemunha conta, o aluno monta o lide QUEM/O QUÊ/ONDE/QUANDO; matéria certinha vai para `progress.materias`) e **jornalzinho** de 1 moeda (`progress.jornalDia`). Lab de IA: **programar o robô** (blocos ANDAR, VIRAR, PEGAR, REPETIR; 3 fases, a 2ª só cabe com REPETIR). **Robô gari** na Cidade WIT: vai até o lixo mais perto e cata (o jogador também cata com ESPAÇO). Prints: `node scripts/mapa/prints-trabalho3.mjs <pasta> [ia]`; o `vite` de desenvolvimento expõe `window.__city` para os scripts | `src/game/{press,photos,robot}.ts` (+ testes), `src/components/work/{OrderBox,Materia,Jornalzinho,RobotCode}.tsx`, `src/game/world/critters.ts` (`stepGari`) |
| **Tarefas que ensinam (02/10)**: Comerciante **ler o gráfico** (5 perguntas com os preços reais do Mercado: maior valor, subiu/desceu, mais estável em % da média, média, volta à média; aba GRÁFICOS no Mercado; `charts.ts`). Pescador **diário do lago** (cada peixe vai para `progress.diario` com hora e lugar; gráficos e pergunta do dia na aba DIÁRIO da Casa de Pesca, `?pesca=diario`; `fishlog.ts`). Músico **afinar**, Artista **misturar cores** (modelo RYB das tintas), IoT **regra SE/ENTÃO**, Entregador **melhor rota** (botão na Central de Entregas), Metaverso **coordenadas 3D**, IA **testar o modelo** (acurácia 70% → 90% consertando o treino): regras em `lessons.ts`, telas em `Lessons.tsx`. Gráficos em SVG: `components/work/Charts.tsx`. Prints: `node scripts/mapa/prints-trabalho4.mjs <pasta> [grafico|diario|afinar|cores|regras|rota|coordenadas|acuracia]` | `src/game/{charts,fishlog,lessons}.ts` (+ testes), `src/components/work/{Grafico,Lessons,Charts}.tsx`, `src/components/city/FishLog.tsx` |
| **Trabalho de campo (02/10)**: a tarefa de cada profissão que faz andar pelo mapa. Pega na aba NO MAPA do trabalho (fazendeiro: caixa de envio); alvos marcados em várias áreas (losango pulando; os bugs só aparecem de perto); pisar no ponto cumpre (entrevista: falar com o morador marcado, vira matéria no jornalzinho); placa na tela com quantos faltam em cada área. 7 trabalhos: Instalar sensores (IoT), Escanear a cidade (Metaverso), Caça-bugs (Games), Caça aos dados (IA), Cesta da manhã (Padeiro, gasta pão, prazo), Rota do leite (Fazendeiro, gasta leite), Entrevista (Repórter). `progress.campo`. Prints: `prints-trabalho4.mjs <pasta> campo` | `src/game/fieldwork.ts` (+ testes: todo alvo alcançável), `src/components/work/FieldBox.tsx`, `CityDemo.tsx` (`fieldNow`, `doTarget`) |
| **TCG em volta do duelo (02/10)**: **8 Caminhos** (decks iniciais de 20 por mecânica, `paths.ts`; lista fixa balanceada em `cards/caminhos.json` por `npx vite-node scripts/tcg-caminhos.ts --ajustar <ids> 10 [--limitar]` + `--juntar`; relatório: `scripts/tcg-caminhos.ts 40`; escolha no 1º acesso em `PathChooser.tsx`, `?caminho` força; em navegador automatizado ela não abre sozinha). **Chefes com estilo** (um Caminho + elemento, nome tipo "Ceifador das Sombras", deck de 20; `bosses.ts` `towerBoss`). **Grimório** (6 talentos pequenos, 1 ponto a cada 2 andares; deck extra, +25% de pó, versos de carta, trocar a mão inicial (`mulligan` no motor), espiar o topo; aba GRIMÓRIO no deck, `?grimorio`). **Títulos** por conquista (`titles.ts`, aba TÍTULOS na mochila, plaquinha) | `src/lib/tcg/{paths,bosses}.ts`, `src/game/{grimoire,titles}.ts` (+ testes), `src/components/{city/PathChooser,duel/GrimoirePanel}.tsx` |
| **Virada e professor (02/10)**: **migração WIT 1 → WIT 2** como função pura (`migration.ts` `migrateStudent`: cartas pelo nome da loja, 1 diamante = 20 moedas, materiais → pó, pontos → Grimório, títulos + Veterano, Pacotes de Legado por nível (proposta), Caminho sugerido). **Pacotes guardados** (`progress.pacotes`, MEUS PACOTES na Loja, `openSaved`/`givePacks`). **Desenho do banco** (só documento, nada aplicado): `docs/banco-wit2.md`. **Aula de hoje** em demonstração com dados de mentira: `/professor/aula-demo` (regras em `lesson.ts`: um toque por aluno, pacote por desempenho, código de 30 s, entrega) | `src/game/{migration,lesson}.ts` (+ testes), `src/pages/TeacherLessonDemo.tsx` |
| **Mais tarefas e economia (02/10)**: calendário da horta, por que a massa cresce, minha barraca (curva da procura), fato ou boato, lógica do jogo, pixel art (`lessons2.ts`, `Lessons2.tsx`; `progress.desenhos`); limpeza do lago (lixo pescado paga e 3 no dia dão mais peixe raro; `fishlog.ts`); entrega expressa. **Limite diário pago** das tarefas de andar (`PAID_PER_DAY` em `life.ts`: 5 entregas, 5 encomendas, 2 trabalhos de campo; depois só XP), achado pela simulação. **Veículos**: só regras e simulação (`vehicles.ts`, `npx vite-node scripts/veiculos.ts`); montaria espera a arte (`docs/prompts-lote2.md` §N). Prints: `prints-trabalho4.mjs <pasta> [calendario|fermento|barraca|boato|logica|pixelart]`, `prints-tcg2.mjs <pasta>` | `src/game/{lessons2,vehicles}.ts` |
| **Ajustes de 03/10 (pedidos do Matheus)**: **sentar** em todo lugar com o tronco inteiro (`drawSeated` em `sprites.ts`: cintura medida no modelo, `Frames.waist`; linha do tampo de cada mesa em `SEAT_CUT`/`seatLine` em `room.ts`; banco e barco no `CityDemo`; `?sentar=N` abre sentado; prints `prints-sentar.mjs`). **Shopping**: cliente só para onde fica à vista (`hiddenBehind`/`wanderTiles`). **Duelo**: voo da carta sem esticar, armadilha do inimigo virada, tempos em `PLAYED_MS`/`INTRO_*` (`prints-duelo-tempo.mjs`). **Kit pixel dos painéis** (`components/pixel`: `PxPanel`, `PxButton`, `PxTabs`, `PxBox`, `Ribbon`, molduras 9-slice em SVG); `Shell` usa o kit. **Mapa-múndi** pronto (`mapa-mundo.ts` → `public/game/world/mapa.webp`, `world-map.ts`; teste avisa se ficou velho; `?mapa`). **Pacotinhos em pixel** (`world/packs-art.ts`, folha `folha-pacotes.ts`). **Casa com móveis que funcionam** (`interior/house-acts.ts`, `city/HousePanels.tsx`; prints `prints-casa.mjs`). **Deck como álbum** (`DeckBuilder.tsx` + `deckbook.css`). **Minijogos**: palco comum `work/GameStage.tsx` (contagem, carimbo, faíscas, combo; ouve o evento `wit-sfx`) com cenário da profissão `work/Scene.tsx` (móveis do atlas; `Prop` desenha um móvel); forno e show refeitos (`minigames.css`) | `src/components/{pixel,work,city,duel,packs}/`, `src/game/{world,interior}/` |
| Aviso "ESPAÇO"/"A" em cima do boneco quando há algo para usar na frente (cidade e interiores) e placa SAIR piscando nas portas dos interiores | `src/game/world/player-acts.ts` |
| **Vida da cidade**: árvores, flores, mato e taboas balançando (`motion.ts`, quadros hd com fase pela posição); água do lago em movimento (`lakeFrames` em `town.ts`); fumaça nas chaminés, brilho nas janelas, borboletas, pétalas, pássaros, sombra de nuvem e vaga-lumes (`ambient.ts`, pontos em `town.fx`); capim alto cobre as pernas; poeira ao correr | `src/game/world/{motion,ambient}.ts` |
| **Moradores trabalhando** (pescadores no lago com boia e peixe, músico com violão e notas, padeira com bandeja e vapor, fazendeira regando, repositor levando caixas, estudantes passeando): o `job` de cada NPC em `content.ts` (tipo, rota de paradas, pausa); desenho do que seguram em `jobs.ts`. Teste confere lugar livre, rota alcançável e pescador de frente para a água. Sentar nos bancos: espaço de frente para o banco, qualquer seta levanta. Postes: cada um acende na sua hora, piscando (`lampPower` em `light.ts`, `town.lamps`) | `src/game/world/{jobs,content}.ts`, `src/pages/CityDemo.tsx` |
| Plaquinha de nome e título sobre o jogador (e dos moradores quando chega perto); apelido na tela VISUAL | `src/game/world/nameplate.ts` |
| Dia e noite (tinta por hora, halo das luzes) | `src/game/world/light.ts` (`/cidade-demo?hora=22&velocidade=20`; tecla T avança 2 h) |
| Planta do Centro (terrenos, prédios, colisão, portas, saídas oeste/leste/sul) | `src/game/world/town.ts` (+ testes em `__tests__/town.test.ts`): 64×48 blocos em faixas (prédios em cima, rua embaixo), praça da Torre no meio; `DOOR_X` (em `zone.ts`) guarda onde fica a porta de cada sprite para o caminho cair embaixo dela; `?casa=modelo-gamer` troca o modelo da Sua Casa |
| Movimento em grade, caminho, troca de cor do boneco | `src/game/world/{movement,recolor}.ts` |
| Cidade jogável (`/cidade-demo`, `?passeio=1` anda sozinho) | `src/pages/CityDemo.tsx` + textos em `src/game/world/content.ts` |
| **Personagem do jogador e moradores**: 10 modelos-base do GPT em cores-molde (`public/Novos assets/personagem/modelos/`) convertidos para `public/game/sprites/modelos/` (4×4 quadros de 32×40) | `python3 scripts/arte/importar-personagem.py --folha saida.png`; paleta e rampas de cor em `src/game/world/outfit.ts` (a paleta tem de bater com a do script); tela de visual em `src/components/city/LookEditor.tsx` (botão VISUAL, `/cidade-demo?visual`) |
| **Interiores**: Torre (8 mesas + chefe por andar, `?sala=torre&andar=N`), Sua Casa (modo DECORAR: pôr, mover, girar, pintar tecido, piso e papel de parede, salvo no navegador, `?sala=casa`), Arena (saguão com mesas de desafio + portal para o Salão de Treino Rank S), Loja (shopping com 8 lojas), Oficina (café de trocas + forja) e Castelo (4 mesas de guilda + tapete vermelho): `?sala=arena|treino|loja|oficina|castelo`. A porta de cada prédio na cidade abre a sala dele. Sala nova: uma função em `room.ts` + `ROOMS`; o teste confere sobreposição e se dá para chegar em todo mundo | regras puras e salas em `src/game/interior/room.ts` (+ testes); desenho e editor em `src/components/city/InteriorView.tsx` |
| **Móveis, pisos e paredes dos interiores** (395 sprites em hd, num atlas só): folhas do GPT em `public/Novos assets/interiores/` → `public/game/interior/atlas.png` + `manifest.json` (nome, categoria, camada m/t/p, pegada, tecido) | `python3 scripts/arte/importar-interiores.py --folha revisao.png`; a lista de cada folha (ordem, nomes, escala, pegada) fica no topo do script |
| **NPCs desafiantes e pets do GPT** (folhas 4 × 4 em cores reais) → `public/game/sprites/npcs/` (64 × 80) e `public/game/sprites/bichos/` (48 × 48); o pet se escolhe no VISUAL | `python3 scripts/arte/importar-sprites.py --folha revisao.png` (o `pet-dragaozinho-brasa` fica de fora: parecido demais com o Spyro, refazer) |
| Quadros de personagem, NPC e pet, plaquinhas e utilitários de canvas (cidade e interiores) | `src/game/world/sprites.ts` |
| **Acessórios** (20: cabeça, rosto, corpo; cor à escolha; tela VISUAL): folhas cinzas do GPT → `public/game/sprites/acessorios/atlas.png` + manifest. O encaixe mede cabeça e tronco de cada quadro do modelo (cores-molde) e põe pelo tipo (`ACC_INFO`) | `python3 scripts/arte/importar-acessorios.py`; regras em `src/game/world/accessories.ts`; folha de revisão nos 10 modelos: `npx vite-node scripts/mapa/folha-acessorios.ts -- saida.png [ids]` |
| Pets (PixelLab, 32 px) e o boneco antigo | `public/game/sprites/` (ver README lá) |

O texto de uma carta **nunca** é escrito à mão: sai de `describeCard`. Para
mudar o que a carta diz, mude o efeito.

Documentos antigos em `docs/` (`CARD_SYSTEM_DESIGN.md`, `CARD_MASTER_DESIGN.*`,
`BATTLE_ENGINE_CARD_ARCHITECTURE.md`, `SHOP_*`, `ABILITIES_*`, `prompts-cartas.md`)
são do sistema anterior ao TCG: **não servem de referência**.

## Scripts úteis

- `npx vite-node scripts/tcg-duelo.ts` — duelo roteirizado com a conta de cada dano.
- `npx vite-node scripts/tcg-simular.ts 15000` — simula partidas entre decks
  aleatórios e mostra a taxa de vitória de cada carta. Toda carta nova ou
  alterada passa por aqui (faixa aceitável: ~40% a 60%).
- `npx vite-node scripts/tcg-catalogo.ts <wr.json>` — regenera `docs/cartas-tcg.md`.
- `npx vite-node scripts/mapa/render-cidade.ts -- <pasta> 2` — PNG da cidade inteira + recortes do tamanho da tela (dia, noite, tarde; `--codigo` usa a arte por código).
- `npx vite-node scripts/mapa/render-hd.ts -- <pasta> [x,y ...]` — a cidade como o jogo desenha (2×) e recortes de tela em cada x,y (blocos).
- `/cidade-demo?pos=12,41` começa o boneco no bloco (12,41) (prints e testes).
- `npx vite-node scripts/mapa/folha-predios.ts -- saida.png 3` e `folha-objetos.ts` — folhas de revisão.
- `node scripts/mapa/prints-interiores.mjs <pasta>` — prints da Torre (3 faixas de andar), da casa decorando, do celular e de entrar/sair.
- `node scripts/mapa/prints-mundo.mjs <pasta>` — prints do mundo grande (viagem, barco, pesca, Casa de Pesca, mapa, fazenda, Cidade WIT).
- `npx vite-node scripts/mapa/render-hd.ts -- <pasta> --zona lago [x,y ...]` — qualquer área inteira em hd.
- `node scripts/mapa/prints-cidade.mjs <pasta>` e `video-cidade.mjs <pasta> 20` — prints e vídeo da cidade
  jogável (precisa do `vite` rodando em 127.0.0.1:5199 e de um `.env` com as chaves públicas do Supabase).
- Arte: `npx vite-node scripts/arte/gerar.ts -- --ids a,b --paralelo 4`
  (AI Horde, modelo noobEvo, gratuito) e depois `python3 scripts/arte/processar.py --folha`.
  Prompts em `scripts/arte/prompts.ts`.

## Regras do projeto

- **Tudo gratuito.** Nada de API paga.
- **Nada de emoji no jogo** (o Matheus descarta na hora). Ícone é imagem: `<Icon id>` / `<Symbol id>` (`src/components/Icon.tsx`), arquivos em `public/game/icons/` (provisórios CC0 de `scripts/arte/icones.py` até o GPT fazer os da lista em `docs/prompts-lote2.md` §G).
- **Visual feito por código costuma ficar feio**: o que for arte (personagem, objeto, cena de minijogo) vem do GPT. Código faz layout, efeitos e animação.
- **Público infantil.** Toda imagem gerada é revisada uma por uma antes de
  entrar no repositório: personagem certo e nada sensual. O modelo tende a
  sexualizar personagens femininas; nesses casos use plano de busto com roupa
  completa ou arte só do objeto/cena. Suba só as imagens revisadas (`git add`
  por arquivo).
- **Ou fica bom de verdade, ou não fazemos.** Mostre prints para o Matheus
  aprovar antes de seguir para a próxima tela.
- Não mexer em RPCs, LGPD e segurança sem pedido explícito (outra sessão cuida
  disso; ver `docs/LGPD_SEGURANCA.md`). O portal dos pais e as turmas foram
  removidos de propósito.
- `.env` fica fora do git.

## Antes de dizer que terminou

1. `npm run typecheck` — **use este**: `npx tsc --noEmit` na raiz não checa
   nada (o `tsconfig.json` raiz tem `files: []`).
2. `npm test`
3. `npm run test:build` — build de produção + abre as rotas num navegador de verdade.
4. Mudou visual? Tire print (Playwright + Chromium em `/opt/pw-browsers`) e mostre.
5. Mexeu em desempenho? `npx vite build` e depois `npm run perf -- /rota` (medições em `ROADMAP.md` §0).
   **O perf mede o build de produção (`dist`)**: sem gerar o build de novo, ele mede a versão antiga.
   Para achar o culpado: `node scripts/mapa/perfil-cpu.mjs 22` (perfil de CPU com o `vite` rodando).
   Evite `backdrop-filter` e `mix-blend-mode` em elementos grandes ou repetidos
   (cartas na mão): eles derrubam o FPS.
