import React from 'react';
import { GuildMemberCard } from './GuildMemberCard';
import type { GuildMember } from '@/types';
import { ROLE_RANK, type GuildRole } from './guild-types';

interface GuildMembersProps {
  members:   GuildMember[];
  studentId: string;
  myRole:    GuildRole | null;
  onKick:    (memberId: string) => void;
}

export function GuildMembers({ members, studentId, myRole, onKick }: GuildMembersProps) {
  const sorted = [...members].sort((a, b) => {
    const ra = ROLE_RANK[a.role as GuildRole] ?? 99;
    const rb = ROLE_RANK[b.role as GuildRole] ?? 99;
    return ra - rb;
  });

  return (
    <div className="guild-members guild-animate">
      <div className="guild-section-hdr">{members.length} Membros</div>
      {sorted.map(m => (
        <GuildMemberCard
          key={m.id}
          member={m}
          isSelf={m.student_id === studentId}
          myRole={myRole}
          onKick={onKick}
        />
      ))}
    </div>
  );
}
