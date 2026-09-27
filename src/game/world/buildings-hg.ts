// Prédios especiais no estilo HeartGold/SoulSilver (mesma linguagem das casas
// de `house-hg.ts`): telhados com volume e degradê contínuo, contorno na cor
// escura de cada material, paredes lisas com luz da esquerda, vidro com
// reflexo diagonal. Cada prédio devolve também a camada `night` (o que acende
// à noite). O toque tecnológico usa o verde da marca WIT.
import { hash, hex, mix, Pixmap, type RGB } from './pixmap';
import { TILE, type Building } from './buildings';
import { drawText, FONT_H, textWidth } from './font';
import { LED, WHITE, WIT } from './palette';
import { flowerBox, gableRoof, litGlass, makeRamp, PLANK, ROOF_HG, windowHG, type RoofHG } from './house-hg';

export interface WallHG { hi: RGB; light: RGB; base: RGB; shade: RGB; line: RGB }

export const WALL_HG: Record<string, WallHG> = {
  branco: { hi: hex('#ffffff'), light: hex('#f6f6fa'), base: hex('#e6e8f0'), shade: hex('#c6cad8'), line: hex('#646a84') },
  creme: { hi: hex('#fffaf0'), light: hex('#f8eed8'), base: hex('#ecdcbc'), shade: hex('#cfba92'), line: hex('#7c6444') },
  pedra: { hi: hex('#f2f0f6'), light: hex('#dcdae4'), base: hex('#c4c2d0'), shade: hex('#a2a0b4'), line: hex('#54526a') },
};

const ROOF_WHITE: RoofHG = { hi: hex('#ffffff'), light: hex('#f4f4f8'), base: hex('#dcdee8'), shade: hex('#b8bccc'), dark: hex('#9498ac'), line: hex('#5c6078') };

// ───────────────────────── peças ─────────────────────────

/** Telhado de quatro águas visto de cima: faixa de trás clara, cumeeira,
 *  água da frente escurecendo até o beiral, cantos arredondados. */
export function slabRoof(pm: Pixmap, x0: number, x1: number, y0: number, y1: number, R: RoofHG, ridgeT = 0.3, radius = 4): void {
  const ramp = makeRamp(R);
  const inside = (x: number, y: number) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const dx = Math.max(x0 + radius - x, 0, x - (x1 - radius));
    const dy = Math.max(y0 + radius - y, 0, y - (y1 - radius));
    return dx * dx + dy * dy <= radius * radius + 1;
  };
  const bodyEnd = y1 - 5;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!inside(x, y)) continue;
    let c: RGB;
    if (y > bodyEnd) {
      // beiral: brilho, cor, sombra, escuro
      const k = y - bodyEnd;
      c = k === 1 ? R.hi : k === 2 ? R.light : k === 3 ? R.shade : R.dark;
      if (x - x0 < 3) c = mix(c, R.hi, 0.3);
      if (x1 - x < 3) c = mix(c, R.dark, 0.4);
    } else {
      const t = (y - y0) / (bodyEnd - y0);
      const seam = PLANK[(x - x0) % 6];
      let v: number;
      if (t < ridgeT) v = 0.15 + (t / ridgeT) * 0.5 + seam * 0.25;
      else v = 1.1 + ((t - ridgeT) / (1 - ridgeT)) * 1.9 + seam * 0.5;
      if (Math.abs(t - ridgeT) * (bodyEnd - y0) < 1) v = 0;          // cumeeira
      if (x - x0 < 5) v -= 0.5;
      if (x1 - x < 5) v += 0.7;
      c = ramp(v);
    }
    pm.put(x, y, c);
  }
  for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) {
    if (inside(x, y)) continue;
    if (inside(x + 1, y) || inside(x - 1, y) || inside(x, y + 1) || inside(x, y - 1)) pm.put(x, y, R.line);
  }
}

/** Fita de LED no beiral: de dia pontinhos claros, à noite acende na cor dada. */
function eaveLeds(pm: Pixmap, nt: Pixmap, x0: number, x1: number, y: number, R: RoofHG, colors: RGB[]): void {
  for (let x = x0, k = 0; x <= x1; x += 3, k++) {
    pm.put(x, y, mix(R.hi, WHITE, 0.5));
    const c = colors[k % colors.length];
    nt.put(x, y, c); nt.put(x, y - 1, mix(c, WHITE, 0.4));
  }
}

