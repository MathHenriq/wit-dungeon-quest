// Masmorra (Soul Knight do WIT, tema Solo Leveling). Um PORTAL de rank E…S tem
// 5 andares (dungeon-map.ts); entre um andar e outro o SISTEMA oferece 1 de 3
// bênçãos; no 3º andar a escada fica atrás do mini-chefe; no 5º, o chefe do
// rank (dungeon-boss.ts).
//
// Combate (hack and slash): duas armas no corpo, a CURTA (combo de 3 golpes
// com finalizador, segurar = golpe pesado, atacar logo depois da esquiva =
// investida; rebate tiros) e a LONGA (gasta mana, de longe); troca com Q.
// Esquiva com invencibilidade; esquivar no último instante = ESQUIVA PERFEITA
// (câmera lenta e próximo golpe crítico). Parada no impacto, empurrão por peso,
// bater na parede machuca, postura. Contador de acertos sem apanhar dá a NOTA
// da sala (C, B, A, S), que multiplica XP e moedas. Até 4 cartas de Ataque com
// golpe próprio (dungeon-kits.ts) e a habilidade do Caminho do aluno (L).
//
// Regras puras: `stepRun(run, input, dt)` devolve o próximo estado e a lista de
// acontecimentos (`ev`) que a tela usa para efeitos e sons. Prêmio: hunter.ts.
import type { Progress } from './progress';
import type { PathId } from '@/lib/tcg/paths';
import { towerBoss } from '@/lib/tcg/bosses';
import { levelMult, weapon, chestWeapon, START_CURTA, START_LONGA, type WeaponId } from './dungeon-weapons';
import type { Skill } from './dungeon-skills';
import type { SombraKind } from './hunter-state';
import { addStatus, canAct, hasSt, speedOf, type StatusId } from './dungeon-moves';
import {
  CX, CY, doorTile, FLOORS, generate, inDoor, isBoss, neighbor, OPP, RANK_ANDAR, RH, rng, RW, type DRoom, type Side,
} from './dungeon-map';
import {
  aimOf, angDiff, ARMOR_WAIT, blocked, bodyR, boonOf, buffN, damageBreaks, damageEnemy, DASH, DASH_CD, DASH_T, drop, ENEMY,
  hurtPlayer, killDrops, moveBody, newEnemy, NO_STATS, PR, rand, roomOf, SPEED, targetable,
  type BuffId, type Enemy, type Grade, type Input, type LootCat, type Pickup, type Run, type StatPts,
} from './dungeon-core';
import { castSkill, endForm, fireKit, formShot, playerPower, stepActs, stepAllies, stepForm, stepQueue } from './dungeon-cast';
import { onEnemyDeath, resolveWarns, stepEnemy, stepHazards, stepShots } from './dungeon-ai';
import { setupBoss } from './dungeon-boss';

export * from './dungeon-map';
export * from './dungeon-core';
export { castSkill, stepActs } from './dungeon-cast';
export type { SombraKind };

// ─── pet ────────────────────────────────────────────────────────────────────

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

// ─── bênçãos ────────────────────────────────────────────────────────────────

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
  { id: 'esquiva', name: 'Passo da Sombra', about: 'A esquiva perfeita fica mais fácil.' },
  { id: 'postura', name: 'Golpe Esmagador', about: '+25% de dano na postura.' },
  { id: 'reacao', name: 'Alquimia Elemental', about: 'Reações entre elementos dão +30%.' },
];

// ─── Caminho do aluno: habilidade de classe (L) ─────────────────────────────

export const CLASS_SKILL: Record<PathId, { name: string; about: string; cd: number }> = {
  desafiante: { name: 'Investida Dupla', about: 'Duas investidas seguidas que atravessam batendo.', cd: 12 },
  sabio: { name: 'Eco Arcano', about: 'A próxima carta sai duas vezes e as outras recarregam 2 s.', cd: 16 },
  louco: { name: 'Fúria', about: 'Paga 1 coração: +50% de dano e +30% de velocidade por 7 s.', cd: 14 },
  guardiao: { name: 'Muralha', about: '+2 escudos e devolve os tiros em volta por 3 s.', cd: 15 },
  alquimista: { name: 'Nuvem Alquímica', about: 'Nuvem de vento e veneno que ESPALHA os estados dos inimigos.', cd: 13 },
  ceifador: { name: 'Colheita', about: 'Por 8 s, quem cai levanta como sua sombra.', cd: 18 },
  trapaceiro: { name: 'Clone', about: 'Um clone atrai os inimigos e você some por 1,5 s.', cd: 14 },
  forjador: { name: 'Torreta', about: 'Monta uma torreta que atira por 12 s.', cd: 16 },
};

