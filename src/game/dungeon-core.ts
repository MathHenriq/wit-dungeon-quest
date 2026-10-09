// Núcleo da partida da masmorra: tipos do estado (JSON puro), física das
// salas, dano nos inimigos (estados, reações, postura, empurrão, escudos) e no
// caçador (esquiva perfeita, escudo, estados), prêmios no chão. As peças das
// cartas ficam em dungeon-cast.ts; os inimigos em dungeon-ai.ts e os chefes
// em dungeon-boss.ts; o passo da partida em dungeon.ts.
import type { Element } from '@/lib/tcg/types';
import type { PathId } from '@/lib/tcg/paths';
import { addStatus, canAct, dotOf, hasSt, react, type Bag, type BuffKind, type Cine, type Form, type Hit, type Move, type StatusId } from './dungeon-moves';
import {
  CX, CY, isBoss, RH, RW, solidAt, type Breakable, type BreakKind, type Dungeon, type EliteMod, type EnemyKind, type Hazard, type Side,
} from './dungeon-map';
import type { WeaponId } from './dungeon-weapons';
import type { Skill } from './dungeon-skills';
import { NO_STATS, type SombraKind, type StatPts } from './hunter-state';
export { NO_STATS, type StatPts };

// ─── tipos ──────────────────────────────────────────────────────────────────

export type Phase = 1 | 2 | 3;
export type Weight = 'leve' | 'medio' | 'pesado' | 'chefe';
export interface Enemy {
  id: number; kind: EnemyKind; x: number; y: number; hp: number; max: number;
  /** recarga do ataque; tempo de vida; brilho de acerto */
  cd: number; t: number; hit: number;
  /** 'wind' = avisando o golpe; 'dash' = investida; 'card' = carta virando em cima da cabeça; 'under' = cavador embaixo da terra */
  state: 'move' | 'wind' | 'dash' | 'card' | 'under'; st: number; vx: number; vy: number;
  /** estados (queimar, molhado, congelado...) */
  sb: Bag;
  /** chefe: fase e qual golpe vem; o que o golpe avisado solta quando o aviso acaba */
  phase: Phase; next: number; act?: string;
  /** postura: quebrou = atordoado e leva +50% */
  poise: number; poiseMax: number; poiseT: number; broken: number; immune: number;
  /** empurrão em andamento */
  kbx: number; kby: number;
  elite?: EliteMod; eliteOff: number;
  /** cartas que o inimigo usa; recarga; a que está virando agora e para onde mira */
  cards: string[]; cardCd: number; card?: string; cax: number; cay: number;
  /** última carta do caçador que acertou (maestria) */
  by?: string;
  /** para onde olha (escudeiro, Golem de Lava) */
  face: number;
  /** escudo do chefe (Guardião: lampiões; Troll: armadura de gelo) */
  shield: number; shieldMax: number;
  /** tempo invisível (fantasma, teleporte) e outros relógios */
  ghost: number; aux: number; aux2: number;
  scale: number; enraged: boolean;
  /** veio de um chefe/invocador (não conta para a sala) */
  minion?: boolean;
  /** some sozinho (cópia de sombra, sombra levantada) */
  life?: number;
}
export type ShotKind = 'bala' | 'flecha' | 'orbe' | 'magia' | 'carta' | 'porrete' | 'bomba' | 'pedra' | 'folha' | 'gelo' | 'fogo' | 'meialua';
export interface Shot { id: number; x: number; y: number; vx: number; vy: number; mine: boolean; life: number; dmg: number; r: number; pierce?: boolean; blast?: number; hits?: number[]; kind: ShotKind; el?: Element; st?: StatusId; frozen?: number; back?: number; ox?: number; oy?: number }
export interface Warn { id: number; kind: 'circle' | 'line'; x: number; y: number; r: number; x2: number; y2: number; t: number; total: number; dmg: number; src: number; st?: StatusId }
export interface Loot { id: number; x: number; y: number; item: string; n: number }
export interface Pickup { id: number; room: number; x: number; y: number; kind: 'arma' | 'loja' | 'estatua' | 'mercador'; weapon?: WeaponId; what?: string; price?: number }
export type AllyKind = SombraKind | 'formiga' | 'mago' | 'sombra' | 'inseto' | 'diabo' | 'torreta' | 'clone' | 'levantado';
export interface Ally { id: number; kind: AllyKind; x: number; y: number; cd: number; atk: number; life?: number; dmg?: number; every?: number; range?: number; hit?: Hit; card?: string; el?: Element }
export type LootCat = 'minerio' | 'erva' | 'cristal' | 'trofeu';
export interface Pet { id: string; x: number; y: number; bag: Record<LootCat, number>; items: Record<string, number>; target: number }
export interface FormState {
  form: Form; t: number; total: number; scale: number; speed: number; dmg: number;
  noDodge: boolean; noKnock: boolean; voa: boolean; dashFree: boolean; imuneStatus: boolean; paraTiros: boolean;
  stomp?: { r: number; every: number; hit: Hit }; aura?: { r: number; tick: number; hit: Hit }; fim?: { r: number; hit: Hit }; tiro?: Hit; cansa: number;
  stompT: number; auraT: number; power: number; card: string; el: Element;
}
export interface Boon { kind: BuffKind; t: number; v: number }
export interface Player {
  x: number; y: number; hp: number; max: number; armor: number; armorMax: number; armorT: number;
  mana: number; manaMax: number;
  face: Side; dash: number; dashCd: number; dashAge: number; inv: number; dx: number; dy: number; vx: number; vy: number;
  /** onde a esquiva começou (esquiva perfeita) */
  dsx: number; dsy: number;
  /** [curta, longa] com nível do ferreiro; qual está na mão */
  arms: [{ id: WeaponId; lvl: number }, { id: WeaponId; lvl: number }]; hand: 0 | 1; atk: number; swing: number;
  /** combo de 3 golpes; janela; segurando o ataque (golpe pesado); janela do golpe da esquiva */
  cs: number; cw: number; hold: number; held: boolean; dashAtk: number; heavy: number; swingKind: 'leve' | 'final' | 'pesado' | 'investida';
  /** esquiva perfeita: próximo golpe crítico; já usou nesta esquiva */
  perfect: boolean; perfectUsed: boolean;
  skills: Skill[]; skillCd: number[]; charge?: { slot: number; t: number; max: number };
  potions: { vida: number; mana: number };
  form?: FormState;
  /** travado (rajada, cena): não anda nem ataca */
  lock: number;
  boons: Boon[]; critN: number; eco: boolean;
  sb: Bag; burnT: number;
  classe: PathId; classCd: number; classMax: number;
  stats: StatPts;
  hidden: number;
  /** imunidade a controle (congelado, atordoado, preso) depois de sair de um */
  ccImmune: number;
}
export interface Act {
  id: number; mv: Move; mine: boolean; src: number; card: string; el: Element; power: number;
  x: number; y: number; ox: number; oy: number; ang: number; vx: number; vy: number;
  t: number; life: number; r: number; w: number; len: number;
  hits: Record<number, number>;
  n: number; back: boolean; bounce: number; target: number; stuck: number; charge: number; tick: number;
  /** chuva: golpes caindo (onde e quanto falta) */
  pts: { x: number; y: number; t: number }[];
}
export interface Pend { t: number; mv: Move; mine: boolean; src: number; card: string; el: Element; power: number; ang: number; tx: number; ty: number; tgt: number; charge: number }
export type BuffId = 'coracao' | 'escudo' | 'mana' | 'critico' | 'recarga' | 'faro' | 'lamina' | 'mira' | 'vampiro' | 'esquiva' | 'postura' | 'reacao';
export type Grade = 'S' | 'A' | 'B' | 'C';

