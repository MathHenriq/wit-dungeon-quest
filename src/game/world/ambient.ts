// Vida da cidade desenhada por cima da cena a cada quadro: fumaça nas
// chaminés, brilho nas janelas, borboletas, pétalas das cerejeiras,
// passarinhos, sombra de nuvem (de dia) e vaga-lumes (de noite).
// Tudo em pixels do mundo; o contexto já está escalado para a tela hd, então
// 0,5 px do mundo = 1 pixel da tela (o menor detalhe possível).
import { hash } from './pixmap';
import type { Ambient } from './town';

export interface AmbientView {
  now: number;
  camX: number;
  camY: number;
  vw: number;
  vh: number;
  /** Cor que escurece a cena (a hora do dia); [255,255,255] de dia. */
  tint: readonly number[];
  /** Quanto as luzes estão acesas (0 de dia, 1 de noite). */
  light: number;
}

const H = 0.5; // um pixel da tela hd

/** Cor escurecida pela hora do dia. */
function shade(c: readonly [number, number, number], tint: readonly number[], a = 1): string {
  return `rgba(${(c[0] * tint[0]) / 255 | 0},${(c[1] * tint[1]) / 255 | 0},${(c[2] * tint[2]) / 255 | 0},${a})`;
}

const snap = (v: number) => Math.round(v * 2) / 2;

