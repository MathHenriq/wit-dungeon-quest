// Prédios da cidade, no estilo Pokémon Emerald/FireRed com toque tecnológico.
// Cada prédio ocupa um retângulo de blocos (colisão) e pode ter arte acima
// dele (`extraTop`, para torres e telhados altos). A porta é um bloco da
// última fileira: o jogador entra andando para cima nela.
import { hash, hex, mix, Pixmap, type RGB } from './pixmap';
import {
  GLASS, LINE, LINE_DARK, METAL, NEON, ROOFS, WALLS, WHITE, WOOD,
  type RoofColor, type WallColor,
} from './palette';

export const TILE = 16;

export interface Building {
  id: string;
  name: string;
  pix: Pixmap;
  tilesW: number;
  tilesH: number;
  /** Pixels de arte acima do retângulo de colisão. */
  extraTop: number;
  /** Colunas (relativas) das portas, na última fileira do prédio. */
  doorCols: number[];
  /** Quadros de animação (o primeiro é igual a `pix`). */
  frames?: Pixmap[];
}

// ───────────────────────── fonte pixel ─────────────────────────

const GLYPHS: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], L: ['#..', '#..', '#..', '#..', '###'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], W: ['#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'],
  '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'],
  ' ': ['..', '..', '..', '..', '..'],
};

export function textWidth(text: string): number {
  return [...text].reduce((w, ch) => w + (GLYPHS[ch]?.[0].length ?? 3) + 1, -1);
}

export function drawText(pm: Pixmap, text: string, x: number, y: number, c: RGB, shadow?: RGB): void {
  let cx = x;
  for (const ch of text) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    g.forEach((row, ry) => [...row].forEach((v, rx) => {
      if (v !== '#') return;
      if (shadow) pm.put(cx + rx + 1, y + ry + 1, shadow);
      pm.put(cx + rx, y + ry, c);
    }));
    cx += g[0].length + 1;
  }
}

/** Placa com texto centralizado. */
function plaque(pm: Pixmap, cx: number, y: number, text: string, bg: RGB, fg: RGB, border = LINE): number {
  const w = textWidth(text) + 6;
  const x = Math.round(cx - w / 2);
  pm.rect(x, y, w, 9, border);
  pm.rect(x + 1, y + 1, w - 2, 7, bg);
  drawText(pm, text, x + 3, y + 2, fg);
  return w;
}

// ───────────────────────── peças ─────────────────────────

type RoofRamp = (typeof ROOFS)[RoofColor];
type WallRamp = (typeof WALLS)[WallColor];

/**
 * Telhado de tábuas. `vertical`: tábuas em pé (Emerald). `horizontal`:
 * listras deitadas (FireRed). `chamfer` corta os cantos de cima.
 */
function roof(pm: Pixmap, x0: number, y0: number, w: number, h: number, r: RoofRamp, style: 'vertical' | 'horizontal', chamfer = 4, gable = true): void {
  for (let y = 0; y < h; y++) {
    const cut = Math.max(0, chamfer - y);
    for (let x = cut; x < w - cut; x++) {
      let c: RGB = r.base;
      if (style === 'vertical') {
        const col = x % 6;
        if (col === 0) c = r.stripe;
        else if (col === 1 || y < 3) c = r.top;
        if (y > h - 6 && col !== 0) c = mix(r.base, r.stripe, 0.35);
      } else {
        const row = y % 6;
        if (row === 4) c = r.stripe;
        else if (row === 5 || y < 2) c = r.top;
      }
      // empena: face lateral clara à esquerda e sombreada à direita
      if (gable && style === 'horizontal') {
        const gw = Math.max(2, 9 - (y >> 2));
        if (x < gw + cut) c = x === gw + cut - 1 ? r.stripe : (x % 3 === 0 ? r.base : r.top);
        if (x > w - 1 - (gw + cut)) c = x === w - gw - cut ? r.stripe : mix(r.stripe, r.base, 0.4);
      }
      pm.put(x0 + x, y0 + y, c);
    }
    // contorno lateral
    pm.put(x0 + cut - 1, y0 + y, LINE);
    pm.put(x0 + w - cut, y0 + y, LINE);
  }
  for (let x = chamfer - 1; x <= w - chamfer; x++) pm.put(x0 + x, y0 - 1, LINE);
  for (let k = 0; k < chamfer; k++) { pm.put(x0 + k - 1, y0 + chamfer - 1 - k, LINE); pm.put(x0 + w - k, y0 + chamfer - 1 - k, LINE); }
  // beiral
  for (let x = -1; x <= w; x++) {
    pm.put(x0 + x, y0 + h - 2, r.eave);
    pm.put(x0 + x, y0 + h - 1, LINE);
  }
}

