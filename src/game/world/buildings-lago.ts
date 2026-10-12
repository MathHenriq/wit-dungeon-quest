// Prédios e objetos do Lago Azul, desenhados em hd por código (hd-kit):
// Casa de Pesca, farol, barquinho, banca de peixe, caixotes, boia,
// vitórias-régias e o cais.
import type { Building } from './buildings';
import { Art, darken, hdBuilding, hdProp, INK, lighten, T2 } from './hd-kit';
import { hash, hex, mix, type Pixmap, type RGB } from './pixmap';
import { LED } from './palette';
import { withHd } from './zone';
import { mirrored, worldArt } from './art-override';
import type { Dir } from './movement';

const WOOD = hex('#9a6a3e');
const WOOD_DARK = hex('#6a4426');

/** Casa de Pesca: tábuas azul-acinzentadas, telhado verde-petróleo, redes, boia e o quadro dos peixes. */
export function fishHouse(): Building {
  return hdBuilding('casa-pesca', 'Casa de Pesca', 7, 4, 2, [3], a => {
    const W = a.W, H = a.H;
    const wallTop = 92, base = H - 10;
    // parede
    a.planks(10, wallTop, W - 20, base - wallTop, hex('#7c9ab4'), 6, 4);
    // cantos de madeira escura
    for (const x of [10, W - 16]) { a.rect(x, wallTop, 6, base - wallTop, WOOD); a.vline(x, wallTop, base - wallTop, lighten(WOOD, 0.3)); a.vline(x + 5, wallTop, base - wallTop, darken(WOOD, 0.35)); }
    a.stones(8, base, W - 16, 8, hex('#a8a4a0'));
    // telhado: águas com telhas, recolhido nos cantos de cima (quatro águas)
    const roofTop = 6, roofH = wallTop - roofTop + 6;
    a.shingles(2, roofTop, W - 4, roofH, hex('#2f8a86'), { row: 7, tile: 10, inset: dy => Math.max(0, 26 - dy) * 0.9, round: true });
    // cumeeira
    a.rect(26, roofTop - 2, W - 52, 4, hex('#2a6a70'));
    a.hline(26, roofTop - 2, W - 52, hex('#5ab0aa'));
    a.shadow(2, roofTop + roofH - 10, W - 4, 10, 0.18);
    a.eave(2, roofTop + roofH, W - 4, hex('#e8e2d4'));
    a.shadow(12, wallTop + 3, W - 24, 5, 0.3);
    // frontão sobre a porta: o triângulo de tábuas claras, com as bordas do telhado
    const cx = W / 2, gTop = 30, gBot = wallTop + 4, gH = gBot - gTop;
    const halfAt = (y: number) => Math.round(6 + ((y - gTop) / gH) * 40);
    a.planks(cx - 46, gTop, 92, gH, hex('#e6dcc6'), 6, 8, (x, y) => Math.abs(x + 0.5 - cx) <= halfAt(y));
    for (let k = 0; k < gH; k++) {
      // tábuas de beiral (o telhado passa por cima das bordas do triângulo)
      const half = Math.round(6 + (k / gH) * 40);
      for (let t = 0; t < 7; t++) {
        const c = t < 2 ? hex('#5ab0aa') : t > 4 ? hex('#1e5e5e') : hex('#2f8a86');
        a.px(cx - half - 6 + t, gTop + k, c);
        a.px(cx + half + 5 - t, gTop + k, t < 2 ? hex('#3a9a94') : c);
      }
    }
    a.rect(cx - 3, gTop - 3, 6, 4, hex('#2a6a70'));
    // janelinha redonda do sótão
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
      const d = Math.hypot(x, y);
      if (d <= 5) a.px(cx + x, gTop + 26 + y, d > 3.8 ? hex('#8a5a34') : y < 0 ? hex('#aee0f4') : hex('#6ab0d8'));
    }
    a.glow(cx - 3, gTop + 23, 6, 6, LED.warm);
    a.sign(cx, gTop + 38, 'PESCA', { bg: hex('#27566e'), fg: hex('#fff4d0'), lit: hex('#8ee6f6') });
    // peixinho na placa
    fishIcon(a, cx + 26, gTop + 41, hex('#ffb04a'));
    fishIcon(a, cx - 33, gTop + 41, hex('#ffb04a'), true);
    // porta dupla com vidro
    a.door(cx, base, 26, 38, { color: hex('#b07040'), glass: true, double: true, lamp: false });
    // lampiões dos dois lados da porta
    for (const lx of [cx - 22, cx + 19]) {
      a.rect(lx, base - 34, 4, 7, hex('#3a3440'));
      a.rect(lx + 1, base - 33, 2, 4, hex('#ffd060'));
      a.glow(lx, base - 34, 4, 6, LED.warmSoft);
    }
    // janelas com persianas
    a.window(26, wallTop + 22, 22, 20, { frame: hex('#f4efe4'), shutters: hex('#2f7a78'), box: true });
    a.window(W - 48, wallTop + 22, 22, 20, { frame: hex('#f4efe4'), shutters: hex('#2f7a78'), box: true });
    // quadro dos peixes (lousa) à esquerda da porta, rede pendurada à direita
    chalkboard(a, 58, base - 40, 22, 26);
    net(a, W - 82, wallTop + 6, 24, 20);
    lifeRing(a, W - 30, wallTop + 50);
    // caixotes de peixe na frente
    crate(a, 16, base - 12, true);
    crate(a, W - 34, base - 12, false);
    a.ink();
    return { glow: [{ x: (cx - 20) / 2, y: (base - 30) / 2, r: 30, color: LED.warm, k: 0.3 }, { x: (cx + 21) / 2, y: (base - 30) / 2, r: 30, color: LED.warm, k: 0.3 }] };
  });
}

