import { useState } from "react";
import { Check, X, UserPlus, GitMerge } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Student, Class } from "@/types";

interface TeacherPendingStudentsPanelProps {
  pendingStudents: Student[];
  allStudents: Student[];
  classes: Class[];
  onDataChanged: () => void;
}

// Modal to choose between approving normally or merging with an existing student
function MergeModal({
  pending,
  candidates,
  onApprove,
  onMerge,
  onClose,
}: {
  pending: Student;
  candidates: Student[];
  onApprove: () => void;
  onMerge: (existingId: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    if (selected) {
      await onMerge(selected);
    } else {
      await onApprove();
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <GitMerge size={20} className="text-primary" />
          <h2 className="font-semibold text-lg">Aprovar aluno</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          <strong>{pending.name}</strong> se cadastrou. Deseja aprová-lo normalmente ou
          mesclar com um aluno já existente (para preservar moedas e nível)?
        </p>

        {candidates.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Mesclar com aluno existente (opcional):</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {candidates.map(s => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selected === s.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="merge-target"
                    value={s.id}
                    checked={selected === s.id}
                    onChange={() => setSelected(s.id)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="font-medium text-sm">{s.character_name || s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      🪙 {s.coins} moedas · Nv. {s.level}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {selected && (
              <p className="text-xs text-amber-500">
                ⚠️ O registro de <strong>{pending.name}</strong> (novo) será removido e a conta será vinculada ao aluno selecionado.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : selected ? (
              <><GitMerge size={16} /> Mesclar e aprovar</>
            ) : (
              <><Check size={16} /> Aprovar normalmente</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeacherPendingStudentsPanel({
  pendingStudents,
  allStudents,
  classes,
  onDataChanged,
}: TeacherPendingStudentsPanelProps) {
  const [mergeTarget, setMergeTarget] = useState<Student | null>(null);

  const getClassName = (classId: string) =>
    classes.find(c => c.id === classId)?.name ?? "Turma desconhecida";

  // Students without user_id (manually created) in the same class/teacher as the pending one
  const getMergeCandidates = (pending: Student) =>
    allStudents.filter(
      s => !s.user_id && s.teacher_id === pending.teacher_id && s.class_id === pending.class_id
    );

  const handleApproveNormal = async (student: Student) => {
    const { error } = await supabase
      .from("students")
      .update({ status: "active" })
      .eq("id", student.id);

    if (error) {
      toast.error("Erro ao aprovar aluno", { description: error.message });
    } else {
      toast.success(`${student.name} aprovado! Acesso liberado.`);
      onDataChanged();
    }
    setMergeTarget(null);
  };

  const handleMerge = async (pending: Student, existingId: string) => {
    // 1. Link user_id and activate the existing (manual) student record
    const { error: updateErr } = await supabase
      .from("students")
      .update({ user_id: pending.user_id, status: "active" })
      .eq("id", existingId);

    if (updateErr) {
      toast.error("Erro ao mesclar aluno", { description: updateErr.message });
      setMergeTarget(null);
      return;
    }

    // 2. Delete the new pending record
    const { error: deleteErr } = await supabase
      .from("students")
      .delete()
      .eq("id", pending.id);

    if (deleteErr) {
      toast.error("Conta vinculada, mas erro ao remover registro pendente", { description: deleteErr.message });
    } else {
      toast.success("Conta mesclada com sucesso! Aluno tem acesso agora.");
    }

    setMergeTarget(null);
    onDataChanged();
  };

  const handleReject = async (student: Student) => {
    const { error } = await supabase
      .from("students")
      .update({ status: "rejected" })
      .eq("id", student.id);

    if (error) {
      toast.error("Erro ao rejeitar aluno", { description: error.message });
    } else {
      toast.info(`Solicitação de ${student.name} rejeitada.`);
      onDataChanged();
    }
  };

  if (pendingStudents.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <UserPlus size={48} className="mx-auto mb-4 opacity-40" />
        <p>Nenhuma solicitação pendente</p>
        <p className="text-sm mt-1">Quando um aluno se cadastrar, aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {pendingStudents.map(student => (
          <div
            key={student.id}
            className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg p-4"
          >
            <div>
              <p className="font-semibold text-foreground">{student.name}</p>
              <p className="text-sm text-muted-foreground">{getClassName(student.class_id)}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMergeTarget(student)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium"
              >
                <Check size={16} /> Aprovar
              </button>
              <button
                onClick={() => handleReject(student)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium"
              >
                <X size={16} /> Rejeitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {mergeTarget && (
        <MergeModal
          pending={mergeTarget}
          candidates={getMergeCandidates(mergeTarget)}
          onApprove={() => handleApproveNormal(mergeTarget)}
          onMerge={(existingId) => handleMerge(mergeTarget, existingId)}
          onClose={() => setMergeTarget(null)}
        />
      )}
    </>
  );
}
