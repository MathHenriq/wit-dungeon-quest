// Mapa-múndi pronto: as 4 áreas desenhadas de verdade (chão + prédios),
// encaixadas onde ficam no mundo (Fazenda a oeste, Centro, Lago a leste,
// Cidade WIT ao sul, com as saídas batendo), mata nos vãos, reduzido à metade.
// Grava public/game/world/mapa.webp + mapa.json (retângulo de cada área).
//   npx vite-node scripts/mapa/mapa-mundo.ts
// Mudou a planta de alguma área? Rode de novo (um teste avisa).
import { execFileSync } from 'node:child_process';
import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { groundKey } from '../../src/game/world/ground';
import { Pixmap } from '../../src/game/world/pixmap';
import { renderTown } from '../../src/game/world/town';
import { buildZone, type ZoneId } from '../../src/game/world/world';
import { WORLD_LAYOUT } from '../../src/game/world/world-map';
import { savePixmap } from './png';
import { loadWorldAssetsNode } from './assets-node';

const T = 16, SCALE = 2;
const assets = loadWorldAssetsNode();
const towns = Object.fromEntries((Object.keys(WORLD_LAYOUT.areas) as ZoneId[]).map(z => [z, buildZone(z, assets)]));
const W = WORLD_LAYOUT.w * T, H = WORLD_LAYOUT.h * T;
const pm = new Pixmap(W, H);

// mata nos vãos: faixas de pinheiros copiadas da borda de baixo do Lago
// (a mesma mata que cerca as áreas), deslocadas a cada fileira para não repetir
const lagoImg = renderTown(towns.lago);
const PW = lagoImg.w - 4 * T, PH = 2 * T, py0 = lagoImg.h - PH;
for (let row = 0; row * PH < H; row++) {
  const off = (row * 197) % PW;
  for (let y = 0; y < PH && row * PH + y < H; y++) for (let x = 0; x < W; x++) {
    const c = lagoImg.get(2 * T + ((x + off) % PW), py0 + y);
    if (c) pm.put(x, row * PH + y, c);
  }
}
// as áreas por cima
const info: Record<string, { x: number; y: number; w: number; h: number }> = {};
for (const [z, a] of Object.entries(WORLD_LAYOUT.areas)) {
  const img = z === 'lago' ? lagoImg : renderTown(towns[z]);
  pm.blit(img, a.x * T, a.y * T);
  info[z] = { x: a.x / WORLD_LAYOUT.w, y: a.y / WORLD_LAYOUT.h, w: towns[z].ground.w / T / WORLD_LAYOUT.w, h: towns[z].ground.h / T / WORLD_LAYOUT.h };
}
// reduz (média de cada bloco SCALE × SCALE)
const out = new Pixmap(W / SCALE, H / SCALE);
for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
  const s = [0, 0, 0];
  for (let j = 0; j < SCALE; j++) for (let i = 0; i < SCALE; i++) {
    const c = pm.get(x * SCALE + i, y * SCALE + j) ?? [0, 0, 0];
    s[0] += c[0]; s[1] += c[1]; s[2] += c[2];
  }
  out.put(x, y, s.map(v => Math.round(v / SCALE / SCALE)) as [number, number, number]);
}
const tmp = join(tmpdir(), `mapa-${Date.now()}.png`);
savePixmap(out, tmp, 1);
execFileSync('python3', ['-c', `from PIL import Image; Image.open('${tmp}').convert('RGB').save('public/game/world/mapa.webp', quality=88, method=6)`]);
unlinkSync(tmp);
const key = Object.keys(WORLD_LAYOUT.areas).map(z => groundKey(towns[z].terrain)).join('|');
writeFileSync('public/game/world/mapa.json', JSON.stringify({ key, w: out.w, h: out.h, areas: info }, null, 1));
console.log('ok', out.w, out.h);
