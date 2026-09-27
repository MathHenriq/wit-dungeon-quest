// Prédios especiais no estilo HeartGold/SoulSilver (mesma linguagem das casas
// de `house-hg.ts`): telhados com volume e degradê contínuo, contorno na cor
// escura de cada material, paredes lisas com luz da esquerda, vidro com
// reflexo diagonal. Tamanhos e portas iguais aos de `buildings.ts`, para a
// planta da cidade não mudar.
import { hex, mix, Pixmap, type RGB } from './pixmap';
import { cardEmblem, drawText, textWidth, TILE, type Building } from './buildings';
import { NEON, WHITE } from './palette';
import { flowerBox, gableRoof, makeRamp, PLANK, ROOF_HG, windowHG, type RoofHG } from './house-hg';

export interface WallHG { hi: RGB; light: RGB; base: RGB; shade: RGB; line: RGB }

export const WALL_HG: Record<string, WallHG> = {
  branco: { hi: hex('#ffffff'), light: hex('#f6f6fa'), base: hex('#e6e8f0'), shade: hex('#c6cad8'), line: hex('#646a84') },
  creme: { hi: hex('#fffaf0'), light: hex('#f8eed8'), base: hex('#ecdcbc'), shade: hex('#cfba92'), line: hex('#7c6444') },
  pedra: { hi: hex('#f2f0f6'), light: hex('#dcdae4'), base: hex('#c4c2d0'), shade: hex('#a2a0b4'), line: hex('#54526a') },
};

const ROOF_WHITE: RoofHG = { hi: hex('#ffffff'), light: hex('#f4f4f8'), base: hex('#dcdee8'), shade: hex('#b8bccc'), dark: hex('#9498ac'), line: hex('#5c6078') };
export const ROOF_NAVY: RoofHG = { hi: hex('#7a80c8'), light: hex('#5258a4'), base: hex('#3a3f80'), shade: hex('#2a2e64'), dark: hex('#1d204a'), line: hex('#10122c') };

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