/** Parede de fachada. `ripas`: tábuas deitadas; `lisa`; `painel` (metálica). */
function wall(pm: Pixmap, x0: number, y0: number, w: number, h: number, wr: WallRamp, style: 'ripas' | 'lisa' | 'painel'): void {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c: RGB = wr.base;
    if (style === 'ripas' && y % 4 === 3) c = wr.line;
    if (style === 'painel' && (x % 16 === 15 || y % 12 === 11)) c = wr.line;
    if (x < 2) c = wr.hi;
    else if (x < 4) c = mix(wr.hi, wr.base, 0.5);
    if (x > w - 4) c = wr.shade;
    if (y > h - 4) c = mix(c, wr.shade, 0.6);
    pm.put(x0 + x, y0 + y, c);
  }
  for (let y = -1; y <= h; y++) { pm.put(x0 - 1, y0 + y, LINE); pm.put(x0 + w, y0 + y, LINE); }
  for (let x = -1; x <= w; x++) pm.put(x0 + x, y0 + h, LINE);
}

function windowAt(pm: Pixmap, x: number, y: number, w = 14, h = 11, sill: RGB = hex('#f0c848')): void {
  pm.rect(x - 1, y - 1, w + 2, h + 2, LINE);
  for (let yy = 0; yy < h; yy++) {
    const t = yy / h;
    pm.rect(x, y + yy, w, 1, t < 0.3 ? GLASS.top : t < 0.7 ? GLASS.mid : GLASS.low);
  }
  pm.rect(x + (w >> 1), y, 1, h, LINE);
  pm.put(x + 1, y + 1, WHITE); pm.put(x + 2, y + 1, WHITE); pm.put(x + 1, y + 2, WHITE);
  pm.put(x + (w >> 1) + 2, y + 1, WHITE);
  pm.rect(x - 1, y + h + 1, w + 2, 2, sill);
  pm.rect(x - 1, y + h + 2, w + 2, 1, mix(sill, LINE, 0.4));
}

function woodDoor(pm: Pixmap, x: number, yBottom: number, color: RGB): void {
  const w = 12, h = 20, y = yBottom - h;
  pm.rect(x - 1, y - 1, w + 2, h + 1, LINE);
  pm.rect(x, y, w, h, color);
  pm.rect(x, y, w, 1, mix(color, WHITE, 0.4));
  pm.rect(x + w - 2, y, 2, h, mix(color, LINE, 0.3));
  pm.rect(x + 2, y + 3, 7, 5, LINE);
  pm.rect(x + 3, y + 4, 5, 3, GLASS.mid);
  pm.put(x + 3, y + 4, GLASS.top);
  pm.put(x + 8, y + 11, hex('#ffe070'));
  pm.put(x + 8, y + 12, mix(hex('#ffe070'), LINE, 0.4));
}

