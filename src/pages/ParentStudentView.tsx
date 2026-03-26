import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { ParentSummaryCard } from "@/components/parent/ParentSummaryCard";
import { ParentWeeklyActivity } from "@/components/parent/ParentWeeklyActivity";
import { ParentSuggestedQuestions } from "@/components/parent/ParentSuggestedQuestions";
import { ParentProgressChart } from "@/components/parent/ParentProgressChart";
import { ParentAttendanceCalendar } from "@/components/parent/ParentAttendanceCalendar";
import { generateSuggestedQuestions, type ChildSummary } from "@/hooks/useParentPortal";
import { BookOpen, LogOut, Loader2, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ParentStudentView() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ChildSummary | null>(null);
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabaseStudent.auth.getUser();
      if (!user) {
        navigate('/pais/login', { replace: true });
        return;
      }

      // Get student record
      const { data: student, error: stErr } = await supabaseStudent
        .from('students')
        .select('id, name, character_name, level, xp, coins, streak_current, streak_best, presencas_consecutivas, total_missions_completed, total_boss_kills, character_class, class_id')
        .eq('user_id', user.id)
        .single();

      if (stErr || !student) {
        setError('Conta de aluno não encontrada. Verifique se você usou os dados corretos.');
        return;
      }

      const sid = (student as { id: string }).id;
      setStudentName((student as { character_name: string | null; name: string }).character_name || (student as { name: string }).name);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const since = sevenDaysAgo.toISOString();

      // Load class name
      const classId = (student as { class_id: string | null }).class_id;
      let className = '';
      if (classId) {
        const { data: cls } = await supabaseStudent
          .from('classes').select('name').eq('id', classId).single();
        className = (cls as { name: string } | null)?.name ?? '';
      }

      // Parallel data fetch
      const [missionsRes, bossesRes, skillsRes, achievementsRes, xpEventsRes, loginRes] = await Promise.all([
        supabaseStudent
          .from('mission_completions')
          .select('student_missions(title, reward), created_at, status')
          .eq('student_id', sid)
          .eq('status', 'approved')
          .gte('created_at', since),
        supabaseStudent
          .from('boss_attempts')
          .select('boss_defeated, total_damage, finished_at, boss_battles(boss_name, title, boss_hp)')
          .eq('student_id', sid)
          .gte('finished_at', since),
        supabaseStudent
          .from('student_skill_progress')
          .select('completed_at, skill_nodes(name, description)')
          .eq('student_id', sid)
          .eq('completed', true)
          .gte('completed_at', since),
        supabaseStudent
          .from('achievement_feed')
          .select('message, achievement_type, created_at')
          .eq('student_id', sid)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(10),
        supabaseStudent
          .from('analytics_events')
          .select('event_data, created_at')
          .eq('student_id', sid)
          .in('event_type', ['mission_complete', 'boss_victory', 'challenge_complete'])
          .gte('created_at', since),
        supabaseStudent
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', sid)
          .eq('event_type', 'login')
          .gte('created_at', since),
      ]);

      const s = student as {
        level: number; xp: number; coins: number;
        streak_current: number; streak_best: number;
        presencas_consecutivas: number;
        total_missions_completed: number; total_boss_kills: number;
        character_class: string | null;
        name: string; character_name: string | null;
      };

      const built: ChildSummary = {
        student: {
          name: s.name,
          character_name: s.character_name,
          level: s.level,
          xp: s.xp ?? 0,
          coins: s.coins ?? 0,
          streak_current: s.streak_current ?? 0,
          streak_best: s.streak_best ?? 0,
          presencas_consecutivas: s.presencas_consecutivas ?? 0,
          total_missions: s.total_missions_completed ?? 0,
          total_bosses: s.total_boss_kills ?? 0,
          class_name: className,
          character_class: s.character_class,
        },
        missions_completed: ((missionsRes.data ?? []) as unknown[]).map((r: unknown) => {
          const row = r as { student_missions: { title: string; reward: number } | null; created_at: string };
          return { title: row.student_missions?.title ?? '', reward: row.student_missions?.reward ?? 0, completed_at: row.created_at };
        }),
        bosses_faced: ((bossesRes.data ?? []) as unknown[]).map((r: unknown) => {
          const row = r as { boss_defeated: boolean; total_damage: number; finished_at: string; boss_battles: { boss_name: string; title: string; boss_hp: number } | null };
          return {
            boss_name: row.boss_battles?.boss_name ?? '',
            title: row.boss_battles?.title ?? '',
            defeated: row.boss_defeated,
            score: row.boss_battles?.boss_hp
              ? Math.round((row.total_damage / row.boss_battles.boss_hp) * 100)
              : 0,
          };
        }),
        skills_completed: ((skillsRes.data ?? []) as unknown[]).map((r: unknown) => {
          const row = r as { completed_at: string; skill_nodes: { name: string; description: string } | null };
          return { name: row.skill_nodes?.name ?? '', description: row.skill_nodes?.description ?? '', completed_at: row.completed_at };
        }),
        achievements: ((achievementsRes.data ?? []) as unknown[]).map((r: unknown) => {
          const row = r as { message: string; achievement_type: string; created_at: string };
          return { message: row.message, type: row.achievement_type, created_at: row.created_at };
        }),
        login_count: loginRes.count ?? 0,
        xp_events: ((xpEventsRes.data ?? []) as unknown[]).map((r: unknown) => {
          const row = r as { event_data: Record<string, unknown> | null; created_at: string };
          return {
            day: row.created_at.slice(0, 10),
            xp: Number((row.event_data as Record<string, unknown> | null)?.xp ?? 0),
          };
        }),
      };

      setSummary(built);
    } catch (err) {
      console.error('[ParentStudentView]', err);
      setError('Erro ao carregar os dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => {
    await supabaseStudent.auth.signOut();
    navigate('/pais/login', { replace: true });
  };

  const questions = summary ? generateSuggestedQuestions(summary) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-3" size={36} />
          <p className="text-slate-400 text-sm">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center max-w-sm w-full">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold mb-1">Não foi possível carregar</p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <Button variant="outline" onClick={handleLogout} className="text-slate-500 w-full">
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Relatório de Desenvolvimento</p>
              {studentName && <p className="text-xs text-slate-400">{studentName}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-700 gap-1.5 text-xs"
          >
            <LogOut size={14} /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Readonly notice */}
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <Eye size={15} className="text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-600">
            Você está visualizando como responsável — modo somente leitura. Dados dos últimos 7 dias.
          </p>
        </div>

        {summary ? (
          <>
            <ParentSummaryCard summary={summary} />
            <ParentWeeklyActivity summary={summary} />
            {questions.length > 0 && <ParentSuggestedQuestions questions={questions} />}
            <ParentProgressChart summary={summary} />
            <ParentAttendanceCalendar summary={summary} />

            <div className="text-center pt-2">
              <button
                onClick={load}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 mx-auto transition-colors"
              >
                <RefreshCw size={12} /> Atualizar dados
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <p className="text-slate-400 text-sm">Ainda não há dados para este período.</p>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-slate-300">
        Portal dos Pais — WIT Dungeon Quest
      </footer>
    </div>
  );
}
