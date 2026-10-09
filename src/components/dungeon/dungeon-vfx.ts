// Efeitos da masmorra desenhados em código (sem sangue): golpes da espada,
// tiros, explosões, raios, e cada PEÇA das cartas que fica na sala (tornado
// girando, feixe que varre, zona no chão, chuva caindo, lâminas em órbita,
// prisão de areia...), os ESTADOS em cima dos corpos (gelo, fogo, veneno,
// gotas, faíscas, marca, cadeado...) e a CENA das cartas grandes (o mundo
// escurece, o círculo mágico abre). Cartas Épica+ usam o sprite próprio do GPT
// (public/game/efeitos/<id>.png, 6 quadros de 96 × 96) quando ele existir.
import type { Act, Ev, Run } from '@/game/dungeon';
import { REACTIONS, type Bag, type Look, type ReactionId } from '@/game/dungeon-moves';
import type { Element } from '@/lib/tcg/types';

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

export interface Fx {
  kind: 'ring' | 'beam' | 'arc' | 'bolt' | 'smoke' | 'spark' | 'text' | 'sprite' | 'debris' | 'petal' | 'zap' | 'big';
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

const REACT_COLOR: Record<string, string> = { congelou: '#bff0ff', choque: '#fff07a', incendio: '#ff8a3a', derreteu: '#ffb07a', toxica: '#b07aff', espalhou: '#d8f4ff', lama: '#c8a06a', vapor: '#e0e0f0', paralisou: '#ffe03a', estilhacou: '#e8ffff' };

/** Transforma os acontecimentos do passo em efeitos na tela. Devolve a tremida da tela que eles pedem. */
export function fxFrom(evs: Ev[], out: Fx[]): number {
  let shake = 0;
  for (const e of evs) {
    switch (e.k) {
      case 'swing': {
        const heavy = e.kind === 'pesado', fin = e.kind === 'final' || e.kind === 'investida';
        out.push({ kind: 'arc', x: e.x, y: e.y, r: e.range, ang: e.ang, arc: e.arc, t: 0, life: heavy ? 0.3 : 0.18, c1: heavy ? '#ffd84a' : fin ? '#bfe8ff' : '#ffffff', c2: heavy ? '#ff9a3a' : '#bfe8ff' });
        if (heavy) shake = Math.max(shake, 3);
        break;
      }
      case 'hit':
        out.push({ kind: 'text', x: e.x + rnd(-0.2, 0.2), y: e.y - 0.6, vy: -1.6, t: 0, life: 0.7, c1: e.block ? '#9ab8d8' : e.crit ? '#ffd84a' : '#ffffff', text: e.block ? `${e.dmg}` : `${e.dmg}${e.crit ? '!' : ''}`, size: e.crit ? 13 : 10 });
        for (let k = 0; k < (e.crit ? 7 : 4); k++) out.push({ kind: 'spark', x: e.x, y: e.y - 0.3, vx: rnd(-3, 3), vy: rnd(-3, 1), t: 0, life: 0.25, c1: e.crit ? '#ffd84a' : '#ffffff' });
        if (e.crit) shake = Math.max(shake, 2);
        break;
      case 'kill':
        for (let k = 0; k < (e.elite ? 14 : 8); k++) out.push({ kind: 'smoke', x: e.x + rnd(-0.3, 0.3), y: e.y - 0.3 + rnd(-0.3, 0.3), vx: rnd(-0.6, 0.6), vy: rnd(-1.2, -0.3), r: rnd(0.2, 0.45), t: 0, life: rnd(0.4, 0.7), c1: e.elite ? '#ffd84a' : '#c8c0d8' });
        break;
      case 'break':
        for (let k = 0; k < 7; k++) out.push({ kind: e.kind === 'erva' ? 'petal' : 'debris', x: e.x, y: e.y, vx: rnd(-3, 3), vy: rnd(-4, -1), t: 0, life: 0.5, c1: e.kind === 'erva' ? '#5ac85a' : e.kind === 'cristal' ? '#7ab8ff' : e.kind === 'minerio' ? '#d8884a' : e.kind === 'barril' || e.kind === 'explosivo' ? '#a0703a' : e.kind === 'lampiao' ? '#ffd84a' : '#8a8090' });
        break;
      case 'deflect': out.push({ kind: 'ring', x: e.x, y: e.y, r: 0.5, t: 0, life: 0.2, c1: '#ffffff' }); break;
      case 'heal':
        out.push({ kind: 'text', x: e.x, y: e.y - 0.8, vy: -1.2, t: 0, life: 0.8, c1: '#7aff8a', text: '+', size: 14 });
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 0.8, t: 0, life: 0.4, c1: '#7aff8a' });
        break;
      case 'cast': {
        const own = e.skill?.ownVfx ? ownSprite(e.card) : null;
        if (own) out.push({ kind: 'sprite', x: e.tx, y: e.ty, r: 2.2, t: 0, life: 0.7, c1: '#fff', img: own });
        const [c1, c2] = colorsOf(e.card, e.el);
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 0.9, t: 0, life: 0.3, c1, c2 });
        break;
      }
      case 'reacao': {
        const r = REACTIONS[e.id as ReactionId];
        if (!r) break;
        out.push({ kind: 'big', x: e.x, y: e.y - 1, vy: -0.8, t: 0, life: 1, c1: REACT_COLOR[e.id] ?? '#fff', text: r.nome, size: 10 });
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 1.4, t: 0, life: 0.45, c1: REACT_COLOR[e.id] ?? '#fff' });
        shake = Math.max(shake, 2);
        break;
      }
      case 'perfeita':
        out.push({ kind: 'big', x: e.x, y: e.y - 1.3, vy: -0.6, t: 0, life: 1, c1: '#8ad0ff', text: 'ESQUIVA PERFEITA', size: 9 });
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 2.2, t: 0, life: 0.6, c1: '#8ad0ff', c2: '#3a5aff' });
        break;
      case 'parede':
        out.push({ kind: 'text', x: e.x, y: e.y - 0.9, vy: -1, t: 0, life: 0.7, c1: '#ffb07a', text: 'PAREDE!', size: 8 });
        for (let k = 0; k < 6; k++) out.push({ kind: 'debris', x: e.x, y: e.y, vx: rnd(-3, 3), vy: rnd(-4, -1), t: 0, life: 0.5, c1: '#8a8090' });
        shake = Math.max(shake, 3);
        break;
      case 'postura':
        out.push({ kind: 'big', x: e.x, y: e.y - 1.4, vy: -0.5, t: 0, life: 1.1, c1: '#ffe03a', text: e.boss ? 'POSTURA QUEBRADA!' : 'QUEBROU!', size: e.boss ? 10 : 8 });
        out.push({ kind: 'ring', x: e.x, y: e.y, r: 1.8, t: 0, life: 0.5, c1: '#ffe03a' });
        shake = Math.max(shake, e.boss ? 6 : 3);
        break;
      case 'zap': out.push({ kind: 'zap', x: e.x, y: e.y, x2: e.x2, y2: e.y2, t: 0, life: 0.25, c1: '#fff07a', c2: '#ffffff' }); break;
      case 'boom': {
        const [c1, c2] = EL_COLOR[e.el] ?? ['#fff', '#fff'];
        out.push({ kind: 'ring', x: e.x, y: e.y, r: e.r, t: 0, life: 0.4, c1, c2 });
        for (let k = 0; k < Math.min(18, 6 + e.r * 4); k++) {
          const a = (k / 14) * Math.PI * 2, sp = rnd(2, 4) * Math.max(0.6, e.r / 2);
          out.push({ kind: e.el === 'Grass' ? 'petal' : e.el === 'Ground' ? 'debris' : 'spark', x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 0.45, c1: k % 2 ? c1 : (c2 ?? c1) });
        }
        if (e.r >= 2) shake = Math.max(shake, Math.min(7, e.r * 1.5));
        break;
      }
      case 'abate': out.push({ kind: 'big', x: e.x, y: e.y - 1, vy: -0.7, t: 0, life: 0.9, c1: '#ff5a6a', text: 'ABATE!', size: 9 }); break;
      case 'classe': out.push({ kind: 'ring', x: 0, y: 0, r: 0, t: 0, life: 0, c1: '#fff' }); break;
      case 'forma': shake = Math.max(shake, e.on ? 4 : 6); break;
      case 'hurt': shake = Math.max(shake, 4); break;
      case 'phase': case 'enrage': shake = Math.max(shake, 6); break;
    }
  }
  return shake;
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
        ctx.lineCap = 'round'; ctx.strokeStyle = f.c1; ctx.lineWidth = w * 1.4;
        ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(f.x2! * T, f.y2! * T); ctx.stroke();
        ctx.strokeStyle = f.c2 ?? '#fff'; ctx.lineWidth = w * 0.5; ctx.stroke();
        break;
      }
      case 'arc': {
        const r = (f.r ?? 1.5) * T, ang = f.ang ?? 0, arc = Math.min(6.28, f.arc ?? 1.6), sweep = ang - arc / 2 + arc * Math.min(1, k * 2.2);
        ctx.strokeStyle = f.c1; ctx.lineWidth = 6 * a + 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(X, Y, r * 0.85, ang - arc / 2, sweep); ctx.stroke();
        if (f.c2) { ctx.strokeStyle = f.c2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, r * 0.6, ang - arc / 2, sweep); ctx.stroke(); }
        break;
      }
      case 'bolt': case 'zap': {
        const x2 = (f.x2 ?? f.x) * T, y2 = (f.y2 ?? f.y) * T, steps = 7;
        ctx.strokeStyle = f.c1; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X, Y);
        for (let s = 1; s <= steps; s++) { const q = s / steps; ctx.lineTo(X + (x2 - X) * q + (s < steps ? rnd(-6, 6) : 0), Y + (y2 - Y) * q + (s < steps ? rnd(-6, 6) : 0)); }
        ctx.stroke(); ctx.strokeStyle = f.c2 ?? '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        break;
      }
      case 'smoke': ctx.fillStyle = f.c1; ctx.beginPath(); ctx.arc(X, Y, (f.r ?? 0.3) * T * (1 + k), 0, 7); ctx.fill(); break;
      case 'spark': ctx.fillStyle = f.c1; ctx.fillRect(X - 2, Y - 2, 4, 4); break;
      case 'debris': ctx.fillStyle = f.c1; ctx.fillRect(X - 3, Y - 3, 5, 5); break;
      case 'petal': ctx.fillStyle = f.c1; ctx.beginPath(); ctx.ellipse(X, Y, 4, 2, f.t * 8, 0, 7); ctx.fill(); break;
      case 'text': case 'big': {
        const pop = f.kind === 'big' ? 1 + Math.max(0, 0.4 - f.t) * 1.2 : 1;
        ctx.font = `${Math.round((f.size ?? 10) * pop)}px 'Press Start 2P', monospace`; ctx.textAlign = 'center';
        ctx.lineWidth = f.kind === 'big' ? 4 : 3; ctx.strokeStyle = '#1a0e20'; ctx.strokeText(f.text ?? '', X, Y); ctx.fillStyle = f.c1; ctx.fillText(f.text ?? '', X, Y);
        break;
      }
      case 'sprite': {
        const img = f.img!, n = 6, fw = img.width / n, frame = Math.min(n - 1, Math.floor(k * n)), sz = (f.r ?? 2) * T * 1.4;
        ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, frame * fw, 0, fw, img.height, X - sz / 2, Y - sz / 2, sz, sz);
        break;
      }
    }
    ctx.restore();
  }
  return keep;
}

