import { describe, expect, it } from 'vitest';
import { connected, labelSet, makeCircuit, paintPattern, reporterQuiz, rewardOf } from '../minigames';

describe('minijogos', () => {
  it('circuito sempre tem solução (com as peças no giro original)', () => {
    for (let seed = 1; seed < 300; seed++) {
      const c = makeCircuit(seed);
      expect(connected({ ...c, turns: c.turns.map(() => 0) })).toBe(true);
    }
  });

  it('perguntas do repórter têm 2 a 4 opções e a resposta é uma delas', () => {
    for (let d = 0; d < 40; d++) for (const t of [1, 2, 9]) {
      const qs = reporterQuiz(20000 + d, d * 3 + t, t);
      expect(qs.length).toBeGreaterThanOrEqual(4);
      for (const q of qs) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('rótulos e desenhos', () => {
    const l = labelSet(5);
    expect(l.items).toHaveLength(16);
    const g = paintPattern(7);
    expect(g).toHaveLength(16);
    for (let y = 0; y < 4; y++) expect(g[y * 4]).toBe(g[y * 4 + 3]);
  });

  it('recompensas: nota baixa não rende item; o cargo ajuda', () => {
    expect(rewardOf('ritmo', 0.3, 0).items).toEqual({});
    expect(rewardOf('ritmo', 0.86, 0).items).toEqual({ disco: 1 });
    expect(rewardOf('ritmo', 0.86, 1).items).toEqual({ 'disco-ouro': 1 });
    expect(rewardOf('forno', 0.7, 0, 2).items).toEqual({ pao: 2 });
    expect(rewardOf('forno', 0.7, 0.5, 2).items).toEqual({ pao: 3 });
    expect(rewardOf('circuito', 1, 0.25, 2).items).toEqual({ sensor: 3 });
    expect(rewardOf('noticia', 1, 0, 5).coins).toBe(20);
    expect(rewardOf('pintura', 1, 0).xp).toBe(30);
  });
});
