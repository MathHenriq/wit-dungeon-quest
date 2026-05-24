// Patch 4.1 — Weekly Rankings UI.
//
// Reads from RPC public.get_weekly_ranking (live in-progress + finalized last
// week) for the four ranking types: sala, geral, pvp, guildas.
//
// A small "my position" card shows where the caller stands in each ranking.

import { useEffect, useMemo, useState } from "react";
import { Loader2, Crown, Users, Globe2, Swords, Shield, Trophy, CalendarDays, Clock } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { useOpenProfileCard } from "@/components/student/ProfileCard";
import type { Student } from "@/types";

type RankingType = "sala" | "geral" | "pvp" | "guildas";

interface Row {
  rank: number;
  entity_id: string;
  entity_name: string | null;
  score: number;
  week_start: string;
  week_end: string;
}

interface MyPositions {
  sala?: { position: number; score: number };
  geral?: { position: number; score: number };
  pvp?: { position: number; score: number };
  guildas?: { position: number; score: number };
}

const TABS: { key: RankingType; label: string; Icon: React.FC<{ size?: number }>; tone: string }[] = [
  { key: "sala",    label: "Sala",    Icon: Users,   tone: "#60c8f8" },
  { key: "geral",   label: "Geral",   Icon: Globe2,  tone: "#f5c84b" },
  { key: "pvp",     label: "PvP",     Icon: Swords,  tone: "#f05050" },
  { key: "guildas", label: "Guildas", Icon: Shield,  tone: "#b57bee" },
];

const SCORE_LABEL: Record<RankingType, string> = {
  sala:    "XP",
  geral:   "XP",
  pvp:     "Vitórias",
  guildas: "XP coletivo",
};

function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
}

interface Props {
  student: Student;
}

