import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface ClassData {
  class_id: string;
  class_name: string;
  student_count: number;
  avg_level: number;
  total_logins: number;
  total_missions: number;
  active_students: number;
  avg_streak: number;
}

interface Props {
  data: ClassData[] | null;
  isLoading: boolean;
}

type Metric = "total_logins" | "total_missions" | "avg_level" | "avg_streak";

const METRICS: { key: Metric; label: string; color: string }[] = [
  { key: "total_logins",   label: "Logins",        color: "#f59e0b" },
  { key: "total_missions", label: "Missões",        color: "#10b981" },
  { key: "avg_level",      label: "Nível Médio",    color: "#8b5cf6" },
  { key: "avg_streak",     label: "Streak Médio",   color: "#ef4444" },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dungeon-dark border border-gold/30 rounded-lg p-3 text-sm">
      <p className="font-display text-gold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export function ClassComparisonChart({ data, isLoading }: Props) {
  const [metric, setMetric] = useState<Metric>("total_logins");
  const current = METRICS.find((m) => m.key === metric)!;

  const formatted = (data ?? []).map((d) => ({
    name: d.class_name,
    [metric]: d[metric],
    Alunos: d.student_count,
  }));

  return (
    <div className="card-fantasy">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-display text-lg text-gold">⚔️ Comparativo de Turmas</h3>
        <div className="flex flex-wrap gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${metric === m.key ? "text-dungeon-dark font-bold" : "text-muted-foreground hover:text-foreground"}`}
              style={metric === m.key ? { backgroundColor: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={metric} name={current.label} fill={current.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
