import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ItemCard } from './ItemCard';
import type { Item } from './inventory-types';
import { sortByRarity } from './inventory-types';

interface ConsumablesTabProps {
  items:      Item[];
  selectedId: string | null;
  onSelect:   (item: Item) => void;
}

export function ConsumablesTab({ items, selectedId, onSelect }: ConsumablesTabProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      const cards = listRef.current.querySelectorAll('.item-card');
      gsap.from(cards, {
        x: -14, opacity: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out', clearProps: 'all',
      });
    }
  }, []);

  const sorted = sortByRarity(items);

  return (
    <div className="inv-tab-content">
      {sorted.length === 0 ? (
        <div className="inv-empty">Nenhum consumivel no inventario</div>
      ) : (
        <div ref={listRef}>
          <div className="inv-section-hdr">Consumiveis ({sorted.length})</div>
          {sorted.map(item => (
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
