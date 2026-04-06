import React from 'react';
import { GuildEmblem } from './GuildEmblem';
import type { Guild } from '@/types';

interface GuildBannerProps {
  guild: Guild;
  memberCount: number;
  myRole: string | null;
}

const XP_PER_LEVEL = 300;

export function GuildBanner({ guild, memberCount, myRole }: GuildBannerProps) {
  const xpInLevel = guild.xp % XP_PER_LEVEL;
  const xpPct = Math.min((xpInLevel / XP_PER_LEVEL) * 100, 100);

  return (
    <div className="guild-banner guild-animate">
      <div className="guild-banner__top">
        <GuildEmblem
          symbol="shield"
          color="#825ADB"
          size="lg"
        />

        <div className="guild-banner__info">
          <div className="guild-banner__name">{guild.name}</div>
          {guild.description && (
            <div className="guild-banner__desc">{guild.description}</div>
          )}
          <div className="guild-banner__meta">
            <div className="guild-banner__meta-item">
              <span className="guild-banner__meta-value">{memberCount}</span>
              <span className="guild-banner__meta-label">/{guild.max_members} Membros</span>
            </div>
            <div className="guild-banner__meta-item">
              <span className="guild-banner__meta-value">Nv. {guild.level}</span>
              <span className="guild-banner__meta-label">Nível</span>
            </div>
            <div className="guild-banner__meta-item">
              <span className="guild-banner__meta-value">{guild.xp}</span>
              <span className="guild-banner__meta-label">XP Total</span>
            </div>
            {myRole && (
              <div className="guild-banner__meta-item">
                <span className="guild-banner__meta-value" style={{ color: myRole === 'leader' ? 'rgba(255,215,0,0.85)' : 'rgba(130,90,219,0.85)' }}>
                  {myRole === 'leader' ? 'Líder' : myRole === 'officer' ? 'Oficial' : 'Membro'}
                </span>
                <span className="guild-banner__meta-label">Cargo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="guild-xp-track">
        <div className="guild-xp-label">
          <span>XP Guilda</span>
          <span>{xpInLevel} / {XP_PER_LEVEL}</span>
        </div>
        <div className="guild-xp-bar">
          <div className="guild-xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
      </div>
    </div>
  );
}
