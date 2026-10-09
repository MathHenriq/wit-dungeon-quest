// Efeitos da masmorra desenhados em código: golpe da espada, tiro, explosão,
// raio, jato, folhas, gelo, sombra, números de dano, fumaça (sem sangue) e
// avisos no chão. Cada carta Épica+ usa o sprite próprio do GPT
// (public/game/efeitos/<id>.png, 6 quadros de 96 × 96) quando ele existir;
// sem ele, usa o efeito do elemento.
import type { Ev } from '@/game/dungeon';
import type { Element } from '@/lib/tcg/types';

export const EL_COLOR: Record<Element, [string, string]> = {
  Fire: ['#ff6a2a', '#ffd84a'], Water: ['#2a8aff', '#bfe8ff'], Grass: ['#3ac85a', '#ffb0d8'], Electric: ['#ffe03a', '#ffffff'],
  Ice: ['#7ae8ff', '#ffffff'], Fighting: ['#ff9a3a', '#fff0c0'], Poison: ['#a04ad8', '#7aff6a'], Ground: ['#b8843a', '#5a3a1a'],
  Flying: ['#d8f4ff', '#8ad0ff'], Ghost: ['#a87aff', '#e0d0ff'], Dark: ['#4a1a6a', '#ff3a6a'], Steel: ['#c8d8e8', '#ffffff'],
};

export interface Fx {
  kind: 'ring' | 'beam' | 'arc' | 'bolt' | 'smoke' | 'spark' | 'text' | 'sprite' | 'debris' | 'petal';
  x: number; y: number; x2?: number; y2?: number;
  r?: number; ang?: number; arc?: number; vx?: number; vy?: number;
  t: number; life: number; c1: string; c2?: string; text?: string; img?: HTMLImageElement; size?: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Sprites próprios das cartas Épica+ (carrega uma vez; null se não existe). */
const OWN = new Map<string, HTMLImageElement | null>();
export function ownSprite(card: string): HTMLImageElement | null {
  if (!card) return null;
  if (!OWN.has(card)) {
    OWN.set(card, null);
    const img = new Image();
    img.onload = () => OWN.set(card, img);
    img.src = `/game/efeitos/${card}.png`;
  }
  return OWN.get(card) ?? null;
}

/** Transforma os acontecimentos do passo em efeitos na tela. */
export function fxFrom(evs: Ev[], out: Fx[]) {
  const hits = evs.filter(e => e.k === 'hit') as Extract<Ev, { k: 'hit' }>[];
  for (const e of evs) {
    switch (e.k) {
      case 'swing':
        out.push({ kind: 'arc', x: e.x, y: e.y, r: e.range, ang: e.ang, arc: e.arc, t: 0, life: 0.18, c1: '#ffffff', c2: '#bfe8ff' });
        break;
      case 'hit':
        out.push({ kind: 'text', x: e.x + rnd(-0.2, 0.2), y: e.y - 0.6, vy: -1.6, t: 0, life: 0.7, c1: e.crit ? '#ffd84a' : '#ffffff', text: `${e.dmg}${e.crit ? '!' : ''}`, size: e.crit ? 13 : 10 });
        for (let k = 0; k < 4; k++) out.push({ kind: 'spark', x: e.x, y: e.y - 0.3, vx: rnd(-3, 3), vy: rnd(-3, 1), t: 0, life: 0.25, c1: e.crit ? '#ffd84a' : '#ffffff' });
        break;
      case 'kill':
        for (let k = 0; k < 8; k++) out.push({ kind: 'smoke', x: e.x + rnd(-0.3, 0.3), y: e.y - 0.3 + rnd(-0.3, 0.3), vx: rnd(-0.6, 0.6), vy: rnd(-1.2, -0.3), r: rnd(0.2, 0.45), t: 0, life: rnd(0.4, 0.7), c1: e.kind === 'chefe' ? '#8a5ad8' : '#c8c0d8' });
        break;
      case 'break':
        for (let k = 0; k < 7; k++) out.push({ kind: e.kind === 'erva' ? 'petal' : 'debris', x: e.x, y: e.y, vx: rnd(-3, 3), vy: rnd(-4, -1), t: 0, life: 0.5, c1: e.kind === 'erva' ? '#5ac85a' : e.kind === 'cristal' ? '#7ab8ff' : e.kind === 'minerio' ? '#d8884a' : e.kind === 'barril' ? '#a0703a' : '#8a8090' });
        break;
      case 'deflect':
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 0.5, t: 0, life: 0.2, c1: '#ffffff' });
        break;
      case 'heal':
        out.push({ kind: 'text', x: e.x, y: e.y - 0.8, vy: -1.2, t: 0, life: 0.8, c1: '#7aff8a', text: '+', size: 14 });
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 0.8, t: 0, life: 0.4, c1: '#7aff8a' });
        break;
      case 'cast': castFx(e, hits, out); break;
    }
  }
}

