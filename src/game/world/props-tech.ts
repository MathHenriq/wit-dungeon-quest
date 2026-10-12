// Objetos com o toque tecnológico da cidade, no verde da marca WIT: postes,
// totens, portal de boas-vindas, máquina, fonte, mural e vasos. Cada um
// devolve a arte de dia (`pix`) e o que acende à noite (`night`).
import { hash, hex, mix, Pixmap, type RGB } from './pixmap';
import { drawText, FONT_H, textWidth } from './font';
import { GRASS, LED, TREE, WATER, WHITE, WIT, WOOD } from './palette';

export interface Lit { pix: Pixmap; night?: Pixmap }

const LINE = hex('#3c3a50');
const M = { hi: hex('#f6f8fc'), light: hex('#dde2ec'), base: hex('#b4bccc'), shade: hex('#8a92a8'), line: LINE };

function pair(w: number, h: number): [Pixmap, Pixmap] {
  return [new Pixmap(w, h), new Pixmap(w, h)];
}

function shadow(pm: Pixmap, x0: number, x1: number, y: number): void {
  for (let x = x0; x <= x1; x++) pm.put(x, y, GRASS.shadow);
}

/** Poste de luz (16×32): luminária de vidro, haste com anéis verdes. */
export function lampLit(): Lit {
  const [pm, nt] = pair(16, 32);
  pm.stamp([
    '....oooooooo....',
    '...ohhhhhhhho...',
    '..ohllllllllso..',
    '..ommmmmmmmmso..',
    '...oggggggggo...',
    '....ogggggwo....',
    '.....oooooo.....',
    '.......om.......',
  ], 0, 2, { o: LINE, h: M.hi, l: M.light, m: M.base, s: M.shade, g: hex('#e4f0ee'), w: WHITE });
  nt.stamp([
    '....yyyyyyyy....',
    '.....yyyyyy.....',
  ], 0, 6, { y: LED.warmSoft });
  nt.stamp(['.....wwwwww.....'], 0, 7, { w: LED.white });
  for (let y = 10; y < 27; y++) {
    pm.put(6, y, LINE); pm.put(7, y, M.light); pm.put(8, y, M.shade); pm.put(9, y, LINE);
  }
  for (const ry of [13, 21]) {
    pm.put(7, ry, WIT.lime); pm.put(8, ry, WIT.base);
    nt.put(7, ry, LED.green); nt.put(8, ry, LED.green);
  }
  pm.stamp(['.oooooo.', 'ollllmso', 'oooooooo'], 4, 27, { o: LINE, l: M.light, m: M.base, s: M.shade });
  shadow(pm, 3, 12, 30);
  return { pix: pm, night: nt };
}

/** Totem com a logo WIT (16×32): tela com os quadradinhos e uma linha de varredura. */
export function totemLit(frame = 0): Lit {
  const [pm, nt] = pair(16, 32);
  const scr = { bg: hex('#0e2a1e'), bg2: hex('#143824') };
  pm.rect(2, 1, 12, 11, LINE);
  pm.rect(3, 2, 10, 9, scr.bg);
  pm.rect(3, 2, 10, 1, scr.bg2);
  nt.rect(3, 2, 10, 9, hex('#12351f'));
  // "W" pequenino + quadradinhos da logo
  const logo = ['#...#', '#...#', '#.#.#', '##.##', '#...#'];
  logo.forEach((row, ry) => [...row].forEach((ch, rx) => {
    if (ch !== '#') return;
    pm.put(4 + rx, 4 + ry, WIT.lime); nt.put(4 + rx, 4 + ry, LED.greenSoft);
  }));
  for (const [sx, sy] of [[10, 7], [11, 5], [12, 3]] as [number, number][]) {
    pm.put(sx, sy, WIT.mid); nt.put(sx, sy, LED.green);
  }
  const scan = 2 + (frame % 9);
  for (let x = 3; x < 13; x++) {
    if (!pm.get(x, scan) || pm.get(x, scan)![1] < 100) pm.put(x, scan, hex('#1e5034'));
    if (!nt.get(x, scan) || nt.get(x, scan)![1] < 100) nt.put(x, scan, hex('#2e7a48'));
  }
  pm.rect(3, 12, 10, 1, WIT.base);
  pm.rect(7, 13, 2, 13, LINE); pm.put(7, 13, M.light); for (let y = 14; y < 26; y++) pm.put(7, y, M.base);
  pm.stamp(['.oooooo.', 'ollllmso', 'oooooooo'], 4, 26, { o: LINE, l: M.light, m: M.base, s: M.shade });
  shadow(pm, 3, 12, 29);
  return { pix: pm, night: nt };
}