/** Porta de vidro automática, com faixa de luz na soleira. */
function glassDoor(pm: Pixmap, cx: number, yBottom: number, w: number, h: number, glow: RGB = NEON.cyan): void {
  const x = Math.round(cx - w / 2), y = yBottom - h;
  pm.rect(x - 2, y - 2, w + 4, h + 2, LINE);
  pm.rect(x - 1, y - 1, w + 2, h + 1, METAL.base);
  for (let yy = 0; yy < h; yy++) {
    const t = yy / h;
    pm.rect(x, y + yy, w, 1, t < 0.2 ? GLASS.top : t < 0.65 ? GLASS.mid : GLASS.low);
  }
  pm.rect(x + (w >> 1), y, 1, h, LINE);
  for (let k = 0; k < 5; k++) pm.put(x + 2 + k, y + 2 + (k >> 1), WHITE);
  pm.rect(x - 2, yBottom, w + 4, 1, glow);
}

function neonStrip(pm: Pixmap, x: number, y: number, w: number, c: RGB): void {
  for (let k = 0; k < w; k++) pm.put(x + k, y, k % 2 === 0 ? c : mix(c, WHITE, 0.5));
}

function newPix(tilesW: number, tilesH: number, extraTop: number): Pixmap {
  return new Pixmap(tilesW * TILE, tilesH * TILE + extraTop);
}

// ───────────────────────── casa ─────────────────────────

export interface HouseOpts {
  tilesW?: number;
  roof?: RoofColor;
  wall?: WallColor;
  door?: string;
  floors?: 1 | 2;
  chimney?: boolean;
  /** Painéis solares no telhado (toque tecnológico). */
  solar?: boolean;
  /** Estrela dourada sobre a porta (a casa do jogador). */
  star?: boolean;
  seed?: number;
}

export function house(id: string, name: string, o: HouseOpts = {}): Building {
  const tw = o.tilesW ?? 5, floors = o.floors ?? 1;
  const th = floors === 2 ? 5 : 4;
  const extraTop = 6;
  const pm = newPix(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const roofH = 32, wallTop = extraTop + roofH - 2, wallH = H - wallTop - 1;
  const R = ROOFS[o.roof ?? 'laranja'], Wl = WALLS[o.wall ?? 'cinza'];
  wall(pm, 3, wallTop, W - 6, wallH, Wl, 'ripas');
  roof(pm, 1, extraTop + 1, W - 2, roofH, R, 'horizontal', 3);
  if (o.chimney) {
    const cx = W - 22;
    pm.rect(cx - 1, extraTop - 5, 9, 10, LINE);
    pm.rect(cx, extraTop - 4, 7, 9, hex('#c86a50'));
    pm.rect(cx, extraTop - 4, 7, 2, hex('#e89a78'));
    for (let y = 0; y < 9; y += 3) pm.rect(cx, extraTop - 4 + y + 2, 7, 1, hex('#a04a3a'));
  }
  if (o.solar) {
    for (let k = 0; k < 2; k++) {
      const px = 10 + k * 20, py = extraTop + 8;
      pm.rect(px - 1, py - 1, 18, 12, LINE);
      for (let yy = 0; yy < 10; yy++) for (let xx = 0; xx < 16; xx++) {
        pm.put(px + xx, py + yy, xx % 4 === 3 || yy === 5 ? hex('#7a8ac8') : yy < 2 ? hex('#6a9aec') : hex('#2e4ea8'));
      }
      pm.put(px + 1, py + 1, WHITE);
    }
  }
  const doorCol = Math.floor(tw * 0.35);
  const dx = doorCol * TILE + 2;
  woodDoor(pm, dx, H - 2, hex(o.door ?? '#d88050'));
  if (o.star) {
    pm.stamp([
      '....o....',
      '...oyo...',
      'oooyyyooo',
      'oyyyWyyyo',
      '.oyyyyyo.',
      '..oyyyo..',
      '.oyoooyo.',
      '.oo...oo.',
    ], dx + 2, H - 2 - 30, { o: LINE, y: NEON.yellow, W: WHITE });
  }
  // janelas no térreo e, se houver, no andar de cima
  const jy = H - 2 - 20;
  const spots: number[] = [];
  for (let x = 8; x + 14 < W - 6; x += 22) spots.push(x);
  for (const x of spots) {
    if (x + 16 > dx - 2 && x < dx + 14) continue;
    windowAt(pm, x, jy);
  }
  if (floors === 2) for (const x of spots) windowAt(pm, x, wallTop + 5);
  return { id, name, pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [doorCol] };
}

// ─────────────────────── Centro de Cartas ───────────────────────

/** Emblema WIT: carta branca com estrela, dentro de um círculo. */
function cardEmblem(pm: Pixmap, cx: number, cy: number, r: number, ring: RGB): void {
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = Math.sqrt((x + 0.5) ** 2 + (y + 0.5) ** 2);
    if (d <= r + 1 && d > r) pm.put(cx + x, cy + y, LINE);
    else if (d <= r) pm.put(cx + x, cy + y, d > r - 2 ? ring : WHITE);
  }
  pm.stamp([
    'oooooooo',
    'oggggggo',
    'ogrrrrgo',
    'ogrywrgo',
    'ogyyyygo',
    'ogrywrgo',
    'ogrrrrgo',
    'oggggggo',
    'oooooooo',
  ], cx - 4, cy - 5, { o: LINE, g: NEON.yellow, r: ring, y: NEON.yellow, w: WHITE });
}

