// Efeitos da masmorra (sem sangue), versão 2: tudo em pixel art.
// - O que é desenhado em código (anéis, faíscas, poeira, rastro do corte,
//   feixes sem folha, zonas, avisos) vai para a CAMADA DE PIXEL (pixel-fx.ts):
//   meia resolução, borda dura, transparência em pontilhado, 24 quadros/s.
// - As peças das cartas usam os SPRITES do GPT (card-sprites.ts): a folha da
//   própria carta (Épica+) ou a do elemento (Comum–Rara, menor): o tiro voa
//   tocando os quadros, o feixe é montado da folha (origem, corpo, ponta), a
//   zona e o tornado tocam em loop, e cada explosão toca os quadros do fim.
// - Os ESTADOS em cima dos corpos e a CENA das cartas grandes também estão aqui.
// Ordem de desenho de cada camada: o código (`drawFx`, `drawActs(..., 'px')`)
// entra na camada; depois da camada vão os sprites (`drawFxTop`, `drawActs(..., 'top')`).
import type { Act, Ev, Run } from '@/game/dungeon';
import { REACTIONS, type Bag, type Look, type ReactionId } from '@/game/dungeon-moves';
import type { Element } from '@/lib/tcg/types';
import { drawBeam, drawBeam3, drawFrame, drawLook, GOLPE, loopFrame, pick, sheetImg, sheetInfo, SHEET, type Pick } from './card-sprites';
import { mix, PixelLayer, pxCrescent, pxPuff, pxRing, pxStar, pxStreak, ramp, stepT, type Ramp } from './pixel-fx';

export const EL_COLOR: Record<Element, [string, string]> = {
  Fire: ['#ff6a2a', '#ffd84a'], Water: ['#2a8aff', '#bfe8ff'], Grass: ['#3ac85a', '#ffb0d8'], Electric: ['#ffe03a', '#ffffff'],
  Ice: ['#7ae8ff', '#ffffff'], Fighting: ['#ff9a3a', '#fff0c0'], Poison: ['#a04ad8', '#7aff6a'], Ground: ['#b8843a', '#5a3a1a'],
  Flying: ['#d8f4ff', '#8ad0ff'], Ghost: ['#a87aff', '#e0d0ff'], Dark: ['#4a1a6a', '#ff3a6a'], Steel: ['#c8d8e8', '#ffffff'],
};
/** Cores próprias de algumas cartas (o Zoltraak é branco e roxo, a Amaterasu é preta...). */
const CARD_COLOR: Record<string, [string, string]> = {
  zoltraak: ['#c8a0ff', '#ffffff'], amaterasu: ['#1a0a14', '#a01a3a'], 'vazio-roxo': ['#8a3aff', '#ffd0ff'], kamehameha: ['#3a9aff', '#e0f8ff'],
  'final-flash': ['#ffe03a', '#ffffff'], excalibur: ['#ffd84a', '#ffffff'], 'enuma-elish': ['#ff3a3a', '#1a0a0a'], 'black-flash': ['#1a0a1a', '#ff3a4a'],
  'gae-bolg': ['#c81a3a', '#e8e8f0'], senbonzakura: ['#ff9ad8', '#ffffff'], 'tita-colossal': ['#ff7a2a', '#fff0c0'],
};
export const colorsOf = (card: string, el: Element): [string, string] => CARD_COLOR[card] ?? EL_COLOR[el] ?? ['#ffffff', '#ffffff'];
/** Peça de carta do inimigo: rosa-choque (perigo), em qualquer elemento. */
const FOE: [string, string] = ['#ff3a8a', '#ffd0e8'];

