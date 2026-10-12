// O que o jogador faz no mapa, desenhado por cima do boneco: a vara de pesca
// com a linha e a boia (e o "!" quando o peixe morde), os remos do barco e
// a marola atrás dele. Pixels do mundo; 0,5 = um pixel da tela hd.
import type { Dir } from './movement';

const snap = (v: number) => Math.round(v * 2) / 2;

/**
 * Vara, linha e boia. `cx`/`fy` = meio e pé do boneco na tela; `bx`/`by` =
 * onde a boia cai (na tela). `phase`: lançando, esperando, mordeu.
 */
export function drawRod(ctx: CanvasRenderingContext2D, cx: number, fy: number, dir: Dir, bx: number, by: number, phase: 'cast' | 'wait' | 'bite' | 'meter', k: number, now: number): void {
  const s = dir === 'west' ? -1 : 1;
  const hand: [number, number] = dir === 'north' ? [cx + 4, fy - 16] : dir === 'south' ? [cx + 5, fy - 12] : [cx + s * 5, fy - 13];
  const tip: [number, number] = dir === 'north' ? [cx + 8, fy - 34] : dir === 'south' ? [cx + 10, fy - 26] : [cx + s * 16, fy - 26];
  // lançando: a boia voa da ponta até a água (k: 0 → 1)
  const t = phase === 'cast' ? k : 1;
  const bob = phase === 'bite' ? 1.5 + Math.sin(now / 55) * 1 : phase === 'meter' ? 2 + Math.sin(now / 40) * 1.5 : Math.sin(now / 380) * 0.6;
  const x = tip[0] + (bx - tip[0]) * t, y = tip[1] + (by - tip[1]) * t - Math.sin(t * Math.PI) * 14 + (t === 1 ? bob : 0);
  // vara
  ctx.strokeStyle = '#6a3e1c'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
  ctx.strokeStyle = '#a06a3a'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(hand[0], hand[1] - 0.5); ctx.lineTo(tip[0], tip[1] - 0.5); ctx.stroke();
  // linha com barriga (esticada quando o peixe puxa)
  ctx.strokeStyle = 'rgba(245,245,255,0.85)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(tip[0], tip[1]);
  const sag = phase === 'bite' || phase === 'meter' ? 0 : 7;
  ctx.quadraticCurveTo((tip[0] + x) / 2, Math.max(tip[1], y) + sag, x, y);
  ctx.stroke();
  // boia vermelha e branca
  ctx.fillStyle = '#f4f0ea'; ctx.fillRect(snap(x - 1), snap(y - 1.5), 2, 1.5);
  ctx.fillStyle = '#e83a3a'; ctx.fillRect(snap(x - 1), snap(y), 2, 1.5);
  if (t === 1) {
    // anéis na água em volta da boia
    const r = 2 + ((now / 90) % 6);
    ctx.strokeStyle = `rgba(230,248,255,${phase === 'bite' || phase === 'meter' ? 0.9 : 0.45 * (1 - (r - 2) / 6)})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.ellipse(x, y + 1.5, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

/** Balão com "!" em cima da cabeça (o peixe mordeu). */
export function drawAlert(ctx: CanvasRenderingContext2D, cx: number, top: number, now: number): void {
  const y = top - 12 - (Math.floor(now / 120) % 2);
  ctx.fillStyle = '#2e2a40'; ctx.fillRect(cx - 4.5, y - 0.5, 9, 11);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 4, y, 8, 10);
  ctx.fillStyle = '#2e2a40'; ctx.fillRect(cx - 1, y + 10, 2, 2);
  ctx.fillStyle = '#e8485a'; ctx.fillRect(cx - 1, y + 1.5, 2, 5); ctx.fillRect(cx - 1, y + 7.5, 2, 1.5);
}

/** Remos batendo (quando o barco anda) e a marola atrás. */
export function drawOars(ctx: CanvasRenderingContext2D, cx: number, cy: number, dir: Dir, moving: boolean, now: number): void {
  const vertical = dir === 'north' || dir === 'south';
  const a = moving ? Math.sin(now / 130) : 0.3;
  ctx.strokeStyle = '#c89458'; ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    if (vertical) { ctx.moveTo(cx + side * 4, cy); ctx.lineTo(cx + side * 13, cy + a * 4); }
    else { ctx.moveTo(cx, cy - 1 + side * 3); ctx.lineTo(cx + a * 4, cy - 1 + side * 10); }
    ctx.stroke();
    ctx.fillStyle = '#a8703a';
    if (vertical) ctx.fillRect(snap(cx + side * 13 - 1), snap(cy + a * 4 - 1), 2, 3);
    else ctx.fillRect(snap(cx + a * 4 - 1), snap(cy - 1 + side * 10 - 1), 3, 2);
  }
  if (!moving) return;
  // marola: dois traços claros atrás do barco
  const back = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[dir];
  for (let k = 1; k <= 3; k++) {
    const life = ((now / 400) + k / 3) % 1;
    ctx.fillStyle = `rgba(235,250,255,${0.6 * (1 - life)})`;
    const d = 12 + life * 10;
    const px = cx + back[0] * d, py = cy + 3 + back[1] * d;
    if (vertical) { ctx.fillRect(snap(px - 5 - life * 3), snap(py), 2, 0.5); ctx.fillRect(snap(px + 3 + life * 3), snap(py), 2, 0.5); }
    else { ctx.fillRect(snap(px), snap(py - 4 - life * 2), 0.5, 2); ctx.fillRect(snap(px), snap(py + 2 + life * 2), 0.5, 2); }
  }
}

/**
 * Aviso de botão em cima da cabeça: tem algo para usar na frente (conversar,
 * pescar, plantar, entrar). `label` curto ("A", "ESPAÇO"). Pisca devagar.
 */
export function drawHint(ctx: CanvasRenderingContext2D, cx: number, top: number, label: string, now: number): void {
  const bob = Math.sin(now / 260) > 0 ? 0 : 0.5;
  ctx.font = 'bold 5px monospace';
  const w = Math.max(7, ctx.measureText(label).width + 4), h = 7, x = Math.round(cx - w / 2), y = Math.round(top - h - bob);
  ctx.fillStyle = 'rgba(46,42,64,0.9)';
  ctx.fillRect(x - 0.5, y - 0.5, w + 1, h + 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2e2a40';
  ctx.fillRect(Math.round(cx) - 1, y + h + 0.5, 2, 1);
  ctx.fillStyle = '#e8485a';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, y + h / 2 + 0.5);
  ctx.textBaseline = 'alphabetic';
}

/** Placa de saída piscando em cima de uma porta de interior. */
export function drawExitMark(ctx: CanvasRenderingContext2D, cx: number, y: number, label: string, now: number): void {
  const a = 0.65 + 0.35 * Math.sin(now / 300);
  ctx.globalAlpha = a;
  ctx.font = 'bold 5px monospace';
  const w = ctx.measureText(label).width + 6;
  ctx.fillStyle = 'rgba(20,60,30,0.85)';
  ctx.fillRect(Math.round(cx - w / 2), y - 4, w, 7);
  ctx.fillStyle = '#b8ff7a';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, y);
  ctx.textBaseline = 'alphabetic';
  // setinha para baixo
  ctx.fillRect(Math.round(cx) - 1.5, y + 4, 3, 1); ctx.fillRect(Math.round(cx) - 0.5, y + 5, 1, 1);
  ctx.globalAlpha = 1;
}
