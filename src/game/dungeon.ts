// Masmorra (Soul Knight do WIT, tema Solo Leveling). Um PORTAL de rank E…S tem
// 3 andares; cada andar é uma grade 5 × 5 de salas geradas com semente, com a
// porta trancada até limpar a sala (2 ondas), sala do tesouro (baú com arma),
// loja do SISTEMA e, no fim, a escada (andares 1–2) ou o chefe (andar 3). Entre
// um andar e outro o SISTEMA oferece 1 de 3 bênçãos.
//
// Combate: duas armas no corpo — a CURTA (mais dano, sem mana, corta tiros, mas
// de perto) e a LONGA (gasta mana, de longe); troca com Q. Esquiva com
// invencibilidade. Até 4 cartas de Ataque viram habilidades (dungeon-skills).
// Todo golpe inimigo tem AVISO no chão antes (círculo ou linha vermelha).
// O pet anda junto e cata minério, erva, cristal e troféus (pena, pelo), com
// mais espaço para o tipo que ele prefere. Pedras e veios quebram (Stardew).
//
// Regras puras: `stepRun(run, input, dt)` devolve o próximo estado e a lista de
// acontecimentos (`ev`) que a tela usa para efeitos e sons. Prêmio: hunter.ts.
import type { Progress } from './progress';
import { towerBoss } from '@/lib/tcg/bosses';
import { levelMult, weapon, chestWeapon, START_CURTA, START_LONGA, type WeaponId } from './dungeon-weapons';
import type { Skill } from './dungeon-skills';
import type { SombraKind } from './hunter-state';
export type { SombraKind };

export const RW = 17, RH = 11;        // sala em blocos (com a parede em volta)
export const GRID = 5;
export const FLOORS = 3;
export type Side = 'n' | 's' | 'e' | 'w';
export type RoomKind = 'inicio' | 'normal' | 'tesouro' | 'loja' | 'fim' | 'chefe';
export type EnemyKind = 'goblin' | 'arqueiro' | 'xama' | 'slime' | 'slimeP' | 'morcego' | 'lobo' | 'golem' | 'chefe';
export const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const;
export type Rank = typeof RANKS[number];

/** Pedras e veios que quebram (sólidos até quebrar). */
export type BreakKind = 'pedra' | 'minerio' | 'erva' | 'barril' | 'cristal';
export interface Breakable { x: number; y: number; kind: BreakKind; hp: number }
export interface Spawn { kind: EnemyKind; x: number; y: number; wave: number }
export interface DRoom { gx: number; gy: number; kind: RoomKind; doors: Side[]; rocks: [number, number][]; breaks: Breakable[]; spawns: Spawn[] }
export interface Dungeon { seed: number; rank: number; floor: number; rooms: DRoom[]; start: number; end: number }

const STEP: Record<Side, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const OPP: Record<Side, Side> = { n: 's', s: 'n', e: 'w', w: 'e' };
const CX = Math.floor(RW / 2), CY = Math.floor(RH / 2);

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Bloco de porta de cada lado (no meio da parede). */
export const doorTile = (s: Side): [number, number] => (s === 'n' ? [CX, 0] : s === 's' ? [CX, RH - 1] : s === 'e' ? [RW - 1, CY] : [0, CY]);