/** Parede lisa: sombra do beiral no alto, luz da esquerda, base de pedra e contorno. */
export function plasterWall(pm: Pixmap, x0: number, y0: number, x1: number, y1: number, Wp: WallHG): void {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let c = y - y0 < 2 ? Wp.shade : y - y0 < 4 ? mix(Wp.base, Wp.shade, 0.4) : Wp.light;
    if (y - y0 >= 4) {
      if (x - x0 < 4) c = Wp.hi;
      else if (x1 - x < 5) c = Wp.base;
    }
    pm.put(x, y, c);
  }
  // rodapé
  const stone = WALL_HG.pedra;
  pm.rect(x0, y1 - 3, x1 - x0 + 1, 4, stone.base);
  pm.rect(x0, y1 - 3, x1 - x0 + 1, 1, stone.hi);
  pm.rect(x0, y1, x1 - x0 + 1, 1, stone.shade);
  for (let y = y0; y <= y1 + 1; y++) { pm.put(x0 - 1, y, Wp.line); pm.put(x1 + 1, y, Wp.line); }
  pm.rect(x0 - 1, y1 + 1, x1 - x0 + 3, 1, Wp.line);
}

/** Porta de vidro de correr (duas folhas), com tapete. À noite, o saguão aceso. */
export function glassDoorHG(pm: Pixmap, nt: Pixmap, cx: number, yBottom: number, w: number, h: number, accent: RGB = WIT.lime): void {
  const x = cx - (w >> 1), y = yBottom - h;
  const frame = hex('#8a90a8'), frameL = hex('#d8dce8'), line = hex('#3a4058');
  pm.rect(x - 2, y - 2, w + 4, h + 2, line);
  pm.rect(x - 1, y - 1, w + 2, h + 1, frameL);
  pm.rect(x + w - 1, y - 1, 2, h + 1, frame);
  for (let yy = 0; yy < h - 1; yy++) for (let xx = 0; xx < w - 1; xx++) {
    const t = yy / h;
    let c = mix(hex('#bfe6fa'), hex('#4a80c0'), t * 0.9 + (xx / w) * 0.2);
    const d = xx - yy * 0.6;
    if ((d > 2 && d < 4) || (d > 13 && d < 14.5)) c = mix(c, WHITE, 0.6);
    pm.put(x + xx, y + yy, c);
    nt.put(x + xx, y + yy, mix(mix(LED.warmSoft, LED.warm, 0.5), hex('#c88a40'), t));
  }
  pm.rect(cx - 1, y, 2, h - 1, frame);                 // divisão das folhas
  nt.rect(cx - 1, y, 2, h - 1, mix(LED.warm, hex('#80501c'), 0.5));
  pm.rect(x, y, w - 1, 1, accent);                      // friso verde no batente
  nt.rect(x, y, w - 1, 1, LED.green);
  // tapete
  pm.rect(x - 1, yBottom - 1, w + 2, 2, hex('#c84c5a'));
  pm.rect(x - 1, yBottom - 1, w + 2, 1, hex('#e8788a'));
}

// ───────────────────────── letreiros ─────────────────────────

export type SignIcon = 'carta' | 'pacote' | 'espadas' | 'escudo';

const ICONS: Record<SignIcon, { rows: string[]; legend: Record<string, string> }> = {
  carta: {
    rows: ['.ooooooo.', '.owwwwwo.', '.owrrrwo.', '.owryrwo.', '.owyyywo.', '.owryrwo.', '.owrrrwo.', '.owwwwwo.', '.ooooooo.'],
    legend: { o: '#3a3450', w: '#ffffff', r: '#e0506a', y: '#ffd84a' },
  },
  pacote: {
    rows: ['.o.o.o.o.', 'ooooooooo', 'olllllllo', 'oykkkkkyo', 'oyyyyyyyo', 'oywywywyo', 'oyyyyyyyo', 'oyyyyyyyo', 'ooooooooo'],
    legend: { o: '#3a3450', l: '#fff0a0', y: '#ffd84a', k: '#ff8a3a', w: '#e0508a' },
  },
  espadas: {
    rows: ['b.......b', 'lb.....bl', '.lb...bl.', '..lb.bl..', '...lbl...', '..hb.bh..', '.hh...hh.', 'hg.....gh', 'g.......g'],
    legend: { b: '#8a96b0', l: '#f4f8ff', h: '#6a4428', g: '#ffd84a' },
  },
  escudo: {
    rows: ['ooooooooo', 'obbbbbbbo', 'obbyyybbo', 'obyyyyybo', 'obbyyybbo', '.obbybbo.', '.obbbbbo.', '..obbbo..', '...ooo...'],
    legend: { o: '#23345e', b: '#4e78c4', y: '#ffd84a' },
  },
};

export interface SignTheme { bg: RGB; line: RGB }

/** Largura total do letreiro (com ícone). */
export function signWidth(text: string, icon?: SignIcon): number {
  return textWidth(text) + (icon ? 15 : 0) + 10;
}

/**
 * Letreiro: placa de 15 px de altura, cantos cortados, degradê, brilho em cima,
 * ícone numa caixinha branca à esquerda e texto branco com sombra, alinhado na
 * grade da fonte. À noite a placa acende (luz de fundo).
 */
