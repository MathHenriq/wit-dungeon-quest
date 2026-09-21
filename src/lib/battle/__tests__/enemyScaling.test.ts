import { describe, it, expect } from 'vitest';
import {
  scaleEnemyForFloor,
  computeCoinReward,
  computeXpReward,
  ENEMY_HP_SCALE_PER_FLOOR,
  ENEMY_DEF_SCALE_PER_FLOOR,
  BOSS_HP_BONUS,
} from '../enemyScaling';
import { makeEnemy } from './factories';

/**
 * A curva de inimigos e a de recompensas são as duas alavancas de
 * balanceamento do jogo. Estes testes existem para que mexer numa constante
 * mostre exatamente o que muda — e para que a curva não exploda de novo (a
 * versão original do prompt usava 1.5^andar, que dá ~25.000× no andar 25).
 */

describe('scaleEnemyForFloor', () => {
  it('não altera nada no andar 1', () => {
    const base = makeEnemy({ hpMax: 200, defFisica: 10, defMagica: 10 });
    const r = scaleEnemyForFloor(base, 1);
    expect(r.hpMax).toBe(200);
    expect(r.defFisica).toBe(10);
    expect(r.defMagica).toBe(10);
  });

  it('aplica a curva exponencial por andar acima do primeiro', () => {
    const base = makeEnemy({ hpMax: 1000, defFisica: 100, defMagica: 100 });
    const r = scaleEnemyForFloor(base, 11); // 10 andares acima
    expect(r.hpMax).toBe(Math.round(1000 * ENEMY_HP_SCALE_PER_FLOOR ** 10));
    expect(r.defFisica).toBe(Math.round(100 * ENEMY_DEF_SCALE_PER_FLOOR ** 10));
  });

  it('dá HP extra a boss sobre a mesma curva', () => {
    // O arredondamento acontece uma vez so, no fim: comparar com
    // round(round(comum) * 2) erra por 1 quando a curva cai em .5.
    const boss = scaleEnemyForFloor(makeEnemy({ hpMax: 1000, isBoss: true }), 10);
    expect(boss.hpMax).toBe(
      Math.round(1000 * ENEMY_HP_SCALE_PER_FLOOR ** 9 * (1 + BOSS_HP_BONUS)),
    );

    const comum = scaleEnemyForFloor(makeEnemy({ hpMax: 1000 }), 10);
    expect(boss.hpMax / comum.hpMax).toBeCloseTo(1 + BOSS_HP_BONUS, 2);
  });

  it('deixa o inimigo com vida cheia', () => {
    const r = scaleEnemyForFloor(makeEnemy({ hpMax: 500, hpCurrent: 3 }), 12);
    expect(r.hpCurrent).toBe(r.hpMax);
  });

  it('não muta o objeto de entrada', () => {
    const base = makeEnemy({ hpMax: 200, defFisica: 10 });
    scaleEnemyForFloor(base, 30);
    expect(base.hpMax).toBe(200);
    expect(base.defFisica).toBe(10);
  });

  it('trata andar ausente ou inválido como o primeiro', () => {
    const base = makeEnemy({ hpMax: 200 });
    expect(scaleEnemyForFloor(base, 0).hpMax).toBe(200);
    expect(scaleEnemyForFloor(base, undefined as unknown as number).hpMax).toBe(200);
  });

  it('mantém a curva do andar 50 dentro de uma ordem de grandeza', () => {
    // Guarda contra reintroduzir um expoente explosivo: no andar 50 o inimigo
    // não deve passar de ~20× a linha de base.
    const r = scaleEnemyForFloor(makeEnemy({ hpMax: 1000 }), 50);
    expect(r.hpMax).toBeGreaterThan(1000);
    expect(r.hpMax).toBeLessThan(20_000);
  });
});

describe('computeCoinReward', () => {
  it('cresce com o andar', () => {
    expect(computeCoinReward(50, false)).toBeGreaterThan(computeCoinReward(1, false));
  });

  it('boss paga 1,25× o inimigo comum do mesmo andar', () => {
    const comum = 15 + 25 * 1.1;
    expect(computeCoinReward(25, true)).toBe(Math.round(comum * 1.25));
  });

  it('nunca paga menos de 1 moeda', () => {
    expect(computeCoinReward(-5, false)).toBeGreaterThanOrEqual(1);
    expect(computeCoinReward(undefined as unknown as number, false)).toBeGreaterThanOrEqual(1);
  });

  it('fica nos valores alvo do balanceamento', () => {
    // Alvos documentados em enemyScaling.ts: ~16 no andar 1, ~70 no andar 50.
    expect(computeCoinReward(1, false)).toBe(16);
    expect(computeCoinReward(50, false)).toBe(70);
  });
});

describe('computeXpReward', () => {
  it('mistura nível do inimigo com profundidade do andar', () => {
    expect(computeXpReward(1, 10, false)).toBe(10 * 12 + 1 * 8);
  });

  it('boss dá 3× o XP de um comum equivalente', () => {
    const comum = computeXpReward(10, 10, false);
    expect(computeXpReward(10, 10, true)).toBe(Math.round(comum * 3));
  });

  it('protege contra andar e nível inválidos', () => {
    expect(computeXpReward(0, 0, false)).toBeGreaterThan(0);
    expect(Number.isFinite(computeXpReward(
      undefined as unknown as number,
      undefined as unknown as number,
      false,
    ))).toBe(true);
  });
});
