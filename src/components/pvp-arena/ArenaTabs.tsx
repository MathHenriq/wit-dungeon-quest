import React from 'react';
import type { ArenaTab } from './pvp-types';

const TABS: { id: ArenaTab; label: string }[] = [
  { id: 'arena',   label: 'Arena'     },
  { id: 'ranking', label: 'Ranking'   },
  { id: 'history', label: 'Historico' },
];

interface ArenaTabsProps {
  active: ArenaTab;
  onChange: (t: ArenaTab) => void;
}

export function ArenaTabs({ active, onChange }: ArenaTabsProps) {
  return (
    <div className="arena-tabs-bar">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`arena-tab-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
