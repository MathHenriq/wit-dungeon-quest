// Moradores trabalhando na cidade: o que cada um segura e o efeito em volta
// (linha de pesca com boia, notas saindo do violão, bandeja de pão com vapor,
// regador pingando, caixa da loja). Desenho por código, em pixels do mundo,
// por cima (ou atrás, de costas) do boneco. É a base visual das profissões.
import type { Dir } from './movement';

export type JobKind = 'pescar' | 'musica' | 'padeiro' | 'regar' | 'arrumar' | 'passear';

/** Uma parada da rota: bloco e para onde olhar ao chegar. */
export type Stop = [number, number, Dir];

export interface NpcJob {
  kind: JobKind;
  /** Sem rota: fica parado no lugar trabalhando. Com rota: anda de parada em parada. */
  route?: Stop[];
  /** Quanto tempo fica em cada parada (ms, mínimo e máximo). */
  pause?: [number, number];
}

export interface JobState {
  now: number;
  /** Andando entre paradas (e não parado trabalhando). */
  moving: boolean;
  /** Índice da parada atual (a caixa da loja vai num sentido só). */
  stop: number;
  /** 0–1, para os moradores iguais não fazerem tudo ao mesmo tempo. */
  seed: number;
}

/** Quanto o boneco sobe e desce trabalhando (px). */
export function jobBob(kind: JobKind, st: JobState): number {
  if (st.moving) return 0;
  if (kind === 'musica') return Math.floor(st.now / 260 + st.seed * 4) % 2 ? -1 : 0;
  if (kind === 'padeiro' || kind === 'regar') return Math.floor(st.now / 520 + st.seed * 4) % 2 ? -0.5 : 0;
  return 0;
}

/** O que segura fica atrás do corpo quando ele está de costas. */
export const propsBehind = (dir: Dir) => dir === 'north';

const side = (dir: Dir) => (dir === 'west' ? -1 : 1);

/**
 * Desenha o que o morador segura e o efeito do trabalho. `cx` = meio do
 * boneco, `fy` = linha dos pés, na tela (pixels do mundo).
 */
export function drawJob(ctx: CanvasRenderingContext2D, kind: JobKind, cx: number, fy: number, dir: Dir, st: JobState): void {
  if (kind === 'pescar') return fishing(ctx, cx, fy, dir, st);
  if (kind === 'passear') return;
  // Objetos na mão (violão, bandeja, regador, caixa) ficavam flutuando na
  // frente do boneco, sem braço segurando: saem até o GPT fazer os quadros
  // "segurando" de cada morador (docs/prompts-poses.md). Fica só o efeito.
  if (kind === 'musica') notes(ctx, cx, fy, dir, st);
  else if (kind === 'regar' && !st.moving) waterDrops(ctx, cx, fy, dir, st);
  else if (kind === 'arrumar' && !st.moving) sparkle(ctx, cx, fy, st);
}
/** Gotas caindo na frente de quem rega (sem o regador). */
function waterDrops(ctx: CanvasRenderingContext2D, cx: number, fy: number, dir: Dir, st: JobState) {
  const s = dir === 'west' ? -1 : 1;
  for (let i = 0; i < 6; i++) {
    const life = ((st.now / 600) + i / 6) % 1;
    px(ctx, `rgba(140,205,255,${0.9 * (1 - life)})`, cx + s * (9 + (i % 3)), fy - 10 + life * 10, 0.5, 1);
  }
}
const HELD = 1.5;

function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2, w, h);
}

