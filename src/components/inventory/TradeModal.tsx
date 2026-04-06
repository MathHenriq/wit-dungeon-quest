import React, { useState } from 'react';
import type { Item } from './inventory-types';
import { getRarity, getIconPath } from './inventory-utils';

interface ClassmateOption {
  id:   string;
  name: string;
}

interface TradeModalProps {
  item:       Item;
  classmates: ClassmateOption[];
  onConfirm:  (receiverId: string, coinsOffer: number | null, itemOffer: string | null) => void;
  onCancel:   () => void;
}

// Mock classmates for demo
const MOCK_CLASSMATES: ClassmateOption[] = [
  { id: 'c1', name: 'Lucas Almeida'   },
  { id: 'c2', name: 'Bruna Santos'    },
  { id: 'c3', name: 'Rafael Ferreira' },
];

export function TradeModal({ item, classmates = MOCK_CLASSMATES, onConfirm, onCancel }: TradeModalProps) {
  const [mode,       setMode]       = useState<'coins' | 'item'>('coins');
  const [coinsOffer, setCoinsOffer] = useState(50);
  const [receiver,   setReceiver]   = useState(classmates[0]?.id ?? '');

  const rarity    = getRarity(item.rarity);
  const iconPath  = getIconPath(item.icon_type);

  const handleConfirm = () => {
    if (!receiver) return;
    onConfirm(
      receiver,
      mode === 'coins' ? coinsOffer : null,
      mode === 'item'  ? 'selected_item_id' : null,
    );
  };

  return (
    <div className="inv-modal-overlay" onClick={onCancel}>
      <div className="inv-modal trade-modal" onClick={e => e.stopPropagation()}>
        <div className="inv-modal-title">Propor Troca</div>

        {/* Offered item */}
        <div className="trade-modal-section">Voce oferece</div>
        <div className="inv-modal-item" style={{ marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 5,
            border: `1.5px solid ${rarity.border}`,
            background: rarity.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={rarity.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath} />
            </svg>
          </div>
          <div>
            <div className="inv-modal-item-name" style={{ color: rarity.color, fontSize: 12 }}>{item.name}</div>
            <div className="inv-modal-item-rarity" style={{ color: rarity.color }}>{rarity.name}</div>
          </div>
        </div>

        {/* Trade mode toggle */}
        <div className="trade-modal-section">Em troca de</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button
            className={`inv-filter${mode === 'coins' ? ' active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => setMode('coins')}
          >
            Moedas
          </button>
          <button
            className={`inv-filter${mode === 'item' ? ' active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => setMode('item')}
          >
            Item
          </button>
        </div>

        {mode === 'coins' ? (
          <>
            <input
              className="trade-input"
              type="number"
              min={1}
              max={9999}
              value={coinsOffer}
              onChange={e => setCoinsOffer(Number(e.target.value))}
              placeholder="Valor em moedas"
            />
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: 1, marginBottom: 12 }}>
            Selecao de itens disponivel apos integracao com Supabase
          </div>
        )}

        {/* Receiver */}
        <div className="trade-modal-section">Enviar para</div>
        <select
          className="trade-select"
          value={receiver}
          onChange={e => setReceiver(e.target.value)}
        >
          {classmates.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="inv-modal-actions">
          <button className="inv-btn-confirm" onClick={handleConfirm}>Enviar Proposta</button>
          <button className="inv-btn-cancel"  onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
