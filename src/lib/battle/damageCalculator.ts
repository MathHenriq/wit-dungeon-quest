import type { Ability, ElementType } from '@/types/character';
import { getTypeEffectiveness, getDualTypeEffectiveness, getEffectivenessLabel } from './typeEffectiveness';
import type { AttributeModifiers } from './attributeModifiers';
import { identityModifiers } from './attributeModifiers';

// ─── Combatant stats needed for damage calc ───────────────────────────────────

export interface CombatantStats {
  level:        number;
  forca:        number;       // physical attack
  inteligencia: number;       // special attack
  agilidade:    number;       // affects crit chance & evasion
  defFisica:    number;       // physical defense
  defMagica:    number;       // special defense
  elementType?: ElementType;  // for type effectiveness check
  /** Patch 2.0: second element for dual-type defender (bosses 26+). */
  elementTypeSecondary?: ElementType | null;
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
//  apply: class attribute mult × affinity × effectiveness × passive damage mult

/**
 * Optional bundles of attribute-derived modifiers for attacker and defender.
 * Both default to identity (no effect) so legacy callers compile and behave
 * exactly as before. New callers (BattleEngine after Patch 2.1) provide them
 * to scale damage / crit / evade / mitigation.
 *
 * Wave 11.3 added passive-derived knobs (affinityMult, extraCritChance, ...).
 * All default to inert values when omitted — legacy behaviour preserved.
 */
export interface DamageModifiers {
  attackerMods?: AttributeModifiers;
  defenderMods?: AttributeModifiers;

