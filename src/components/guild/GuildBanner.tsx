import React from 'react';
import { GuildEmblem } from './GuildEmblem';
import type { Guild, GuildRole } from '@/types';
import { ROLE_LABELS, ROLE_COLORS } from './guild-types';

interface GuildBannerProps {
  guild:       Guild;
  memberCount: number;
  myRole:      GuildRole | null;
}

const XP_PER_LEVEL = 300;

export function GuildBanner({ guild, memberCount, myRole }: GuildBannerProps) {
  const xpInLevel = guild.xp % XP_PER_LEVEL;
  const xpPct     = Math.min((xpInLevel / XP_PER_LEVEL) * 100, 100);
  const roleLabel = myRole ? ROLE_LABELS[myRole] : null;
  const roleColor = myRole ? ROLE_COLORS[myRole] : 'rgba(130,90,219,0.85)';

  return (
    <div className="guild-banner guild-animate">
      <div className="guild-banner__top">
        <GuildEmblem
          symbol={guild.emblem as Parameters<typeof GuildEmblem>[0]['symbol']}
          color={guild.emblem_color ?? '#825ADB'}
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
            {roleLabel && (
              <div className="guild-banner__meta-item">
                <span className="guild-banner__meta-value" style={{ color: roleColor }}>
                  {roleLabel}
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
