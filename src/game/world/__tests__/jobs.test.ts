import { describe, expect, it } from 'vitest';
import { buildZone, ZONES } from '../world';
import { NPCS } from '../content';
import { findPath } from '../movement';
import { lampPower } from '../light';
import { normalizeLook } from '../outfit';
import type { Town, ZoneId } from '../zone';

describe('moradores trabalhando', () => {
  const towns = Object.fromEntries(ZONES.map(z => [z, buildZone(z)])) as Record<ZoneId, Town>;
  const townOf = (n: (typeof NPCS)[number]) => towns[n.zona ?? 'cidade'];
  const free = (t: Town, x: number, y: number) => !t.solid[y]?.[x] && !t.doors.some(d => d.tx === x && d.ty === y);
  const blocked = (t: Town) => (x: number, y: number) => x < 0 || y < 0 || y >= t.solid.length || x >= t.solid[0].length || !free(t, x, y);

  it('cada morador mora numa área que existe e tem o visual válido', () => {
    for (const n of NPCS) {
      expect(townOf(n), `${n.id}: área ${n.zona}`).toBeDefined();
      expect(normalizeLook(n.look), `${n.id}: visual`).toEqual(n.look);
    }
  });

  it('cada morador começa num bloco livre e sem outro morador em cima', () => {
    const seen = new Set<string>();
    for (const n of NPCS) {
      expect(free(townOf(n), n.tx, n.ty), n.id).toBe(true);
      const k = `${n.zona ?? 'cidade'}:${n.tx},${n.ty}`;
      expect(seen.has(k), n.id).toBe(false);
      seen.add(k);
    }
  });

  it('toda parada das rotas é livre e dá para chegar a partir do começo', () => {
    for (const n of NPCS) {
      const t = townOf(n);
      for (const [x, y] of n.job?.route ?? []) {
        expect(free(t, x, y), `${n.id} ${x},${y}`).toBe(true);
        if (x !== n.tx || y !== n.ty) expect(findPath(n.tx, n.ty, x, y, blocked(t)).length, `${n.id} → ${x},${y}`).toBeGreaterThan(0);
      }
    }
  });

  it('pescador fica de frente para a água', () => {
    const D = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] } as const;
    for (const n of NPCS.filter(m => m.job?.kind === 'pescar')) {
      const [dx, dy] = D[n.dir];
      expect(townOf(n).terrain[n.ty + dy][n.tx + dx], n.id).toBe('agua');
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