/** Sólido dentro da sala: parede (menos porta aberta), pedras e o que ainda não quebrou. */
export function solidAt(r: DRoom, tx: number, ty: number, open: boolean, breaks: Breakable[] = r.breaks): boolean {
  if (tx < 0 || ty < 0 || tx >= RW || ty >= RH) return true;
  if (tx === 0 || ty === 0 || tx === RW - 1 || ty === RH - 1) {
    if (!open) return true;
    return !r.doors.some(s => { const [dx, dy] = doorTile(s); return s === 'n' || s === 's' ? dy === ty && Math.abs(tx - dx) <= 1 : dx === tx && Math.abs(ty - dy) <= 1; });
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
      if (seen.has(k) || solidAt(r, nx, ny, true, [])) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

/** Quais inimigos aparecem em cada rank. */
export const RANK_POOL: EnemyKind[][] = [
  ['goblin', 'goblin', 'arqueiro', 'slime'],
  ['goblin', 'arqueiro', 'slime', 'morcego', 'xama'],
  ['goblin', 'arqueiro', 'morcego', 'xama', 'lobo'],
  ['goblin', 'arqueiro', 'xama', 'lobo', 'golem', 'morcego'],
  ['arqueiro', 'xama', 'lobo', 'golem', 'morcego', 'goblin'],
  ['arqueiro', 'xama', 'lobo', 'golem', 'golem', 'morcego'],
];
/** Quantas salas o andar tem. */
export const roomCount = (rank: number, floor: number) => 7 + Math.min(3, Math.floor(rank / 2)) + (floor - 1);

export function generate(seed: number, rank: number, floor: number): Dungeon {
  const r = rng(seed * 31 + floor * 7919 + rank);
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
  const treasure = leaves.length ? leaves.splice(Math.floor(r() * leaves.length), 1)[0] : -1;
  const shop = leaves.length && floor < FLOORS ? leaves[Math.floor(r() * leaves.length)] : -1;
  const pool = RANK_POOL[Math.min(5, rank)];

  const rooms: DRoom[] = cells.map(([gx, gy], i) => {
    const doors: Side[] = [];
    for (const [a, b, s] of links) { if (a === i) doors.push(s); if (b === i) doors.push(OPP[s]); }
    const kind: RoomKind = i === 0 ? 'inicio' : i === end ? (floor === FLOORS ? 'chefe' : 'fim') : i === treasure ? 'tesouro' : i === shop ? 'loja' : 'normal';
    const room: DRoom = { gx, gy, kind, doors, rocks: [], breaks: [], spawns: [] };
    const nearMid = (x: number, y: number) => Math.abs(x - CX) <= 1 && Math.abs(y - CY) <= 1;
    if (kind === 'normal' || kind === 'inicio' || kind === 'fim') {
      // pedras fixas (cobertura para fugir dos tiros) e coisas que quebram
      const rocks = kind === 'normal' ? 2 + Math.floor(r() * 4) : 0;
      for (let k = 0; k < rocks; k++) {
        const x = 2 + Math.floor(r() * (RW - 4)), y = 2 + Math.floor(r() * (RH - 4));
        if (nearMid(x, y) || Math.abs(x - CX) <= 1 || Math.abs(y - CY) <= 1) continue;
        room.rocks.push([x, y]);
        if (r() < 0.5 && x + 1 < RW - 2) room.rocks.push([x + 1, y]);
      }
      if (room.doors.some(s => !reachableIn(room).has(doorTile(s).join(',')))) room.rocks = [];
      const nb = kind === 'fim' ? 0 : 3 + Math.floor(r() * 4);
      const taken = new Set(room.rocks.map(p => p.join(',')));
      for (let k = 0; k < nb; k++) {
        const x = 2 + Math.floor(r() * (RW - 4)), y = 2 + Math.floor(r() * (RH - 4)), key = `${x},${y}`;
        if (taken.has(key) || nearMid(x, y) || Math.abs(x - CX) <= 1 || Math.abs(y - CY) <= 1) continue;
        taken.add(key);
        const roll = r();
        const bk: BreakKind = roll < 0.35 ? 'pedra' : roll < 0.6 ? 'minerio' : roll < 0.78 ? 'erva' : roll < 0.92 ? 'barril' : 'cristal';
        room.breaks.push({ x, y, kind: bk, hp: bk === 'erva' ? 1 : bk === 'barril' ? 8 : bk === 'pedra' ? 16 : 26 });
      }
    }
    if (kind === 'normal') {
      const free = [...reachableIn(room)].map(k => k.split(',').map(Number) as [number, number])
        .filter(([x, y]) => x > 1 && y > 1 && x < RW - 2 && y < RH - 2 && Math.abs(x - CX) + Math.abs(y - CY) > 4 && !room.breaks.some(b => b.x === x && b.y === y));
      const waves = rank >= 1 || floor >= 2 ? 2 : r() < 0.5 ? 2 : 1;
      for (let w = 0; w < waves; w++) {
        const count = 3 + Math.floor(r() * 2) + Math.min(3, Math.floor(rank / 2)) + (floor - 1);
        for (let k = 0; k < count && free.length; k++) {
          const [x, y] = free[Math.floor(r() * free.length)];
          room.spawns.push({ kind: pool[Math.floor(r() * pool.length)], x: x + 0.5, y: y + 0.5, wave: w });
        }
      }
    }
    if (kind === 'chefe') room.spawns.push({ kind: 'chefe', x: CX + 0.5, y: 3.5, wave: 0 });
    return room;
  });
  return { seed, rank, floor, rooms, start: 0, end };
}

/** A sala vizinha pela porta `s` (ou -1). */
export function neighbor(d: Dungeon, i: number, s: Side): number {
  const [x, y] = [d.rooms[i].gx + STEP[s][0], d.rooms[i].gy + STEP[s][1]];
  return d.rooms[i].doors.includes(s) ? d.rooms.findIndex(r => r.gx === x && r.gy === y) : -1;
}

// ─── pet ────────────────────────────────────────────────────────────────────

export type LootCat = 'minerio' | 'erva' | 'cristal' | 'trofeu';
export const LOOT_CATS: LootCat[] = ['minerio', 'erva', 'cristal', 'trofeu'];
export const catOf = (item: string): LootCat | null =>
  item.startsWith('minerio:') ? 'minerio' : item.startsWith('erva:') ? 'erva' : item.startsWith('cristal:') ? 'cristal' : item === 'pena' || item === 'pelo' ? 'trofeu' : null;

/** O tipo que cada pet prefere: pelo nome (pedra/rocha cata minério, broto/folha cata erva...). */
export function petAffinity(pet: string): LootCat {
  if (/pedra|rocha|toupeira|tatu|robo|besouro|aranha/.test(pet)) return 'minerio';
  if (/broto|trevo|folha|cogumel|tartaruga|cervo|sapinho|lagarta|pintinho/.test(pet)) return 'erva';
  if (/chama|raio|faisca|estatica|neon|lava|sol|fantasm|sombra|morcego|polvo|cristal/.test(pet)) return 'cristal';
  return 'trofeu';
}
export const PET_CAP = 10;
export const petCap = (pet: string, cat: LootCat, bonus = 0) => (petAffinity(pet) === cat ? PET_CAP * 2 : PET_CAP) + bonus;

// ─── a partida ──────────────────────────────────────────────────────────────

export type Phase = 1 | 2 | 3;
export interface Enemy {
  id: number; kind: EnemyKind; x: number; y: number; hp: number; max: number;
  /** recarga do ataque; tempo de vida; brilho de acerto */
  cd: number; t: number; hit: number;
  /** 'wind' = avisando o golpe; 'dash' = investida do lobo/chefe */
  state: 'move' | 'wind' | 'dash'; st: number; vx: number; vy: number;
  burn: number; burnDps: number; freeze: number; stun: number;
  /** chefe: fase e qual golpe vem; o que o golpe avisado solta quando o aviso acaba */
  phase: Phase; next: number; act?: 'flecha' | 'orbes' | 'avanco' | 'anel' | 'investida';
}
export interface Shot { id: number; x: number; y: number; vx: number; vy: number; mine: boolean; life: number; dmg: number; r: number; pierce?: boolean; blast?: number; hits?: number[]; kind: 'bala' | 'flecha' | 'orbe' | 'magia' | 'carta'; el?: string; effect?: Skill['effect']; card?: string }
export interface Warn { id: number; kind: 'circle' | 'line'; x: number; y: number; r: number; x2: number; y2: number; t: number; total: number; dmg: number; src: number }
export interface Loot { id: number; x: number; y: number; item: string; n: number }
export interface Pickup { id: number; room: number; x: number; y: number; kind: 'arma' | 'loja'; weapon?: WeaponId; what?: 'vida' | 'mana' | 'arma'; price?: number }
export interface Ally { id: number; kind: SombraKind; x: number; y: number; cd: number; atk: number }
export interface Pet { id: string; x: number; y: number; bag: Record<LootCat, number>; items: Record<string, number>; target: number }
export interface Player {
  x: number; y: number; hp: number; max: number; armor: number; armorMax: number; armorT: number;
  mana: number; manaMax: number;
  face: Side; dash: number; dashCd: number; inv: number; dx: number; dy: number;
  /** [curta, longa] com nível do ferreiro; qual está na mão */
  arms: [{ id: WeaponId; lvl: number }, { id: WeaponId; lvl: number }]; hand: 0 | 1; atk: number; swing: number;
  skills: Skill[]; skillCd: number[];
  potions: { vida: number; mana: number };
}
export type BuffId = 'coracao' | 'escudo' | 'mana' | 'critico' | 'recarga' | 'faro' | 'lamina' | 'mira' | 'vampiro';
export const BUFFS: { id: BuffId; name: string; about: string }[] = [
  { id: 'coracao', name: 'Coração de Caçador', about: '+1 coração e cura tudo.' },
  { id: 'escudo', name: 'Escudo Rúnico', about: '+1 de escudo (volta sozinho).' },
  { id: 'mana', name: 'Poço de Mana', about: '+40 de mana máxima e enche.' },
  { id: 'critico', name: 'Olho do Predador', about: '+15% de chance de crítico.' },
  { id: 'recarga', name: 'Mente Rápida', about: 'Cartas recarregam 25% mais rápido.' },
  { id: 'faro', name: 'Faro Apurado', about: 'O pet cata de mais longe e carrega +5.' },
  { id: 'lamina', name: 'Lâmina Afiada', about: '+25% de dano da arma curta.' },
  { id: 'mira', name: 'Mira Firme', about: '+25% de dano da arma longa.' },
  { id: 'vampiro', name: 'Sede de Batalha', about: 'Cada 8 inimigos vencidos devolvem 1 coração.' },
];

export type Ev =
  | { k: 'swing'; x: number; y: number; ang: number; arc: number; range: number }
  | { k: 'shoot'; x: number; y: number; ang: number }
  | { k: 'hit'; x: number; y: number; dmg: number; crit: boolean }
  | { k: 'kill'; x: number; y: number; kind: EnemyKind }
  | { k: 'break'; x: number; y: number; kind: BreakKind }
  | { k: 'cast'; slot: number; x: number; y: number; tx: number; ty: number; skill: Skill }
  | { k: 'hurt' } | { k: 'block' } | { k: 'deflect'; x: number; y: number } | { k: 'nomana' } | { k: 'potion'; what: 'vida' | 'mana' }
  | { k: 'pick'; item: string; n: number } | { k: 'full'; cat: LootCat } | { k: 'room' } | { k: 'wave' } | { k: 'cleared' }
  | { k: 'chest' } | { k: 'buy'; what: string } | { k: 'weapon'; id: WeaponId } | { k: 'stairs' } | { k: 'phase'; phase: Phase } | { k: 'heal'; x: number; y: number };

export interface Run {
  seed: number; rank: number; floor: number;
  d: Dungeon; room: number; cleared: boolean[]; seen: boolean[]; wave: number;
  breaks: Breakable[][];
  p: Player; pet: Pet; allies: Ally[];
  enemies: Enemy[]; shots: Shot[]; warns: Warn[]; loot: Loot[]; pickups: Pickup[];
  /** bênçãos já tomadas; e as 3 oferecidas (a partida para até escolher) */
  buffs: BuffId[]; choice?: BuffId[];
  t: number; seq: number; rs: number;
  gold: number; kills: number; killsBy: Partial<Record<EnemyKind, number>>; hurtCount: number;
  chests: number[]; bought: number[];
  ev: Ev[];
  result?: 'win' | 'lose';
}
export interface Input { mx: number; my: number; ax: number; ay: number; attack: boolean; dodge: boolean; swap?: boolean; use?: boolean; skill?: number }
export const NO_INPUT: Input = { mx: 0, my: 0, ax: 0, ay: 0, attack: false, dodge: false };

export const ENEMY: Record<EnemyKind, { hp: number; speed: number; r: number; gold: number; touch: boolean }> = {
  goblin: { hp: 26, speed: 2.4, r: 0.38, gold: 2, touch: false },
  arqueiro: { hp: 18, speed: 1.8, r: 0.36, gold: 2, touch: false },
  xama: { hp: 22, speed: 1.6, r: 0.38, gold: 3, touch: false },
  slime: { hp: 22, speed: 2.2, r: 0.42, gold: 1, touch: true },
  slimeP: { hp: 8, speed: 2.8, r: 0.28, gold: 1, touch: true },
  morcego: { hp: 12, speed: 3.2, r: 0.33, gold: 1, touch: true },
  lobo: { hp: 34, speed: 2.2, r: 0.42, gold: 3, touch: false },
  golem: { hp: 80, speed: 1.1, r: 0.6, gold: 5, touch: false },
  chefe: { hp: 320, speed: 1.3, r: 0.95, gold: 30, touch: true },
};
/** Vida dos inimigos cresce com o rank e o andar. */
export const hpMult = (rank: number, floor: number) => [1, 1.5, 2.2, 3, 4, 5.2][Math.min(5, rank)] * (1 + (floor - 1) * 0.15);
export const SPEED = 4.6, DASH = 13, DASH_T = 0.17, DASH_CD = 0.8, PR = 0.3, ESHOT = 5.2, ARROW = 9.5, INV = 0.8;
const AUTO_AIM = 9, ARMOR_WAIT = 2.5;

const rand = (run: Run) => { run.rs = (run.rs + 0x6d2b79f5) >>> 0; let t = run.rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export interface RunOptions {
  seed: number; rank: number;
  arms?: [{ id: WeaponId; lvl: number }, { id: WeaponId; lvl: number }];
  skills?: Skill[]; pet?: string; sombra?: SombraKind;
  hearts?: number; armor?: number; mana?: number; potions?: { vida: number; mana: number };
}

function newEnemy(run: Run, kind: EnemyKind, x: number, y: number): Enemy {
  const max = Math.round(ENEMY[kind].hp * hpMult(run.rank, run.floor));
  return { id: run.seq++, kind, x, y, hp: max, max, cd: 0.8 + rand(run) * 1.2, t: 0, hit: 0, state: 'move', st: 0, vx: 0, vy: 0, burn: 0, burnDps: 0, freeze: 0, stun: 0, phase: 1, next: 0 };
}

function enterRoom(run: Run) {
  const r = run.d.rooms[run.room];
  run.seen[run.room] = true;
  run.ev.push({ k: 'room' });
  if (r.kind === 'loja' && !run.pickups.some(p => p.kind === 'loja' && p.room === run.room)) {
    const price = 12 + run.rank * 6, room = run.room;
    run.pickups.push(
      { id: run.seq++, room, x: CX - 2.5, y: CY + 0.5, kind: 'loja', what: 'vida', price },
      { id: run.seq++, room, x: CX + 0.5, y: CY + 0.5, kind: 'loja', what: 'mana', price: Math.round(price * 0.7) },
      { id: run.seq++, room, x: CX + 3.5, y: CY + 0.5, kind: 'loja', what: 'arma', price: price * 3 },
    );
  }
  if (run.cleared[run.room]) return;
  run.wave = 0;
  spawnWave(run);
}
function spawnWave(run: Run) {
  const r = run.d.rooms[run.room];
  run.enemies = r.spawns.filter(s => s.wave === run.wave).map(s => newEnemy(run, s.kind, s.x, s.y));
  if (run.enemies.some(e => e.kind === 'chefe')) for (const e of run.enemies) if (e.kind === 'chefe') { e.hp = e.max = Math.round(ENEMY.chefe.hp * hpMult(run.rank, 1)); }
  if (!run.enemies.length) { run.cleared[run.room] = true; }
}

export function startRun(o: RunOptions): Run {
  const d = generate(o.seed, o.rank, 1);
  const pet = o.pet ?? 'pet-raposa-chama';
  const run: Run = {
    seed: o.seed, rank: o.rank, floor: 1,
    d, room: d.start, cleared: d.rooms.map(r => r.kind !== 'normal' && r.kind !== 'chefe'), seen: d.rooms.map(() => false), wave: 0,
    breaks: d.rooms.map(r => r.breaks.map(b => ({ ...b }))),
    p: {
      x: CX + 0.5, y: CY + 0.5, hp: o.hearts ?? 6, max: o.hearts ?? 6, armor: o.armor ?? 3, armorMax: o.armor ?? 3, armorT: 0,
      mana: o.mana ?? 120, manaMax: o.mana ?? 120,
      face: 's', dash: 0, dashCd: 0, inv: 0, dx: 0, dy: 1,
      arms: o.arms ?? [{ id: START_CURTA, lvl: 0 }, { id: START_LONGA, lvl: 0 }], hand: 0, atk: 0, swing: 0,
      skills: o.skills ?? [], skillCd: (o.skills ?? []).map(() => 0),
      potions: o.potions ?? { vida: 0, mana: 0 },
    },
    pet: { id: pet, x: CX - 0.5, y: CY + 1.2, bag: { minerio: 0, erva: 0, cristal: 0, trofeu: 0 }, items: {}, target: -1 },
    allies: o.sombra ? [{ id: 0, kind: o.sombra, x: CX + 1.5, y: CY + 1.5, cd: 0, atk: 0 }] : [],
    enemies: [], shots: [], warns: [], loot: [], pickups: [],
    buffs: [], t: 0, seq: 1, rs: (o.seed ^ 0x9e3779b9) >>> 0,
    gold: 0, kills: 0, killsBy: {}, hurtCount: 0, chests: [], bought: [], ev: [],
  };
  enterRoom(run);
  run.ev = [];
  return run;
}

// ─── física ─────────────────────────────────────────────────────────────────

const roomOf = (run: Run) => run.d.rooms[run.room];
const blocked = (run: Run, x: number, y: number, rad: number, fly = false) => {
  const r = roomOf(run), open = run.cleared[run.room];
  for (const [cx, cy] of [[x - rad, y - rad], [x + rad, y - rad], [x - rad, y + rad], [x + rad, y + rad]]) {
    const tx = Math.floor(cx), ty = Math.floor(cy);
    if (fly ? (tx <= 0 || ty <= 0 || tx >= RW - 1 || ty >= RH - 1) && solidAt(r, tx, ty, open, []) : solidAt(r, tx, ty, open, run.breaks[run.room])) return true;
  }
  return false;
};
function moveBody(run: Run, b: { x: number; y: number }, vx: number, vy: number, dt: number, rad: number, fly = false): boolean {
  let hit = false;
  const nx = b.x + vx * dt; if (!blocked(run, nx, b.y, rad, fly)) b.x = nx; else hit = true;
  const ny = b.y + vy * dt; if (!blocked(run, b.x, ny, rad, fly)) b.y = ny; else hit = true;
  return hit;
}
const angDiff = (a: number, b: number) => Math.abs(((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
function segDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

function hurtPlayer(run: Run, dmg = 1) {
  const p = run.p;
  if (p.inv > 0 || p.dash > 0 || run.result) return;
  p.armorT = ARMOR_WAIT;
  let left = dmg;
  if (p.armor > 0) { const a = Math.min(p.armor, left); p.armor -= a; left -= a; run.ev.push({ k: 'block' }); }
  if (left > 0) { p.hp -= left; run.ev.push({ k: 'hurt' }); run.hurtCount++; }
  p.inv = INV;
  if (p.hp <= 1 && p.hp > 0 && p.potions.vida > 0) { p.potions.vida--; p.hp = Math.min(p.max, p.hp + 3); run.ev.push({ k: 'potion', what: 'vida' }); }
  if (p.hp <= 0) { p.hp = 0; run.result = 'lose'; }
}

function crit(run: Run): boolean { return rand(run) < 0.08 + (run.buffs.filter(b => b === 'critico').length * 0.15); }

function damageEnemy(run: Run, e: Enemy, dmg: number, effect?: Skill['effect'], canCrit = true) {
  if (e.hp <= 0) return;
  const c = canCrit && crit(run);
  const d = Math.round(dmg * (c ? 2 : 1));
  e.hp -= d; e.hit = 0.12;
  run.ev.push({ k: 'hit', x: e.x, y: e.y, dmg: d, crit: c });
  if (effect === 'queimar') { e.burn = 3; e.burnDps = Math.max(e.burnDps, dmg * 0.12); }
  if (effect === 'congelar') e.freeze = 2;
  if (effect === 'atordoar' && e.kind !== 'chefe') { e.stun = 1.2; e.state = 'move'; }
}
function damageBreaks(run: Run, test: (x: number, y: number) => boolean, dmg: number) {
  for (const b of run.breaks[run.room]) {
    if (b.hp <= 0 || !test(b.x + 0.5, b.y + 0.5)) continue;
    b.hp -= dmg;
    if (b.hp <= 0) breakDrop(run, b);
  }
}
const ORE = ['cobre', 'cobre', 'ferro', 'ferro', 'ouro', 'ouro'];
const CRYSTAL = ['azul', 'azul', 'roxo', 'roxo', 'dourado', 'dourado'];
function drop(run: Run, x: number, y: number, item: string, n = 1) {
  const a = rand(run) * Math.PI * 2, d = 0.2 + rand(run) * 0.5;
  run.loot.push({ id: run.seq++, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, item, n });
}
function breakDrop(run: Run, b: Breakable) {
  run.ev.push({ k: 'break', x: b.x + 0.5, y: b.y + 0.5, kind: b.kind });
  const x = b.x + 0.5, y = b.y + 0.5, rk = Math.min(5, run.rank);
  if (b.kind === 'minerio') drop(run, x, y, `minerio:${ORE[rk]}`, 1 + (rand(run) < 0.4 ? 1 : 0));
  if (b.kind === 'erva') drop(run, x, y, rand(run) < 0.7 ? 'erva:cura' : 'erva:mana');
  if (b.kind === 'cristal') drop(run, x, y, `cristal:${CRYSTAL[rk]}`);
  if (b.kind === 'pedra' && rand(run) < 0.25) drop(run, x, y, `minerio:${ORE[rk]}`);
  if (b.kind === 'barril') { drop(run, x, y, 'moeda', 2 + Math.floor(rand(run) * 3)); if (rand(run) < 0.4) drop(run, x, y, 'mana', 1); }
}
function killDrops(run: Run, e: Enemy) {
  const g = ENEMY[e.kind].gold;
  drop(run, e.x, e.y, 'moeda', g);
  if (rand(run) < 0.35) drop(run, e.x, e.y, 'mana', 1);
  if (rand(run) < 0.04) drop(run, e.x, e.y, 'vida', 1);
  if ((e.kind === 'goblin' || e.kind === 'arqueiro' || e.kind === 'xama') && rand(run) < 0.3) drop(run, e.x, e.y, 'pena');
  if (e.kind === 'lobo' && rand(run) < 0.6) drop(run, e.x, e.y, 'pelo');
  if (e.kind === 'golem') drop(run, e.x, e.y, `minerio:${ORE[Math.min(5, run.rank)]}`, 2);
  if ((e.kind === 'slime' || e.kind === 'morcego') && rand(run) < 0.25) drop(run, e.x, e.y, `cristal:${CRYSTAL[Math.min(5, run.rank)]}`);
  if (e.kind === 'chefe') { for (let k = 0; k < 3; k++) drop(run, e.x, e.y, `cristal:${CRYSTAL[Math.min(5, run.rank)]}`); drop(run, e.x, e.y, 'moeda', 10); }
}

// ─── alvo e ataques do jogador ──────────────────────────────────────────────

function nearestEnemy(run: Run, x: number, y: number, max = AUTO_AIM): Enemy | null {
  let best: Enemy | null = null, bd = max;
  for (const e of run.enemies) { const d = Math.hypot(e.x - x, e.y - y); if (e.hp > 0 && d < bd) { bd = d; best = e; } }
  return best;
}
function aimOf(run: Run, input: Input, max = AUTO_AIM): { ax: number; ay: number; target: Enemy | null } {
  const p = run.p;
  if (Math.hypot(input.ax, input.ay) > 0.1) return { ax: input.ax, ay: input.ay, target: null };
  const e = nearestEnemy(run, p.x, p.y, max);
  if (e) return { ax: e.x - p.x, ay: e.y - p.y, target: e };
  return { ax: p.dx, ay: p.dy, target: null };
}
const buffN = (run: Run, b: BuffId) => run.buffs.filter(x => x === b).length;

function attack(run: Run, input: Input) {
  const p = run.p, arm = p.arms[p.hand], w = weapon(arm.id);
  const mult = levelMult(arm.lvl) * (1 + 0.25 * buffN(run, w.kind === 'curta' ? 'lamina' : 'mira'));
  if (w.kind === 'curta') {
    const { ax, ay } = aimOf(run, input, 4);
    const ang = Math.atan2(ay, ax), reach = w.range, arc = w.arc ?? 1.6;
    p.atk = w.cd; p.swing = 0.18;
    run.ev.push({ k: 'swing', x: p.x, y: p.y, ang, arc, range: reach });
    for (const e of run.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < reach + ENEMY[e.kind].r && (d < 0.6 || angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang) < arc / 2)) damageEnemy(run, e, w.dmg * mult);
    }
    // corta os tiros inimigos que pega
    for (const s of run.shots) if (!s.mine && Math.hypot(s.x - p.x, s.y - p.y) < reach + 0.2 && angDiff(Math.atan2(s.y - p.y, s.x - p.x), ang) < arc / 2) { s.life = 0; run.ev.push({ k: 'deflect', x: s.x, y: s.y }); }
    damageBreaks(run, (x, y) => Math.hypot(x - p.x, y - p.y) < reach + 0.4 && angDiff(Math.atan2(y - p.y, x - p.x), ang) < arc / 2 + 0.3, w.dmg * mult);
    return;
  }
  const cost = w.mana ?? 0;
  if (p.mana < cost) {
    if (p.potions.mana > 0) { p.potions.mana--; p.mana = p.manaMax; run.ev.push({ k: 'potion', what: 'mana' }); }
    else { p.atk = 0.4; run.ev.push({ k: 'nomana' }); return; }
  }
  p.mana -= cost; p.atk = w.cd;
  const { ax, ay } = aimOf(run, input, w.range);
  const ang = Math.atan2(ay, ax), n = w.count ?? 1, sp = w.spread ?? 0;
  run.ev.push({ k: 'shoot', x: p.x, y: p.y, ang });
  for (let k = 0; k < n; k++) {
    const a = ang + (n > 1 ? (k / (n - 1) - 0.5) * sp : 0);
    run.shots.push({ id: run.seq++, x: p.x + Math.cos(a) * 0.4, y: p.y + Math.sin(a) * 0.4, vx: Math.cos(a) * w.speed!, vy: Math.sin(a) * w.speed!, mine: true, life: w.range / w.speed!, dmg: w.dmg * mult, r: 0.15, pierce: w.pierce, blast: w.blast, hits: [], kind: w.id === 'besta' || w.id === 'arco' ? 'flecha' : w.id === 'cajado' || w.id === 'livro' || w.id === 'varinha' ? 'magia' : 'bala' });
  }
}

function cast(run: Run, slot: number, input: Input) {
  const p = run.p, sk = p.skills[slot];
  if (!sk || p.skillCd[slot] > 0) return;
  p.skillCd[slot] = sk.cd * (1 - 0.25 * Math.min(2, buffN(run, 'recarga')));
  const { ax, ay, target } = aimOf(run, input, 10);
  const l = Math.hypot(ax, ay) || 1, ux = ax / l, uy = ay / l, ang = Math.atan2(uy, ux);
  let tx = p.x + ux * 6, ty = p.y + uy * 6;
  const hitAll = (test: (e: Enemy) => boolean) => {
    let any = false;
    for (const e of run.enemies) if (e.hp > 0 && test(e)) { damageEnemy(run, e, sk.dmg, sk.effect); any = true; }
    return any;
  };
  let any = false;
  if (sk.shape === 'projetil') {
    run.shots.push({ id: run.seq++, x: p.x, y: p.y, vx: ux * 9, vy: uy * 9, mine: true, life: 1.4, dmg: sk.dmg, r: 0.35, pierce: sk.size === 0, blast: sk.size || undefined, hits: [], kind: 'carta', el: sk.element, effect: sk.effect, card: sk.card });
  } else if (sk.shape === 'linha') {
    tx = p.x + ux * 11; ty = p.y + uy * 11;
    any = hitAll(e => segDist(e.x, e.y, p.x, p.y, tx, ty) < sk.size + ENEMY[e.kind].r);
    damageBreaks(run, (x, y) => segDist(x, y, p.x, p.y, tx, ty) < sk.size + 0.4, sk.dmg);
  } else if (sk.shape === 'area') {
    tx = p.x; ty = p.y;
    any = hitAll(e => Math.hypot(e.x - p.x, e.y - p.y) < sk.size + ENEMY[e.kind].r);
    damageBreaks(run, (x, y) => Math.hypot(x - p.x, y - p.y) < sk.size + 0.4, sk.dmg);
    for (const s of run.shots) if (!s.mine && Math.hypot(s.x - p.x, s.y - p.y) < sk.size) s.life = 0;
  } else if (sk.shape === 'alvo') {
    if (target) { tx = target.x; ty = target.y; } else { tx = p.x + ux * 4; ty = p.y + uy * 4; }
    any = hitAll(e => Math.hypot(e.x - tx, e.y - ty) < sk.size + ENEMY[e.kind].r);
    damageBreaks(run, (x, y) => Math.hypot(x - tx, y - ty) < sk.size + 0.4, sk.dmg);
  } else if (sk.shape === 'arco') {
    tx = p.x + ux * sk.size; ty = p.y + uy * sk.size;
    any = hitAll(e => { const d = Math.hypot(e.x - p.x, e.y - p.y); return d < sk.size + ENEMY[e.kind].r && (d < 0.7 || angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang) < 1.3); });
    for (const s of run.shots) if (!s.mine && Math.hypot(s.x - p.x, s.y - p.y) < sk.size && angDiff(Math.atan2(s.y - p.y, s.x - p.x), ang) < 1.3) s.life = 0;
    damageBreaks(run, (x, y) => Math.hypot(x - p.x, y - p.y) < sk.size + 0.4 && angDiff(Math.atan2(y - p.y, x - p.x), ang) < 1.4, sk.dmg);
  } else if (sk.shape === 'chuva') {
    const near = [...run.enemies].filter(e => e.hp > 0).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).slice(0, 3);
    for (const e of near) { damageEnemy(run, e, sk.dmg, sk.effect); any = true; }
    if (near[0]) { tx = near[0].x; ty = near[0].y; }
  }
  if (any && sk.effect === 'roubar') { p.hp = Math.min(p.max, p.hp + 1); run.ev.push({ k: 'heal', x: p.x, y: p.y }); }
  run.ev.push({ k: 'cast', slot, x: p.x, y: p.y, tx, ty, skill: sk });
}

// ─── inimigos ───────────────────────────────────────────────────────────────

function warnCircle(run: Run, e: Enemy, x: number, y: number, r: number, t: number, dmg = 1) {
  run.warns.push({ id: run.seq++, kind: 'circle', x, y, r, x2: x, y2: y, t, total: t, dmg, src: e.id });
}
function warnLine(run: Run, e: Enemy, x2: number, y2: number, r: number, t: number, dmg = 1) {
  run.warns.push({ id: run.seq++, kind: 'line', x: e.x, y: e.y, r, x2, y2, t, total: t, dmg, src: e.id });
}
function enemyShot(run: Run, x: number, y: number, a: number, speed: number, kind: Shot['kind'] = 'orbe') {
  run.shots.push({ id: run.seq++, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, mine: false, life: 3.2, dmg: 1, r: kind === 'flecha' ? 0.12 : 0.16, kind });
}
/** Quem o inimigo persegue: o jogador, ou a sombra tanque se estiver mais perto. */
function targetOf(run: Run, e: Enemy): { x: number; y: number } {
  const tank = run.allies.find(a => a.kind === 'tanque');
  if (tank && Math.hypot(tank.x - e.x, tank.y - e.y) < Math.hypot(run.p.x - e.x, run.p.y - e.y) && Math.hypot(tank.x - e.x, tank.y - e.y) < 3) return tank;
  return run.p;
}

function stepEnemy(run: Run, e: Enemy, dt: number) {
  const p = run.p;
  e.t += dt; e.hit = Math.max(0, e.hit - dt); e.freeze = Math.max(0, e.freeze - dt);
  if (e.burn > 0) { e.burn -= dt; e.hp -= e.burnDps * dt; }
  if (e.stun > 0) { e.stun -= dt; return; }
  const slow = e.freeze > 0 ? 0.4 : 1;
  e.cd -= dt * slow;
  const tg = targetOf(run, e);
  const dx = tg.x - e.x, dy = tg.y - e.y, dist = Math.hypot(dx, dy), d = dist || 1, sp = ENEMY[e.kind].speed * slow, rad = ENEMY[e.kind].r * 0.8;
  const chase = (k = 1) => moveBody(run, e, (dx / d) * sp * k, (dy / d) * sp * k, dt, rad, e.kind === 'morcego');

  // golpe avisado: quando o aviso acaba, a tela mostra o golpe e o dano é do aviso (resolveWarns)
  if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) e.state = 'move'; return; }
  if (e.state === 'dash') {
    e.st -= dt;
    const hitWall = moveBody(run, e, e.vx, e.vy, dt, rad);
    if (Math.hypot(p.x - e.x, p.y - e.y) < ENEMY[e.kind].r + PR) hurtPlayer(run, 1);
    if (e.st <= 0 || hitWall) e.state = 'move';
    return;
  }
  switch (e.kind) {
    case 'goblin': {
      if (dist > 1.1) chase();
      if (dist < 1.6 && e.cd <= 0) {
        const fx = e.x + (dx / d) * 0.8, fy = e.y + (dy / d) * 0.8;
        warnCircle(run, e, fx, fy, 0.95, 0.5); e.state = 'wind'; e.st = 0.5; e.cd = 1.5;
      }
      break;
    }
    case 'arqueiro': {
      const want = d < 4 ? -1 : d > 6.5 ? 1 : 0;
      moveBody(run, e, (dx / d) * sp * want + (-dy / d) * sp * 0.4, (dy / d) * sp * want + (dx / d) * sp * 0.4, dt, rad);
      if (e.cd <= 0 && dist < 11) {
        warnLine(run, e, e.x + (dx / d) * 11, e.y + (dy / d) * 11, 0.2, 0.6, 0);
        e.state = 'wind'; e.st = 0.6; e.cd = 2.1; e.vx = dx / d; e.vy = dy / d; e.act = 'flecha';
      }
      break;
    }
    case 'xama': {
      const want = d < 4.5 ? -1 : d > 7 ? 1 : 0;
      moveBody(run, e, (dx / d) * sp * want, (dy / d) * sp * want, dt, rad);
      if (e.cd <= 0) {
        // cura os aliados por perto ou joga 3 orbes lentas (avisa brilhando)
        const hurt = run.enemies.find(o => o !== e && o.hp > 0 && o.hp < o.max * 0.7 && Math.hypot(o.x - e.x, o.y - e.y) < 4.5);
        if (hurt) { hurt.hp = Math.min(hurt.max, hurt.hp + hurt.max * 0.3); run.ev.push({ k: 'heal', x: hurt.x, y: hurt.y }); e.cd = 3.2; }
        else { warnCircle(run, e, e.x, e.y, 0.6, 0.45, 0); e.state = 'wind'; e.st = 0.45; e.cd = 2.6; e.vx = dx / d; e.vy = dy / d; e.act = 'orbes'; }
      }
      break;
    }
    case 'slime': case 'slimeP': {
      // pula em direção ao jogador; encostar machuca
      const hop = (e.t % 1.2) < 0.45;
      if (hop) chase(1.6);
      break;
    }
    case 'morcego':
      moveBody(run, e, (dx / d) * sp + Math.cos(e.t * 6 + e.id) * 1.8, (dy / d) * sp + Math.sin(e.t * 6 + e.id) * 1.8, dt, 0.25, true);
      break;
    case 'lobo': {
      if (dist > 2) chase(0.6);
      if (dist < 6.5 && e.cd <= 0) {
        // rosna (linha vermelha) e depois avança em linha reta
        const len = Math.min(7, dist + 1.5);
        warnLine(run, e, e.x + (dx / d) * len, e.y + (dy / d) * len, 0.45, 0.7, 0);
        e.state = 'wind'; e.st = 0.7; e.cd = 2.6; e.vx = (dx / d) * 13; e.vy = (dy / d) * 13; e.act = 'avanco';
      }
      break;
    }
    case 'golem': {
      if (dist > 1.5) chase();
      if (dist < 3 && e.cd <= 0) { warnCircle(run, e, e.x, e.y, 2.4, 0.95, 2); e.state = 'wind'; e.st = 0.95; e.cd = 3; }
      break;
    }
    case 'chefe': stepBoss(run, e, dx, dy, d, dt); break;
  }
  if (ENEMY[e.kind].touch && e.kind !== 'chefe' && dist < ENEMY[e.kind].r + PR && tg === p) hurtPlayer(run, 1);
}

