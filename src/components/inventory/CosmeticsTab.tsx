import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ItemCard } from './ItemCard';
import type { InventoryItemEx } from './inventory-types';

interface CosmeticsTabProps {
  items:      InventoryItemEx[];
  selectedId: string | null;
  onSelect:   (inv: InventoryItemEx) => void;
}

export function CosmeticsTab({ items, selectedId, onSelect }: CosmeticsTabProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      const cards = listRef.current.querySelectorAll('.item-card');
      gsap.from(cards, { x: -14, opacity: 0, duration: 0.26, stagger: 0.04, ease: 'power2.out', clearProps: 'all' });
    }
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="inv-tab-content">
        <div className="inv-empty">Nenhuma conquista ou cosmetico desbloqueado</div>
      </div>
    );
  }

  const collections = items.filter(i => i.item?.category === 'colecao');
  const tokens      = items.filter(i => i.item?.category === 'token');

  return (
    <div className="inv-tab-content" ref={listRef}>
      {collections.length > 0 && (
        <>
          <div className="inv-section-hdr">Conquistas e Colecao</div>
          {collections.map(inv => (
            <ItemCard key={inv.id} inv={inv} selected={inv.id === selectedId} isEquipped={false} onClick={() => onSelect(inv)} />
          ))}
        </>
      )}
      {tokens.length > 0 && (
        <>
          <div className="inv-section-hdr" style={{ paddingTop: 14 }}>Tokens</div>
          {tokens.map(inv => (
            <ItemCard key={inv.id} inv={inv} selected={inv.id === selectedId} isEquipped={false} onClick={() => onSelect(inv)} />
          ))}
        </>
      )}
    </div>
  );
}
