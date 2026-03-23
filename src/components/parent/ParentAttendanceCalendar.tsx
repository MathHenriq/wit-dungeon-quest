import { Calendar, Flame, Trophy } from "lucide-react";
import type { ChildSummary } from "@/hooks/useParentPortal";

interface Props {
  summary: ChildSummary;
}

export function ParentAttendanceCalendar({ summary }: Props) {
  const { student } = summary;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-blue-500" />
        Frequência e Assiduidade
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl text-center" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <Flame size={28} className="text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-orange-600">{student.streak_current}</p>
          <p className="text-xs text-orange-400 font-medium">Dias seguidos</p>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: '#fdf4ff', border: '1px solid #e9d5ff' }}>
          <Trophy size={28} className="text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-600">{student.streak_best}</p>
          <p className="text-xs text-purple-400 font-medium">Recorde pessoal</p>
        </div>
        <div className="col-span-2 p-4 rounded-xl text-center" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p className="text-sm text-blue-500 font-medium mb-1">Presenças consecutivas registradas</p>
          <p className="text-3xl font-bold text-blue-600">{student.presencas_consecutivas}</p>
          <p className="text-xs text-blue-400 mt-1">dias marcados pelo professor</p>
        </div>
      </div>

      {student.streak_current >= 7 && (
        <div className="mt-3 p-3 rounded-xl flex items-center gap-2" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <span className="text-green-500 text-lg">🎉</span>
          <p className="text-sm text-green-700 font-medium">
            Incrível! {student.character_name || student.name} está em uma sequência de {student.streak_current} dias!
          </p>
        </div>
      )}
    </div>
  );
}
