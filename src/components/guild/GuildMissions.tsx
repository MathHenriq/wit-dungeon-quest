import React, { useEffect, useState } from 'react';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { GuildMissionCard } from './GuildMissionCard';
import type { GuildMission } from './guild-types';

interface Props {
  teacherId: string;
}

export function GuildMissions({ teacherId }: Props) {
  const [missions, setMissions] = useState<GuildMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    setIsLoading(true);
    supabaseStudent
      .from('guild_missions')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMissions(data.map(row => ({
            id:           row.id,
            title:        row.title,
            description:  row.description ?? '',
            difficulty:   row.difficulty as 'easy' | 'normal' | 'hard',
            reward_xp:    row.reward_xp,
            reward_coins: row.reward_coins,
            required:     row.required,
            current:      0,          // progress tracking is a future feature
            progress:     0,
            deadline:     row.deadline_days ? `${row.deadline_days} dias` : 'Sem prazo',
            completed:    false,
          })));
        } else {
          setMissions([]);
        }
        setIsLoading(false);
      });
  }, [teacherId]);

  if (isLoading) {
    return (
      <div className="guild-missions guild-animate">
        <div className="guild-section-hdr">Missões da Guilda</div>
        <div className="guild-empty">Carregando...</div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="guild-missions guild-animate">
        <div className="guild-section-hdr">Missões da Guilda</div>
        <div className="guild-empty">Nenhuma missão disponível no momento.</div>
      </div>
    );
  }

  const active    = missions.filter(m => !m.completed);
  const completed = missions.filter(m => m.completed);

  return (
    <div className="guild-missions guild-animate">
      {active.length > 0 && (
        <>
          <div className="guild-section-hdr">Missões Ativas</div>
          {active.map(m => <GuildMissionCard key={m.id} mission={m} />)}
        </>
      )}
      {completed.length > 0 && (
        <>
          <div className="guild-section-hdr" style={{ paddingTop: 20 }}>Concluídas</div>
          {completed.map(m => <GuildMissionCard key={m.id} mission={m} />)}
        </>
      )}
    </div>
  );
}