/** Parede lisa: sombra do beiral no alto, luz da esquerda, base de pedra e contorno. */
export function plasterWall(pm: Pixmap, x0: number, y0: number, x1: number, y1: number, Wp: WallHG): void {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let c = y - y0 < 2 ? Wp.shade : y - y0 < 4 ? mix(Wp.base, Wp.shade, 0.4) : Wp.light;
    if (y - y0 >= 4) {
      if (x - x0 < 4) c = Wp.hi;
      else if (x1 - x < 5) c = Wp.base;
      else if (x1 - x < 2) c = Wp.shade;
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

/** Porta de vidro de correr (duas folhas), com tapete. */
export function glassDoorHG(pm: Pixmap, cx: number, yBottom: number, w: number, h: number, glow: RGB = NEON.cyan): void {
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
  }
  pm.rect(cx - 1, y, 2, h - 1, frame);                 // divisão das folhas
  pm.rect(x, y, w - 1, 2, glow);                        // luz no batente
  pm.rect(x, y, w - 1, 1, mix(glow, WHITE, 0.6));
  // tapete
  pm.rect(x - 1, yBottom - 1, w + 2, 2, hex('#c84c5a'));
  pm.rect(x - 1, yBottom - 1, w + 2, 1, hex('#e8788a'));
}

/** Letreiro com texto em fonte pixel. */
export function signHG(pm: Pixmap, cx: number, y: number, text: string, bg: RGB, fg: RGB, line: RGB): void {
  const w = textWidth(text) + 8, x = cx - (w >> 1);
  pm.rect(x - 1, y - 1, w + 2, 11, line);
  pm.rect(x, y, w, 9, bg);
  pm.rect(x, y, w, 1, mix(bg, WHITE, 0.35));
  pm.rect(x, y + 8, w, 1, mix(bg, line, 0.4));
  drawText(pm, text, x + 4, y + 2, fg, mix(bg, line, 0.55));
}

function newPm(tw: number, th: number, extraTop: number): Pixmap {
  return new Pixmap(tw * TILE, th * TILE + extraTop);
}

// ─────────────────────── Centro de Cartas ───────────────────────

export function cardCenterHG(): Building {
  const tw = 7, th = 5, extraTop = 10;
  const pm = newPm(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOF_HG.vermelho, Wp = WALL_HG.branco;
  const cx = W >> 1;
  plasterWall(pm, 4, 48, W - 5, H - 3, Wp);
  slabRoof(pm, 1, W - 2, 12, 52, R, 0.25, 5);
  // bloco central elevado, com sombra sobre o telhado de baixo
  for (let x = 34; x <= W - 35; x++) for (let y = 29; y <= 31; y++) pm.put(x, y, mix(R.dark, R.shade, (y - 29) / 3));
  slabRoof(pm, 32, W - 33, 1, 28, R, 0.35, 4);
  cardEmblem(pm, cx, 40, 9, R.base);
  // sombra do beiral na parede
  for (let x = 4; x <= W - 5; x++) { pm.put(x, 53, mix(Wp.shade, Wp.line, 0.25)); pm.put(x, 54, Wp.shade); }
  windowHG(pm, 13, 62, 22, 12);
  windowHG(pm, W - 35, 62, 22, 12);
  flowerBox(pm, 12, 78, 24);
  flowerBox(pm, W - 36, 78, 24);
  glassDoorHG(pm, cx, H - 3, 24, 24);
  signHG(pm, cx, 55, 'CARTAS', R.base, WHITE, R.line);
  return { id: 'centro', name: 'Centro de Cartas', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3] };
}

// ─────────────────────────── Loja ───────────────────────────

export function shopHG(): Building {
  const tw = 5, th = 5, extraTop = 6;
  const pm = newPm(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOF_HG.azul, Wp = WALL_HG.branco;
  plasterWall(pm, 3, 42, W - 4, H - 3, Wp);
  slabRoof(pm, 1, W - 2, 3, 46, R, 0.28, 5);
  // pacotinho no telhado (desenhado em dobro)
  const pack = [
    '..ooooooo..',
    '.oyyyyyyyo.',
    'oyykkkkkyyo',
    'oyyyyyyyyyo',
    'oyywywywyyo',
    'oyyyyyyyyyo',
    '.ooooooooo.',
  ];
  const packC: Record<string, RGB> = { o: R.line, y: NEON.yellow, k: hex('#ff8a3a'), w: NEON.pink };
  const px0 = (W >> 1) - 11, py0 = 20;
  pack.forEach((row, yy) => [...row].forEach((ch, xx) => {
    if (ch === '.') return;
    let c = packC[ch];
    if (ch === 'y' && yy < 3) c = mix(c, WHITE, 0.35);
    pm.rect(px0 + xx * 2, py0 + yy * 2, 2, 2, c);
  }));
  for (let x = 3; x <= W - 4; x++) { pm.put(x, 47, mix(Wp.shade, Wp.line, 0.25)); pm.put(x, 48, Wp.shade); }
  // vitrine com cartas
  const vx = 9, vy = 60, vw = 24, vh = 14;
  windowHG(pm, vx, vy, vw, vh);
  const cards = [NEON.pink, NEON.cyan, NEON.yellow, NEON.purple];
  cards.forEach((c, k) => {
    const x = vx + 2 + k * 5, y = vy + 5 + (k % 2);
    pm.rect(x, y, 4, 7, R.line); pm.rect(x + 1, y + 1, 2, 5, c); pm.put(x + 1, y + 1, WHITE);
  });
  glassDoorHG(pm, 56, H - 3, 20, 24);
  signHG(pm, 56, 50, 'LOJA', R.base, WHITE, R.line);
  return { id: 'loja', name: 'Loja', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3] };
}

// ─────────────────────── Sede das Guildas ───────────────────────

export function guildHallHG(): Building {
  const tw = 7, th = 5, extraTop = 12;
  const pm = newPm(tw, th, extraTop);
  const W = tw * TILE, H = th * TILE + extraTop;
  const R = ROOF_HG.verde, Wp = WALL_HG.creme;
  const cx = W / 2, left = 1, right = W - 2;
  const peakY = 16, eaveY = 50;
  plasterWall(pm, left + 3, peakY + 2, right - 3, H - 3, Wp);
  gableRoof(pm, { left, right, cx, backY: 2, peakY, eaveY }, R);
  // escudo no frontão
  const icx = Math.floor(cx);
  pm.stamp([
    '.ooooooooo.',
    'obbbbbbbbbo',
    'obbbyyybbbo',
    'obbyyyyybbo',
    'obbbyyybbbo',
    '.obbbybbbo.',
    '..obbbbbo..',
    '...obbbo...',
    '....ooo....',
  ], icx - 5, peakY + 9, { o: hex('#23345e'), b: hex('#4e78c4'), y: NEON.yellow });
  signHG(pm, icx, peakY + 21, 'GUILDAS', R.base, WHITE, R.line);
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
  // porta dupla de madeira
  const dw = 22, dx = icx - (dw >> 1), dh = 24, dy = H - 3 - dh;
  const wood = { l: hex('#c89060'), b: hex('#a06a40'), d: hex('#6e4428'), line: hex('#4a2c18') };
  pm.rect(dx - 2, dy - 2, dw + 4, dh + 2, wood.line);
  pm.rect(dx, dy, dw, dh, wood.b);
  pm.rect(dx, dy, dw, 2, wood.l);
  for (const px of [dx + 2, icx + 2]) pm.rect(px, dy + 4, (dw >> 1) - 4, dh - 8, wood.d);
  for (const px of [dx + 3, icx + 3]) pm.rect(px, dy + 5, (dw >> 1) - 6, dh - 10, wood.l);
  pm.rect(icx, dy, 1, dh, wood.line);
  pm.put(icx - 2, dy + 13, NEON.yellow); pm.put(icx + 2, dy + 13, NEON.yellow);
  pm.rect(dx - 3, H - 4, dw + 6, 2, WALL_HG.pedra.hi);
  return { id: 'guildas', name: 'Sede das Guildas', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3] };
}

