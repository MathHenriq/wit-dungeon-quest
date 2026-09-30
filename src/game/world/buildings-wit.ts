// Prédios da Cidade WIT (os cursos do Núcleo e as profissões), em hd por
// código (hd-kit): Núcleo WIT, Laboratório de IA, Casa Inteligente (IoT),
// Metaverso, Estúdio de Comunicação, Oficina de Games, Mercado Central,
// Central de Entregas e o telão do Jornal WIT; e os objetos tecnológicos da
// praça (árvore solar, patinetes, fliperama, drone, o robô WIT-Bot).
import type { Building } from './buildings';
import { Art, darken, hdBuilding, hdProp, INK, lighten } from './hd-kit';
import { hash, hex, mix, type Pixmap, type RGB } from './pixmap';
import { LED, WIT } from './palette';
import { withHd } from './zone';
import { mirrored, worldArt } from './art-override';
import { drawText, textWidth } from './font';

const CONCRETE = hex('#e4e8ee');
const LIME = WIT.lime;

/** Faixa de LED que acende à noite (na arte fica um trilho fino). */
function ledStrip(a: Art, x: number, y: number, w: number, c: RGB): void {
  a.hline(x, y, w, mix(c, hex('#ffffff'), 0.3));
  a.hline(x, y + 1, w, darken(c, 0.2));
  a.nt.rect(x, y, w, 2, c);
}

/** Letreiro de LED sobre fundo escuro, com o texto aceso à noite. */
function ledSign(a: Art, cx: number, y: number, text: string, c: RGB, bg = hex('#1e2430')): void {
  a.sign(cx, y, text, { bg, fg: mix(c, hex('#ffffff'), 0.45), border: darken(bg, 0.5), lit: c });
}

/** Bloco de parede moderna: concreto claro com um friso embaixo. */
function concrete(a: Art, x: number, y: number, w: number, h: number, c = CONCRETE): void {
  a.grain(x, y, w, h, c, 0.03, 7);
  a.hline(x, y, w, lighten(c, 0.4));
  a.vline(x, y, h, lighten(c, 0.2));
  a.vline(x + w - 1, y, h, darken(c, 0.25));
  a.hline(x, y + h - 1, w, darken(c, 0.3));
}

/** Telhado plano visto de cima com placas solares e caixas de ar. */
function roofTop(a: Art, x: number, y: number, w: number, h: number, o: { solar?: number; units?: number; seed?: number } = {}): void {
  a.slab(x, y, w, h, hex('#b8bec8'), hex('#8a92a0'));
  const n = o.solar ?? 0;
  for (let k = 0; k < n; k++) {
    const px = x + 8 + k * 20, py = y + 6;
    if (px + 16 > x + w - 6) break;
    a.rect(px, py, 16, 10, hex('#2a3a6a'));
    for (let q = 0; q < 16; q += 4) a.vline(px + q, py, 10, hex('#4a6aa8'));
    a.hline(px, py + 5, 16, hex('#4a6aa8'));
    a.hline(px, py, 16, hex('#8ab0e8'));
  }
  for (let k = 0; k < (o.units ?? 0); k++) {
    const px = x + w - 20 - k * 16, py = y + h - 14;
    a.rect(px, py, 12, 8, hex('#d8dce4')); a.rect(px + 2, py + 2, 8, 4, hex('#7a808c'));
    for (let q = 0; q < 8; q += 2) a.vline(px + 2 + q, py + 2, 4, hex('#5a606c'));
  }
}

/** Jardim no telhado: grama com arbustos, flores e um caminho de placas. */
function roofGarden(a: Art, x: number, y: number, w: number, h: number, seed = 1): void {
  a.grain(x, y, w, h, hex('#6ac46a'), 0.08, seed);
  a.hline(x, y, w, hex('#9ae08a'));
  for (let k = 0; k < (w * h) / 60; k++) {
    const bx = x + 3 + Math.floor(hash(k, 1, seed) * (w - 6)), by = y + 3 + Math.floor(hash(k, 2, seed) * (h - 6));
    const r = 2 + Math.floor(hash(k, 3, seed) * 3);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (Math.hypot(xx, yy) <= r) a.px(bx + xx, by + yy, yy < 0 ? hex('#5ab85a') : hex('#3a8a4a'));
    if (hash(k, 4, seed) > 0.6) a.px(bx, by - 1, [hex('#f06a8a'), hex('#ffd84a'), hex('#ffffff')][k % 3]);
  }
}

/** Letras grandes pintadas no telhado (vistas de cima). */
function roofLetters(a: Art, text: string, cx: number, y: number, c: RGB, k = 3): void {
  const tmp = new Art(textWidth(text) + 2, 9);
  drawText(tmp.pm, text, 1, 1, { fill: c, fillBottom: c, shadow: c });
  const w = tmp.W * k;
  for (let yy = 0; yy < tmp.H; yy++) for (let xx = 0; xx < tmp.W; xx++) {
    const p = tmp.pm.get(xx, yy);
    if (p) a.rect(Math.round(cx - w / 2) + xx * k, y + yy * k, k, k, p);
  }
}

