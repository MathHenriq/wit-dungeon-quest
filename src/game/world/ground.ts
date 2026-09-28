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
    // dilatar não apaga nada e erodir não acende nada: esses pixels já estão decididos
    const own = m[y * W + x];
    if (dil ? own : !own) { o[y * W + x] = own; continue; }
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

/** Amplia uma máscara k× (cada pixel vira k × k). */
function upMask(m: Mask, W: number, H: number, k: number): Mask {
  if (k === 1) return m;
  const o = new Uint8Array(W * k * H * k), WK = W * k;
  for (let y = 0; y < H * k; y++) {
    const src = ((y / k) | 0) * W;
    for (let x = 0; x < WK; x++) o[y * WK + x] = m[src + ((x / k) | 0)];
  }
  return o;
}

/**
 * Distância (em px, até `cap`) de cada pixel ao pixel da máscara mais perto
 * olhando só na mesma linha ou coluna (as 4 direções). 0 = dentro.
 */
function crossDist(m: Mask, W: number, H: number, cap: number): Uint8Array {
  const out = new Uint8Array(W * H).fill(cap);
  for (let y = 0; y < H; y++) {
    let run = cap;
    for (let x = 0; x < W; x++) { const i = y * W + x; run = m[i] ? 0 : Math.min(cap, run + 1); if (run < out[i]) out[i] = run; }
    run = cap;
    for (let x = W - 1; x >= 0; x--) { const i = y * W + x; run = m[i] ? 0 : Math.min(cap, run + 1); if (run < out[i]) out[i] = run; }
  }
  // colunas percorridas linha a linha (acesso contínuo na memória)
  const run = new Uint8Array(W).fill(cap);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; const r = m[i] ? 0 : Math.min(cap, run[x] + 1); run[x] = r; if (r < out[i]) out[i] = r;
  }
  run.fill(cap);
  for (let y = H - 1; y >= 0; y--) for (let x = 0; x < W; x++) {
    const i = y * W + x; const r = m[i] ? 0 : Math.min(cap, run[x] + 1); run[x] = r; if (r < out[i]) out[i] = r;
  }
  return out;
}

/**
 * Amplia a máscara k× e arredonda (abertura com disco de raio k) só perto da
 * borda: é o que tira os degraus da ampliação, e o miolo não muda.
 */
function roundEdges(m1: Mask, W1: number, H1: number, k: number): Mask {
  const up = upMask(m1, W1, H1, k), W = W1 * k, H = H1 * k;
  // blocos perto da borda (na resolução normal, com 1 px de folga)
  const edge = new Uint8Array(W1 * H1);
  for (let y = 0; y < H1; y++) for (let x = 0; x < W1; x++) {
    const i = y * W1 + x, v = m1[i];
    if ((x > 0 && m1[i - 1] !== v) || (x < W1 - 1 && m1[i + 1] !== v) || (y > 0 && m1[i - W1] !== v) || (y < H1 - 1 && m1[i + W1] !== v)) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < W1 && Y < H1) edge[Y * W1 + X] = 1;
      }
    }
  }
  const disk: [number, number][] = [];
  for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) if (dx * dx + dy * dy <= k * k) disk.push([dx, dy]);
  const at = (m: Mask, x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 1 : m[y * W + x]);
  const ero = new Uint8Array(up);
  const pts: number[] = [];
  for (let y = 0; y < H1; y++) for (let x = 0; x < W1; x++) {
    if (!edge[y * W1 + x]) continue;
    for (let yy = y * k; yy < y * k + k; yy++) for (let xx = x * k; xx < x * k + k; xx++) pts.push(yy * W + xx);
  }
  for (const i of pts) {
    if (!up[i]) continue;
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of disk) if (!at(up, x + dx, y + dy)) { ero[i] = 0; break; }
  }
  const out = new Uint8Array(ero);
  for (const i of pts) {
    if (ero[i]) continue;
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of disk) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < W && Y < H && ero[Y * W + X]) { out[i] = 1; break; }
    }
  }
  return out;
}