export function WeeklyRankingsScreen({ student }: Props) {
  const [activeTab, setActiveTab] = useState<RankingType>("sala");
  const [mode, setMode] = useState<"live" | "finalized">("live");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPositions, setMyPositions] = useState<MyPositions>({});
  const openProfile = useOpenProfileCard();
  const canOpenProfile = activeTab !== "guildas";
  const [windowDates, setWindowDates] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabaseStudent.rpc("get_weekly_ranking", {
        p_ranking_type: activeTab,
        p_finalized: mode === "finalized",
        p_teacher_id: student.teacher_id,
        p_class_id: activeTab === "sala" ? student.class_id : null,
        p_limit: 200,
        p_offset: 0,
      });
      if (cancelled) return;
      if (error) {
        console.error("[WeeklyRankingsScreen] get_weekly_ranking", error);
        setRows([]);
      } else {
        const r = (data ?? []) as Row[];
        setRows(r);
        if (r.length > 0) setWindowDates({ start: r[0].week_start, end: r[0].week_end });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeTab, mode, student.teacher_id, student.class_id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabaseStudent.rpc("get_my_weekly_positions", {
        p_finalized: mode === "finalized",
      });
      if (cancelled) return;
      if (!error && data && typeof data === "object") {
        setMyPositions(data as MyPositions);
      }
    })();
    return () => { cancelled = true; };
  }, [mode]);

  const top1 = rows[0];
  const otherRows = rows.slice(1);
  const tabMeta = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="w-full mx-auto" style={{ maxWidth: 960, padding: '12px 8px 64px', fontFamily: "'Exo 2', sans-serif", color: '#e6f0ff' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="wr-header">
        <div className="wr-title">
          <Trophy size={20} style={{ color: '#f5c84b' }} />
          <h1>Rankings Semanais</h1>
        </div>
        <p className="wr-sub">
          Premiação semanal. Reinicia toda segunda-feira às 00:01 (BRT).
        </p>

        {/* Mode toggle */}
        <div className="wr-mode-toggle">
          <button
            className={`wr-mode-btn ${mode === "live" ? "active" : ""}`}
            onClick={() => setMode("live")}
          >
            <Clock size={13} /> Em curso
          </button>
          <button
            className={`wr-mode-btn ${mode === "finalized" ? "active" : ""}`}
            onClick={() => setMode("finalized")}
          >
            <CalendarDays size={13} /> Semana anterior
          </button>
        </div>

        {windowDates && (
          <div className="wr-window">
            {mode === "live" ? "Janela atual:" : "Período finalizado:"}{" "}
            <strong>{formatDate(windowDates.start)} — {formatDate(windowDates.end)}</strong>
          </div>
        )}
      </div>

      {/* My positions strip */}
      <div className="wr-mine">
        {TABS.map(t => {
          const p = myPositions[t.key];
          return (
            <div key={t.key} className={`wr-mine-card ${activeTab === t.key ? "active" : ""}`}
                 style={{ ['--tone' as string]: t.tone } as React.CSSProperties}
                 onClick={() => setActiveTab(t.key)}>
              <div className="wr-mine-head">
                <t.Icon size={13} />
                <span>{t.label}</span>
              </div>
              <div className="wr-mine-pos">
                {p ? `#${p.position}` : <span className="wr-mine-dash">—</span>}
              </div>
              <div className="wr-mine-score">
                {p ? `${p.score} ${SCORE_LABEL[t.key]}` : "Sem registros"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="wr-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`wr-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
            style={{ ['--tone' as string]: t.tone } as React.CSSProperties}
          >
            <t.Icon size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={28} className="animate-spin" style={{ color: tabMeta.tone }} />
        </div>
      ) : rows.length === 0 ? (
        <div className="wr-empty">
          {mode === "finalized"
            ? "Nenhum ranking finalizado ainda. Aguarde o próximo fim de semana."
            : "Ainda sem registros nesta semana. Conquiste XP, vença batalhas e suba na tabela!"}
        </div>
      ) : (
        <>
          {/* Top 1 — crown highlight */}
          {top1 && (
            <Top1Card
              row={top1}
              type={activeTab}
              tone={tabMeta.tone}
              highlight={top1.entity_id === student.id}
              onOpen={canOpenProfile ? () => openProfile(top1.entity_id) : undefined}
            />
          )}

          {/* The rest */}
          {otherRows.length > 0 && (
            <div className="wr-list">
              {otherRows.map(r => (
                <div
                  key={r.entity_id}
                  className={`wr-row ${r.entity_id === student.id ? "me" : ""}`}
                  style={{
                    ['--tone' as string]: tabMeta.tone,
                    cursor: canOpenProfile ? "pointer" : undefined,
                  } as React.CSSProperties}
                  onClick={canOpenProfile ? () => openProfile(r.entity_id) : undefined}
                >
                  <div className="wr-pos">#{r.rank}</div>
                  <div className="wr-name">{r.entity_name ?? "—"}{r.entity_id === student.id ? " (você)" : ""}</div>
                  <div className="wr-score">{r.score} <span className="wr-score-unit">{SCORE_LABEL[activeTab]}</span></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Top1Card({ row, type, tone, highlight, onOpen }: { row: Row; type: RankingType; tone: string; highlight: boolean; onOpen?: () => void }) {
  return (
    <div className={`wr-top1 ${highlight ? "me" : ""}`}
         style={{ ['--tone' as string]: tone, cursor: onOpen ? "pointer" : undefined } as React.CSSProperties}
         onClick={onOpen}>
      <div className="wr-top1-crown">
        <Crown size={28} />
      </div>
      <div className="wr-top1-body">
        <div className="wr-top1-label">TOP 1 · {type.toUpperCase()}</div>
        <div className="wr-top1-name">{row.entity_name ?? "—"}{highlight ? " (você)" : ""}</div>
        <div className="wr-top1-score">{row.score} <span>{SCORE_LABEL[type]}</span></div>
      </div>
    </div>
  );
}

const CSS = `
@keyframes wr-crown-pulse {
  0%, 100% { transform: translateY(0) rotate(-4deg); filter: drop-shadow(0 0 12px var(--tone)); }
  50%      { transform: translateY(-3px) rotate(4deg); filter: drop-shadow(0 0 22px var(--tone)); }
}
@keyframes wr-glow {
  0%, 100% { box-shadow: 0 0 0 1px var(--tone), 0 0 24px color-mix(in srgb, var(--tone) 35%, transparent); }
  50%      { box-shadow: 0 0 0 1px var(--tone), 0 0 44px color-mix(in srgb, var(--tone) 55%, transparent); }
}
@keyframes wr-shimmer {
  from { background-position: -200% center; }
  to   { background-position:  200% center; }
}

.wr-header { padding: 6px 4px 16px; }
.wr-title { display: flex; align-items: center; gap: 10px; }
.wr-title h1 {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 22px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  background: linear-gradient(90deg, #f5c84b, #fbeaa0, #f5c84b);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: wr-shimmer 6s linear infinite;
}
.wr-sub { margin: 6px 0 14px; font-size: 12.5px; opacity: 0.55; letter-spacing: 0.04em; }
.wr-mode-toggle { display: inline-flex; gap: 4px; padding: 4px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; }
.wr-mode-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 7px; cursor: pointer; border: none;
  background: transparent; color: rgba(255,255,255,0.4);
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  transition: all 0.15s ease;
  font-family: inherit;
}
.wr-mode-btn:hover { color: rgba(255,255,255,0.7); }
.wr-mode-btn.active {
  background: rgba(245,200,75,0.16); color: #f5c84b;
  box-shadow: inset 0 0 0 1px rgba(245,200,75,0.35);
}
.wr-window { margin-top: 10px; font-size: 11px; opacity: 0.55; letter-spacing: 0.05em; }

.wr-mine {
  display: grid; gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 14px 0 20px;
}
@media (max-width: 600px) { .wr-mine { grid-template-columns: repeat(2, 1fr); } }
.wr-mine-card {
  --tone: #888;
  padding: 10px 12px; border-radius: 10px; cursor: pointer;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  transition: all 0.18s ease;
}
.wr-mine-card:hover { background: rgba(255,255,255,0.06); border-color: var(--tone); }
.wr-mine-card.active {
  background: color-mix(in srgb, var(--tone) 8%, transparent);
  border-color: var(--tone);
  box-shadow: 0 0 18px color-mix(in srgb, var(--tone) 20%, transparent);
}
.wr-mine-head {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--tone); margin-bottom: 4px;
}
.wr-mine-pos {
  font-family: 'Share Tech Mono', monospace;
  font-size: 22px; font-weight: 800; color: #fff; line-height: 1;
}
.wr-mine-dash { color: rgba(255,255,255,0.25); }
.wr-mine-score { font-size: 10.5px; opacity: 0.55; margin-top: 4px; }

.wr-tabs {
  display: flex; gap: 6px; padding: 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; margin-bottom: 14px;
  overflow-x: auto;
}
.wr-tab {
  --tone: #888;
  flex: 1; min-width: 78px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 10px; border-radius: 8px; cursor: pointer; border: none;
  background: transparent; color: rgba(255,255,255,0.45);
  font-family: inherit; font-size: 12px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  transition: all 0.15s ease;
}
.wr-tab:hover { color: rgba(255,255,255,0.8); }
.wr-tab.active { color: var(--tone); background: color-mix(in srgb, var(--tone) 10%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tone) 40%, transparent); }

.wr-empty {
  padding: 60px 24px; text-align: center;
  color: rgba(255,255,255,0.35); font-size: 13px; line-height: 1.6;
}

.wr-top1 {
  --tone: #f5c84b;
  position: relative; display: flex; gap: 16px; align-items: center;
  padding: 18px 18px 18px 22px; margin-bottom: 16px;
  background:
    radial-gradient(ellipse at top right, color-mix(in srgb, var(--tone) 18%, transparent), transparent 60%),
    linear-gradient(135deg, #0d1424 0%, #060912 100%);
  border-radius: 14px;
  animation: wr-glow 2.4s ease-in-out infinite;
  overflow: hidden;
}
.wr-top1.me::before {
  content: "VOCÊ"; position: absolute; top: 8px; right: 12px;
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.2em;
  padding: 3px 8px; border-radius: 999px;
  background: rgba(74,222,128,0.18); color: #4ade80;
  border: 1px solid rgba(74,222,128,0.4);
}
.wr-top1-crown { color: var(--tone); animation: wr-crown-pulse 2.6s ease-in-out infinite; }
.wr-top1-body { flex: 1; min-width: 0; }
.wr-top1-label {
  font-size: 10px; font-weight: 800; letter-spacing: 0.25em;
  color: var(--tone); opacity: 0.8; margin-bottom: 4px;
}
.wr-top1-name {
  font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700;
  color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wr-top1-score {
  margin-top: 4px; font-family: 'Share Tech Mono', monospace;
  font-size: 16px; font-weight: 800; color: var(--tone);
}
.wr-top1-score span {
  font-size: 11px; color: rgba(255,255,255,0.4);
  margin-left: 6px; letter-spacing: 0.1em; text-transform: uppercase;
}

.wr-list { display: flex; flex-direction: column; gap: 4px; }
.wr-row {
  --tone: #888;
  display: grid; grid-template-columns: 56px 1fr auto; align-items: center;
  gap: 12px; padding: 10px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.04);
  transition: all 0.15s ease;
}
.wr-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
.wr-row.me {
  background: color-mix(in srgb, var(--tone) 8%, rgba(74,222,128,0.06));
  border-color: rgba(74,222,128,0.35);
}
.wr-pos {
  font-family: 'Share Tech Mono', monospace; font-weight: 800;
  font-size: 14px; color: rgba(255,255,255,0.5);
}
.wr-name {
  font-size: 13.5px; font-weight: 600; color: #fff;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wr-score { font-family: 'Share Tech Mono', monospace; font-weight: 800; color: var(--tone); }
.wr-score-unit { font-size: 10px; color: rgba(255,255,255,0.4); margin-left: 4px; letter-spacing: 0.1em; text-transform: uppercase; }
`;
