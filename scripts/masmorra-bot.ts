// Robô da masmorra para a simulação (scripts/masmorra-sim.ts) e testes de
// luta: foge dos avisos com reação de aluno (só vê o aviso depois de REACAO s
// e às vezes não vê), combo de espada tocando o ataque, tiro de longe, cartas
// (segura as que carregam), habilidade do Caminho, caminho entre as salas e
// dentro da sala (não fica preso em pedra).
import { doorTile, isBoss, neighbor, NO_INPUT, RH, RW, solidAt, spikeState, type Input, type Run, type RunOptions, type Side } from '../src/game/dungeon';
import { hunterStats, readyHunter } from '../src/game/hunter';
import { skillOf } from '../src/game/dungeon-skills';
import type { WeaponId } from '../src/game/dungeon-weapons';
import { CATALOG } from '../src/lib/tcg/cards/catalog';
import type { Rarity } from '../src/lib/tcg/types';

/** O que o aluno leva: cartas da raridade pedida; com `up`, o que teria ao chegar no rank (arma forjada e melhorada, pontos, maestria, poções). */
export function loadout(rank: number, rarity: Rarity, k: number, up: boolean): RunOptions {
  const pool = CATALOG.filter(c => c.type === 'attack' && c.rarity === rarity);
  const ready = up ? readyHunter(rank) : undefined, st = ready ?? hunterStats(rank);
  const curta: WeaponId[] = ['espada', 'katana', 'katana', 'machado', 'foice', 'martelo'], longa: WeaponId[] = ['pistola', 'arco', 'fuzil', 'besta', 'cajado', 'canhao'];
  const skills = Array.from({ length: st.slots }, (_, i) => skillOf(pool[(k * 7 + i * 13 + rank) % pool.length], ready?.mastery ?? 0)!);
  return { seed: k * 977 + rank * 13 + 5, rank, hearts: st.hearts, armor: st.armor, mana: st.mana, skills, stats: ready?.stats, arms: ready ? [{ id: curta[rank], lvl: ready.weapon }, { id: longa[rank], lvl: ready.weapon }] : undefined, potions: ready?.potions };
}

