import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ItemCard } from './ItemCard';
import type { InventoryItemEx, EquipmentFilter } from './inventory-types';

interface EquipmentTabProps {
  items:       InventoryItemEx[];
  selectedId:  string | null;
  isEquipped:  (id: string) => boolean;
  onSelect:    (inv: InventoryItemEx) => void;
}

const FILTERS: { id: EquipmentFilter; label: string }[] = [
  { id: 'all',         label: 'Todos'      },
  { id: 'weapons',     label: 'Armas'      },
  { id: 'armor',       label: 'Armaduras'  },
  { id: 'accessories', label: 'Acessorios' },
];

function filterItems(items: InventoryItemEx[], filter: EquipmentFilter): InventoryItemEx[] {
  if (filter === 'all') return items;
  if (filter === 'weapons')     return items.filter(i => i.item?.category === 'armamento');
  if (filter === 'armor')       return items.filter(i => i.item?.category === 'armadura');
  if (filter === 'accessories') return items.filter(i =>
    i.item?.category !== 'armamento' && i.item?.category !== 'armadura'
  );
  return items;
}

export function EquipmentTab({ items, selectedId, isEquipped, onSelect }: EquipmentTabProps) {
  const [filter, setFilter] = useState<EquipmentFilter>('all');
  const listRef = useRef<HTMLDivElement>(null);

  const visible = filterItems(items, filter);

  useEffect(() => {
    if (listRef.current) {
      const cards = listRef.current.querySelectorAll('.item-card');
      gsap.from(cards, { x: -14, opacity: 0, duration: 0.26, stagger: 0.04, ease: 'power2.out', clearProps: 'all' });
    }
  }, [filter, items.length]);

  return (
    <div className="inv-tab-content">
      <div className="inv-filters">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`inv-filter${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="inv-empty">Nenhum equipamento encontrado</div>
      ) : (
        <div ref={listRef}>
          {visible.map(inv => (
            <ItemCard
              key={inv.id}
              inv={inv}
              selected={inv.id === selectedId}
              isEquipped={isEquipped(inv.id)}
              onClick={() => onSelect(inv)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
