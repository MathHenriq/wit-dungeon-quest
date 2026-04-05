import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface MapHUDProps {
  floorNumber: number;
  floorName: string;
  defeated: number;
  total: number;
  onBack: () => void;
}

export function MapHUD({ floorNumber, floorName, defeated, total, onBack }: MapHUDProps) {
  const pct = total > 0 ? (defeated / total) * 100 : 0;

  return (
    <div className="fm-hud">
      <button className="fm-hud__back" onClick={onBack}>
        <ChevronLeft size={13} />
        Andares
      </button>

      <div className="fm-hud__center">
        <span className="fm-hud__floor-label">Andar {floorNumber}</span>
        <span className="fm-hud__floor-name">{floorName}</span>
      </div>

      <div className="fm-hud__right">
        <span className="fm-hud__progress-label">
          {defeated}/{total}
        </span>
        <div className="fm-hud__progress-bar">
          <div className="fm-hud__progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
