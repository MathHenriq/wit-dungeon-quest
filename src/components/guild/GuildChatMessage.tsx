import React from 'react';
import type { GuildPost } from '@/types';

interface GuildChatMessageProps {
  post: GuildPost;
  isSelf: boolean;
  role?: 'leader' | 'officer' | 'member';
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function GuildChatMessage({ post, isSelf, role }: GuildChatMessageProps) {
  const authorName = post.student?.character_name || post.student?.name || '?';
  const authorClass = `guild-msg__author${role === 'leader' ? ' guild-msg__author--leader' : role === 'officer' ? ' guild-msg__author--officer' : ''}`;

  return (
    <div className={`guild-msg ${isSelf ? 'guild-msg--self' : 'guild-msg--other'}`}>
      {!isSelf && (
        <div className={authorClass}>{authorName}</div>
      )}
      <div className="guild-msg__bubble">{post.content}</div>
      <div className="guild-msg__time">{formatTime(post.created_at)}</div>
    </div>
  );
}