/** Vaso de planta da praça (16×22), faixa verde que acende à noite. */
export function planterLit(flower: RGB): Lit {
  const [pm, nt] = pair(16, 22);
  // copa simples de folhas
  const leaves: [number, number, number][] = [[8, 8, 5], [5, 10, 3.6], [11, 10, 3.6]];
  for (let y = 0; y < 14; y++) for (let x = 0; x < 16; x++) {
    let inside = false, lit = 0;
    for (const [cx, cy, r] of leaves) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r) { inside = true; lit = Math.max(lit, 1 - (x - cx + y - cy + r) / (2.6 * r)); }
    }
    if (inside) pm.put(x, y, lit > 0.7 ? TREE.hi : lit > 0.45 ? TREE.light : lit > 0.2 ? TREE.mid : TREE.dark);
  }
  pm.outline(TREE.line);
  pm.put(5, 6, flower); pm.put(10, 5, flower); pm.put(8, 9, flower); pm.put(12, 9, flower);
  pm.stamp([
    'oooooooooooooo',
    'ohhhhhhhhhhhso',
    'ocggggggggggso',
    '.olllllllllso.',
    '.olllllllllso.',
    '..ommmmmmmmso.',
    '..oooooooooo..',
  ], 1, 13, { o: LINE, h: M.hi, l: M.light, m: M.base, s: M.shade, c: WIT.lime, g: WIT.base });
  for (let x = 2; x < 13; x++) nt.put(x, 15, LED.green);
  return { pix: pm, night: nt };
}

/** Máquina de venda (16×32) nas cores WIT: cartas e sucos. */
export function vendingLit(): Lit {
  const [pm, nt] = pair(16, 32);
  pm.rect(1, 2, 14, 28, LINE);
  for (let y = 3; y < 29; y++) for (let x = 2; x < 14; x++) {
    pm.put(x, y, x < 4 ? WIT.mid : x > 11 ? WIT.dark : WIT.base);
  }
  pm.rect(2, 3, 12, 1, WIT.lime);
  // vitrine
  pm.rect(3, 6, 8, 13, hex('#1c3a2c'));
  for (let y = 6; y < 19; y++) for (let x = 3; x < 11; x++) {
    const c = mix(hex('#d8f4ec'), hex('#6ab0a0'), (y - 6) / 13);
    pm.put(x, y, c);
    nt.put(x, y, mix(LED.white, hex('#a8e8d8'), (y - 6) / 13));
  }
  const goods = [hex('#ff5a9a'), hex('#ffd84a'), hex('#40c8f0'), WIT.lime];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const col = goods[(r + c) % goods.length];
    for (const dst of [pm, nt]) dst.rect(4 + c * 2 + (c > 0 ? c - 1 : 0), 8 + r * 4, 2, 3, col);
  }
  pm.put(4, 7, WHITE); pm.put(5, 7, WHITE);
  // botões e tela
  pm.rect(12, 7, 1, 8, hex('#0e3a1c'));
  for (let y = 7; y < 15; y += 2) { pm.put(12, y, WIT.limeLight); nt.put(12, y, LED.green); }
  pm.rect(4, 21, 8, 4, LINE);
  pm.rect(5, 22, 6, 2, hex('#1e2a24'));
  nt.rect(5, 22, 6, 1, LED.green);
  pm.rect(2, 27, 12, 2, WIT.deep);
  shadow(pm, 1, 14, 30);
  return { pix: pm, night: nt };
}

