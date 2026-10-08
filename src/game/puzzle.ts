// Quebra-cabeça de deslizar (o baú de brinquedos da Sua Casa): a arte de uma
// carta do álbum cortada em N×N, com um buraco. Embaralha andando o buraco a
// partir da figura pronta, então sempre tem solução.
export interface Puzzle { n: number; tiles: number[]; moves: number }
/** tiles[pos] = pedaço que está na posição; o último pedaço (n*n-1) é o buraco. */
export const solvedTiles = (n: number) => Array.from({ length: n * n }, (_, i) => i);
export const holeOf = (p: Puzzle) => p.tiles.indexOf(p.n * p.n - 1);
export const isSolved = (p: Puzzle) => p.tiles.every((t, i) => t === i);

const neighbors = (n: number, i: number) => {
  const x = i % n, y = Math.floor(i / n), out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < n - 1) out.push(i + 1);
  if (y > 0) out.push(i - n);
  if (y < n - 1) out.push(i + n);
  return out;
};

/** Embaralha com `steps` passos do buraco (sem voltar no passo anterior); nunca sai pronto. */
export function shuffled(n: number, seed: number, steps = n * n * 12): Puzzle {
  let s = seed >>> 0 || 1;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  const tiles = solvedTiles(n);
  let hole = n * n - 1, prev = -1;
  for (let k = 0; k < steps || tiles.every((t, i) => t === i); k++) {
    const opts = neighbors(n, hole).filter(j => j !== prev);
    const j = opts[Math.floor(rnd() * opts.length)];
    [tiles[hole], tiles[j]] = [tiles[j], tiles[hole]];
    prev = hole; hole = j;
  }
  return { n, tiles, moves: 0 };
}

/** Desliza o pedaço da posição `i` para o buraco (só se for vizinho). */
export function slide(p: Puzzle, i: number): Puzzle {
  const h = holeOf(p);
  if (!neighbors(p.n, h).includes(i)) return p;
  const tiles = [...p.tiles];
  [tiles[h], tiles[i]] = [tiles[i], tiles[h]];
  return { ...p, tiles, moves: p.moves + 1 };
}
