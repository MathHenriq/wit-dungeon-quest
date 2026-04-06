import { useState, useCallback, useMemo } from 'react';
import { supabaseAnon } from '@/integrations/supabase/anonClient';
import { toast } from 'sonner';
import type { InventoryItemEx, EquippedMap, EquipSlotType, InvTab } from './inventory-types';
import { getInvTab, getDefaultSlot } from './inventory-types';
import { getSellPrice } from './inventory-utils';

interface UseInventoryProps {
  rawItems:  InventoryItemEx[];
  studentId: string;
  coins:     number;
  onCoinsChange?: (newCoins: number) => void;
  onRefresh?: () => void;
}

export function useInventory({ rawItems, studentId, coins, onRefresh }: UseInventoryProps) {
  // ── Derive equipped map from the items themselves ─────────────────────────
  const [localEquipped, setLocalEquipped] = useState<EquippedMap>(() => {
    const map: EquippedMap = {};
    for (const inv of rawItems) {
      if (inv.is_equipped && inv.equipped_slot) {
        map[inv.equipped_slot as EquipSlotType] = inv;
      }
    }
    return map;
  });

  // Re-sync if rawItems change (e.g. after refresh)
  const equippedFromProps = useMemo<EquippedMap>(() => {
    const map: EquippedMap = {};
    for (const inv of rawItems) {
      if (inv.is_equipped && inv.equipped_slot) {
        map[inv.equipped_slot as EquipSlotType] = inv;
      }
    }
    return map;
  }, [rawItems]);

  const equipped: EquippedMap = Object.keys(localEquipped).length > 0
    ? localEquipped
    : equippedFromProps;

  // ── Categorize items ──────────────────────────────────────────────────────
  const equipment   = rawItems.filter(i => i.item && getInvTab(i.item.category) === 'equipment');
  const consumables = rawItems.filter(i => i.item && getInvTab(i.item.category) === 'consumable');
  const cosmetics   = rawItems.filter(i => i.item && getInvTab(i.item.category) === 'cosmetic');

  // ── Check equipped ────────────────────────────────────────────────────────
  const isEquipped = useCallback((inventoryId: string): boolean => {
    return Object.values(equipped).some(i => i?.id === inventoryId);
  }, [equipped]);

  const getEquippedSlot = useCallback((inventoryId: string): EquipSlotType | null => {
    for (const [slot, inv] of Object.entries(equipped)) {
      if (inv?.id === inventoryId) return slot as EquipSlotType;
    }
    return null;
  }, [equipped]);

  // ── Equip ─────────────────────────────────────────────────────────────────
  const equipItem = useCallback(async (inv: InventoryItemEx, slot: EquipSlotType) => {
    const prevInSlot = equipped[slot];

    // Optimistic update
    setLocalEquipped(prev => ({ ...prev, [slot]: inv }));

    try {
      // Unequip whatever was in that slot
      if (prevInSlot) {
        await supabaseAnon
          .from('student_inventory')
          .update({ is_equipped: false, equipped_slot: null })
          .eq('id', prevInSlot.id)
          .eq('student_id', studentId);
      }

      // Equip new item
      await supabaseAnon
        .from('student_inventory')
        .update({ is_equipped: true, equipped_slot: slot })
        .eq('id', inv.id)
        .eq('student_id', studentId);

      toast.success(`${inv.item?.name ?? 'Item'} equipado`);
      onRefresh?.();
    } catch {
      // Rollback
      setLocalEquipped(prev => {
        const next = { ...prev };
        if (prevInSlot) next[slot] = prevInSlot; else delete next[slot];
        return next;
      });
      toast.error('Erro ao equipar item');
    }
  }, [equipped, studentId, onRefresh]);

  // ── Unequip ───────────────────────────────────────────────────────────────
  const unequipItem = useCallback(async (slot: EquipSlotType) => {
    const inv = equipped[slot];
    if (!inv) return;

    setLocalEquipped(prev => { const n = { ...prev }; delete n[slot]; return n; });

    try {
      await supabaseAnon
        .from('student_inventory')
        .update({ is_equipped: false, equipped_slot: null })
        .eq('id', inv.id)
        .eq('student_id', studentId);

      toast.success(`${inv.item?.name ?? 'Item'} desequipado`);
      onRefresh?.();
    } catch {
      setLocalEquipped(prev => ({ ...prev, [slot]: inv }));
      toast.error('Erro ao desequipar item');
    }
  }, [equipped, studentId, onRefresh]);

  // ── Smart equip: pick slot automatically ──────────────────────────────────
  const smartEquip = useCallback(async (inv: InventoryItemEx) => {
    if (!inv.item) return;
    const defaultSlot = getDefaultSlot(inv.item.category);
    if (!defaultSlot) {
      toast.error('Este item não pode ser equipado');
      return;
    }
    await equipItem(inv, defaultSlot);
  }, [equipItem]);

  // ── Sell ──────────────────────────────────────────────────────────────────
  const sellItem = useCallback(async (inv: InventoryItemEx) => {
    if (isEquipped(inv.id)) {
      toast.error('Desequipe o item antes de vender');
      return;
    }

    const price = getSellPrice(inv.item?.cost ?? 10);

    try {
      await supabaseAnon
        .from('student_inventory')
        .delete()
        .eq('id', inv.id)
        .eq('student_id', studentId);

      // Give coins via RPC
      await supabaseAnon.rpc('add_coins', {
        p_student_id: studentId,
        p_amount:     price,
      });

      toast.success(`Vendido por ${price} moedas`);
      onRefresh?.();
    } catch {
      toast.error('Erro ao vender item');
    }
  }, [isEquipped, studentId, onRefresh]);

  return {
    rawItems, equipment, consumables, cosmetics,
    equipped, isEquipped, getEquippedSlot,
    smartEquip, equipItem, unequipItem, sellItem,
  };
}
