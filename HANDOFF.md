# WIT Dungeon — Handoff para nova sessão

## Como usar este documento

Cole o conteúdo abaixo no início de uma nova sessão do Claude Code. Ele dá contexto suficiente para continuar de onde paramos sem perder convenções estabelecidas.

---

## Stack e ambiente

- **Frontend**: React 18 + TypeScript + Vite 5 + GSAP + TanStack Query + Sonner toasts
- **Backend**: Supabase (projeto `pvnzfiyxwvfmmhvpvrrk`)
- **CLI Supabase**: já linkado, autorizado pra `db push` sem confirmação
- **Auth do master/admin**: `auth.users.id = be9ab312-02bb-49a7-a49b-1aae60f4e60b` (Matheus)
- **Estética**: dark glassmorphism (#04060a–#080c14), fontes Orbitron/Rajdhani/Share Tech Mono, uppercase com letter-spacing, sem emojis em UI, sem Three.js/WebGL
- **Diretório do repo**: `C:\Users\Matheus\Documents\Trabalho\wit-dungeon-quest`

## Convenções estabelecidas

1. **Migrations sobem direto** com `npx supabase db push --linked` sem pedir confirmação (memória do projeto).
2. **Todo coin credit** passa por `apply_daily_coin_cap` (cap diário de 500/750).
3. **Atributos têm modifiers** via `attributeModifiers.ts` aplicados em `damageCalculator`.
4. **Inimigos escalam** via `enemyScaling.ts` no client (não no DB).
5. **BattleContext tem 6 slots inertes** pra mecânicas de cartas Lendária+: `reviveCharges`, `enemySkipTurns`, `autoDodgeTurnsLeft`, `erasedEnemyAbilityIds`, `lastEnemyAbilityId`, `copiedEnemyAbilityId`.
6. **Materiais e recipes** usam vocabulário genérico de fantasia/RPG. Renomear é só `UPDATE` em DB.
7. **Wipe do Patch 1.1 está ARMADO mas dormente** — só dispara via `SELECT public.apply_patch11_wipe();` quando todas as ondas estiverem prontas.

## Ondas concluídas

### Onda 1 — Correções fundacionais

- **1.1** Bug de duplicação em troca de itens. Hardened `execute_trade` RPC com dedup, `ROW_COUNT` assertion, EXCEPTION handler.
- **1.2** Botão "Salvar Personagem" silenciosamente falhando pra contas órfãs. Nova RPC `update_my_character` SECURITY DEFINER resolve via `auth.uid()`.
- **1.3** Painel master inutilizável. Re-bootstrap admin por `auth.uid` em vez de teacher_id; novas RPCs `master_spawn_card`, `master_adjust_currency`, `master_create_class`, etc; UI completa com Logs tab, CRUD turmas, toggle-admin, dupla confirmação por nome.
- **1.4** Painel do professor incompleto. RPCs `prof_adjust_student_xp`, `prof_suspend_student`, `prof_unsuspend_student`; coluna `suspended_until` em students + `SuspendedScreen` no login do aluno; UI sem moedas/diamantes (escopo reduzido por design).
- **1.5** UX de cadastro/login. RPC `auth_email_exists`; eye toggle; confirmar senha; mensagens específicas ("Email não cadastrado", "Senha incorreta", etc). Aplicado em LoginScreen do aluno e TeacherLogin.
- **1.6** Google Classroom parou. Edge Function `gsa-refresh-token` (OAuth refresh flow); hook captura `provider_refresh_token` no callback OAuth. **Pendente do usuário**: setar `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` nos Edge Function secrets do Supabase.
- **1.7** PvP "perde instantaneamente". Removido fallback silencioso `PvpBattleOverlay` que rodava simulador determinístico; substituído por `BattleLoadingOverlay` + timeout 12s + abort limpo. Telemetria `pvpTelemetry`, timer outgoing 60s, reconnect monitorado.
- **Bug do botão Fugir**: `BattleDungeonView` não passava `onFled` ao `BattleScreen` → tela travava. Adicionado handler que volta pro mapa.

### Onda 2 — Balanceamento

- **2.1** Atributos funcionais. `src/lib/battle/attributeModifiers.ts` mapeia: Força→`physicalDmgMult`, Inteligência→`magicalDmgMult`, Destreza→`critBonus`, Carisma→`procMult`, Agilidade→`evadeBonus`, Resistência→`damageTakenMult`. Caps configuráveis. Integrado em `damageCalculator` (params opcionais `attackerMods`/`defenderMods`) e em 5 call sites do `BattleEngine`. Componente `AttributePanel` em tempo real no editor de personagem.
- **2.2** Curva de inimigos. `src/lib/battle/enemyScaling.ts` (HP × 1.06^floor, Def × 1.04^floor, Boss +100% HP). Boss phase-2: ao cair abaixo de 50% HP, late-on −30% dano recebido. Recompensas piecewise (50/250/600 coins ancorado em floors 1/25/50). Migration `20260510180000_enemy_density.sql` aplicada: +1 inimigo nos andares 1-10, +2 em 11-20, +3 em 21-30.
- **2.3** Cap diário de moedas. Tabela `daily_currency_log` + RPC `apply_daily_coin_cap` com diminishing returns (100%/75%/50% nos thresholds 500/750). Reset à meia-noite BRT via `AT TIME ZONE 'America/Sao_Paulo'`. `DailyCoinBar` no header. Diamantes não entram.
- **2.4** Repreçar skills. Bulk UPDATE em 957 itens (80/250/600/1500/4000 + Mítica 10000 / ??? 25000). Mítica e ??? ocultos da loja via `SHOP_HIDDEN_RARITIES` client-side; banner explicativo "agora apenas via baus".
- **2.5** Skills L/M/??? (placeholder). Aguardando o usuário trazer definições de carta de outra sessão (Claude Web). Engine plumbing pronto: 6 campos novos no `BattleContext`, hooks automáticos para skip-enemy-turn, filter erased abilities, record last enemy ability, revive on lethal, force-evade on autoDodge. Bloco de doc com 6 templates copy/paste no topo de `equipmentAbilityRegistry.ts`.
- **2.6** Skills C/I/R/É (placeholder). Mesma situação — aguardando arquivo de 86 reescritas.
- **2.7** Wipe + Welcome modal. Schema aplicado, função `apply_patch11_wipe()` armada mas dormente. Modal `Patch11Welcome` + content file editável em `src/content/patch-1-1-message.tsx`. Gateado por `wiped_at_patch_1_1 IS NOT NULL AND seen_patch_1_1 IS FALSE`.

### Onda 3 — Inventário/Baús/Forja

- **3.1** Inventário de materiais. Tabelas `materials` + `student_inventory_materials`. RLS bloqueia trade entre alunos (escrita só via RPC SECURITY DEFINER). Seed de 20 materiais com vocabulário genérico (5 temas × 4 raridades): Fragmento Arcano, Pó do Vazio, Caco Glacial, Sigilo Carmesim, Coroa Dourada, etc. RPC `apply_battle_materials` com curva de raridade por andar. Aba "Materiais" no inventário com filtros raridade/tema.
- **3.2** Baús. Estendeu o sistema existente (`chest_types`). Suporte ao tier `unknown` (???) na constraint `shop_items.rarity`. 3 baús globais seedados: `global_common` (200 coins, 70/25/4/0.9/0.09/0.01% c/i/r/é/L/M), `global_rare` (50 diamantes), `global_mythic` (200 diamantes). Tabela `chest_subpercent_weights` em basis points (0.01% precisão) para tiers <1%. RNG criptográfico via `gen_random_bytes`. RPC `open_chest(chest_key, count)` aceita 1x ou 10x (5% desconto). Duplicate handling: 10 re-rolls dentro da rarity → fallback de refund em coins. Botões 1× / 10× lado-a-lado no `ChestSection`. Rarity `unknown` adicionada em `ChestOpening` com glow especial.
- **3.3** Forja. Tabelas `consumables`, `temporary_buffs`, `forge_recipes`, `student_consumables`, `student_active_buffs`. 5 consumíveis + 5 buffs + 10 receitas seedadas com vocabulário genérico (Poção Menor, Elixir Pleno, Bálsamo de Cura, Selo de Esquiva, Manto de Sombras, Catalisador do Vazio, etc). RPC `forge_recipe(p_recipe_key)` valida + debita atomicamente; lista materiais faltantes na resposta de erro. RPC `tick_my_active_buffs()` exposta para wiring futuro no fim de batalha. RPC `get_my_forge_state()` retorna tudo em uma chamada. Componente `ForgePanel` na aba Forja do ShopScreen, acima do CraftPanel legado (skill-tree based).

## Pendências

### Bloqueadores externos (precisam de ação do Matheus)

1. **GSA secrets**: setar `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` nos Edge Function secrets do Supabase. Sem isso, refresh do token Classroom não funciona.
2. **Reconectar Google Classroom** uma vez por professor para capturar o `refresh_token` novo (só é emitido na primeira autorização com `prompt=consent`).
3. **Verificar Google Cloud Console**: modo Testing vs Production, lista de test users, redirect URIs autorizadas.
4. **Atualizar email do aluno Arthur Oliani** de `arthur.oliani.lourenco@witdungeon.app` (placeholder) para o formato `@aluno.barueri.br` real. Theo já foi corrigido (`theogoncalves.0606@aluno.barueri.br`).

### Conteúdo aguardando o Matheus

5. **Patch 2.5**: definições das ~43 cartas Lendária/Mítica/??? com mecânicas concretas (sairá de outra sessão).
6. **Patch 2.6**: definições das 86 cartas Comum/Incomum/Rara/Épica.
7. **Renomear materiais e receitas** (Patch 3.1/3.3) se quiser terminologia diferente do vocabulário genérico atual.

### Pendências de integração

8. **Forja em batalha**: schema dos buffs/consumíveis está pronto. Falta wirear no `BattleEngine`:
   - Início de batalha: ler `student_active_buffs` e somar em `playerMods` (mapeamento óbvio: `evade_bonus` → `evadeBonus`, `proc_bonus` → `procMult`, etc).
   - Fim de batalha: chamar `tick_my_active_buffs()`.
   - UI de batalha: seção de consumíveis com botão "usar" que decrementa `student_consumables` e dispara `useItem` correspondente.

### Próximas ondas

9. **Onda 4+** ainda não compartilhadas pelo Matheus.
10. **Disparo do wipe do Patch 2.7**: `SELECT public.apply_patch11_wipe();` quando tudo estiver pronto para "Season 2". Backup antes, conforme prompt original.

### Validações pendentes (manuais com sessão real)

11. Atributos funcionais em batalha real (Patch 2.1).
12. Boss phase-2 trigger numa luta real do andar 25 (Patch 2.2).
13. Cap diário cruzando os thresholds (Patch 2.3).
14. PvP fluxo completo com dois alunos (Patch 1.7).
15. Reset de senha pelo painel admin testado por professor (Patch 1.3+).
16. Distribuição de probabilidades dos baús em 10k aberturas (Patch 3.2 — query SQL pronta no resumo daquela onda).

## Estatísticas do que está em produção

- **24 migrations** aplicadas em `pvnzfiyxwvfmmhvpvrrk`
- **4 Edge Functions** novas/atualizadas e deployadas
- **~55 RPCs** criadas
- **20 materiais**, **5 consumíveis**, **5 buffs**, **10 receitas** seedadas (genéricos)
- **957 itens da loja** repreçados
- **3 baús globais** com sub-percent precision

## Regras importantes para o agente que continuar

1. **Não adicione conteúdo IP-temático novo** (nomes/mecânicas tiradas de franquias específicas). O `equipmentAbilityRegistry.ts` já tem conteúdo IP-themed que o usuário escreveu; mantenha essas entradas, mas não adicione novas no mesmo estilo. Use vocabulário genérico em qualquer seed novo (cristais, essências, sigilos, etc).
2. **Antes de mudanças grandes**, audite o código existente. Migrations e RPCs ficam em `supabase/migrations/`. Edge Functions em `supabase/functions/`.
3. **Build** = `npx vite build`. **Apply migration** = `npx supabase db push --linked`.
4. **Migrations já aplicadas em produção** não devem ser editadas — sempre crie novas com timestamp incremental.
5. **PowerShell + Supabase CLI**: o pipe `Set-Content/Get-Content` adiciona BOM por padrão. Para passar SQL inline pra `npx supabase db query --linked -f arquivo.sql`, use `[System.IO.File]::WriteAllText("$PWD\.tmp.sql", $sql, [System.Text.UTF8Encoding]::new($false))` para escrever sem BOM.

## Por onde começar

Se a próxima conversa for sobre:

- **Patch 2.5 ou 2.6** (cartas): peça pro usuário o arquivo de definições e substitua os handlers em `equipmentAbilityRegistry.ts`.
- **Forja em batalha** (pendência 8 acima): wire `student_active_buffs` no `BattleEngine` start + `tick_my_active_buffs()` no end.
- **Nova onda**: aguarde o prompt do Matheus.
- **Push pro GitHub**: o usuário decidiu segurar até todas as ondas estarem prontas e subir tudo de uma vez, junto com o disparo do wipe Patch 1.1.
