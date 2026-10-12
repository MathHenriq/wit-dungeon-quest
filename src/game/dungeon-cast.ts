// O motor das cartas na masmorra: solta o KIT de uma carta (do caçador ou de
// um inimigo), executa cada peça no tempo dela (fila com atraso) e anda os
// golpes que ficam na sala (projéteis com caminho, tornados, raios, zonas,
// chuva, órbitas, vórtices, minas, prisões), as transformações e os aliados.
//
// Carta de inimigo: a carta vira em cima da cabeça (~0,8 s) e cada peça deixa
// AVISO no chão (telegraphKit). As peças de um golpe só (área, golpe, chuva,
// empurrão) machucam pelo aviso; as que ficam na sala (tiro, tornado, raio,
// zona) machucam quem estiver nelas.
import type { Element } from '@/lib/tcg/types';
import { addStatus, hasSt, type Hit, type Kit, type Move } from './dungeon-moves';
import { kitOf } from './dungeon-kits';
import {
  aimOf, angDiff, areaHit, blocked, bodyR, boonOf, buffN, damageBreaks, damageEnemy, ENEMY, hurtPlayer, inRoom, moveBody, nearestEnemy,
  newEnemy, PR, rand, rayLen, roomOf, segDist, targetable, targetOf, warnCircle, warnLine, warnT,
  type Act, type AllyKind, type Enemy, type Input, type Pend, type Run,
} from './dungeon-core';
import { RH, RW, solidAt } from './dungeon-map';
import type { Skill } from './dungeon-skills';

type M<K extends Move['m']> = Extract<Move, { m: K }>;
/** Corações que um golpe de carta inimiga tira. */
export const heartsOf = (h: Hit) => (h.d >= 1.5 ? 2 : 1);
/** Peças que machucam só pelo aviso (no inimigo). */
const INSTANT: Move['m'][] = ['golpe', 'area', 'rajada', 'chuva', 'empurrar', 'prender', 'cadeia'];

export interface CastCtx { mine: boolean; src: number; card: string; el: Element; power: number; ang: number; tx: number; ty: number; tgt: number; charge: number; extra: boolean }

/** Multiplicador de dano do caçador (status, pacto, transformação). */
export function playerPower(run: Run, kind: 'carta' | 'curta' | 'longa'): number {
  const p = run.p, s = p.stats;
  let m = kind === 'carta' ? 1 + 0.04 * s.inteligencia : kind === 'curta' ? 1 + 0.04 * s.forca : 1 + 0.02 * s.forca + 0.02 * s.percepcao;
  const pacto = boonOf(p, 'pacto');
  if (pacto) m *= pacto.v;
  if (p.form) m *= p.form.dmg;
  return m;
}

/** Mais um projétil/golpe e estado 50% mais longo (maestria 3). */
function boost(mv: Move): Move {
  const h = (x: Hit): Hit => ({ ...x, sd: x.sd ? x.sd * 1.5 : x.sd, sd2: x.sd2 ? x.sd2 * 1.5 : x.sd2 });
  const out = { ...mv } as Move & { hit?: Hit; n?: number };
  if ('hit' in mv && mv.hit) out.hit = h(mv.hit);
  if ((mv.m === 'proj' || mv.m === 'orbita' || mv.m === 'chuva' || mv.m === 'marca' || mv.m === 'armadilha' || mv.m === 'invocar' || mv.m === 'rajada')) out.n = ((mv as { n?: number }).n ?? 1) + 1;
  return out;
}

/** O caçador solta a carta do espaço `slot` (`charge` 0–1 para as que carregam). */
export function castSkill(run: Run, slot: number, input: Input, charge = 0): boolean {
  const p = run.p, sk: Skill | undefined = p.skills[slot];
  if (!sk || p.skillCd[slot] > 0 || p.lock > 0) return false;
  if (hasSt(p.sb, 'selado')) { run.ev.push({ k: 'semcarta' }); return false; }
  const kit = sk.kit;
  if (kit.mana && p.mana < kit.mana) { run.ev.push({ k: 'nomana' }); return false; }
  if (kit.custo === 'coracao' && p.hp <= 1) { run.ev.push({ k: 'msg', text: 'Falta vida para pagar o contrato.' }); return false; }
  if (kit.mana) p.mana -= kit.mana;
  if (kit.custo === 'coracao') { p.hp -= 1; run.ev.push({ k: 'hurt' }); }
  if (kit.custo === 'escudo') { if (p.armor > 0) { p.armor -= 1; p.armorT = Math.max(p.armorT, 1.5); run.ev.push({ k: 'block' }); } else if (p.hp > 1) { p.hp -= 1; run.ev.push({ k: 'hurt' }); } }
  p.skillCd[slot] = sk.cd * (1 - 0.25 * Math.min(2, buffN(run, 'recarga'))) * Math.max(0.6, 1 - 0.02 * p.stats.inteligencia);
  const { ax, ay, target } = aimOf(run, input, 11);
  const ang = Math.atan2(ay, ax);
  const tx = target ? target.x : p.x + Math.cos(ang) * 4, ty = target ? target.y : p.y + Math.sin(ang) * 4;
  const ctx: CastCtx = { mine: true, src: -1, card: sk.card, el: sk.element, power: sk.dmg * playerPower(run, 'carta'), ang, tx, ty, tgt: target?.id ?? -1, charge, extra: sk.lvl >= 3 };
  fireKit(run, kit, ctx);
  if (p.eco) {
    // Sábio: a carta sai de novo (só as peças que machucam)
    p.eco = false;
    fireKit(run, { ...kit, moves: kit.moves.filter(m => m.m !== 'cinematica' && m.m !== 'transformar' && m.m !== 'buff').map(m => ({ ...m, at: (m.at ?? 0) + 0.35 })) }, ctx);
  }
  run.cardUse[sk.card] = (run.cardUse[sk.card] ?? 0) + 1;
  run.ev.push({ k: 'cast', slot, x: p.x, y: p.y, tx, ty, card: sk.card, el: sk.element, skill: sk });
  return true;
}

/** Põe as peças do kit na fila (cada uma no seu tempo). */
export function fireKit(run: Run, kit: Kit, c: CastCtx) {
  for (const mv0 of kit.moves) {
    if (!c.mine && INSTANT.includes(mv0.m)) continue;
    const mv = c.extra ? boost(mv0) : mv0;
    run.queue.push({ t: mv.at ?? 0, mv, mine: c.mine, src: c.src, card: c.card, el: c.el, power: c.power, ang: c.ang, tx: c.tx, ty: c.ty, tgt: c.tgt, charge: c.charge });
  }
}