function classSkill(run: Run) {
  const p = run.p;
  if (p.classCd > 0 || p.lock > 0) return;
  const id = p.classe, base = 30 + 14 * run.rank;
  const ctx = { mine: true, src: -1, card: '', el: 'Fighting' as const, power: base * playerPower(run, 'curta'), ang: Math.atan2(p.dy, p.dx), tx: p.x + p.dx * 4, ty: p.y + p.dy * 4, tgt: -1, charge: 0, extra: false };
  const e = run.enemies.filter(targetable).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  if (e) { ctx.ang = Math.atan2(e.y - p.y, e.x - p.x); ctx.tx = e.x; ctx.ty = e.y; ctx.tgt = e.id; }
  if (id === 'desafiante') fireKit(run, { card: '', about: '', moves: [{ m: 'investida', len: 3.2, w: 1, hit: { d: 1, kb: 5 } }, { m: 'investida', at: 0.3, len: 3.2, w: 1, hit: { d: 1.2, kb: 7, postura: 2 } }] }, ctx);
  if (id === 'sabio') { p.eco = true; p.skillCd = p.skillCd.map(c => Math.max(0, c - 2)); }
  if (id === 'louco') { if (p.hp <= 1) return; p.hp -= 1; run.ev.push({ k: 'hurt' }); p.boons = [...p.boons.filter(b => b.kind !== 'pacto' && b.kind !== 'velocidade'), { kind: 'pacto', t: 7, v: 1.5 }, { kind: 'velocidade', t: 7, v: 1.3 }]; }
  if (id === 'guardiao') fireKit(run, { card: '', about: '', moves: [{ m: 'buff', what: 'escudo', v: 2 }, { m: 'parar_tiros', r: 2.4, mode: 'devolve', dur: 3 }] }, ctx);
  if (id === 'alquimista') fireKit(run, { card: '', about: '', moves: [{ m: 'zona', where: 'eu', r: 3, dur: 3, tick: 0.5, hit: { d: 0.15, el: 'Flying', st: 'veneno', sd: 4 } }] }, { ...ctx, el: 'Poison' });
  if (id === 'ceifador') run.reap = 8;
  if (id === 'trapaceiro') { fireKit(run, { card: '', about: '', moves: [{ m: 'invocar', kind: 'clone', dur: 5, every: 9, range: 0, hit: { d: 0 } }] }, ctx); p.hidden = 1.5; }
  if (id === 'forjador') fireKit(run, { card: '', about: '', moves: [{ m: 'invocar', kind: 'torreta', dur: 12, every: 0.6, range: 7, hit: { d: 0.25 } }] }, { ...ctx, el: 'Steel' });
  p.classCd = p.classMax;
  run.ev.push({ k: 'classe', id });
}

// ─── a partida ──────────────────────────────────────────────────────────────

export interface RunOptions {
  seed: number; rank: number;
  arms?: [{ id: WeaponId; lvl: number }, { id: WeaponId; lvl: number }];
  skills?: Skill[]; pet?: string; sombra?: SombraKind;
  hearts?: number; armor?: number; mana?: number; potions?: { vida: number; mana: number };
  classe?: PathId; stats?: StatPts; pesadelo?: boolean; semana?: boolean; revive?: number;
}

const fightRoom = (r: DRoom) => r.kind === 'normal' || r.kind === 'chefe' || r.kind === 'armadilha' || r.kind === 'desafio' || r.kind === 'elite';
const CLEAR_ON_START = (r: DRoom) => !fightRoom(r);

function enterRoom(run: Run) {
  const r = roomOf(run), room = run.room, first = !run.seen[room];
  run.seen[room] = true;
  run.ev.push({ k: 'room' });
  run.roomMax = 0; run.roomHurt = 0; run.combo = 0;
  run.dark = 0; run.trail = []; run.corpses = [];
  const price = 12 + run.rank * 6;
  if (first && r.kind === 'loja') {
    run.pickups.push(
      { id: run.seq++, room, x: CX - 2.5, y: CY + 0.5, kind: 'loja', what: 'vida', price },
      { id: run.seq++, room, x: CX + 0.5, y: CY + 0.5, kind: 'loja', what: 'mana', price: Math.round(price * 0.7) },
      { id: run.seq++, room, x: CX + 3.5, y: CY + 0.5, kind: 'loja', what: 'arma', price: price * 3 },
    );
    if (rand(run) < 0.25) run.pickups.push({ id: run.seq++, room, x: CX + 0.5, y: CY + 2.6, kind: 'loja', what: 'pedra', price: price * 5 });
  }
  if (first && r.kind === 'estatua') run.pickups.push({ id: run.seq++, room, x: CX + 0.5, y: CY - 0.4, kind: 'estatua', what: offerBuffs(run, 7)[0], price: 20 + 12 * run.rank + 4 * run.floor });
  if (first && r.kind === 'mercador') {
    run.pickups.push(
      { id: run.seq++, room, x: CX - 2.5, y: CY + 0.5, kind: 'mercador', what: 'pedra', price: 60 + 15 * run.rank },
      { id: run.seq++, room, x: CX + 0.5, y: CY + 0.5, kind: 'mercador', what: 'afiar', price: 45 + 10 * run.rank },
      { id: run.seq++, room, x: CX + 3.5, y: CY + 0.5, kind: 'mercador', what: 'cristal', price: 40 },
    );
  }
  if (first && r.kind === 'secreta') {
    run.ev.push({ k: 'segredo' });
    drop(run, CX + 0.5, CY + 0.5, 'moeda', 12); drop(run, CX + 0.5, CY + 0.5, `cristal:${['azul', 'azul', 'roxo', 'roxo', 'dourado', 'dourado'][Math.min(5, run.rank)]}`, 2);
    run.pickups.push({ id: run.seq++, room, x: CX + 0.5, y: CY + 1.6, kind: 'arma', weapon: chestWeapon(run.rank + 1, rand(run), rand(run)) });
    if (rand(run) < 0.35) { run.revive++; run.ev.push({ k: 'msg', text: 'Achou uma Pedra da Ressurreição!' }); }
  }
  if (run.cleared[room]) return;
  run.wave = 0;
  spawnWave(run);
}
function spawnWave(run: Run) {
  const r = roomOf(run);
  run.enemies = r.spawns.filter(s => s.wave === run.wave).map(s => newEnemy(run, s.kind, s.x, s.y, { elite: s.elite, cards: s.cards }));
  for (const e of run.enemies) if (isBoss(e.kind)) setupBoss(run, e);
  if (!run.enemies.length) run.cleared[run.room] = true;
}

