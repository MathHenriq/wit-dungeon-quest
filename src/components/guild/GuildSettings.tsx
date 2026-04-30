import React, { useState } from 'react';
import { toast } from 'sonner';
import type { Guild } from '@/types';

interface GuildSettingsProps {
  guild:           Guild;
  isLeader:        boolean;
  isOnlyMember:    boolean;
  onLeave:         () => Promise<void>;
}

export function GuildSettings({ guild, isLeader, isOnlyMember, onLeave }: GuildSettingsProps) {
  const [leaving, setLeaving] = useState(false);

  // Leader leaving the guild has different consequences:
  //   - alone   → guilda é dissolvida
  //   - others  → liderança transferida ao próximo membro
  const confirmMessage = isLeader
    ? (isOnlyMember
        ? 'Você é o único membro. Sair vai DISSOLVER a guilda. Continuar?'
        : 'Você é o líder. Ao sair, a liderança será transferida para outro membro. Continuar?')
    : 'Tem certeza que deseja sair da guilda?';

  const handleLeave = async () => {
    if (!confirm(confirmMessage)) return;
    setLeaving(true);
    try {
      await onLeave();
      toast.success('Você saiu da guilda');
    } catch {
      toast.error('Erro ao sair da guilda');
      setLeaving(false);
    }
  };

  return (
    <div className="guild-settings guild-animate">
      <div className="guild-settings__section-title">Configurações da Guilda</div>

      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, letterSpacing: '1px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          <span style={{ color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontSize: 9, letterSpacing: 2 }}>
            Guilda
          </span><br />
          <span style={{ fontWeight: 600 }}>{guild.name}</span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: '1px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          <span style={{ color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontSize: 9, letterSpacing: 2 }}>
            Membros máx.
          </span><br />
          <span style={{ fontWeight: 600 }}>{guild.max_members}</span>
        </div>
      </div>

      <div style={{ paddingTop: 16 }}>
        <div className="guild-settings__section-title">Zona de Perigo</div>
        <div style={{ paddingTop: 10 }}>
          <button
            className="guild-danger-btn"
            onClick={handleLeave}
            disabled={leaving}
          >
            {leaving
              ? 'Saindo...'
              : (isLeader && isOnlyMember ? 'Dissolver Guilda' : 'Sair da Guilda')}
          </button>
        </div>
      </div>
    </div>
  );
}
