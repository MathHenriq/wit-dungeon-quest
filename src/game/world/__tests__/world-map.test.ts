import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { groundKey } from '../ground';
import { buildZone, ZONES } from '../world';
import { WORLD_LAYOUT, ZONE_SIZE } from '../world-map';

describe('mapa-múndi', () => {
  it('o tamanho de cada área bate com a planta e nenhuma sai do mapa', () => {
    for (const z of ZONES) {
      const t = buildZone(z);
      expect(ZONE_SIZE[z], z).toEqual([t.solid[0].length, t.solid.length]);
      const a = WORLD_LAYOUT.areas[z];
      expect(a.x + ZONE_SIZE[z][0]).toBeLessThanOrEqual(WORLD_LAYOUT.w);
      expect(a.y + ZONE_SIZE[z][1]).toBeLessThanOrEqual(WORLD_LAYOUT.h);
    }
  });

  it('a imagem pronta está em dia com as plantas', () => {
    const info = JSON.parse(readFileSync('public/game/world/mapa.json', 'utf8'));
    const key = Object.keys(WORLD_LAYOUT.areas).map(z => groundKey(buildZone(z as never).terrain)).join('|');
    expect(info.key, 'mapa-múndi desatualizado: rode  npx vite-node scripts/mapa/mapa-mundo.ts').toBe(key);
  });
});