export function cardCenter(): Building {
  const tw = 7, th = 5, extraTop = 10;
  const pm = newPix(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOFS.laranja, band = ROOFS.vermelho;
  const wallTop = 50;
  wall(pm, 4, wallTop, W - 8, H - wallTop - 1, WALLS.cinza, 'lisa');
  // cúpula central elevada + telhado
  roof(pm, 30, 1, W - 60, 16, R, 'vertical', 5, false);
  roof(pm, 2, 9, W - 4, 42, R, 'vertical', 8, false);
  // faixa vermelha com emblema
  const by = 30;
  pm.rect(6, by - 1, W - 12, 14, LINE);
  for (let y = 0; y < 12; y++) pm.rect(7, by + y, W - 14, 1, y < 2 ? band.top : y > 9 ? band.stripe : band.base);
  cardEmblem(pm, W >> 1, by + 4, 9, band.base);
  // cantos arredondados da parede (volume)
  for (let y = wallTop; y < H - 1; y++) { pm.put(5, y, WHITE); pm.put(W - 6, y, WALLS.cinza.shade); }
  glassDoor(pm, W >> 1, H - 2, 22, 22);
  windowAt(pm, 14, H - 26, 20, 12, METAL.shade);
  // placa CARTAS à direita
  plaque(pm, W - 30, H - 32, 'CARTAS', WHITE, band.stripe);
  neonStrip(pm, 5, wallTop + 1, W - 10, NEON.cyan);
  return { id: 'centro', name: 'Centro de Cartas', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3] };
}

// ─────────────────────────── Loja ───────────────────────────