function fishIcon(a: Art, x: number, y: number, c: RGB, flip = false): void {
  const rows = ['..##...', '.####.#', '#######', '.####.#', '..##...'];
  rows.forEach((r, dy) => [...r].forEach((ch, dx) => {
    if (ch !== '#') return;
    const X = flip ? x + 6 - dx : x + dx;
    a.px(X, y + dy, dy < 2 ? lighten(c, 0.2) : c);
  }));
  a.px(flip ? x + 5 : x + 1, y + 2, INK);
}

function chalkboard(a: Art, x: number, y: number, w: number, h: number): void {
  a.rect(x, y, w, h, WOOD);
  a.hline(x, y, w, lighten(WOOD, 0.3));
  a.rect(x + 2, y + 2, w - 4, h - 6, hex('#2f4a3a'));
  // "lista" de peixes: ícones com traços de giz
  const cols = [hex('#ffb04a'), hex('#8ad0ff'), hex('#f0e068'), hex('#ff8aa8')];
  for (let k = 0; k < 4; k++) {
    const yy = y + 4 + k * 5;
    a.rect(x + 4, yy, 3, 2, cols[k]);
    a.px(x + 7, yy, cols[k]);
    a.hline(x + 9, yy + 1, w - 15 - (k % 2) * 3, hex('#dfe8e0'));
  }
  // pés
  a.rect(x + 2, y + h - 4, 2, 4, WOOD_DARK);
  a.rect(x + w - 4, y + h - 4, 2, 4, WOOD_DARK);
}

function net(a: Art, x: number, y: number, w: number, h: number): void {
  const c = hex('#d8cfa8');
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const sag = Math.round(Math.sin((xx / w) * Math.PI) * 3);
    if ((xx + yy) % 5 === 0 || (xx - yy + 50) % 5 === 0) {
      if (yy + sag < h) a.px(x + xx, y + yy + sag, (xx + yy) % 2 ? c : darken(c, 0.2));
    }
  }
  a.hline(x - 1, y, w + 2, WOOD_DARK);
  // boias da rede
  for (const k of [3, 11, 19]) { a.rect(x + k, y + 1, 3, 3, hex('#e85a3a')); a.px(x + k, y + 1, hex('#ffa080')); }
}

function lifeRing(a: Art, cx: number, cy: number): void {
  for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) {
    const d = Math.hypot(x, y);
    if (d > 7.2 || d < 3.6) continue;
    const ang = Math.atan2(y, x);
    const red = Math.floor(((ang + Math.PI) / (Math.PI / 2)) + 0.5) % 2 === 0;
    const c = red ? hex('#e84a3a') : hex('#f8f4ec');
    a.px(cx + x, cy + y, y < -2 ? lighten(c, 0.15) : y > 3 ? darken(c, 0.15) : c);
  }
}

