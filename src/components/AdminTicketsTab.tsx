// Patch 4.2 — Master/admin panel: Creation Tickets management.
//
// Lists every creation ticket ever issued (across all teachers) with the
// pending ones first, and lets the master mark them as fulfilled.

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Ticket, Check, Hourglass, Crown, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminTicketRow {
  ticket_id: string;
  student_id: string;
  student_name: string;
  character_name: string | null;
  class_name: string | null;
  teacher_id: string;
  ranking_type: "sala" | "geral" | "pvp";
  week_start: string;
  granted_at: string;
  requested_at: string | null;
  used_at: string | null;
  status: "granted" | "pending" | "used";
}

const RANKING_LABEL: Record<string, string> = { sala: "Sala", geral: "Geral", pvp: "PvP" };
const RANKING_TONE:  Record<string, string> = { sala: "#60c8f8", geral: "#f5c84b", pvp: "#f05050" };

// Local style helpers mirroring AdminPanel.tsx so the tab feels native.
const card: React.CSSProperties = {
  background: "rgba(20,20,28,0.7)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, padding: 16,
  color: "rgba(255,255,255,0.9)",
};
const btnBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 10px", borderRadius: 6,
  fontSize: 12, fontWeight: 500, cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.85)",
};
const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "rgba(80,160,255,0.15)",
  borderColor: "rgba(80,160,255,0.4)",
  color: "rgb(160,200,255)",
};
const th: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px", verticalAlign: "top" };
const trStyle: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.04)" };
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.9)", outline: "none",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%",
};

function pillStyle(status: AdminTicketRow["status"]): React.CSSProperties {
  const palette: Record<AdminTicketRow["status"], [string, string]> = {
    pending: ["rgba(220,180,40,0.15)", "rgb(255,220,140)"],
    granted: ["rgba(80,160,255,0.15)", "rgb(160,200,255)"],
    used:    ["rgba(60,180,90,0.15)",  "rgb(140,230,170)"],
  };
  const [bg, fg] = palette[status];
  return {
    background: bg, color: fg,
    padding: "2px 8px", borderRadius: 999,
    fontSize: 11, fontWeight: 500,
    display: "inline-flex", alignItems: "center", gap: 4,
  };
}

export function AdminTicketsTab() {
  const [rows, setRows] = useState<AdminTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "granted" | "used" | "all">("pending");
  const [marking, setMarking] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<AdminTicketRow | null>(null);
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("master_list_pending_tickets");
    if (error) {
      toast.error("Falha ao carregar tickets", { description: error.message });
      setRows([]);
    } else {
      setRows((data ?? []) as AdminTicketRow[]);
    }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, granted: 0, used: 0 };
    rows.forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter(r => r.status === filter)),
    [rows, filter]
  );

  async function markUsed(ticketId: string, ticketNotes?: string) {
    setMarking(ticketId);
    const { data, error } = await supabase.rpc("master_mark_ticket_used", {
      p_ticket_id: ticketId,
      p_card_created_id: null,
      p_notes: ticketNotes ?? null,
    });
    setMarking(null);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const result = data as { success: boolean; error?: string };
    if (!result?.success) { toast.error(result?.error ?? "Erro desconhecido"); return; }
    toast.success("Ticket marcado como utilizado");
    setNotesFor(null);
    setNotes("");
    await load();
  }

  return (
    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["pending", "granted", "used", "all"] as const).map(f => {
            const count = f === "all" ? rows.length : (counts[f] ?? 0);
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...btnBase,
                  background: active ? "rgba(245,200,75,0.15)" : "rgba(255,255,255,0.04)",
                  borderColor: active ? "rgba(245,200,75,0.4)" : "rgba(255,255,255,0.08)",
                  color: active ? "rgb(245,200,75)" : "rgba(255,255,255,0.7)",
                }}
              >
                {f === "pending" ? "Solicitados" : f === "granted" ? "Concedidos" : f === "used" ? "Usados" : "Todos"} ({count})
              </button>
            );
          })}
        </div>
        <button onClick={() => void load()} style={{ ...btnBase, marginLeft: "auto" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recarregar
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          Nenhum ticket {filter === "pending" ? "solicitado" : filter === "granted" ? "concedido" : filter === "used" ? "usado" : "registrado"} no momento.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase" }}>
                <th style={th}>Status</th>
                <th style={th}>Aluno</th>
                <th style={th}>Turma</th>
                <th style={th}>Ranking</th>
                <th style={th}>Semana</th>
                <th style={th}>Solicitado</th>
                <th style={th}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.ticket_id} style={trStyle}>
                  <td style={td}>
                    <span style={pillStyle(r.status)}>
                      {r.status === "used"    ? <><Check size={11} /> Usado</> :
                       r.status === "pending" ? <><Hourglass size={11} /> Solicitado</> :
                                                <><Ticket size={11} /> Concedido</>}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{r.character_name || r.student_name}</div>
                    {r.character_name && (
                      <div style={{ fontSize: 10, opacity: 0.5 }}>{r.student_name}</div>
                    )}
                  </td>
                  <td style={td}>{r.class_name ?? "—"}</td>
                  <td style={td}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      color: RANKING_TONE[r.ranking_type], fontWeight: 700,
                    }}>
                      <Crown size={11} /> {RANKING_LABEL[r.ranking_type]}
                    </span>
                  </td>
                  <td style={td}>{new Date(r.week_start).toLocaleDateString("pt-BR")}</td>
                  <td style={td}>{r.requested_at ? new Date(r.requested_at).toLocaleString("pt-BR") : "—"}</td>
                  <td style={td}>
                    {r.status === "used" ? (
                      <span style={{ opacity: 0.5 }}>—</span>
                    ) : (
                      <button
                        onClick={() => { setNotesFor(r); setNotes(""); }}
                        disabled={marking === r.ticket_id}
                        style={{ ...btnPrimary, fontSize: 11 }}
                      >
                        {marking === r.ticket_id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Check size={12} />}
                        Confirmar uso
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {notesFor && (
        <div
          onClick={() => { if (!marking) { setNotesFor(null); setNotes(""); } }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              ...card, width: 480, maxWidth: "90vw",
              background: "rgba(15,15,22,0.97)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Confirmar uso do ticket</h3>
              <button onClick={() => { if (!marking) { setNotesFor(null); setNotes(""); } }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 13, opacity: 0.75, margin: "0 0 12px" }}>
              Marcar como utilizado significa que a sessão de criação aconteceu (ou foi resolvida) com{" "}
              <strong>{notesFor.character_name || notesFor.student_name}</strong>. Após confirmar, o aluno
              poderá ganhar outro ticket do mesmo ranking em semanas futuras.
            </p>
            <label style={{ fontSize: 11, opacity: 0.7, display: "block", marginBottom: 4 }}>Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex.: carta criada na sessão de 14/05"
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setNotesFor(null); setNotes(""); }}
                disabled={!!marking}
                style={btnBase}
              >Cancelar</button>
              <button
                onClick={() => markUsed(notesFor.ticket_id, notes.trim() || undefined)}
                disabled={!!marking}
                style={btnPrimary}
              >
                {marking
                  ? <><Loader2 size={12} className="animate-spin" /> Confirmando...</>
                  : <><Check size={12} /> Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