// ─── peças das cartas que ficam na sala ─────────────────────────────────────

function shape(ctx: CanvasRenderingContext2D, look: Look | undefined, x: number, y: number, ang: number, r: number, c1: string, c2: string, now: number) {
  ctx.save();
  ctx.translate(x, y);
  const spin = now / 90;
  switch (look) {
    case 'lamina': case 'lua': {
      ctx.rotate(ang);
      ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, r * 1.3, -1.2, 1.2); ctx.arc(-r * 0.5, 0, r * 1.1, 1.1, -1.1, true); ctx.fill();
      ctx.fillStyle = c2; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(0, 0, r * 1.15, -0.9, 0.9); ctx.arc(-r * 0.3, 0, r * 1, 0.85, -0.85, true); ctx.fill();
      break;
    }
    case 'lanca': case 'kunai': case 'agulha': case 'espada': case 'flecha': {
      ctx.rotate(ang);
      const L = look === 'agulha' ? r * 2.6 : r * 3.4, W = Math.max(2, r * (look === 'agulha' ? 0.35 : 0.6));
      ctx.fillStyle = c1; ctx.fillRect(-L / 2, -W / 2, L, W);
      ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(L / 2 + W * 2, 0); ctx.lineTo(L / 2, -W * 1.2); ctx.lineTo(L / 2, W * 1.2); ctx.fill();
      break;
    }
    case 'tubarao': {
      ctx.rotate(ang);
      ctx.fillStyle = '#3a7ad8'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.6, r * 0.8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#bfe8ff'; ctx.beginPath(); ctx.ellipse(r * 0.2, r * 0.25, r * 1.1, r * 0.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a5aa8'; ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.6); ctx.lineTo(r * 0.3, -r * 1.4); ctx.lineTo(r * 0.6, -r * 0.6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 1.5, 0); ctx.lineTo(-r * 2.2, -r * 0.7); ctx.lineTo(-r * 2.2, r * 0.7); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(r * 0.9, -r * 0.3, 2, 2);
      break;
    }
    case 'carta': ctx.rotate(spin * 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(-r * 0.7, -r, r * 1.4, r * 2); ctx.strokeStyle = c1; ctx.lineWidth = 2; ctx.strokeRect(-r * 0.7, -r, r * 1.4, r * 2); break;
    case 'martelo': ctx.rotate(spin * 3); ctx.fillStyle = '#8a8a9a'; ctx.fillRect(-r * 1.2, -r * 0.6, r * 2.4, r * 1.2); ctx.fillStyle = '#6a3a20'; ctx.fillRect(-r * 0.15, 0, r * 0.3, r * 1.6); ctx.strokeStyle = c1; ctx.lineWidth = 2; ctx.strokeRect(-r * 1.2, -r * 0.6, r * 2.4, r * 1.2); break;
    case 'estrela': case 'shuriken': {
      ctx.rotate(spin * 4);
      ctx.fillStyle = look === 'shuriken' ? '#c8d8e8' : c1; ctx.beginPath();
      for (let k = 0; k < 8; k++) { const rr = k % 2 ? r * 0.45 : r * 1.3, a = (k / 8) * Math.PI * 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, 7); ctx.fill();
      break;
    }
    case 'esfera': case 'orbe': {
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.4);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, c2); g.addColorStop(1, c1 + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.4, 0, 7); ctx.fill();
      ctx.strokeStyle = c1; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.2, r * 0.5, spin, 0, 7); ctx.stroke();
      break;
    }
    case 'dragao': case 'tigre': case 'lagarto': case 'asas': {
      ctx.rotate(ang);
      for (let k = 4; k >= 0; k--) { ctx.globalAlpha = 0.35 + (4 - k) * 0.15; ctx.fillStyle = k % 2 ? c1 : c2; ctx.beginPath(); ctx.arc(-k * r * 0.8, Math.sin(now / 80 + k) * r * 0.3, r * (1 - k * 0.12), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.fillRect(r * 0.3, -r * 0.4, 3, 3); ctx.fillRect(r * 0.3, r * 0.2, 3, 3);
      if (look === 'asas') { ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-r * 1.5, -r * 1.8); ctx.lineTo(-r * 0.6, 0); ctx.lineTo(-r * 1.5, r * 1.8); ctx.fill(); }
      break;
    }
    case 'petala': ctx.rotate(spin * 3); ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.45, 0, 0, 7); ctx.fill(); break;
    case 'punho': {
      ctx.rotate(ang); ctx.fillStyle = c2; ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6); ctx.strokeStyle = c1; ctx.lineWidth = 2; ctx.strokeRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
      ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.6; for (const o of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(-r * 1.2, o * r); ctx.lineTo(-r * 2.4, o * r); ctx.stroke(); }
      break;
    }
    case 'rocha': case 'meteoro': ctx.rotate(spin); ctx.fillStyle = '#6a6478'; ctx.beginPath(); for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, rr = r * (0.8 + (k % 3) * 0.15); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); ctx.fillStyle = look === 'meteoro' ? '#ff8a3a' : '#8a8498'; ctx.fillRect(-r * 0.3, -r * 0.4, r * 0.4, r * 0.3); break;
    case 'neve': ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#7ae8ff'; ctx.lineWidth = 2; ctx.stroke(); break;
    case 'gelo': case 'cristal': ctx.rotate(ang); ctx.fillStyle = look === 'gelo' ? '#bff0ff' : c1; ctx.beginPath(); ctx.moveTo(r * 1.4, 0); ctx.lineTo(0, -r * 0.7); ctx.lineTo(-r * 1.2, 0); ctx.lineTo(0, r * 0.7); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke(); break;
    case 'coracao': ctx.fillStyle = '#ff6a9a'; ctx.beginPath(); ctx.arc(-r * 0.45, -r * 0.2, r * 0.5, 0, 7); ctx.arc(r * 0.45, -r * 0.2, r * 0.5, 0, 7); ctx.moveTo(-r, 0); ctx.lineTo(0, r); ctx.lineTo(r, 0); ctx.fill(); break;
    case 'raio': ctx.rotate(ang); ctx.strokeStyle = c1; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * 1.5, 0); for (let k = 1; k <= 4; k++) ctx.lineTo(-r * 1.5 + k * r * 0.75, (k % 2 ? -1 : 1) * r * 0.5); ctx.stroke(); break;
    case 'onda': case 'gota': ctx.rotate(ang); ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, r, -1.4, 1.4); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(r * 0.2, 0, r * 0.6, -1.2, 1.2); ctx.fill(); break;
    case 'inseto': ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(220,240,255,.7)'; ctx.fillRect(-r * 0.8, -r * 0.6 + Math.sin(now / 20) * 2, r * 0.6, r * 0.3); ctx.fillRect(r * 0.2, -r * 0.6 - Math.sin(now / 20) * 2, r * 0.6, r * 0.3); break;
    case 'ar': ctx.rotate(spin * 2); ctx.strokeStyle = c1; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, r * (0.5 + k * 0.35), k, k + 2.2); ctx.stroke(); } break;
    default: {
      ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
      ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
}