/** Ruído suave (valor interpolado numa grade de `cell` px), de 0 a 1. */
function smoothNoise(x: number, y: number, cell: number, seed: number): number {
  const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, seed), b = hash(x0 + 1, y0, seed), c = hash(x0, y0 + 1, seed), d = hash(x0 + 1, y0 + 1, seed);
  return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
}

/**
 * Mesmo desenho do chão por código (formas arredondadas, borda irregular da
 * trilha, meio-fio, margem do lago), mas a cor de cada pixel vem da textura.
 * `k` = 2 pinta em hd (2 pixels por pixel do mundo): as formas saem das
 * mesmas máscaras, ampliadas e arredondadas de novo, e as bordas mantêm a
 * espessura em pixels do mundo.
 */
function paintGroundTextured(grid: Terrain[][], tex: GroundTextures, k = 1): Pixmap {
  const TH = grid.length, TW = grid[0].length;
  const W1 = TW * TILE, H1 = TH * TILE;
  const W = W1 * k, H = H1 * k;
  const pm = new Pixmap(W, H);
  const d = pm.data;
  // escreve direto no buffer (o chão tem ~800 mil pixels: nada de criar array por pixel)
  const texel = (t: Pixmap, x: number, y: number) => ((y % t.h) * t.w + (x % t.w)) * 4;
  /** Copia o texel de `t` para (x, y), escurecendo (s > 0) ou clareando (s < 0). */
  const paint = (t: Pixmap, x: number, y: number, s = 0) => {
    const i = texel(t, x, y), o = (y * W + x) * 4, td = t.data;
    if (s === 0) { d[o] = td[i]; d[o + 1] = td[i + 1]; d[o + 2] = td[i + 2]; }
    else if (s > 0) { d[o] = td[i] * (1 - s); d[o + 1] = td[i + 1] * (1 - s); d[o + 2] = td[i + 2] * (1 - s); }
    else { const q = -s; d[o] = td[i] + (255 - td[i]) * q; d[o + 1] = td[i + 1] + (255 - td[i + 1]) * q; d[o + 2] = td[i + 2] + (255 - td[i + 2]) * q; }
    d[o + 3] = 255;
  };
  const solid = (x: number, y: number, c: RGBt) => { const o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; };
  /** Mistura a cor atual do pixel com `c`. */
  const blend = (x: number, y: number, c: RGBt, t: number) => {
    const o = (y * W + x) * 4;
    d[o] += (c[0] - d[o]) * t; d[o + 1] += (c[1] - d[o + 1]) * t; d[o + 2] += (c[2] - d[o + 2]) * t;
  };
  const darkenAt = (x: number, y: number, s: number) => { const o = (y * W + x) * 4; d[o] *= 1 - s; d[o + 1] *= 1 - s; d[o + 2] *= 1 - s; };
  /** Máscara de um terreno já na resolução final, com o contorno refeito em hd. */
  const final = (m1: Mask) => (k === 1 ? m1 : roundEdges(m1, W1, H1, k));
  /** Algum dos 4 vizinhos a distância 1..n está dentro? */
  const band = (inside: (x: number, y: number) => boolean, x: number, y: number, n: number) => {
    for (let t = 1; t <= n; t++) if (inside(x, y + t) || inside(x, y - t) || inside(x - t, y) || inside(x + t, y)) return true;
    return false;
  };

  // ── grama (fundo de tudo): cópia por linha, com manchas mais claras e mais escuras ──
  const g = tex.grama;
  for (let y = 0; y < H; y++) {
    const row = (y % g.h) * g.w * 4;
    for (let x = 0; x < W; x += g.w) {
      const n = Math.min(g.w, W - x);
      d.set(g.data.subarray(row, row + n * 4), (y * W + x) * 4);
    }
  }
  // manchas grandes e suaves (tira a cara de textura repetida)
  const patch = 40 * k, bs = 2 * k, BW = Math.ceil(W / bs);
  const shadeOf = new Float32Array(BW * Math.ceil(H / bs));
  for (let by = 0; by * bs < H; by++) for (let bx = 0; bx < BW; bx++) {
    const x = bx * bs, y = by * bs;
    const v = smoothNoise(x, y, patch, 21) * 0.7 + smoothNoise(x, y, patch * 0.37, 22) * 0.3;
    shadeOf[by * BW + bx] = (v - 0.5) * 0.16;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = shadeOf[((y / bs) | 0) * BW + ((x / bs) | 0)];
    if (Math.abs(s) < 0.015) continue;
    const o = (y * W + x) * 4;
    if (s > 0) { d[o] *= 1 - s; d[o + 1] *= 1 - s * 0.7; d[o + 2] *= 1 - s; }
    else { const q = -s * 0.8; d[o] += (255 - d[o]) * q * 0.6; d[o + 1] += (255 - d[o + 1]) * q; d[o + 2] += (235 - d[o + 2]) * q * 0.5; }
  }

  // ── chão de floresta (borda do mapa) ──
  const forest1 = maskOf(grid, 'floresta', W1, H1);
  const inForest = (x: number, y: number) => forest1[((y / k) | 0) * W1 + ((x / k) | 0)] === 1;
  // a borda da mata não é reta: avança e recua na grama (ruído), com uma
  // faixa mais escura de sombra das árvores
  const wob = 5 * k;
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    const isF = grid[ty][tx] === 'floresta';
    const nearF = !isF && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[ty + dy]?.[tx + dx] === 'floresta');
    if (!isF && !nearF) continue;
    const inner = isF && [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].every(([dx, dy]) => (grid[ty + dy]?.[tx + dx] ?? 'floresta') === 'floresta');
    if (inner) {
      for (let y = ty * TILE * k; y < (ty + 1) * TILE * k; y++) for (let x = tx * TILE * k; x < (tx + 1) * TILE * k; x++) paint(tex.floresta, x, y);
      continue;
    }
    for (let y = ty * TILE * k; y < (ty + 1) * TILE * k; y++) for (let x = tx * TILE * k; x < (tx + 1) * TILE * k; x++) {
      // distância (px) até a grama mais perto, com sinal: + dentro da mata
      let dIn = wob + 1;
      for (let t = 0; t <= wob; t++) {
        const o = inForest(x, y);
        if (o !== inForest(x + t, y) || o !== inForest(x - t, y) || o !== inForest(x, y + t) || o !== inForest(x, y - t)) { dIn = o ? t : -t; break; }
      }
      if (dIn > wob) { if (isF) paint(tex.floresta, x, y); continue; }
      const n = (smoothNoise(x, y, 9 * k, 77) - 0.5) * 2 * wob + (hash(x >> 1, y >> 1, 78) - 0.5) * k;
      if (dIn + n > 0) paint(tex.floresta, x, y, dIn + n < 2 * k ? -0.08 : 0);
      else if (dIn + n > -2 * k) darkenAt(x, y, 0.22);
    }
  }

  // ── trilha de areia: borda irregular, grama "levantada" com contorno ──
  let path = final(round(morph(morph(maskOf(grid, 'trilha', W1, H1), W1, H1, 3, true), W1, H1, 3, false), W1, H1, 3));
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
  const pd = crossDist(path, W, H, 2 * k + 1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!path[i]) {
      if (pd[i] > 2 * k || inForest(x, y)) continue;
      if (pd[i] <= k) darkenAt(x, y, 0.32);
      else paint(tex.grama, x, y, -0.18);
      continue;
    }
    // sombra da grama na borda de cima, luz embaixo; pedrinhas esparsas
    if (!inP(x, y - k) || !inP(x, y - 2 * k)) paint(tex.areia, x, y, 0.16);
    else if (!inP(x - k, y) || !inP(x + k, y)) paint(tex.areia, x, y, 0.08);
    else if (!inP(x, y + k)) paint(tex.areia, x, y, -0.15);
    else {
      paint(tex.areia, x, y);
      const v = smoothNoise(x, y, 18 * k, 31);
      if (v > 0.62) darkenAt(x, y, (v - 0.62) * 0.12);
    }
  }
  if (k > 1) {
    // pedrinhas na areia (só em hd: 2 × 2 com brilho)
    for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
      if (grid[ty][tx] !== 'trilha') continue;
      for (let q = 0; q < 2; q++) {
        if (hash(tx, ty, 40 + q) > 0.14) continue;
        const x = tx * TILE * k + 4 + Math.floor(hash(ty, tx, 50 + q) * (TILE * k - 8));
        const y = ty * TILE * k + 4 + Math.floor(hash(tx + 7, ty, 60 + q) * (TILE * k - 8));
        if (!inP(x - 3, y) || !inP(x + 4, y) || !inP(x, y - 3) || !inP(x, y + 4)) continue;
        solid(x, y, [184, 158, 118]); solid(x + 1, y, [184, 158, 118]); solid(x, y + 1, [160, 134, 98]); solid(x + 1, y + 1, [160, 134, 98]);
        solid(x, y - 1 < 0 ? y : y - 1, [236, 214, 170]);
      }
    }
  }

  // ── calçada: textura + meio-fio de pedra e sombra na grama ──
  const pave1 = maskOf(grid, 'calcada', W1, H1);
  const inV = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && pave1[((y / k) | 0) * W1 + ((x / k) | 0)] === 1;
  const curb: RGBt = [138, 142, 156], curbHi: RGBt = [214, 218, 226], curbLine: RGBt = [96, 98, 114], curbMid: RGBt = [176, 180, 192];
  const bv1 = boxOf(pave1, W1, H1, 2), bv = { x0: bv1.x0 * k, y0: bv1.y0 * k, x1: bv1.x1 * k + k - 1, y1: bv1.y1 * k + k - 1 };
  for (let y = bv.y0; y <= bv.y1; y++) for (let x = bv.x0; x <= bv.x1; x++) {
    if (!inV(x, y)) {
      if (inForest(x, y)) continue;
      for (let t = 1; t <= k; t++) if (inV(x, y - t)) { darkenAt(x, y, 0.3); break; }   // sombra do meio-fio
      continue;
    }
    if (!inV(x, y + k)) solid(x, y, curbLine);
    else if (!inV(x, y + 2 * k)) solid(x, y, k > 1 && !inV(x, y + 2 * k - 1) ? curbMid : curb);
    else if (!inV(x, y - k)) solid(x, y, curbHi);
    else if (!inV(x - k, y)) solid(x, y, curbHi);
    else if (!inV(x + k, y)) solid(x, y, curb);
    else paint(tex.calcada, x, y);
  }

  // ── canteiros de flores: textura com borda de madeira ──
  const bed1 = maskOf(grid, 'flores', W1, H1);
  const inB = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && bed1[((y / k) | 0) * W1 + ((x / k) | 0)] === 1;
  const wood: RGBt = [150, 98, 58], woodHi: RGBt = [196, 142, 88], woodLine: RGBt = [92, 58, 36];
  const bb1 = boxOf(bed1, W1, H1, 0), bb = { x0: bb1.x0 * k, y0: bb1.y0 * k, x1: bb1.x1 * k + k - 1, y1: bb1.y1 * k + k - 1 };
  for (let y = bb.y0; y <= bb.y1; y++) for (let x = bb.x0; x <= bb.x1; x++) {
    if (!inB(x, y)) continue;
    if (!inB(x, y + k)) solid(x, y, woodLine);
    else if (!inB(x, y + 2 * k)) solid(x, y, wood);
    else if (!inB(x, y - k)) solid(x, y, woodHi);
    else if (!inB(x - k, y) || !inB(x + k, y)) solid(x, y, (x & 7) === 0 && k > 1 ? woodLine : wood);
    else paint(tex.flores, x, y);
  }

  // ── mato alto: textura dentro de um contorno arredondado ──
  const tall = final(smooth(maskOf(grid, 'mato', W1, H1), W1, H1, 6));
  const inM = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && tall[y * W + x] === 1;
  const bm = boxOf(tall, W, H, 0);
  for (let y = bm.y0; y <= bm.y1; y++) for (let x = bm.x0; x <= bm.x1; x++) {
    if (!tall[y * W + x]) continue;
    const edge = !inM(x - k, y) || !inM(x + k, y) || !inM(x, y - k) || !inM(x, y + k);
    paint(tex.mato, x, y, edge ? 0.45 : 0);
  }

  // ── água: margem de terra, espuma clara na borda, sombra embaixo da margem de cima ──
  const water = final(smooth(maskOf(grid, 'agua', W1, H1), W1, H1, 10));
  const inW = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && water[y * W + x] === 1;
  const bank: RGBt = [176, 146, 98], bankDark: RGBt = [128, 100, 64];
  const bw = boxOf(water, W, H, 5 * k);
  const near = (x: number, y: number, r: number) =>
    inW(x - r, y) || inW(x + r, y) || inW(x, y - r) || inW(x, y + r);
  const nearDiag = (x: number, y: number, r: number) =>
    inW(x - r, y - r) || inW(x + r, y + r) || inW(x - r, y + r) || inW(x + r, y - r);
  for (let y = bw.y0; y <= bw.y1; y++) for (let x = bw.x0; x <= bw.x1; x++) {
    if (!inW(x, y)) {
      let r0 = 0;
      for (let r = 1; r <= 4 * k && !r0; r++) if (near(x, y, r) || nearDiag(x, y, Math.ceil(r * 0.75))) r0 = r;
      if (!r0) continue;
      if (r0 <= k) solid(x, y, bankDark);
      else if (r0 <= 3 * k) { paint(tex.areia, x, y); blend(x, y, bank, 0.35); }
      else darkenAt(x, y, 0.25);
      continue;
    }
    const e = band((xx, yy) => !inW(xx, yy), x, y, k);
    if (e) paint(tex.agua, x, y, -0.45);
    else if (!inW(x, y - 2 * k) || !inW(x, y - 3 * k) || !inW(x, y - 4 * k)) paint(tex.agua, x, y, 0.2);
    else paint(tex.agua, x, y);
  }
  // vitórias-régias (desenho de 1 px do mundo, ampliado em hd)
  const pad = ['.oooo.', 'ollllo', 'olloll', '.oooo.'];
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    if (grid[ty][tx] !== 'agua' || hash(tx, ty, 9) < 0.72) continue;
    const X = (tx * TILE + 4) * k, Y = (ty * TILE + 5) * k;
    if (!inW(X, Y) || !inW(X + 8 * k, Y + 6 * k)) continue;
    pad.forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (ch === '.') return;
      const c = ch === 'o' ? TREE.dark : TREE.light;
      for (let yy = 0; yy < k; yy++) for (let xx = 0; xx < k; xx++) solid(X + rx * k + xx, Y + ry * k + yy, c as unknown as RGBt);
    }));
    if (hash(ty, tx, 2) > 0.5) {
      const c = mix(TREE.hi, [255, 180, 210], 0.6) as unknown as RGBt;
      for (let yy = 0; yy < k; yy++) for (let xx = 0; xx < k; xx++) solid(X + 2 * k + xx, Y + k + yy, c);
    }
  }
  return pm;
}

/**
 * Versão do desenho do chão: suba quando mudar o jeito de pintar (este
 * arquivo) ou as texturas, para o chão pronto (scripts/mapa/chao-pronto.ts)
 * deixar de valer e ser gerado de novo.
 */
export const GROUND_VERSION = 3;

/** Chave do chão: a planta dos terrenos + a versão do desenho. */
export function groundKey(grid: Terrain[][]): string {
  let h = 2166136261;
  const str = `${GROUND_VERSION}|` + grid.map(r => r.map(t => t[0] + t[1]).join('')).join('/');
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** O chão em hd (2×), pintado com as texturas hd; sem elas, undefined. */
export function paintGroundHd(grid: Terrain[][], tex: GroundTextures): Pixmap | undefined {
  const all = [tex.grama, tex.mato, tex.areia, tex.calcada, tex.agua, tex.flores, tex.floresta];
  if (!all.every(t => t.hd)) return undefined;
  return paintGroundTextured(grid, {
    grama: tex.grama.hd!, mato: tex.mato.hd!, areia: tex.areia.hd!, calcada: tex.calcada.hd!,
    agua: tex.agua.hd!, flores: tex.flores.hd!, floresta: tex.floresta.hd!,
  }, 2);
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
