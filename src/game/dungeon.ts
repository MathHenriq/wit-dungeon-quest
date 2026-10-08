// Masmorra (estilo Soul Knight): salas geradas com semente numa grade 5 × 5,
// porta trancada até limpar a sala, tiro e esquiva, 3 tipos de inimigo e o
// chefe na sala mais longe do começo. Regras puras: `stepRun` recebe o estado,
// a entrada do jogador e o tempo e devolve o próximo estado (a tela só
// desenha). Prêmio: moedas pelo caminho e, vencendo o chefe, uma carta do deck
// do chefe do andar (até 3 vezes pagas por dia; no banco: wit2_dungeon_claim).
import type { Progress } from './progress';
import { playsLeft, spendPlay, today } from './life';
import { towerBoss } from '@/lib/tcg/bosses';

export const RW = 15, RH = 9;          // sala em blocos (com a parede em volta)
export const GRID = 5;
export type Side = 'n' | 's' | 'e' | 'w';
export type RoomKind = 'inicio' | 'normal' | 'tesouro' | 'chefe';
export type EnemyKind = 'slime' | 'morcego' | 'arqueiro' | 'chefe';

export interface DRoom { gx: number; gy: number; kind: RoomKind; doors: Side[]; rocks: [number, number][]; spawns: { kind: EnemyKind; x: number; y: number }[] }
export interface Dungeon { seed: number; andar: number; rooms: DRoom[]; start: number; boss: number }

const STEP: Record<Side, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const OPP: Record<Side, Side> = { n: 's', s: 'n', e: 'w', w: 'e' };

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Bloco de porta de cada lado (no meio da parede). */
export const doorTile = (s: Side): [number, number] => (s === 'n' ? [7, 0] : s === 's' ? [7, RH - 1] : s === 'e' ? [RW - 1, 4] : [0, 4]);

/** Sólido dentro da sala: parede (menos porta aberta) e pedras. */
export function solidAt(r: DRoom, tx: number, ty: number, open: boolean): boolean {
  if (tx < 0 || ty < 0 || tx >= RW || ty >= RH) return true;
  if (tx === 0 || ty === 0 || tx === RW - 1 || ty === RH - 1) {
    if (!open) return true;
    // porta de 3 blocos de largura
    return !r.doors.some(s => { const [dx, dy] = doorTile(s); return s === 'n' || s === 's' ? dy === ty && Math.abs(tx - dx) <= 1 : dx === tx && Math.abs(ty - dy) <= 1; });
  }
  return r.rocks.some(([x, y]) => x === tx && y === ty);
}

