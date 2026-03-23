import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ChildSummary } from "@/hooks/useParentPortal";

interface Props {
  summary: ChildSummary;
}

function formatDay(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return dateStr;
  }
}

export function ParentProgressChart({ summary }: Props) {
  const data = (summary.xp_events || [])
    .reduce<{ day: string; xp: number }[]>((acc, ev) => {
      const existing = acc.find(x => x.day === ev.day);
      if (existing) {
        existing.xp += ev.xp;
      } else {
        acc.push({ day: ev.day, xp: ev.xp });
      }
      return acc;
    }, [])
    .sort((a, b) => a.day.localeCompare(b.day))
    .map(d => ({ ...d, label: formatDay(d.day) }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-base font-bold text-slate-800 mb-2">Evolução — XP por dia</h3>
        <p className="text-sm text-slate-400 text-center py-8">Sem dados de XP neste período.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-base font-bold text-slate-800 mb-4">Evolução — XP por dia</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={40} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
            formatter={(value: number) => [`${value} XP`, 'XP ganho']}
          />
          <Line
            type="monotone"
            dataKey="xp"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#6366f1' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
