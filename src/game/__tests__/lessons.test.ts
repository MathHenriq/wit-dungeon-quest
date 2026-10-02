import { describe, expect, it } from 'vitest';
import {
  accuracy, bestRoute, colorMatches, colorRounds, COLOR_GOALS, coordRounds, mixDrops, colorDist, modelTest, pitchRounds, routeLength, routeRounds,
  ruleOk, runRule, RULE_TASKS, sameP3, truth, tuneScore,
} from '../lessons';

describe('tarefas que ensinam', () => {
  it('afinar: comparações com resposta e afinação pontuada por cents', () => {
    const p = pitchRounds(3);
    expect(p.compare.map(c => Math.abs(c.a - c.b))).toEqual([7, 4, 2, 1]);
    for (const t of p.tune) expect(Math.abs(t.start - t.target)).toBeGreaterThanOrEqual(1.9);
    expect(tuneScore(10)).toBe(1); expect(tuneScore(-40)).toBe(0.35); expect(tuneScore(200)).toBe(0);
  });
  it('cores: a receita bate, outras não; as secundárias são distintas', () => {
    for (const g of COLOR_GOALS) {
      expect(colorMatches(g.recipe, g)).toBe(true);
      expect(colorMatches({ ...g.recipe, r: g.recipe.r * 2, y: g.recipe.y * 2, b: g.recipe.b * 2, w: g.recipe.w * 2 }, g)).toBe(true);   // mesma proporção
    }
    expect(colorMatches({ r: 1, y: 0, b: 0, w: 0 }, COLOR_GOALS[0])).toBe(false);
    // as metas são diferentes entre si (dá para errar)
    for (let i = 0; i < COLOR_GOALS.length; i++) for (let j = i + 1; j < COLOR_GOALS.length; j++)
      expect(colorDist(mixDrops(COLOR_GOALS[i].recipe), mixDrops(COLOR_GOALS[j].recipe))).toBeGreaterThan(0.1);
    expect(colorRounds(9).map(g => g.name).slice(0, 3)).toEqual(['LARANJA', 'VERDE', 'ROXO']);
  });
  it('SE/ENTÃO: a regra certa liga só quando devia', () => {
    for (const t of RULE_TASKS) {
      const ok = { sensor: t.sensor, cond: t.cond, action: t.action };
      expect(ruleOk(t, ok)).toBe(true);
      const run = runRule(t, ok);
      expect(run.every(x => x.fired === x.should)).toBe(true);
      expect(run.some(x => x.should) && run.some(x => !x.should)).toBe(true);
    }
    const t = RULE_TASKS[0];
    expect(runRule(t, { sensor: t.sensor, cond: 'gt70', action: t.action }).every(x => x.fired === x.should)).toBe(false);
  });
  it('melhor rota: a ótima não é maior que nenhuma outra', () => {
    for (const { depot, stops } of routeRounds(5)) {
      const b = bestRoute(depot, stops);
      expect(b.order.slice().sort()).toEqual(stops.map((_, i) => i));
      expect(b.len).toBeLessThanOrEqual(routeLength(depot, stops, stops.map((_, i) => i)));
      expect(b.len).toBe(routeLength(depot, stops, b.order));
    }
  });
  it('coordenadas: a opção certa está entre as erradas, sem repetir', () => {
    for (let s = 1; s < 30; s++) for (const q of coordRounds(s)) if (q.kind === 'ler') {
      expect(sameP3(q.options![q.answer!], q.p)).toBe(true);
      expect(q.options!.filter(o => sameP3(o, q.p))).toHaveLength(1);
    }
  });
  it('teste do modelo: 70% antes, 90% depois de trocar as 2 etiquetas ruins', () => {
    for (let s = 1; s < 20; s++) {
      const m = modelTest(s);
      expect(accuracy(m.test, m.before)).toBe(70);
      expect(accuracy(m.test, m.after)).toBe(90);
      expect(m.bad.every(i => m.train[i].label !== truth(m.train[i].icon))).toBe(true);
      expect(m.train.filter(t => t.label !== truth(t.icon))).toHaveLength(2);
    }
  });
});