function crate(a: Art, x: number, y: number, fish: boolean): void {
  const c = hex('#b8844a');
  a.rect(x, y, 18, 12, c);
  a.hline(x, y, 18, lighten(c, 0.3));
  a.hline(x, y + 5, 18, darken(c, 0.3));
  a.hline(x, y + 11, 18, darken(c, 0.45));
  a.vline(x, y, 12, darken(c, 0.2)); a.vline(x + 17, y, 12, darken(c, 0.35));
  if (fish) for (let k = 0; k < 4; k++) {
    const fx = x + 2 + k * 4;
    a.rect(fx, y - 2, 3, 3, k % 2 ? hex('#9ab8d0') : hex('#c0d4e2'));
    a.px(fx + 1, y - 2, hex('#ffffff'));
  }
  else { a.rect(x + 2, y - 3, 14, 3, hex('#dff4ff')); a.hline(x + 3, y - 3, 12, hex('#ffffff')); }
}

/** Farol: torre listrada de branco e vermelho sobre as pedras, lâmpada que acende à noite. */
export function lighthouse(): Building {
  return hdBuilding('farol', 'Farol', 3, 2, 5, [1], a => {
    const W = a.W, H = a.H, cx = W / 2;
    // pedras da base
    a.stones(4, H - 22, W - 8, 20, hex('#9a9aa4'));
    // torre afinando para cima
    const top = 42, bottom = H - 20;
    for (let y = top; y < bottom; y++) {
      const t = (y - top) / (bottom - top);
      const half = Math.round(12 + t * 10);
      const band = Math.floor((y - top) / 18) % 2 === 0;
      const base = band ? hex('#f4f0ea') : hex('#d8483a');
      for (let x = -half; x < half; x++) {
        const s = (x + half) / (half * 2);
        const c = s < 0.3 ? lighten(base, 0.15) : s > 0.75 ? darken(base, 0.22) : base;
        a.px(cx + x, y, c);
      }
    }
    // portinha e janelinha
    a.door(cx, bottom, 10, 16, { color: hex('#6a4a8a'), lamp: false, step: hex('#8a8a94') });
    a.window(cx - 3, top + 40, 6, 8, { cross: false, sill: false, frame: hex('#e8e0d0') });
    a.window(cx - 3, top + 80, 6, 8, { cross: false, sill: false, frame: hex('#e8e0d0') });
    // varanda
    a.rect(cx - 17, top - 4, 34, 4, hex('#3a3a48'));
    a.hline(cx - 17, top - 4, 34, hex('#6a6a7a'));
    for (let x = cx - 16; x < cx + 16; x += 3) a.vline(x, top - 10, 6, hex('#3a3a48'));
    a.hline(cx - 17, top - 11, 34, hex('#5a5a6a'));
    // sala da lâmpada (vidro) e cúpula
    a.rect(cx - 10, top - 26, 20, 16, hex('#2a2a38'));
    a.rect(cx - 8, top - 24, 16, 13, hex('#9adcf0'));
    a.rect(cx - 4, top - 22, 8, 9, hex('#ffe070'));
    a.rect(cx - 2, top - 21, 4, 4, hex('#fff8d0'));
    a.glow(cx - 8, top - 24, 16, 13, hex('#fff0a0'));
    for (let y = 0; y < 12; y++) {
      const half = Math.round(12 - y);
      a.rect(cx - half, top - 38 + y, half * 2, 1, mix(hex('#e8483a'), hex('#a02a2a'), y / 12));
    }
    a.rect(cx - 1, top - 42, 2, 5, hex('#3a3a48'));
    a.ink();
    return { glow: [{ x: cx / 2, y: (top - 18) / 2, r: 60, color: hex('#fff0b0'), k: 0.45 }] };
  });
}