let cloud: HTMLCanvasElement | null = null;
/** Sombra de nuvem: manchas redondas suaves, desenhadas uma vez. */
function cloudShadow(): HTMLCanvasElement {
  if (cloud) return cloud;
  const c = document.createElement('canvas');
  c.width = 220; c.height = 110;
  const x = c.getContext('2d')!;
  for (const [cx, cy, r] of [[60, 60, 42], [105, 48, 50], [155, 62, 40], [120, 72, 36], [82, 74, 30]]) {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(20,40,60,0.55)');
    g.addColorStop(0.6, 'rgba(20,40,60,0.35)');
    g.addColorStop(1, 'rgba(20,40,60,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  }
  cloud = c;
  return c;
}

const inView = (v: AmbientView, x: number, y: number, m = 24) =>
  x > v.camX - m && x < v.camX + v.vw + m && y > v.camY - m && y < v.camY + v.vh + m;

export function drawAmbient(ctx: CanvasRenderingContext2D, fx: Ambient, v: AmbientView, mapW: number, mapH: number): void {
  const t = v.now / 1000;
  const day = v.light < 0.35;
  const px = (x: number, y: number, w = H, h = H) => ctx.fillRect(snap(x - v.camX), snap(y - v.camY), w, h);

  // ── fumaça: bolinhas que sobem, crescem, desviam com o vento e somem ──
  for (let i = 0; i < fx.chimneys.length; i++) {
    const [cx, cy] = fx.chimneys[i];
    if (!inView(v, cx, cy, 40)) continue;
    for (let p = 0; p < 5; p++) {
      const life = ((t / 3.2) + p / 5 + hash(i, 1, 9)) % 1;
      const r = 1 + life * 2.5;
      const x = cx + Math.sin(life * 4 + i) * 1.5 + life * 7, y = cy - 2 - life * 22;
      ctx.fillStyle = shade([236, 238, 242], v.tint, 0.55 * (1 - life));
      const s = snap(r);
      ctx.fillRect(snap(x - v.camX - s / 2), snap(y - v.camY - s / 2), s, s);
    }
  }

  if (day) {
    // ── brilho nas janelas: uma estrelinha de vez em quando ──
    for (let i = 0; i < fx.glints.length; i++) {
      const [gx, gy] = fx.glints[i];
      if (!inView(v, gx, gy)) continue;
      const period = 6 + hash(i, 2, 13) * 7, life = ((t + hash(i, 3, 13) * period) % period) / 0.7;
      if (life > 1) continue;
      const a = Math.sin(life * Math.PI), arm = life < 0.5 ? 1 : 1.5;
      ctx.fillStyle = `rgba(255,255,255,${0.95 * a})`;
      px(gx, gy, H, H);
      ctx.fillStyle = `rgba(255,255,255,${0.7 * a})`;
      px(gx - arm, gy, arm, H); px(gx + H, gy, arm, H);
      px(gx, gy - arm, H, arm); px(gx, gy + H, H, arm);
    }

    // ── borboletas: voam em volta das flores, batendo asas ──
    const colors: [number, number, number][] = [[255, 255, 255], [255, 226, 90], [255, 150, 196], [140, 200, 255], [255, 176, 80]];
    for (let i = 0; i < fx.flowers.length; i++) {
      const [fx0, fy0] = fx.flowers[i];
      if (!inView(v, fx0, fy0, 40)) continue;
      const s = hash(i, 4, 21);
      const x = fx0 + Math.sin(t * (0.6 + s * 0.5) + i) * 14 + Math.sin(t * 1.7 + s * 9) * 4;
      const y = fy0 - 6 + Math.sin(t * (0.9 + s * 0.4) + i * 2) * 8 + Math.sin(t * 5 + i) * 1.2;
      const open = Math.floor(v.now / 110 + i) % 2 === 0;
      ctx.fillStyle = shade(colors[i % colors.length], v.tint);
      if (open) { px(x - 2, y - H, 2, 1.5); px(x + H, y - H, 2, 1.5); px(x - 1.5, y + 1, 1.5, 1); px(x + H, y + 1, 1.5, 1); }
      else { px(x - 1, y - 1.5, 1, 2); px(x + H, y - 1.5, 1, 2); }
      ctx.fillStyle = shade([60, 40, 40], v.tint);
      px(x, y - H, H, 2);
      // sombrinha no chão
      ctx.fillStyle = 'rgba(20,40,40,0.18)';
      px(x - H, fy0 + 6, 1.5, H);
    }

    // ── pétalas das cerejeiras: caem girando e somem no chão ──
    for (let i = 0; i < fx.blossoms.length; i++) {
      const [bx, by] = fx.blossoms[i];
      if (!inView(v, bx, by, 60)) continue;
      for (let p = 0; p < 7; p++) {
        const life = ((t / 5) + p / 7 + hash(i, p, 31)) % 1;
        const x = bx + (hash(i, p, 32) - 0.5) * 34 + life * 22 + Math.sin(life * 9 + p) * 4;
        const y = by - 4 + life * 44;
        ctx.fillStyle = shade([255, 176, 206], v.tint, life > 0.85 ? (1 - life) / 0.15 : 1);
        if (Math.floor(life * 14 + p) % 2) px(x, y, 1.5, 1); else px(x, y, 1, 1.5);
        ctx.fillStyle = shade([255, 226, 238], v.tint, life > 0.85 ? (1 - life) / 0.15 : 1);
        px(x, y, H, H);
      }
    }

    // ── passarinhos: um bando cruza a tela a cada ~24 s, com a sombra no chão ──
    const cycle = 24, k = Math.floor(t / cycle), lt = (t % cycle) / 7;
    if (lt < 1) {
      const dir = hash(k, 1, 41) < 0.5 ? 1 : -1;
      const sx = v.camX + (dir > 0 ? -30 : v.vw + 30), sy = v.camY + v.vh * (0.2 + hash(k, 2, 41) * 0.5);
      const bx = sx + dir * lt * (v.vw + 60), by = sy - lt * 40;
      for (let b = 0; b < 4; b++) {
        const x = bx - dir * b * 9, y = by + (b % 2 ? 6 : -4) * (b > 0 ? 1 : 0) + b * 2;
        const flap = Math.floor(v.now / 150 + b) % 3;
        // sombra no chão, bem abaixo (o pássaro está alto)
        ctx.fillStyle = 'rgba(20,40,50,0.13)';
        px(x - 2, y + 40, 4.5, 1);
        // corpo claro com contorno, asas batendo (em cima, reta, embaixo)
        ctx.fillStyle = shade([48, 54, 72], v.tint);
        px(x - H, y - H, 1.5, 1.5);
        const wy = flap === 0 ? -1.5 : flap === 1 ? 0 : 1;
        px(x - 3, y + wy, 2.5, 1); px(x + 1, y + wy, 2.5, 1);
        ctx.fillStyle = shade([236, 240, 246], v.tint);
        px(x, y, H, H);
        px(x - 2.5, y + wy, 1.5, H); px(x + 1.5, y + wy, 1.5, H);
      }
    }

    // ── sombra das nuvens passando devagar ──
    const cs = cloudShadow();
    ctx.globalAlpha = 0.16;
    for (let c = 0; c < 3; c++) {
      const span = mapW + 440;
      const x = ((t * 5 + c * span / 3 + hash(c, 1, 51) * 200) % span) - 220;
      const y = (hash(c, 2, 51) * 0.8 + 0.05) * mapH;
      if (x + 220 < v.camX || x > v.camX + v.vw || y + 110 < v.camY || y > v.camY + v.vh) continue;
      ctx.drawImage(cs, x - v.camX, y - v.camY, 220, 110);
    }
    ctx.globalAlpha = 1;
  }

  // ── vaga-lumes (noite): pontinhos que acendem e apagam devagar ──
  if (v.light > 0.4) {
    ctx.globalCompositeOperation = 'lighter';
    for (let z = 0; z < fx.fireflies.length; z++) {
      const r = fx.fireflies[z];
      if (!inView(v, r.x0, r.y0, 60)) continue;
      for (let f = 0; f < 3; f++) {
        const s = hash(z, f, 61);
        const x = r.x0 + (r.x1 - r.x0) * (0.5 + 0.5 * Math.sin(t * (0.3 + s * 0.3) + s * 20));
        const y = r.y0 + (r.y1 - r.y0) * (0.5 + 0.5 * Math.sin(t * (0.25 + s * 0.2) + s * 40));
        const a = Math.max(0, Math.sin(t * (1 + s) + s * 30)) * v.light;
        if (a < 0.05) continue;
        ctx.fillStyle = `rgba(150,255,110,${0.12 * a})`;
        px(x - 2, y - 2, 4.5, 4.5);
        ctx.fillStyle = `rgba(170,255,120,${0.3 * a})`;
        px(x - 1, y - 1, 2.5, 2.5);
        ctx.fillStyle = `rgba(240,255,190,${a})`;
        px(x - H, y - H, 1, 1);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
