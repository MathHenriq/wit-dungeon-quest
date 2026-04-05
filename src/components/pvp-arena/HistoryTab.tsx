import React from 'react';
import type { MatchHistory } from './pvp-types';
import { MatchHistoryRow } from './MatchHistoryRow';

export function HistoryTab({ history }: { history: MatchHistory[] }) {
  return (
    <div className="arena-tab-content">
      <div className="arena-section-label">Batalhas Recentes</div>
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)' }}>
          Nenhuma batalha registrada
        </div>
      ) : (
        history.map(m => <MatchHistoryRow key={m.id} match={m} />)
      )}
    </div>
  );
}
