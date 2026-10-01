// Regras puras dos minijogos das profissões: o que cada um rende pela
// pontuação (0–1) e pelo bônus do cargo, e os geradores de cada partida
// (circuito que sempre tem solução, perguntas do repórter feitas com os dados
// do próprio jogo, dados para rotular, desenhos para pintar).
import type { Reward } from './life';
import type { MinigameId } from './professions';
import { boardOfDay, FISH } from './fishing';
import { CROPS } from './farm';

/** Gerador pseudoaleatório com semente (as partidas variam, os testes repetem). */
export function rng(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/**
 * Recompensa de cada minijogo. `perk` = bônus do cargo (0 sem o cargo;
 * 0,25 a 1,5 com ele, pelo nível). `hits`/`extra` vêm de cada jogo.
 */
export function rewardOf(game: MinigameId, score: number, perk: number, hits = 0, item?: string): Reward {
  const s = Math.max(0, Math.min(1, score));
  const xp = Math.round(8 + 22 * s);
  switch (game) {
    case 'forno': {
      // 3 fornadas: cada acerto um pão; acerto perfeito vira bolo; o padeiro tira uma a mais
      const paes = hits + (perk > 0 && hits >= 2 ? 1 : 0);
      const bolos = s >= (perk > 0 ? 0.8 : 0.9) ? 1 : 0;
      return { items: { ...(paes ? { pao: paes } : {}), ...(bolos ? { bolo: bolos } : {}) }, coins: 0, xp };
    }
    case 'ritmo': {
      const gold = s >= 0.9 - perk * 0.06, any = s >= 0.5;
      return { items: gold ? { 'disco-ouro': 1 } : any ? { disco: 1 } : {}, coins: 0, xp };
    }
    case 'pintura':
      return { items: s >= 0.6 ? { quadro: s >= 0.95 && perk > 0 ? 2 : 1 } : {}, coins: 0, xp };
    case 'rotular':
      return { items: s >= 0.75 - perk * 0.06 ? { 'modelo-ia': 1 } : {}, coins: 0, xp };
    case 'circuito': {
      const n = hits + (perk > 0 && hits > 0 ? 1 : 0);
      return { items: n ? { sensor: n } : {}, coins: 0, xp };
    }
    case 'pares': {
      const n = s >= 0.5 ? (s >= 0.85 ? 2 : 1) + (perk > 0 ? 1 : 0) : 0;
      return { items: n ? { 'cubo-virtual': n } : {}, coins: 0, xp };
    }
    case 'noticia':
      return { items: {}, coins: Math.round(hits * 4 * (1 + perk * 0.4)), xp };
    case 'compor': {
      // a música vira disco; bem feita (melodia + batida + variedade), disco de ouro
      const gold = s >= 0.85 - perk * 0.05, any = s >= 0.35;
      return { items: gold ? { 'disco-ouro': 1 } : any ? { disco: 1 } : {}, coins: 0, xp };
    }
    case 'pao': {
      // o pão sai no formato escolhido; queimado ou cru não rende
      const n = s >= 0.4 ? (s >= 0.85 ? 3 : 2) + (perk > 0 ? 1 : 0) : s >= 0.2 ? 1 : 0;
      return { items: n ? { [item ?? 'pao']: n } : {}, coins: 0, xp };
    }
    case 'teste-jogo':
      return { items: hits ? { tiquete: Math.round(hits * (1 + perk * 0.3)) } : {}, coins: 0, xp };
  }
}

// ─── circuito (IoT): peças de cano que giram ────────────────────────────────

/** Cada peça liga lados: bit 1 = cima, 2 = direita, 4 = baixo, 8 = esquerda. */
export type Piece = number;
export const rot = (p: Piece, k = 1): Piece => { let q = p; for (let i = 0; i < ((k % 4) + 4) % 4; i++) q = ((q << 1) | (q >> 3)) & 15; return q; };

export interface Circuit { w: number; h: number; tiles: Piece[]; /** giro de cada peça (0–3) */ turns: number[]; inY: number; outY: number }

/** Gera um circuito com solução: um caminho da esquerda (linha inY) até a direita (outY), e as peças giradas ao acaso. */
export function makeCircuit(seed: number, w = 5, h = 4): Circuit {
  const r = rng(seed);
  const inY = Math.floor(r() * h), outY = Math.floor(r() * h);
  const tiles = new Array<Piece>(w * h).fill(0);
  // caminho: vai para a direita coluna a coluna, subindo/descendo ao acaso
  let x = 0, y = inY, from = 8;   // entra pela esquerda
  while (true) {
    const lastCol = x === w - 1;
    const targetY = lastCol ? outY : Math.floor(r() * h);
    let to: number;
    if (y !== targetY) to = y < targetY ? 4 : 1;
    else to = 2;   // segue para a direita (ou sai, na última coluna)
    tiles[y * w + x] |= from | to;
    if (to === 2) { if (lastCol) break; x++; from = 8; }
    else { y += to === 4 ? 1 : -1; from = to === 4 ? 1 : 4; }
  }
  // o resto: peças soltas para enganar
  for (let k = 0; k < tiles.length; k++) if (!tiles[k] && r() < 0.6) tiles[k] = [3, 5, 6, 7, 9, 10, 12][Math.floor(r() * 7)];
  const turns = tiles.map(() => Math.floor(r() * 4));
  return scramble({ w, h, tiles, turns, inY, outY }, seed);
}

/** Peça como está na tela (com o giro). */
export const shown = (c: Circuit, i: number) => rot(c.tiles[i], c.turns[i]);

/** Peças por onde o sinal já passa, saindo da entrada (as acesas na tela). */
export function litTiles(c: Circuit): Set<number> {
  const seen = new Set<number>();
  const start = c.inY * c.w;
  if (!(shown(c, start) & 8)) return seen;
  const q = [start]; seen.add(start);
  const D: [number, number, number, number][] = [[1, 0, -1, 4], [2, 1, 0, 8], [4, 0, 1, 1], [8, -1, 0, 2]];
  while (q.length) {
    const i = q.shift()!, x = i % c.w, y = (i / c.w) | 0, p = shown(c, i);
    for (const [bit, dx, dy, opp] of D) {
      if (!(p & bit)) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= c.w || ny >= c.h) continue;
      const j = ny * c.w + nx;
      if (seen.has(j) || !(shown(c, j) & opp)) continue;
      seen.add(j); q.push(j);
    }
  }
  return seen;
}

