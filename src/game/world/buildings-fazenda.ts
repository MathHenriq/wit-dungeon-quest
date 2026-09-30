// Prédios, objetos, plantações e bichos da Fazenda do Vale, desenhados em hd
// por código (hd-kit): celeiro, silo, galinheiro, estufa, moinho (pás girando),
// poço, barraca de sementes, caixa de envio, espantalho, fardos de feno; a terra
// arada (seca e molhada), cada planta em cada estágio e galinha, vaca e ovelha.
import type { Building } from './buildings';
import { Art, darken, hdBuilding, hdProp, INK, lighten, T2 } from './hd-kit';
import { hash, hex, mix, Pixmap, type RGB } from './pixmap';
import { LED } from './palette';
import { withHd } from './zone';
import { mirrored, worldArt } from './art-override';
import { CROP_STAGES } from './art-list';

const WOOD = hex('#9a6a3e');
const WOOD_DARK = hex('#6a4426');

/** Celeiro vermelho: telhado de duas quedas, portão grande com X, janela do feno. */
export function barn(): Building {
  return hdBuilding('celeiro', 'Celeiro', 6, 4, 3, [2, 3], a => {
    const W = a.W, H = a.H, cx = W / 2;
    const wallTop = 96, base = H - 8;
    const red = hex('#c8423a');
    a.vplanks(8, wallTop, W - 16, base - wallTop, red, 7, 3);
    for (const x of [8, W - 14]) { a.rect(x, wallTop, 6, base - wallTop, hex('#f4ece0')); a.vline(x + 5, wallTop, base - wallTop, hex('#b8b0a4')); }
    a.stones(6, base, W - 12, 6, hex('#a8a4a0'));
    // telhado (duas quedas) e o frontão vermelho na frente
    a.eave(2, wallTop + 4, W - 4, hex('#f4ece0'));
    const gTop = 22, gBot = wallTop + 4;
    const halfAt = (y: number) => Math.round(8 + ((y - gTop) / (gBot - gTop)) * 52);
    a.shingles(2, 14, W - 4, wallTop - 10, hex('#5a5a6e'), { row: 7, tile: 12, inset: dy => Math.max(0, 30 - dy) * 0.9, seed: 5 });
    for (let y = gTop; y < gBot; y++) {
      const h = halfAt(y);
      for (let x = Math.round(cx - h); x < Math.round(cx + h); x++) {
        const k = Math.floor((x - (cx - 60)) / 7), inCol = (x - (cx - 60)) % 7;
        const tone = (hash(k, 11, 8) - 0.5) * 0.14;
        let c = tone > 0 ? lighten(red, tone) : darken(red, -tone);
        if (inCol === 0) c = lighten(c, 0.14); else if (inCol === 6) c = darken(c, 0.3);
        a.px(x, y, c);
      }
      for (let t = 0; t < 5; t++) { a.px(Math.round(cx - h - 5 + t), y, t < 2 ? hex('#f8f2e8') : hex('#d8d0c4')); a.px(Math.round(cx + h + 4 - t), y, t < 2 ? hex('#e8e0d4') : hex('#c8c0b4')); }
    }
    // janela do feno com palha saindo
    const hx = cx - 12, hy = gTop + 26;
    a.rect(hx - 2, hy - 2, 28, 24, hex('#f4ece0'));
    a.rect(hx, hy, 24, 20, hex('#3a2418'));
    for (let k = 0; k < 24; k++) { const hh = 6 + Math.floor(hash(k, 3, 7) * 7); a.rect(hx + k, hy + 20 - hh, 1, hh, k % 3 ? hex('#e8c860') : hex('#c8a040')); }
    a.hline(hx - 2, hy + 10, 28, hex('#f4ece0'));
    // cata-vento de galo
    a.rect(cx - 1, 2, 2, 14, hex('#3a3440'));
    a.rect(cx - 6, 4, 10, 4, hex('#3a3440')); a.rect(cx + 2, 1, 3, 4, hex('#3a3440')); a.px(cx + 5, 2, hex('#e84a3a'));
    // portão duplo com X
    const dw = 56, dh = 50, dx = cx - dw / 2, dy = base - dh;
    a.rect(dx - 3, dy - 3, dw + 6, dh + 3, hex('#f4ece0'));
    a.vplanks(dx, dy, dw, dh, darken(red, 0.12), 7, 4);
    for (const [x0, x1] of [[dx, dx + dw / 2], [dx + dw / 2, dx + dw]]) {
      for (let k = 0; k < dh; k++) {
        const t = k / dh;
        a.rect(Math.round(x0 + t * (x1 - x0 - 3)), dy + k, 3, 1, hex('#f4ece0'));
        a.rect(Math.round(x1 - 3 - t * (x1 - x0 - 3)), dy + k, 3, 1, hex('#f4ece0'));
      }
      a.rect(x0, dy, 3, dh, hex('#f4ece0')); a.rect(x1 - 3, dy, 3, dh, hex('#f4ece0'));
      a.rect(x0, dy, x1 - x0, 3, hex('#f4ece0')); a.rect(x0, dy + dh / 2 - 1, x1 - x0, 3, hex('#f4ece0'));
    }
    a.vline(cx, dy, dh, darken(red, 0.5));
    a.rect(dx - 5, base, dw + 10, 2, hex('#b8a888'));
    // lampião
    a.rect(dx + dw + 6, dy + 6, 4, 6, hex('#3a3440')); a.rect(dx + dw + 7, dy + 7, 2, 4, hex('#ffd060'));
    a.glow(dx + dw + 6, dy + 6, 4, 6, LED.warmSoft);
    // janelas laterais
    a.window(24, wallTop + 18, 20, 18, { frame: hex('#f4ece0') });
    a.window(W - 44, wallTop + 18, 20, 18, { frame: hex('#f4ece0') });
    a.ink();
    return { glow: [{ x: (dx + dw + 8) / 2, y: (dy + 9) / 2, r: 28, color: LED.warm, k: 0.3 }] };
  });
}

