# WIT Dungeon — Estado e próximos passos

> Levantamento feito em 20/09/2026 sobre o código na branch
> `claude/gifted-einstein-kq6yb5`, com leitura direta do banco de produção
> (`pvnzfiyxwvfmmhvpvrrk`). Substitui as partes desatualizadas do `HANDOFF.md`.

---

## 0. Fluidez — medições de 21/09/2026

Medido no build de produção, servido de verdade e aberto num Chromium com a
**CPU estrangulada a 4×**, para aproximar o Chromebook de escola. Janela de 8 s,
1366×768, três execuções de cada lado. Reproduzível com `npm run perf`.

> **Ressalva que muda como ler os números:** este ambiente renderiza por
> software (SwiftShader, sem GPU). Blur, blend e composição custam mais aqui
> que num Chromebook real. Os números servem para **comparar lados**, não como
> valor absoluto. O `npm run perf` avisa quando é o caso.

### Onde chegamos

| Tela | Antes | Depois | Quadros travados |
|---|---|---|---|
| Batalha | 34,6 fps | **~59 fps** | 164 → ~10 |
| Login do aluno | 27,0 fps | **~58 fps** | 188 → ~12 |
| Login do professor | 30,0 fps | **~55 fps** | 194 → ~35 |

### A lição: eu estava otimizando a coisa errada

A primeira rodada atacou re-renders do React. O perfil de CPU, feito depois,
mostrou que o **JavaScript estava ocioso** — 55,9% idle, 43,5% em "(program)"
(estilo, layout, pintura). Todo o JS somado: 0,6% do tempo.

O custo real era pintura, em três lugares:

**1. Nove cenários de batalha montados ao mesmo tempo.** O `BattleBackdrop`
renderizava todos e escondia os inativos com `opacity: 0` — que não pausa
animação nenhuma. 144 elementos animando de 267 nós no documento, incluindo
uma grade em perspectiva cuja caixa projetada media 700 bilhões de px².
O aluno via um cenário e pagava por nove. → 45,1 para 54,2 fps.

**2. `backdrop-filter` nos quatro botões de ação.** A tela tem nove painéis
com vidro fosco; oito custam quase nada e estes quatro custavam o quadro
inteiro. Tirando só deles, o resto mantém `blur(12px)` de graça.
→ 45,1 para 60,1 fps. Os dois screenshots são indistinguíveis.

**3. `mix-blend-mode: screen` na aurora do login**, mais o starfield 3D
desenhando embaixo dela. Blend mode obriga o compositor a ler de volta o que
está por baixo, o que impede guardar a camada pronta. E a aurora tem base
opaca, então as 1.800 estrelas atrás dela nunca apareceram para ninguém.
→ 27 para 58 fps.

Contra a intuição: o `blur(60px)` da aurora **não** era o problema. Reduzi-lo
para 24px não mudou nada (28,3 vs 28,1 fps). Ficou como estava.

### Re-renders numa batalha completa

Contados rodando uma batalha real pelo `BattleEngine` (40 turnos, 217 mensagens,
4.939 caracteres digitados). Não aparece no fps porque não era o gargalo, mas
segue valendo — é trabalho que sumiu:

| | Antes | Depois |
|---|---|---|
| Re-renders da árvore do BattleScreen | 4.939 | **217** (−95,6%) |
| Medições de layout do framer-motion | ~19.756 | ~868 |

### O que não dá para medir daqui

O hub e a loja — onde o aluno passa a aula — estão atrás do login e não são
alcançáveis sem credencial de aluno. `npm run perf /rota` funciona em qualquer
tela: entre com um aluno de teste e aponte o script.

O `AincradBackground` (fundo de todas as telas do portal) já declara oclusão do
starfield, pelo mesmo motivo do login: base opaca. Isso está coberto por teste
de unidade, mas não verificado de ponta a ponta na tela real.

`staleTime` nas queries, `decoding="async"` e `loading="lazy"` aparecem em
navegação e rede real, não numa janela de 8 s com a aba parada.

---

## 1. O que mudou nesta rodada

| | Antes | Depois |
|---|---|---|
| Erros de TypeScript | 275 | 62 |
| Chunk de entrada | 1.392 kB (400 kB gzip) | 19 kB (7 kB gzip) |
| Testes | 1 trivial | 20 reais |
| three.js no caminho crítico | sim | não |
| Vídeo de 10,4 MB no login | baixava sempre | só em conexão boa, após idle |

