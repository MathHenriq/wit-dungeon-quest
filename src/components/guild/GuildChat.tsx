import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { GuildChatMessage } from './GuildChatMessage';
import { GuildChatSystem } from './GuildChatSystem';
import type { GuildPost, GuildMember } from '@/types';
import { toast } from 'sonner';

interface GuildChatProps {
  posts: GuildPost[];
  members: GuildMember[];
  studentId: string;
  onSend: (content: string) => Promise<void>;
}

export function GuildChat({ posts, members, studentId, onSend }: GuildChatProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  const memberRole = (id: string) =>
    members.find(m => m.student_id === id)?.role;

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText('');
    } catch {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Display posts oldest-first
  const ordered = [...posts].reverse();

  return (
    <div className="guild-chat guild-animate">
      <div className="guild-chat__messages">
        {ordered.length === 0 ? (
          <GuildChatSystem text="Nenhuma mensagem ainda — seja o primeiro!" />
        ) : (
          ordered.map(post => {
            const isSelf = post.student_id === studentId;
            const role = memberRole(post.student_id) ?? 'member';
            return (
              <GuildChatMessage
                key={post.id}
                post={post}
                isSelf={isSelf}
                role={role}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="guild-chat__input-row">
        <input
          className="guild-chat__input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escreva uma mensagem..."
          maxLength={400}
          disabled={sending}
        />
        <button
          className="guild-chat__send"
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
