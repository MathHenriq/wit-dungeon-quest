import React from 'react';

export function InventoryBackground() {
  return (
    <div className="inv-bg">
      {/* Topographic gold curves */}
      <svg
        className="inv-bg__topo"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Flowing topo lines */}
        <path d="M0 140 Q200 120 400 150 T800 135 T1200 145 T1600 160" stroke="rgba(201,164,74,0.6)" strokeWidth="0.6" fill="none"/>
        <path d="M0 280 Q250 260 500 290 T1000 275 T1600 295" stroke="rgba(201,164,74,0.5)" strokeWidth="0.5" fill="none"/>
        <path d="M0 420 Q350 400 700 430 T1400 415 T1600 435" stroke="rgba(201,164,74,0.4)" strokeWidth="0.5" fill="none"/>
        <path d="M0 560 Q300 540 600 570 T1200 555 T1600 575" stroke="rgba(201,164,74,0.35)" strokeWidth="0.5" fill="none"/>
        <path d="M0 700 Q400 680 800 710 T1600 695" stroke="rgba(201,164,74,0.3)" strokeWidth="0.4" fill="none"/>
        <path d="M0 840 Q350 820 700 850 T1600 835" stroke="rgba(201,164,74,0.25)" strokeWidth="0.4" fill="none"/>

        {/* Concentric ellipses around center */}
        <ellipse cx="800" cy="250" rx="120" ry="70"  stroke="rgba(201,164,74,0.18)" strokeWidth="0.5" fill="none"/>
        <ellipse cx="800" cy="250" rx="200" ry="120" stroke="rgba(201,164,74,0.12)" strokeWidth="0.5" fill="none"/>
        <ellipse cx="800" cy="250" rx="300" ry="180" stroke="rgba(201,164,74,0.08)" strokeWidth="0.5" fill="none"/>

        {/* Corner accents */}
        <path d="M0 0 L80 0 L0 80" stroke="rgba(201,164,74,0.15)" strokeWidth="0.8" fill="none"/>
        <path d="M1600 0 L1520 0 L1600 80" stroke="rgba(201,164,74,0.15)" strokeWidth="0.8" fill="none"/>
        <path d="M0 900 L80 900 L0 820" stroke="rgba(201,164,74,0.10)" strokeWidth="0.8" fill="none"/>
        <path d="M1600 900 L1520 900 L1600 820" stroke="rgba(201,164,74,0.10)" strokeWidth="0.8" fill="none"/>
      </svg>

      {/* Animated fog */}
      <div className="inv-bg__fog" />

      {/* Vignette */}
      <div className="inv-bg__vignette" />
    </div>
  );
}