function castFx(e: Extract<Ev, { k: 'cast' }>, hits: Extract<Ev, { k: 'hit' }>[], out: Fx[]) {
  const s = e.skill, [c1, c2] = EL_COLOR[s.element] ?? ['#ffffff', '#ffffff'];
  const own = s.ownVfx ? ownSprite(s.card) : null;
  if (own) {
    const cx = s.shape === 'linha' ? (e.x + e.tx) / 2 : s.shape === 'area' ? e.x : e.tx, cy = s.shape === 'linha' ? (e.y + e.ty) / 2 : s.shape === 'area' ? e.y : e.ty;
    out.push({ kind: 'sprite', x: cx, y: cy, ang: Math.atan2(e.ty - e.y, e.tx - e.x), r: Math.max(2, s.size * 1.6), t: 0, life: 0.6, c1, img: own });
    return;
  }
  // explosão do projétil (slot -1) ou forma do elemento
  switch (e.slot === -1 ? 'area' : s.shape) {
    case 'projetil': break;    // o próprio tiro aparece; a explosão vem depois
    case 'linha':
      out.push({ kind: 'beam', x: e.x, y: e.y, x2: e.tx, y2: e.ty, r: s.size, t: 0, life: 0.35, c1, c2 });
      break;
    case 'area': case 'alvo': {
      const x = s.shape === 'area' && e.slot !== -1 ? e.x : e.tx, y = s.shape === 'area' && e.slot !== -1 ? e.y : e.ty;
      out.push({ kind: 'ring', x, y, r: s.size, t: 0, life: 0.4, c1, c2 });
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2, sp = rnd(2, 4) * (s.size / 2);
        out.push({ kind: s.element === 'Grass' ? 'petal' : s.element === 'Ground' ? 'debris' : 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 0.45, c1: k % 2 ? c1 : (c2 ?? c1) });
      }
      break;
    }
    case 'arco':
      out.push({ kind: 'arc', x: e.x, y: e.y, r: s.size, ang: Math.atan2(e.ty - e.y, e.tx - e.x), arc: 2.6, t: 0, life: 0.3, c1, c2 });
      break;
    case 'chuva':
      for (const h of hits.slice(0, 3)) out.push({ kind: 'bolt', x: h.x, y: h.y - 6, x2: h.x, y2: h.y, t: 0, life: 0.3, c1, c2 });
      if (!hits.length) out.push({ kind: 'bolt', x: e.tx, y: e.ty - 6, x2: e.tx, y2: e.ty, t: 0, life: 0.3, c1, c2 });
      break;
  }
}

