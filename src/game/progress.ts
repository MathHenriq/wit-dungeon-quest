// Progresso do aluno no jogo novo: moedas, coleção de cartas, decks salvos e
// a subida na Torre. Por enquanto fica no navegador (localStorage); quando o
// banco do WIT 2 existir, estas mesmas funções passam a ler e gravar lá.
// As regras (quanto rende uma vitória, quando o chefe libera) são puras e
// testadas; só `loadProgress`/`saveProgress` tocam no navegador.
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { maxCopies, rewardFor, starterCollection, starterDeck, TABLES_FOR_BOSS, type Foe } from '@/lib/tcg/opponents';
import type { CardDef } from '@/lib/tcg/types';

export const DECK_SIZE = 20;
export const DECK_SLOTS = 3;

export interface Progress {
  coins: number;
  /** Cartas que o aluno tem: id → quantidade. */
  collection: Record<string, number>;
  /** Decks salvos (ids das cartas, 20 cada). */
  decks: string[][];
  activeDeck: number;
  /** Maior andar liberado da Torre (vencer o chefe libera o próximo). */
  towerMax: number;
  /** Vitórias por adversário (id do Foe). */
  wins: Record<string, number>;
}

export function newProgress(): Progress {
  return {
    coins: 0,
    collection: starterCollection(),
    decks: [starterDeck().map(c => c.id), [], []],
    activeDeck: 0,
    towerMax: 1,
    wins: {},
  };
}

/** Confere um progresso salvo: descarta cartas que não existem mais e números estranhos. */
export function sanitizeProgress(raw: unknown): Progress {
  const base = newProgress();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, d: number, min = 0, max = 1e9) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : d);
  const collection: Record<string, number> = {};
  if (r.collection && typeof r.collection === 'object') {
    for (const [id, n] of Object.entries(r.collection as Record<string, unknown>)) {
      if (CARD_BY_ID.has(id)) collection[id] = num(n, 0, 0, 999);
    }
  }
  const col = Object.keys(collection).length ? collection : base.collection;
  const decks = Array.from({ length: DECK_SLOTS }, (_, i) => {
    const d = Array.isArray(r.decks) ? (r.decks as unknown[])[i] : undefined;
    return Array.isArray(d) ? d.filter((x): x is string => typeof x === 'string' && CARD_BY_ID.has(x)).slice(0, DECK_SIZE) : base.decks[i];
  });
  const wins: Record<string, number> = {};
  if (r.wins && typeof r.wins === 'object') {
    for (const [id, n] of Object.entries(r.wins as Record<string, unknown>)) if (/^[a-z0-9-]{1,40}$/.test(id)) wins[id] = num(n, 0, 0, 1e6);
  }
  return {
    coins: num(r.coins, 0),
    collection: col,
    decks,
    activeDeck: num(r.activeDeck, 0, 0, DECK_SLOTS - 1),
    towerMax: num(r.towerMax, 1, 1, 100),
    wins,
  };
}

// ─── Decks ──────────────────────────────────────────────────────────────────

export interface DeckCheck { ok: boolean; problems: string[]; warnings: string[] }

/** O deck vale para duelar? (20 cartas, cópias, só cartas que o aluno tem.) Avisos não bloqueiam. */
export function checkDeck(ids: string[], collection: Record<string, number>): DeckCheck {
  const problems: string[] = [], warnings: string[] = [];
  if (ids.length !== DECK_SIZE) problems.push(`O deck precisa de ${DECK_SIZE} cartas (tem ${ids.length}).`);
  const count = new Map<string, number>();
  for (const id of ids) count.set(id, (count.get(id) ?? 0) + 1);
  for (const [id, n] of count) {
    const c = CARD_BY_ID.get(id);
    if (!c) continue;
    if (n > maxCopies(c)) problems.push(`${c.name}: no máximo ${maxCopies(c)} cópia(s).`);
    if (n > (collection[id] ?? 0)) problems.push(`${c.name}: você só tem ${collection[id] ?? 0}.`);
  }
  const defs = ids.map(id => CARD_BY_ID.get(id)).filter((c): c is CardDef => !!c);
  const attacks = defs.filter(c => c.type === 'attack').length;
  if (ids.length && attacks < 6) warnings.push(`Só ${attacks} Ataques: o deck pode ficar sem como causar dano.`);
  const costly = defs.filter(c => c.cost?.some(k => k.kind === 'payLife')).length;
  if (costly > 6) warnings.push(`${costly} cartas pagam vida: cuidado para não se derrotar sozinho.`);
  return { ok: problems.length === 0, problems, warnings };
}

/** Deck ativo pronto para o duelo (ou o inicial, se o ativo não vale). */
export function activeDeckCards(p: Progress): CardDef[] {
  const ids = p.decks[p.activeDeck] ?? [];
  if (checkDeck(ids, p.collection).ok) return ids.map(id => CARD_BY_ID.get(id)!);
  return starterDeck();
}

// ─── Torre ──────────────────────────────────────────────────────────────────

export const winsOf = (p: Progress, foeId: string) => p.wins[foeId] ?? 0;

/** Mesas vencidas (pelo menos uma vez) no andar. */
export function tablesWon(p: Progress, andar: number): number {
  let n = 0;
  for (let m = 1; m <= 8; m++) if (winsOf(p, `torre-${andar}-mesa-${m}`) > 0) n++;
  return n;
}

export const bossUnlocked = (p: Progress, andar: number) => tablesWon(p, andar) >= TABLES_FOR_BOSS || winsOf(p, `torre-${andar}-chefe`) > 0;
export const canGoUp = (p: Progress, andar: number) => p.towerMax > andar;

export interface DuelResult {
  won: boolean;
  coins: number;
  /** Carta ganha do deck do chefe. */
  card?: CardDef;
  /** Andar liberado agora (vencer o chefe pela primeira vez). */
  unlocked?: number;
  firstWin: boolean;
}

/**
 * Aplica o resultado de um duelo da Torre. Vitória: moedas (cheias na primeira
 * vez, 20% depois), chefe dá uma carta do deck dele (sempre, repetível) e, na
 * primeira vez, libera o andar de cima. Derrota: nada muda.
 */
export function applyDuel(p: Progress, foe: Foe, won: boolean, pick: number): { progress: Progress; result: DuelResult } {
  if (!won) return { progress: p, result: { won: false, coins: 0, firstWin: false } };
  const before = winsOf(p, foe.id);
  const coins = rewardFor(foe, before);
  const next: Progress = { ...p, coins: p.coins + coins, wins: { ...p.wins, [foe.id]: before + 1 }, collection: { ...p.collection } };
  const result: DuelResult = { won: true, coins, firstWin: before === 0 };
  if (foe.kind === 'chefe') {
    const card = foe.deck[Math.floor(Math.abs(pick) * foe.deck.length) % foe.deck.length];
    next.collection[card.id] = (next.collection[card.id] ?? 0) + 1;
    result.card = card;
    if (next.towerMax <= foe.andar && foe.andar < 100) {
      next.towerMax = foe.andar + 1;
      result.unlocked = foe.andar + 1;
    }
  }
  return { progress: next, result };
}

// ─── Navegador ──────────────────────────────────────────────────────────────

const KEY = 'wit.progresso';
export function loadProgress(): Progress {
  try { return sanitizeProgress(JSON.parse(localStorage.getItem(KEY) ?? 'null')); } catch { return newProgress(); }
}
export function saveProgress(p: Progress): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* sem armazenamento */ }
  window.dispatchEvent(new CustomEvent('wit-progresso', { detail: p }));
}
