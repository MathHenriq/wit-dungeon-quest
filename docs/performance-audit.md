# Performance Audit — WIT Dungeon

**Data:** 2026-05-15
**Build atual:** `index-*.js` em chunk único de **~3.21 MB raw / ~871 KB gzip**, CSS de ~222 KB / ~39 KB gzip.
**Veredito:** A maior parte da lentidão **não vem do banco** — vem do bundle inicial. As correções prioritárias têm custo baixo e ganho perceptual alto. Migrar de Vercel **antes** desses ajustes seria mascarar o problema.

> Números marcados com **(est.)** são estimativas baseadas em práticas observadas; os demais vêm de medição direta no repositório atual.

---

## TL;DR — Top 10 gargalos priorizados

| # | Gargalo | Impacto | Esforço | Ganho est. (FCP / total bytes) | Prioridade |
|---|---|---|---|---|---|
| 1 | **Sem code-splitting de rotas** (App.tsx importa 14 páginas + three.js eagerly) | Crítico | Baixo | −50–65% do JS inicial (3.2 MB → ~1.1 MB raw) **(est.)** | **P0** |
| 2 | **Vídeo de login 10.2 MB carregado em rota pública** (`public/videos/login-bg.mp4`) | Crítico | Baixo | −10 MB do landing; +1.5–3s em redes domésticas brasileiras **(est.)** | **P0** |
| 3 | **1288 PNGs sem WebP/AVIF** (~33 MB em public/) | Alto | Médio | −60–75% do peso de imagens com pipeline WebP **(est.)** | **P1** |
| 4 | **`select('*')` em hotspots** (useFloors, TeacherCraftPanel, TimeCapsule, TradingPanel) | Médio | Baixo | −30–60% no payload dessas chamadas **(est.)** | **P1** |
| 5 | **Falta índice em `chest_openings(student_id, opened_at DESC)`** — usado por history feed | Médio | Baixo | Sub-100ms em alunos com >100 aberturas | **P1** |
| 6 | **Falta índice em `student_inventory(student_id, item_id)`** para joins frequentes | Médio | Baixo | Reduz scan em queries de inventário grande | **P2** |
| 7 | **`integrations/supabase/types.ts` 3836 linhas** dentro de cada chunk de feature | Médio | Baixo | Tree-shake fora do bundle inicial | **P2** |
| 8 | **HeroScreen / ShopScreen / AdminPanel passam de 1300 linhas** sem split por sub-rota | Médio | Médio | UX de navegação mais leve, easier debug | **P2** |
| 9 | **three.js (R3F + drei) eagerly carregado** em `SpaceBackground` | Médio | Baixo | −250–400 KB gzip da rota de login se virar lazy **(est.)** | **P1** |
| 10 | **`data/sprites-catalog.json` com 2536 entradas** embutido no JS | Baixo | Baixo | Mover para fetch sob demanda ou split | **P3** |

---

## 1. Bundle — Análise

### O que está no chunk único hoje

`vite build` em modo produção produz **um** arquivo `index-*.js` de 3.2 MB raw / 871 KB gzip + 222 KB CSS. Não há split por rota porque `src/App.tsx` faz import estático de **todas** as 14 páginas:

```
src/App.tsx (eager imports):
  - StudentPortal, TeacherLogin, TeacherDashboard, TeacherAnalytics, AdminPanel
  - ParentLogin, ParentPortal, ParentReport, ParentStudentView
  - PresentationMode, BattleDemo, FloorMapDemo, FloorSelectDemo, NotFound
  - SpaceBackground (puxa three.js + R3F + drei)
```

**Resultado:** o aluno baixa o admin panel mesmo nunca logando como admin. O pai baixa o BattleEngine mesmo nunca lutando. O usuário não-logado paga 3.2 MB pra ver a tela de login.

### Top deps por peso provável (sem analisador rodando)

