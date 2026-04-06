import React from 'react';
import type { ItemCategory } from './inventory-types';

interface InventoryTabsProps {
  active:   ItemCategory;
  onChange: (tab: ItemCategory) => void;
}

const TABS: { id: ItemCategory; label: string }[] = [
  { id: 'equipment',  label: 'Equipamentos' },
  { id: 'consumable', label: 'Consumiveis'  },
  { id: 'cosmetic',   label: 'Cosmeticos'   },
];

export function InventoryTabs({ active, onChange }: InventoryTabsProps) {
  return (
    <div className="inv-tabs">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`inv-tab${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
