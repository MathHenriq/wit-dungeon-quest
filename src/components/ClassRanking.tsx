import { useState, useEffect } from "react";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { Loader2, Trophy, Flame, Coins, Star, TrendingUp, Swords } from "lucide-react";
import type { Student } from "@/types";
import { ATTRIBUTES } from "@/types";

interface ClassRankingProps {
  classId: string;
  currentStudentId: string;
}

type RankCategory = "level" | "attendance" | "points" | "coins";

const CATEGORIES: {
  id: RankCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  getValue: (s: Student) => number;
  unit: string;
}[] = [
  {
    id: "level",
    label: "Maior Nível",
    icon: <TrendingUp size={18} />,
    color: "text-blue-400",
    bgColor: "from-blue-900/60 to-blue-800/40",
    getValue: s => s.level ?? 0,
    unit: "nível",
  },
  {
    id: "attendance",
    label: "Aulas Seguidas",
    icon: <Flame size={18} />,
    color: "text-orange-400",
    bgColor: "from-orange-900/60 to-orange-800/40",
    getValue: s => s.presencas_consecutivas ?? 0,
    unit: "aulas",
  },
  {
    id: "points",
    label: "Mais Pontos",
    icon: <Swords size={18} />,
    color: "text-purple-400",
    bgColor: "from-purple-900/60 to-purple-800/40",
    getValue: s =>
      ATTRIBUTES.reduce((sum, a) => sum + (s[a.key] ?? 0), 0),
    unit: "pts",
  },
  {
    id: "coins",
    label: "Mais Rico",
    icon: <Coins size={18} />,
    color: "text-yellow-400",
    bgColor: "from-yellow-900/60 to-yellow-800/40",
    getValue: s => s.coins ?? 0,
    unit: "moedas",
  },
];

const PODIUM_COLORS = [
  { bg: "bg-yellow-500",  ring: "ring-yellow-400",  label: "🥇", size: "h-20" },
  { bg: "bg-slate-400",   ring: "ring-slate-300",   label: "🥈", size: "h-14" },
  { bg: "bg-amber-700",   ring: "ring-amber-600",   label: "🥉", size: "h-10" },
];

function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl?: string | null; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return photoUrl ? (
    <img
      src={photoUrl}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover ring-2 ring-white/20"
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-primary/30 flex items-center justify-center text-primary-foreground font-bold text-sm ring-2 ring-white/20"
    >
      {initials}
    </div>
  );
}

function Podium({ top3, getValue, unit, currentStudentId }: {
  top3: Student[];
  getValue: (s: Student) => number;
  unit: string;
  currentStudentId: string;
}) {
  // Kahoot order: 2nd | 1st | 3rd
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const rankOrder = [2, 1, 3];

  return (
    <div className="flex items-end justify-center gap-3 pt-4 pb-2">
      {order.map((student, idx) => {
        const rank = rankOrder[idx] - 1;
        const pod = PODIUM_COLORS[rank];
        const isMe = student.id === currentStudentId;
        const displayName = student.character_name || student.name;
        const firstName = displayName.split(" ")[0];

        return (
          <div key={student.id} className="flex flex-col items-center gap-1 flex-1 max-w-[100px]">
            {/* Crown for 1st */}
            {rank === 0 && (
              <span className="text-xl animate-bounce">👑</span>
            )}
            <Avatar name={displayName} photoUrl={student.profile_photo_url} size={rank === 0 ? 52 : 40} />
            <p className={`text-xs font-bold text-center truncate w-full ${isMe ? "text-gold" : "text-foreground"}`}>
              {firstName}{isMe ? " (Você)" : ""}
            </p>
            <p className="text-xs text-muted-foreground">{getValue(student)} {unit}</p>
            {/* Podium bar */}
            <div className={`w-full ${pod.size} ${pod.bg} rounded-t-lg flex items-center justify-center ${pod.ring} ring-1`}>
              <span className="text-lg">{pod.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankList({ students, getValue, unit, currentStudentId, startRank = 4 }: {
  students: Student[];
  getValue: (s: Student) => number;
  unit: string;
  currentStudentId: string;
  startRank?: number;
}) {
  if (students.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-3">
      {students.map((student, idx) => {
        const rank = startRank + idx;
        const isMe = student.id === currentStudentId;
        const displayName = student.character_name || student.name;

        return (
          <div
            key={student.id}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
              isMe
                ? "bg-gold/20 border border-gold/40 font-semibold"
                : "bg-card/60 border border-border hover:bg-secondary/50"
            }`}
          >
            <span className="w-6 text-center text-sm text-muted-foreground font-mono">{rank}º</span>
            <Avatar name={displayName} photoUrl={student.profile_photo_url} size={32} />
            <span className="flex-1 text-sm truncate">{displayName}{isMe ? " 👈" : ""}</span>
            <span className="text-sm font-bold text-muted-foreground">{getValue(student)} {unit}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ClassRanking({ classId, currentStudentId }: ClassRankingProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<RankCategory>("level");

  useEffect(() => {
    supabaseAnon
      .from("students")
      .select("id, name, character_name, profile_photo_url, level, presencas_consecutivas, coins, attr_forca, attr_destreza, attr_inteligencia, attr_carisma, attr_agilidade, attr_resistencia")
      .eq("class_id", classId)
      .eq("status", "active")
      .then(({ data }) => {
        setStudents((data || []) as Student[]);
        setIsLoading(false);
      });
  }, [classId]);

  const category = CATEGORIES.find(c => c.id === activeCategory)!;
  const sorted = [...students].sort((a, b) => category.getValue(b) - category.getValue(a));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-gold" size={36} />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="card-fantasy text-center py-12 text-muted-foreground">
        <Trophy size={48} className="mx-auto mb-4 opacity-30" />
        <p>Nenhum aluno na turma ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              activeCategory === cat.id
                ? `bg-gradient-to-br ${cat.bgColor} ${cat.color} ring-1 ring-current shadow-lg`
                : "bg-card border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard card */}
      <div className={`card-fantasy bg-gradient-to-b ${category.bgColor} border-0 overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-2 ${category.color}`}>
          {category.icon}
          <h3 className="font-display font-bold text-lg">{category.label}</h3>
          <span className="ml-auto text-sm text-muted-foreground">{students.length} alunos</span>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <Podium
            top3={top3}
            getValue={category.getValue}
            unit={category.unit}
            currentStudentId={currentStudentId}
          />
        )}

        {/* Rest of the list */}
        <RankList
          students={rest}
          getValue={category.getValue}
          unit={category.unit}
          currentStudentId={currentStudentId}
        />

        {/* My position highlight if not in top view */}
        {(() => {
          const myRank = sorted.findIndex(s => s.id === currentStudentId) + 1;
          const myStudent = sorted.find(s => s.id === currentStudentId);
          if (!myStudent || myRank === 0) return null;
          return (
            <div className={`mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-sm`}>
              <span className="text-muted-foreground">Sua posição</span>
              <span className={`font-bold ${category.color}`}>
                {myRank}º — {category.getValue(myStudent)} {category.unit}
              </span>
            </div>
          );
        })()}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
        <Star size={12} />
        <span>Ranking atualizado em tempo real com os dados da sua turma</span>
      </div>
    </div>
  );
}
