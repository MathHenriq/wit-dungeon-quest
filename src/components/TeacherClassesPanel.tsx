import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Class, Student } from "@/types";

interface TeacherClassesPanelProps {
  teacherId: string;
  classes: Class[];
  students: Student[];
  onDataChanged: () => void;
}

// Grupos no lugar de turmas. O nome é um código neutro gerado pelo banco
// (trigger em `classes`, ex.: GRUPO-7K3F) — nada de série, escola ou nome do
// professor, para que um vazamento não ligue o aluno à turma real. O
// professor passa o código aos alunos em sala; o mapeamento fica com ele.
export function TeacherClassesPanel({ teacherId, classes, students, onDataChanged }: TeacherClassesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStudentCount = (classId: string) => students.filter(s => s.class_id === classId).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) return;
    setIsAdding(true);

    const timeout = setTimeout(() => {
      setIsAdding(false);
      toast.error("A operação demorou demais. Verifique sua conexão e tente novamente.");
    }, 10000);

    try {
      // `name` é sobrescrito pelo trigger classes_force_neutral_code.
      const { error } = await supabase.from("classes").insert({ teacher_id: teacherId, name: "GRUPO" });
      clearTimeout(timeout);

      if (error) {
        toast.error("Erro ao criar grupo", { description: error.message });
      } else {
        toast.success("Grupo criado! Passe o código aos alunos.");
        onDataChanged();
      }
    } catch {
      clearTimeout(timeout);
      toast.error("Erro inesperado ao criar grupo. Tente novamente.");
    } finally {
      clearTimeout(timeout);
      setIsAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase.from("classes").delete().eq("id", deleteTarget.id);

      if (error) {
        toast.error("Erro ao excluir grupo", { description: error.message });
      } else {
        toast.success(`Grupo "${deleteTarget.name}" excluído!`);
        onDataChanged();
      }
    } catch {
      toast.error("Erro inesperado ao excluir");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="card-fantasy flex gap-3">
        <p className="flex-1 text-sm text-muted-foreground self-center">
          Cada grupo recebe um código neutro. Não é possível usar o nome real da turma
          ou da escola, por exigência de proteção de dados dos alunos.
        </p>
        <button type="submit" disabled={isAdding} className="btn-fantasy flex items-center gap-2 disabled:opacity-50">
          <Plus size={18} />
          {isAdding ? "Criando..." : "Novo grupo"}
        </button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(cls => {
          const count = getStudentCount(cls.id);
          return (
            <div key={cls.id} className="card-fantasy">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {count} {count === 1 ? "aluno" : "alunos"}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(cls)}
                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  title="Excluir grupo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir grupo?"
        description={`Você está prestes a excluir "${deleteTarget?.name}". Esta ação não pode ser desfeita.`}
        warning={
          deleteTarget && getStudentCount(deleteTarget.id) > 0
            ? `Este grupo possui ${getStudentCount(deleteTarget.id)} aluno(s) vinculado(s). Eles também serão removidos.`
            : undefined
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
