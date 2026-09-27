// Objetos do mapa: árvores, arbustos, cercas, placas, postes, fonte, mural...
// Cada função devolve um Pixmap com fundo transparente. A base do objeto (o
// ponto que encosta no chão) fica sempre na última linha da área de colisão.
import { hash, hex, mix, Pixmap, type RGB } from './pixmap';
import {
  BLOSSOM, GLASS, GRASS, LINE, LINE_DARK, METAL, NEON, TREE, WATER, WHITE, WOOD,
} from './palette';

type LeafPal = { line: RGB; dark: RGB; mid: RGB; light: RGB; hi: RGB };

interface Tier { y: number; halfW: number; n: number; h: number }

/**
 * Copa feita de "escamas" pontudas em camadas, como nas árvores do Emerald:
 * as camadas de cima cobrem as de baixo, cada escama tem o topo claro e a
 * borda de baixo escura. Luz vindo de cima-esquerda.
 */
function scaleCanopy(pm: Pixmap, cx: number, tiers: Tier[], pal: LeafPal, seed: number): Uint8Array {
  const W = pm.w, H = pm.h;
  const owner = new Int16Array(W * H).fill(-1);
  const color: (RGB | null)[] = new Array(W * H).fill(null);
  let id = 0;
  // de baixo para cima: a camada de cima é desenhada por último
  for (let t = tiers.length - 1; t >= 0; t--) {
    const { y: by, halfW, n, h } = tiers[t];
    const scales: [number, number][] = [];
    for (let i = 0; i < n; i++) scales.push([cx - halfW + (2 * halfW * (i + 0.5)) / n, halfW / n + 2.2]);
    scales.push([cx, Math.max(4, halfW / n + 1.5)]); // escama do centro (espinha clara)
    for (const [sx, a] of scales) {
      id++;
      for (let y = Math.floor(by - h - 1); y <= by + 3; y++) for (let x = Math.floor(sx - a - 1); x <= sx + a + 1; x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const px = x + 0.5, py = y + 0.5;
        const top = by - h + (Math.abs(px - sx) * h) / a;
        const bottom = by + 2.2 * (1 - ((px - sx) / a) ** 2);
        if (py < top || py > bottom) continue;
        const d = py - top;
        const rightSide = px > sx + a * 0.35;
        let c: RGB;
        if (py > by + 1.2) c = pal.dark;
        else if (py > by - 0.2) c = rightSide ? pal.dark : pal.mid;
        else if (d < 1.2) c = rightSide ? pal.light : pal.hi;
        else if (d < 2.4) c = rightSide ? pal.mid : pal.light;
        else if (Math.abs(d - 4.2) < 0.6 && !rightSide && Math.abs(px - sx) < a * 0.5) c = pal.light; // "v" interno
        else c = rightSide && hash(x, y, seed) < 0.35 ? pal.dark : pal.mid;
        owner[y * W + x] = id;
        color[y * W + x] = c;
      }
    }
  }
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (color[i]) { mask[i] = 1; pm.put(i % W, (i / W) | 0, color[i]); }
  return mask;
}

/**
 * Copa redonda feita de bolotas de folha: as da frente (mais baixas) cobrem as
 * de trás, cada bolota com brilho em cima-esquerda e sombra embaixo-direita.
 */
function puffCanopy(pm: Pixmap, puffs: [number, number, number][], pal: LeafPal, seed: number): Uint8Array {
  const W = pm.w, H = pm.h;
  const mask = new Uint8Array(W * H);
  const sorted = [...puffs].sort((a, b) => a[1] - b[1]); // de trás (cima) para a frente (baixo)
  for (const [cx, cy, r] of sorted) {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const dd = (dx * dx + dy * dy) / (r * r);
      if (dd > 1) continue;
      const light = ((dx + r * 0.35) ** 2 + (dy + r * 0.4) ** 2) / (r * r);
      const shadow = dx * 0.45 + dy;
      let c: RGB;
      if (dd > 0.78 && dy > -r * 0.2) c = pal.dark;          // borda que separa da bolota de trás
      else if (shadow > r * 0.55) c = pal.dark;
      else if (light < 0.12) c = pal.hi;
      else if (light < 0.38) c = pal.light;
      else c = hash(x, y, seed) < 0.12 ? pal.light : pal.mid;
      pm.put(x, y, c);
      mask[y * W + x] = 1;
    }
  }
  return mask;
}