/** Blocos livres alcançáveis a partir do meio da sala (portas abertas contam). */
export function reachableIn(r: DRoom): Set<string> {
  const seen = new Set(['7,4']), q: [number, number][] = [[7, 4]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (seen.has(k) || solidAt(r, nx, ny, true)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

/** Quantas salas o andar tem (cresce devagar com o andar). */
export const roomCount = (andar: number) => 6 + Math.min(4, Math.floor(andar / 10));

export function generate(seed: number, andar: number): Dungeon {
  const r = rng(seed);
  const n = roomCount(andar);
  const cells: [number, number][] = [[2, 2]];
  const links: [number, number, Side][] = [];
  const at = (x: number, y: number) => cells.findIndex(c => c[0] === x && c[1] === y);
  // passeio aleatório: cada sala nova encosta numa que já existe
  let guard = 0;
  while (cells.length < n && guard++ < 500) {
    const from = Math.floor(r() * cells.length), side = (['n', 's', 'e', 'w'] as Side[])[Math.floor(r() * 4)];
    const [x, y] = cells[from], nx = x + STEP[side][0], ny = y + STEP[side][1];
    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || at(nx, ny) >= 0) continue;
    cells.push([nx, ny]); links.push([from, cells.length - 1, side]);
  }
  // distância (em salas) do começo: o chefe fica na mais longe
  const adj = cells.map(() => [] as number[]);
  for (const [a, b] of links) { adj[a].push(b); adj[b].push(a); }
  const dist = cells.map(() => -1); dist[0] = 0;
  const q = [0];
  while (q.length) { const c = q.shift()!; for (const nb of adj[c]) if (dist[nb] < 0) { dist[nb] = dist[c] + 1; q.push(nb); } }
  const boss = dist.indexOf(Math.max(...dist));
  const leaves = cells.map((_, i) => i).filter(i => i !== 0 && i !== boss && adj[i].length === 1);
  const treasure = leaves.length ? leaves[Math.floor(r() * leaves.length)] : -1;

  const rooms: DRoom[] = cells.map(([gx, gy], i) => {
    const doors: Side[] = [];
    for (const [a, b, s] of links) { if (a === i) doors.push(s); if (b === i) doors.push(OPP[s]); }
    const kind: RoomKind = i === 0 ? 'inicio' : i === boss ? 'chefe' : i === treasure ? 'tesouro' : 'normal';
    const room: DRoom = { gx, gy, kind, doors, rocks: [], spawns: [] };
    if (kind === 'normal') {
      // pedras longe das portas e do meio
      const tries = 2 + Math.floor(r() * 4);
      for (let k = 0; k < tries; k++) {
        const x = 2 + Math.floor(r() * (RW - 4)), y = 2 + Math.floor(r() * (RH - 4));
        if (Math.abs(x - 7) <= 1 || Math.abs(y - 4) <= 1) continue;
        room.rocks.push([x, y]);
        if (r() < 0.5 && x + 1 < RW - 2) room.rocks.push([x + 1, y]);
      }
      if (room.doors.some(s => !reachableIn(room).has(doorTile(s).join(',')))) room.rocks = [];
      const kinds: EnemyKind[] = andar < 5 ? ['slime', 'slime', 'morcego'] : ['slime', 'morcego', 'arqueiro'];
      const count = 3 + Math.floor(r() * 2) + Math.min(2, Math.floor(andar / 15));
      const free = [...reachableIn(room)].map(k => k.split(',').map(Number) as [number, number])
        .filter(([x, y]) => x > 1 && y > 1 && x < RW - 2 && y < RH - 2 && Math.abs(x - 7) + Math.abs(y - 4) > 3);
      for (let k = 0; k < count && free.length; k++) {
        const [x, y] = free.splice(Math.floor(r() * free.length), 1)[0];
        room.spawns.push({ kind: kinds[Math.floor(r() * kinds.length)], x: x + 0.5, y: y + 0.5 });
      }
    }
    if (kind === 'chefe') room.spawns.push({ kind: 'chefe', x: 7.5, y: 3.5 }, { kind: 'slime', x: 3.5, y: 6.5 }, { kind: 'slime', x: 11.5, y: 6.5 });
    return room;
  });
  return { seed, andar, rooms, start: 0, boss };
}

/** A sala vizinha pela porta `s` (ou -1). */
export function neighbor(d: Dungeon, i: number, s: Side): number {
  const [x, y] = [d.rooms[i].gx + STEP[s][0], d.rooms[i].gy + STEP[s][1]];
  return d.rooms[i].doors.includes(s) ? d.rooms.findIndex(r => r.gx === x && r.gy === y) : -1;
}

// ─── a partida ──────────────────────────────────────────────────────────────

export interface Enemy { id: number; kind: EnemyKind; x: number; y: number; hp: number; max: number; cd: number; t: number; hit: number }
export interface Shot { x: number; y: number; vx: number; vy: number; mine: boolean; life: number }
export interface Player { x: number; y: number; hp: number; max: number; face: Side; dash: number; dashCd: number; inv: number; fire: number; dx: number; dy: number }
export interface Run {
  d: Dungeon; room: number; cleared: boolean[]; seen: boolean[];
  p: Player; enemies: Enemy[]; shots: Shot[];
  t: number; seq: number; coins: number; kills: number; chest: boolean;
  result?: 'win' | 'lose';
}
export interface Input { mx: number; my: number; ax: number; ay: number; shoot: boolean; dodge: boolean }
export const NO_INPUT: Input = { mx: 0, my: 0, ax: 0, ay: 0, shoot: false, dodge: false };

export const ENEMY: Record<EnemyKind, { hp: number; speed: number; r: number; coins: number }> = {
  slime: { hp: 3, speed: 1.6, r: 0.4, coins: 1 },
  morcego: { hp: 2, speed: 2.8, r: 0.35, coins: 1 },
  arqueiro: { hp: 4, speed: 1.4, r: 0.4, coins: 2 },
  chefe: { hp: 30, speed: 1.1, r: 0.9, coins: 15 },
};
const SPEED = 4.6, DASH = 13, DASH_T = 0.16, DASH_CD = 0.9, FIRE_CD = 0.22, SHOT = 10, ESHOT = 5, PR = 0.3;
export const bossHp = (andar: number) => ENEMY.chefe.hp + Math.min(40, andar * 2);

function spawn(run: Run) {
  const r = run.d.rooms[run.room];
  if (run.cleared[run.room]) return;
  run.enemies = r.spawns.map(s => {
    const max = s.kind === 'chefe' ? bossHp(run.d.andar) : ENEMY[s.kind].hp;
    return { id: run.seq++, kind: s.kind, x: s.x, y: s.y, hp: max, max, cd: 1 + (run.seq % 3) * 0.4, t: 0, hit: 0 };
  });
  if (!run.enemies.length) run.cleared[run.room] = true;
}

export function startRun(seed: number, andar: number): Run {
  const d = generate(seed, andar);
  const run: Run = {
    d, room: d.start, cleared: d.rooms.map(() => false), seen: d.rooms.map(() => false),
    p: { x: 7.5, y: 4.5, hp: 6, max: 6, face: 's', dash: 0, dashCd: 0, inv: 0, fire: 0, dx: 0, dy: 1 },
    enemies: [], shots: [], t: 0, seq: 1, coins: 0, kills: 0, chest: false,
  };
  run.seen[d.start] = true;
  spawn(run);
  return run;
}

const blocked = (run: Run, x: number, y: number, rad: number) => {
  const r = run.d.rooms[run.room], open = run.cleared[run.room];
  for (const [cx, cy] of [[x - rad, y - rad], [x + rad, y - rad], [x - rad, y + rad], [x + rad, y + rad]])
    if (solidAt(r, Math.floor(cx), Math.floor(cy), open)) return true;
  return false;
};
function moveBody(run: Run, b: { x: number; y: number }, vx: number, vy: number, dt: number, rad: number) {
  const nx = b.x + vx * dt; if (!blocked(run, nx, b.y, rad)) b.x = nx;
  const ny = b.y + vy * dt; if (!blocked(run, b.x, ny, rad)) b.y = ny;
}
function hurt(run: Run) {
  if (run.p.inv > 0 || run.p.dash > 0) return;
  run.p.hp -= 1; run.p.inv = 1;
  if (run.p.hp <= 0) run.result = 'lose';
}

/** Um passo da partida (dt em segundos, até 0,05). */
export function stepRun(prev: Run, input: Input, dtIn: number): Run {
  if (prev.result) return prev;
  const run: Run = { ...prev, p: { ...prev.p }, enemies: prev.enemies.map(e => ({ ...e })), shots: prev.shots.map(s => ({ ...s })), cleared: [...prev.cleared], seen: [...prev.seen] };
  const dt = Math.min(0.05, Math.max(0, dtIn)), p = run.p;
  run.t += dt;
  p.inv = Math.max(0, p.inv - dt); p.dashCd = Math.max(0, p.dashCd - dt); p.fire = Math.max(0, p.fire - dt);

  // andar e esquivar
  const len = Math.hypot(input.mx, input.my);
  const mx = len > 1 ? input.mx / len : input.mx, my = len > 1 ? input.my / len : input.my;
  if (len > 0.1) { p.dx = mx; p.dy = my; p.face = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'e' : 'w') : (my > 0 ? 's' : 'n'); }
  if (input.dodge && p.dashCd <= 0 && p.dash <= 0) { p.dash = DASH_T; p.dashCd = DASH_CD; }
  if (p.dash > 0) { p.dash = Math.max(0, p.dash - dt); moveBody(run, p, p.dx * DASH, p.dy * DASH, dt, PR); }
  else moveBody(run, p, mx * SPEED, my * SPEED, dt, PR);

  // atirar (para onde mira; sem mira, para onde anda)
  if (input.shoot && p.fire <= 0) {
    let ax = input.ax, ay = input.ay;
    if (Math.hypot(ax, ay) < 0.1) { ax = p.dx; ay = p.dy; }
    // mira automática: o inimigo mais perto, se houver e não mirou
    if (Math.hypot(input.ax, input.ay) < 0.1 && run.enemies.length) {
      const e = run.enemies.reduce((a, b) => (Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b));
      ax = e.x - p.x; ay = e.y - p.y;
    }
    const l = Math.hypot(ax, ay) || 1;
    run.shots.push({ x: p.x, y: p.y, vx: (ax / l) * SHOT, vy: (ay / l) * SHOT, mine: true, life: 1.2 });
    p.fire = FIRE_CD;
  }

  // inimigos
  for (const e of run.enemies) {
    e.t += dt; e.cd -= dt; e.hit = Math.max(0, e.hit - dt);
    const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy), d = dist || 1, sp = ENEMY[e.kind].speed;
    if (e.kind === 'slime' || e.kind === 'chefe') moveBody(run, e, (dx / d) * sp, (dy / d) * sp, dt, ENEMY[e.kind].r * 0.8);
    if (e.kind === 'morcego') moveBody(run, e, (dx / d) * sp + Math.cos(e.t * 6) * 1.5, (dy / d) * sp + Math.sin(e.t * 6) * 1.5, dt, 0.25);
    if (e.kind === 'arqueiro') {
      const want = d < 4 ? -1 : d > 6 ? 1 : 0;
      moveBody(run, e, (dx / d) * sp * want, (dy / d) * sp * want, dt, 0.3);
      if (e.cd <= 0) { run.shots.push({ x: e.x, y: e.y, vx: (dx / d) * ESHOT, vy: (dy / d) * ESHOT, mine: false, life: 3 }); e.cd = 1.8; }
    }
    if (e.kind === 'chefe' && e.cd <= 0) {
      // anel de 10 tiros; com menos da metade da vida, chama um slime
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + e.t; run.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * ESHOT, vy: Math.sin(a) * ESHOT, mine: false, life: 3 }); }
      if (e.hp < e.max / 2 && run.enemies.length < 5) run.enemies.push({ id: run.seq++, kind: 'slime', x: 7.5, y: 2.5, hp: 3, max: 3, cd: 1, t: 0, hit: 0 });
      e.cd = 2.2;
    }
    if (dist < ENEMY[e.kind].r + PR) hurt(run);
  }

  // tiros
  const room = run.d.rooms[run.room];
  for (const s of run.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (solidAt(room, Math.floor(s.x), Math.floor(s.y), false)) s.life = 0;
    if (s.life <= 0) continue;
    if (s.mine) {
      const e = run.enemies.find(x => x.hp > 0 && Math.hypot(x.x - s.x, x.y - s.y) < ENEMY[x.kind].r + 0.15);
      if (e) { e.hp -= 1; e.hit = 0.12; s.life = 0; }
    } else if (Math.hypot(p.x - s.x, p.y - s.y) < PR + 0.12) { hurt(run); if (p.inv > 0.9) s.life = 0; }
  }
  run.shots = run.shots.filter(s => s.life > 0);
  for (const e of run.enemies) if (e.hp <= 0) { run.kills++; run.coins += ENEMY[e.kind].coins; }
  run.enemies = run.enemies.filter(e => e.hp > 0);

  // sala limpa: abre as portas; o chefe derrotado vence a masmorra
  if (!run.cleared[run.room] && !run.enemies.length) {
    run.cleared[run.room] = true;
    run.shots = [];
    if (room.kind === 'chefe') run.result = 'win';
  }
  // baú da sala do tesouro
  if (room.kind === 'tesouro' && !run.chest && Math.hypot(p.x - 7.5, p.y - 4.5) < 0.8) { run.chest = true; run.coins += 10; }

  // passar pela porta
  if (run.cleared[run.room] && !run.result) {
    const side: Side | null = p.y < 0.6 ? 'n' : p.y > RH - 0.6 ? 's' : p.x < 0.6 ? 'w' : p.x > RW - 0.6 ? 'e' : null;
    const next = side ? neighbor(run.d, run.room, side) : -1;
    if (side && next >= 0) {
      run.room = next; run.seen[next] = true; run.shots = [];
      const [tx, ty] = doorTile(OPP[side]);
      if (side === 'n' || side === 's') { p.y = ty + 0.5 + (side === 's' ? 1 : -1); p.x = Math.max(tx - 0.6, Math.min(tx + 1.6, p.x)); }
      else { p.x = tx + 0.5 + (side === 'e' ? 1 : -1); p.y = Math.max(ty - 0.6, Math.min(ty + 1.6, p.y)); }
      spawn(run);
    }
  }
  return run;
}

