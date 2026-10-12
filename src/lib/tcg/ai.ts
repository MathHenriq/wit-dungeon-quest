/**
 * IA dos Desafiantes inimigos (e do PvP assíncrono, jogando com o deck de um
 * colega). Funções puras sobre o `GameState` do motor: dá para testar e
 * simular milhares de partidas.
 *
 * Quatro níveis, do andar 1 ao 100 da Torre:
 *
 *  1. Aprendiz  — joga cartas ao acaso, ataca com qualquer uma e às vezes
 *                 esquece de atacar.
 *  2. Estudante — não se sabota (não paga vida demais, não troca equipamento
 *                 à toa) e ataca com o que tira mais vida (testado no motor).
 *  3. Duelista  — prepara antes de bater (compra, equipamento, bônus,
 *                 armadilha), finaliza quando dá, e escolhe entre variações
 *                 do turno olhando a resposta provável do adversário.
 *  4. Mestre    — como o Duelista, mas decide simulando o resto da partida.
 *
 * Medido com 400 partidas por par (decks iguais trocando de lado):
 * 2 vence 1 em 59%, 3 vence 2 em 54%, 4 vence 3 em 58%. A sorte da mão pesa;
 * a dificuldade da Torre vem da IA junto com a vida e o deck do inimigo.
 *
 * `planTurn` devolve a lista de jogadas (uids), para a tela mostrar uma a uma.
 */

import { canPlay, endTurn, IllegalPlay, playableCards, playCard } from './engine';
import type { CardInstance, GameState, PlayerState } from './types';

export type AiLevel = 1 | 2 | 3 | 4;
export const AI_NAMES: Record<AiLevel, string> = { 1: 'Aprendiz', 2: 'Estudante', 3: 'Duelista', 4: 'Mestre' };

/** Gerador com semente (o mesmo do motor), para a IA ser reproduzível. */
function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const other = (i: 0 | 1): 0 | 1 => (i === 0 ? 1 : 0);

/** Regras de bom senso: jogadas que quase sempre só atrapalham. */
export function sensible(s: GameState, c: CardInstance): boolean {
  const me = s.players[s.active];
  const op = s.players[other(s.active)];
  const effects = c.def.effects ?? [];
  if (effects.some(e => e.kind === 'swapLife') && me.life >= op.life) return false;
  for (const k of c.def.cost ?? []) {
    if (k.kind === 'payLife' && me.life - k.amount < 25) return false;
    if (k.kind === 'mill' && me.deck.length - k.count < 3) return false;
  }
  if (c.def.type === 'equipment' && me[c.def.slot ?? 'weapon']) return false;
  if (c.def.type === 'field' && s.field?.owner === s.active) return false;
  if (effects.length > 0 && effects.every(e => e.kind === 'heal') && me.life > me.maxLife - 15) return false;
  return true;
}

function tryPlay(s: GameState, uid: string): GameState | null {
  if (!canPlay(s, uid).ok) return null;
  try { return playCard(s, uid); } catch (e) { if (e instanceof IllegalPlay) return null; throw e; }
}

/**
 * Quão boa está a partida para o jogador `me` (quanto maior, melhor).
 * Vida pesa mais que tudo; depois cartas, bônus guardados, proteção e status.
 */
/** Pesos da avaliação (exportados para o ajuste por simulação). */
export const W = { hand: 2 };

export function evaluate(s: GameState, me: 0 | 1): number {
  if (s.winner === me) return 1e6;
  if (s.winner === other(me)) return -1e6;
  const side = (p: PlayerState) => {
    let v = p.life * 3;
    v += Math.min(p.hand.length, 7) * W.hand;
    v += Math.min(p.deck.length, 8) * 0.5;
    v += p.shields * 14;
    v += (p.weapon ? 18 : 0) + (p.armor ? 18 : 0);
    v += p.traps.length * 10;
    for (const m of p.modifiers) v += (m.add ?? 0) * 1.2 * m.usesLeft + ((m.mult ?? 1) - 1) * 22 * m.usesLeft;
    for (const a of p.auras) v += 8 * a.turnsLeft;
    for (const st of p.statuses) v -= (st.kind === 'freeze' ? 20 : st.value * 2.5) * Math.min(st.turnsLeft, 3);
    v -= p.locks.length * 12;
    if (p.life < 30) v -= (30 - p.life) * 2; // perigo: vida baixa vale mais
    return v;
  };
  let v = side(s.players[me]) - side(s.players[other(me)]);
  if (s.field?.owner === me) v += 12;
  return v;
}

// ─── Níveis 1 e 2: regras simples ────────────────────────────────────────────

/** Dano que este Ataque causaria agora (testado no motor, com bônus e elemento). */
function attackValue(s: GameState, c: CardInstance): number {
  const op = other(s.active);
  const next = tryPlay(s, c.uid);
  if (!next) return -1;
  if (next.winner === s.active) return 1e5;
  return s.players[op].life - next.players[op].life - Math.max(0, s.players[s.active].life - next.players[s.active].life) * 0.5;
}

function bestAttack(s: GameState, filter = (c: CardInstance) => sensible(s, c)): CardInstance | null {
  let best: { c: CardInstance; v: number } | null = null;
  for (const c of playableCards(s)) {
    if (c.def.type !== 'attack' || !filter(c)) continue;
    const v = attackValue(s, c);
    if (!best || v > best.v) best = { c, v };
  }
  return best && best.v >= 0 ? best.c : null;
}