export interface Fx {
  kind: 'ring' | 'beam' | 'arc' | 'bolt' | 'smoke' | 'spark' | 'text' | 'debris' | 'petal' | 'zap' | 'big' | 'slash' | 'thrust' | 'flash' | 'line' | 'anim';
  x: number; y: number; x2?: number; y2?: number;
  /** slash: lado do corte (1 ou -1) */
  side?: number;
  r?: number; ang?: number; arc?: number; vx?: number; vy?: number;
  t: number; life: number; c1: string; c2?: string; text?: string; size?: number;
  /** anim: folha de efeito, quadros (do f0 ao f1) e se fica de pé no chão */
  sheet?: string; f0?: number; f1?: number; foot?: boolean;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** Número 0–1 que muda só a cada quadro de efeito (o tremido anda em degraus). */
const jit = (i: number, t: number) => { const s = Math.sin(i * 127.1 + Math.floor(t * 24) * 311.7) * 43758.5453; return s - Math.floor(s); };

const REACT_COLOR: Record<string, string> = { congelou: '#bff0ff', choque: '#fff07a', incendio: '#ff8a3a', derreteu: '#ffb07a', toxica: '#b07aff', espalhou: '#d8f4ff', lama: '#c8a06a', vapor: '#e0e0f0', paralisou: '#ffe03a', estilhacou: '#e8ffff' };

/** Texto grande sem cobrir o outro: sobe se já tem um vivo ali perto. */
function pushBig(out: Fx[], f: Fx) {
  const near = out.filter(o => (o.kind === 'big' || o.kind === 'text') && o.t < o.life && Math.abs(o.x - f.x) < 1.6 && Math.abs(o.y - f.y) < 0.9).length;
  f.y -= near * 0.42;
  out.push(f);
}

/** Toca os quadros de uma folha uma vez (explosão, corte da carta, aparição). */
export function anim(out: Fx[], p: Pick, x: number, y: number, size: number, o: { frames?: [number, number]; ang?: number; foot?: boolean; life?: number } = {}) {
  const [f0, f1] = o.frames ?? p.info.fim;
  out.push({ kind: 'anim', sheet: p.id, f0, f1, x, y, size: size * p.scale, ang: o.ang ?? 0, foot: o.foot, t: 0, life: o.life ?? 0.07 * (f1 - f0 + 1) + 0.04, c1: '#fff' });
}

/** Toca uma linha da folha dos golpes do caçador (`GOLPE.*`). false se a folha não chegou (aí vale o desenho em pixel). */
export function golpe(out: Fx[], id: string, frames: [number, number], x: number, y: number, size: number, o: { ang?: number; life?: number; foot?: boolean } = {}): boolean {
  const info = sheetInfo(id);
  if (!info || !sheetImg(id)) return false;
  anim(out, { id, info, own: true, scale: 1 }, x, y, size, { frames, ang: o.ang, life: o.life, foot: o.foot });
  return true;
}

/** Explosão de uma carta (ou do elemento): os quadros do fim, em pé se for pilar/chama. */
export function impact(out: Fx[], card: string | undefined, el: Element, x: number, y: number, r: number, big = 1) {
  const p = pick(card ?? '', el, 'impacto');
  if (!p) return;
  const foot = p.info.kind === 'pilar' || p.info.kind === 'zona' || p.info.kind === 'redemoinho';
  anim(out, p, x, foot ? y + 0.3 : y - 0.2, Math.min(220, Math.max(44, r * 32 * 2.4)) * big, { foot });
}

/** Peças que não aparecem sozinhas na sala: quando a carta é só elas, a folha toca no caçador. */
const QUIET = new Set(['transformar', 'buff', 'invocar', 'marca', 'cinematica', 'parar_tiros']);

/** Transforma os acontecimentos do passo em efeitos na tela. Devolve a tremida da tela que eles pedem. */
export function fxFrom(evs: Ev[], out: Fx[]): number {
  let shake = 0;
  for (const e of evs) {
    switch (e.k) {
      case 'swing':
        // o rastro do golpe nasce em player-vfx.ts (trackMotion), junto com a arma
        if (e.kind === 'pesado') shake = Math.max(shake, 3);
        break;
      case 'hit':
        // estrela de impacto: a da folha dos golpes (bloqueio continua a de código, azul-acinzentada)
        if (e.block || !golpe(out, GOLPE.faisca, [0, 2], e.x, e.y - 0.35, e.crit ? 60 : 44, { life: e.crit ? 0.16 : 0.12 }))
          out.push({ kind: 'flash', x: e.x, y: e.y - 0.35, r: e.crit ? 0.75 : 0.5, ang: Math.round(rnd(0, 3)) * (Math.PI / 4), t: 0, life: e.crit ? 0.15 : 0.11, c1: '#ffffff', c2: e.block ? '#9ab8d8' : e.crit ? '#ffd84a' : '#8fd8ff' });
        pushBig(out, { kind: 'text', x: e.x + rnd(-0.2, 0.2), y: e.y - 0.6, vy: -1.6, t: 0, life: 0.7, c1: e.block ? '#9ab8d8' : e.crit ? '#ffd84a' : '#ffffff', text: e.block ? `${e.dmg}` : `${e.dmg}${e.crit ? '!' : ''}`, size: e.crit ? 13 : 10 });
        for (let k = 0; k < (e.crit ? 6 : 3); k++) out.push({ kind: 'spark', x: e.x, y: e.y - 0.3, vx: rnd(-4, 4), vy: rnd(-4, 1), t: 0, life: rnd(0.18, 0.28), c1: e.crit ? '#ffd84a' : '#ffffff', c2: e.crit ? '#ff8a2a' : '#8fd8ff' });
        if (e.crit) shake = Math.max(shake, 2);
        break;
      case 'kill':
        for (let k = 0; k < (e.elite ? 9 : 5); k++) out.push({ kind: 'smoke', x: e.x + rnd(-0.3, 0.3), y: e.y - 0.3 + rnd(-0.3, 0.3), vx: rnd(-0.6, 0.6), vy: rnd(-1.2, -0.3), r: rnd(0.22, 0.4), t: 0, life: rnd(0.4, 0.6), c1: e.elite ? '#ffd84a' : '#d8d0e8', c2: e.elite ? '#a8782a' : '#7a7090' });
        break;
      case 'break':
        for (let k = 0; k < 6; k++) out.push({ kind: e.kind === 'erva' ? 'petal' : 'debris', x: e.x, y: e.y, vx: rnd(-3, 3), vy: rnd(-4, -1), t: 0, life: 0.5, c1: e.kind === 'erva' ? '#5ac85a' : e.kind === 'cristal' ? '#7ab8ff' : e.kind === 'minerio' ? '#d8884a' : e.kind === 'barril' || e.kind === 'explosivo' ? '#a0703a' : e.kind === 'lampiao' ? '#ffd84a' : '#8a8090' });
        if (e.kind === 'explosivo') impact(out, undefined, 'Fire', e.x, e.y, 1.6);
        break;
      case 'deflect': out.push({ kind: 'ring', x: e.x, y: e.y, r: 0.5, t: 0, life: 0.16, c1: '#ffffff' }); break;
      case 'heal':
        out.push({ kind: 'text', x: e.x, y: e.y - 0.8, vy: -1.2, t: 0, life: 0.8, c1: '#7aff8a', text: '+', size: 14 });
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 0.8, t: 0, life: 0.3, c1: '#7aff8a' });
        break;
      case 'cast': {
        const [c1, c2] = colorsOf(e.card, e.el);
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 0.7, t: 0, life: 0.22, c1, c2 });
        // carta que não deixa peça na sala (transformar, invocar...): a folha toca em volta do caçador
        const own = SHEET[e.card.replace(/\+$/, '')];
        if (own && e.skill && e.skill.kit.moves.every(m => QUIET.has(m.m))) anim(out, { id: e.card.replace(/\+$/, ''), info: own, own: true, scale: 1 }, e.x, e.y + 0.3, 104, { frames: [own.voo[0], own.fim[1]], foot: true, life: 0.6 });
        break;
      }
      case 'reacao': {
        const r = REACTIONS[e.id as ReactionId];
        if (!r) break;
        pushBig(out, { kind: 'big', x: e.x, y: e.y - 1, vy: -0.8, t: 0, life: 1, c1: REACT_COLOR[e.id] ?? '#fff', text: r.nome, size: 10 });
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 1.4, t: 0, life: 0.35, c1: REACT_COLOR[e.id] ?? '#fff' });
        shake = Math.max(shake, 2);
        break;
      }
      case 'perfeita':
        pushBig(out, { kind: 'big', x: e.x, y: e.y - 1.3, vy: -0.6, t: 0, life: 1, c1: '#8ad0ff', text: 'ESQUIVA PERFEITA', size: 9 });
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 2.2, t: 0, life: 0.45, c1: '#8ad0ff', c2: '#3a5aff' });
        break;
      case 'parede':
        pushBig(out, { kind: 'text', x: e.x, y: e.y - 0.9, vy: -1, t: 0, life: 0.7, c1: '#ffb07a', text: 'PAREDE!', size: 8 });
        for (let k = 0; k < 5; k++) out.push({ kind: 'debris', x: e.x, y: e.y, vx: rnd(-3, 3), vy: rnd(-4, -1), t: 0, life: 0.5, c1: '#8a8090' });
        shake = Math.max(shake, 3);
        break;
      case 'postura':
        pushBig(out, { kind: 'big', x: e.x, y: e.y - 1.4, vy: -0.5, t: 0, life: 1.1, c1: '#ffe03a', text: e.boss ? 'POSTURA QUEBRADA!' : 'QUEBROU!', size: e.boss ? 10 : 8 });
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 1.6, t: 0, life: 0.35, c1: '#ffe03a' });
        shake = Math.max(shake, e.boss ? 6 : 3);
        break;
      case 'zap': out.push({ kind: 'zap', x: e.x, y: e.y, x2: e.x2, y2: e.y2, t: 0, life: 0.22, c1: '#ffe03a', c2: '#ffffff' }); break;
      case 'boom': {
        const [c1, c2] = e.card ? colorsOf(e.card, e.el) : EL_COLOR[e.el] ?? ['#fff', '#fff'];
        out.push({ kind: 'ring', x: e.x, y: e.y, r: e.r, t: 0, life: 0.3, c1, c2 });
        for (let k = 0; k < Math.min(8, 3 + e.r * 2); k++) {
          const a = (k / 8) * Math.PI * 2 + rnd(-0.3, 0.3), sp = rnd(3, 5) * Math.max(0.6, e.r / 2);
          out.push({ kind: e.el === 'Grass' ? 'petal' : e.el === 'Ground' ? 'debris' : 'spark', x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.72, t: 0, life: 0.35, c1: k % 2 ? c1 : (c2 ?? c1), c2: c1 });
        }
        impact(out, e.card, e.el, e.x, e.y, e.r);
        if (e.r >= 2) shake = Math.max(shake, Math.min(7, e.r * 1.5));
        break;
      }
      case 'abate': pushBig(out, { kind: 'big', x: e.x, y: e.y - 1, vy: -0.7, t: 0, life: 0.9, c1: '#ff5a6a', text: 'ABATE!', size: 9 }); break;
      case 'forma': shake = Math.max(shake, e.on ? 4 : 6); break;
      case 'hurt': shake = Math.max(shake, 4); break;
      case 'phase': case 'enrage': shake = Math.max(shake, 6); break;
    }
  }
  return shake;
}

const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const CODE = new Set<Fx['kind']>(['ring', 'beam', 'arc', 'bolt', 'smoke', 'spark', 'debris', 'petal', 'zap', 'slash', 'thrust', 'flash', 'line']);

/**
 * Anda os efeitos e desenha os de código na camada de pixel (T = px por
 * bloco). Devolve só os que continuam vivos. Os sprites e textos saem depois,
 * em `drawFxTop`, por cima da camada.
 */