export type Ev =
  | { k: 'swing'; x: number; y: number; ang: number; arc: number; range: number; kind?: 'leve' | 'final' | 'pesado' | 'investida' }
  | { k: 'shoot'; x: number; y: number; ang: number }
  | { k: 'hit'; x: number; y: number; dmg: number; crit: boolean; block?: boolean }
  | { k: 'kill'; x: number; y: number; kind: EnemyKind; elite?: boolean }
  | { k: 'break'; x: number; y: number; kind: BreakKind }
  | { k: 'cast'; slot: number; x: number; y: number; tx: number; ty: number; card: string; el: Element; skill?: Skill }
  | { k: 'hurt' } | { k: 'block' } | { k: 'deflect'; x: number; y: number } | { k: 'nomana' } | { k: 'potion'; what: 'vida' | 'mana' }
  | { k: 'pick'; item: string; n: number } | { k: 'full'; cat: LootCat } | { k: 'room' } | { k: 'wave' } | { k: 'cleared' }
  | { k: 'chest' } | { k: 'buy'; what: string } | { k: 'weapon'; id: WeaponId } | { k: 'stairs' } | { k: 'phase'; phase: Phase } | { k: 'heal'; x: number; y: number }
  | { k: 'reacao'; x: number; y: number; id: string } | { k: 'perfeita'; x: number; y: number } | { k: 'parede'; x: number; y: number }
  | { k: 'postura'; x: number; y: number; boss: boolean } | { k: 'cardflip'; x: number; y: number; card: string } | { k: 'cine'; style: Cine; card: string }
  | { k: 'grade'; g: Grade } | { k: 'forma'; form: Form; on: boolean } | { k: 'reviveu' } | { k: 'segredo' } | { k: 'enrage' }
  | { k: 'zap'; x: number; y: number; x2: number; y2: number } | { k: 'boom'; x: number; y: number; r: number; el: Element } | { k: 'abate'; x: number; y: number }
  | { k: 'classe'; id: PathId } | { k: 'status'; x: number; y: number; st: StatusId } | { k: 'semcarta' } | { k: 'msg'; text: string };

export interface Run {
  seed: number; rank: number; floor: number; pesadelo: boolean; semana: boolean;
  d: Dungeon; room: number; cleared: boolean[]; seen: boolean[]; wave: number;
  breaks: Breakable[][];
  /** salas cuja parede rachada já quebrou */
  cracked: number[];
  p: Player; pet: Pet; allies: Ally[];
  enemies: Enemy[]; shots: Shot[]; warns: Warn[]; loot: Loot[]; pickups: Pickup[];
  acts: Act[]; queue: Pend[];
  /** bênçãos já tomadas; e as 3 oferecidas (a partida para até escolher) */
  buffs: BuffId[]; choice?: BuffId[];
  t: number; seq: number; rs: number;
  gold: number; kills: number; killsBy: Partial<Record<EnemyKind, number>>; hurtCount: number;
  /** elites derrotadas */
  elites: number;
  chests: number[]; bought: number[];
  ev: Ev[];
  result?: 'win' | 'lose';
  /** cena (o tempo quase para), câmera lenta da esquiva perfeita, parada no impacto */
  cine?: { t: number; total: number; style: Cine; x: number; y: number; ang: number; card: string };
  slow: number; stop: number;
  /** contador de acertos sem apanhar; maior da sala; golpes levados na sala; notas das salas */
  combo: number; comboT: number; roomMax: number; roomHurt: number; grades: Grade[];
  /** inimigos derrotados por carta (maestria) e cartas usadas (Códex) */
  cardKills: Record<string, number>; cardUse: Record<string, number>;
  /** Pedras da Ressurreição; já reviveu */
  revive: number; revived: boolean;
  /** tempo de luta com o chefe (furioso aos 3 min); escuridão da sala (0–1) */
  bossT: number; dark: number;
  /** Ceifador: inimigos vencidos levantam como sombra até esse tempo */
  reap: number;
  /** rastros que somem (gelo, veneno, lava); o caçador está no gelo (escorrega) */
  trail: Trail[]; onIce: boolean;
  /** Monarca: sombras no chão que levantam se ninguém pisar */
  corpses: { id: number; x: number; y: number; t: number }[];
}
export type Trail = Hazard & { t: number };
export interface Input { mx: number; my: number; ax: number; ay: number; attack: boolean; dodge: boolean; swap?: boolean; use?: boolean; skill?: number; held?: number; classe?: boolean }
export const NO_INPUT: Input = { mx: 0, my: 0, ax: 0, ay: 0, attack: false, dodge: false };

