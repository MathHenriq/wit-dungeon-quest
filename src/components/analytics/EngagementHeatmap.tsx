import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface HeatCell {
  day_of_week: number;
  hour: number;
  count: number;
}

interface Props {
  data: HeatCell[] | null;
  isLoading: boolean;
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function intensity(count: number, max: number): string {
  if (max === 0 || count === 0) return "bg-white/5";
  const ratio = count / max;
  if (ratio < 0.2) return "bg-gold/10";
  if (ratio < 0.4) return "bg-gold/25";
  if (ratio < 0.6) return "bg-gold/45";
  if (ratio < 0.8) return "bg-gold/65";
  return "bg-gold/85";
}

export function EngagementHeatmap({ data, isLoading }: Props) {
  const [tooltip, setTooltip] = useState<{ day: number; hour: number; count: number } | null>(null);

  if (isLoading) return <Skeleton className="h-56 w-full" />;

  const map: Record<string, number> = {};
  let max = 0;
  (data ?? []).forEach((d) => {
    const key = `${d.day_of_week}-${d.hour}`;
    map[key] = d.count;
    if (d.count > max) max = d.count;
  });

  return (
    <div className="card-fantasy">
      <h3 className="font-display text-lg text-gold mb-4">🔥 Mapa de Calor de Engajamento</h3>
      <p className="text-xs text-muted-foreground mb-3">Horário × dia da semana com maior atividade</p>

      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Hour axis top */}
          <div className="flex mb-1 ml-10">
            {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
              <div key={h} className="text-[10px] text-muted-foreground" style={{ width: `${100 / 8}%` }}>
                {String(h).padStart(2, "0")}h
              </div>
            ))}
          </div>

          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] text-muted-foreground w-8 shrink-0">{day}</span>
              <div className="flex gap-0.5 flex-1">
                {HOURS.map((hour) => {
                  const count = map[`${dayIdx}-${hour}`] ?? 0;
                  return (
                    <div
                      key={hour}
                      className={`flex-1 h-4 rounded-sm cursor-default transition-all ${intensity(count, max)}`}
                      onMouseEnter={() => setTooltip({ day: dayIdx, hour, count })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {tooltip && (
        <div className="mt-3 text-xs text-center text-muted-foreground">
          {DAYS[tooltip.day]} às {String(tooltip.hour).padStart(2, "0")}h — <span className="text-gold font-bold">{tooltip.count} eventos</span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-muted-foreground">Menos</span>
        {["bg-white/5", "bg-gold/10", "bg-gold/25", "bg-gold/45", "bg-gold/65", "bg-gold/85"].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
        ))}
        <span className="text-xs text-muted-foreground">Mais</span>
      </div>
    </div>
  );
}