// ─────────────────────────── Núcleo WIT ───────────────────────────
export function nucleoWit(): Building {
  return hdBuilding('nucleo-wit', 'Núcleo WIT', 12, 5, 3, [5, 6], a => {
    const W = a.W, H = a.H, cx = W / 2, base = H - 6;
    const top = 70;
    roofTop(a, 4, 6, W - 8, top - 4, { solar: 4, units: 2 });
    roofGarden(a, 10, 22, 70, top - 30, 3);
    roofGarden(a, W - 80, 22, 70, top - 30, 5);
    roofLetters(a, 'WIT', cx, 22, LIME, 4);
    for (let x = 6; x < W - 6; x += 6) a.rect(x, 4, 2, 4, hex('#dfe6ee'));   // guarda-corpo
    a.hline(4, 4, W - 8, hex('#f4f8fc'));
    // fachada de dois andares: vidro com faixas de concreto
    concrete(a, 6, top, W - 12, base - top);
    for (const [y, h] of [[top + 8, 36], [top + 54, 36], [top + 102, base - top - 108]] as [number, number][]) {
      a.glassWall(14, y, cx - 44, h, { tint: hex('#5aa8d8'), frame: hex('#dfe6ee'), pane: [12, Math.min(h, 18)], seed: y, litShare: 0.3, lit: hex('#f8d890') });
      a.glassWall(cx + 30, y, W - cx - 44, h, { tint: hex('#5aa8d8'), frame: hex('#dfe6ee'), pane: [12, Math.min(h, 18)], seed: y + 3, litShare: 0.3, lit: hex('#f8d890') });
    }
    // pilares verdes entre os vidros e a base escura
    for (const px of [10, 58, 106, cx + 26, W - 108, W - 60, W - 14]) { a.rect(px, top + 6, 4, base - top - 6, darken(LIME, 0.1)); a.vline(px, top + 6, base - top - 6, lighten(LIME, 0.3)); }
    a.rect(6, base - 6, W - 12, 6, hex('#5a606c')); a.hline(6, base - 6, W - 12, hex('#8a92a0'));
    ledStrip(a, 6, top + 2, W - 12, LIME);
    // bloco da entrada, avançando, com a moldura verde WIT
    const ex = cx - 28, ew = 56;
    a.rect(ex - 4, top - 10, ew + 8, base - top + 10, darken(LIME, 0.35));
    a.rect(ex - 2, top - 8, ew + 4, base - top + 8, LIME);
    a.hline(ex - 2, top - 8, ew + 4, lighten(LIME, 0.4));
    a.glassWall(ex + 4, top + 16, ew - 8, base - top - 16, { tint: hex('#8ad0e8'), frame: hex('#f4f8fc'), pane: [12, 16], seed: 11, lit: hex('#fff0c8') });
    ledSign(a, cx, top - 4, 'NUCLEO WIT', LIME);
    a.door(cx, base, 28, 30, { color: hex('#bfe4f0'), glass: true, double: true, lamp: false, step: hex('#c8ccd4') });
    // marquise sobre a porta, com luzes embaixo
    a.rect(cx - 30, base - 42, 60, 6, hex('#f4f8fc')); a.hline(cx - 30, base - 42, 60, hex('#ffffff')); a.hline(cx - 30, base - 37, 60, hex('#8a92a0'));
    for (let k = 0; k < 5; k++) { a.px(cx - 24 + k * 12, base - 36, hex('#fff0c8')); a.nt.rect(cx - 25 + k * 12, base - 36, 3, 1, hex('#fff0c8')); }
    // floreiras e bandeiras
    for (const fx of [ex - 22, ex + ew + 6]) {
      a.rect(fx, base - 10, 16, 10, hex('#8a92a0')); a.hline(fx, base - 10, 16, hex('#c8ccd4'));
      for (let k = 0; k < 14; k++) a.px(fx + 1 + k, base - 11 - (k % 3), k % 4 === 0 ? hex('#f06a8a') : hex('#4aa04a'));
    }
    for (const fx of [16, W - 20]) {
      a.rect(fx, top - 34, 2, 40, hex('#8a92a0'));
      a.rect(fx + 2, top - 34, 12, 8, LIME); a.rect(fx + 2, top - 30, 12, 2, WIT.deep);
    }
    a.ink(hex('#2e3440'));
    return { glow: [{ x: cx / 2, y: (base - 10) / 2, r: 48, color: LED.green, k: 0.35 }] };
  });
}

