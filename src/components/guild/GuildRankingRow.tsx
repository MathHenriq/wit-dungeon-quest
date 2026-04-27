import React from 'react';
import { GuildEmblem } from './GuildEmblem';
import type { GuildRankEntry } from './guild-types';

interface GuildRankingRowProps {
  entry: GuildRankEntry;
  position: number;
  isSelf: boolean;
}

export function GuildRankingRow({ entry, position, isSelf }: GuildRankingRowProps) {
  const posClass = position <= 3
    ? `guild-ranking-row__pos guild-ranking-row__pos--${position}`
    : 'guild-ranking-row__pos';

  const rowClass = [
    'guild-ranking-row',
    isSelf        ? 'guild-ranking-row--self' : '',
    position === 1 ? 'guild-ranking-row--top1' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={rowClass}>
      <div className={posClass}>{position}</div>

      <GuildEmblem
        symbol={entry.emblem}
        color={entry.emblem_color}
        size="sm"
      />

      <div className="guild-ranking-row__info">
        <div className="guild-ranking-row__name">{entry.name}</div>
        <div className="guild-ranking-row__meta">
          Nv.&nbsp;{entry.level} · {entry.member_count} membros
        </div>
      </div>

      <div className="guild-ranking-row__stats">
        <div className="guild-ranking-row__xp">
          {(entry.score ?? 0).toLocaleString('pt-BR')} pts
        </div>
        <div className="guild-ranking-row__wins">
          {entry.total_pvp_wins} vitórias PvP
        </div>
      </div>
    </div>
  );
}
