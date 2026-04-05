import React from 'react';
import type { MatchHistory } from './pvp-types';

export function MatchHistoryRow({ match }: { match: MatchHistory }) {
  const positive = match.eloChange > 0;
  return (
    <div className="history-row">
      <span className={`history-result-badge ${match.result}`}>
        {match.result === 'win' ? 'Vitoria' : 'Derrota'}
      </span>

      <div className="challenge-avatar">{match.opponentInitials}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="challenge-name">{match.opponent}</div>
        <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>
          {match.opponentRank}
        </div>
      </div>

      <div className={`history-elo-change ${positive ? 'positive' : 'negative'}`}>
        {positive ? '+' : ''}{match.eloChange}
      </div>

      <div className="history-bet-label">
        {match.bet ?? ''}
      </div>

      <div className="history-time-label">{match.timeAgo}</div>
    </div>
  );
}
