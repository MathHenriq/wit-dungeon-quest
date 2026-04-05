import React from 'react';
import { getDivision } from './pvp-types';
import type { PvpProfile } from './pvp-types';

interface ArenaHUDProps {
  profile: PvpProfile;
  onBack: () => void;
}

export function ArenaHUD({ profile, onBack }: ArenaHUDProps) {
  const div = getDivision(profile.elo);
  return (
    <header className="arena-hud">
      <button className="arena-hud-back" onClick={onBack}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Menu
      </button>

      <span className="arena-hud-title">Arena PVP</span>

      <span
        className="arena-rank-badge"
        style={{ color: div.color, borderColor: div.color.replace('0.8', '0.25').replace('0.7', '0.25') }}
      >
        {div.name} {div.tier === 1 ? 'I' : div.tier === 2 ? 'II' : 'III'}
      </span>
    </header>
  );
}