// ── pescador: vara, linha com barriga, boia balançando; de vez em quando fisga um peixe ──
function fishing(ctx: CanvasRenderingContext2D, cx: number, fy: number, dir: Dir, st: JobState) {
  const s = dir === 'south' ? 1 : side(dir);
  const hand: [number, number] = [cx + s * 5, fy - 13];
  const tip: [number, number] = dir === 'south' ? [cx + 12, fy - 20] : [cx + s * 17, fy - 23];
  const bobber: [number, number] = dir === 'south' ? [cx + 13, fy + 11] : [cx + s * 25, fy - 2];
  const period = 9000 + st.seed * 3000;
  const t = ((st.now + st.seed * period) % period) / period;
  const bite = t > 0.78 && t < 0.9;
  const dip = bite ? 1.5 + Math.sin(st.now / 60) * 0.8 : Math.sin(st.now / 380 + st.seed * 6) * 0.6;
  const by = bobber[1] + dip;
  // vara
  ctx.strokeStyle = '#6a3e1c'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
  ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo((hand[0] + tip[0]) / 2, (hand[1] + tip[1]) / 2); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
  // linha (esticada na fisgada)
  ctx.strokeStyle = 'rgba(235,240,245,0.8)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(tip[0], tip[1]);
  ctx.quadraticCurveTo((tip[0] + bobber[0]) / 2, Math.max(tip[1], by) + (bite ? 0 : 5), bobber[0], by - 1); ctx.stroke();
  // ondinha em volta da boia
  const ring = ((st.now / 1400 + st.seed) % 1);
  ctx.strokeStyle = `rgba(220,240,255,${(bite ? 0.8 : 0.45) * (1 - ring)})`;
  ctx.beginPath(); ctx.ellipse(bobber[0], bobber[1] + 1, 2 + ring * (bite ? 7 : 4), 1 + ring * (bite ? 3 : 1.6), 0, 0, Math.PI * 2); ctx.stroke();
  // boia vermelha e branca
  px(ctx, '#f4f4f4', bobber[0] - 1, by - 2, 2, 1);
  px(ctx, '#e0303a', bobber[0] - 1, by - 1, 2, 1.5);
  // peixe pulando da água até a mão
  if (t >= 0.9) {
    const k = (t - 0.9) / 0.1;
    const x = bobber[0] + (hand[0] - bobber[0]) * k, y = by + (hand[1] - by) * k - Math.sin(k * Math.PI) * 14;
    const f = k < 0.5 ? -s : s;
    px(ctx, '#f08a2c', x - 2, y - 1, 4, 2);
    px(ctx, '#ffd070', x - 1, y - 1, 2, 0.5);
    px(ctx, '#d0601c', x + (f > 0 ? -3 : 2), y - 1.5, 1, 3);
    for (let i = 0; i < 3; i++) px(ctx, 'rgba(210,235,255,0.8)', bobber[0] - 2 + i * 2, by - 2 - k * 6 - i, 0.5, 0.5);
  }
}

// ── músico: violão no colo, dedilhando; notas coloridas subindo ──
const NOTE_COLORS = ['#ffe070', '#ff8ab0', '#8ad8ff', '#b8f080'];
function notes(ctx: CanvasRenderingContext2D, cx: number, fy: number, dir: Dir, st: JobState) {
  const s = dir === 'west' ? -1 : 1;
  noteStream(ctx, cx, fy, s, st);
}
export function guitar(ctx: CanvasRenderingContext2D, cx: number, fy: number, dir: Dir, st: JobState) {
  const s = dir === 'west' ? -1 : 1;
  const bx = cx - s * 1, by = fy - 11 + jobBob('musica', st);
  // braço do violão
  ctx.strokeStyle = '#4a2a12'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bx + s * 2, by - 1); ctx.lineTo(bx + s * 10, by - 7); ctx.stroke();
  px(ctx, '#2a1808', bx + s * 10 - 1, by - 8.5, 2, 2);
  // corpo
  ctx.fillStyle = '#b8642a'; ctx.beginPath(); ctx.ellipse(bx - s * 1, by + 1, 4, 3.2, s * -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d88a44'; ctx.beginPath(); ctx.ellipse(bx - s * 1.6, by + 0.4, 2.2, 1.6, s * -0.5, 0, Math.PI * 2); ctx.fill();
  px(ctx, '#3a200c', bx - s * 0.5 - 0.5, by, 1, 1);
  noteStream(ctx, cx, fy, s, st);
}
/** Notas: uma nova a cada 650 ms, sobem balançando e somem. */
function noteStream(ctx: CanvasRenderingContext2D, cx: number, fy: number, s: number, st: JobState) {
  for (let i = 0; i < 4; i++) {
    const born = Math.floor(st.now / 650) - i;
    const life = (st.now - born * 650) / 2600;
    if (life < 0 || life > 1) continue;
    const nx = cx + s * 6 + Math.sin(born * 1.7 + life * 5) * 4, ny = fy - 26 - life * 18;
    ctx.globalAlpha = life < 0.8 ? 1 : (1 - life) / 0.2;
    const c = NOTE_COLORS[((born % 4) + 4) % 4];
    px(ctx, c, nx, ny + 3, 2, 1.5);
    px(ctx, c, nx + 1.5, ny, 0.5, 3.5);
    if (born % 2) px(ctx, c, nx + 1.5, ny, 1.5, 0.5);
    ctx.globalAlpha = 1;
  }
}

