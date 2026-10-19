// Movimento do caçador na tela (só desenho; o motor não muda), versão 2:
// golpe da espada com antecipação, corte e acompanhamento + rastro em pixel;
// cambalhota com os quadros do GPT (agacha, rola, chega) ou encolhe/estica, 2
// fantasmas pontilhados (não a mancha azul) e poeira em pixel; investida com 3
// fantasmas e estocada; tiro com clarão e coice; piscada vermelha ao apanhar.
// Também vê o que SUMIU entre um passo e outro (aviso que fechou, tiro e peça
// de carta que acabaram) para tocar o impacto ali.
import { DASH_T, type Run, type Warn } from '@/game/dungeon';
import { weapon } from '@/game/dungeon-weapons';
import type { Element } from '@/lib/tcg/types';
import type { Dir } from '@/game/world/movement';
import { GOLPE, pick, SHEET } from './card-sprites';
import { anim, colorsOf, golpe, impact, type Fx } from './dungeon-vfx';

export type SwingKind = 'leve' | 'final' | 'pesado' | 'investida';

export interface Ghost { x: number; y: number; born: number; life: number; img: CanvasImageSource; w: number; h: number; sx: number; sy: number; lean: number; color: string; solid?: boolean }

interface Gone { x: number; y: number; card: string; el: Element; mine: boolean; m: string; r: number; vx: number; vy: number; own: boolean }

export interface Motion {
  ghosts: Ghost[];
  prevDash: number;
  dashStart: number; dashEnd: number; dashDx: number; dashDy: number; dashGhosts: number;
  swingStart: number; swingAng: number; swingArc: number; swingSide: number; swingKind: SwingKind;
  shootStart: number; shootAng: number;
  hurtStart: number;
  /** último quadro desenhado do boneco (para os fantasmas) */
  last: { img: CanvasImageSource; w: number; h: number } | null;
  /** avisos, tiros e peças do passo anterior (quando somem, sai o impacto) */
  warns: Map<number, Warn>;
  shots: Map<number, { x: number; y: number; mine: boolean; kind: string; el?: Element }>;
  acts: Map<number, Gone>;
  /** feixes já vistos (o novo toca a folha ao longo do corte) */
  beams: Set<number>;
}

export const newMotion = (): Motion => ({
  ghosts: [], prevDash: 0, dashStart: -1e9, dashEnd: -1e9, dashDx: 1, dashDy: 0, dashGhosts: 0,
  swingStart: -1e9, swingAng: 0, swingArc: 1.6, swingSide: 1, swingKind: 'leve',
  shootStart: -1e9, shootAng: 0, hurtStart: -1e9, last: null, warns: new Map(), shots: new Map(), acts: new Map(), beams: new Set(),
});

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** Altura da mão (px) acima dos pés: de onde sai o corte e o tiro. */
export const HAND_Y = 14;

/**
 * Poeira nos pés (saída e chegada da esquiva, pisada do pesado): a nuvem da
 * folha dos golpes; sem ela, nuvens de pixel em 2 tons.
 */
function dust(fx: Fx[], x: number, y: number, n: number, dx: number, dy: number, sp = 1.4) {
  if (golpe(fx, GOLPE.estocada, [4, 5], x + Math.sign(dx) * 0.15, y + 0.15, n >= 4 ? 44 : 32, { foot: true, life: 0.26 })) return;
  for (let k = 0; k < n; k++) {
    const a = Math.atan2(dy, dx) + rnd(-0.8, 0.8);
    fx.push({ kind: 'smoke', x: x + rnd(-0.15, 0.15), y: y + 0.05, vx: Math.cos(a) * sp * rnd(0.5, 1), vy: Math.sin(a) * sp * 0.5 * rnd(0.5, 1) - 0.2, r: rnd(0.14, 0.24), t: 0, life: rnd(0.26, 0.36), c1: '#e8e0d8', c2: '#9a8c90' });
  }
}

