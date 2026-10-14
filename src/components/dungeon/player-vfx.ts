// Movimento do caçador na tela (só desenho; o motor não muda): golpe da espada
// com antecipação, corte e acompanhamento + rastro em meia-lua; cambalhota que
// encolhe, estica e deixa fantasmas (sem girar o boneco); investida com
// fantasmas e estocada; tiro com clarão e coice; piscada vermelha ao apanhar.
// Com as poses do GPT (modelo 01: combate e esquiva), usa os quadros delas.
import { DASH_T, type Run, type Warn } from '@/game/dungeon';
import { weapon } from '@/game/dungeon-weapons';
import type { Dir } from '@/game/world/movement';
import type { Fx } from './dungeon-vfx';

export type SwingKind = 'leve' | 'final' | 'pesado' | 'investida';

export interface Ghost { x: number; y: number; born: number; life: number; img: CanvasImageSource; w: number; h: number; sx: number; sy: number; lean: number; color: string }

export interface Motion {
  ghosts: Ghost[];
  prevDash: number;
  dashStart: number; dashDx: number; dashDy: number;
  swingStart: number; swingAng: number; swingArc: number; swingSide: number; swingKind: SwingKind;
  shootStart: number; shootAng: number;
  hurtStart: number;
  lastGhost: number;
  /** último quadro desenhado do boneco (para os fantasmas da investida e da esquiva perfeita) */
  last: { img: CanvasImageSource; w: number; h: number } | null;
  /** avisos do passo anterior (quando um fecha, sai o impacto no chão) */
  warns: Map<number, Warn>;
}

export const newMotion = (): Motion => ({
  ghosts: [], prevDash: 0, dashStart: -1e9, dashDx: 1, dashDy: 0,
  swingStart: -1e9, swingAng: 0, swingArc: 1.6, swingSide: 1, swingKind: 'leve',
  shootStart: -1e9, shootAng: 0, hurtStart: -1e9, lastGhost: 0, last: null, warns: new Map(),
});

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** Altura da mão (px) acima dos pés: de onde sai o corte e o tiro. */
export const HAND_Y = 14;

/** Poeira nos pés (saída e chegada da esquiva, pisada do pesado). */
function dust(fx: Fx[], x: number, y: number, n: number, dx: number, dy: number, sp = 1.4) {
  for (let k = 0; k < n; k++) {
    const a = Math.atan2(dy, dx) + rnd(-0.9, 0.9);
    fx.push({ kind: 'smoke', x: x + rnd(-0.15, 0.15), y: y + 0.05, vx: Math.cos(a) * sp * rnd(0.5, 1), vy: Math.sin(a) * sp * 0.5 * rnd(0.5, 1) - 0.25, r: rnd(0.12, 0.22), t: 0, life: rnd(0.28, 0.42), c1: 'rgba(210,200,190,.55)' });
  }
}