export function signHG(pm: Pixmap, nt: Pixmap | null, cx: number, y: number, text: string, th: SignTheme, icon?: SignIcon): void {
  const w = signWidth(text, icon), h = FONT_H + 8;
  const x = Math.round(cx - w / 2);
  const paint = (dst: Pixmap, lit: boolean) => {
    const bg = lit ? mix(th.bg, th.line, 0.15) : th.bg;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const corner = (xx === 0 || xx === w - 1) && (yy === 0 || yy === h - 1);
      if (corner) continue;
      const edge = xx === 0 || xx === w - 1 || yy === 0 || yy === h - 1;
      let c: RGB;
      if (edge) c = th.line;
      else if (yy === 1) c = mix(bg, WHITE, 0.55);
      else if (yy === h - 2) c = mix(bg, th.line, 0.45);
      else c = mix(mix(bg, WHITE, 0.18), mix(bg, th.line, 0.12), (yy - 2) / (h - 4));
      dst.put(x + xx, y + yy, c);
    }
    let tx = x + 5;
    if (icon) {
      const ic = ICONS[icon];
      const bx = x + 3, by = y + 2;
      dst.rect(bx, by, 11, 11, lit ? mix(WHITE, th.bg, 0.25) : mix(WHITE, th.bg, 0.12));
      dst.rect(bx, by + 10, 11, 1, mix(WHITE, th.line, 0.35));
      const legend: Record<string, RGB> = {};
      for (const [k, v] of Object.entries(ic.legend)) legend[k] = hex(v);
      dst.stamp(ic.rows, bx + 1, by + 1, legend);
      tx = bx + 11 + 4;
    }
    drawText(dst, text, tx, y + 4, {
      fill: WHITE, fillBottom: lit ? LED.greenSoft : mix(WHITE, th.bg, 0.18),
      shadow: mix(th.bg, th.line, 0.6),
    });
  };
  paint(pm, false);
  // sombra do letreiro na parede
  for (let xx = 2; xx < w; xx++) pm.put(x + xx, y + h, mix(th.line, th.bg, 0.3));
  if (nt) paint(nt, true);
}

function newPm(tw: number, th: number, extraTop: number): Pixmap {
  return new Pixmap(tw * TILE, th * TILE + extraTop);
}

/** Emblema do Centro: carta branca com estrela, dentro de um círculo. */
function cardEmblem(pm: Pixmap, nt: Pixmap, cx: number, cy: number, r: number, R: RoofHG): void {
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = Math.sqrt((x + 0.5) ** 2 + (y + 0.5) ** 2);
    if (d <= r + 1 && d > r) pm.put(cx + x, cy + y, R.line);
    else if (d <= r) {
      pm.put(cx + x, cy + y, d > r - 2 ? R.base : mix(WHITE, R.hi, (y + r) / (2 * r) * 0.5));
      if (d > r - 2) nt.put(cx + x, cy + y, LED.green);
    }
  }
  const ic = ICONS.carta, legend: Record<string, RGB> = {};
  for (const [k, v] of Object.entries(ic.legend)) legend[k] = hex(v);
  pm.stamp(ic.rows, cx - 4, cy - 4, legend);
  nt.stamp(ic.rows, cx - 4, cy - 4, { ...legend, w: LED.white, y: LED.warm });
}

// ─────────────────────── Centro de Cartas ───────────────────────

export function cardCenterHG(): Building {
  const tw = 7, th = 5, extraTop = 10;
  const pm = newPm(tw, th, extraTop), nt = newPm(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOF_HG.vermelho, Wp = WALL_HG.branco;
  const cx = W >> 1;
  plasterWall(pm, 4, 48, W - 5, H - 3, Wp);
  slabRoof(pm, 1, W - 2, 12, 52, R, 0.25, 5);
  eaveLeds(pm, nt, 4, W - 5, 49, R, [LED.green]);
  // bloco central elevado, com sombra sobre o telhado de baixo
  for (let x = 34; x <= W - 35; x++) for (let y = 29; y <= 31; y++) pm.put(x, y, mix(R.dark, R.shade, (y - 29) / 3));
  slabRoof(pm, 32, W - 33, 1, 28, R, 0.35, 4);
  eaveLeds(pm, nt, 34, W - 35, 25, R, [LED.green]);
  cardEmblem(pm, nt, cx, 39, 10, R);
  // sombra do beiral na parede
  for (let x = 4; x <= W - 5; x++) { pm.put(x, 53, mix(Wp.shade, Wp.line, 0.25)); pm.put(x, 54, Wp.shade); }
  windowHG(pm, 13, 62, 22, 12, nt);
  windowHG(pm, W - 35, 62, 22, 12, nt);
  flowerBox(pm, 12, 78, 24);
  flowerBox(pm, W - 36, 78, 24);
  glassDoorHG(pm, nt, cx, H - 3, 24, 20);
  signHG(pm, nt, cx, 49, 'CARTAS', { bg: R.base, line: R.line }, 'carta');
  return { id: 'centro', name: 'Centro de Cartas', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3], night: nt };
}

