// ─── Battle System Types ──────────────────────────────────────────────────────

export type ElementType =
  | 'Fire' | 'Water' | 'Electric' | 'Grass' | 'Ice' | 'Ground'
  | 'Fighting' | 'Steel' | 'Poison' | 'Dark' | 'Ghost' | 'Flying';

export type DamageType = 'Physical' | 'Special' | 'Status';

export const ELEMENT_META: Record<ElementType, { icon: string; color: string; gradient: string; ptKey: keyof BattleCharacter }> = {
  Fire:     { icon: '🔥', color: '#d94e3f', gradient: 'from-orange-600 to-red-600',     ptKey: 'ptsFire'     },
  Water:    { icon: '💧', color: '#4a90e2', gradient: 'from-blue-500 to-cyan-500',       ptKey: 'ptsWater'    },
  Electric: { icon: '⚡', color: '#f8d030', gradient: 'from-yellow-400 to-yellow-600',   ptKey: 'ptsElectric' },
  Grass:    { icon: '🌿', color: '#78c850', gradient: 'from-green-500 to-emerald-600',   ptKey: 'ptsGrass'    },
  Ice:      { icon: '❄️', color: '#98d8d8', gradient: 'from-cyan-300 to-blue-400',       ptKey: 'ptsIce'      },
  Ground:   { icon: '🪨', color: '#e0c068', gradient: 'from-amber-600 to-yellow-700',    ptKey: 'ptsGround'   },
  Fighting: { icon: '👊', color: '#c03028', gradient: 'from-red-700 to-rose-800',        ptKey: 'ptsFighting' },
  Steel:    { icon: '⚙️', color: '#b8b8d0', gradient: 'from-gray-400 to-slate-600',      ptKey: 'ptsSteel'    },
  Poison:   { icon: '☠️', color: '#a040a0', gradient: 'from-purple-600 to-violet-700',   ptKey: 'ptsPoison'   },
  Dark:     { icon: '🌙', color: '#705848', gradient: 'from-gray-800 to-stone-900',      ptKey: 'ptsDark'     },
  Ghost:    { icon: '👻', color: '#705898', gradient: 'from-purple-700 to-indigo-800',   ptKey: 'ptsGhost'    },
  Flying:   { icon: '🌪️', color: '#a890f0', gradient: 'from-sky-400 to-indigo-500',      ptKey: 'ptsFlying'   },
};

export const TIER_LABELS: Record<number, string> = {
  1: 'Iniciante',
  2: 'Intermediário',
  3: 'Avançado',
  4: 'Lendário',
};

// ─── Ability ──────────────────────────────────────────────────────────────────

export interface Ability {
  id: string;
  name: string;
  elementId: number;
  elementName: ElementType;
  tier: 1 | 2 | 3 | 4;
  damageType: DamageType;
  baseDamage: number;
  energyCost: number;
  accuracy: number;
  requirement: number;
  effectType?: string | null;
  effectChance?: number | null;
  effectValue?: number | null;
  description: string;
  // joined from elements table
  elementColor?: string;
  elementIcon?: string;
}

// ─── Character (battle) ───────────────────────────────────────────────────────

export interface BattleCharacter {
  id: string;
  userId: string;
  name: string;
  class: string;
  level: number;
  xp: number;
  hpCurrent: number;
  hpMax: number;
  energyMax: number;

  // Atributos base
  forca: number;
  inteligencia: number;
  destreza: number;
  carisma: number;
  agilidade: number;
  resistencia: number;

  // Pontos elementais
  ptsFire: number;
  ptsWater: number;
  ptsElectric: number;
  ptsGrass: number;
  ptsIce: number;
  ptsGround: number;
  ptsFighting: number;
  ptsSteel: number;
  ptsPoison: number;
  ptsDark: number;
  ptsGhost: number;
  ptsFlying: number;

  freePoints: number;

  spriteNormal?: string | null;
  spritePixelFront?: string | null;
  spritePixelBack?: string | null;
  spritePixelAttack?: string | null;
}

// ─── Equipped Abilities ───────────────────────────────────────────────────────

export interface EquippedAbility {
  characterId: string;
  abilityId: string;
  slot: 1 | 2 | 3 | 4;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns how many points the character has in a given element */
export function getElementPoints(character: BattleCharacter, element: ElementType): number {
  const key = ELEMENT_META[element].ptKey;
  return (character[key] as number) ?? 0;
}

/** Returns true if the character meets the requirement for an ability */
export function canUseAbility(character: BattleCharacter, ability: Ability): boolean {
  return getElementPoints(character, ability.elementName) >= ability.requirement;
}
