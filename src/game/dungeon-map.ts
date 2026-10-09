// Mapa da masmorra: um PORTAL tem 5 andares; cada andar é uma grade 5 × 5 de
// salas geradas com semente (mesma semente, mesmo mapa). Sala de luta tranca
// até limpar as ondas. Salas especiais nas pontas: tesouro (baú com arma),
// loja do SISTEMA, estátua (bênção por moedas), desafio (porta vermelha, 3
// ondas fortes), mercador misterioso; algumas salas de luta viram armadilha;
// uma parede rachada esconde a sala secreta. No 3º andar a escada fica atrás
// do mini-chefe (2 elites); no 5º, o chefe do rank.
//
// Perigos no chão por tema: espinhos que sobem (com aviso), barril explosivo,
// poça de veneno, gelo que escorrega e lava. Inimigos podem vir como ELITE
// (campeão do Soul Knight) e, quanto mais fundo, mais inimigos trazem cartas.
import { towerBoss } from '@/lib/tcg/bosses';

export const RW = 17, RH = 11;        // sala em blocos (com a parede em volta)
export const GRID = 5;
export const FLOORS = 5;
export const MINI_FLOOR = 3;
export type Side = 'n' | 's' | 'e' | 'w';
export type RoomKind = 'inicio' | 'normal' | 'tesouro' | 'loja' | 'fim' | 'chefe' | 'elite' | 'estatua' | 'desafio' | 'armadilha' | 'secreta' | 'mercador';
export const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const;
export type Rank = typeof RANKS[number];

export type EnemyKind =
  | 'goblin' | 'arqueiro' | 'xama' | 'slime' | 'slimeP' | 'morcego' | 'lobo' | 'golem'
  | 'escudeiro' | 'bombardeiro' | 'mago' | 'invocador' | 'cavador' | 'espirito' | 'planta' | 'sombraP' | 'minion'
  | 'reiGoblin' | 'guardiao' | 'troll' | 'golemLava' | 'espiritoFloresta' | 'monarca';
/** O chefe de cada rank (E…S). */
export const BOSS_OF_RANK: EnemyKind[] = ['reiGoblin', 'guardiao', 'troll', 'golemLava', 'espiritoFloresta', 'monarca'];
export const isBoss = (k: EnemyKind) => BOSS_OF_RANK.includes(k);

/** Modificador da elite (campeão). */
export type EliteMod = 'veloz' | 'blindado' | 'explosivo' | 'vampiro' | 'gemeo' | 'refletor' | 'gelado' | 'venenoso' | 'fantasma';
export const ELITES: EliteMod[] = ['veloz', 'blindado', 'explosivo', 'vampiro', 'gemeo', 'refletor', 'gelado', 'venenoso', 'fantasma'];
export const ELITE_NAME: Record<EliteMod, string> = {
  veloz: 'Veloz', blindado: 'Blindado', explosivo: 'Explosivo', vampiro: 'Vampiro', gemeo: 'Gêmeo', refletor: 'Refletor',
  gelado: 'Gelado', venenoso: 'Venenoso', fantasma: 'Fantasma',
};
export const ELITE_ABOUT: Record<EliteMod, string> = {
  veloz: 'anda muito mais rápido', blindado: 'escudo de postura: só quebra com golpe pesado ou carta', explosivo: 'explode ao cair (com aviso)',
  vampiro: 'cura quando acerta você', gemeo: 'vira dois ao cair', refletor: 'devolve tiros de tempos em tempos: vá de espada',
  gelado: 'deixa rastro de gelo', venenoso: 'deixa poças de veneno', fantasma: 'some e reaparece',
};

/** Pedras e veios que quebram (sólidos até quebrar). */
export type BreakKind = 'pedra' | 'minerio' | 'erva' | 'barril' | 'cristal' | 'explosivo' | 'lampiao' | 'planta';
export interface Breakable { x: number; y: number; kind: BreakKind; hp: number }
export type HazardKind = 'espinho' | 'veneno' | 'gelo' | 'lava';
export interface Hazard { x: number; y: number; kind: HazardKind; /** fase do espinho (0–1) */ ph: number }
export interface Spawn { kind: EnemyKind; x: number; y: number; wave: number; elite?: EliteMod; cards?: string[] }
export interface DRoom {
  gx: number; gy: number; kind: RoomKind; doors: Side[]; rocks: [number, number][]; breaks: Breakable[]; spawns: Spawn[]; haz: Hazard[];
  /** Lado da parede rachada (só abre quebrando) que leva à sala secreta. */
  secret?: Side;
}
export interface Dungeon { seed: number; rank: number; floor: number; rooms: DRoom[]; start: number; end: number; pesadelo: boolean }