// ─── prêmio ─────────────────────────────────────────────────────────────────

export const DUNGEON_PAID = 3;
export const DUNGEON_MAX_COINS = 60;
/** O andar da masmorra: o andar mais alto da Torre (mínimo 1). */
export const dungeonFloor = (p: Progress) => Math.max(1, p.towerMax);
/** A carta que o chefe da masmorra dá: uma do deck do chefe do andar, pela semente. */
export function dungeonCard(andar: number, seed: number): string {
  const deck = [...new Set(towerBoss(andar).deck.map(c => c.id))];
  return deck[Math.floor(rng(seed ^ 0x5eed)() * deck.length)];
}

/**
 * Fecha a partida no progresso: moedas pelo caminho (até 60; perdeu, metade)
 * e, vencendo, a carta do chefe. Só as 3 primeiras do dia pagam.
 */
export function finishRun(p: Progress, run: Run, now = Date.now()): { progress: Progress; coins: number; card?: string; paid: boolean } {
  const day = today(now), paid = playsLeft(p, 'masmorra', day, DUNGEON_PAID) > 0;
  if (!paid) return { progress: p, coins: 0, paid };
  const coins = Math.min(DUNGEON_MAX_COINS, run.result === 'win' ? run.coins : Math.floor(run.coins / 2));
  let next = spendPlay({ ...p, coins: p.coins + coins }, 'masmorra', day);
  let card: string | undefined;
  if (run.result === 'win') {
    card = dungeonCard(run.d.andar, run.d.seed);
    next = { ...next, collection: { ...next.collection, [card]: (next.collection[card] ?? 0) + 1 } };
  }
  return { progress: next, coins, card, paid };
}
