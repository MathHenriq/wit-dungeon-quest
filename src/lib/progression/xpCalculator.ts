export interface XPReward {
  baseXP: number;
  bonusXP: number;
  totalXP: number;
  leveledUp: boolean;
  newLevel?: number;
  levelsGained?: number;
}

// XP necessário para sair de `currentLevel` para o próximo
// Fórmula: 100 * level^1.5
export function getXPRequiredForLevel(currentLevel: number): number {
  return Math.floor(100 * Math.pow(currentLevel, 1.5));
}

// XP total acumulado para chegar em `targetLevel` (partindo do 1)
export function getTotalXPForLevel(targetLevel: number): number {
  let total = 0;
  for (let i = 1; i < targetLevel; i++) {
    total += getXPRequiredForLevel(i);
  }
  return total;
}

// XP ganho por vitória
export function calculateXPGain(
  playerLevel: number,
  enemyLevel: number,
  isBoss: boolean
): number {
  const levelDiff = enemyLevel - playerLevel;

  // Base: 50 × nível do inimigo
  let xp = 50 * enemyLevel;

  // Boss dá 2×
  if (isBoss) xp *= 2;

  // Anti-farm: inimigo 5+ levels abaixo → -80%
  if (levelDiff <= -5) {
    xp *= 0.2;
  } else if (levelDiff >= 3) {
    // Inimigo mais forte → +50%
    xp *= 1.5;
  }

  return Math.floor(xp);
}

// Processa XP ganho e calcula level ups
export function processXPGain(
  currentLevel: number,
  currentXP: number,
  xpGained: number
): XPReward {
  let remaining = currentXP + xpGained;
  let level = currentLevel;

  while (remaining >= getXPRequiredForLevel(level)) {
    remaining -= getXPRequiredForLevel(level);
    level++;
  }

  const leveledUp = level > currentLevel;

  return {
    baseXP: xpGained,
    bonusXP: 0,
    totalXP: xpGained,
    leveledUp,
    newLevel: leveledUp ? level : undefined,
    levelsGained: leveledUp ? level - currentLevel : 0
  };
}

// Pontos ganhos por level up
export function getPointsForLevelUp(levelsGained: number): {
  freePoints: number;
  attributePoints: number;
} {
  return {
    freePoints: levelsGained * 3,      // 3 pontos elementais por level
    attributePoints: levelsGained * 1  // +1 em todos atributos base
  };
}
