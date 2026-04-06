import React, { useState } from 'react';
import './inventory.css';
import { InventoryBackground }  from './InventoryBackground';
import { InventoryHUD }         from './InventoryHUD';
import { CharacterEquip }       from './CharacterEquip';
import { ItemDetailPanel }      from './ItemDetailPanel';
import { InventoryTabs }        from './InventoryTabs';
import { EquipmentTab }         from './EquipmentTab';
import { ConsumablesTab }       from './ConsumablesTab';
import { CosmeticsTab }         from './CosmeticsTab';
import { SellConfirmModal }     from './SellConfirmModal';
import { TradeModal }           from './TradeModal';
import { useInventory }         from './useInventory';
import type { Item, ItemCategory } from './inventory-types';
import type { Student }         from '@/types';

interface InventoryProps {
  student: Student;
  onBack:  () => void;
}

export function Inventory({ student, onBack }: InventoryProps) {
  const {
    equipment, consumables, cosmetics,
    equipped, coins, diamonds,
    isEquipped, equipItem, sellItem,
  } = useInventory();

  const [activeTab,   setActiveTab]   = useState<ItemCategory>('equipment');
  const [selectedItem,setSelectedItem]= useState<Item | null>(null);
  const [showSell,    setShowSell]    = useState(false);
  const [showTrade,   setShowTrade]   = useState(false);

  const characterName  = student.character_name || student.name;
  const characterClass = student.character_class ?? undefined;

  // ── Slot click → select that equipped item ────────────────────────────────
  const handleSlotClick = (item: Item | undefined) => {
    if (item) {
      setSelectedItem(item);
      // Switch to the right tab
      setActiveTab(item.category);
    }
  };

  // ── Item select from list ─────────────────────────────────────────────────
  const handleSelect = (item: Item) => {
    setSelectedItem(prev => prev?.id === item.id ? null : item);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleEquip = () => {
    if (!selectedItem) return;
    equipItem(selectedItem);
    setSelectedItem(null);
  };

  const handleSellConfirm = () => {
    if (!selectedItem) return;
    sellItem(selectedItem);
    setSelectedItem(null);
    setShowSell(false);
  };

  const handleTradeConfirm = () => {
    // TODO: Supabase trade proposal
    setShowTrade(false);
  };

  return (
    <div className="inv-root">
      <InventoryBackground />

      <InventoryHUD
        coins={coins}
        diamonds={diamonds}
        onBack={onBack}
      />

      <div className="inv-body">
        {/* Character + equip slots */}
        <CharacterEquip
          equipped={equipped}
          characterName={characterName}
          characterClass={characterClass}
          onSlotClick={handleSlotClick}
        />

        {/* Detail panel — shown between equip and tabs */}
        {selectedItem && (
          <ItemDetailPanel
            item={selectedItem}
            isEquipped={isEquipped(selectedItem.id)}
            onEquip={handleEquip}
            onSell={() => setShowSell(true)}
            onTrade={() => setShowTrade(true)}
            onClose={() => setSelectedItem(null)}
          />
        )}

        {/* Tabs */}
        <InventoryTabs active={activeTab} onChange={tab => { setActiveTab(tab); setSelectedItem(null); }} />

        {/* Tab content */}
        {activeTab === 'equipment' && (
          <EquipmentTab
            items={equipment}
            selectedId={selectedItem?.id ?? null}
            onSelect={handleSelect}
          />
        )}

        {activeTab === 'consumable' && (
          <ConsumablesTab
            items={consumables}
            selectedId={selectedItem?.id ?? null}
            onSelect={handleSelect}
          />
        )}

        {activeTab === 'cosmetic' && (
          <CosmeticsTab
            items={cosmetics}
            selectedId={selectedItem?.id ?? null}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* Modals */}
      {showSell && selectedItem && (
        <SellConfirmModal
          item={selectedItem}
          onConfirm={handleSellConfirm}
          onCancel={() => setShowSell(false)}
        />
      )}

      {showTrade && selectedItem && (
        <TradeModal
          item={selectedItem}
          classmates={[]}
          onConfirm={handleTradeConfirm}
          onCancel={() => setShowTrade(false)}
        />
      )}
    </div>
  );
}
