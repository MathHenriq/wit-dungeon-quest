import { useState, useEffect } from "react";
import { TrendingUp, Flame, Trophy, BarChart2, Users } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import type { Student } from "@/types";

interface RankingEntry {
  id: string;
  name: string;
  character_name: string | null;
  character_class: string | null;
  level: number;
  coins: number;
  presencas_consecutivas: number;
}

interface ProgressRankingProps {
  student: Student;
  classId: string;
  showClassicToggle?: boolean;
}

const LEVEL_GROUPS = [
  { label: "Nível 1-3", min: 1, max: 3 },
  { label: "Nível 4-6", min: 4, max: 6 },
  { label: "Nível 7-9", min: 7, max: 9 },
  { label: "Nível 10+", min: 10, max: 999 },
];

function getGroupLabel(level: number): string {
  const g = LEVEL_GROUPS.find((g) => level >= g.min && level <= g.max);
  return g?.label ?? "Nível 1-3";
}

export function ProgressRanking({ student, classId, showClassicToggle = false }: ProgressRankingProps) {
  const [showClassic, setShowClassic] = useState(false);
  const [classicStudents, setClassicStudents] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabaseStudent
        .from("students")
        .select("id, name, character_name, character_class, level, coins, presencas_consecutivas")
        .eq("class_id", classId)
        .eq("status", "active")
        .order("level", { ascending: false })
        .order("coins", { ascending: false });
      if (data) setClassicStudents(data as RankingEntry[]);
      setLoading(false);
    }
    load();
  }, [classId]);

  const myGroupLabel = getGroupLabel(student.level);
  const topStreak = classicStudents.reduce(
    (best, s) => (s.presencas_consecutivas > best.presencas_consecutivas ? s : best),
    classicStudents[0] ?? { name: "—", character_name: null, presencas_consecutivas: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Toggle */}
      {showClassicToggle && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowClassic(false)}
            className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
            style={{
              background: !showClassic ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${!showClassic ? "rgba(0,229,255,0.35)" : "rgba(255,255,255,0.08)"}`,
              color: !showClassic ? "#00e5ff" : "rgba(255,255,255,0.4)",
              fontFamily: "Rajdhani, sans-serif",
            }}
          >
            <TrendingUp size={14} className="inline mr-1" />
            Meu Progresso
          </button>
          <button
            onClick={() => setShowClassic(true)}
            className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
            style={{
              background: showClassic ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${showClassic ? "rgba(255,215,0,0.35)" : "rgba(255,255,255,0.08)"}`,
              color: showClassic ? "#ffd700" : "rgba(255,255,255,0.4)",
              fontFamily: "Rajdhani, sans-serif",
            }}
          >
            <Trophy size={14} className="inline mr-1" />
            Ranking
          </button>
        </div>
      )}

      {/* ── My Progress view ── */}
      {!showClassic && (
        <>
          {/* 2-column stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Streak card */}
            <div
              className="holo-panel p-4 flex flex-col gap-2"
              style={{ borderColor: "rgba(255,107,53,0.3)" }}
            >
              <div className="flex items-center gap-2 text-orange-400">
                <Flame size={18} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ fontFamily: "Rajdhani, sans-serif" }}
                >
                  Sequência
                </span>
              </div>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                {student.presencas_consecutivas}
              </p>
              <p className="text-white/40 text-xs">aulas consecutivas</p>
            </div>

            {/* Level card */}
            <div
              className="holo-panel p-4 flex flex-col gap-2"
              style={{ borderColor: "rgba(0,229,255,0.3)" }}
            >
              <div className="flex items-center gap-2 text-cyan-400">
                <TrendingUp size={18} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ fontFamily: "Rajdhani, sans-serif" }}
                >
                  Nível
                </span>
              </div>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                {student.level}
              </p>
              <p className="text-white/40 text-xs">{student.coins} moedas</p>
            </div>
          </div>

          {/* Group card */}
          <div
            className="holo-panel p-4 text-center"
            style={{ borderColor: "rgba(255,215,0,0.25)" }}
          >
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Você está no grupo</p>
            <p
              className="text-xl font-bold text-yellow-400"
              style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "2px" }}
            >
              {myGroupLabel}
            </p>
          </div>

          {/* Class highlights */}
          <div className="holo-panel">
            <div
              className="text-xs font-bold mb-4 uppercase tracking-wider text-white/50 flex items-center gap-2"
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              <Users size={14} />
              Destaque da Turma
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 mb-0.5">Maior sequência</p>
                <p className="font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                  {topStreak.character_name ?? topStreak.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40 mb-0.5">streak</p>
                <p className="text-2xl font-bold text-orange-400" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                  {topStreak.presencas_consecutivas}
                </p>
              </div>
            </div>
            <div
              className="mt-3 pt-3 flex items-center justify-between text-sm"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-white/40 flex items-center gap-1">
                <Users size={13} />
                Total de aventureiros
              </span>
              <span className="text-white font-bold">{classicStudents.length}</span>
            </div>
          </div>

          {/* Level distribution */}
          <div className="holo-panel">
            <div
              className="text-xs font-bold mb-4 uppercase tracking-wider text-white/50 flex items-center gap-2"
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              <BarChart2 size={14} />
              Distribuição de Níveis
            </div>
            <div className="space-y-3">
              {LEVEL_GROUPS.map((group) => {
                const count = classicStudents.filter(
                  (s) => s.level >= group.min && s.level <= group.max
                ).length;
                const total = classicStudents.length || 1;
                const pct = Math.round((count / total) * 100);
                const isMyGroup = group.label === myGroupLabel;
                return (
                  <div key={group.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span
                        className="font-semibold"
                        style={{ color: isMyGroup ? "#00e5ff" : "rgba(255,255,255,0.5)" }}
                      >
                        {group.label}
                        {isMyGroup && " ◀ você"}
                      </span>
                      <span className="text-white/40">
                        {count} aventureiro{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isMyGroup ? "#00e5ff" : "rgba(255,255,255,0.15)",
                          boxShadow: isMyGroup ? "0 0 6px rgba(0,229,255,0.4)" : "none",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Classic Ranking view ── */}
      {showClassic && (
        <div className="holo-panel">
          <div
            className="text-xs font-bold mb-4 uppercase tracking-wider text-white/50 flex items-center gap-2"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            <Trophy size={14} />
            Ranking da Turma
          </div>
          <ul role="list" className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {classicStudents.map((s, idx) => {
              const pos = idx + 1;
              const isMe = s.id === student.id;
              const posColor =
                pos === 1 ? "#ffd700" : pos === 2 ? "#c0c0c0" : pos === 3 ? "#cd7f32" : "rgba(255,255,255,0.3)";

              return (
                <li
                  key={s.id}
                  role="listitem"
                  className="flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{
                    background: isMe ? "rgba(0,229,255,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isMe ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  <span
                    className="w-8 text-center font-bold text-lg flex-shrink-0"
                    style={{ fontFamily: "Rajdhani, sans-serif", color: posColor }}
                  >
                    {pos}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold text-white text-sm truncate flex items-center gap-2"
                      style={{ fontFamily: "Rajdhani, sans-serif" }}
                    >
                      {s.character_name ?? s.name}
                      {isMe && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(0,229,255,0.12)", color: "#00e5ff" }}
                        >
                          você
                        </span>
                      )}
                    </p>
                    {s.character_class && (
                      <p className="text-white/40 text-xs truncate">{s.character_class}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p
                      className="text-sm font-bold text-cyan-400"
                      style={{ fontFamily: "Rajdhani, sans-serif" }}
                    >
                      Nv. {s.level}
                    </p>
                    <p className="text-xs text-white/40">{s.coins} moedas</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