// ── padeiro: bandeja de pães com vapor ──
function tray(ctx: CanvasRenderingContext2D, cx: number, fy: number, dir: Dir, st: JobState) {
  const s = dir === 'west' ? -1 : dir === 'east' ? 1 : 0;
  const tx = cx - 6 + s * 3, ty = fy - 14 + jobBob('padeiro', st);
  px(ctx, '#8a8a96', tx, ty + 1, 12, 1);
  px(ctx, '#d4d4dc', tx, ty, 12, 1);
  for (let i = 0; i < 3; i++) {
    const lx = tx + 1 + i * 3.6;
    px(ctx, '#a85a20', lx, ty - 2, 3, 2);
    px(ctx, '#e0a050', lx + 0.5, ty - 2.5, 2, 1);
  }
  // vapor
  for (let i = 0; i < 3; i++) {
    const life = ((st.now / 1500) + i / 3 + st.seed) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - life)})`;
    const vx = tx + 2 + i * 4 + Math.sin(life * 6 + i) * 1.2, vy = ty - 4 - life * 10;
    ctx.fillRect(Math.round(vx * 2) / 2, Math.round(vy * 2) / 2, 1 + life, 1 + life);
  }
}

// ── fazendeiro: regador; parado, a água cai nas plantas ──
function wateringCan(ctx: CanvasRenderingContext2D, cx: number, fy: number, dir: Dir, st: JobState) {
  const s = dir === 'west' ? -1 : 1;
  const x = cx + s * 5, y = fy - 12 + jobBob('regar', st);
  px(ctx, '#3a86c4', x - 2.5, y - 2, 5, 4);
  px(ctx, '#6ab4e8', x - 2, y - 2, 2, 1);
  px(ctx, '#2a6698', x - 1.5, y - 3.5, 3, 0.5);
  // bico
  ctx.strokeStyle = '#3a86c4'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + s * 2.5, y); ctx.lineTo(x + s * 6, y - (st.moving ? 2 : -1)); ctx.stroke();
  if (st.moving) return;
  for (let i = 0; i < 5; i++) {
    const life = ((st.now / 600) + i / 5) % 1;
    px(ctx, `rgba(140,205,255,${0.9 * (1 - life)})`, x + s * (6.5 + (i % 3) * 0.8), y + life * 9, 0.5, 1);
  }
}

// ── lojista: leva caixas para a loja ──
function box(ctx: CanvasRenderingContext2D, cx: number, fy: number, dir: Dir) {
  const s = dir === 'west' ? -1 : dir === 'east' ? 1 : 0;
  const x = cx - 4 + s * 3, y = fy - 15;
  px(ctx, '#b07a44', x, y, 8, 6);
  px(ctx, '#d09a5c', x, y, 8, 1.5);
  px(ctx, '#e8d8b0', x + 3.5, y, 1, 6);
  px(ctx, '#7a5028', x, y + 5.5, 8, 0.5);
}
function sparkle(ctx: CanvasRenderingContext2D, cx: number, fy: number, st: JobState) {
  const life = ((st.now / 900) + st.seed) % 1;
  if (life > 0.6) return;
  const a = 1 - life / 0.6, x = cx + 7 + Math.sin(st.now / 700) * 2, y = fy - 22 - life * 6;
  px(ctx, `rgba(255,240,170,${a})`, x - 0.5, y - 2, 1, 5);
  px(ctx, `rgba(255,240,170,${a})`, x - 2, y - 0.5, 5, 1);
}
