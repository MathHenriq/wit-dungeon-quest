// Wave 11 C.4 — bridge between the legacy `abilities` table and the new
// SKILLS_REGISTRY (which has per-class variants for each element/tier).
//
// The combat engine still consumes Ability objects from the legacy table
// (with element + tier + base_damage + accuracy + etc). This helper finds
// the matching SKILLS_REGISTRY entry by (element, tier, slot=1) and pulls
// the variant for the student's class — that gives us class-specific
// names, descriptions, primary scaling attribute and damage type without
// rewriting the abilities table.
//
// Anatomy:
//   ability.elementName='fire', ability.tier=1  +  class='samurai'
//     → SKILLS_REGISTRY find element=fire, tier=1, slot=1
//     → variant['samurai'] = { name:"Corte Flamejante", primaryAttribute:"forca", damageType:"physical", ... }
//
// Returns null if no registry entry exists for the (element, tier) combo
// or the class isn't represented — callers should fall back to the
// ability's own legacy fields in that case.

import type { Ability, ElementType, AttributeType } from '@/types/character';
import { SKILLS_REGISTRY, type ClassType, type DamageType as RegistryDamageType } from './skillsRegistry';

// Legacy abilities use IDs like `fire_01`..`fire_13`; the registry uses
// `fire_slot1`..`fire_slot13`. The trailing number is the slot, so we can
// pair them directly. Tiers diverge at the top end (legacy tops at 4, the
// registry at 5) so we deliberately ignore tier in the match.
function slotFromAbilityId(id: string | undefined | null): number | null {
  if (!id) return null;
  const m = /_0*(\d+)$/.exec(id);
  return m ? Number(m[1]) : null;
}

export interface ResolvedAbilityVariant {
  /** Class-specific display name (e.g. "Corte Flamejante" for samurai). */
  name: string;
  /** Class-specific localized description. */
  description: string;
  /** Which attribute scales this ability for this class. */
  primaryAttribute: AttributeType;
  /** Registry-side damage type (lowercase: 'physical' | 'magical' | 'true').
      Note: BattleEngine uses the capitalised legacy form via Ability.damageType,
      so this is informational only — we don't push it back into Ability. */
  damageType: RegistryDamageType;
  /** Sprite/animation key reserved for future combat FX. */
  visualKey: string;
}

/**
 * Resolve the class variant for a given legacy ability.
 *
 * Strategy: match by `element + tier`, prefer `slot=1` (the basic skill in
 * that element/tier branch). If multiple slots exist we still pick slot 1
 * because the legacy abilities table only carries one row per
 * (element, tier) combination — there's no slot distinction.
 */
export function resolveAbilityVariant(
  ability: Pick<Ability, 'id' | 'elementName' | 'tier'>,
  classType: ClassType | null | undefined,
): ResolvedAbilityVariant | null {
  if (!classType) return null;

  // The legacy `abilities` table joins `elements.name` which is capitalised
  // ("Dark", "Fire"…) while SKILLS_REGISTRY uses the lowercase Wave-11 form
  // ('dark', 'fire'…). Normalise before comparing or the lookup silently
  // returns null and we fall back to the legacy ability name.
  const element = String(ability.elementName ?? '').toLowerCase() as ElementType;
  const slot = slotFromAbilityId(ability.id);
  if (slot == null) return null;

  const skill = SKILLS_REGISTRY.find(
    s => s.element === element && s.slot === slot,
  );
  if (!skill) return null;

  const variant = skill.variants[classType];
  if (!variant) return null;

  return {
    name:             variant.name,
    description:      variant.description,
    primaryAttribute: variant.primaryAttribute,
    damageType:       variant.damageType,
    visualKey:        variant.visualKey,
  };
}

/**
 * Apply the variant (if any) to an Ability object, returning a new Ability
 * with class-specific name + description. Damage type and other mechanics
 * stay from the legacy ability — BattleEngine expects the legacy capitalised
 * DamageType ('Physical' | 'Special' | 'Status'), and the registry uses the
 * lowercase Wave-11 form ('physical' | 'magical' | 'true'). Keeping them
 * separated avoids any combat regression while still giving each class
 * unique skill names like the user expected.
 *
 * If no variant exists, returns the ability untouched.
 */
export function applyClassVariant(
  ability: Ability,
  classType: ClassType | null | undefined,
): Ability {
  const variant = resolveAbilityVariant(ability, classType);
  if (!variant) return ability;
  return {
    ...ability,
    name:        variant.name,
    description: variant.description,
  };
}
