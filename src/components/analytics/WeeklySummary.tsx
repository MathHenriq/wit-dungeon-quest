import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateWeeklySummary, type WeeklySummaryData } from "@/lib/weeklySummary";
import { RefreshCw, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  teacherId: string;
  classId?: string;
}

function formatDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function WeeklySummary({ teacherId, classId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<ReturnType<typeof generateWeeklySummary> | null>(null);
  const [stats, setStats] = useState<{ active: number; total: number; missions: number; bosses: number } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const since = sevenDaysAgo.toISOString();

      // Build student filter
      let studentsQuery = supabase.from('students').select('id, name, level, xp, streak_current').eq('teacher_id', teacherId).eq('status', 'active');
      if (classId) studentsQuery = studentsQuery.eq('class_id', classId);
      const { data: students } = await studentsQuery;
      const studentIds = (students ?? []).map(s => s.id);

      if (studentIds.length === 0) {
        setSummary({ highlights: ['Nenhum aluno ativo encontrado.'], alerts: [], suggestions: [] });
        setStats({ active: 0, total: 0, missions: 0, bosses: 0 });
        return;
      }

      // Active students this week (had at least one analytics event)
      const { data: activeEvents } = await supabase
        .from('analytics_events')
        .select('student_id')
        .in('student_id', studentIds)
        .gte('created_at', since);
      const activeSet = new Set((activeEvents ?? []).map(e => e.student_id));

      // Missions completed
      const { count: missionsCount } = await supabase
        .from('mission_completions')
        .select('id', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .eq('status', 'approved')
        .gte('created_at', since);

      // Boss victories
      const { count: bossCount } = await supabase
        .from('boss_attempts')
        .select('id', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .eq('boss_defeated', true)
        .gte('finished_at', since);

      // Risk scores (simple: days since last login)
      const { data: lastLogins } = await supabase
        .from('analytics_events')
        .select('student_id, created_at')
        .in('student_id', studentIds)
        .eq('event_type', 'login')
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('created_at', { ascending: false });

      const lastLoginMap: Record<string, string> = {};
      for (const e of (lastLogins ?? [])) {
        if (!lastLoginMap[e.student_id]) lastLoginMap[e.student_id] = e.created_at;
      }

      const riskScores = (students ?? []).map(s => {
        const lastLogin = lastLoginMap[s.id];
        const daysSince = lastLogin
          ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / 86400000)
          : 30;
        const riskScore = Math.min(100, daysSince * 5 + (s.streak_current === 0 ? 20 : 0));
        return {
          student_name: s.name,
          risk_score: riskScore,
          days_since_last_login: daysSince,
          streak_current: s.streak_current ?? 0,
        };
      });

      // Top students by XP gained this week
      const { data: xpEvents } = await supabase
        .from('analytics_events')
        .select('student_id, event_data')
        .in('student_id', studentIds)
        .in('event_type', ['mission_complete', 'boss_victory', 'challenge_complete'])
        .gte('created_at', since);

      const xpByStudent: Record<string, number> = {};
      for (const e of (xpEvents ?? [])) {
        const xp = Number((e.event_data as Record<string, unknown> | null)?.xp ?? 0);
        xpByStudent[e.student_id] = (xpByStudent[e.student_id] ?? 0) + xp;
      }

      const topStudents = (students ?? [])
        .map(s => ({ name: s.name, xp_gained: xpByStudent[s.id] ?? 0, level: s.level }))
        .sort((a, b) => b.xp_gained - a.xp_gained)
        .slice(0, 3);

      const avgStreak = students && students.length > 0
        ? students.reduce((acc, s) => acc + (s.streak_current ?? 0), 0) / students.length
        : 0;

      const data: WeeklySummaryData = {
        overview: {
          active_students: activeSet.size,
          total_students: students?.length ?? 0,
          missions_completed: missionsCount ?? 0,
          boss_victories: bossCount ?? 0,
          avg_streak: avgStreak,
        },
        riskScores,
        topStudents,
      };

      setSummary(generateWeeklySummary(data));
      setStats({
        active: activeSet.size,
        total: students?.length ?? 0,
        missions: missionsCount ?? 0,
        bosses: bossCount ?? 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, classId]);

  return (
    <div className="card-fantasy">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-base font-bold text-gold">Resumo da Semana</h3>
          <p className="text-xs text-muted-foreground">{formatDateRange()}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={isLoading}
          className="border-gold/30 text-gold hover:bg-gold/10 gap-1.5"
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {summary ? 'Atualizar' : 'Gerar resumo'}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      )}

      {!isLoading && !summary && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Clique em "Gerar resumo" para ver o panorama da semana.
        </p>
      )}

      {!isLoading && summary && (
        <div className="space-y-4">
          {/* KPIs */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Alunos ativos', value: `${stats.active}/${stats.total}` },
                { label: 'Missões', value: stats.missions },
                { label: 'Bosses derrotados', value: stats.bosses },
                { label: 'Taxa de atividade', value: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-card/40 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Destaques */}
          {summary.highlights.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <TrendingUp size={13} /> Destaques
              </p>
              <ul className="space-y-1">
                {summary.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alertas */}
          {summary.alerts.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <AlertTriangle size={13} /> Alertas
              </p>
              <ul className="space-y-1">
                {summary.alerts.map((a, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sugestões */}
          {summary.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Lightbulb size={13} /> Sugestões
              </p>
              <ul className="space-y-1">
                {summary.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
