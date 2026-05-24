// ── Inventory UI types ───────────────────────────────────────────────────────
// Uses the real ShopItem + InventoryItem from @/types

import type { ShopItem, InventoryItem, ItemCategory } from '@/types';

export type { ShopItem, InventoryItem, ItemCategory };

// Visual tab categories
export type InvTab = 'equipment' | 'consumable' | 'cosmetic' | 'material';

// Equip slot types
export type EquipSlotType = 'weapon' | 'offhand' | 'armor' | 'head' | 'accessory' | 'ring';
export type EquipmentFilter = 'all' | 'weapons' | 'armor' | 'accessories';

// Extended InventoryItem with equipped fields (returned by Supabase after migration)
export interface InventoryItemEx extends InventoryItem {
  is_equipped?:   boolean;
  equipped_slot?: string | null;
}

// Map real item category → visual tab
export function getInvTab(category: ItemCategory): InvTab {
  switch (category) {
    case 'armamento':
    case 'armadura':
      return 'equipment';
    case 'utilizavel':
    case 'habilidade':
      return 'consumable';
    case 'colecao':
    case 'token':
    default:
      return 'cosmetic';
  }
}

// Map real item category → default equip slot
export function getDefaultSlot(category: ItemCategory): EquipSlotType | null {
  switch (category) {
    case 'armamento': return 'weapon';
    case 'armadura':  return 'armor';
    default:          return null;
  }
}

// Equipped items map (slot → InventoryItemEx)
export type EquippedMap = Partial<Record<EquipSlotType, InventoryItemEx>>;

// Sort by rarity priority
const RARITY_ORDER: Record<string, number> = {
  legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4,
};

export function sortByRarity(items: InventoryItemEx[]): InventoryItemEx[] {
  return [...items].sort((a, b) => {
    const ra = RARITY_ORDER[a.item?.category ?? ''] ?? 99;
    const rb = RARITY_ORDER[b.item?.category ?? ''] ?? 99;
    return ra - rb;
  });
}
