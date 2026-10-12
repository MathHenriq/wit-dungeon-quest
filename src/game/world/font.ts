// Fonte pixel da cidade: maiúsculas 5×7 com traço de 1 px, todas na mesma
// grade (largura 5, exceto I, 1 e pontuação), 1 px entre letras. Desenha com
// contorno em volta (legível sobre qualquer fundo) e sombra opcional.
import { mix, type Pixmap, type RGB } from './pixmap';

export const FONT_H = 7;

const G: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['....#', '....#', '....#', '....#', '#...#', '#...#', '.###.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  '2': ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'],
  '3': ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ':': ['.', '.', '#', '.', '.', '#', '.'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
};

function glyph(ch: string): string[] {
  // acentos saem sem o acento (Á → A, Ç → C): a fonte só tem as letras base
  return G[ch.toUpperCase()] ?? G[ch.normalize('NFD')[0].toUpperCase()] ?? G[' '];
}

export function textWidth(text: string): number {
  if (!text) return 0;
  return [...text].reduce((w, ch) => w + glyph(ch)[0].length + 1, -1);
}

export interface TextStyle {
  /** Cor da letra; `fillBottom` faz degradê de cima para baixo. */
  fill: RGB;
  fillBottom?: RGB;
  /** Contorno de 1 px em volta de cada letra (8 vizinhos). */
  outline?: RGB;
  /** Sombra 1 px para baixo (depois do contorno). */
  shadow?: RGB;
}

/** Desenha o texto com o canto de cima à esquerda em (x, y). */
export function drawText(pm: Pixmap, text: string, x: number, y: number, style: TextStyle | RGB, legacyShadow?: RGB): void {
  const st: TextStyle = 'fill' in style ? style : { fill: style as RGB, shadow: legacyShadow };
  const pts: [number, number, number][] = [];
  let cx = x;
  for (const ch of text) {
    const g = glyph(ch);
    g.forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '#') pts.push([cx + rx, y + ry, ry]); }));
    cx += g[0].length + 1;
  }
  const on = new Set(pts.map(([px, py]) => `${px},${py}`));
  if (st.shadow) {
    const sh = st.shadow;
    for (const [px, py] of pts) {
      const off = st.outline ? 2 : 1;
      if (!on.has(`${px},${py + off}`)) pm.put(px, py + off, sh);
      if (st.outline) { pm.put(px + 1, py + off, sh); pm.put(px - 1, py + off, sh); }
    }
  }
  if (st.outline) {
    for (const [px, py] of pts) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!on.has(`${px + dx},${py + dy}`)) pm.put(px + dx, py + dy, st.outline);
    }
  }
  for (const [px, py, ry] of pts) {
    const c = st.fillBottom ? mix(st.fill, st.fillBottom, ry / (FONT_H - 1)) : st.fill;
    pm.put(px, py, c);
  }
}

