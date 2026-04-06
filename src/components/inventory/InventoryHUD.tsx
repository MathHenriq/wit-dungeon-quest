import React from 'react';

interface InventoryHUDProps {
  coins:    number;
  diamonds: number;
  onBack:   () => void;
}

export function InventoryHUD({ coins, diamonds, onBack }: InventoryHUDProps) {
  return (
    <div className="inv-hud">
      <button className="inv-back" onClick={onBack}>← Voltar</button>

      <div className="inv-hud-title">
        <span>Sistema</span>
        <strong>Mochila</strong>
      </div>

      <div className="inv-wallet">
        <span className="inv-coins">{coins.toLocaleString('pt-BR')} moedas</span>
        <span className="inv-diamonds">{diamonds} diamantes</span>
      </div>
    </div>
  );
}