/** Desenha as peças das cartas (do caçador e dos inimigos) que estão na sala. */
export function drawActs(ctx: CanvasRenderingContext2D, run: Run, now: number, T: number) {
  const p = run.p;
  for (const a of run.acts) {
    const mv = a.mv, [c1, c2] = a.mine ? colorsOf(a.card, a.el) : ['#ff5ad8', '#3a0a2a'];
    const look = 'look' in mv ? mv.look : undefined;
    const X = a.x * T, Y = a.y * T, k = a.life > 0 ? a.t / a.life : 0;
    ctx.save();
    switch (mv.m) {
      case 'proj': {
        // rastro
        ctx.globalAlpha = 0.35;
        const sp = Math.hypot(a.vx, a.vy) || 1;
        shape(ctx, look, X - (a.vx / sp) * T * 0.5, Y - (a.vy / sp) * T * 0.5, Math.atan2(a.vy, a.vx), a.r * T * 0.8, c1, c2, now);
        ctx.globalAlpha = 1;
        const own = ownSprite(a.card);
        if (own && a.mine) { const n = 6, fw = own.width / n, fr = Math.floor(now / 90) % n, sz = Math.max(28, a.r * T * 3.2); ctx.imageSmoothingEnabled = false; ctx.drawImage(own, fr * fw, 0, fw, own.height, X - sz / 2, Y - sz / 2, sz, sz); }
        else shape(ctx, look, X, Y, Math.atan2(a.vy, a.vx), Math.max(4, a.r * T), c1, c2, now);
        break;
      }
      case 'tornado': {
        const R = a.r * T;
        for (let i = 0; i < 6; i++) {
          const h = i / 6, rr = R * (0.35 + h * 0.75), yy = Y - h * R * 1.6, rot = now / 60 + i;
          ctx.globalAlpha = 0.25 + 0.5 * (1 - h);
          ctx.strokeStyle = i % 2 ? c1 : c2; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(X + Math.cos(rot) * 2, yy, rr, rr * 0.35, 0, rot % 6.28, rot % 6.28 + 4.4); ctx.stroke();
        }
        ctx.globalAlpha = 0.5; ctx.fillStyle = c1;
        for (let i = 0; i < 8; i++) { const ang = now / 120 + i, rr = R * (0.4 + (i % 3) * 0.3); ctx.fillRect(X + Math.cos(ang) * rr - 2, Y - (i / 8) * R * 1.4 + Math.sin(ang) * rr * 0.3, 4, 4); }
        break;
      }
      case 'raio': {
        const ang = a.ang + (mv.sweep ? mv.sweep * (a.t / mv.dur - 0.5) : 0), L = a.len * T, w0 = a.w * T, w1 = (mv.cone ?? a.w) * T;
        ctx.translate(X, Y); ctx.rotate(ang);
        const flick = 0.85 + Math.sin(now / 25) * 0.15, fade = Math.min(1, (1 - k) * 4);
        ctx.globalAlpha = 0.45 * fade; ctx.fillStyle = c1;
        ctx.beginPath(); ctx.moveTo(0, -w0 * 0.9); ctx.lineTo(L, -w1 * 0.9); ctx.lineTo(L, w1 * 0.9); ctx.lineTo(0, w0 * 0.9); ctx.fill();
        ctx.globalAlpha = 0.9 * fade; ctx.fillStyle = c2;
        ctx.beginPath(); ctx.moveTo(0, -w0 * 0.35 * flick); ctx.lineTo(L, -w1 * 0.35 * flick); ctx.lineTo(L, w1 * 0.35 * flick); ctx.lineTo(0, w0 * 0.35 * flick); ctx.fill();
        if (look === 'ar' || a.card === 'makankosappo' || a.card === 'enuma-elish') { ctx.strokeStyle = a.card === 'makankosappo' ? '#a04ad8' : c1; ctx.lineWidth = 2; ctx.beginPath(); for (let s = 0; s <= L; s += 6) ctx.lineTo(s, Math.sin(s / 6 + now / 40) * w1 * 0.6); ctx.stroke(); }
        break;
      }
      case 'zona': {
        const R = a.r * T, pulse = 0.85 + Math.sin(now / 160) * 0.1, fade = Math.min(1, (1 - k) * 4);
        ctx.globalAlpha = 0.28 * fade; ctx.fillStyle = look === 'fumaca' ? '#b8b8c8' : look === 'sombra' ? '#2a0a3a' : c1;
        ctx.beginPath(); ctx.arc(X, Y, R * pulse, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.6 * fade; ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -now / 40;
        ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.7 * fade;
        for (let i = 0; i < 7; i++) {
          const ang = i * 0.9 + now / 700, rr = R * ((i * 37) % 10) / 11;
          const x = X + Math.cos(ang) * rr, y = Y + Math.sin(ang) * rr - ((now / 8 + i * 13) % 14);
          ctx.fillStyle = i % 2 ? c1 : c2;
          if (look === 'raiz') ctx.fillRect(x - 1, y, 3, 8); else if (look === 'gelo') ctx.fillRect(x - 3, y, 6, 2); else ctx.fillRect(x - 2, y - 2, 4, 4);
        }
        break;
      }
      case 'chuva':
        for (const pt of a.pts) {
          const x = pt.x * T, y = pt.y * T, R = a.r * T, q = Math.max(0, pt.t / 0.35);
          ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, R * (1 - q * 0.5), R * 0.4 * (1 - q * 0.5), 0, 0, 7); ctx.fill();
          ctx.globalAlpha = 1;
          if (look === 'raio') { ctx.strokeStyle = c1; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - 200); for (let s = 1; s < 8; s++) ctx.lineTo(x + rnd(-8, 8), y - 200 + s * 25); ctx.lineTo(x, y); ctx.stroke(); }
          else shape(ctx, look ?? 'esfera', x, y - q * 180, Math.PI / 2, Math.max(6, R * 0.6), c1, c2, now);
        }
        break;
      case 'orbita':
        for (let i = 0; i < a.n; i++) {
          const ang = a.t * mv.speed + (i / a.n) * Math.PI * 2;
          shape(ctx, look, X + Math.cos(ang) * a.r * T, Y + Math.sin(ang) * a.r * T, ang + Math.PI / 2, look === 'petala' ? 5 : 7, c1, c2, now);
        }
        break;
      case 'armadilha': {
        const armed = a.t >= mv.arm;
        ctx.fillStyle = '#2a2a3a'; ctx.beginPath(); ctx.arc(X, Y, 7, 0, 7); ctx.fill();
        ctx.fillStyle = armed && Math.floor(now / 200) % 2 ? '#ff3a4a' : c1; ctx.beginPath(); ctx.arc(X, Y, 3, 0, 7); ctx.fill();
        break;
      }
      case 'puxar': {
        ctx.strokeStyle = c1; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(X, Y, a.r * T * (1 - ((now / 500 + i / 4) % 1)), i, i + 3.5); ctx.stroke(); }
        break;
      }
      case 'prender': {
        const R = Math.max(14, a.r * T * 0.8), close = Math.min(1, k * 1.6);
        ctx.fillStyle = look === 'raiz' ? '#2e7a3a' : look === 'decadencia' ? '#4a3a4a' : look === 'ar' ? '#d8f4ff' : '#c8a060';
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2, h = R * (0.6 + close * 0.8);
          ctx.save(); ctx.translate(X + Math.cos(ang) * R * (1 - close * 0.6), Y + Math.sin(ang) * R * 0.5 * (1 - close * 0.6)); ctx.fillRect(-4, -h, 8, h); ctx.restore();
        }
        break;
      }
      case 'parar_tiros':
        ctx.strokeStyle = '#8ad0ff'; ctx.globalAlpha = 0.5 + Math.sin(now / 80) * 0.2; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x * T, p.y * T - 8, a.r * T, 0, 7); ctx.stroke();
        break;
      case 'investida': {
        const sp = Math.hypot(a.vx, a.vy) || 1;
        ctx.strokeStyle = c1; ctx.globalAlpha = 0.6; ctx.lineWidth = Math.max(6, a.w * T * 0.6); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x * T, p.y * T - 10); ctx.lineTo((p.x - (a.vx / sp) * 2) * T, (p.y - (a.vy / sp) * 2) * T - 10); ctx.stroke();
        break;
      }
    }
    ctx.restore();
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

