import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── Types ──────────────────────────────────────────────────────────────────── */
interface GuildMissionRow {
  id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "normal" | "hard";
  reward_xp: number;
  reward_coins: number;
  required: number;
  deadline_days: number | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  teacherId: string;
}

const DIFF_LABELS = { easy: "Fácil", normal: "Normal", hard: "Difícil" } as const;
const DIFF_COLORS = {
  easy:   { color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.25)"   },
  normal: { color: "#facc15", bg: "rgba(250,204,21,0.08)",   border: "rgba(250,204,21,0.25)"   },
  hard:   { color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.25)"  },
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.85)",
  outline: "none",
  borderRadius: 8,
  padding: "8px 12px",
  width: "100%",
  fontSize: 13,
};

const EMPTY_FORM = {
  title: "",
  description: "",
  difficulty: "normal" as "easy" | "normal" | "hard",
  reward_xp: 200,
  reward_coins: 80,
  required: 5,
  deadline_days: 7 as number | "",
};

/* ── Component ──────────────────────────────────────────────────────────────── */
export function TeacherGuildMissionsPanel({ teacherId }: Props) {
  const [missions, setMissions] = useState<GuildMissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("guild_missions")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (!error) setMissions((data ?? []) as GuildMissionRow[]);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [teacherId]);

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from("guild_missions").insert({
        teacher_id:   teacherId,
        title:        form.title.trim(),
        description:  form.description.trim() || null,
        difficulty:   form.difficulty,
        reward_xp:    Number(form.reward_xp),
        reward_coins: Number(form.reward_coins),
        required:     Number(form.required),
        deadline_days: form.deadline_days === "" ? null : Number(form.deadline_days),
        is_active:    true,
      });
      if (error) throw error;
      toast.success("Missão de guilda criada!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch { toast.error("Erro ao criar missão"); }
    finally { setIsSaving(false); }
  };

  const toggleActive = async (m: GuildMissionRow) => {
    const { error } = await supabase
      .from("guild_missions")
      .update({ is_active: !m.is_active })
      .eq("id", m.id);
    if (!error) setMissions(prev => prev.map(x => x.id === m.id ? { ...x, is_active: !m.is_active } : x));
    else toast.error("Erro ao atualizar");
  };

  const deleteMission = async (id: string) => {
    if (!confirm("Excluir esta missão de guilda?")) return;
    const { error } = await supabase.from("guild_missions").delete().eq("id", id);
    if (!error) { setMissions(prev => prev.filter(m => m.id !== id)); toast.success("Missão excluída"); }
    else toast.error("Erro ao excluir");
  };

  const active   = missions.filter(m => m.is_active);
  const inactive = missions.filter(m => !m.is_active);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="section-title"><span>Missões de Guilda</span></div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-cyber text-xs gap-1"
        >
          <Plus size={14} /> Nova Missão
        </button>
      </div>

      {/* Creation form */}
      {showForm && (
        <div className="card-fantasy space-y-4">
          <p className="font-semibold text-sm text-white/70">Nova Missão de Guilda</p>

          <div className="grid grid-cols-1 gap-3">
            <input
              style={inputStyle}
              placeholder="Título da missão *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Difficulty */}
            <div>
              <label className="text-xs text-white/40 block mb-1">Dificuldade</label>
              <select
                style={inputStyle}
                value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as "easy" | "normal" | "hard" }))}
              >
                <option value="easy">Fácil</option>
                <option value="normal">Normal</option>
                <option value="hard">Difícil</option>
              </select>
            </div>

            {/* Reward XP */}
            <div>
              <label className="text-xs text-white/40 block mb-1">Recompensa XP ✨</label>
              <input
                type="number" min={0} style={inputStyle}
                value={form.reward_xp}
                onChange={e => setForm(f => ({ ...f, reward_xp: Number(e.target.value) }))}
              />
            </div>

            {/* Reward Coins */}
            <div>
              <label className="text-xs text-white/40 block mb-1">Recompensa Moedas 🪙</label>
              <input
                type="number" min={0} style={inputStyle}
                value={form.reward_coins}
                onChange={e => setForm(f => ({ ...f, reward_coins: Number(e.target.value) }))}
              />
            </div>

            {/* Required */}
            <div>
              <label className="text-xs text-white/40 block mb-1">Participantes necessários</label>
              <input
                type="number" min={1} style={inputStyle}
                value={form.required}
                onChange={e => setForm(f => ({ ...f, required: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs text-white/40 block mb-1">Prazo (dias, opcional)</label>
              <input
                type="number" min={1} style={inputStyle}
                placeholder="Ex: 7"
                value={form.deadline_days}
                onChange={e => setForm(f => ({ ...f, deadline_days: e.target.value === "" ? "" : Number(e.target.value) }))}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="flex-1 py-2 rounded-lg text-white/40 text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={isSaving || !form.title.trim()}
                className="flex-1 btn-cyber justify-center"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-10">
          <Loader2 size={24} className="animate-spin mx-auto text-purple-400" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && missions.length === 0 && (
        <div className="holo-panel text-center py-10 text-white/30">
          <p className="text-4xl mb-3">🛡️</p>
          <p className="text-sm">Nenhuma missão de guilda criada ainda.</p>
          <p className="text-xs mt-1 opacity-60">Crie missões cooperativas para as guildas completarem juntas.</p>
        </div>
      )}

      {/* Active missions */}
      {!isLoading && active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
            Ativas — {active.length}
          </p>
          {active.map(m => <MissionCard key={m.id} m={m} expanded={expanded} setExpanded={setExpanded} onToggle={toggleActive} onDelete={deleteMission} />)}
        </div>
      )}

      {/* Inactive missions */}
      {!isLoading && inactive.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mt-2">
            Inativas — {inactive.length}
          </p>
          {inactive.map(m => <MissionCard key={m.id} m={m} expanded={expanded} setExpanded={setExpanded} onToggle={toggleActive} onDelete={deleteMission} />)}
        </div>
      )}
    </div>
  );
}