// ─────────────────────────── Laboratório de IA ───────────────────────────
export function labIA(): Building {
  return hdBuilding('lab-ia', 'Laboratório de IA', 7, 4, 3, [3], a => {
    const W = a.W, H = a.H, cx = W / 2 + 16, base = H - 6, top = 62;
    roofTop(a, 4, 12, W - 8, top - 8, { solar: 0, units: 1 });
    // cúpula de vidro do observatório de dados
    for (let y = 0; y < 26; y++) for (let x = -30; x <= 30; x++) {
      if (Math.hypot(x / 30, (26 - y) / 26) > 1) continue;
      const edge = (x + 40) % 10 === 0 || y % 8 === 0;
      a.px(W - 60 + x, 22 + y, edge ? hex('#dfe8f4') : mix(hex('#8ae0ff'), hex('#3a7ac8'), y / 26));
      if (!edge && hash(x, y, 4) > 0.9) a.nt.put(W - 60 + x, 22 + y, hex('#8ae8ff'));
    }
    // antena "neural": disco com nós ligados
    a.rect(30, 0, 3, 22, hex('#6a7080'));
    for (const [nx, ny] of [[22, 4], [38, 6], [30, -1], [26, 12], [36, 14]] as [number, number][]) {
      a.hline(Math.min(31, nx), ny + 2, Math.abs(nx - 31) + 1, hex('#8ae8ff'));
      a.rect(nx, ny + 1, 3, 3, hex('#4ad0ff')); a.glow(nx, ny + 1, 3, 3, hex('#8ae8ff'));
    }
    concrete(a, 6, top, W - 12, base - top, hex('#dfe4ee'));
    a.glassWall(10, top + 6, W - 20, 34, { tint: hex('#3a6ab8'), frame: hex('#c8d0e0'), pane: [14, 17], seed: 21, lit: hex('#8ae8ff') });
    ledStrip(a, 10, top + 41, W - 20, hex('#4ad0ff'));
    ledStrip(a, 6, top + 2, W - 12, hex('#4ad0ff'));
    // cérebro de circuito na placa
    const sx = 22, sy = top + 46;
    a.rect(sx, sy, 30, 22, hex('#1e2a40'));
    for (let y = 0; y < 16; y++) for (let x = 0; x < 24; x++) {
      const d = Math.hypot((x - 12) / 12, (y - 8) / 8);
      if (d > 1) continue;
      const line = (x + y) % 5 === 0 || x === 12;
      a.px(sx + 3 + x, sy + 3 + y, line ? hex('#8ae8ff') : hex('#e87aa8'));
      if (line) a.nt.put(sx + 3 + x, sy + 3 + y, hex('#8ae8ff'));
    }
    ledSign(a, cx + 30, top + 48, 'LAB IA', hex('#4ad0ff'));
    a.glassWall(10, base - 34, cx - 26, 28, { tint: hex('#3a6ab8'), frame: hex('#c8d0e0'), pane: [14, 28], seed: 23, lit: hex('#8ae8ff') });
    a.glassWall(cx + 16, base - 34, W - cx - 26, 28, { tint: hex('#3a6ab8'), frame: hex('#c8d0e0'), pane: [14, 28], seed: 25, lit: hex('#8ae8ff') });
    a.door(cx, base, 20, 28, { color: hex('#9ad4ee'), glass: true, lamp: false, step: hex('#c8ccd4') });
    a.rect(cx - 16, base - 36, 32, 4, hex('#4ad0ff')); a.nt.rect(cx - 16, base - 33, 32, 1, hex('#8ae8ff'));
    a.rect(6, base - 4, W - 12, 4, hex('#5a606c'));
    a.ink(hex('#2a3040'));
  });
}

// ─────────────────────────── Casa Inteligente (IoT) ───────────────────────────
export function casaInteligente(): Building {
  return hdBuilding('casa-iot', 'Casa Inteligente', 6, 3, 3, [3], a => {
    const W = a.W, H = a.H, base = H - 6, wallTop = 72;
    // telhado inclinado coberto de placas solares
    for (let y = 18; y < wallTop; y++) {
      const t = (y - 18) / (wallTop - 18), ins = Math.round((1 - t) * 14);
      for (let x = 4 + ins; x < W - 4 - ins; x++) {
        const cell = (x - 4) % 12 === 0 || (y - 18) % 9 === 0;
        a.px(x, y, cell ? hex('#8ab0e8') : mix(hex('#2a4a8a'), hex('#1a2a5a'), t));
      }
      a.px(4 + ins + Math.round((y * 1.7) % Math.max(1, W - 8 - 2 * ins)), y, hex('#c8e0ff'));
    }
    a.eave(2, wallTop, W - 4, hex('#f4f8fc'));
    ledStrip(a, 4, wallTop + 3, W - 8, hex('#8ae8ff'));
    concrete(a, 8, wallTop + 5, W - 16, base - wallTop - 5, hex('#f4f6f8'));
    a.window(20, wallTop + 18, 26, 22, { frame: hex('#3a4050'), cross: false, lit: hex('#c8f0ff') });
    a.window(W - 46, wallTop + 18, 26, 22, { frame: hex('#3a4050'), cross: false, lit: hex('#c8f0ff') });
    a.door(W / 2 + 16, base, 18, 30, { color: hex('#3a4050'), glass: true, lamp: false, step: hex('#c8ccd4') });
    // sensor, câmera e fechadura digital (luzinhas)
    for (const [x, y, c] of [[W / 2 + 30, base - 24, hex('#4ae88a')], [W / 2 - 4, wallTop + 10, hex('#e84a4a')], [W - 16, wallTop + 12, hex('#4ad0ff')]] as [number, number, RGB][]) {
      a.rect(x, y, 5, 5, hex('#3a4050')); a.px(x + 2, y + 2, c); a.nt.put(x + 2, y + 2, c);
    }
    // turbina eólica pequena
    a.rect(W - 12, 0, 2, 22, hex('#c8ccd4'));
    for (const [dx, dy] of [[-6, -2], [5, -3], [0, 6]]) for (let k = 0; k < 6; k++) a.px(W - 11 + Math.round((dx * k) / 6), 3 + Math.round((dy * k) / 6), hex('#f4f8fc'));
    ledSign(a, W / 2 - 8, wallTop + 44, 'CASA IOT', hex('#4ae88a'));
    a.ink(hex('#2a3040'));
  });
}