/** A fila: solta a peça quando o tempo dela chega (conta em tempo real, mesmo na cena). */
export function stepQueue(run: Run, dt: number) {
  if (!run.queue.length) return;
  const ready: Pend[] = [];
  for (const q of run.queue) { q.t -= dt; if (q.t <= 0) ready.push(q); }
  run.queue = run.queue.filter(q => q.t > 0);
  for (const q of ready) fire(run, q);
}

const casterOf = (run: Run, q: { mine: boolean; src: number }) => (q.mine ? run.p : run.enemies.find(e => e.id === q.src && e.hp > 0) ?? null);

function newAct(run: Run, q: Pend, mv: Move, x: number, y: number, ang: number, life: number, o: Partial<Act> = {}): Act {
  const a: Act = {
    id: run.seq++, mv, mine: q.mine, src: q.src, card: q.card, el: q.el, power: q.power,
    x, y, ox: x, oy: y, ang, vx: 0, vy: 0, t: 0, life, r: 0.3, w: 0, len: 0, hits: {}, n: 0, back: false, bounce: 0, target: -1, stuck: 0, charge: q.charge, tick: 0, pts: [], ...o,
  };
  run.acts.push(a);
  return a;
}

/** Golpe de uma peça num inimigo (com as bênçãos de roubo). */
function hitE(run: Run, a: { power: number; el: Element; card: string; charge?: number }, e: Enemy, h: Hit, fx: number, fy: number, heavy = false): number {
  const mult = 1 + 1.2 * (a.charge ?? 0);
  const d = damageEnemy(run, e, a.power * h.d * mult, { el: h.el ?? a.el, hit: h, card: a.card, fx, fy, power: a.power, me: true, heavy });
  const roubo = boonOf(run.p, 'roubo');
  if (d > 0 && roubo) { run.p.hp = Math.min(run.p.max, run.p.hp + roubo.v); roubo.t = 0; run.ev.push({ k: 'heal', x: run.p.x, y: run.p.y }); }
  return d;
}
/** Golpe de uma peça de carta inimiga no caçador. */
function hitP(run: Run, h: Hit) { return hurtPlayer(run, heartsOf(h), { st: h.st }); }
function burst(run: Run, a: { mine: boolean; power: number; el: Element; card: string }, x: number, y: number, r: number, h: Hit) {
  if (a.mine) areaHit(run, x, y, r, a.power * h.d, { el: h.el ?? a.el, hit: h, card: a.card, me: true, fx: x, fy: y, power: a.power });
  else { run.ev.push({ k: 'boom', x, y, r, el: a.el }); if (Math.hypot(run.p.x - x, run.p.y - y) < r + PR) hitP(run, h); }
}

// ─── soltar uma peça ────────────────────────────────────────────────────────