// ─── números ────────────────────────────────────────────────────────────────

export interface EnemyDef { hp: number; speed: number; r: number; gold: number; touch: boolean; weight: Weight; fly?: boolean; name: string }
export const ENEMY: Record<EnemyKind, EnemyDef> = {
  goblin: { hp: 26, speed: 2.4, r: 0.38, gold: 2, touch: false, weight: 'medio', name: 'Goblin' },
  arqueiro: { hp: 18, speed: 1.8, r: 0.36, gold: 2, touch: false, weight: 'leve', name: 'Goblin Arqueiro' },
  xama: { hp: 22, speed: 1.6, r: 0.38, gold: 3, touch: false, weight: 'leve', name: 'Goblin Xamã' },
  slime: { hp: 22, speed: 2.2, r: 0.42, gold: 1, touch: true, weight: 'medio', name: 'Slime' },
  slimeP: { hp: 8, speed: 2.8, r: 0.28, gold: 1, touch: true, weight: 'leve', name: 'Slime pequeno' },
  morcego: { hp: 12, speed: 3.2, r: 0.33, gold: 1, touch: true, weight: 'leve', fly: true, name: 'Morcego' },
  lobo: { hp: 34, speed: 2.2, r: 0.42, gold: 3, touch: false, weight: 'medio', name: 'Lobo Sombrio' },
  golem: { hp: 80, speed: 1.1, r: 0.6, gold: 5, touch: false, weight: 'pesado', name: 'Golem' },
  escudeiro: { hp: 40, speed: 1.5, r: 0.45, gold: 4, touch: false, weight: 'pesado', name: 'Goblin Escudeiro' },
  bombardeiro: { hp: 20, speed: 1.7, r: 0.38, gold: 3, touch: false, weight: 'leve', name: 'Goblin Bombardeiro' },
  mago: { hp: 26, speed: 1.5, r: 0.38, gold: 4, touch: false, weight: 'leve', name: 'Goblin Mago' },
  invocador: { hp: 34, speed: 1.3, r: 0.4, gold: 5, touch: false, weight: 'medio', name: 'Invocador' },
  cavador: { hp: 30, speed: 3, r: 0.4, gold: 4, touch: false, weight: 'medio', name: 'Toupeira Cavadora' },
  espirito: { hp: 14, speed: 2.6, r: 0.32, gold: 1, touch: true, weight: 'leve', fly: true, name: 'Espírito' },
  planta: { hp: 30, speed: 0, r: 0.45, gold: 2, touch: false, weight: 'pesado', name: 'Planta Torreta' },
  sombraP: { hp: 50, speed: 3.6, r: 0.36, gold: 0, touch: false, weight: 'medio', name: 'Sombra do Caçador' },
  minion: { hp: 10, speed: 2.8, r: 0.3, gold: 0, touch: true, weight: 'leve', name: 'Lacaio' },
  reiGoblin: { hp: 900, speed: 1.4, r: 0.95, gold: 30, touch: true, weight: 'chefe', name: 'Rei Goblin' },
  guardiao: { hp: 380, speed: 1.2, r: 0.95, gold: 30, touch: true, weight: 'chefe', fly: true, name: 'Guardião da Cripta' },
  troll: { hp: 420, speed: 1.2, r: 1, gold: 30, touch: true, weight: 'chefe', name: 'Troll de Gelo' },
  golemLava: { hp: 460, speed: 1, r: 1.05, gold: 30, touch: true, weight: 'chefe', name: 'Golem de Lava' },
  espiritoFloresta: { hp: 420, speed: 1.1, r: 0.95, gold: 30, touch: true, weight: 'chefe', fly: true, name: 'Espírito da Floresta' },
  monarca: { hp: 900, speed: 1.6, r: 0.9, gold: 30, touch: true, weight: 'chefe', name: 'Monarca das Sombras' },
};
/** Vida dos inimigos por rank (E…S); cresce 12% a cada andar. Ajustada pela simulação
 *  (`scripts/masmorra-sim.ts`) para a vitória cair a cada portal; o A não sobe porque os
 *  inimigos dele já são os mais duros (xamã que cura, golem, invocador). */
