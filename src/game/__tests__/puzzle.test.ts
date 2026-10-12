import { describe, expect, it } from 'vitest';
import { holeOf, isSolved, shuffled, slide, solvedTiles } from '../puzzle';

/** Paridade de inversões (com o buraco): a mesma da figura pronta quer dizer que tem solução. */
function solvable(t: number[], n: number) {
  const hole = n * n - 1, a = t.filter(x => x !== hole);
  let inv = 0;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) inv++;
  if (n % 2) return inv % 2 === 0;
  const rowFromBottom = n - Math.floor(t.indexOf(hole) / n);
  return (inv + rowFromBottom) % 2 === 1;
}

describe('quebra-cabeça de deslizar', () => {
  it('embaralhado nunca sai pronto e sempre tem solução (3×3 e 4×4)', () => {
    for (const n of [3, 4]) for (let s = 1; s < 80; s++) {
      const p = shuffled(n, s);
      expect(isSolved(p)).toBe(false);
      expect([...p.tiles].sort((a, b) => a - b)).toEqual(solvedTiles(n));
      expect(solvable(p.tiles, n)).toBe(true);
    }
  });
  it('só desliza o vizinho do buraco e conta o movimento', () => {
    const p = { n: 3, tiles: solvedTiles(3), moves: 0 };
    expect(slide(p, 0)).toBe(p);
    const q = slide(p, 7);
    expect(holeOf(q)).toBe(7);
    expect(q.moves).toBe(1);
    expect(isSolved(slide(q, 8))).toBe(true);
  });
  it('a mesma semente dá o mesmo embaralhado', () => {
    expect(shuffled(3, 42).tiles).toEqual(shuffled(3, 42).tiles);
  });
});