/** Chefe em 3 fases (66% e 33% da vida): anel de orbes, investida, chamar goblins e chuva de golpes. */
function stepBoss(run: Run, e: Enemy, dx: number, dy: number, d: number, dt: number) {
  const ph: Phase = e.hp > e.max * 0.66 ? 1 : e.hp > e.max * 0.33 ? 2 : 3;
  if (ph !== e.phase) { e.phase = ph; run.ev.push({ k: 'phase', phase: ph }); e.cd = 1; }
  if (d > 2.5) moveBody(run, e, (dx / d) * ENEMY.chefe.speed, (dy / d) * ENEMY.chefe.speed, dt, 0.8);
  if (Math.hypot(run.p.x - e.x, run.p.y - e.y) < ENEMY.chefe.r + PR) hurtPlayer(run, 1);
  if (e.cd > 0) return;
  const moves = ph === 1 ? [0, 1] : ph === 2 ? [0, 1, 2] : [0, 1, 2, 3];
  const m = moves[e.next % moves.length]; e.next++;
  if (m === 0) { warnCircle(run, e, e.x, e.y, 1.4, 0.6, 0); e.state = 'wind'; e.st = 0.6; e.cd = ph === 3 ? 1.6 : 2.2; e.act = 'anel'; }
  if (m === 1) { const len = Math.min(9, d + 2); warnLine(run, e, e.x + (dx / d) * len, e.y + (dy / d) * len, 0.9, 0.8, 0); e.state = 'wind'; e.st = 0.8; e.vx = (dx / d) * 11; e.vy = (dy / d) * 11; e.cd = 2.4; e.act = 'investida'; }
  if (m === 2) { for (let k = 0; k < 2 && run.enemies.length < 8; k++) run.enemies.push(newEnemy(run, run.rank >= 2 ? 'lobo' : 'goblin', e.x + (k ? 2 : -2), e.y + 1)); e.cd = 2; }
  if (m === 3) { for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + e.t; warnCircle(run, e, run.p.x + Math.cos(a) * 1.6 * (k ? 1 : 0), run.p.y + Math.sin(a) * 1.6 * (k ? 1 : 0), 1.1, 1, 1); } e.cd = 2.4; }
}

