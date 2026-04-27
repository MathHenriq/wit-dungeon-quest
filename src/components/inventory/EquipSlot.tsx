import React from 'react';
import type { EquipSlotType, InventoryItemEx } from './inventory-types';
import { SLOT_CONFIG, getIconPath, getRarity } from './inventory-utils';

interface EquipSlotProps {
  slotType:     EquipSlotType;
  equippedItem?: InventoryItemEx;
  onClick:      () => void;
  animDelay?:   number;
}

export function EquipSlot({ slotType, equippedItem, onClick, animDelay = 0 }: EquipSlotProps) {
  const cfg     = SLOT_CONFIG[slotType];
  const hasItem = !!equippedItem?.item;
  const shopItem = equippedItem?.item;
  const rarity  = hasItem ? getRarity(shopItem!) : null;

  const iconPath   = getIconPath(hasItem ? shopItem!.category : cfg.fallbackIcon);
  const iconBorder = hasItem ? rarity!.border : 'rgba(255,255,255,0.09)';
  const iconBg     = hasItem ? rarity!.bg     : 'rgba(255,255,255,0.03)';
  const iconColor  = hasItem ? rarity!.color  : 'rgba(255,255,255,0.22)';
  const nameColor  = hasItem ? rarity!.color  : 'rgba(255,255,255,0.28)';

  return (
    <div
      className={`equip-slot inv-slot-animate${hasItem ? ' equipped' : ''}`}
      style={{ animationDelay: `${animDelay}s` }}
      onClick={onClick}
      title={hasItem ? shopItem!.name : cfg.label}
    >
      <div
        className="equip-slot-icon"
        style={{ borderColor: iconBorder, background: iconBg }}
      >
        {hasItem && shopItem!.image_url ? (
          <img
            src={shopItem!.image_url}
            alt={shopItem!.name}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        )}
      </div>

      <div className="equip-slot-text">
        <div className="equip-slot-label">{cfg.label}</div>
        <div className="equip-slot-name" style={{ color: nameColor }}>
          {hasItem ? shopItem!.name : 'Vazio'}
        </div>
      </div>
    </div>
  );
}
