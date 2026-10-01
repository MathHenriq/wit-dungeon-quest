import { describe, expect, it } from 'vitest';
import { countBlocks, levelScore, robotLevels, runProgram, type Block } from '../robot';

const A: Block = { op: 'andar' }, E: Block = { op: 'esquerda' }, D: Block = { op: 'direita' }, P: Block = { op: 'pegar' };
const rep = (n: number, ...body: Block[]): Block => ({ op: 'repetir', n, body });
/** Troca esquerda e direita (para a fase espelhada). */
const flip = (p: Block[]): Block[] => p.map(b => (b.op === 'esquerda' ? D : b.op === 'direita' ? E : b.op === 'repetir' ? { ...b, body: flip(b.body) } : b));

const SOL: Block[][] = [
  [A, A, P, E, A, A, P],
  [rep(2, A, A, P)],
  [rep(3, A, D, A, P, E)],
];

describe('programar o robô', () => {
  it('cada fase tem solução com o número de blocos da nota cheia (e cabe no limite)', () => {
    for (let seed = 1; seed < 30; seed++) {
      const ls = robotLevels(seed);
      ls.forEach((l, i) => {
        const mirrored = l.start.x !== [0, 0, 0][i];
        const sol = mirrored ? flip(SOL[i]) : SOL[i];
        const r = runProgram(l, sol);
        expect(r.done).toBe(true);
        expect(countBlocks(sol)).toBe(l.par);
        expect(l.par).toBeLessThanOrEqual(l.max);
        expect(levelScore(l, sol, 0)).toBe(1);
        // nenhum lixo em cima de obstáculo nem no começo
        for (const p of l.litter) expect(l.walls.some(w => w.x === p.x && w.y === p.y)).toBe(false);
      });
    }
  });
  it('bate na parede, pega no vazio e conta os blocos do REPETIR', () => {
    const l = robotLevels(2)[0];
    const toWall = runProgram(l, [E, E, A]);
    expect(toWall.crashed).toBe(true);
    expect(toWall.frames.at(-1)!.event).toBe('bateu');
    expect(runProgram(l, [P]).frames[0].event).toBe('vazio');
    expect(countBlocks([rep(3, A, D), P])).toBe(4);
    expect(levelScore(l, [A], 0)).toBe(0);
    // laço sem fim não trava
    expect(runProgram(l, [rep(99, rep(99, E))]).frames.length).toBeLessThanOrEqual(200);
  });
  it('a fase 2 não cabe sem REPETIR', () => {
    const l = robotLevels(1)[1];
    expect(countBlocks([A, A, P, A, A, P])).toBeGreaterThan(l.max);
  });
});
