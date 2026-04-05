import React from 'react';

interface FloorSelectHUDProps {
  completedCount: number;
  totalFloors: number;
  onBack: () => void;
}

export function FloorSelectHUD({ completedCount, totalFloors, onBack }: FloorSelectHUDProps) {
  return (
    <div className="fs-hud">
      <button className="fs-hud__back" onClick={onBack}>
        ◀ Menu
      </button>

      <div className="fs-hud__center">
        <span className="fs-hud__label">Torre</span>
        <strong className="fs-hud__title">Selecionar Andar</strong>
      </div>

      <div className="fs-hud__stats">
        <span className="fs-hud__stats-count">{completedCount}/{totalFloors}</span>
        <span className="fs-hud__stats-label">Completos</span>
      </div>
    </div>
  );
}
