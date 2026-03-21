import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

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
  classes: { id: string; name: string }[];
  onClassChange: (classId: string | null) => void;
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

export function DailyActivityChart({ data, isLoading, classes, onClassChange }: Props) {
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const handleChange = (v: string) => {
    setSelectedClass(v);
    onClassChange(v === "all" ? null : v);
  };

  const formatted = (data ?? []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <div className="card-fantasy">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-display text-lg text-gold">📈 Atividade Diária</h3>
        <Select value={selectedClass} onValueChange={handleChange}>
          <SelectTrigger className="w-44 bg-dungeon-dark border-gold/30 text-primary-foreground">
            <SelectValue placeholder="Todas as turmas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
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
