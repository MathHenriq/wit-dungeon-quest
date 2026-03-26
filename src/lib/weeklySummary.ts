export interface WeeklySummaryData {
  overview: {
    active_students?: number;
    total_students?: number;
    missions_completed?: number;
    boss_victories?: number;
    avg_streak?: number;
  } | null;
  riskScores: {
    student_name: string;
    risk_score: number;
    days_since_last_login: number;
    streak_current: number;
  }[];
  topStudents: {
    name: string;
    xp_gained?: number;
    level?: number;
  }[];
}

export interface WeeklySummaryResult {
  highlights: string[];
  alerts: string[];
  suggestions: string[];
}

export function generateWeeklySummary(data: WeeklySummaryData): WeeklySummaryResult {
  const highlights: string[] = [];
  const alerts: string[] = [];
  const suggestions: string[] = [];

  const { overview, riskScores, topStudents } = data;

  // Destaques — alunos top
  if (topStudents[0]) {
    const s = topStudents[0];
    if (s.xp_gained) {
      highlights.push(`${s.name} liderou em XP esta semana (+${s.xp_gained} XP)`);
    } else if (s.level) {
      highlights.push(`${s.name} está no nível mais alto da turma (Lv. ${s.level})`);
    }
  }

  // Destaques — estatísticas gerais
  if (overview) {
    if ((overview.missions_completed ?? 0) > 0) {
      highlights.push(`${overview.missions_completed} missões completadas na semana`);
    }
    if ((overview.boss_victories ?? 0) > 0) {
      highlights.push(`${overview.boss_victories} bosses derrotados na semana`);
    }
    if ((overview.avg_streak ?? 0) > 7) {
      highlights.push(`Média de streak da turma: ${Math.round(overview.avg_streak!)} dias`);
    }
  }

  // Alertas — alunos em risco
  const highRisk = riskScores.filter(s => s.risk_score > 70);
  for (const s of highRisk.slice(0, 3)) {
    if (s.days_since_last_login > 3) {
      alerts.push(`${s.student_name} sem login há ${s.days_since_last_login} dias`);
    } else if (s.streak_current === 0) {
      alerts.push(`${s.student_name} perdeu a streak`);
    } else {
      alerts.push(`${s.student_name} com baixo engajamento (risco ${s.risk_score}%)`);
    }
  }

  // Engajamento geral
  if (overview) {
    const active = overview.active_students ?? 0;
    const total = overview.total_students ?? 1;
    const rate = Math.round((active / total) * 100);
    if (rate < 60) {
      alerts.push(`Apenas ${rate}% dos alunos estiveram ativos esta semana`);
    }
  }

  // Sugestões
  const readyForHard = riskScores.filter(s => s.risk_score < 15 && s.streak_current > 5);
  if (readyForHard.length >= 3) {
    suggestions.push(`${readyForHard.length} alunos estão prontos para dificuldade Difícil`);
  }

  const inactiveCount = riskScores.filter(s => s.days_since_last_login > 5).length;
  if (inactiveCount > 0) {
    suggestions.push(`Considere enviar um desafio especial para reengajar ${inactiveCount} aluno${inactiveCount > 1 ? 's' : ''} inativo${inactiveCount > 1 ? 's' : ''}`);
  }

  if ((overview?.missions_completed ?? 0) === 0) {
    suggestions.push('Crie novas missões para estimular a participação da turma');
  }

  return { highlights, alerts, suggestions };
}
