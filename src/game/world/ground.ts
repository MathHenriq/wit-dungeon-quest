// Chão do mapa, pintado pixel a pixel a partir de uma grade de terrenos.
// Trilha e água ganham cantos arredondados (abertura morfológica), borda e
// sombra; a calçada tem juntas, meio-fio e traços de circuito (discretos de
// dia, acesos à noite) que ligam a Torre às avenidas.
import { hash, mix, Pixmap } from './pixmap';
import { FOREST_FLOOR, GRASS, LED, PATH, PAVE, TREE, WATER, WIT } from './palette';
import { TILE } from './buildings';

export type Terrain = 'grama' | 'trilha' | 'calcada' | 'agua' | 'mato' | 'floresta' | 'flores';

/** Texturas de chão (convertidas das imagens do GPT); cada uma se repete sem emenda. */
export interface GroundTextures {
  grama: Pixmap; mato: Pixmap; areia: Pixmap; calcada: Pixmap; agua: Pixmap; flores: Pixmap; floresta: Pixmap;
}

type Mask = Uint8Array;

function maskOf(grid: Terrain[][], t: Terrain, W: number, H: number): Mask {
  const m = new Uint8Array(W * H);
  for (let ty = 0; ty < grid.length; ty++) for (let tx = 0; tx < grid[0].length; tx++) {
    if (grid[ty][tx] !== t) continue;
    for (let y = ty * TILE; y < Math.min(H, ty * TILE + TILE); y++) m.fill(1, y * W + tx * TILE, y * W + Math.min(W, tx * TILE + TILE));
  }
  return m;
}

/** Caixa (com margem) em volta do que existe na máscara, para varrer só ali. */
function boxOf(m: Mask, W: number, H: number, pad: number): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    const row = m.subarray(y * W, y * W + W);
    const a = row.indexOf(1);
    if (a < 0) continue;
    const b = row.lastIndexOf(1);
    if (a < x0) x0 = a; if (b > x1) x1 = b; if (y < y0) y0 = y; y1 = y;
  }
  if (x1 < 0) return { x0: 0, y0: 0, x1: -1, y1: -1 };
  return { x0: Math.max(0, x0 - pad), y0: Math.max(0, y0 - pad), x1: Math.min(W - 1, x1 + pad), y1: Math.min(H - 1, y1 + pad) };
}

/**
 * Erosão (dil=false) ou dilatação (dil=true) com disco de raio r.
 * Linha a linha: para cada deslocamento vertical dy, o disco cobre um trecho
 * horizontal de meia-largura hw(dy); a soma acumulada da linha responde "há
 * algum 0 (ou 1) nesse trecho?" em tempo constante.
 */
function morph(m: Mask, W: number, H: number, r: number, dil: boolean): Mask {
  const o = new Uint8Array(W * H);
  const pref = new Int32Array((W + 1) * H); // soma acumulada de 1s por linha
  for (let y = 0; y < H; y++) {
    let acc = 0;
    for (let x = 0; x < W; x++) { acc += m[y * W + x]; pref[y * (W + 1) + x + 1] = acc; }
  }
  const hw: number[] = [];
  for (let dy = -r; dy <= r; dy++) hw.push(Math.floor(Math.sqrt(r * r - dy * dy)));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = dil ? 0 : 1;
    for (let k = 0; k <= 2 * r; k++) {
      const yy = y + k - r;
      const h = hw[k];
      const x0 = x - h, x1 = x + h;
      if (yy < 0 || yy >= H) { if (!dil) continue; else continue; }
      const a = Math.max(0, x0), b = Math.min(W - 1, x1);
      const ones = pref[yy * (W + 1) + b + 1] - pref[yy * (W + 1) + a];
      if (dil && ones > 0) { v = 1; break; }
      if (!dil && ones < b - a + 1) { v = 0; break; }
    }
    o[y * W + x] = v;
  }
  return o;
}

