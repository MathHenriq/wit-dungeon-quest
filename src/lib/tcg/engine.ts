/**
 * Motor do TCG do WIT Dungeon 2.
 *
 * Funções puras: cada ação recebe um `GameState` e devolve um NOVO estado,
 * sem mexer no original. O estado é JSON do começo ao fim (ver `types.ts`).
 *
 * Regras implementadas (fonte: `docs/regras-tcg.md`):
 *  - Vida 150, mão inicial 5, compra 1 por turno, mão máxima 7.
 *  - Quem começa não compra nem ataca no primeiro turno.
 *  - 1 Ataque por turno. Desafiante sem limite. Até 3 Armadilhas baixadas.
 *  - Sem energia: cartas fortes cobram sacrifício (descartar, moer o próprio
 *    deck, pagar vida, banir do cemitério, pular a compra).
 *  - Deck vazio não é derrota: cada compra impossível causa 5, 10, 15… de dano.
 *  - SEM TETO de dano. Multiplicadores se MULTIPLICAM: dois "×2" dão ×4.
 *    Quem controla o tamanho do dano é o design das cartas, não o motor.
 *
 * A conta do dano, sempre nesta ordem:
 *   (base + bônus somados) × multiplicadores × elemento − redução → escudo
 * e cada parcela aparece no log, para o aluno (e a gente) entender o combo.
 */

import { getTypeEffectiveness } from '@/lib/battle/typeEffectiveness';
import { ELEMENT_PT, STATUS_PT, TYPE_PT, TYPE_PT_PLURAL } from './labels';
import type {
  ActiveModifier, Amount, CardDef, CardFilter, CardInstance, CardType,
  Condition, Cost, Effect, Element, GameState, PlayChoices, PlayerState, Side,
} from './types';

export const RULES = {
  startingLife: 150,
  startingHand: 5,
  maxHand: 7,
  maxTraps: 3,
  attacksPerTurn: 1,
  fatigueStep: 5,
} as const;

/** Jogada inválida. A mensagem é para mostrar ao aluno. */
export class IllegalPlay extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalPlay';
  }
}

export interface PlayerSetup {
  name: string;
  element: Element;
  /** Deck na ordem; com `shuffle: false`, a primeira carta é o topo. */
  deck: CardDef[];
  life?: number;
}

export interface GameOptions {
  seed?: number;
  firstPlayer?: 0 | 1;
  /** Embaralhar os decks. Testes usam `false` para controlar a ordem. */
  shuffle?: boolean;
}

// ─── Aleatório com semente ───────────────────────────────────────────────────
// mulberry32: rápido, sem dependência, e a mesma semente gera a mesma partida.

