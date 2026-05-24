import React from 'react';
import type { GuildMember, Student } from '@/types';
import { ROLE_COLORS, ROLE_LABELS, canKickMember, type GuildRole } from './guild-types';
import { useOpenProfileCard } from '@/components/student/ProfileCard';

interface GuildMemberCardProps {
  member:  GuildMember;
  isSelf:  boolean;
  myRole:  GuildRole | null;
  onKick?: (memberId: string) => void;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export function GuildMemberCard({ member, isSelf, myRole, onKick }: GuildMemberCardProps) {
  const s           = member.student as Student | undefined;
  const displayName = s?.character_name || s?.name || '?';
  const charClass   = s?.character_class ?? '';
  const level       = s?.level ?? '?';
  const abbr        = initials(displayName);

  const role      = member.role as GuildRole;
  const roleColor = ROLE_COLORS[role] ?? ROLE_COLORS.soldado;
  const roleLabel = ROLE_LABELS[role] ?? 'Soldado';
  const isLeader  = role === 'lider';

  const showKick = !isSelf && myRole !== null && canKickMember(myRole, role);
  const openProfile = useOpenProfileCard();
  const targetId = s?.id ?? member.student_id;

  return (
    <div
      className={`guild-member-card${isLeader ? ' guild-member-card--leader' : ''}`}
      style={{ cursor: targetId ? 'pointer' : undefined }}
      onClick={() => { if (targetId) openProfile(targetId); }}
    >
      <div
        className="guild-member-card__avatar"
        style={{
          background: roleColor.replace(/[\d.]+\)$/, '0.08)'),
          border:     `1px solid ${roleColor}`,
          color:      roleColor,
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
        <span
          className={`guild-member-card__role guild-member-card__role--${role}`}
          style={{ color: roleColor, borderColor: roleColor.replace(/[\d.]+\)$/, '0.3)') }}
        >
          {roleLabel}
        </span>
        <span className="guild-member-card__level">Nv. {level}</span>
      </div>

      {showKick && onKick && (
        <button
          className="guild-member-card__kick"
          onClick={(e) => { e.stopPropagation(); onKick(member.id); }}
          title={`Expulsar ${displayName}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
