import React from 'react';
import type { PvpProfile } from './pvp-types';
import { PlayerChallenge } from './PlayerChallenge';

interface ArenaTabProps {
  classmates: PvpProfile[];
  onChallenge: (player: PvpProfile) => void;
}

export function ArenaTab({ classmates, onChallenge }: ArenaTabProps) {
  const online  = classmates.filter(p => p.online);
  const offline = classmates.filter(p => !p.online);

  return (
    <div className="arena-tab-content">
      {online.length > 0 && (
        <>
          <div className="arena-section-label">Disponivel para Batalha</div>
          {online.map(p => (
            <PlayerChallenge key={p.student_id} player={p} onChallenge={onChallenge} />
          ))}
        </>
      )}
      {offline.length > 0 && (
        <>
          <div className="arena-section-label" style={{ marginTop: online.length ? 24 : 0 }}>Fora da Arena</div>
          {offline.map(p => (
            <PlayerChallenge key={p.student_id} player={p} onChallenge={onChallenge} />
          ))}
        </>
      )}
    </div>
  );
}
