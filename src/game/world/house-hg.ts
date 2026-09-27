// Casa no estilo HeartGold/SoulSilver: telhado de duas águas em perspectiva
// (empena triangular na frente, as duas águas indo para trás), degradê,
// contorno na cor escura de cada material, tábuas em 3 tons, janela com
// reflexo diagonal e floreira. À noite: janelas acesas, luminária da porta e
// fita de LED na borda do telhado (a cor de cada casa).
import { mix, Pixmap, hex, type RGB } from './pixmap';
import { TILE, type Building } from './buildings';
import { LED, WIT } from './palette';

export interface RoofHG { hi: RGB; light: RGB; base: RGB; shade: RGB; dark: RGB; line: RGB }
export interface WoodHG { hi: RGB; light: RGB; base: RGB; shade: RGB; line: RGB }

export const ROOF_HG: Record<string, RoofHG> = {
  vermelho: { hi: hex('#ffc4c0'), light: hex('#f49090'), base: hex('#e06a70'), shade: hex('#c04c58'), dark: hex('#98344a'), line: hex('#6a2436') },
  azul: { hi: hex('#d0e8ff'), light: hex('#9cc4f4'), base: hex('#74a0e4'), shade: hex('#5478c4'), dark: hex('#3c5898'), line: hex('#2a3c6a') },
  verde: { hi: hex('#d8f4c0'), light: hex('#a8dc88'), base: hex('#80c068'), shade: hex('#5e9c50'), dark: hex('#44783c'), line: hex('#2e5230') },
  roxo: { hi: hex('#ecdcff'), light: hex('#c4a8f0'), base: hex('#a084dc'), shade: hex('#7e64bc'), dark: hex('#5e4896'), line: hex('#40306a') },
  laranja: { hi: hex('#ffe0c0'), light: hex('#fcb888'), base: hex('#ee9660'), shade: hex('#cc7448'), dark: hex('#a05438'), line: hex('#6e3826') },
};

export const WOOD_HG: Record<string, WoodHG> = {
  bege: { hi: hex('#fff4dc'), light: hex('#f0dcb4'), base: hex('#dcc494'), shade: hex('#bca070'), line: hex('#7c6444') },
  branco: { hi: hex('#ffffff'), light: hex('#eef0f6'), base: hex('#d8dce8'), shade: hex('#b0b6c8'), line: hex('#6c7288') },
  rosa: { hi: hex('#fff4f6'), light: hex('#f8dce4'), base: hex('#ecc4d0'), shade: hex('#cc9cac'), line: hex('#80566a') },
};

export const GLASS_HG = { hi: hex('#e8f8ff'), light: hex('#a8d8f8'), base: hex('#78b4ec'), dark: hex('#4a84c8'), frame: hex('#ffffff'), line: hex('#3a5474') };

export interface HouseHGOpts {
  tilesW?: number;
  roof?: keyof typeof ROOF_HG;
  wood?: keyof typeof WOOD_HG;
  door?: string;
  flowers?: boolean;
  /** Cor da fita de LED do telhado (acende à noite). */
  led?: keyof typeof LED;
  /** Detalhe tecnológico no telhado. */
  tech?: 'solar' | 'antena';
}

/** Vidro aceso à noite: luz quente com a cruz da janela em contraluz. */
export function litGlass(nt: Pixmap, x: number, y: number, w: number, h: number, warm: RGB = LED.warm): void {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    let c = mix(mix(LED.warmSoft, warm, 0.35), mix(warm, hex('#c07830'), 0.3), yy / Math.max(1, h - 1));
    if (xx === (w >> 1) || yy === (h >> 1)) c = mix(warm, hex('#b0702c'), 0.45);
    nt.put(x + xx, y + yy, c);
  }
}

export function windowHG(pm: Pixmap, x: number, y: number, w: number, h: number, nt?: Pixmap): void {
  if (nt) litGlass(nt, x, y, w, h);
  pm.rect(x - 2, y - 2, w + 4, h + 4, GLASS_HG.line);
  pm.rect(x - 1, y - 1, w + 2, h + 2, GLASS_HG.frame);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const t = (xx + yy) / (w + h);
    let c = t < 0.35 ? GLASS_HG.light : t < 0.75 ? GLASS_HG.base : GLASS_HG.dark;
    const diag = xx - yy;
    if (diag >= 2 && diag <= 3) c = GLASS_HG.hi;            // reflexo diagonal
    if (diag >= 6 && diag <= 6) c = mix(GLASS_HG.hi, GLASS_HG.light, 0.5);
    pm.put(x + xx, y + yy, c);
  }
  pm.rect(x - 2, y + h + 2, w + 4, 2, hex('#e8e0d0'));       // peitoril
  pm.rect(x - 2, y + h + 3, w + 4, 1, hex('#a89880'));
}