// ─────────────────────────── Loja ───────────────────────────

export function shopHG(): Building {
  const tw = 5, th = 5, extraTop = 6;
  const pm = newPm(tw, th, extraTop), nt = newPm(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOF_HG.azul, Wp = WALL_HG.branco;
  plasterWall(pm, 3, 42, W - 4, H - 3, Wp);
  slabRoof(pm, 1, W - 2, 3, 46, R, 0.28, 5);
  eaveLeds(pm, nt, 4, W - 5, 43, R, [LED.cyan, LED.green]);
  // pacotinho no telhado (desenhado em dobro)
  const ic = ICONS.pacote, legend: Record<string, RGB> = {};
  for (const [k, v] of Object.entries(ic.legend)) legend[k] = hex(v);
  legend.o = R.line;
  const px0 = (W >> 1) - 9, py0 = 17;
  ic.rows.forEach((row, yy) => [...row].forEach((ch, xx) => {
    const c = legend[ch];
    if (!c) return;
    pm.rect(px0 + xx * 2, py0 + yy * 2, 2, 2, c);
    if (ch !== 'o') nt.rect(px0 + xx * 2, py0 + yy * 2, 2, 2, mix(c, WHITE, 0.2));
  }));
  for (let x = 3; x <= W - 4; x++) { pm.put(x, 47, mix(Wp.shade, Wp.line, 0.25)); pm.put(x, 48, Wp.shade); }
  // vitrine com cartas
  const vx = 9, vy = 62, vw = 24, vh = 13;
  windowHG(pm, vx, vy, vw, vh, nt);
  const cards = [hex('#ff5a9a'), hex('#40c8f0'), hex('#ffd84a'), WIT.lime];
  cards.forEach((c, k) => {
    const x = vx + 2 + k * 5, y = vy + 4 + (k % 2);
    for (const dst of [pm, nt]) { dst.rect(x, y, 4, 7, R.line); dst.rect(x + 1, y + 1, 2, 5, c); dst.put(x + 1, y + 1, WHITE); }
  });
  glassDoorHG(pm, nt, 56, H - 3, 20, 20);
  signHG(pm, nt, 40, 44, 'LOJA', { bg: R.base, line: R.line }, 'pacote');
  return { id: 'loja', name: 'Loja', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3], night: nt };
}

// ─────────────────────── Sede das Guildas ───────────────────────