export function drawFx(L: PixelLayer, list: Fx[], dt: number, T: number): Fx[] {
  const c = L.ctx, keep: Fx[] = [];
  for (const f of list) {
    f.t += dt;
    if (f.t >= f.life) continue;
    keep.push(f);
    if (f.vx !== undefined) { f.x += f.vx * dt; f.y += (f.vy ?? 0) * dt; if (f.kind === 'debris' || f.kind === 'petal') f.vy = (f.vy ?? 0) + 9 * dt; else if (f.kind === 'spark') { f.vx *= 1 - 4 * dt; f.vy = (f.vy ?? 0) * (1 - 4 * dt) + 3 * dt; } }
    else if (f.vy !== undefined) f.y += f.vy * dt;
    if (!CODE.has(f.kind)) continue;
    // o efeito anda em quadros (24 por segundo), não desliza
    const k = Math.min(0.999, stepT(f.t) / f.life), a = 1 - k;
    const X = f.x * T, Y = f.y * T;
    c.save();
    switch (f.kind) {
      case 'ring': {
        // onda de choque em pixel: 1º quadro um anel fino e claro; depois estoura em traços curtos que correm para fora
        const R = (f.r ?? 1) * T * (0.4 + 0.6 * easeOut(k * 1.3)), rp = ramp(f.c1, f.c2 ?? '#ffffff');
        if (k < 0.2) { pxRing(c, X, Y, R * 0.8, 3, rp[3]); break; }
        const n = Math.max(8, Math.min(16, Math.round(R / 5))), len = Math.max(4, R * 0.28 * a), w = Math.max(3, 6 * a);
        c.lineCap = 'butt';
        for (const [col, ww] of [[rp[0], w + 3], [k < 0.5 ? rp[3] : rp[1], w]] as const) {
          c.strokeStyle = col; c.lineWidth = ww; c.beginPath();
          for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2 + (f.ang ?? 0), cx = Math.cos(an), cy = Math.sin(an) * 0.72; c.moveTo(X + cx * R, Y + cy * R); c.lineTo(X + cx * (R + len), Y + cy * (R + len)); }
          c.stroke();
        }
        break;
      }
      case 'beam': case 'line': {
        const w = f.kind === 'line' ? 3 : (f.r ?? 0.6) * T * a;
        pxStreak(c, (f.x2 ?? f.x) * T, (f.y2 ?? f.y) * T, X, Y, w, f.c1);
        break;
      }
      case 'arc': {
        const r = (f.r ?? 1.5) * T, arc = Math.min(6.28, f.arc ?? 1.6);
        pxCrescent(c, X, Y, r, (f.ang ?? 0) - arc / 2, arc, 0, Math.min(1, k * 2.2), 8 * a + 3, 0, f.c1);
        break;
      }
      case 'bolt': case 'zap': {
        const x2 = (f.x2 ?? f.x) * T, y2 = (f.y2 ?? f.y) * T, steps = 6;
        const pts: [number, number][] = [[X, Y]];
        for (let s = 1; s < steps; s++) { const q = s / steps; pts.push([X + (x2 - X) * q + (jit(s, f.t) - 0.5) * 16, Y + (y2 - Y) * q + (jit(s + 9, f.t) - 0.5) * 16]); }
        pts.push([x2, y2]);
        c.lineJoin = 'miter'; c.lineCap = 'square';
        for (const [col, w] of [['#3a2a10', 7], [f.c1, 4], [f.c2 ?? '#ffffff', 2]] as const) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([px, py]) => c.lineTo(px, py)); c.stroke(); }
        break;
      }
      case 'smoke': {
        const r = (f.r ?? 0.3) * T * (0.7 + k * 0.6);
        pxPuff(c, X, Y, r, L.dither(f.c1, a * 1.4), L.dither(f.c2 ?? mix(f.c1, '#3a3048', 0.5), a * 1.4));
        break;
      }
      case 'spark': {
        const s = k < 0.5 ? 6 : 4;
        c.fillStyle = k < 0.35 ? '#ffffff' : k < 0.7 ? f.c1 : (f.c2 ?? f.c1);
        c.fillRect(Math.round(X - s / 2), Math.round(Y - s / 2), s, s);
        break;
      }
      case 'debris': c.fillStyle = '#2a2030'; c.fillRect(X - 4, Y - 4, 8, 8); c.fillStyle = f.c1; c.fillRect(X - 3, Y - 3, 5, 5); break;
      case 'petal': c.fillStyle = f.c1; c.save(); c.translate(X, Y); c.rotate(Math.floor(f.t * 12) * 0.8); c.fillRect(-4, -2, 8, 4); c.restore(); break;
      case 'slash': drawSlash(c, X, Y, f, k, T); break;
      case 'thrust': drawThrust(c, X, Y, f, k, T); break;
      case 'flash': {
        // estrela de impacto: grande e branca no 1º quadro, depois cor e encolhe
        const sz = (f.r ?? 0.4) * T * (k < 0.3 ? 1 : 1 - (k - 0.3)), ang = f.ang ?? 0;
        pxStar(c, X, Y, sz * 1.1, sz * 0.3, ang, k < 0.3 ? '#ffffff' : f.c2 ?? f.c1);
        pxStar(c, X, Y, sz * 0.62, sz * 0.18, ang, k < 0.3 ? (f.c2 ?? f.c1) : '#ffffff');
        break;
      }
    }
    c.restore();
  }
  return keep;
}

/** Sprites (quadros das folhas) e textos, por cima da camada de pixel. */
export function drawFxTop(ctx: CanvasRenderingContext2D, list: Fx[], T: number) {
  for (const f of list) {
    if (f.t >= f.life) continue;
    const X = f.x * T, Y = f.y * T;
    if (f.kind === 'anim') {
      const img = sheetImg(f.sheet!);
      if (!img) continue;
      const n = f.f1! - f.f0! + 1, fr = f.f0! + Math.min(n - 1, Math.floor((f.t / f.life) * n));
      drawFrame(ctx, img, fr, X, Y, f.size ?? 64, f.ang ?? 0, f.foot);
    } else if (f.kind === 'text' || f.kind === 'big') {
      const pop = f.kind === 'big' ? 1 + Math.max(0, 0.4 - f.t) * 1.2 : 1;
      ctx.save();
      ctx.font = `${Math.round((f.size ?? 10) * pop)}px 'Press Start 2P', monospace`; ctx.textAlign = 'center';
      // some piscando no fim (sem transparência: pixel não fica meio apagado)
      if (f.t > f.life * 0.75 && Math.floor(f.t * 16) % 2) { ctx.restore(); continue; }
      ctx.lineWidth = f.kind === 'big' ? 4 : 3; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1a0e20'; ctx.strokeText(f.text ?? '', Math.round(X), Math.round(Y));
      ctx.fillStyle = f.c1; ctx.fillText(f.text ?? '', Math.round(X), Math.round(Y));
      ctx.restore();
    }
  }
}

/**
 * Rastro do golpe em pixel: meia-lua de 4 faixas (contorno escuro, cor da
 * arma, clara e o fio branco na frente). Quadros: arco cheio e grosso → afina
 * pelo rabo → só a ponta → some. O chão em 3/4 achata o círculo (0,72).
 */
function drawSlash(c: CanvasRenderingContext2D, X: number, Y: number, f: Fx, k: number, T: number) {
  const full = (f.arc ?? 1.6) >= 6.2, side = f.side ?? 1, sweep = full ? Math.PI * 2 : Math.min(6.28, f.arc ?? 1.6);
  const R = (f.r ?? 1.4) * T * 0.95, thick = (f.size ?? 0.6) * T * 0.9;
  const a0 = full ? (f.ang ?? 0) : (f.ang ?? 0) - (side * sweep) / 2, sw = side * sweep;
  const head = easeOut(k / 0.3), tail = easeOut((k - 0.12) / 0.62);
  if (head - tail < 0.02) return;
  const rp = ramp(f.c2 ?? f.c1, '#ffffff'), th = thick * (k < 0.5 ? 1 : 1 - (k - 0.5) * 1.4);
  pxCrescent(c, X, Y, R + 3, a0, sw, tail, head, th + 6, 0, rp[0]);
  pxCrescent(c, X, Y, R, a0, sw, tail, head, th, 0, rp[1]);
  pxCrescent(c, X, Y, R - 1, a0, sw, tail + (head - tail) * 0.3, head, th * 0.55, 0, rp[2]);
  pxCrescent(c, X, Y, R - 1, a0, sw, Math.max(tail, head - 0.22), head, Math.max(3, th * 0.22), 0, '#ffffff');
}