function groundShadow(pm: Pixmap, cx: number, cy: number, rx: number, ry: number): void {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    if (d <= 1) pm.put(x, y, d < 0.55 ? GRASS.shadowDeep : GRASS.shadow);
  }
}

function outlineMask(pm: Pixmap, mask: Uint8Array, c: RGB): void {
  const W = pm.w, H = pm.h;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (on(x, y)) continue;
    if (on(x + 1, y) || on(x - 1, y) || on(x, y + 1) || on(x, y - 1)) pm.put(x, y, c);
  }
}

export type TreeKind = 'pinheiro' | 'redonda' | 'florida' | 'arbusto';

/** Árvore de 2×2 blocos (32×40 px; arbusto 16×18). */
export function tree(kind: TreeKind, seed = 1): Pixmap {
  if (kind === 'arbusto') {
    const pm = new Pixmap(16, 18);
    groundShadow(pm, 8, 15, 7.5, 2.5);
    const m = scaleCanopy(pm, 8, [{ y: 9, halfW: 5, n: 2, h: 5 }, { y: 13, halfW: 6.5, n: 2, h: 5 }], TREE, seed);
    outlineMask(pm, m, TREE.line);
    return pm;
  }
  const pm = new Pixmap(32, 42);
  groundShadow(pm, 16, 37, 14.5, 4);
  // tronco
  for (let y = 31; y <= 37; y++) for (let x = 13; x <= 18; x++) {
    pm.put(x, y, x === 13 || x === 18 ? TREE.line : x <= 15 ? TREE.trunk : TREE.trunkDark);
  }
  const pal: LeafPal = kind === 'florida' ? BLOSSOM : TREE;
  const m = kind === 'pinheiro'
    ? scaleCanopy(pm, 16, [{ y: 10, halfW: 5.5, n: 1, h: 9 }, { y: 17, halfW: 9, n: 2, h: 8 }, { y: 24, halfW: 12, n: 3, h: 8 }, { y: 31, halfW: 14, n: 4, h: 8 }], pal, seed)
    : puffCanopy(pm, [
      [16, 8, 6.5], [10, 12, 6], [22, 12, 6],
      [6, 19, 6], [16, 16, 7], [26, 19, 6],
      [10, 24, 6.5], [22, 24, 6.5], [16, 27, 6.5],
    ], pal, seed);
  outlineMask(pm, m, pal.line);
  if (kind === 'florida') {
    // pétalas caídas em volta
    for (let k = 0; k < 7; k++) {
      const x = 3 + Math.floor(hash(k, seed) * 26), y = 36 + Math.floor(hash(seed, k) * 5);
      if (!pm.opaque(x, y) || pm.get(x, y)![0] < 140) pm.put(x, y, BLOSSOM.light);
    }
  }
  return pm;
}

// ─────────────────────── chão decorado ───────────────────────

/** Bloco de grama alta (16×16), no estilo das rotas do Pokémon. */
export function tallGrass(): Pixmap {
  const pm = new Pixmap(16, 16);
  pm.rect(0, 5, 16, 11, TREE.dark);
  const rows = [{ tip: 0, base: 9, off: 0 }, { tip: 6, base: 15, off: 2 }];
  for (const { tip, base, off } of rows) {
    for (let bx = off - 4; bx < 20; bx += 4) {
      for (let y = tip; y <= base; y++) {
        const t = (y - tip) / (base - tip);
        const hw = t * 2.2;
        for (let x = Math.floor(bx - hw); x <= Math.ceil(bx + hw); x++) {
          if (x < 0 || x > 15) continue;
          const edge = Math.abs(x - bx) > hw - 0.8;
          let c: RGB;
          if (edge) c = TREE.line;
          else if (t < 0.3) c = TREE.hi;
          else if (t < 0.55) c = x <= bx ? TREE.light : TREE.mid;
          else c = x <= bx ? TREE.mid : TREE.dark;
          pm.put(x, y, c);
        }
      }
    }
  }
  return pm;
}

/** Canteiro de flores (16×16): 4 flores de 5 pétalas. */
export function flowerTile(colors: RGB[], seed = 0): Pixmap {
  const pm = new Pixmap(16, 16);
  const pos = [[1, 1], [9, 3], [3, 9], [10, 10]];
  pos.forEach(([x, y], k) => {
    const c = colors[(k + seed) % colors.length];
    const dark = mix(c, LINE, 0.45);
    const light = mix(c, WHITE, 0.55);
    pm.stamp([
      '.oco.',
      'occco',
      'cclcc',
      'occco',
      '.oco.',
      '..g..',
    ], x, y, { o: dark, c, l: NEON.yellow, g: TREE.mid });
    pm.put(x + 1, y + 1, light);
  });
  return pm;
}

