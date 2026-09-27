// Chão do mapa, pintado pixel a pixel a partir de uma grade de terrenos.
// Trilha e água ganham cantos arredondados (abertura morfológica), borda e
// sombra; a calçada tem juntas, meio-fio e linhas de luz.
import { hash, mix, Pixmap } from './pixmap';
import { FOREST_FLOOR, GRASS, PATH, PAVE, TREE, WATER } from './palette';
import { TILE } from './buildings';

export type Terrain = 'grama' | 'trilha' | 'calcada' | 'agua' | 'mato' | 'floresta';

type Mask = Uint8Array;

function maskOf(grid: Terrain[][], t: Terrain, W: number, H: number): Mask {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[(y / TILE) | 0]?.[(x / TILE) | 0] === t) m[y * W + x] = 1;
  }
  return m;
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

export function paintGround(grid: Terrain[][]): Pixmap {
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

  // ── trilha de terra (cantos arredondados) ──
  const path = round(morph(morph(maskOf(grid, 'trilha', W, H), W, H, 3, true), W, H, 3, false), W, H, 3);
  const inP = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && path[y * W + x] === 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inP(x, y)) {
      if (inP(x, y - 1) || inP(x - 1, y) || inP(x + 1, y)) pm.put(x, y, GRASS.shadow);
      continue;
    }
    const edge = !inP(x + 1, y) || !inP(x - 1, y) || !inP(x, y + 1) || !inP(x, y - 1);
    let c = PATH.base;
    if (edge) c = PATH.edge;
    else if (!inP(x, y - 1) || !inP(x, y - 2)) c = PATH.shade;
    else if (!inP(x, y + 2)) c = PATH.light;
    else if (hash(x, y, 3) < 0.012) c = PATH.pebble;
    else if (hash(x, y, 4) < 0.01) c = PATH.light;
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
  // linhas de luz no centro das avenidas (onde a calçada tem 2 blocos de largura)
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    const t = grid[ty][tx];
    if (t !== 'calcada') continue;
    const horiz = grid[ty + 1]?.[tx] === 'calcada' && grid[ty - 1]?.[tx] !== 'calcada' && grid[ty + 2]?.[tx] !== 'calcada';
    const vert = grid[ty]?.[tx + 1] === 'calcada' && grid[ty]?.[tx - 1] !== 'calcada' && grid[ty]?.[tx + 2] !== 'calcada';
    if (horiz) for (let x = 0; x < TILE; x += 2) pm.put(tx * TILE + x, ty * TILE + 15, PAVE.glow);
    if (vert) for (let y = 0; y < TILE; y += 2) pm.put(tx * TILE + 15, ty * TILE + y, PAVE.glow);
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