export function flowerBox(pm: Pixmap, x: number, y: number, w: number): void {
  const pots = hex('#8a5a3c'), potsL = hex('#b07a52'), potsD = hex('#5c3a26');
  const cols = [hex('#ff78b4'), hex('#ffa048'), hex('#e050a0'), hex('#ffc8e0')];
  for (let k = 0; k < w; k += 4) {
    const c = cols[(k >> 2) % cols.length], d = mix(c, hex('#6a2040'), 0.45), l = mix(c, hex('#ffffff'), 0.5);
    pm.stamp(['.oo.', 'occo', 'olco', '.oo.'], x + k, y + ((k >> 2) % 2), { o: d, c, l });
    pm.put(x + k + 1, y + 4 + ((k >> 2) % 2), hex('#4a8a3c'));
  }
  pm.rect(x - 1, y + 5, w + 2, 5, potsD);
  pm.rect(x, y + 5, w, 3, pots);
  pm.rect(x, y + 5, w, 1, potsL);
}


/** Rampa contínua hi→dark (v de 0 a 4), em 16 degraus: degradê sem faixas duras. */
export function makeRamp(R: RoofHG): (v: number) => RGB {
  const rampL = [R.hi, R.light, R.base, R.shade, R.dark];
  return (v: number): RGB => {
    const q = Math.round(Math.max(0, Math.min(4, v)) * 4) / 4;
    const i = Math.min(3, Math.floor(q));
    return mix(rampL[i], rampL[i + 1], q - i);
  };
}

/** Perfil de cada tábua/telha (6 px): borda escura, meio claro. */
export const PLANK = [0.7, 0.15, -0.25, -0.35, -0.1, 0.35];

export interface GableGeom { left: number; right: number; cx: number; backY: number; peakY: number; eaveY: number }

/** Linha da empena: /\ de (left,eaveY) até (cx,peakY) até (right,eaveY). */
export function gableEdge(g: GableGeom): (x: number) => number {
  return (x: number) => x < g.cx
    ? g.eaveY - ((x - g.left) / (g.cx - g.left)) * (g.eaveY - g.peakY)
    : g.peakY + ((x - g.cx) / (g.right - g.cx)) * (g.eaveY - g.peakY);
}

/** Telhado de duas águas visto de cima, com a empena triangular na frente. */
export function gableRoof(pm: Pixmap, g: GableGeom, R: RoofHG): void {
  const { left, right, cx, backY, eaveY } = g;
  const edgeY = gableEdge(g);
  const ramp = makeRamp(R);
  const shadeAt = (x: number, _y: number, t: number, leftSide: boolean) =>
    ramp(t * 2.6 + (leftSide ? 0.3 : 1.3) + PLANK[Math.floor(Math.abs(x - cx)) % 6]);
  for (let y = backY; y < eaveY + 4; y++) for (let x = left; x <= right; x++) {
    const e = edgeY(x);
    if (y > Math.round(e)) continue;               // a borda da empena é pintada depois
    const leftSide = x < cx;
    const tDepth = (y - backY) / (eaveY - backY);
    let c: RGB;
    {
      c = shadeAt(x, y, tDepth, leftSide);
      if (Math.abs(x - cx) < 1.2) c = leftSide ? R.hi : R.light; // cumeeira
    }
    pm.put(x, y, c);
  }
  // borda da empena: faixa sólida por coluna (brilho, cor, sombra, contorno)
  for (let x = left; x <= right; x++) {
    const e = Math.round(edgeY(x)), leftSide = x < cx;
    pm.put(x, e + 1, R.hi);
    pm.put(x, e + 2, leftSide ? R.light : R.base);
    pm.put(x, e + 3, leftSide ? R.shade : R.dark);
  }
  // contorno do telhado: topo, laterais e a borda da empena
  for (let x = left; x <= right; x++) pm.put(x, backY - 1, R.line);
  for (let x = left - 1; x <= right + 1; x++) {
    const xx = Math.max(left, Math.min(right, x));
    const e = Math.round(edgeY(xx));
    for (let y = backY; y <= e + 3; y++) if (x === left - 1 || x === right + 1) pm.put(x, y, R.line);
    pm.put(x, e + 4, R.line);
  }
}