export type Style = 'misto' | 'espada' | 'tiro';
const segD = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => { const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l)); return Math.hypot(px - x1 - dx * t, py - y1 - dy * t); };
/** Reação de aluno: só enxerga o aviso depois de REACAO s, e às vezes não vê (ERRO). */
const REACAO = Number(process.env.REACAO ?? 0.3), ERRO = Number(process.env.ERRO ?? 0.2);
export interface Mem { tap: boolean; hold: number; charge: number; px: number; py: number; still: number; miss: Set<number>; rs: number; heavy: number }
const rnd = (m: Mem) => { m.rs = (m.rs * 1103515245 + 12345) % 2147483648; return m.rs / 2147483648; };
/** Próximo bloco no caminho até (gx, gy) dentro da sala (para não ficar preso em pedra). */
/** Chão que machuca agora (lava, veneno, espinho subindo). */
export function badTile(run: Run, x: number, y: number) {
  const tx = Math.floor(x), ty = Math.floor(y);
  return [...run.d.rooms[run.room].haz, ...run.trail].some(h => h.x === tx && h.y === ty && (h.kind === 'lava' || h.kind === 'veneno' || (h.kind === 'espinho' && spikeState(h, run.t) !== 'baixo')));
}
function pathStep(run: Run, gx: number, gy: number): [number, number] | null {
  const r = run.d.rooms[run.room], sx = Math.floor(run.p.x), sy = Math.floor(run.p.y), tx = Math.floor(gx), ty = Math.floor(gy);
  const key = (x: number, y: number) => y * RW + x, prev = new Map<number, number>([[key(sx, sy), -1]]), q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift()!;
    if (x === tx && y === ty) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 1 || ny < 1 || nx >= RW - 1 || ny >= RH - 1 || prev.has(key(nx, ny)) || solidAt(r, nx, ny, false, run.breaks[run.room]) || (badTile(run, nx + 0.5, ny + 0.5) && !(nx === tx && ny === ty))) continue;
      prev.set(key(nx, ny), key(x, y)); q.push([nx, ny]);
    }
  }
  let c = key(tx, ty);
  if (!prev.has(c)) return null;
  while (prev.get(c) !== key(sx, sy) && prev.get(c) !== -1) c = prev.get(c)!;
  return [(c % RW) + 0.5, Math.floor(c / RW) + 0.5];
}
export function bot(run: Run, style: Style, mem: Mem): Input {
  const p = run.p;
  const seen = (w: { id: number; t: number; total: number }) => {
    if (w.total - w.t < REACAO) return false;
    if (!mem.miss.has(w.id) && !mem.miss.has(-w.id)) mem.miss.add(rnd(mem) < ERRO ? w.id : -w.id);
    return mem.miss.has(-w.id);
  };
  const inWarn = (pad: number) => run.warns.filter(w => (w.dmg > 0 || w.st) && seen(w) && (w.kind === 'circle' ? Math.hypot(p.x - w.x, p.y - w.y) < w.r + pad : segD(p.x, p.y, w.x, w.y, w.x2, w.y2) < w.r + pad));
  const danger = inWarn(0.5);
  const lines = run.warns.filter(w => w.kind === 'line' && seen(w) && segD(p.x, p.y, w.x, w.y, w.x2, w.y2) < w.r + 0.6);
  const soon = danger.some(w => w.t < 0.2) || lines.some(w => w.t < 0.25) || (rnd(mem) > ERRO && run.shots.some(s => !s.mine && s.dmg > 0 && Math.hypot(s.x - p.x, s.y - p.y) < 1 && (s.x - p.x) * s.vx + (s.y - p.y) * s.vy < 0));
  if (Math.hypot(p.x - mem.px, p.y - mem.py) < 0.05) mem.still += 0.05; else { mem.still = 0; mem.px = p.x; mem.py = p.y; }
  if (mem.charge >= 0) {
    // segurando carta que carrega
    mem.hold += 0.05;
    const done = mem.hold > 1.3;
    const slot = mem.charge;
    if (done) { mem.charge = -1; mem.hold = 0; }
    return { ...NO_INPUT, held: done ? undefined : slot };
  }
  const enemies = run.enemies.filter(e => e.hp > 0 && e.state !== 'under' && e.ghost <= 0);
  if (enemies.length) {
    // o alvo: a mecânica do chefe primeiro (o que um aluno aprende jogando)
    const near = <T extends { x: number; y: number }>(l: T[]) => l.reduce((a, b) => (Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b));
    const boss = enemies.find(e => isBoss(e.kind));
    const lamps = run.breaks[run.room].filter(b => b.kind === 'lampiao' && b.hp > 0).map(b => ({ x: b.x + 0.5, y: b.y + 0.5 }));
    const plants = enemies.filter(e => e.kind === 'planta');
    let goal: { x: number; y: number } = near(enemies);
    let heavy = false, walkOnly = false;
    const e = near(enemies);
    if (run.corpses.length) { goal = near(run.corpses); walkOnly = Math.hypot(goal.x - p.x, goal.y - p.y) < 5; }
    else if (boss?.kind === 'guardiao' && lamps.length) goal = near(lamps);
    else if (plants.length) goal = near(plants);
    else if (boss?.kind === 'golemLava' && boss.aux > 0) goal = { x: boss.x - Math.cos(boss.face) * 1.5, y: boss.y - Math.sin(boss.face) * 1.5 };
    if ((boss?.kind === 'troll' && boss.shield > 0) || e.elite === 'blindado' || e.kind === 'escudeiro') heavy = true;
    const dx = goal.x - p.x, dy = goal.y - p.y, d = Math.hypot(dx, dy) || 1;
    // sem linha de tiro (pedra no meio): vai de espada pelo caminho
    let los = true;
    for (let t = 0.1; t < 1; t += 0.1) { const x = p.x + (goal.x - p.x) * t, y = p.y + (goal.y - p.y) * t; if (solidAt(run.d.rooms[run.room], Math.floor(x), Math.floor(y), false, run.breaks[run.room])) { los = false; break; } }
    const melee = style === 'espada' || (style === 'misto' && (d < 2.4 || mem.still > 0.8 || heavy || goal !== e || !los));
    const hand = melee ? 0 : 1;
    const big = isBoss(e.kind) || !!e.elite;
    const want = walkOnly ? 0 : boss?.kind === 'golemLava' && boss.aux > 0 ? 0.2 : goal !== e ? 0.9 : melee ? (big ? 1.6 : 1.2) : 4.5;
    let k = d > want ? 1 : d < want - 0.8 ? -1 : 0;
    // fuja do vermelho: para longe do centro do aviso
    let mx = (dx / d) * k + (goal === e ? (-dy / d) * 0.5 : 0), my = (dy / d) * k + (goal === e ? (dx / d) * 0.5 : 0);
    if (danger.length) { const w = danger[0]; const ax = p.x - w.x, ay = p.y - w.y, al = Math.hypot(ax, ay) || 1; mx = ax / al; my = ay / al; k = 0; mem.heavy = 0; }
    else if (badTile(run, p.x, p.y) || badTile(run, p.x + mx * 0.6, p.y + my * 0.6)) {
      // sai do chão que machuca: o bloco livre mais perto
      let best: [number, number] | null = null, bd = 99;
      for (let yy = 1; yy < RH - 1; yy++) for (let xx = 1; xx < RW - 1; xx++) { if (badTile(run, xx + 0.5, yy + 0.5) || solidAt(run.d.rooms[run.room], xx, yy, false, run.breaks[run.room])) continue; const dd = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - p.y) + Math.hypot(xx + 0.5 - goal.x, yy + 0.5 - goal.y) * 0.15; if (dd < bd) { bd = dd; best = [xx + 0.5, yy + 0.5]; } }
      if (best) { const sx = best[0] - p.x, sy = best[1] - p.y, sl = Math.hypot(sx, sy) || 1; mx = sx / sl; my = sy / sl; }
    }
    else if (mem.still > 0.4 || goal !== e || d > 3) { const st = pathStep(run, goal.x, goal.y); if (st && d > 1.2 && (melee || mem.still > 0.4)) { const sx = st[0] - p.x, sy = st[1] - p.y, sl = Math.hypot(sx, sy) || 1; mx = sx / sl; my = sy / sl; } }
    const ready = p.skillCd.findIndex(c => c <= 0);
    const sk = ready >= 0 ? p.skills[ready] : undefined;
    const charges = !!sk?.kit.moves.some(m => (m.m === 'raio' || m.m === 'proj') && m.charge);
    const de = Math.hypot(e.x - p.x, e.y - p.y);
    if (sk && de < 7 && !soon && charges && !mem.heavy) { mem.charge = ready; mem.hold = 0; return { ...NO_INPUT, skill: ready, held: ready }; }
    let attack: boolean;
    if (hand === 1) attack = true;
    else if (heavy && d < 2.2 && !soon) {
      // golpe pesado: segura e solta
      if (mem.heavy <= 0) mem.heavy = 0.65;
      mem.heavy -= 0.05;
      attack = mem.heavy > 0;
    } else { mem.tap = !mem.tap; attack = mem.tap; }
    const ax = goal !== e && !walkOnly ? goal.x - p.x : 0, ay = goal !== e && !walkOnly ? goal.y - p.y : 0;
    return {
      ...NO_INPUT, mx, my, ax, ay, attack: walkOnly ? false : attack, dodge: soon, swap: p.hand !== hand, skill: sk && de < 7 && !mem.heavy ? ready : undefined,
      classe: p.classCd <= 0 && enemies.length >= 2,
    };
  }
  if (run.d.rooms[run.room].kind === 'fim' || (run.d.rooms[run.room].kind === 'elite' && run.cleared[run.room])) {
    const dx = 8.5 - p.x, dy = 5.5 - p.y, d = Math.hypot(dx, dy) || 1;
    return { ...NO_INPUT, mx: dx / d, my: dy / d };
  }
  // caminho pelas salas: até a mais perto ainda não vista (sem a secreta); se viu todas, até o fim
  const prev = new Map<number, [number, Side]>([[run.room, [-1, 'n']]]), q = [run.room];
  let goal = -1;
  const pass = (c: number, s: Side) => s !== run.d.rooms[c].secret || run.cracked.includes(c);
  const allSeen = run.d.rooms.every((r, i) => run.seen[i] || r.kind === 'secreta');
  while (q.length) {
    const c = q.shift()!;
    if (c !== run.room && ((!run.seen[c] && run.d.rooms[c].kind !== 'secreta') || (allSeen && c === run.d.end))) { goal = c; break; }
    for (const sd of run.d.rooms[c].doors) { if (!pass(c, sd)) continue; const nb = neighbor(run.d, c, sd); if (nb >= 0 && !prev.has(nb)) { prev.set(nb, [c, sd]); q.push(nb); } }
  }
  if (goal < 0) goal = run.d.end;
  let step = goal, s: Side = run.d.rooms[run.room].doors.find(sd => pass(run.room, sd))!;
  while (prev.has(step) && prev.get(step)![0] !== -1) { const [from, sd] = prev.get(step)!; if (from === run.room) { s = sd; break; } step = from; }
  const [tx, ty] = doorTile(s);
  const gx = tx + 0.5 + (s === 'e' ? 1 : s === 'w' ? -1 : 0), gy = ty + 0.5 + (s === 's' ? 1 : s === 'n' ? -1 : 0);
  // anda pelo caminho até a frente da porta (desviando das pedras) e depois atravessa
  const inner = { x: tx + 0.5 + (s === 'e' ? -1 : s === 'w' ? 1 : 0), y: ty + 0.5 + (s === 's' ? -1 : s === 'n' ? 1 : 0) };
  const far = Math.hypot(inner.x - p.x, inner.y - p.y) > 0.7 && Math.hypot(gx - p.x, gy - p.y) > Math.hypot(gx - inner.x, gy - inner.y);
  const st = far ? pathStep(run, inner.x, inner.y) : null;
  const [wx, wy] = st ?? [gx, gy];
  const dx = wx - p.x, dy = wy - p.y, d = Math.hypot(dx, dy) || 1;
  return { ...NO_INPUT, mx: dx / d, my: dy / d };
}

export const newMem = (seed: number): Mem => ({ tap: false, hold: 0, charge: -1, px: 0, py: 0, still: 0, miss: new Set(), rs: seed, heavy: 0 });