/** Silo: cilindro de metal com faixas e cúpula. */
export function silo(): Building {
  return hdBuilding('silo', 'Silo', 2, 2, 4, [], a => {
    const W = a.W, H = a.H, cx = W / 2;
    const top = 26, bottom = H - 6, r = 26;
    for (let y = top; y < bottom; y++) for (let x = -r; x < r; x++) {
      const s = (x + r) / (2 * r);
      let c = hex('#c8ccd4');
      c = s < 0.25 ? lighten(c, 0.25) : s > 0.7 ? darken(c, 0.25 + (s - 0.7)) : c;
      if ((y - top) % 18 < 2) c = darken(c, 0.2);
      a.px(cx + x, y, c);
    }
    for (let y = 0; y < 22; y++) {
      const half = Math.round(Math.sqrt(1 - Math.pow((22 - y) / 22, 2)) * (r + 1));
      for (let x = -half; x < half; x++) a.px(cx + x, top - 22 + y + 2, x < -half / 3 ? hex('#e8484a') : x > half / 2 ? hex('#a02a2a') : hex('#c83a3a'));
    }
    a.rect(cx - 3, top - 24, 6, 4, hex('#a02a2a'));
    // escada
    for (let y = top + 8; y < bottom - 4; y += 5) a.hline(cx + 10, y, 7, hex('#6a6a78'));
    a.vline(cx + 10, top + 6, bottom - top - 8, hex('#6a6a78')); a.vline(cx + 16, top + 6, bottom - top - 8, hex('#6a6a78'));
    a.rect(cx - r, bottom, 2 * r, 5, hex('#a8a4a0'));
    a.ink();
  });
}

/** Galinheiro de madeira com rampinha e janelinha redonda. */
export function coop(): Building {
  return hdBuilding('galinheiro', 'Galinheiro', 4, 3, 1, [1], a => {
    const W = a.W, H = a.H;
    const wallTop = 52, base = H - 6;
    a.planks(6, wallTop, W - 12, base - wallTop, hex('#e8c890'), 6, 6);
    a.stones(4, base, W - 8, 5, hex('#a8a4a0'));
    a.shingles(0, 8, W, wallTop - 4, hex('#d86a3a'), { row: 7, tile: 10, inset: dy => Math.max(0, 16 - dy) * 0.8, round: true, seed: 3 });
    a.eave(0, wallTop + 2, W, hex('#f4ece0'));
    // portinha com rampa
    const cx = 48;
    a.door(cx, base, 16, 26, { color: hex('#9a5a2e'), lamp: false });
    for (let k = 0; k < 6; k++) a.rect(cx - 8 - k, base - 1 + (k >> 1), 22, 1, darken(WOOD, k * 0.05));
    // janelinha redonda
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
      const d = Math.hypot(x, y);
      if (d <= 6) a.px(W - 36 + x, wallTop + 22 + y, d > 4.5 ? WOOD_DARK : y < 0 ? hex('#aee0f4') : hex('#6ab0d8'));
    }
    a.glow(W - 40, wallTop + 18, 8, 8, LED.warm);
    // palha na frente e um ovo
    for (let k = 0; k < 30; k++) a.px(8 + Math.floor(hash(k, 1, 5) * (W - 16)), base - 2 - Math.floor(hash(k, 2, 5) * 3), hex('#e8c860'));
    a.rect(W - 22, base - 5, 4, 5, hex('#fff8ec')); a.px(W - 21, base - 5, hex('#ffffff'));
    a.ink();
  });
}

