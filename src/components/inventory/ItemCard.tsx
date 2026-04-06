import React from 'react';
import type { Item } from './inventory-types';
import { getRarity, getIconPath, formatStats, SLOT_CONFIG } from './inventory-utils';

interface ItemCardProps {
  item:     Item;
  selected: boolean;
  onClick:  () => void;
}

const CONSUMABLE_LABELS: Record<string, string> = {
  heal: 'Cura', mana: 'Mana', buff_xp: 'XP Boost', buff_atk: 'ATK Boost', buff_def: 'DEF Boost',
};

const COSMETIC_LABELS: Record<string, string> = {
  title: 'Titulo', frame: 'Moldura', skin: 'Skin',
};

export function ItemCard({ item, selected, onClick }: ItemCardProps) {
  const rarity = getRarity(item.rarity);
  const iconPath = getIconPath(item.icon_type);

  // Sub-label
  let subLabel = '';
  if (item.category === 'equipment' && item.slot_type) {
    subLabel = SLOT_CONFIG[item.slot_type].label;
  } else if (item.category === 'consumable' && item.consumable_type) {
    subLabel = CONSUMABLE_LABELS[item.consumable_type] ?? item.consumable_type;
  } else if (item.category === 'cosmetic' && item.cosmetic_type) {
    subLabel = COSMETIC_LABELS[item.cosmetic_type] ?? item.cosmetic_type;
  }

  const statsLine = item.category === 'equipment' ? formatStats(item.stats) : '';

  return (
    <div
      className={`item-card${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <div
        className="item-card-icon"
        style={{ borderColor: rarity.border, background: rarity.bg }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={rarity.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
      </div>

      <div className="item-card-info">
        <div className="item-card-name" style={{ color: rarity.color }}>{item.name}</div>
        <div className="item-card-type">{subLabel}</div>
        {statsLine && <div className="item-card-stats">{statsLine}</div>}
      </div>

      <div className="item-card-right">
        {item.category === 'consumable' && item.quantity ? (
          <span className="item-quantity">x{item.quantity}</span>
        ) : (
          <span
            className="item-rarity-badge"
            style={{ color: rarity.color, background: rarity.bg, border: `1px solid ${rarity.border}` }}
          >
            {rarity.name}
          </span>
        )}
      </div>
    </div>
  );
}