// ─────────────────────── objetos ───────────────────────

/** Cerca branca: um bloco (16×16). `edge` fecha a ponta com poste. */
export function fence(): Pixmap {
  const pm = new Pixmap(16, 16);
  for (let x = 0; x < 16; x++) {
    for (const ry of [5, 10]) {
      pm.put(x, ry - 1, LINE); pm.put(x, ry, METAL.light); pm.put(x, ry + 1, METAL.shade); pm.put(x, ry + 2, LINE);
    }
    pm.put(x, 15, GRASS.shadow);
  }
  for (const px of [1, 9]) {
    pm.stamp([
      '.ooo.',
      'owwso',
      'owwso',
      'owwso',
      'owwso',
      'owwso',
      'owwso',
      'owwso',
      'owwso',
      'owwso',
      'owwso',
      'owwso',
      'owwso',
      'ooooo',
    ], px, 1, { o: LINE, w: METAL.light, s: METAL.shade });
    pm.put(px + 1, 2, WHITE);
  }
  return pm;
}

export function mailbox(color: RGB): Pixmap {
  const pm = new Pixmap(16, 16);
  pm.stamp([
    '...oooooooo.',
    '..owwwwwwwso',
    '..owwwwwwwso',
    '..owwwwwwwso',
    '..ossssssssso',
    '..ooooooooo.',
    '......os....',
    '......os....',
    '......os....',
    '.....ssss...',
  ], 1, 3, { o: LINE, w: METAL.light, s: METAL.shade });
  pm.rect(9, 5, 2, 2, color);
  return pm;
}

export function signPost(): Pixmap {
  const pm = new Pixmap(16, 16);
  pm.stamp([
    '.oooooooooooo.',
    'olllllllllllbo',
    'olbbbbbbbbbbdo',
    'olbllllllllbdo',
    'olbbbbbbbbbbdo',
    'olbllllbbbbbdo',
    'obdddddddddddo',
    '.oooooooooooo.',
    '.....obdo.....',
    '.....obdo.....',
    '.....obdo.....',
    '....gggggg....',
  ], 1, 3, { o: WOOD.line, l: WOOD.light, b: WOOD.base, d: WOOD.dark, g: GRASS.shadow });
  return pm;
}

/** Poste de luz tecnológico (16×32). */
export function lamp(): Pixmap {
  const pm = new Pixmap(16, 32);
  pm.stamp([
    '....oooooooo....',
    '...occcccccco...',
    '...ocaaaaaaco...',
    '....oooooooo....',
    '.......om.......',
  ], 0, 2, { o: LINE, c: NEON.cyanSoft, a: NEON.cyan, m: METAL.base });
  for (let y = 7; y < 28; y++) { pm.put(7, y, LINE); pm.put(8, y, y % 6 === 0 ? NEON.cyan : METAL.base); pm.put(9, y, LINE); }
  pm.stamp(['.ooooo.', 'ommmmso', 'ooooooo'], 5, 27, { o: LINE, m: METAL.base, s: METAL.shade });
  for (let x = 3; x < 13; x++) pm.put(x, 30, GRASS.shadow);
  return pm;
}

/** Banco de praça (32×16). */
export function bench(): Pixmap {
  const pm = new Pixmap(32, 16);
  pm.stamp([
    '.oooooooooooooooooooooooooooooo.',
    'olllllllllllllllllllllllllllllbo',
    'obbbbbbbbbbbbbbbbbbbbbbbbbbbbbdo',
    '.oooooooooooooooooooooooooooooo.',
    'olllllllllllllllllllllllllllllbo',
    'obbbbbbbbbbbbbbbbbbbbbbbbbbbbbdo',
    'oddddddddddddddddddddddddddddddo',
    '.oooooooooooooooooooooooooooooo.',
    '..omo....................omo....',
    '..omo....................omo....',
    '..ooo....................ooo....',
  ], 0, 3, { o: LINE, l: WOOD.light, b: WOOD.base, d: WOOD.dark, m: METAL.dark });
  return pm;
}

