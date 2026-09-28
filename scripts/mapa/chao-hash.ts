// Impressão digital das texturas de chão hd: o teste compara com a do chão
// pronto (public/game/world/cidade/chao.json) para saber se ele está em dia.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const TEXTURES = ['grama', 'mato', 'areia', 'calcada', 'agua', 'flores', 'floresta'];

export function texturesHash(): string {
  const h = createHash('sha1');
  for (const t of TEXTURES) h.update(readFileSync(`public/game/world/hd/chao-${t}.png`));
  return h.digest('hex').slice(0, 12);
}
