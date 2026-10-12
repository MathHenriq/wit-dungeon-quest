// Água em movimento nos lagos grandes, desenhada na hora (sem guardar quadros):
// dois desenhos de brilhos e marolas que andam devagar em sentidos diferentes,
// recortados pela máscara da água (só onde o chão é azul). Os lagos pequenos
// continuam com os quadros prontos (lakeFrames).
import type { Town } from './zone';
import { hash } from './pixmap';

export interface WaterAnim {
  /** Máscara em pixels do mundo (1×): opaco onde é água. */
  mask: HTMLCanvasElement;
  x0: number; y0: number; w: number; h: number;
  a: CanvasPattern; b: CanvasPattern;
  buf: HTMLCanvasElement;
}

function tile(seed: number, light: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 96; c.height = 96;
  const x = c.getContext('2d')!;
  for (let k = 0; k < 16; k++) {
    const px = Math.floor(hash(k, 1, seed) * 92), py = Math.floor(hash(k, 2, seed) * 94);
    const len = 2 + Math.floor(hash(k, 3, seed) * 4);
    x.fillStyle = light ? 'rgba(240,251,255,0.9)' : 'rgba(30,90,170,0.35)';
    x.fillRect(px, py, len, 1);
    if (light && len > 3) { x.fillStyle = 'rgba(200,236,255,0.6)'; x.fillRect(px + 1, py + 1, len - 2, 1); }
  }
  return c;
}

/** Monta a máscara a partir do chão hd (pixels azuis) dentro de `town.waterAnim`. */
export function makeWaterAnim(town: Town): WaterAnim | null {
  const box = town.waterAnim, hd = town.ground.hd;
  if (!box || !hd) return null;
  // caixa justa da água (em blocos)
  let bx0 = box.x1, by0 = box.y1, bx1 = box.x0, by1 = box.y0;
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    if (town.terrain[y]?.[x] !== 'agua') continue;
    bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x + 1); by1 = Math.max(by1, y + 1);
  }
  if (bx1 <= bx0) return null;
  const x0 = bx0 * 16, y0 = by0 * 16, w = (bx1 - bx0) * 16, h = (by1 - by0) * 16;
  const mask = document.createElement('canvas');
  mask.width = w; mask.height = h;
  const mctx = mask.getContext('2d')!;
  const img = mctx.createImageData(w, h);
  const g = hd.data, W = hd.w;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // amostra o pixel hd do meio (a máscara fica em 1×)
    const gi = (((y0 + y) * 2 + 1) * W + (x0 + x) * 2 + 1) * 4;
    const water = g[gi + 2] > 150 && g[gi + 2] > g[gi + 1] + 8 && g[gi + 2] > g[gi] + 60;
    if (water) img.data[(y * w + x) * 4 + 3] = 255;
  }
  mctx.putImageData(img, 0, 0);
  const buf = document.createElement('canvas');
  const bctx = buf.getContext('2d')!;
  const a = bctx.createPattern(tile(7, true), 'repeat')!;
  const b = bctx.createPattern(tile(13, false), 'repeat')!;
  return { mask, x0, y0, w, h, a, b, buf };
}

/**
 * Desenha as ondas por cima da cena (contexto em pixels do mundo, escala R).
 * `alpha` diminui à noite.
 */
export function drawWaterAnim(ctx: CanvasRenderingContext2D, wa: WaterAnim, now: number, camX: number, camY: number, vw: number, vh: number, R: number, alpha: number): void {
  const ix0 = Math.max(camX, wa.x0), iy0 = Math.max(camY, wa.y0);
  const ix1 = Math.min(camX + vw, wa.x0 + wa.w), iy1 = Math.min(camY + vh, wa.y0 + wa.h);
  if (ix1 <= ix0 || iy1 <= iy0 || alpha <= 0.02) return;
  const bw = Math.ceil((ix1 - ix0) * R), bh = Math.ceil((iy1 - iy0) * R);
  const buf = wa.buf;
  if (buf.width < bw || buf.height < bh) { buf.width = Math.max(buf.width, bw); buf.height = Math.max(buf.height, bh); }
  const b = buf.getContext('2d')!;
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = 'source-over';
  b.clearRect(0, 0, bw, bh);
  const t = now / 1000;
  // brilhos: andam para a direita e piscam trocando de posição devagar
  const ax = Math.round(t * 7) - ix0 * R, ay = Math.round(Math.sin(t * 0.4) * 6) - iy0 * R;
  b.setTransform(1, 0, 0, 1, ax, ay);
  b.fillStyle = wa.a;
  b.globalAlpha = 0.55 + 0.35 * Math.sin(t * 1.3);
  b.fillRect(-ax, -ay, bw, bh);
  b.setTransform(1, 0, 0, 1, ax + 48, ay + 30);
  b.globalAlpha = 0.55 + 0.35 * Math.sin(t * 1.3 + Math.PI);
  b.fillRect(-ax - 48, -ay - 30, bw, bh);
  // marolas escuras: para a esquerda
  const cx = Math.round(-t * 5) - ix0 * R, cy = Math.round(t * 3) - iy0 * R;
  b.setTransform(1, 0, 0, 1, cx, cy);
  b.globalAlpha = 1;
  b.fillStyle = wa.b;
  b.fillRect(-cx, -cy, bw, bh);
  // recorta pela água
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = 'destination-in';
  b.imageSmoothingEnabled = false;
  b.drawImage(wa.mask, ix0 - wa.x0, iy0 - wa.y0, ix1 - ix0, iy1 - iy0, 0, 0, bw, bh);
  b.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha;
  ctx.drawImage(buf, 0, 0, bw, bh, ix0 - camX, iy0 - camY, ix1 - ix0, iy1 - iy0);
  ctx.globalAlpha = 1;
}
