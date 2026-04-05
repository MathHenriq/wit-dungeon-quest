import React from 'react';
import type { PvpProfile } from './pvp-types';
import { RankingRow } from './RankingRow';

interface RankingTabProps {
  players: PvpProfile[];
  selfId: string;
}

export function RankingTab({ players, selfId }: RankingTabProps) {
  const sorted = [...players].sort((a, b) => b.elo - a.elo);

  return (
    <div className="arena-tab-content">
      <div className="arena-section-label">Classificacao da Turma</div>
      {sorted.map((p, i) => (
        <RankingRow key={p.student_id} player={p} position={i + 1} isSelf={p.student_id === selfId} />
      ))}
    </div>
  );
}
