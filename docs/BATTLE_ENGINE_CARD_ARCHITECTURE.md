# Arquitetura técnica do novo motor de cartas

## Objetivo

Evoluir o sistema atual de `equipment abilities` para um motor capaz de sustentar as 136 cartas redesenhadas sem depender de 136 excecoes manuais.

A nova arquitetura deve permitir que cartas expressem:

- campos persistentes;
- formas e transformacoes;
- marcas e execucoes;
- afinidades elementais extras;
- sobrescrita e inversao de relacoes elementais;
- follow-ups automaticos;
- copia, roubo e lacre de acoes;
- efeitos de destino, rollback e negação de morte.

## Diagnostico do motor atual

O `BattleEngine` atual ja possui fundamentos bons:

- `playerStatuses` e `enemyStatuses` para efeitos persistentes simples;
- `reviveCharges`, `enemySkipTurns`, `autoDodgeTurnsLeft`, `erasedEnemyAbilityIds`, `lastEnemyAbilityId`, `copiedEnemyAbilityId`;
- matriz elemental em `typeEffectiveness.ts`;
- pipeline claro de ataque em `playerAttack` e `enemyTurn`;
- suporte a buffs da forja em `playerMods`.

O problema atual nao e falta de capacidade pontual; e falta de **abstracoes de alto nivel**.

## Principios da nova arquitetura

1. **Carta define regra, engine executa regra.**
2. **Mecanicas recorrentes viram estruturas nativas.**
3. **Cartas raras combinam primitivas existentes em vez de furar o motor.**
4. **Hooks previsiveis sao melhores do que condicionais espalhados.**
5. **Cada novo conceito precisa ter lifecycle claro:** criacao, tick, expiracao e limpeza.

## Novos conceitos nativos

### 1. Campo de batalha

```ts
export type BattlefieldEffectKey =
  | 'sun'
  | 'frozen_field'
  | 'mana_zone'
  | 'domain'
  | 'quake_field'
  | 'blade_world'
  | 'dark_flame'
  | 'custom';

export interface BattlefieldEffect {
  key: BattlefieldEffectKey;
  source: 'player' | 'enemy';
  turnsLeft: number | null; // null = ate fim da batalha
  name: string;
  tags: string[];
  modifiers?: {
    outgoingElementMult?: Partial<Record<ElementType, number>>;
    incomingElementMult?: Partial<Record<ElementType, number>>;
    disableElement?: Partial<Record<ElementType, boolean>>;
    specialAlwaysHits?: boolean;
    freezePositiveTicksForEnemy?: boolean;
  };
  payload?: Record<string, unknown>;
}
```

Usos:
- `Cruel Sun`
- `Mana Zone`
- `Hyorinmaru`
- `gura gura`
- `Unlimited Blade Works`
- `Domain Expansion`

### 2. Formas do jogador

```ts
export type PlayerFormKey =
  | 'titan'
  | 'dragon_force'
  | 'hollow'
  | 'vampire'
  | 'godspeed'
  | 'bankai'
  | 'berserker'
  | 'kaioken'
  | 'custom';

export interface PlayerForm {
  key: PlayerFormKey;
  name: string;
  turnsLeft: number | null;
  grantsElements?: ElementType[];
  overrideAttackElement?: ElementType | null;
  modifiers?: {
    physicalDmgMult?: number;
    magicalDmgMult?: number;
    damageTakenMult?: number;
    evadeBonus?: number;
    critBonus?: number;
    lifestealPercent?: number;
    maxHpMult?: number;
  };
  restrictions?: {
    cannotUseSupportCards?: boolean;
    cannotUseSpecialAttacks?: boolean;
    cannotEvade?: boolean;
  };
  payload?: Record<string, unknown>;
}
```

Usos:
- `Titan Serum`
- `Titan Shift`
- `Dragon Force`
- `Stone Mask`
- `Kaioken`
- `Mascara Hollow`
- `tensa zanguetsu`

### 3. Afinidades elementais extras

```ts
export interface ElementAffinityState {
  base: ElementType[];
  granted: ElementType[];
  chosenThisBattle?: ElementType[];
}
```

Usos:
- `Half-Cold Half-Hot`
- `Dragon Lacrima`
- `mera mera`
- `gomu gomu no mi`
- `Dragon Force`

### 4. Overrides elementais

