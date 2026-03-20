import { Check, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Student, Class } from "@/types";

interface TeacherPendingStudentsPanelProps {
  pendingStudents: Student[];
  classes: Class[];
  onDataChanged: () => void;
}

export function TeacherPendingStudentsPanel({
  pendingStudents,
  classes,
  onDataChanged,
}: TeacherPendingStudentsPanelProps) {
  const getClassName = (classId: string) =>
    classes.find(c => c.id === classId)?.name ?? "Turma desconhecida";

  const handleApprove = async (student: Student) => {
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
        <p className="text-sm mt-1">Quando um aluno se cadastrar com Google, aparecerá aqui.</p>
      </div>
    );
  }

  return (
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
              onClick={() => handleApprove(student)}
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
  );
}
