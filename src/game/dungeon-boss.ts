// Os 6 chefes dos portais, cada um com a sua mecânica. Valem para todos: 3
// fases (66% e 33% da vida), barra de postura (quebrou = atordoado 3 s e leva
// +50%), 3 cartas do deck do chefe da Torre do rank (carta virando + aviso) e
// FÚRIA depois de 3 minutos de luta (mais rápido, golpes mais seguidos).
//
//  E  Rei Goblin           investida, porrete que vai e volta, chama goblins; fase 3: pedras caindo
//  D  Guardião da Cripta   sala escura; os 4 lampiões dão escudo e soltam espíritos: apague-os
//  C  Troll de Gelo        chão escorrega, estalactites; armadura de gelo só quebra com fogo ou golpe pesado
//  B  Golem de Lava        linhas de lava, núcleo exposto nas costas depois do pisão, anel de lava na fase 3
//  A  Espírito da Floresta raízes prendem (esquivar solta), plantas torreta curam o chefe: destrua-as antes
//  S  Monarca das Sombras  cópias sombrias que usam as SUAS cartas, teleporte, escuridão, mortos que levantam
import { canAct, hasSt, type Hit } from './dungeon-moves';
import {
  addTrail, bodyR, enemyShot, ESHOT, hurtPlayer, inRoom, moveBody, newEnemy, PR, rand, targetOf, warnCircle, warnLine, warnT,
  ENEMY, type Enemy, type Phase, type Run, type Warn,
} from './dungeon-core';
import { enemyCard, fireKit } from './dungeon-cast';
import { kitOf } from './dungeon-kits';
import { CX, CY, RH, RW, type EnemyKind } from './dungeon-map';

/** Cada chefe: distância que mantém, golpes por fase e a recarga entre golpes. */
const PLAN: Partial<Record<EnemyKind, { keep: number; moves: string[][]; cd: number }>> = {
  reiGoblin: { keep: 2.5, moves: [['investida', 'porrete', 'investida', 'pedras'], ['investida', 'porrete', 'chamar', 'pedras', 'porrete'], ['investida', 'pedras', 'porrete', 'chamar', 'pedras', 'investida']], cd: 1.8 },
  guardiao: { keep: 4, moves: [['anel', 'foice'], ['anel', 'foice', 'teleporte'], ['anel', 'teleporte', 'foice', 'anel']], cd: 2.4 },
  troll: { keep: 2.2, moves: [['pancada', 'estalactites', 'pedra'], ['pancada', 'sopro', 'estalactites', 'pedra'], ['estalactites', 'sopro', 'pancada', 'estalactites', 'pedra']], cd: 2.3 },
  golemLava: { keep: 2.4, moves: [['pisao', 'linhas'], ['pisao', 'linhas', 'meteoros'], ['pisao', 'meteoros', 'linhas', 'meteoros']], cd: 2.6 },
  espiritoFloresta: { keep: 4.2, moves: [['raizes', 'plantas'], ['raizes', 'plantas', 'tempestade'], ['raizes', 'tempestade', 'plantas', 'raizes']], cd: 2.3 },
  monarca: { keep: 3, moves: [['corte', 'teleporte', 'orbes'], ['corte', 'sombras', 'teleporte', 'orbes'], ['teleporte', 'corte', 'sombras', 'orbes', 'corte']], cd: 1.9 },
};

const H = (d: number, o: Omit<Hit, 'd'> = {}): Hit => ({ d, ...o });
const lit = (run: Run) => run.breaks[run.room].filter(b => b.kind === 'lampiao' && b.hp > 0);
const enemyKit = (run: Run, e: Enemy, mv: Parameters<typeof fireKit>[1]['moves'][number], ang: number) =>
  fireKit(run, { card: '', about: '', moves: [mv] }, { mine: false, src: e.id, card: '', el: 'Dark', power: 0, ang, tx: run.p.x, ty: run.p.y, tgt: -1, charge: 0, extra: false });