export function shop(): Building {
  const tw = 5, th = 5, extraTop = 6;
  const pm = newPix(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOFS.azul;
  const wallTop = 44;
  wall(pm, 3, wallTop, W - 6, H - wallTop - 1, WALLS.cinza, 'lisa');
  roof(pm, 1, 5, W - 2, 40, R, 'vertical', 7, false);
  // faixa com emblema de pacotinho
  const by = 26;
  pm.rect(5, by - 1, W - 10, 13, LINE);
  pm.rect(6, by, W - 12, 11, R.eave);
  pm.rect(6, by, W - 12, 2, R.base);
  pm.stamp([
    '..ooooooo..',
    '.oyyyyyyyo.',
    'oyykkkkkyyo',
    'oyyyyyyyyyo',
    'oyywywywyyo',
    'oyyyyyyyyyo',
    '.ooooooooo.',
  ], (W >> 1) - 5, by + 2, { o: LINE, y: NEON.yellow, k: hex('#ff8a3a'), w: NEON.pink });
  // vitrine com cartas
  const vx = 8, vy = H - 26;
  pm.rect(vx - 1, vy - 1, 24, 16, LINE);
  pm.rect(vx, vy, 22, 14, GLASS.low);
  pm.rect(vx, vy, 22, 4, GLASS.mid);
  const cards = [NEON.pink, NEON.cyan, NEON.yellow, NEON.purple];
  cards.forEach((c, k) => { pm.rect(vx + 2 + k * 5, vy + 5 + (k % 2), 4, 6, LINE); pm.rect(vx + 3 + k * 5, vy + 6 + (k % 2), 2, 4, c); });
  pm.put(vx + 1, vy + 1, WHITE); pm.put(vx + 2, vy + 1, WHITE);
  glassDoor(pm, W - 26, H - 2, 18, 22);
  plaque(pm, W >> 1, wallTop + 3, 'LOJA', LINE_DARK, NEON.cyan);
  return { id: 'loja', name: 'Loja', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3] };
}

// ─────────────────────── Torre dos 100 andares ───────────────────────

export function tower(): Building {
  const frames = [0, 1, 2, 3].map(towerFrame);
  return { id: 'torre', name: 'Torre dos 100 Andares', pix: frames[0], tilesW: 6, tilesH: 7, extraTop: 56, doorCols: [2, 3], frames };
}