export const HP_RANK = [1.5, 2.5, 4.6, 4.6, 4.4, 7.5];
export const hpMult = (rank: number, floor: number) => HP_RANK[Math.min(5, rank)] * (1 + (floor - 1) * 0.12);
/** Vida extra dos chefes (luta de ~1 a 3 min; o do A cura com as plantas, por isso menos). */
export const BOSS_HP = [1.5, 1.5, 2.0, 1.8, 1.5, 2.5];
export const KB_MULT: Record<Weight, number> = { leve: 1, medio: 0.6, pesado: 0.25, chefe: 0.05 };
const POISE: Record<Weight, number> = { leve: 0.35, medio: 0.45, pesado: 0.35, chefe: 0.18 };
export const SPEED = 4.6, DASH = 13, DASH_T = 0.17, DASH_CD = 0.8, PR = 0.3, ESHOT = 5.2, ARROW = 9.5, INV = 0.8;
export const AUTO_AIM = 9, ARMOR_WAIT = 3.5;
/** Janela da esquiva perfeita (o golpe chega logo no começo da esquiva). */
export const PERFECT = 0.22;

export const rand = (run: Run) => { run.rs = (run.rs + 0x6d2b79f5) >>> 0; let t = run.rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const buffN = (run: Run, b: BuffId) => run.buffs.filter(x => x === b).length;
export const boonOf = (p: Player, k: BuffKind) => p.boons.find(b => b.kind === k && b.t > 0);

export function newEnemy(run: Run, kind: EnemyKind, x: number, y: number, o: { elite?: EliteMod; cards?: string[]; minion?: boolean } = {}): Enemy {
  const def = ENEMY[kind], boss = isBoss(kind);
  let max = Math.round(def.hp * hpMult(run.rank, boss ? 5 : run.floor) * (boss ? BOSS_HP[Math.min(5, run.rank)] : 1) * (o.elite ? 2.2 : 1) * (o.minion ? 0.7 : 1));
  if (run.pesadelo) max = Math.round(max * 1.25);
  const pm = Math.round(max * POISE[def.weight] * (o.elite === 'blindado' ? 2 : 1));
  return {
    id: run.seq++, kind, x, y, hp: max, max, cd: 0.8 + rand(run) * 1.2, t: 0, hit: 0, state: 'move', st: 0, vx: 0, vy: 0, sb: {},
    phase: 1, next: 0, poise: pm, poiseMax: pm, poiseT: 0, broken: 0, immune: 0, kbx: 0, kby: 0,
    elite: o.elite, eliteOff: 0, cards: o.cards ?? [], cardCd: 2.5 + rand(run) * 3, cax: 0, cay: 0,
    face: Math.PI / 2, shield: 0, shieldMax: 0, ghost: 0, aux: 0, aux2: 0, scale: o.elite ? 1.25 : 1, enraged: false, minion: o.minion,
  };
}

// ─── física ─────────────────────────────────────────────────────────────────

export const roomOf = (run: Run) => run.d.rooms[run.room];
export const isCracked = (run: Run, room = run.room) => run.cracked.includes(room);
export const blocked = (run: Run, x: number, y: number, rad: number, fly = false) => {
  const r = roomOf(run), open = run.cleared[run.room], cr = isCracked(run);
  for (const [cx, cy] of [[x - rad, y - rad], [x + rad, y - rad], [x - rad, y + rad], [x + rad, y + rad]]) {
    const tx = Math.floor(cx), ty = Math.floor(cy);
    if (fly ? (tx <= 0 || ty <= 0 || tx >= RW - 1 || ty >= RH - 1) && solidAt(r, tx, ty, open, [], cr) : solidAt(r, tx, ty, open, run.breaks[run.room], cr)) return true;
  }
  return false;
};
export function moveBody(run: Run, b: { x: number; y: number }, vx: number, vy: number, dt: number, rad: number, fly = false): boolean {
  let hit = false;
  const nx = b.x + vx * dt; if (!blocked(run, nx, b.y, rad, fly)) b.x = nx; else hit = true;
  const ny = b.y + vy * dt; if (!blocked(run, b.x, ny, rad, fly)) b.y = ny; else hit = true;
  return hit;
}
export const angDiff = (a: number, b: number) => Math.abs(((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
export function segDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}
/** Até onde uma linha anda antes de bater na parede (passo de meio bloco). */
export function rayLen(run: Run, x: number, y: number, ang: number, max: number): number {
  const r = roomOf(run);
  for (let d = 0.5; d <= max; d += 0.25) {
    const tx = Math.floor(x + Math.cos(ang) * d), ty = Math.floor(y + Math.sin(ang) * d);
    if (tx <= 0 || ty <= 0 || tx >= RW - 1 || ty >= RH - 1 || r.rocks.some(([a, b]) => a === tx && b === ty)) return Math.max(0.5, d - 0.25);
  }
  return max;
}
export const inRoom = (x: number, y: number) => ({ x: Math.max(1.4, Math.min(RW - 1.4, x)), y: Math.max(1.4, Math.min(RH - 1.4, y)) });
export const bodyR = (e: Enemy) => ENEMY[e.kind].r * e.scale;
/** O inimigo pode ser acertado agora (cavador embaixo da terra e fantasma sumido não). */
export const targetable = (e: Enemy) => e.hp > 0 && e.state !== 'under' && e.ghost <= 0;

// ─── o caçador apanha ───────────────────────────────────────────────────────

/** Duração dos estados no caçador (mais curtos que nos inimigos). */
const ON_PLAYER: Partial<Record<StatusId, number>> = { congelado: 0.8, atordoado: 0.5, preso: 1, selado: 3, cego: 2.5, lento: 2, lama: 2, queimar: 3, chamaNegra: 5, veneno: 5, molhado: 4, eletrizado: 3, amaldicoado: 4, marcado: 1.2, semente: 2, corte: 0 };

export function playerStatus(run: Run, st: StatusId, n = 1) {
  const p = run.p;
  if (p.form?.imuneStatus || !ON_PLAYER[st]) return;
  // molhado e raio: atordoa; molhado e gelo: congela
  if (st === 'eletrizado' && hasSt(p.sb, 'molhado') && p.ccImmune <= 0) { delete p.sb.molhado; addStatus(p.sb, 'atordoado', 0.7); p.ccImmune = 2.2; run.ev.push({ k: 'reacao', x: p.x, y: p.y, id: 'choque' }); return; }
  if ((st === 'lento' || st === 'congelado') && hasSt(p.sb, 'molhado') && p.ccImmune <= 0) { delete p.sb.molhado; addStatus(p.sb, 'congelado', 1); p.ccImmune = 2.5; run.ev.push({ k: 'reacao', x: p.x, y: p.y, id: 'congelou' }); return; }
  if (st === 'congelado' || st === 'atordoado' || st === 'preso') {
    if (p.ccImmune > 0) return;
    p.ccImmune = ON_PLAYER[st]! + 1.5;
  }
  addStatus(p.sb, st, ON_PLAYER[st]!, 0, n);
  if (st === 'queimar' || st === 'chamaNegra') p.burnT = Math.max(p.burnT, 2);
  run.ev.push({ k: 'status', x: p.x, y: p.y, st });
}

/** O caçador leva `dmg` corações (o escudo segura primeiro). Esquiva no começo = ESQUIVA PERFEITA. */
export function hurtPlayer(run: Run, dmg = 1, o: { st?: StatusId; through?: boolean } = {}): boolean {
  const p = run.p;
  if (run.result || dmg <= 0) return false;
  if (p.dash > 0 && p.dashAge < PERFECT + 0.04 * buffN(run, 'esquiva') && !p.perfectUsed) {
    p.perfectUsed = true; p.perfect = true; run.slow = 0.6;
    run.ev.push({ k: 'perfeita', x: p.x, y: p.y });
    return false;
  }
  if (p.inv > 0 || p.dash > 0 || p.lock > 0 || boonOf(p, 'imune')) return false;
  p.armorT = ARMOR_WAIT;
  let left = dmg + (run.pesadelo && !o.through ? 1 : 0);
  const extra = boonOf(p, 'escudo');
  if (extra && extra.v > 0 && !o.through) { const a = Math.min(extra.v, left); extra.v -= a; left -= a; run.ev.push({ k: 'block' }); }
  if (p.armor > 0 && !o.through && left > 0) { const a = Math.min(p.armor, left); p.armor -= a; left -= a; run.ev.push({ k: 'block' }); }
  if (left > 0) { p.hp -= left; run.ev.push({ k: 'hurt' }); run.hurtCount++; run.roomHurt++; run.combo = 0; }
  if (o.st) playerStatus(run, o.st);
  p.inv = INV;
  if (p.hp <= 1 && p.hp > 0 && p.potions.vida > 0) { p.potions.vida--; p.hp = Math.min(p.max, p.hp + 3); run.ev.push({ k: 'potion', what: 'vida' }); }
  if (p.hp <= 0) {
    if (run.revive > 0 && !run.revived) {
      // Pedra da Ressurreição: volta com metade da vida e empurra todo mundo
      run.revive--; run.revived = true; p.hp = Math.max(1, Math.ceil(p.max / 2)); p.inv = 2.5;
      for (const e of run.enemies) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (d < 4) { e.kbx = (dx / d) * 14 * KB_MULT[ENEMY[e.kind].weight]; e.kby = (dy / d) * 14 * KB_MULT[ENEMY[e.kind].weight]; } }
      run.shots = run.shots.filter(s => s.mine);
      run.ev.push({ k: 'reviveu' });
    } else { p.hp = 0; run.result = 'lose'; }
  }
  return true;
}

// ─── o inimigo apanha ───────────────────────────────────────────────────────

export interface DmgOpts {
  el?: Element; hit?: Hit; card?: string; heavy?: boolean; canCrit?: boolean;
  /** de onde veio o golpe (empurrão e escudo) */
  fx?: number; fy?: number;
  kb?: number; postura?: number; power?: number;
  /** golpe do caçador (conta no combo) */
  me?: boolean;
  noReact?: boolean;
}
/** Valor por segundo (ou da explosão) de cada estado, a partir do dano do golpe. */
const ST_VALUE: Partial<Record<StatusId, number>> = { queimar: 0.18, chamaNegra: 0.35, corte: 0.15, veneno: 0.08, marcado: 0.8, semente: 0.4 };
/** Estados de controle duram menos no chefe. */
const CONTROL: StatusId[] = ['congelado', 'atordoado', 'preso', 'selado', 'lama', 'lento'];

export function critChance(run: Run) { return 0.08 + buffN(run, 'critico') * 0.15 + run.p.stats.percepcao * 0.015; }

/** Dano num inimigo. Devolve o dano que entrou. */
export function damageEnemy(run: Run, e: Enemy, dmgIn: number, o: DmgOpts = {}): number {
  if (!targetable(e) || dmgIn <= 0) return 0;
  const p = run.p, hit = o.hit, boss = isBoss(e.kind), def = ENEMY[e.kind];
  const fx = o.fx ?? p.x, fy = o.fy ?? p.y;
  const fromAng = Math.atan2(fy - e.y, fx - e.x);
  const fura = !!hit?.fura;
  let dmg = dmgIn, block = false;
  // escudos
  if (e.kind === 'escudeiro' && !fura && !o.heavy && angDiff(fromAng, e.face) < 1.05 && e.broken <= 0) { dmg *= 0.15; block = true; }
  if (e.elite === 'blindado' && e.eliteOff <= 0 && !fura && e.broken <= 0) dmg *= 0.5;
  if (e.kind === 'golemLava' && !fura) dmg *= angDiff(fromAng, e.face) > 2.2 && e.aux > 0 ? 2.5 : e.aux > 0 ? 1 : 0.4;
  if (e.kind === 'guardiao' && e.shield > 0) dmg *= Math.max(0.15, 1 - e.shield * (fura ? 0.1 : 0.2));
  if (e.kind === 'troll' && e.shield > 0) {
    const fire = (o.el ?? hit?.el) === 'Fire' || hit?.st === 'queimar';
    const toArmor = dmg * (fire ? 3 : o.heavy ? 4 : fura ? 2 : 0.5);
    e.shield = Math.max(0, e.shield - toArmor);
    run.ev.push({ k: 'hit', x: e.x, y: e.y - 0.5, dmg: Math.round(toArmor), crit: false, block: true });
    if (e.shield <= 0) run.ev.push({ k: 'msg', text: 'A armadura de gelo quebrou!' });
    e.hit = 0.1;
    return 0;
  }
  if (hit?.quebra) { e.eliteOff = 5; if (boss) e.shield = Math.max(0, e.shield - 1); }
  // reações
  let mult = 1;
  const el = hit?.el ?? o.el;
  if (el && !o.noReact) {
    const r = react(e.sb, el, hit?.st, !!o.heavy);
    mult *= r.mult;
    if (r.id) {
      run.ev.push({ k: 'reacao', x: e.x, y: e.y, id: r.id });
      if (r.chain) chainZap(run, e, dmgIn * 0.5, o.card);
      if (r.burst) areaHit(run, e.x, e.y, 2, dmgIn * 0.3 * r.burst, { el: 'Poison', card: o.card, me: o.me, noReact: true }, e.id);
      if (r.spread) for (const x of run.enemies) if (x !== e && targetable(x) && Math.hypot(x.x - e.x, x.y - e.y) < 2.5) for (const s of r.spread) addStatus(x.sb, s.st, s.s.t, s.s.v, s.st === 'veneno' ? s.s.n : 1);
    }
  }
  if (hasSt(e.sb, 'amaldicoado')) mult *= 1.3;
  if (e.broken > 0) mult *= 1.5;
  if (hit?.low && p.max > 1) mult *= 1 + hit.low * (1 - (p.hp - 1) / (p.max - 1));
  if (hit?.pesado && (def.weight === 'pesado' || boss)) mult *= hit.pesado;
  const canCrit = o.canCrit !== false;
  let crit = false;
  if (canCrit && (hit?.crit || (o.me && (p.perfect || p.critN > 0)) || rand(run) < critChance(run))) {
    crit = true;
    if (o.me && p.perfect) p.perfect = false; else if (o.me && p.critN > 0 && !hit?.crit) p.critN--;
  }
  let d = Math.max(1, Math.round(dmg * mult * (crit ? 2 : 1)));
  // chefe: nenhum golpe tira mais de 8% da vida (a luta tem um tamanho mínimo)
  if (boss) d = Math.min(d, Math.round(e.max * 0.08));
  e.hp -= d; e.hit = 0.12;
  if (o.card) e.by = o.card;
  run.ev.push({ k: 'hit', x: e.x, y: e.y, dmg: d, crit, block });
  if (o.me) { run.combo++; run.comboT = 3; run.roomMax = Math.max(run.roomMax, run.combo); }
  // abate (derruba o comum fraco)
  if (hit?.abate && !boss && e.hp > 0 && e.hp / e.max <= hit.abate) { e.hp = 0; run.ev.push({ k: 'abate', x: e.x, y: e.y }); }
  // estados
  const ctl = (s: StatusId, t: number) => (boss && CONTROL.includes(s) ? t * 0.35 : t);
  if (hit?.st && e.hp > 0) { if (addStatus(e.sb, hit.st, ctl(hit.st, hit.sd ?? 3), d * (ST_VALUE[hit.st] ?? 0), hit.n ?? 1)) run.ev.push({ k: 'reacao', x: e.x, y: e.y, id: 'paralisou' }); }
  if (hit?.st2 && e.hp > 0) addStatus(e.sb, hit.st2, ctl(hit.st2, hit.sd2 ?? 3), d * (ST_VALUE[hit.st2] ?? 0));
  // empurrão e puxão
  const kb = (hit?.kb ?? o.kb ?? 0) * KB_MULT[def.weight] * (e.elite === 'blindado' ? 0.5 : 1);
  if (kb > 0) { const dx = e.x - fx, dy = e.y - fy, l = Math.hypot(dx, dy) || 1; e.kbx = (dx / l) * kb; e.kby = (dy / l) * kb; }
  if (hit?.pull && !boss) { const dx = p.x - e.x, dy = p.y - e.y, l = Math.hypot(dx, dy) || 1; const v = Math.max(0, l - 1) * 6 * KB_MULT[def.weight] / 0.6; e.kbx = (dx / l) * v; e.kby = (dy / l) * v; }
  // postura
  if (e.immune <= 0 && e.hp > 0) {
    const pd = d * (hit?.postura ?? o.postura ?? 1) * (o.heavy ? 2.5 : 1) * (o.me && !hit ? 0.5 : 0.6) * (1 + 0.25 * buffN(run, 'postura'));
    e.poise -= pd; e.poiseT = 1.6;
    if (e.poise <= 0) {
      e.broken = boss ? 3 : 1.5; e.poise = e.poiseMax; e.immune = e.broken + (boss ? 7 : 3);
      addStatus(e.sb, 'atordoado', e.broken); e.state = 'move'; e.card = undefined;
      run.ev.push({ k: 'postura', x: e.x, y: e.y, boss }); run.stop = Math.max(run.stop, 0.08);
    }
  }
  // extras do golpe
  if (hit?.zap && o.power) { const z = o.power * hit.zap; run.ev.push({ k: 'zap', x: e.x, y: e.y - 5, x2: e.x, y2: e.y }); if (targetable(e)) { e.hp -= Math.round(z); run.ev.push({ k: 'hit', x: e.x, y: e.y - 0.3, dmg: Math.round(z), crit: false }); } addStatus(e.sb, 'eletrizado', 3); }
  if (hit?.mana) p.mana = Math.min(p.manaMax, p.mana + hit.mana);
  if (hit?.cura && e.hp <= 0) { p.hp = Math.min(p.max, p.hp + hit.cura); run.ev.push({ k: 'heal', x: p.x, y: p.y }); }
  if (e.elite === 'refletor' && e.eliteOff <= 0) { /* refletor devolve tiros (em stepShots) */ }
  return d;
}

/** Choque em cadeia: pula para até 3 vizinhos (os molhados primeiro). */
export function chainZap(run: Run, from: Enemy, dmg: number, card?: string) {
  let cur = from;
  const done = new Set([from.id]);
  for (let k = 0; k < 3; k++) {
    const next = run.enemies.filter(x => !done.has(x.id) && targetable(x) && Math.hypot(x.x - cur.x, x.y - cur.y) < 3.2)
      .sort((a, b) => (hasSt(b.sb, 'molhado') ? 1 : 0) - (hasSt(a.sb, 'molhado') ? 1 : 0) || Math.hypot(a.x - cur.x, a.y - cur.y) - Math.hypot(b.x - cur.x, b.y - cur.y))[0];
    if (!next) break;
    done.add(next.id);
    run.ev.push({ k: 'zap', x: cur.x, y: cur.y, x2: next.x, y2: next.y });
    damageEnemy(run, next, dmg, { el: 'Electric', card, noReact: !hasSt(next.sb, 'molhado'), hit: { d: 0, st: 'eletrizado', sd: 3 } });
    cur = next;
  }
}

/** Dano em área (inimigos e o que quebra). `skip` = id que não leva. */
export function areaHit(run: Run, x: number, y: number, r: number, dmg: number, o: DmgOpts, skip = -1) {
  for (const e of run.enemies) if (e.id !== skip && targetable(e) && Math.hypot(e.x - x, e.y - y) < r + bodyR(e)) damageEnemy(run, e, dmg, { ...o, fx: o.fx ?? x, fy: o.fy ?? y });
  damageBreaks(run, (bx, by) => Math.hypot(bx - x, by - y) < r + 0.4, dmg);
  run.ev.push({ k: 'boom', x, y, r, el: o.el ?? 'Fire' });
}

/** Estados que andam sozinhos: dano por segundo, semente brotando, marca explodindo. */
export function tickStatuses(run: Run, e: Enemy, dt: number) {
  const dot = dotOf(e.sb);
  if (dot > 0 && targetable(e)) e.hp -= dot * dt;
  for (const k of Object.keys(e.sb) as StatusId[]) {
    const s = e.sb[k]!;
    if (k === 'chamaNegra') continue;
    s.t -= dt;
    if (s.t > 0) continue;
    delete e.sb[k];
    if (k === 'semente') { addStatus(e.sb, 'preso', isBoss(e.kind) ? 0.4 : 1.2); if (s.v > 0) { e.hp -= s.v; run.ev.push({ k: 'hit', x: e.x, y: e.y, dmg: Math.round(s.v), crit: false }); } }
    if (k === 'marcado' && s.v > 0) areaHit(run, e.x, e.y, 1.2, s.v, { el: 'Dark', card: e.by, me: true, noReact: true });
  }
}

export function damageBreaks(run: Run, test: (x: number, y: number) => boolean, dmg: number) {
  for (const b of run.breaks[run.room]) {
    if (b.hp <= 0 || !test(b.x + 0.5, b.y + 0.5)) continue;
    b.hp -= dmg;
    if (b.hp <= 0) breakDrop(run, b);
  }
}
export const ORE = ['cobre', 'cobre', 'ferro', 'ferro', 'ouro', 'ouro'];
export const CRYSTAL = ['azul', 'azul', 'roxo', 'roxo', 'dourado', 'dourado'];
export function drop(run: Run, x: number, y: number, item: string, n = 1) {
  const a = rand(run) * Math.PI * 2, d = 0.2 + rand(run) * 0.5;
  run.loot.push({ id: run.seq++, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, item, n });
}
export function breakDrop(run: Run, b: Breakable) {
  run.ev.push({ k: 'break', x: b.x + 0.5, y: b.y + 0.5, kind: b.kind });
  const x = b.x + 0.5, y = b.y + 0.5, rk = Math.min(5, run.rank);
  if (b.kind === 'minerio') drop(run, x, y, `minerio:${ORE[rk]}`, 1 + (rand(run) < 0.4 ? 1 : 0));
  if (b.kind === 'erva') drop(run, x, y, rand(run) < 0.7 ? 'erva:cura' : 'erva:mana');
  if (b.kind === 'cristal') drop(run, x, y, `cristal:${CRYSTAL[rk]}`);
  if (b.kind === 'pedra' && rand(run) < 0.25) drop(run, x, y, `minerio:${ORE[rk]}`);
  if (b.kind === 'barril') { drop(run, x, y, 'moeda', 2 + Math.floor(rand(run) * 3)); if (rand(run) < 0.4) drop(run, x, y, 'mana', 1); }
  if (b.kind === 'explosivo') {
    // barril explosivo: explode em volta (pega inimigos, o caçador e outros barris)
    run.warns.push({ id: run.seq++, kind: 'circle', x, y, r: 1.7, x2: x, y2: y, t: 0.45, total: 0.45, dmg: 1, src: -2, st: 'queimar' });
  }
  if (b.kind === 'lampiao') run.ev.push({ k: 'msg', text: 'Um lampião apagou!' });
}

export function killDrops(run: Run, e: Enemy) {
  if (e.minion) { if (rand(run) < 0.3) drop(run, e.x, e.y, 'moeda', 1); return; }
  const g = ENEMY[e.kind].gold * (e.elite ? 3 : 1);
  drop(run, e.x, e.y, 'moeda', g);
  if (rand(run) < 0.35) drop(run, e.x, e.y, 'mana', 1);
  if (rand(run) < (e.elite ? 0.2 : 0.015)) drop(run, e.x, e.y, 'vida', 1);
  if (['goblin', 'arqueiro', 'xama', 'escudeiro', 'bombardeiro', 'mago'].includes(e.kind) && rand(run) < 0.3) drop(run, e.x, e.y, 'pena');
  if (e.kind === 'lobo' && rand(run) < 0.6) drop(run, e.x, e.y, 'pelo');
  if (e.kind === 'golem' || e.kind === 'cavador') drop(run, e.x, e.y, `minerio:${ORE[Math.min(5, run.rank)]}`, 2);
  if (['slime', 'morcego', 'espirito', 'invocador'].includes(e.kind) && rand(run) < 0.25) drop(run, e.x, e.y, `cristal:${CRYSTAL[Math.min(5, run.rank)]}`);
  if (e.elite) drop(run, e.x, e.y, `cristal:${CRYSTAL[Math.min(5, run.rank)]}`, 1);
  if (isBoss(e.kind)) { for (let k = 0; k < 3; k++) drop(run, e.x, e.y, `cristal:${CRYSTAL[Math.min(5, run.rank)]}`); drop(run, e.x, e.y, 'moeda', 10); }
}

// ─── mira ───────────────────────────────────────────────────────────────────

export function nearestEnemy(run: Run, x: number, y: number, max = AUTO_AIM): Enemy | null {
  let best: Enemy | null = null, bd = max;
  for (const e of run.enemies) { const d = Math.hypot(e.x - x, e.y - y); if (targetable(e) && d < bd) { bd = d; best = e; } }
  return best;
}
export function aimOf(run: Run, input: Input, max = AUTO_AIM): { ax: number; ay: number; target: Enemy | null } {
  const p = run.p;
  if (Math.hypot(input.ax, input.ay) > 0.1) return { ax: input.ax, ay: input.ay, target: null };
  const e = hasSt(p.sb, 'cego') ? null : nearestEnemy(run, p.x, p.y, max);
  if (e) return { ax: e.x - p.x, ay: e.y - p.y, target: e };
  return { ax: p.dx, ay: p.dy, target: null };
}

// ─── avisos ─────────────────────────────────────────────────────────────────

export function warnCircle(run: Run, src: number, x: number, y: number, r: number, t: number, dmg = 1, st?: StatusId) {
  run.warns.push({ id: run.seq++, kind: 'circle', x, y, r, x2: x, y2: y, t, total: t, dmg, src, st });
}
export function warnLine(run: Run, src: number, x: number, y: number, x2: number, y2: number, r: number, t: number, dmg = 1, st?: StatusId) {
  run.warns.push({ id: run.seq++, kind: 'line', x, y, r, x2, y2, t, total: t, dmg, src, st });
}
/** Aviso mais curto nos ranks altos, mas nunca abaixo de ~0,3 s (tempo de reação). */
export const warnT = (run: Run, t: number) => Math.max(0.3, t * (1 - run.rank * 0.04) * (run.pesadelo ? 0.9 : 1));

// ─── alvo dos inimigos, tiros e rastros ─────────────────────────────────────

/** Quem o inimigo persegue: o clone (isca), a sombra tanque perto, ou o caçador. */
export function targetOf(run: Run, e: Enemy): { x: number; y: number } {
  const clone = run.allies.find(a => a.kind === 'clone');
  if (clone) return clone;
  const tank = run.allies.find(a => a.kind === 'tanque');
  if (tank && Math.hypot(tank.x - e.x, tank.y - e.y) < Math.hypot(run.p.x - e.x, run.p.y - e.y) && Math.hypot(tank.x - e.x, tank.y - e.y) < 3) return tank;
  if (run.p.hidden > 0) return { x: e.x + Math.cos(e.t + e.id) * 2, y: e.y + Math.sin(e.t * 0.7 + e.id) * 2 };
  return run.p;
}

export function enemyShot(run: Run, x: number, y: number, a: number, speed: number, kind: ShotKind = 'orbe', o: Partial<Shot> = {}) {
  const k = 1 + run.rank * 0.05;
  run.shots.push({ id: run.seq++, x, y, vx: Math.cos(a) * speed * k, vy: Math.sin(a) * speed * k, mine: false, life: 3.2, dmg: 1, r: kind === 'flecha' ? 0.12 : 0.16, kind, ...o });
}

/** Rastros que somem (gelo, veneno, lava das elites e dos chefes). */
export function addTrail(run: Run, x: number, y: number, kind: Hazard['kind'], t: number) {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (solidAt(roomOf(run), tx, ty, false, [])) return;
  const old = run.trail.find(h => h.x === tx && h.y === ty);
  if (old) { old.kind = kind; old.t = Math.max(old.t, t); }
  else run.trail.push({ x: tx, y: ty, kind, t, ph: 0 });
}


export { CX, CY, canAct };
