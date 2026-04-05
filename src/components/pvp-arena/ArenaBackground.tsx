import React, { useMemo } from 'react';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  top: `${5 + Math.sin(i * 1.7) * 40 + 45}%`,
  left: `${5 + ((i * 47 + 13) % 90)}%`,
  dur: `${2.5 + (i % 5) * 0.7}s`,
  delay: `${(i * 0.38) % 3.2}s`,
}));

// Horizontal grid lines (every ~80px over 900 height → ~11 lines)
const H_LINES = Array.from({ length: 11 }, (_, i) => (i + 1) * 82);
// Vertical grid lines (every ~100px over 1600 width → ~15 lines)
const V_LINES = Array.from({ length: 15 }, (_, i) => (i + 1) * 107);

export function ArenaBackground() {
  return (
    <>
      {/* Ritual arcs + grid SVG */}
      <svg
        className="ritual-arcs"
        viewBox="0 0 1600 900"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden
      >
        {/* Grid */}
        {H_LINES.map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="1600" y2={y}
            stroke="rgba(255,255,255,0.012)" strokeWidth="0.5" />
        ))}
        {V_LINES.map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="900"
            stroke="rgba(255,255,255,0.012)" strokeWidth="0.5" />
        ))}

        {/* Ritual arcs */}
        <path d="M-200 200 Q400 620 800 310 T1800 420"
          stroke="rgba(180,40,40,0.055)" strokeWidth="1.5" fill="none" />
        <path d="M-200 640 Q500 180 900 520 T1800 280"
          stroke="rgba(180,40,40,0.045)" strokeWidth="1.5" fill="none" />
        <path d="M200 820 Q600 80 1000 720 T1420 60"
          stroke="rgba(180,40,40,0.032)" strokeWidth="1" fill="none" />
        <path d="M0 450 Q500 -100 1100 550 T1600 200"
          stroke="rgba(180,40,40,0.025)" strokeWidth="1" fill="none" />

        {/* Concentric circles around center */}
        <circle cx="800" cy="370" r="140" stroke="rgba(180,40,40,0.038)" strokeWidth="0.5" fill="none" />
        <circle cx="800" cy="370" r="195" stroke="rgba(180,40,40,0.027)" strokeWidth="0.5" fill="none" />
        <circle cx="800" cy="370" r="270" stroke="rgba(180,40,40,0.018)" strokeWidth="0.5" fill="none" />
        <circle cx="800" cy="370" r="370" stroke="rgba(180,40,40,0.01)"  strokeWidth="0.5" fill="none" />
      </svg>

      {/* Fog drift */}
      <div className="arena-fog" aria-hidden />

      {/* Particles */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="arena-particle"
          style={{ top: p.top, left: p.left, '--dur': p.dur, '--delay': p.delay } as React.CSSProperties}
          aria-hidden
        />
      ))}

      {/* Silhouettes */}
      <div className="arena-silhouette left" aria-hidden />
      <div className="arena-silhouette right" aria-hidden />

      {/* Vignette */}
      <div className="arena-vignette" aria-hidden />
    </>
  );
}