function fire(run: Run, q: Pend) {
  const who = casterOf(run, q);
  if (!who) return;
  const p = run.p, mv = q.mv;
  const ox = who.x, oy = who.y;
  let ang = q.ang + (mv.off ?? 0), tx = q.tx, ty = q.ty;
  if (q.mine && q.tgt >= 0) {
    const t = run.enemies.find(e => e.id === q.tgt && targetable(e));
    if (t) { tx = t.x; ty = t.y; ang = Math.atan2(ty - oy, tx - ox) + (mv.off ?? 0); }
  }
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const at = (w: 'eu' | 'alvo' | 'frente') => (w === 'eu' ? { x: ox, y: oy } : w === 'alvo' ? inRoom(tx, ty) : inRoom(ox + ux * 2.2, oy + uy * 2.2));
  switch (mv.m) {
    case 'proj': {
      const n = mv.n ?? 1, sp = mv.spread ?? 0, c = mv.charge ? q.charge : 0;
      for (let k = 0; k < n; k++) {
        const a2 = ang + (n > 1 ? (k / (n - 1) - 0.5) * sp : 0);
        const life = mv.path === 'volta' ? (mv.range / mv.speed) * 3 + 1 : mv.path === 'quica' ? mv.range / mv.speed : mv.range / mv.speed;
        newAct(run, q, mv, ox + Math.cos(a2) * 0.4, oy + Math.sin(a2) * 0.4, a2, life, { vx: Math.cos(a2) * mv.speed, vy: Math.sin(a2) * mv.speed, r: mv.r * (1 + c), bounce: mv.bounce ?? 0, charge: c });
      }
      break;
    }
    case 'tornado':
      newAct(run, q, mv, ox + ux * 0.8, oy + uy * 0.8, ang, mv.range / mv.speed + 0.6, { vx: ux * mv.speed, vy: uy * mv.speed, r: mv.r });
      break;
    case 'raio': {
      const c = mv.charge ? q.charge : 0;
      newAct(run, q, mv, ox, oy, ang, mv.dur, { w: mv.w * (1 + 1.5 * c), len: mv.len, charge: c });
      if (q.mine && mv.dur >= 0.3) p.lock = Math.max(p.lock, mv.dur);
      break;
    }
    case 'zona': {
      const w = at(mv.where);
      newAct(run, q, mv, w.x, w.y, ang, mv.dur, { r: mv.r });
      break;
    }
    case 'chuva':
      newAct(run, q, mv, tx, ty, ang, 99, { n: mv.n, r: mv.r, ox, oy });
      break;
    case 'investida': {
      if (!q.mine) {
        const e = who as Enemy;
        e.state = 'dash'; e.st = mv.len / 12; e.vx = ux * 12; e.vy = uy * 12;
        break;
      }
      if (mv.tele) {
        const t = nearestEnemy(run, tx, ty, 2) ?? nearestEnemy(run, ox, oy, mv.len);
        const d = t ? Math.hypot(t.x - ox, t.y - oy) : rayLen(run, ox, oy, ang, mv.len);
        const bx = t ? t.x + ((t.x - ox) / (d || 1)) * 0.9 : ox + ux * d, by = t ? t.y + ((t.y - oy) / (d || 1)) * 0.9 : oy + uy * d;
        const spot = inRoom(bx, by);
        if (!blocked(run, spot.x, spot.y, PR)) { p.x = spot.x; p.y = spot.y; } else if (t) { p.x = t.x - ((t.x - ox) / (d || 1)) * 0.9; p.y = t.y - ((t.y - oy) / (d || 1)) * 0.9; }
        p.inv = Math.max(p.inv, 0.35);
        run.ev.push({ k: 'zap', x: ox, y: oy, x2: p.x, y2: p.y });
        for (const e of run.enemies) if (targetable(e) && Math.hypot(e.x - p.x, e.y - p.y) < 1.4 + bodyR(e)) hitE(run, q, e, mv.hit, ox, oy);
        break;
      }
      newAct(run, q, mv, ox, oy, ang, mv.len / 20, { vx: ux * 20, vy: uy * 20, w: mv.w });
      break;
    }
    case 'rajada':
      newAct(run, q, mv, ox, oy, ang, mv.n * mv.every + 0.05, { n: 0, tick: 0 });
      p.lock = Math.max(p.lock, mv.n * mv.every + 0.05); p.inv = Math.max(p.inv, mv.n * mv.every + 0.15);
      break;
    case 'orbita':
      newAct(run, q, mv, ox, oy, ang, mv.dur, { n: mv.n, r: mv.r });
      break;
    case 'invocar': {
      if (!q.mine) {
        for (let k = 0; k < Math.min(2, mv.n ?? 2); k++) if (run.enemies.length < 12) { const s = inRoom(ox + (k ? 1 : -1), oy + 0.8); run.enemies.push(newEnemy(run, 'minion', s.x, s.y, { minion: true })); }
        break;
      }
      const kind: AllyKind = mv.kind === 'insetos' ? 'inseto' : mv.kind;
      for (let k = 0; k < (mv.n ?? 1); k++) {
        const a2 = (k / (mv.n ?? 1)) * Math.PI * 2;
        const s = inRoom(ox + Math.cos(a2) * 0.9, oy + Math.sin(a2) * 0.9);
        run.allies.push({ id: run.seq++, kind, x: s.x, y: s.y, cd: 0.3, atk: 0, life: mv.dur, dmg: q.power * mv.hit.d, every: mv.every, range: mv.range, hit: mv.hit, card: q.card, el: q.el });
      }
      break;
    }
    case 'transformar': {
      if (!q.mine) { const e = who as Enemy; e.enraged = true; e.scale = Math.min(1.6, e.scale * 1.25); e.hp = Math.min(e.max, e.hp + e.max * 0.1); run.ev.push({ k: 'heal', x: e.x, y: e.y }); break; }
      if (p.form?.fim) endForm(run);
      p.form = {
        form: mv.form, t: mv.dur, total: mv.dur, scale: mv.scale ?? 1, speed: mv.speed ?? 1, dmg: mv.dmg ?? 1,
        noDodge: !!mv.noDodge, noKnock: !!mv.noKnock, voa: !!mv.voa, dashFree: !!mv.dashFree, imuneStatus: !!mv.imuneStatus, paraTiros: !!mv.paraTiros,
        stomp: mv.stomp, aura: mv.aura, fim: mv.fim, tiro: mv.tiro, cansa: mv.cansa ?? 0, stompT: 0, auraT: 0, power: q.power, card: q.card, el: q.el,
      };
      if (mv.imuneStatus) p.sb = {};
      run.ev.push({ k: 'forma', form: mv.form, on: true });
      break;
    }
    case 'marca': {
      if (!q.mine) { run.warns.push({ id: run.seq++, kind: 'circle', x: p.x, y: p.y, r: mv.r, x2: p.x, y2: p.y, t: mv.delay, total: mv.delay, dmg: heartsOf(mv.hit), src: q.src, st: 'marcado' }); break; }
      const list = run.enemies.filter(targetable).sort((a, b) => Math.hypot(a.x - tx, a.y - ty) - Math.hypot(b.x - tx, b.y - ty)).slice(0, mv.n);
      for (const e of list) { addStatus(e.sb, 'marcado', mv.delay, q.power * mv.hit.d); if (mv.hit.st) addStatus(e.sb, mv.hit.st, mv.hit.sd ?? 2); e.by = q.card; }
      break;
    }
    case 'armadilha': {
      const w = at(mv.where);
      for (let k = 0; k < mv.n; k++) { const a2 = (k / mv.n) * Math.PI * 2; const s = inRoom(w.x + Math.cos(a2) * (mv.n > 1 ? 1.2 : 0), w.y + Math.sin(a2) * (mv.n > 1 ? 1.2 : 0)); newAct(run, q, mv, s.x, s.y, ang, mv.dur, { r: mv.r }); }
      break;
    }
    case 'puxar': {
      const w = at(mv.where);
      newAct(run, q, mv, w.x, w.y, ang, mv.dur, { r: mv.r });
      break;
    }
    case 'empurrar':
      run.ev.push({ k: 'boom', x: ox, y: oy, r: mv.r, el: q.el });
      for (const e of run.enemies) if (targetable(e) && Math.hypot(e.x - ox, e.y - oy) < mv.r + bodyR(e)) hitE(run, q, e, { ...mv.hit, kb: mv.force }, ox, oy);
      damageBreaks(run, (x, y) => Math.hypot(x - ox, y - oy) < mv.r, q.power * mv.hit.d);
      break;
    case 'prender': {
      const cx = mv.where === 'area' ? ox : tx, cy = mv.where === 'area' ? oy : ty;
      const a = newAct(run, q, mv, cx, cy, ang, mv.dur, { r: mv.r });
      for (const e of run.enemies) if (targetable(e) && Math.hypot(e.x - cx, e.y - cy) < mv.r + bodyR(e)) {
        addStatus(e.sb, 'preso', ENEMY[e.kind].weight === 'chefe' ? mv.dur * 0.35 : mv.dur + 0.1);
        a.hits[e.id] = 1;
      }
      break;
    }
    case 'buff': {
      if (!q.mine) { const e = who as Enemy; e.hp = Math.min(e.max, e.hp + e.max * 0.1); run.ev.push({ k: 'heal', x: e.x, y: e.y }); break; }
      if (mv.what === 'cura') { p.hp = Math.min(p.max, p.hp + mv.v); run.ev.push({ k: 'heal', x: p.x, y: p.y }); }
      else if (mv.what === 'critico') p.critN += mv.v;
      else if (mv.what === 'eco') p.eco = true;
      else if (mv.what === 'recarga') p.skillCd = p.skillCd.map((c, i) => (p.skills[i]?.card === q.card ? c : Math.max(0, c - mv.v)));
      else p.boons = [...p.boons.filter(b => b.kind !== mv.what), { kind: mv.what, t: mv.what === 'roubo' ? 1.5 : mv.what === 'escudo' ? 15 : mv.dur ?? 5, v: mv.v }];
      break;
    }
    case 'parar_tiros':
      stopShots(run, ox, oy, mv.r, mv.mode);
      if (mv.dur) newAct(run, q, mv, ox, oy, ang, mv.dur, { r: mv.r });
      break;
    case 'cinematica':
      if (q.mine) {
        run.cine = { t: mv.dur, total: mv.dur, style: mv.style, x: ox, y: oy, ang, card: q.card };
        p.lock = Math.max(p.lock, mv.dur); p.inv = Math.max(p.inv, mv.dur + 0.3);
        run.ev.push({ k: 'cine', style: mv.style, card: q.card });
      }
      break;
    case 'golpe': {
      run.ev.push({ k: 'swing', x: ox, y: oy, ang, arc: Math.min(6.3, mv.arc), range: mv.range });
      for (const e of run.enemies) {
        if (!targetable(e)) continue;
        const d = Math.hypot(e.x - ox, e.y - oy);
        if (d < mv.range + bodyR(e) && (d < 0.7 || mv.arc >= 6.2 || angDiff(Math.atan2(e.y - oy, e.x - ox), ang) < mv.arc / 2)) hitE(run, q, e, mv.hit, ox, oy, (mv.hit.postura ?? 1) >= 2);
      }
      damageBreaks(run, (x, y) => Math.hypot(x - ox, y - oy) < mv.range + 0.4 && (mv.arc >= 6.2 || angDiff(Math.atan2(y - oy, x - ox), ang) < mv.arc / 2 + 0.3), q.power * mv.hit.d);
      break;
    }
    case 'area': {
      const w = at(mv.where);
      burst(run, q, w.x, w.y, mv.r, mv.hit);
      break;
    }
    case 'cadeia': {
      let cur: { x: number; y: number } = { x: ox, y: oy };
      const done = new Set<number>();
      for (let k = 0; k < mv.n; k++) {
        const nx = run.enemies.filter(e => targetable(e) && !done.has(e.id) && Math.hypot(e.x - cur.x, e.y - cur.y) < mv.range).sort((a, b) => Math.hypot(a.x - cur.x, a.y - cur.y) - Math.hypot(b.x - cur.x, b.y - cur.y))[0];
        if (!nx) break;
        done.add(nx.id);
        run.ev.push({ k: 'zap', x: cur.x, y: cur.y, x2: nx.x, y2: nx.y });
        hitE(run, q, nx, mv.hit, cur.x, cur.y);
        cur = nx;
      }
      break;
    }
  }
}

