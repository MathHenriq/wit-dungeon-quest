import React from 'react';
import type { InvTab } from './inventory-types';

interface InventoryTabsProps {
  active:   InvTab;
  onChange: (tab: InvTab) => void;
}

const TABS: { id: InvTab; label: string }[] = [
  { id: 'equipment',  label: 'Equipamentos' },
  { id: 'consumable', label: 'Consumiveis'  },
  { id: 'cosmetic',   label: 'Coleção'      },
  { id: 'material',   label: 'Materiais'    },
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