/** Fantasma do boneco agora (a esquiva e a investida deixam 2–3, espaçados). */
function ghostNow(mo: Motion, x: number, y: number, now: number, life: number, color: string, lean = 0, solid = false) {
  if (mo.last) mo.ghosts.push({ x, y, born: now, life, ...mo.last, sx: 1, sy: 1, lean, color, solid });
}

/** Depois de cada passo do motor: esquiva, golpes (rastro), tiros, dano e o que sumiu. */
export function trackMotion(mo: Motion, run: Run, fx: Fx[], now: number) {
  const p = run.p;
  if (p.dash > 0 && mo.prevDash <= 0) {
    const l = Math.hypot(p.dx, p.dy) || 1;
    mo.dashStart = now; mo.dashDx = p.dx / l; mo.dashDy = p.dy / l; mo.dashGhosts = 0;
    dust(fx, p.x, p.y, 3, -mo.dashDx, -mo.dashDy, 2);
    // 3 linhas de velocidade atrás
    for (let k = 0; k < 3; k++) {
      const o = (k - 1) * 0.22, bx = p.x - mo.dashDx * 0.4 - mo.dashDy * o, by = p.y - 0.45 - mo.dashDy * 0.4 + mo.dashDx * o;
      fx.push({ kind: 'line', x: bx, y: by, x2: bx - mo.dashDx * (0.6 + k % 2 * 0.3), y2: by - mo.dashDy * (0.6 + k % 2 * 0.3), t: 0, life: 0.1, c1: '#dff4ff' });
    }
  }
  // 2 fantasmas no caminho (a 1/3 e 2/3 da esquiva)
  if (p.dash > 0 && mo.dashGhosts < 2 && p.dashAge > DASH_T * (mo.dashGhosts + 1) / 3) {
    mo.dashGhosts++;
    ghostNow(mo, p.x, p.y, now, 200, '#7ad8ff');
  }
  if (p.dash <= 0 && mo.prevDash > 0) { mo.dashEnd = now; dust(fx, p.x, p.y, 2, mo.dashDx, mo.dashDy, 1); }
  mo.prevDash = p.dash;

  // aviso que fechou agora: anel de choque e poeira onde o golpe caiu
  const live = new Set(run.warns.map(w => w.id));
  for (const [id, w] of mo.warns) {
    if (live.has(id) || w.t > 0.12) continue;
    const soft = w.dmg <= 0 && !w.st;
    if (w.kind === 'circle') {
      fx.push({ kind: 'ring', x: w.x, y: w.y, r: w.r * 1.1, t: 0, life: 0.22, c1: soft ? '#ffb070' : '#ff6a5a', c2: soft ? '#ffe0b0' : '#ffd0c8' });
      dust(fx, w.x, w.y, Math.min(4, 1 + Math.round(w.r * 1.5)), 0, 1, 1.6 + w.r);
    } else {
      for (let q = 0.2; q <= 1; q += 0.27) dust(fx, w.x + (w.x2 - w.x) * q, w.y + (w.y2 - w.y) * q, 1, w.x2 - w.x, w.y2 - w.y, 1.2);
    }
  }
  mo.warns = new Map(run.warns.map(w => [w.id, { ...w }]));

  // tiro que acabou (bateu ou chegou longe): estrelinha e 2 faíscas na cor dele
  const liveShots = new Set(run.shots.map(s => s.id));
  for (const [id, s] of mo.shots) {
    if (liveShots.has(id)) continue;
    const col = s.mine ? (s.kind === 'magia' ? '#ff7ad8' : '#ffd84a') : s.kind === 'magia' ? '#a06aff' : '#ff5ad8';
    fx.push({ kind: 'flash', x: s.x, y: s.y, r: 0.32, ang: Math.PI / 4, t: 0, life: 0.1, c1: '#ffffff', c2: col });
    for (let k = 0; k < 2; k++) fx.push({ kind: 'spark', x: s.x, y: s.y, vx: rnd(-3, 3), vy: rnd(-3, 1), t: 0, life: 0.18, c1: col, c2: col });
  }
  mo.shots = new Map(run.shots.map(s => [s.id, { x: s.x, y: s.y, mine: s.mine, kind: s.kind, el: s.el }]));

  // peça de carta que acabou (tiro da carta bateu, tornado parou): toca o fim da folha ali
  const liveActs = new Set(run.acts.map(a => a.id));
  for (const [id, g] of mo.acts) {
    if (liveActs.has(id)) continue;
    if (g.m === 'proj' || g.m === 'tornado') impact(fx, g.card, g.el, g.x, g.y, Math.max(0.7, g.r * 1.6), g.own ? 1 : 0.8);
  }
  mo.acts = new Map(run.acts.filter(a => a.mv.m === 'proj' || a.mv.m === 'tornado').map(a => [a.id, { x: a.x, y: a.y, card: a.card, el: a.el, mine: a.mine, m: a.mv.m, r: a.r, vx: a.vx, vy: a.vy, own: !!SHEET[a.card.replace(/\+$/, '')] }]));

  // feixe novo de carta cuja folha não tem feixe deitado (corte, broca...): a folha toca inteira ao longo dele
  const beams = new Set<number>();
  for (const a of run.acts) {
    if (a.mv.m !== 'raio') continue;
    beams.add(a.id);
    if (mo.beams.has(a.id)) continue;
    const pk = pick(a.card, a.el, 'feixe');
    if (!pk || ((pk.info.feixe !== undefined || pk.info.beam3) && !a.mv.cone)) continue;
    const L = Math.min(a.mv.len, 7), mx = a.x + Math.cos(a.ang) * L * 0.5, my = a.y - 0.3 + Math.sin(a.ang) * L * 0.5;
    anim(fx, pk, mx, my, Math.max(80, L * 32 * 0.9), { frames: [pk.info.voo[0], pk.info.fim[1]], ang: pk.info.dir ? a.ang - (pk.info.rot ?? 0) : 0, life: Math.max(0.36, a.mv.dur) });
  }
  mo.beams = beams;

  for (const e of run.ev) {
    if (e.k === 'swing') {
      const kind = e.kind ?? 'leve', hy = e.y - HAND_Y / 32;
      mo.swingStart = now; mo.swingAng = e.ang; mo.swingArc = e.arc; mo.swingKind = kind;
      // o 1º e o 2º golpes do combo vão em lados opostos; o 3º (final) volta largo
      mo.swingSide = kind === 'leve' ? -mo.swingSide : 1;
      const w = weapon(p.arms[0].id);
      const tint = e.card ? colorsOf(e.card, e.el ?? 'Steel')[0] : kind === 'pesado' ? '#ffb83a' : w.id === 'foice' ? '#b98aff' : kind === 'final' ? '#5ab8ff' : '#8fd8ff';
      if (kind === 'investida' || (kind === 'pesado' && e.arc < 6.2)) {
        // estocada: da posição de antes até a ponta
        const back = kind === 'investida' ? 2.2 : 0, len = kind === 'investida' ? 3 : e.range;
        const sx = e.x - Math.cos(e.ang) * back, sy = hy - Math.sin(e.ang) * back;
        // estocada da folha dos golpes, ao longo do ângulo; sem ela, o traço em pixel
        if (!golpe(fx, GOLPE.estocada, [0, 3], sx + Math.cos(e.ang) * len * 0.5, sy + Math.sin(e.ang) * len * 0.5, Math.max(56, len * 32 * 1.05), { ang: e.ang, life: 0.22 }))
          fx.push({ kind: 'thrust', x: sx, y: sy, x2: sx + Math.cos(e.ang) * len, y2: sy + Math.sin(e.ang) * len, r: kind === 'pesado' ? 0.42 : 0.32, t: 0, life: 0.22, c1: '#ffffff', c2: tint });
        if (kind === 'investida' && mo.last) for (let g = 1; g <= 3; g++) {
          const q = g / 4;
          mo.ghosts.push({ x: e.x - Math.cos(e.ang) * back * (1 - q), y: e.y - Math.sin(e.ang) * back * (1 - q), born: now - (3 - g) * 30, life: 220, ...mo.last, sx: 1, sy: 1, lean: Math.cos(e.ang) * 0.15, color: '#7ad8ff' });
        }
      } else {
        const heavy = kind === 'pesado', full = e.arc >= 6.2;
        // golpe de carta com folha de corte: só a folha da carta (o corte da arma junto só embaralha)
        const cardCut = e.card ? pick(e.card, e.el ?? 'Steel', 'corte') : null;
        const d = Math.min(1.1, e.range * 0.5);
        const ok = cardCut ? true
          : full ? golpe(fx, GOLPE.giro, [0, 5], e.x, e.y - 0.2, Math.max(90, e.range * 32 * 2.3), { life: 0.32 })
          : golpe(fx, kind === 'final' ? GOLPE.final : mo.swingSide > 0 ? GOLPE.corteA : GOLPE.corteB, [0, 3], e.x + Math.cos(e.ang) * d, hy + Math.sin(e.ang) * d * 0.8, Math.max(58, e.range * 32 * (kind === 'final' ? 1.75 : 1.5)), { ang: e.ang, life: kind === 'final' ? 0.25 : 0.2 });
        if (!ok) fx.push({ kind: 'slash', x: e.x, y: hy, r: e.range, ang: e.ang, arc: e.arc, side: heavy ? 1 : mo.swingSide, t: 0, life: heavy ? 0.3 : kind === 'final' ? 0.25 : 0.2, c1: '#ffffff', c2: tint, size: heavy ? 1.25 : kind === 'final' ? 1.15 : 0.95 });
        if (heavy) dust(fx, e.x, e.y, 5, 0, 1, 2.4);
      }
      // golpe de carta: a folha dela toca no corte (a própria ou a do elemento)
      if (e.card) {
        const pk = pick(e.card, e.el ?? 'Steel', 'corte');
        if (pk) {
          const d = Math.min(1.2, e.range * 0.55), full = e.arc >= 6.2;
          anim(fx, pk, e.x + (full ? 0 : Math.cos(e.ang) * d), hy + (full ? 0 : Math.sin(e.ang) * d), Math.max(64, e.range * 32 * 1.7), { frames: [pk.info.voo[0], pk.info.fim[1]], ang: pk.info.dir && !full ? e.ang - (pk.info.rot ?? 0) : 0, life: 0.32 });
        }
      }
    }
    if (e.k === 'shoot') {
      mo.shootStart = now; mo.shootAng = e.ang;
      const mx = e.x + Math.cos(e.ang) * 0.8, my = e.y - HAND_Y / 32 + Math.sin(e.ang) * 0.8;
      if (!golpe(fx, GOLPE.faisca, [3, 5], mx, my, 34, { ang: e.ang, life: 0.1 }))
        fx.push({ kind: 'flash', x: mx, y: my, r: 0.36, ang: e.ang, t: 0, life: 0.09, c1: '#ffffff', c2: '#ffd84a' });
    }
    if (e.k === 'hurt') mo.hurtStart = now;
    // esquiva perfeita: a Sombra fica no lugar (silhueta azul-escura cheia)
    if (e.k === 'perfeita') ghostNow(mo, p.x, p.y, now, 650, '#2a3aaa', 0, true);
  }
}

