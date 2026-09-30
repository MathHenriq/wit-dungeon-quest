// Gera o chão de cada área já pintado em hd (public/game/world/<área>/chao.webp),
// para o jogo não precisar calcular isso ao abrir (em PC fraco levava segundos).
//   npx vite-node scripts/mapa/chao-pronto.ts [área ...]
// Rode de novo sempre que mudar a planta (town.ts, zone-*.ts), o desenho do chão
// (ground.ts, subindo GROUND_VERSION) ou as texturas de chão.
import { execFileSync } from 'node:child_process';
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { groundKey, paintGroundHd, type GroundTextures } from '../../src/game/world/ground';
import { buildZone, ZONES, type ZoneId } from '../../src/game/world/world';
import { savePixmap } from './png';
import { loadWorldAssetsNode } from './assets-node';
import { TEXTURES, texturesHash } from './chao-hash';

const want = process.argv.slice(2).filter(a => a !== '--') as ZoneId[];
const a = loadWorldAssetsNode(undefined, true);
const tex = Object.fromEntries(TEXTURES.map(t => [t, a[`chao-${t}`].pix])) as unknown as GroundTextures;
for (const zone of want.length ? want : ZONES) {
  const town = buildZone(zone);   // só a planta (sem arte): os terrenos são os mesmos
  const hd = paintGroundHd(town.terrain, tex);
  if (!hd) throw new Error('faltam as texturas hd de chão (rode scripts/arte/importar-gpt.py)');
  const dir = `public/game/world/${zone}`;
  mkdirSync(dir, { recursive: true });
  const tmp = join(tmpdir(), `chao-hd-${zone}.png`);
  savePixmap(hd, tmp, 1);
  execFileSync('python3', ['-c', `from PIL import Image; Image.open('${tmp}').convert('RGB').save('${dir}/chao.webp', lossless=True, method=6)`]);
  unlinkSync(tmp);
  const info = { key: groundKey(town.terrain), texturas: texturesHash(), w: hd.w, h: hd.h };
  writeFileSync(`${dir}/chao.json`, JSON.stringify(info, null, 1) + '\n');
  console.log(`chão pronto (${zone}):`, info);
}