export function guildHallHG(): Building {
  const tw = 7, th = 5, extraTop = 12;
  const pm = newPm(tw, th, extraTop), nt = newPm(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOF_HG.verde, Wp = WALL_HG.creme;
  const cx = W / 2, left = 1, right = W - 2;
  const peakY = 16, eaveY = 50;
  plasterWall(pm, left + 3, peakY + 2, right - 3, H - 3, Wp);
  gableRoof(pm, { left, right, cx, backY: 2, peakY, eaveY }, R);
  const icx = Math.floor(cx);
  // fita de LED verde na empena
  for (let x = left + 2; x <= right - 2; x += 3) {
    const e = Math.round(x < cx ? eaveY - ((x - left) / (cx - left)) * (eaveY - peakY) : peakY + ((x - cx) / (right - cx)) * (eaveY - peakY));
    pm.put(x, e + 2, mix(R.hi, WHITE, 0.5));
    nt.put(x, e + 2, LED.green); nt.put(x, e + 1, LED.greenSoft);
  }
  // escudo no frontão (acende à noite)
  const shield = ICONS.escudo, sl: Record<string, RGB> = {};
  for (const [k, v] of Object.entries(shield.legend)) sl[k] = hex(v);
  pm.stamp(shield.rows, icx - 4, peakY + 8, sl);
  nt.stamp(shield.rows, icx - 4, peakY + 8, { ...sl, y: LED.warmSoft, b: hex('#78a8ff') });
  signHG(pm, nt, icx, peakY + 23, 'GUILDAS', { bg: R.shade, line: R.line }, 'escudo');
  // viga sob o beiral
  pm.rect(left + 3, eaveY + 5, right - left - 5, 3, Wp.shade);
  pm.rect(left + 3, eaveY + 5, right - left - 5, 1, Wp.hi);
  // colunas
  const colTop = eaveY + 8, colBot = H - 7;
  for (let k = 0; k < 5; k++) {
    const px = Math.round(8 + k * ((W - 24) / 4));
    pm.rect(px - 1, colTop, 8, colBot - colTop + 1, Wp.line);
    pm.rect(px, colTop, 6, colBot - colTop, WHITE);
    pm.rect(px + 4, colTop, 2, colBot - colTop, ROOF_WHITE.shade);
    pm.rect(px + 1, colTop, 1, colBot - colTop, ROOF_WHITE.light);
    pm.rect(px - 1, colTop, 8, 2, Wp.shade);
  }
  // estandartes entre as colunas (o vão do meio é da porta)
  const colors = [hex('#e85a5a'), hex('#9a6ae0')];
  colors.forEach((c, k) => {
    const bx = k === 0 ? 20 : W - 27;
    const dark = mix(c, hex('#200a20'), 0.5);
    pm.rect(bx - 1, colTop + 2, 9, 18, dark);
    pm.rect(bx, colTop + 3, 7, 14, c);
    pm.rect(bx, colTop + 3, 2, 14, mix(c, WHITE, 0.3));
    pm.stamp(['.w.', 'www', '.w.'], bx + 2, colTop + 7, { w: WHITE });
    pm.stamp(['o.o.o.o.o'], bx - 1, colTop + 20, { o: dark });
  });
  // lanternas dos dois lados da porta
  for (const lx of [icx - 20, icx + 17]) {
    pm.stamp(['.oo.', 'oggo', 'oggo', '.oo.', '..o.'], lx, colTop + 4, { o: hex('#3c3a50'), g: hex('#f0e8c8') });
    nt.stamp(['.ww.', 'wyyw', 'wyyw', '.ww.'], lx, colTop + 4, { w: LED.warm, y: LED.warmSoft });
  }
  // porta dupla de madeira (fresta acesa à noite)
  const dw = 22, dx = icx - (dw >> 1), dh = 24, dy = H - 3 - dh;
  const wood = { l: hex('#c89060'), b: hex('#a06a40'), d: hex('#6e4428'), line: hex('#4a2c18') };
  pm.rect(dx - 2, dy - 2, dw + 4, dh + 2, wood.line);
  pm.rect(dx, dy, dw, dh, wood.b);
  pm.rect(dx, dy, dw, 2, wood.l);
  for (const px of [dx + 2, icx + 2]) pm.rect(px, dy + 4, (dw >> 1) - 4, dh - 8, wood.d);
  for (const px of [dx + 3, icx + 3]) pm.rect(px, dy + 5, (dw >> 1) - 6, dh - 10, wood.l);
  pm.rect(icx, dy, 1, dh, wood.line);
  nt.rect(icx, dy + 1, 1, dh - 2, LED.warm);
  pm.put(icx - 2, dy + 13, hex('#ffd84a')); pm.put(icx + 2, dy + 13, hex('#ffd84a'));
  pm.rect(dx - 3, H - 4, dw + 6, 2, WALL_HG.pedra.hi);
  return { id: 'guildas', name: 'Sede das Guildas', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3], night: nt };
}

// ─────────────────────────── Arena ───────────────────────────

