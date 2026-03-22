import { useState, useRef, useEffect } from "react";
import { Crown, Users, MessageSquare, Plus, LogOut, Send, Shield } from "lucide-react";
import { GameIcon } from "@/components/icons/GameIcon";
import { useGuild } from "@/hooks/useGuild";
import { toast } from "sonner";
import type { Student } from "@/types";

interface GuildPanelProps {
  student: Student;
}

export function GuildPanel({ student }: GuildPanelProps) {
  const { myGuild, members, posts, availableGuilds, myRole, isLoading, createGuild, joinGuild, leaveGuild, sendPost } = useGuild(student.id, student.teacher_id);
  const [showCreate, setShowCreate] = useState(false);
  const [newGuildName, setNewGuildName] = useState("");
  const [newGuildDesc, setNewGuildDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [postText, setPostText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const postsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    postsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // ── IN A GUILD ──────────────────────────────────────────────────────────────
  if (myGuild) {
    const xpPct = Math.min(((myGuild.xp % 300) / 300) * 100, 100);
    const memberCount = members.length;

    const handleSendPost = async () => {
      if (!postText.trim()) return;
      setIsSending(true);
      try {
        await sendPost(postText);
        setPostText("");
      } catch {
        toast.error("Erro ao enviar mensagem");
      } finally {
        setIsSending(false);
      }
    };

    const handleLeave = async () => {
      if (!confirm("Tem certeza que deseja sair da guilda?")) return;
      try {
        await leaveGuild();
        toast.success("Você saiu da guilda");
      } catch {
        toast.error("Erro ao sair da guilda");
      }
    };

    return (
      <div className="space-y-4">
        {/* Guild header */}
        <div className="holo-panel-accent p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,77,255,0.12)', border: '1px solid rgba(124,77,255,0.3)' }}>
              <GameIcon id="shield" size={32} ringColor="#b388ff" fillColor="#b388ff" bgColor="rgba(124,77,255,0.08)" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white text-xl truncate" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px' }}>
                {myGuild.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span>Nv. {myGuild.level}</span>
                <span>XP {myGuild.xp}</span>
                <span className="flex items-center gap-1"><Users size={10} /> {memberCount}/{myGuild.max_members}</span>
              </div>
            </div>
          </div>
          <div className="cyber-progress h-1.5">
            <div className="cyber-progress-bar" style={{ width: `${xpPct}%`, background: '#b388ff', boxShadow: '0 0 6px rgba(124,77,255,0.4)' }} />
          </div>
        </div>

        {/* Members */}
        <div className="holo-panel p-4">
          <div className="section-title mb-3">
            <Users size={14} />
            <span>Membros ({memberCount})</span>
          </div>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-1.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: m.role === 'leader' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.role === 'leader' ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                  {m.role === 'leader' ? <Crown size={16} className="text-yellow-400" /> : <Shield size={14} className="text-white/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {m.student?.character_name || m.student?.name || "?"}
                    {m.student_id === student.id && <span className="text-cyan-400/60 text-xs ml-1">(você)</span>}
                  </p>
                  {m.student?.character_class && (
                    <p className="text-xs text-white/30">{m.student.character_class}</p>
                  )}
                </div>
                <span className="text-xs text-white/30 flex-shrink-0">
                  Nv.{m.student?.level ?? '?'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mural / Posts */}
        <div className="holo-panel p-4">
          <div className="section-title mb-3">
            <MessageSquare size={14} />
            <span>Mural</span>
          </div>

          {/* Post input */}
          <div className="flex gap-2 mb-4">
            <input
              value={postText}
              onChange={e => setPostText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendPost(); } }}
              placeholder="Escreva uma mensagem..."
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', outline: 'none' }}
            />
            <button onClick={handleSendPost} disabled={isSending || !postText.trim()} className="btn-cyber px-3 py-2">
              <Send size={14} />
            </button>
          </div>

          {/* Posts list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {posts.length === 0 ? (
              <p className="text-white/25 text-sm text-center py-4">Nenhuma mensagem ainda. Seja o primeiro!</p>
            ) : (
              [...posts].reverse().map(post => (
                <div key={post.id} className={`p-3 rounded-lg ${post.student_id === student.id ? 'ml-6' : 'mr-6'}`}
                  style={{ background: post.student_id === student.id ? 'rgba(0,229,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${post.student_id === student.id ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
                  <p className="text-xs text-white/40 mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {post.student?.character_name || post.student?.name}
                    <span className="ml-2 text-white/20">{new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                  <p className="text-sm text-white/80">{post.content}</p>
                </div>
              ))
            )}
            <div ref={postsEndRef} />
          </div>
        </div>

        {/* Leave guild */}
        <div className="flex justify-center pb-4">
          <button onClick={handleLeave} className="text-red-400/40 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
            <LogOut size={12} /> Sair da guilda
          </button>
        </div>
      </div>
    );
  }

  // ── NO GUILD ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="section-title">
        <span>Guildas</span>
      </div>

      <div className="holo-panel p-5 text-center">
        <GameIcon id="shield" size={48} ringColor="rgba(255,255,255,0.2)" fillColor="rgba(255,255,255,0.2)" bgColor="rgba(255,255,255,0.03)" className="mx-auto mb-3" />
        <p className="text-white/50 text-sm mb-4">Você ainda não faz parte de uma guilda</p>
        <button onClick={() => setShowCreate(true)} className="btn-cyber gap-2">
          <Plus size={16} /> Criar Guilda
        </button>
      </div>

      {/* Create guild form */}
      {showCreate && (
        <div className="holo-panel-accent p-5 space-y-3">
          <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px' }}>CRIAR GUILDA</h3>
          <input
            value={newGuildName}
            onChange={e => setNewGuildName(e.target.value)}
            placeholder="Nome da guilda (3-30 caracteres)"
            maxLength={30}
            className="w-full px-4 py-3 rounded-lg text-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', outline: 'none' }}
          />
          <textarea
            value={newGuildDesc}
            onChange={e => setNewGuildDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            maxLength={200}
            rows={2}
            className="w-full px-4 py-3 rounded-lg text-sm resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', outline: 'none' }}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg text-white/40 text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancelar
            </button>
            <button
              disabled={newGuildName.trim().length < 3 || isCreating}
              onClick={async () => {
                setIsCreating(true);
                try {
                  await createGuild(newGuildName, newGuildDesc);
                  toast.success("Guilda criada!");
                  setShowCreate(false);
                } catch {
                  toast.error("Erro ao criar guilda");
                } finally {
                  setIsCreating(false);
                }
              }}
              className="flex-1 btn-cyber justify-center py-2"
            >
              {isCreating ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>
      )}

      {/* Available guilds */}
      {availableGuilds.length > 0 && (
        <div>
          <div className="section-title mb-3">
            <span>Guildas da Turma</span>
          </div>
          <div className="space-y-3">
            {availableGuilds.map(guild => {
              const isFull = guild.member_count >= guild.max_members;
              return (
                <div key={guild.id} className="holo-panel flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}>
                    <GameIcon id="shield" size={24} ringColor="#b388ff" fillColor="#b388ff" bgColor="transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{guild.name}</p>
                    <p className="text-xs text-white/30">Nv.{guild.level} · {guild.member_count}/{guild.max_members} membros</p>
                  </div>
                  <button
                    disabled={isFull}
                    onClick={async () => {
                      try { await joinGuild(guild.id); toast.success("Você entrou na guilda!"); }
                      catch { toast.error("Erro ao entrar na guilda"); }
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${isFull ? 'text-white/20 cursor-not-allowed' : 'text-purple-400 hover:scale-105'}`}
                    style={{ background: isFull ? 'rgba(255,255,255,0.04)' : 'rgba(124,77,255,0.1)', border: `1px solid ${isFull ? 'rgba(255,255,255,0.08)' : 'rgba(124,77,255,0.3)'}` }}
                  >
                    {isFull ? 'Cheia' : 'Entrar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
