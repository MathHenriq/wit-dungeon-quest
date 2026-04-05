import React from 'react';
import type { PvpProfile } from './pvp-types';
import { getDivision } from './pvp-types';

interface Props {
  player: PvpProfile;
  position: number;
  isSelf: boolean;
}

export function RankingRow({ player, position, isSelf }: Props) {
  const div = getDivision(player.elo);
  const posClass = position === 1 ? 'rank-pos-1' : position === 2 ? 'rank-pos-2' : position === 3 ? 'rank-pos-3' : 'rank-pos-n';

  return (
    <div className={`ranking-row ${isSelf ? 'self' : ''}`}>
      <span className={`rank-position ${posClass}`}>{position}</span>

      <div className="challenge-avatar" style={{ borderColor: isSelf ? 'rgba(201,164,74,0.25)' : undefined }}>
        {player.initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="challenge-name" style={{ color: isSelf ? 'rgba(201,164,74,0.75)' : undefined }}>
          {player.name}{isSelf ? ' (Voce)' : ''}
        </div>
        <div className="challenge-rank-label" style={{ color: div.color }}>
          {div.name} {div.tier === 1 ? 'I' : div.tier === 2 ? 'II' : 'III'}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="ranking-elo" style={{ color: div.color }}>{player.elo}</div>
        <div className="ranking-wl">{player.wins}V / {player.losses}D</div>
      </div>
    </div>
  );
}
