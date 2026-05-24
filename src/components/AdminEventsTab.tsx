// Patch 5.1 — Master/admin: Events management.
//
// CRUD-ish UI:
//   • Create event (name, theme, description, dates, banner, color).
//   • List events with status pill (draft / scheduled / active / ended / cancelled).
//   • Manual Start / End / Cancel actions per status.
//   • Click row → detail drawer (cards + chests linked).

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Plus, X, Play, StopCircle, Ban, Calendar, Trash2, Package, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EventRow {
  id: string;
  name: string;
  theme: string | null;
  status: "draft" | "scheduled" | "active" | "ended" | "cancelled";
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  card_count: number;
  chest_count: number;
}

interface EventDetail {
  event: {
    id: string; name: string; theme: string | null; description: string | null;
    banner_image_url: string | null; color_primary: string | null;
    starts_at: string | null; ends_at: string | null; status: string;
    created_at: string;
    event_boss_id?: string | null;
  };
  cards: Array<{ id: string; name: string; rarity: string | null; image_url: string | null; migrated_to_pool: boolean }>;
  chests: Array<{ id: string; chest_key: string | null; name: string; tier: number }>;
  boss?: { id: string; name: string; sprite_url: string | null; hp_max: number } | null;
}

const STATUS_PILL: Record<string, [string, string]> = {
  draft:     ["rgba(160,160,180,0.15)", "rgb(180,180,200)"],
  scheduled: ["rgba(80,160,255,0.15)",  "rgb(160,200,255)"],
  active:    ["rgba(74,222,128,0.18)",  "rgb(120,240,160)"],
  ended:     ["rgba(220,180,40,0.12)",  "rgb(255,220,140)"],
  cancelled: ["rgba(220,80,80,0.12)",   "rgb(255,160,160)"],
};

const card: React.CSSProperties = {
  background: "rgba(20,20,28,0.7)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, padding: 16, color: "rgba(255,255,255,0.9)",
};
const btnBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 10px", borderRadius: 6,
  fontSize: 12, fontWeight: 500, cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)",
};
const btnPrimary: React.CSSProperties = { ...btnBase, background: "rgba(80,160,255,0.15)", borderColor: "rgba(80,160,255,0.4)", color: "rgb(160,200,255)" };
const btnSuccess: React.CSSProperties = { ...btnBase, background: "rgba(74,222,128,0.15)", borderColor: "rgba(74,222,128,0.4)", color: "rgb(120,240,160)" };
const btnDanger:  React.CSSProperties = { ...btnBase, background: "rgba(220,80,80,0.15)", borderColor: "rgba(220,80,80,0.4)",  color: "rgb(255,160,160)" };
const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.9)", outline: "none",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%",
};

