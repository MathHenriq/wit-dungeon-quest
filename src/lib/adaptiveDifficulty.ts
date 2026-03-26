export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface PerformanceData {
  recentBossScores: number[];       // últimos 5 scores de boss (0-100%)
  recentMissionSuccess: boolean[];  // últimos 10 resultados de missão
  currentDifficulty: DifficultyLevel;
}

export function calculateNewDifficulty(data: PerformanceData): DifficultyLevel {
  const { recentBossScores, recentMissionSuccess, currentDifficulty } = data;

  const bossAvg = recentBossScores.length > 0
    ? recentBossScores.reduce((a, b) => a + b, 0) / recentBossScores.length
    : 50;

  const missionRate = recentMissionSuccess.length > 0
    ? (recentMissionSuccess.filter(Boolean).length / recentMissionSuccess.length) * 100
    : 50;

  const combinedScore = bossAvg * 0.6 + missionRate * 0.4;

  if (combinedScore >= 85 && currentDifficulty !== 'hard') {
    return currentDifficulty === 'easy' ? 'normal' : 'hard';
  }
  if (combinedScore <= 35 && currentDifficulty !== 'easy') {
    return currentDifficulty === 'hard' ? 'normal' : 'easy';
  }
  return currentDifficulty;
}

export const DIFFICULTY_REWARD_MULTIPLIER: Record<DifficultyLevel, number> = {
  easy: 1.0,
  normal: 1.2,
  hard: 1.5,
};

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  easy: 'Fácil',
  normal: 'Normal',
  hard: 'Difícil',
};