/** Quando o chefe aparece: escudos e a sala (escuridão, gelo). */
export function setupBoss(run: Run, e: Enemy) {
  e.cardCd = 5;
  if (e.kind === 'guardiao') { run.dark = 0.72; e.shield = lit(run).length; }
  if (e.kind === 'troll') { e.shield = e.shieldMax = Math.round(e.max * 0.3); }
  if (e.kind === 'monarca') run.dark = 0.5;
}

/** Golpes que saem quando o aviso do chefe acaba. */
export const BOSS_ACTS: Record<string, (run: Run, e: Enemy) => void> = {
  investida: (_run, e) => { e.state = 'dash'; e.st = 0.7; },
  porrete: (run, e) => { const a = Math.atan2(e.vy, e.vx); for (const o of e.phase === 3 ? [-0.5, 0, 0.5] : e.phase === 2 ? [-0.25, 0.25] : [0]) enemyKit(run, e, { m: 'proj', path: 'volta', speed: 9, range: 7, r: 0.55, hit: H(1), pierce: true, look: 'martelo' }, a + o); },
  chamar: (run, e) => { for (const o of [-1.6, 0, 1.6]) if (run.enemies.length < 11) { const s = inRoom(e.x + o, e.y + 1.2); run.enemies.push(newEnemy(run, run.rank >= 2 ? 'lobo' : 'goblin', s.x, s.y, { minion: true })); } },
  anel: (run, e) => { const n = e.phase === 3 ? 18 : e.phase === 2 ? 14 : 10; for (let k = 0; k < n; k++) enemyShot(run, e.x, e.y, (k / n) * Math.PI * 2 + e.t, ESHOT); },
  surge: (_run, e) => { e.ghost = 0; e.x = e.cax; e.y = e.cay; },
  pedra: (run, e) => enemyKit(run, e, { m: 'proj', speed: 6, range: 11, r: 0.75, hit: H(1, { st: 'congelado' }), look: 'gelo' }, Math.atan2(e.vy, e.vx)),
  sopro: (run, e) => enemyKit(run, e, { m: 'raio', len: 7, w: 0.6, cone: 3, dur: 0.7, tick: 0.25, hit: H(1, { st: 'lento' }), look: 'gelo' }, Math.atan2(e.vy, e.vx)),
  pisao: (run, e) => { e.aux = 2.4; if (!e.aux2) { e.aux2 = 1; run.ev.push({ k: 'msg', text: 'O núcleo do Golem ficou exposto nas costas!' }); } },
  plantas: (run, e) => {
    const want = e.phase + 1, alive = run.enemies.filter(x => x.kind === 'planta' && x.hp > 0).length;
    for (let k = alive; k < want; k++) { const s = inRoom(2 + rand(run) * (RW - 4), 2 + rand(run) * (RH - 4)); run.enemies.push(newEnemy(run, 'planta', s.x, s.y, { minion: true })); }
  },
  tempestade: (run, e) => { for (let k = 0; k < 16; k++) enemyShot(run, e.x, e.y, (k / 16) * Math.PI * 2 + e.t * 2, ESHOT * 0.8, 'folha'); },
  corte: (_run, e) => { e.state = 'dash'; e.st = 0.45; },
  sombras: (run, e) => {
    const cards = run.p.skills.map(s => s.card);
    const want = e.phase === 3 ? 3 : 2, alive = run.enemies.filter(x => x.kind === 'sombraP' && x.hp > 0).length;
    for (let k = alive; k < want; k++) { const s = inRoom(e.x + (k - 1) * 1.6, e.y + 1.4); const c = newEnemy(run, 'sombraP', s.x, s.y, { minion: true, cards }); c.life = 20; c.cardCd = 2 + k; run.enemies.push(c); }
  },
  orbes: (run, e) => { for (let k = 0; k < 14; k++) enemyShot(run, e.x, e.y, (k / 14) * Math.PI * 2 + e.t, ESHOT * 0.9, 'orbe', { st: 'cego' }); },
};

