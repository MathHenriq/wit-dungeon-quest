export { BattleEngine }                                   from './BattleEngine';
export type {
  BattleContext, BattlePhase, BattleEnemy, BattleLogEntry, ItemEffect,
  ActiveBuffInput, ConsumableInput, BuffEffectKey, ConsumableEffectKey,
} from './BattleEngine';

export { getTypeEffectiveness, getEffectivenessLabel, getEffectivenessLevel, getAttackerMatchups } from './typeEffectiveness';

export { calculateDamage, estimateDamage }                from './damageCalculator';
export type { CombatantStats, DamageResult }              from './damageCalculator';

export {
  tickStatus, canAct, defaultDuration,
  getAccuracyModifier, getAttackModifier, getDefenseModifier,
  STAT_MODIFIERS,
} from './statusEffects';
export type { StatusEffect, ActiveStatus, StatusTickResult } from './statusEffects';