export function arenaHG(): Building {
  const tw = 8, th = 5, extraTop = 14;
  const pm = newPm(tw, th, extraTop), nt = newPm(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOF_HG.vermelho, Wp = WALL_HG.pedra;
  const wallTop = 50;
  plasterWall(pm, 4, wallTop, W - 5, H - 3, Wp);
  // pilastras
  for (const px of [14, 38, W - 43, W - 19]) {
    pm.rect(px - 1, wallTop + 4, 7, H - wallTop - 8, Wp.line);
    pm.rect(px, wallTop + 4, 5, H - wallTop - 8, Wp.hi);
    pm.rect(px + 3, wallTop + 4, 2, H - wallTop - 8, Wp.shade);
  }
  // cúpula de lona listrada, com luz vinda do alto à esquerda
  const redR = makeRamp(R), whiteR = makeRamp(ROOF_WHITE);
  const cx = W / 2, cy = wallTop + 3, rx = W / 2 - 3, ry = 46;
  const L = [-0.45, -0.75, 0.48];
  for (let y = Math.floor(cy - ry); y < cy; y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    const d = dx * dx + dy * dy;
    if (d > 1) continue;
    const z = Math.sqrt(Math.max(0, 1 - d));
    const lam = dx * L[0] + dy * L[1] + z * L[2];
    const ang = Math.atan2(dy, dx);
    const seg = Math.floor(((ang + Math.PI) / Math.PI) * 14);
    const v = 1 - lam;
    let c = seg % 2 === 0 ? redR(1.6 + v * 2.2) : whiteR(0.6 + v * 2.4);
    if (d < 0.02) { c = mix(hex('#ffe066'), WHITE, 0.3); nt.put(x, y, LED.warmSoft); }
    else if (d < 0.035) c = hex('#c89a20');
    pm.put(x, y, c);
  }
  // contorno da cúpula na cor escura da lona
  const inDome = (xx: number, yy: number) => {
    const a = (xx + 0.5 - cx) / rx, b = (yy + 0.5 - cy) / ry;
    return yy < cy && a * a + b * b <= 1;
  };
  for (let y = Math.floor(cy - ry) - 1; y < cy; y++) for (let x = 0; x < W; x++) {
    if (inDome(x, y)) continue;
    if (inDome(x + 1, y) || inDome(x - 1, y) || inDome(x, y + 1)) pm.put(x, y, R.line);
  }
  // aro de metal na base da cúpula, com LEDs coloridos (acendem à noite)
  pm.rect(3, cy - 3, W - 6, 4, ROOF_WHITE.shade);
  pm.rect(3, cy - 3, W - 6, 1, WHITE);
  pm.rect(3, cy, W - 6, 1, ROOF_WHITE.dark);
  pm.rect(2, cy + 1, W - 4, 1, R.line);
  const ring = [LED.green, LED.pink, LED.cyan, LED.warm, LED.purple];
  for (let x = 6, k = 0; x < W - 6; x += 4, k++) {
    pm.put(x, cy - 2, k % 2 ? WIT.lime : WHITE);
    nt.put(x, cy - 2, ring[k % ring.length]); nt.put(x + 1, cy - 2, mix(ring[k % ring.length], WHITE, 0.5));
  }
  // mastros com bandeiras
  for (const [fx, c] of [[16, WIT.lime], [W - 18, hex('#ff5a9a')]] as [number, RGB][]) {
    const dark = mix(c, hex('#101830'), 0.5);
    pm.rect(fx, cy - 34, 2, 30, hex('#6a7088'));
    pm.put(fx, cy - 34, WHITE);
    nt.put(fx, cy - 35, hex('#ff5a6a'));
    pm.stamp(['ooooooo', 'occcclo', 'occclo.', 'occo...', 'oo.....'], fx + 2, cy - 34, { o: dark, c, l: mix(c, WHITE, 0.5) });
  }
  // portão em arco (por dentro, a luz do estádio à noite)
  const gw = 30, gx = Math.round(cx - gw / 2), gh = 28, gy = H - 3 - gh;
  for (let y = 0; y < gh; y++) for (let x = -2; x < gw + 2; x++) {
    const ax = (x + 0.5 - gw / 2) / (gw / 2 + 2), ay = (gh - y) / gh;
    if (y < 8 && ax * ax + ((8 - y) / 8) ** 2 > 1) continue;
    pm.put(gx + x, gy + y, Wp.line);
    const inner = x >= 0 && x < gw && (y >= 8 || ((x + 0.5 - gw / 2) / (gw / 2)) ** 2 + ((8 - y) / 7) ** 2 <= 1);
    if (inner) {
      pm.put(gx + x, gy + y, mix(hex('#6a4a2e'), hex('#24160c'), 1 - ay * 0.8));
      nt.put(gx + x, gy + y, mix(LED.warmSoft, LED.orange, 1 - ay));
    }
  }
  for (let y = gy + 6; y < H - 3; y += 5) { pm.rect(gx + 1, y, gw - 2, 1, hex('#3a2616')); nt.rect(gx + 1, y, gw - 2, 1, hex('#a06030')); }
  pm.rect(Math.round(cx), gy + 2, 1, gh - 2, hex('#2a1a0e'));
  nt.rect(Math.round(cx), gy + 2, 1, gh - 2, hex('#a06030'));
  signHG(pm, nt, Math.round(cx), cy - 13, 'ARENA', { bg: R.base, line: R.line }, 'espadas');
  return { id: 'arena', name: 'Arena', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3, 4], night: nt };
}

// ─────────────────────── Torre dos 100 Andares ───────────────────────

const TOWER_GLASS: RoofHG = {
  hi: hex('#dcf6ee'), light: hex('#a4dcd0'), base: hex('#64b4ac'), shade: hex('#3e848c'), dark: hex('#285a6e'), line: hex('#142c3c'),
};

/** Torre dos 100 Andares: pele de vidro verde-azulada, recuo no topo com a
 *  marca WIT, fitas de LED nas quinas, saguão de vidro com marquise. */
export function towerHG(): Building {
  const arts = [0, 1, 2, 3].map(towerArt);
  return {
    id: 'torre', name: 'Torre dos 100 Andares', pix: arts[0].pm, tilesW: 6, tilesH: 7, extraTop: 56, doorCols: [2, 3],
    frames: arts.map(a => a.pm), night: arts[0].nt, nightFrames: arts.map(a => a.nt),
  };
}