export function startRun(o: RunOptions): Run {
  const d = generate(o.seed, o.rank, 1, { pesadelo: o.pesadelo });
  const pet = o.pet ?? 'pet-raposa-chama';
  const stats = o.stats ?? NO_STATS;
  const classe = o.classe ?? 'desafiante';
  const run: Run = {
    seed: o.seed, rank: o.rank, floor: 1, pesadelo: !!o.pesadelo, semana: !!o.semana,
    d, room: d.start, cleared: d.rooms.map(CLEAR_ON_START), seen: d.rooms.map(() => false), wave: 0,
    breaks: d.rooms.map(r => r.breaks.map(b => ({ ...b }))), cracked: [],
    p: {
      x: CX + 0.5, y: CY + 0.5, hp: o.hearts ?? 6, max: o.hearts ?? 6, armor: o.armor ?? 3, armorMax: o.armor ?? 3, armorT: 0,
      mana: o.mana ?? 120, manaMax: o.mana ?? 120,
      face: 's', dash: 0, dashCd: 0, dashAge: 9, inv: 0, dx: 0, dy: 1, vx: 0, vy: 0, dsx: 0, dsy: 0,
      arms: o.arms ?? [{ id: START_CURTA, lvl: 0 }, { id: START_LONGA, lvl: 0 }], hand: 0, atk: 0, swing: 0,
      cs: 0, cw: 0, hold: 0, held: false, dashAtk: 0, heavy: 0, swingKind: 'leve',
      perfect: false, perfectUsed: false,
      skills: o.skills ?? [], skillCd: (o.skills ?? []).map(() => 0),
      potions: o.potions ?? { vida: 0, mana: 0 },
      lock: 0, boons: [], critN: 0, eco: false, sb: {}, burnT: 0,
      classe, classCd: 2, classMax: CLASS_SKILL[classe].cd, stats, hidden: 0, ccImmune: 0,
    },
    pet: { id: pet, x: CX - 0.5, y: CY + 1.2, bag: { minerio: 0, erva: 0, cristal: 0, trofeu: 0 }, items: {}, target: -1 },
    allies: o.sombra ? [{ id: 0, kind: o.sombra, x: CX + 1.5, y: CY + 1.5, cd: 0, atk: 0 }] : [],
    enemies: [], shots: [], warns: [], loot: [], pickups: [], acts: [], queue: [],
    buffs: [], t: 0, seq: 1, rs: (o.seed ^ 0x9e3779b9) >>> 0,
    gold: 0, kills: 0, killsBy: {}, hurtCount: 0, elites: 0, chests: [], bought: [], ev: [],
    slow: 0, stop: 0, combo: 0, comboT: 0, roomMax: 0, roomHurt: 0, grades: [],
    cardKills: {}, cardUse: {}, revive: o.revive ?? 0, revived: false, bossT: 0, dark: 0, reap: 0, trail: [], onIce: false, corpses: [],
  };
  enterRoom(run);
  run.ev = [];
  return run;
}

// ─── o caçador ──────────────────────────────────────────────────────────────

const HEAVY_HOLD = 0.5;

