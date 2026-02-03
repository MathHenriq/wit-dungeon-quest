import { useState } from "react";
import { Award, Star, Heart, Crown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TitleType } from "./StudentTitleBadge";

interface Student {
  id: string;
  name: string;
  class_id: string;
  presencas_consecutivas: number;
}

interface StudentTitle {
  id: string;
  student_id: string;
  title_type: TitleType;
  expires_at: string;
}

interface Class {
  id: string;
  name: string;
}

interface TeacherTitlesPanelProps {
  teacherId: string;
  students: Student[];
  classes: Class[];
  titles: StudentTitle[];
  onDataChanged: () => void;
}

const TITLE_OPTIONS: { value: TitleType; label: string; icon: typeof Award }[] = [
  { value: "helper_of_week", label: "Ajudante da Semana", icon: Heart },
  { value: "presence_guardian", label: "Guardião da Presença", icon: Star },
  { value: "attitude_example", label: "Exemplo de Atitude", icon: Award },
];

export function TeacherTitlesPanel({
  teacherId,
  students,
  classes,
  titles,
  onDataChanged,
}: TeacherTitlesPanelProps) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<TitleType>("helper_of_week");
  const [durationDays, setDurationDays] = useState(7);
  const [filterClass, setFilterClass] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  const filteredStudents = filterClass
    ? students.filter((s) => s.class_id === filterClass)
    : students;

  const activeTitles = titles.filter((t) => new Date(t.expires_at) > new Date());

  const handleAssignTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error("Selecione um aluno");
      return;
    }

    setIsAssigning(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { error } = await supabase.from("student_titles").insert({
        student_id: selectedStudent,
        title_type: selectedTitle,
        expires_at: expiresAt.toISOString(),
        assigned_by: teacherId,
      });

      if (error) {
        console.error("Error assigning title:", error);
        toast.error("Erro ao atribuir título", { description: error.message });
      } else {
        const student = students.find((s) => s.id === selectedStudent);
        const titleLabel = TITLE_OPTIONS.find((t) => t.value === selectedTitle)?.label;
        toast.success(`Título atribuído!`, {
          description: `${student?.name} recebeu "${titleLabel}"`,
          icon: "🏆",
        });
        setSelectedStudent("");
        onDataChanged();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveTitle = async (titleId: string) => {
    const { error } = await supabase.from("student_titles").delete().eq("id", titleId);

    if (error) {
      toast.error("Erro ao remover título");
    } else {
      toast.success("Título removido");
      onDataChanged();
    }
  };

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || "Aluno";
  };

  const getTitleConfig = (type: TitleType) => {
    return TITLE_OPTIONS.find((t) => t.value === type);
  };

  const formatExpiry = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Expirando hoje";
    if (diffDays === 1) return "Expira amanhã";
    return `Expira em ${diffDays} dias`;
  };

  // Students with high attendance (for quick reference)
  const highAttendanceStudents = students.filter((s) => s.presencas_consecutivas >= 3);

  return (
    <div className="space-y-6">
      {/* Assign Title Form */}
      <form onSubmit={handleAssignTitle} className="bg-card/50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Atribuir Título
        </h3>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm text-muted-foreground">Filtrar por turma</label>
            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setSelectedStudent("");
              }}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border"
            >
              <option value="">Todas as turmas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Aluno</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border"
            >
              <option value="">Selecione um aluno</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm text-muted-foreground">Título</label>
            <select
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value as TitleType)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border"
            >
              {TITLE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Duração (dias)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isAssigning || !selectedStudent}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isAssigning ? "Atribuindo..." : "Atribuir Título"}
        </button>
      </form>

      {/* High Attendance Students (Candidates for Crown) */}
      {highAttendanceStudents.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-amber-300 mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Alunos com Alta Presença (Coroinha)
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Estes alunos têm 3+ presenças consecutivas e exibem a coroinha automaticamente.
          </p>
          <div className="flex flex-wrap gap-2">
            {highAttendanceStudents.map((s) => (
              <span
                key={s.id}
                className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm"
              >
                {s.name} ({s.presencas_consecutivas}x)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active Titles */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          Títulos Ativos ({activeTitles.length})
        </h3>
        {activeTitles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum título atribuído</p>
        ) : (
          <div className="grid gap-2">
            {activeTitles.map((title) => {
              const config = getTitleConfig(title.title_type);
              const Icon = config?.icon || Award;

              return (
                <div
                  key={title.id}
                  className="flex items-center justify-between bg-card/50 rounded-lg p-3 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                      <span className="font-medium">{getStudentName(title.student_id)}</span>
                      <span className="text-muted-foreground mx-2">—</span>
                      <span className="text-primary">{config?.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatExpiry(title.expires_at)}
                    </span>
                    <button
                      onClick={() => handleRemoveTitle(title.id)}
                      className="p-1 rounded text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
