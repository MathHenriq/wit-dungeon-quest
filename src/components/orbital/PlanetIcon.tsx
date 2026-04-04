import React from 'react';

interface PlanetIconProps {
  type: string;
  color: string;
  size?: number;
}

export const PlanetIcon: React.FC<PlanetIconProps> = ({
  type,
  color,
  size = 40,
}) => {
  const icons: Record<string, JSX.Element> = {
    settings: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <circle cx="24" cy="24" r="6"/>
        <path d="M24 10v4m0 20v4m14-14h-4m-20 0h-4"/>
        <path d="M34.14 13.86l-2.83 2.83m-14.62 14.62l-2.83 2.83m0-28.28l2.83 2.83m14.62 14.62l2.83 2.83"/>
      </svg>
    ),
    scroll: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <rect x="14" y="12" width="20" height="24" rx="2"/>
        <line x1="18" y1="18" x2="30" y2="18"/>
        <line x1="18" y1="22" x2="30" y2="22"/>
        <line x1="18" y1="26" x2="26" y2="26"/>
      </svg>
    ),
    swords: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <path d="M16 32l16-16m-16 0l16 16"/>
        <path d="M14 30l4 4m12-28l4 4"/>
        <circle cx="18" cy="34" r="2" fill="currentColor"/>
        <circle cx="34" cy="18" r="2" fill="currentColor"/>
      </svg>
    ),
    skull: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <path d="M24 12c-6 0-10 4-10 10v4c0 2 1 4 3 5v3h14v-3c2-1 3-3 3-5v-4c0-6-4-10-10-10z"/>
        <circle cx="19" cy="22" r="1.5" fill="currentColor"/>
        <circle cx="29" cy="22" r="1.5" fill="currentColor"/>
        <path d="M20 30h2m4 0h2"/>
      </svg>
    ),
    compass: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <circle cx="24" cy="24" r="10"/>
        <path d="M24 14v4m0 12v4m10-10h-4m-12 0h-4"/>
        <path d="M24 17l3 7-7-3-3-7z" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
    tree: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <circle cx="24" cy="16" r="3"/>
        <circle cx="16" cy="26" r="3"/>
        <circle cx="32" cy="26" r="3"/>
        <circle cx="24" cy="34" r="3"/>
        <path d="M24 19v4m-6 3l-2 4m14-4l2 4m-8 0v-4"/>
      </svg>
    ),
    coin: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <circle cx="24" cy="24" r="8"/>
        <path d="M24 18v12m-4-8h8" strokeWidth="2.5"/>
      </svg>
    ),
    trophy: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <path d="M16 12h16v10c0 5-3 8-8 8s-8-3-8-8V12z"/>
        <path d="M16 16h-4v4c0 3 2 5 4 6m16-10h4v4c0 3-2 5-4 6"/>
        <path d="M20 30v4m8-4v4m-10 0h12"/>
      </svg>
    ),
    'crossed-swords': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <path d="M12 24h24M24 12v24"/>
        <path d="M18 18l12 12m0-12L18 30"/>
        <circle cx="24" cy="24" r="4"/>
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <path d="M24 12l-8 4v8c0 5 3 9 8 10 5-1 8-5 8-10v-8l-8-4z"/>
        <path d="M24 18v12m-4-8h8"/>
      </svg>
    ),
    user: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <circle cx="24" cy="20" r="5"/>
        <path d="M14 34c0-5 4-8 10-8s10 3 10 8"/>
      </svg>
    ),
    chest: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <rect x="14" y="18" width="20" height="14" rx="2"/>
        <path d="M14 24h20M24 18v14"/>
        <rect x="19" y="14" width="10" height="4" rx="1"/>
      </svg>
    ),
    arrows: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="22" strokeWidth="1.5" opacity="0.3"/>
        <path d="M18 16l-4 4 4 4m12 8l4-4-4-4"/>
        <path d="M14 20h16m4 8H18" strokeWidth="2.5"/>
      </svg>
    ),
  };

  return (
    <div
      className="planet-icon-wrapper"
      style={{ width: size, height: size, color }}
    >
      {icons[type] ?? icons.settings}
    </div>
  );
};