/** Estufa de vidro com as plantas aparecendo lá dentro. */
export function greenhouse(): Building {
  return hdBuilding('estufa', 'Estufa', 6, 3, 2, [3], a => {
    const W = a.W, H = a.H;
    const base = H - 6, wallTop = 70;
    // telhado de vidro (duas águas vistas de cima)
    for (let y = 10; y < wallTop; y++) {
      const t = (y - 10) / (wallTop - 10), ins = Math.round((1 - t) * 18);
      for (let x = 4 + ins; x < W - 4 - ins; x++) {
        const pane = (x - 4) % 16 === 0 || (y - 10) % 14 === 0;
        a.px(x, y, pane ? hex('#e8f0f0') : mix(hex('#b8e8e0'), hex('#78c0b8'), t));
      }
      // reflexo
      a.px(4 + ins + Math.round((y * 1.3) % (W - 8 - 2 * ins)), y, hex('#f0fcff'));
    }
    a.rect(W / 2 - 1, 10, 2, wallTop - 10, hex('#e8f0f0'));
    // paredes de vidro com plantas
    a.glassWall(6, wallTop, W - 12, base - wallTop, { tint: hex('#8ad0c0'), frame: hex('#e8f0f0'), pane: [14, 14], seed: 9, lit: hex('#c0ffb0') });
    for (let k = 0; k < 26; k++) {
      const x = 10 + Math.floor(hash(k, 1, 3) * (W - 20)), y = wallTop + 20 + Math.floor(hash(k, 2, 3) * (base - wallTop - 26));
      a.rect(x, y, 3, 3, hash(k, 3, 3) > 0.7 ? hex('#f06a8a') : hex('#3a9a4a'));
      a.px(x + 1, y - 1, hex('#5ac46a'));
    }
    a.rect(4, base, W - 8, 5, hex('#b8b8c0'));
    a.door(W / 2 + 16, base, 18, 30, { color: hex('#dfe8ee'), glass: true, lamp: false, step: hex('#b8b8c0') });
    a.ink(hex('#3a4a4a'));
  });
}

/** Moinho de vento: torre de pedra e madeira com as pás (quadros girando). */
export function windmill(): Building {
  const frames = [0, 1, 2, 3].map(f => windmillArt(f));
  const b = frames[0];
  return { ...b, frames: frames.map(x => x.pix), nightFrames: frames.map(x => x.night!) };
}

function windmillArt(f: number): Building {
  return hdBuilding('moinho', 'Moinho', 3, 3, 4, [1], a => {
    const W = a.W, H = a.H, cx = W / 2, base = H - 6;
    // torre afinando
    const top = 92;
    for (let y = top; y < base; y++) {
      const t = (y - top) / (base - top), half = Math.round(20 + t * 14);
      for (let x = -half; x < half; x++) {
        const s = (x + half) / (2 * half);
        let c = hex('#e8e0d0');
        if ((y - top) % 9 === 0 || (x + half + (Math.floor((y - top) / 9) % 2) * 6) % 12 === 0) c = hex('#c8c0b0');
        c = s < 0.25 ? lighten(c, 0.12) : s > 0.72 ? darken(c, 0.2) : c;
        a.px(cx + x, y, c);
      }
    }
    // telhado cônico
    for (let y = 0; y < 26; y++) { const half = Math.round(4 + y * 0.95); a.rect(cx - half, top - 26 + y, half * 2, 1, mix(hex('#8a4a2a'), hex('#5a2e1a'), y / 26)); }
    a.door(cx, base, 14, 22, { color: hex('#8a5a2e'), lamp: false });
    a.window(cx - 5, top + 18, 10, 10, { cross: true, sill: false, frame: hex('#8a5a2e') });
    // pás (4, girando 22,5° por quadro), com o eixo na frente do telhado
    const hx = cx, hy = top - 10;
    for (let k = 0; k < 4; k++) {
      const ang = (k * Math.PI) / 2 + (f * Math.PI) / 8;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      for (let r = 4; r < 70; r++) {
        const px = hx + dx * r, py = hy + dy * r;
        a.px(Math.round(px), Math.round(py), WOOD_DARK);
        // lona da pá (de um lado da vara)
        if (r > 16) for (let w = 1; w < 13; w++) {
          const qx = px - dy * w, qy = py + dx * w;
          const grid = (r % 7 === 0) || w === 12;
          a.px(Math.round(qx), Math.round(qy), grid ? hex('#9a7a5a') : w < 3 ? hex('#fff8ec') : hex('#e8dcc8'));
        }
      }
    }
    a.rect(hx - 3, hy - 3, 6, 6, hex('#5a3a22'));
    a.ink();
  });
}

