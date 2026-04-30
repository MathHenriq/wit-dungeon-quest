import React from 'react';
import { GuildEmblem } from './GuildEmblem';
import type { GuildJoinRequest } from '@/types';
import type { AvailableGuild } from '@/hooks/useGuild';
import { toast } from 'sonner';

interface GuildSearchProps {
  availableGuilds: AvailableGuild[];
  myPendingRequest: GuildJoinRequest | null;
  onRequestJoin: (guildId: string) => Promise<void>;
  onCancelRequest: () => Promise<void>;
  onCreateNew: () => void;
}

export function GuildSearch({
  availableGuilds, myPendingRequest, onRequestJoin, onCancelRequest, onCreateNew,
}: GuildSearchProps) {
  const handleRequest = async (guildId: string) => {
    try {
      await onRequestJoin(guildId);
      toast.success('Solicitação enviada — aguardando aprovação do líder');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar solicitação';
      toast.error(msg);
    }
  };

  const handleCancel = async () => {
    try {
      await onCancelRequest();
      toast.success('Solicitação cancelada');
    } catch {
      toast.error('Erro ao cancelar solicitação');
    }
  };

  const pendingGuildId = myPendingRequest?.guild_id ?? null;

  return (
    <div className="guild-search guild-animate">
      <div className="guild-section-hdr">Guildas Disponíveis</div>

      {availableGuilds.length === 0 ? (
        <div className="guild-empty">Nenhuma guilda criada ainda — seja o primeiro a fundar uma!</div>
      ) : (
        availableGuilds.map(g => {
          const full      = g.member_count >= g.max_members;
          const isPending = pendingGuildId === g.id;
          const blocked   = !!pendingGuildId && !isPending;

          const label =
            isPending ? 'Pendente' :
            blocked   ? 'Aguardando' :
            full      ? 'Cheia'     :
                        'Solicitar';
          const variant =
            isPending ? 'full' :
            full      ? 'full' :
                        'join';

          const onClick = isPending
            ? handleCancel
            : (blocked || full ? undefined : () => handleRequest(g.id));

          return (
            <div key={g.id} className="guild-search-card">
              <GuildEmblem symbol="shield" color={g.emblem_color || '#825ADB'} size="sm" />
              <div className="guild-search-card__info">
                <div className="guild-search-card__name">{g.name}</div>
                <div className="guild-search-card__meta">
                  Nv. {g.level} · {g.member_count}/{g.max_members} membros
                </div>
                <div className="guild-search-card__meta" style={{ opacity: 0.75 }}>
                  Líder: <b style={{ color: 'rgba(255,215,0,0.85)' }}>{g.leader_name ?? '—'}</b>
                  {g.vice_leader_name && (
                    <>
                      {' · '}Vice: <b style={{ color: 'rgba(255,165,0,0.80)' }}>{g.vice_leader_name}</b>
                    </>
                  )}
                </div>
                {g.description && (
                  <div className="guild-search-card__meta" style={{ opacity: 0.55, fontStyle: 'italic' }}>
                    {g.description}
                  </div>
                )}
              </div>
              <button
                className={`guild-search-card__btn guild-search-card__btn--${variant}`}
                disabled={blocked || (full && !isPending)}
                onClick={onClick}
                title={isPending ? 'Clique para cancelar a solicitação' : undefined}
              >
                {label}
              </button>
            </div>
          );
        })
      )}

      <div style={{ paddingTop: 8 }}>
        <button
          className="guild-btn-secondary"
          onClick={onCreateNew}
          disabled={!!pendingGuildId}
          title={pendingGuildId ? 'Cancele a solicitação pendente para criar uma guilda' : undefined}
        >
          Criar Nova Guilda
        </button>
      </div>
    </div>
  );
}
