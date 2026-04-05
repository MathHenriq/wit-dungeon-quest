import React from 'react';

const TICKS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  const isMajor = i % 6 === 0;
  const r1 = isMajor ? 80 : 84;
  const r2 = 90;
  return {
    x1: 100 + r1 * Math.cos(angle),
    y1: 100 + r1 * Math.sin(angle),
    x2: 100 + r2 * Math.cos(angle),
    y2: 100 + r2 * Math.sin(angle),
    major: isMajor,
  };
});

const INNER_TICKS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i * 22.5 * Math.PI) / 180;
  return {
    x1: 100 + 60 * Math.cos(angle),
    y1: 100 + 60 * Math.sin(angle),
    x2: 100 + 65 * Math.cos(angle),
    y2: 100 + 65 * Math.sin(angle),
  };
});

export function CrucibleSymbol({ size = 140 }: { size?: number }) {
  return (
    <div className="crucible-symbol-wrap" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size}>
        {/* Outer ring with ticks */}
        <g className="crucible-outer-ring">
          <circle cx="100" cy="100" r="90" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" fill="none" />
          {TICKS.map((t, i) => (
            <line key={i}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.major ? 'rgba(180,40,40,0.35)' : 'rgba(255,255,255,0.1)'}
              strokeWidth={t.major ? 1.5 : 0.8}
            />
          ))}
        </g>

        {/* Middle ring */}
        <circle cx="100" cy="100" r="74" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none" />

        {/* Inner ring with ticks */}
        <g className="crucible-inner-ring">
          <circle cx="100" cy="100" r="64" stroke="rgba(180,40,40,0.15)" strokeWidth="0.5" fill="none" />
          {INNER_TICKS.map((t, i) => (
            <line key={i}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="rgba(180,40,40,0.2)" strokeWidth="0.8"
            />
          ))}
        </g>

        {/* Diamond */}
        <rect x="68" y="68" width="64" height="64" rx="2"
          transform="rotate(45 100 100)"
          stroke="rgba(180,40,40,0.5)" strokeWidth="1.5"
          fill="rgba(180,40,40,0.06)"
        />

        {/* Inner diamond glow */}
        <rect x="78" y="78" width="44" height="44" rx="1"
          transform="rotate(45 100 100)"
          stroke="rgba(180,40,40,0.18)" strokeWidth="0.8"
          fill="none"
        />

        {/* Crossed swords — blade ╲ */}
        <line x1="76" y1="76" x2="124" y2="124" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" />
        {/* Guard ╲ */}
        <line x1="74" y1="82" x2="82" y2="74" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Pommel ╲ */}
        <circle cx="122" cy="122" r="2.5" fill="rgba(255,255,255,0.3)" />

        {/* Crossed swords — blade ╱ */}
        <line x1="124" y1="76" x2="76" y2="124" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" />
        {/* Guard ╱ */}
        <line x1="118" y1="74" x2="126" y2="82" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Pommel ╱ */}
        <circle cx="78" cy="122" r="2.5" fill="rgba(255,255,255,0.3)" />

        {/* Center gem */}
        <circle cx="100" cy="100" r="3.5" fill="rgba(180,40,40,0.6)" />
        <circle cx="100" cy="100" r="2"   fill="rgba(255,255,255,0.3)" />
      </svg>
    </div>
  );
}