/** Golpe da arma curta: leve (combo), final (3º do combo), pesado (segurou) ou investida (logo depois da esquiva). */
function swing(run: Run, input: Input, kind: 'leve' | 'final' | 'pesado' | 'investida') {
  const p = run.p, arm = p.arms[0], w = weapon(arm.id), f = p.form;
  const scale = f ? 1 + (f.scale - 1) * 0.6 : 1;
  const mult = levelMult(arm.lvl) * (1 + 0.25 * buffN(run, 'lamina')) * playerPower(run, 'curta');
  const { ax, ay } = aimOf(run, input, 4 * scale);
  const ang = Math.atan2(ay, ax);
  let reach = w.range * scale, arc = w.arc ?? 1.6, dmg = w.dmg * mult, kb = 2.5, post = 1, recov = w.cd;
  if (kind === 'final') { dmg *= 1.6; kb = 7; arc *= 1.2; post = 1.6; recov = w.cd * 1.5; }
  if (kind === 'pesado') {
    const giro = (w.arc ?? 1.6) >= 1.8;
    arc = giro ? Math.PI * 2 : 0.6; reach *= giro ? 1.15 : 1.8; dmg *= 2.4; kb = 9; post = 2.5; recov = w.cd * 1.8;
  }
  if (kind === 'investida') {
    // avança 2,2 blocos batendo em quem estiver no caminho
    const sx = p.x, sy = p.y;
    for (let k = 0; k < 9; k++) moveBody(run, p, Math.cos(ang) * 22, Math.sin(ang) * 22, 0.011, PR);
    dmg *= 1.4; kb = 5; arc = 1.2;
    for (const e of run.enemies) if (targetable(e) && segDist2(e.x, e.y, sx, sy, p.x, p.y) < 0.9 + bodyR(e)) damageEnemy(run, e, dmg, { me: true, fx: sx, fy: sy, kb, postura: 1.3 });
  }
  p.atk = recov; p.swing = 0.18; p.swingKind = kind;
  run.ev.push({ k: 'swing', x: p.x, y: p.y, ang, arc, range: reach, kind });
  let any = false;
  if (kind !== 'investida') for (const e of run.enemies) {
    if (!targetable(e)) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < reach + bodyR(e) && (d < 0.6 || arc >= 6.2 || angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang) < arc / 2)) {
      damageEnemy(run, e, dmg, { me: true, fx: p.x, fy: p.y, kb, postura: post, heavy: kind === 'pesado' });
      any = true;
    }
  }
  // a lâmina devolve os tiros que pega
  for (const s of run.shots) if (!s.mine && s.dmg > 0 && Math.hypot(s.x - p.x, s.y - p.y) < reach + 0.3 && (arc >= 6.2 || angDiff(Math.atan2(s.y - p.y, s.x - p.x), ang) < arc / 2 + 0.2)) {
    s.mine = true; s.vx = -s.vx * 1.4; s.vy = -s.vy * 1.4; s.dmg = w.dmg * mult * 0.8; s.hits = []; s.life = 2;
    run.ev.push({ k: 'deflect', x: s.x, y: s.y });
  }
  damageBreaks(run, (x, y) => Math.hypot(x - p.x, y - p.y) < reach + 0.4 && (arc >= 6.2 || angDiff(Math.atan2(y - p.y, x - p.x), ang) < arc / 2 + 0.3), dmg);
  crackCheck(run, p.x + Math.cos(ang) * reach, p.y + Math.sin(ang) * reach);
  if (f?.tiro) formShot(run, ang);
  if (any && (kind === 'final' || kind === 'pesado')) run.stop = Math.max(run.stop, kind === 'pesado' ? 0.08 : 0.05);
  if (!any && kind === 'final') p.atk += 0.3;   // errou o finalizador: fica aberto
}
const segDist2 = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return Math.hypot(px - x1 - dx * t, py - y1 - dy * t);
};

