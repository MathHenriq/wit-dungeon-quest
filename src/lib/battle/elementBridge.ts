// ============================================================
// Wave 11.3 — bridge between the legacy battle types (Capitalized
// 'Fire', 'Physical', etc.) and the new skills/evolutions registry
// (lowercase 'fire', 'physical', etc.).
//
// No data is owned here — only conversions. Both namespaces remain
// the source of truth in their respective modules so the BattleEngine
// keeps compiling and runs unchanged when this layer is absent.
// ============================================================

import type { ElementType as LegacyElement, DamageType as LegacyDamageType } from '@/types/character';
import type {
  ElementType as RegistryElement,
  ClassType,
  DamageType as RegistryDamageType,
} from '@/lib/skills/skillsRegistry';
import {
  CLASS_ELEMENT_AFFINITY,
  AFFINITY_BONUS_PRIMARY,
  AFFINITY_BONUS_SECONDARY,
} from '@/lib/skills/skillsRegistry';

// ─── Element name ↔ name ─────────────────────────────────────────────────────

const LEGACY_TO_REGISTRY: Record<LegacyElement, RegistryElement> = {
  Fire: 'fire', Water: 'water', Electric: 'electric', Grass: 'grass',
  Ice: 'ice', Ground: 'ground', Fighting: 'fighting', Steel: 'steel',
  Poison: 'poison', Dark: 'dark', Ghost: 'ghost', Flying: 'flying',
};

const REGISTRY_TO_LEGACY: Record<RegistryElement, LegacyElement> = {
  fire: 'Fire', water: 'Water', electric: 'Electric', grass: 'Grass',
  ice: 'Ice', ground: 'Ground', fighting: 'Fighting', steel: 'Steel',
  poison: 'Poison', dark: 'Dark', ghost: 'Ghost', flying: 'Flying',
};

export function toRegistryElement(e: LegacyElement | null | undefined): RegistryElement | null {
  return e ? LEGACY_TO_REGISTRY[e] ?? null : null;
}

export function toLegacyElement(e: RegistryElement | string | null | undefined): LegacyElement | null {
  if (!e) return null;
  return REGISTRY_TO_LEGACY[e as RegistryElement] ?? null;
}

// ─── Damage type ↔ damage type ──────────────────────────────────────────────

export function toRegistryDamageType(dt: LegacyDamageType): RegistryDamageType | null {
  if (dt === 'Physical') return 'physical';
  if (dt === 'Special')  return 'magical';
  return null; // 'Status' has no registry equivalent
}

// ─── Class affinity ─────────────────────────────────────────────────────────

/**
 * Multiplier applied to a skill's damage based on the player's class affinity
 * with the skill's element.
 *
 *   primary element     → 1 + AFFINITY_BONUS_PRIMARY   (e.g. 1.10)
 *   secondary affinity  → 1 + AFFINITY_BONUS_SECONDARY (e.g. 1.05)
 *   no affinity         → 1.0
 *
 * Returns 1.0 when class is unknown / null so the legacy behaviour is preserved.
 */
export function getAffinityMultiplier(
  classType: ClassType | null | undefined,
  skillElement: LegacyElement | null | undefined,
): number {
  if (!classType || !skillElement) return 1;
  const reg = toRegistryElement(skillElement);
  if (!reg) return 1;
  const info = CLASS_ELEMENT_AFFINITY[classType];
  if (!info) return 1;
  if (info.primary === reg) return 1 + AFFINITY_BONUS_PRIMARY;
  if (info.affinities.includes(reg)) return 1 + AFFINITY_BONUS_SECONDARY;
  return 1;
}