/** Aviso do chefe que vira outra coisa (linha de lava do Golem). */
export const BOSS_WARN: Partial<Record<EnemyKind, (run: Run, e: Enemy, w: Warn) => void>> = {
  golemLava: (run, _e, w) => {
    if (w.kind !== 'line' || w.st !== 'queimar') return;
    const n = Math.ceil(Math.hypot(w.x2 - w.x, w.y2 - w.y));
    for (let k = 0; k <= n; k++) addTrail(run, w.x + ((w.x2 - w.x) * k) / n, w.y + ((w.y2 - w.y) * k) / n, 'lava', 6);
  },
};

function moveOf(run: Run, e: Enemy, m: string, dx: number, dy: number, d: number) {
  const p = run.p, ux = dx / d, uy = dy / d, t = (x: number) => warnT(run, x);
  e.vx = ux; e.vy = uy;
  const near = (n: number, r: number, spread: number, wt: number, st?: Hit['st']) => {
    for (let k = 0; k < n; k++) { const a = rand(run) * Math.PI * 2, s = inRoom(p.x + Math.cos(a) * spread * (k ? 1 : 0.3), p.y + Math.sin(a) * spread * (k ? 1 : 0.3)); warnCircle(run, e.id, s.x, s.y, r, t(wt) + k * 0.08, 1, st); }
  };
  switch (m) {
    case 'investida': { const len = Math.min(9, d + 2), w = t(0.8); warnLine(run, e.id, e.x, e.y, e.x + ux * len, e.y + uy * len, 0.9, w, 0); e.state = 'wind'; e.st = w; e.vx = ux * 11; e.vy = uy * 11; e.act = 'boss:investida'; break; }
    case 'porrete': { const w = t(0.6); warnLine(run, e.id, e.x, e.y, e.x + ux * 7, e.y + uy * 7, 0.5, w, 0); e.state = 'wind'; e.st = w; e.act = 'boss:porrete'; break; }
    case 'chamar': { const w = t(0.8); for (const o of [-1.6, 0, 1.6]) { const s = inRoom(e.x + o, e.y + 1.2); warnCircle(run, e.id, s.x, s.y, 0.6, w, 0); } e.state = 'wind'; e.st = w; e.act = 'boss:chamar'; break; }
    case 'pedras': near(5, 1, 2.6, 1.1); break;
    case 'anel': { const w = t(0.6); warnCircle(run, e.id, e.x, e.y, 1.4, w, 0); e.state = 'wind'; e.st = w; e.act = 'boss:anel'; break; }
    case 'foice': { const w = t(0.7); warnCircle(run, e.id, e.x + ux * 1.6, e.y + uy * 1.6, 2.2, w, 1, 'cego'); e.state = 'wind'; e.st = w; break; }
    case 'teleporte': {
      const a = rand(run) * Math.PI * 2, s = inRoom(p.x + Math.cos(a) * 2.4, p.y + Math.sin(a) * 2.4), w = t(0.7);
      e.cax = s.x; e.cay = s.y; e.ghost = w;
      warnCircle(run, e.id, s.x, s.y, 1.3, w, 1); e.act = 'boss:surge';
      break;
    }
    case 'pancada': { const w = t(1); warnCircle(run, e.id, e.x, e.y, 2.6, w, 1, 'lento'); e.state = 'wind'; e.st = w; break; }
    case 'estalactites': near(e.phase === 3 ? 9 : 6, 0.9, 4, 1.1, 'congelado'); break;
    case 'pedra': { const w = t(0.6); warnLine(run, e.id, e.x, e.y, e.x + ux * 10, e.y + uy * 10, 0.75, w, 0); e.state = 'wind'; e.st = w; e.act = 'boss:pedra'; break; }
    case 'sopro': { const w = t(0.8); warnLine(run, e.id, e.x, e.y, e.x + ux * 7, e.y + uy * 7, 1.4, w, 0); e.state = 'wind'; e.st = w; e.act = 'boss:sopro'; break; }
    case 'pisao': { const w = t(1); warnCircle(run, e.id, e.x, e.y, 3, w, 1, 'queimar'); e.state = 'wind'; e.st = w; e.act = 'boss:pisao'; break; }
    case 'linhas': {
      const w = t(1.1), n = e.phase >= 2 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        if (rand(run) < 0.5) { const y = 1.5 + Math.floor(rand(run) * (RH - 3)); warnLine(run, e.id, 1, y + 0.5, RW - 1, y + 0.5, 0.5, w, 1, 'queimar'); }
        else { const x = 1.5 + Math.floor(rand(run) * (RW - 3)); warnLine(run, e.id, x + 0.5, 1, x + 0.5, RH - 1, 0.5, w, 1, 'queimar'); }
      }
      break;
    }
    case 'meteoros': near(4, 1.2, 3, 1.2, 'queimar'); break;
    case 'raizes': { const w = t(0.8); warnCircle(run, e.id, p.x, p.y, 1.2, w, e.phase === 3 ? 1 : 0, 'preso'); break; }
    case 'plantas': { const w = t(0.9); warnCircle(run, e.id, e.x, e.y, 0.8, w, 0); e.state = 'wind'; e.st = w; e.act = 'boss:plantas'; break; }
    case 'tempestade': { const w = t(0.7); warnCircle(run, e.id, e.x, e.y, 1.6, w, 0); e.state = 'wind'; e.st = w; e.act = 'boss:tempestade'; break; }
    case 'corte': { const len = Math.min(8, d + 2), w = t(0.7); warnLine(run, e.id, e.x, e.y, e.x + ux * len, e.y + uy * len, 0.7, w, 0); e.state = 'wind'; e.st = w; e.vx = ux * 14; e.vy = uy * 14; e.act = 'boss:corte'; break; }
    case 'sombras': { const w = t(0.9); warnCircle(run, e.id, e.x, e.y + 1.4, 1.6, w, 0); e.state = 'wind'; e.st = w; e.act = 'boss:sombras'; break; }
    case 'orbes': { const w = t(0.6); warnCircle(run, e.id, e.x, e.y, 1.3, w, 0); e.state = 'wind'; e.st = w; e.act = 'boss:orbes'; break; }
  }
}