// ─────────────────────────── Metaverso ───────────────────────────
export function metaverso(): Building {
  return hdBuilding('metaverso', 'Metaverso', 7, 4, 3, [3], a => {
    const W = a.W, H = a.H, cx = W / 2 + 16, base = H - 6;
    // cúpula geodésica: degradê roxo → ciano, com a grade de hexágonos
    const r = 100, cy0 = base - 4;
    for (let y = 0; y < 150; y++) for (let x = -r; x <= r; x++) {
      const Y = cy0 - y;
      const d = Math.hypot(x / r, y / 150);
      if (d > 1) continue;
      const t = y / 150;
      let c = mix(hex('#6a3ac8'), hex('#3ad0e8'), t);
      const gx = Math.floor((x + 200) / 12), gy = Math.floor((y + ((gx % 2) * 6)) / 12);
      const edge = (x + 200) % 12 === 0 || (y + ((gx % 2) * 6)) % 12 === 0;
      if (edge) c = lighten(c, 0.45);
      else if (hash(gx, gy, 3) > 0.8) c = lighten(c, 0.2);
      if (x < -r * 0.4 && y > 60) c = lighten(c, 0.12);
      a.px(Math.round(W / 2 + x), Y, c);
      if (edge && hash(gx, gy, 5) > 0.5) a.nt.put(Math.round(W / 2 + x), Y, hex('#c8a0ff'));
    }
    // portal de entrada: anel brilhante
    const pcx = cx, py = base - 22;
    for (let y = -22; y <= 22; y++) for (let x = -18; x <= 18; x++) {
      const d = Math.hypot(x / 18, y / 22);
      if (d > 1 || y > 20) continue;
      const ring = d > 0.78;
      a.px(pcx + x, py + y, ring ? (d > 0.9 ? hex('#ffffff') : hex('#ff6ae8')) : mix(hex('#1a0a3a'), hex('#6a3ac8'), 1 - d));
      if (ring) a.nt.put(pcx + x, py + y, hex('#ff8af0'));
      else if (hash(x, y, 9) > 0.93) { a.px(pcx + x, py + y, hex('#ffffff')); a.nt.put(pcx + x, py + y, hex('#ffffff')); }
    }
    a.rect(pcx - 16, base - 1, 32, 3, hex('#c8ccd4'));
    ledSign(a, W / 2, base - 110, 'METAVERSO', hex('#c88aff'), hex('#241040'));
    a.ink(hex('#241040'));
    return { glow: [{ x: pcx / 2, y: py / 2, r: 36, color: [255, 120, 240], k: 0.35 }] };
  });
}

// ─────────────────────────── Estúdio de Comunicação ───────────────────────────
export function estudioComunicacao(): Building {
  return hdBuilding('estudio', 'Estúdio de Comunicação', 6, 4, 3, [2], a => {
    const W = a.W, H = a.H, base = H - 6, top = 60;
    roofTop(a, 4, 14, W - 8, top - 10, { units: 1 });
    // antena de rádio (com a luz vermelha piscando no alto: fx.beacons)
    const tx = W - 30;
    for (let y = 0; y < 30; y++) { const half = Math.max(1, Math.round(y / 6)); a.px(tx - half, y, hex('#c83a3a')); a.px(tx + half, y, hex('#c83a3a')); if (y % 5 === 0) a.hline(tx - half, y, half * 2 + 1, hex('#f4f0ea')); }
    // antena parabólica
    for (let y = -10; y <= 10; y++) for (let x = -12; x <= 12; x++) if (Math.hypot(x / 12, y / 10) <= 1) a.px(40 + x, 26 + y, Math.hypot(x / 12, y / 10) > 0.85 ? hex('#8a92a0') : hex('#e4e8ee'));
    a.rect(39, 26, 3, 16, hex('#6a7080')); a.rect(40, 24, 2, 3, hex('#3a4050'));
    concrete(a, 6, top, W - 12, base - top, hex('#f0ecf4'));
    a.metal(6, top, W - 12, 12, hex('#e84a6a'), 16);
    ledSign(a, W / 2, top + 16, 'ESTUDIO', hex('#ff8aa8'));
    a.glassWall(W / 2 + 6, top + 36, W / 2 - 22, base - top - 40, { tint: hex('#6ab8e8'), pane: [12, 16], seed: 31 });
    a.door(80, base, 20, 28, { color: hex('#3a4050'), glass: true, lamp: false, step: hex('#c8ccd4') });
    // "NO AR" em cima da porta
    a.rect(64, base - 40, 32, 9, hex('#3a0a10'));
    a.rect(66, base - 38, 28, 5, hex('#e83a3a'));
    a.nt.rect(66, base - 38, 28, 5, hex('#ff5a5a'));
    a.hline(70, base - 36, 20, hex('#ffd0d0'));
    a.ink(hex('#2a3040'));
    return { glow: [{ x: 40, y: (base - 36) / 2, r: 22, color: [255, 80, 80], k: 0.3 }] };
  });
}

