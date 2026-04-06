import React from 'react';
import type { Item } from './inventory-types';
import { getRarity, getIconPath, getSellPrice } from './inventory-utils';

interface SellConfirmModalProps {
  item:      Item;
  onConfirm: () => void;
  onCancel:  () => void;
}

export function SellConfirmModal({ item, onConfirm, onCancel }: SellConfirmModalProps) {
  const rarity    = getRarity(item.rarity);
  const iconPath  = getIconPath(item.icon_type);
  const sellPrice = getSellPrice(item.base_sell_price, item.rarity);

  return (
    <div className="inv-modal-overlay" onClick={onCancel}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>
        <div className="inv-modal-title">Vender Item</div>

        {/* Item preview */}
        <div className="inv-modal-item">
          <div style={{
            width: 40, height: 40,
            borderRadius: 6,
            border: `1.5px solid ${rarity.border}`,
            background: rarity.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={rarity.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath} />
            </svg>
          </div>
          <div>
            <div className="inv-modal-item-name" style={{ color: rarity.color }}>{item.name}</div>
            <div className="inv-modal-item-rarity" style={{ color: rarity.color }}>{rarity.name}</div>
          </div>
        </div>

        {/* Price */}
        <div className="inv-modal-price">{sellPrice}</div>
        <div className="inv-modal-price-label">moedas recebidas</div>

        <div className="inv-modal-actions">
          <button className="inv-btn-confirm" onClick={onConfirm}>Confirmar Venda</button>
          <button className="inv-btn-cancel"  onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