/** Anda e desenha os efeitos (T = px por bloco); devolve só os que continuam vivos. */
export function drawFx(ctx: CanvasRenderingContext2D, list: Fx[], dt: number, T: number): Fx[] {
  const keep: Fx[] = [];
  for (const f of list) {
    f.t += dt;
    if (f.t >= f.life) continue;
    keep.push(f);
    const k = f.t / f.life, a = 1 - k;
    if (f.vx !== undefined) { f.x += f.vx * dt; f.y += (f.vy ?? 0) * dt; if (f.kind === 'debris' || f.kind === 'petal') f.vy = (f.vy ?? 0) + 9 * dt; }
    else if (f.vy !== undefined) f.y += f.vy * dt;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    const X = f.x * T, Y = f.y * T;
    switch (f.kind) {
      case 'ring': {
        ctx.strokeStyle = f.c1; ctx.lineWidth = 4 * a + 1;
        ctx.beginPath(); ctx.arc(X, Y, (f.r ?? 1) * T * (0.4 + 0.6 * k), 0, 7); ctx.stroke();
        if (f.c2) { ctx.globalAlpha = a * 0.25; ctx.fillStyle = f.c2; ctx.fill(); }
        break;
      }
      case 'beam': {
        const w = (f.r ?? 0.8) * T * (1 - k * 0.6);
        ctx.lineCap = 'round';
        ctx.strokeStyle = f.c1; ctx.lineWidth = w * 1.4;
        ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(f.x2! * T, f.y2! * T); ctx.stroke();
        ctx.strokeStyle = f.c2 ?? '#fff'; ctx.lineWidth = w * 0.5; ctx.stroke();
        break;
      }
      case 'arc': {
        const r = (f.r ?? 1.5) * T, ang = f.ang ?? 0, arc = f.arc ?? 1.6, sweep = ang - arc / 2 + arc * Math.min(1, k * 2.2);
        ctx.strokeStyle = f.c1; ctx.lineWidth = 6 * a + 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(X, Y, r * 0.85, ang - arc / 2, sweep); ctx.stroke();
        if (f.c2) { ctx.strokeStyle = f.c2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, r * 0.6, ang - arc / 2, sweep); ctx.stroke(); }
        break;
      }
      case 'bolt': {
        ctx.strokeStyle = f.c1; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X, Y);
        const steps = 6;
        for (let s = 1; s <= steps; s++) ctx.lineTo((f.x + (s < steps ? rnd(-0.35, 0.35) : 0)) * T, (f.y + (f.y2! - f.y) * (s / steps)) * T);
        ctx.stroke(); ctx.strokeStyle = f.c2 ?? '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalAlpha = a * 0.5; ctx.fillStyle = f.c1; ctx.beginPath(); ctx.arc(f.x2! * T, f.y2! * T, T * 0.6, 0, 7); ctx.fill();
        break;
      }
      case 'smoke': ctx.fillStyle = f.c1; ctx.beginPath(); ctx.arc(X, Y, (f.r ?? 0.3) * T * (1 + k), 0, 7); ctx.fill(); break;
      case 'spark': ctx.fillStyle = f.c1; ctx.fillRect(X - 2, Y - 2, 4, 4); break;
      case 'debris': ctx.fillStyle = f.c1; ctx.fillRect(X - 3, Y - 3, 5, 5); break;
      case 'petal': ctx.fillStyle = f.c1; ctx.beginPath(); ctx.ellipse(X, Y, 4, 2, f.t * 8, 0, 7); ctx.fill(); break;
      case 'text':
        ctx.font = `${f.size ?? 10}px 'Press Start 2P', monospace`; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = '#1a0e20'; ctx.strokeText(f.text ?? '', X, Y); ctx.fillStyle = f.c1; ctx.fillText(f.text ?? '', X, Y);
        break;
      case 'sprite': {
        const img = f.img!, n = 6, fw = img.width / n, frame = Math.min(n - 1, Math.floor(k * n)), sz = (f.r ?? 2) * T * 1.4;
        ctx.globalAlpha = 1;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, frame * fw, 0, fw, img.height, X - sz / 2, Y - sz / 2, sz, sz);
        break;
      }
    }
    ctx.restore();
  }
  return keep;
}
