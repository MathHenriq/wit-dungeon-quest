import { useState } from "react";
import { Plus, Trash2, Sparkles, RefreshCw, Check, X, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Mission, MissionCompletion, Student } from "@/types";

interface TeacherMissionsPanelProps {
  teacherId: string;
  missions: Mission[];
  completions: MissionCompletion[];
  students: Student[];
  onDataChanged: () => void;
}

export function TeacherMissionsPanel({
  teacherId,
  missions,
  completions,
  students,
  onDataChanged,
}: TeacherMissionsPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newReward, setNewReward] = useState(5);
  const [isReturnMission, setIsReturnMission] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);

  const pendingCompletions = completions.filter((c) => c.status === "pending");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Informe o título da missão");
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("student_missions").insert({
        teacher_id: teacherId,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        reward: newReward,
        is_return_mission: isReturnMission,
      });

      if (error) {
        console.error("Error creating mission:", error);
        toast.error("Erro ao criar missão", { description: error.message });
      } else {
        toast.success("Missão criada!");
        setNewTitle("");
        setNewDesc("");
        setNewReward(5);
        setIsReturnMission(false);
        onDataChanged();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (mission: Mission) => {
    const { error } = await supabase
      .from("student_missions")
      .update({ is_active: !mission.is_active })
      .eq("id", mission.id);

    if (error) {
      toast.error("Erro ao atualizar missão");
    } else {
      toast.success(mission.is_active ? "Missão desativada" : "Missão ativada");
      onDataChanged();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const { error } = await supabase
      .from("student_missions")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      toast.error("Erro ao excluir missão", { description: error.message });
    } else {
      toast.success("Missão excluída");
      onDataChanged();
    }
    setDeleteTarget(null);
  };

  const handleApproveCompletion = async (completion: MissionCompletion) => {
    const mission = missions.find((m) => m.id === completion.mission_id);
    const student = students.find((s) => s.id === completion.student_id!);

    const { error } = await supabase.rpc("approve_mission_completion", {
      p_completion_id: completion.id,
    });

    if (error) {
      console.error("[TeacherMissionsPanel] approve_mission_completion falhou:", error);
      toast.error("Erro ao aprovar missão", { description: error.message });
      return;
    }

    toast.success(`Missão aprovada!${mission && student ? ` +${mission.reward} moedas para ${student.name}` : ""}`);
    onDataChanged();
  };

  const handleRejectCompletion = async (completion: MissionCompletion) => {
    const { error } = await supabase
      .from("mission_completions")
      .update({
        status: "rejected",
        resolved_at: new Date().toISOString(),
        resolved_by: teacherId,
      })
      .eq("id", completion.id);

    if (error) {
      toast.error("Erro ao rejeitar", { description: error.message });
    } else {
      toast.info("Missão não validada");
      onDataChanged();
    }
  };

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || "Aluno";
  };

  const getMissionTitle = (missionId: string) => {
    return missions.find((m) => m.id === missionId)?.title || "Missão";
  };

  const activeMissions = missions.filter((m) => m.is_active);
  const inactiveMissions = missions.filter((m) => !m.is_active);

  return (
    <div className="space-y-6">
      {/* Pending Completions */}
      {pendingCompletions.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-amber-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Missões Pendentes ({pendingCompletions.length})
          </h3>
          <div className="space-y-2">
            {pendingCompletions.map((completion) => (
              <div
                key={completion.id}
                className="flex items-center justify-between bg-background/50 rounded-lg p-3"
              >
                <div>
                  <span className="font-medium">{getStudentName(completion.student_id!)}</span>
                  <span className="text-muted-foreground mx-2">realizou</span>
                  <span className="text-primary">{getMissionTitle(completion.mission_id)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveCompletion(completion)}
                    className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    title="Aprovar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRejectCompletion(completion)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    title="Rejeitar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Mission Form */}
      <form onSubmit={handleCreate} className="bg-card/50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Missão
        </h3>

        <input
          type="text"
          placeholder="Título da missão (ex: Ajudar um colega)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border"
        />

        <textarea
          placeholder="Descrição (opcional)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border resize-none"
        />

        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground">Recompensa</label>
            <input
              type="number"
              min="1"
              value={newReward}
              onChange={(e) => setNewReward(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isReturnMission}
              onChange={(e) => setIsReturnMission(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Missão de Retorno
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isCreating ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Criando...</>
          ) : "Criar Missão"}
        </button>
      </form>

      {/* Active Missions */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Missões Ativas ({activeMissions.length})
        </h3>
        {activeMissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma missão ativa</p>
        ) : (
          <div className="grid gap-2">
            {activeMissions.map((mission) => (
              <div
                key={mission.id}
                className="flex items-center justify-between bg-card/50 rounded-lg p-3 border border-border"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{mission.title}</span>
                    {mission.is_return_mission && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        Retorno
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">+{mission.reward} moedas</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(mission)}
                    className="px-3 py-1 text-xs rounded bg-muted hover:bg-muted/80"
                  >
                    Desativar
                  </button>
                  <button
                    onClick={() => setDeleteTarget(mission)}
                    className="p-1 rounded text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Missions */}
      {inactiveMissions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-muted-foreground">
            Missões Inativas ({inactiveMissions.length})
          </h3>
          <div className="grid gap-2 opacity-60">
            {inactiveMissions.map((mission) => (
              <div
                key={mission.id}
                className="flex items-center justify-between bg-card/30 rounded-lg p-3 border border-border/50"
              >
                <div>
                  <span className="font-medium">{mission.title}</span>
                  <span className="text-sm text-muted-foreground ml-2">+{mission.reward}</span>
                </div>
                <button
                  onClick={() => handleToggleActive(mission)}
                  className="px-3 py-1 text-xs rounded bg-primary/20 text-primary hover:bg-primary/30"
                >
                  Ativar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Missão"
        description={`Tem certeza que deseja excluir a missão "${deleteTarget?.title}"?`}
      />
    </div>
  );
}
