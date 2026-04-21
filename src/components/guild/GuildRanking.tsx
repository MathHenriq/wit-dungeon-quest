import React, { useEffect, useState } from 'react';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { GuildRankingRow } from './GuildRankingRow';
import type { GuildRankEntry } from './guild-types';

interface GuildRankingProps {
  currentGuildId?: string;
  teacherId: string;
}

export function GuildRanking({ currentGuildId, teacherId }: GuildRankingProps) {
  const [guilds, setGuilds] = useState<GuildRankEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    setIsLoading(true);
    supabaseStudent
      .from('guilds')
      .select('id, name, emblem, emblem_color, level, xp, member_count, wins')
      .eq('teacher_id', teacherId)
      .order('xp', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setGuilds(data.map(g => ({
            id:           g.id,
            name:         g.name,
            emblem:       g.emblem   ?? 'shield',
            emblem_color: g.emblem_color ?? '#825ADB',
            level:        g.level    ?? 1,
            xp:           g.xp      ?? 0,
            member_count: g.member_count ?? 0,
            wins:         g.wins    ?? 0,
          })));
        } else {
          setGuilds([]);
        }
        setIsLoading(false);
      });
  }, [teacherId]);

  return (
    <div className="guild-ranking guild-animate">
      <div className="guild-section-hdr">Ranking da Turma</div>

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
