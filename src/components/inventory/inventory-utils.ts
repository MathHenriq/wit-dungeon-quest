import type { ItemCategory } from '@/types';
import type { EquipSlotType } from './inventory-types';

// ── Rarity config ─────────────────────────────────────────────────────────────
// Rarity is implied by item category in the real schema (no explicit rarity field).
// We assign a "visual rarity" based on category for styling.

export interface RarityConfig {
  name:           string;
  color:          string;
  border:         string;
  bg:             string;
  sellMultiplier: number;
}

// Map category → rarity styling
export const CATEGORY_RARITY: Record<string, RarityConfig> = {
  armamento: {
    name: 'Armamento',
    color:  'rgba(201,164,74,0.85)',
    border: 'rgba(201,164,74,0.28)',
    bg:     'rgba(201,164,74,0.07)',
    sellMultiplier: 3,
  },
  armadura: {
    name: 'Armadura',
    color:  'rgba(80,140,255,0.80)',
    border: 'rgba(80,140,255,0.25)',
    bg:     'rgba(80,140,255,0.06)',
    sellMultiplier: 3,
  },
  utilizavel: {
    name: 'Utilizavel',
    color:  'rgba(100,220,180,0.80)',
    border: 'rgba(100,220,180,0.22)',
    bg:     'rgba(100,220,180,0.05)',
    sellMultiplier: 1,
  },
  habilidade: {
    name: 'Habilidade',
    color:  'rgba(180,130,255,0.82)',
    border: 'rgba(180,130,255,0.24)',
    bg:     'rgba(180,130,255,0.06)',
    sellMultiplier: 2,
  },
  colecao: {
    name: 'Colecao',
    color:  'rgba(220,160,100,0.80)',
    border: 'rgba(220,160,100,0.22)',
    bg:     'rgba(220,160,100,0.05)',
    sellMultiplier: 0,
  },
  token: {
    name: 'Token',
    color:  'rgba(180,180,180,0.65)',
    border: 'rgba(180,180,180,0.18)',
    bg:     'rgba(180,180,180,0.04)',
    sellMultiplier: 1,
  },
};

const FALLBACK_RARITY: RarityConfig = {
  name: 'Item',
  color:  'rgba(200,200,200,0.65)',
  border: 'rgba(200,200,200,0.15)',
  bg:     'rgba(200,200,200,0.03)',
  sellMultiplier: 1,
};

export function getRarity(category: string): RarityConfig {
  return CATEGORY_RARITY[category] ?? FALLBACK_RARITY;
}

// ── SVG icon fallback paths ───────────────────────────────────────────────────
export const ITEM_ICON_PATHS: Record<string, string> = {
  armamento:  'M5 19L18 6M15 5l4 0 0 4M8.5 11.5l4 4',
  armadura:   'M12 2L4 6v5c0 5 3.6 9.5 8 11 4.4-1.5 8-6 8-11V6l-8-4z',
  utilizavel: 'M11 2h2v5l3 3v7a2 2 0 01-2 2H10a2 2 0 01-2-2v-7l3-3V2z',
  habilidade: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z',
  colecao:    'M12 2l3 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7-1.01z',
  token:      'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3a7 7 0 110 14A7 7 0 0112 5z',
  // Slot-specific fallbacks
  weapon:     'M5 19L18 6M15 5l4 0 0 4',
  armor:      'M12 2L4 6v5c0 5 3.6 9.5 8 11 4.4-1.5 8-6 8-11V6l-8-4z',
  head:       'M12 2C9 2 6.5 4 5.5 7L4 12v2h2l1 5h10l1-5h2v-2l-1.5-5C17.5 4 15 2 12 2z',
  offhand:    'M12 2L4 6v6c0 5.1 3.5 9.8 8 11 4.5-1.2 8-5.9 8-11V6L12 2z',
  accessory:  'M12 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM7 10c0 4 2.3 7 5 8 2.7-1 5-4 5-8',
  ring:       'M12 5a7 7 0 100 14A7 7 0 0012 5zm0 3a4 4 0 110 8 4 4 0 010-8z',
};

export function getIconPath(category: string): string {
  return ITEM_ICON_PATHS[category] ?? ITEM_ICON_PATHS.colecao;
}

// ── Slot config ───────────────────────────────────────────────────────────────
export const SLOT_CONFIG: Record<EquipSlotType, { label: string; fallbackIcon: string }> = {
  weapon:    { label: 'Arma',      fallbackIcon: 'weapon'    },
  offhand:   { label: 'Secundaria', fallbackIcon: 'offhand'  },
  armor:     { label: 'Armadura',  fallbackIcon: 'armor'     },
  head:      { label: 'Capacete',  fallbackIcon: 'head'      },
  accessory: { label: 'Acessorio', fallbackIcon: 'accessory' },
  ring:      { label: 'Anel',      fallbackIcon: 'ring'      },
};

// ── Attribute stat formatter ───────────────────────────────────────────────────
const ATTR_LABELS: Record<string, string> = {
  attr_forca:        'FOR',
  attr_destreza:     'DES',
  attr_inteligencia: 'INT',
  attr_carisma:      'CAR',
  attr_agilidade:    'AGI',
  attr_resistencia:  'RES',
};

export function formatAttrs(item: Record<string, unknown>): string {
  return Object.entries(ATTR_LABELS)
    .filter(([key]) => (item[key] as number) > 0)
    .map(([key, label]) => `${label} +${item[key]}`)
    .join('  ');
}

export function getSellPrice(cost: number): number {
  return Math.max(1, Math.round(cost * 0.4));
}
