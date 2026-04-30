import React, { useState } from 'react';
import { toast } from 'sonner';
import type { GuildJoinRequest } from '@/types';

interface GuildRequestsProps {
  requests: GuildJoinRequest[];
  onRespond: (requestId: string, approve: boolean) => Promise<void>;
}

export function GuildRequests({ requests, onRespond }: GuildRequestsProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const handle = async (id: string, approve: boolean, name: string) => {
    setBusyId(id);
    try {
      await onRespond(id, approve);
      toast.success(approve ? `${name} entrou na guilda` : `${name} foi recusado(a)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar solicitação';
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="guild-search guild-animate">
        <div className="guild-empty">Nenhuma solicitação pendente</div>
      </div>
    );
  }

  return (
    <div className="guild-search guild-animate">
      <div className="guild-section-hdr">Solicitações de Entrada</div>
      {requests.map(r => {
        const display = r.student?.character_name || r.student?.name || 'Aluno';
        const meta    = [
          r.student?.character_class,
          r.student?.level != null ? `Nv. ${r.student.level}` : null,
        ].filter(Boolean).join(' · ');
        const busy    = busyId === r.id;
        return (
          <div key={r.id} className="guild-search-card">
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(130,90,219,0.15)',
              border: '1px solid rgba(130,90,219,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 13,
              color: 'rgba(130,90,219,0.85)',
            }}>
              {display.slice(0, 2).toUpperCase()}
            </div>
            <div className="guild-search-card__info">
              <div className="guild-search-card__name">{display}</div>
              <div className="guild-search-card__meta">{meta || 'Aguardando aprovação'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                className="guild-search-card__btn guild-search-card__btn--join"
                onClick={() => handle(r.id, true, display)}
                disabled={busy}
              >
                {busy ? '...' : 'Aceitar'}
              </button>
              <button
                className="guild-search-card__btn guild-search-card__btn--full"
                onClick={() => handle(r.id, false, display)}
                disabled={busy}
              >
                Recusar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
