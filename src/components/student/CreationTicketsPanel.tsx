// Patch 4.2 — Creation Tickets panel for the student inventory.
//
// Holographic-styled card that surfaces tickets earned by being Top 1 of the
// week in Sala / Geral / PvP. The student can request use; the master then
// fulfills the request manually.

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles, Ticket, Crown, X, Send, Check, Hourglass } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { toast } from "sonner";

type TicketStatus = "granted" | "pending" | "used";
type RankingType = "sala" | "geral" | "pvp";

interface TicketRow {
  id: string;
  ranking_type: RankingType;
  week_start: string;
  granted_at: string;
  requested_at: string | null;
  used_at: string | null;
  status: TicketStatus;
}

const RANKING_LABEL: Record<RankingType, string> = {
  sala: "Top 1 da Sala",
  geral: "Top 1 Geral",
  pvp: "Top 1 do PvP",
};

const RANKING_TONE: Record<RankingType, string> = {
  sala: "#60c8f8",
  geral: "#f5c84b",
  pvp: "#f05050",
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function CreationTicketsPanel() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<TicketRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseStudent.rpc("get_my_creation_tickets");
    if (error) {
      console.error("[CreationTicketsPanel] load", error);
      setTickets([]);
    } else {
      setTickets((data ?? []) as TicketRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleRequest = async () => {
    if (!confirming) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabaseStudent.rpc("request_creation_ticket", { p_ticket_id: confirming.id });
      if (error) {
        toast.error("Falha ao solicitar", { description: error.message });
        return;
      }
      const result = data as { success: boolean; error?: string; already_requested?: boolean };
      if (!result?.success) {
        toast.error("Solicitação não realizada", { description: result?.error ?? "Erro desconhecido" });
        return;
      }
      toast.success(result.already_requested
        ? "Solicitação já registrada — aguarde o professor."
        : "Solicitação enviada ao professor!");
      setConfirming(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  // Hide section completely if there are no tickets at all.
  if (!loading && tickets.length === 0) return null;

  return (
    <section className="ct-section">
      <style>{CSS}</style>
      <div className="ct-header">
        <Sparkles size={14} style={{ color: '#f5c84b' }} />
        <span>Tickets de Criação</span>
        <span className="ct-count">{tickets.filter(t => t.status !== "used").length} ativo(s)</span>
      </div>

      {loading ? (
        <div className="ct-loading"><Loader2 size={18} className="animate-spin" /></div>
      ) : (
        <div className="ct-grid">
          {tickets.map(t => (
            <TicketCard key={t.id} ticket={t} onRequest={() => setConfirming(t)} />
          ))}
        </div>
      )}

      {confirming && (
        <ConfirmModal
          ticket={confirming}
          submitting={submitting}
          onClose={() => !submitting && setConfirming(null)}
          onConfirm={handleRequest}
        />
      )}
    </section>
  );
}

function TicketCard({ ticket, onRequest }: { ticket: TicketRow; onRequest: () => void }) {
  const tone = RANKING_TONE[ticket.ranking_type];
  const label = RANKING_LABEL[ticket.ranking_type];
  const isPending = ticket.status === "pending";
  const isUsed = ticket.status === "used";

  return (
    <div
      className={`ct-card ${ticket.status}`}
      style={{ ['--tone' as string]: tone } as React.CSSProperties}
    >
      <div className="ct-holo" aria-hidden />
      <div className="ct-card-shimmer" aria-hidden />

      <div className="ct-card-head">
        <Crown size={14} />
        <span>{label}</span>
      </div>

      <div className="ct-card-body">
        <Ticket size={42} className="ct-card-icon" />
        <div className="ct-card-title">Ticket de Criação</div>
        <div className="ct-card-sub">
          Conquistado em {formatDate(ticket.granted_at)} · Semana {formatDate(ticket.week_start)}
        </div>
      </div>

      <div className="ct-card-foot">
        {isUsed ? (
          <div className="ct-status-line ct-used">
            <Check size={14} /> Carta criada · {formatDate(ticket.used_at)}
          </div>
        ) : isPending ? (
          <div className="ct-status-line ct-pending">
            <Hourglass size={14} className="ct-spin" /> Aguardando agendamento com o professor
          </div>
        ) : (
          <button className="ct-btn" onClick={onRequest}>
            <Send size={14} /> Solicitar uso
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({
  ticket, submitting, onClose, onConfirm,
}: {
  ticket: TicketRow; submitting: boolean; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="ct-modal-bg" onClick={onClose}>
      <div className="ct-modal" onClick={e => e.stopPropagation()}>
        <button className="ct-modal-close" onClick={onClose}><X size={16} /></button>
        <div className="ct-modal-head">
          <Sparkles size={18} style={{ color: '#f5c84b' }} />
          <h3>Solicitar uso do Ticket</h3>
        </div>
        <p className="ct-modal-body">
          Você vai pedir ao professor para agendar uma sessão de criação de carta. Esta solicitação
          fica registrada e você não pode acumular outro ticket do <strong>{RANKING_LABEL[ticket.ranking_type]}</strong>{" "}
          até que este seja resolvido.
        </p>
        <div className="ct-modal-actions">
          <button className="ct-modal-cancel" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button className="ct-modal-confirm" onClick={onConfirm} disabled={submitting}>
            {submitting ? (<><Loader2 size={14} className="animate-spin" /> Enviando...</>) : (<><Send size={14} /> Confirmar solicitação</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
@keyframes ct-shimmer {
  0%   { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}
@keyframes ct-holo-shift {
  0%, 100% { background-position:   0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes ct-spin {
  to { transform: rotate(360deg); }
}
@keyframes ct-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}

.ct-section {
  margin: 14px 0 18px;
  padding: 14px 14px 16px;
  background: linear-gradient(135deg, rgba(245,200,75,0.05), rgba(124,58,237,0.05));
  border: 1px solid rgba(245,200,75,0.18);
  border-radius: 14px;
  font-family: 'Exo 2', sans-serif;
  color: #e6f0ff;
}
.ct-header {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Cinzel', serif;
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: #f5c84b;
  margin-bottom: 12px;
}
.ct-count {
  margin-left: auto;
  font-family: 'Share Tech Mono', monospace;
  letter-spacing: 0.05em;
  font-size: 10px;
  color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 2px 8px; border-radius: 999px;
}
.ct-loading { display: flex; justify-content: center; padding: 20px; color: #f5c84b; }
.ct-grid {
  display: grid; gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.ct-card {
  --tone: #f5c84b;
  position: relative; overflow: hidden;
  display: flex; flex-direction: column;
  padding: 14px 14px 12px;
  border-radius: 14px;
  background: linear-gradient(160deg, #0d0e1a 0%, #060912 100%);
  border: 1.5px solid var(--tone);
  box-shadow: 0 12px 30px rgba(0,0,0,0.45), inset 0 0 18px color-mix(in srgb, var(--tone) 12%, transparent);
  isolation: isolate;
  animation: ct-float 4s ease-in-out infinite;
}
.ct-card.used   { filter: grayscale(0.6) brightness(0.7); animation: none; }
.ct-card.pending { border-color: color-mix(in srgb, var(--tone) 60%, white 0%); }

.ct-holo {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  opacity: 0.45;
  background: linear-gradient(115deg,
    transparent 35%,
    color-mix(in srgb, var(--tone) 18%, transparent) 45%,
    rgba(255,255,255,0.08) 50%,
    color-mix(in srgb, #b57bee 25%, transparent) 55%,
    transparent 70%);
  background-size: 220% 220%;
  animation: ct-holo-shift 7s ease-in-out infinite;
  mix-blend-mode: screen;
}
.ct-card-shimmer {
  position: absolute; top: 0; left: 0; width: 60%; height: 100%; z-index: 1;
  background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%);
  animation: ct-shimmer 4.5s ease-in-out infinite;
  pointer-events: none;
}

.ct-card-head, .ct-card-body, .ct-card-foot {
  position: relative; z-index: 2;
}
.ct-card-head {
  display: flex; align-items: center; gap: 6px;
  font-family: 'Cinzel', serif; font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--tone);
}
.ct-card-body {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 14px 4px 12px;
}
.ct-card-icon { color: var(--tone); filter: drop-shadow(0 0 12px color-mix(in srgb, var(--tone) 50%, transparent)); }
.ct-card-title {
  margin-top: 8px;
  font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700;
  color: #fff; letter-spacing: 0.1em; text-transform: uppercase;
}
.ct-card-sub {
  margin-top: 4px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px; color: rgba(255,255,255,0.55); letter-spacing: 0.04em;
}

.ct-card-foot { margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); }
.ct-btn {
  width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 10px; border-radius: 8px; cursor: pointer;
  background: color-mix(in srgb, var(--tone) 18%, transparent);
  border: 1px solid var(--tone);
  color: var(--tone);
  font-family: inherit; font-size: 11.5px; font-weight: 800;
  letter-spacing: 0.14em; text-transform: uppercase;
  transition: all 0.15s ease;
}
.ct-btn:hover {
  background: color-mix(in srgb, var(--tone) 32%, transparent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--tone) 40%, transparent);
}
.ct-status-line {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.ct-pending { color: #fbbf24; }
.ct-used    { color: #4ade80; }
.ct-spin { animation: ct-spin 2s linear infinite; }

/* Modal */
.ct-modal-bg {
  position: fixed; inset: 0; z-index: 80;
  background: rgba(0,0,0,0.78); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.ct-modal {
  position: relative; width: 100%; max-width: 480px;
  padding: 22px 22px 18px;
  background: linear-gradient(180deg, #0c1220 0%, #060912 100%);
  border: 1px solid rgba(245,200,75,0.35);
  border-radius: 14px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(245,200,75,0.15);
  color: #e6f0ff;
}
.ct-modal-close {
  position: absolute; top: 10px; right: 10px;
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.ct-modal-head { display: flex; align-items: center; gap: 8px; }
.ct-modal-head h3 {
  margin: 0; font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700;
  letter-spacing: 0.15em; text-transform: uppercase; color: #f5c84b;
}
.ct-modal-body {
  margin: 12px 0 18px;
  font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.7);
}
.ct-modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.ct-modal-cancel, .ct-modal-confirm {
  padding: 9px 16px; border-radius: 8px; cursor: pointer; border: 1px solid;
  font-family: inherit; font-weight: 700; font-size: 12px;
  letter-spacing: 0.1em; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 6px;
}
.ct-modal-cancel {
  background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.7);
}
.ct-modal-confirm {
  background: linear-gradient(90deg, #f5c84b, #fbeaa0);
  border-color: #f5c84b; color: #0a0a14;
}
.ct-modal-confirm:disabled, .ct-modal-cancel:disabled { opacity: 0.6; cursor: wait; }
`;
