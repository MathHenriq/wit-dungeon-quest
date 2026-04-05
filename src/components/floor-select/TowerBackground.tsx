import React from 'react';

export function TowerBackground() {
  return (
    <div className="fs-bg">
      <svg
        className="fs-topo"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Horizontal organic curves */}
        <path d="M0 140 Q240 118 480 155 T960 138 T1200 152"
              stroke="rgba(255,255,255,.04)" strokeWidth="1" fill="none" />
        <path d="M0 280 Q300 255 600 292 T1200 272"
              stroke="rgba(255,255,255,.03)" strokeWidth="1" fill="none" />
        <path d="M0 430 Q200 408 440 445 T880 425 T1200 440"
              stroke="rgba(255,255,255,.05)" strokeWidth="1" fill="none" />
        <path d="M0 570 Q320 546 640 584 T1200 562"
              stroke="rgba(255,255,255,.03)" strokeWidth="1" fill="none" />
        <path d="M0 720 Q260 698 520 734 T1040 716 T1200 728"
              stroke="rgba(255,255,255,.04)" strokeWidth="1" fill="none" />
        <path d="M0 860 Q400 838 800 872 T1200 850"
              stroke="rgba(255,255,255,.025)" strokeWidth="1" fill="none" />

        {/* Vertical organic curves */}
        <path d="M220 0 Q242 200 218 430 T236 900"
              stroke="rgba(255,255,255,.025)" strokeWidth="1" fill="none" />
        <path d="M600 0 Q578 240 604 500 T584 900"
              stroke="rgba(255,255,255,.03)" strokeWidth="1" fill="none" />
        <path d="M980 0 Q1004 180 978 420 T998 900"
              stroke="rgba(255,255,255,.025)" strokeWidth="1" fill="none" />

        {/* Terrain elevation ellipses */}
        <ellipse cx="280" cy="340" rx="140" ry="85"
                 stroke="rgba(255,255,255,.03)" strokeWidth="1" fill="none" />
        <ellipse cx="280" cy="340" rx="220" ry="140"
                 stroke="rgba(255,255,255,.018)" strokeWidth="1" fill="none" />
        <ellipse cx="900" cy="580" rx="120" ry="75"
                 stroke="rgba(255,255,255,.03)" strokeWidth="1" fill="none" />
        <ellipse cx="900" cy="580" rx="195" ry="125"
                 stroke="rgba(255,255,255,.018)" strokeWidth="1" fill="none" />
        <ellipse cx="620" cy="180" rx="180" ry="60"
                 stroke="rgba(255,255,255,.022)" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}