// ─────────────────────────── Arena ───────────────────────────

export function arenaHG(): Building {
  const tw = 8, th = 5, extraTop = 14;
  const pm = newPm(tw, th, extraTop);
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
    if (d < 0.02) c = mix(NEON.yellow, WHITE, 0.3);
    else if (d < 0.035) c = hex('#c89a20');
    pm.put(x, y, c);
  }
  // contorno da cúpula na cor escura da lona
  for (let y = Math.floor(cy - ry) - 1; y < cy; y++) for (let x = 0; x < W; x++) {
    const inside = (xx: number, yy: number) => {
      const a = (xx + 0.5 - cx) / rx, b = (yy + 0.5 - cy) / ry;
      return yy < cy && a * a + b * b <= 1;
    };
    if (inside(x, y)) continue;
    if (inside(x + 1, y) || inside(x - 1, y) || inside(x, y + 1)) pm.put(x, y, R.line);
  }
  // aro de metal na base da cúpula
  pm.rect(3, cy - 3, W - 6, 4, ROOF_WHITE.shade);
  pm.rect(3, cy - 3, W - 6, 1, WHITE);
  pm.rect(3, cy, W - 6, 1, ROOF_WHITE.dark);
  pm.rect(2, cy + 1, W - 4, 1, R.line);
  for (let x = 8; x < W - 8; x += 10) { pm.put(x, cy - 2, NEON.cyan); pm.put(x + 1, cy - 2, NEON.cyanSoft); }
  // mastros com bandeiras
  for (const [fx, c] of [[16, NEON.cyan], [W - 18, NEON.pink]] as [number, RGB][]) {
    const dark = mix(c, hex('#101830'), 0.5);
    pm.rect(fx, cy - 34, 2, 30, hex('#6a7088'));
    pm.put(fx, cy - 34, WHITE);
    pm.stamp(['ooooooo', 'occcclo', 'occclo.', 'occo...', 'oo.....'], fx + 2, cy - 34, { o: dark, c, l: mix(c, WHITE, 0.5) });
  }
  // portão em arco
  const gw = 30, gx = Math.round(cx - gw / 2), gh = 28, gy = H - 3 - gh;
  for (let y = 0; y < gh; y++) for (let x = -2; x < gw + 2; x++) {
    const ax = (x + 0.5 - gw / 2) / (gw / 2 + 2), ay = (gh - y) / gh;
    if (y < 8 && ax * ax + ((8 - y) / 8) ** 2 > 1) continue;
    pm.put(gx + x, gy + y, Wp.line);
    const inner = x >= 0 && x < gw && (y >= 8 || ((x + 0.5 - gw / 2) / (gw / 2)) ** 2 + ((8 - y) / 7) ** 2 <= 1);
    if (inner) pm.put(gx + x, gy + y, mix(hex('#6a4a2e'), hex('#24160c'), 1 - ay * 0.8));
  }
  for (let y = gy + 6; y < H - 3; y += 5) pm.rect(gx + 1, y, gw - 2, 1, hex('#3a2616'));
  pm.rect(Math.round(cx), gy + 2, 1, gh - 2, hex('#2a1a0e'));
  signHG(pm, Math.round(cx), wallTop + 5, 'ARENA', R.base, WHITE, R.line);
  return { id: 'arena', name: 'Arena', pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [3, 4] };
}

