// Patch 7.1 — Master/admin: spawn a Guild Boss Raid.
//
// Two pieces:
//   • Form to create a raid (pick guild + boss + duration).
//   • Active raids table with HP bar + member contribs.
//   • Lifecycle row actions: nothing fancy yet — cron expires by ends_at,
//     killshots flip to 'defeated' atomically server-side.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Plus, X, Skull, Sword } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GuildLite { id: string; name: string; teacher_id: string; member_count?: number }
interface BossLite  { id: string; name: string; hp_max: number; sprite_url: string | null }
interface RaidRow {
  id: string;
  guild_id: string;
  guild_name: string;
  boss_name: string;
  total_hp: number;
  current_hp: number;
  phase: number;
  status: "active" | "defeated" | "expired";
  starts_at: string;
  ends_at: string;
  contribs: number;
}

const card: React.CSSProperties = {
  background: "rgba(20,20,28,0.7)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, padding: 16, color: "rgba(255,255,255,0.9)",
};
const btnBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
  cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)",
};
const btnPrimary: React.CSSProperties = {
  ...btnBase, background: "rgba(80,160,255,0.15)", borderColor: "rgba(80,160,255,0.4)", color: "rgb(160,200,255)",
};
const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.9)", outline: "none",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%",
};

const STATUS_TONE: Record<string, string> = {
  active:   "#4ade80",
  defeated: "#fbbf24",
  expired:  "#94a3b8",
};

export function AdminRaidsTab() {
  const [rows, setRows] = useState<RaidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("boss_raids")
      .select(`
        id, guild_id, boss_name, total_hp, current_hp, phase, status, starts_at, ends_at,
        guilds!inner(name),
        boss_raid_contributions(student_id)
      `)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) { toast.error("Falha ao carregar raids", { description: error.message }); setLoading(false); return; }
    type Row = RaidRow & { guilds: { name: string }; boss_raid_contributions: Array<{ student_id: string }> };
    setRows(((data ?? []) as unknown as Row[]).map((r) => ({
      id: r.id, guild_id: r.guild_id, boss_name: r.boss_name,
      total_hp: r.total_hp, current_hp: r.current_hp, phase: r.phase,
      status: r.status, starts_at: r.starts_at, ends_at: r.ends_at,
      guild_name: r.guilds?.name ?? "—",
      contribs: r.boss_raid_contributions?.length ?? 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Skull size={14} /> Boss Raids
        </h3>
        <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary, marginLeft: "auto" }}>
          <Plus size={14} /> Nova raid
        </button>
        <button onClick={() => void load()} style={btnBase}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recarregar
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 className="animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          Nenhuma raid registrada ainda.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase" }}>
                <th style={{ padding: "8px 10px" }}>Status</th>
                <th style={{ padding: "8px 10px" }}>Guilda</th>
                <th style={{ padding: "8px 10px" }}>Boss</th>
                <th style={{ padding: "8px 10px" }}>HP</th>
                <th style={{ padding: "8px 10px" }}>Fase</th>
                <th style={{ padding: "8px 10px" }}>Termina</th>
                <th style={{ padding: "8px 10px" }}>Atacantes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const pct = r.total_hp > 0 ? (r.current_hp / r.total_hp) * 100 : 0;
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: 10 }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                        color: STATUS_TONE[r.status],
                        background: `${STATUS_TONE[r.status]}22`,
                        border: `1px solid ${STATUS_TONE[r.status]}66`,
                        letterSpacing: "0.08em", textTransform: "uppercase",
                      }}>{r.status}</span>
                    </td>
                    <td style={{ padding: 10, fontWeight: 600 }}>{r.guild_name}</td>
                    <td style={{ padding: 10, opacity: 0.85 }}>{r.boss_name}</td>
                    <td style={{ padding: 10, fontFamily: "'Share Tech Mono', monospace" }}>
                      {r.current_hp.toLocaleString("pt-BR")} / {r.total_hp.toLocaleString("pt-BR")}
                      <div style={{ height: 4, marginTop: 4, borderRadius: 999, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #f05050, #fbbf24, #4ade80)", borderRadius: 999 }} />
                      </div>
                    </td>
                    <td style={{ padding: 10, fontFamily: "'Share Tech Mono', monospace" }}>{r.phase}</td>
                    <td style={{ padding: 10 }}>{new Date(r.ends_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td style={{ padding: 10, fontFamily: "'Share Tech Mono', monospace" }}>{r.contribs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateRaidModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); void load(); }}
        />
      )}
    </div>
  );
}

function CreateRaidModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [guilds, setGuilds] = useState<GuildLite[]>([]);
  const [bosses, setBosses] = useState<BossLite[]>([]);
  const [guildId, setGuildId] = useState<string>("");
  const [bossId,  setBossId]  = useState<string>("");
  const [hours,   setHours]   = useState(24);
  const [maxPer,  setMaxPer]  = useState(5);
  const [totalHpOverride, setTotalHpOverride] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const [g, b] = await Promise.all([
        supabase.from("guilds").select("id, name, teacher_id").order("name"),
        supabase.from("enemies").select("id, name, hp_max, sprite_url").eq("is_boss", true).order("name"),
      ]);
      setGuilds((g.data ?? []) as GuildLite[]);
      setBosses((b.data ?? []) as BossLite[]);
    })();
  }, []);

  const bossPreview = useMemo(() => bosses.find(b => b.id === bossId), [bosses, bossId]);

  async function submit() {
    if (!guildId || !bossId) { toast.error("Selecione guilda e boss"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("master_create_boss_raid", {
      p_guild_id: guildId,
      p_boss_id:  bossId,
      p_hours:    hours,
      p_total_hp: totalHpOverride ? Number(totalHpOverride) : null,
      p_max_per_member: maxPer,
    });
    setSubmitting(false);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const r = data as { success: boolean; error?: string; total_hp?: number };
    if (!r?.success) { toast.error(r?.error ?? "Erro"); return; }
    toast.success("Raid criada", { description: `HP total: ${r.total_hp}` });
    onCreated();
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20,
    }}>
      <div onClick={ev => ev.stopPropagation()} style={{ ...card, width: 520, maxWidth: "100%", background: "rgba(15,15,22,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Sword size={16} /> Nova boss raid
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Guilda *</div>
            <select value={guildId} onChange={e => setGuildId(e.target.value)} style={input}>
              <option value="">— escolha —</option>
              {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Boss *</div>
            <select value={bossId} onChange={e => setBossId(e.target.value)} style={input}>
              <option value="">— escolha —</option>
              {bosses.map(b => <option key={b.id} value={b.id}>{b.name} (HP {b.hp_max})</option>)}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Duração (horas)</div>
              <input type="number" min={1} max={168} value={hours} onChange={e => setHours(Math.max(1, Number(e.target.value) || 1))} style={input} />
            </label>
            <label>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Ataques/membro</div>
              <input type="number" min={1} max={20} value={maxPer} onChange={e => setMaxPer(Math.max(1, Number(e.target.value) || 1))} style={input} />
            </label>
            <label>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>HP total (auto se vazio)</div>
              <input type="number" min={0} value={totalHpOverride} placeholder="auto" onChange={e => setTotalHpOverride(e.target.value)} style={input} />
            </label>
          </div>
          {bossPreview && (
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>
              HP base do boss: <strong>{bossPreview.hp_max}</strong>. HP total auto = base × #membros × 8 (mínimo 2000).
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
          <button onClick={onClose} disabled={submitting} style={btnBase}>Cancelar</button>
          <button onClick={submit} disabled={submitting} style={btnPrimary}>
            {submitting ? <><Loader2 size={12} className="animate-spin" /> Criando…</> : <><Plus size={12} /> Criar raid</>}
          </button>
        </div>
      </div>
    </div>
  );
}
