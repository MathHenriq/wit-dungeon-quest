import React from 'react';
import type { EquipSlotType, Item } from './inventory-types';
import { SLOT_CONFIG, getIconPath, getRarity } from './inventory-utils';

interface EquipSlotProps {
  slotType:     EquipSlotType;
  equippedItem?: Item;
  onClick:      () => void;
  animDelay?:   number;
}

export function EquipSlot({ slotType, equippedItem, onClick, animDelay = 0 }: EquipSlotProps) {
  const cfg = SLOT_CONFIG[slotType];
  const hasItem = !!equippedItem;
  const rarity  = hasItem ? getRarity(equippedItem!.rarity) : null;

  const iconPath = getIconPath(hasItem ? equippedItem!.icon_type : cfg.icon);

  const iconBorder = hasItem ? rarity!.border : 'rgba(255,255,255,0.06)';
  const iconBg     = hasItem ? rarity!.bg     : 'rgba(255,255,255,0.02)';
  const iconColor  = hasItem ? rarity!.color  : 'rgba(255,255,255,0.12)';
  const nameColor  = hasItem ? rarity!.color  : 'rgba(255,255,255,0.18)';

  return (
    <div
      className={`equip-slot inv-slot-animate${hasItem ? ' equipped' : ''}`}
      style={{ animationDelay: `${animDelay}s` }}
      onClick={onClick}
      title={hasItem ? equippedItem!.name : cfg.label}
    >
      <div
        className="equip-slot-icon"
        style={{ borderColor: iconBorder, background: iconBg }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
      </div>

      <div className="equip-slot-text">
        <div className="equip-slot-label">{cfg.label}</div>
        <div className="equip-slot-name" style={{ color: nameColor }}>
          {hasItem ? equippedItem!.name : 'Vazio'}
        </div>
      </div>
    </div>
  );
}
