import React, { useState } from 'react';

function CrownIcon({ locked }: { locked: boolean }) {
  const c = locked ? 'rgba(180,60,60,0.55)' : 'rgba(201,164,74,0.85)';
  const s = locked ? 'rgba(140,30,30,0.4)'  : 'rgba(150,110,20,0.6)';
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="18" width="20" height="4" rx="1" fill={s} />
      <path d="M4 18 L4 10 L9 15 L14 6 L19 15 L24 10 L24 18 Z" fill={c} />
      <circle cx="14" cy="10" r="1.8" fill="rgba(255,255,255,0.35)" />
      <circle cx="7.5" cy="15" r="1.1" fill="rgba(255,255,255,0.2)" />
      <circle cx="20.5" cy="15" r="1.1" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

interface BossMarkerProps {
  x: number;
  y: number;
  name: string;
  level: number;
  locked: boolean;
}

export function BossMarker({ x, y, name, level, locked }: BossMarkerProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div
      className="fm-boss"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden
      onMouseEnter={() => locked && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div
        className={`fm-boss__circle${locked ? ' fm-boss__circle--locked' : ''}`}
      >
        <CrownIcon locked={locked} />

        {/* Locked: rotating dashed ring */}
        {locked && <div className="fm-boss__shield" />}
      </div>

      {/* Unlocked: orbiting particles */}
      {!locked && (
        <>
          <div className="fm-boss__orbit">
            <div className="fm-boss__particle" />
          </div>
          <div className="fm-boss__orbit fm-boss__orbit--2">
            <div className="fm-boss__particle" />
          </div>
          <div className="fm-boss__orbit fm-boss__orbit--3">
            <div className="fm-boss__particle" />
          </div>
        </>
      )}

      {locked && showTip && (
        <div className="fm-boss__lock-tip">
          Derrote todos os inimigos primeiro
        </div>
      )}

      <span className={`fm-boss__name${locked ? ' fm-boss__name--locked' : ''}`}>
        {name} Lv.{level}
      </span>
    </div>
  );
}
