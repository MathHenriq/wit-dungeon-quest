import React from 'react';
import type { GuildTab } from './guild-types';

interface GuildTabsProps {
  active:           GuildTab;
  onChange:         (tab: GuildTab) => void;
  canManage:        boolean;          // leader OR vice-leader: shows "Solicitações"
  pendingCount?:    number;
}

const TABS: { id: GuildTab; label: string }[] = [
  { id: 'chat',        label: 'Chat'          },
  { id: 'members',     label: 'Membros'       },
  { id: 'missions',    label: 'Missões'       },
  { id: 'development', label: 'Progresso'     },
  { id: 'ranking',     label: 'Ranking'       },
];

export function GuildTabs({ active, onChange, canManage, pendingCount = 0 }: GuildTabsProps) {
  return (
    <div className="guild-tabs">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`guild-tab${active === t.id ? ' guild-tab--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
      {canManage && (
        <button
          className={`guild-tab${active === 'requests' ? ' guild-tab--active' : ''}`}
          onClick={() => onChange('requests')}
          style={{ flex: '0 0 auto', paddingLeft: 8, paddingRight: 8, position: 'relative' }}
        >
          Solicitações
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              minWidth: 16, height: 16, padding: '0 4px',
              borderRadius: 10,
              background: 'rgba(255,80,80,0.85)',
              color: '#fff', fontSize: 9, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 6px rgba(255,80,80,0.6)',
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      )}
      <button
        className={`guild-tab${active === 'settings' ? ' guild-tab--active' : ''}`}
        onClick={() => onChange('settings')}
        style={{ flex: '0 0 auto', paddingLeft: 8, paddingRight: 8 }}
      >
        Config
      </button>
    </div>
  );
}