/** Poço de pedra com telhadinho e balde. */
export function well(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(32, 40, a => {
    a.stones(8, 50, 48, 24, hex('#a8a4b0'));
    a.rect(12, 46, 40, 6, hex('#3a4a6a')); a.hline(14, 47, 36, hex('#5a7aa8'));
    a.rect(10, 18, 4, 34, WOOD_DARK); a.rect(50, 18, 4, 34, WOOD_DARK);
    for (let y = 0; y < 14; y++) { const half = 12 + y * 1.6; a.rect(Math.round(32 - half), 6 + y, Math.round(half * 2), 1, mix(hex('#c8563a'), hex('#8a3a28'), y / 14)); }
    a.rect(16, 26, 32, 3, WOOD);
    a.vline(32, 28, 12, hex('#d8cfa8'));
    a.rect(28, 38, 9, 7, hex('#8a8a96')); a.hline(28, 38, 9, hex('#c0c0cc'));
  });
}

/** Barraca de sementes: balcão com os pacotinhos, toldo verde. */
export function seedStall(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(48, 38, a => {
    const W = a.W, H = a.H;
    a.planks(4, 42, W - 8, H - 46, hex('#b8844e'), 5);
    a.rect(2, 38, W - 4, 5, hex('#8a5a30'));
    const packs = [hex('#f08a3a'), hex('#e84a4a'), hex('#f0d040'), hex('#6ac46a'), hex('#f07aa8'), hex('#d8a030'), hex('#8a6ae0')];
    for (let k = 0; k < 7; k++) {
      const x = 7 + k * 12;
      a.rect(x, 28, 9, 11, hex('#f4ece0')); a.rect(x + 1, 30, 7, 5, packs[k]); a.hline(x, 28, 9, hex('#ffffff'));
    }
    a.rect(6, 12, 3, 30, WOOD_DARK); a.rect(W - 9, 12, 3, 30, WOOD_DARK);
    a.awning(2, 6, W - 4, 10, hex('#4aa04a'), hex('#f8f4ec'), 6);
    a.sign(W / 2, 17, 'SEMENTES', { bg: hex('#3a7a3a'), pad: 2 });
    // sacos de terra do lado
    a.rect(W - 18, H - 16, 12, 12, hex('#c8a870')); a.hline(W - 18, H - 16, 12, hex('#e8d0a0'));
  });
}

/** Caixa de envio: baú de madeira com tampa aberta. */
export function shippingBin(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(32, 20, a => {
    a.planks(4, 18, 56, 20, hex('#a8703e'), 5);
    a.rect(2, 12, 60, 8, hex('#8a5a30')); a.hline(2, 12, 60, hex('#c8945a'));
    a.rect(2, 4, 60, 8, hex('#b8844e')); a.hline(2, 4, 60, hex('#e8b880'));
    for (const x of [4, 56]) a.rect(x, 18, 4, 20, hex('#6a6a78'));
    a.rect(28, 20, 8, 6, hex('#e8c040'));
    // cenoura e ovo aparecendo
    a.rect(14, 14, 3, 5, hex('#f08a3a')); a.rect(14, 12, 3, 2, hex('#4aa04a'));
    a.rect(40, 14, 4, 5, hex('#fff8ec'));
  });
}

/** Espantalho de chapéu de palha. */
export function scarecrow(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 28, a => {
    a.rect(15, 18, 3, 38, WOOD_DARK);
    a.rect(4, 26, 24, 3, WOOD_DARK);
    a.rect(8, 24, 16, 16, hex('#4a78c8')); a.rect(8, 24, 16, 2, hex('#6a98e8'));
    a.rect(10, 30, 4, 4, hex('#e8a040'));
    for (let k = 0; k < 5; k++) { a.px(4 + k, 28 + (k & 1), hex('#e8c860')); a.px(24 + k, 28 + (k & 1), hex('#e8c860')); }
    a.rect(10, 12, 12, 12, hex('#e8d8a8'));
    a.px(13, 16, INK); a.px(18, 16, INK); a.hline(13, 20, 6, hex('#8a5a30'));
    a.rect(4, 10, 24, 3, hex('#d8b050')); a.rect(9, 4, 14, 7, hex('#e8c060')); a.hline(9, 8, 14, hex('#c84a3a'));
  });
}

/** Fardo de feno. */
export function hayBale(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 12, a => {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 28; x++) {
      const c = y < 6 ? hex('#f0d878') : hash(x, y, 3) > 0.6 ? hex('#c8a040') : hex('#e0c060');
      a.px(2 + x, 4 + y, c);
    }
    a.rect(9, 4, 2, 20, hex('#a8703e')); a.rect(21, 4, 2, 20, hex('#a8703e'));
  });
}