function planSimple(s0: GameState, level: 1 | 2, seed: number): string[] {
  const r = rng(seed);
  let s = s0;
  const plays: string[] = [];
  for (let guard = 0; guard < 12; guard++) {
    const cands = playableCards(s).filter(c => c.def.type !== 'attack' && (level === 1 ? r() > 0.3 : sensible(s, c)));
    if (!cands.length) break;
    const c = level === 1 ? cands[Math.floor(r() * cands.length)] : cands[0];
    const next = tryPlay(s, c.uid);
    if (!next) break;
    s = next; plays.push(c.uid);
    if (s.winner !== null) return plays;
  }
  if (level === 1) {
    if (r() < 0.2) return plays; // esqueceu de atacar
    const attacks = playableCards(s).filter(c => c.def.type === 'attack');
    const c = attacks[Math.floor(r() * attacks.length)];
    if (c && tryPlay(s, c.uid)) plays.push(c.uid);
    return plays;
  }
  const a = bestAttack(s);
  if (a) plays.push(a.uid);
  return plays;
}

// ─── Nível 3: prepara e depois bate ─────────────────────────────────────────

/** Ordem de preparo: o que turbina o ataque vem antes; cura e compra depois. */
function setupRank(c: CardInstance): number {
  const e = c.def.effects ?? [];
  if (e.some(x => x.kind === 'draw')) return 0;
  if (c.def.type === 'field' || c.def.type === 'equipment') return 1;
  if (e.some(x => x.kind === 'addModifier' || x.kind === 'status' || x.kind === 'lock')) return 2;
  if (c.def.type === 'trap') return 3;
  return 4;
}

function planDuelist(s0: GameState, skip: ReadonlySet<string> = new Set()): string[] {
  const me = s0.active;
  let s = s0;
  const plays: string[] = [];
  const play = (c: CardInstance) => { const n = tryPlay(s, c.uid); if (!n) return false; s = n; plays.push(c.uid); return true; };
  // 1) se algum Ataque já mata, mata
  const kill = playableCards(s).find(c => c.def.type === 'attack' && tryPlay(s, c.uid)?.winner === me);
  if (kill) { play(kill); return plays; }
  // 2) prepara (e compra primeiro, para ter mais opções)
  for (let guard = 0; guard < 12; guard++) {
    const cands = playableCards(s)
      .filter(c => c.def.type !== 'attack' && !skip.has(c.uid) && sensible(s, c))
      .sort((a, b) => setupRank(a) - setupRank(b));
    const c = cands[0];
    if (!c || !play(c)) break;
    if (s.winner !== null) return plays;
  }
  // 3) o Ataque que mais tira vida agora
  const a = bestAttack(s, c => !skip.has(c.uid) && sensible(s, c));
  if (a) play(a);
  return plays;
}

// ─── Nível 4: imagina o resto da partida ────────────────────────────────────

/** Joga a partida até o fim (ou até `maxTurns`) com o nível 2 dos dois lados; devolve a nota para `me`. */
function rollout(s: GameState, me: 0 | 1, maxTurns = 14): number {
  let t = s;
  for (let k = 0; k < maxTurns && t.winner === null; k++) {
    for (const uid of planSimple(t, 2, 1)) { const n = tryPlay(t, uid); if (!n) break; t = n; if (t.winner !== null) break; }
    if (t.winner === null) t = endTurn(t);
  }
  if (t.winner === me) return 1e5 - t.turn;
  if (t.winner !== null) return -1e5 + t.turn;
  return evaluate(t, me);
}

/** Nota de uma linha para o Duelista: a partida depois da resposta do adversário (nível 2). */
function afterReply(s: GameState, me: 0 | 1): number {
  if (s.winner !== null) return s.winner === me ? 1e6 : -1e6;
  let t = endTurn(s);
  for (const uid of planSimple(t, 2, 1)) { const n = tryPlay(t, uid); if (!n) break; t = n; if (t.winner !== null) break; }
  return evaluate(t, me);
}

function planLookahead(s0: GameState, score: (s: GameState, me: 0 | 1) => number): string[] {
  const me = s0.active;
  const base = planDuelist(s0);
  const lines: string[][] = [base];
  // variações: guardar cada carta de preparo; trocar o Ataque por outro
  for (const uid of base) {
    const c = s0.players[me].hand.find(x => x.uid === uid);
    if (c && c.def.type !== 'attack') lines.push(planDuelist(s0, new Set([uid])));
  }
  const atk = base.find(uid => s0.players[me].hand.find(x => x.uid === uid)?.def.type === 'attack');
  if (atk) lines.push(planDuelist(s0, new Set([atk])));
  let best = { plays: base, v: -Infinity };
  const seen = new Set<string>();
  for (const line of lines) {
    const key = line.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    let s: GameState | null = s0;
    for (const uid of line) { s = s && tryPlay(s, uid); if (!s) break; }
    if (!s) continue;
    const v = s.winner === me ? 1e6 : score(s, me);
    if (v > best.v) best = { plays: line, v };
  }
  return best.plays;
}

/** As jogadas do turno do jogador ativo, na ordem. Depois delas, `endTurn`. */
export function planTurn(s: GameState, level: AiLevel, seed = 1): string[] {
  if (s.winner !== null) return [];
  if (level <= 2) return planSimple(s, level as 1 | 2, seed + s.turn * 7919);
  return level === 3
    ? planLookahead(s, afterReply)
    : planLookahead(s, (x, me) => rollout(x.winner === null ? endTurn(x) : x, me));
}

/** Joga o turno inteiro (para o simulador e os testes). */
export function playAiTurn(s: GameState, level: AiLevel, seed = 1): GameState {
  for (const uid of planTurn(s, level, seed)) {
    const next = tryPlay(s, uid);
    if (!next) break;
    s = next;
    if (s.winner !== null) return s;
  }
  return s.winner === null ? endTurn(s) : s;
}
