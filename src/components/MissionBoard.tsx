import { useState } from "react";
import { Scroll, CheckCircle, Clock, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  is_return_mission: boolean;
}

interface MissionCompletion {
  id: string;
  mission_id: string;
  status: "pending" | "approved" | "rejected";
}

interface MissionBoardProps {
  studentId: string;
  missions: Mission[];
  completions: MissionCompletion[];
  needsReturnMission: boolean;
  onCompletionRequested: () => void;
}

export function MissionBoard({
  studentId,
  missions,
  completions,
  needsReturnMission,
  onCompletionRequested,
}: MissionBoardProps) {
  const [requesting, setRequesting] = useState<string | null>(null);

  const getMissionStatus = (missionId: string) => {
    const completion = completions.find((c) => c.mission_id === missionId);
    return completion?.status || null;
  };

  const handleRequestCompletion = async (mission: Mission) => {
    const existingStatus = getMissionStatus(mission.id);
    if (existingStatus === "pending") {
      toast.info("Já solicitado", { description: "Aguarde a validação do professor." });
      return;
    }

    setRequesting(mission.id);
    try {
      const { error } = await supabase.from("mission_completions").insert({
        mission_id: mission.id,
        student_id: studentId,
      });

      if (error) {
        console.error("Error requesting mission:", error);
        toast.error("Erro ao solicitar", { description: error.message });
      } else {
        toast.success("Missão solicitada!", {
          description: "Aguarde a validação do professor.",
          icon: "✨",
        });
        onCompletionRequested();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado");
    } finally {
      setRequesting(null);
    }
  };

  // Separate return missions from regular missions
  const returnMissions = missions.filter((m) => m.is_return_mission);
  const regularMissions = missions.filter((m) => !m.is_return_mission);

  // Show return missions only if student needs them
  const displayedReturnMissions = needsReturnMission ? returnMissions : [];

  return (
    <div className="space-y-6">
      {/* Return Mission Notice */}
      {needsReturnMission && displayedReturnMissions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-amber-300">Missão de Retorno</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Bem-vindo de volta! Complete uma missão de retorno para se reintegrar à turma.
          </p>
          <div className="space-y-2">
            {displayedReturnMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                status={getMissionStatus(mission.id)}
                isRequesting={requesting === mission.id}
                onRequest={() => handleRequestCompletion(mission)}
                isReturnMission
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Missions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Missões do Bom Aluno</h3>
        </div>
        
        {regularMissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Scroll className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma missão disponível no momento</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {regularMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                status={getMissionStatus(mission.id)}
                isRequesting={requesting === mission.id}
                onRequest={() => handleRequestCompletion(mission)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface MissionCardProps {
  mission: Mission;
  status: "pending" | "approved" | "rejected" | null;
  isRequesting: boolean;
  onRequest: () => void;
  isReturnMission?: boolean;
}

function MissionCard({ mission, status, isRequesting, onRequest, isReturnMission }: MissionCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            <Clock className="w-3 h-3" />
            Aguardando
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            <CheckCircle className="w-3 h-3" />
            Concluída
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
            Não validada
          </span>
        );
      default:
        return null;
    }
  };

  const canRequest = status !== "pending" && status !== "approved";

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isReturnMission
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-card/50 border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{mission.title}</h4>
            {getStatusBadge()}
          </div>
          {mission.description && (
            <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-sm text-amber-400">
            <span>+{mission.reward}</span>
            <span className="text-xs">moedas</span>
          </div>
        </div>

        {canRequest && (
          <button
            onClick={onRequest}
            disabled={isRequesting}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isRequesting ? "..." : "Realizar"}
          </button>
        )}
      </div>
    </div>
  );
}
