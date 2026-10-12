// Formas geométricas rasterizadas em máscara de pixels (sem antisserrilhado).
// O pixel (x, y) é "dentro" se o centro dele (x+0.5, y+0.5) cai na forma.

export const SIZE = 64;

export type Mask = Uint8Array;

export const emptyMask = (): Mask => new Uint8Array(SIZE * SIZE);

export function fromTest(test: (x: number, y: number) => boolean): Mask {
  const m = emptyMask();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (test(x + 0.5, y + 0.5)) m[y * SIZE + x] = 1;
  }
  return m;
}

export const at = (m: Mask, x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < SIZE && y < SIZE && m[y * SIZE + x] === 1;

export function ellipse(cx: number, cy: number, rx: number, ry: number): Mask {
  return fromTest((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
}

/** Segmento grosso com pontas redondas: braços, pernas, mechas. */
export function capsule(x1: number, y1: number, x2: number, y2: number, r: number): Mask {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  return fromTest((x, y) => {
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
    const px = x1 + t * dx - x, py = y1 + t * dy - y;
    return px * px + py * py <= r * r;
  });
}

export function roundRect(x0: number, y0: number, x1: number, y1: number, r: number): Mask {
  return fromTest((x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.max(x0 + r, Math.min(x1 - r, x));
    const cy = Math.max(y0 + r, Math.min(y1 - r, y));
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  });
}

export function polygon(pts: readonly (readonly [number, number])[]): Mask {
  return fromTest((x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
}

export function union(...ms: Mask[]): Mask {
  const out = emptyMask();
  for (const m of ms) for (let i = 0; i < out.length; i++) out[i] |= m[i];
  return out;
}

export function intersect(a: Mask, b: Mask): Mask {
  const out = emptyMask();
  for (let i = 0; i < out.length; i++) out[i] = a[i] & b[i];
  return out;
}

export function subtract(a: Mask, b: Mask): Mask {
  const out = emptyMask();
  for (let i = 0; i < out.length; i++) out[i] = a[i] & (b[i] ^ 1);
  return out;
}

export function shift(m: Mask, dx: number, dy: number): Mask {
  const out = emptyMask();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (at(m, x - dx, y - dy)) out[y * SIZE + x] = 1;
  }
  return out;
}

export function flipX(m: Mask): Mask {
  const out = emptyMask();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    out[y * SIZE + x] = m[y * SIZE + (SIZE - 1 - x)];
  }
  return out;
}