/** Depois de cada passo do motor: começo e fim da esquiva, golpes (rastro), tiros, dano. */
export function trackMotion(mo: Motion, run: Run, fx: Fx[], now: number) {
  const p = run.p;
  if (p.dash > 0 && mo.prevDash <= 0) {
    const l = Math.hypot(p.dx, p.dy) || 1;
    mo.dashStart = now; mo.dashDx = p.dx / l; mo.dashDy = p.dy / l;
    dust(fx, p.x, p.y, 5, -mo.dashDx, -mo.dashDy, 2);
  }
  if (p.dash <= 0 && mo.prevDash > 0) dust(fx, p.x, p.y, 4, mo.dashDx, mo.dashDy, 1);
  mo.prevDash = p.dash;
  // aviso que fechou agora: anel de choque e poeira onde o golpe caiu
  const live = new Set(run.warns.map(w => w.id));
  for (const [id, w] of mo.warns) {
    if (live.has(id) || w.t > 0.12) continue;
    const soft = w.dmg <= 0 && !w.st;
    if (w.kind === 'circle') {
      fx.push({ kind: 'ring', x: w.x, y: w.y, r: w.r * 1.1, t: 0, life: 0.25, c1: soft ? '#ffd8a0' : '#ffe0d8' });
      dust(fx, w.x, w.y, Math.min(6, 2 + Math.round(w.r * 2)), 0, 1, 1.6 + w.r);
    } else {
      for (let q = 0.2; q <= 1; q += 0.27) dust(fx, w.x + (w.x2 - w.x) * q, w.y + (w.y2 - w.y) * q, 1, w.x2 - w.x, w.y2 - w.y, 1.2);
    }
  }
  mo.warns = new Map(run.warns.map(w => [w.id, { ...w }]));
  for (const e of run.ev) {
    if (e.k === 'swing') {
      const kind = e.kind ?? 'leve', hy = e.y - HAND_Y / 32;
      mo.swingStart = now; mo.swingAng = e.ang; mo.swingArc = e.arc; mo.swingKind = kind;
      // o 1º e o 2º golpes do combo vão em lados opostos; o 3º (final) volta largo
      mo.swingSide = kind === 'leve' ? -mo.swingSide : 1;
      const w = weapon(p.arms[0].id);
      const tint = kind === 'pesado' ? '#ffb83a' : w.id === 'foice' ? '#b98aff' : kind === 'final' ? '#5ab8ff' : '#8fd8ff';
      if (kind === 'investida' || (kind === 'pesado' && e.arc < 6.2)) {
        // estocada: da posição de antes até a ponta
        const back = kind === 'investida' ? 2.2 : 0, len = kind === 'investida' ? 3 : e.range;
        const sx = e.x - Math.cos(e.ang) * back, sy = hy - Math.sin(e.ang) * back;
        fx.push({ kind: 'thrust', x: sx, y: sy, x2: sx + Math.cos(e.ang) * len, y2: sy + Math.sin(e.ang) * len, r: kind === 'pesado' ? 0.42 : 0.3, t: 0, life: 0.24, c1: '#ffffff', c2: tint });
        fx.push({ kind: 'ring', x: e.x + Math.cos(e.ang) * 0.6, y: hy + Math.sin(e.ang) * 0.6, r: 0.8, t: 0, life: 0.22, c1: '#e8f6ff' });
        if (kind === 'investida' && mo.last) for (let g = 1; g <= 5; g++) {
          const q = g / 6;
          mo.ghosts.push({ x: e.x - Math.cos(e.ang) * back * (1 - q), y: e.y - Math.sin(e.ang) * back * (1 - q), born: now - (5 - g) * 18, life: 220, ...mo.last, sx: 1, sy: 1, lean: Math.cos(e.ang) * 0.2, color: '#7ad8ff' });
        }
      } else {
        const heavy = kind === 'pesado';
        fx.push({ kind: 'slash', x: e.x, y: hy, r: e.range, ang: e.ang, arc: e.arc, side: heavy ? 1 : mo.swingSide, t: 0, life: heavy ? 0.34 : kind === 'final' ? 0.28 : 0.22, c1: '#ffffff', c2: tint, size: heavy ? 1.25 : kind === 'final' ? 1.2 : 0.95 });
        if (heavy) dust(fx, e.x, e.y, 8, 0, 1, 2.4);
      }
    }
    if (e.k === 'shoot') {
      mo.shootStart = now; mo.shootAng = e.ang;
      fx.push({ kind: 'flash', x: e.x + Math.cos(e.ang) * 0.8, y: e.y - HAND_Y / 32 + Math.sin(e.ang) * 0.8, r: 0.36, ang: e.ang, t: 0, life: 0.08, c1: '#ffffff', c2: '#ffd84a' });
    }
    if (e.k === 'hurt') mo.hurtStart = now;
    if (e.k === 'perfeita' && mo.last) mo.ghosts.push({ x: p.x, y: p.y, born: now, life: 650, ...mo.last, sx: 1, sy: 1, lean: 0, color: '#3a5aff' });
  }
}

/** Sprite pintado de uma cor só (fantasma). Guardado por imagem e cor. */
const tints = new WeakMap<object, Map<string, HTMLCanvasElement>>();
export function tinted(img: CanvasImageSource & { width: number; height: number }, color: string): HTMLCanvasElement {
  let m = tints.get(img);
  if (!m) { m = new Map(); tints.set(img, m); }
  let c = m.get(color);
  if (!c) {
    c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d')!;
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    m.set(color, c);
  }
  return c;
}

/** Desenha os fantasmas vivos (a cambalhota e a investida deixam um rastro do boneco). */
export function drawGhosts(ctx: CanvasRenderingContext2D, mo: Motion, now: number, T: number, scale: number) {
  mo.ghosts = mo.ghosts.filter(g => now - g.born < g.life);
  for (const g of mo.ghosts) {
    const k = (now - g.born) / g.life;
    if (k < 0) continue;
    ctx.save();
    ctx.globalAlpha = (g.life > 400 ? 0.7 : 0.45) * (1 - k);
    ctx.translate(g.x * T, g.y * T + 2); ctx.rotate(g.lean); ctx.scale(g.sx * scale, g.sy * scale);
    ctx.drawImage(tinted(g.img as HTMLCanvasElement, g.color), -g.w / 2, -g.h * 0.9375, g.w, g.h);
    ctx.restore();
  }
}

export const ROW: Record<Dir, number> = { south: 0, west: 1, east: 2, north: 3 };
export const dirOf = (dx: number, dy: number): Dir => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : dy > 0 ? 'south' : 'north');

export interface Pose {
  img: CanvasImageSource | undefined;
  dir: Dir;
  /** deslocamento (px), inclinação (rad) e escala do corpo (encolhe e estica) */
  ox: number; oy: number; lean: number; sx: number; sy: number;
  /** progresso do golpe (0–1) ou -1 */
  swing: number;
  dashing: boolean; shooting: boolean; hurt: boolean;
}

