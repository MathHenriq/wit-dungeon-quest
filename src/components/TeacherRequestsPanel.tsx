import { Check, X, Clock, Coins } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { StudentRequest } from "@/types";

interface TeacherRequestsPanelProps {
  requests: StudentRequest[];
  onDataChanged: () => void;
}

export function TeacherRequestsPanel({ requests, onDataChanged }: TeacherRequestsPanelProps) {
  const approveRequest = async (request: StudentRequest) => {
    const isAttendance = request.request_type === "attendance";
    const rpcName = isAttendance
      ? "approve_attendance_request"
      : "approve_challenge_request";

    const { data, error } = await supabase.rpc(rpcName, { p_request_id: request.id });

    if (error) {
      console.error(`[TeacherRequestsPanel] ${rpcName} falhou:`, error);
      toast.error("Erro ao aprovar solicitação", { description: error.message });
      return;
    }

    if (isAttendance) {
      const coinsEarned = data as number;
      const streak = coinsEarned / 10;
      toast.success(`Presença aprovada! +${coinsEarned} 🪙`, {
        description: `${streak}ª aula consecutiva`,
      });
    } else {
      toast.success("Desafio aprovado!");
    }
    onDataChanged();
  };

  const rejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("student_requests")
      .update({ status: "rejected", resolved_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast.error("Erro ao rejeitar solicitação");
    } else {
      toast.success("Solicitação rejeitada");
      onDataChanged();
    }
  };

  if (requests.length === 0) {
    return (
      <div className="card-fantasy text-center py-8 text-muted-foreground">
        <Clock size={48} className="mx-auto mb-4 opacity-50" />
        <p>Nenhuma solicitação pendente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(request => (
        <div key={request.id} className="card-fantasy flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                request.request_type === "challenge"
                  ? "bg-success/10 text-success"
                  : "bg-primary/10 text-primary"
              }`}>
                {request.request_type === "challenge" ? "Desafio" : "Presença"}
              </span>
              <span className="font-semibold">
                {request.student?.character_name || request.student?.name || "Aluno"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {request.request_type === "challenge"
                ? request.challenge?.title
                : "Solicitação de presença"}
            </p>
            {request.request_type === "challenge" && request.challenge && (
              <div className="flex items-center gap-1 mt-1 text-sm text-gold-dark">
                <Coins size={14} />
                +{request.challenge.reward}
              </div>
            )}
            {request.request_type === "attendance" && request.student && (
              <div className="flex items-center gap-1 mt-1 text-sm text-gold-dark">
                <Coins size={14} />
                +{((request.student.presencas_consecutivas ?? 0) + 1) * 10}
                <span className="text-muted-foreground ml-1">
                  ({(request.student.presencas_consecutivas ?? 0) + 1}ª aula)
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => approveRequest(request)}
              className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
              title="Aprovar"
            >
              <Check size={20} />
            </button>
            <button
              onClick={() => rejectRequest(request.id)}
              className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              title="Rejeitar"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