// ─────────────────────────── plantações ───────────────────────────

export type CropArtId = 'cenoura' | 'tomate' | 'milho' | 'morango' | 'abobora' | 'girassol' | 'alface';

/** Terra arada (seca ou molhada), um bloco em hd, com os sulcos. */
export function soilArt(wet: boolean): Pixmap {
  const gpt = worldArt(wet ? 'terra-molhada' : 'terra-seca');
  if (gpt) return gpt.pix;
  const a = new Art(T2, T2);
  const base = wet ? hex('#6a4428') : hex('#a8784a');
  for (let y = 1; y < T2 - 1; y++) for (let x = 1; x < T2 - 1; x++) {
    const furrow = (y % 8) < 2;
    const n = hash(x, y, wet ? 3 : 1) - 0.5;
    let c = furrow ? darken(base, 0.22) : (y % 8) === 2 ? lighten(base, 0.14) : base;
    c = n > 0.3 ? lighten(c, 0.08) : n < -0.35 ? darken(c, 0.1) : c;
    a.px(x, y, c);
  }
  // borda arredondada
  for (const [x, y] of [[1, 1], [T2 - 2, 1], [1, T2 - 2], [T2 - 2, T2 - 2]]) a.pm.put(x, y, null as unknown as RGB);
  a.pm.outline(wet ? hex('#4a2e1a') : hex('#7a5430'));
  return withHd(a.pm);
}

/**
 * Planta no estágio `stage` de `last` (o último é a colheita). Em hd, com a
 * base no pé do bloco; pode passar da altura do bloco (milho, girassol).
 */