function towerFrame(frame: number): Pixmap {
  const tw = 6, th = 7, extraTop = 56;
  const pm = newPix(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const body = hex('#2c2f5c'), bodyL = hex('#40457e'), bodyD = hex('#1e2044'), top = hex('#5a60a4');
  const x0 = 10, x1 = W - 10;
  const topY = 26;
  // corpo
  for (let y = topY + 10; y < H - 1; y++) for (let x = x0; x < x1; x++) {
    let c = body;
    if (x < x0 + 3) c = bodyL;
    else if (x > x1 - 4) c = bodyD;
    if ((y - topY) % 9 === 0) c = mix(c, LINE_DARK, 0.5);
    pm.put(x, y, c);
  }
  // janelas acesas em grade (algumas apagadas)
  for (let fy = topY + 13, row = 0; fy < H - 36; fy += 9, row++) {
    for (let fx = x0 + 6, col = 0; fx < x1 - 8; fx += 8, col++) {
      const flick = hash(row, col, 11) > 0.9 && frame % 2 === 1;
      const on = (hash(row, col, 7) > 0.28) !== flick;
      const c = on ? (hash(col, row, 3) > 0.7 ? NEON.purple : NEON.cyanSoft) : hex('#3a3f70');
      pm.rect(fx, fy, 4, 5, c);
      if (on) pm.put(fx, fy, WHITE);
    }
  }
  // faixa de neon vertical
  for (let y = topY + 10; y < H - 36; y++) pm.put(W >> 1, y, y % 3 === 0 ? NEON.cyan : NEON.cyanSoft);
  // topo (laje vista de cima) e coroa
  for (let y = topY; y < topY + 10; y++) {
    const inset = topY + 10 - y;
    for (let x = x0 - 2 + (inset >> 2); x < x1 + 2 - (inset >> 2); x++) pm.put(x, y, y < topY + 2 ? mix(top, WHITE, 0.3) : top);
  }
  pm.rect(x0 - 3, topY + 10, x1 - x0 + 6, 2, NEON.purple);
  const cw = 26, cx0 = (W - cw) >> 1;
  pm.rect(cx0, topY - 12, cw, 14, bodyL);
  pm.rect(cx0, topY - 12, cw, 3, top);
  pm.rect(cx0 + 3, topY - 7, cw - 6, 3, NEON.cyan);
  // antena e farol
  pm.rect((W >> 1) - 1, 4, 2, topY - 16, METAL.base);
  pm.rect((W >> 1) - 3, 1, 6, 4, frame % 2 === 0 ? NEON.pink : hex('#8a2a5a'));
  if (frame % 2 === 0) pm.rect((W >> 1) - 2, 2, 4, 2, WHITE);
  pm.rect(cx0 + 3 + ((frame * 5) % (cw - 10)), topY - 7, 4, 3, WHITE);
  // entrada em arco com o painel "100"
  const ew = 30, ex = (W - ew) >> 1, ey = H - 30;
  pm.rect(ex - 3, ey - 12, ew + 6, 11, LINE_DARK);
  pm.rect(ex - 2, ey - 11, ew + 4, 9, hex('#12142c'));
  drawText(pm, '100', (W >> 1) - 5, ey - 9, NEON.yellow, hex('#806018'));
  pm.rect(ex - 2, ey - 1, ew + 4, 30, LINE_DARK);
  pm.rect(ex, ey, ew, 28, hex('#10122a'));
  for (let y = 0; y < 26; y++) {
    const t = y / 26;
    pm.rect(ex + 2, ey + 2 + y, ew - 4, 1, mix(hex('#3a2a7a'), NEON.purple, 1 - t));
  }
  pm.rect(ex, ey, 2, 28, NEON.cyan); pm.rect(ex + ew - 2, ey, 2, 28, NEON.cyan); pm.rect(ex, ey, ew, 2, NEON.cyan);
  // contorno
  for (let y = topY; y < H; y++) { pm.put(x0 - 1, y, LINE_DARK); pm.put(x1, y, LINE_DARK); }
  pm.rect(x0 - 1, H - 1, x1 - x0 + 2, 1, LINE_DARK);
  return pm;
}

// ─────────────────────────── Arena ───────────────────────────

export function arena(): Building {
  const tw = 8, th = 5, extraTop = 14;
  const pm = newPix(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const stone = WALLS.cinza, red = ROOFS.vermelho;
  const wallTop = 50;
  wall(pm, 4, wallTop, W - 8, H - wallTop - 1, stone, 'painel');
  // cúpula listrada (lona) vista de cima
  const cx = W >> 1, cy = wallTop + 2, rx = W / 2 - 3, ry = 44;
  for (let y = cy - ry; y < cy; y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    const d = dx * dx + dy * dy;
    if (d > 1) continue;
    if (d > 0.93) { pm.put(x, y, LINE); continue; }
    const ang = Math.atan2(dy, dx);
    const seg = Math.floor(((ang + Math.PI) / Math.PI) * 12);
    let c = seg % 2 === 0 ? red.base : WHITE;
    if (d > 0.75) c = seg % 2 === 0 ? red.stripe : METAL.base;
    else if (d < 0.08) c = NEON.yellow;
    if (dx < -0.2 && dy < -0.3 && d < 0.6) c = mix(c, WHITE, 0.25);
    pm.put(x, y, c);
  }
  for (let x = 4; x < W - 4; x++) { pm.put(x, cy - 1, red.eave); pm.put(x, cy, LINE); }
  // mastros com bandeiras
  for (const fx of [14, W - 16]) {
    pm.rect(fx, cy - 30, 1, 22, METAL.dark);
    pm.stamp(['ooooo', 'occco', 'occo.', 'oco..', 'oo...'], fx + 1, cy - 30, { o: LINE, c: fx < 40 ? NEON.cyan : NEON.pink });
  }
  // portão em arco
  const gw = 28, gx = (W - gw) >> 1;
  pm.rect(gx - 2, H - 27, gw + 4, 26, LINE);
  pm.rect(gx, H - 25, gw, 24, hex('#3a2a1c'));
  for (let y = 0; y < 22; y++) pm.rect(gx + 2, H - 23 + y, gw - 4, 1, mix(hex('#6a4a2a'), hex('#2a1c10'), y / 22));
  pm.rect(gx + (gw >> 1), H - 25, 1, 24, LINE);
  // estandartes
  for (const [bx, c] of [[18, NEON.cyan], [W - 24, NEON.pink]] as [number, RGB][]) {
    pm.rect(bx - 1, wallTop + 6, 8, 20, LINE);
    pm.rect(bx, wallTop + 7, 6, 17, c);
    pm.rect(bx, wallTop + 7, 6, 2, WHITE);
    pm.stamp(['.y.', 'yyy', '.y.'], bx + 1, wallTop + 13, { y: NEON.yellow });
  }
  plaque(pm, W >> 1, wallTop + 3, 'ARENA', red.stripe, WHITE);
  return { id: 'arena', name: 'Arena', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3, 4] };
}

// ─────────────────────── Sede das Guildas ───────────────────────

export function guildHall(): Building {
  const tw = 7, th = 5, extraTop = 12;
  const pm = newPix(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOFS.verde;
  const wallTop = 50;
  wall(pm, 4, wallTop, W - 8, H - wallTop - 1, WALLS.creme, 'lisa');
  roof(pm, 2, 8, W - 4, 44, R, 'vertical', 6, false);
  // frontão triangular com escudo
  const cx = W >> 1;
  for (let y = 0; y < 18; y++) {
    const hw = Math.round(y * 1.9);
    for (let x = -hw; x <= hw; x++) pm.put(cx + x, 30 + y, Math.abs(x) >= hw - 0 ? LINE : y > 15 ? WALLS.creme.shade : WALLS.creme.hi);
  }
  pm.stamp([
    'ooooooo',
    'obbbbbo',
    'obyyybo',
    'obbybbo',
    '.obbbo.',
    '..obo..',
    '...o...',
  ], cx - 3, 37, { o: LINE, b: hex('#4e78c4'), y: NEON.yellow });
  // colunas
  for (let k = 0; k < 5; k++) {
    const px = 10 + k * ((W - 26) / 4);
    pm.rect(px - 1, wallTop + 2, 6, H - wallTop - 3, LINE);
    pm.rect(px, wallTop + 3, 4, H - wallTop - 5, WHITE);
    pm.rect(px + 3, wallTop + 3, 1, H - wallTop - 5, WALLS.cinza.shade);
  }
  // estandartes das guildas entre as colunas
  const colors = [hex('#e85a5a'), hex('#4e8ae8'), hex('#f0c030'), hex('#9a6ae0')];
  colors.forEach((c, k) => {
    if (k === 1 || k === 2) return; // o vão do meio fica para a porta
    const bx = 17 + k * ((W - 26) / 4);
    pm.rect(bx - 1, wallTop + 5, 9, 18, LINE);
    pm.rect(bx, wallTop + 6, 7, 14, c);
    pm.rect(bx, wallTop + 6, 7, 2, mix(c, WHITE, 0.5));
    pm.stamp(['.w.', 'www', '.w.'], bx + 2, wallTop + 11, { w: WHITE });
    pm.stamp(['o.o.o.o.o'.slice(0, 9)], bx - 1, wallTop + 20, { o: LINE });
  });
  // porta dupla de madeira
  const dw = 22, dx = cx - (dw >> 1);
  pm.rect(dx - 1, H - 25, dw + 2, 24, LINE);
  pm.rect(dx, H - 24, dw, 23, WOOD.base);
  pm.rect(dx, H - 24, dw, 2, WOOD.light);
  pm.rect(cx, H - 24, 1, 23, WOOD.line);
  pm.put(cx - 2, H - 12, NEON.yellow); pm.put(cx + 2, H - 12, NEON.yellow);
  plaque(pm, cx, wallTop - 1, 'GUILDAS', LINE_DARK, NEON.yellow);
  return { id: 'guildas', name: 'Sede das Guildas', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3] };
}