  // ── Onda 11.3 — afinidade de classe e passivas ────────────────────────────
  /** Multiplicador de afinidade de classe (1.00 / 1.05 / 1.10). Default 1. */
  affinityMult?: number;
  /** Multiplicador agregado das passivas do atacante para esta skill. Default 1. */
  passiveDmgMult?: number;
  /** Bônus aditivo de chance de crítico vindo de passivas (e.g. 0.10 = +10pp). */
  passiveExtraCritChance?: number;
  /** Substitui o multiplicador de crítico padrão (1.5) se > 0. */
  passiveCritMultiplier?: number;
  /** Bônus aditivo de chance de esquiva do defensor vindo de passivas. */
  passiveExtraEvadeChance?: number;
  /** % da defesa do alvo que é ignorada (0..1). Aplicado antes de Atk/Def. */
  defenseIgnore?: number;
  /** Se true, anula o accuracy check (skill nunca erra). */
  noMiss?: boolean;
  /** Multiplicador adicional no dano recebido pelo defensor (passive damage_taken_mult). Default 1. */
  defenderDamageTakenExtra?: number;
}

export function calculateDamage(
  attacker: CombatantStats,
  defender: CombatantStats,
  ability:  Ability,
  mods: DamageModifiers = {},
): DamageResult {
  const aMods = mods.attackerMods ?? identityModifiers();
  const dMods = mods.defenderMods ?? identityModifiers();
  const affinityMult        = mods.affinityMult ?? 1;
  const passiveDmgMult      = mods.passiveDmgMult ?? 1;
  const extraCritChance     = mods.passiveExtraCritChance ?? 0;
  const passiveCritMult     = mods.passiveCritMultiplier && mods.passiveCritMultiplier > 0 ? mods.passiveCritMultiplier : 1.5;
  const extraEvadeChance    = mods.passiveExtraEvadeChance ?? 0;
  const defenseIgnore       = Math.min(0.95, Math.max(0, mods.defenseIgnore ?? 0));
  const noMiss              = !!mods.noMiss;
  const defenderTakenExtra  = mods.defenderDamageTakenExtra ?? 1;

  // ── Status moves deal no direct damage ──────────────────────────────────────
  if (ability.damageType === 'Status') {
    return {
      damage: 0, rawDamage: 0,
      isCritical: false, isMiss: false, isEvaded: false,
      effectiveness: 1, effectivenessLabel: '',
    };
  }

  // ── Accuracy check ──────────────────────────────────────────────────────────
  // Passive `noMiss` curto-circuita esse check (sangue frio).
  if (!noMiss && Math.random() * 100 > ability.accuracy) {
    return {
      damage: 0, rawDamage: 0,
      isCritical: false, isMiss: true, isEvaded: false,
      effectiveness: 1, effectivenessLabel: 'Errou!',
    };
  }

  // ── Evasion check ───────────────────────────────────────────────────────────
  // Legacy formula kept as a floor (agilidade/2000 capped 15%) plus the new
  // attribute-derived evadeBonus (Agilidade points × 1%, capped 35% by helper).
  // Onda 11.3 adiciona extraEvadeChance vindo das passivas do defensor.
  const legacyEvade = Math.min(0.15, defender.agilidade / 2000);
  const evadeChance = Math.min(0.75, legacyEvade + dMods.evadeBonus + extraEvadeChance);
  if (Math.random() < evadeChance) {
    return {
      damage: 0, rawDamage: 0,
      isCritical: false, isMiss: false, isEvaded: true,
      effectiveness: 1, effectivenessLabel: 'Desviou!',
    };
  }

  // ── Attack & defense stats ───────────────────────────────────────────────────
  const atkStat = ability.damageType === 'Physical' ? attacker.forca        : attacker.inteligencia;
  const defRaw  = ability.damageType === 'Physical' ? defender.defFisica    : defender.defMagica;
  // Onda 11.3: defenseIgnore (passiva quebra_defesa) reduz a defesa efetiva.
  const defStat = defRaw * (1 - defenseIgnore);
  const safeDef = Math.max(1, defStat);

  // ── Base damage ──────────────────────────────────────────────────────────────
  const levelMod = (2 * attacker.level / 5) + 2;
  const rawDamage = ((levelMod * ability.baseDamage * (atkStat / safeDef)) / 50) + 2;

  // ── Type effectiveness ───────────────────────────────────────────────────────
  const effectiveness = defender.elementType
    ? getDualTypeEffectiveness(ability.elementName, defender.elementType, defender.elementTypeSecondary)
    : 1.0;

  // Immune → 0 damage
  if (effectiveness === 0) {
    return {
      damage: 0, rawDamage: Math.floor(rawDamage),
      isCritical: false, isMiss: false, isEvaded: false,
      effectiveness: 0, effectivenessLabel: getEffectivenessLabel(0),
    };
  }

  // ── Critical hit ────────────────────────────────────────────────────────────
  // Base 5% + legacy agilidade/1000 (cap 25%) + Destreza-derived critBonus
  // + passive crit chance. Total capped em 80% (passivas podem empurrar).
  const legacyCrit = Math.min(0.25, 0.05 + (attacker.agilidade / 1000));
  const critChance = Math.min(0.80, legacyCrit + aMods.critBonus + extraCritChance);
  const isCritical = Math.random() < critChance;

  // ── Cascata de multiplicadores ───────────────────────────────────────────────
  // Ordem (Onda 11.3 — documentação do prompt):
  //   base × class_attribute_mult × affinity × effectiveness × passive_damage_mult
  let damage = rawDamage * effectiveness * affinityMult * passiveDmgMult;
  if (isCritical) damage *= passiveCritMult;

  // Attribute damage scaling (Patch 2.1): physical/magical multipliers from atributos
  damage *= ability.damageType === 'Physical' ? aMods.physicalDmgMult : aMods.magicalDmgMult;

  // Defender's resistance reduces incoming damage (Resistência → damageTakenMult).
  // Multiplica também o `defenderDamageTakenExtra` (passiva couro_duro vem aqui).
  damage *= dMods.damageTakenMult * defenderTakenExtra;

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
  const eff       = defender.elementType ? getDualTypeEffectiveness(ability.elementName, defender.elementType, defender.elementTypeSecondary) : 1;
  return Math.floor(raw * eff * 0.925); // avg variance
}