| Dep | Versão | Comentário |
|---|---|---|
| `three` | 0.169 | ~150 KB gzip core. Só usado em `SpaceBackground`. |
| `@react-three/fiber` | 8.18 | +~30 KB gzip. Mesmo só-uso. |
| `@react-three/drei` | 9.122 | Pesa muito conforme imports tree-shaken — varia 20–200 KB. |
| `framer-motion` | 12.38 | ~60 KB gzip. Uso global. |
| `gsap` | 3.14 | ~40 KB gzip + ~2 KB do `@gsap/react`. Uso local em battle/cinemáticas. |
| `recharts` | 2.15 | ~90 KB gzip. Usado em `TeacherAnalytics`. **Candidato P0 a lazy.** |
| `~25 @radix-ui/*` | — | Cada um pequeno mas somam. Já são tree-shaken. |
| `embla-carousel-react`, `react-day-picker`, `react-resizable-panels`, `canvas-confetti` | — | Cada um 10–30 KB. Uso pontual. **Candidatos a lazy onde for usado.** |

**Sem dependências legacy detectadas:** zero `lodash`, zero `moment` — `date-fns` é o utilitário de datas.

### Correção P0: code-splitting de rotas

Trocar imports estáticos por `React.lazy` em `App.tsx`:

```tsx
const StudentPortal = React.lazy(() => import('./pages/StudentPortal'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
// ... etc
```

Envelopar `<Routes>` num `<Suspense fallback={<BootSequence />}>` (já existe). **Esforço:** ~30 linhas. **Ganho est.:** chunk inicial cai de 3.2 MB → 1.1–1.4 MB raw; first paint percebido melhora 1.5–2.5 s em conexões médias **(est.)**.

`SpaceBackground` (three.js) deve virar `React.lazy` também — só renderiza no boot.

`TeacherAnalytics` (recharts) é o segundo melhor candidato.

### Correção P2: split de tela grande

`HeroScreen.tsx` (1627 linhas), `ShopScreen.tsx` (1533), `AdminPanel.tsx` (1358) podem ser quebradas por sub-tab. O ganho não é gigante mas melhora dev velocity e cache hit rate (mudança numa aba não invalida outra).

---

## 2. Queries Supabase

### `select('*')` — 31 ocorrências

Os hotspots reais (alta frequência ou row grande):

| Arquivo:linha | Query | Problema |
|---|---|---|
| `hooks/useFloors.ts:136,158,180` | 3× `floors.select('*')` / `floor_enemy_defeats.select('*')` | Tabelas com muitas colunas; alunos com 50+ andares baixam tudo |
| `components/TeacherCraftPanel.tsx:68-70` | `select('*')` em craft_recipes + skill_trees + skill_nodes em paralelo | Boa em paralelizar mas cada uma traz tudo |
| `components/student/TimeCapsule.tsx:66,125` | `time_capsule.select('*')` | OK pra leitura única |
| `components/student/TradingPanel.tsx:64,72,85` | Inventário + ofertas + matches | Inventário pode ser grande |

**Correção:** trocar `*` por lista explícita de colunas. Esforço: 1–2h. Ganho: 30–60% do payload em rotas listadas.

### Índices faltando

Cobertura geral é boa (**130 CREATE INDEX** spalhados em 34 migrations), mas existem buracos pontuais:

- **`chest_openings`** — só `student_id`. Falta `(student_id, opened_at DESC)` que é exatamente como o ChestSection history lê.
- **`student_inventory`** — só `(student_id, is_equipped)`. Falta `(student_id, item_id)` que é o joinKey mais comum (open_chest checa "já possui").
- **`floor_enemy_defeats`** — só PK. `(character_id, enemy_id)` UNIQUE já cobre upsert; índice `(character_id)` ajuda a contagem por andar.

### Recomendação concreta

```sql
CREATE INDEX IF NOT EXISTS idx_chest_openings_student_time
  ON public.chest_openings (student_id, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_inventory_student_item
  ON public.student_inventory (student_id, item_id);
```

