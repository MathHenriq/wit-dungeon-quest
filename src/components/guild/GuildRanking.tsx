import React, { useEffect, useState } from 'react';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { GuildRankingRow } from './GuildRankingRow';
import type { GuildRankEntry } from './guild-types';

interface GuildRankingProps {
  currentGuildId?: string;
}

export function GuildRanking({ currentGuildId }: GuildRankingProps) {
  const [guilds, setGuilds]     = useState<GuildRankEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // A view guild_ranking_global ja consta nos tipos gerados, entao o cast
    // `as any` que existia aqui (precedido de uma expressao solta que nao
    // fazia nada) nao e mais necessario.
    supabaseStudent
      .from('guild_ranking_global')
      .select('id, name, emblem, emblem_color, level, xp, member_count, total_pvp_wins, total_member_xp, avg_member_level, score')
      .order('score', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setGuilds(
          ((data ?? []) as unknown as GuildRankEntry[]).map(g => ({
            id:              g.id,
            name:            g.name,
            emblem:          g.emblem          ?? 'shield',
            emblem_color:    g.emblem_color     ?? '#825ADB',
            level:           g.level           ?? 1,
            xp:              g.xp              ?? 0,
            member_count:    g.member_count     ?? 0,
            total_pvp_wins:  g.total_pvp_wins   ?? 0,
            total_member_xp: g.total_member_xp  ?? 0,
            avg_member_level:g.avg_member_level ?? 1,
            score:           g.score           ?? 0,
          }))
        );
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="guild-ranking guild-animate">
      <div className="guild-section-hdr">Ranking Global — Todas as Guildas</div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.4, fontSize: 13 }}>
          Carregando...
        </div>
      )}

      {!isLoading && guilds.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.4, fontSize: 13 }}>
          Nenhuma guilda formada ainda.
        </div>
      )}

      {!isLoading && guilds.map((entry, i) => (
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
