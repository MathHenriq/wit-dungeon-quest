import React from 'react';

export function GuildBackground() {
  return (
    <div className="guild-bg">
      {/* Topographic SVG pattern */}
      <svg className="guild-bg__topo" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="guildGrad" cx="50%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#825ADB" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#000"    stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="600" fill="url(#guildGrad)" />
        {/* Topo rings */}
        {[80,140,200,260,320,380].map((r, i) => (
          <ellipse key={i} cx="400" cy="200" rx={r * 1.6} ry={r}
            fill="none"
            stroke="rgba(130,90,219,0.08)"
            strokeWidth="0.8"
          />
        ))}
        {[60,110,165,220,280].map((r, i) => (
          <ellipse key={`b${i}`} cx="200" cy="420" rx={r * 1.4} ry={r * 0.7}
            fill="none"
            stroke="rgba(130,90,219,0.05)"
            strokeWidth="0.6"
          />
        ))}
        {[50,100,155].map((r, i) => (
          <ellipse key={`c${i}`} cx="620" cy="480" rx={r * 1.3} ry={r * 0.6}
            fill="none"
            stroke="rgba(130,90,219,0.04)"
            strokeWidth="0.6"
          />
        ))}
        {/* Horizontal lines */}
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`h${i}`}
            x1="0" y1={i * 34} x2="800" y2={i * 34}
            stroke="rgba(130,90,219,0.025)" strokeWidth="0.5"
          />
        ))}
        {/* Diagonal accent */}
        <line x1="0" y1="0" x2="800" y2="600" stroke="rgba(130,90,219,0.04)" strokeWidth="0.8" />
        <line x1="800" y1="0" x2="0" y2="600" stroke="rgba(130,90,219,0.03)" strokeWidth="0.6" />
      </svg>

      {/* Purple fog glow */}
      <div className="guild-bg__fog" />

      {/* Vignette */}
      <div className="guild-bg__vignette" />
    </div>
  );
}
