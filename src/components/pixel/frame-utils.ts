// Molduras em pixel art para os painéis do jogo (trabalho, mochila, mapa,
// lojas...). Cada moldura é uma pecinha 9-slice desenhada em SVG com
// `crispEdges` (fica nítida em qualquer tamanho) e usada como `border-image`.
// Nada de cantos arredondados: os cantos são em degrau, como no Pokémon.

/** Mistura uma cor com branco (f > 0) ou preto (f < 0). */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)));
  return `#${ch.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
}

export interface FrameColors {
  /** contorno de fora */ ink: string;
  /** luz (em cima e à esquerda) */ hi: string;
  /** corpo da moldura */ mid: string;
  /** sombra (embaixo e à direita) */ lo: string;
  /** linha de dentro */ inner: string;
  /** miolo */ fill: string;
}

const cache = new Map<string, string>();

/**
 * Pecinha 24 × 24 (cantos de 8): contorno com canto em degrau, faixa de luz e
 * sombra, corpo, linha de dentro e miolo. `thin` = moldura de 4 (caixas e botões).
 */
export function frameUrl(c: FrameColors, thin = false): string {
  const key = JSON.stringify(c) + thin;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 24, rects: string[] = [];
  const put = (x: number, y: number, col: string) => rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${col}"/>`);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const cx = Math.min(x, S - 1 - x), cy = Math.min(y, S - 1 - y), d = Math.min(cx, cy);
    if (cx + cy < 2) continue; // canto em degrau (transparente)
    // de que borda é o pixel: a de cima e a da esquerda pegam luz
    const lit = cy < cx ? y < S / 2 : cx < cy ? x < S / 2 : x + y < S - 1;
    let col: string;
    if (thin) {
      col = d < 1 || cx + cy === 2 ? c.ink : d < 2 ? (lit ? c.hi : c.lo) : d < 3 ? c.mid : d < 4 ? c.inner : c.fill;
    } else {
      col = d < 2 || cx + cy === 2 ? c.ink : d < 3 ? (lit ? c.hi : c.lo) : d < 5 ? c.mid : d < 6 ? (lit ? c.lo : c.mid) : d < 7 ? c.inner : c.fill;
    }
    put(x, y, col);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  cache.set(key, url);
  return url;
}

/** Madeira com pergaminho dentro: a moldura dos painéis. */
export const WOOD: FrameColors = { ink: '#2a1a10', hi: '#d8a66a', mid: '#9a6634', lo: '#5e3a1c', inner: '#3a2414', fill: '#f6e7c1' };
/** Caixinha de dentro (pergaminho mais escuro com borda de tinta). */
export const PAPER: FrameColors = { ink: '#8a6a3e', hi: '#fff8e2', mid: '#efdcae', lo: '#d2b47c', inner: '#c8a86e', fill: '#fbf1d6' };
/** Painel escuro (lojas, forja, cursos). */
export const NIGHT: FrameColors = { ink: '#0c0814', hi: '#6a5a9a', mid: '#3a2e5a', lo: '#1e1630', inner: '#120c1c', fill: '#1c1428' };

/** Moldura de botão na cor dada. */
export const buttonColors = (color: string): FrameColors => ({
  ink: shade(color, -0.72), hi: shade(color, 0.38), mid: color, lo: shade(color, -0.35), inner: color, fill: color,
});
