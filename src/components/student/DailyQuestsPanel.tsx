// Patch 8.4 — Daily quests panel for the student profile.
//
// Reads get_my_daily_quests (3 active quests for today + streak), shows
// progress bars per quest, badges category colors, and a streak ribbon
// counting toward the 7-day Rare chest reward.
//
// Auto-fires ensure_my_daily_quests on mount (cheap if already assigned).

import { useCallback, useEffect, useState } from "react";
import { Loader2, Swords, Users, BookOpen, Flame, Check, Sparkles } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";

type Category = "combate" | "social" | "academica";
interface QuestRow {
  id: string;
  quest_id: string;
  category: Category;
  description: string;
  condition_type: string;
  condition_value: number;
  progress: number;
  completed_at: string | null;
  reward_coins: number;
  reward_diamonds: number;
}
interface Payload {
  date: string;
  quests: QuestRow[];
  streak: number;
  last_completed_date: string | null;
  completed: number;
  total: number;
}

const CAT_META: Record<Category, { label: string; tone: string; Icon: React.FC<{ size?: number }> }> = {
  combate:   { label: "Combate",   tone: "#f05050", Icon: Swords },
  social:    { label: "Social",    tone: "#60c8f8", Icon: Users },
  academica: { label: "Acadêmica", tone: "#4ade80", Icon: BookOpen },
};

export function DailyQuestsPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Ensure today's quests are assigned (idempotent), then read.
    await supabaseStudent.rpc("ensure_my_daily_quests");
    // Trigger an evaluation in case counters changed since last load.
    await supabaseStudent.rpc("check_my_daily_quests");
    const { data: payload, error } = await supabaseStudent.rpc("get_my_daily_quests");
    if (error) console.warn("[DailyQuestsPanel]", error);
    setData((payload as Payload | null) ?? null);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading && !data) {
    return <div className="dq-section"><div className="dq-load"><Loader2 size={18} className="animate-spin" /></div></div>;
  }
  if (!data) return null;

  return (
    <section className="dq-section">
      <style>{CSS}</style>
      <div className="dq-header">
        <Sparkles size={14} style={{ color: "#f5c84b" }} />
        <h3>Quests do Dia</h3>
        <span className="dq-count">{data.completed}/{data.total}</span>
      </div>

      <div className="dq-streak">
        <Flame size={14} style={{ color: data.streak > 0 ? "#fbbf24" : "rgba(255,255,255,0.3)" }} />
        <span className="dq-streak-num">{data.streak}</span>
        <span className="dq-streak-cap">/ 7 dias</span>
        <div className="dq-streak-bar"><div style={{ width: `${Math.min(100, (data.streak / 7) * 100)}%` }} /></div>
        {data.streak >= 6 && (
          <span className="dq-streak-hint">Falta 1 dia para o Baú Raro!</span>
        )}
      </div>

      <div className="dq-grid">
        {data.quests.map(q => {
          const meta = CAT_META[q.category] ?? CAT_META.academica;
          const pct = Math.min(100, (q.progress / q.condition_value) * 100);
          const done = q.completed_at != null;
          return (
            <div
              key={q.id}
              className={`dq-card ${done ? "done" : ""}`}
              style={{ ['--tone' as string]: meta.tone } as React.CSSProperties}
            >
              <div className="dq-card-head">
                <meta.Icon size={12} />
                <span>{meta.label}</span>
                {done && <Check size={12} className="dq-done-icon" />}
              </div>
              <div className="dq-card-desc">{q.description}</div>
              <div className="dq-card-bar">
                <div style={{ width: `${pct}%` }} />
              </div>
              <div className="dq-card-foot">
                <span className="dq-progress">{Math.min(q.progress, q.condition_value)} / {q.condition_value}</span>
                <span className="dq-reward">+{q.reward_coins}🪙 +{q.reward_diamonds}💎</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const CSS = `
.dq-section {
  padding: 12px 14px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(245,158,11,0.05), rgba(74,222,128,0.05));
  border: 1px solid rgba(245,158,11,0.18);
  color: #e6f0ff; font-family: 'Exo 2', sans-serif;
}
.dq-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  font-family: 'Cinzel', serif; font-size: 12px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase; color: #f5c84b;
}
.dq-header h3 { margin: 0; flex: 1; font: inherit; }
.dq-count {
  font-family: 'Share Tech Mono', monospace; font-size: 10px;
  padding: 1px 8px; border-radius: 999px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
}
.dq-load { display: flex; justify-content: center; padding: 14px; color: #f5c84b; }

.dq-streak {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; margin-bottom: 10px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
}
.dq-streak-num { font-family: 'Share Tech Mono', monospace; font-size: 16px; font-weight: 800; color: #fff; }
.dq-streak-cap { font-size: 10.5px; color: rgba(255,255,255,0.55); letter-spacing: 0.05em; }
.dq-streak-bar {
  flex: 1; height: 6px; border-radius: 999px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.05);
  overflow: hidden;
}
.dq-streak-bar > div {
  height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b);
  transition: width 0.4s ease;
}
.dq-streak-hint {
  font-size: 10px; color: #fbbf24; font-weight: 700; letter-spacing: 0.05em;
  background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.4);
  padding: 2px 8px; border-radius: 999px;
}

.dq-grid { display: grid; gap: 8px; grid-template-columns: 1fr; }

.dq-card {
  --tone: #888;
  padding: 10px 12px; border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid color-mix(in srgb, var(--tone) 35%, rgba(255,255,255,0.07));
  transition: all 0.18s ease;
}
.dq-card.done {
  background: color-mix(in srgb, var(--tone) 10%, transparent);
  border-color: var(--tone);
}
.dq-card-head {
  display: flex; align-items: center; gap: 6px;
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--tone); margin-bottom: 4px;
}
.dq-done-icon { margin-left: auto; color: var(--tone); }
.dq-card-desc { font-size: 12.5px; color: #fff; line-height: 1.35; margin-bottom: 8px; }
.dq-card-bar {
  height: 5px; border-radius: 999px; overflow: hidden;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05);
}
.dq-card-bar > div {
  height: 100%;
  background: linear-gradient(90deg, color-mix(in srgb, var(--tone) 50%, transparent), var(--tone));
  transition: width 0.4s ease;
}
.dq-card-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 6px;
  font-family: 'Share Tech Mono', monospace; font-size: 10px;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.04em;
}
.dq-reward { color: rgba(255,255,255,0.7); }
`;
