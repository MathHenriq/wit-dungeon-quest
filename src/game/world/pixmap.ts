// Imagem RGBA simples, desenhada pixel a pixel. Roda igual no navegador e no
// Node (script que gera o PNG de revisão). Toda a arte do mundo sai daqui.

export type RGB = readonly [number, number, number];

export function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const mix = (a: RGB, b: RGB, t: number): RGB =>
  [0, 1, 2].map(i => Math.round(a[i] * (1 - t) + b[i] * t)) as unknown as RGB;

export class Pixmap {
  readonly data: Uint8ClampedArray;

  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  put(x: number, y: number, c: RGB | null | undefined): void {
    x |= 0; y |= 0;
    if (!c || !this.inside(x, y)) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = 255;
  }

  get(x: number, y: number): RGB | null {
    if (!this.inside(x, y)) return null;
    const i = (y * this.w + x) * 4;
    if (this.data[i + 3] === 0) return null;
    return [this.data[i], this.data[i + 1], this.data[i + 2]];
  }

  opaque(x: number, y: number): boolean {
    return this.inside(x, y) && this.data[(y * this.w + x) * 4 + 3] > 0;
  }

  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.put(xx, yy, c);
  }

  /** Contorno de retângulo de 1 px. */
  frame(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let xx = x; xx < x + w; xx++) { this.put(xx, y, c); this.put(xx, y + h - 1, c); }
    for (let yy = y; yy < y + h; yy++) { this.put(x, yy, c); this.put(x + w - 1, yy, c); }
  }

  /** Copia outra imagem por cima (pixels transparentes não apagam nada). */
  blit(src: Pixmap, dx: number, dy: number, flipX = false): void {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const sx = flipX ? src.w - 1 - x : x;
      const i = (y * src.w + sx) * 4;
      if (src.data[i + 3] === 0) continue;
      this.put(dx + x, dy + y, [src.data[i], src.data[i + 1], src.data[i + 2]]);
    }
  }

  /**
   * Desenha um bloco de texto em que cada caractere é um pixel da legenda.
   * `.` e espaço são transparentes.
   */
  stamp(rows: readonly string[], x: number, y: number, legend: Record<string, RGB>): void {
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const c = legend[row[rx]];
        if (c) this.put(x + rx, y + ry, c);
      }
    });
  }

  /** Contorna por fora tudo que for opaco (fundo transparente). */
  outline(c: RGB, diagonals = false): void {
    const add: [number, number][] = [];
    const nb = diagonals
      ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
      : [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.opaque(x, y)) continue;
      if (nb.some(([dx, dy]) => this.opaque(x + dx, y + dy))) add.push([x, y]);
    }
    for (const [x, y] of add) this.put(x, y, c);
  }
}

/** Número pseudoaleatório estável por coordenada (0..1). */
export function hash(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