/** Para, devolve ou apaga os tiros inimigos em volta. */
export function stopShots(run: Run, x: number, y: number, r: number, mode: 'congela' | 'devolve' | 'apaga') {
  for (const s of run.shots) {
    if (s.mine || Math.hypot(s.x - x, s.y - y) > r) continue;
    if (mode === 'apaga') s.life = 0;
    else if (mode === 'congela') s.frozen = 2;
    else { s.mine = true; s.vx = -s.vx * 1.3; s.vy = -s.vy * 1.3; s.dmg = 8 + run.rank * 4; s.hits = []; run.ev.push({ k: 'deflect', x: s.x, y: s.y }); }
  }
}

// ─── os golpes que ficam na sala ────────────────────────────────────────────

const wallAt = (run: Run, x: number, y: number, rompe = false) => {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx <= 0 || ty <= 0 || tx >= RW - 1 || ty >= RH - 1) return true;
  return !rompe && solidAt(roomOf(run), tx, ty, false, run.breaks[run.room]);
};
/** Quem uma peça do caçador pode acertar agora (`hits[id]` = quando pode de novo). */
const ready = (a: Act, id: number) => (a.hits[id] ?? -1) <= a.t;

/** Anda todas as peças que ficam na sala. `dtMe` = tempo do caçador; `dtFoe` = tempo do mundo. */
export function stepActs(run: Run, dtMe: number, dtFoe: number) {
  const p = run.p;
  for (const a of run.acts) {
    const dt = a.mine ? dtMe : dtFoe;
    if (dt <= 0) continue;
    a.t += dt;
    const mv = a.mv;
    const owner = a.mine ? p : run.enemies.find(e => e.id === a.src && e.hp > 0);
    switch (mv.m) {
      case 'proj': stepProj(run, a, mv, dt); break;
      case 'tornado': {
        const travel = mv.range / mv.speed;
        if (a.t < travel) {
          const nx = a.ox + a.vx * dt, ny = a.oy + a.vy * dt;
          if (!wallAt(run, nx, ny)) { a.ox = nx; a.oy = ny; }
        }
        a.x = a.ox + Math.cos(a.t * 8) * mv.spin; a.y = a.oy + Math.sin(a.t * 8) * mv.spin;
        if (a.mine) {
          for (const e of run.enemies) {
            if (!targetable(e)) continue;
            const d = Math.hypot(e.x - a.x, e.y - a.y);
            if (mv.pull && d < a.r * 2.4 && d > 0.3 && ENEMY[e.kind].weight !== 'chefe') { e.kbx = ((a.x - e.x) / d) * mv.pull; e.kby = ((a.y - e.y) / d) * mv.pull; }
            if (d < a.r + bodyR(e) && ready(a, e.id)) { hitE(run, a, e, mv.hit, a.x, a.y); a.hits[e.id] = a.t + mv.tick; }
          }
          damageBreaks(run, (x, y) => Math.hypot(x - a.x, y - a.y) < a.r * 0.6, a.power * mv.hit.d * dt);
        } else if (Math.hypot(p.x - a.x, p.y - a.y) < a.r + PR) hitP(run, mv.hit);
        if (a.t >= a.life && mv.fim) burst(run, a, a.x, a.y, mv.fim.r, mv.fim.hit);
        break;
      }
      case 'raio': {
        if (!owner) { a.life = 0; break; }
        a.x = owner.x; a.y = owner.y;
        const ang = a.ang + (mv.sweep ? mv.sweep * (a.t / mv.dur - 0.5) : 0);
        const len = rayLen(run, a.x, a.y, ang, mv.len);
        a.len = len;
        const ux = Math.cos(ang), uy = Math.sin(ang), cone = mv.cone ?? a.w;
        const inside = (x: number, y: number, rr: number) => {
          const s = (x - a.x) * ux + (y - a.y) * uy;
          if (s < -0.3 || s > len + rr) return false;
          const perp = Math.abs((x - a.x) * -uy + (y - a.y) * ux);
          return perp < (a.w + (cone - a.w) * Math.max(0, s) / len) / 2 + rr;
        };
        a.tick -= dt;
        const now = a.tick <= 0;
        if (now) a.tick = mv.tick;
        if (a.mine) {
          for (const e of run.enemies) {
            if (!targetable(e)) continue;
            if (mv.puxa && inside(e.x, e.y, 2) && ENEMY[e.kind].weight !== 'chefe') { const s = (e.x - a.x) * ux + (e.y - a.y) * uy, px = a.x + ux * s, py = a.y + uy * s; e.kbx = (px - e.x) * mv.puxa; e.kby = (py - e.y) * mv.puxa; }
            if (now && inside(e.x, e.y, bodyR(e))) hitE(run, a, e, mv.hit, a.x, a.y, (mv.hit.postura ?? 1) >= 2);
          }
          if (now) damageBreaks(run, (x, y) => inside(x, y, 0.4), a.power * mv.hit.d);
        } else if (inside(p.x, p.y, PR * 0.5)) hitP(run, mv.hit);
        break;
      }
      case 'zona': {
        if (mv.follow && owner) { a.x = owner.x; a.y = owner.y; }
        a.tick -= dt;
        const now = a.tick <= 0;
        if (now) a.tick = mv.tick;
        if (a.mine) {
          for (const e of run.enemies) {
            if (!targetable(e) || Math.hypot(e.x - a.x, e.y - a.y) > a.r + bodyR(e)) continue;
            if (mv.slow) addStatus(e.sb, 'lento', 0.3);
            if (now) hitE(run, a, e, mv.hit, a.x, a.y);
          }
          if (mv.esconde && Math.hypot(p.x - a.x, p.y - a.y) < a.r) p.hidden = Math.max(p.hidden, 0.3);
          if (a.t >= a.life && mv.cura && Math.hypot(p.x - a.x, p.y - a.y) < a.r) { p.hp = Math.min(p.max, p.hp + mv.cura); run.ev.push({ k: 'heal', x: p.x, y: p.y }); }
        } else if (now && Math.hypot(p.x - a.x, p.y - a.y) < a.r + PR * 0.5) hitP(run, mv.hit);
        break;
      }
      case 'chuva': {
        a.tick -= dt;
        if (a.n > 0 && a.tick <= 0) {
          a.tick = mv.every;
          const i = mv.n - a.n;
          let x = a.x, y = a.y;
          if (mv.where === 'alvos') { const list = run.enemies.filter(targetable).sort((e1, e2) => Math.hypot(e1.x - p.x, e1.y - p.y) - Math.hypot(e2.x - p.x, e2.y - p.y)); const e = list[i % Math.max(1, list.length)]; if (e) { x = e.x; y = e.y; } }
          else if (mv.where === 'area') { const s = mv.spread ?? 2; x = a.x + (rand(run) - 0.5) * s * 2; y = a.y + (rand(run) - 0.5) * s * 2; }
          else if (mv.where === 'linha') { const st = mv.step ?? 1.3; x = a.ox + Math.cos(a.ang) * st * (i + 1); y = a.oy + Math.sin(a.ang) * st * (i + 1); }
          const s = inRoom(x, y);
          a.pts.push({ x: s.x, y: s.y, t: mv.where === 'linha' ? 0.05 : mv.where === 'alvo' ? 0.35 : 0.22 });
          a.n--;
        }
        for (const pt of a.pts) { pt.t -= dt; if (pt.t <= 0) burst(run, a, pt.x, pt.y, a.r, mv.hit); }
        a.pts = a.pts.filter(pt => pt.t > 0);
        if (a.n <= 0 && !a.pts.length) a.life = 0;
        break;
      }
      case 'investida': {
        p.lock = Math.max(p.lock, 0.05); p.inv = Math.max(p.inv, 0.12);
        const wall = moveBody(run, p, a.vx, a.vy, dt, PR);
        const ticks = mv.ticks ?? 1;
        for (const e of run.enemies) {
          if (!targetable(e) || Math.hypot(e.x - p.x, e.y - p.y) > a.w / 2 + bodyR(e) + 0.3) continue;
          const cnt = a.hits[e.id] ?? 0, last = a.hits[-1 - e.id] ?? -1;
          if (cnt < ticks && a.t - last >= 0.06) { hitE(run, a, e, mv.hit, p.x - a.vx * 0.05, p.y - a.vy * 0.05); a.hits[e.id] = cnt + 1; a.hits[-1 - e.id] = a.t; }
        }
        if (mv.rastro && a.t - a.n >= 0.04) { a.n = a.t; newAct(run, { t: 0, mv: { m: 'zona', where: 'eu', ...mv.rastro }, mine: true, src: -1, card: a.card, el: a.el, power: a.power, ang: a.ang, tx: p.x, ty: p.y, tgt: -1, charge: 0 }, { m: 'zona', where: 'eu', ...mv.rastro }, p.x, p.y, a.ang, mv.rastro.dur, { r: mv.rastro.r }); }
        if (wall) a.life = 0;
        break;
      }
      case 'rajada': {
        if (!a.mine) { a.life = 0; break; }
        p.lock = Math.max(p.lock, 0.05);
        a.tick -= dt;
        if (a.tick <= 0 && a.n < mv.n) {
          a.tick = mv.every;
          const ang = a.ang + (mv.spin ?? 0) * a.n, last = a.n === mv.n - 1, h = last && mv.fim ? mv.fim : mv.hit;
          run.ev.push({ k: 'swing', x: p.x, y: p.y, ang, arc: mv.arc, range: mv.range, kind: last ? 'final' : 'leve' });
          for (const e of run.enemies) {
            if (!targetable(e)) continue;
            const d = Math.hypot(e.x - p.x, e.y - p.y);
            if (d < mv.range + bodyR(e) && (d < 0.7 || angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang) < mv.arc / 2)) hitE(run, a, e, h, p.x, p.y);
          }
          for (const s of run.shots) if (!s.mine && Math.hypot(s.x - p.x, s.y - p.y) < mv.range) s.life = 0;
          a.n++;
        }
        break;
      }
      case 'orbita': {
        if (!owner) { a.life = 0; break; }
        a.x = owner.x; a.y = owner.y;
        for (let k = 0; k < a.n; k++) {
          const ang = a.t * mv.speed + (k / a.n) * Math.PI * 2, bx = a.x + Math.cos(ang) * a.r, by = a.y + Math.sin(ang) * a.r;
          if (a.mine) {
            for (const e of run.enemies) if (targetable(e) && Math.hypot(e.x - bx, e.y - by) < 0.4 + bodyR(e) && ready(a, e.id)) { hitE(run, a, e, mv.hit, a.x, a.y); a.hits[e.id] = a.t + mv.tick; }
            if (mv.come) for (const s of run.shots) if (!s.mine && Math.hypot(s.x - bx, s.y - by) < 0.5) { s.life = 0; run.ev.push({ k: 'deflect', x: s.x, y: s.y }); }
          } else if (Math.hypot(p.x - bx, p.y - by) < 0.4 + PR) hitP(run, mv.hit);
        }
        if (a.t >= a.life && mv.launch && a.mine) {
          // dispara: cada lâmina vira um tiro que persegue
          for (let k = 0; k < a.n; k++) {
            const ang = a.t * mv.speed + (k / a.n) * Math.PI * 2;
            const q: Pend = { t: 0, mv: { m: 'proj', path: 'persegue', speed: 11, range: 8, r: 0.25, hit: { ...mv.hit, d: mv.hit.d * 2 }, look: mv.look }, mine: true, src: -1, card: a.card, el: a.el, power: a.power, ang, tx: a.x, ty: a.y, tgt: -1, charge: 0 };
            newAct(run, q, q.mv, a.x + Math.cos(ang) * a.r, a.y + Math.sin(ang) * a.r, ang, 8 / 11, { vx: Math.cos(ang) * 11, vy: Math.sin(ang) * 11, r: 0.25 });
          }
        }
        break;
      }
      case 'armadilha': {
        if (a.t < mv.arm) break;
        if (a.mine) { if (run.enemies.some(e => targetable(e) && Math.hypot(e.x - a.x, e.y - a.y) < a.r * 0.7 + bodyR(e))) { burst(run, a, a.x, a.y, a.r, mv.hit); a.life = 0; } }
        else if (Math.hypot(p.x - a.x, p.y - a.y) < a.r * 0.7) { burst(run, a, a.x, a.y, a.r, mv.hit); a.life = 0; }
        break;
      }
      case 'puxar': {
        a.tick -= dt;
        const now = a.tick <= 0;
        if (now) a.tick = 0.3;
        if (a.mine) {
          for (const e of run.enemies) {
            if (!targetable(e)) continue;
            const d = Math.hypot(e.x - a.x, e.y - a.y);
            if (d < a.r && d > 0.3 && ENEMY[e.kind].weight !== 'chefe') { e.kbx = ((a.x - e.x) / d) * mv.force; e.kby = ((a.y - e.y) / d) * mv.force; }
            if (now && mv.hit && d < a.r) hitE(run, a, e, mv.hit, a.x, a.y);
          }
        } else {
          const d = Math.hypot(p.x - a.x, p.y - a.y);
          if (d < a.r && d > 0.3 && p.dash <= 0) moveBody(run, p, ((a.x - p.x) / d) * mv.force * 0.4, ((a.y - p.y) / d) * mv.force * 0.4, dt, PR);
          if (now && mv.hit && d < 0.8) hitP(run, mv.hit);
        }
        break;
      }
      case 'prender': {
        if (a.t >= a.life && mv.crush) {
          if (mv.cr) burst(run, a, a.x, a.y, mv.cr, mv.crush);
          else for (const e of run.enemies) if (a.hits[e.id] && targetable(e)) hitE(run, a, e, mv.crush, a.x, a.y);
        }
        break;
      }
      case 'parar_tiros':
        stopShots(run, p.x, p.y, a.r, mv.mode);
        break;
    }
  }
  run.acts = run.acts.filter(a => a.t < a.life);
}