// ─────────────────────────── Oficina de Games ───────────────────────────
export function oficinaGames(): Building {
  return hdBuilding('oficina-games', 'Oficina de Games', 7, 4, 3, [3], a => {
    const W = a.W, H = a.H, base = H - 6, top = 64, cx = W / 2 + 16;
    roofTop(a, 4, 18, W - 8, top - 14, { units: 1 });
    // controle gigante no telhado (desenho próprio: botões e direcional)
    const gx = W / 2 - 50, gy = 2;
    for (let y = 0; y < 34; y++) for (let x = 0; x < 100; x++) {
      const inBody = (x > 10 && x < 90 && y < 26) || Math.hypot((x - 16) / 16, (y - 18) / 16) <= 1 || Math.hypot((x - 84) / 16, (y - 18) / 16) <= 1;
      if (!inBody) continue;
      a.px(gx + x, gy + y, y < 6 ? hex('#8a6ae8') : y > 22 ? hex('#4a2aa8') : hex('#6a4ad8'));
    }
    a.rect(gx + 12, gy + 12, 12, 4, hex('#2a1a50')); a.rect(gx + 16, gy + 8, 4, 12, hex('#2a1a50'));
    for (const [bx, by, c] of [[76, 9, '#ff5a5a'], [84, 14, '#ffd84a'], [68, 14, '#4ae88a'], [76, 19, '#4ad0ff']] as [number, number, string][]) {
      a.rect(gx + bx, gy + by, 5, 5, hex(c)); a.px(gx + bx + 1, gy + by + 1, hex('#ffffff')); a.nt.rect(gx + bx, gy + by, 5, 5, hex(c));
    }
    a.rect(gx + 42, gy + 12, 7, 3, hex('#2a1a50')); a.rect(gx + 52, gy + 12, 7, 3, hex('#2a1a50'));
    // fachada com faixas de neon
    concrete(a, 6, top, W - 12, base - top, hex('#2a2440'));
    for (const [y, c] of [[top + 4, hex('#ff5ab8')], [top + 10, hex('#4ad0ff')]] as [number, RGB][]) ledStrip(a, 6, y, W - 12, c);
    // pixels piscando na parede
    for (let k = 0; k < 40; k++) {
      const x = 12 + Math.floor(hash(k, 1, 7) * (W - 24)), y = top + 18 + Math.floor(hash(k, 2, 7) * (base - top - 24));
      if (Math.abs(x - cx) < 20) continue;
      const c = [hex('#ff5ab8'), hex('#4ad0ff'), hex('#ffd84a'), hex('#4ae88a')][k % 4];
      a.rect(x, y, 3, 3, darken(c, 0.3)); a.nt.rect(x, y, 3, 3, c);
    }
    ledSign(a, cx - 44, top + 18, 'GAMES', hex('#ffd84a'), hex('#140a28'));
    a.door(cx, base, 22, 30, { color: hex('#6a4ad8'), glass: true, lamp: false, step: hex('#8a92a0') });
    a.ink(hex('#140a28'));
    return { glow: [{ x: cx / 2, y: (base - 12) / 2, r: 36, color: [200, 120, 255], k: 0.3 }] };
  });
}

// ─────────────────────────── Mercado Central ───────────────────────────
export function mercadoCentral(): Building {
  return hdBuilding('mercado', 'Mercado Central', 10, 4, 2, [4, 5], a => {
    const W = a.W, H = a.H, base = H - 6, wallTop = 64, cx = W / 2;
    // telhado de duas águas com claraboia de vidro no meio
    a.shingles(2, 8, W - 4, wallTop - 4, hex('#3a8a6a'), { row: 8, tile: 14, inset: dy => Math.max(0, 20 - dy) * 0.9, seed: 13 });
    a.rect(cx - 50, 12, 100, 18, hex('#dfe8ee'));
    a.glassWall(cx - 48, 14, 96, 14, { tint: hex('#9ad8e8'), frame: hex('#dfe8ee'), pane: [12, 14], seed: 41 });
    a.eave(2, wallTop, W - 4, hex('#f4ece0'));
    a.bricks(8, wallTop + 3, W - 16, base - wallTop - 3, hex('#c8784a'), hex('#8a4a2a'));
    // bancas com toldos listrados (cores diferentes)
    const stalls: [RGB, RGB][] = [[hex('#e84a4a'), hex('#f8f4ec')], [hex('#f0a030'), hex('#f8f4ec')], [hex('#3a9a5a'), hex('#f8f4ec')], [hex('#3a78c8'), hex('#f8f4ec')]];
    const sw = 60;
    stalls.forEach(([c1, c2], k) => {
      const x = 14 + k * (sw + 10) + (k >= 2 ? 36 : 0);
      a.rect(x, wallTop + 22, sw, base - wallTop - 22, hex('#5a3a28'));
      for (let q = 0; q < 8; q++) { const c = [hex('#e84a3a'), hex('#f0d040'), hex('#4aa84a'), hex('#f08a3a')][(q + k) % 4]; a.rect(x + 4 + q * 7, base - 12, 5, 4, c); a.px(x + 5 + q * 7, base - 12, lighten(c, 0.5)); }
      a.rect(x, base - 8, sw, 6, hex('#a8703e'));
      a.awning(x - 2, wallTop + 12, sw + 4, 10, c1, c2, 6);
    });
    // painel de preços (letreiro de LED)
    ledSign(a, cx, wallTop + 6, 'MERCADO', hex('#ffd84a'), hex('#3a1a10'));
    a.door(cx, base, 30, 32, { color: hex('#8a5a30'), double: true, lamp: false, step: hex('#b8b0a4') });
    a.ink(hex('#3a2418'));
  });
}

