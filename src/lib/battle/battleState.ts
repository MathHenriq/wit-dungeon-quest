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

export type MarkKey = 'murasame_death_curse' | 'custom';

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