/** Sprite pintado de uma cor só. Guardado por imagem e cor. */
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

/**
 * Fantasma: o próprio quadro, com as cores do boneco, só puxado de leve para a
 * cor do fantasma (a Sombra da esquiva perfeita é a silhueta cheia). Guardado
 * por imagem e cor.
 */
const ghostCache = new WeakMap<object, Map<string, HTMLCanvasElement>>();
function ghostImg(img: CanvasImageSource & { width: number; height: number }, color: string, solid: boolean): HTMLCanvasElement {
  let m = ghostCache.get(img);
  if (!m) { m = new Map(); ghostCache.set(img, m); }
  const key = color + (solid ? 's' : '');
  let c = m.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d')!;
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = solid ? 1 : 0.35; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    m.set(key, c);
  }
  return c;
}

/** Desenha os fantasmas vivos: meio transparentes e, no fim, piscando. */
export function drawGhosts(ctx: CanvasRenderingContext2D, mo: Motion, now: number, T: number, scale: number) {
  mo.ghosts = mo.ghosts.filter(g => now - g.born < g.life);
  for (const g of mo.ghosts) {
    const k = (now - g.born) / g.life;
    if (k < 0 || (k > 0.6 && Math.floor(now / 40) % 2)) continue;
    ctx.save();
    ctx.translate(Math.round(g.x * T), Math.round(g.y * T + 2)); ctx.rotate(g.lean); ctx.scale(g.sx * scale, g.sy * scale);
    ctx.globalAlpha = g.solid ? 0.75 : 0.5;
    ctx.drawImage(ghostImg(g.img as HTMLCanvasElement, g.color, !!g.solid), -g.w / 2, -g.h * 0.9375, g.w, g.h);
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
  // chegada da cambalhota: o quadro de "levantando" fica um instante (só se parado)
  const landing = !dashing && !swinging && !shooting && !moving && now - mo.dashEnd < 90;
  const dir: Dir = swinging ? dirOf(Math.cos(mo.swingAng), Math.sin(mo.swingAng)) : shooting ? dirOf(Math.cos(mo.shootAng), Math.sin(mo.shootAng)) : dashing || landing ? dirOf(mo.dashDx, mo.dashDy) : faceDir;
  const row = ROW[dir];
  let img: CanvasImageSource | undefined, ox = 0, oy = 0, lean = 0, sx = 1, sy = 1;
  if (dashing) {
    if (frames.dodge) {
      // agacha (pouco), rola (2 quadros, o miolo da esquiva) e já põe o pé no chão
      img = frames.dodge[row]?.[dk < 0.16 ? 0 : dk < 0.5 ? 1 : dk < 0.84 ? 2 : 3];
      oy = -Math.round(Math.sin(dk * Math.PI) * 4);
    } else {
      // sem a folha da cambalhota: encolhe, vai baixo e esticado inclinado para onde vai, e cai de volta
      img = frames.walk?.[dir][1];
      const sq = dk < 0.22 ? dk / 0.22 : dk > 0.78 ? (1 - dk) / 0.22 : 1;
      sx = 1 + 0.18 * sq; sy = 1 - 0.26 * sq; lean = mo.dashDx * 0.4 * sq + 0.08 * sq * Math.sign(mo.dashDx || 1);
      oy = -Math.round(Math.sin(dk * Math.PI) * 4);
    }
  } else if (landing && frames.dodge) {
    img = frames.dodge[row]?.[3];
  } else if (swinging) {
    // antecipação (puxa para trás), golpe (passinho para a frente) e volta
    const hit = k < 0.18 ? -(k / 0.18) * 0.6 : k < 0.5 ? 1 : Math.max(0, 1 - (k - 0.5) / 0.5);
    const lx = Math.cos(mo.swingAng), ly = Math.sin(mo.swingAng);
    ox = Math.round(lx * 4 * hit); oy = Math.round(ly * 2.5 * hit);
    if (frames.combat) img = frames.combat[row]?.[k < 0.18 ? 0 : k < 0.5 ? 1 : 2];
    else { img = frames.walk?.[dir][k < 0.18 ? 0 : 2]; lean = lx * 0.16 * hit; sx = 1 + 0.07 * Math.abs(hit); sy = 1 - 0.06 * Math.abs(hit); }
  } else if (shooting) {
    const kk = (now - mo.shootStart) / 150;
    ox = -Math.round(Math.cos(mo.shootAng) * 2.5 * (1 - kk));
    img = frames.combat ? frames.combat[row]?.[3] : frames.walk?.[dir][0];
  } else {
    img = frames.walk?.[dir][moving ? Math.floor(now / 130) % 4 : 0];
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
