import React from 'react';

interface PlayerMarkerProps {
  x: number;
  y: number;
  isMoving: boolean;
}

export function PlayerMarker({ x, y }: PlayerMarkerProps) {
  return (
    <div
      className="fm-player"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden
    >
      {/* Pulsing glow */}
      <div className="fm-player__glow" />

      {/* Simple chevron triangle */}
      <div className="fm-player__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4 L20 18 H4 Z"
            fill="rgba(100,220,180,0.88)"
            stroke="rgba(100,220,180,0.4)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