function towerArt(frame: number): { pm: Pixmap; nt: Pixmap } {
  const tw = 6, th = 7, extraTop = 56;
  const pm = newPm(tw, th, extraTop), nt = newPm(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const G = TOWER_GLASS, ramp = makeRamp(G);
  const metal = { hi: hex('#f4f6fa'), light: hex('#d4d8e4'), base: hex('#aab0c2'), shade: hex('#7c8298'), line: hex('#2c3044') };

  // ── corpo: frente (x0..x1) + lateral direita (x1..x2) ──
  const x0 = 14, x1 = 74, x2 = 82, topY = 40, podY = H - 40;
  const FLOOR = 8, PANE = 6;
  for (let y = topY; y < podY; y++) {
    const fy = (y - topY) % FLOOR;
    for (let x = x0; x < x2; x++) {
      const side = x >= x1;
      const lx = side ? x - x1 : x - x0;
      const t = (y - topY) / (podY - topY);
      let v = side ? 3.1 + t * 0.6 : 0.9 + t * 1.6 + (lx / (x1 - x0)) * 0.7;
      // reflexos diagonais grandes (céu no vidro)
      const band = (((x - x0) + (y - topY) * 0.55) % 46 + 46) % 46;
      if (!side && band < 7) v -= 0.8;
      else if (!side && band < 9) v -= 0.4;
      let c = ramp(v);
      const mullion = !side && lx % (PANE + 1) === PANE;
      if (fy === 0) c = side ? metal.shade : metal.light;              // laje do andar
      else if (fy === 1) c = side ? mix(metal.shade, G.dark, 0.5) : metal.base;
      else if (mullion) c = mix(c, metal.light, 0.55);
      pm.put(x, y, c);
      // janelas acesas à noite (umas sim, outras não; algumas piscam)
      if (!side && fy > 1 && !mullion) {
        const col = Math.floor(lx / (PANE + 1)), row = Math.floor((y - topY) / FLOOR);
        const h1 = hash(col, row, 21);
        const flick = hash(col, row, 33) > 0.93 && frame % 2 === 1;
        if ((h1 > 0.35) !== flick) {
          const warm = hash(row, col, 5) > 0.3;
          nt.put(x, y, mix(warm ? LED.warmSoft : hex('#d8f4ff'), warm ? LED.warm : hex('#9cd8f0'), (fy - 2) / (FLOOR - 3)));
        }
      }
    }
  }
  // quinas: fitas de LED verticais (de dia, metal com pontinhos lima)
  for (const lx of [x0, x1 - 1]) {
    for (let y = topY; y < podY; y++) {
      pm.put(lx, y, (y - topY) % FLOOR === 4 ? WIT.lime : metal.hi);
      const pulse = ((podY - y) + frame * 18) % 72;
      nt.put(lx, y, pulse < 6 ? LED.greenSoft : LED.green);
    }
  }
  // contorno do corpo
  for (let y = topY - 1; y < podY; y++) { pm.put(x0 - 1, y, G.line); pm.put(x2, y, G.line); }
  for (let y = topY; y < podY; y++) pm.put(x1, y, mix(G.line, G.dark, 0.4));

  // ── coroa recuada com a marca WIT ──
  const cx0 = 22, cx1 = 66, cTop = 18;
  for (let y = cTop; y < topY; y++) for (let x = cx0; x <= cx1 + 6; x++) {
    const side = x > cx1;
    let c = side ? mix(G.dark, G.line, 0.3) : mix(hex('#1c3a44'), hex('#12262e'), (y - cTop) / (topY - cTop));
    if (y === cTop) c = side ? G.dark : metal.light;
    pm.put(x, y, c);
  }
  for (let y = cTop - 1; y < topY; y++) { pm.put(cx0 - 1, y, G.line); pm.put(cx1 + 7, y, G.line); }
  for (let x = cx0 - 1; x <= cx1 + 7; x++) pm.put(x, cTop - 1, G.line);
  // laje entre coroa e corpo
  pm.rect(x0 - 2, topY - 2, x2 - x0 + 4, 3, metal.light);
  pm.rect(x0 - 2, topY - 2, x2 - x0 + 4, 1, metal.hi);
  pm.rect(x0 - 3, topY + 1, x2 - x0 + 6, 1, G.line);
  pm.rect(x0 - 3, topY - 3, x2 - x0 + 6, 1, G.line);
  // "WIT" com os quadradinhos da logo (degradê verde → lima)
  const word = 'WIT', ww = textWidth(word), wx = Math.round((cx0 + cx1) / 2 - ww / 2) - 3, wy = cTop + 8;
  const txt = { fill: WIT.lime, fillBottom: WIT.base, outline: hex('#0c2228') };
  drawText(pm, word, wx, wy, txt);
  drawText(nt, word, wx, wy, { fill: LED.greenSoft, fillBottom: LED.green, outline: hex('#1a4a2a') });
  const sq: [number, number, RGB][] = [[ww + 3, 5, WIT.lime], [ww + 6, 2, WIT.mid], [ww + 9, -1, WIT.limeLight]];
  for (const [sx, sy, c] of sq) {
    pm.rect(wx + sx, wy + sy, 2, 2, c);
    nt.rect(wx + sx, wy + sy, 2, 2, (frame + sx) % 3 === 0 ? LED.greenSoft : LED.green);
  }

  // ── antena e farol ──
  const ax = 44;
  for (let y = 3; y < cTop - 1; y++) { pm.put(ax, y, metal.line); pm.put(ax + 1, y, metal.light); pm.put(ax + 2, y, metal.line); }
  pm.rect(ax - 2, 10, 7, 1, metal.line); pm.rect(ax - 1, 13, 5, 1, metal.line);
  const on = frame % 2 === 0;
  pm.stamp(['.o.', 'oro', '.o.'], ax, 0, { o: metal.line, r: on ? hex('#ff5a6a') : hex('#a83a4a') });
  if (on) nt.stamp(['.r.', 'rwr', '.r.'], ax, 0, { r: hex('#ff5a6a'), w: hex('#ffe0e4') });

  // ── saguão (pódio) de vidro com marquise ──
  const px0 = 4, px1 = W - 5;
  for (let y = podY; y < H - 3; y++) for (let x = px0; x <= px1; x++) {
    const t = (y - podY) / (H - 3 - podY);
    let c = mix(hex('#cfeee8'), hex('#5a9aa0'), t * 0.8 + ((x - px0) / (px1 - px0)) * 0.2);
    if ((x - px0) % 10 === 9) c = metal.light;
    pm.put(x, y, c);
    if ((x - px0) % 10 === 9) nt.put(x, y, hex('#5a4020'));
    else if (hash((x - px0) / 10 | 0, 0, 9) > 0.35) nt.put(x, y, mix(hex('#e8b870'), hex('#9a6430'), t));
  }
  // faixa de cima do pódio, verde WIT, com o painel "100"
  pm.rect(px0 - 1, podY - 6, px1 - px0 + 3, 7, metal.line);
  pm.rect(px0, podY - 5, px1 - px0 + 1, 5, WIT.base);
  pm.rect(px0, podY - 5, px1 - px0 + 1, 1, WIT.lime);
  pm.rect(px0, podY - 1, px1 - px0 + 1, 1, WIT.dark);
  for (let x = px0; x <= px1; x++) nt.put(x, podY - 5, LED.green);
  const num = '100', nw = textWidth(num), pnx = Math.round(W / 2 - (nw + 8) / 2), pny = podY - 17;
  pm.rect(pnx - 1, pny - 1, nw + 10, FONT_H + 6, metal.line);
  pm.rect(pnx, pny, nw + 8, FONT_H + 4, hex('#10201a'));
  drawText(pm, num, pnx + 4, pny + 2, { fill: WIT.lime, fillBottom: WIT.mid });
  nt.rect(pnx, pny, nw + 8, FONT_H + 4, hex('#10201a'));
  drawText(nt, num, pnx + 4, pny + 2, { fill: LED.greenSoft, fillBottom: LED.green });
  // porta dupla central
  const dcx = 48, dw = 26, dh = 22, dy = H - 3 - dh;
  pm.rect(dcx - (dw >> 1) - 2, dy - 2, dw + 4, dh + 2, metal.line);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    let c = mix(hex('#e0f6f0'), hex('#3a7c88'), y / dh * 0.9);
    if (x - y * 0.6 > 3 && x - y * 0.6 < 5) c = mix(c, WHITE, 0.6);
    pm.put(dcx - (dw >> 1) + x, dy + y, c);
    nt.put(dcx - (dw >> 1) + x, dy + y, mix(mix(LED.warm, WHITE, 0.2), hex('#b07838'), y / dh));
  }
  pm.rect(dcx - 1, dy, 2, dh, metal.base);
  // marquise
  pm.rect(dcx - (dw >> 1) - 6, dy - 6, dw + 12, 4, metal.light);
  pm.rect(dcx - (dw >> 1) - 6, dy - 6, dw + 12, 1, metal.hi);
  pm.rect(dcx - (dw >> 1) - 6, dy - 3, dw + 12, 1, metal.line);
  for (let x = dcx - (dw >> 1) - 4; x < dcx + (dw >> 1) + 5; x += 4) { pm.put(x, dy - 2, WIT.lime); nt.put(x, dy - 2, LED.white); }
  // base e contorno do pódio
  pm.rect(px0, H - 3, px1 - px0 + 1, 2, metal.base);
  for (let y = podY - 6; y < H - 1; y++) { pm.put(px0 - 1, y, metal.line); pm.put(px1 + 1, y, metal.line); }
  pm.rect(px0 - 1, H - 1, px1 - px0 + 3, 1, metal.line);
  return { pm, nt };
}
