import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { groundKey } from '../ground';
import { buildZone, ZONES } from '../world';

describe('chão pronto de cada área', () => {
  for (const zone of ZONES) {
    it(`${zone}: está em dia com a planta, o desenho e as texturas`, async () => {
      const { texturesHash } = await import('../../../../scripts/mapa/chao-hash');
      const info = JSON.parse(readFileSync(`public/game/world/${zone}/chao.json`, 'utf8'));
      const aviso = `chão pronto de "${zone}" desatualizado: rode  npx vite-node scripts/mapa/chao-pronto.ts ${zone}`;
      expect(info.key, aviso).toBe(groundKey(buildZone(zone).terrain));
      expect(info.texturas, aviso).toBe(texturesHash());
    });
  }
});
