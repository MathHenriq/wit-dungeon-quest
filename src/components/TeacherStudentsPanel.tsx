import { useState } from "react";
import { Plus, Trash2, Coins, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhoto } from "./ProfilePhoto";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Student, Class } from "@/types";

interface TeacherStudentsPanelProps {
  teacherId: string;
  students: Student[];
  classes: Class[];
  onDataChanged: () => void;
}

export function TeacherStudentsPanel({ teacherId, students, classes, onDataChanged }: TeacherStudentsPanelProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredStudents = selectedClass
    ? students.filter(s => s.class_id === selectedClass)
    : students;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newStudentName.trim() || isAdding) return;

    const name = newStudentName.trim();
    setIsAdding(true);

    const timeout = setTimeout(() => {
      setIsAdding(false);
      toast.error("A operação demorou demais. Verifique sua conexão e tente novamente.");
    }, 10000);

    try {
      const { error } = await supabase.from("students").insert({
        class_id: selectedClass,
        teacher_id: teacherId,
        name,
      });
      clearTimeout(timeout);

      if (error) {
        toast.error("Erro ao adicionar aluno", { description: error.message });
      } else {
        toast.success("Aluno adicionado!");
        setNewStudentName("");
        onDataChanged();
      }
    } catch {
      clearTimeout(timeout);
      toast.error("Erro inesperado ao adicionar aluno.");
    } finally {
      clearTimeout(timeout);
      setIsAdding(false);
    }
  };

  const updateCoins = async (studentId: string, newCoins: number) => {
    const { error } = await supabase
      .from("students")
      .update({ coins: Math.max(0, newCoins) })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao atualizar recompensas");
    } else {
      toast.success("Recompensas atualizadas!");
      onDataChanged();
    }
  };

  const updateLevel = async (studentId: string, newLevel: number) => {
    const { error } = await supabase
      .from("students")
      .update({ level: Math.max(1, newLevel) })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao atualizar nível");
    } else {
      toast.success("Nível atualizado!");
      onDataChanged();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase.from("students").delete().eq("id", deleteTarget.id);

      if (error) {
        toast.error("Erro ao excluir aluno", { description: error.message });
      } else {
        toast.success(`Aluno "${deleteTarget.character_name || deleteTarget.name}" excluído!`);
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
      <div className="card-fantasy">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedClass || ""}
            onChange={e => setSelectedClass(e.target.value || null)}
            className="px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
          >
            <option value="">Todas as turmas</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>

          {selectedClass && (
            <form onSubmit={handleAdd} className="flex-1 flex gap-3">
              <input
                type="text"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                placeholder="Nome do aluno"
                className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
              />
              <button type="submit" disabled={isAdding} className="btn-fantasy flex items-center gap-2 disabled:opacity-50">
                <Plus size={18} />
                {isAdding ? "Adicionando..." : "Adicionar"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredStudents.map(student => (
          <div key={student.id} className="card-fantasy">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ProfilePhoto
                  studentId={student.id}
                  currentPhotoUrl={student.profile_photo_url}
                  onUpdate={onDataChanged}
                  size="sm"
                  editable={false}
                />
                <div>
                  <h3 className="font-semibold">
                    {student.character_name || student.name}
                    {student.character_name && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({student.name})
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {classes.find(c => c.id === student.class_id)?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Coins className="text-gold" size={18} />
                  <input
                    type="number"
                    value={student.coins}
                    onChange={e => updateCoins(student.id, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 rounded border border-border text-center"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-primary" size={18} />
                  <input
                    type="number"
                    value={student.level}
                    onChange={e => updateLevel(student.id, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 rounded border border-border text-center"
                    min={1}
                  />
                </div>
                <button
                  onClick={() => setDeleteTarget(student)}
                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  title="Excluir aluno"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir aluno?"
        description={`Você está prestes a excluir "${deleteTarget?.character_name || deleteTarget?.name}". Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
