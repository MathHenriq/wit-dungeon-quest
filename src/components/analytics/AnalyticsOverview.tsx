import { Users, Zap, Scroll, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  overview: Record<string, number> | null;
  isLoading: boolean;
}

interface KpiCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  color: string;
}

function KpiCard({ icon, value, label, sub, color }: KpiCardProps) {
  return (
    <div className="card-fantasy flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} shrink-0`}>{icon}</div>
      <div>
        <p className="text-3xl font-bold font-display">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-gold mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AnalyticsOverview({ overview, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  const total = overview?.total_students ?? 0;
  const active = overview?.active_students_period ?? 0;
  const engagement = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard
        icon={<Users size={22} className="text-blue-400" />}
        color="bg-blue-500/10"
        value={String(active)}
        label="Aventureiros Ativos"
        sub={`de ${total} no total`}
      />
      <KpiCard
        icon={<Scroll size={22} className="text-emerald-400" />}
        color="bg-emerald-500/10"
        value={String(overview?.total_missions_completed ?? 0)}
        label="Missões Completadas"
        sub={`+${overview?.total_challenges_completed ?? 0} desafios`}
      />
      <KpiCard
        icon={<Zap size={22} className="text-gold" />}
        color="bg-gold/10"
        value={String(overview?.avg_daily_logins ?? 0)}
        label="Logins / dia (média)"
        sub={`${overview?.total_logins ?? 0} total no período`}
      />
      <KpiCard
        icon={<TrendingUp size={22} className="text-purple-400" />}
        color="bg-purple-500/10"
        value={`${engagement}%`}
        label="Taxa de Engajamento"
        sub={`${overview?.avg_session_minutes ?? 0} min/sessão`}
      />
    </div>
  );
}
