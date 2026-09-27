// Movimento em grade, como no Pokémon: o personagem anda de bloco em bloco,
// vira sem andar se o caminho estiver fechado, e pode seguir uma rota até o
// ponto tocado na tela. Funções puras (testáveis sem navegador).

export type Dir = 'south' | 'north' | 'west' | 'east';

export const DELTA: Record<Dir, [number, number]> = {
  south: [0, 1], north: [0, -1], west: [-1, 0], east: [1, 0],
};

export interface Walker {
  tx: number;
  ty: number;
  dir: Dir;
  /** Bloco de origem enquanto anda (null = parado). */
  from: { tx: number; ty: number } | null;
  /** 0..1 do passo atual. */
  t: number;
  /** Tempo acumulado de animação (ms), para escolher o quadro. */
  anim: number;
}

export function newWalker(tx: number, ty: number, dir: Dir = 'south'): Walker {
  return { tx, ty, dir, from: null, t: 0, anim: 0 };
}

export type Blocked = (tx: number, ty: number) => boolean;

/** Tenta começar um passo. Se o bloco estiver fechado, só vira. */
export function tryStep(w: Walker, dir: Dir, blocked: Blocked): boolean {
  if (w.from) return false;
  w.dir = dir;
  const [dx, dy] = DELTA[dir];
  if (blocked(w.tx + dx, w.ty + dy)) return false;
  w.from = { tx: w.tx, ty: w.ty };
  w.tx += dx; w.ty += dy; w.t = 0;
  return true;
}

/** Avança o passo em andamento. Devolve true no momento em que o passo termina. */
export function advance(w: Walker, dtMs: number, msPerTile: number): boolean {
  if (!w.from) return false;
  w.t += dtMs / msPerTile;
  w.anim += dtMs;
  if (w.t >= 1) { w.from = null; w.t = 0; return true; }
  return false;
}

/** Posição em pixels (canto do bloco) com interpolação do passo. */
export function pixelPos(w: Walker, tile = 16): { x: number; y: number } {
  if (!w.from) return { x: w.tx * tile, y: w.ty * tile };
  return {
    x: (w.from.tx + (w.tx - w.from.tx) * w.t) * tile,
    y: (w.from.ty + (w.ty - w.from.ty) * w.t) * tile,
  };
}

/** Menor caminho (BFS) em direções; [] se já está lá ou se não há caminho. */
export function findPath(sx: number, sy: number, gx: number, gy: number, blocked: Blocked, maxNodes = 4000): Dir[] {
  if (sx === gx && sy === gy) return [];
  const key = (x: number, y: number) => `${x},${y}`;
  const prev = new Map<string, [string, Dir] | null>();
  prev.set(key(sx, sy), null);
  const queue: [number, number][] = [[sx, sy]];
  const order: Dir[] = ['north', 'south', 'west', 'east'];
  while (queue.length && prev.size < maxNodes) {
    const [x, y] = queue.shift()!;
    for (const d of order) {
      const [dx, dy] = DELTA[d];
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k)) continue;
      if (blocked(nx, ny)) continue;
      const isGoal = nx === gx && ny === gy;
      prev.set(k, [key(x, y), d]);
      if (isGoal) {
        const path: Dir[] = [];
        let cur: string | undefined = k;
        while (cur) {
          const p = prev.get(cur);
          if (!p) break;
          path.unshift(p[1]);
          cur = p[0];
        }
        return path;
      }
      queue.push([nx, ny]);
    }
  }
  return [];
}

/** Bloco à frente de quem está olhando para `dir`. */
export function ahead(w: Walker): { tx: number; ty: number } {
  const [dx, dy] = DELTA[w.dir];
  return { tx: w.tx + dx, ty: w.ty + dy };
}