// ─────────────────────────── Central de Entregas ───────────────────────────
export function centralEntregas(): Building {
  return hdBuilding('entregas', 'Central de Entregas', 7, 4, 2, [2], a => {
    const W = a.W, H = a.H, base = H - 6, top = 50;
    roofTop(a, 4, 8, W - 8, top - 4);
    // heliponto dos drones no telhado
    for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) {
      const d = Math.hypot(x, y);
      if (d > 14) continue;
      a.px(W - 56 + x, 26 + y, d > 12 ? hex('#ffd84a') : hex('#4a5060'));
    }
    a.rect(W - 62, 20, 3, 12, hex('#ffffff')); a.rect(W - 53, 20, 3, 12, hex('#ffffff')); a.rect(W - 62, 25, 12, 2, hex('#ffffff'));
    for (const [dx, dy] of [[-12, 0], [12, 0], [0, -12], [0, 12]]) a.nt.put(W - 56 + dx, 26 + dy, hex('#ffd84a'));
    a.metal(6, top, W - 12, base - top, hex('#e8a040'), 12);
    // porta de enrolar e a porta de gente
    const rx = W - 90, rw = 60;
    a.rect(rx - 3, top + 18, rw + 6, base - top - 18, hex('#5a5a66'));
    for (let y = top + 20; y < base; y += 3) { a.hline(rx, y, rw, hex('#b8bcc8')); a.hline(rx, y + 2, rw, hex('#8a8e9a')); }
    a.door(80, base, 18, 28, { color: hex('#3a4050'), glass: true, lamp: false, step: hex('#c8ccd4') });
    ledSign(a, W / 2 - 8, top + 4, 'ENTREGAS', hex('#ffd84a'), hex('#2a2a36'));
    // caixas empilhadas
    for (const [x, y] of [[14, base - 12], [26, base - 12], [20, base - 22]]) { a.rect(x, y, 11, 10, hex('#c8a060')); a.hline(x, y, 11, hex('#e8c890')); a.vline(x + 5, y, 10, hex('#a8804a')); }
    a.ink(hex('#2a2a36'));
  });
}

/** Telão do Jornal WIT: armação em duas pernas e a tela (o texto é desenhado pelo jogo). */
export const TELAO_SCREEN = { x: 10, y: 14, w: 172, h: 58 };   // em hd, relativo à arte
export function telao(): Building {
  return hdBuilding('telao', 'Telão', 6, 1, 3, [], a => {
    const W = a.W, H = a.H;
    for (const x of [30, W - 36]) { a.rect(x, 70, 6, H - 72, hex('#5a606c')); a.vline(x, 70, H - 72, hex('#8a92a0')); }
    a.rect(4, 8, W - 8, 70, hex('#2a3040'));
    a.hline(4, 8, W - 8, hex('#5a6070'));
    a.rect(TELAO_SCREEN.x, TELAO_SCREEN.y, TELAO_SCREEN.w, TELAO_SCREEN.h, hex('#0e1a24'));
    a.nt.rect(TELAO_SCREEN.x, TELAO_SCREEN.y, TELAO_SCREEN.w, TELAO_SCREEN.h, hex('#1a3a4a'));
    ledStrip(a, 8, 74, W - 16, LIME);
    a.rect(W / 2 - 20, 0, 40, 9, hex('#2a3040'));
    a.ink(hex('#1a1e28'));
  });
}

// ─────────────────────────── objetos da praça ───────────────────────────

/** Árvore solar: tronco de metal com "folhas" de placa solar e LED embaixo. */
export function solarTree(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(32, 48, a => {
    const cx = 32;
    a.rect(cx - 2, 30, 5, 64, hex('#8a92a0')); a.vline(cx - 2, 30, 64, hex('#c8ccd4'));
    const leaves: [number, number, number][] = [[-20, 18, -0.4], [18, 14, 0.4], [-4, 4, 0], [-26, 36, -0.6], [24, 34, 0.6]];
    for (const [dx, dy] of leaves) {
      a.hline(Math.min(cx, cx + dx + 8), dy + 12, Math.abs(dx) + 2, hex('#8a92a0'));
      for (let y = 0; y < 10; y++) for (let x = 0; x < 18; x++) {
        const cell = x % 6 === 0 || y % 5 === 0;
        a.px(cx + dx - 1 + x, dy + y, cell ? hex('#8ab0e8') : hex('#2a4a8a'));
      }
      a.nt.rect(cx + dx - 1, dy + 10, 18, 1, LED.cyan);
    }
    a.rect(cx - 8, 92, 17, 4, hex('#6a7080'));
    a.rect(cx - 1, 60, 3, 6, hex('#3a4050')); a.px(cx, 62, hex('#4ae88a')); a.nt.put(cx, 62, hex('#4ae88a'));
  });
}

/** Estação de patinetes com dois patinetes carregando. */
export function scooterDock(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(32, 24, a => {
    a.rect(4, 36, 56, 6, hex('#8a92a0')); a.hline(4, 36, 56, hex('#c8ccd4'));
    a.rect(26, 8, 12, 30, hex('#3a4050')); a.rect(28, 12, 8, 10, hex('#4ae88a')); a.nt.rect(28, 12, 8, 10, hex('#4ae88a'));
    for (const x of [8, 44]) {
      a.rect(x + 2, 12, 2, 26, hex('#2a3040')); a.rect(x, 12, 8, 2, hex('#2a3040'));
      a.rect(x - 2, 36, 14, 3, LIME);
      for (const wx of [x - 2, x + 10]) a.rect(wx, 38, 4, 4, hex('#1a1e28'));
    }
  });
}

