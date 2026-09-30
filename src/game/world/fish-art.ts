// Ícone de cada peixe (e do lixo) desenhado por código em pixel art hd:
// corpo com costas e barriga, padrão (listras, pintas, escamas, brilho),
// nadadeiras, rabo e olho, com contorno escuro. Usado no quadro, na venda
// e no aviso de "você pescou".
import type { Fish } from '../fishing';
import { hash, hex, mix, Pixmap, type RGB } from './pixmap';

const INK = hex('#2a2238');
const W = 48, H = 32;

export function fishIcon(f: Fish): Pixmap {
  const pm = new Pixmap(W, H);
  const [back, belly, detail] = f.colors.map(hex) as [RGB, RGB, RGB];
  if (f.shape === 'bota') return boot(pm, back, belly);
  if (f.shape === 'lata') return can(pm, back, belly, detail);
  if (f.shape === 'camarao') return shrimp(pm, back, belly, detail);
  const long = f.shape === 'longo', round = f.shape === 'redondo', thin = f.shape === 'fino';
  const cx = long ? 22 : 21, cy = 16;
  const rx = long ? 17 : round ? 12 : thin ? 14 : 15, ry = round ? 11 : thin ? 5 : long ? 6 : 8;
  // rabo
  const tx0 = cx + rx - 3;
  for (let x = 0; x < 9; x++) {
    const half = Math.round(2 + x * (round ? 1 : 0.9));
    for (let y = -half; y <= half; y++) {
      if (x > 5 && Math.abs(y) < half - 3) continue;   // rabo bifurcado
      pm.put(tx0 + x, cy + y, mix(back, detail, 0.35 + x / 20));
    }
  }
  // nadadeira de cima
  for (let x = 0; x < rx; x++) {
    const h = Math.round(Math.sin((x / rx) * Math.PI) * (round ? 4 : 3));
    for (let y = 0; y < h; y++) pm.put(cx - rx / 2 + x, cy - ry - y, mix(back, detail, 0.4));
  }
  // corpo
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2;
    if (d > 1) continue;
    const t = (y + ry) / (2 * ry);
    let c = mix(back, belly, Math.min(1, Math.max(0, (t - 0.35) * 2)));
    if (y < -ry * 0.55) c = mix(c, [255, 255, 255], 0.18);
    if (f.pattern === 'listras' && Math.abs(((x + 40) % 7) - 3) < 1.2 && t < 0.75) c = mix(c, detail, 0.75);
    if (f.pattern === 'pintas' && hash(Math.floor((x + 40) / 3), Math.floor((y + 40) / 3), f.id.length) > 0.72 && t < 0.8) c = mix(c, detail, 0.85);
    if (f.pattern === 'escamas' && (x + y * 2 + 60) % 4 === 0 && t < 0.7) c = mix(c, detail, 0.35);
    if (f.pattern === 'brilho' && (x - y + 60) % 9 === 0) c = mix(c, [255, 255, 255], 0.8);
    pm.put(cx + x, cy + y, c);
  }
  // nadadeira de baixo e guelra
  for (let k = 0; k < 4; k++) pm.put(cx - 2 + k, cy + ry - 1 + (k > 1 ? 1 : 0), mix(belly, detail, 0.5));
  for (let y = -ry + 2; y < ry - 1; y++) if (Math.abs(y) < ry * 0.7) pm.put(cx - rx + 7, cy + y, mix(back, INK, 0.35));
  // olho
  const ex = cx - rx + 4, ey = cy - Math.round(ry * 0.25);
  pm.rect(ex - 1, ey - 1, 3, 3, [255, 255, 255]);
  pm.put(ex, ey, INK); pm.put(ex - 1, ey, INK);
  // boca e bigodes (bagre)
  pm.put(cx - rx, cy + 1, INK);
  if (f.id === 'bagre') for (let k = 0; k < 6; k++) { pm.put(cx - rx - k, cy + 2 + (k >> 1), INK); pm.put(cx - rx - k + 1, cy + 3 + (k >> 1), mix(back, INK, 0.3)); }
  // pinta-olho no rabo (tucunaré)
  if (f.id === 'tucunare') { pm.rect(cx + rx - 5, cy - 2, 4, 4, detail); pm.put(cx + rx - 4, cy - 1, hex('#f0a020')); }
  // brilho em volta (lendários)
  if (f.pattern === 'brilho') for (const [sx, sy] of [[4, 4], [42, 6], [8, 27], [38, 26], [24, 2]]) {
    pm.put(sx, sy, [255, 255, 255]); pm.put(sx - 1, sy, [255, 250, 200]); pm.put(sx + 1, sy, [255, 250, 200]); pm.put(sx, sy - 1, [255, 250, 200]); pm.put(sx, sy + 1, [255, 250, 200]);
  }
  pm.outline(INK);
  return pm;
}