const round = (m: Mask, W: number, H: number, r: number) => morph(morph(m, W, H, r, false), W, H, r, true);
/** Forma lisa: fecha os cantos de dentro e arredonda os de fora (lago, mato). */
function smooth(m: Mask, W: number, H: number, r: number): Mask {
  // só na caixa em volta do que existe (o mapa inteiro é grande e o raio é alto)
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const out = new Uint8Array(W * H);
  if (x1 < 0) return out;
  const pad = 2 * r + 2;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const sub = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) sub[y * w + x] = m[(y + y0) * W + x + x0];
  const res = round(morph(morph(sub, w, h, r, true), w, h, r, false), w, h, r);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[(y + y0) * W + x + x0] = res[y * w + x];
  return out;
}

export function paintGround(grid: Terrain[][], tex?: GroundTextures): Pixmap {
  if (tex) return paintGroundTextured(grid, tex);
  const TH = grid.length, TW = grid[0].length;
  const W = TW * TILE, H = TH * TILE;
  const pm = new Pixmap(W, H);

  // ── grama com tufinhos (padrão por bloco, como no Emerald) ──
  pm.rect(0, 0, W, H, GRASS.base);
  const tuft = ['o.o', '.o.'];
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    const X = tx * TILE, Y = ty * TILE;
    const spots = [[2, 3], [10, 1], [6, 9], [13, 12], [1, 13]];
    spots.forEach(([dx, dy], k) => {
      if (hash(tx * 5 + k, ty, 1) < 0.35) return;
      pm.stamp(tuft, X + dx, Y + dy, { o: GRASS.tuft });
      pm.put(X + dx + 1, Y + dy + 2, GRASS.tuftDark);
    });
    for (let k = 0; k < 3; k++) {
      const x = X + Math.floor(hash(tx, ty, 10 + k) * 16), y = Y + Math.floor(hash(ty, tx, 20 + k) * 16);
      pm.put(x, y, GRASS.light);
    }
  }

  // ── trilha de areia: borda irregular, grama "levantada" com contorno ──
  let path = round(morph(morph(maskOf(grid, 'trilha', W, H), W, H, 3, true), W, H, 3, false), W, H, 3);
  // borda orgânica: tira/põe 1 px conforme um ruído suave ao longo do contorno
  {
    const jag = new Uint8Array(path);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const edge = path[i] !== path[i - 1] || path[i] !== path[i + 1] || path[i] !== path[i - W] || path[i] !== path[i + W];
      if (!edge) continue;
      const n = hash(x >> 1, y >> 1, 12);
      if (path[i] && n < 0.22) jag[i] = 0;
      else if (!path[i] && n > 0.8) jag[i] = 1;
    }
    path = jag;
  }
  const inP = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && path[y * W + x] === 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inP(x, y)) {
      // grama encostada na areia: contorno cinza e uma linha clara por dentro
      const touch = inP(x, y + 1) || inP(x, y - 1) || inP(x - 1, y) || inP(x + 1, y);
      const near = inP(x, y + 2) || inP(x, y - 2) || inP(x - 2, y) || inP(x + 2, y);
      if (touch) pm.put(x, y, GRASS.rim);
      else if (near) pm.put(x, y, GRASS.rimLight);
      continue;
    }
    let c = PATH.base;
    // sombra da grama sobre a areia logo abaixo da borda de cima
    if (!inP(x, y - 1) || !inP(x, y - 2)) c = PATH.shade;
    else if (!inP(x - 1, y) || !inP(x + 1, y)) c = mix(PATH.base, PATH.shade, 0.5);
    else {
      const n = hash(x >> 2, y >> 2, 4);
      if (n < 0.06 && hash(x, y, 5) < 0.5) c = PATH.pebble;
      else if (n > 0.95 && hash(x, y, 6) < 0.45) c = PATH.light;
    }
    pm.put(x, y, c);
  }

  // ── calçada tecnológica ──
  const pave = maskOf(grid, 'calcada', W, H);
  const inV = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && pave[y * W + x] === 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inV(x, y)) continue;
    const lx = x % 16, ly = y % 16;
    const odd = ((((x / 16) | 0) + ((y / 16) | 0)) & 1) === 1;
    let c = odd ? mix(PAVE.base, PAVE.light, 0.35) : PAVE.base;
    if (lx === 15 || ly === 15) c = PAVE.joint;
    else if (lx === 0 || ly === 0) c = PAVE.light;
    else if (hash(x, y, 6) < 0.015) c = PAVE.joint;
    // meio-fio: borda de baixo e da direita mais escura, de cima clara
    if (!inV(x, y + 1)) c = PAVE.curb;
    else if (!inV(x, y + 2)) c = PAVE.curbLight;
    else if (!inV(x, y - 1)) c = PAVE.light;
    if (!inV(x + 1, y) || !inV(x - 1, y)) c = PAVE.curbLight;
    pm.put(x, y, c);
    // sombra do meio-fio na grama
    if (!inV(x, y + 1) && y + 1 < H) pm.put(x, y + 1, GRASS.shadowDeep);
  }
  // ── água ──
  const water = round(maskOf(grid, 'agua', W, H), W, H, 6);
  const inW = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && water[y * W + x] === 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inW(x, y)) {
      if (inW(x, y - 1) || inW(x, y - 2)) pm.put(x, y, GRASS.shadowDeep);
      else if (inW(x - 1, y) || inW(x + 1, y) || inW(x, y + 1)) pm.put(x, y, WATER.bank);
      continue;
    }
    const e = !inW(x + 1, y) || !inW(x - 1, y) || !inW(x, y + 1) || !inW(x, y - 1);
    let c = WATER.base;
    if (e) c = WATER.edge;
    else if (!inW(x, y - 1) || !inW(x, y - 2) || !inW(x, y - 3)) c = WATER.deep;
    else if ((x + y * 3) % 29 === 0 && y % 5 === 0) c = WATER.light;
    pm.put(x, y, c);
    if (!e && (x * 7 + y * 13) % 97 === 0) { pm.put(x, y, WATER.foam); pm.put(x + 1, y, WATER.light); }
  }
  // vitórias-régias
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    if (grid[ty][tx] !== 'agua' || hash(tx, ty, 9) < 0.72) continue;
    const X = tx * TILE + 4, Y = ty * TILE + 5;
    if (!inW(X, Y) || !inW(X + 8, Y + 6)) continue;
    pm.stamp(['.oooo.', 'ollllo', 'olloll', '.oooo.'], X, Y, { o: TREE.dark, l: TREE.light });
    if (hash(ty, tx, 2) > 0.5) pm.put(X + 2, Y + 1, mix(TREE.hi, [255, 180, 210], 0.6));
  }

  // ── chão de floresta (borda do mapa) ──
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    if (grid[ty][tx] !== 'floresta') continue;
    pm.rect(tx * TILE, ty * TILE, TILE, TILE, FOREST_FLOOR);
  }

  // ── mato alto (preenche o bloco) ──
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    if (grid[ty][tx] !== 'mato') continue;
    const X = tx * TILE, Y = ty * TILE;
    pm.rect(X, Y + 4, TILE, TILE - 4, TREE.mid);
    for (const { tip, base, off } of [{ tip: 0, base: 9, off: 0 }, { tip: 6, base: 15, off: 2 }]) {
      for (let bx = off - 4; bx < 20; bx += 4) {
        for (let y = tip; y <= base; y++) {
          const t = (y - tip) / (base - tip), hw = t * 2.2;
          for (let x = Math.floor(bx - hw); x <= Math.ceil(bx + hw); x++) {
            if (x < 0 || x > 15) continue;
            const edge = Math.abs(x - bx) > hw - 0.8;
            const c = edge ? TREE.dark : t < 0.35 ? TREE.hi : x <= bx ? TREE.light : TREE.mid;
            pm.put(X + x, Y + y, c);
          }
        }
      }
    }
  }
  return pm;
}