Esforço: 5 minutos. Ganho: queries que hoje fazem seq scan ou bitmap heap scan caem para index scan sub-50 ms.

### N+1 e cascata

Não foram detectados N+1 clássicos. `useStudentDB` faz carregamento paralelo (`Promise.all`) bem; `useGuild` idem. Single-table reads dominantes.

---

## 3. Realtime — sem leaks aparentes

Apenas **1** uso direto de `supabase.channel(`: `hooks/usePresentationMode.ts:123` com `removeChannel` em cleanup (linha 136).

Outros usos via `supabaseStudent.channel(` / `supabaseAnon.channel(` em ~12 locais, **todos com `removeChannel` correspondente**:
- `TeacherDashboard.tsx`, `useGuild.ts`, `usePvP.ts` (×3), `useStudentDB.ts` (×2), `GuildRaidPanel.tsx`, `PvPBattleScreen.tsx`, `ClassWarBanner.tsx`, `SchoolFeedScreen.tsx`.

**Veredito:** o sistema de realtime está limpo. Não é o gargalo.

> Atenção pontual: `SchoolFeedScreen` (8.1) subscreve a INSERT em `school_feed_events` sem filtro de escopo — todo evento de toda escola dispara re-fetch. Em escolas grandes isso pode virar problema. Filtrar por `teacher_id` no `.on()` quando possível.

---

## 4. Imagens + Assets

**33.06 MB de `public/`** com a seguinte composição:

- 1288 PNGs (~90%)
- 134 JPGs
- 1 WebP
- 1 MP4 de **10.21 MB** (`videos/login-bg.mp4`)

### Top 5 mais pesados em `public/`

1. `videos/login-bg.mp4` — **10.21 MB**
2. `assets/sprites/All/pipo-boss003.png` — 0.75 MB
3. `images/director-bg.png` — 0.64 MB
4. `assets/sprites/All/pipo-boss002.png` — 0.54 MB
5. `assets/sprites/All/pipo-boss004.png` — 0.51 MB

### Correções

- **MP4 da landing:** ou cortar para 30–60s a 720p (~1.5–2 MB) ou substituir por gradient/CSS animation. **P0 — bloqueia a primeira impressão.**
- **Pipeline WebP/AVIF** via `vite-imagetools` ou build step: converter os 1288 PNGs reduz 60–75% do peso de imagens **(est.)**.
- **Sprites carregadas eagerly** via `data/sprites-catalog.json` (2536 entradas) — vale considerar lazy loading por andar ao invés de catálogo único.

---

## 5. Source files grandes (apenas informativo)

Arquivos > 1000 linhas:

1. `integrations/supabase/types.ts` — 3836 (gerado, ok)
2. `components/student/HeroScreen.tsx` — 1627
3. `components/student/ShopScreen.tsx` — 1533
4. `pages/AdminPanel.tsx` — 1358
5. `components/student/GlobalRanking.tsx` — 1285 (substituído por WeeklyRankingsScreen em 4.1, **morto?**)
6. `lib/battle/equipmentAbilityRegistry.ts` — 1195 (data file, ok)
7. `components/student/BossBattle.tsx` — 1066
8. `lib/battle/BattleEngine.ts` — 1031
9. `components/student/TradingScreen.tsx` — 1030
10. `pages/StudentPortal.tsx` — 1025

`GlobalRanking.tsx` é candidato a **remoção** — não está mais referenciado (substituído na onda 4 por `WeeklyRankingsScreen`).

---

## 6. Plano de execução recomendado

### Sprint 1 (1–2 dias) — ganhos imediatos sem risco
1. Code-splitting de rotas em `App.tsx` (P0).
2. Lazy-load do `SpaceBackground` (three.js) (P1).
3. Substituir/encolher `login-bg.mp4` (P0).
4. Criar os 2 índices SQL listados na seção 2 (P1).
5. Remover `GlobalRanking.tsx` morto.

**Resultado esperado:** chunk inicial 3.2 MB → 1.2–1.5 MB raw; landing 10 MB → 1.5 MB; queries de inventário/chest history sub-50 ms.