/** O aviso acabou: aplica o golpe (dano do aviso) e solta o tiro/investida do inimigo dono. */
function resolveWarns(run: Run, dt: number) {
  const p = run.p;
  for (const w of run.warns) {
    w.t -= dt;
    if (w.t > 0) continue;
    const owner = run.enemies.find(e => e.id === w.src && e.hp > 0);
    if (w.dmg > 0) {
      const inside = w.kind === 'circle' ? Math.hypot(p.x - w.x, p.y - w.y) < w.r + PR * 0.5 : segDist(p.x, p.y, w.x, w.y, w.x2, w.y2) < w.r + PR * 0.5;
      if (inside) hurtPlayer(run, w.dmg);
    }
    if (!owner || !owner.act) continue;
    const act = owner.act; owner.act = undefined;
    if (act === 'flecha') enemyShot(run, owner.x, owner.y, Math.atan2(owner.vy, owner.vx), ARROW, 'flecha');
    if (act === 'orbes') { const a = Math.atan2(owner.vy, owner.vx); for (const o of [-0.35, 0, 0.35]) enemyShot(run, owner.x, owner.y, a + o, ESHOT * 0.75); }
    if (act === 'avanco') { owner.state = 'dash'; owner.st = 0.55; }
    if (act === 'anel') { const n = owner.phase === 3 ? 18 : owner.phase === 2 ? 14 : 10; for (let k = 0; k < n; k++) enemyShot(run, owner.x, owner.y, (k / n) * Math.PI * 2 + owner.t, ESHOT); }
    if (act === 'investida') { owner.state = 'dash'; owner.st = 0.7; }
  }
  run.warns = run.warns.filter(w => w.t > 0);
}