/** Máquina de venda (16×32): cartas e sucos. */
export function vending(): Pixmap {
  const pm = new Pixmap(16, 32);
  pm.rect(1, 2, 14, 28, LINE);
  pm.rect(2, 3, 12, 26, hex('#5a7ee0'));
  pm.rect(2, 3, 12, 2, hex('#8eaaf4'));
  pm.rect(3, 6, 8, 12, GLASS.low);
  pm.rect(3, 6, 8, 3, GLASS.mid);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const col = [NEON.pink, NEON.yellow, NEON.cyan][(r + c) % 3];
    pm.rect(4 + c * 2 + (c > 0 ? c - 1 : 0), 10 + r * 3, 2, 2, col);
  }
  pm.put(4, 7, WHITE); pm.put(5, 7, WHITE);
  pm.rect(12, 7, 1, 8, NEON.cyan);
  pm.rect(4, 21, 8, 4, LINE_DARK);
  pm.rect(5, 22, 6, 2, hex('#28304c'));
  pm.rect(2, 27, 12, 2, hex('#3c56b0'));
  for (let x = 1; x < 15; x++) pm.put(x, 30, GRASS.shadow);
  return pm;
}

/** Mural / Quadro de avisos (48×32). */
export function noticeBoard(): Pixmap {
  const pm = new Pixmap(48, 34);
  pm.rect(1, 1, 46, 24, WOOD.line);
  pm.rect(2, 2, 44, 22, WOOD.base);
  pm.rect(2, 2, 44, 2, WOOD.light);
  pm.rect(4, 5, 40, 17, hex('#e8d4a8'));
  const papers: [number, number, number, number, RGB][] = [
    [6, 7, 9, 7, WHITE], [17, 6, 8, 10, hex('#ffe6a0')], [27, 8, 9, 6, hex('#c8ecff')],
    [37, 6, 6, 9, hex('#ffd0e4')], [8, 15, 11, 5, hex('#d4f4c8')], [22, 16, 12, 5, WHITE],
  ];
  for (const [x, y, w, h, c] of papers) {
    pm.rect(x, y, w, h, c);
    for (let k = 1; k < h - 1; k += 2) pm.rect(x + 1, y + k, w - 3, 1, mix(c, LINE, 0.35));
    pm.put(x + (w >> 1), y, NEON.pink);
  }
  // título "MURAL" em placa
  pm.rect(15, 0, 18, 5, LINE);
  pm.rect(16, 1, 16, 3, NEON.yellow);
  // pés
  for (const px of [6, 40]) { pm.rect(px, 25, 3, 7, WOOD.line); pm.rect(px + 1, 25, 1, 7, WOOD.base); }
  for (let x = 3; x < 45; x++) pm.put(x, 32, GRASS.shadow);
  return pm;
}

/** Fonte da praça (64×44), com água e jato. */
export function fountain(frame = 0): Pixmap {
  const pm = new Pixmap(64, 46);
  const cx = 32, cy = 28, rx = 30, ry = 15;
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < 64; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    const d2 = ((x + 0.5 - cx) / (rx - 5)) ** 2 + ((y + 0.5 - cy + 1) / (ry - 4)) ** 2;
    if (d > 1) continue;
    if (d > 0.88) pm.put(x, y, LINE);
    else if (d2 > 1) pm.put(x, y, y < cy - 4 ? METAL.light : y > cy + 5 ? METAL.shade : METAL.base);
    else {
      pm.put(x, y, d2 > 0.75 && y < cy ? WATER.deep : WATER.base);
      if ((x * 3 + y * 7 + frame * 5) % 23 === 0) pm.put(x, y, WATER.light);
      if ((x * 5 + y * 11 + frame * 3) % 61 === 0) pm.put(x, y, WATER.foam);
    }
  }
  // espessura da borda na frente
  for (let x = 3; x < 61; x++) {
    const yEdge = Math.round(cy + ry * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / rx) ** 2)));
    pm.put(x, yEdge - 1, METAL.dark); pm.put(x, yEdge, METAL.dark); pm.put(x, yEdge + 1, LINE);
  }
  // pilar central com anel de luz e jato
  pm.rect(28, 15, 8, 14, LINE); pm.rect(29, 15, 6, 13, METAL.base); pm.rect(29, 15, 2, 13, METAL.light);
  pm.rect(29, 22, 6, 1, NEON.cyan);
  pm.rect(25, 12, 14, 4, LINE); pm.rect(26, 12, 12, 3, METAL.light); pm.rect(26, 14, 12, 1, METAL.shade);
  pm.stamp([
    '....w....',
    '...wcw...',
    '..wc.cw..',
    '.wc...cw.',
    'wc.....cw',
    'c.......c',
  ], 28 + (frame % 2 ? 0 : 0), 4, { w: WHITE, c: NEON.cyanSoft });
  pm.stamp(['.w.', 'wcw', 'wcw', '.c.'], 31, 0, { w: WHITE, c: NEON.cyanSoft });
  return pm;
}