// ─────────────────────── chão com as texturas do GPT ───────────────────────

type RGBt = readonly [number, number, number];
const darken = (c: RGBt, k: number): RGBt => [c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k)].map(Math.round) as unknown as RGBt;
const lighten = (c: RGBt, k: number): RGBt => [c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k].map(Math.round) as unknown as RGBt;

/**
 * Mesmo desenho do chão por código (formas arredondadas, borda irregular da
 * trilha, meio-fio, margem do lago), mas a cor de cada pixel vem da textura.
 */
function paintGroundTextured(grid: Terrain[][], tex: GroundTextures): Pixmap {
  const TH = grid.length, TW = grid[0].length;
  const W = TW * TILE, H = TH * TILE;
  const pm = new Pixmap(W, H);
  const d = pm.data;
  // escreve direto no buffer (o chão tem ~800 mil pixels: nada de criar array por pixel)
  const texel = (t: Pixmap, x: number, y: number) => ((y % t.h) * t.w + (x % t.w)) * 4;
  /** Copia o texel de `t` para (x, y), escurecendo (k > 0) ou clareando (k < 0). */
  const paint = (t: Pixmap, x: number, y: number, k = 0) => {
    const s = texel(t, x, y), o = (y * W + x) * 4, td = t.data;
    if (k === 0) { d[o] = td[s]; d[o + 1] = td[s + 1]; d[o + 2] = td[s + 2]; }
    else if (k > 0) { d[o] = td[s] * (1 - k); d[o + 1] = td[s + 1] * (1 - k); d[o + 2] = td[s + 2] * (1 - k); }
    else { const q = -k; d[o] = td[s] + (255 - td[s]) * q; d[o + 1] = td[s + 1] + (255 - td[s + 1]) * q; d[o + 2] = td[s + 2] + (255 - td[s + 2]) * q; }
    d[o + 3] = 255;
  };
  const solid = (x: number, y: number, c: RGBt) => { const o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; };
  /** Mistura a cor atual do pixel com `c`. */
  const blend = (x: number, y: number, c: RGBt, t: number) => {
    const o = (y * W + x) * 4;
    d[o] += (c[0] - d[o]) * t; d[o + 1] += (c[1] - d[o + 1]) * t; d[o + 2] += (c[2] - d[o + 2]) * t;
  };
  const darkenAt = (x: number, y: number, k: number) => { const o = (y * W + x) * 4; d[o] *= 1 - k; d[o + 1] *= 1 - k; d[o + 2] *= 1 - k; };

  // ── grama (fundo de tudo): cópia por linha ──
  const g = tex.grama;
  for (let y = 0; y < H; y++) {
    const row = (y % g.h) * g.w * 4;
    for (let x = 0; x < W; x += g.w) {
      const n = Math.min(g.w, W - x);
      d.set(g.data.subarray(row, row + n * 4), (y * W + x) * 4);
    }
  }

  // ── chão de floresta (borda do mapa) ──
  const forest = maskOf(grid, 'floresta', W, H);
  for (let i = 0; i < W * H; i++) if (forest[i]) paint(tex.floresta, i % W, (i / W) | 0);

  // ── trilha de areia: borda irregular, grama "levantada" com contorno ──
  let path = round(morph(morph(maskOf(grid, 'trilha', W, H), W, H, 3, true), W, H, 3, false), W, H, 3);
  {
    const jag = new Uint8Array(path);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const edge = path[i] !== path[i - 1] || path[i] !== path[i + 1] || path[i] !== path[i - W] || path[i] !== path[i + W];
      if (!edge) continue;
      const n = hash(x >> 1, y >> 1, 12);
      if (path[i] && n < 0.22) jag[i] = 0;
      else if (!path[i] && n > 0.8) jag[i] = 1;
    }
    path = jag;
  }
  const inP = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && path[y * W + x] === 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!path[i]) {
      if (forest[i]) continue;
      const touch = inP(x, y + 1) || inP(x, y - 1) || inP(x - 1, y) || inP(x + 1, y);
      if (touch) { darkenAt(x, y, 0.32); continue; }
      const near = inP(x, y + 2) || inP(x, y - 2) || inP(x - 2, y) || inP(x + 2, y);
      if (near) paint(tex.grama, x, y, -0.18);
      continue;
    }
    if (!inP(x, y - 1) || !inP(x, y - 2)) paint(tex.areia, x, y, 0.16);        // sombra da grama na borda de cima
    else if (!inP(x - 1, y) || !inP(x + 1, y)) paint(tex.areia, x, y, 0.08);
    else if (!inP(x, y + 1)) paint(tex.areia, x, y, -0.15);
    else paint(tex.areia, x, y);
  }

  // ── calçada: textura + meio-fio de pedra e sombra na grama ──
  const pave = maskOf(grid, 'calcada', W, H);
  const inV = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && pave[y * W + x] === 1;
  const curb: RGBt = [138, 142, 156], curbHi: RGBt = [214, 218, 226], curbLine: RGBt = [96, 98, 114];
  const bv = boxOf(pave, W, H, 1);
  for (let y = bv.y0; y <= bv.y1; y++) for (let x = bv.x0; x <= bv.x1; x++) {
    const i = y * W + x;
    if (!pave[i]) {
      if (inV(x, y - 1) && !forest[i]) darkenAt(x, y, 0.3);   // sombra do meio-fio
      continue;
    }
    if (!inV(x, y + 1)) solid(x, y, curbLine);
    else if (!inV(x, y + 2)) solid(x, y, curb);
    else if (!inV(x, y - 1)) solid(x, y, curbHi);
    else if (!inV(x - 1, y)) solid(x, y, curbHi);
    else if (!inV(x + 1, y)) solid(x, y, curb);
    else paint(tex.calcada, x, y);
  }

  // ── canteiros de flores: textura com borda de madeira ──
  const bed = maskOf(grid, 'flores', W, H);
  const inB = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && bed[y * W + x] === 1;
  const wood: RGBt = [150, 98, 58], woodHi: RGBt = [196, 142, 88], woodLine: RGBt = [92, 58, 36];
  const bb = boxOf(bed, W, H, 0);
  for (let y = bb.y0; y <= bb.y1; y++) for (let x = bb.x0; x <= bb.x1; x++) {
    if (!bed[y * W + x]) continue;
    if (!inB(x, y + 1)) solid(x, y, woodLine);
    else if (!inB(x, y + 2)) solid(x, y, wood);
    else if (!inB(x, y - 1)) solid(x, y, woodHi);
    else if (!inB(x - 1, y) || !inB(x + 1, y)) solid(x, y, wood);
    else paint(tex.flores, x, y);
  }

  // ── mato alto: textura dentro de um contorno arredondado ──
  const tall = smooth(maskOf(grid, 'mato', W, H), W, H, 6);
  const inM = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && tall[y * W + x] === 1;
  const bm = boxOf(tall, W, H, 0);
  for (let y = bm.y0; y <= bm.y1; y++) for (let x = bm.x0; x <= bm.x1; x++) {
    if (!tall[y * W + x]) continue;
    const edge = !inM(x - 1, y) || !inM(x + 1, y) || !inM(x, y - 1) || !inM(x, y + 1);
    paint(tex.mato, x, y, edge ? 0.45 : 0);
  }

  // ── água: margem de terra, espuma clara na borda, sombra embaixo da margem de cima ──
  const water = smooth(maskOf(grid, 'agua', W, H), W, H, 10);
  const inW = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && water[y * W + x] === 1;
  const bank: RGBt = [176, 146, 98], bankDark: RGBt = [128, 100, 64];
  const bw = boxOf(water, W, H, 5);
  for (let y = bw.y0; y <= bw.y1; y++) for (let x = bw.x0; x <= bw.x1; x++) {
    if (!inW(x, y)) {
      if (!(inW(x - 4, y) || inW(x + 4, y) || inW(x, y - 4) || inW(x, y + 4) || inW(x - 3, y - 3) || inW(x + 3, y + 3) || inW(x - 3, y + 3) || inW(x + 3, y - 3))) continue;
      const d1 = inW(x - 1, y) || inW(x + 1, y) || inW(x, y - 1) || inW(x, y + 1);
      const d3 = inW(x - 3, y) || inW(x + 3, y) || inW(x, y - 3) || inW(x, y + 3) || inW(x - 2, y - 2) || inW(x + 2, y + 2) || inW(x - 2, y + 2) || inW(x + 2, y - 2);
      if (d1) solid(x, y, bankDark);
      else if (d3) { paint(tex.areia, x, y); blend(x, y, bank, 0.35); }
      else darkenAt(x, y, 0.25);
      continue;
    }
    const e = !inW(x + 1, y) || !inW(x - 1, y) || !inW(x, y + 1) || !inW(x, y - 1);
    if (e) paint(tex.agua, x, y, -0.45);
    else if (!inW(x, y - 2) || !inW(x, y - 3) || !inW(x, y - 4)) paint(tex.agua, x, y, 0.2);
    else paint(tex.agua, x, y);
  }
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    if (grid[ty][tx] !== 'agua' || hash(tx, ty, 9) < 0.72) continue;
    const X = tx * TILE + 4, Y = ty * TILE + 5;
    if (!inW(X, Y) || !inW(X + 8, Y + 6)) continue;
    pm.stamp(['.oooo.', 'ollllo', 'olloll', '.oooo.'], X, Y, { o: TREE.dark, l: TREE.light });
    if (hash(ty, tx, 2) > 0.5) pm.put(X + 2, Y + 1, mix(TREE.hi, [255, 180, 210], 0.6));
  }
  return pm;
}