```ts
export interface ElementOverride {
  key: string;
  source: 'player' | 'enemy';
  turnsLeft: number | null;
  when?: {
    attackFrom?: 'player' | 'enemy';
    originalElement?: ElementType;
    targetElement?: ElementType;
  };
  replaceWith?: ElementType;
  effectivenessOverride?: number;
  ignoreResistance?: boolean;
  payload?: Record<string, unknown>;
}
```

Usos:
- `Water Breathing`
- `Hamon Overdrive`
- `Ruler's Authority`
- `Dragon Force`
- `Cruel Sun`

### 5. Marcas

```ts
export type MarkKey =
  | 'chain_jail'
  | 'death_curse'
  | 'spin'
  | 'venom_seed'
  | 'conductive'
  | 'explosive_tag'
  | 'custom';

export interface EnemyMark {
  key: MarkKey;
  name: string;
  stacks: number;
  turnsLeft: number | null;
  sourceCardKey: string;
  payload?: Record<string, unknown>;
}
```

Usos:
- `Chain Jail`
- `Murasame`
- `Steel Balls`
- `Kasaka's Venom Fang`
- `Papel explosivo`

### 6. Regras de execucao

```ts
export interface ExecutionRule {
  key: string;
  source: 'player' | 'enemy';
  thresholdHpFraction?: number;
  requiresMarkKey?: MarkKey;
  excludesBosses?: boolean;
  message: string;
}
```

Usos:
- `Chain Jail`
- `Death Scythe`
- `Murasame`
- `Skull Knight Sword`

### 7. Follow-ups automaticos

```ts
export interface QueuedFollowUp {
  key: string;
  source: 'player' | 'enemy';
  trigger:
    | 'after_attack'
    | 'after_evade'
    | 'on_super_effective'
    | 'on_mark_trigger'
    | 'turn_end';
  expiresAfterTurn: number;
  payload: Record<string, unknown>;
}
```

Usos:
- `Water Breathing`
- `Godspeed`
- `Lostvayne`
- `Killua's Yo-Yos`
- `Ultra Instinct`

### 8. Lacres e proibicoes

```ts
export interface SealedEnemyAction {
  key: string;
  type: 'ability_id' | 'tag' | 'damage_type' | 'buffs';
  value: string;
  turnsLeft: number | null;
}
```

Usos:
- `Erasure`
- `Prison Realm`
- `Chain Jail`
- `Anti-Magic Slash`

### 9. Flags unicas por batalha

```ts
export type OncePerBattleFlag =
  | 'senzu_bean_used'
  | 'return_by_death_used'
  | 'dragon_balls_used'
  | 'stand_arrow_used'
  | 'custom';
```

## BattleContext proposto

```ts
export interface BattleContext {
  // campos atuais mantidos

  battlefieldEffects: BattlefieldEffect[];
  playerForms: PlayerForm[];
  playerElementAffinities: ElementAffinityState;
  elementOverrides: ElementOverride[];
  enemyMarks: EnemyMark[];
  executionRules: ExecutionRule[];
  queuedFollowUps: QueuedFollowUp[];
  sealedEnemyActions: SealedEnemyAction[];
  oncePerBattleFlags: Set<OncePerBattleFlag>;
  turnSnapshots: TurnSnapshot[];
}
```

## Hooks propostos

### Ordem geral de turno

```text
onTurnStart
  -> tickFieldEffects
  -> tickForms
  -> tickMarks
  -> resolveQueuedStartEffects

beforeAction
  -> validar lacres
  -> aplicar overrides

beforeAttack
  -> alterar elemento
  -> alterar efetividade
  -> aplicar bonus de campo/forma

resolveAttack

afterAttack
  -> marcas
  -> follow-ups
  -> counters
  -> execucoes

onTurnEnd
  -> expiracoes
  -> dano de campo
  -> snapshots
```

### Hooks concretos

```ts
onBattleStart(ctx)
onTurnStart(ctx, actor)
beforePlayerAction(ctx, action)
beforeEnemyAction(ctx, action)
beforeDamage(ctx, damageEvent)
afterDamage(ctx, damageEvent)
afterPlayerAttack(ctx, attackEvent)
afterEnemyAttack(ctx, attackEvent)
onSuperEffectiveHit(ctx, attackEvent)
onEvade(ctx, evadeEvent)
onLethalDamage(ctx, target)
onTurnEnd(ctx, actor)
```

## Mudancas recomendadas por arquivo

### `src/lib/battle/BattleEngine.ts`

Adicionar:
- novos campos do `BattleContext`;
- tickers de campo/forma/marca;
- pipeline de follow-up;
- checagem de execucao;
- snapshot por turno;
- ponto central para aplicar overrides elementais.

