import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePresentationMode } from "@/hooks/usePresentationMode";
import { Maximize2, Minimize2, ChevronRight, Swords, Trophy, BarChart3, Zap } from "lucide-react";
import type { PresentationView } from "@/hooks/usePresentationMode";
import type { Student } from "@/types";

const VIEW_LABELS: Record<PresentationView, string> = {
  leaderboard: 'Leaderboard',
  classwar: 'Class War',
  achievements: 'Conquistas',
  stats: 'Stats da Turma',
};

const VIEW_ICONS: Record<PresentationView, typeof Trophy> = {
  leaderboard: Trophy,
  classwar: Swords,
  achievements: Zap,
  stats: BarChart3,
};

function XpBar({ student, max }: { student: Student; max: number }) {
  const xp = (student as Student & { xp?: number }).xp ?? 0;
  const pct = max > 0 ? Math.min(100, (xp / max) * 100) : 0;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00e5ff, #7c3aed)', boxShadow: '0 0 8px rgba(0,229,255,0.4)' }}
      />
    </div>
  );
}

function LeaderboardView({ students }: { students: Student[] }) {
  const top = students.slice(0, 10);
  const maxXp = (top[0] as Student & { xp?: number })?.xp ?? 1;

  return (
    <div className="space-y-3 w-full max-w-3xl mx-auto">
      {top.map((s, i) => (
        <div key={s.id}
          className="flex items-center gap-4 px-6 py-4 rounded-xl transition-all"
          style={{
            background: i === 0
              ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.08))'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${i === 0 ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
          }}>
          <span
            className="text-2xl font-bold w-10 text-center font-display"
            style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}
          >
            #{i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold truncate" style={{ fontSize: 22, color: i === 0 ? '#ffd700' : 'rgba(255,255,255,0.9)' }}>
              {s.character_name || s.name}
            </p>
            <XpBar student={s} max={maxXp} />
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold" style={{ fontSize: 28, color: '#00e5ff' }}>
              {(s as Student & { xp?: number }).xp?.toLocaleString('pt-BR') ?? '0'}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Lv. {s.level}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassWarView({ classWar, classNames }: { classWar: ReturnType<typeof usePresentationMode>['classWar']; classNames: Record<string, string> }) {
  if (!classWar) {
    return (
      <div className="text-center py-20">
        <Swords size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
        <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)' }}>Nenhuma Class War ativa</p>
      </div>
    );
  }

  const total = classWar.class_a_score + classWar.class_b_score;
  const pctA = total > 0 ? (classWar.class_a_score / total) * 100 : 50;
  const nameA = classNames[classWar.class_a_id] ?? 'Turma A';
  const nameB = classNames[classWar.class_b_id] ?? 'Turma B';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      <p className="text-center font-display" style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)' }}>{classWar.title}</p>
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <p className="font-display font-bold uppercase" style={{ fontSize: 28, color: '#a78bfa' }}>{nameA}</p>
          <p className="font-bold" style={{ fontSize: 80, color: '#a78bfa', lineHeight: 1 }}>{classWar.class_a_score}</p>
        </div>
        <Swords size={48} style={{ color: 'rgba(239,68,68,0.6)', flexShrink: 0 }} />
        <div className="text-center flex-1">
          <p className="font-display font-bold uppercase" style={{ fontSize: 28, color: '#ef4444' }}>{nameB}</p>
          <p className="font-bold" style={{ fontSize: 80, color: '#ef4444', lineHeight: 1 }}>{classWar.class_b_score}</p>
        </div>
      </div>
      <div className="w-full h-5 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.15)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pctA}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
      </div>
      <p className="text-center" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
        Termina em: {new Date(classWar.ends_at).toLocaleDateString('pt-BR')}
      </p>
    </div>
  );
}