/** Escolhe o quadro e o movimento do corpo agora. */
export function poseOf(run: Run, mo: Motion, now: number, frames: {
  walk: Record<Dir, HTMLCanvasElement[]> | null; combat: HTMLCanvasElement[][] | null; dodge: HTMLCanvasElement[][] | null;
}, faceDir: Dir): Pose {
  const p = run.p, moving = Math.hypot(p.dx, p.dy) > 0.1;
  const sw = now - mo.swingStart, swinging = p.swing > 0 && sw < 300;
  const k = swinging ? Math.min(1, sw / 190) : -1;
  const shooting = p.hand === 1 && now - mo.shootStart < 150;
  const dashing = p.dash > 0, dk = dashing ? Math.min(1, p.dashAge / DASH_T) : 0;
  const dir: Dir = swinging ? dirOf(Math.cos(mo.swingAng), Math.sin(mo.swingAng)) : shooting ? dirOf(Math.cos(mo.shootAng), Math.sin(mo.shootAng)) : dashing ? dirOf(mo.dashDx, mo.dashDy) : faceDir;
  const row = ROW[dir];
  let img: CanvasImageSource | undefined, ox = 0, oy = 0, lean = 0, sx = 1, sy = 1;
  if (dashing) {
    if (frames.dodge) { img = frames.dodge[row]?.[Math.min(3, Math.floor(dk * 4))]; oy = -Math.sin(dk * Math.PI) * 3; }
    else {
      // sem a folha da cambalhota: encolhe, vai baixo e esticado inclinado para onde vai, e cai de volta
      img = frames.walk?.[dir][1];
      const sq = dk < 0.22 ? dk / 0.22 : dk > 0.78 ? (1 - dk) / 0.22 : 1;
      sx = 1 + 0.18 * sq; sy = 1 - 0.26 * sq; lean = mo.dashDx * 0.4 * sq + 0.08 * sq * Math.sign(mo.dashDx || 1);
      oy = -Math.sin(dk * Math.PI) * 4;
    }
  } else if (swinging) {
    // antecipação (puxa para trás), golpe (passinho para a frente) e volta
    const hit = k < 0.18 ? -(k / 0.18) * 0.6 : k < 0.5 ? 1 : Math.max(0, 1 - (k - 0.5) / 0.5);
    const lx = Math.cos(mo.swingAng), ly = Math.sin(mo.swingAng);
    ox = lx * 4 * hit; oy = ly * 2.5 * hit;
    if (frames.combat) img = frames.combat[row]?.[k < 0.18 ? 0 : k < 0.5 ? 1 : 2];
    else { img = frames.walk?.[dir][k < 0.18 ? 0 : 2]; lean = lx * 0.16 * hit; sx = 1 + 0.07 * Math.abs(hit); sy = 1 - 0.06 * Math.abs(hit); }
  } else if (shooting) {
    const kk = (now - mo.shootStart) / 150;
    ox = -Math.cos(mo.shootAng) * 2.5 * (1 - kk);
    img = frames.combat ? frames.combat[row]?.[3] : frames.walk?.[dir][0];
  } else {
    img = frames.walk?.[dir][moving ? Math.floor(now / 130) % 4 : 0];
    // respira parado (bem de leve)
    if (!moving) sy = 1 + Math.sin(now / 260) * 0.015;
  }
  return { img, dir, ox, oy, lean, sx, sy, swing: k, dashing, shooting, hurt: now - mo.hurtStart < 170 };
}

/** Ângulo da arma curta agora: descansando no ombro, puxada no pesado ou cortando. */
export function bladeAngle(mo: Motion, pose: Pose, aim: number, heavy: number): number {
  if (pose.swing >= 0) {
    const k = pose.swing, side = mo.swingSide, arc = mo.swingKind === 'pesado' && mo.swingArc >= 6.2 ? Math.PI * 2 : mo.swingArc;
    if (mo.swingKind === 'investida' || (mo.swingKind === 'pesado' && mo.swingArc < 6.2)) return mo.swingAng;
    const a0 = arc >= 6.2 ? mo.swingAng : mo.swingAng - (side * arc) / 2;
    if (k < 0.18) return a0 - side * 0.45 * (k / 0.18);
    const q = Math.min(1, (k - 0.18) / 0.32);
    return a0 - side * 0.45 * (1 - q) + side * arc * (1 - Math.pow(1 - q, 3));
  }
  if (heavy > 0) return aim + Math.PI - 0.5 - heavy * 0.4;
  // descansando: para cima e para trás, do lado de quem olha
  return pose.dir === 'west' ? -Math.PI / 2 + 0.75 : -Math.PI / 2 - 0.75;
}
