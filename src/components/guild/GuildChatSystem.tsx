import React from 'react';

interface GuildChatSystemProps {
  text: string;
}

export function GuildChatSystem({ text }: GuildChatSystemProps) {
  return (
    <div className="guild-system-msg">{text}</div>
  );
}