function boot(pm: Pixmap, c: RGB, light: RGB): Pixmap {
  pm.rect(14, 4, 12, 18, c);
  pm.rect(14, 18, 22, 8, c);
  pm.rect(34, 20, 3, 6, c);
  pm.rect(14, 4, 12, 2, light);
  pm.rect(14, 26, 23, 2, hex('#3a2a1a'));
  for (let y = 8; y < 18; y += 3) { pm.put(17, y, light); pm.put(23, y, light); }
  pm.put(30, 21, hex('#8ab8d8')); pm.put(31, 22, hex('#8ab8d8'));
  pm.outline(INK);
  return pm;
}

function can(pm: Pixmap, c: RGB, light: RGB, label: RGB): Pixmap {
  for (let y = 6; y < 28; y++) for (let x = 16; x < 32; x++) {
    const s = (x - 16) / 16;
    pm.put(x, y, s < 0.3 ? light : s > 0.75 ? mix(c, INK, 0.3) : c);
  }
  pm.rect(16, 12, 16, 9, label);
  pm.rect(16, 12, 16, 1, mix(label, [255, 255, 255], 0.4));
  pm.rect(16, 5, 16, 2, light);
  pm.put(20, 27, hex('#6a5a4a'));
  pm.outline(INK);
  return pm;
}

function shrimp(pm: Pixmap, c: RGB, light: RGB, dark: RGB): Pixmap {
  for (let k = 0; k < 7; k++) {
    const ang = Math.PI * 0.2 + k * 0.33, r = 11;
    const x = Math.round(24 + Math.cos(ang) * r), y = Math.round(14 + Math.sin(ang) * r * 0.8);
    const s = 4 - Math.floor(k / 3);
    pm.rect(x - s, y - s, s * 2, s * 2, k % 2 ? c : light);
    pm.put(x - s, y - s, dark);
  }
  pm.rect(33, 10, 5, 5, c); pm.put(35, 11, INK);
  for (let k = 0; k < 8; k++) pm.put(38 + k, 9 - (k >> 1), dark);
  pm.outline(INK);
  return pm;
}

/** Ícone como URL de imagem (para o React), ampliado `scale`× sem suavizar. */
const urlCache = new Map<string, string>();
export function fishIconUrl(f: Fish, scale = 2, silhouette = false): string {
  const key = `${f.id}|${scale}|${silhouette}`;
  const hit = urlCache.get(key);
  if (hit) return hit;
  const pm = fishIcon(f);
  const c = document.createElement('canvas');
  c.width = pm.w * scale; c.height = pm.h * scale;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(pm.w, pm.h);
  img.data.set(pm.data);
  if (silhouette) for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3]) { img.data[i] = 60; img.data[i + 1] = 66; img.data[i + 2] = 90; }
  const tmp = document.createElement('canvas');
  tmp.width = pm.w; tmp.height = pm.h;
  tmp.getContext('2d')!.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, c.width, c.height);
  const url = c.toDataURL();
  urlCache.set(key, url);
  return url;
}
