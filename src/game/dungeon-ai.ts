// Inimigos da masmorra. Todo golpe tem AVISO no chão antes (círculo ou linha
// vermelha que enche). Peso e postura: o leve voa longe, o pesado mal mexe;
// postura quebrada = atordoado e leva +50%. ELITES (campeões do Soul Knight):
// maiores, com aura e um modificador (Veloz, Blindado, Explosivo, Vampiro,
// Gêmeo, Refletor, Gelado, Venenoso, Fantasma). Inimigos com CARTA: a carta
// vira em cima da cabeça (~0,8 s) e o kit sai com aviso (dungeon-cast.ts).
// Perigos no chão: espinhos, veneno, gelo, lava (e os rastros das elites).
import { kitOf } from './dungeon-kits';
import { addStatus, canAttack, hasSt, speedOf } from './dungeon-moves';
import {
  angDiff, ARROW, areaHit, PERFECT, blocked, bodyR, breakDrop, damageEnemy, ENEMY, ESHOT, hurtPlayer, inRoom, KB_MULT, moveBody, newEnemy, PR, rand, roomOf,
  playerStatus, segDist, targetable, tickStatuses, warnCircle, warnLine, warnT, targetOf, enemyShot, addTrail, type Enemy, type Run,
} from './dungeon-core';
import { enemyCard, fireKit, stopShots } from './dungeon-cast';
import { BOSS_ACTS, BOSS_WARN, stepBoss } from './dungeon-boss';
import { isBoss, solidAt, spikeState } from './dungeon-map';