function random(state: GameState): number {
  state.rng = (state.rng + 0x6D2B79F5) | 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffleInPlace<T>(state: GameState, arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

const other = (i: 0 | 1): 0 | 1 => (i === 0 ? 1 : 0);

function resolveSide(actor: 0 | 1, side: Side | undefined, fallback: Side): 0 | 1 {
  return (side ?? fallback) === 'self' ? actor : other(actor);
}

export function matches(def: CardDef, filter?: CardFilter): boolean {
  if (!filter) return true;
  if (filter.type && def.type !== filter.type) return false;
  if (filter.element && def.element !== filter.element) return false;
  return true;
}

function log(state: GameState, player: 0 | 1 | null, text: string): void {
  state.log.push({ turn: state.turn, player, text });
}

function amountValue(state: GameState, actor: 0 | 1, amount: Amount): number {
  if (typeof amount === 'number') return amount;
  const owner = state.players[resolveSide(actor, amount.owner, 'self')];
  let n: number;
  switch (amount.per) {
    case 'graveyard': n = owner.graveyard.filter(c => matches(c.def, amount.filter)).length; break;
    case 'banished': n = owner.banished.filter(c => matches(c.def, amount.filter)).length; break;
    case 'hand': n = owner.hand.filter(c => matches(c.def, amount.filter)).length; break;
    case 'round': n = Math.ceil(state.turn / 2); break;
    case 'lifeLost': n = owner.maxLife - owner.life; break;
    case 'damageTaken': n = owner.damageTaken; break;
  }
  const v = Math.floor((amount.base ?? 0) + n * amount.each);
  return amount.max !== undefined ? Math.min(v, amount.max) : v;
}

function checkCondition(state: GameState, actor: 0 | 1, cond: Condition): boolean {
  switch (cond.kind) {
    case 'playedThisTurn': {
      const n = state.players[actor].playedThisTurn.filter(d => matches(d, cond.filter)).length;
      return n >= (cond.min ?? 1);
    }
    case 'graveyardCount': {
      const p = state.players[resolveSide(actor, cond.owner, 'self')];
      return p.graveyard.filter(c => matches(c.def, cond.filter)).length >= cond.min;
    }
    case 'lifeAtMost':
      return state.players[resolveSide(actor, cond.owner, 'self')].life <= cond.amount;
    case 'lifeAtLeast':
      return state.players[resolveSide(actor, cond.owner, 'self')].life >= cond.amount;
    case 'hasStatus':
      return state.players[resolveSide(actor, cond.owner, 'opponent')].statuses
        .some(s => s.kind === cond.status);
  }
}

function toGraveyard(state: GameState, owner: 0 | 1, card: CardInstance): void {
  state.players[owner].graveyard.push(card);
}

function loseLife(state: GameState, who: 0 | 1, amount: number): void {
  if (amount <= 0 || state.winner !== null) return;
  const p = state.players[who];
  p.life -= amount;
  p.damageTaken += amount;
  if (p.life <= 0) {
    p.life = 0;
    state.winner = other(who);
    log(state, null, `🏆 ${state.players[other(who)].name} venceu!`);
  }
}

function drawCards(state: GameState, who: 0 | 1, count: number): void {
  const p = state.players[who];
  for (let k = 0; k < count && state.winner === null; k++) {
    const card = p.deck.shift();
    if (card) {
      p.hand.push(card);
      continue;
    }
    p.fatigue += 1;
    const dmg = p.fatigue * RULES.fatigueStep;
    log(state, who, `${p.name} não tem cartas para comprar: fadiga de ${dmg}.`);
    loseLife(state, who, dmg);
  }
}

// ─── Criação ─────────────────────────────────────────────────────────────────

function newPlayer(state: GameState, setup: PlayerSetup): PlayerState {
  const life = setup.life ?? RULES.startingLife;
  return {
    name: setup.name,
    element: setup.element,
    life,
    maxLife: life,
    deck: setup.deck.map(def => ({ uid: `c${state.nextUid++}`, def })),
    hand: [], graveyard: [], banished: [],
    weapon: null, armor: null, traps: [],
    modifiers: [], auras: [], statuses: [], locks: [],
    shields: 0, damageTaken: 0, skipNextDraw: false, fatigue: 0,
    attacksThisTurn: 0, playedThisTurn: [],
  };
}

export function createGame(setup: [PlayerSetup, PlayerSetup], opts: GameOptions = {}): GameState {
  const state = {
    players: undefined as unknown as [PlayerState, PlayerState],
    active: opts.firstPlayer ?? 0,
    turn: 1,
    firstPlayer: opts.firstPlayer ?? 0,
    field: null,
    winner: null,
    log: [],
    rng: (opts.seed ?? 1) | 0,
    nextUid: 1,
  } as GameState;

  state.players = [newPlayer(state, setup[0]), newPlayer(state, setup[1])];

  for (const p of state.players) {
    if (opts.shuffle !== false) shuffleInPlace(state, p.deck);
  }
  drawCards(state, 0, RULES.startingHand);
  drawCards(state, 1, RULES.startingHand);

  startTurn(state);
  return state;
}

// ─── Turno ───────────────────────────────────────────────────────────────────

function startTurn(state: GameState): void {
  const i = state.active;
  const p = state.players[i];
  p.attacksThisTurn = 0;
  p.playedThisTurn = [];
  log(state, i, `— Turno ${state.turn}: ${p.name} —`);

  // Queimadura, veneno e sangramento causam dano no início do turno de quem os carrega.
  for (const s of p.statuses) {
    if (s.kind !== 'freeze' && s.value > 0) {
      log(state, i, `${p.name} sofre ${s.value} de ${STATUS_PT[s.kind]}.`);
      loseLife(state, i, s.value);
    }
  }
  if (state.winner !== null) return;

  // Passivos de início de turno: equipamentos do jogador e o Campo (vale para os dois).
  const sources: CardInstance[] = [p.weapon, p.armor].filter((c): c is CardInstance => c !== null);
  if (state.field) sources.push(state.field.card);
  for (const src of sources) {
    for (const ps of src.def.passives ?? []) {
      if (ps.kind === 'onTurnStart') resolveEffects(state, i, ps.effects, src);
    }
  }
  if (state.winner !== null) return;

  // Auras: efeitos que se repetem por alguns turnos (invocações, regeneração).
  const auras = p.auras;
  p.auras = [];
  for (const a of auras) {
    log(state, i, `${a.label}:`);
    resolveEffects(state, i, a.effects, a.source);
    if (a.turnsLeft > 1) p.auras.push({ ...a, turnsLeft: a.turnsLeft - 1 });
    if (state.winner !== null) return;
  }

  if (state.turn === 1 && i === state.firstPlayer) {
    return; // quem começa não compra no primeiro turno
  }
  if (p.skipNextDraw) {
    p.skipNextDraw = false;
    log(state, i, `${p.name} pula a compra deste turno.`);
    return;
  }
  drawCards(state, i, 1);
}

export function endTurn(stateIn: GameState, choices: { discard?: string[] } = {}): GameState {
  const state = structuredClone(stateIn);
  if (state.winner !== null) throw new IllegalPlay('A partida já acabou.');
  const i = state.active;
  const p = state.players[i];

  // Limite de mão: o excesso vai para o cemitério.
  const escolhidas = [...(choices.discard ?? [])];
  while (p.hand.length > RULES.maxHand) {
    const uid = escolhidas.shift();
    let idx = uid ? p.hand.findIndex(c => c.uid === uid) : -1;
    if (idx < 0) idx = p.hand.length - 1;
    const [card] = p.hand.splice(idx, 1);
    toGraveyard(state, i, card);
    log(state, i, `${p.name} descarta ${card.def.name} (limite de ${RULES.maxHand} cartas na mão).`);
  }

  // Durações contam os turnos de quem está sendo afetado, e terminam no fim deles.
  p.statuses = p.statuses
    .map(s => ({ ...s, turnsLeft: s.turnsLeft - 1 }))
    .filter(s => s.turnsLeft > 0);
  p.locks = p.locks
    .map(l => ({ ...l, turnsLeft: l.turnsLeft - 1 }))
    .filter(l => l.turnsLeft > 0);
  p.modifiers = p.modifiers.flatMap(m => {
    if (m.turnsLeft === undefined) return [m];
    const turnsLeft = m.turnsLeft - 1;
    if (turnsLeft <= 0) {
      log(state, i, `${m.label} expirou sem ser usado.`);
      return [];
    }
    return [{ ...m, turnsLeft }];
  });

  p.damageTaken = 0;
  state.active = other(i);
  state.turn += 1;
  startTurn(state);
  return state;
}

// ─── Validação ───────────────────────────────────────────────────────────────

export type PlayCheck = { ok: true } | { ok: false; reason: string };

function costCheck(p: PlayerState, card: CardInstance, cost: Cost): string | null {
  switch (cost.kind) {
    case 'discard': {
      const n = p.hand.filter(c => c.uid !== card.uid && matches(c.def, cost.filter)).length;
      return n >= cost.count ? null : `Precisa descartar ${cost.count} carta(s) e só tem ${n}.`;
    }
    case 'mill':
      return p.deck.length >= cost.count ? null : `Precisa de ${cost.count} carta(s) no deck.`;
    case 'payLife':
      return p.life > cost.amount ? null : `Vida insuficiente para pagar ${cost.amount}.`;
    case 'banish': {
      const n = p.graveyard.filter(c => matches(c.def, cost.filter)).length;
      return n >= cost.count ? null : `Precisa de ${cost.count} carta(s) compatíveis no cemitério e tem ${n}.`;
    }
    case 'skipDraw':
      return null;
  }
}

export function canPlay(state: GameState, uid: string): PlayCheck {
  if (state.winner !== null) return { ok: false, reason: 'A partida já acabou.' };
  const i = state.active;
  const p = state.players[i];
  const card = p.hand.find(c => c.uid === uid);
  if (!card) return { ok: false, reason: 'Essa carta não está na sua mão.' };
  const { def } = card;

  const lock = p.locks.find(l => l.cardType === def.type);
  if (lock) return { ok: false, reason: `Você não pode jogar ${TYPE_PT_PLURAL[def.type]} neste turno.` };

  if (def.type === 'attack') {
    if (state.turn === 1 && i === state.firstPlayer) {
      return { ok: false, reason: 'Quem começa não ataca no primeiro turno.' };
    }
    if (p.attacksThisTurn >= RULES.attacksPerTurn) {
      return { ok: false, reason: 'Só 1 Ataque por turno.' };
    }
    if (p.statuses.some(s => s.kind === 'freeze')) {
      return { ok: false, reason: 'Congelado: não pode atacar neste turno.' };
    }
  }
  if (def.type === 'trap' && p.traps.length >= RULES.maxTraps) {
    return { ok: false, reason: `Máximo de ${RULES.maxTraps} Armadilhas baixadas.` };
  }
  for (const cost of def.cost ?? []) {
    const problem = costCheck(p, card, cost);
    if (problem) return { ok: false, reason: problem };
  }
  return { ok: true };
}

/** Cartas da mão do jogador ativo que podem ser jogadas agora. */
export function playableCards(state: GameState): CardInstance[] {
  return state.players[state.active].hand.filter(c => canPlay(state, c.uid).ok);
}

// ─── Custos ──────────────────────────────────────────────────────────────────

function payCosts(state: GameState, i: 0 | 1, card: CardInstance, choices: PlayChoices): string[] {
  const p = state.players[i];
  const pagos: string[] = [];
  const escolhaDescarte = [...(choices.discard ?? [])];
  const escolhaBanir = [...(choices.banish ?? [])];

  for (const cost of card.def.cost ?? []) {
    switch (cost.kind) {
      case 'discard': {
        for (let k = 0; k < cost.count; k++) {
          const cands = p.hand.filter(c => matches(c.def, cost.filter));
          const pref = escolhaDescarte.shift();
          const pick = cands.find(c => c.uid === pref) ?? cands[cands.length - 1];
          p.hand.splice(p.hand.indexOf(pick), 1);
          toGraveyard(state, i, pick);
          pagos.push(`descarta ${pick.def.name}`);
        }
        break;
      }
      case 'mill': {
        const milled = p.deck.splice(0, cost.count);
        milled.forEach(c => toGraveyard(state, i, c));
        pagos.push(`manda ${milled.map(c => c.def.name).join(', ')} do deck ao cemitério`);
        break;
      }
      case 'payLife':
        p.life -= cost.amount;
        pagos.push(`paga ${cost.amount} de vida`);
        break;
      case 'banish': {
        for (let k = 0; k < cost.count; k++) {
          const cands = p.graveyard.filter(c => matches(c.def, cost.filter));
          const pref = escolhaBanir.shift();
          const pick = cands.find(c => c.uid === pref) ?? cands[0];
          p.graveyard.splice(p.graveyard.indexOf(pick), 1);
          p.banished.push(pick);
          pagos.push(`bane ${pick.def.name}`);
        }
        break;
      }
      case 'skipDraw':
        p.skipNextDraw = true;
        pagos.push('abre mão da próxima compra');
        break;
    }
  }
  return pagos;
}

// ─── Armadilhas ──────────────────────────────────────────────────────────────

/**
 * Dispara a PRIMEIRA armadilha compatível do dono. Uma por evento: sem cadeias,
 * para a regra ficar previsível para o aluno. Devolve se a carta foi anulada.
 */
type TrapResult = 'none' | 'negated' | 'reflected';

function fireTrap(
  state: GameState,
  owner: 0 | 1,
  trigger: 'opponentAttack' | 'opponentPlays',
  incoming: CardInstance,
): TrapResult {
  const p = state.players[owner];
  const idx = p.traps.findIndex(t => {
    const spec = t.def.trap;
    return spec?.trigger === trigger
      && matches(incoming.def, spec.filter)
      && (!spec.condition || checkCondition(state, owner, spec.condition));
  });
  if (idx < 0) return 'none';
  const [trap] = p.traps.splice(idx, 1);
  const spec = trap.def.trap!;
  log(state, owner, `⚠ Armadilha revelada: ${trap.def.name}!`);
  if (spec.effects) resolveEffects(state, owner, spec.effects, trap);
  toGraveyard(state, owner, trap);
  if (spec.reflect && incoming.def.type === 'attack') {
    log(state, owner, `${incoming.def.name} foi refletido de volta!`);
    return 'reflected';
  }
  if (spec.negate) {
    log(state, owner, `${incoming.def.name} foi anulada.`);
    return 'negated';
  }
  return 'none';
}

// ─── Dano ────────────────────────────────────────────────────────────────────

interface Bonus { value: number; label: string }
interface AttackCtx { adds: Bonus[]; mults: Bonus[] }

interface DamageArgs {
  attacker: 0 | 1;
  target: 0 | 1;
  card: CardDef;
  base: number;
  isAttack: boolean;
  ctx?: AttackCtx;
  /** Ignora redução de dano e escudo. */
  pierce?: boolean;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''));

function dealDamage(state: GameState, a: DamageArgs): number {
  const atk = state.players[a.attacker];
  const def = state.players[a.target];
  const parts: string[] = [`${a.base} base`];
  let add = 0;
  let mult = 1;

  const pushAdd = (v: number, label: string) => { add += v; parts.push(`${v >= 0 ? '+' : ''}${v} (${label})`); };
  const pushMult = (v: number, label: string) => { mult *= v; parts.push(`×${fmt(v)} (${label})`); };

  for (const b of a.ctx?.adds ?? []) pushAdd(b.value, b.label);
  for (const b of a.ctx?.mults ?? []) pushMult(b.value, b.label);

  if (a.isAttack) {
    // Passivos: equipamentos de quem ataca e o Campo (vale para os dois).
    const sources = [atk.weapon, atk.armor, state.field?.card ?? null]
      .filter((c): c is CardInstance => c !== null);
    for (const src of sources) {
      for (const ps of src.def.passives ?? []) {
        if (ps.kind !== 'attackBonus' || !matches(a.card, ps.match)) continue;
        if (ps.add) pushAdd(ps.add, ps.label);
        if (ps.mult) pushMult(ps.mult, ps.label);
      }
    }
    // Modificadores pendentes: cada um compatível é consumido por este ataque.
    const restantes: ActiveModifier[] = [];
    for (const m of atk.modifiers) {
      if (!matches(a.card, m.match)) { restantes.push(m); continue; }
      if (m.add) pushAdd(m.add, m.label);
      if (m.mult) pushMult(m.mult, m.label);
      const usesLeft = m.usesLeft - 1;
      if (usesLeft > 0) restantes.push({ ...m, usesLeft });
    }
    atk.modifiers = restantes;
  }

  let total = (a.base + add) * mult;

  const eff = getTypeEffectiveness(a.card.element, def.element);
  if (eff !== 1) {
    const nome = eff === 0 ? 'imune' : eff > 1 ? 'fraqueza' : 'resistência';
    total *= eff;
    parts.push(`×${fmt(eff)} (${nome}: ${ELEMENT_PT[a.card.element]} → ${ELEMENT_PT[def.element]})`);
  }
  total = Math.max(0, Math.floor(total));

  // Redução de dano: equipamentos de quem recebe e o Campo.
  const defSources = [def.weapon, def.armor, state.field?.card ?? null]
    .filter((c): c is CardInstance => c !== null);
  for (const src of a.pierce ? [] : defSources) {
    for (const ps of src.def.passives ?? []) {
      if (ps.kind !== 'damageReduction' || total <= 0) continue;
      total = Math.max(0, total - ps.amount);
      parts.push(`−${ps.amount} (${ps.label})`);
    }
  }

  if (a.pierce) parts.push('(inevitável)');
  if (total > 0 && def.shields > 0 && !a.pierce) {
    def.shields -= 1;
    parts.push('→ anulado por escudo');
    total = 0;
  }

  loseLife(state, a.target, total);
  const vidaFinal = state.players[a.target].life;
  log(state, a.attacker,
    `${a.card.name}: ${parts.join(' ')} = ${total} de dano em ${def.name} (vida ${vidaFinal}).`);
  return total;
}

// ─── Efeitos ─────────────────────────────────────────────────────────────────

/** Junta os `bonus` de uma carta de Ataque, abrindo os condicionais. */
function collectBonuses(state: GameState, actor: 0 | 1, effects: Effect[], ctx: AttackCtx): void {
  for (const e of effects) {
    if (e.kind === 'bonus') {
      if (e.add !== undefined) ctx.adds.push({ value: amountValue(state, actor, e.add), label: e.label });
      if (e.mult !== undefined) ctx.mults.push({ value: e.mult, label: e.label });
    } else if (e.kind === 'conditional') {
      const branch = checkCondition(state, actor, e.if) ? e.then : e.else;
      if (branch) collectBonuses(state, actor, branch, ctx);
    }
  }
}

/** `dealt`: dano que o ataque desta carta causou (para roubo de vida). */
function resolveEffects(state: GameState, actor: 0 | 1, effects: Effect[], source: CardInstance, dealt = 0): void {
  for (const e of effects) {
    if (state.winner !== null) return;
    applyEffect(state, actor, e, source, dealt);
  }
}

function applyEffect(state: GameState, actor: 0 | 1, e: Effect, source: CardInstance, dealt: number): void {
  const me = state.players[actor];
  switch (e.kind) {
    case 'bonus':
    case 'pierce':
      return; // já contados no ataque
    case 'conditional': {
      const branch = checkCondition(state, actor, e.if) ? e.then : e.else;
      if (branch) resolveEffects(state, actor, branch, source, dealt);
      return;
    }
    case 'aura':
      me.auras.push({ label: e.label, effects: e.effects, turnsLeft: e.turns, source });
      log(state, actor, `${me.name} ativa ${e.label} por ${e.turns} turno(s).`);
      return;
    case 'swapLife': {
      const op = state.players[other(actor)];
      const [a, b] = [me.life, op.life];
      me.life = Math.min(me.maxLife, b);
      op.life = Math.min(op.maxLife, a);
      log(state, actor, `As vidas foram trocadas: ${me.name} ${me.life} · ${op.name} ${op.life}.`);
      return;
    }
    case 'lifesteal': {
      const v = Math.floor(dealt * e.ratio);
      if (v <= 0) return;
      const antes = me.life;
      me.life = Math.min(me.maxLife, me.life + v);
      log(state, actor, `${me.name} rouba ${me.life - antes} de vida (vida ${me.life}).`);
      return;
    }
    case 'purge': {
      const t = state.players[resolveSide(actor, e.target, 'self')];
      if (e.what !== 'modifiers') { t.statuses = []; t.locks = []; }
      if (e.what !== 'statuses') t.modifiers = [];
      const oque = e.what === 'statuses' ? 'status e travas' : e.what === 'modifiers' ? 'bônus guardados' : 'status, travas e bônus';
      log(state, actor, `${t.name} perde todos os ${oque}.`);
      return;
    }
    case 'damage': {
      const t = resolveSide(actor, e.target, 'opponent');
      dealDamage(state, {
        attacker: actor, target: t, card: source.def,
        base: amountValue(state, actor, e.amount), isAttack: false,
      });
      return;
    }
    case 'heal': {
      const t = state.players[resolveSide(actor, e.target, 'self')];
      const v = amountValue(state, actor, e.amount);
      const antes = t.life;
      t.life = Math.min(t.maxLife, t.life + v);
      log(state, actor, `${t.name} recupera ${t.life - antes} de vida (vida ${t.life}).`);
      return;
    }
    case 'draw': {
      const t = resolveSide(actor, e.target, 'self');
      drawCards(state, t, e.count);
      log(state, actor, `${state.players[t].name} compra ${e.count} carta(s).`);
      return;
    }
    case 'discardRandom': {
      const t = resolveSide(actor, e.target, 'opponent');
      const tp = state.players[t];
      for (let k = 0; k < e.count && tp.hand.length > 0; k++) {
        const idx = Math.floor(random(state) * tp.hand.length);
        const [c] = tp.hand.splice(idx, 1);
        toGraveyard(state, t, c);
        log(state, actor, `${tp.name} descarta ${c.def.name}.`);
      }
      return;
    }
    case 'mill': {
      const t = resolveSide(actor, e.target, 'opponent');
      const tp = state.players[t];
      const milled = tp.deck.splice(0, e.count);
      milled.forEach(c => toGraveyard(state, t, c));
      log(state, actor, `${milled.length} carta(s) do deck de ${tp.name} vão para o cemitério.`);
      return;
    }
    case 'addModifier': {
      const t = state.players[resolveSide(actor, e.target, 'self')];
      t.modifiers.push({
        ...e.spec,
        usesLeft: e.spec.uses ?? 1,
        turnsLeft: e.spec.turns,
        source: source.def.name,
      });
      log(state, actor, `${t.name} ganha: ${e.spec.label}.`);
      return;
    }
    case 'status': {
      const t = state.players[resolveSide(actor, e.target, 'opponent')];
      const value = e.value ?? 0;
      const atual = t.statuses.find(s => s.kind === e.status);
      if (!atual) {
        t.statuses.push({ kind: e.status, value, turnsLeft: e.turns });
      } else if (e.status === 'poison' || e.status === 'bleed') {
        atual.value += value;                       // veneno e sangramento acumulam
        atual.turnsLeft = Math.max(atual.turnsLeft, e.turns);
      } else {
        atual.value = Math.max(atual.value, value); // queimadura/congelamento renovam
        atual.turnsLeft = Math.max(atual.turnsLeft, e.turns);
      }
      log(state, actor, `${t.name} recebe ${STATUS_PT[e.status]}${value ? ` (${value}/turno)` : ''} por ${e.turns} turno(s).`);
      return;
    }
    case 'lock': {
      const t = state.players[resolveSide(actor, e.target, 'opponent')];
      const atual = t.locks.find(l => l.cardType === e.cardType);
      if (atual) atual.turnsLeft = Math.max(atual.turnsLeft, e.turns);
      else t.locks.push({ cardType: e.cardType, turnsLeft: e.turns });
      log(state, actor, `${t.name} não pode jogar ${TYPE_PT_PLURAL[e.cardType]} por ${e.turns} turno(s).`);
      return;
    }
    case 'shield': {
      const t = state.players[resolveSide(actor, e.target, 'self')];
      t.shields += e.count;
      log(state, actor, `${t.name} ganha ${e.count} escudo(s).`);
      return;
    }
    case 'destroy': {
      const ti = resolveSide(actor, e.target, 'opponent');
      const t = state.players[ti];
      if (e.what === 'field') {
        if (state.field) {
          toGraveyard(state, state.field.owner, state.field.card);
          log(state, actor, `${state.field.card.def.name} (Campo) foi destruído.`);
          state.field = null;
        }
        return;
      }
      if (e.what === 'trap') {
        const trap = t.traps.shift();
        if (trap) {
          toGraveyard(state, ti, trap);
          log(state, actor, `Uma Armadilha de ${t.name} foi destruída.`);
        }
        return;
      }
      const slot = t[e.what];
      if (slot) {
        toGraveyard(state, ti, slot);
        t[e.what] = null;
        log(state, actor, `${slot.def.name} de ${t.name} foi destruído.`);
      }
      return;
    }
    case 'recover': {
      for (let k = 0; k < e.count; k++) {
        const idx = me.graveyard.map(c => matches(c.def, e.filter)).lastIndexOf(true);
        if (idx < 0) break;
        const [c] = me.graveyard.splice(idx, 1);
        me.hand.push(c);
        log(state, actor, `${me.name} recupera ${c.def.name} do cemitério.`);
      }
      return;
    }
  }
}

// ─── Jogar uma carta ─────────────────────────────────────────────────────────

export function playCard(stateIn: GameState, uid: string, choices: PlayChoices = {}): GameState {
  const state = structuredClone(stateIn);
  const check = canPlay(state, uid);
  if (!check.ok) throw new IllegalPlay(check.reason);

  const i = state.active;
  const p = state.players[i];
  const card = p.hand.splice(p.hand.findIndex(c => c.uid === uid), 1)[0];

  const pagos = payCosts(state, i, card, choices);
  const custo = pagos.length ? ` (custo: ${pagos.join('; ')})` : '';
  const quem = card.def.type === 'trap' ? 'baixa uma Armadilha virada' : `joga ${card.def.name} [${TYPE_PT[card.def.type]}]`;
  log(state, i, `${p.name} ${quem}${custo}.`);
  if (p.life <= 0) {
    p.life = 0;
    state.winner = other(i);
  }

  // Armadilhas do inimigo que respondem a qualquer carta (não se aplica a Armadilhas baixadas).
  if (card.def.type !== 'trap' && fireTrap(state, other(i), 'opponentPlays', card) !== 'none') {
    toGraveyard(state, i, card);
    p.playedThisTurn.push(card.def);
    if (card.def.type === 'attack') p.attacksThisTurn += 1;
    return state;
  }
  if (state.winner !== null) return state;

  switch (card.def.type) {
    case 'attack':
      resolveAttack(state, i, card);
      break;
    case 'challenger':
      resolveEffects(state, i, card.def.effects ?? [], card);
      toGraveyard(state, i, card);
      break;
    case 'equipment': {
      const slot = card.def.slot ?? 'weapon';
      const antigo = p[slot];
      if (antigo) toGraveyard(state, i, antigo);
      p[slot] = card;
      resolveEffects(state, i, card.def.effects ?? [], card);
      break;
    }
    case 'trap':
      p.traps.push(card);
      break;
    case 'field':
      if (state.field) toGraveyard(state, state.field.owner, state.field.card);
      state.field = { card, owner: i };
      resolveEffects(state, i, card.def.effects ?? [], card);
      break;
  }

  // Só entra na lista depois de resolver: "se jogou outra carta de X" não conta a si mesma.
  p.playedThisTurn.push(card.def);
  return state;
}

function resolveAttack(state: GameState, i: 0 | 1, card: CardInstance): void {
  const p = state.players[i];
  p.attacksThisTurn += 1;

  const effects = card.def.effects ?? [];
  const pierce = effects.some(e => e.kind === 'pierce');

  // Armadilha de ataque dispara antes da conta. Ataque anulado não consome
  // os modificadores pendentes: o "próximo Fogo ×2" continua esperando.
  // Ataque refletido acerta quem atacou, com todos os bônus (e os consome).
  // Ataque inevitável não dispara armadilhas.
  const trap = pierce ? 'none' : fireTrap(state, other(i), 'opponentAttack', card);
  if (trap === 'negated') {
    toGraveyard(state, i, card);
    return;
  }
  if (state.winner !== null) return;

  const ctx: AttackCtx = { adds: [], mults: [] };
  collectBonuses(state, i, effects, ctx);
  const dealt = dealDamage(state, {
    attacker: i, target: trap === 'reflected' ? i : other(i), card: card.def,
    base: card.def.damage ?? 0, isAttack: true, ctx, pierce,
  });
  if (state.winner === null && trap !== 'reflected') resolveEffects(state, i, effects, card, dealt);
  toGraveyard(state, i, card);
}
