# WIT Dungeon — guia para o Claude

Jogo educacional do Matheus (professor do Núcleo WIT) para os alunos dele.
React 18 + TypeScript + Vite + Supabase (projeto `pvnzfiyxwvfmmhvpvrrk`).
Responda em português, de forma **curta e direta**, sem bajulação.

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
| **Chão pronto**: o chão hd da cidade vem pintado em `public/game/world/cidade/chao.webp` (o jogo não calcula ao abrir). Mudou a planta, o desenho do chão (`GROUND_VERSION` em `ground.ts`) ou as texturas? Rode `npx vite-node scripts/mapa/chao-pronto.ts` (um teste avisa quando está velho) | `scripts/mapa/chao-pronto.ts` |
| **Vida da cidade**: árvores, flores, mato e taboas balançando (`motion.ts`, quadros hd com fase pela posição); água do lago em movimento (`lakeFrames` em `town.ts`); fumaça nas chaminés, brilho nas janelas, borboletas, pétalas, pássaros, sombra de nuvem e vaga-lumes (`ambient.ts`, pontos em `town.fx`); capim alto cobre as pernas; poeira ao correr | `src/game/world/{motion,ambient}.ts` |
| **Moradores trabalhando** (pescadores no lago com boia e peixe, músico com violão e notas, padeira com bandeja e vapor, fazendeira regando, repositor levando caixas, estudantes passeando): o `job` de cada NPC em `content.ts` (tipo, rota de paradas, pausa); desenho do que seguram em `jobs.ts`. Teste confere lugar livre, rota alcançável e pescador de frente para a água. Sentar nos bancos: espaço de frente para o banco, qualquer seta levanta. Postes: cada um acende na sua hora, piscando (`lampPower` em `light.ts`, `town.lamps`) | `src/game/world/{jobs,content}.ts`, `src/pages/CityDemo.tsx` |
| Plaquinha de nome e título sobre o jogador (e dos moradores quando chega perto); apelido na tela VISUAL | `src/game/world/nameplate.ts` |
| Dia e noite (tinta por hora, halo das luzes) | `src/game/world/light.ts` (`/cidade-demo?hora=22&velocidade=20`; tecla T avança 2 h) |
| Planta da cidade (terrenos, prédios, colisão, portas) | `src/game/world/town.ts` (+ testes em `__tests__/town.test.ts`): 64×48 blocos em faixas (prédios em cima, rua embaixo), praça da Torre no meio; `DOOR_X` guarda onde fica a porta de cada sprite para o caminho cair embaixo dela; `?casa=modelo-gamer` troca o modelo da Sua Casa |
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
- `node scripts/mapa/prints-cidade.mjs <pasta>` e `video-cidade.mjs <pasta> 20` — prints e vídeo da cidade
  jogável (precisa do `vite` rodando em 127.0.0.1:5199 e de um `.env` com as chaves públicas do Supabase).
- Arte: `npx vite-node scripts/arte/gerar.ts -- --ids a,b --paralelo 4`
  (AI Horde, modelo noobEvo, gratuito) e depois `python3 scripts/arte/processar.py --folha`.
  Prompts em `scripts/arte/prompts.ts`.

## Regras do projeto

- **Tudo gratuito.** Nada de API paga.
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