/** Um passo de um inimigo. */
export function stepEnemy(run: Run, e: Enemy, dt: number) {
  const p = run.p;
  e.t += dt; e.hit = Math.max(0, e.hit - dt);
  e.eliteOff = Math.max(0, e.eliteOff - dt); e.broken = Math.max(0, e.broken - dt); e.immune = Math.max(0, e.immune - dt);
  if (e.life !== undefined) { e.life -= dt; if (e.life <= 0) { e.hp = 0; return; } }
  e.poiseT -= dt;
  if (e.poiseT <= 0 && e.poise < e.poiseMax) e.poise = Math.min(e.poiseMax, e.poise + e.poiseMax * dt * 0.6);
  tickStatuses(run, e, dt);
  // empurrão (e bater na parede machuca)
  const kv = Math.hypot(e.kbx, e.kby);
  if (kv > 0.3) {
    const wall = moveBody(run, e, e.kbx, e.kby, dt, bodyR(e) * 0.8, ENEMY[e.kind].fly);
    if (wall && kv > 5 && !isBoss(e.kind)) {
      const d = Math.round(e.max * 0.1 + kv);
      e.hp -= d; addStatus(e.sb, 'atordoado', 0.5);
      run.ev.push({ k: 'parede', x: e.x, y: e.y }); run.ev.push({ k: 'hit', x: e.x, y: e.y, dmg: d, crit: false });
      e.kbx = 0; e.kby = 0;
    }
    const k = Math.exp(-8 * dt); e.kbx *= k; e.kby *= k;
  } else { e.kbx = 0; e.kby = 0; }
  // elites que deixam rastro e o fantasma
  if (e.elite && e.eliteOff <= 0) {
    if ((e.elite === 'gelado' || e.elite === 'venenoso') && Math.floor(e.t * 2) !== Math.floor((e.t - dt) * 2)) addTrail(run, e.x, e.y, e.elite === 'gelado' ? 'gelo' : 'veneno', 4);
    if (e.elite === 'fantasma') {
      if (e.ghost > 0) {
        e.ghost -= dt;
        if (e.ghost <= 0) { const a = rand(run) * Math.PI * 2, s = inRoom(p.x + Math.cos(a) * 2.2, p.y + Math.sin(a) * 2.2); if (!blocked(run, s.x, s.y, 0.3)) { e.x = s.x; e.y = s.y; } warnCircle(run, e.id, e.x, e.y, 1.1, warnT(run, 0.55), 1); }
        return;
      }
      if (e.t % 5 < dt && e.t > 1) e.ghost = 1.2;
    }
    if (e.elite === 'refletor') e.aux2 = (e.t % 5) < 1.8 ? 1 : 0;
  }
  if (isBoss(e.kind)) { stepBoss(run, e, dt); return; }
  if (!canAttack(e.sb) && (hasSt(e.sb, 'congelado') || hasSt(e.sb, 'atordoado'))) { e.state = e.state === 'under' ? 'under' : 'move'; return; }

  const slowK = speedOf(e.sb) * (e.elite === 'veloz' && e.eliteOff <= 0 ? 1.6 : 1) * (e.enraged ? 1.3 : 1);
  const cdK = (hasSt(e.sb, 'lento') ? 0.5 : 1) * (e.elite === 'veloz' && e.eliteOff <= 0 ? 1.25 : 1) * (1 + run.rank * 0.07);
  e.cd -= dt * cdK; e.cardCd -= dt * cdK;
  const tg = targetOf(run, e);
  const blind = hasSt(e.sb, 'cego');
  const dx = tg.x - e.x, dy = tg.y - e.y, dist = Math.hypot(dx, dy), d = dist || 1, sp = ENEMY[e.kind].speed * slowK, rad = bodyR(e) * 0.8;
  const chase = (k = 1) => moveBody(run, e, (dx / d) * sp * k, (dy / d) * sp * k, dt, rad, ENEMY[e.kind].fly);
  const aim = Math.atan2(dy, dx) + (blind ? (rand(run) - 0.5) * 2 : 0);
  const atk = canAttack(e.sb);

  // carta virando: quando acaba, o kit sai
  if (e.state === 'card') {
    e.st -= dt;
    if (e.st <= 0 || !e.card) {
      const kit = e.card ? kitOf(e.card) : undefined;
      if (kit) fireKit(run, kit, { mine: false, src: e.id, card: e.card!, el: 'Dark', power: 0, ang: Math.atan2(e.cay - e.y, e.cax - e.x), tx: e.cax, ty: e.cay, tgt: -1, charge: 0, extra: false });
      e.state = 'move'; e.card = undefined; e.cardCd = 6 + rand(run) * 3 - Math.min(2, run.rank * 0.3); e.cd = Math.max(e.cd, 0.8);
    }
    return;
  }
  // golpe avisado: quando o aviso acaba, a tela mostra o golpe e o dano é do aviso (resolveWarns)
  if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) e.state = 'move'; return; }
  if (e.state === 'dash') {
    e.st -= dt;
    const hitWall = moveBody(run, e, e.vx, e.vy, dt, rad);
    if (Math.hypot(p.x - e.x, p.y - e.y) < bodyR(e) + PR && hurtPlayer(run, 1) && e.elite === 'vampiro') e.hp = Math.min(e.max, e.hp + e.max * 0.2);
    if (e.st <= 0 || hitWall) e.state = 'move';
    return;
  }
  if (e.cards.length && atk && e.cardCd <= 0 && dist < 9.5 && run.p.hidden <= 0) { enemyCard(run, e); return; }

  switch (e.kind) {
    case 'goblin': case 'minion': {
      if (dist > 1.1) chase();
      if (e.kind === 'goblin' && atk && dist < 1.6 && e.cd <= 0) {
        const fx = e.x + Math.cos(aim) * 0.8, fy = e.y + Math.sin(aim) * 0.8;
        const t = warnT(run, 0.5);
        warnCircle(run, e.id, fx, fy, 0.95, t, 1); e.state = 'wind'; e.st = t; e.cd = 1.25;
      }
      break;
    }
    case 'arqueiro': {
      const want = d < 4 ? -1 : d > 6.5 ? 1 : 0;
      moveBody(run, e, (dx / d) * sp * want + (-dy / d) * sp * 0.4, (dy / d) * sp * want + (dx / d) * sp * 0.4, dt, rad);
      if (atk && e.cd <= 0 && dist < 11) {
        const t = warnT(run, 0.6);
        warnLine(run, e.id, e.x, e.y, e.x + Math.cos(aim) * 11, e.y + Math.sin(aim) * 11, 0.2, t, 0);
        e.state = 'wind'; e.st = t; e.cd = 1.8; e.vx = Math.cos(aim); e.vy = Math.sin(aim); e.act = 'flecha';
      }
      break;
    }
    case 'xama': case 'mago': {
      const want = d < 4.5 ? -1 : d > 7 ? 1 : 0;
      moveBody(run, e, (dx / d) * sp * want, (dy / d) * sp * want, dt, rad);
      if (atk && e.cd <= 0) {
        const hurt = e.kind === 'xama' && run.enemies.find(o => o !== e && o.hp > 0 && o.hp < o.max * 0.7 && Math.hypot(o.x - e.x, o.y - e.y) < 4.5);
        if (hurt) { hurt.hp = Math.min(hurt.max, hurt.hp + hurt.max * 0.3); run.ev.push({ k: 'heal', x: hurt.x, y: hurt.y }); e.cd = 3.2; }
        else { const t = warnT(run, 0.45); warnCircle(run, e.id, e.x, e.y, 0.6, t, 0); e.state = 'wind'; e.st = t; e.cd = e.kind === 'mago' ? 3 : 2.6; e.vx = Math.cos(aim); e.vy = Math.sin(aim); e.act = e.kind === 'mago' ? 'magia' : 'orbes'; }
      }
      break;
    }
    case 'slime': case 'slimeP': {
      // pula em direção ao jogador; encostar machuca
      if ((e.t % 1.2) < 0.45) chase(1.6);
      break;
    }
    case 'morcego': case 'espirito':
      moveBody(run, e, (dx / d) * sp + Math.cos(e.t * 6 + e.id) * 1.8, (dy / d) * sp + Math.sin(e.t * 6 + e.id) * 1.8, dt, 0.25, true);
      break;
    case 'lobo': {
      if (dist > 2) chase(0.6);
      if (atk && dist < 6.5 && e.cd <= 0) {
        // rosna (linha vermelha) e depois avança em linha reta
        const len = Math.min(7, dist + 1.5), t = warnT(run, 0.7);
        warnLine(run, e.id, e.x, e.y, e.x + Math.cos(aim) * len, e.y + Math.sin(aim) * len, 0.45, t, 0);
        e.state = 'wind'; e.st = t; e.cd = 2.6; e.vx = Math.cos(aim) * 13; e.vy = Math.sin(aim) * 13; e.act = 'avanco';
      }
      break;
    }
    case 'golem': {
      if (dist > 1.5) chase();
      if (atk && dist < 3 && e.cd <= 0) { const t = warnT(run, 0.95); warnCircle(run, e.id, e.x, e.y, 2.4, t, 2); e.state = 'wind'; e.st = t; e.cd = 3; }
      break;
    }
    case 'escudeiro': {
      // o escudo vira devagar para o caçador: pegue pelo lado
      const want = Math.atan2(dy, dx), diff = ((want - e.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      e.face += Math.max(-1.6 * dt, Math.min(1.6 * dt, diff));
      if (dist > 1.4) chase(0.8);
      if (atk && dist < 2.6 && e.cd <= 0) {
        const t = warnT(run, 0.6);
        warnLine(run, e.id, e.x, e.y, e.x + Math.cos(e.face) * 2.6, e.y + Math.sin(e.face) * 2.6, 0.55, t, 0);
        e.state = 'wind'; e.st = t; e.cd = 2.4; e.vx = Math.cos(e.face) * 9; e.vy = Math.sin(e.face) * 9; e.act = 'avanco';
      }
      break;
    }
    case 'bombardeiro': {
      const want = d < 4 ? -1 : d > 6 ? 1 : 0;
      moveBody(run, e, (dx / d) * sp * want + (dy / d) * sp * 0.3, (dy / d) * sp * want - (dx / d) * sp * 0.3, dt, rad);
      if (atk && e.cd <= 0 && dist < 9) {
        const t = warnT(run, 1.05), tx = tg.x + (blind ? (rand(run) - 0.5) * 3 : 0), ty = tg.y + (blind ? (rand(run) - 0.5) * 3 : 0);
        warnCircle(run, e.id, tx, ty, 1.3, t, 1, 'queimar');
        // a bomba voa por cima (só desenho)
        run.shots.push({ id: run.seq++, x: e.x, y: e.y, vx: (tx - e.x) / t, vy: (ty - e.y) / t, mine: false, life: t, dmg: 0, r: 0, kind: 'bomba', ox: e.x, oy: e.y });
        e.cd = 2.8;
      }
      break;
    }
    case 'invocador': {
      const want = d < 6 ? -1 : d > 8 ? 1 : 0;
      moveBody(run, e, (dx / d) * sp * want, (dy / d) * sp * want, dt, rad);
      if (atk && e.cd <= 0 && run.enemies.length < 11) {
        const t = warnT(run, 0.9);
        for (const o of [-1, 1]) { const s = inRoom(e.x + o * 1.4, e.y + 0.6); warnCircle(run, e.id, s.x, s.y, 0.6, t, 0); }
        e.state = 'wind'; e.st = t; e.act = 'chamar'; e.cd = 6;
      }
      break;
    }
    case 'cavador': {
      // fica embaixo da terra andando até você; sai com aviso e fica exposto
      if (e.state === 'under') {
        chase(1.3); e.st -= dt;
        if (e.st <= 0) { const t = warnT(run, 0.6); warnCircle(run, e.id, e.x, e.y, 1.1, t, 1); e.state = 'wind'; e.st = t; e.act = 'emerge'; }
        break;
      }
      if (dist > 1.2) chase(0.5);
      if (e.cd <= 0) { e.state = 'under'; e.st = 1.8 + rand(run); e.cd = 4.5; }
      break;
    }
    case 'planta': {
      if (atk && e.cd <= 0 && dist < 10) { const t = warnT(run, 0.5); warnCircle(run, e.id, e.x, e.y, 0.5, t, 0); e.state = 'wind'; e.st = t; e.vx = Math.cos(aim); e.vy = Math.sin(aim); e.act = 'folhas'; e.cd = 2.6; }
      break;
    }
    case 'sombraP': {
      if (dist > 2) chase(); else moveBody(run, e, (-dy / d) * sp, (dx / d) * sp, dt, rad);
      if (atk && dist < 1.8 && e.cd <= 0) { const t = warnT(run, 0.45); warnCircle(run, e.id, e.x + Math.cos(aim) * 0.8, e.y + Math.sin(aim) * 0.8, 1, t, 1); e.state = 'wind'; e.st = t; e.cd = 1.4; }
      break;
    }
    default: break;
  }
  if (ENEMY[e.kind].touch && dist < bodyR(e) + PR && tg === p && targetable(e)) { if (hurtPlayer(run, 1) && e.elite === 'vampiro') e.hp = Math.min(e.max, e.hp + e.max * 0.2); }
}

/** O aviso acabou: aplica o golpe (dano do aviso) e solta o tiro/investida do inimigo dono. */
export function resolveWarns(run: Run, dt: number) {
  const p = run.p;
  for (const w of run.warns) {
    w.t -= dt;
    if (w.st === 'marcado' && w.t > 0.3) { w.x = p.x; w.y = p.y; w.x2 = p.x; w.y2 = p.y; }
    if (w.t > 0) continue;
    const inAt = (x: number, y: number) => (w.kind === 'circle' ? Math.hypot(x - w.x, y - w.y) < w.r + PR * 0.5 : segDist(x, y, w.x, w.y, w.x2, w.y2) < w.r + PR * 0.5);
    const inside = inAt(p.x, p.y);
    // esquiva perfeita: começou a esquiva DENTRO do golpe, no último instante
    if ((w.dmg > 0 || w.st) && p.dashAge < PERFECT && !p.perfectUsed && inAt(p.dsx, p.dsy)) {
      p.perfectUsed = true; p.perfect = true; run.slow = 0.6;
      run.ev.push({ k: 'perfeita', x: p.x, y: p.y });
      continue;
    }
    const owner = run.enemies.find(e => e.id === w.src && e.hp > 0);
    if (inside && (w.dmg > 0 || w.st)) {
      const hurt = w.dmg > 0 ? hurtPlayer(run, w.dmg, { st: w.st }) : false;
      if (!hurt && w.dmg <= 0 && w.st && p.dash <= 0 && p.inv <= 0) playerStatus(run, w.st);
      if (hurt && owner?.elite === 'vampiro') owner.hp = Math.min(owner.max, owner.hp + owner.max * 0.2);
    }
    if (w.src === -2) {
      // barril explosivo: pega inimigos e outros barris
      areaHit(run, w.x, w.y, w.r, 30 + run.rank * 12, { el: 'Fire', hit: { d: 0, st: 'queimar', sd: 3 }, fx: w.x, fy: w.y, kb: 8 });
    }
    if (!owner || !owner.act) continue;
    const act = owner.act; owner.act = undefined;
    const a = Math.atan2(owner.vy, owner.vx);
    if (act === 'flecha') enemyShot(run, owner.x, owner.y, a, ARROW, 'flecha');
    if (act === 'orbes') for (const o of [-0.35, 0, 0.35]) enemyShot(run, owner.x, owner.y, a + o, ESHOT * 0.75);
    if (act === 'magia') for (const o of [-0.15, 0.15]) enemyShot(run, owner.x, owner.y, a + o, ESHOT * 0.9, 'magia');
    if (act === 'folhas') for (const o of [-0.4, 0, 0.4]) enemyShot(run, owner.x, owner.y, a + o, ESHOT * 0.8, 'folha');
    if (act === 'avanco') { owner.state = 'dash'; owner.st = owner.kind === 'escudeiro' ? 0.3 : 0.55; }
    if (act === 'chamar') for (const o of [-1, 1]) { const s = inRoom(owner.x + o * 1.4, owner.y + 0.6); run.enemies.push(newEnemy(run, run.rank >= 3 ? 'morcego' : 'slimeP', s.x, s.y, { minion: true })); }
    if (act === 'emerge') owner.state = 'move';
    if (act.startsWith('boss:')) BOSS_ACTS[act.slice(5)]?.(run, owner);
  }
  for (const w of run.warns) if (w.t <= 0) { const o = run.enemies.find(e => e.id === w.src); if (o && BOSS_WARN[o.kind]) BOSS_WARN[o.kind]!(run, o, w); }
  run.warns = run.warns.filter(w => w.t > 0);
}

/** Inimigo caiu: o que acontece (slime vira dois, explosivo explode, gêmeo divide, sombra levanta). */
export function onEnemyDeath(run: Run, e: Enemy) {
  if (e.kind === 'slime') for (const o of [-0.4, 0.4]) run.enemies.push(newEnemy(run, 'slimeP', e.x + o, e.y));
  if (e.elite && e.eliteOff <= 0) {
    if (e.elite === 'explosivo') warnCircle(run, -3, e.x, e.y, 2, warnT(run, 0.8), 1, 'queimar');
    if (e.elite === 'gemeo') for (const o of [-0.5, 0.5]) { const t = newEnemy(run, e.kind, e.x + o, e.y); t.hp = t.max = Math.max(5, Math.round(e.max * 0.35 / 2.2)); t.scale = 0.85; run.enemies.push(t); }
  }
  // Ceifador: quem cai levanta como sombra por 5 s
  if (run.reap > 0 && !isBoss(e.kind)) run.allies.push({ id: run.seq++, kind: 'levantado', x: e.x, y: e.y, cd: 0.2, atk: 0, life: 5, dmg: 10 + run.rank * 6 });
  // no castelo do Monarca, quem cai deixa uma sombra que levanta se ninguém pisar
  if (run.enemies.some(b => b.kind === 'monarca' && b.hp > 0) && e.kind !== 'sombraP' && !isBoss(e.kind)) run.corpses.push({ id: run.seq++, x: e.x, y: e.y, t: 2.5 });
}

/** Tiros (do caçador e dos inimigos). */
export function stepShots(run: Run, dt: number, dtMe: number) {
  const room = roomOf(run), p = run.p;
  for (const s of run.shots) {
    const sdt = s.mine ? dtMe : dt;
    if (s.frozen && s.frozen > 0) { s.frozen -= sdt; if (s.frozen <= 0) s.life = 0; continue; }
    s.x += s.vx * sdt; s.y += s.vy * sdt; s.life -= sdt;
    if (s.kind === 'bomba') continue;
    const tx = Math.floor(s.x), ty = Math.floor(s.y);
    if (solidAt(room, tx, ty, false, run.breaks[run.room])) {
      if (s.mine) { const b = run.breaks[run.room].find(b => b.hp > 0 && b.x === tx && b.y === ty); if (b) { b.hp -= s.dmg; if (b.hp <= 0) breakDrop(run, b); } }
      if (s.blast && s.mine) areaHit(run, s.x, s.y, s.blast, s.dmg, { el: s.el, me: true, fx: s.x, fy: s.y });
      s.life = 0;
    }
    if (s.life <= 0) continue;
    if (s.mine) {
      const e = run.enemies.find(x => targetable(x) && !s.hits?.includes(x.id) && Math.hypot(x.x - s.x, x.y - s.y) < bodyR(x) + s.r);
      if (!e) continue;
      // refletor devolve; escudeiro segura de frente
      if (e.elite === 'refletor' && e.eliteOff <= 0 && e.aux2 > 0) { s.mine = false; s.vx = -s.vx; s.vy = -s.vy; s.dmg = 1; s.hits = []; run.ev.push({ k: 'deflect', x: s.x, y: s.y }); continue; }
      if (e.kind === 'escudeiro' && e.broken <= 0 && angDiff(Math.atan2(s.y - e.y, s.x - e.x), e.face) < 1.05 && !s.pierce) { s.life = 0; run.ev.push({ k: 'deflect', x: s.x, y: s.y }); continue; }
      if (s.blast) { areaHit(run, s.x, s.y, s.blast, s.dmg, { el: s.el, me: true, fx: s.x, fy: s.y }); s.life = 0; continue; }
      damageEnemy(run, e, s.dmg, { el: s.el, hit: s.st ? { d: 1, st: s.st, sd: 3 } : undefined, fx: s.x - s.vx * 0.05, fy: s.y - s.vy * 0.05, me: true, kb: 1.5 });
      if (s.pierce) s.hits?.push(e.id); else s.life = 0;
    } else if (Math.hypot(p.x - s.x, p.y - s.y) < PR + s.r && s.dmg > 0) {
      if (hurtPlayer(run, s.dmg, { st: s.st })) s.life = 0;
    }
  }
  run.shots = run.shots.filter(s => s.life > 0);
}

/** Perigos do chão no caçador e nos inimigos. */
export function stepHazards(run: Run, dt: number) {
  const p = run.p, room = roomOf(run);
  run.trail = run.trail.filter(h => (h.t -= dt) > 0);
  const tx = Math.floor(p.x), ty = Math.floor(p.y);
  const here = [...room.haz.filter(h => h.x === tx && h.y === ty), ...run.trail.filter(h => h.x === tx && h.y === ty)];
  const fly = !!p.form?.voa || p.dash > 0;
  let ice = false;
  for (const h of here) {
    if (h.kind === 'gelo') ice = true;
    if (fly) continue;
    if (h.kind === 'espinho' && spikeState(h, run.t) === 'alto') hurtPlayer(run, 1);
    if (h.kind === 'lava') hurtPlayer(run, 1, { st: 'queimar' });
    if (h.kind === 'veneno' && Math.floor(run.t) !== Math.floor(run.t - dt)) { addStatus(p.sb, 'veneno', 4); run.ev.push({ k: 'status', x: p.x, y: p.y, st: 'veneno' }); }
  }
  run.onIce = ice && !p.form?.voa;
  // inimigos (menos os que voam): espinho e lava machucam, veneno envenena
  for (const e of run.enemies) {
    if (ENEMY[e.kind].fly || isBoss(e.kind) || !targetable(e)) continue;
    const ex = Math.floor(e.x), ey = Math.floor(e.y);
    for (const h of [...room.haz, ...run.trail]) {
      if (h.x !== ex || h.y !== ey) continue;
      if ((h.kind === 'espinho' && spikeState(h, run.t) === 'alto') || h.kind === 'lava') e.hp -= e.max * 0.25 * dt;
      if (h.kind === 'veneno' && Math.floor(run.t) !== Math.floor(run.t - dt)) addStatus(e.sb, 'veneno', 3, 2 + run.rank);
    }
  }
}
export { KB_MULT, stopShots };
