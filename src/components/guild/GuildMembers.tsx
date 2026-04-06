import React from 'react';
import { GuildMemberCard } from './GuildMemberCard';
import type { GuildMember } from '@/types';

interface GuildMembersProps {
  members: GuildMember[];
  studentId: string;
}

export function GuildMembers({ members, studentId }: GuildMembersProps) {
  const sorted = [...members].sort((a, b) => {
    const order = { leader: 0, officer: 1, member: 2 };
    return (order[a.role] ?? 2) - (order[b.role] ?? 2);
  });

  return (
    <div className="guild-members guild-animate">
      <div className="guild-section-hdr">{members.length} Membros</div>
      {sorted.map(m => (
        <GuildMemberCard
          key={m.id}
          member={m}
          isSelf={m.student_id === studentId}
        />
      ))}
    </div>
  );
}