/** Vaso de planta da praça (16×20). */
export function planter(flower: RGB = NEON.pink): Pixmap {
  const pm = new Pixmap(16, 22);
  const m = scaleCanopy(pm, 8, [{ y: 8, halfW: 5, n: 2, h: 5 }, { y: 11, halfW: 6, n: 2, h: 4 }], TREE, 3);
  outlineMask(pm, m, TREE.line);
  pm.put(5, 4, flower); pm.put(10, 6, flower); pm.put(7, 8, flower);
  pm.stamp([
    'oooooooooooooo',
    'owwwwwwwwwwwso',
    'owccccccccccso',
    '.owwwwwwwwwso.',
    '.owwwwwwwwwso.',
    '..ossssssssso.',
    '..oooooooooo..',
  ], 1, 13, { o: LINE, w: METAL.light, s: METAL.shade, c: NEON.cyan });
  return pm;
}

/** Portal de boas-vindas com letreiro neon (64×44): pilares nas pontas. */
export function welcomeArch(text: string, drawText: (pm: Pixmap, t: string, x: number, y: number, c: RGB, sh?: RGB) => void, width: (t: string) => number): Pixmap {
  const pm = new Pixmap(64, 46);
  for (const px of [1, 53]) {
    pm.rect(px, 8, 10, 36, LINE);
    pm.rect(px + 1, 9, 8, 34, METAL.base);
    pm.rect(px + 1, 9, 2, 34, METAL.light);
    pm.rect(px + 7, 9, 2, 34, METAL.shade);
    for (let y = 14; y < 40; y += 6) pm.rect(px + 4, y, 2, 3, NEON.cyan);
    pm.rect(px - 1, 42, 12, 3, LINE); pm.rect(px, 42, 10, 2, METAL.shade);
  }
  pm.rect(0, 2, 64, 14, LINE);
  pm.rect(1, 3, 62, 12, hex('#1c2046'));
  pm.rect(1, 3, 62, 1, NEON.purple);
  pm.rect(1, 14, 62, 1, NEON.cyan);
  const w = width(text);
  drawText(pm, text, 32 - (w >> 1), 6, NEON.cyanSoft, hex('#2a6a8a'));
  return pm;
}

export function rock(): Pixmap {
  const pm = new Pixmap(16, 16);
  pm.stamp([
    '....oooooo......',
    '..oollllmmoo....',
    '.olllmmmmmmdo...',
    'ollmmmmmmmdddo..',
    'olmmmmmmmdddddo.',
    'odmmmmmmddddddo.',
    '.oddddddddddoo..',
    '..ooooooooooo...',
  ], 0, 6, { o: LINE, l: METAL.light, m: METAL.base, d: METAL.shade });
  return pm;
}

/** Totem holográfico com a logo WIT (16×32) — toque tecnológico. */
export function holoTotem(): Pixmap {
  const pm = new Pixmap(16, 32);
  pm.stamp([
    '...oooooooooo...',
    '..occcccccccco..',
    '..ocaaaaaaaaco..',
    '..ocaWaWaWaaco..',
    '..ocaWaWaWaaco..',
    '..ocaaWaWaaaco..',
    '..ocaaaaaaaaco..',
    '..occcccccccco..',
    '...oooooooooo...',
  ], 0, 1, { o: LINE, c: NEON.cyanSoft, a: hex('#2a3a6e'), W: NEON.cyan });
  pm.rect(7, 10, 2, 16, LINE); pm.rect(7, 10, 1, 16, METAL.base);
  pm.stamp(['.oooooo.', 'ommmmmso', 'oooooooo'], 4, 26, { o: LINE, m: METAL.base, s: METAL.shade });
  for (let x = 3; x < 13; x++) pm.put(x, 29, GRASS.shadow);
  return pm;
}
