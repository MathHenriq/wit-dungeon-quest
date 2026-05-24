import type { ElementType } from '@/types/character';

// ─── Effectiveness matrix ─────────────────────────────────────────────────────
// [attacker][defender] = multiplier
// 0   = immune
// 0.5 = not very effective
// 1.0 = normal (default, not listed)
// 2.0 = super effective

const EFFECTIVENESS: Record<ElementType, Partial<Record<ElementType, number>>> = {
  Fire: {
    Fire:  0.5,
    Water: 0.5,
    Grass: 2.0,
    Ice:   2.0,
    Steel: 2.0,
  },
  Water: {
    Fire:  2.0,
    Water: 0.5,
    Grass: 0.5,
    Ground: 2.0,
  },
  Electric: {
    Water:    2.0,
    Electric: 0.5,
    Grass:    0.5,
    Ground:   0,    // immune
    Flying:   2.0,
  },
  Grass: {
    Water:    2.0,
    Fire:     0.5,
    Grass:    0.5,
    Poison:   0.5,
    Ground:   2.0,
    Flying:   0.5,
    Steel:    0.5,
  },
  Ice: {
    Fire:   0.5,
    Water:  0.5,
    Grass:  2.0,
    Ice:    0.5,
    Ground: 2.0,
    Flying: 2.0,
    Steel:  0.5,
  },
  Ground: {
    Fire:     2.0,
    Electric: 2.0,
    Grass:    0.5,
    Poison:   2.0,
    Flying:   0,    // immune
    Steel:    2.0,
  },
  Fighting: {
    Dark:    2.0,
    Ice:     2.0,
    Steel:   2.0,
    Poison:  0.5,
    Flying:  0.5,
    Ghost:   0,     // immune
  },
  Steel: {
    Fire:  0.5,
    Water: 0.5,
    Ice:   2.0,
    Steel: 0.5,
  },
  Poison: {
    Grass:  2.0,
    Poison: 0.5,
    Ground: 0.5,
    Ghost:  0.5,
    Steel:  0,      // immune
  },
  Dark: {
    Fighting: 0.5,
    Dark:     0.5,
    Ghost:    2.0,
  },
  Ghost: {
    Ghost:    2.0,
    Dark:     2.0,
    Fighting: 0,    // immune (Fighting can't hit Ghost)
  },
  Flying: {
    Electric: 0.5,
    Grass:    2.0,
    Fighting: 2.0,
    Steel:    0.5,
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getTypeEffectiveness(
  attackType: ElementType,
  defenderType: ElementType,
): number {
  return EFFECTIVENESS[attackType]?.[defenderType] ?? 1.0;
}

/**
 * Patch 2.0 — Effectiveness vs a (possibly) dual-element defender.
 * Multiplies the two effectiveness values, Pokémon-style:
 *   - Fire vs Grass+Steel → 2 × 2 = 4×
 *   - Electric vs Ground+Flying → 0 × 2 = 0 (immunity wins)
 *   - Water vs Fire+Water → 2 × 0.5 = 1×
 */
export function getDualTypeEffectiveness(
  attackType: ElementType,
  defenderType: ElementType,
  defenderTypeSecondary?: ElementType | null,
): number {
  const primary = getTypeEffectiveness(attackType, defenderType);
  if (!defenderTypeSecondary || defenderTypeSecondary === defenderType) {
    return primary;
  }
  return primary * getTypeEffectiveness(attackType, defenderTypeSecondary);
}

export type EffectivenessLevel = 'immune' | 'not_very' | 'normal' | 'super';

export function getEffectivenessLevel(multiplier: number): EffectivenessLevel {
  if (multiplier === 0)   return 'immune';
  if (multiplier <  1.0)  return 'not_very';
  if (multiplier >  1.0)  return 'super';
  return 'normal';
}

export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier === 0)   return 'Não afeta...';
  if (multiplier <  1.0)  return 'Não muito efetivo...';
  if (multiplier >  1.0)  return 'SUPER EFETIVO!';
  return '';
}

/** Pre-compute all matchups for a given attacker — useful for AI hints */
export function getAttackerMatchups(attackType: ElementType): Record<ElementType, number> {
  const all: ElementType[] = [
    'Fire','Water','Electric','Grass','Ice','Ground',
    'Fighting','Steel','Poison','Dark','Ghost','Flying',
  ];
  return Object.fromEntries(
    all.map(def => [def, getTypeEffectiveness(attackType, def)]),
  ) as Record<ElementType, number>;
}
