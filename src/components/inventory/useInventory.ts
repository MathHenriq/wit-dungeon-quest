import { useState, useCallback } from 'react';
import type { Item, EquippedItems, ItemCategory, EquipSlotType } from './inventory-types';
import { MOCK_ITEMS, MOCK_EQUIPPED, MOCK_WALLET, sortByRarity } from './inventory-types';
import { getSellPrice } from './inventory-utils';
import { toast } from 'sonner';

export function useInventory() {
  const [items,    setItems]    = useState<Item[]>(MOCK_ITEMS);
  const [equipped, setEquipped] = useState<EquippedItems>(MOCK_EQUIPPED);
  const [coins,    setCoins]    = useState(MOCK_WALLET.coins);
  const [diamonds, setDiamonds] = useState(MOCK_WALLET.diamonds);

  // ── Derived lists by category ──────────────────────────────────────────────
  const equipment  = sortByRarity(items.filter(i => i.category === 'equipment'));
  const consumables = sortByRarity(items.filter(i => i.category === 'consumable'));
  const cosmetics  = sortByRarity(items.filter(i => i.category === 'cosmetic'));

  // ── Check if item is equipped ──────────────────────────────────────────────
  const isEquipped = useCallback((itemId: string): boolean => {
    return Object.values(equipped).some(i => i?.id === itemId);
  }, [equipped]);

  // ── Equip item ─────────────────────────────────────────────────────────────
  const equipItem = useCallback((item: Item) => {
    if (!item.slot_type) return;
    setEquipped(prev => ({ ...prev, [item.slot_type!]: item }));
    toast.success(`${item.name} equipado`);
    // TODO: Supabase update
  }, []);

  // ── Unequip slot ───────────────────────────────────────────────────────────
  const unequipSlot = useCallback((slotType: EquipSlotType) => {
    setEquipped(prev => {
      const next = { ...prev };
      delete next[slotType];
      return next;
    });
    // TODO: Supabase update
  }, []);

  // ── Sell item ──────────────────────────────────────────────────────────────
  const sellItem = useCallback((item: Item) => {
    if (isEquipped(item.id)) {
      toast.error('Desequipe o item antes de vender');
      return;
    }
    const price = getSellPrice(item.base_sell_price, item.rarity);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setCoins(prev => prev + price);
    toast.success(`Vendido por ${price} moedas`);
    // TODO: Supabase delete + add_coins
  }, [isEquipped]);

  return {
    items, equipment, consumables, cosmetics,
    equipped, coins, diamonds,
    isEquipped, equipItem, unequipSlot, sellItem,
  };
}
