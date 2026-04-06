import React from 'react';
import type { Item } from './inventory-types';
import { getRarity, getIconPath, getSellPrice } from './inventory-utils';

interface ItemDetailPanelProps {
  item:       Item;
  isEquipped: boolean;
  onEquip:    () => void;
  onSell:     () => void;
  onTrade:    () => void;
  onClose:    () => void;
}

const STAT_LABELS: Record<string, string> = {
  atk: 'Ataque', def: 'Defesa', hp: 'HP', mp: 'MP',
  crit: 'Critico', speed: 'Velocidade', int: 'Inteligencia', block: 'Bloqueio',
};

export function ItemDetailPanel({ item, isEquipped, onEquip, onSell, onTrade, onClose }: ItemDetailPanelProps) {
  const rarity    = getRarity(item.rarity);
  const iconPath  = getIconPath(item.icon_type);
  const sellPrice = getSellPrice(item.base_sell_price, item.rarity);
  const stats     = item.stats ?? {};
  const statEntries = Object.entries(stats).filter(([, v]) => v && v > 0);

  const canEquip  = item.category === 'equipment';
  const canSell   = item.base_sell_price > 0;
  const canTrade  = item.tradeable;

  return (
    <div className="item-detail">
      {/* Header with icon + name */}
      <div className="detail-header">
        <div
          className="detail-icon"
          style={{ borderColor: rarity.border, background: rarity.bg }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={rarity.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="detail-name" style={{ color: rarity.color }}>{item.name}</div>
          <div className="detail-rarity" style={{ color: rarity.color }}>{rarity.name}</div>
          {item.element && (
            <div className="detail-element">{item.element}</div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            color: 'rgba(255,255,255,0.25)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: '0 2px',
            alignSelf: 'flex-start',
          }}
          title="Fechar"
        >
          ×
        </button>
      </div>

      {/* Description */}
      <div className="detail-desc">{item.description}</div>

      {/* Stats */}
      {statEntries.length > 0 && (
        <div className="detail-stats">
          {statEntries.map(([key, val]) => (
            <div key={key} className="detail-stat">
              {STAT_LABELS[key] ?? key}: <b>+{val}</b>
            </div>
          ))}
        </div>
      )}

      {/* Consumable info */}
      {item.category === 'consumable' && item.effect_value && (
        <div className="detail-stats">
          <div className="detail-stat">Efeito: <b>+{item.effect_value}</b></div>
          {item.duration && <div className="detail-stat">Duração: <b>{item.duration} batalha(s)</b></div>}
          {item.quantity && <div className="detail-stat">Quantidade: <b>x{item.quantity}</b></div>}
        </div>
      )}

      {/* Cosmetic info */}
      {item.category === 'cosmetic' && item.cosmetic_value && (
        <div className="detail-stats">
          <div className="detail-stat">Valor: <b>{item.cosmetic_value}</b></div>
        </div>
      )}

      {/* Actions */}
      <div className="detail-actions">
        {canEquip && (
          <button
            className={`detail-btn-equip${isEquipped ? ' equipped' : ''}`}
            onClick={isEquipped ? undefined : onEquip}
          >
            {isEquipped ? 'Equipado' : 'Equipar'}
          </button>
        )}

        {canTrade && (
          <button className="detail-btn-trade" onClick={onTrade}>
            Trocar
          </button>
        )}

        {canSell && (
          <button className="detail-btn-sell" onClick={onSell}>
            Vender ({sellPrice} moedas)
          </button>
        )}
      </div>
    </div>
  );
}
