import React from 'react';
import { GuildMissionCard } from './GuildMissionCard';
import { MOCK_MISSIONS } from './guild-types';

export function GuildMissions() {
  const active    = MOCK_MISSIONS.filter(m => !m.completed);
  const completed = MOCK_MISSIONS.filter(m => m.completed);

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
      {MOCK_MISSIONS.length === 0 && (
        <div className="guild-empty">Nenhuma missão disponível</div>
      )}
    </div>
  );
}
