# WIT Dungeon — Estado e próximos passos

> Levantamento feito em 20/09/2026 sobre o código na branch
> `claude/gifted-einstein-kq6yb5`, com leitura direta do banco de produção
> (`pvnzfiyxwvfmmhvpvrrk`). Substitui as partes desatualizadas do `HANDOFF.md`.

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

**`skillsRegistry.ts` tem 15.574 linhas de dados estáticos.** São 1.872
variantes de skill escritas em TypeScript, importadas pelo `useBattleEngine`.
Por isso o chunk do `BattleScreen` tem 574 kB — em boa parte é tabela. Mover
para o banco (ou para um JSON buscado sob demanda) tira isso do bundle e
permite editar skill sem deploy.

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
4. Tirar o `skillsRegistry` do bundle.
5. Um momento 3D — sugiro a abertura de baú.
6. Só então, se ainda houver tempo, um wipe de Season com o aviso agora
   funcionando.
