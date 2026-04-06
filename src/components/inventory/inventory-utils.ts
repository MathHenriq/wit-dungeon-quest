import type { ItemRarity, EquipSlotType, ItemStats } from './inventory-types';

// ── Rarity config ─────────────────────────────────────────────────────────────

interface RarityConfig {
  name:            string;
  color:           string;   // rgba for text/stroke
  border:          string;   // rgba for borders
  bg:              string;   // rgba for backgrounds
  sellMultiplier:  number;
}

export const RARITY_CONFIG: Record<ItemRarity, RarityConfig> = {
  common: {
    name: 'Comum',
    color:  'rgba(180,180,180,0.60)',
    border: 'rgba(180,180,180,0.18)',
    bg:     'rgba(180,180,180,0.05)',
    sellMultiplier: 1,
  },
  uncommon: {
    name: 'Incomum',
    color:  'rgba(100,220,180,0.65)',
    border: 'rgba(100,220,180,0.20)',
    bg:     'rgba(100,220,180,0.05)',
    sellMultiplier: 2,
  },
  rare: {
    name: 'Raro',
    color:  'rgba(80,140,255,0.70)',
    border: 'rgba(80,140,255,0.22)',
    bg:     'rgba(80,140,255,0.05)',
    sellMultiplier: 5,
  },
  epic: {
    name: 'Epico',
    color:  'rgba(180,130,255,0.70)',
    border: 'rgba(180,130,255,0.22)',
    bg:     'rgba(180,130,255,0.05)',
    sellMultiplier: 12,
  },
  legendary: {
    name: 'Lendario',
    color:  'rgba(201,164,74,0.80)',
    border: 'rgba(201,164,74,0.25)',
    bg:     'rgba(201,164,74,0.06)',
    sellMultiplier: 25,
  },
};

export function getRarity(rarity: ItemRarity): RarityConfig {
  return RARITY_CONFIG[rarity] ?? RARITY_CONFIG.common;
}

export function getSellPrice(baseSellPrice: number, rarity: ItemRarity): number {
  return Math.max(1, Math.round(baseSellPrice * RARITY_CONFIG[rarity].sellMultiplier));
}

// ── SVG icon paths ────────────────────────────────────────────────────────────

export const ITEM_ICON_PATHS: Record<string, string> = {
  sword:      'M5 19L18 6M15 5l4 0 0 4M8.5 11.5l4 4',
  shield:     'M12 2L4 6v6c0 5.1 3.5 9.8 8 11 4.5-1.2 8-5.9 8-11V6L12 2z',
  chestplate: 'M12 2L4 6v5c0 5 3.6 9.5 8 11 4.4-1.5 8-6 8-11V6l-8-4z',
  helmet:     'M12 2C9 2 6.5 4 5.5 7L4 12v2h2l1 5h10l1-5h2v-2l-1.5-5C17.5 4 15 2 12 2z',
  necklace:   'M12 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM7 10c0 4 2.3 7 5 8 2.7-1 5-4 5-8',
  ring:       'M12 5a7 7 0 100 14A7 7 0 0012 5zm0 3a4 4 0 110 8 4 4 0 010-8z',
  cloak:      'M12 2C8 2 5 4 4 7v13l4-3 4 3 4-3 4 3V7c-1-3-4-5-8-5z',
  staff:      'M12 2v16M8 5h8M10 17h4v3h-4z',
  bow:        'M5 12C5 7.5 8 4 12 4s7 3.5 7 8M12 4v16M7 9l5 3 5-3',
  potion:     'M11 2h2v5l3 3v7a2 2 0 01-2 2H10a2 2 0 01-2-2v-7l3-3V2z',
  scroll:     'M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6H8zM13 3v6h6M9 13h6M9 17h4',
  crown:      'M4 17l2-8 3.5 4L12 4l2.5 9L18 9l2 8H4z',
  frame:      'M4 4h16v16H4V4zm2 2v12h12V6H6z',
};

export function getIconPath(iconType: string): string {
  return ITEM_ICON_PATHS[iconType] ?? ITEM_ICON_PATHS.shield;
}

// ── Slot config ───────────────────────────────────────────────────────────────

export const SLOT_CONFIG: Record<EquipSlotType, { label: string; icon: string }> = {
  head:      { label: 'Capacete',  icon: 'helmet'     },
  armor:     { label: 'Armadura',  icon: 'chestplate' },
  accessory: { label: 'Acessorio', icon: 'necklace'   },
  weapon:    { label: 'Arma',      icon: 'sword'      },
  offhand:   { label: 'Escudo',    icon: 'shield'     },
  ring:      { label: 'Anel',      icon: 'ring'       },
};

// ── Stats formatter ───────────────────────────────────────────────────────────

const STAT_LABELS: Record<string, string> = {
  atk: 'ATK', def: 'DEF', hp: 'HP', mp: 'MP',
  crit: 'CRIT', speed: 'VEL', int: 'INT', block: 'BLOQ',
};

export function formatStats(stats?: ItemStats): string {
  if (!stats) return '';
  return Object.entries(stats)
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => `${STAT_LABELS[k] ?? k} +${v}`)
    .join('  ');
}
