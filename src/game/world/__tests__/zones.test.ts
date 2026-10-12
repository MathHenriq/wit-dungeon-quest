import { describe, expect, it } from 'vitest';
import { buildZone, ZONES } from '../world';
import { NPCS } from '../content';
import type { Town, ZoneId } from '../zone';

const towns = Object.fromEntries(ZONES.map(z => [z, buildZone(z)])) as Record<ZoneId, Town>;

function reachable(t: Town, zone: ZoneId): Set<string> {
  const npc = new Set(NPCS.filter(n => (n.zona ?? 'cidade') === zone).map(n => `${n.tx},${n.ty}`));
  const H = t.solid.length, W = t.solid[0].length;
  // com barco, a água aberta também leva a lugares (a ilha do farol)
  const boat = t.spots.some(sp => sp.kind === 'barco');
  const pass = (x: number, y: number) => !t.solid[y][x] || (boat && t.terrain[y][x] === 'agua');
  const seen = new Set([`${t.spawn.tx},${t.spawn.ty}`]);
  const q = [[t.spawn.tx, t.spawn.ty]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || !pass(nx, ny) || npc.has(k)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

describe('áreas do mundo', () => {
  for (const zone of ZONES) {
    const t = towns[zone];
    it(`${zone}: início livre, portas e saídas alcançáveis`, () => {
      const ok = reachable(t, zone);
      expect(t.solid[t.spawn.ty][t.spawn.tx]).toBe(false);
      for (const d of t.doors) expect(ok.has(`${d.tx},${d.ty + 1}`), `porta ${d.building} (${d.tx},${d.ty})`).toBe(true);
      for (const e of t.exits) expect(ok.has(`${e.x0},${e.y0}`), `saída para ${e.to}`).toBe(true);
    });
    it(`${zone}: cada saída chega num bloco livre da outra área, e lá tem a volta`, () => {
      for (const e of t.exits) {
        const other = towns[e.to];
        if (!other) continue;   // área ainda em obras
        const span = e.keep === 'y' ? e.y1 - e.y0 : e.x1 - e.x0;
        for (let k = 0; k <= span; k++) {
          const at = e.keep === 'y' ? { tx: e.at.tx, ty: e.at.ty + k } : { tx: e.at.tx + k, ty: e.at.ty };
          expect(other.solid[at.ty]?.[at.tx], `${zone} → ${e.to} (${at.tx},${at.ty})`).toBe(false);
          expect(reachable(other, e.to).has(`${at.tx},${at.ty}`), `${zone} → ${e.to} alcançável`).toBe(true);
        }
        expect(other.exits.some(b => b.to === zone), `${e.to} volta para ${zone}`).toBe(true);
      }
    });
    it(`${zone}: pontos de interação ficam de frente para um bloco alcançável`, () => {
      const ok = reachable(t, zone);
      for (const sp of t.spots) {
        if (sp.kind === 'cais' || sp.kind === 'ponte' || sp.kind === 'campo' || sp.kind === 'barco') continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ok.has(`${sp.tx + dx},${sp.ty + dy}`));
        expect(near, `${zone}: ${sp.kind} em ${sp.tx},${sp.ty}`).toBe(true);
      }
    });
  }
});