// ─── sombras (Arise) e pet ──────────────────────────────────────────────────

function stepAllies(run: Run, dt: number) {
  for (const a of run.allies) {
    a.cd = Math.max(0, a.cd - dt); a.atk = Math.max(0, a.atk - dt);
    const e = nearestEnemy(run, a.x, a.y, 12);
    const gx = e ? e.x : run.p.x - 1, gy = e ? e.y : run.p.y + 1;
    const dx = gx - a.x, dy = gy - a.y, d = Math.hypot(dx, dy) || 1;
    const keep = a.kind === 'arqueira' && e ? 4 : a.kind === 'tanque' ? 0.9 : 1;
    if (d > keep) moveBody(run, a, (dx / d) * (a.kind === 'tanque' ? 2.6 : 3.4), (dy / d) * (a.kind === 'tanque' ? 2.6 : 3.4), dt, 0.3);
    if (!e || a.cd > 0) continue;
    const base = 6 * (1 + run.rank * 0.5);
    if (a.kind === 'arqueira' && d < 9) { run.shots.push({ id: run.seq++, x: a.x, y: a.y, vx: (dx / d) * 11, vy: (dy / d) * 11, mine: true, life: 1, dmg: base * 0.8, r: 0.12, hits: [], kind: 'flecha' }); a.cd = 0.9; a.atk = 0.2; }
    if (a.kind !== 'arqueira' && d < 1.4) { damageEnemy(run, e, a.kind === 'tanque' ? base * 0.6 : base, undefined, false); a.cd = a.kind === 'tanque' ? 1.1 : 0.75; a.atk = 0.2; }
  }
}