### Bugs corrigidos que mais importam

**KO indireto não terminava a batalha.** O fim de luta só era checado no ataque
direto — `playerAttack` e `useEquipmentAbility`, cada um com seu bloco inline.
Todo dano indireto ficava de fora: veneno, queimadura, counter, contra-ataque
automático, companion, chuva de lâminas, Reigan, efeitos de campo e regras de
execução. Na prática o inimigo chegava a 0 de HP e continuava atacando até o
aluno acertar mais um golpe; o espelho disso deixava o aluno jogando com 0 de
HP até a próxima investida perceber. Isso atingia em cheio justamente as cartas
Lendária+, que são o carro-chefe do jogo. Agora tudo passa por
`resolveOutcome()`, um árbitro único. Nove dos onze testes novos falham no
código anterior.

**Duplo-toque no Atacar dava um turno extra ao inimigo.** Cada ação montava seu
próprio `setTimeout`; o segundo toque não fazia nada no motor mas devolvia um
snapshot ainda em `ENEMY_TURN`, e um segundo timer era armado. Em tablet, que é
onde os alunos jogam, isso acontece o tempo todo. Os timers também nunca eram
limpos, então uma batalha abandonada no meio da animação disparava o turno do
inimigo dentro da batalha seguinte.

**Economia perdia escritas concorrentes.** O crédito de moedas era
read-modify-write no cliente. Se um aluno terminasse a batalha no mesmo instante
em que você desse moedas pelo painel, uma das duas escritas sumia — e o teto
diário já tinha sido consumido, então ele perdia as moedas *e* o espaço no
limite do dia. Agora há a RPC `apply_battle_rewards`, que aplica o teto e soma
no banco na mesma transação.

**Animação das cartas Lendárias estava quebrada.** Os valores por função do
GSAP recebem `(index, target, targets)` e o código lia o terceiro argumento — o
*array* de alvos — como índice. `opacity` e `scale` saíam `NaN`, e os anéis não
animavam.

**Popup de dano mágico nunca aparecia.** O teste comparava `damageType` com
`'Magical'`, valor que não existe no tipo (os válidos são
`Physical`/`Special`/`Status`). Todo ataque mágico mostrava popup de físico.

**Dois baús seus eram impossíveis de abrir.** "Baú Lendário" e "Bau fraco"
estavam ativos na loja sem `chest_key`, caindo num overload de `open_chest` que
foi removido do banco. Corrigidos, com trigger para não acontecer de novo.

**Tela de vitória podia travar para sempre.** O `Promise.all` das rolagens de
drop não tinha `.catch`, então uma falha de rede depois da luta ganha prendia o
aluno na tela de batalha.

---

## 2. Coisas prontas que nunca foram ligadas

Este é o achado mais valioso do levantamento. Há **7.292 linhas** de telas
completas que nenhum arquivo importa. Não são rascunhos: são features
terminadas que ficaram sem o último passo de montagem.

### Já liguei nesta rodada

**Quests do Dia.** O sistema inteiro rodava no servidor —
`ensure_my_daily_quests` no login, 20 pontos de `increment_daily_counter`,
`check_my_daily_quests`, streak de 7 dias com baú Raro de recompensa — e o
`DailyQuestsPanel` nunca tinha sido montado. O progresso acumulava no banco sem
nenhum aluno conseguir ver. Agora tem aba própria ("Diárias").

**Aviso de wipe.** O `Patch11Welcome` estava completo desde o patch 2.7, com
animação e copy editável em `src/content/patch-1-1-message.tsx`. Consulta no
banco: o `apply_patch11_wipe()` foi disparado em **25/05/2026** e zerou **654
dos 685 alunos**; `seen_patch_1_1 = true` em **zero** deles. Ou seja, 654 alunos
perderam moedas, skills e itens sem receber nenhuma explicação. Não dá para
consertar o passado, e despejar hoje um anúncio de quatro meses atrás só
confundiria — então montei com janela de recência de 14 dias. O wipe antigo
segue em silêncio e o mecanismo volta a funcionar no próximo, o que importa se
o relançamento de fim de ano envolver outro wipe.

### Ainda desligadas — ordenadas por retorno

