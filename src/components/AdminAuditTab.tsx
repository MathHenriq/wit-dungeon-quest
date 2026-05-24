// Patch 9.1 — Audit log viewer for the master panel.
//
// Reads via get_audit_log_page (filters + pagination) and surfaces
// anomalies from get_audit_alerts. The detail modal shows before / after
// state side-by-side when present, falling back to the payload.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2, RefreshCw, Search, AlertTriangle, Info,
  ChevronLeft, ChevronRight, X, FileSearch,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LogRow {
  id: number;
  actor_user_id: string | null;
  actor_role: string;
  actor_name: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  target_label: string | null;
  payload: Record<string, unknown> | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
  total_count?: number;
}

interface Alert {
  kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  count: number;
  actor_name: string | null;
  last_seen: string;
  sample_id: number;
}

const PAGE_SIZE = 25;

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
const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.9)", outline: "none",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%",
};

export function AdminAuditTab() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [actorRole, setActorRole] = useState("");
  const [action, setAction] = useState("");
  const [targetTable, setTargetTable] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<LogRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_audit_log_page", {
      p_actor_role:   actorRole || null,
      p_action:       action || null,
      p_target_table: targetTable || null,
      p_from:         from ? new Date(from).toISOString() : null,
      p_to:           to   ? new Date(to).toISOString()   : null,
      p_search:       search || null,
      p_limit:        PAGE_SIZE,
      p_offset:       page * PAGE_SIZE,
    });
    if (error) { toast.error("Falha", { description: error.message }); setRows([]); setTotal(0); }
    else {
      const list = (data ?? []) as LogRow[];
      setRows(list);
      setTotal(list[0]?.total_count ?? 0);
    }
    setLoading(false);
  }, [search, actorRole, action, targetTable, from, to, page]);

  const loadAlerts = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_audit_alerts");
    if (error) return;
    setAlerts((data ?? []) as Alert[]);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadAlerts(); const id = setInterval(loadAlerts, 60_000); return () => clearInterval(id); }, [loadAlerts]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div style={{ ...card, marginTop: 12 }}>
      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {alerts.map((a, i) => (
            <div key={`${a.kind}-${i}`} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8,
              background: a.severity === "warning" ? "rgba(240,80,80,0.10)" : "rgba(245,200,75,0.08)",
              border: `1px solid ${a.severity === "warning" ? "rgba(240,80,80,0.4)" : "rgba(245,200,75,0.3)"}`,
              color: a.severity === "warning" ? "#fda4a4" : "#fde68a",
              fontSize: 12,
            }}>
              {a.severity === "warning" ? <AlertTriangle size={14} /> : <Info size={14} />}
              <strong style={{ marginRight: 6 }}>{a.title}</strong>
              <span style={{ flex: 1, opacity: 0.85 }}>{a.detail}</span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", opacity: 0.6, fontSize: 10 }}>
                {new Date(a.last_seen).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 12 }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: 11, opacity: 0.5 }} />
          <input
            placeholder="Buscar (ação, ator ou alvo)…"
            value={search} onChange={e => { setPage(0); setSearch(e.target.value); }}
            style={{ ...input, paddingLeft: 30 }}
          />
        </div>
        <select value={actorRole} onChange={e => { setPage(0); setActorRole(e.target.value); }} style={input}>
          <option value="">Papel: Todos</option>
          <option value="admin">Admin</option>
          <option value="teacher">Professor</option>
          <option value="student">Aluno</option>
          <option value="system">Sistema</option>
        </select>
        <input placeholder="Ação contém…"   value={action}      onChange={e => { setPage(0); setAction(e.target.value); }} style={input} />
        <input placeholder="Tabela alvo"    value={targetTable} onChange={e => { setPage(0); setTargetTable(e.target.value); }} style={input} />
        <input type="datetime-local" placeholder="De"  value={from} onChange={e => { setPage(0); setFrom(e.target.value); }} style={input} />
        <input type="datetime-local" placeholder="Até" value={to}   onChange={e => { setPage(0); setTo(e.target.value);   }} style={input} />
        <button onClick={() => void load()} style={btnBase} title="Recarregar">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 className="animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          Nenhum registro nessa combinação de filtros.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase" }}>
                <th style={{ padding: "8px 10px" }}>Quando</th>
                <th style={{ padding: "8px 10px" }}>Ator</th>
                <th style={{ padding: "8px 10px" }}>Ação</th>
                <th style={{ padding: "8px 10px" }}>Alvo</th>
                <th style={{ padding: "8px 10px" }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: 10, fontFamily: "'Share Tech Mono', monospace", whiteSpace: "nowrap" }}>
                    {new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: 10 }}>
                    <span style={{
                      display: "inline-block", marginRight: 6, padding: "1px 6px",
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                      borderRadius: 4,
                      background: roleColor(r.actor_role)[0],
                      color: roleColor(r.actor_role)[1],
                    }}>{r.actor_role.toUpperCase()}</span>
                    <span style={{ fontWeight: 600 }}>{r.actor_name ?? "—"}</span>
                  </td>
                  <td style={{ padding: 10, fontFamily: "'Share Tech Mono', monospace", color: "#cfe7ff" }}>{r.action}</td>
                  <td style={{ padding: 10 }}>
                    {r.target_label ? <strong>{r.target_label}</strong> : <span style={{ opacity: 0.5 }}>—</span>}
                    {r.target_table && <div style={{ fontSize: 10, opacity: 0.5 }}>{r.target_table}</div>}
                  </td>
                  <td style={{ padding: 10 }}>
                    <button onClick={() => setDetail(r)} style={{ ...btnBase, fontSize: 11 }}>
                      <FileSearch size={12} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 11, opacity: 0.55 }}>
          {total > 0 ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} de ${total}` : "—"}
        </span>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={btnBase}>
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages} style={btnBase}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Detail modal */}
      {detail && <DetailModal row={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function roleColor(role: string): [string, string] {
  switch (role) {
    case "admin":   return ["rgba(245,200,75,0.18)", "#f5c84b"];
    case "teacher": return ["rgba(96,200,248,0.18)", "#60c8f8"];
    case "student": return ["rgba(74,222,128,0.18)", "#4ade80"];
    case "system":  return ["rgba(148,163,184,0.18)", "#94a3b8"];
    default:        return ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.65)"];
  }
}

function DetailModal({ row, onClose }: { row: LogRow; onClose: () => void }) {
  const hasStates = row.before_state || row.after_state;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ ...card, width: 720, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", background: "rgba(15,15,22,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Detalhe do evento</h3>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, opacity: 0.6, marginTop: 2 }}>
              #{row.id} · {new Date(row.created_at).toLocaleString("pt-BR")}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <Info label="Ação" value={row.action} mono />
          <Info label="Ator" value={`${row.actor_name ?? "—"} (${row.actor_role})`} />
          <Info label="Tabela alvo" value={row.target_table ?? "—"} />
          <Info label="Alvo"        value={row.target_label ?? "—"} />
        </div>

        {hasStates ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StateBox title="ANTES" value={row.before_state} tone="#f87171" />
            <StateBox title="DEPOIS" value={row.after_state} tone="#4ade80" />
          </div>
        ) : (
          <StateBox title="PAYLOAD" value={row.payload} tone="#60c8f8" />
        )}
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: mono ? "'Share Tech Mono', monospace" : "inherit", color: "#fff" }}>{value}</div>
    </div>
  );
}

function StateBox({ title, value, tone }: { title: string; value: unknown; tone: string }) {
  return (
    <div style={{
      padding: 10, borderRadius: 8,
      background: "rgba(0,0,0,0.4)",
      border: `1px solid ${tone}44`,
    }}>
      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: tone, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <pre style={{
        margin: 0, padding: 0, fontSize: 11,
        fontFamily: "'Share Tech Mono', monospace",
        color: "rgba(255,255,255,0.85)",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        maxHeight: 320, overflow: "auto",
      }}>
        {value ? JSON.stringify(value, null, 2) : "(vazio)"}
      </pre>
    </div>
  );
}