function AchievementsView({ achievements }: { achievements: ReturnType<typeof usePresentationMode>['achievements'] }) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-20">
        <Zap size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
        <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)' }}>Nenhuma conquista nas últimas 24h</p>
      </div>
    );
  }
  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {achievements.slice(0, 8).map(a => (
        <div key={a.id} className="flex items-center gap-4 px-6 py-4 rounded-xl"
          style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
          <Zap size={24} style={{ color: '#00e5ff', flexShrink: 0 }} />
          <div>
            <p className="font-bold" style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>
              {a.character_name || a.student_name}
            </p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>{a.achievement}</p>
          </div>
          <p className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatsView({ students }: { students: Student[] }) {
  const total = students.length;
  const avgLevel = total > 0 ? Math.round(students.reduce((a, s) => a + s.level, 0) / total) : 0;
  const avgXp = total > 0 ? Math.round(students.reduce((a, s) => a + ((s as Student & { xp?: number }).xp ?? 0), 0) / total) : 0;
  const avgStreak = total > 0 ? Math.round(students.reduce((a, s) => a + (s.presencas_consecutivas ?? 0), 0) / total) : 0;
  const topLevel = students.reduce((max, s) => Math.max(max, s.level), 0);

  const stats = [
    { label: 'Alunos', value: total },
    { label: 'Nível médio', value: `Lv. ${avgLevel}` },
    { label: 'XP médio', value: avgXp.toLocaleString('pt-BR') },
    { label: 'Streak médio', value: `${avgStreak} dias` },
    { label: 'Nível mais alto', value: `Lv. ${topLevel}` },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-6">
      {stats.map(({ label, value }) => (
        <div key={label} className="text-center p-6 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="font-bold" style={{ fontSize: 48, color: '#00e5ff', lineHeight: 1.1 }}>{value}</p>
          <p className="mt-2" style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function PresentationMode() {
  const { teacher, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { students, achievements, classWar, classNames, view, setView, isLoading, onlineCount } =
    usePresentationMode(teacher?.id ?? '', selectedClass || undefined);

  useEffect(() => {
    if (!authLoading && !teacher) navigate('/professor/login');
  }, [authLoading, teacher, navigate]);

  useEffect(() => {
    if (!teacher) return;
    supabase.from('classes').select('id, name').eq('teacher_id', teacher.id).order('name')
      .then(({ data }) => setClasses(data ?? []));
  }, [teacher]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const views: PresentationView[] = ['leaderboard', 'classwar', 'achievements', 'stats'];
  const currentIdx = views.indexOf(view);
  const nextView = () => setView(views[(currentIdx + 1) % views.length]);

  if (authLoading || !teacher) return null;

  const ViewIcon = VIEW_ICONS[view];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, hsl(222 47% 3%) 0%, hsl(230 40% 8%) 40%, hsl(250 35% 10%) 70%, hsl(222 47% 4%) 100%)',
        fontFamily: "'Rajdhani', 'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,229,255,0.08)' }}>
        <div>
          <p className="font-display font-bold" style={{ fontSize: 26, color: '#00e5ff', letterSpacing: 4 }}>WIT DUNGEON</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            {selectedClass ? classes.find(c => c.id === selectedClass)?.name : teacher.name}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Class selector */}
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
            <option value="">Todas as turmas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Online count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>
            <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{students.length} alunos</span>
          </div>

          {/* Next view */}
          <button onClick={nextView} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff' }}>
            <ChevronRight size={15} />
            <span style={{ fontSize: 13 }}>{VIEW_LABELS[views[(currentIdx + 1) % views.length]]}</span>
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} title={isFullscreen ? 'Sair do fullscreen' : 'Fullscreen'}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button onClick={() => navigate('/professor')} className="px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
            Sair
          </button>
        </div>
      </header>

      {/* View selector tabs */}
      <div className="flex justify-center gap-2 py-4 flex-shrink-0">
        {views.map(v => {
          const Icon = VIEW_ICONS[v];
          return (
            <button key={v} onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all text-sm font-bold"
              style={{
                background: view === v ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${view === v ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: view === v ? '#00e5ff' : 'rgba(255,255,255,0.35)',
              }}>
              <Icon size={14} />
              {VIEW_LABELS[v]}
            </button>
          );
        })}
      </div>

      {/* Current view label */}
      <div className="text-center mb-6 flex-shrink-0">
        <div className="flex items-center justify-center gap-2">
          <ViewIcon size={18} style={{ color: '#00e5ff' }} />
          <p className="font-display font-bold uppercase tracking-widest" style={{ fontSize: 13, color: 'rgba(0,229,255,0.6)' }}>
            {VIEW_LABELS[view]}
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-8 pb-8 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {view === 'leaderboard' && <LeaderboardView students={students} />}
            {view === 'classwar' && <ClassWarView classWar={classWar} classNames={classNames} />}
            {view === 'achievements' && <AchievementsView achievements={achievements} />}
            {view === 'stats' && <StatsView students={students} />}
          </>
        )}
      </main>
    </div>
  );
}
