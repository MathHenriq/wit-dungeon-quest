// Gera o chão da cidade já pintado em hd (public/game/world/cidade/chao.webp),
// para o jogo não precisar calcular isso ao abrir (em PC fraco levava segundos).
//   npx vite-node scripts/mapa/chao-pronto.ts
// Rode de novo sempre que mudar a planta (town.ts), o desenho do chão
// (ground.ts, subindo GROUND_VERSION) ou as texturas de chão.
import { execFileSync } from 'node:child_process';
import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { groundKey, paintGroundHd, type GroundTextures } from '../../src/game/world/ground';
import { buildTown } from '../../src/game/world/town';
import { savePixmap } from './png';
import { loadWorldAssetsNode } from './assets-node';
import { TEXTURES, texturesHash } from './chao-hash';

{
  const a = loadWorldAssetsNode(undefined, true);
  const town = buildTown();   // só a planta (sem arte): os terrenos são os mesmos
  const tex = Object.fromEntries(TEXTURES.map(t => [t, a[`chao-${t}`].pix])) as unknown as GroundTextures;
  const hd = paintGroundHd(town.terrain, tex);
  if (!hd) throw new Error('faltam as texturas hd de chão (rode scripts/arte/importar-gpt.py)');
  const tmp = join(tmpdir(), 'chao-hd.png');
  savePixmap(hd, tmp, 1);
  execFileSync('python3', ['-c', `from PIL import Image; Image.open('${tmp}').convert('RGB').save('public/game/world/cidade/chao.webp', lossless=True, method=6)`]);
  unlinkSync(tmp);
  const info = { key: groundKey(town.terrain), texturas: texturesHash(), w: hd.w, h: hd.h };
  writeFileSync('public/game/world/cidade/chao.json', JSON.stringify(info, null, 1) + '\n');
  console.log('chão pronto:', info);
}