/** Barquinho a remo visto de cima (hd), virado para cada lado; com o boneco sentado, o jogo desenha por cima. */
export function boatArt(dir: Dir): Pixmap {
  const gpt = dir === 'west' ? worldArt('barco-leste') : worldArt(`barco-${({ north: 'norte', south: 'sul', east: 'leste', west: 'leste' } as const)[dir]}`);
  if (gpt) return dir === 'west' ? mirrored(gpt.pix) : gpt.pix;
  const vertical = dir === 'north' || dir === 'south';
  const W = vertical ? 30 : 44, H = vertical ? 44 : 30;
  const a = new Art(W, H);
  const hull = hex('#b86a3a'), rim = hex('#e8c690'), inside = hex('#8a4e2a');
  // casco: elipse pontuda na proa
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = vertical ? (x - W / 2 + 0.5) / (W / 2) : (y - H / 2 + 0.5) / (H / 2);   // largura
    let v = vertical ? (y - H / 2 + 0.5) / (H / 2) : (x - W / 2 + 0.5) / (W / 2);     // comprimento
    if (dir === 'north' || dir === 'west') v = -v;   // proa para o lado que anda
    const lim = v > 0 ? 1 - Math.pow(v, 2.2) * 0.95 : 1 - Math.pow(-v, 6) * 0.6;
    const r = Math.abs(u);
    if (r > lim || Math.abs(v) > 0.98) continue;
    const edge = r > lim - 0.22;
    const c = edge ? (r > lim - 0.1 ? darken(hull, 0.15) : rim) : mix(inside, lighten(inside, 0.2), (1 - r));
    a.px(x, y, c);
  }
  // bancos (tábuas de través)
  for (const t of [-0.25, 0.3]) {
    const k = Math.round((vertical ? H : W) / 2 + t * (vertical ? H : W) / 2 * (dir === 'north' || dir === 'west' ? -1 : 1));
    if (vertical) a.rect(6, k, W - 12, 3, rim); else a.rect(k, 6, 3, H - 12, rim);
  }
  a.ink(hex('#3a2418'));
  return withHd(a.pm);
}

/** Remo (traço) para desenhar na mão, quadro a quadro, pelo jogo. */
export const OAR = { wood: '#c89458', blade: '#a8703a' };

/** Banca de peixe com toldo listrado e gelo. */
export function fishStall(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(48, 36, a => {
    const W = a.W, H = a.H;
    // balcão
    a.planks(4, 40, W - 8, H - 44, hex('#a8744a'), 5);
    a.rect(2, 36, W - 4, 5, hex('#dfe8ee'));
    for (let k = 0; k < 9; k++) {
      const x = 6 + k * 9 + (k % 2) * 2, c = [hex('#9ab8d0'), hex('#e8a060'), hex('#c0d4e2'), hex('#f0d070')][k % 4];
      a.rect(x, 33, 7, 4, c); a.px(x + 1, 33, lighten(c, 0.5)); a.px(x + 6, 34, darken(c, 0.4));
    }
    // postes e toldo
    a.rect(6, 12, 3, 28, WOOD_DARK); a.rect(W - 9, 12, 3, 28, WOOD_DARK);
    a.awning(2, 6, W - 4, 10, hex('#e84a4a'), hex('#f8f4ec'), 6);
    a.sign(W / 2, 17, 'PEIXE', { bg: hex('#27566e'), pad: 2 });
  });
}

export function crates(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(24, 22, a => { crate(a, 2, 28, true); crate(a, 26, 30, false); crate(a, 14, 16, false); });
}

/** Boia de salva-vidas num poste. */
export function ringPost(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 26, a => {
    a.rect(14, 12, 4, 40, WOOD_DARK); a.vline(14, 12, 40, lighten(WOOD_DARK, 0.3));
    lifeRing(a, 16, 24);
  });
}

/** Vitórias-régias (folhas redondas com um corte) e uma flor rosa. */
export function lilyPads(seed: number): Pixmap {
  const a = new Art(32, 32);
  const pads = 2 + Math.floor(hash(seed, 1, 5) * 2);
  for (let p = 0; p < pads; p++) {
    const cx = 8 + hash(seed, p, 7) * 16, cy = 8 + hash(seed, p, 9) * 16, r = 5 + hash(seed, p, 11) * 3;
    const cut = hash(seed, p, 13) * Math.PI * 2;
    for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) {
      const d = Math.hypot(x, y * 1.25);
      if (d > r) continue;
      let da = Math.atan2(y, x) - cut; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) < 0.35 && d > 1) continue;
      const c = d > r - 1 ? hex('#2e7a3a') : y < 0 ? hex('#6cc460') : hex('#4aa84a');
      a.px(Math.round(cx + x), Math.round(cy + y), c);
    }
  }
  if (hash(seed, 2, 17) > 0.4) {
    const fx = 10 + Math.floor(hash(seed, 3, 19) * 12), fy = 10 + Math.floor(hash(seed, 4, 19) * 10);
    for (const [dx, dy] of [[0, -2], [-2, 0], [2, 0], [0, 1], [-1, -1], [1, -1]]) a.px(fx + dx, fy + dy, hex('#f890c0'));
    a.px(fx, fy - 1, hex('#ffd8ea')); a.px(fx, fy, hex('#ffe060'));
  }
  return withHd(a.pm);
}

