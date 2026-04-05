import React, { useState } from 'react';
import type { PvpProfile } from './pvp-types';
import { getDivision } from './pvp-types';

interface Props {
  player: PvpProfile;
  onChallenge: (player: PvpProfile) => void;
}

export function PlayerChallenge({ player, onChallenge }: Props) {
  const [sent, setSent] = useState(false);
  const div = getDivision(player.elo);

  const handleChallenge = () => {
    if (!player.online || sent) return;
    setSent(true);
    onChallenge(player);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="challenge-card">
      <span className={`online-dot ${player.online ? 'online' : 'offline'}`} />

      <div className="challenge-avatar">
        {player.initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="challenge-name">{player.name}</div>
        <div className="challenge-rank-label" style={{ color: div.color }}>
          {div.name} {div.tier === 1 ? 'I' : div.tier === 2 ? 'II' : 'III'}
          <span className="challenge-elo" style={{ marginLeft: 6 }}>{player.elo} ELO</span>
        </div>
      </div>

      <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.18)', flexShrink: 0 }}>
        {player.wins}V {player.losses}D
      </div>

      <button
        className={`challenge-btn ${!player.online ? 'disabled' : sent ? 'sent' : ''}`}
        onClick={handleChallenge}
      >
        {sent ? 'Enviado' : 'Desafiar'}
      </button>
    </div>
  );
}
