import { Star, Flame, CheckSquare, Sword, BookOpen, Calendar } from "lucide-react";
import type { ChildSummary } from "@/hooks/useParentPortal";

interface Props {
  summary: ChildSummary;
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-800" style={{ lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

export function ParentSummaryCard({ summary }: Props) {
  const { student } = summary;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {student.character_name || student.name}
          </h2>
          {student.character_name && (
            <p className="text-sm text-slate-500">{student.name}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {student.class_name && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}>
                {student.class_name}
              </span>
            )}
            {student.character_class && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#fdf4ff', color: '#a855f7', border: '1px solid #e9d5ff' }}>
                {student.character_class}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-3xl font-bold text-blue-600">{student.level}</p>
          <p className="text-xs text-slate-400">nível</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatItem icon={<Flame size={18} />} label="Sequência" value={`${student.streak_current} dias`} color="#f97316" />
        <StatItem icon={<CheckSquare size={18} />} label="Missões" value={student.total_missions} color="#10b981" />
        <StatItem icon={<Sword size={18} />} label="Bosses" value={student.total_bosses} color="#ef4444" />
        <StatItem icon={<Star size={18} />} label="XP Total" value={student.xp.toLocaleString('pt-BR')} color="#f59e0b" />
        <StatItem icon={<BookOpen size={18} />} label="Frequência" value={`${student.presencas_consecutivas} dias`} color="#3b82f6" />
        <StatItem icon={<Calendar size={18} />} label="Logins (período)" value={summary.login_count} color="#6366f1" />
      </div>
    </div>
  );
}