/** Tábuas do cais (hd) de `w × h` blocos, visto de cima: tábuas de través com pregos, estacas nas bordas. */
export function dockArt(tw: number, th: number, vertical: boolean): Pixmap {
  const W = tw * T2, H = th * T2 + 8;
  const a = new Art(W, H);
  const plank = hex('#b88a52');
  if (vertical) {
    for (let y = 0; y < th * T2; y++) {
      const inB = y % 7, tone = (hash(Math.floor(y / 7), 1, 3) - 0.5) * 0.12;
      const b = tone > 0 ? lighten(plank, tone) : darken(plank, -tone);
      a.rect(3, y, W - 6, 1, inB === 6 ? darken(b, 0.45) : inB === 0 ? lighten(b, 0.2) : b);
      if (inB === 3) { a.px(6, y, darken(b, 0.5)); a.px(W - 7, y, darken(b, 0.5)); }
    }
    a.rect(0, 0, 3, th * T2, darken(plank, 0.35)); a.rect(W - 3, 0, 3, th * T2, darken(plank, 0.35));
    for (let y = 10; y < th * T2; y += 32) { a.rect(0, y, 4, 6, WOOD_DARK); a.rect(W - 4, y, 4, 6, WOOD_DARK); }
  } else {
    for (let x = 0; x < W; x++) {
      const inB = x % 7, tone = (hash(Math.floor(x / 7), 2, 3) - 0.5) * 0.12;
      const b = tone > 0 ? lighten(plank, tone) : darken(plank, -tone);
      a.rect(x, 3, 1, th * T2 - 6, inB === 6 ? darken(b, 0.45) : inB === 0 ? lighten(b, 0.2) : b);
      if (inB === 3) { a.px(x, 6, darken(b, 0.5)); a.px(x, th * T2 - 7, darken(b, 0.5)); }
    }
    a.rect(0, 0, W, 3, lighten(plank, 0.15)); a.rect(0, th * T2 - 3, W, 3, darken(plank, 0.35));
  }
  // estacas saindo da água embaixo e sombra na água
  for (let x = 4; x < W - 4; x += vertical ? W - 12 : 30) {
    a.rect(x, th * T2, 5, 6, WOOD_DARK);
    a.hline(x, th * T2 + 6, 5, hex('#2e6aa8'));
  }
  for (let x = 2; x < W - 2; x++) a.px(x, th * T2, mix(hex('#2e5e96'), WOOD_DARK, 0.3));
  a.ink(hex('#4a2e1a'));
  return withHd(a.pm);
}

/** Pato (hd, 12 × 10 px do mundo) nadando: dois quadros (a água mexe em volta). */
export function duckFrames(dir: 'east' | 'west'): Pixmap[] {
  const gpt = worldArt('pato');
  if (gpt) { const p = dir === 'east' ? mirrored(gpt.pix) : gpt.pix; return [p, p]; }
  return [0, 1].map(f => {
    const a = new Art(24, 20);
    const body = hex('#f8f4ea'), shade = hex('#d8d0c0');
    // corpo
    for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot((x - 8) / 8, (y - 4) / 4);
      if (d > 1) continue;
      a.px(4 + x, 8 + y, y > 4 ? shade : body);
    }
    a.rect(16, 6, 3, 2, body); // rabinho
    // cabeça (verde de pato-real) e bico
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) if (Math.hypot(x - 2.5, y - 2.5) <= 3) a.px(3 + x, 2 + y, y < 2 ? hex('#3aa06a') : hex('#2a8a5a'));
    a.px(4, 4, INK);
    a.rect(0, 5, 3, 2, hex('#f0a030'));
    a.hline(6, 8, 4, hex('#f8f4ea'));
    // marolinha
    const wv = hex('#d8f0ff');
    for (let x = 2; x < 22; x++) if ((x + f * 2) % 5 < 2) a.px(x, 16, wv);
    a.pm.outline(hex('#3a4a5a'));
    if (dir === 'east') {
      const b = new Art(24, 20);
      b.pm.blit(a.pm, 0, 0, true);
      return withHd(b.pm);
    }
    return withHd(a.pm);
  });
}

