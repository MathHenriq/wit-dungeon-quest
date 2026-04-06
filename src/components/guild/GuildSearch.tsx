import React from 'react';
import { GuildEmblem } from './GuildEmblem';
import type { Guild } from '@/types';
import { toast } from 'sonner';

interface GuildSearchProps {
  availableGuilds: (Guild & { member_count: number })[];
  onJoin: (guildId: string) => Promise<void>;
  onCreateNew: () => void;
}

export function GuildSearch({ availableGuilds, onJoin, onCreateNew }: GuildSearchProps) {
  const handleJoin = async (guildId: string) => {
    try {
      await onJoin(guildId);
      toast.success('Você entrou na guilda!');
    } catch {
      toast.error('Erro ao entrar na guilda');
    }
  };

  return (
    <div className="guild-search guild-animate">
      {availableGuilds.length === 0 ? (
        <div className="guild-empty">Nenhuma guilda disponível nesta turma</div>
      ) : (
        <>
          <div className="guild-section-hdr">Guildas da Turma</div>
          {availableGuilds.map(g => {
            const full = g.member_count >= g.max_members;
            return (
              <div key={g.id} className="guild-search-card">
                <GuildEmblem symbol="shield" color="#825ADB" size="sm" />
                <div className="guild-search-card__info">
                  <div className="guild-search-card__name">{g.name}</div>
                  <div className="guild-search-card__meta">
                    Nv. {g.level} · {g.member_count}/{g.max_members} membros
                    {g.description && ` · ${g.description}`}
                  </div>
                </div>
                <button
                  className={`guild-search-card__btn guild-search-card__btn--${full ? 'full' : 'join'}`}
                  disabled={full}
                  onClick={() => handleJoin(g.id)}
                >
                  {full ? 'Cheia' : 'Entrar'}
                </button>
              </div>
            );
          })}
        </>
      )}

      <div style={{ paddingTop: 8 }}>
        <button className="guild-btn-secondary" onClick={onCreateNew}>
          Criar Nova Guilda
        </button>
      </div>
    </div>
  );
}