function stepProj(run: Run, a: Act, mv: M<'proj'>, dt: number) {
  const p = run.p;
  if (a.stuck > 0) {
    // moendo o inimigo (Rasengan)
    const e = run.enemies.find(x => x.id === a.target && targetable(x));
    if (!e) { a.life = 0; return; }
    a.x = e.x; a.y = e.y; a.stuck -= dt; a.tick -= dt;
    if (a.tick <= 0) { a.tick = 0.1; hitE(run, a, e, { ...mv.hit, kb: 0 }, a.x - a.vx, a.y - a.vy); }
    if (a.stuck <= 0) { hitE(run, a, e, { ...mv.hit, d: mv.hit.d * 2.5 }, a.x - a.vx, a.y - a.vy); a.life = 0; }
    return;
  }
  const path = mv.path ?? 'reto';
  const caster = a.mine ? p : run.enemies.find(e => e.id === a.src && e.hp > 0);
  if (path === 'persegue') {
    const tgt = a.mine ? (run.enemies.find(e => e.id === a.target && targetable(e)) ?? nearestEnemy(run, a.x, a.y, 12)) : p;
    if (tgt) {
      if ('id' in tgt) a.target = tgt.id;
      const want = Math.atan2(tgt.y - a.y, tgt.x - a.x), cur = Math.atan2(a.vy, a.vx);
      let diff = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      diff = Math.max(-6 * dt, Math.min(6 * dt, diff));
      a.vx = Math.cos(cur + diff) * mv.speed; a.vy = Math.sin(cur + diff) * mv.speed;
    }
  }
  if (path === 'volta') {
    if (!a.back && a.t >= mv.range / mv.speed) { a.back = true; a.hits = {}; }
    if (a.back) {
      if (!caster) { a.life = 0; return; }
      const dx = caster.x - a.ox, dy = caster.y - a.oy, d = Math.hypot(dx, dy) || 1;
      a.vx = (dx / d) * mv.speed * 1.1; a.vy = (dy / d) * mv.speed * 1.1;
      if (d < 0.6) { a.life = 0; return; }
    }
  }
  const nx = a.ox + a.vx * dt, ny = a.oy + a.vy * dt;
  if (wallAt(run, nx, ny, mv.rompe) && !(path === 'volta' && a.back)) {
    if (a.mine) { const b = run.breaks[run.room].find(b => b.hp > 0 && b.x === Math.floor(nx) && b.y === Math.floor(ny)); if (b) damageBreaks(run, (x, y) => Math.floor(x) === b.x && Math.floor(y) === b.y, a.power * mv.hit.d); }
    if (path === 'quica' && a.bounce > 0) {
      a.bounce--;
      if (wallAt(run, nx, a.oy)) a.vx = -a.vx;
      if (wallAt(run, a.ox, ny)) a.vy = -a.vy;
      a.hits = {};
      return;
    }
    if (path === 'volta') { a.back = true; a.hits = {}; return; }
    if (mv.blast) burst(run, a, a.x, a.y, mv.blast, mv.hit);
    if (mv.abre) newAct(run, { t: 0, mv: { m: 'zona', where: 'eu', ...mv.abre }, mine: a.mine, src: a.src, card: a.card, el: a.el, power: a.power, ang: a.ang, tx: a.x, ty: a.y, tgt: -1, charge: 0 }, { m: 'zona', where: 'eu', ...mv.abre }, a.x, a.y, a.ang, mv.abre.dur, { r: mv.abre.r });
    a.life = 0;
    return;
  }
  if (mv.rompe && a.mine) damageBreaks(run, (x, y) => Math.hypot(x - nx, y - ny) < a.r + 0.4, 999);
  a.ox = nx; a.oy = ny;
  const ux = Math.cos(a.ang), uy = Math.sin(a.ang);
  if (path === 'onda') { const o = Math.sin(a.t * 9) * 0.7; a.x = a.ox - uy * o; a.y = a.oy + ux * o; }
  else if (path === 'espiral') { const c = Math.cos(a.t * 11) * 0.6, s = Math.sin(a.t * 11) * 0.3; a.x = a.ox - uy * c + ux * s; a.y = a.oy + ux * c + uy * s; }
  else { a.x = a.ox; a.y = a.oy; }
  if (mv.come && a.mine) for (const s of run.shots) if (!s.mine && Math.hypot(s.x - a.x, s.y - a.y) < a.r + 0.25) { s.life = 0; run.ev.push({ k: 'deflect', x: s.x, y: s.y }); }
  if (a.mine) {
    const e = run.enemies.find(x => targetable(x) && a.hits[x.id] === undefined && Math.hypot(x.x - a.x, x.y - a.y) < bodyR(x) + a.r);
    if (!e) return;
    if (mv.moe) { a.stuck = mv.moe; a.target = e.id; a.tick = 0; return; }
    if (mv.blast) { burst(run, a, a.x, a.y, mv.blast * (1 + a.charge * 0.5), mv.hit); a.life = 0; return; }
    hitE(run, a, e, mv.hit, a.x - a.vx * 0.05, a.y - a.vy * 0.05, (mv.hit.postura ?? 1) >= 2);
    if (mv.abre) { newAct(run, { t: 0, mv: { m: 'zona', where: 'eu', ...mv.abre }, mine: true, src: -1, card: a.card, el: a.el, power: a.power, ang: a.ang, tx: e.x, ty: e.y, tgt: -1, charge: 0 }, { m: 'zona', where: 'eu', ...mv.abre }, e.x, e.y, a.ang, mv.abre.dur, { r: mv.abre.r }); a.life = 0; return; }
    if (mv.split) {
      for (let k = 0; k < mv.split; k++) {
        const ang = (k / mv.split) * Math.PI * 2;
        const q: Pend = { t: 0, mv: { m: 'proj', speed: 10, range: 3, r: 0.2, hit: { ...mv.hit, d: mv.hit.d * 0.3 }, pierce: true, look: mv.look }, mine: true, src: -1, card: a.card, el: a.el, power: a.power, ang, tx: e.x, ty: e.y, tgt: -1, charge: 0 };
        const s = newAct(run, q, q.mv, e.x, e.y, ang, 0.3, { vx: Math.cos(ang) * 10, vy: Math.sin(ang) * 10, r: 0.2 });
        s.hits[e.id] = 1e9;
      }
      a.life = 0; return;
    }
    if (mv.pierce) a.hits[e.id] = 1e9; else a.life = 0;
  } else if (Math.hypot(p.x - a.x, p.y - a.y) < PR + a.r) {
    if (mv.blast) { burst(run, a, a.x, a.y, mv.blast, mv.hit); a.life = 0; return; }
    if (hitP(run, mv.hit) && !mv.pierce) a.life = 0;
  }
}

