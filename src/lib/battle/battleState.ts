import type { ElementType } from '@/types/character';

export type BattlefieldEffectKey = 'sun' | 'custom';

export interface BattlefieldEffect {
  key: BattlefieldEffectKey;
  source: 'player' | 'enemy';
  name: string;
  turnsLeft: number | null;
  outgoingElementMult?: Partial<Record<ElementType, number>>;
  incomingElementMult?: Partial<Record<ElementType, number>>;
  endTurnDamage?: {
    target: 'player' | 'enemy';
    base: number;
    growthPerTurn?: number;
    currentTurn?: number;
  };
}

export type PlayerFormKey = 'titan' | 'custom';

export interface PlayerForm {
  key: PlayerFormKey;
  name: string;
  turnsLeft: number | null;
  overrideAttackElement?: ElementType;
  physicalDmgMult?: number;
  magicalDmgMult?: number;
  damageTakenMult?: number;
  maxHpMult?: number;
  cannotEvade?: boolean;
  payload?: Record<string, unknown>;
}

export interface ElementOverride {
  key: string;
  replaceWith: ElementType;
  charges: number;
  sourceCardKey?: string;
  onlyDamageType?: 'Physical' | 'Special' | 'Status';
}

/**
 * Marcas que uma carta pode colar no inimigo.
 *
 * O tipo listava só `murasame_death_curse`, mas o registry empilha e consulta
 * outras duas. Em runtime funcionava — são comparações de string — só que o
 * TypeScript marcava `m.key === 'vinland_iron_stack'` como comparação sem
 * sobreposição, ou seja, não conseguia verificar nada. Com a união completa um
 * erro de digitação em chave de marca volta a ser pego na compilação.
 *
 * Ao criar uma carta com marca nova, acrescente a chave aqui.
 */
export type MarkKey =
  | 'murasame_death_curse'   // Murasame: 5 cargas destravam execução abaixo de 40% HP
  | 'reaper_mark'            // Foice da Morte: alvo da reaper_aura
  | 'vinland_iron_stack'     // Punho de Ferro: +20 de dano por carga, até 5
  | 'custom';

export interface EnemyMark {
  key: MarkKey;
  name: string;
  stacks: number;
  turnsLeft: number | null;
  sourceCardKey: string;
}

export interface ExecutionRule {
  key: string;
  thresholdHpFraction: number;
  requiresMarkKey?: MarkKey;
  minStacks?: number;
  excludesBosses?: boolean;
  message: string;
}

export interface QueuedFollowUp {
  key: string;
  trigger: 'on_super_effective';
  sourceCardKey: string;
  damageMultiplier: number;
  expiresAfterTurn: number;
}
