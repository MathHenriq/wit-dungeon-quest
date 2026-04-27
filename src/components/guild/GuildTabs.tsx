import React from 'react';
import type { GuildTab } from './guild-types';

interface GuildTabsProps {
  active:    GuildTab;
  onChange:  (tab: GuildTab) => void;
  isLeader:  boolean;
}

const TABS: { id: GuildTab; label: string }[] = [
  { id: 'chat',        label: 'Chat'          },
  { id: 'members',     label: 'Membros'       },
  { id: 'missions',    label: 'Missões'       },
  { id: 'development', label: 'Progresso'     },
  { id: 'ranking',     label: 'Ranking'       },
];

export function GuildTabs({ active, onChange, isLeader }: GuildTabsProps) {
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
      {isLeader && (
        <button
          className={`guild-tab${active === 'settings' ? ' guild-tab--active' : ''}`}
          onClick={() => onChange('settings')}
          style={{ flex: '0 0 auto', paddingLeft: 8, paddingRight: 8 }}
        >
          Config
        </button>
      )}
    </div>
  );
}
