import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RiskStudent {
  student_id: string;
  student_name: string;
  class_id: string;
  level: number;
  days_since_last_login: number;
  logins_last_14_days: number;
  missions_last_14_days: number;
  streak_current: number;
  risk_score: number;
}

interface Props {
  data: RiskStudent[] | null;
  isLoading: boolean;
  classes: { id: string; name: string }[];
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 70) return <span className="flex items-center gap-1 text-red-400 text-sm font-bold"><AlertTriangle size={14} /> {score}</span>;
  if (score >= 30) return <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold"><Clock size={14} /> {score}</span>;
  return <span className="flex items-center gap-1 text-emerald-400 text-sm font-bold"><CheckCircle size={14} /> {score}</span>;
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function StudentRiskPanel({ data, isLoading, classes }: Props) {
  if (isLoading) return (
    <div className="card-fantasy">
      <h3 className="font-display text-lg text-gold mb-4">🛡️ Alunos em Risco</h3>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    </div>
  );

  const className = (classId: string) => classes.find((c) => c.id === classId)?.name ?? "Turma";

  return (
    <div className="card-fantasy">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-gold">🛡️ Alunos em Risco</h3>
        <span className="text-xs text-muted-foreground">Score 0–100 (maior = mais risco)</span>
      </div>

      {(!data || data.length === 0) ? (
        <p className="text-muted-foreground text-sm text-center py-8">Nenhum dado disponível ainda.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {data.slice(0, 20).map((s) => (
            <div key={s.student_id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors">
              <Avatar name={s.student_name} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{s.student_name}</p>
                <p className="text-xs text-muted-foreground">
                  {className(s.class_id)} · Nível {s.level}
                  {s.days_since_last_login >= 999 ? " · Nunca logou" : s.days_since_last_login > 0 ? ` · ${s.days_since_last_login}d sem login` : ""}
                  {s.streak_current === 0 ? " · Streak zerado" : ""}
                  {s.missions_last_14_days === 0 ? " · 0 missões/14d" : ""}
                </p>
              </div>
              <RiskBadge score={s.risk_score} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