function pill(status: string): React.CSSProperties {
  const [bg, fg] = STATUS_PILL[status] ?? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.7)"];
  return { background: bg, color: fg, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, display: "inline-block", textTransform: "uppercase", letterSpacing: "0.05em" };
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function AdminEventsTab() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "scheduled" | "draft" | "ended">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [detail, setDetail] = useState<EventDetail | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_events_admin");
    if (error) { toast.error("Falha ao carregar eventos", { description: error.message }); setRows([]); }
    else setRows((data ?? []) as EventRow[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  const filtered = filter === "all" ? rows : rows.filter(r => r.status === filter);

  async function callRpc(fn: string, params: Record<string, unknown>, successMsg: string, id: string) {
    setActing(id);
    const { data, error } = await supabase.rpc(fn, params);
    setActing(null);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const result = data as { success?: boolean; error?: string };
    if (result && result.success === false) { toast.error(result.error ?? "Erro"); return; }
    toast.success(successMsg);
    await load();
  }

  async function loadDetail(id: string) {
    const { data, error } = await supabase.rpc("get_event_detail", { p_event_id: id });
    if (error) { toast.error("Falha", { description: error.message }); return; }
    setDetail(data as EventDetail);
  }

  return (
    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "active", "scheduled", "draft", "ended"] as const).map(f => {
            const count = f === "all" ? rows.length : (counts[f] ?? 0);
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...btnBase,
                  background: active ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                  borderColor: active ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)",
                  color: active ? "rgb(245,200,75)" : "rgba(255,255,255,0.7)",
                }}
              >
                {f === "all" ? "Todos" : f === "scheduled" ? "Agendados" : f === "draft" ? "Rascunho" : f === "active" ? "Ativos" : "Encerrados"} ({count})
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary, marginLeft: "auto" }}>
          <Plus size={14} /> Novo evento
        </button>
        <button onClick={() => void load()} style={btnBase}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recarregar
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          Nenhum evento {filter === "all" ? "registrado" : `com status ${filter}`}.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase" }}>
                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Status</th>
                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Nome</th>
                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Tema</th>
                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Início</th>
                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Fim</th>
                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Cartas</th>
                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Baús</th>
                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} onClick={() => void loadDetail(r.id)}>
                  <td style={{ padding: 10 }}><span style={pill(r.status)}>{r.status}</span></td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: 10, opacity: 0.7 }}>{r.theme ?? "—"}</td>
                  <td style={{ padding: 10 }}>{fmt(r.starts_at)}</td>
                  <td style={{ padding: 10 }}>{fmt(r.ends_at)}</td>
                  <td style={{ padding: 10, fontFamily: "'Share Tech Mono', monospace" }}>{r.card_count}</td>
                  <td style={{ padding: 10, fontFamily: "'Share Tech Mono', monospace" }}>{r.chest_count}</td>
                  <td style={{ padding: 10 }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(r.status === "draft" || r.status === "scheduled") && (
                        <button onClick={() => callRpc("start_event", { p_event_id: r.id }, "Evento iniciado", r.id)} disabled={acting === r.id} style={{ ...btnSuccess, fontSize: 11 }}>
                          {acting === r.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={11} />} Iniciar
                        </button>
                      )}
                      {r.status === "active" && (
                        <button onClick={() => callRpc("end_event", { p_event_id: r.id }, "Evento encerrado e cartas migradas", r.id)} disabled={acting === r.id} style={{ ...btnDanger, fontSize: 11 }}>
                          {acting === r.id ? <Loader2 size={12} className="animate-spin" /> : <StopCircle size={11} />} Encerrar
                        </button>
                      )}
                      {(r.status === "draft" || r.status === "scheduled") && (
                        <button onClick={() => callRpc("cancel_event", { p_event_id: r.id }, "Evento cancelado", r.id)} disabled={acting === r.id} style={{ ...btnBase, fontSize: 11 }}>
                          <Ban size={11} /> Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); void load(); }}
        />
      )}

      {detail && (
        <EventDetailDrawer detail={detail} onClose={() => setDetail(null)} onChanged={() => void load()} />
      )}
    </div>
  );
}

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [color, setColor] = useState("#f59e0b");
  const [bannerUrl, setBannerUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("create_event", {
      p_name: name.trim(),
      p_theme: theme.trim() || null,
      p_description: description.trim() || null,
      p_starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      p_ends_at:   endsAt   ? new Date(endsAt).toISOString()   : null,
      p_banner_url: bannerUrl.trim() || null,
      p_color: color || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const result = data as { success: boolean; error?: string; status?: string };
    if (!result?.success) { toast.error(result?.error ?? "Erro"); return; }
    toast.success(`Evento criado (status: ${result.status ?? "draft"})`);
    onCreated();
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ ...card, width: 520, maxWidth: "100%", background: "rgba(15,15,22,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Calendar size={16} /> Novo evento
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field label="Nome *"><input value={name} onChange={e => setName(e.target.value)} style={input} /></Field>
          <Field label="Tema"><input value={theme} onChange={e => setTheme(e.target.value)} placeholder="ex.: Inverno, Halloween, Aniversário" style={input} /></Field>
          <Field label="Descrição">
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...input, resize: "vertical", fontFamily: "inherit" }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Início (opcional)"><input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} style={input} /></Field>
            <Field label="Fim (opcional)"><input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} style={input} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10 }}>
            <Field label="Cor"><input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ ...input, padding: 4, height: 38 }} /></Field>
            <Field label="Banner URL"><input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." style={input} /></Field>
          </div>
          <p style={{ fontSize: 11, opacity: 0.55, margin: "4px 0 0" }}>
            Deixar datas em branco cria um rascunho. Definir <strong>Início</strong> agenda o evento (cron inicia automaticamente). Você sempre pode iniciar/encerrar manualmente.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
          <button onClick={onClose} disabled={submitting} style={btnBase}>Cancelar</button>
          <button onClick={submit} disabled={submitting} style={btnPrimary}>
            {submitting ? <><Loader2 size={12} className="animate-spin" /> Criando...</> : <><Plus size={12} /> Criar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  );
}

