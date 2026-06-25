import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Ticket, Check, Hourglass, Crown, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Patch 4.2 — Teacher view of student "Creation Tickets" (propostas de carta).
//
// Top-1 weekly winners earn a Ticket de Criação that lets them co-design a new
// card with the master. This panel is the TEACHER-side, read-only overview of
// their own students' tickets — who earned one, who has already requested its
// use, and which were fulfilled. The actual card creation / "mark as used" step
// is a master action (master_mark_ticket_used is admin-gated), so teachers see
// status here but do not finalize.

interface TeacherCardProposalsPanelProps {
  teacherId: string;
}

type TicketStatus = "granted" | "pending" | "used";

interface TicketRow {
  id: string;
  student_id: string;
  student_name: string;
  character_name: string | null;
  class_name: string | null;
  ranking_type: "sala" | "geral" | "pvp";
  week_start: string;
  granted_at: string;
  requested_at: string | null;
  used_at: string | null;
  status: TicketStatus;
}

const RANKING_LABEL: Record<string, string> = { sala: "Sala", geral: "Geral", pvp: "PvP" };
const RANKING_TONE:  Record<string, string> = { sala: "#60c8f8", geral: "#f5c84b", pvp: "#f05050" };

const STATUS_META: Record<TicketStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: "Solicitado", bg: "rgba(220,180,40,0.15)", fg: "rgb(255,220,140)" },
  granted: { label: "Concedido",  bg: "rgba(80,160,255,0.15)", fg: "rgb(160,200,255)" },
  used:    { label: "Usado",      bg: "rgba(60,180,90,0.15)",  fg: "rgb(140,230,170)" },
};

function ticketStatus(t: { used_at: string | null; requested_at: string | null }): TicketStatus {
  if (t.used_at) return "used";
  if (t.requested_at) return "pending";
  return "granted";
}

export function TeacherCardProposalsPanel({ teacherId }: TeacherCardProposalsPanelProps) {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "granted" | "used" | "all">("pending");

  async function load() {
    setLoading(true);
    try {
      // 1. The teacher's students (+ class for display).
      const [{ data: students }, { data: classes }] = await Promise.all([
        supabase
          .from("students")
          .select("id, name, character_name, class_id")
          .eq("teacher_id", teacherId),
        supabase
          .from("classes")
          .select("id, name")
          .eq("teacher_id", teacherId),
      ]);

      const studentList = (students ?? []) as Array<{ id: string; name: string; character_name: string | null; class_id: string | null }>;
      if (studentList.length === 0) { setRows([]); return; }

      const classMap: Record<string, string> = {};
      for (const c of (classes ?? []) as Array<{ id: string; name: string }>) classMap[c.id] = c.name;

      const studentMap: Record<string, { name: string; character_name: string | null; class_id: string | null }> = {};
      for (const s of studentList) studentMap[s.id] = { name: s.name, character_name: s.character_name, class_id: s.class_id };

      // 2. Their creation tickets (RLS allows SELECT for any session).
      const { data: tickets, error } = await supabase
        .from("creation_tickets")
        .select("id, student_id, ranking_type, week_start, granted_at, requested_at, used_at")
        .in("student_id", studentList.map(s => s.id));

      if (error) { throw error; }

      const merged: TicketRow[] = ((tickets ?? []) as Array<{
        id: string; student_id: string; ranking_type: TicketRow["ranking_type"];
        week_start: string; granted_at: string; requested_at: string | null; used_at: string | null;
      }>).map(t => {
        const s = studentMap[t.student_id];
        return {
          id: t.id,
          student_id: t.student_id,
          student_name: s?.name ?? "Aluno",
          character_name: s?.character_name ?? null,
          class_name: s?.class_id ? (classMap[s.class_id] ?? null) : null,
          ranking_type: t.ranking_type,
          week_start: t.week_start,
          granted_at: t.granted_at,
          requested_at: t.requested_at,
          used_at: t.used_at,
          status: ticketStatus(t),
        };
      });

      // Pending first, then granted, then used; newest within each group.
      merged.sort((a, b) => {
        const order: Record<TicketStatus, number> = { pending: 0, granted: 1, used: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return new Date(b.requested_at ?? b.granted_at).getTime() - new Date(a.requested_at ?? a.granted_at).getTime();
      });

      setRows(merged);
    } catch (err) {
      toast.error("Falha ao carregar propostas de carta", { description: (err as Error).message });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, granted: 0, used: 0 };
    rows.forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter(r => r.status === filter)),
    [rows, filter]
  );

  return (
    <div className="card-fantasy max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Ticket size={18} className="text-amber-400" />
        <h2 className="text-lg font-bold" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "1px" }}>
          Propostas de Carta
        </h2>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-md text-xs text-amber-200/80"
           style={{ background: "rgba(245,200,75,0.06)", border: "1px solid rgba(245,200,75,0.2)" }}>
        <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-400" />
        <div className="leading-relaxed">
          Os campeões da semana (Sala, Geral e PvP) ganham um <b>Ticket de Criação</b> para co-criar uma carta.
          Aqui você acompanha os tickets dos seus alunos. A criação final da carta é concluída pelo mestre.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "granted", "used", "all"] as const).map(f => {
          const count = f === "all" ? rows.length : (counts[f] ?? 0);
          const active = filter === f;
          const label = f === "pending" ? "Solicitados" : f === "granted" ? "Concedidos" : f === "used" ? "Usados" : "Todos";
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
              style={{
                background: active ? "rgba(245,200,75,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? "rgba(245,200,75,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: active ? "rgb(245,200,75)" : "rgba(255,255,255,0.7)",
              }}
            >
              {label} ({count})
            </button>
          );
        })}
        <button
          onClick={() => void load()}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ml-auto"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recarregar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={26} className="animate-spin text-amber-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-white/40">
          Nenhum ticket {filter === "pending" ? "solicitado" : filter === "granted" ? "concedido" : filter === "used" ? "usado" : "registrado"} no momento.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-card/60">
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Aluno</th>
                <th className="px-3 py-2">Turma</th>
                <th className="px-3 py-2">Ranking</th>
                <th className="px-3 py-2">Semana</th>
                <th className="px-3 py-2">Solicitado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const meta = STATUS_META[r.status];
                return (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{ background: meta.bg, color: meta.fg }}>
                        {r.status === "used" ? <Check size={11} /> : r.status === "pending" ? <Hourglass size={11} /> : <Ticket size={11} />}
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold">{r.character_name || r.student_name}</div>
                      {r.character_name && <div className="text-[10px] text-muted-foreground">{r.student_name}</div>}
                    </td>
                    <td className="px-3 py-2">{r.class_name ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 font-bold" style={{ color: RANKING_TONE[r.ranking_type] }}>
                        <Crown size={11} /> {RANKING_LABEL[r.ranking_type]}
                      </span>
                    </td>
                    <td className="px-3 py-2">{new Date(r.week_start).toLocaleDateString("pt-BR")}</td>
                    <td className="px-3 py-2">{r.requested_at ? new Date(r.requested_at).toLocaleString("pt-BR") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
