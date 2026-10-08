// Sala Virtual do Metaverso: o aluno recebe uma escultura descrita SÓ por
// coordenadas (x, y, z) e monta os blocos na sala 3D; vê o resultado em
// perspectiva. Liga com a lição de coordenadas 3D. Regras puras.
import { rng } from './minigames';

export type Block = [number, number, number];
export const ROOM_SIZE = 5;   // x e y de 0 a 4
export const ROOM_HEIGHT = 4; // z de 0 a 3

const key = (b: Block) => b.join(',');

/** Escultura da partida: começa no chão e cresce grudada (dá para montar). */
export function makeTarget(seed: number, n = 5): Block[] {
  const r = rng(seed);
  const out: Block[] = [[Math.floor(r() * ROOM_SIZE), Math.floor(r() * ROOM_SIZE), 0]];
  const has = new Set(out.map(key));
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    const base = out[Math.floor(r() * out.length)];
    const dirs: Block[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1]];
    const d = dirs[Math.floor(r() * dirs.length)];
    const b: Block = [base[0] + d[0], base[1] + d[1], base[2] + d[2]];
    if (b.some(v => v < 0) || b[0] >= ROOM_SIZE || b[1] >= ROOM_SIZE || b[2] >= ROOM_HEIGHT || has.has(key(b))) continue;
    // bloco no ar precisa de outro embaixo
    if (b[2] > 0 && !has.has(key([b[0], b[1], b[2] - 1]))) continue;
    out.push(b); has.add(key(b));
  }
  return out;
}

/** Bloco no ar sem nada embaixo cai (não pode). */
export const supported = (built: Block[], b: Block) => b[2] === 0 || built.some(c => c[0] === b[0] && c[1] === b[1] && c[2] === b[2] - 1);

/** Nota: acertos ÷ (blocos pedidos + blocos a mais). */
export function scoreBuild(target: Block[], built: Block[]): { score: number; hits: number; extra: number } {
  const want = new Set(target.map(key));
  const uniq = [...new Set(built.map(key))];
  const hits = uniq.filter(k => want.has(k)).length;
  const extra = uniq.length - hits;
  return { score: hits / (target.length + extra), hits, extra };
}

/** Ordem de desenho em perspectiva (de trás para a frente, de baixo para cima). */
export const drawOrder = (bs: Block[]) => [...bs].sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[2] - b[2]);