/** Estocada em pixel: traço reto em faixas que afina para trás. */
function drawThrust(c: CanvasRenderingContext2D, X: number, Y: number, f: Fx, k: number, T: number) {
  const x2 = (f.x2 ?? f.x) * T, y2 = (f.y2 ?? f.y) * T, dx = x2 - X, dy = y2 - Y;
  const head = easeOut(k / 0.3), tail = easeOut((k - 0.1) / 0.65), w = (f.r ?? 0.35) * T * (k < 0.5 ? 1 : 1.5 - k);
  if (head - tail < 0.02) return;
  const hx = X + dx * head, hy = Y + dy * head, tx = X + dx * tail, ty = Y + dy * tail, rp = ramp(f.c2 ?? f.c1, '#ffffff');
  pxStreak(c, tx, ty, hx, hy, w + 6, rp[0]);
  pxStreak(c, tx, ty, hx, hy, w, rp[1]);
  pxStreak(c, tx + (hx - tx) * 0.4, ty + (hy - ty) * 0.4, hx, hy, Math.max(3, w * 0.4), '#ffffff');
}

// ─── desenho em pixel de cada `look` (o que voa nas cartas sem folha) ──────────

/** O objeto da peça (kunai, carta, martelo, bola...). `mono` = tudo de uma cor (contorno). */
function pxLook(c: CanvasRenderingContext2D, look: Look | undefined, x: number, y: number, ang: number, r: number, rp: Ramp, now: number, mono?: string) {
  const C = (col: string) => mono ?? col;
  c.save();
  c.translate(x, y);
  const spin = Math.floor(now / 42) * 0.42;
  switch (look) {
    case 'lamina': case 'lua': {
      c.rotate(ang);
      c.fillStyle = C(rp[1]); c.beginPath(); c.arc(0, 0, r * 1.3, -1.2, 1.2); c.arc(-r * 0.5, 0, r * 1.1, 1.1, -1.1, true); c.fill();
      c.fillStyle = C(rp[3]); c.beginPath(); c.arc(0, 0, r * 1.15, -0.8, 0.8); c.arc(-r * 0.2, 0, r * 1, 0.75, -0.75, true); c.fill();
      break;
    }
    case 'lanca': case 'kunai': case 'agulha': case 'espada': case 'flecha': {
      c.rotate(ang);
      const L = look === 'agulha' ? r * 2.6 : r * 3.4, W = Math.max(4, r * (look === 'agulha' ? 0.4 : 0.65));
      c.fillStyle = C(look === 'flecha' ? '#8a5a2a' : rp[1]); c.fillRect(-L / 2, -W / 2, L, W);
      c.fillStyle = C(rp[3]); c.beginPath(); c.moveTo(L / 2 + W * 2, 0); c.lineTo(L / 2, -W * 1.2); c.lineTo(L / 2, W * 1.2); c.fill();
      break;
    }
    case 'tubarao': {
      c.rotate(ang);
      c.fillStyle = C('#3a7ad8'); c.beginPath(); c.ellipse(0, 0, r * 1.6, r * 0.8, 0, 0, 7); c.fill();
      c.fillStyle = C('#bfe8ff'); c.beginPath(); c.ellipse(r * 0.2, r * 0.25, r * 1.1, r * 0.4, 0, 0, 7); c.fill();
      c.fillStyle = C('#2a5aa8'); c.beginPath(); c.moveTo(-r * 0.2, -r * 0.6); c.lineTo(r * 0.3, -r * 1.4); c.lineTo(r * 0.6, -r * 0.6); c.fill();
      c.beginPath(); c.moveTo(-r * 1.5, 0); c.lineTo(-r * 2.2, -r * 0.7); c.lineTo(-r * 2.2, r * 0.7); c.fill();
      if (!mono) { c.fillStyle = '#111'; c.fillRect(r * 0.9, -r * 0.3, 3, 3); }
      break;
    }
    case 'carta': c.rotate(spin * 2); c.fillStyle = C(rp[1]); c.fillRect(-r * 0.8, -r * 1.1, r * 1.6, r * 2.2); c.fillStyle = C('#ffffff'); c.fillRect(-r * 0.55, -r * 0.85, r * 1.1, r * 1.7); break;
    case 'martelo': c.rotate(spin * 3); c.fillStyle = C('#6a3a20'); c.fillRect(-r * 0.2, 0, r * 0.4, r * 1.7); c.fillStyle = C('#8a8a9a'); c.fillRect(-r * 1.2, -r * 0.7, r * 2.4, r * 1.3); c.fillStyle = C(rp[2]); c.fillRect(-r * 1.2, -r * 0.7, r * 2.4, r * 0.35); break;
    case 'estrela': case 'shuriken': {
      c.rotate(spin * 4);
      c.fillStyle = C(look === 'shuriken' ? '#c8d8e8' : rp[1]); c.beginPath();
      for (let k = 0; k < 8; k++) { const rr = k % 2 ? r * 0.45 : r * 1.35, a = (k / 8) * Math.PI * 2; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.fill(); c.fillStyle = C(rp[3]); c.beginPath(); c.arc(0, 0, r * 0.35, 0, 7); c.fill();
      break;
    }
    case 'dragao': case 'tigre': case 'lagarto': case 'asas': {
      c.rotate(ang);
      for (let k = 4; k >= 0; k--) { c.fillStyle = C(k % 2 ? rp[1] : rp[2]); c.beginPath(); c.arc(-k * r * 0.8, Math.sin(Math.floor(now / 42) * 0.5 + k) * r * 0.3, r * (1 - k * 0.12), 0, 7); c.fill(); }
      if (!mono) { c.fillStyle = '#fff'; c.fillRect(r * 0.3, -r * 0.45, 3, 3); c.fillRect(r * 0.3, r * 0.2, 3, 3); }
      if (look === 'asas') { c.fillStyle = C(rp[3]); c.beginPath(); c.moveTo(0, 0); c.lineTo(-r * 1.5, -r * 1.8); c.lineTo(-r * 0.6, 0); c.lineTo(-r * 1.5, r * 1.8); c.fill(); }
      break;
    }
    case 'petala': c.rotate(spin * 3); c.fillStyle = C(rp[1]); c.beginPath(); c.ellipse(0, 0, r, r * 0.5, 0, 0, 7); c.fill(); break;
    case 'punho': {
      c.rotate(ang);
      c.fillStyle = C(rp[1]); c.fillRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
      c.fillStyle = C(rp[3]); c.fillRect(r * 0.25, -r * 0.85, r * 0.6, r * 1.7);
      if (!mono) { c.fillStyle = rp[2]; for (const o of [-0.5, 0, 0.5]) c.fillRect(-r * 2.4, o * r - 1.5, r * 1.1, 3); }
      break;
    }
    case 'rocha': case 'meteoro': c.rotate(spin); c.fillStyle = C('#6a6478'); c.beginPath(); for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, rr = r * (0.8 + (k % 3) * 0.15); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.fill(); c.fillStyle = C(look === 'meteoro' ? '#ff8a3a' : '#9a94a8'); c.fillRect(-r * 0.35, -r * 0.45, r * 0.5, r * 0.35); break;
    case 'neve': c.fillStyle = C('#7ae8ff'); c.beginPath(); c.arc(0, 0, r * 1.1, 0, 7); c.fill(); c.fillStyle = C('#ffffff'); c.beginPath(); c.arc(-r * 0.15, -r * 0.15, r * 0.8, 0, 7); c.fill(); break;
    case 'gelo': case 'cristal': c.rotate(ang); c.fillStyle = C(look === 'gelo' ? '#7ae8ff' : rp[1]); c.beginPath(); c.moveTo(r * 1.5, 0); c.lineTo(0, -r * 0.75); c.lineTo(-r * 1.3, 0); c.lineTo(0, r * 0.75); c.fill(); c.fillStyle = C('#ffffff'); c.beginPath(); c.moveTo(r * 1.1, 0); c.lineTo(0, -r * 0.35); c.lineTo(-r * 0.5, 0); c.fill(); break;
    case 'coracao': c.fillStyle = C('#ff6a9a'); c.beginPath(); c.arc(-r * 0.45, -r * 0.2, r * 0.55, 0, 7); c.arc(r * 0.45, -r * 0.2, r * 0.55, 0, 7); c.moveTo(-r, 0); c.lineTo(0, r); c.lineTo(r, 0); c.fill(); break;
    case 'raio': {
      c.rotate(ang); c.lineCap = 'square'; c.lineJoin = 'miter';
      for (const [col, w] of mono ? [[mono, 8]] as const : [[rp[1], 5], [rp[3], 2]] as const) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(-r * 1.5, 0); for (let k = 1; k <= 4; k++) c.lineTo(-r * 1.5 + k * r * 0.75, (k % 2 ? -1 : 1) * r * 0.5); c.stroke(); }
      break;
    }
    case 'onda': case 'gota': c.rotate(ang); c.fillStyle = C(rp[1]); c.beginPath(); c.arc(0, 0, r, -1.4, 1.4); c.fill(); c.fillStyle = C(rp[3]); c.beginPath(); c.arc(r * 0.2, 0, r * 0.6, -1.2, 1.2); c.fill(); break;
    case 'inseto': { c.fillStyle = C('#3a2a1a'); c.beginPath(); c.arc(0, 0, r * 0.55, 0, 7); c.fill(); c.fillStyle = C('#dff0ff'); const fl = Math.floor(now / 40) % 2 ? 2 : -2; c.fillRect(-r * 0.9, -r * 0.7 + fl, r * 0.7, r * 0.35); c.fillRect(r * 0.2, -r * 0.7 - fl, r * 0.7, r * 0.35); break; }
    case 'ar': c.rotate(spin * 2); c.strokeStyle = C(rp[2]); c.lineWidth = mono ? 7 : 4; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, r * (0.5 + k * 0.35), k, k + 2.2); c.stroke(); } break;
    default: {
      // bola, esfera, orbe, sol...: 3 discos (sem degradê)
      c.fillStyle = C(rp[1]); c.beginPath(); c.arc(0, 0, r * 1.1, 0, 7); c.fill();
      c.fillStyle = C(rp[2]); c.beginPath(); c.arc(-r * 0.12, -r * 0.12, r * 0.72, 0, 7); c.fill();
      c.fillStyle = C(rp[3]); c.beginPath(); c.arc(-r * 0.22, -r * 0.22, r * 0.36, 0, 7); c.fill();
    }
  }
  c.restore();
}
/** O objeto com contorno escuro (desenha a silhueta maior por trás). */
function pxLookOutlined(c: CanvasRenderingContext2D, look: Look | undefined, x: number, y: number, ang: number, r: number, rp: Ramp, now: number) {
  pxLook(c, look, x, y, ang, r + 2.5, rp, now, rp[0]);
  pxLook(c, look, x, y, ang, r, rp, now);
}

