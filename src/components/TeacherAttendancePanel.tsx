import { useState } from "react";
import { Check, RotateCcw, CalendarCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhoto } from "./ProfilePhoto";
import type { Student, Class } from "@/types";

interface TeacherAttendancePanelProps {
  students: Student[];
  classes: Class[];
  onDataChanged: () => void;
}

export function TeacherAttendancePanel({ students, classes, onDataChanged }: TeacherAttendancePanelProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const filteredStudents = selectedClass
    ? students.filter(s => s.class_id === selectedClass)
    : students;

  const confirmAttendance = async (student: { id: string; presencas_consecutivas: number; coins: number }) => {
    const newStreak = student.presencas_consecutivas + 1;
    const coinsEarned = newStreak * 10;

    const { error } = await supabase
      .from("students")
      .update({ presencas_consecutivas: newStreak, coins: student.coins + coinsEarned })
      .eq("id", student.id);

    if (error) {
      toast.error("Erro ao confirmar presença");
    } else {
      toast.success(`Presença confirmada! +${coinsEarned} 🪙`, {
        description: `${newStreak}ª aula consecutiva`,
      });
      onDataChanged();
    }
  };

  const resetAttendance = async (studentId: string) => {
    const { error } = await supabase
      .from("students")
      .update({ presencas_consecutivas: 0 })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao marcar falta");
    } else {
      toast.success("Presença zerada (falta marcada)");
      onDataChanged();
    }
  };

  return (
    <div className="space-y-4">
      <div className="card-fantasy">
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
      </div>

      {filteredStudents.length === 0 ? (
        <div className="card-fantasy text-center py-8 text-muted-foreground">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map(student => (
            <div key={student.id} className="card-fantasy">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
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
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarCheck className="text-success" size={16} />
                      <span className="font-semibold text-success">
                        {student.presencas_consecutivas}{" "}
                        {student.presencas_consecutivas === 1 ? "aula consecutiva" : "aulas consecutivas"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => confirmAttendance({ id: student.id, presencas_consecutivas: student.presencas_consecutivas, coins: student.coins })}
                    className="px-4 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center gap-2 font-semibold"
                    title="Confirmar presença (+1)"
                  >
                    <Check size={18} />
                    Confirmar
                  </button>
                  <button
                    onClick={() => resetAttendance(student.id)}
                    className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-2 font-semibold"
                    title="Marcar falta (zerar)"
                  >
                    <RotateCcw size={18} />
                    Falta
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