interface EventMissionRow {
  id: string; title: string; description: string | null;
  condition_type: string | null; condition_target: number | null; condition_payload: Record<string, unknown> | null;
  reward: number; reward_diamonds: number; reward_fragments: number; reward_chest_key: string | null;
  is_active: boolean;
}

function EventDetailDrawer({ detail, onClose, onChanged }: { detail: EventDetail; onClose: () => void; onChanged?: () => void }) {
  const e = detail.event;
  const [showAddChest, setShowAddChest] = useState(false);
  const [showAddMission, setShowAddMission] = useState(false);
  const [chests, setChests] = useState(detail.chests);
  const [missions, setMissions] = useState<EventMissionRow[]>([]);
  useEffect(() => { setChests(detail.chests); }, [detail.chests]);
  useEffect(() => { void refreshMissions(); }, [e.id]);

  async function refreshDetail() {
    const { data } = await supabase.rpc("get_event_detail", { p_event_id: e.id });
    if (data) setChests((data as EventDetail).chests);
    onChanged?.();
  }

  async function refreshMissions() {
    const { data } = await supabase.rpc("list_event_missions", { p_event_id: e.id });
    if (data) setMissions(data as EventMissionRow[]);
  }

  // Patch 7.2: thematic boss picker.
  const [bosses, setBosses] = useState<Array<{ id: string; name: string }>>([]);
  const [savingBoss, setSavingBoss] = useState(false);
  useEffect(() => {
    void supabase.from("enemies")
      .select("id, name")
      .eq("is_boss", true)
      .order("name")
      .then(({ data }) => setBosses((data ?? []) as Array<{ id: string; name: string }>));
  }, []);
  async function setBoss(bossId: string | null) {
    setSavingBoss(true);
    const { data, error } = await supabase.rpc("master_set_event_boss", { p_event_id: e.id, p_boss_id: bossId });
    setSavingBoss(false);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const r = data as { success: boolean; error?: string };
    if (!r?.success) { toast.error(r?.error ?? "Erro"); return; }
    toast.success(bossId ? "Boss do evento atualizado" : "Boss removido");
    onChanged?.();
  }
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-start", justifyContent: "flex-end", zIndex: 60, padding: 20,
    }}>
      <div onClick={ev => ev.stopPropagation()} style={{ ...card, width: 560, maxWidth: "100%", height: "calc(100vh - 40px)", overflowY: "auto", background: "rgba(15,15,22,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={pill(e.status)}>{e.status}</span>
            <h3 style={{ margin: 0, fontSize: 18 }}>{e.name}</h3>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        {e.theme && <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>{e.theme}</div>}
        {e.description && <p style={{ fontSize: 13, lineHeight: 1.55, opacity: 0.8, margin: "6px 0 14px" }}>{e.description}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, marginBottom: 16 }}>
          <Info label="Início programado" value={fmt(e.starts_at)} />
          <Info label="Fim programado"    value={fmt(e.ends_at)} />
          <Info label="Iniciado em"       value={fmt(detail.event.starts_at)} />
          <Info label="Criado em"         value={fmt(detail.event.created_at)} />
        </div>

        {/* Patch 7.2: thematic boss for guild raid spawning on event start. */}
        <div style={{ marginBottom: 16, padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6, marginBottom: 4 }}>
            Boss temático (spawn em todas as guildas ao iniciar)
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select
              value={e.event_boss_id ?? ""}
              onChange={ev => void setBoss(ev.target.value || null)}
              disabled={savingBoss}
              style={{ ...input, fontSize: 12 }}
            >
              <option value="">— Boss mensal rotativo (padrão) —</option>
              {bosses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {savingBoss && <Loader2 size={12} className="animate-spin" />}
          </div>
          {detail.boss && (
            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.6, display: "inline-flex", alignItems: "center", gap: 6 }}>
              Atual: <strong>{detail.boss.name}</strong> · HP base {detail.boss.hp_max}
            </div>
          )}
        </div>

        <h4 style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
          Cartas exclusivas ({detail.cards.length})
        </h4>
        {detail.cards.length === 0 ? (
          <div style={{ opacity: 0.4, fontSize: 12, marginBottom: 16 }}>Nenhuma carta vinculada.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
            {detail.cards.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: 6, fontSize: 12 }}>
                <span>{c.name} <span style={{ opacity: 0.4, fontSize: 10 }}>{c.rarity}</span></span>
                <span style={{ fontSize: 10, color: c.migrated_to_pool ? "#4ade80" : "#fbbf24" }}>
                  {c.migrated_to_pool ? "MIGRADA AO POOL" : "EXCLUSIVA"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", margin: "0 0 8px" }}>
          <h4 style={{ flex: 1, margin: 0, fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Baús temáticos ({chests.length})
          </h4>
          <button onClick={() => setShowAddChest(true)} style={{ ...btnPrimary, fontSize: 11, padding: "4px 8px" }}>
            <Package size={11} /> + Baú
          </button>
        </div>
        {chests.length === 0 ? (
          <div style={{ opacity: 0.4, fontSize: 12 }}>Nenhum baú vinculado.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {chests.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: 6, fontSize: 12 }}>
                <span>{c.name}</span>
                <span style={{ opacity: 0.5, fontSize: 10 }}>tier {c.tier}</span>
              </div>
            ))}
          </div>
        )}

        {/* Patch 5.4: event missions */}
        <div style={{ display: "flex", alignItems: "center", margin: "18px 0 8px" }}>
          <h4 style={{ flex: 1, margin: 0, fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Missões ({missions.length})
          </h4>
          <button onClick={() => setShowAddMission(true)} style={{ ...btnPrimary, fontSize: 11, padding: "4px 8px" }}>
            <ScrollText size={11} /> + Missão
          </button>
        </div>
        {missions.length === 0 ? (
          <div style={{ opacity: 0.4, fontSize: 12 }}>Nenhuma missão vinculada.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {missions.map(m => (
              <div key={m.id} style={{ padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: 6, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600 }}>{m.title}</span>
                  <span style={{ opacity: 0.5, fontSize: 10 }}>
                    {m.condition_type} ≥ {m.condition_target}
                  </span>
                </div>
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>
                  Recompensa: {m.reward}🪙
                  {m.reward_diamonds > 0  ? ` ${m.reward_diamonds}💎` : ""}
                  {m.reward_fragments > 0 ? ` ${m.reward_fragments}✦` : ""}
                  {m.reward_chest_key     ? ` baú:${m.reward_chest_key}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddChest && (
          <AddEventChestModal
            eventId={e.id}
            eventCards={detail.cards.map(c => ({ id: c.id, name: c.name, rarity: c.rarity }))}
            onClose={() => setShowAddChest(false)}
            onCreated={() => { setShowAddChest(false); void refreshDetail(); }}
          />
        )}

        {showAddMission && (
          <AddEventMissionModal
            eventId={e.id}
            onClose={() => setShowAddMission(false)}
            onCreated={() => { setShowAddMission(false); void refreshMissions(); }}
          />
        )}
      </div>
    </div>
  );
}

function AddEventMissionModal({
  eventId, onClose, onCreated,
}: {
  eventId: string; onClose: () => void; onCreated: () => void;
}) {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [condType, setCondType]       = useState<"battles_won" | "bosses_defeated" | "event_chests_opened" | "floor_reached" | "card_obtained">("battles_won");
  const [target, setTarget]           = useState(10);
  const [shopItemId, setShopItemId]   = useState("");
  const [rwCoins, setRwCoins]         = useState(100);
  const [rwDiamonds, setRwDiamonds]   = useState(0);
  const [rwFragments, setRwFragments] = useState(0);
  const [rwChestKey, setRwChestKey]   = useState("");
  const [submitting, setSubmitting]   = useState(false);

  async function submit() {
    if (!title.trim()) { toast.error("Título obrigatório"); return; }
    if (target <= 0) { toast.error("Target precisa ser > 0"); return; }
    if (condType === "card_obtained" && !shopItemId.trim()) {
      toast.error("Para 'card_obtained' informe o shop_item_id"); return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("master_upsert_event_mission", {
      p_event_id: eventId,
      p_title: title.trim(),
      p_description: description.trim() || null,
      p_condition_type: condType,
      p_condition_target: target,
      p_condition_payload: condType === "card_obtained" ? { shop_item_id: shopItemId.trim() } : null,
      p_reward_coins: rwCoins,
      p_reward_diamonds: rwDiamonds,
      p_reward_fragments: rwFragments,
      p_reward_chest_key: rwChestKey.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const r = data as { success: boolean; error?: string };
    if (!r?.success) { toast.error(r?.error ?? "Erro"); return; }
    toast.success(`Missão "${title}" criada`);
    onCreated();
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20,
    }}>
      <div onClick={ev => ev.stopPropagation()} style={{ ...card, width: 520, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", background: "rgba(15,15,22,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ScrollText size={16} /> Nova missão do evento
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field label="Título *"><input value={title} onChange={ev => setTitle(ev.target.value)} style={input} placeholder="Caçador de Inverno" /></Field>
          <Field label="Descrição">
            <textarea value={description} onChange={ev => setDescription(ev.target.value)} rows={2} style={{ ...input, resize: "vertical", fontFamily: "inherit" }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10 }}>
            <Field label="Condição">
              <select value={condType} onChange={ev => setCondType(ev.target.value as typeof condType)} style={input}>
                <option value="battles_won">Vencer N batalhas</option>
                <option value="bosses_defeated">Derrotar N bosses</option>
                <option value="event_chests_opened">Abrir N baús do evento</option>
                <option value="floor_reached">Atingir andar N</option>
                <option value="card_obtained">Obter carta específica</option>
              </select>
            </Field>
            <Field label="Target">
              <input type="number" min={1} value={target} onChange={ev => setTarget(Math.max(1, Number(ev.target.value) || 1))} style={input} />
            </Field>
          </div>
          {condType === "card_obtained" && (
            <Field label="shop_item_id (UUID da carta)">
              <input value={shopItemId} onChange={ev => setShopItemId(ev.target.value)} style={input} placeholder="00000000-0000-0000-0000-000000000000" />
            </Field>
          )}
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Recompensa:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <Field label="Moedas">
              <input type="number" min={0} value={rwCoins} onChange={ev => setRwCoins(Math.max(0, Number(ev.target.value) || 0))} style={input} />
            </Field>
            <Field label="Diamantes">
              <input type="number" min={0} value={rwDiamonds} onChange={ev => setRwDiamonds(Math.max(0, Number(ev.target.value) || 0))} style={input} />
            </Field>
            <Field label="Fragmentos">
              <input type="number" min={0} value={rwFragments} onChange={ev => setRwFragments(Math.max(0, Number(ev.target.value) || 0))} style={input} />
            </Field>
          </div>
          <Field label="chest_key opcional (ex: global_rare)">
            <input value={rwChestKey} onChange={ev => setRwChestKey(ev.target.value)} style={input} placeholder="global_rare" />
          </Field>
          <p style={{ fontSize: 11, opacity: 0.55, margin: "4px 0 0" }}>
            Auto-completa quando o aluno atinge o target. Recompensa entra no inventário/saldo + notificação no próximo login.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
          <button onClick={onClose} disabled={submitting} style={btnBase}>Cancelar</button>
          <button onClick={submit} disabled={submitting} style={btnPrimary}>
            {submitting ? <><Loader2 size={12} className="animate-spin" /> Salvando...</> : <><Plus size={12} /> Criar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddEventChestModal({
  eventId, eventCards, onClose, onCreated,
}: {
  eventId: string;
  eventCards: Array<{ id: string; name: string; rarity: string | null }>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [chestKey, setChestKey] = useState("");
  const [tier, setTier] = useState(3);
  const [costCoins, setCostCoins] = useState(0);
  const [costDiamonds, setCostDiamonds] = useState(0);
  const [description, setDescription] = useState("");
  const [poolWeights, setPoolWeights] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  function toggleCard(id: string, defaultWeight = 1) {
    setPoolWeights(prev => {
      const next = { ...prev };
      if (id in next) delete next[id]; else next[id] = defaultWeight;
      return next;
    });
  }

  async function submit() {
    if (!name.trim() || !chestKey.trim()) { toast.error("Nome e chest_key obrigatórios"); return; }
    const cardPool = Object.entries(poolWeights)
      .filter(([, w]) => w > 0)
      .map(([shop_item_id, weight]) => ({ shop_item_id, weight }));

    setSubmitting(true);
    const { data, error } = await supabase.rpc("master_upsert_event_chest", {
      p_event_id: eventId,
      p_chest_key: chestKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      p_name: name.trim(),
      p_tier: tier,
      p_cost_coins: costCoins,
      p_cost_diamonds: costDiamonds,
      p_min_level: 1,
      p_description: description.trim() || null,
      p_card_pool: cardPool.length > 0 ? cardPool : null,
    });
    setSubmitting(false);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const r = data as { success: boolean; error?: string };
    if (!r?.success) { toast.error(r?.error ?? "Erro"); return; }
    toast.success(`Baú "${name}" criado/atualizado`);
    onCreated();
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20,
    }}>
      <div onClick={ev => ev.stopPropagation()} style={{ ...card, width: 540, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", background: "rgba(15,15,22,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Package size={16} /> Novo baú do evento
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field label="Nome *"><input value={name} onChange={ev => setName(ev.target.value)} style={input} placeholder="Baú do Inverno" /></Field>
          <Field label="chest_key * (único, sem espaços)">
            <input value={chestKey} onChange={ev => setChestKey(ev.target.value)} style={input} placeholder="winter_event_chest" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: 10 }}>
            <Field label="Tier (1-5)">
              <input type="number" min={1} max={5} value={tier} onChange={ev => setTier(Math.max(1, Math.min(5, Number(ev.target.value) || 1)))} style={input} />
            </Field>
            <Field label="Custo moedas">
              <input type="number" min={0} value={costCoins} onChange={ev => setCostCoins(Math.max(0, Number(ev.target.value) || 0))} style={input} />
            </Field>
            <Field label="Custo diamantes">
              <input type="number" min={0} value={costDiamonds} onChange={ev => setCostDiamonds(Math.max(0, Number(ev.target.value) || 0))} style={input} />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea value={description} onChange={ev => setDescription(ev.target.value)} rows={2} style={{ ...input, resize: "vertical", fontFamily: "inherit" }} />
          </Field>

          <div>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
              Pool de cartas (deixe vazio para usar pool por raridade padrão)
            </div>
            {eventCards.length === 0 ? (
              <div style={{ opacity: 0.4, fontSize: 12, padding: 8 }}>
                Anexe cartas ao evento primeiro (no painel de itens). Sem pool customizado, o baú usa pool por raridade.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {eventCards.map(c => {
                  const checked = c.id in poolWeights;
                  return (
                    <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: 6, background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCard(c.id)} />
                      <div style={{ flex: 1, fontSize: 12 }}>
                        {c.name} <span style={{ opacity: 0.4, fontSize: 10 }}>{c.rarity}</span>
                      </div>
                      {checked && (
                        <input
                          type="number" min={1} value={poolWeights[c.id]}
                          onChange={ev => setPoolWeights(prev => ({ ...prev, [c.id]: Math.max(1, Number(ev.target.value) || 1) }))}
                          style={{ ...input, width: 70, padding: "4px 8px" }}
                          placeholder="peso"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, opacity: 0.55, margin: "4px 0 0" }}>
            O baú aparece para alunos apenas enquanto o evento está ativo. Editar com a mesma chest_key sobrescreve.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
          <button onClick={onClose} disabled={submitting} style={btnBase}>Cancelar</button>
          <button onClick={submit} disabled={submitting} style={btnPrimary}>
            {submitting ? <><Loader2 size={12} className="animate-spin" /> Salvando...</> : <><Plus size={12} /> Criar baú</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5 }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}
