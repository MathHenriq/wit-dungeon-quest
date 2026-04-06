import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ItemCard } from './ItemCard';
import type { Item, EquipmentFilter } from './inventory-types';
import { sortByRarity } from './inventory-types';

interface EquipmentTabProps {
  items:       Item[];
  selectedId:  string | null;
  onSelect:    (item: Item) => void;
}

const FILTERS: { id: EquipmentFilter; label: string }[] = [
  { id: 'all',        label: 'Todos'      },
  { id: 'weapons',    label: 'Armas'      },
  { id: 'armor',      label: 'Armaduras'  },
  { id: 'accessories',label: 'Acessorios' },
];

function filterItems(items: Item[], filter: EquipmentFilter): Item[] {
  if (filter === 'all') return items;
  if (filter === 'weapons')     return items.filter(i => i.slot_type === 'weapon' || i.slot_type === 'offhand');
  if (filter === 'armor')       return items.filter(i => i.slot_type === 'head'   || i.slot_type === 'armor');
  if (filter === 'accessories') return items.filter(i => i.slot_type === 'accessory' || i.slot_type === 'ring');
  return items;
}

export function EquipmentTab({ items, selectedId, onSelect }: EquipmentTabProps) {
  const [filter, setFilter] = useState<EquipmentFilter>('all');
  const listRef = useRef<HTMLDivElement>(null);

  const visible = sortByRarity(filterItems(items, filter));

  useEffect(() => {
    if (listRef.current) {
      const cards = listRef.current.querySelectorAll('.item-card');
      gsap.from(cards, {
        x: -14,
        opacity: 0,
        duration: 0.28,
        stagger: 0.04,
        ease: 'power2.out',
        clearProps: 'all',
      });
    }
  }, [filter]);

  return (
    <div className="inv-tab-content">
      {/* Filters */}
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

      {/* Item list */}
      {visible.length === 0 ? (
        <div className="inv-empty">Nenhum equipamento encontrado</div>
      ) : (
        <div ref={listRef}>
          {visible.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              onClick={() => onSelect(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