// ─── transformação ──────────────────────────────────────────────────────────

export function stepForm(run: Run, dt: number, moving: boolean) {
  const p = run.p, f = p.form;
  if (!f) return;
  f.t -= dt;
  const src = { mine: true, power: f.power, el: f.el, card: f.card };
  if (f.stomp && moving) {
    f.stompT -= dt;
    if (f.stompT <= 0) { f.stompT = f.stomp.every; burst(run, src, p.x, p.y + 0.2, f.stomp.r, f.stomp.hit); }
  }
  if (f.aura) {
    f.auraT -= dt;
    if (f.auraT <= 0) {
      f.auraT = f.aura.tick;
      for (const e of run.enemies) if (targetable(e) && Math.hypot(e.x - p.x, e.y - p.y) < f.aura.r + bodyR(e)) hitE(run, src, e, f.aura.hit, p.x, p.y);
    }
  }
  if (f.paraTiros) for (const s of run.shots) if (!s.mine && Math.hypot(s.x - p.x, s.y - p.y) < 2.2) s.frozen = Math.max(s.frozen ?? 0, 0.2);
  if (f.t <= 0) endForm(run);
}
export function endForm(run: Run) {
  const p = run.p, f = p.form;
  if (!f) return;
  p.form = undefined;
  if (f.fim) burst(run, { mine: true, power: f.power, el: f.el, card: f.card }, p.x, p.y, f.fim.r, f.fim.hit);
  if (f.cansa) addStatus(p.sb, 'lento', f.cansa);
  run.ev.push({ k: 'forma', form: f.form, on: false });
}
/** Golpe da arma na transformação Bankai: solta uma meia-lua. */
export function formShot(run: Run, ang: number) {
  const p = run.p, f = p.form;
  if (!f?.tiro) return;
  const q: Pend = { t: 0, mv: { m: 'proj', speed: 11, range: 6, r: 0.55, hit: f.tiro, pierce: true, look: 'lua' }, mine: true, src: -1, card: f.card, el: f.el, power: f.power, ang, tx: p.x, ty: p.y, tgt: -1, charge: 0 };
  newAct(run, q, q.mv, p.x + Math.cos(ang) * 0.5, p.y + Math.sin(ang) * 0.5, ang, 6 / 11, { vx: Math.cos(ang) * 11, vy: Math.sin(ang) * 11, r: 0.55 });
}