/** Feixe em pixel (sem folha): 4 faixas com a borda tremendo em degraus. */
function pxBeam(c: CanvasRenderingContext2D, X: number, Y: number, ang: number, L: number, w0: number, w1: number, rp: Ramp, t: number) {
  c.save(); c.translate(X, Y); c.rotate(ang);
  const N = 10;
  const band = (col: string, k: number, wob: number) => {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i <= N; i++) { const s = (L * i) / N, hw = ((w0 + ((w1 - w0) * i) / N) / 2) * k * (1 + (jit(i, t) - 0.5) * wob); c.lineTo(s, -hw); }
    for (let i = N; i >= 0; i--) { const s = (L * i) / N, hw = ((w0 + ((w1 - w0) * i) / N) / 2) * k * (1 + (jit(i + 20, t) - 0.5) * wob); c.lineTo(s, hw); }
    c.closePath(); c.fill();
  };
  band(rp[0], 1.15, 0.25); band(rp[1], 0.95, 0.3); band(rp[2], 0.6, 0.3); band(rp[3], 0.28, 0.2);
  // boca do feixe e ponta
  c.fillStyle = rp[0]; c.beginPath(); c.arc(0, 0, w0 * 0.75, 0, 7); c.fill();
  c.fillStyle = rp[2]; c.beginPath(); c.arc(0, 0, w0 * 0.55, 0, 7); c.fill();
  c.fillStyle = rp[3]; c.beginPath(); c.arc(0, 0, w0 * 0.3, 0, 7); c.fill();
  c.restore();
}

// ─── peças das cartas que ficam na sala ─────────────────────────────────────

/** Peças que ficam no chão (desenhadas antes dos corpos). */
export const GROUND_ACTS = ['zona', 'armadilha', 'puxar', 'prender'];

/**
 * Peças das cartas (do caçador e dos inimigos). `pass` = 'px' desenha o
 * código na camada de pixel; 'top' desenha os sprites por cima dela.
 */