/** Casa de duas águas (5–6 blocos de largura, 5 de altura). */
export function houseHG(id: string, name: string, o: HouseHGOpts = {}): Building {
  const tw = o.tilesW ?? 5, th = 5, extraTop = 4;
  const W = tw * TILE, H = th * TILE + extraTop;
  const pm = new Pixmap(W, H);
  const R = ROOF_HG[o.roof ?? 'vermelho'], Wd = WOOD_HG[o.wood ?? 'bege'];
  const cx = W / 2;
  const eaveY = 46, peakY = 22, backY = 2;
  const left = 1, right = W - 2;
  // linha da empena (frente do telhado): /\ de (left,eaveY) até (cx,peakY) até (right,eaveY)
  const edgeY = (x: number) => x < cx ? eaveY - ((x - left) / (cx - left)) * (eaveY - peakY) : peakY + ((x - cx) / (right - cx)) * (eaveY - peakY);

  // ── fachada (parede de tábuas) ──
  const wallTop = peakY + 2, wallBottom = H - 3;
  for (let y = wallTop; y <= wallBottom; y++) for (let x = left + 3; x <= right - 3; x++) {
    const row = (y - wallTop) % 5;
    let c = row === 0 ? Wd.shade : row === 1 ? Wd.hi : row === 4 ? Wd.base : Wd.light;
    if (x < left + 6) c = mix(c, Wd.hi, 0.4);
    if (x > right - 6) c = mix(c, Wd.shade, 0.5);
    pm.put(x, y, c);
  }
  // viga horizontal na altura do beiral e base de pedra
  pm.rect(left + 3, eaveY, right - left - 5, 3, Wd.shade);
  pm.rect(left + 3, eaveY, right - left - 5, 1, Wd.hi);
  pm.rect(left + 3, wallBottom - 3, right - left - 5, 4, hex('#a8a4b4'));
  pm.rect(left + 3, wallBottom - 3, right - left - 5, 1, hex('#d4d0dc'));
  for (let x = left + 5; x < right - 3; x += 7) pm.rect(x, wallBottom - 2, 1, 3, hex('#88849a'));
  // contorno da parede (cor escura da madeira)
  for (let y = wallTop; y <= wallBottom + 1; y++) { pm.put(left + 2, y, Wd.line); pm.put(right - 2, y, Wd.line); }
  pm.rect(left + 2, wallBottom + 1, right - left - 3, 1, Wd.line);
  // respiro na empena
  const vy = peakY + 10;
  pm.rect(cx - 5, vy - 1, 10, 7, Wd.line);
  pm.rect(cx - 4, vy, 8, 5, hex('#f8f4ee'));
  pm.rect(cx - 3, vy + 1, 6, 3, hex('#3c3848'));
  pm.rect(cx - 3, vy + 2, 6, 1, hex('#58546a'));
  const nt = new Pixmap(W, H);
  litGlass(nt, cx - 3, vy + 1, 6, 3, LED.orange);

  gableRoof(pm, { left, right, cx, backY, peakY, eaveY }, R);
  // fita de LED na borda da empena: de dia só uns pontinhos claros
  const ledC = LED[o.led ?? 'green'];
  for (let x = left + 2; x <= right - 2; x += 3) {
    const e = Math.round(edgeY(x));
    pm.put(x, e + 2, mix(R.hi, hex('#ffffff'), 0.5));
    nt.put(x, e + 2, ledC);
    nt.put(x, e + 1, mix(ledC, hex('#ffffff'), 0.5));
  }
  if (o.tech === 'solar') solarPanel(pm, nt, Math.round(cx + 8), backY + 6, Math.round((right - cx) * 0.55), R);
  if (o.tech === 'antena') antenna(pm, nt, Math.round(cx - 18), backY + 10);
  // sombra do beiral sobre a parede
  for (let x = left + 3; x <= right - 3; x++) {
    const e = Math.round(edgeY(x));
    if (e + 5 <= wallBottom) pm.put(x, e + 5, mix(Wd.shade, Wd.line, 0.3));
  }

  // ── porta, janela, floreira ──
  const doorCol = Math.floor(tw / 2);
  const dx = doorCol * TILE + 1, dw = 16, dh = 22, dy = wallBottom - 3 - dh;
  const door = hex(o.door ?? '#d84c50'), doorL = mix(door, hex('#ffffff'), 0.35), doorD = mix(door, hex('#301018'), 0.45);
  pm.rect(dx - 2, dy - 2, dw + 4, dh + 2, Wd.line);
  pm.rect(dx - 1, dy - 1, dw + 2, dh + 1, Wd.hi);
  pm.rect(dx, dy, dw, dh, door);
  pm.rect(dx, dy, dw, 1, doorL);
  pm.rect(dx + dw - 2, dy, 2, dh, doorD);
  pm.rect(dx + 2, dy + 3, dw - 5, 4, doorD);
  pm.rect(dx + 3, dy + 4, dw - 7, 2, hex('#7a1c2c'));
  pm.put(dx + dw - 4, dy + 12, hex('#ffe070')); pm.put(dx + dw - 4, dy + 13, hex('#b08a30'));
  pm.rect(dx - 3, wallBottom - 3, dw + 6, 2, hex('#e8e4ee')); // degrau
  // luminária sobre a porta
  const lx = dx + (dw >> 1) - 2, ly = dy - 6;
  pm.stamp(['.oo.', 'oggo', 'oggo', '.oo.'], lx, ly, { o: hex('#4a4660'), g: hex('#e8eef4') });
  nt.stamp(['.ww.', 'wyyw', 'wyyw', '.ww.'], lx, ly, { w: LED.warm, y: LED.warmSoft });
  const winX = dx + dw + 8, winW = Math.min(20, right - 8 - winX);
  if (winW >= 12) windowHG(pm, winX, dy + 3, winW, 12, nt);
  if (o.flowers !== false && right - 4 - (winX + winW + 6) >= 8) flowerBox(pm, winX + winW + 6, wallBottom - 14, right - 6 - (winX + winW + 6));
  else if (o.flowers !== false) flowerBox(pm, winX - 1, dy + 19, Math.max(8, winW + 2));

  return { id, name, pix: pm, tilesW: tw, tilesH: th, extraTop, doorCols: [doorCol], night: nt };
}