/** O sinal chega da esquerda (linha inY) até a direita (linha outY)? */
export function connected(c: Circuit): boolean {
  const out = c.outY * c.w + c.w - 1;
  return litTiles(c).has(out) && !!(shown(c, out) & 2);
}

/** Gira peças até o circuito começar desligado (senão não tem graça). */
export function scramble(c: Circuit, seed: number): Circuit {
  const r = rng(seed + 77);
  const turns = [...c.turns];
  let next = { ...c, turns };
  for (let k = 0; k < 50 && connected(next); k++) {
    const i = Math.floor(r() * turns.length);
    turns[i] = (turns[i] + 1) % 4;
    next = { ...c, turns: [...turns] };
  }
  return next;
}

// ─── repórter: perguntas com os dados do jogo ───────────────────────────────

export interface Question { q: string; options: string[]; answer: number; /** Manchete se a matéria sair (acertou). */ headline: string }

export function reporterQuiz(day: number, seed: number, towerMax: number): Question[] {
  const r = rng(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const shuffle = (opts: string[], right: string): string[] =>
    [...new Set([right, ...opts])].slice(0, 4).sort(() => r() - 0.5);
  const qs: Question[] = [];
  const board = boardOfDay(day);
  if (board.length) {
    const top = [...board].sort((a, b) => b.cm - a.cm)[0];
    const o = shuffle(board.map(b => b.who).filter(w => w !== top.who), top.who);
    qs.push({ q: `Quem pescou o MAIOR peixe hoje no Lago Azul (veja o quadro da Casa de Pesca)?`, options: o, answer: o.indexOf(top.who), headline: `${top.who} pescou o maior peixe do dia: ${top.fish.name} de ${top.cm} cm` });
  }
  const best = [...CROPS].sort((a, b) => b.sellPrice - a.sellPrice)[0];
  const o2 = shuffle(CROPS.filter(c => c.id !== best.id).map(c => c.name).sort(() => r() - 0.5).slice(0, 3), best.name);
  qs.push({ q: 'Qual planta da fazenda vale MAIS na caixa de envio?', options: o2, answer: o2.indexOf(best.name), headline: `Fazenda: ${best.name} é a planta que mais vale` });
  const night = FISH.find(f => f.night === 'only')!;
  const o3 = shuffle(FISH.filter(f => f.rarity !== 'lixo' && f.id !== night.id).map(f => f.name).sort(() => r() - 0.5).slice(0, 3), night.name);
  qs.push({ q: 'Que peixe SÓ aparece à noite?', options: o3, answer: o3.indexOf(night.name), headline: `Lago: o ${night.name} só aparece à noite` });
  const fact = pick([
    { q: 'O que é IoT?', right: 'Coisas ligadas na internet que conversam entre si', headline: 'IoT: as coisas da cidade conversam pela internet', wrong: ['Um tipo de peixe raro', 'Um jogo de cartas', 'Uma planta da fazenda'] },
    { q: 'Como uma IA aprende?', right: 'Com muitos exemplos (dados)', headline: 'Lab de IA: a IA aprende com exemplos', wrong: ['Sozinha, sem nada', 'Comendo pão', 'Só com sorte'] },
    { q: 'O que é o Metaverso?', right: 'Um mundo virtual onde as pessoas se encontram', headline: 'Metaverso: um mundo virtual para se encontrar', wrong: ['Um prédio de tijolo', 'Um barco do lago', 'Uma receita de bolo'] },
  ]);
  const o4 = shuffle(fact.wrong, fact.right);
  qs.push({ q: fact.q, options: o4, answer: o4.indexOf(fact.right), headline: fact.headline });
  const floors = [towerMax + 3, towerMax > 1 ? towerMax - 1 : towerMax + 7, towerMax + 12].map(String);
  const o5 = shuffle(floors, String(towerMax));
  qs.push({ q: 'Até que andar da Torre VOCÊ já chegou?', options: o5, answer: o5.indexOf(String(towerMax)), headline: `Torre: repórter já chegou ao andar ${towerMax}` });
  return qs;
}

// ─── rotular dados (IA) ─────────────────────────────────────────────────────

export interface LabelSet { left: string; right: string; items: { icon: string; side: 0 | 1 }[] }

/** Pares de categorias e os ícones de cada lado (public/game/icons/itens). */
const SETS: [string, string, string[], string[]][] = [
  ['FRUTA', 'LEGUME', ['fruta:maca', 'banana', 'uva', 'colheita:morango', 'abacaxi', 'pera', 'cereja', 'melancia', 'fruta:laranja', 'fruta:limao'],
    ['colheita:cenoura', 'rabanete', 'pimentao', 'colheita:alface', 'colheita:milho', 'colheita:abobora']],
  ['COMIDA', 'OBJETO', ['pao', 'bolo', 'omelete', 'peixe-assado', 'leite', 'ovo', 'salada', 'torta-abobora'],
    ['livro', 'tocha', 'espelho', 'luneta', 'bau', 'pena', 'mapa', 'chave']],
  ['JOIA', 'COMIDA', ['rubi', 'safira', 'jade', 'ametista', 'diamante', 'opala', 'ouro'], ['pao', 'bolo', 'fruta:maca', 'banana', 'colheita:cenoura', 'ovo']],
];

export function labelSet(seed: number, n = 16): LabelSet {
  const r = rng(seed);
  const [left, right, a, b] = SETS[Math.floor(r() * SETS.length)];
  const items = Array.from({ length: n }, () => {
    const side = r() < 0.5 ? 0 : 1;
    const pool = side ? b : a;
    return { icon: pool[Math.floor(r() * pool.length)], side: side as 0 | 1 };
  });
  return { left, right, items };
}

// ─── pintura (Artista): desenho para lembrar ────────────────────────────────

export const PAINT_COLORS = ['#e84a4a', '#f0c040', '#4aa84a', '#3a78c8', '#f4f0ea'];

/** Um desenho 4×4 com 3 cores (sempre com simetria, para parecer um desenho). */
export function paintPattern(seed: number): number[] {
  const r = rng(seed);
  const cols = [0, 1, 2, 3].sort(() => r() - 0.5).slice(0, 3).concat(4);
  const g: number[] = [];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) g[y * 4 + x] = cols[Math.floor(r() * cols.length)];
  for (let y = 0; y < 4; y++) for (let x = 2; x < 4; x++) g[y * 4 + x] = g[y * 4 + (3 - x)];
  return g;
}
