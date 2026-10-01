// Lab de IA: programar o robô gari com blocos (ANDAR, VIRAR, PEGAR, REPETIR).
// Tabuleiro pequeno com lixos e obstáculos; o programa roda passo a passo.
// Funções puras: o tabuleiro de cada fase e a execução do programa.
import { rng } from './minigames';

/** 0 = cima, 1 = direita, 2 = baixo, 3 = esquerda. */
export type Dir4 = 0 | 1 | 2 | 3;
export type Block =
  | { op: 'andar' }
  | { op: 'esquerda' }
  | { op: 'direita' }
  | { op: 'pegar' }
  | { op: 'repetir'; n: number; body: Block[] };

export interface Level {
  w: number; h: number;
  start: { x: number; y: number; dir: Dir4 };
  litter: { x: number; y: number }[];
  walls: { x: number; y: number }[];
  /** Menor número de blocos que resolve (para a nota cheia). */
  par: number;
  /** Máximo de blocos que cabem no programa (força o REPETIR). */
  max: number;
  hint: string;
}

const STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

/** As fases: 1 ensina ANDAR/VIRAR/PEGAR, 2 pede REPETIR, 3 é uma escada com REPETIR. */
const BASE: Level[] = [
  { w: 6, h: 6, start: { x: 0, y: 5, dir: 1 }, litter: [{ x: 2, y: 5 }, { x: 2, y: 3 }], walls: [{ x: 4, y: 5 }, { x: 1, y: 2 }, { x: 4, y: 1 }], par: 7, max: 10,
    hint: 'Ande até o lixo, PEGUE, vire e siga para o próximo.' },
  { w: 6, h: 6, start: { x: 0, y: 2, dir: 1 }, litter: [{ x: 2, y: 2 }, { x: 4, y: 2 }], walls: [{ x: 1, y: 0 }, { x: 3, y: 4 }, { x: 5, y: 5 }, { x: 0, y: 4 }], par: 4, max: 5,
    hint: 'Só cabem 5 blocos! O caminho se repete: use REPETIR.' },
  { w: 6, h: 6, start: { x: 0, y: 5, dir: 0 }, litter: [{ x: 1, y: 4 }, { x: 2, y: 3 }, { x: 3, y: 2 }], walls: [{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 1 }, { x: 4, y: 4 }, { x: 5, y: 0 }], par: 6, max: 8,
    hint: 'Uma escada: suba, vire, ande, pegue, desvire... e repita!' },
];

/** Espelha na horizontal (a solução troca esquerda por direita). */
function mirror(l: Level): Level {
  const fx = (x: number) => l.w - 1 - x;
  const dir = (l.start.dir === 1 ? 3 : l.start.dir === 3 ? 1 : l.start.dir) as Dir4;
  return { ...l, start: { x: fx(l.start.x), y: l.start.y, dir }, litter: l.litter.map(p => ({ x: fx(p.x), y: p.y })), walls: l.walls.map(p => ({ x: fx(p.x), y: p.y })) };
}

export function robotLevels(seed: number): Level[] {
  const r = rng(seed);
  return BASE.map(l => (r() < 0.5 ? mirror(l) : l));
}

/** Quantos blocos o programa usa (o REPETIR conta 1, mais o que tem dentro). */
export const countBlocks = (p: Block[]): number => p.reduce((n, b) => n + 1 + (b.op === 'repetir' ? countBlocks(b.body) : 0), 0);

export interface Frame { x: number; y: number; dir: Dir4; got: number[]; /** caminho do bloco que rodou (índices até ele) */ at: number[]; event?: 'bateu' | 'pegou' | 'vazio' }
export interface RunResult { frames: Frame[]; done: boolean; crashed: boolean; got: number }

/** Roda o programa e devolve cada passo (para animar) e o resultado. Para em 200 passos. */
export function runProgram(l: Level, prog: Block[]): RunResult {
  let x = l.start.x, y = l.start.y, dir = l.start.dir;
  const got: number[] = [];
  const frames: Frame[] = [];
  let crashed = false;
  const wall = (cx: number, cy: number) => cx < 0 || cy < 0 || cx >= l.w || cy >= l.h || l.walls.some(p => p.x === cx && p.y === cy);
  const exec = (list: Block[], path: number[]): boolean => {
    for (let i = 0; i < list.length; i++) {
      if (frames.length >= 200) return false;
      const b = list[i], at = [...path, i];
      if (b.op === 'repetir') {
        for (let k = 0; k < b.n; k++) if (!exec(b.body, at)) return false;
        continue;
      }
      let event: Frame['event'];
      if (b.op === 'andar') {
        const nx = x + STEP[dir][0], ny = y + STEP[dir][1];
        if (wall(nx, ny)) { crashed = true; frames.push({ x, y, dir, got: [...got], at, event: 'bateu' }); return false; }
        x = nx; y = ny;
      } else if (b.op === 'esquerda') dir = ((dir + 3) % 4) as Dir4;
      else if (b.op === 'direita') dir = ((dir + 1) % 4) as Dir4;
      else {
        const k = l.litter.findIndex((p, j) => p.x === x && p.y === y && !got.includes(j));
        if (k >= 0) { got.push(k); event = 'pegou'; } else event = 'vazio';
      }
      frames.push({ x, y, dir, got: [...got], at, event });
    }
    return true;
  };
  exec(prog, []);
  return { frames, done: got.length === l.litter.length && !crashed, crashed, got: got.length };
}

/** Nota da fase: resolveu vale 0,8; com até `par` blocos, 1. Cada tentativa errada tira 0,1 (no mínimo 0,5). */
export function levelScore(l: Level, prog: Block[], fails: number): number {
  if (!runProgram(l, prog).done) return 0;
  const base = countBlocks(prog) <= l.par ? 1 : 0.8;
  return Math.max(0.5, base - fails * 0.1);
}