/** Mural / quadro de avisos (48×38) com placa "MURAL". */
export function noticeBoardLit(): Lit {
  const [pm, nt] = pair(48, 38);
  const by = 6;
  pm.rect(1, by, 46, 24, WOOD.line);
  pm.rect(2, by + 1, 44, 22, WOOD.base);
  pm.rect(2, by + 1, 44, 2, WOOD.light);
  pm.rect(4, by + 6, 40, 15, hex('#e8d4a8'));
  const papers: [number, number, number, number, RGB][] = [
    [6, 8, 9, 7, WHITE], [17, 7, 8, 10, hex('#ffe6a0')], [27, 9, 9, 6, hex('#c8ecff')],
    [37, 7, 6, 9, hex('#ffd0e4')], [8, 15, 11, 5, hex('#d4f4c8')], [23, 16, 12, 5, WHITE],
  ];
  for (const [x, y, w, h, c] of papers) {
    pm.rect(x, by + y, w, h, c);
    for (let k = 1; k < h - 1; k += 2) pm.rect(x + 1, by + y + k, w - 3, 1, mix(c, LINE, 0.35));
    pm.put(x + (w >> 1), by + y, hex('#e0406a'));
  }
  // placa com o nome
  const text = 'MURAL', tw = textWidth(text), pw = tw + 8, px = (48 - pw) >> 1;
  pm.rect(px - 1, 0, pw + 2, FONT_H + 5, WIT.deep);
  pm.rect(px, 1, pw, FONT_H + 3, WIT.base);
  pm.rect(px, 1, pw, 1, WIT.lime);
  drawText(pm, text, px + 4, 3, { fill: WHITE, fillBottom: WIT.limeLight, shadow: WIT.deep });
  nt.rect(px, 1, pw, FONT_H + 3, WIT.base);
  drawText(nt, text, px + 4, 3, { fill: WHITE, fillBottom: LED.greenSoft, shadow: WIT.deep });
  for (const lx of [6, 40]) { pm.rect(lx, by + 24, 3, 7, WOOD.line); pm.rect(lx + 1, by + 24, 1, 7, WOOD.base); }
  shadow(pm, 3, 44, 37);
  return { pix: pm, night: nt };
}

/** Portal de boas-vindas (64×46): placa verde WIT entre dois pilares com LEDs. */
export function welcomeArchLit(text: string): Lit {
  const [pm, nt] = pair(64, 46);
  for (const px of [1, 53]) {
    pm.rect(px, 10, 10, 34, LINE);
    for (let y = 11; y < 43; y++) for (let x = px + 1; x < px + 9; x++) {
      pm.put(x, y, x < px + 3 ? M.hi : x > px + 6 ? M.shade : M.light);
    }
    for (let y = 16; y < 40; y += 6) {
      pm.rect(px + 4, y, 2, 3, WIT.lime);
      nt.rect(px + 4, y, 2, 3, LED.green);
    }
    pm.rect(px - 1, 42, 12, 3, LINE); pm.rect(px, 42, 10, 2, M.shade);
  }
  // placa
  pm.rect(0, 1, 64, 16, LINE);
  for (let y = 2; y < 16; y++) pm.rect(1, y, 62, 1, mix(WIT.base, WIT.deep, (y - 2) / 13));
  pm.rect(1, 2, 62, 1, WIT.lime);
  pm.rect(1, 15, 62, 1, WIT.deep);
  for (let y = 2; y < 16; y++) nt.rect(1, y, 62, 1, mix(WIT.base, WIT.dark, (y - 2) / 13));
  nt.rect(1, 2, 62, 1, LED.green);
  const w = textWidth(text), tx = 32 - Math.ceil(w / 2);
  drawText(pm, text, tx, 5, { fill: WHITE, fillBottom: WIT.limeLight, shadow: WIT.deep });
  drawText(nt, text, tx, 5, { fill: WHITE, fillBottom: LED.greenSoft, shadow: WIT.deep });
  return { pix: pm, night: nt };
}

