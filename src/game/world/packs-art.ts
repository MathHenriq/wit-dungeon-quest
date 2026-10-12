// Pacotinho desenhado em pixel art (mesma mão do pacote gigante da Loja):
// foil estufado na cor da raridade, selos prateados com serrilha em cima e
// embaixo, "WIT" grande, emblema da raridade num medalhão e brilho de Lendário
// para cima. Fica até a imagem do GPT (public/game/packs/<id>.png) chegar.
import { hash, hex, mix, Pixmap, type RGB } from './pixmap';
import { drawText, textWidth } from './font';
import { WHITE } from './palette';
import { makeRamp } from './house-hg';
import type { Rarity } from '@/lib/tcg/types';

export const PACK_W = 60, PACK_H = 84;
/** Altura (px do pacote) da tira de cima que sai voando ao rasgar. */
export const PACK_TEAR = 12;

const RARITY_HEX: Record<Rarity, string> = {
  common: '#9aa4b4', uncommon: '#3ab864', rare: '#3a8ee0', epic: '#a85ae8',
  legendary: '#f0b02a', mythic: '#f05ac8', unknown: '#6a4cf0',
};
const RANK: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'];
const BLACK: RGB = [0, 0, 0];
const CRIMP = { hi: hex('#ffffff'), light: hex('#e6eaf2'), base: hex('#c2cad8'), shade: hex('#939db2') };

function hsl(h: number, s: number, l: number): RGB {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}

/** Emblema da raridade (desenhado em volta de cx, cy). */
function emblem(pm: Pixmap, r: Rarity, cx: number, cy: number, c: { hi: RGB; base: RGB; dark: RGB }) {
  const put = (x: number, y: number, col: RGB) => pm.put(Math.round(cx + x), Math.round(cy + y), col);
  const shape = (inside: (x: number, y: number) => boolean, R: number) => {
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1);
      put(x, y, edge ? c.dark : (x + y < -2 ? c.hi : c.base));
    }
  };
  const star = (n: number, R: number, r0: number) => (x: number, y: number) => {
    const a = Math.atan2(y, x) + Math.PI / 2, d = Math.hypot(x, y);
    const k = Math.abs(Math.cos((a * n) / 2));
    return d <= r0 + (R - r0) * Math.pow(k, 3);
  };
  switch (r) {
    case 'common': shape((x, y) => Math.hypot(x, y) <= 5.5, 6); break;
    case 'uncommon': shape((x, y) => Math.abs(x) + Math.abs(y) * 0.8 <= 6, 8); break;
    case 'rare': // gema lapidada
      shape((x, y) => (y <= -1 ? Math.abs(x) <= 7 + y * 0.5 && y >= -5 : Math.abs(x) <= 7 - (y + 1) * 1.1), 8);
      for (let x = -3; x <= 3; x++) put(x, -3, c.hi);
      break;
    case 'epic': shape(star(5, 9, 4), 9); break;
    case 'legendary': // coroa
      shape((x, y) => (y >= 0 && y <= 5 && Math.abs(x) <= 8) || (y < 0 && y >= -7 && [-7, 0, 7].some(px => Math.abs(x - px) <= 2 + (y + 7) * 0.25)), 9);
      for (const px of [-7, 0, 7]) put(px, -8, WHITE);
      break;
    default: // mítica e desconhecida: estrela de 8 pontas com miolo branco
      shape(star(8, 10, 5), 10);
      shape((x, y) => Math.hypot(x, y) <= 2.5, 3);
  }
}

