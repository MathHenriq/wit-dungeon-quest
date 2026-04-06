import React from 'react';
import type { InventoryItemEx } from './inventory-types';
import { getRarity, getIconPath, getSellPrice } from './inventory-utils';

interface SellConfirmModalProps {
  inv:       InventoryItemEx;
  onConfirm: () => void;
  onCancel:  () => void;
}

export function SellConfirmModal({ inv, onConfirm, onCancel }: SellConfirmModalProps) {
  const shopItem  = inv.item;
  if (!shopItem) return null;
  const rarity    = getRarity(shopItem.category);
  const iconPath  = getIconPath(shopItem.category);
  const sellPrice = getSellPrice(shopItem.cost);

  return (
    <div className="inv-modal-overlay" onClick={onCancel}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>
        <div className="inv-modal-title">Vender Item</div>

        <div className="inv-modal-item">
          <div style={{
            width: 44, height: 44, borderRadius: 7,
            border: `1.5px solid ${rarity.border}`,
            background: rarity.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden',
          }}>
            {shopItem.image_url ? (
              <img src={shopItem.image_url} alt={shopItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={rarity.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={iconPath} />
              </svg>
            )}
          </div>
          <div>
            <div className="inv-modal-item-name" style={{ color: rarity.color }}>{shopItem.name}</div>
            <div className="inv-modal-item-rarity" style={{ color: rarity.color }}>{rarity.name}</div>
          </div>
        </div>

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