/** Rochas da margem (pedras cinzas empilhadas). */
export function shoreRocks(seed: number): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 12, a => {
    const n = 3;
    for (let k = 0; k < n; k++) {
      const cx = 6 + hash(seed, k, 3) * 20, cy = 12 + hash(seed, k, 5) * 8, r = 5 + hash(seed, k, 7) * 4;
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y * 1.3);
        if (d > r) continue;
        const c = hex('#9a9aa8');
        a.px(Math.round(cx + x), Math.round(cy + y), y < -r * 0.3 ? lighten(c, 0.25) : y > r * 0.4 ? darken(c, 0.25) : c);
      }
    }
  });
}

/** Ponte de madeira sobre o riacho (`tw` blocos de comprido, de lado a lado), com corrimão. */
export function bridgeArt(tw: number): Pixmap {
  const W = tw * T2, H = 2 * T2 + 10;
  const a = new Art(W, H);
  const plank = hex('#c0925a');
  for (let x = 0; x < W; x++) {
    const inB = x % 6, tone = (hash(Math.floor(x / 6), 5, 9) - 0.5) * 0.14;
    const b = tone > 0 ? lighten(plank, tone) : darken(plank, -tone);
    a.rect(x, 12, 1, 2 * T2 - 12, inB === 5 ? darken(b, 0.45) : inB === 0 ? lighten(b, 0.2) : b);
  }
  // corrimãos em cima e embaixo
  for (const y of [6, 2 * T2 - 2]) {
    a.rect(0, y, W, 4, hex('#8a5a30'));
    a.hline(0, y, W, hex('#b8844e'));
    for (let x = 2; x < W; x += 16) a.rect(x, y - 4, 4, 10, hex('#6a4426'));
  }
  // sombra na água embaixo
  a.rect(0, 2 * T2 + 6, W, 4, hex('#2e5e96'));
  a.ink(hex('#4a2e1a'));
  return withHd(a.pm);
}

/** Fogueira com pedras em volta; 4 quadros de chama (acende à noite). */
export function campfireFrames(): { pix: Pixmap; night?: Pixmap }[] {
  return [0, 1, 2, 3].map(f => {
    const a = new Art(32, 32);
    // pedras
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2, x = 16 + Math.cos(ang) * 10, y = 24 + Math.sin(ang) * 4;
      a.rect(Math.round(x - 2), Math.round(y - 2), 5, 4, k < 4 ? hex('#8a8a96') : hex('#b0b0bc'));
      a.hline(Math.round(x - 2), Math.round(y - 2), 5, hex('#d0d0da'));
    }
    // lenha
    a.rect(9, 22, 14, 3, hex('#7a4a26')); a.rect(12, 20, 3, 6, hex('#6a3e1e')); a.rect(18, 20, 3, 6, hex('#8a5430'));
    // chama (muda a cada quadro)
    const hts = [12, 15, 13, 16];
    for (let y = 0; y < hts[f]; y++) {
      const half = Math.max(1, Math.round((1 - y / hts[f]) * 6 + Math.sin(y * 0.8 + f * 1.7) * 1.2));
      const c = y < 3 ? hex('#ff5a1e') : y < hts[f] * 0.55 ? hex('#ff9a2a') : hex('#ffe070');
      const ox = Math.round(Math.sin(y * 0.5 + f) * 1.5);
      a.rect(16 - half + ox, 22 - y, half * 2, 1, c);
      a.nt.rect(16 - half + ox, 22 - y, half * 2, 1, y < hts[f] * 0.55 ? hex('#ffb040') : hex('#fff0a0'));
    }
    a.rect(15, 17, 2, 3, hex('#fff8d8'));
    a.pm.outline(hex('#3a2418'));
    return { pix: withHd(a.pm), night: withHd(a.nt) };
  });
}