function stepPet(run: Run, dt: number) {
  const pet = run.pet, p = run.p, bonus = 5 * buffN(run, 'faro');
  const reach = (cat: LootCat) => (petAffinity(pet.id) === cat ? 8 : 5.5) + bonus * 0.6;
  let target = run.loot.find(l => l.id === pet.target);
  if (!target) {
    pet.target = -1;
    let bd = Infinity;
    for (const l of run.loot) {
      const cat = catOf(l.item);
      if (!cat || pet.bag[cat] >= petCap(pet.id, cat, bonus)) continue;
      const d = Math.hypot(l.x - pet.x, l.y - pet.y);
      if (d < reach(cat) && d < bd) { bd = d; pet.target = l.id; target = l; }
    }
  }
  const gx = target ? target.x : p.x - p.dx * 1.1, gy = target ? target.y : p.y - p.dy * 1.1 + 0.3;
  const dx = gx - pet.x, dy = gy - pet.y, d = Math.hypot(dx, dy);
  const speed = target ? (petAffinity(pet.id) === catOf(target.item) ? 7.5 : 6) : d > 3 ? 7 : 4.2;
  if (d > (target ? 0.05 : 0.9)) { const k = Math.min(1, (speed * dt) / d); pet.x += dx * k; pet.y += dy * k; }
  if (target && Math.hypot(target.x - pet.x, target.y - pet.y) < 0.45) {
    const cat = catOf(target.item)!;
    const room = petCap(pet.id, cat, bonus) - pet.bag[cat], take = Math.min(room, target.n);
    petTake(run, target.item, take); target.n -= take;
    run.ev.push({ k: 'pick', item: target.item, n: take });
    if (pet.bag[cat] >= petCap(pet.id, cat, bonus)) run.ev.push({ k: 'full', cat });
    if (target.n <= 0) run.loot = run.loot.filter(l => l !== target);
    pet.target = -1;
  }
  // se o pet ficar longe demais (porta), pula para perto
  if (Math.hypot(pet.x - p.x, pet.y - p.y) > 9) { pet.x = p.x; pet.y = p.y + 0.6; }
}
function petTake(run: Run, item: string, n: number) {
  const cat = catOf(item);
  if (!cat || n <= 0) return;
  run.pet.bag[cat] += n;
  run.pet.items = { ...run.pet.items, [item]: (run.pet.items[item] ?? 0) + n };
}
/** O que o pet carrega, item por item (vai para a mochila no fim). */
export const petItems = (run: Run): Record<string, number> => ({ ...run.pet.items });
/** Saindo da sala: o pet corre e cata o que ficou (se couber); moeda, mana e vida vão para o jogador. */
function sweepRoom(run: Run) {
  const bonus = 5 * buffN(run, 'faro');
  for (const l of run.loot) {
    const cat = catOf(l.item);
    if (cat) petTake(run, l.item, Math.min(l.n, petCap(run.pet.id, cat, bonus) - run.pet.bag[cat]));
    else if (l.item === 'moeda') run.gold += l.n;
  }
  run.loot = [];
}