/** Fliperama de rua (máquina de minijogo). */
export function arcade(c: RGB): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 26, a => {
    a.rect(6, 4, 20, 48, c); a.vline(6, 4, 48, lighten(c, 0.3)); a.vline(25, 4, 48, darken(c, 0.35));
    a.rect(8, 6, 16, 6, hex('#1a1e28')); a.hline(9, 8, 14, hex('#ffd84a')); a.nt.rect(9, 8, 14, 1, hex('#ffd84a'));
    a.rect(8, 14, 16, 14, hex('#0e1a24'));
    for (let k = 0; k < 6; k++) { const x = 10 + Math.floor(hash(k, 1, 3) * 12), y = 16 + Math.floor(hash(k, 2, 3) * 10); a.px(x, y, hex('#4ae88a')); a.nt.put(x, y, hex('#4ae88a')); }
    a.nt.rect(8, 14, 16, 14, hex('#1a4a5a'));
    a.rect(6, 30, 20, 6, darken(c, 0.2));
    a.rect(10, 31, 2, 3, hex('#e84a4a')); a.rect(16, 32, 2, 2, hex('#ffd84a')); a.rect(20, 32, 2, 2, hex('#4ad0ff'));
  });
}

/** Drone de entregas visto de cima (dois quadros: hélices girando), com a caixinha. */
export function droneFrames(): Pixmap[] {
  const gpt = worldArt('drone');
  if (gpt) return [gpt.pix, gpt.pix];
  return [0, 1].map(f => {
    const a = new Art(28, 22);
    a.rect(10, 8, 8, 6, hex('#3a4050')); a.hline(10, 8, 8, hex('#8a92a0'));
    a.px(13, 10, hex('#4ae88a')); a.px(14, 10, hex('#4ae88a'));
    for (const [x, y] of [[3, 3], [21, 3], [3, 15], [21, 15]]) {
      a.hline(Math.min(x + 2, 12), y + 2, Math.abs(x - 12) + 2, hex('#6a7080'));
      if (f === 0) { a.hline(x - 2, y + 2, 8, hex('#c8ccd4')); } else { a.vline(x + 2, y - 2, 8, hex('#c8ccd4')); }
      a.rect(x + 1, y + 1, 3, 3, hex('#3a4050'));
    }
    a.rect(11, 15, 6, 5, hex('#c8a060')); a.hline(11, 15, 6, hex('#e8c890'));
    a.pm.outline(hex('#1a1e28'));
    return withHd(a.pm);
  });
}

/** WIT-Bot: robozinho de rodinha com tela no rosto (dois quadros: pisca e anda). */
export function witBotFrames(face: 1 | -1): Pixmap[] {
  const gpt = worldArt('robo-frente');
  if (gpt) { const p = face > 0 ? gpt.pix : mirrored(gpt.pix); return [p, p]; }
  return [0, 1].map(f => {
    const a = new Art(24, 32);
    const body = hex('#f4f8fc'), accent = LIME;
    // cabeça com tela
    a.rect(5, 2, 14, 11, body); a.vline(5, 2, 11, hex('#ffffff')); a.vline(18, 2, 11, hex('#c8ccd4'));
    a.rect(7, 4, 10, 7, hex('#1a2430'));
    const eye = f === 1 ? 1 : 2;
    a.rect(8 + (face > 0 ? 2 : 0), 6, 2, eye, hex('#4ae88a')); a.rect(12 + (face > 0 ? 2 : 0), 6, 2, eye, hex('#4ae88a'));
    a.nt.rect(8 + (face > 0 ? 2 : 0), 6, 2, eye, hex('#4ae88a')); a.nt.rect(12 + (face > 0 ? 2 : 0), 6, 2, eye, hex('#4ae88a'));
    a.rect(11, 0, 2, 2, accent); a.nt.rect(11, 0, 2, 2, accent);
    // corpo
    a.rect(6, 14, 12, 10, body); a.rect(6, 14, 12, 2, accent);
    a.rect(10, 18, 4, 3, hex('#4ad0ff')); a.nt.rect(10, 18, 4, 3, hex('#4ad0ff'));
    a.rect(3, 15 + (f ? 1 : 0), 3, 6, hex('#c8ccd4')); a.rect(18, 15 + (f ? 0 : 1), 3, 6, hex('#c8ccd4'));
    // rodinha
    a.rect(8, 24, 8, 6, hex('#3a4050')); a.hline(9, 25, 6, hex('#6a7080'));
    a.pm.outline(INK);
    return withHd(a.pm);
  });
}

/** Canteiro com irrigação automática (sensor de umidade + aspersor). */
export function smartPlanter(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(32, 20, a => {
    a.rect(2, 16, 60, 22, hex('#8a92a0')); a.hline(2, 16, 60, hex('#c8ccd4'));
    a.rect(4, 18, 56, 8, hex('#6a4428'));
    for (let k = 0; k < 12; k++) { const x = 6 + k * 4.5; a.rect(Math.round(x), 10 + (k % 3), 3, 9 - (k % 3), k % 4 === 0 ? hex('#f06a8a') : hex('#4aa84a')); }
    a.rect(52, 6, 3, 14, hex('#3a4050')); a.rect(51, 4, 5, 3, hex('#4ad0ff')); a.nt.rect(51, 4, 5, 3, hex('#4ad0ff'));
    ledStrip(a, 2, 34, 60, hex('#4ae88a'));
  });
}