// ─────────────────────── circuitos na calçada ───────────────────────

/** Caminho de circuito: pontos em pixels, ligados por retas ou diagonais de 45°. */
export type Circuit = [number, number][];

/** Todos os pixels do caminho, na ordem (do começo ao fim). */
export function circuitPixels(path: Circuit): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < path.length; i++) {
    let [x, y] = path[i];
    const [x1, y1] = path[i + 1];
    const sx = Math.sign(x1 - x), sy = Math.sign(y1 - y);
    while (x !== x1 || y !== y1) {
      out.push([x, y]);
      if (x !== x1) x += sx;
      if (y !== y1) y += sy;
    }
  }
  const last = path[path.length - 1];
  out.push([last[0], last[1]]);
  return out;
}

const TRACE_DAY: [number, number, number] = [0xa6, 0xb8, 0xbe];

/**
 * Pinta os circuitos: de dia um traço fino embutido na calçada (quase
 * sumindo) e plaquinhas lima nas pontas e curvas; à noite o traço acende.
 */
export function paintCircuits(pm: Pixmap, nt: Pixmap, paths: Circuit[]): void {
  const pad = (x: number, y: number) => {
    pm.rect(x - 1, y - 1, 3, 3, TRACE_DAY);
    pm.put(x, y, WIT.limeLight);
    nt.rect(x - 1, y - 1, 3, 3, mix(LED.green, [0, 0, 0], 0.2));
    nt.put(x, y, LED.greenSoft);
  };
  for (const path of paths) {
    for (const [x, y] of circuitPixels(path)) {
      pm.put(x, y, TRACE_DAY);
      pm.put(x + 1, y + 1, PAVE.light);
      nt.put(x, y, mix(LED.green, [20, 60, 30], 0.3));
    }
    pad(path[0][0], path[0][1]);
    pad(path[path.length - 1][0], path[path.length - 1][1]);
    for (let i = 1; i + 1 < path.length; i++) {
      const [x, y] = path[i];
      nt.put(x, y, LED.green);
    }
  }
}