const STEP: Record<Side, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
export const OPP: Record<Side, Side> = { n: 's', s: 'n', e: 'w', w: 'e' };
export const CX = Math.floor(RW / 2), CY = Math.floor(RH / 2);

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Bloco de porta de cada lado (no meio da parede). */
export const doorTile = (s: Side): [number, number] => (s === 'n' ? [CX, 0] : s === 's' ? [CX, RH - 1] : s === 'e' ? [RW - 1, CY] : [0, CY]);
/** O bloco (x, y) faz parte do vão da porta `s` (3 blocos de largura). */
export const inDoor = (s: Side, tx: number, ty: number) => {
  const [dx, dy] = doorTile(s);
  return s === 'n' || s === 's' ? dy === ty && Math.abs(tx - dx) <= 1 : dx === tx && Math.abs(ty - dy) <= 1;
};

/**
 * Sólido dentro da sala: parede (menos porta aberta), pedras e o que ainda não
 * quebrou. A porta da parede rachada (`secret`) só abre depois de quebrada.
 */
export function solidAt(r: DRoom, tx: number, ty: number, open: boolean, breaks: Breakable[] = r.breaks, cracked = false): boolean {
  if (tx < 0 || ty < 0 || tx >= RW || ty >= RH) return true;
  if (tx === 0 || ty === 0 || tx === RW - 1 || ty === RH - 1) {
    if (!open) return true;
    return !r.doors.some(s => (s !== r.secret || cracked) && inDoor(s, tx, ty));
  }
  return r.rocks.some(([x, y]) => x === tx && y === ty) || breaks.some(b => b.hp > 0 && b.x === tx && b.y === ty);
}

