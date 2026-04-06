import React, { useState } from 'react';
import type { InventoryItemEx } from './inventory-types';
import { getRarity, getIconPath } from './inventory-utils';

interface ClassmateOption {
  id:   string;
  name: string;
}

interface TradeModalProps {
  item:       InventoryItemEx;
  classmates: ClassmateOption[];
  onConfirm:  (receiverId: string, coinsOffer: number | null) => void;
  onCancel:   () => void;
}

const DEMO_CLASSMATES: ClassmateOption[] = [
  { id: 'c1', name: 'Lucas Almeida'   },
  { id: 'c2', name: 'Bruna Santos'    },
  { id: 'c3', name: 'Rafael Ferreira' },
];

export function TradeModal({ item, classmates, onConfirm, onCancel }: TradeModalProps) {
  const cls = classmates.length > 0 ? classmates : DEMO_CLASSMATES;
  const [coinsOffer, setCoinsOffer] = useState(50);
  const [receiver,   setReceiver]   = useState(cls[0]?.id ?? '');

  const shopItem = item.item;
  if (!shopItem) return null;

  const rarity   = getRarity(shopItem.category);
  const iconPath = getIconPath(shopItem.category);

  return (
    <div className="inv-modal-overlay" onClick={onCancel}>
      <div className="inv-modal trade-modal" onClick={e => e.stopPropagation()}>
        <div className="inv-modal-title">Propor Troca</div>

        <div className="trade-modal-section">Voce oferece</div>
        <div className="inv-modal-item" style={{ marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 6,
            border: `1.5px solid ${rarity.border}`, background: rarity.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden',
          }}>
            {shopItem.image_url ? (
              <img src={shopItem.image_url} alt={shopItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={rarity.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={iconPath} />
              </svg>
            )}
          </div>
          <div>
            <div className="inv-modal-item-name" style={{ color: rarity.color, fontSize: 13 }}>{shopItem.name}</div>
            <div className="inv-modal-item-rarity" style={{ color: rarity.color }}>{rarity.name}</div>
          </div>
        </div>

        <div className="trade-modal-section">Em troca de (moedas)</div>
        <input
          className="trade-input"
          type="number"
          min={1}
          max={9999}
          value={coinsOffer}
          onChange={e => setCoinsOffer(Number(e.target.value))}
          placeholder="Valor em moedas"
        />

        <div className="trade-modal-section">Enviar para</div>
        <select className="trade-select" value={receiver} onChange={e => setReceiver(e.target.value)}>
          {cls.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="inv-modal-actions">
          <button className="inv-btn-confirm" onClick={() => onConfirm(receiver, coinsOffer)}>Enviar Proposta</button>
          <button className="inv-btn-cancel"  onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
