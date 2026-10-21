// Portão da Masmorra (Centro, ao lado da Arena): um morro de pedra com a boca
// da caverna e o portal azul aceso lá dentro, a entrada da Associação dos
// Caçadores. Desenho em hd por código até a arte do GPT (`portao-masmorra`,
// docs/PROMPTS-GPT.md §Q) chegar: as mesmas medidas, 5 × 5 blocos com a porta
// no bloco do meio.
import type { Building } from './buildings';
import { darken, hdBuilding, lighten } from './hd-kit';
import { hash, hex, mix } from './pixmap';

const STONE_D = hex('#4a4e5c'), STONE_L = hex('#a4a9b8'), MOSS = hex('#5a9e48'), MOSS_L = hex('#8acc5a');
const PORTAL_IN = hex('#0a1a3a'), PORTAL = hex('#2a7aff'), PORTAL_L = hex('#9adcff');

export function dungeonGate(): Building {
  return hdBuilding('masmorra', 'Masmorra', 5, 5, 0, [2], a => {
    const W = a.W, H = a.H, cx = W / 2, base = H - 3;
    // morro: meia elipse de pedras em fileiras desencontradas, luz da esquerda
    const top = 22, rx = W / 2 - 2;
    // contorno de rocha: a meia elipse com calombos (pedras soltas no alto e nos lados)
    const inHill = (x: number, y: number) => {
      if (y > base) return false;
      const nx = (x - cx) / rx, ny = (y - base) / (base - top);
      const bump = (hash(Math.floor((x + 3) / 11), 0, 11) - 0.5) * 0.22 + (hash(Math.floor(y / 9), 1, 12) - 0.5) * 0.08;
      return nx * nx + ny * ny <= 1 + bump;
    };
    for (let y = top; y <= base; y++) for (let x = 0; x < W; x++) {
      if (!inHill(x, y)) continue;
      const row = Math.floor((y - top) / 13), shift = (row % 2) * 9;
      const col = Math.floor((x + shift) / 18), ex = (x + shift) % 18, ey = (y - top) % 13;
      let c = mix(STONE_D, STONE_L, 0.35 + hash(col, row, 4) * 0.45);
      if (ex === 0 || ey === 0) c = darken(c, 0.4);
      else if (ex === 1 || ey === 1) c = lighten(c, 0.18);
      else if (hash(x, y, 7) > 0.92) c = darken(c, 0.1);
      if (x > cx + rx * 0.45) c = darken(c, 0.14);
      else if (x < cx - rx * 0.5) c = lighten(c, 0.06);
      a.px(x, y, c);
    }
    // musgo por cima e escorrendo nas pedras
    for (let x = 0; x < W; x++) for (let y = top; y < top + 40; y++) {
      if (!inHill(x, y) || inHill(x, y - 3)) continue;
      const drip = 3 + Math.floor(hash(x >> 2, 3, 9) * 6);
      for (let k = 0; k < drip; k++) if (inHill(x, y + k)) a.px(x, y + k, k < 2 ? MOSS_L : MOSS);
    }
    // boca da caverna: arco escuro de pedra lavrada
    const mw = 34, mh = 64, my = base - mh;
    for (let y = my - 6; y <= base; y++) for (let x = cx - mw - 6; x <= cx + mw + 6; x++) {
      const dx = (x - cx) / (mw + 6), dy = y < my + mw ? (y - (my + mw)) / (mw + 6) : 0;
      if (dx * dx + dy * dy > 1) continue;
      const lintel = dx * dx + dy * dy > ((mw - 1) / (mw + 6)) ** 2;
      a.px(x, y, lintel ? mix(hex('#3a3e4a'), hex('#8a8fa0'), hash(x >> 2, y >> 2, 2) * 0.7) : PORTAL_IN);
    }
    // o portal: oval de energia azul com espiral e brilho (acende à noite)
    const py = base - 30, prx = mw - 5, pry = 28;
    for (let y = -pry; y <= pry; y++) for (let x = -prx; x <= prx; x++) {
      const d = Math.hypot(x / prx, y / pry);
      if (d > 1) continue;
      const ang = Math.atan2(y, x), swirl = Math.sin(ang * 3 + d * 9);
      let c = mix(PORTAL_IN, PORTAL, Math.max(0, 1 - d) * 0.9 + (swirl > 0.6 ? 0.25 : 0));
      if (d > 0.86) c = d > 0.95 ? PORTAL_L : PORTAL;
      else if (d < 0.25) c = mix(PORTAL, PORTAL_L, 0.6);
      a.px(cx + x, py + y, c);
      if (d > 0.82 || swirl > 0.75 || d < 0.3) a.nt.put(cx + x, py + y, d < 0.3 ? hex('#e0f6ff') : hex('#5ab8ff'));
    }
    // brilhos soltos em volta do portal
    for (let k = 0; k < 14; k++) {
      const x = cx + Math.round((hash(k, 1, 5) - 0.5) * mw * 2.2), y = py + Math.round((hash(k, 2, 5) - 0.5) * pry * 2.4);
      if (!inHill(x, y)) continue;
      a.px(x, y, PORTAL_L); a.nt.put(x, y, hex('#ffffff'));
    }
    // degraus de pedra na entrada
    for (let s = 0; s < 3; s++) {
      const w = mw * 2 + 10 - s * 6, y = base - 2 - s * 3;
      a.rect(cx - w / 2, y, w, 3, s % 2 ? hex('#9aa0b0') : hex('#b8bdca'));
      a.hline(cx - w / 2, y, w, hex('#d8dce6'));
    }
    // tochas dos dois lados do arco
    for (const tx of [cx - mw - 16, cx + mw + 12]) {
      a.rect(tx, base - 34, 4, 22, hex('#5a3a22'));
      a.rect(tx - 2, base - 38, 8, 5, hex('#3a3e4a'));
      a.rect(tx, base - 46, 4, 8, hex('#ffb43a')); a.rect(tx + 1, base - 49, 2, 4, hex('#ffe08a'));
      a.glow(tx - 1, base - 50, 6, 13, hex('#ffcc66'));
    }
    // cristais azuis na pedra
    for (const [x, y] of [[cx - 52, base - 70], [cx + 44, base - 82], [cx - 30, top + 24], [cx + 22, top + 16]]) {
      a.rect(x, y, 4, 8, PORTAL); a.px(x + 1, y + 1, PORTAL_L); a.px(x + 1, y + 2, PORTAL_L);
      a.glow(x, y, 4, 8, hex('#7ac8ff'));
    }
    a.sign(cx, top + 40, 'MASMORRA', { bg: hex('#1a1030'), fg: hex('#bfe8ff'), border: hex('#0a0614'), lit: hex('#5ab8ff') });
    a.ink(hex('#1a1424'));
    return { glow: [{ x: cx / 2, y: py / 2, r: 34, color: [90, 170, 255], k: 0.45 }] };
  });
}
