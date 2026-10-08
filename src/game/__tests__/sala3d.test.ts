import { describe, expect, it } from 'vitest';
import { makeTarget, scoreBuild, supported, ROOM_SIZE } from '../sala3d';

describe('Sala Virtual (coordenadas 3D)', () => {
  it('a escultura cabe na sala, não tem bloco flutuando e não repete', () => {
    for (let s = 1; s < 50; s++) {
      const t = makeTarget(s);
      expect(new Set(t.map(b => b.join())).size).toBe(t.length);
      for (const b of t) {
        expect(b[0] >= 0 && b[0] < ROOM_SIZE && b[1] >= 0 && b[1] < ROOM_SIZE).toBe(true);
        expect(supported(t, b)).toBe(true);
      }
    }
  });
  it('nota: acertou tudo = 1; bloco a mais derruba', () => {
    const t = makeTarget(3);
    expect(scoreBuild(t, t).score).toBe(1);
    const fora = [0, 1, 2, 3, 4].flatMap(x => [0, 1, 2, 3, 4].map(y => [x, y, 0] as [number, number, number])).find(b => !t.some(c => c.join() === b.join()))!;
    expect(scoreBuild(t, [...t, fora]).score).toBeLessThan(1);
    expect(scoreBuild(t, [...t, t[0]]).score).toBe(1);   // repetido não conta duas vezes
    expect(scoreBuild(t, []).score).toBe(0);
  });
});
