import { useState, useEffect } from "react";
import { Plus, Trash2, Users, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameIcon } from "@/components/icons/GameIcon";
import type { Guild } from "@/types";

interface Props {
  teacherId: string;
  students: { id: string; name: string; character_name: string | null }[];
  classes: { id: string; name: string }[];
}

const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', outline: 'none' };

export function TeacherGuildPanel({ teacherId, students }: Props) {
  const [guilds, setGuilds] = useState<(Guild & { member_count: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [maxMembers, setMaxMembers] = useState(6);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGuild, setExpandedGuild] = useState<string | null>(null);
  const [guildMembers, setGuildMembers] = useState<Record<string, { student_id: string; name: string; role: string }[]>>({});

  // students prop is available for future use (e.g., manual assignment)
  void students;

  const loadGuilds = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("guilds").select("*").eq("teacher_id", teacherId).order("name");
    if (!data) { setIsLoading(false); return; }

    const withCounts = await Promise.all(data.map(async g => {
      const { count } = await supabase.from("guild_members").select("*", { count: 'exact', head: true }).eq("guild_id", g.id);
      return { ...g, member_count: count ?? 0 };
    }));
    setGuilds(withCounts as (Guild & { member_count: number })[]);
    setIsLoading(false);
  };

  useEffect(() => { loadGuilds(); }, [teacherId]);

  const loadGuildMembers = async (guildId: string) => {
    const { data } = await supabase.from("guild_members")
      .select("student_id, role, student:students(name, character_name)")
      .eq("guild_id", guildId);
    const members = (data || []).map((m: unknown) => {
      const row = m as { student_id: string; role: string; student: { name: string; character_name: string | null } };
      return { student_id: row.student_id, name: row.student?.character_name || row.student?.name || "?", role: row.role };
    });
    setGuildMembers(prev => ({ ...prev, [guildId]: members }));
  };

  const handleCreate = async () => {
    if (!guildName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("guilds").insert({
        teacher_id: teacherId,
        name: guildName.trim(),
        emblem: 'shield',
        level: 1,
        xp: 0,
        max_members: maxMembers,
      });
      if (error) throw error;
      toast.success("Guilda criada!");
      setGuildName(""); setMaxMembers(6); setShowCreate(false);
      loadGuilds();
    } catch { toast.error("Erro ao criar guilda"); }
    finally { setIsSaving(false); }
  };

  const deleteGuild = async (id: string) => {
    if (!confirm("Excluir esta guilda? Todos os membros serão removidos.")) return;
    await supabase.from("guild_posts").delete().eq("guild_id", id);
    await supabase.from("guild_members").delete().eq("guild_id", id);
    await supabase.from("guilds").delete().eq("id", id);
    loadGuilds();
    toast.success("Guilda excluída");
  };

  const removeFromGuild = async (guildId: string, studentId: string) => {
    await supabase.from("guild_members").delete().eq("guild_id", guildId).eq("student_id", studentId);
    await loadGuildMembers(guildId);
    loadGuilds();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="section-title"><span>Guildas</span></div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-cyber text-xs gap-1"><Plus size={14} /> Criar Guilda</button>
      </div>

      {showCreate && (
        <div className="holo-panel p-4 space-y-3">
          <input value={guildName} onChange={e => setGuildName(e.target.value)} placeholder="Nome da guilda" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/40">Máx. membros:</label>
            <input type="number" value={maxMembers} min={2} max={20} onChange={e => setMaxMembers(parseInt(e.target.value) || 6)} className="w-20 px-3 py-2 rounded-lg text-sm text-center" style={inputStyle} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg text-white/40 text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
            <button onClick={handleCreate} disabled={isSaving || !guildName.trim()} className="flex-1 btn-cyber justify-center">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Criar'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-cyan-400" /></div>
      ) : guilds.length === 0 ? (
        <div className="holo-panel text-center py-10 text-white/40">
          <GameIcon id="shield" size={40} ringColor="rgba(255,255,255,0.2)" fillColor="rgba(255,255,255,0.2)" bgColor="rgba(255,255,255,0.03)" className="mx-auto mb-3" />
          <p>Nenhuma guilda criada ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {guilds.map(guild => (
            <div key={guild.id} className="holo-panel">
              <div className="flex items-center gap-3">
                <GameIcon id="shield" size={36} ringColor="#b388ff" fillColor="#b388ff" bgColor="rgba(124,77,255,0.08)" className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{guild.name}</p>
                  <p className="text-xs text-white/30">Nv.{guild.level} · {guild.member_count}/{guild.max_members} membros · XP {guild.xp}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={async () => {
                    if (expandedGuild === guild.id) { setExpandedGuild(null); return; }
                    setExpandedGuild(guild.id);
                    await loadGuildMembers(guild.id);
                  }} className="p-2 rounded-lg text-white/40 hover:text-cyan-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Users size={14} />
                  </button>
                  <button onClick={() => deleteGuild(guild.id)} className="p-2 rounded-lg text-red-400/40 hover:text-red-400 transition-colors" style={{ border: '1px solid rgba(239,68,68,0.1)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expandedGuild === guild.id && guildMembers[guild.id] && (
                <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {guildMembers[guild.id].length === 0 ? (
                    <p className="text-xs text-white/30 text-center">Nenhum membro</p>
                  ) : guildMembers[guild.id].map(m => (
                    <div key={m.student_id} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 text-white/70">{m.name}</span>
                      <span className="text-white/30 capitalize">{m.role}</span>
                      <button onClick={() => removeFromGuild(guild.id, m.student_id)} className="text-red-400/40 hover:text-red-400 transition-colors"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