// ─── o passo ────────────────────────────────────────────────────────────────

function clone(prev: Run): Run {
  return {
    ...prev,
    p: { ...prev.p, arms: [{ ...prev.p.arms[0] }, { ...prev.p.arms[1] }], skillCd: [...prev.p.skillCd], potions: { ...prev.p.potions } },
    pet: { ...prev.pet, bag: { ...prev.pet.bag }, items: { ...prev.pet.items } },
    allies: prev.allies.map(a => ({ ...a })),
    enemies: prev.enemies.map(e => ({ ...e })), shots: prev.shots.map(s => ({ ...s, hits: s.hits ? [...s.hits] : undefined })),
    warns: prev.warns.map(w => ({ ...w })), loot: prev.loot.map(l => ({ ...l })), pickups: prev.pickups.map(x => ({ ...x })),
    cleared: [...prev.cleared], seen: [...prev.seen], breaks: prev.breaks.map((bs, i) => (i === prev.room ? bs.map(b => ({ ...b })) : bs)),
    buffs: [...prev.buffs], chests: [...prev.chests], bought: [...prev.bought], killsBy: { ...prev.killsBy }, ev: [],
  };
}

/** Um passo da partida (dt em segundos, até 0,05). Parado enquanto o SISTEMA oferece a bênção. */
export function stepRun(prev: Run, input: Input, dtIn: number): Run {
  if (prev.result || prev.choice) return prev.ev.length ? { ...prev, ev: [] } : prev;
  const run = clone(prev);
  const dt = Math.min(0.05, Math.max(0, dtIn)), p = run.p;
  run.t += dt;
  p.inv = Math.max(0, p.inv - dt); p.dashCd = Math.max(0, p.dashCd - dt); p.atk = Math.max(0, p.atk - dt); p.swing = Math.max(0, p.swing - dt);
  p.skillCd = p.skillCd.map(c => Math.max(0, c - dt));
  // escudo volta sozinho depois de um tempo sem apanhar; a mana volta devagar
  p.armorT = Math.max(0, p.armorT - dt);
  if (p.armorT <= 0 && p.armor < p.armorMax) { p.armor += 1; p.armorT = 1; }
  p.mana = Math.min(p.manaMax, p.mana + dt * 2);

  // andar e esquivar
  const len = Math.hypot(input.mx, input.my);
  const mx = len > 1 ? input.mx / len : input.mx, my = len > 1 ? input.my / len : input.my;
  if (len > 0.1) { p.dx = mx; p.dy = my; p.face = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'e' : 'w') : (my > 0 ? 's' : 'n'); }
  if (input.dodge && p.dashCd <= 0 && p.dash <= 0) { p.dash = DASH_T; p.dashCd = DASH_CD; }
  if (p.dash > 0) { p.dash = Math.max(0, p.dash - dt); moveBody(run, p, p.dx * DASH, p.dy * DASH, dt, PR); }
  else moveBody(run, p, mx * SPEED, my * SPEED, dt, PR);

  // trocar de arma, pegar coisas, atacar, cartas
  if (input.swap) p.hand = p.hand ? 0 : 1;
  const near = run.pickups.find(x => x.room === run.room && Math.hypot(x.x - p.x, x.y - p.y) < 0.9);
  const wantsUse = input.use || (input.attack && near && !run.enemies.length);
  if (near && wantsUse) usePickup(run, near);
  else if (input.attack && p.atk <= 0 && p.dash <= 0) attack(run, input);
  if (input.skill !== undefined && input.skill >= 0) cast(run, input.skill, input);

  // inimigos, avisos, tiros
  for (const e of run.enemies) stepEnemy(run, e, dt);
  resolveWarns(run, dt);
  stepShots(run, dt);
  stepAllies(run, dt);

  // mortos: prêmios e o slime grande que vira dois pequenos
  const dead = run.enemies.filter(e => e.hp <= 0);
  for (const e of dead) {
    run.kills++; run.killsBy[e.kind] = (run.killsBy[e.kind] ?? 0) + 1;
    run.ev.push({ k: 'kill', x: e.x, y: e.y, kind: e.kind });
    killDrops(run, e);
    if (e.kind === 'slime') for (const o of [-0.4, 0.4]) run.enemies.push(newEnemy(run, 'slimeP', e.x + o, e.y));
    if (buffN(run, 'vampiro') && run.kills % 8 === 0) { p.hp = Math.min(p.max, p.hp + 1); run.ev.push({ k: 'heal', x: p.x, y: p.y }); }
  }
  if (dead.length) run.enemies = run.enemies.filter(e => e.hp > 0);
  if (dead.some(e => e.kind === 'chefe')) { run.enemies = []; run.warns = []; run.shots = run.shots.filter(s => s.mine); }

  // o jogador pega moeda, mana e vida de perto (ímã); o pet cata o resto
  for (const l of run.loot) {
    if (catOf(l.item)) continue;
    const d = Math.hypot(l.x - p.x, l.y - p.y);
    if (d < 2.2) { const k = Math.min(1, (9 * dt) / Math.max(0.01, d)); l.x += (p.x - l.x) * k; l.y += (p.y - l.y) * k; }
    if (d < 0.5) {
      if (l.item === 'moeda') run.gold += l.n;
      if (l.item === 'mana') p.mana = Math.min(p.manaMax, p.mana + 18);
      if (l.item === 'vida') p.hp = Math.min(p.max, p.hp + 1);
      run.ev.push({ k: 'pick', item: l.item, n: l.n }); l.n = 0;
    }
  }
  run.loot = run.loot.filter(l => l.n > 0);
  stepPet(run, dt);

  // onda seguinte, sala limpa, escada e vitória
  const room = roomOf(run);
  if (!run.cleared[run.room] && !run.enemies.length && !run.result) {
    if (room.spawns.some(s => s.wave === run.wave + 1)) { run.wave++; spawnWave(run); run.ev.push({ k: 'wave' }); }
    else {
      run.cleared[run.room] = true; run.warns = []; run.shots = run.shots.filter(s => s.mine);
      run.ev.push({ k: 'cleared' });
      if (room.kind === 'chefe') run.result = 'win';
    }
  }
  if (room.kind === 'tesouro' && !run.chests.includes(run.room) && Math.hypot(p.x - (CX + 0.5), p.y - (CY + 0.5)) < 0.9) {
    run.chests.push(run.room);
    run.pickups.push({ id: run.seq++, room: run.room, x: CX + 0.5, y: CY + 1.6, kind: 'arma', weapon: chestWeapon(run.rank, rand(run), rand(run)) });
    drop(run, CX + 0.5, CY + 0.5, 'moeda', 6); drop(run, CX + 0.5, CY + 0.5, 'mana', 1);
    run.ev.push({ k: 'chest' });
  }
  if (room.kind === 'fim' && run.cleared[run.room] && Math.hypot(p.x - (CX + 0.5), p.y - (CY + 0.5)) < 0.6) {
    run.choice = offerBuffs(run);
    run.ev.push({ k: 'stairs' });
    return run;
  }

  // passar pela porta
  if (run.cleared[run.room] && !run.result) {
    const side: Side | null = p.y < 0.6 ? 'n' : p.y > RH - 0.6 ? 's' : p.x < 0.6 ? 'w' : p.x > RW - 0.6 ? 'e' : null;
    const next = side ? neighbor(run.d, run.room, side) : -1;
    if (side && next >= 0) {
      sweepRoom(run);
      run.room = next; run.shots = []; run.warns = [];
      const [tx, ty] = doorTile(OPP[side]);
      if (side === 'n' || side === 's') { p.y = ty + 0.5 + (side === 's' ? 1 : -1); p.x = Math.max(tx - 0.6, Math.min(tx + 1.6, p.x)); }
      else { p.x = tx + 0.5 + (side === 'e' ? 1 : -1); p.y = Math.max(ty - 0.6, Math.min(ty + 1.6, p.y)); }
      run.pet.x = p.x - (side === 'e' ? 0.8 : side === 'w' ? -0.8 : 0); run.pet.y = p.y - (side === 's' ? 0.8 : side === 'n' ? -0.8 : 0); run.pet.target = -1;
      for (const a of run.allies) { a.x = p.x; a.y = p.y; }
      run.breaks[next] = run.breaks[next].map(b => ({ ...b }));
      enterRoom(run);
    }
  }
  return run;
}

