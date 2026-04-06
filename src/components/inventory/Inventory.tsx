import React, { useState } from 'react';
import './inventory.css';
import { InventoryBackground } from './InventoryBackground';
import { InventoryHUD }        from './InventoryHUD';
import { CharacterEquip }      from './CharacterEquip';
import { ItemDetailPanel }     from './ItemDetailPanel';
import { InventoryTabs }       from './InventoryTabs';
import { EquipmentTab }        from './EquipmentTab';
import { ConsumablesTab }      from './ConsumablesTab';
import { CosmeticsTab }        from './CosmeticsTab';
import { SellConfirmModal }    from './SellConfirmModal';
import { TradeModal }          from './TradeModal';
import { useInventory }        from './useInventory';
import type { InventoryItemEx, InvTab, EquipSlotType } from './inventory-types';
import type { InventoryItem, Student }  from '@/types';

interface InventoryProps {
  student:   Student;
  inventory: InventoryItem[];    // real data from useStudentDB
  onBack:    () => void;
  onRefresh?: () => void;
}

export function Inventory({ student, inventory, onBack, onRefresh }: InventoryProps) {
  // Cast to extended type (has is_equipped + equipped_slot from migration)
  const rawItems = inventory as InventoryItemEx[];

  const {
    equipment, consumables, cosmetics,
    equipped, isEquipped, getEquippedSlot,
    smartEquip, unequipItem, sellItem,
  } = useInventory({
    rawItems,
    studentId: student.id,
    coins:     student.coins,
    onRefresh,
  });

  const [activeTab,    setActiveTab]    = useState<InvTab>('equipment');
  const [selectedInv,  setSelectedInv]  = useState<InventoryItemEx | null>(null);
  const [showSell,     setShowSell]     = useState(false);
  const [showTrade,    setShowTrade]    = useState(false);

  const characterName  = student.character_name || student.name;
  const characterClass = student.character_class ?? undefined;

  // Slot click → select that item and show detail
  const handleSlotClick = (inv: InventoryItemEx | undefined, _slot: string) => {
    if (inv) setSelectedInv(inv);
  };

  // Item select from list
  const handleSelect = (inv: InventoryItemEx) => {
    setSelectedInv(prev => prev?.id === inv.id ? null : inv);
  };

  const handleEquip = async () => {
    if (!selectedInv) return;
    await smartEquip(selectedInv);
    setSelectedInv(null);
  };

  const handleUnequip = async () => {
    if (!selectedInv) return;
    const slot = getEquippedSlot(selectedInv.id);
    if (slot) await unequipItem(slot);
    setSelectedInv(null);
  };

  const handleSellConfirm = async () => {
    if (!selectedInv) return;
    await sellItem(selectedInv);
    setSelectedInv(null);
    setShowSell(false);
  };

  const handleTradeConfirm = () => {
    setShowTrade(false);
    // TODO: Supabase trade proposal
  };

  return (
    <div className="inv-root">
      <InventoryBackground />

      <InventoryHUD
        coins={student.coins}
        diamonds={0}
        onBack={onBack}
      />

      <div className="inv-body">
        {/* Character equip section */}
        <CharacterEquip
          equipped={equipped}
          characterName={characterName}
          characterClass={characterClass}
          onSlotClick={handleSlotClick}
        />

        {/* Detail panel (between equip and tabs) */}
        {selectedInv && (
          <ItemDetailPanel
            inv={selectedInv}
            isEquipped={isEquipped(selectedInv.id)}
            equippedSlot={getEquippedSlot(selectedInv.id)}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            onSell={() => setShowSell(true)}
            onTrade={() => setShowTrade(true)}
            onClose={() => setSelectedInv(null)}
          />
        )}

        {/* Tabs */}
        <InventoryTabs active={activeTab} onChange={tab => { setActiveTab(tab); setSelectedInv(null); }} />

        {/* Tab content */}
        {activeTab === 'equipment' && (
          <EquipmentTab
            items={equipment}
            selectedId={selectedInv?.id ?? null}
            isEquipped={isEquipped}
            onSelect={handleSelect}
          />
        )}
        {activeTab === 'consumable' && (
          <ConsumablesTab
            items={consumables}
            selectedId={selectedInv?.id ?? null}
            onSelect={handleSelect}
          />
        )}
        {activeTab === 'cosmetic' && (
          <CosmeticsTab
            items={cosmetics}
            selectedId={selectedInv?.id ?? null}
            onSelect={handleSelect}
          />
        )}
      </div>

      {showSell && selectedInv && (
        <SellConfirmModal inv={selectedInv} onConfirm={handleSellConfirm} onCancel={() => setShowSell(false)} />
      )}

      {showTrade && selectedInv && (
        <TradeModal item={selectedInv} classmates={[]} onConfirm={handleTradeConfirm} onCancel={() => setShowTrade(false)} />
      )}
    </div>
  );
}