export function cropArt(id: CropArtId, stage: number, last: number): Pixmap {
  // arte do GPT: 5 estágios desenhados, esticados sobre os dias da planta
  const gpt = worldArt(`planta-${id}-${Math.round((stage / Math.max(1, last)) * (CROP_STAGES - 1))}`);
  if (gpt) return gpt.pix;
  const tall = id === 'milho' || id === 'girassol';
  const H = tall ? T2 * 2 : T2 + 16;
  const a = new Art(T2, H);
  const leaf = hex('#4aa84a'), leafD = hex('#2e7a3a'), leafL = hex('#7ad06a');
  const cx = T2 / 2, by = H - 6;
  const t = stage / last;
  if (stage === 0) {
    // sementinhas na terra
    for (const [dx, dy] of [[-4, 0], [3, -1], [0, 2]]) { a.rect(cx + dx, by + dy - 2, 2, 2, hex('#e8d0a0')); a.px(cx + dx, by + dy - 2, hex('#fff0c8')); }
    return withHd(a.pm);
  }
  const blade = (x0: number, len: number, lean: number, c: RGB) => {
    for (let k = 0; k < len; k++) { a.px(Math.round(x0 + lean * k), by - k, c); if (k < len * 0.6) a.px(Math.round(x0 + lean * k) + 1, by - k, darken(c, 0.2)); }
  };
  const leafBlob = (x: number, y: number, r: number, c: RGB) => {
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (Math.hypot(xx, yy * 1.3) <= r) a.px(x + xx, y + yy, yy < 0 ? lighten(c, 0.15) : c);
  };
  // folhagem cheia: vários círculos de folha, claro em cima e escuro embaixo
  const bush = (x: number, y: number, w: number, h: number, seed: number) => {
    const n = Math.max(3, Math.round((w * h) / 18));
    for (let k = 0; k < n; k++) {
      const px = x + (hash(seed, k, 1) - 0.5) * w, py = y - hash(seed, k, 2) * h;
      const r = 2.5 + hash(seed, k, 3) * 2.5;
      leafBlob(Math.round(px), Math.round(py), Math.round(r), k % 3 === 0 ? leafD : k % 3 === 1 ? leaf : leafL);
    }
  };
  const stalk = (h: number, w = 2) => { for (let k = 0; k < h; k++) { a.rect(cx - (w >> 1), by - k, w, 1, leafD); a.px(cx - (w >> 1), by - k, leaf); } };
  if (stage === 1) { blade(cx - 2, 7, -0.5, leaf); blade(cx, 8, 0, leafL); blade(cx + 2, 7, 0.5, leaf); return done(a); }
  switch (id) {
    case 'cenoura': {
      const h = Math.round(7 + t * 9);
      for (let k = 0; k < 7; k++) {
        const lean = (k - 3) * 0.28;
        blade(cx - 3 + k, h - Math.abs(k - 3), lean, k % 2 ? leaf : leafL);
        // folhinhas recortadas na ponta
        const tx = Math.round(cx - 3 + k + lean * (h - Math.abs(k - 3))), ty = by - (h - Math.abs(k - 3));
        leafBlob(tx, ty, 2, k % 2 ? leafL : leaf);
      }
      if (stage === last) { a.rect(cx - 4, by - 3, 9, 5, hex('#f08a3a')); a.hline(cx - 4, by - 3, 9, hex('#ffb870')); a.px(cx - 2, by - 1, hex('#c86a2a')); }
      break;
    }
    case 'alface': {
      const r = Math.round(4 + t * 7);
      for (let ring = 0; ring < 3; ring++) for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2 + ring * 0.5, rr = r * (1 - ring * 0.3);
        leafBlob(Math.round(cx + Math.cos(ang) * rr * 0.6), Math.round(by - r + Math.sin(ang) * rr * 0.4), Math.max(2, Math.round(rr * 0.5)), ring === 2 ? hex('#b8f080') : ring === 1 ? leafL : leaf);
      }
      break;
    }
    case 'morango': {
      bush(cx, by - 2, 16 + t * 6, 4 + t * 6, 11);
      if (stage >= last - 1) for (const [dx, dy] of [[-7, -3], [6, -4], [0, -2], [-3, -8], [4, -9]]) {
        const c = stage === last ? hex('#e83a4a') : hex('#e8e0a0');
        a.rect(cx + dx - 1, by + dy, 4, 4, c); a.rect(cx + dx, by + dy + 4, 2, 1, c);
        a.px(cx + dx, by + dy + 1, hex('#fff0c0')); a.rect(cx + dx, by + dy - 1, 2, 1, leafL);
      }
      break;
    }
    case 'tomate': {
      const h = Math.round(8 + t * 18);
      a.rect(cx + 8, by - h - 2, 2, h + 2, WOOD); a.px(cx + 8, by - h - 2, lighten(WOOD, 0.3));   // estaca
      stalk(h);
      bush(cx, by - 3, 16, h, 21);
      if (stage >= last - 1) for (const [dx, dy] of [[-5, -8], [4, -12], [-3, -17], [5, -5], [0, -21]]) {
        if (-dy > h + 2) continue;
        leafBlob(cx + dx, by + dy, 3, stage === last ? hex('#e84a3a') : hex('#9ad04a'));
        a.px(cx + dx - 1, by + dy - 1, hex('#fff0e0')); a.px(cx + dx, by + dy - 3, leafD);
      }
      break;
    }
    case 'milho': {
      const h = Math.round(10 + t * 40);
      stalk(h, 3);
      // folhas compridas arqueadas dos dois lados
      for (let k = 5, side = 1; k < h - 4; k += 6, side = -side) {
        for (let q = 0; q < 13; q++) {
          const x = Math.round(cx + side * (1 + q)), y = by - k - Math.round(Math.sin((q / 13) * Math.PI) * 5) + Math.round(q * 0.35);
          a.px(x, y, q < 4 ? leafD : q < 9 ? leaf : leafL); a.px(x, y + 1, leafD);
        }
      }
      if (stage === last) for (const dx of [-4, 4]) {
        a.rect(cx + dx - 2, by - h + 16, 5, 12, hex('#f0d040'));
        for (let y = 0; y < 12; y += 2) a.hline(cx + dx - 2, by - h + 16 + y, 5, hex('#e0b830'));
        a.px(cx + dx - 1, by - h + 16, hex('#fff8a0'));
        a.rect(cx + dx - 2, by - h + 26, 5, 4, leaf); a.px(cx + dx, by - h + 14, hex('#c8a060'));
      }
      if (stage >= last - 1) for (let q = -3; q <= 3; q++) { a.px(cx + q, by - h - Math.abs(q % 2), hex('#e8c860')); a.px(cx + q, by - h + 1, hex('#c8a040')); }
      break;
    }
    case 'abobora': {
      const r = Math.round(3 + t * 5);
      for (let k = 0; k < 4; k++) leafBlob(cx - 10 + k * 7, by - 3 - (k % 2) * 4, Math.max(2, r - 1), k % 2 ? leaf : leafD);
      for (let q = 0; q < 26; q++) a.px(cx - 13 + q, by - 1 + Math.round(Math.sin(q * 0.6)), leafD);   // rama
      if (stage >= last - 1) {
        const pr = stage === last ? 8 : 4, pc = stage === last ? hex('#f08a2a') : hex('#8ac04a');
        for (let yy = -pr; yy <= pr; yy++) for (let xx = -pr - 2; xx <= pr + 2; xx++) {
          if (Math.hypot(xx / (pr + 2), yy / pr) > 1) continue;
          const rib = Math.abs(xx) % 4 === 0;
          a.px(cx + xx, by - pr + yy, rib ? darken(pc, 0.2) : yy < -pr / 3 ? lighten(pc, 0.2) : pc);
        }
        a.rect(cx - 1, by - 2 * pr - 3, 3, 4, hex('#6a4a2a'));
      }
      break;
    }
    case 'girassol': {
      const h = Math.round(10 + t * 36);
      stalk(h, 3);
      for (let k = 8, side = 1; k < h - 6; k += 8, side = -side) { leafBlob(cx + side * 5, by - k, 4, leaf); leafBlob(cx + side * 7, by - k + 1, 2, leafL); }
      if (stage >= last - 1) {
        const fy = by - h, open = stage === last;
        const pr = open ? 9 : 4;
        for (let q = 0; q < 14; q++) { const ang = (q / 14) * Math.PI * 2; leafBlob(Math.round(cx + Math.cos(ang) * pr), Math.round(fy + Math.sin(ang) * pr * 0.9), open ? 3 : 2, open ? (q % 2 ? hex('#ffd030') : hex('#f8b820')) : hex('#9ad04a')); }
        leafBlob(cx, fy, open ? 6 : 3, hex('#7a4a1a'));
        if (open) for (let q = 0; q < 6; q++) a.px(cx - 3 + Math.floor(hash(q, 1, 3) * 6), fy - 3 + Math.floor(hash(q, 2, 3) * 6), hex('#a8703a'));
      }
      break;
    }
  }
  return done(a);
}