/** Placa solar sobre a água direita do telhado (vidro verde-escuro com grade). */
function solarPanel(pm: Pixmap, nt: Pixmap, x: number, y: number, w: number, R: RoofHG): void {
  const h = 12, line = hex('#1c3a34');
  for (let yy = -1; yy <= h; yy++) for (let xx = -1; xx <= w; xx++) {
    const sx = x + xx - Math.floor(yy / 3);
    if (yy === -1 || yy === h || xx === -1 || xx === w) { pm.put(sx, y + yy, line); continue; }
    let c = mix(hex('#3c8a78'), hex('#1e4e48'), yy / h);
    if (xx % 5 === 4 || yy % 4 === 3) c = mix(c, hex('#a8d8c8'), 0.35);
    if (xx - yy * 1.5 > 2 && xx - yy * 1.5 < 4.5) c = mix(c, hex('#ffffff'), 0.45);
    pm.put(sx, y + yy, c);
  }
  // sombra no telhado
  for (let xx = 0; xx <= w; xx++) pm.put(x + xx - Math.floor(h / 3), y + h + 1, R.dark);
  pm.put(x + w - 2, y + 1, WIT.lime);
  nt.put(x + w - 2, y + 1, LED.green);
}

/** Antena com luz de topo (vermelha, pisca à noite). */
function antenna(pm: Pixmap, nt: Pixmap, x: number, y: number): void {
  const line = hex('#3c3a50'), metal = hex('#b8bccc');
  for (let yy = 0; yy < 14; yy++) { pm.put(x, y - yy, line); pm.put(x + 1, y - yy, metal); pm.put(x + 2, y - yy, line); }
  pm.rect(x - 3, y - 9, 9, 1, line); pm.rect(x - 2, y - 6, 7, 1, line);
  pm.rect(x - 2, y - 9, 7, 1, metal);
  pm.stamp(['.o.', 'oro', '.o.'], x, y - 17, { o: line, r: hex('#e84a5a') });
  nt.stamp(['.r.', 'rwr', '.r.'], x, y - 17, { r: hex('#ff5a6a'), w: hex('#ffd0d4') });
}