| Tela | Linhas | Situação |
|---|---:|---|
| `GlobalRanking` | 1.391 | Ranking global completo. Há substituto vivo (`WeeklyRankingsScreen`), então é decisão de produto: qual dos dois fica. |
| `Wave11SkillTreeScreen` | 683 | Árvore de skills da Onda 11, sem rota. O `SkillTreePage` cobre parte. |
| `Wave11EvolutionsScreen` | 534 | Evoluções da Onda 11, sem rota. Não achei substituto. |
| `FloorCreator` (professor) | 576 | Criador de andares. Nada equivalente no painel do professor hoje. |
| `Wave11ElementModals` | 452 | Modais de elemento da Onda 11. |
| `CharacterSheet` | 424 | Ficha de personagem. O `HeroScreen` cobre. |
| `BackdropCollectionPanel` | 153 | Coleção de fundos. **Sem substituto** — se há backdrops dropando, não há onde vê-los. |
| `TutorialOverlay` | 137 | Tutorial guiado. |
| `AchievementToast` + `achievementChecker` | 149 | Sistema de conquistas inteiro: o checker só é referenciado pelo toast, e o toast por ninguém. Nunca rodou. |

Além dessas, toda a subpasta `src/components/pvp-arena/` tem peças órfãs
(`ArenaHero`, `BetModal`, `ArenaTab`, `ArenaHUD`, `QueueOverlay`) — o
`PvpArena.tsx` foi reescrito e os pedaços antigos ficaram.

**Recomendação:** antes de construir qualquer coisa nova para o fim de ano,
passe por essa lista. Ligar `BackdropCollectionPanel` e o sistema de conquistas
custa horas, não semanas, e ambos dão sensação de conteúdo novo imediata.

---

## 3. Sobre o "Wit Dungeon 2" em 3D

Você perguntou direto, então vou responder direto: **não faça o jogo em 3D para
o fim de ano.** Não porque seja impossível — porque o custo não está onde
parece.

### O que o stack já aguenta

`three` e `@react-three/fiber` **já são dependências** e já rodam em produção: o
`SpaceBackground` e o `DiveEffect` são cenas WebGL de verdade. A viabilidade
técnica está provada. O chunk `vendor-three` tem 716 kB (188 kB gzip).

### Onde o custo realmente está

O problema não é o motor, é a **arte**. Hoje há **1.288 PNGs** em `public/` —
sprites de inimigos, itens, cartas. Um jogo 3D precisaria de modelo, rig,
textura e animação para cada um desses. Isso é trabalho de estúdio, não de
patch. Nenhuma quantidade de código resolve.

O segundo custo é o **motor de batalha**: `BattleEngine.ts` (1.944 linhas) e
`BattleScreen.tsx` (1.360 linhas) são construídos em torno de sprites 2D e
animação DOM/CSS. Um combate 3D é reescrever a camada de apresentação inteira —
justamente a parte que acabou de ser estabilizada e coberta por testes.

O terceiro é o **hardware da escola**. WebGL em Chromebook é irregular. O
starfield de 5.000 estrelas que estava rodando atrás de telas opacas já era peso
morto; um combate 3D é outra ordem de grandeza. Hoje, inclusive, não temos
telemetria nenhuma de FPS ou de dispositivo — decidir por 3D sem esse dado é
apostar.

### O que eu faria no lugar: momentos 3D

Alto impacto percebido, custo de arte limitado, zero risco para o combate:

1. **Abertura de baú em 3D.** Um modelo só, uma animação. É o momento de maior
   carga emocional do jogo e o que os alunos mais repetem. O `ChestOpening` já
   tem toda a lógica de raridade e revelação — entraria só a cena.
2. **Carta Lendária+ com profundidade.** O `CardActivationAnimation` já existe e
   agora funciona (estava com `NaN`). Dar paralaxe, inclinação por giroscópio e
   brilho volumétrico à carta custa pouco e parece muito.
3. **Sobrevoo do andar entre pisos.** Uma câmera passeando por um mapa
   low-poly na transição. Reaproveita o `FloorMap`, não toca no combate.
4. **Boss 3D pontual — um só.** Um boss de fim de ano modelado em 3D, dentro do
   combate 2D existente. Testa a reação dos alunos com custo de um modelo.

Se depois disso a resposta for boa e você quiser um Wit Dungeon 2 de verdade, aí
sim vale planejar — com telemetria em mãos e fora da janela de lançamento.

---

## 4. Dívida técnica, por prioridade

### Alta

**`skillsRegistry.ts` tem 15.574 linhas de dados estáticos** — 156 skills com
12 variantes de classe cada. Ele agora tem chunk próprio (`skills-registry`),
o que derrubou o `BattleScreen` de 574 kB para 211 kB e isolou o cache: mudar
código de batalha não invalida mais uma tabela que praticamente nunca muda.

