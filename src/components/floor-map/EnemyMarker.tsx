import React from 'react';

// ─── Icons (white/red tones) ──────────────────────────────────────────────────

function IconSVG({ type, defeated }: { type: string; defeated: boolean }) {
  if (defeated) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2 7 L5 10.5 L12 4"
          stroke="rgba(100,100,100,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const c = 'rgba(200,100,100,0.75)';
  const s = 'rgba(160,60,60,0.55)';

  switch (type) {
    case 'wolf':
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <polygon points="10,3 6,9 14,9" fill={c} />
          <polygon points="5,6 2,11 7,10" fill={s} />
          <polygon points="15,6 18,11 13,10" fill={s} />
          <ellipse cx="10" cy="12" rx="4" ry="3.5" fill={c} />
          <circle cx="8.5" cy="11" r="0.9" fill="rgba(0,0,0,0.5)" />
          <circle cx="11.5" cy="11" r="0.9" fill="rgba(0,0,0,0.5)" />
        </svg>
      );

    case 'spider':
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="3.5" fill={c} />
          <line x1="2"  y1="6"  x2="6.5" y2="9"  stroke={c} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="2"  y1="10" x2="6"   y2="10" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="2"  y1="14" x2="6.5" y2="11" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="18" y1="6"  x2="13.5" y2="9"  stroke={c} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="18" y1="10" x2="14"  y2="10" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="18" y1="14" x2="13.5" y2="11" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );

    case 'shield':
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M10 2 L18 5 L18 11 Q18 17 10 19 Q2 17 2 11 L2 5 Z" fill={s} stroke={c} strokeWidth="1.2" />
          <path d="M10 5 L15 7 L15 11 Q15 15 10 17 Q5 15 5 11 L5 7 Z" fill={c} />
          <line x1="10" y1="6" x2="10" y2="16" stroke={s} strokeWidth="0.9" />
          <line x1="6" y1="11" x2="14" y2="11" stroke={s} strokeWidth="0.9" />
        </svg>
      );

    case 'bat':
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <ellipse cx="10" cy="11" rx="2.5" ry="3" fill={c} />
          <path d="M7.5 10 Q4 6 1 8 Q3 10 5 9 Q7 11 7.5 12 Z" fill={c} />
          <path d="M12.5 10 Q16 6 19 8 Q17 10 15 9 Q13 11 12.5 12 Z" fill={c} />
        </svg>
      );

    case 'tree':
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <polygon points="10,2 17,11 3,11" fill={c} />
          <polygon points="10,6 15,13 5,13" fill={s} />
          <rect x="8.5" y="13" width="3" height="5" rx="0.5" fill={c} />
        </svg>
      );

    default: // skull
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2 C5.5 2 3 5.5 3 9 C3 12 4.5 13.5 5 14 L5 17 L15 17 L15 14 C15.5 13.5 17 12 17 9 C17 5.5 14.5 2 10 2 Z"
            fill={c}
          />
          <circle cx="7.5" cy="9" r="1.7" fill="rgba(0,0,0,0.55)" />
          <circle cx="12.5" cy="9" r="1.7" fill="rgba(0,0,0,0.55)" />
          <rect x="7"   y="14.5" width="2" height="1.8" rx="0.3" fill={s} />
          <rect x="9.5" y="14.5" width="2" height="1.8" rx="0.3" fill={s} />
        </svg>
      );
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EnemyMarkerProps {
  x: number;
  y: number;
  name: string;
  iconType: string;
  defeated: boolean;
  level: number;
}

export function EnemyMarker({ x, y, name, iconType, defeated, level }: EnemyMarkerProps) {
  return (
    <div
      className={`fm-enemy${defeated ? ' fm-enemy--defeated' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden
    >
      <div className="fm-enemy__circle" style={{ position: 'relative' }}>
        <IconSVG type={iconType} defeated={defeated} />

        {defeated && (
          <div className="fm-enemy__check">
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path
                d="M1.5 4.5 L3.5 6.5 L7.5 2.5"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      <span className="fm-enemy__name">Lv.{level} {name}</span>
    </div>
  );
}
