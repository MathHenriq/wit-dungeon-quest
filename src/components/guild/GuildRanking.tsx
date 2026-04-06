import React from 'react';
import { GuildRankingRow } from './GuildRankingRow';
import { MOCK_RANKING } from './guild-types';

interface GuildRankingProps {
  currentGuildId?: string;
}

export function GuildRanking({ currentGuildId }: GuildRankingProps) {
  const sorted = [...MOCK_RANKING].sort((a, b) => b.xp - a.xp);

  return (
    <div className="guild-ranking guild-animate">
      <div className="guild-section-hdr">Ranking da Turma</div>
      {sorted.map((entry, i) => (
        <GuildRankingRow
          key={entry.id}
          entry={entry}
          position={i + 1}
          isSelf={entry.id === currentGuildId}
        />
      ))}
    </div>
  );
}