function shoot(run: Run, input: Input) {
  const p = run.p, arm = p.arms[1], w = weapon(arm.id);
  const mult = levelMult(arm.lvl) * (1 + 0.25 * buffN(run, 'mira')) * playerPower(run, 'longa');
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

/** Parede rachada: golpe ou explosão perto dela abre a sala secreta. */
function crackCheck(run: Run, x: number, y: number) {
  const r = roomOf(run);
  if (!r.secret || run.cracked.includes(run.room)) return;
  const [dx, dy] = doorTile(r.secret);
  if (Math.hypot(x - (dx + 0.5), y - (dy + 0.5)) < 1.6) { run.cracked.push(run.room); run.ev.push({ k: 'segredo' }); }
}

function stepPlayer(run: Run, input: Input, dt: number) {
  const p = run.p;
  p.inv = Math.max(0, p.inv - dt); p.dashCd = Math.max(0, p.dashCd - dt); p.atk = Math.max(0, p.atk - dt); p.swing = Math.max(0, p.swing - dt);
  p.lock = Math.max(0, p.lock - dt); p.cw = Math.max(0, p.cw - dt); p.dashAtk = Math.max(0, p.dashAtk - dt); p.classCd = Math.max(0, p.classCd - dt);
  p.hidden = Math.max(0, p.hidden - dt); p.ccImmune = Math.max(0, p.ccImmune - dt); p.dashAge += dt;
  if (p.cw <= 0) p.cs = 0;
  p.skillCd = p.skillCd.map(c => Math.max(0, c - dt));
  for (const b of p.boons) b.t -= dt;
  p.boons = p.boons.filter(b => b.t > 0 && !(b.kind === 'escudo' && b.v <= 0));
  // estados no caçador
  for (const k of Object.keys(p.sb) as StatusId[]) { const s = p.sb[k]!; s.t -= dt; if (s.t <= 0) delete p.sb[k]; }
  if (hasSt(p.sb, 'queimar') || hasSt(p.sb, 'chamaNegra')) { p.burnT -= dt; if (p.burnT <= 0) { p.burnT = 2.5; hurtPlayer(run, 1, { through: true }); } }
  if (hasSt(p.sb, 'veneno') && (p.sb.veneno!.n >= 3) && Math.floor(run.t / 3) !== Math.floor((run.t - dt) / 3)) hurtPlayer(run, 1, { through: true });
  // escudo volta sozinho depois de um tempo sem apanhar (amaldiçoado não deixa); a mana volta devagar
  p.armorT = Math.max(0, p.armorT - dt);
  if (p.armorT <= 0 && p.armor < p.armorMax && !hasSt(p.sb, 'amaldicoado')) { p.armor += 1; p.armorT = 1.5; }
  p.mana = Math.min(p.manaMax, p.mana + dt * 2);

  // andar e esquivar
  const len = Math.hypot(input.mx, input.my);
  const mx = len > 1 ? input.mx / len : input.mx, my = len > 1 ? input.my / len : input.my;
  const free = p.lock <= 0 && canAct(p.sb);
  if (len > 0.1 && free) { p.dx = mx; p.dy = my; p.face = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'e' : 'w') : (my > 0 ? 's' : 'n'); }
  const f = p.form;
  if (input.dodge && hasSt(p.sb, 'preso')) { p.sb.preso!.t -= 0.15; }
  const canDash = free && !f?.noDodge && !hasSt(p.sb, 'lama') && !hasSt(p.sb, 'preso');
  if (input.dodge && canDash && p.dashCd <= 0 && p.dash <= 0) {
    p.dash = DASH_T; p.dashAge = 0; p.perfectUsed = false; p.dsx = p.x; p.dsy = p.y;
    p.dashCd = f?.dashFree ? 0.12 : DASH_CD * Math.max(0.5, 1 - 0.03 * p.stats.agilidade);
    p.cs = 0; p.hold = 0;
    delete p.sb.queimar; delete p.sb.marcado;
  }
  const boost = (boonOf(p, 'velocidade')?.v ?? 1) * (f?.speed ?? 1) * (1 + 0.02 * p.stats.agilidade);
  if (p.dash > 0) {
    p.dash = Math.max(0, p.dash - dt);
    moveBody(run, p, p.dx * DASH, p.dy * DASH, dt, PR);
    if (p.dash <= 0) p.dashAtk = 0.3;
  } else if (free && !hasSt(p.sb, 'preso')) {
    const sp = SPEED * boost * speedOf(p.sb) / (hasSt(p.sb, 'molhado') ? 0.85 : 1);
    if (run.onIce) { const k = Math.min(1, dt * 2.5); p.vx += (mx * sp - p.vx) * k; p.vy += (my * sp - p.vy) * k; }
    else { p.vx = mx * sp; p.vy = my * sp; }
    moveBody(run, p, p.vx, p.vy, dt, PR);
  }

  // trocar de arma, pegar coisas
  if (input.swap) { p.hand = p.hand ? 0 : 1; p.hold = 0; p.cs = 0; }
  const near = run.pickups.find(x => x.room === run.room && !run.bought.includes(x.id) && Math.hypot(x.x - p.x, x.y - p.y) < 0.9);
  const wantsUse = input.use || (input.attack && !p.held && near && !run.enemies.length);
  if (near && wantsUse) { usePickup(run, near); p.held = input.attack; return; }

  // atacar
  if (free) {
    if (p.hand === 0) {
      const pressed = input.attack && !p.held;
      if (input.attack) p.hold += dt;
      if (pressed && p.atk <= 0 && p.dash <= 0) {
        if (p.dashAtk > 0) { swing(run, input, 'investida'); p.dashAtk = 0; p.cs = 0; }
        else { const fin = p.cs === 2; swing(run, input, fin ? 'final' : 'leve'); p.cs = fin ? 0 : p.cs + 1; p.cw = 0.75; }
      }
      p.heavy = input.attack && p.hold >= HEAVY_HOLD * 0.6 ? Math.min(1, (p.hold - HEAVY_HOLD * 0.6) / (HEAVY_HOLD * 0.8)) : 0;
      if (!input.attack && p.held && p.hold >= HEAVY_HOLD && p.atk <= 0.15) { p.atk = 0; swing(run, input, 'pesado'); p.cs = 0; }
    } else if (input.attack && p.atk <= 0 && p.dash <= 0) shoot(run, input);
  }
  p.held = input.attack;
  if (!input.attack) p.hold = 0;

  // cartas: as que carregam esperam soltar a tecla
  if (p.charge) {
    const c = p.charge;
    c.t = Math.min(c.max + 0.5, c.t + dt);
    if (input.held !== c.slot || c.t >= c.max + 0.5) { p.charge = undefined; castSkill(run, c.slot, input, Math.min(1, c.t / c.max)); }
  } else if (free && input.skill !== undefined && input.skill >= 0) {
    const sk = p.skills[input.skill];
    const chargeMv = sk?.kit.moves.find(m => (m.m === 'raio' || m.m === 'proj') && m.charge);
    if (sk && chargeMv && p.skillCd[input.skill] <= 0 && !hasSt(p.sb, 'selado')) p.charge = { slot: input.skill, t: 0, max: (chargeMv as { charge: number }).charge };
    else castSkill(run, input.skill, input);
  }
  if (input.classe && free) classSkill(run);
}

// ─── o passo ────────────────────────────────────────────────────────────────