/** Fonte da praça (64×46), com água, jato e LEDs na borda. */
export function fountainLit(frame = 0): Lit {
  const [pm, nt] = pair(64, 46);
  const cx = 32, cy = 28, rx = 30, ry = 15;
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < 64; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    const d2 = ((x + 0.5 - cx) / (rx - 5)) ** 2 + ((y + 0.5 - cy + 1) / (ry - 4)) ** 2;
    if (d > 1) continue;
    if (d > 0.88) pm.put(x, y, LINE);
    else if (d2 > 1) pm.put(x, y, y < cy - 4 ? M.light : y > cy + 5 ? M.shade : M.base);
    else {
      pm.put(x, y, d2 > 0.75 && y < cy ? WATER.deep : WATER.base);
      if ((x * 3 + y * 7 + frame * 5) % 23 === 0) pm.put(x, y, WATER.light);
      if ((x * 5 + y * 11 + frame * 3) % 61 === 0) pm.put(x, y, WATER.foam);
      // água iluminada por baixo à noite
      if (d2 < 0.6 && hash(x, y, 40 + frame) < 0.12) nt.put(x, y, mix(hex('#7ad8f0'), LED.green, 0.3));
    }
  }
  // espessura da borda na frente
  for (let x = 3; x < 61; x++) {
    const yEdge = Math.round(cy + ry * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / rx) ** 2)));
    pm.put(x, yEdge - 1, M.shade); pm.put(x, yEdge, M.shade); pm.put(x, yEdge + 1, LINE);
  }
  // LEDs na borda de cima da bacia
  const ring = [LED.green, LED.cyan, LED.purple, LED.pink];
  for (let k = 0; k < 16; k++) {
    const a = Math.PI + (k + 0.5) * (Math.PI / 16);
    const x = Math.round(cx + Math.cos(a) * (rx - 2.5)), y = Math.round(cy + Math.sin(a) * (ry - 1.5));
    pm.put(x, y, k % 2 ? WIT.lime : M.hi);
    nt.put(x, y, ring[(k + frame) % ring.length]);
  }
  // pilar central com anel verde e jato
  pm.rect(28, 15, 8, 14, LINE); pm.rect(29, 15, 6, 13, M.base); pm.rect(29, 15, 2, 13, M.light);
  pm.rect(29, 22, 6, 1, WIT.lime); nt.rect(29, 22, 6, 1, LED.green);
  pm.rect(25, 12, 14, 4, LINE); pm.rect(26, 12, 12, 3, M.light); pm.rect(26, 14, 12, 1, M.shade);
  const jets = [
    ['....w....', '...wcw...', '..wc.cw..', '.wc...cw.', 'wc.....cw', 'c.......c'],
    ['....w....', '...wcw...', '..wcwcw..', '.wc...cw.', '.c.....c.', 'c.......c'],
    ['...w.w...', '...wcw...', '..wc.cw..', '.wc...cw.', 'wc.....cw', '.c.....c.'],
  ];
  const cSoft = hex('#bfeaf8');
  pm.stamp(jets[frame % 3], 28, 4, { w: WHITE, c: cSoft });
  nt.stamp(jets[frame % 3], 28, 4, { w: hex('#e8fff4'), c: hex('#8ce8d8') });
  const top = frame % 2 ? ['.w.', 'wcw', 'wcw', '.c.'] : ['...', '.w.', 'wcw', 'wcw'];
  pm.stamp(top, 31, 0, { w: WHITE, c: cSoft });
  nt.stamp(top, 31, 0, { w: hex('#e8fff4'), c: hex('#8ce8d8') });
  return { pix: pm, night: nt };
}
