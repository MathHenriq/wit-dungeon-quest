import React from 'react';
import type { InventoryItemEx, EquipSlotType } from './inventory-types';
import { getDefaultSlot } from './inventory-types';
import { getRarity, getIconPath, formatAttrs, getSellPrice, SLOT_CONFIG } from './inventory-utils';

interface ItemDetailPanelProps {
  inv:        InventoryItemEx;
  isEquipped: boolean;
  equippedSlot: EquipSlotType | null;
  onEquip:    () => void;
  onUnequip:  () => void;
  onSell:     () => void;
  onTrade:    () => void;
  onClose:    () => void;
}

const ATTR_LABELS: Record<string, string> = {
  attr_forca:        'Forca',
  attr_destreza:     'Destreza',
  attr_inteligencia: 'Inteligencia',
  attr_carisma:      'Carisma',
  attr_agilidade:    'Agilidade',
  attr_resistencia:  'Resistencia',
};

export function ItemDetailPanel({ inv, isEquipped, equippedSlot, onEquip, onUnequip, onSell, onTrade, onClose }: ItemDetailPanelProps) {
  const shopItem  = inv.item;
  if (!shopItem) return null;

  const rarity    = getRarity(shopItem.category);
  const iconPath  = getIconPath(shopItem.category);
  const sellPrice = getSellPrice(shopItem.cost);
  const canEquip  = shopItem.category === 'armamento' || shopItem.category === 'armadura';
  const canSell   = shopItem.cost > 0;
  const defaultSlot = getDefaultSlot(shopItem.category);
  const slotLabel = defaultSlot ? SLOT_CONFIG[defaultSlot].label : '';

  // Collect attribute bonuses
  const attrEntries = Object.entries(ATTR_LABELS).filter(
    ([key]) => ((shopItem as unknown as Record<string, unknown>)[key] as number) > 0
  );

  return (
    <div className="item-detail">
      <div className="detail-header">
        {/* Big icon */}
        <div className="detail-icon" style={{ borderColor: rarity.border, background: rarity.bg }}>
          {shopItem.image_url ? (
            <img src={shopItem.image_url} alt={shopItem.name}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={rarity.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath} />
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="detail-name" style={{ color: rarity.color }}>{shopItem.name}</div>
          <div className="detail-rarity" style={{ color: rarity.color }}>
            {rarity.name}{slotLabel ? ` · ${slotLabel}` : ''}
          </div>
          {isEquipped && equippedSlot && (
            <div className="detail-element" style={{ color: 'rgba(201,164,74,0.75)' }}>
              Equipado em: {SLOT_CONFIG[equippedSlot]?.label}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px', alignSelf: 'flex-start' }}
          title="Fechar"
        >
          ×
        </button>
      </div>

      {/* Description */}
      {shopItem.description && (
        <div className="detail-desc">{shopItem.description}</div>
      )}

      {/* Attribute bonuses */}
      {attrEntries.length > 0 && (
        <div className="detail-stats">
          {attrEntries.map(([key, label]) => (
            <div key={key} className="detail-stat">
              {label}: <b>+{(shopItem as unknown as Record<string, unknown>)[key] as number}</b>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="detail-actions">
        {canEquip && !isEquipped && (
          <button className="detail-btn-equip" onClick={onEquip}>
            Equipar
          </button>
        )}

        {isEquipped && (
          <button className="detail-btn-unequip" onClick={onUnequip}>
            Desequipar
          </button>
        )}

        <button className="detail-btn-trade" onClick={onTrade}>
          Trocar
        </button>

        {canSell && !isEquipped && (
          <button className="detail-btn-sell" onClick={onSell}>
            Vender ({sellPrice} moedas)
          </button>
        )}
      </div>
    </div>
  );
}