function done(a: Art): Pixmap {
  a.pm.outline(hex('#2a4a20'));
  return withHd(a.pm);
}

// ─────────────────────────── bichos ───────────────────────────

/** Galinha (dois quadros: andando e bicando). */
/** Bicho do GPT (um desenho para cada lado): dois quadros iguais, o jogo faz o balanço. */
function gptAnimal(name: string, face: 1 | -1): Pixmap[] | undefined {
  const sp = worldArt(`${name}-${face > 0 ? 'dir' : 'esq'}`) ?? (worldArt(`${name}-esq`) && { pix: mirrored(worldArt(`${name}-esq`)!.pix) });
  return sp ? [sp.pix, sp.pix] : undefined;
}

export function chickenFrames(face: 1 | -1): Pixmap[] {
  const gpt = gptAnimal('galinha', face);
  if (gpt) return gpt;
  return [0, 1].map(f => {
    const a = new Art(24, 24);
    const body = hex('#fbf6ec'), shade = hex('#e0d6c4');
    for (let y = 0; y < 10; y++) for (let x = 0; x < 12; x++) if (Math.hypot((x - 6) / 6, (y - 5) / 5) <= 1) a.px(7 + x, 9 + y, y > 6 ? shade : body);
    a.rect(16, 8, 4, 5, body);   // rabo
    const hy = f === 1 ? 10 : 5;
    a.rect(4, hy, 6, 6, body);
    a.rect(5, hy - 2, 3, 2, hex('#e83a3a'));   // crista
    a.rect(2, hy + 2, 2, 2, hex('#f0a030'));   // bico
    a.px(5, hy + 2, INK);
    a.rect(4, hy + 4, 2, 2, hex('#e83a3a'));
    a.rect(10, 19, 1, 3, hex('#f0a030')); a.rect(14, 19, 1, 3, hex('#f0a030'));
    a.pm.outline(hex('#5a4a3a'));
    return flipIf(a, face);
  });
}

/** Vaca malhada (dois quadros de andar). */
export function cowFrames(face: 1 | -1): Pixmap[] {
  const gpt = gptAnimal('vaca', face);
  if (gpt) return gpt;
  return [0, 1].map(f => {
    const a = new Art(40, 30);
    const white = hex('#fbf8f2'), black = hex('#2e2a36');
    for (let y = 0; y < 14; y++) for (let x = 0; x < 26; x++) {
      const spot = hash(Math.floor(x / 5), Math.floor(y / 4), 7) > 0.62;
      a.px(10 + x, 8 + y, spot ? black : y > 10 ? hex('#e0dcd4') : white);
    }
    // cabeça
    a.rect(2, 5, 10, 10, white); a.rect(2, 11, 8, 5, hex('#f0b0b0'));
    a.px(4, 12, INK); a.px(7, 12, INK); a.px(4, 8, INK); a.px(8, 8, INK);
    a.rect(1, 3, 3, 3, hex('#d8d0c0')); a.rect(10, 3, 3, 3, hex('#d8d0c0'));
    // pernas
    const lift = f === 1 ? 1 : 0;
    for (const [x, l] of [[12, lift], [18, 0], [28, lift], [33, 0]]) a.rect(x, 22 - l, 3, 6, white);
    a.rect(35, 9, 2, 8, black);
    a.rect(20, 21, 5, 3, hex('#f0b0c0'));
    a.pm.outline(hex('#3a3440'));
    return flipIf(a, face);
  });
}