function clone(prev: Run): Run {
  const p = prev.p;
  return {
    ...prev,
    p: {
      ...p, arms: [{ ...p.arms[0] }, { ...p.arms[1] }], skillCd: [...p.skillCd], potions: { ...p.potions }, boons: p.boons.map(b => ({ ...b })),
      sb: Object.fromEntries(Object.entries(p.sb).map(([k, v]) => [k, { ...v }])), form: p.form ? { ...p.form } : undefined, charge: p.charge ? { ...p.charge } : undefined,
    },
    pet: { ...prev.pet, bag: { ...prev.pet.bag }, items: { ...prev.pet.items } },
    allies: prev.allies.map(a => ({ ...a })),
    enemies: prev.enemies.map(e => ({ ...e, sb: Object.fromEntries(Object.entries(e.sb).map(([k, v]) => [k, { ...v }])) })),
    shots: prev.shots.map(s => ({ ...s, hits: s.hits ? [...s.hits] : undefined })),
    warns: prev.warns.map(w => ({ ...w })), loot: prev.loot.map(l => ({ ...l })), pickups: prev.pickups.map(x => ({ ...x })),
    acts: prev.acts.map(a => ({ ...a, hits: { ...a.hits }, pts: a.pts.map(q => ({ ...q })) })), queue: prev.queue.map(q => ({ ...q })),
    cleared: [...prev.cleared], seen: [...prev.seen], breaks: prev.breaks.map((bs, i) => (i === prev.room ? bs.map(b => ({ ...b })) : bs)), cracked: [...prev.cracked],
    buffs: [...prev.buffs], chests: [...prev.chests], bought: [...prev.bought], killsBy: { ...prev.killsBy }, grades: [...prev.grades],
    cardKills: { ...prev.cardKills }, cardUse: { ...prev.cardUse }, trail: prev.trail.map(h => ({ ...h })), corpses: prev.corpses.map(c => ({ ...c })),
    cine: prev.cine ? { ...prev.cine } : undefined, ev: [],
  };
}

/** Nota da sala pelo maior combo e pelos golpes levados. */
export function gradeOf(maxCombo: number, hurt: number): Grade {
  if (maxCombo >= 25 && hurt === 0) return 'S';
  if (maxCombo >= 15 && hurt <= 1) return 'A';
  if (maxCombo >= 8 || hurt <= 1) return 'B';
  return 'C';
}
export const GRADE_MULT: Record<Grade, number> = { S: 1.5, A: 1.25, B: 1.1, C: 1 };
/** Multiplicador de XP e moedas pela média das notas. */
export const gradeMult = (g: Grade[]) => (g.length ? g.reduce((a, x) => a + GRADE_MULT[x], 0) / g.length : 1);