export function drawActs(L: PixelLayer, ctx: CanvasRenderingContext2D, run: Run, now: number, T: number, ground: boolean, pass: 'px' | 'top') {
  const c = L.ctx, p = run.p;
  for (const a of run.acts) {
    if (GROUND_ACTS.includes(a.mv.m) !== ground) continue;
    const mv = a.mv, [c1, c2] = a.mine ? colorsOf(a.card, a.el) : FOE, rp = ramp(c1, c2);
    const look = 'look' in mv ? mv.look : undefined;
    const X = a.x * T, Y = a.y * T, k = a.life > 0 ? a.t / a.life : 0;
    switch (mv.m) {
      case 'proj': {
        const sp = Math.hypot(a.vx, a.vy) || 1, ux = a.vx / sp, uy = a.vy / sp, ang = Math.atan2(a.vy, a.vx);
        const own = SHEET[a.card.replace(/\+$/, '')];
        const flies = own && (own.kind === 'projetil' || own.kind === 'redemoinho' || own.kind === 'corte' || own.kind === 'feixe');
        // sem folha própria que voa: o objeto da carta (kunai, carta...) ou o voo do pacote do elemento
        const fly = flies ? null : look ? null : pick(a.card, a.el, 'proj'), flyImg = fly ? sheetImg(fly.id) : null;
        const lookSz = Math.max(26, a.r * T * 2.6);
        if (pass === 'px') {
          // rastro em faixas (mais longo quanto mais rápido)
          const len = Math.min(1.4, sp * 0.06 + 0.3) * T, w = Math.max(6, a.r * T * (flies ? 1.3 : 1.1));
          pxStreak(c, X - ux * len, Y - uy * len, X, Y, w + 4, rp[0]);
          pxStreak(c, X - ux * len * 0.9, Y - uy * len * 0.9, X, Y, w, rp[1]);
          pxStreak(c, X - ux * len * 0.5, Y - uy * len * 0.5, X, Y, Math.max(3, w * 0.4), rp[3]);
        } else if (flies) {
          const img = sheetImg(a.card.replace(/\+$/, ''));
          if (img) drawFrame(ctx, img, loopFrame(own.voo, now, a.id), X, Y, Math.min(120, Math.max(44, a.r * T * 3.4)), own.dir ? ang - (own.rot ?? 0) : 0);
        } else if (flyImg && fly) drawFrame(ctx, flyImg, loopFrame(fly.info.voo, now, a.id), X, Y, Math.max(40, a.r * T * 3.2), ang);
        else if (!drawLook(ctx, look, X, Y, ang, lookSz, now, c1)) {
          // a folha dos objetos ainda não chegou: o desenho em pixel (direto na tela, sem a camada)
          pxLookOutlined(ctx, look, X, Y, ang, Math.max(6, a.r * T), rp, now);
        }
        break;
      }
      case 'tornado': {
        const R = a.r * T, pk = pick(a.card, a.el, 'tornado'), img = pk ? sheetImg(pk.id) : null;
        if (pass === 'px') {
          c.fillStyle = L.dither('#0a0614', 0.5); c.beginPath(); c.ellipse(X, Y, R, R * 0.4, 0, 0, 7); c.fill();
          if (!img) {
            // sem folha: anéis grossos girando em degraus
            for (let i = 0; i < 5; i++) {
              const h = i / 5, rr = R * (0.35 + h * 0.75), yy = Y - h * R * 1.6, rot = Math.floor(now / 42) * 0.5 + i;
              c.strokeStyle = rp[0]; c.lineWidth = 8; c.beginPath(); c.ellipse(X, yy, rr, rr * 0.35, 0, rot % 6.28, (rot % 6.28) + 4); c.stroke();
              c.strokeStyle = i % 2 ? rp[1] : rp[2]; c.lineWidth = 4; c.stroke();
            }
          }
        } else if (img && pk) drawFrame(ctx, img, loopFrame(pk.info.voo, now, a.id), X, Y + R * 0.35, Math.max(56, R * 2.8) * pk.scale, 0, true);
        break;
      }
      case 'raio': {
        const ang = a.ang + (mv.sweep ? mv.sweep * (a.t / mv.dur - 0.5) : 0), Lpx = a.len * T, w0 = Math.max(10, a.w * T), w1 = Math.max(10, (mv.cone ?? a.w) * T);
        const fade = k > 0.85 ? 1 - (k - 0.85) / 0.15 : k < 0.08 ? 0.4 + k / 0.08 * 0.6 : 1;
        const pk = pick(a.card, a.el, 'feixe'), img = pk ? sheetImg(pk.id) : null;
        const sheetBeam = !!(img && (pk?.info.feixe !== undefined || pk?.info.beam3) && !mv.cone);
        const hy = Y - 10;
        if (pass === 'px') {
          if (!sheetBeam) pxBeam(c, X, hy, ang, Lpx, w0 * fade, w1 * fade, rp, a.t);
          // ponto onde o feixe bate: faíscas quadradas
          const ex = X + Math.cos(ang) * Lpx, ey = hy + Math.sin(ang) * Lpx;
          for (let i = 0; i < 3; i++) { c.fillStyle = i % 2 ? rp[3] : rp[1]; const s = 6; c.fillRect(ex + (jit(i, a.t) - 0.5) * w1 * 1.4 - s / 2, ey + (jit(i + 5, a.t) - 0.5) * w1 * 1.4 - s / 2, s, s); }
        } else if (img && pk) {
          if (sheetBeam) {
            // tremida do feixe: a grossura pula entre 2 tamanhos (12 por segundo)
            const flick = Math.floor(now / 83) % 2 ? 1.08 : 0.94;
            if (pk.info.beam3) drawBeam3(ctx, img, pk.id, X, hy, ang, Lpx, w0 * 1.3 * fade * flick);
            else drawBeam(ctx, img, pk.id, pk.info.feixe!, X, hy, ang, Lpx, w0 * 1.25 * fade * flick);
          } else {
            // folha sem feixe deitado: ela toca na ponta do feixe de código
            drawFrame(ctx, img, loopFrame(pk.info.voo, now, a.id), X + Math.cos(ang) * Lpx, hy + Math.sin(ang) * Lpx, Math.max(48, w1 * 2.6) * pk.scale, pk.info.dir ? ang - (pk.info.rot ?? 0) : 0);
          }
        }
        break;
      }
      case 'zona': {
        const R = a.r * T, fade = Math.min(1, (1 - k) * 5);
        const pk = pick(a.card, a.el, 'zona'), img = pk ? sheetImg(pk.id) : null;
        if (pass === 'px') {
          const fill = look === 'fumaca' ? '#c8c8d8' : look === 'sombra' ? '#2a0a3a' : c1;
          c.fillStyle = L.dither(fill, 0.32 * fade); c.beginPath(); c.ellipse(X, Y, R, R * 0.72, 0, 0, 7); c.fill();
          c.setLineDash([10, 8]); c.lineDashOffset = -Math.floor(now / 42) * 3;
          pxRing(c, X, Y, R, 4, fade > 0.5 ? rp[2] : rp[1]);
          c.setLineDash([]);
          // pedacinhos subindo
          for (let i = 0; i < 6; i++) {
            const an = i * 1.05 + Math.floor(now / 42) * 0.03, rr = R * (((i * 37) % 10) / 11), rise = (Math.floor(now / 42) * 2 + i * 13) % 18;
            const x = X + Math.cos(an) * rr, y = Y + Math.sin(an) * rr * 0.72 - rise;
            c.fillStyle = i % 2 ? rp[1] : rp[3];
            if (look === 'raiz') c.fillRect(x - 2, y, 4, 10); else if (look === 'gelo') c.fillRect(x - 4, y, 8, 4); else c.fillRect(x - 3, y - 3, 6, 6);
          }
        } else if (img && pk && fade > 0.3 && pk.id.startsWith('elem-')) {
          // área do pacote do elemento: um círculo visto de cima, do tamanho da zona
          drawFrame(ctx, img, loopFrame(pk.info.voo, now, a.id), X, Y, Math.max(44, R * 2.5));
        } else if (img && pk && fade > 0.3) {
          // uma folha no centro; zona grande ganha mais duas dos lados
          const sz = Math.min(170, Math.max(52, R * 1.6)) * pk.scale;
          drawFrame(ctx, img, loopFrame(pk.info.voo, now, a.id), X, Y + R * 0.25, sz, 0, true);
          if (R > 2.2 * T) for (const s of [-1, 1]) drawFrame(ctx, img, loopFrame(pk.info.voo, now, a.id + s * 3), X + s * R * 0.55, Y + R * 0.1, sz * 0.7, 0, true);
        }
        break;
      }
      case 'chuva': {
        const own = SHEET[a.card.replace(/\+$/, '')], img = own && own.kind !== 'explosao' ? sheetImg(a.card.replace(/\+$/, '')) : null;
        for (const pt of a.pts) {
          const x = pt.x * T, y = pt.y * T, R = a.r * T, q = Math.max(0, Math.min(1, pt.t / 0.35));
          if (pass === 'px') {
            c.fillStyle = L.dither('#000000', 0.55); c.beginPath(); c.ellipse(x, y, R * (1 - q * 0.5), R * 0.4 * (1 - q * 0.5), 0, 0, 7); c.fill();
            if (!img) {
              if (look === 'raio') {
                // raio caindo: zigue-zague do alto até o chão, em 3 faixas
                c.lineCap = 'square'; c.lineJoin = 'miter';
                const pts: [number, number][] = [[x, y - 220]];
                for (let s = 1; s < 8; s++) pts.push([x + (jit(s, pt.t) - 0.5) * 18, y - 220 + s * 27]);
                pts.push([x, y]);
                for (const [col, w] of [[rp[0], 9], [rp[1], 5], [rp[3], 2]] as const) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([px, py]) => c.lineTo(px, py)); c.stroke(); }
              }
            }
          } else if (!img && look !== 'raio') {
            // o objeto da carta caindo (pixel se a folha dos objetos ainda não chegou)
            if (!drawLook(ctx, look ?? 'esfera', x, y - q * 180, Math.PI / 2, Math.max(28, R * 1.4), now, c1)) pxLookOutlined(ctx, look ?? 'esfera', x, y - q * 180, Math.PI / 2, Math.max(7, R * 0.6), rp, now);
          } else if (img && own) {
            // o próprio sprite caindo (a folha que já cai, como o meteoro, não gira)
            drawFrame(ctx, img, loopFrame(own.voo, now, a.id), x, y - q * 180, Math.max(48, R * 2.4), own.dir ? Math.PI / 2 - (own.rot ?? 0) : 0, own.kind === 'pilar');
          }
        }
        break;
      }
      case 'orbita': {
        const own = SHEET[a.card.replace(/\+$/, '')], img = own ? sheetImg(a.card.replace(/\+$/, '')) : null;
        for (let i = 0; i < a.n; i++) {
          const an = a.t * mv.speed + (i / a.n) * Math.PI * 2, ox = X + Math.cos(an) * a.r * T, oy = Y + Math.sin(an) * a.r * T * 0.8 - 10;
          if (pass !== 'top') continue;
          if (img && own) drawFrame(ctx, img, loopFrame(own.voo, now, a.id + i), ox, oy, 34, 0);
          else if (!drawLook(ctx, look, ox, oy, an + Math.PI / 2, 24, now, c1)) pxLookOutlined(ctx, look, ox, oy, an + Math.PI / 2, look === 'petala' ? 5 : 7, rp, now);
        }
        break;
      }
      case 'armadilha': {
        if (pass !== 'px') break;
        const armed = a.t >= mv.arm, blink = armed && Math.floor(now / 200) % 2;
        c.fillStyle = '#1a1424'; c.beginPath(); c.ellipse(X, Y, 11, 8, 0, 0, 7); c.fill();
        c.fillStyle = '#3a3248'; c.beginPath(); c.ellipse(X, Y - 1, 8, 5.5, 0, 0, 7); c.fill();
        c.fillStyle = blink ? '#ff3a4a' : rp[1]; c.fillRect(X - 3, Y - 4, 6, 6);
        if (blink) { c.fillStyle = '#ffffff'; c.fillRect(X - 1, Y - 3, 2, 2); }
        break;
      }
      case 'puxar': {
        if (pass !== 'px') break;
        // espiral grossa girando em degraus, puxando para o meio
        const st = Math.floor(now / 42);
        for (let i = 0; i < 4; i++) {
          const rr = a.r * T * (1 - ((st / 12 + i / 4) % 1));
          c.strokeStyle = rp[0]; c.lineWidth = 7; c.beginPath(); c.ellipse(X, Y, rr, rr * 0.72, 0, i + st * 0.15, i + st * 0.15 + 3.2); c.stroke();
          c.strokeStyle = i % 2 ? rp[1] : rp[2]; c.lineWidth = 3; c.stroke();
        }
        c.fillStyle = rp[3]; c.fillRect(X - 3, Y - 3, 6, 6);
        break;
      }
      case 'prender': {
        if (pass !== 'px') break;
        const R = Math.max(14, a.r * T * 0.8), close = Math.min(1, k * 1.6);
        const col = look === 'raiz' ? ['#14301a', '#2e7a3a', '#5ac85a'] : look === 'decadencia' ? ['#1a1020', '#4a3a4a', '#8a7a8a'] : look === 'ar' ? ['#3a5a7a', '#d8f4ff', '#ffffff'] : ['#4a3418', '#c8a060', '#f0d8a0'];
        for (let i = 0; i < 8; i++) {
          const an = (i / 8) * Math.PI * 2, h = R * (0.6 + close * 0.8);
          const px = X + Math.cos(an) * R * (1 - close * 0.6), py = Y + Math.sin(an) * R * 0.5 * (1 - close * 0.6);
          c.fillStyle = col[0]; c.fillRect(px - 6, py - h - 2, 12, h + 2);
          c.fillStyle = col[1]; c.fillRect(px - 4, py - h, 8, h);
          c.fillStyle = col[2]; c.fillRect(px - 4, py - h, 3, h);
        }
        break;
      }
      case 'parar_tiros': {
        if (pass !== 'px') break;
        c.setLineDash([8, 6]); c.lineDashOffset = -Math.floor(now / 42) * 2;
        pxRing(c, p.x * T, p.y * T - 8, a.r * T, 4, '#8ad0ff', 0.8, L.dither('#5ab8ff', 0.18));
        c.setLineDash([]);
        break;
      }
      case 'investida': {
        const sp = Math.hypot(a.vx, a.vy) || 1, bx = (p.x - (a.vx / sp) * 2) * T, by = (p.y - (a.vy / sp) * 2) * T - 10;
        if (pass === 'top') {
          // a folha da carta (tigre, ave, raio...) corre junto com o caçador
          const own = SHEET[a.card.replace(/\+$/, '')], img = own ? sheetImg(a.card.replace(/\+$/, '')) : null;
          if (img && own) drawFrame(ctx, img, loopFrame(own.voo, now, a.id), p.x * T + (a.vx / sp) * 10, p.y * T - 14, 96, own.dir ? Math.atan2(a.vy, a.vx) - (own.rot ?? 0) : 0);
          break;
        }
        const w = Math.max(10, a.w * T * 0.7);
        pxStreak(c, bx, by, p.x * T, p.y * T - 10, w + 6, rp[0]);
        pxStreak(c, bx, by, p.x * T, p.y * T - 10, w, rp[1]);
        pxStreak(c, (bx + p.x * T) / 2, (by + p.y * T - 10) / 2, p.x * T, p.y * T - 10, Math.max(3, w * 0.35), rp[3]);
        break;
      }
    }
  }
}