/** Ovelha fofinha (dois quadros). */
export function sheepFrames(face: 1 | -1): Pixmap[] {
  const gpt = gptAnimal('ovelha', face);
  if (gpt) return gpt;
  return [0, 1].map(f => {
    const a = new Art(32, 26);
    for (let k = 0; k < 14; k++) {
      const x = 9 + (k % 5) * 4 + (k > 9 ? 2 : 0), y = 8 + Math.floor(k / 5) * 4;
      for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (Math.hypot(xx, yy) <= 3.2) a.px(x + xx, y + yy, yy < 0 ? hex('#ffffff') : hex('#e8e4dc'));
    }
    a.rect(3, 8, 7, 8, hex('#4a4050')); a.px(5, 11, hex('#ffffff'));
    a.rect(2, 7, 3, 3, hex('#4a4050'));
    const lift = f === 1 ? 1 : 0;
    for (const [x, l] of [[11, lift], [15, 0], [23, lift], [27, 0]]) a.rect(x, 19 - l, 2, 5, hex('#4a4050'));
    a.pm.outline(hex('#5a5060'));
    return flipIf(a, face);
  });
}

function flipIf(a: Art, face: 1 | -1): Pixmap {
  if (face === -1) return withHd(a.pm);
  const b = new Art(a.W, a.H);
  b.pm.blit(a.pm, 0, 0, true);
  return withHd(b.pm);
}

/** Árvore frutífera: a arte da árvore redonda com frutinhas na copa. */
export function fruitTree(tree: Pixmap, fruit: RGB, seed: number): Pixmap {
  const put = (pm: Pixmap, k: number) => {
    const out = new Pixmap(pm.w, pm.h);
    out.data.set(pm.data);
    for (let n = 0; n < 14; n++) {
      const x = Math.floor((0.2 + hash(seed, n, 3) * 0.6) * pm.w), y = Math.floor((0.12 + hash(seed, n, 5) * 0.45) * pm.h);
      const c = out.get(x, y);
      if (!c || c[1] < c[0]) continue;   // só em cima de folha
      for (let yy = 0; yy < 2 * k; yy++) for (let xx = 0; xx < 2 * k; xx++) out.put(x + xx, y + yy, (xx === 0 && yy === 0) ? lighten(fruit, 0.5) : fruit);
      out.put(x + k, y - 1, hex('#3a2a1a'));
    }
    return out;
  };
  const one = put(tree, 1);
  if (tree.hd) one.hd = put(tree.hd, 2);
  return one;
}

export { WOOD };

/** Cerca em pé (linha vertical): mourão com o topo claro e as duas ripas descendo. */
export function fenceV(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 16, a => {
    const c = hex('#c89a62');
    a.rect(13, 0, 2, 32, darken(c, 0.2)); a.rect(18, 0, 2, 32, darken(c, 0.2));
    a.vline(13, 0, 32, lighten(c, 0.1));
    a.rect(11, 8, 10, 18, c); a.rect(11, 8, 10, 3, lighten(c, 0.3)); a.vline(20, 8, 18, darken(c, 0.35));
  });
}

/** Mesa de piquenique com toalha xadrez. */
export function picnicTable(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(32, 20, a => {
    a.rect(4, 8, 56, 5, hex('#a8703e')); a.rect(4, 30, 56, 5, hex('#a8703e'));
    for (let y = 0; y < 14; y++) for (let x = 0; x < 52; x++) a.px(6 + x, 14 + y, (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? hex('#f8f4ec') : hex('#e84a4a'));
    a.rect(10, 34, 4, 5, WOOD_DARK); a.rect(50, 34, 4, 5, WOOD_DARK);
    a.rect(28, 16, 8, 6, hex('#d8a040')); a.rect(40, 20, 5, 4, hex('#e83a4a'));
  });
}

/** Carrinho de mão com terra. */
export function wheelbarrow(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 12, a => {
    for (let y = 0; y < 10; y++) a.rect(4 + y, 6 + y, 22 - y * 1.2, 1, y < 2 ? hex('#6aa0d8') : hex('#4a80b8'));
    a.rect(6, 5, 18, 3, hex('#7a5430'));
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (Math.hypot(x, y) <= 3.2) a.px(10 + x, 19 + y, hex('#3a3440'));
    a.rect(22, 12, 8, 2, WOOD_DARK); a.rect(26, 16, 2, 6, WOOD_DARK);
  });
}