// ─── aliados (sombras do Arise e invocações) ────────────────────────────────

export function stepAllies(run: Run, dt: number) {
  const p = run.p;
  for (const a of run.allies) {
    if (a.life !== undefined) a.life -= dt;
    a.cd = Math.max(0, a.cd - dt); a.atk = Math.max(0, a.atk - dt);
    if (a.kind === 'clone') continue;
    const e = nearestEnemy(run, a.x, a.y, a.kind === 'torreta' || a.kind === 'mago' ? (a.range ?? 7) + 1 : 12);
    const ranged = a.kind === 'arqueira' || a.kind === 'mago' || a.kind === 'torreta';
    const gx = e ? e.x : p.x - 1, gy = e ? e.y : p.y + 1;
    const dx = gx - a.x, dy = gy - a.y, d = Math.hypot(dx, dy) || 1;
    const keep = ranged && e ? (a.range ?? 4) * 0.7 : a.kind === 'tanque' ? 0.9 : 1;
    const speed = a.kind === 'tanque' ? 2.6 : a.kind === 'inseto' ? 5 : a.kind === 'formiga' ? 4.4 : 3.4;
    if (a.kind !== 'torreta' && d > keep) moveBody(run, a, (dx / d) * speed, (dy / d) * speed, dt, 0.3, a.kind === 'inseto');
    if (!e || a.cd > 0) continue;
    const base = a.dmg ?? 6 * (1 + run.rank * 0.5);
    const hit: Hit = a.hit ?? { d: 1 };
    const el: Element = a.el ?? 'Dark';
    if (ranged && d < (a.range ?? 9)) {
      run.shots.push({ id: run.seq++, x: a.x, y: a.y, vx: (dx / d) * 11, vy: (dy / d) * 11, mine: true, life: 1, dmg: a.kind === 'arqueira' ? base * 0.8 : base, r: 0.14, hits: [], kind: a.kind === 'arqueira' ? 'flecha' : 'magia', el, st: hit.st });
      a.cd = a.kind === 'arqueira' ? 0.9 : a.every ?? 1; a.atk = 0.2;
    }
    if (!ranged && d < (a.range ?? 1.4)) {
      damageEnemy(run, e, a.kind === 'tanque' ? base * 0.6 : base, { el, hit: a.hit ? { ...hit, d: 1 } : undefined, card: a.card, canCrit: false, fx: a.x, fy: a.y, me: !!a.card });
      a.cd = a.every ?? (a.kind === 'tanque' ? 1.1 : 0.75); a.atk = 0.2;
    }
  }
  run.allies = run.allies.filter(a => a.life === undefined || a.life > 0);
}