/** A cena (o mundo escurece, o círculo mágico abre). `name` = nome da carta. */
export function drawCine(ctx: CanvasRenderingContext2D, run: Run, now: number, W: number, H: number, T: number, name: string) {
  const c = run.cine;
  if (!c) return;
  const k = 1 - c.t / c.total, X = c.x * T, Y = c.y * T;
  ctx.save();
  ctx.fillStyle = `rgba(4,2,12,${0.55 * Math.min(1, k * 3)})`; ctx.fillRect(0, 0, W, H);
  const [c1, c2] = colorsOf(c.card, 'Dark');
  switch (c.style) {
    case 'circulo': {
      // círculo mágico atrás do caçador, girando e crescendo
      const R = T * (0.8 + k * 1.8);
      ctx.translate(X - Math.cos(c.ang) * T * 0.6, Y - Math.sin(c.ang) * T * 0.6 - 10);
      ctx.strokeStyle = '#e0d0ff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
      ctx.rotate(now / 400);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 0.75, 0, 7); ctx.stroke();
      ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2 * 2; ctx.lineTo(Math.cos(a) * R * 0.75, Math.sin(a) * R * 0.75); } ctx.stroke();
      ctx.fillStyle = '#c8a0ff'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.fillRect(Math.cos(a) * R * 0.88 - 2, Math.sin(a) * R * 0.88 - 2, 4, 4); }
      break;
    }
    case 'carga': case 'esfera': {
      const R = c.style === 'esfera' ? T * (0.3 + k * 1.6) : T * 0.4 * (1 + k);
      const cy = c.style === 'esfera' ? Y - T * 2.2 : Y - 12;
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + now / 300, d = T * 3 * (1 - ((now / 600 + i / 24) % 1)); ctx.fillStyle = i % 2 ? c1 : c2; ctx.fillRect(X + Math.cos(a) * d - 2, cy + Math.sin(a) * d - 2, 4, 4); }
      const g = ctx.createRadialGradient(X, cy, 2, X, cy, R);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, c.style === 'esfera' ? '#8ad0ff' : c1); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, cy, R, 0, 7); ctx.fill();
      break;
    }
    case 'foco': {
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
      for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2 + (i % 3) * 0.05, r0 = T * (2.5 - k), r1 = Math.max(W, H); ctx.beginPath(); ctx.moveTo(X + Math.cos(a) * r0, Y + Math.sin(a) * r0); ctx.lineTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1); ctx.stroke(); }
      break;
    }
    case 'orbes': {
      const d = T * 1.6 * (1 - k), cy = Y - T * 1.2;
      ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(X - d, cy, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a8aff'; ctx.beginPath(); ctx.arc(X + d, cy, 10, 0, 7); ctx.fill();
      if (k > 0.7) { ctx.fillStyle = '#a04aff'; ctx.beginPath(); ctx.arc(X, cy, 14 * (k - 0.7) / 0.3 + 6, 0, 7); ctx.fill(); }
      break;
    }
    case 'ceu': case 'nuvem': {
      ctx.fillStyle = 'rgba(30,20,50,.7)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse((i / 8) * W, T * 0.8 + Math.sin(i + now / 500) * 8, T * 1.6, T * 0.7, 0, 0, 7); ctx.fill(); }
      if (c.style === 'nuvem' && Math.floor(now / 90) % 3 === 0) { ctx.strokeStyle = '#fff07a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rnd(0, W), 0); ctx.lineTo(rnd(0, W), T * 2); ctx.stroke(); }
      break;
    }
    case 'luz': { const g = ctx.createLinearGradient(X, 0, X, Y); g.addColorStop(0, 'rgba(255,216,74,0)'); g.addColorStop(1, 'rgba(255,240,160,.9)'); ctx.fillStyle = g; ctx.fillRect(X - T * 0.6 * k, 0, T * 1.2 * k, Y); break; }
    case 'vento': ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let s = 0; s < 60; s++) { const a = s * 0.25 + now / 100 + i * 2, r = s * T * 0.05 * k; ctx.lineTo(X + Math.cos(a) * r, Y - 10 + Math.sin(a) * r); } ctx.stroke(); } break;
    case 'arco': ctx.strokeStyle = '#ff6a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(X, Y - 10, T * 1.2, c.ang - 1.2 * k, c.ang + 1.2 * k); ctx.stroke(); break;
    case 'raiz': ctx.fillStyle = '#ffd84a'; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ctx.fillRect(X + Math.cos(a) * T * 2 * k - 4, Y + Math.sin(a) * T * 1.2 * k - 12, 8, 12); } break;
  }
  ctx.restore();
  // nome da carta grande
  ctx.save();
  ctx.globalAlpha = Math.min(1, k * 4);
  ctx.font = "14px 'Press Start 2P', monospace"; ctx.textAlign = 'center';
  ctx.lineWidth = 5; ctx.strokeStyle = '#0a0612'; ctx.strokeText(name.toUpperCase(), W / 2, T * 1.4);
  ctx.fillStyle = c2 === '#ffffff' ? c1 : '#ffffff'; ctx.fillText(name.toUpperCase(), W / 2, T * 1.4);
  ctx.restore();
}
export type { Act };