/** Blocos livres alcançáveis a partir do meio da sala (portas abertas; o que quebra conta como livre). */
export function reachableIn(r: DRoom): Set<string> {
  const seen = new Set([`${CX},${CY}`]), q: [number, number][] = [[CX, CY]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (seen.has(k) || solidAt(r, nx, ny, true, [], true)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

/** Quais inimigos aparecem em cada rank. */
export const RANK_POOL: EnemyKind[][] = [
  ['goblin', 'goblin', 'arqueiro', 'slime', 'goblin', 'bombardeiro'],
  ['goblin', 'arqueiro', 'slime', 'morcego', 'xama', 'escudeiro', 'espirito'],
  ['goblin', 'arqueiro', 'morcego', 'xama', 'lobo', 'escudeiro', 'bombardeiro', 'mago'],
  ['arqueiro', 'xama', 'lobo', 'golem', 'escudeiro', 'bombardeiro', 'cavador', 'mago'],
  ['arqueiro', 'xama', 'lobo', 'golem', 'mago', 'invocador', 'cavador', 'escudeiro', 'espirito'],
  ['lobo', 'golem', 'mago', 'invocador', 'cavador', 'escudeiro', 'bombardeiro', 'arqueiro', 'espirito'],
];
/** Perigos de cada tema (E caverna, D cripta, C gelo, B lava, A floresta, S sombras). */
const THEME: { haz: HazardKind[]; chance: number; barrel: number }[] = [
  { haz: ['espinho'], chance: 0.3, barrel: 0.4 },
  { haz: ['espinho', 'veneno'], chance: 0.45, barrel: 0.2 },
  { haz: ['gelo', 'gelo', 'espinho'], chance: 0.6, barrel: 0.2 },
  { haz: ['lava', 'lava', 'espinho'], chance: 0.55, barrel: 0.45 },
  { haz: ['veneno', 'espinho'], chance: 0.55, barrel: 0.25 },
  { haz: ['espinho', 'veneno', 'lava', 'gelo'], chance: 0.65, barrel: 0.35 },
];

/** Quantas salas o andar tem. */
export const roomCount = (rank: number, floor: number) => 6 + Math.min(3, Math.floor(rank / 2)) + Math.min(3, Math.floor(floor / 2));
/** Chance de um inimigo vir com carta (portal E andar 1 = 0; S ≈ 60%). */
export const cardChance = (rank: number, floor: number, pesadelo = false) => Math.min(0.85, Math.max(0, rank * 0.11 + (floor - 1) * 0.03) + (pesadelo ? 0.15 : 0));
/** Chance de elite. */
export const eliteChance = (rank: number, floor: number, pesadelo = false) => (pesadelo ? 0.4 : Math.min(0.35, rank * (rank >= 4 ? 0.05 : 0.035) + (floor - 1) * 0.025));
/** Andar da Torre que cada rank representa (decks dos inimigos com carta e do chefe). */
export const RANK_ANDAR = [5, 15, 30, 50, 75, 95];

const deckCache = new Map<number, string[]>();
/** Cartas de Ataque do deck do chefe da Torre do rank (as que os inimigos usam). */
export function rankAttackCards(rank: number): string[] {
  const r = Math.min(5, rank);
  if (!deckCache.has(r)) deckCache.set(r, [...new Set(towerBoss(RANK_ANDAR[r]).deck.filter(c => c.type === 'attack').map(c => c.id))]);
  return deckCache.get(r)!;
}

export interface GenOptions { pesadelo?: boolean }

export function generate(seed: number, rank: number, floor: number, o: GenOptions = {}): Dungeon {
  const r = rng(seed * 31 + floor * 7919 + rank + (o.pesadelo ? 104729 : 0));
  const n = roomCount(rank, floor);
  const cells: [number, number][] = [[2, 2]];
  const links: [number, number, Side][] = [];
  const at = (x: number, y: number) => cells.findIndex(c => c[0] === x && c[1] === y);
  let guard = 0;
  while (cells.length < n && guard++ < 800) {
    const from = Math.floor(r() * cells.length), side = (['n', 's', 'e', 'w'] as Side[])[Math.floor(r() * 4)];
    const [x, y] = cells[from], nx = x + STEP[side][0], ny = y + STEP[side][1];
    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || at(nx, ny) >= 0) continue;
    cells.push([nx, ny]); links.push([from, cells.length - 1, side]);
  }
  const adj = cells.map(() => [] as number[]);
  for (const [a, b] of links) { adj[a].push(b); adj[b].push(a); }
  const dist = cells.map(() => -1); dist[0] = 0;
  const q = [0];
  while (q.length) { const c = q.shift()!; for (const nb of adj[c]) if (dist[nb] < 0) { dist[nb] = dist[c] + 1; q.push(nb); } }
  const end = dist.indexOf(Math.max(...dist));
  const leaves = cells.map((_, i) => i).filter(i => i !== 0 && i !== end && adj[i].length === 1);
  const take = () => (leaves.length ? leaves.splice(Math.floor(r() * leaves.length), 1)[0] : -1);
  const treasure = take();
  const shop = floor < FLOORS ? take() : -1;
  const special: Record<number, RoomKind> = {};
  if (r() < 0.45) { const i = take(); if (i >= 0) special[i] = 'estatua'; }
  if (floor >= 2 && r() < 0.4) { const i = take(); if (i >= 0) special[i] = 'desafio'; }
  if (rank >= 1 && r() < 0.3) { const i = take(); if (i >= 0) special[i] = 'mercador'; }
  for (const i of leaves) if (r() < 0.5) special[i] = 'armadilha';
  // sala secreta: um vizinho vazio de uma sala comum, ligado por parede rachada
  let secret: { cell: [number, number]; parent: number; side: Side } | null = null;
  const cand: { cell: [number, number]; parent: number; side: Side }[] = [];
  cells.forEach(([x, y], i) => {
    if (i === 0 || i === end) return;
    for (const s of ['n', 's', 'e', 'w'] as Side[]) {
      const nx = x + STEP[s][0], ny = y + STEP[s][1];
      if (nx >= 0 && ny >= 0 && nx < GRID && ny < GRID && at(nx, ny) < 0) cand.push({ cell: [nx, ny], parent: i, side: s });
    }
  });
  if (cand.length && r() < 0.6) secret = cand[Math.floor(r() * cand.length)];
  const pool = RANK_POOL[Math.min(5, rank)], theme = THEME[Math.min(5, rank)], cards = rankAttackCards(rank);
  const cc = cardChance(rank, floor, o.pesadelo), ec = eliteChance(rank, floor, o.pesadelo);
  const bossFloor = floor === FLOORS;

  const roomOf = (gx: number, gy: number, i: number, doors: Side[], kind: RoomKind): DRoom => {
    const room: DRoom = { gx, gy, kind, doors, rocks: [], breaks: [], spawns: [], haz: [] };
    const nearMid = (x: number, y: number) => Math.abs(x - CX) <= 1 && Math.abs(y - CY) <= 1;
    const lane = (x: number, y: number) => Math.abs(x - CX) <= 1 || Math.abs(y - CY) <= 1;
    const fight = kind === 'normal' || kind === 'armadilha' || kind === 'desafio' || kind === 'elite';
    if (fight || kind === 'inicio' || kind === 'fim') {
      // pedras fixas (cobertura para fugir dos tiros) e coisas que quebram
      const rocks = kind === 'normal' || kind === 'desafio' ? 2 + Math.floor(r() * 4) : 0;
      for (let k = 0; k < rocks; k++) {
        const x = 2 + Math.floor(r() * (RW - 4)), y = 2 + Math.floor(r() * (RH - 4));
        if (nearMid(x, y) || lane(x, y)) continue;
        room.rocks.push([x, y]);
        if (r() < 0.5 && x + 1 < RW - 2) room.rocks.push([x + 1, y]);
      }
      if (room.doors.some(s => !reachableIn(room).has(doorTile(s).join(',')))) room.rocks = [];
      const nb = kind === 'fim' || kind === 'elite' ? 0 : 3 + Math.floor(r() * 4);
      const taken = new Set(room.rocks.map(p => p.join(',')));
      for (let k = 0; k < nb; k++) {
        const x = 2 + Math.floor(r() * (RW - 4)), y = 2 + Math.floor(r() * (RH - 4)), key = `${x},${y}`;
        if (taken.has(key) || nearMid(x, y) || lane(x, y)) continue;
        taken.add(key);
        const roll = r();
        let bk: BreakKind = roll < 0.35 ? 'pedra' : roll < 0.6 ? 'minerio' : roll < 0.78 ? 'erva' : roll < 0.92 ? 'barril' : 'cristal';
        if (bk === 'barril' && r() < theme.barrel * 1.6) bk = 'explosivo';
        room.breaks.push({ x, y, kind: bk, hp: bk === 'erva' ? 1 : bk === 'barril' || bk === 'explosivo' ? 8 : bk === 'pedra' ? 16 : 26 });
      }
      // perigos no chão (fora da faixa do meio, para sempre ter caminho)
      if (fight && kind !== 'elite' && (kind === 'armadilha' || r() < theme.chance)) {
        const hk = theme.haz[Math.floor(r() * theme.haz.length)];
        const spots = kind === 'armadilha' ? 22 : 6 + Math.floor(r() * 6);
        const ox = 2 + Math.floor(r() * (RW - 6)), oy = 2 + Math.floor(r() * (RH - 5));
        for (let k = 0; k < spots; k++) {
          const x = kind === 'armadilha' ? 1 + Math.floor(r() * (RW - 2)) : ox + Math.floor(r() * 4), y = kind === 'armadilha' ? 1 + Math.floor(r() * (RH - 2)) : oy + Math.floor(r() * 3);
          const key = `${x},${y}`;
          if (x < 1 || y < 1 || x > RW - 2 || y > RH - 2 || taken.has(key) || nearMid(x, y) || (hk !== 'espinho' && hk !== 'gelo' && lane(x, y))) continue;
          taken.add(key);
          const kindK: HazardKind = kind === 'armadilha' ? (k % 3 === 0 ? hk : 'espinho') : hk;
          room.haz.push({ x, y, kind: kindK, ph: kind === 'armadilha' ? ((x + y) % 3) / 3 : ((x * 7 + y * 3) % 5) / 5 });
        }
      }
    }
    if (fight) {
      const free = [...reachableIn(room)].map(k => k.split(',').map(Number) as [number, number])
        .filter(([x, y]) => x > 1 && y > 1 && x < RW - 2 && y < RH - 2 && Math.abs(x - CX) + Math.abs(y - CY) > 4 && !room.breaks.some(b => b.x === x && b.y === y) && !room.haz.some(h => h.x === x && h.y === y && h.kind === 'lava'));
      const place = (kind: EnemyKind, wave: number, elite?: EliteMod) => {
        if (!free.length) return;
        const [x, y] = free[Math.floor(r() * free.length)];
        const sp: Spawn = { kind, x: x + 0.5, y: y + 0.5, wave };
        if (elite || r() < ec) sp.elite = elite ?? ELITES[Math.floor(r() * ELITES.length)];
        if (kind === 'mago' || r() < cc) {
          const nc = rank >= 4 && r() < (rank - 3) * 0.3 ? 2 : 1;
          sp.cards = Array.from({ length: nc }, () => cards[Math.floor(r() * cards.length)]);
        }
        room.spawns.push(sp);
      };
      if (kind === 'elite') {
        // mini-chefe do 3º andar: 2 elites e escolta
        place(pool[Math.floor(r() * pool.length)] === 'golem' ? 'golem' : 'lobo', 0, ELITES[Math.floor(r() * ELITES.length)]);
        place(rank >= 3 ? 'golem' : 'escudeiro', 0, ELITES[Math.floor(r() * ELITES.length)]);
        for (let k = 0; k < 2 + Math.floor(rank / 2); k++) place(pool[Math.floor(r() * pool.length)], 1);
      } else {
        const waves = kind === 'desafio' ? 3 : rank >= 1 || floor >= 2 ? 2 : r() < 0.5 ? 2 : 1;
        for (let w = 0; w < waves; w++) {
          const count = 4 + Math.floor(r() * 3) + Math.min(3, Math.floor(rank / 2)) + Math.floor((floor - 1) / 2) + (kind === 'desafio' ? 2 : 0) + (o.pesadelo ? 1 : 0);
          for (let k = 0; k < count; k++) place(pool[Math.floor(r() * pool.length)], w, kind === 'desafio' && k === 0 && w === 2 ? ELITES[Math.floor(r() * ELITES.length)] : undefined);
        }
      }
    }
    if (kind === 'chefe') {
      const boss: Spawn = { kind: BOSS_OF_RANK[Math.min(5, rank)], x: CX + 0.5, y: 3.5, wave: 0, cards: Array.from({ length: 3 }, () => cards[Math.floor(r() * cards.length)]) };
      if (o.pesadelo) boss.elite = ELITES[Math.floor(r() * ELITES.length)];
      room.spawns.push(boss);
      // o Guardião da Cripta tem 4 lampiões; o Espírito da Floresta, raízes que brotam plantas
      if (boss.kind === 'guardiao') for (const [x, y] of [[2, 2], [RW - 3, 2], [2, RH - 3], [RW - 3, RH - 3]]) room.breaks.push({ x, y, kind: 'lampiao', hp: 40 });
    }
    return room;
  };

  const rooms: DRoom[] = cells.map(([gx, gy], i) => {
    const doors: Side[] = [];
    for (const [a, b, s] of links) { if (a === i) doors.push(s); if (b === i) doors.push(OPP[s]); }
    const kind: RoomKind = i === 0 ? 'inicio' : i === end ? (bossFloor ? 'chefe' : floor === MINI_FLOOR ? 'elite' : 'fim') : i === treasure ? 'tesouro' : i === shop ? 'loja' : special[i] ?? 'normal';
    return roomOf(gx, gy, i, doors, kind);
  });
  if (secret) {
    rooms[secret.parent].doors.push(secret.side);
    rooms[secret.parent].secret = secret.side;
    rooms.push({ gx: secret.cell[0], gy: secret.cell[1], kind: 'secreta', doors: [OPP[secret.side]], rocks: [], breaks: [], spawns: [], haz: [] });
    // a parede rachada não pode ficar presa atrás de pedra
    const pr = rooms[secret.parent];
    if (!reachableIn(pr).has(doorTile(secret.side).join(','))) pr.rocks = [];
  }
  return { seed, rank, floor, rooms, start: 0, end, pesadelo: !!o.pesadelo };
}

/** A sala vizinha pela porta `s` (ou -1). */
export function neighbor(d: Dungeon, i: number, s: Side): number {
  const [x, y] = [d.rooms[i].gx + STEP[s][0], d.rooms[i].gy + STEP[s][1]];
  return d.rooms[i].doors.includes(s) ? d.rooms.findIndex(r => r.gx === x && r.gy === y) : -1;
}

/** Espinho em pé agora? Ciclo de 2,4 s: abaixado, aviso (0,5 s) e em pé (0,5 s). */
export const SPIKE_CYCLE = 2.4;
export function spikeState(h: Hazard, t: number): 'baixo' | 'aviso' | 'alto' {
  const k = ((t / SPIKE_CYCLE + h.ph) % 1 + 1) % 1;
  return k < 0.58 ? 'baixo' : k < 0.79 ? 'aviso' : 'alto';
}
