import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { InventoryItemEx } from './inventory-types';
import { getRarity, getIconPath } from './inventory-utils';

interface ConsumablesTabProps {
  items:      InventoryItemEx[];
  selectedId: string | null;
  onSelect:   (inv: InventoryItemEx) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  utilizavel: 'Utilizavel',
  habilidade: 'Habilidade',
};

export function ConsumablesTab({ items, selectedId, onSelect }: ConsumablesTabProps) {
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
        <div className="inv-empty">Nenhum consumivel no inventario</div>
      </div>
    );
  }

  const usables    = items.filter(i => i.item?.category === 'utilizavel');
  const abilities  = items.filter(i => i.item?.category === 'habilidade');

  return (
    <div className="inv-tab-content" ref={listRef}>
      {usables.length > 0 && (
        <>
          <div className="inv-section-hdr">Pocoes e Consumiveis</div>
          {usables.map(inv => <ConsumableCard key={inv.id} inv={inv} selected={inv.id === selectedId} onSelect={onSelect} />)}
        </>
      )}
      {abilities.length > 0 && (
        <>
          <div className="inv-section-hdr" style={{ paddingTop: 14 }}>Habilidades de Batalha</div>
          {abilities.map(inv => <ConsumableCard key={inv.id} inv={inv} selected={inv.id === selectedId} onSelect={onSelect} />)}
        </>
      )}
    </div>
  );
}

function ConsumableCard({ inv, selected, onSelect }: { inv: InventoryItemEx; selected: boolean; onSelect: (i: InventoryItemEx) => void }) {
  const shopItem = inv.item;
  if (!shopItem) return null;
  const rarity   = getRarity(shopItem);
  const iconPath = getIconPath(shopItem.category);
  // quantity derived from the icon field used as quantity in old schema,
  // or default 1 if not set
  const qty = 1; // Real quantity will come from Supabase once quantity column is added

  return (
    <div
      className={`item-card${selected ? ' selected' : ''}`}
      onClick={() => onSelect(inv)}
    >
      <div className="item-card-icon" style={{ borderColor: rarity.border, background: rarity.bg }}>
        {shopItem.image_url ? (
          <img src={shopItem.image_url} alt={shopItem.name}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={rarity.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        )}
      </div>

      <div className="item-card-info">
        <div className="item-card-name" style={{ color: rarity.color }}>{shopItem.name}</div>
        <div className="item-card-type">{shopItem.category === 'habilidade' ? 'Habilidade de Batalha' : 'Consumivel'}</div>
        {shopItem.description && (
          <div className="item-card-stats" style={{ maxWidth: 200 }}>{shopItem.description}</div>
        )}
      </div>

      <div className="item-card-right">
        <span className="item-quantity">x{qty}</span>
      </div>
    </div>
  );
}