// ─── carta de inimigo: aviso no chão ────────────────────────────────────────

/** Avisos das peças do kit da carta do inimigo (`t` = tempo até a carta sair). */
export function telegraphKit(run: Run, e: Enemy, kit: Kit, ang: number, tx: number, ty: number, t: number) {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  for (const mv of kit.moves) {
    const tt = warnT(run, t + (mv.at ?? 0)), a2 = ang + (mv.off ?? 0), vx = Math.cos(a2), vy = Math.sin(a2);
    const where = (w: 'eu' | 'alvo' | 'frente') => (w === 'eu' ? { x: e.x, y: e.y } : w === 'alvo' ? inRoom(tx, ty) : inRoom(e.x + ux * 2.2, e.y + uy * 2.2));
    switch (mv.m) {
      case 'proj': case 'tornado': warnLine(run, e.id, e.x, e.y, e.x + vx * Math.min(9, mv.range), e.y + vy * Math.min(9, mv.range), Math.max(0.25, mv.r), tt, 0); break;
      case 'raio': warnLine(run, e.id, e.x, e.y, e.x + vx * Math.min(12, mv.len), e.y + vy * Math.min(12, mv.len), Math.max(0.25, (mv.cone ?? mv.w) / 2), tt, 0); break;
      case 'investida': warnLine(run, e.id, e.x, e.y, e.x + vx * mv.len, e.y + vy * mv.len, 0.5, tt, 0); break;
      case 'zona': { const w = where(mv.where); warnCircle(run, e.id, w.x, w.y, mv.r, tt, 0); break; }
      case 'area': { const w = where(mv.where); warnCircle(run, e.id, w.x, w.y, mv.r, tt, heartsOf(mv.hit), mv.hit.st); break; }
      case 'golpe': case 'rajada': warnCircle(run, e.id, e.x + vx * mv.range * 0.5, e.y + vy * mv.range * 0.5, Math.max(0.9, mv.range * 0.6), tt, heartsOf(mv.hit), mv.hit.st); break;
      case 'empurrar': warnCircle(run, e.id, e.x, e.y, mv.r, tt, heartsOf(mv.hit), mv.hit.st); break;
      case 'prender': { const w = where(mv.where === 'area' ? 'eu' : 'alvo'); warnCircle(run, e.id, w.x, w.y, Math.max(1, mv.r), tt, mv.crush ? heartsOf(mv.crush) : 0, 'preso'); break; }
      case 'cadeia': warnLine(run, e.id, e.x, e.y, tx, ty, 0.35, tt, heartsOf(mv.hit), 'eletrizado'); break;
      case 'chuva': {
        const n = Math.min(4, mv.n);
        for (let k = 0; k < n; k++) {
          const x = mv.where === 'linha' ? e.x + ux * (mv.step ?? 1.3) * (k + 1) : mv.where === 'area' ? tx + (rand(run) - 0.5) * (mv.spread ?? 2) * 2 : tx + (k ? (rand(run) - 0.5) * 2.4 : 0);
          const y = mv.where === 'linha' ? e.y + uy * (mv.step ?? 1.3) * (k + 1) : mv.where === 'area' ? ty + (rand(run) - 0.5) * (mv.spread ?? 2) * 2 : ty + (k ? (rand(run) - 0.5) * 2.4 : 0);
          const s = inRoom(x, y);
          warnCircle(run, e.id, s.x, s.y, Math.max(0.8, mv.r), tt + k * Math.min(0.25, mv.every), heartsOf(mv.hit), mv.hit.st);
        }
        break;
      }
      case 'orbita': warnCircle(run, e.id, e.x, e.y, mv.r + 0.4, tt, 0); break;
      case 'armadilha': case 'puxar': { const w = where(mv.where); warnCircle(run, e.id, w.x, w.y, mv.r, tt, 0); break; }
      default: break;
    }
  }
}
/** O inimigo começa a usar uma carta: ela vira em cima da cabeça e os avisos aparecem. */
export function enemyCard(run: Run, e: Enemy) {
  const card = e.cards[Math.floor(rand(run) * e.cards.length)];
  const kit = kitOf(card);
  if (!kit) { e.cardCd = 99; return; }
  const tg = targetOf(run, e);
  const blind = hasSt(e.sb, 'cego') ? (rand(run) - 0.5) * 2.4 : 0;
  const ang = Math.atan2(tg.y - e.y, tg.x - e.x) + blind;
  const t = flipTime(run, kit);
  e.state = 'card'; e.st = t; e.card = card; e.cax = tg.x; e.cay = tg.y; e.face = ang;
  telegraphKit(run, e, kit, ang, tg.x, tg.y, t);
  run.ev.push({ k: 'cardflip', x: e.x, y: e.y, card });
}

/** Tempo extra da carta virando quando o kit tem cena. */
export const flipTime = (run: Run, kit: Kit) => warnT(run, 0.85) + (kit.moves.some(m => m.m === 'cinematica') ? 0.4 : 0);

export { segDist };