/** Um passo da partida (dt em segundos, até 0,05). Parado enquanto o SISTEMA oferece a bênção. */
export function stepRun(prev: Run, input: Input, dtIn: number): Run {
  if (prev.result || prev.choice) return prev.ev.length ? { ...prev, ev: [] } : prev;
  const run = clone(prev);
  const dt = Math.min(0.05, Math.max(0, dtIn)), p = run.p;
  // parada no impacto: o mundo segura por um instante
  if (run.stop > 0) { run.stop = Math.max(0, run.stop - dt); p.held = input.attack; return run; }
  run.t += dt;
  let dtMe = dt, dtW = dt;
  if (run.cine) { run.cine.t -= dt; dtMe = 0; dtW = dt * 0.05; p.lock = Math.max(p.lock, 0.01); if (run.cine.t <= 0) run.cine = undefined; }
  else if (run.slow > 0) { run.slow = Math.max(0, run.slow - dt); dtW = dt * 0.35; }
  run.comboT -= dtW; if (run.comboT <= 0) run.combo = 0;
  run.reap = Math.max(0, run.reap - dt);

  if (dtMe > 0) stepPlayer(run, input, dtMe);
  else p.lock = Math.max(0, p.lock - dt);
  stepQueue(run, dt);
  const moving = Math.hypot(input.mx, input.my) > 0.1;
  stepForm(run, dtMe, moving);

  // inimigos, avisos, tiros, cartas, aliados, chão
  if (run.enemies.some(e => isBoss(e.kind))) run.bossT += dtW;
  for (const e of run.enemies) stepEnemy(run, e, dtW);
  resolveWarns(run, dtW);
  stepShots(run, dtW, dtMe);
  stepActs(run, dtMe, dtW);
  stepAllies(run, dtMe);
  stepHazards(run, dtW);

  // mortos: prêmios, maestria e o que acontece quando caem
  const dead = run.enemies.filter(e => e.hp <= 0);
  for (const e of dead) {
    run.kills++; run.killsBy[e.kind] = (run.killsBy[e.kind] ?? 0) + 1; if (e.elite) run.elites++;
    if (e.by) run.cardKills[e.by] = (run.cardKills[e.by] ?? 0) + 1;
    run.ev.push({ k: 'kill', x: e.x, y: e.y, kind: e.kind, elite: !!e.elite });
    killDrops(run, e);
    onEnemyDeath(run, e);
    if (buffN(run, 'vampiro') && run.kills % 8 === 0) { p.hp = Math.min(p.max, p.hp + 1); run.ev.push({ k: 'heal', x: p.x, y: p.y }); }
    if (!e.minion) run.stop = Math.max(run.stop, isBoss(e.kind) ? 0.25 : 0.03);
  }
  if (dead.length) run.enemies = run.enemies.filter(e => e.hp > 0);
  if (dead.some(e => isBoss(e.kind))) { run.enemies = []; run.warns = []; run.shots = run.shots.filter(s => s.mine); run.acts = run.acts.filter(a => a.mine); run.queue = run.queue.filter(q => q.mine); run.dark = 0; run.trail = []; }
  // Monarca: a sombra no chão levanta se ninguém pisar nela
  for (const c of run.corpses) {
    c.t -= dtW;
    if (Math.hypot(p.x - c.x, p.y - c.y) < 0.8) { c.t = -1; run.ev.push({ k: 'msg', text: 'Sombra purificada!' }); continue; }
    if (c.t <= 0 && run.enemies.length < 12) run.enemies.push(newEnemy(run, 'espirito', c.x, c.y, { minion: true }));
  }
  run.corpses = run.corpses.filter(c => c.t > 0);

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

  // onda seguinte, sala limpa (com nota), escada e vitória
  const room = roomOf(run);
  if (!run.cleared[run.room] && !run.enemies.some(e => !e.minion || isBoss(e.kind)) && !run.result) {
    if (room.spawns.some(s => s.wave === run.wave + 1)) { run.wave++; spawnWave(run); run.ev.push({ k: 'wave' }); }
    else {
      run.cleared[run.room] = true; run.warns = []; run.enemies = []; run.shots = run.shots.filter(s => s.mine); run.acts = run.acts.filter(a => a.mine); run.queue = run.queue.filter(q => q.mine);
      const g = gradeOf(run.roomMax, run.roomHurt);
      run.grades.push(g);
      run.ev.push({ k: 'cleared' }); run.ev.push({ k: 'grade', g });
      if (room.kind === 'chefe') run.result = 'win';
      if (room.kind === 'desafio' || room.kind === 'elite') {
        run.pickups.push({ id: run.seq++, room: run.room, x: CX + 0.5, y: CY + 1.8, kind: 'arma', weapon: chestWeapon(run.rank + 1, rand(run), rand(run)) });
        drop(run, CX + 0.5, CY + 0.5, `cristal:${['azul', 'azul', 'roxo', 'roxo', 'dourado', 'dourado'][Math.min(5, run.rank)]}`, 2);
        drop(run, CX + 0.5, CY + 0.5, 'moeda', 10);
        run.ev.push({ k: 'chest' });
      }
      if (room.kind === 'armadilha') drop(run, CX + 0.5, CY + 0.5, 'moeda', 6);
    }
  }
  if (room.kind === 'tesouro' && !run.chests.includes(run.room) && Math.hypot(p.x - (CX + 0.5), p.y - (CY + 0.5)) < 0.9) {
    run.chests.push(run.room);
    run.pickups.push({ id: run.seq++, room: run.room, x: CX + 0.5, y: CY + 1.6, kind: 'arma', weapon: chestWeapon(run.rank, rand(run), rand(run)) });
    drop(run, CX + 0.5, CY + 0.5, 'moeda', 6); drop(run, CX + 0.5, CY + 0.5, 'mana', 1);
    run.ev.push({ k: 'chest' });
  }
  if ((room.kind === 'fim' || room.kind === 'elite') && run.cleared[run.room] && Math.hypot(p.x - (CX + 0.5), p.y - (CY + 0.5)) < 0.6) {
    run.choice = offerBuffs(run);
    run.ev.push({ k: 'stairs' });
    return run;
  }
  // golpes de carta e explosões abrem a parede rachada
  for (const e of run.ev) if (e.k === 'boom') crackCheck(run, e.x, e.y);

  // passar pela porta
  if (run.cleared[run.room] && !run.result) {
    const side: Side | null = p.y < 0.6 ? 'n' : p.y > RH - 0.6 ? 's' : p.x < 0.6 ? 'w' : p.x > RW - 0.6 ? 'e' : null;
    const next = side && (side !== room.secret || run.cracked.includes(run.room)) ? neighbor(run.d, run.room, side) : -1;
    if (side && next >= 0) {
      sweepRoom(run);
      if (p.form) endForm(run);
      run.room = next; run.shots = []; run.warns = []; run.acts = []; run.queue = []; run.cine = undefined;
      const [tx, ty] = doorTile(OPP[side]);
      if (side === 'n' || side === 's') { p.y = ty + 0.5 + (side === 's' ? 1 : -1); p.x = Math.max(tx - 0.6, Math.min(tx + 1.6, p.x)); }
      else { p.x = tx + 0.5 + (side === 'e' ? 1 : -1); p.y = Math.max(ty - 0.6, Math.min(ty + 1.6, p.y)); }
      p.vx = 0; p.vy = 0;
      run.pet.x = p.x - (side === 'e' ? 0.8 : side === 'w' ? -0.8 : 0); run.pet.y = p.y - (side === 's' ? 0.8 : side === 'n' ? -0.8 : 0); run.pet.target = -1;
      run.allies = run.allies.filter(a => a.life === undefined);
      for (const a of run.allies) { a.x = p.x; a.y = p.y; }
      run.breaks[next] = run.breaks[next].map(b => ({ ...b }));
      // a sala secreta tem a parede do outro lado aberta
      if (run.d.rooms[next].kind === 'secreta' && !run.cracked.includes(next)) run.cracked.push(next);
      enterRoom(run);
    }
  }
  return run;
}

// ─── pet ────────────────────────────────────────────────────────────────────

