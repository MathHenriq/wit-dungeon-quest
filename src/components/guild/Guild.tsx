import React, { useState } from 'react';
import './guild.css';
import { GuildBackground }   from './GuildBackground';
import { GuildBanner }       from './GuildBanner';
import { GuildTabs }         from './GuildTabs';
import { GuildChat }         from './GuildChat';
import { GuildMembers }      from './GuildMembers';
import { GuildMissions }     from './GuildMissions';
import { GuildRanking }      from './GuildRanking';
import { GuildDevelopment }  from './GuildDevelopment';
import { GuildCreate }       from './GuildCreate';
import { GuildSearch }       from './GuildSearch';
import { GuildSettings }     from './GuildSettings';
import { useGuild }          from '@/hooks/useGuild';
import type { Student }      from '@/types';
import type { GuildTab }     from './guild-types';
import { toast }             from 'sonner';

interface GuildProps {
  student: Student;
  onBack:  () => void;
}

type OnboardStep = 'menu' | 'create';

export function Guild({ student, onBack }: GuildProps) {
  const {
    myGuild, members, posts, availableGuilds, myRole, isLoading,
    createGuild, joinGuild, leaveGuild, kickMember, sendPost,
  } = useGuild(student.id, student.teacher_id);

  const [activeTab, setActiveTab] = useState<GuildTab>('chat');
  const [onboard,   setOnboard]   = useState<OnboardStep>('menu');

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="guild-root">
        <GuildBackground />
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 28, height: 28,
            border: '2px solid rgba(130,90,219,0.2)',
            borderTop: '2px solid rgba(130,90,219,0.85)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      </div>
    );
  }

  // ── HUD bar ────────────────────────────────────────────────────────────────
  const hud = (
    <div className="guild-hud">
      <button className="guild-hud__back" onClick={onBack}>← Voltar</button>
      <div className="guild-hud__center">
        <span className="guild-hud__label">Sistema</span>
        <span className="guild-hud__title">Guildas</span>
      </div>
      <div className="guild-hud__right">
        {myGuild && (
          <div className="guild-hud__level">
            <span className="guild-hud__level-num">Nv. {myGuild.level}</span>
            <span className="guild-hud__level-label">Guilda</span>
          </div>
        )}
      </div>
    </div>
  );

  // ── NOT in a guild ─────────────────────────────────────────────────────────
  if (!myGuild) {
    return (
      <div className="guild-root">
        <GuildBackground />
        {hud}
        <div className="guild-body">
          <div className="guild-content">
            {onboard === 'menu' ? (
              <GuildSearch
                availableGuilds={availableGuilds}
                onJoin={joinGuild}
                onCreateNew={() => setOnboard('create')}
              />
            ) : (
              <GuildCreate
                onBack={() => setOnboard('menu')}
                onCreate={createGuild}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── IN a guild ─────────────────────────────────────────────────────────────
  const isLeader   = myRole === 'lider';

  const handleKick = async (guildMemberId: string) => {
    const target = members.find(m => m.id === guildMemberId);
    const name   = (target?.student as { character_name?: string; name?: string } | undefined)
      ?.character_name ?? (target?.student as { name?: string } | undefined)?.name ?? 'membro';
    if (!confirm(`Expulsar ${name} da guilda?`)) return;
    try {
      await kickMember(guildMemberId);
      toast.success(`${name} foi expulso da guilda`);
    } catch {
      toast.error('Erro ao expulsar membro');
    }
  };

  return (
    <div className="guild-root">
      <GuildBackground />
      {hud}

      <div className="guild-body">
        <GuildBanner
          guild={myGuild}
          memberCount={members.length}
          myRole={myRole}
        />

        <GuildTabs
          active={activeTab}
          onChange={setActiveTab}
          isLeader={isLeader}
        />

        <div className="guild-content">
          {activeTab === 'chat' && (
            <GuildChat
              posts={posts}
              members={members}
              studentId={student.id}
              onSend={sendPost}
            />
          )}

          {activeTab === 'members' && (
            <GuildMembers
              members={members}
              studentId={student.id}
              myRole={myRole}
              onKick={handleKick}
            />
          )}

          {activeTab === 'missions' && (
            <GuildMissions teacherId={student.teacher_id} />
          )}

          {activeTab === 'development' && (
            <GuildDevelopment guildId={myGuild.id} />
          )}

          {activeTab === 'ranking' && (
            <GuildRanking currentGuildId={myGuild.id} />
          )}

          {activeTab === 'settings' && isLeader && (
            <GuildSettings
              guild={myGuild}
              onLeave={leaveGuild}
            />
          )}
        </div>
      </div>
    </div>
  );
}
