import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface DayData {
  date: string;
  logins: number;
  missions: number;
  challenges: number;
  unique_students: number;
}

interface Props {
  data: DayData[] | null;
  isLoading: boolean;
}

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

export function DailyActivityChart({ data, isLoading }: Props) {
  const formatted = (data ?? []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <div className="card-fantasy">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-display text-lg text-gold">📈 Atividade Diária</h3>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
            <Line type="monotone" dataKey="logins"    name="Logins"    stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="missions"  name="Missões"   stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="challenges" name="Desafios" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
