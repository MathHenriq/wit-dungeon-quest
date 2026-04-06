// ── Inventory domain types & mock data ──────────────────────────────────────

export type ItemCategory  = 'equipment' | 'consumable' | 'cosmetic';
export type ItemRarity    = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EquipSlotType = 'head' | 'armor' | 'accessory' | 'weapon' | 'offhand' | 'ring';
export type EquipSubtype  = 'sword' | 'dagger' | 'staff' | 'bow' | 'shield' | 'helmet' | 'chestplate' | 'ring' | 'necklace' | 'cloak';
export type ConsumableType = 'heal' | 'mana' | 'buff_xp' | 'buff_atk' | 'buff_def';
export type CosmeticType   = 'title' | 'frame' | 'skin';
export type EquipmentFilter = 'all' | 'weapons' | 'armor' | 'accessories';

export interface ItemStats {
  atk?:   number;
  def?:   number;
  hp?:    number;
  mp?:    number;
  crit?:  number;
  speed?: number;
  int?:   number;
  block?: number;
}

export interface Item {
  id:          string;
  name:        string;
  description: string;
  category:    ItemCategory;
  rarity:      ItemRarity;
  icon_type:   string;

  // Equipment
  slot_type?:  EquipSlotType;
  subtype?:    EquipSubtype;
  stats?:      ItemStats;
  element?:    string;

  // Consumable
  consumable_type?: ConsumableType;
  effect_value?:    number;
  duration?:        number;
  quantity?:        number;

  // Cosmetic
  cosmetic_type?:  CosmeticType;
  cosmetic_value?: string;

  // Economy
  base_sell_price: number;
  tradeable:       boolean;
}

export interface EquippedItems {
  head?:      Item;
  armor?:     Item;
  accessory?: Item;
  weapon?:    Item;
  offhand?:   Item;
  ring?:      Item;
}

export interface PlayerInventory {
  items:    Item[];
  equipped: EquippedItems;
  coins:    number;
  diamonds: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

export const MOCK_ITEMS: Item[] = [
  // ── Equipment ──
  {
    id: 'i1', name: 'Lamina do Sol',
    description: 'Uma espada forjada nas profundezas do Deserto Ardente. Sua lamina emite um brilho dourado que queima os inimigos ao toque.',
    category: 'equipment', rarity: 'legendary', icon_type: 'sword',
    slot_type: 'weapon', subtype: 'sword',
    stats: { atk: 25, crit: 8 }, element: 'Fogo',
    base_sell_price: 75, tradeable: true,
  },
  {
    id: 'i2', name: 'Coraceiro Sombrio',
    description: 'Armadura forjada com fragmentos de cristal negro. Absorve parte do dano recebido.',
    category: 'equipment', rarity: 'epic', icon_type: 'chestplate',
    slot_type: 'armor', subtype: 'chestplate',
    stats: { def: 18, hp: 120 },
    base_sell_price: 50, tradeable: true,
  },
  {
    id: 'i3', name: 'Elmo de Cristal',
    description: 'Capacete raro encontrado nas Cavernas de Cristal. Aumenta a percepção mágica.',
    category: 'equipment', rarity: 'rare', icon_type: 'helmet',
    slot_type: 'head', subtype: 'helmet',
    stats: { def: 10, int: 5 },
    base_sell_price: 30, tradeable: true,
  },
  {
    id: 'i4', name: 'Escudo Verdejante',
    description: 'Escudo feito de madeira ancestral. Possui resistência natural contra magias.',
    category: 'equipment', rarity: 'uncommon', icon_type: 'shield',
    slot_type: 'offhand', subtype: 'shield',
    stats: { def: 12, block: 6 },
    base_sell_price: 15, tradeable: true,
  },
  {
    id: 'i5', name: 'Adaga de Ferro',
    description: 'Uma adaga simples, mas confiável. Padrão para iniciantes.',
    category: 'equipment', rarity: 'common', icon_type: 'sword',
    slot_type: 'weapon', subtype: 'dagger',
    stats: { atk: 8, speed: 3 },
    base_sell_price: 5, tradeable: true,
  },
  {
    id: 'i6', name: 'Amuleto Prismatico',
    description: 'Amuleto que refrata luz em múltiplas cores. Amplifica o poder mágico.',
    category: 'equipment', rarity: 'epic', icon_type: 'necklace',
    slot_type: 'accessory', subtype: 'necklace',
    stats: { int: 15, mp: 80 },
    base_sell_price: 45, tradeable: true,
  },
  {
    id: 'i7', name: 'Anel do Amanhecer',
    description: 'Anel entalhado com runas ancestrais. Aumenta a velocidade de movimento em combate.',
    category: 'equipment', rarity: 'rare', icon_type: 'ring',
    slot_type: 'ring', subtype: 'ring',
    stats: { speed: 8, atk: 5 },
    base_sell_price: 28, tradeable: true,
  },

  // ── Consumables ──
  {
    id: 'c1', name: 'Pocao de Vida',
    description: 'Restaura uma quantidade moderada de HP.',
    category: 'consumable', rarity: 'common', icon_type: 'potion',
    consumable_type: 'heal', effect_value: 50, quantity: 5,
    base_sell_price: 3, tradeable: true,
  },
  {
    id: 'c2', name: 'Pocao de Mana',
    description: 'Restaura uma quantidade de MP para usar habilidades.',
    category: 'consumable', rarity: 'uncommon', icon_type: 'potion',
    consumable_type: 'mana', effect_value: 30, quantity: 3,
    base_sell_price: 5, tradeable: true,
  },
  {
    id: 'c3', name: 'Pergaminho de XP',
    description: 'Dobra a experiência ganha na próxima batalha.',
    category: 'consumable', rarity: 'rare', icon_type: 'scroll',
    consumable_type: 'buff_xp', effect_value: 50, duration: 1, quantity: 1,
    base_sell_price: 20, tradeable: false,
  },

  // ── Cosmetics ──
  {
    id: 's1', name: 'Titulo: Conquistador',
    description: 'Concedido por completar 10 andares da torre.',
    category: 'cosmetic', rarity: 'legendary', icon_type: 'crown',
    cosmetic_type: 'title', cosmetic_value: 'Conquistador',
    base_sell_price: 0, tradeable: false,
  },
  {
    id: 's2', name: 'Moldura: Aura Mistica',
    description: 'Uma moldura roxa brilhante ao redor do seu avatar.',
    category: 'cosmetic', rarity: 'epic', icon_type: 'frame',
    cosmetic_type: 'frame', cosmetic_value: '#825ADB',
    base_sell_price: 0, tradeable: false,
  },
];

export const MOCK_EQUIPPED: EquippedItems = {
  head:   MOCK_ITEMS[2], // Elmo de Cristal
  armor:  MOCK_ITEMS[1], // Coraceiro Sombrio
  weapon: MOCK_ITEMS[0], // Lamina do Sol
  offhand: MOCK_ITEMS[3], // Escudo Verdejante
};

export const MOCK_WALLET = { coins: 350, diamonds: 12 };

const RARITY_ORDER: Record<ItemRarity, number> = {
  legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4,
};

export function sortByRarity(items: Item[]) {
  return [...items].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
}
