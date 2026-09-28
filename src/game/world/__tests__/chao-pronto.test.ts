import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { groundKey } from '../ground';
import { buildTown } from '../town';

describe('chão pronto da cidade', () => {
  it('está em dia com a planta, o desenho e as texturas', async () => {
    const { texturesHash } = await import('../../../../scripts/mapa/chao-hash');
    const info = JSON.parse(readFileSync('public/game/world/cidade/chao.json', 'utf8'));
    const aviso = 'chão pronto desatualizado: rode  npx vite-node scripts/mapa/chao-pronto.ts';
    expect(info.key, aviso).toBe(groundKey(buildTown().terrain));
    expect(info.texturas, aviso).toBe(texturesHash());
  });
});
