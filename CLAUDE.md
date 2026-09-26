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
- 12 elementos com tabela de fraqueza (`src/lib/battle/typeEffectiveness.ts`).
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
| Vitrine das cartas (`/cartas-demo?q=id1,id2`) | `src/pages/CardsDemo.tsx` |
| Ilustrações das 350 cartas (webp) | `public/cards/art/<id>.webp` |
| Testes do TCG (combos, mecânicas, catálogo) | `src/lib/tcg/__tests__/` |

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
5. Mexeu em desempenho? `npm run perf -- /rota` (medições em `ROADMAP.md` §0).
   Evite `backdrop-filter` e `mix-blend-mode` em elementos grandes ou repetidos
   (cartas na mão): eles derrubam o FPS.