### `src/lib/battle/typeEffectiveness.ts`

Adicionar:
- suporte opcional a overrides por contexto;
- funcao capaz de receber modificadores de campo e de carta.

### `src/lib/battle/damageCalculator.ts`

Adicionar:
- flags de dano verdadeiro parcial;
- dano inevitavel;
- multiplicadores vindos de campo/forma;
- caminho para dano que ignora resistencia elemental.

### `src/lib/battle/equipmentAbilityRegistry.ts`

Refatorar gradualmente:
- handlers deixam de fazer tudo diretamente;
- passam a registrar `BattlefieldEffect`, `PlayerForm`, `EnemyMark`, etc.;
- dano direto continua possivel, mas nao e mais a linguagem principal.

### Novo arquivo sugerido: `battleState.ts`

Responsavel por tipos e helpers de:
- campos;
- formas;
- marcas;
- lacres;
- execucoes;
- follow-ups.

### Novo arquivo sugerido: `battleHooks.ts`

Responsavel por:
- aplicar efeitos recorrentes;
- resolver hooks;
- reduzir acoplamento dentro do `BattleEngine`.

## Ordem segura de implementacao

### Fase 1 — Infraestrutura inerte

Adicionar tipos e campos no `BattleContext`, todos vazios por padrao.

Objetivo:
- zero mudanca de comportamento;
- preparar o motor sem risco alto.

### Fase 2 — Campo + Forma + Marca

Implementar primeiro:
- `battlefieldEffects`
- `playerForms`
- `enemyMarks`

Por que primeiro:
- cobrem a maior parte das cartas novas;
- sao conceitos reutilizaveis;
- permitem testar cartas como `Cruel Sun`, `Titan Serum`, `Murasame`.

### Fase 3 — Elementos avancados

Implementar:
- afinidades extras;
- override de elemento;
- override de efetividade;
- bonus de campo por elemento.

Cartas desbloqueadas:
- `Half-Cold Half-Hot`
- `Dragon Lacrima`
- `Water Breathing`
- `Cruel Sun`

### Fase 4 — Controle e follow-up

Implementar:
- `queuedFollowUps`
- `sealedEnemyActions`
- pipeline de hook antes/depois de ataque.

Cartas desbloqueadas:
- `Sharingan`
- `Erasure`
- `Full Counter`
- `Godspeed`
- `Lostvayne`

### Fase 5 — Destino e realidade

Implementar:
- snapshots de turno;
- `oncePerBattleFlags`;
- rollback parcial;
- execucao automatica.

Cartas desbloqueadas:
- `Return by Death`
- `Chain Jail`
- `Death Scythe`
- `Requiem`

## Primeiras cartas reais para implementar no motor novo

Sugestao de smoke test funcional:

1. `Cruel Sun` — campo
2. `Titan Serum` — forma
3. `Water Breathing` — override elemental + follow-up
4. `Murasame` — marca + execucao
5. `Erasure` — controle
6. `Full Counter` — hook antes de dano
7. `Return by Death` — destino / snapshot

Se essas 7 funcionarem bem, o motor novo provavelmente esta certo.

## Riscos e como conter

### Risco 1: excesso de complexidade no `BattleEngine`

Mitigacao:
- extrair helpers para `battleState.ts` e `battleHooks.ts`;
- impedir que handlers escrevam logica pesada repetida.

### Risco 2: cartas altas trivializarem bosses

Mitigacao:
- bosses podem ter tags como `execution_resistant`, `time_resistant`, `field_resistant`;
- efeitos ainda funcionam, mas em versao reduzida.

### Risco 3: combinacoes infinitas quebradas

Mitigacao:
- algumas cartas usam `oncePerBattleFlags`;
- campos concorrentes podem substituir ou fundir regras;
- forms devem ter politica clara de sobreposicao.

### Risco 4: texto da carta divergir do codigo

Mitigacao:
- no futuro, gerar UI a partir de uma mesma fonte de verdade para `effect_summary` e config.

## Recomendacao final

A melhor proxima etapa de codigo e:

1. criar `battleState.ts`;
2. adicionar os novos campos inertes ao `BattleContext`;
3. plugar tickers vazios no `BattleEngine`;
4. implementar `Cruel Sun`, `Titan Serum`, `Water Breathing` e `Murasame` como prova de arquitetura.

Isso entrega valor cedo, sem tentar reescrever tudo de uma vez.