export function stepBoss(run: Run, e: Enemy, dt: number) {
  const p = run.p, plan = PLAN[e.kind]!;
  // fase pela vida
  const ph: Phase = e.hp > e.max * 0.66 ? 1 : e.hp > e.max * 0.33 ? 2 : 3;
  if (ph !== e.phase) {
    e.phase = ph; run.ev.push({ k: 'phase', phase: ph }); e.cd = 1;
    if (e.kind === 'troll') { e.shield = e.shieldMax = Math.round(e.max * (ph === 2 ? 0.24 : 0.18)); run.ev.push({ k: 'msg', text: 'A armadura de gelo voltou! Fogo ou golpe pesado.' }); }
    if (e.kind === 'guardiao' && ph === 3) { let n = 0; for (const b of run.breaks[run.room]) if (b.kind === 'lampiao' && b.hp <= 0 && n < 2) { b.hp = 40; n++; } if (n) run.ev.push({ k: 'msg', text: 'O Guardião acendeu os lampiões de novo!' }); run.dark = 0.85; }
    if (e.kind === 'golemLava' && ph === 3) { for (let x = 1; x < RW - 1; x++) { addTrail(run, x + 0.5, 1.5, 'lava', 999); addTrail(run, x + 0.5, RH - 1.5, 'lava', 999); } for (let y = 1; y < RH - 1; y++) { addTrail(run, 1.5, y + 0.5, 'lava', 999); addTrail(run, RW - 1.5, y + 0.5, 'lava', 999); } run.ev.push({ k: 'msg', text: 'A lava fechou as bordas!' }); }
    if (e.kind === 'monarca' && ph === 3) run.dark = 0.8;
  }
  if (!e.enraged && run.bossT > 180) { e.enraged = true; run.ev.push({ k: 'enrage' }); }
  // o que roda sempre
  if (e.kind === 'guardiao') {
    e.shield = lit(run).length;
    e.aux2 -= dt;
    if (e.aux2 <= 0) { e.aux2 = 9; for (const b of lit(run)) if (run.enemies.length < 11) run.enemies.push(newEnemy(run, 'espirito', b.x + 0.5, b.y + 1.2, { minion: true })); }
  }
  if (e.kind === 'espiritoFloresta' && e.hp < e.max) {
    const plants = run.enemies.filter(x => x.kind === 'planta' && x.hp > 0).length;
    if (plants) { e.hp = Math.min(e.max, e.hp + e.max * 0.007 * plants * dt); if (Math.floor(e.t) !== Math.floor(e.t - dt)) run.ev.push({ k: 'heal', x: e.x, y: e.y }); }
  }
  if (e.kind === 'golemLava') e.aux = Math.max(0, e.aux - dt);
  if (e.ghost > 0) { e.ghost -= dt; if (e.ghost <= 0 && e.act === 'boss:surge') { e.act = undefined; e.x = e.cax; e.y = e.cay; } return; }
  if (!canAct(e.sb)) { if (e.state !== 'dash') e.state = 'move'; return; }

  const rage = e.enraged ? 1.4 : 1;
  e.cd -= dt * rage; e.cardCd -= dt * rage;
  const tg = targetOf(run, e);
  const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy) || 1;
  const sp = ENEMY[e.kind].speed * rage * (hasSt(e.sb, 'lento') ? 0.6 : 1) * (hasSt(e.sb, 'preso') ? 0 : 1);
  // Golem de Lava vira devagar (e não vira com o núcleo exposto)
  const want = Math.atan2(dy, dx), diff = ((want - e.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  e.face += Math.max(-(e.kind === 'golemLava' ? (e.aux > 0 ? 0 : 1) : 4) * dt, Math.min((e.kind === 'golemLava' ? (e.aux > 0 ? 0 : 1) : 4) * dt, diff));

  if (e.state === 'card') {
    e.st -= dt;
    if (e.st <= 0) { const kit = e.card; e.state = 'move'; e.card = undefined; e.cardCd = (e.phase === 3 ? 6 : 7.5) - (e.enraged ? 1.5 : 0); if (kit) { const k = kitOf(kit); if (k) fireKit(run, k, { mine: false, src: e.id, card: kit, el: 'Dark', power: 0, ang: Math.atan2(e.cay - e.y, e.cax - e.x), tx: e.cax, ty: e.cay, tgt: -1, charge: 0, extra: false }); } }
    return;
  }
  if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) e.state = 'move'; return; }
  if (e.state === 'dash') {
    e.st -= dt;
    const wall = moveBody(run, e, e.vx, e.vy, dt, bodyR(e) * 0.8, ENEMY[e.kind].fly);
    if (Math.hypot(p.x - e.x, p.y - e.y) < bodyR(e) + PR) hurtPlayer(run, 1);
    if (e.st <= 0 || wall) e.state = 'move';
    return;
  }
  if (e.kind !== 'golemLava' || e.aux <= 0) {
    if (d > plan.keep) moveBody(run, e, (dx / d) * sp, (dy / d) * sp, dt, bodyR(e) * 0.8, ENEMY[e.kind].fly);
    else if (d < plan.keep - 1.5) moveBody(run, e, (-dx / d) * sp * 0.6, (-dy / d) * sp * 0.6, dt, bodyR(e) * 0.8, ENEMY[e.kind].fly);
  }
  // colado no chefe: ele pune com uma pancada em volta (com aviso)
  e.aux2 -= e.kind === 'guardiao' ? 0 : dt * rage;
  if (e.kind !== 'guardiao' && Math.hypot(p.x - e.x, p.y - e.y) < bodyR(e) + 1.4 && e.aux2 <= 0) {
    const w = warnT(run, 0.55);
    warnCircle(run, e.id, e.x, e.y, bodyR(e) + 1.2, w, 1); e.state = 'wind'; e.st = w; e.aux2 = 3.2;
    return;
  }
  if (e.cards.length && e.cardCd <= 0 && d < 10 && run.p.hidden <= 0) { enemyCard(run, e); return; }
  if (e.cd > 0) return;
  const list = plan.moves[e.phase - 1];
  const m = list[e.next % list.length]; e.next++;
  moveOf(run, e, m, dx, dy, d);
  e.cd = plan.cd * (e.phase === 3 ? 0.7 : e.phase === 2 ? 0.85 : 1) * 0.85;
}
export { CX, CY };