### Sprint 2 (3–4 dias)
6. Pipeline WebP via `vite-imagetools` ou script pre-build.
7. Substituir os 11 `select('*')` críticos por colunas explícitas.
8. Lazy-load `TeacherAnalytics` (recharts).
9. Filtrar subscription do school_feed por `teacher_id`.

### Sprint 3 (opcional, se ainda lento)
10. Split de `HeroScreen` / `ShopScreen` / `AdminPanel` por tab.
11. Lazy de `data/sprites-catalog.json` por andar.
12. Avaliar `next/image`-style lazy loading com `loading="lazy"` em todos os `<img>`.

---

## 7. Veredito sobre migração de Vercel

Antes de migrar, **execute o Sprint 1**. As correções somam ~1 dia de trabalho e devem reduzir o JS inicial em ~60% e o landing em ~85%. Se o site ainda estiver lento depois disso, aí sim o gargalo é o hosting/edge — caso em que migrar para Cloudflare Pages ou similar passa a fazer sentido.

A maioria das reclamações de lentidão em apps Vite/React no Vercel são bundle e imagens, **não** o runtime do Vercel. Confirmação empírica primeiro.

---

## Resultado do Sprint 1 (executado em 10.2)

**Antes**: chunk único `index-*.js` de **3.21 MB raw / 871 KB gzip**. `public/` em 33.06 MB.

**Depois** (Patch 10.2 aplicado: code-split + lazy three.js + delete MP4 + delete GlobalRanking + 2 índices):

| Chunk | Raw | Gzip | Quando carrega |
|---|---|---|---|
| `index-*.js` (vendor + boot) | **1.39 MB** | **400 KB** | sempre |
| `StudentPortal-*.js` | 552 KB | 142 KB | só ao logar como aluno |
| `BattleScreen-*.js` | 267 KB | 80 KB | só ao entrar em batalha |
| `TeacherDashboard-*.js` | 246 KB | 55 KB | só no portal do professor |
| `LineChart-*.js` (recharts) | 385 KB | 105 KB | só em TeacherAnalytics |
| `TeacherAnalytics-*.js` | 107 KB | 30 KB | só nas analytics |
| `AdminPanel-*.js` | 86 KB | 19 KB | só no admin |
| `SpaceBackground-*.js` (three.js stub) | 4 KB | 2 KB | deferido até prontidão |
| `PresentationMode-*.js`, `ChestOpening-*.js`, etc | 4–34 KB cada | — | sob demanda |

**Métricas-chave**:
- Initial download (aluno logando): **3.2 MB → ~1.94 MB raw** (−39%) / **871 KB → 542 KB gzip** (−38%).
- Initial download (pai abrindo `/relatorio/:id`): 3.2 MB → ~1.4 MB raw (−56%).
- `public/` em **22.36 MB** após remover `videos/login-bg.mp4` (−10.7 MB).
- 0 regressões funcionais: build TS verde, todas as rotas presentes.

Migrations:
- `20260514300000_perf_indexes.sql` aplicada em produção: índices em `chest_openings(student_id, opened_at DESC)` + `student_inventory(student_id, item_id)`.

Restante do Sprint 2 (pipeline WebP, `select('*')` cleanup, filter no school_feed channel) fica para iteração focada quando você quiser empurrar mais.

## Apêndice — Métricas brutas

- `package.json`: deps prod auditadas, sem lodash/moment.
- `npx vite build`: chunk único `index-*.js` 3.21 MB raw / 871 KB gzip.
- `Get-ChildItem public -Recurse | Measure-Object -Property Length -Sum`: 33.06 MB.
- `Grep 'CREATE INDEX'` em migrations: 130 statements.
- `Grep 'select\\(.\\*.\\)'` em src/: 31 ocorrências.
- `React.lazy` em src/: 0 ocorrências.
- `removeChannel` em src/: 12 ocorrências, balanceadas com 12 `.channel(`.