/* ── Mission card ────────────────────────────────────────────────────────────── */
function MissionCard({
  m, expanded, setExpanded, onToggle, onDelete,
}: {
  m: GuildMissionRow;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  onToggle: (m: GuildMissionRow) => void;
  onDelete: (id: string) => void;
}) {
  const isOpen = expanded === m.id;
  const dc = DIFF_COLORS[m.difficulty];

  return (
    <div
      className="holo-panel"
      style={{ opacity: m.is_active ? 1 : 0.55 }}
    >
      <div className="flex items-center gap-3">
        {/* Difficulty badge */}
        <span
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: dc.color, background: dc.bg, border: `1px solid ${dc.border}`,
            borderRadius: 4, padding: "2px 7px", flexShrink: 0,
          }}
        >
          {DIFF_LABELS[m.difficulty]}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-white truncate" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            {m.title}
          </p>
          <p className="text-xs text-white/30">
            ✨ {m.reward_xp} XP · 🪙 {m.reward_coins} moedas · {m.required} participantes
            {m.deadline_days ? ` · ${m.deadline_days}d` : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(isOpen ? null : m.id)}
            className="p-1.5 rounded text-white/30 hover:text-white/60 transition-colors"
            title="Ver detalhes"
          >
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onToggle(m)}
            className="p-1.5 rounded transition-colors"
            style={{ color: m.is_active ? "#a78bfa" : "rgba(255,255,255,0.2)" }}
            title={m.is_active ? "Desativar" : "Ativar"}
          >
            {m.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
          <button
            onClick={() => onDelete(m.id)}
            className="p-1.5 rounded text-red-400/30 hover:text-red-400 transition-colors"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded description */}
      {isOpen && m.description && (
        <div
          className="mt-3 pt-3 text-sm text-white/50"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {m.description}
        </div>
      )}
    </div>
  );
}