**Correção de uma afirmação minha anterior:** eu tinha classificado isto como
"o maior ganho de desempenho que sobrou", olhando só o número cru. Medido, são
370 kB crus mas **20 kB gzip** — dado repetitivo comprime muito bem. O custo de
rede é pequeno; o que resta é o tempo de parse dos 370 kB de literais na thread
principal, que pesa em Chromebook mas não é a emergência que eu sugeri.

Deferir de vez exigiria tornar `applyClassVariant` assíncrono, e ele roda no
meio do render em `BattleDungeonView` para montar as habilidades equipadas.
Mexer nisso agora, no caminho que acabou de ser estabilizado e coberto por
testes, não vale o risco às vésperas do lançamento. Fica como trabalho de
depois, e o caminho natural é mover a tabela para o banco — o que também
permitiria editar skill sem deploy.

**10,4 MB de vídeo no login.** Já não bloqueia mais o carregamento, mas o
arquivo continua desproporcional para um fundo com `blur(14px)`. Recodificar
para ~500 kB ou trocar por imagem resolve. Não consegui fazer aqui: o ambiente
não tem `ffmpeg`.

**62 erros de TypeScript restantes.** Caíram de 275 e o resto está concentrado:
`usePvP.ts` (7), `usePresentationMode.ts` (5), `equipmentAbilityRegistry.ts`
(4), `AuthContext.tsx` (4). Vale zerar — foi exatamente a tipagem voltando a
valer que revelou os bugs dos baús, dos popups mágicos e da animação das cartas.

### Média

**1.288 PNGs, um único WebP.** Converter corta boa parte dos 41 MB de
`public/`. Cinco arquivos de item estão **sem extensão** (`Espírito`,
`Coordenadas`, `Jaula`, `Edo`, `gomu gomu no mi`) — um deles com 1 MB — o que
atrapalha Content-Type e cache.

**Venda de item desarmada.** `sellItem` apagava o item e chamava `add_coins`,
RPC que não existe. Ninguém foi lesado porque a tela não está montada, mas para
reativar é preciso uma RPC transacional que credite e remova junto. Detalhes no
comentário em `src/components/inventory/useInventory.ts`.

**Cobertura de teste.** 20 testes cobrem o árbitro de batalha e a curva de XP.
Faltam: `damageCalculator`, `statusEffects`, `enemyScaling`, e o fluxo de PvP —
que é o mais frágil do sistema.

### Baixa

- 60 erros de lint, quase todos `no-explicit-any`.
- `HeroScreen.tsx.bak` versionado no repositório.
- `.env` versionado. São chaves públicas (`VITE_*`), então não é vazamento, mas
  convém mover para `.env.example`.
- 32 componentes `shadcn/ui` não usados (3.700 linhas).

---

## 5. Pendências que dependem de você

Herdadas do `HANDOFF.md` e ainda válidas:

1. **Secrets do Google Classroom**: `GOOGLE_OAUTH_CLIENT_ID` e
   `GOOGLE_OAUTH_CLIENT_SECRET` nos Edge Function secrets do Supabase. Sem
   isso, o refresh do token não funciona.
2. **Reconectar o Classroom** uma vez por professor, para capturar o
   `refresh_token` novo.
3. **Email do aluno Arthur Oliani** ainda é placeholder
   (`@witdungeon.app` em vez de `@aluno.barueri.br`).

Corrigido desde o handoff, pode riscar da lista: a forja em batalha já está
ligada por completo — buffs entram no início, `tick_my_active_buffs` roda no
fim e a UI de consumíveis existe na tela de batalha.

---

## 6. Sugestão de ordem para o fim de ano

1. Validar em sala o que foi corrigido aqui — principalmente uma batalha com
   carta Lendária e veneno, que é onde o bug do KO indireto aparecia.
2. Ligar `BackdropCollectionPanel` e o sistema de conquistas. Barato, e dá
   sensação de novidade.
3. Decidir entre `GlobalRanking` e `WeeklyRankingsScreen` e aposentar o perdedor.
4. Um momento 3D — sugiro a abertura de baú.
5. Só então, se ainda houver tempo, um wipe de Season com o aviso agora
   funcionando.

O `skillsRegistry` saiu desta lista: o chunk próprio já resolveu a parte que
valia a pena, e a medição mostrou que o resto não é urgente.
