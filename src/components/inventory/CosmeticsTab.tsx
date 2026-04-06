import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ItemCard } from './ItemCard';
import type { Item } from './inventory-types';
import { sortByRarity } from './inventory-types';

interface CosmeticsTabProps {
  items:      Item[];
  selectedId: string | null;
  onSelect:   (item: Item) => void;
}

export function CosmeticsTab({ items, selectedId, onSelect }: CosmeticsTabProps) {
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

  const titles = sorted.filter(i => i.cosmetic_type === 'title');
  const frames = sorted.filter(i => i.cosmetic_type === 'frame');
  const skins  = sorted.filter(i => i.cosmetic_type === 'skin');

  return (
    <div className="inv-tab-content">
      {sorted.length === 0 ? (
        <div className="inv-empty">Nenhum cosmetico no inventario</div>
      ) : (
        <div ref={listRef}>
          {titles.length > 0 && (
            <>
              <div className="inv-section-hdr">Titulos</div>
              {titles.map(item => (
                <ItemCard key={item.id} item={item} selected={item.id === selectedId} onClick={() => onSelect(item)} />
              ))}
            </>
          )}
          {frames.length > 0 && (
            <>
              <div className="inv-section-hdr">Molduras</div>
              {frames.map(item => (
                <ItemCard key={item.id} item={item} selected={item.id === selectedId} onClick={() => onSelect(item)} />
              ))}
            </>
          )}
          {skins.length > 0 && (
            <>
              <div className="inv-section-hdr">Skins</div>
              {skins.map(item => (
                <ItemCard key={item.id} item={item} selected={item.id === selectedId} onClick={() => onSelect(item)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