function stepShots(run: Run, dt: number) {
  const room = roomOf(run), p = run.p;
  for (const s of run.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    const tx = Math.floor(s.x), ty = Math.floor(s.y);
    if (solidAt(room, tx, ty, false, run.breaks[run.room])) {
      if (s.mine) { const b = run.breaks[run.room].find(b => b.hp > 0 && b.x === tx && b.y === ty); if (b) { b.hp -= s.dmg; if (b.hp <= 0) breakDrop(run, b); } }
      if (s.blast) explode(run, s);
      s.life = 0;
    }
    if (s.life <= 0) continue;
    if (s.mine) {
      const e = run.enemies.find(x => x.hp > 0 && !s.hits?.includes(x.id) && Math.hypot(x.x - s.x, x.y - s.y) < ENEMY[x.kind].r + s.r);
      if (e) {
        if (s.blast) { explode(run, s); s.life = 0; continue; }
        damageEnemy(run, e, s.dmg, s.effect);
        if (s.pierce) s.hits?.push(e.id); else s.life = 0;
      }
    } else if (Math.hypot(p.x - s.x, p.y - s.y) < PR + s.r) {
      if (p.inv <= 0 && p.dash <= 0) { hurtPlayer(run, s.dmg); s.life = 0; }
    }
  }
  run.shots = run.shots.filter(s => s.life > 0);
}
function explode(run: Run, s: Shot) {
  const r = s.blast ?? 1;
  for (const e of run.enemies) if (e.hp > 0 && Math.hypot(e.x - s.x, e.y - s.y) < r + ENEMY[e.kind].r) damageEnemy(run, e, s.dmg, s.effect);
  damageBreaks(run, (x, y) => Math.hypot(x - s.x, y - s.y) < r + 0.4, s.dmg);
  run.ev.push({ k: 'cast', slot: -1, x: s.x, y: s.y, tx: s.x, ty: s.y, skill: { card: s.card ?? '', name: '', element: (s.el ?? 'Fire') as Skill['element'], rarity: 'common', dmg: s.dmg, cd: 0, shape: 'area', size: r, ownVfx: false } });
}

function usePickup(run: Run, x: Pickup) {
  const p = run.p;
  if (x.kind === 'arma' && x.weapon) {
    const w = weapon(x.weapon), slot = w.kind === 'curta' ? 0 : 1;
    const old = p.arms[slot].id;
    p.arms[slot] = { id: x.weapon, lvl: 0 }; p.hand = slot;
    x.weapon = old;          // a arma velha fica no chão (dá para destrocar)
    run.ev.push({ k: 'weapon', id: w.id });
    return;
  }
  if (x.kind === 'loja' && x.price !== undefined && !run.bought.includes(x.id)) {
    if (run.gold < x.price) { run.ev.push({ k: 'nomana' }); return; }
    run.gold -= x.price; run.bought.push(x.id);
    if (x.what === 'vida') p.hp = Math.min(p.max, p.hp + 2);
    if (x.what === 'mana') p.mana = p.manaMax;
    if (x.what === 'arma') run.pickups.push({ id: run.seq++, room: run.room, x: x.x, y: x.y + 1.2, kind: 'arma', weapon: chestWeapon(run.rank + 1, rand(run), rand(run)) });
    run.ev.push({ k: 'buy', what: x.what ?? '' });
  }
}

// ─── andares e bênçãos ──────────────────────────────────────────────────────

export function offerBuffs(run: Run): BuffId[] {
  const r = rng(run.seed + run.floor * 101);
  const pool = BUFFS.map(b => b.id).filter(b => !(b === 'recarga' && buffN(run, 'recarga') >= 2));
  const out: BuffId[] = [];
  while (out.length < 3) { const b = pool[Math.floor(r() * pool.length)]; if (!out.includes(b)) out.push(b); }
  return out;
}
/** Escolhe a bênção e desce para o próximo andar. */
export function chooseBuff(prev: Run, id: BuffId): Run {
  if (!prev.choice?.includes(id)) return prev;
  const run = clone(prev);
  const p = run.p;
  sweepRoom(run);
  run.buffs.push(id); run.choice = undefined;
  if (id === 'coracao') { p.max += 1; p.hp = p.max; }
  if (id === 'escudo') { p.armorMax += 1; p.armor = p.armorMax; }
  if (id === 'mana') { p.manaMax += 40; p.mana = p.manaMax; }
  run.floor += 1;
  run.d = generate(run.seed, run.rank, run.floor);
  run.room = run.d.start;
  run.cleared = run.d.rooms.map(r => r.kind !== 'normal' && r.kind !== 'chefe');
  run.seen = run.d.rooms.map(() => false);
  run.breaks = run.d.rooms.map(r => r.breaks.map(b => ({ ...b })));
  run.enemies = []; run.shots = []; run.warns = []; run.loot = []; run.pickups = []; run.chests = [];
  p.x = CX + 0.5; p.y = CY + 0.5; run.pet.x = p.x - 1; run.pet.y = p.y + 0.8;
  for (const a of run.allies) { a.x = p.x + 1; a.y = p.y + 1; }
  enterRoom(run);
  return run;
}

// ─── prêmio (as regras de valor ficam em hunter.ts) ─────────────────────────

/** Andar da Torre que cada rank de portal representa (o chefe do portal usa o deck do chefe desse andar). */
export const RANK_ANDAR = [5, 15, 30, 50, 75, 95];
/** A carta que o chefe do portal dá: uma do deck do chefe do andar do rank, pela semente. */
export function dungeonCard(rank: number, seed: number): string {
  const deck = [...new Set(towerBoss(RANK_ANDAR[Math.min(5, rank)]).deck.map(c => c.id))];
  return deck[Math.floor(rng(seed ^ 0x5eed)() * deck.length)];
}
export type { Progress };
