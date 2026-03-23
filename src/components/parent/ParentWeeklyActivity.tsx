import { CheckCircle, Trophy, Lightbulb, ChevronRight } from "lucide-react";
import type { ChildSummary } from "@/hooks/useParentPortal";

interface Props {
  summary: ChildSummary;
}

export function ParentWeeklyActivity({ summary }: Props) {
  const hasActivity =
    (summary.missions_completed?.length ?? 0) > 0 ||
    (summary.bosses_faced?.length ?? 0) > 0 ||
    (summary.skills_completed?.length ?? 0) > 0 ||
    (summary.achievements?.length ?? 0) > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        Esta Semana
      </h3>

      {!hasActivity ? (
        <p className="text-sm text-slate-400 text-center py-6">
          Nenhuma atividade registrada nesta semana.
        </p>
      ) : (
        <div className="space-y-4">
          {(summary.skills_completed?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tópicos Aprendidos</p>
              <div className="space-y-1.5">
                {summary.skills_completed.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: '#f0fdf4' }}>
                    <Lightbulb size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{s.name}</p>
                      {s.description && <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(summary.missions_completed?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Missões Completadas</p>
              <div className="space-y-1.5">
                {summary.missions_completed.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: '#eff6ff' }}>
                    <CheckCircle size={15} className="text-blue-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-slate-700 flex-1">{m.title}</p>
                    {m.reward > 0 && (
                      <span className="text-xs text-amber-600 font-bold flex-shrink-0">+{m.reward} moedas</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(summary.bosses_faced?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Desafios Enfrentados</p>
              <div className="space-y-1.5">
                {summary.bosses_faced.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: b.defeated ? '#fdf4ff' : '#fff7ed' }}>
                    <Trophy size={15} className={b.defeated ? "text-purple-500" : "text-orange-400"} />
                    <p className="text-sm font-medium text-slate-700 flex-1 truncate">{b.title || b.boss_name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${b.defeated ? 'text-purple-600 bg-purple-50' : 'text-orange-600 bg-orange-50'}`}>
                      {b.defeated ? `${b.score}%` : 'Em progresso'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(summary.achievements?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Conquistas</p>
              <div className="space-y-1.5">
                {summary.achievements.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: '#fffbeb' }}>
                    <ChevronRight size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