/** Quadra poliesportiva (chão pintado, dá para andar em cima) — `tw × th` blocos. */
export function sportsCourt(tw: number, th: number): Pixmap {
  const a = new Art(tw * 32, th * 32);
  const W = a.W, H = a.H;
  a.rect(0, 0, W, H, hex('#3a8a6a'));
  a.rect(6, 6, W - 12, H - 12, hex('#3a6ab8'));
  const line = hex('#f4f8fc');
  a.pm.frame(8, 8, W - 16, H - 16, line); a.pm.frame(9, 9, W - 18, H - 18, line);
  a.rect(W / 2 - 1, 8, 2, H - 16, line);
  for (let y = -20; y <= 20; y++) for (let x = -20; x <= 20; x++) { const d = Math.hypot(x, y); if (d > 18.5 && d < 20.5) a.px(W / 2 + x, H / 2 + y, line); }
  for (const side of [0, 1]) {
    const x0 = side ? W - 9 - 40 : 9;
    a.pm.frame(x0, H / 2 - 24, 40, 48, line);
    for (let y = -24; y <= 24; y++) for (let x = 0; x < 20; x++) { const d = Math.hypot(x, y); if (d > 22.5 && d < 24.5) a.px(side ? x0 - x : x0 + 40 + x, H / 2 + y, line); }
  }
  for (let y = 12; y < H - 12; y += 2) for (let x = 12; x < W - 12; x += 2) if (hash(x, y, 3) > 0.97) a.px(x, y, hex('#4a7ac8'));
  return withHd(a.pm);
}

/** Cesta de basquete (poste e tabela) para os lados da quadra. */
export function hoop(face: 1 | -1): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 32, a => {
    a.rect(14, 20, 4, 44, hex('#5a606c')); a.vline(14, 20, 44, hex('#8a92a0'));
    a.rect(4, 6, 24, 16, hex('#f4f8fc')); a.pm.frame(4, 6, 24, 16, hex('#3a4050')); a.pm.frame(11, 11, 10, 8, hex('#e84a4a'));
    const rx = face > 0 ? 18 : 6;
    a.rect(rx, 22, 10, 2, hex('#f06a2a'));
    for (let k = 0; k < 5; k++) a.px(rx + 1 + k * 2, 24 + (k % 2), hex('#f4f8fc'));
  });
}

/** Estação do tempo (IoT): mastro com anemômetro, painel e antena. */
export function weatherStation(): { pix: Pixmap; night?: Pixmap } {
  return hdProp(16, 32, a => {
    a.rect(15, 10, 3, 54, hex('#8a92a0'));
    for (const [dx, dy] of [[-8, 0], [8, 0], [0, -5]]) { a.hline(16 + Math.min(0, dx), 8 + dy / 2, Math.abs(dx) + 1, hex('#5a606c')); a.rect(16 + dx - 2, 6 + dy, 4, 4, hex('#f4f8fc')); }
    a.rect(8, 30, 16, 12, hex('#f4f8fc')); a.pm.frame(8, 30, 16, 12, hex('#3a4050'));
    a.rect(10, 32, 12, 5, hex('#1a2430')); a.rect(11, 33, 6, 1, hex('#4ae88a')); a.rect(11, 35, 9, 1, hex('#4ad0ff'));
    a.nt.rect(10, 32, 12, 5, hex('#2a5a6a'));
    a.rect(24, 16, 2, 14, hex('#5a606c')); a.px(24, 15, hex('#e84a4a')); a.nt.put(24, 15, hex('#ff5a5a'));
  });
}

/** Holograma da praça: base com luz e a letra W verde girando (quadros). */
export function hologramFrames(): { pix: Pixmap; night?: Pixmap }[] {
  const glyph = ['#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'];
  return Array.from({ length: 8 }, (_, f) => {
    const a = new Art(48, 64);
    const cx = 24, ang = (f / 8) * Math.PI;
    // base
    for (let y = -4; y <= 4; y++) for (let x = -16; x <= 16; x++) if (Math.hypot(x / 16, y / 4) <= 1) a.px(cx + x, 56 + y, y < 0 ? hex('#8a92a0') : hex('#5a606c'));
    a.rect(cx - 12, 52, 24, 2, hex('#4ad0ff')); a.nt.rect(cx - 12, 52, 24, 2, hex('#8ae8ff'));
    // cone de luz
    for (let y = 14; y < 52; y++) { const half = Math.round(4 + (y - 14) * 0.3); for (let x = -half; x <= half; x++) if ((x + y + f) % 3 === 0) { a.px(cx + x, y, hex('#b8f4ff')); a.nt.put(cx + x, y, hex('#8ae8ff')); } }
    // W girando: largura pelo cosseno
    const sx = Math.cos(ang) * 3;
    for (let gy = 0; gy < glyph.length; gy++) for (let gx = 0; gx < 5; gx++) {
      if (glyph[gy][gx] !== '#') continue;
      const X = Math.round(cx + (gx - 2) * sx), Y = 12 + gy * 3;
      const w = Math.max(1, Math.round(Math.abs(sx)));
      a.rect(Math.min(X, X + w), Y, w + 1, 3, Math.cos(ang) > 0 ? WIT.lime : darken(WIT.lime, 0.3));
      a.nt.rect(Math.min(X, X + w), Y, w + 1, 3, hex('#b8ff7a'));
    }
    return { pix: withHd(a.pm), night: withHd(a.nt) };
  });
}