/** Guarda-sol de praia com a toalha embaixo. */
export function umbrella(c1: RGB, c2: RGB, towel: RGB): { pix: Pixmap; night?: Pixmap } {
  return hdProp(32, 32, a => {
    // toalha
    a.rect(20, 44, 26, 14, towel);
    for (let x = 20; x < 46; x += 6) a.rect(x, 44, 3, 14, lighten(towel, 0.35));
    a.hline(20, 44, 26, lighten(towel, 0.5));
    // mastro
    a.rect(31, 16, 2, 34, hex('#e8e0d0'));
    // cúpula em gomos
    for (let y = 0; y < 16; y++) {
      const half = Math.round(Math.sqrt(1 - Math.pow((16 - y) / 16, 2)) * 24);
      for (let x = -half; x < half; x++) {
        const seg = Math.floor(((x + 24) / 48) * 6);
        let c = seg % 2 ? c2 : c1;
        c = y < 5 ? lighten(c, 0.2) : y > 12 ? darken(c, 0.15) : c;
        a.px(32 + x, 4 + y, c);
      }
    }
    // barra recortada
    for (let x = -24; x < 24; x++) if (((x + 24) % 8) < 6) a.px(32 + x, 20, darken(Math.floor(((x + 24) / 48) * 6) % 2 ? c2 : c1, 0.25));
    a.rect(31, 1, 2, 3, hex('#e8e0d0'));
  });
}

/** Castelinho de areia com bandeirinha. */
export function sandcastle(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 16, a => {
    const s = hex('#e8c98a');
    a.rect(4, 18, 24, 12, s); a.hline(4, 18, 24, lighten(s, 0.3)); a.rect(4, 26, 24, 4, darken(s, 0.15));
    for (const x of [4, 12, 20]) { a.rect(x, 14, 8, 6, s); a.hline(x, 14, 8, lighten(s, 0.3)); a.rect(x + 2, 12, 2, 2, s); a.rect(x + 5, 12, 2, 2, s); }
    a.rect(14, 22, 4, 8, darken(s, 0.4));
    a.rect(15, 4, 1, 10, hex('#8a5a30'));
    a.rect(16, 4, 6, 4, hex('#e84a4a'));
    a.rect(8, 28, 3, 2, hex('#f8a0c0')); a.rect(24, 29, 3, 1, hex('#f0f0f0'));
  });
}

/** Barraca de acampamento. */
export function tent(c: RGB): { pix: Pixmap; night?: Pixmap } {
  return hdProp(32, 28, a => {
    for (let y = 0; y < 40; y++) {
      const half = Math.round(4 + y * 0.72);
      for (let x = -half; x < half; x++) a.px(32 + x, 14 + y, x < 0 ? lighten(c, 0.12) : darken(c, 0.12));
    }
    // entrada
    for (let y = 0; y < 22; y++) { const half = Math.round(y * 0.45); a.rect(32 - half, 32 + y, half * 2, 1, darken(c, 0.55)); }
    a.vline(32, 12, 42, darken(c, 0.35));
    a.rect(31, 8, 2, 6, hex('#6a4426'));
    // estacas e cordas
    a.px(2, 54, hex('#6a4426')); a.px(61, 54, hex('#6a4426'));
    a.nt.rect(28, 44, 8, 8, darken(LED.warm, 0.3));
  });
}

/** Barril de madeira com aros. */
export function barrel(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 16, a => {
    const c = hex('#a8703e');
    for (let y = 0; y < 24; y++) {
      const half = Math.round(10 + Math.sin((y / 23) * Math.PI) * 2);
      for (let x = -half; x < half; x++) { const s = (x + half) / (half * 2); a.px(16 + x, 6 + y, s < 0.3 ? lighten(c, 0.15) : s > 0.75 ? darken(c, 0.25) : c); }
    }
    for (const y of [9, 26]) a.rect(4, 6 + y - 6, 24, 2, hex('#5a5a66'));
    a.rect(6, 4, 20, 4, darken(c, 0.2)); a.hline(6, 4, 20, lighten(c, 0.2));
  });
}

/** Varal de secar peixe: dois postes, a corda e os peixes pendurados. */
export function fishRack(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(32, 24, a => {
    a.rect(4, 10, 3, 38, WOOD_DARK); a.rect(57, 10, 3, 38, WOOD_DARK);
    for (let x = 6; x < 58; x++) a.px(x, 12 + Math.round(Math.sin(((x - 6) / 52) * Math.PI) * 3), hex('#d8cfa8'));
    for (let k = 0; k < 6; k++) {
      const x = 11 + k * 8, y = 14 + Math.round(Math.sin(((x - 6) / 52) * Math.PI) * 3);
      const c = [hex('#9ab8d0'), hex('#c8a070'), hex('#b0c4d4')][k % 3];
      a.rect(x, y, 3, 9, c); a.rect(x - 1, y + 8, 5, 3, darken(c, 0.2)); a.px(x + 1, y + 2, INK);
    }
  });
}
