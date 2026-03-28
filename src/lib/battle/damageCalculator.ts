import type { Ability, ElementType } from '@/types/character';
import { getTypeEffectiveness, getEffectivenessLabel } from './typeEffectiveness';

// ─── Combatant stats needed for damage calc ───────────────────────────────────

export interface CombatantStats {
  level:        number;
  forca:        number;       // physical attack
  inteligencia: number;       // special attack
  agilidade:    number;       // affects crit chance & evasion
  defFisica:    number;       // physical defense
  defMagica:    number;       // special defense
  elementType?: ElementType;  // for type effectiveness check
}

// ─── Result ───────────────────────────────────────────────────────────────────

export interface DamageResult {
  damage:             number;
  rawDamage:          number;   // before effectiveness & crit
  isCritical:         boolean;
  isMiss:             boolean;
  isEvaded:           boolean;
  effectiveness:      number;
  effectivenessLabel: string;
}

// ─── Core formula (Pokémon-inspired) ─────────────────────────────────────────
//
//  baseDmg = ((2*level/5 + 2) * power * (Atk/Def)) / 50 + 2
//  apply effectiveness → apply critical → apply random variance

export function calculateDamage(
  attacker: CombatantStats,
  defender: CombatantStats,
  ability:  Ability,
): DamageResult {
  // ── Status moves deal no direct damage ──────────────────────────────────────
  if (ability.damageType === 'Status') {
    return {
      damage: 0, rawDamage: 0,
      isCritical: false, isMiss: false, isEvaded: false,
      effectiveness: 1, effectivenessLabel: '',
    };
  }

  // ── Accuracy check ──────────────────────────────────────────────────────────
  if (Math.random() * 100 > ability.accuracy) {
    return {
      damage: 0, rawDamage: 0,
      isCritical: false, isMiss: true, isEvaded: false,
      effectiveness: 1, effectivenessLabel: 'Errou!',
    };
  }

  // ── Evasion check (agilidade-based, cap 15%) ─────────────────────────────────
  const evadeChance = Math.min(0.15, defender.agilidade / 2000);
  if (Math.random() < evadeChance) {
    return {
      damage: 0, rawDamage: 0,
      isCritical: false, isMiss: false, isEvaded: true,
      effectiveness: 1, effectivenessLabel: 'Desviou!',
    };
  }

  // ── Attack & defense stats ───────────────────────────────────────────────────
  const atkStat = ability.damageType === 'Physical' ? attacker.forca        : attacker.inteligencia;
  const defStat = ability.damageType === 'Physical' ? defender.defFisica    : defender.defMagica;
  const safeDef = Math.max(1, defStat);

  // ── Base damage ──────────────────────────────────────────────────────────────
  const levelMod = (2 * attacker.level / 5) + 2;
  const rawDamage = ((levelMod * ability.baseDamage * (atkStat / safeDef)) / 50) + 2;

  // ── Type effectiveness ───────────────────────────────────────────────────────
  const effectiveness = defender.elementType
    ? getTypeEffectiveness(ability.elementName, defender.elementType)
    : 1.0;

  // Immune → 0 damage
  if (effectiveness === 0) {
    return {
      damage: 0, rawDamage: Math.floor(rawDamage),
      isCritical: false, isMiss: false, isEvaded: false,
      effectiveness: 0, effectivenessLabel: getEffectivenessLabel(0),
    };
  }

  // ── Critical hit (5% base + agilidade/1000, cap 25%) ─────────────────────────
  const critChance = Math.min(0.25, 0.05 + (attacker.agilidade / 1000));
  const isCritical = Math.random() < critChance;

  // ── Apply modifiers ──────────────────────────────────────────────────────────
  let damage = rawDamage * effectiveness;
  if (isCritical) damage *= 1.5;

  // ── Random variance (85–100%) ────────────────────────────────────────────────
  damage *= 0.85 + Math.random() * 0.15;

  return {
    damage:             Math.max(1, Math.floor(damage)),
    rawDamage:          Math.floor(rawDamage),
    isCritical,
    isMiss:             false,
    isEvaded:           false,
    effectiveness,
    effectivenessLabel: getEffectivenessLabel(effectiveness),
  };
}

// ─── Convenience: quick effective-damage estimate (no RNG) ────────────────────

export function estimateDamage(
  attacker: CombatantStats,
  defender: CombatantStats,
  ability:  Ability,
): number {
  if (ability.damageType === 'Status') return 0;
  const atkStat   = ability.damageType === 'Physical' ? attacker.forca : attacker.inteligencia;
  const defStat   = Math.max(1, ability.damageType === 'Physical' ? defender.defFisica : defender.defMagica);
  const levelMod  = (2 * attacker.level / 5) + 2;
  const raw       = ((levelMod * ability.baseDamage * (atkStat / defStat)) / 50) + 2;
  const eff       = defender.elementType ? getTypeEffectiveness(ability.elementName, defender.elementType) : 1;
  return Math.floor(raw * eff * 0.925); // avg variance
}
