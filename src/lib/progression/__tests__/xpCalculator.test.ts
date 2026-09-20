import { describe, it, expect } from 'vitest';
import {
  MAX_LEVEL,
  getXPRequiredForLevel,
  getTotalXPForLevel,
  processXPGain,
} from '../xpCalculator';

/**
 * A curva de XP existe em dois lugares: aqui e em
 * public.calculate_level_from_xp (plpgsql). O trigger auto_level_up reescreve
 * students.level a partir do XP em toda escrita, entao o banco e a autoridade
 * — se as duas divergirem, o aluno ve uma tela de vitoria anunciando um nivel
 * que o banco nunca confirma. Estes testes travam o formato da curva.
 */

/** Reimplementacao literal de public.calculate_level_from_xp. */
function levelFromTotalXpSQL(totalXp: number): number {
  let level = 1;
  let accumulated = 0;
  for (;;) {
    const needed = 50 * level * level + 100 * level;
    if (accumulated + needed > totalXp) return level;
    accumulated += needed;
    level += 1;
    if (level > 100) return 100;
  }
}

describe('curva de XP', () => {
  it('usa 50n^2 + 100n por nivel', () => {
    expect(getXPRequiredForLevel(1)).toBe(150);
    expect(getXPRequiredForLevel(5)).toBe(1750);
    expect(getXPRequiredForLevel(10)).toBe(6000);
  });

  it('acumula o total sem contar o nivel alvo', () => {
    expect(getTotalXPForLevel(1)).toBe(0);
    expect(getTotalXPForLevel(2)).toBe(150);
    expect(getTotalXPForLevel(3)).toBe(150 + 400);
  });

  it('concorda com calculate_level_from_xp do banco em toda a faixa jogavel', () => {
    // Amostra densa no inicio (onde os alunos ficam) e esparsa depois.
    const samples = [
      0, 1, 149, 150, 151, 549, 550, 551, 1000, 5000, 20_000, 100_000, 500_000,
    ];
    for (const totalXp of samples) {
      const fromClient = processXPGain(1, 0, totalXp).newLevel ?? 1;
      expect(fromClient, `total_xp=${totalXp}`).toBe(levelFromTotalXpSQL(totalXp));
    }
  });
});

describe('processXPGain', () => {
  it('nao sobe de nivel quando falta XP', () => {
    const r = processXPGain(1, 0, 149);
    expect(r.leveledUp).toBe(false);
    expect(r.newLevel).toBeUndefined();
  });

  it('sobe exatamente no limiar', () => {
    const r = processXPGain(1, 0, 150);
    expect(r.leveledUp).toBe(true);
    expect(r.newLevel).toBe(2);
    expect(r.levelsGained).toBe(1);
  });

  it('encadeia varios niveis de uma vez', () => {
    // 150 (1->2) + 400 (2->3) + 750 (3->4) = 1300
    const r = processXPGain(1, 0, 1300);
    expect(r.newLevel).toBe(4);
    expect(r.levelsGained).toBe(3);
  });

  it('respeita o teto de nivel do banco', () => {
    // Sem o teto isso girava alem de 100 e anunciava um nivel fantasma.
    const r = processXPGain(MAX_LEVEL, 0, Number.MAX_SAFE_INTEGER);
    expect(r.leveledUp).toBe(false);
    expect(levelFromTotalXpSQL(Number.MAX_SAFE_INTEGER)).toBe(MAX_LEVEL);
  });

  it('termina mesmo com um ganho absurdo de XP', () => {
    const r = processXPGain(1, 0, 10 ** 12);
    expect(r.newLevel).toBe(MAX_LEVEL);
  });
});