// ─── estados em cima dos corpos ─────────────────────────────────────────────

/** Marcas dos estados em volta de um corpo (x, y = pés; h = altura em px). */
export function drawStatus(ctx: CanvasRenderingContext2D, sb: Bag, x: number, y: number, h: number, now: number) {
  const has = (s: keyof Bag) => (sb[s]?.t ?? 0) > 0;
  const top = y - h;
  ctx.save();
  if (has('congelado')) { ctx.globalAlpha = 0.45; ctx.fillStyle = '#bff0ff'; ctx.fillRect(x - h * 0.35, top + 2, h * 0.7, h - 2); ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.strokeRect(x - h * 0.35, top + 2, h * 0.7, h - 2); }
  ctx.globalAlpha = 1;
  if (has('queimar') || has('chamaNegra')) {
    const black = has('chamaNegra');
    for (let i = 0; i < 4; i++) { const fx = x - 8 + i * 5, fl = 5 + ((now / 70 + i * 3) % 6); ctx.fillStyle = black ? (i % 2 ? '#1a0a14' : '#a01a3a') : (i % 2 ? '#ff6a2a' : '#ffd84a'); ctx.fillRect(fx, top + 6 - fl, 3, fl); }
  }
  if (has('veneno')) { const n = sb.veneno!.n; for (let i = 0; i < n; i++) { ctx.fillStyle = '#b07aff'; ctx.beginPath(); ctx.arc(x - 8 + i * 4, top - 2 - ((now / 30 + i * 7) % 10), 2, 0, 7); ctx.fill(); } }
  if (has('molhado')) { ctx.fillStyle = '#4aa8ff'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 6 + i * 6, top + 4 + ((now / 25 + i * 9) % (h - 6)), 2, 3); }
  if (has('eletrizado')) { ctx.strokeStyle = '#fff07a'; ctx.lineWidth = 2; for (let i = 0; i < sb.eletrizado!.n; i++) { const a = now / 60 + i * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 9, top + h * 0.4 + Math.sin(a) * 6); ctx.lineTo(x + Math.cos(a + 0.4) * 12, top + h * 0.4 + Math.sin(a + 0.4) * 9); ctx.stroke(); } }
  if (has('atordoado')) { ctx.fillStyle = '#ffe03a'; for (let k = 0; k < 3; k++) { const a = now / 200 + k * 2.1; ctx.fillRect(x + Math.cos(a) * 10 - 2, top - 4 + Math.sin(a) * 3, 4, 4); } }
  if (has('marcado')) { ctx.strokeStyle = '#ff5a8a'; ctx.lineWidth = 2; const r = 8 + Math.sin(now / 90) * 2; ctx.beginPath(); ctx.arc(x, top + h * 0.45, r, 0, 7); ctx.moveTo(x - r - 3, top + h * 0.45); ctx.lineTo(x + r + 3, top + h * 0.45); ctx.moveTo(x, top + h * 0.45 - r - 3); ctx.lineTo(x, top + h * 0.45 + r + 3); ctx.stroke(); }
  if (has('selado')) { ctx.fillStyle = '#c8a0ff'; ctx.fillRect(x - 4, top - 10, 8, 6); ctx.strokeStyle = '#c8a0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, top - 10, 3, Math.PI, 0); ctx.stroke(); }
  if (has('cego')) { ctx.fillStyle = 'rgba(150,150,170,.8)'; ctx.beginPath(); ctx.ellipse(x, top + h * 0.25, 10, 4, 0, 0, 7); ctx.fill(); }
  if (has('lama') || has('lento')) { ctx.fillStyle = has('lama') ? 'rgba(138,106,58,.8)' : 'rgba(138,208,255,.6)'; ctx.beginPath(); ctx.ellipse(x, y, 12, 4, 0, 0, 7); ctx.fill(); }
  if (has('amaldicoado')) { ctx.strokeStyle = 'rgba(106,42,138,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, top + h * 0.5, 12, h * 0.55, 0, 0, 7); ctx.stroke(); }
  if (has('corte')) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(x - 6 + i * 6, top + h * 0.3); ctx.lineTo(x - 2 + i * 6, top + h * 0.6); ctx.stroke(); } }
  if (has('preso')) { ctx.fillStyle = '#2e7a3a'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 9 + i * 6, y - 8, 3, 9); }
  if (has('semente')) { ctx.fillStyle = '#7aff6a'; ctx.fillRect(x - 1, top - 8, 2, 6); ctx.fillRect(x - 4, top - 9, 3, 2); ctx.fillRect(x + 1, top - 10, 3, 2); }
  ctx.restore();
}

