// Renderiza a cidade inicial em PNG (inteira + recortes do tamanho da tela),
// de dia e à noite (e no entardecer, só a cidade inteira).
//   npx vite-node scripts/mapa/render-cidade.ts -- <pasta-saida> [escala]
import { readFileSync, mkdirSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { Pixmap } from '../../src/game/world/pixmap';
import { buildTown, renderTown, type Placed } from '../../src/game/world/town';
import { savePixmap } from './png';

const args = process.argv.slice(2).filter(a => a !== '--');
const dir = args[0] ?? '.';
const scale = Number(args[1] ?? 2);
mkdirSync(dir, { recursive: true });

/** Leitor mínimo de PNG RGBA 8 bits (os sprites do jogo). */
function readPng(file: string): Pixmap {
  const buf = readFileSync(file);
  let pos = 8, w = 0, h = 0, ct = 6;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const pm = new Pixmap(w, h);
  const prev = new Uint8Array(w * bpp), cur = new Uint8Array(w * bpp);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (w * bpp + 1)];
    for (let i = 0; i < w * bpp; i++) {
      const x = raw[y * (w * bpp + 1) + 1 + i];
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = x;
      if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      pm.data[i] = cur[x * bpp]; pm.data[i + 1] = cur[x * bpp + 1]; pm.data[i + 2] = cur[x * bpp + 2];
      pm.data[i + 3] = bpp === 4 ? cur[x * bpp + 3] : 255;
    }
    prev.set(cur);
  }
  return pm;
}

const t0 = Date.now();
const town = buildTown();
const t1 = Date.now();
const sp = (file: string, tx: number, ty: number): Placed => {
  const pix = readPng(`public/game/sprites/${file}`);
  return { id: file, pix, x: tx * 16 - 8, y: ty * 16 + 16 - 31, baseY: ty * 16 + 16 };
};
const people = [
  sp('base/south.png', town.spawn.tx, town.spawn.ty + 3),
  sp('pets/raposa-chama/andar-west-0.png', town.spawn.tx + 1, town.spawn.ty + 3),
];
for (const [suffix, hour] of [['', undefined], ['-noite', 22], ['-tarde', 18.4]] as [string, number | undefined][]) {
  const full = renderTown(town, people, hour);
  savePixmap(full, `${dir}/cidade${suffix}.png`, scale);
  if (suffix === '-tarde') continue;
  // recortes do tamanho de uma tela de jogo (20×13 blocos)
  const crops: [string, number, number][] = [['praca', 10, 6], ['oeste', 0, 6], ['leste', 20, 6], ['sul', 10, 17], ['norte', 0, 0]];
  for (const [name, tx, ty] of crops) {
    const c = new Pixmap(320, 208);
    for (let y = 0; y < 208; y++) for (let x = 0; x < 320; x++) {
      const px = full.get(tx * 16 + x, ty * 16 + y);
      if (px) c.put(x, y, px);
    }
    savePixmap(c, `${dir}/tela-${name}${suffix}.png`, 3);
  }
}
console.log(`cidade gerada em ${t1 - t0} ms; ${town.objects.length} objetos; ${town.doors.length} portas`);
