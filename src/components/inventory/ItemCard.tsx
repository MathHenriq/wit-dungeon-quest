import React from 'react';
import type { InventoryItemEx } from './inventory-types';
import { getRarity, getIconPath, formatAttrs, SLOT_CONFIG } from './inventory-utils';
import { getDefaultSlot } from './inventory-types';

interface ItemCardProps {
  inv:        InventoryItemEx;
  selected:   boolean;
  isEquipped: boolean;
  onClick:    () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  armamento:  'Armamento',
  armadura:   'Armadura',
  utilizavel: 'Utilizavel',
  habilidade: 'Habilidade',
  colecao:    'Colecao',
  token:      'Token',
};

export function ItemCard({ inv, selected, isEquipped, onClick }: ItemCardProps) {
  const shopItem = inv.item;
  if (!shopItem) return null;

  const rarity    = getRarity(shopItem);
  const iconPath  = getIconPath(shopItem.category);
  const attrs     = formatAttrs(shopItem as unknown as Record<string, unknown>);
  const label     = CATEGORY_LABELS[shopItem.category] ?? shopItem.category;
  const slot      = getDefaultSlot(shopItem.category);
  const slotLabel = slot ? SLOT_CONFIG[slot].label : '';

  return (
    <div
      className={`item-card${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      {/* Icon / Image */}
      <div
        className="item-card-icon"
        style={{ borderColor: rarity.border, background: rarity.bg }}
      >
        {shopItem.image_url ? (
          <img
            src={shopItem.image_url}
            alt={shopItem.name}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={rarity.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="item-card-info">
        <div className="item-card-name" style={{ color: rarity.color }}>{shopItem.name}</div>
        <div className="item-card-type">{slotLabel || label}</div>
        {attrs && <div className="item-card-stats">{attrs}</div>}
      </div>

      {/* Right side */}
      <div className="item-card-right">
        {isEquipped ? (
          <span className="item-equipped-badge">Equipado</span>
        ) : (
          <span
            className="item-rarity-badge"
            style={{ color: rarity.color, background: rarity.bg, border: `1px solid ${rarity.border}` }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
