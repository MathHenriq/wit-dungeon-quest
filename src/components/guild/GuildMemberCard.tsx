import React from 'react';
import type { GuildMember, Student } from '@/types';

interface GuildMemberCardProps {
  member: GuildMember;
  isSelf: boolean;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const ROLE_COLORS: Record<string, string> = {
  leader:  'rgba(255,215,0,0.6)',
  officer: 'rgba(130,90,219,0.7)',
  member:  'rgba(255,255,255,0.25)',
};

const ROLE_LABELS: Record<string, string> = {
  leader:  'Líder',
  officer: 'Oficial',
  member:  'Membro',
};

export function GuildMemberCard({ member, isSelf }: GuildMemberCardProps) {
  const s = member.student as Student | undefined;
  const displayName = s?.character_name || s?.name || '?';
  const charClass   = s?.character_class ?? '';
  const level       = s?.level ?? '?';
  const abbr        = initials(displayName);
  const roleColor   = ROLE_COLORS[member.role] ?? ROLE_COLORS.member;
  const roleLabel   = ROLE_LABELS[member.role] ?? 'Membro';

  return (
    <div className={`guild-member-card${member.role === 'leader' ? ' guild-member-card--leader' : ''}`}>
      <div
        className="guild-member-card__avatar"
        style={{
          background: `${roleColor.replace('0.', '0.0')}`,
          border: `1px solid ${roleColor}`,
          color: roleColor,
        }}
      >
        {abbr}
      </div>

      <div className="guild-member-card__info">
        <div className="guild-member-card__name">
          {displayName}
          {isSelf && (
            <span style={{ color: 'rgba(130,90,219,0.6)', fontSize: 9, marginLeft: 6 }}>
              (você)
            </span>
          )}
        </div>
        {charClass && (
          <div className="guild-member-card__class">{charClass}</div>
        )}
      </div>

      <div className="guild-member-card__right">
        <span className={`guild-member-card__role guild-member-card__role--${member.role}`}>
          {roleLabel}
        </span>
        <span className="guild-member-card__level">Nv. {level}</span>
      </div>
    </div>
  );
}