/** Desenha o pacotinho da raridade (60 × 84 px). */
export function drawPack(rarity: Rarity, label: string): Pixmap {
  const base = hex(RARITY_HEX[rarity]);
  const R = { hi: mix(base, WHITE, 0.72), light: mix(base, WHITE, 0.38), base, shade: mix(base, BLACK, 0.28), dark: mix(base, BLACK, 0.52), line: mix(base, BLACK, 0.78) };
  const ramp = makeRamp(R);
  const rank = RANK.indexOf(rarity);
  const pm = new Pixmap(PACK_W, PACK_H);
  const body = new Pixmap(PACK_W, PACK_H);
  const x0 = 2, x1 = PACK_W - 3, top = 1, bottom = PACK_H - 2;
  // serrilha das pontas (dentes de 2 px)
  const inBody = (x: number, y: number) => x >= x0 && x <= x1 && y >= top + ((x >> 1) % 2) && y <= bottom - ((x >> 1) % 2);
  for (let y = 0; y < PACK_H; y++) for (let x = 0; x < PACK_W; x++) {
    if (!inBody(x, y)) continue;
    const crimpTop = y < top + 9, crimpBottom = y > bottom - 8;
    if (crimpTop || crimpBottom) {
      const p = x % 3;
      let c = p === 0 ? CRIMP.hi : p === 1 ? CRIMP.base : CRIMP.shade;
      if (crimpTop && y === top + 8) c = CRIMP.shade;
      if (crimpBottom && y === bottom - 7) c = CRIMP.hi;
      if (x - x0 < 3) c = mix(c, CRIMP.hi, 0.4);
      if (x1 - x < 3) c = mix(c, CRIMP.shade, 0.5);
      // selo com um toque da cor do pacote
      body.put(x, y, mix(c, R.light, 0.18));
      continue;
    }
    // foil estufado: claro no meio, sombra à direita e embaixo
    const k = ((x - x0) / (x1 - x0)) * 2 - 1;
    let c = ramp(1.0 + 1.6 * k * k + 0.55 * k + ((y - top) / (bottom - top)) * 0.5);
    // reflexo na diagonal: arco-íris de Raro para cima, branco nos outros
    const s = (((x * 0.9 + y) % 46) + 46) % 46;
    if (s < 8) c = rank >= 2 ? mix(c, hsl((y * 7 + x * 3) % 360, 0.85, 0.72), 0.32 + rank * 0.04) : mix(c, WHITE, 0.22);
    else if (s < 9.5) c = mix(c, WHITE, 0.5);
    body.put(x, y, c);
  }
  // pontilhado "rasgue aqui" logo abaixo do selo de cima
  for (let x = x0 + 2; x < x1; x += 3) body.put(x, top + PACK_TEAR - 1, mix(R.light, WHITE, 0.5));
  body.outline(R.line);
  pm.blit(body, 0, 0);

  // "WIT" grande (fonte 5×7 em dobro) com contorno e sombra
  const word = new Pixmap(24, 12);
  drawText(word, 'WIT', 2, 2, { fill: WHITE, fillBottom: R.hi, outline: R.line });
  const wx = Math.round(PACK_W / 2 - (textWidth('WIT') + 4)), wy = 14;
  for (let y = 0; y < word.h; y++) for (let x = 0; x < word.w; x++) {
    const c = word.get(x, y);
    if (!c) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) pm.put(wx + x * 2 + dx, wy + y * 2 + dy, c);
  }
  // medalhão com o emblema da raridade
  const cx = PACK_W / 2 - 0.5, cy = 46, MR = 13;
  for (let y = -MR - 1; y <= MR + 1; y++) for (let x = -MR - 1; x <= MR + 1; x++) {
    const d = Math.hypot(x, y);
    if (d > MR + 0.5) continue;
    const c = d > MR - 1 ? R.line : d > MR - 2.5 ? mix(R.hi, WHITE, 0.4) : mix(R.dark, BLACK, 0.15 - (y / MR) * 0.1);
    pm.put(Math.round(cx + x), Math.round(cy + y), c);
  }
  emblem(pm, rarity, cx, cy, { hi: WHITE, base: mix(R.hi, WHITE, 0.3), dark: R.line });
  // nome da raridade embaixo, numa faixa
  const tw = textWidth(label), ty = 64;
  pm.rect(Math.round(PACK_W / 2 - tw / 2) - 3, ty - 2, tw + 6, 11, R.line);
  pm.rect(Math.round(PACK_W / 2 - tw / 2) - 2, ty - 1, tw + 4, 9, mix(R.dark, BLACK, 0.2));
  drawText(pm, label, Math.round(PACK_W / 2 - tw / 2), ty, { fill: WHITE, fillBottom: R.hi });
  // brilhos (Lendário para cima: mais e maiores)
  const sparks = rank >= 4 ? 6 : rank >= 2 ? 3 : 0;
  for (let i = 0; i < sparks; i++) {
    const sx = 6 + Math.floor(hash(i, rank, 3) * (PACK_W - 12)), sy = 16 + Math.floor(hash(i, rank, 9) * 50);
    if (Math.hypot(sx - cx, sy - cy) < MR + 3 || (sy > ty - 5 && sy < ty + 12)) continue;
    pm.put(sx, sy, WHITE); pm.put(sx - 1, sy, R.hi); pm.put(sx + 1, sy, R.hi); pm.put(sx, sy - 1, R.hi); pm.put(sx, sy + 1, R.hi);
  }
  return pm;
}
