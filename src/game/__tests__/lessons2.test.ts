import { describe, expect, it } from 'vitest';
import {
  artScore, bestPrice, BOWLS, calendarRounds, claims, decodeArt, encodeArt, fill, GAME_DESIGN, GAME_EVENTS, PIX, plantDay, profit, riseScore, rulesRight, runGame, sold, stallOf,
} from '../lessons2';

describe('mais tarefas que ensinam', () => {
  it('calendário: o dia de plantar sempre é um dia válido do mês', () => {
    for (let s = 1; s < 30; s++) for (const r of calendarRounds(s)) for (const c of r.crops) {
      const d = plantDay(r.feira, c);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d + c.days).toBe(r.feira);
    }
  });
  it('massa: morna com fermento cresce mais, gelada sem fermento menos', () => {
    expect(riseScore('fm', 'sf')).toBe(1);
    expect(riseScore('ff', 'sf')).toBe(0.5);
    expect(BOWLS.find(b => b.id === 'fm')!.rise).toBeGreaterThan(BOWLS.find(b => b.id === 'ff')!.rise);
  });
  it('barraca: o melhor preço dá o maior lucro, e caro demais ninguém compra', () => {
    for (let s = 1; s < 10; s++) {
      const st = stallOf(s), b = bestPrice(st);
      expect(b.profit).toBeGreaterThan(0);
      for (let p = 1; p <= 30; p++) expect(profit(st, p)).toBeLessThanOrEqual(b.profit);
      expect(sold(st, 30)).toBe(0);
      expect(b.price).toBeGreaterThan(st.cost);
    }
  });
  it('fato ou boato: 6 manchetes, sem repetir tema, com pista', () => {
    const c = claims(3);
    expect(c).toHaveLength(6);
    expect(c.every(x => x.pista.length > 5)).toBe(true);
  });
  it('lógica do jogo: as regras do documento passam de fase', () => {
    expect(rulesRight(GAME_DESIGN)).toBe(GAME_EVENTS.length);
    const run = runGame(GAME_DESIGN);
    expect(run.at(-1)!.done).toBe(true);
    expect(run.at(-1)!.lives).toBe(2);
    expect(run.at(-1)!.points).toBe(3);
    expect(runGame({}).at(-1)!.done).toBe(false);
  });
  it('pixel art: balde, nota e guardar como texto', () => {
    const px = Array(PIX * PIX).fill(0);
    const f = fill(px, 0, 3);
    expect(f.every(c => c === 3)).toBe(true);
    expect(artScore(px)).toBe(0);
    expect(artScore(f)).toBeCloseTo(0.5 / 3 + 0.5);
    expect(decodeArt(encodeArt(f))).toEqual(f);
    expect(decodeArt('xyz')).toBeNull();
  });
});