// ─── cena das cartas grandes ────────────────────────────────────────────────

/** A cena: o mundo escurece (na tela), o desenho da carta (na camada) e o nome dela (na tela). */
export function drawCine(L: PixelLayer, ctx: CanvasRenderingContext2D, run: Run, now: number, W: number, H: number, T: number, name: string) {
  const cn = run.cine;
  if (!cn) return;
  const k = 1 - cn.t / cn.total, X = cn.x * T, Y = cn.y * T;
  ctx.save();
  ctx.fillStyle = `rgba(4,2,12,${0.55 * Math.min(1, k * 3)})`; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const [c1, c2] = colorsOf(cn.card, 'Dark'), rp = ramp(c1, c2), st = Math.floor(now / 42);
  const c = L.begin();
  c.save();
  switch (cn.style) {
    case 'circulo': {
      // círculo mágico atrás do caçador, girando e crescendo
      const R = T * (0.8 + k * 1.8);
      c.translate(X - Math.cos(cn.ang) * T * 0.6, Y - Math.sin(cn.ang) * T * 0.6 - 10);
      c.rotate(st * 0.06);
      c.lineWidth = 4; c.strokeStyle = '#e0d0ff';
      c.beginPath(); c.arc(0, 0, R, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, R * 0.75, 0, 7); c.stroke();
      c.beginPath(); for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2 * 2; c.lineTo(Math.cos(a) * R * 0.75, Math.sin(a) * R * 0.75); } c.stroke();
      c.fillStyle = '#c8a0ff'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillRect(Math.cos(a) * R * 0.88 - 3, Math.sin(a) * R * 0.88 - 3, 6, 6); }
      break;
    }
    case 'carga': case 'esfera': {
      const R = cn.style === 'esfera' ? T * (0.3 + k * 1.6) : T * 0.4 * (1 + k);
      const cy = cn.style === 'esfera' ? Y - T * 2.2 : Y - 12;
      for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2 + st * 0.08, d = T * 3 * (1 - ((st / 14 + i / 20) % 1)); c.fillStyle = i % 2 ? c1 : c2; c.fillRect(X + Math.cos(a) * d - 3, cy + Math.sin(a) * d - 3, 6, 6); }
      const sr = cn.style === 'esfera' ? ramp('#3a8aff', '#bfe8ff') : rp;
      for (const [col, f] of [[sr[0], 1.08], [sr[1], 1], [sr[2], 0.7], [sr[3], 0.38]] as const) { c.fillStyle = col; c.beginPath(); c.arc(X, cy, R * f, 0, 7); c.fill(); }
      break;
    }
    case 'foco': {
      c.strokeStyle = '#ffffff'; c.lineWidth = 3;
      for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.05 + (st % 2) * 0.03, r0 = T * (2.5 - k), r1 = Math.max(W, H); c.beginPath(); c.moveTo(X + Math.cos(a) * r0, Y + Math.sin(a) * r0); c.lineTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1); c.stroke(); }
      break;
    }
    case 'orbes': {
      const d = T * 1.6 * (1 - k), cy = Y - T * 1.2;
      for (const [col, x] of [['#ff3a3a', X - d], ['#3a8aff', X + d]] as const) { const r = ramp(col); c.fillStyle = r[0]; c.beginPath(); c.arc(x, cy, 12, 0, 7); c.fill(); c.fillStyle = r[1]; c.beginPath(); c.arc(x, cy, 9, 0, 7); c.fill(); c.fillStyle = r[3]; c.beginPath(); c.arc(x - 2, cy - 2, 4, 0, 7); c.fill(); }
      if (k > 0.7) { c.fillStyle = '#a04aff'; c.beginPath(); c.arc(X, cy, 14 * (k - 0.7) / 0.3 + 6, 0, 7); c.fill(); }
      break;
    }
    case 'ceu': case 'nuvem': {
      c.fillStyle = L.dither('#1e1432', 0.75); for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse((i / 8) * W, T * 0.8 + Math.sin(i + st * 0.1) * 8, T * 1.6, T * 0.7, 0, 0, 7); c.fill(); }
      if (cn.style === 'nuvem' && st % 3 === 0) { const x0 = jit(1, st) * W; c.strokeStyle = '#fff07a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + (jit(2, st) - 0.5) * 60, T); c.lineTo(x0 + (jit(3, st) - 0.5) * 60, T * 2); c.stroke(); }
      break;
    }
    case 'luz': {
      const w = T * 1.2 * k;
      c.fillStyle = L.dither('#ffd84a', 0.5); c.fillRect(X - w / 2, 0, w, Y);
      c.fillStyle = '#fff0a0'; c.fillRect(X - w / 4, 0, w / 2, Y);
      break;
    }
    case 'vento': c.strokeStyle = '#ff3a3a'; c.lineWidth = 4; for (let i = 0; i < 3; i++) { c.beginPath(); for (let s = 0; s < 50; s++) { const a = s * 0.25 + st * 0.4 + i * 2, r = s * T * 0.05 * k; c.lineTo(X + Math.cos(a) * r, Y - 10 + Math.sin(a) * r); } c.stroke(); } break;
    case 'arco': c.strokeStyle = '#ff6a2a'; c.lineWidth = 6; c.beginPath(); c.arc(X, Y - 10, T * 1.2, cn.ang - 1.2 * k, cn.ang + 1.2 * k); c.stroke(); break;
    case 'raiz': c.fillStyle = '#ffd84a'; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; c.fillRect(X + Math.cos(a) * T * 2 * k - 4, Y + Math.sin(a) * T * 1.2 * k - 12, 8, 12); } break;
  }
  c.restore();
  L.end(ctx);
  // nome da carta grande
  ctx.save();
  if (k * 4 >= 0.5) {
    ctx.font = "14px 'Press Start 2P', monospace"; ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0a0612'; ctx.strokeText(name.toUpperCase(), W / 2, T * 1.4);
    ctx.fillStyle = c2 === '#ffffff' ? c1 : '#ffffff'; ctx.fillText(name.toUpperCase(), W / 2, T * 1.4);
  }
  ctx.restore();
}
export type { Act };