function stepPet(run: Run, dt: number) {
  const pet = run.pet, p = run.p, bonus = 5 * buffN(run, 'faro');
  const reach = (cat: LootCat) => (petAffinity(pet.id) === cat ? 8 : 5.5) + bonus * 0.6 + p.stats.percepcao * 0.2;
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

// ─── pegar, comprar ─────────────────────────────────────────────────────────

/** O que cada coisa da loja, da estátua e do mercador faz. */
export const SHOP_NAME: Record<string, string> = {
  vida: '+2 corações', mana: 'Mana cheia', arma: 'Arma melhor', pedra: 'Pedra da Ressurreição', afiar: 'Afiar as armas (+1 nível)', cristal: 'Cristal',
};

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
  if (x.price === undefined || run.bought.includes(x.id)) return;
  if (run.gold < x.price) { run.ev.push({ k: 'nomana' }); return; }
  run.gold -= x.price; run.bought.push(x.id);
  if (x.kind === 'estatua') {
    applyBuff(run, x.what as BuffId);
    run.ev.push({ k: 'buy', what: `estatua:${x.what}` });
    return;
  }
  if (x.what === 'vida') p.hp = Math.min(p.max, p.hp + 2);
  if (x.what === 'mana') p.mana = p.manaMax;
  if (x.what === 'arma') run.pickups.push({ id: run.seq++, room: run.room, x: x.x, y: x.y + 1.2, kind: 'arma', weapon: chestWeapon(run.rank + 1, rand(run), rand(run)) });
  if (x.what === 'pedra') run.revive++;
  if (x.what === 'afiar') p.arms = [{ ...p.arms[0], lvl: p.arms[0].lvl + 1 }, { ...p.arms[1], lvl: p.arms[1].lvl + 1 }];
  if (x.what === 'cristal') drop(run, x.x, x.y + 1, `cristal:${['azul', 'azul', 'roxo', 'roxo', 'dourado', 'dourado'][Math.min(5, run.rank)]}`, 2);
  run.ev.push({ k: 'buy', what: x.what ?? '' });
}

// ─── andares e bênçãos ──────────────────────────────────────────────────────

export function offerBuffs(run: Run, salt = 0): BuffId[] {
  const r = rng(run.seed + run.floor * 101 + salt);
  const pool = BUFFS.map(b => b.id).filter(b => !(b === 'recarga' && buffN(run, 'recarga') >= 2));
  const out: BuffId[] = [];
  while (out.length < 3) { const b = pool[Math.floor(r() * pool.length)]; if (!out.includes(b)) out.push(b); }
  return out;
}
function applyBuff(run: Run, id: BuffId) {
  const p = run.p;
  run.buffs.push(id);
  if (id === 'coracao') { p.max += 1; p.hp = p.max; }
  if (id === 'escudo') { p.armorMax += 1; p.armor = p.armorMax; }
  if (id === 'mana') { p.manaMax += 40; p.mana = p.manaMax; }
}
/** Escolhe a bênção e desce para o próximo andar. */
export function chooseBuff(prev: Run, id: BuffId): Run {
  if (!prev.choice?.includes(id)) return prev;
  const run = clone(prev);
  const p = run.p;
  sweepRoom(run);
  if (p.form) endForm(run);
  applyBuff(run, id);
  run.choice = undefined;
  run.floor += 1;
  run.d = generate(run.seed, run.rank, run.floor, { pesadelo: run.pesadelo });
  run.room = run.d.start;
  run.cleared = run.d.rooms.map(CLEAR_ON_START);
  run.seen = run.d.rooms.map(() => false);
  run.breaks = run.d.rooms.map(r => r.breaks.map(b => ({ ...b })));
  run.cracked = [];
  run.enemies = []; run.shots = []; run.warns = []; run.loot = []; run.pickups = []; run.chests = []; run.acts = []; run.queue = [];
  run.allies = run.allies.filter(a => a.life === undefined);
  p.x = CX + 0.5; p.y = CY + 0.5; run.pet.x = p.x - 1; run.pet.y = p.y + 0.8;
  for (const a of run.allies) { a.x = p.x + 1; a.y = p.y + 1; }
  enterRoom(run);
  return run;
}

/** Leva a partida direto para um andar e uma sala (testes, simulação e o robô). */
export function warpTo(prev: Run, floor: number, room: number): Run {
  const run = clone(prev);
  run.floor = floor;
  run.d = generate(run.seed, run.rank, floor, { pesadelo: run.pesadelo });
  run.cleared = run.d.rooms.map(CLEAR_ON_START);
  run.seen = run.d.rooms.map(() => false);
  run.breaks = run.d.rooms.map(r => r.breaks.map(b => ({ ...b })));
  run.cracked = []; run.enemies = []; run.shots = []; run.warns = []; run.loot = []; run.pickups = []; run.acts = []; run.queue = [];
  run.room = Math.max(0, Math.min(run.d.rooms.length - 1, room));
  run.p.x = CX + 0.5; run.p.y = room === run.d.end ? RH - 2.5 : CY + 0.5;
  enterRoom(run);
  run.ev = [];
  return run;
}

// ─── prêmio (as regras de valor ficam em hunter.ts) ─────────────────────────

/** A carta que o chefe do portal dá: uma do deck do chefe do andar do rank, pela semente. */
export function dungeonCard(rank: number, seed: number): string {
  const deck = [...new Set(towerBoss(RANK_ANDAR[Math.min(5, rank)]).deck.map(c => c.id))];
  return deck[Math.floor(rng(seed ^ 0x5eed)() * deck.length)];
}
export { ENEMY, addStatus, FLOORS };
export type { Progress, Enemy };
