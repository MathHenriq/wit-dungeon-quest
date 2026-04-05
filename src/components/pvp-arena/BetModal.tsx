import React, { useState } from 'react';

interface BetModalProps {
  opponentName: string;
  playerCoins: number;
  onConfirm: (amount: number) => void;
  onSkip: () => void;
}

export function BetModal({ opponentName, playerCoins, onConfirm, onSkip }: BetModalProps) {
  const [amount, setAmount] = useState('50');

  const parsed = parseInt(amount) || 0;
  const valid = parsed > 0 && parsed <= playerCoins;

  return (
    <div className="bet-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onSkip(); }}>
      <div className="bet-modal">
        <div className="bet-modal-title">Propor Aposta</div>
        <div className="bet-modal-sub">Desafio contra {opponentName}</div>

        <div className="bet-label">Valor em Moedas</div>
        <input
          type="number"
          className="bet-input"
          value={amount}
          min={0}
          max={playerCoins}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="bet-balance">
          Saldo disponivel: {playerCoins} moedas
          {parsed > playerCoins && (
            <span style={{ color: 'rgba(220,80,80,0.6)', marginLeft: 8 }}>Saldo insuficiente</span>
          )}
        </div>

        <div className="bet-divider" />

        <div className="bet-actions">
          <button
            className="bet-confirm-btn"
            onClick={() => valid && onConfirm(parsed)}
            style={{ opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'default' }}
          >
            Propor Aposta
          </button>
          <button className="bet-skip-btn" onClick={onSkip}>
            Sem Aposta
          </button>
        </div>
      </div>
    </div>
  );
}
