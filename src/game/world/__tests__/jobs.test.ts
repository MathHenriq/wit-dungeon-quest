import { describe, expect, it } from 'vitest';
import { buildTown } from '../town';
import { NPCS } from '../content';
import { findPath } from '../movement';
import { lampPower } from '../light';

describe('moradores trabalhando', () => {
  const town = buildTown();
  const free = (x: number, y: number) => !town.solid[y]?.[x] && !town.doors.some(d => d.tx === x && d.ty === y);
  const blocked = (x: number, y: number) => x < 0 || y < 0 || y >= town.solid.length || x >= town.solid[0].length || !free(x, y);

  it('cada morador começa num bloco livre e sem outro morador em cima', () => {
    const seen = new Set<string>();
    for (const n of NPCS) {
      expect(free(n.tx, n.ty), n.id).toBe(true);
      expect(seen.has(`${n.tx},${n.ty}`), n.id).toBe(false);
      seen.add(`${n.tx},${n.ty}`);
    }
  });

  it('toda parada das rotas é livre e dá para chegar a partir do começo', () => {
    for (const n of NPCS) {
      for (const [x, y] of n.job?.route ?? []) {
        expect(free(x, y), `${n.id} ${x},${y}`).toBe(true);
        if (x !== n.tx || y !== n.ty) expect(findPath(n.tx, n.ty, x, y, blocked).length, `${n.id} → ${x},${y}`).toBeGreaterThan(0);
      }
    }
  });

  it('pescador fica de frente para a água', () => {
    const D = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] } as const;
    for (const n of NPCS.filter(m => m.job?.kind === 'pescar')) {
      const [dx, dy] = D[n.dir];
      expect(town.terrain[n.ty + dy][n.tx + dx], n.id).toBe('agua');
    }
  });
});

describe('postes', () => {
  it('apagados de dia, acesos de madrugada, e acendem em horas diferentes', () => {
    expect(lampPower(12, 0.3)).toBe(0);
    expect(lampPower(2, 0.3)).toBe(1);
    expect(lampPower(22, 0.9)).toBe(1);
    // às 18h10 o primeiro já acendeu e o último ainda não
    expect(lampPower(18.2, 0)).toBe(1);
    expect(lampPower(18.2, 0.9)).toBe(0);
  });
});
