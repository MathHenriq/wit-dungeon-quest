// Progresso do aluno no jogo novo: moedas, coleção de cartas, decks salvos e
// a subida na Torre. Por enquanto fica no navegador (localStorage); quando o
// banco do WIT 2 existir, estas mesmas funções passam a ler e gravar lá.
// As regras (quanto rende uma vitória, quando o chefe libera) são puras e
// testadas; só `loadProgress`/`saveProgress` tocam no navegador.
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { maxCopies, rewardFor, starterCollection, starterDeck, TABLES_FOR_BOSS, type Foe } from '@/lib/tcg/opponents';
import type { CardDef, Rarity } from '@/lib/tcg/types';
import { sanitizeSong, type Song } from './music';

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'];
import { DEFAULT_MAT, MAT_BY_ID } from './playmats';
import { PROF_BY_ID, type ProfId } from './professions';

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
  /** Andar em que o aluno está (a Torre abre nele; nunca acima de towerMax). */
  andar: number;
  /** Vitórias por adversário (id do Foe). */
  wins: Record<string, number>;
  /** Tapetes do duelo que o aluno tem e o que está usando. */
  mats: string[];
  mat: string;
  /** Mochila: peixes, sementes e colheitas (`peixe:tilapia` → quantidade). */
  itens: Record<string, number>;
  /** Maior peixe de cada espécie (cm): o álbum de peixes da Casa de Pesca. */
  recordes: Record<string, number>;
  /** Cargo escolhido no Núcleo WIT (dá bônus) e a experiência em cada profissão. */
  profissao?: ProfId;
  xp: Record<string, number>;
  /** Contadores de tudo que o aluno fez (missões, Jornal WIT): peixes, colheitas, mesas... */
  stats: Record<string, number>;
  /** Barriga: 100 = cheio, 0 = com fome (não corre). Nunca impede duelo. */
  fome: number;
  /** Minijogos jogados hoje (cada um rende só algumas vezes por dia). */
  jogos: { day: number; n: Record<string, number> };
  /** Missões do dia: o valor dos contadores no começo do dia e as já recebidas. */
  missoes: { day: number; base: Record<string, number>; feitas: string[] };
  /** Mercado: quanto o aluno vendeu de cada item (baixa o preço; esquece 30% por dia). */
  mercado: { day: number; sat: Record<string, number> };
  /** Entrega em andamento (Central de Entregas). */
  entrega?: { zona: string; porta: string; nome: string; ate: number };
  /** Pó da forja por raridade (desmanchar uma Rara dá pó raro...). */
  po: Partial<Record<Rarity, number>>;
  /** Pacotinhos seguidos sem Épica ou melhor (a garantia age no 10º). */
  semEpica: number;
  /** Músicas compostas no Estúdio de Música (viram discos). */
  musicas: Song[];
  /** Matéria do repórter que sai no telão (Jornal WIT) no dia em que foi feita. */
  jornal?: { day: number; text: string };
}

export function newProgress(): Progress {
  return {
    coins: 0,
    collection: starterCollection(),
    decks: [starterDeck().map(c => c.id), [], []],
    activeDeck: 0,
    towerMax: 1,
    andar: 1,
    wins: {},
    mats: [DEFAULT_MAT],
    mat: DEFAULT_MAT,
    itens: {},
    recordes: {},
    xp: {},
    stats: {},
    fome: 100,
    jogos: { day: 0, n: {} },
    missoes: { day: 0, base: {}, feitas: [] },
    mercado: { day: 0, sat: {} },
    po: {},
    semEpica: 0,
    musicas: [],
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
  const mats = [...new Set([DEFAULT_MAT, ...(Array.isArray(r.mats) ? r.mats : []).filter((x): x is string => typeof x === 'string' && MAT_BY_ID.has(x))])];
  const mat = typeof r.mat === 'string' && mats.includes(r.mat) ? r.mat : DEFAULT_MAT;
  const counts = (v: unknown, max: number) => {
    const out: Record<string, number> = {};
    if (v && typeof v === 'object') {
      for (const [id, n] of Object.entries(v as Record<string, unknown>)) {
        const k = num(n, 0, 0, max);
        if (/^[a-z0-9:-]{1,40}$/.test(id) && k > 0) out[id] = k;
      }
    }
    return out;
  };
  return {
    mats, mat,
    itens: counts(r.itens, 9999),
    recordes: counts(r.recordes, 1000),
    profissao: typeof r.profissao === 'string' && PROF_BY_ID.has(r.profissao as ProfId) ? (r.profissao as ProfId) : undefined,
    xp: counts(r.xp, 1e6),
    stats: counts(r.stats, 1e9),
    fome: typeof r.fome === 'number' && Number.isFinite(r.fome) ? Math.max(0, Math.min(100, Math.round(r.fome * 100) / 100)) : 100,
    jogos: (() => { const j = (r.jogos ?? {}) as Record<string, unknown>; return { day: num(j.day, 0), n: counts(j.n, 99) }; })(),
    missoes: (() => {
      const m = (r.missoes ?? {}) as Record<string, unknown>;
      return { day: num(m.day, 0), base: counts(m.base, 1e9), feitas: Array.isArray(m.feitas) ? m.feitas.filter((x): x is string => typeof x === 'string').slice(0, 10) : [] };
    })(),
    mercado: (() => { const m = (r.mercado ?? {}) as Record<string, unknown>; return { day: num(m.day, 0), sat: counts(m.sat, 1e4) }; })(),
    entrega: (() => {
      const e = r.entrega as Record<string, unknown> | undefined;
      return e && typeof e.zona === 'string' && typeof e.porta === 'string' && typeof e.nome === 'string' ? { zona: e.zona, porta: e.porta, nome: e.nome, ate: num(e.ate, 0, 0, 1e14) } : undefined;
    })(),
    po: (() => {
      const o: Partial<Record<Rarity, number>> = {};
      const raw = (r.po ?? {}) as Record<string, unknown>;
      for (const k of RARITIES) if (raw[k] !== undefined) o[k] = num(raw[k], 0, 0, 1e7);
      return o;
    })(),
    semEpica: num(r.semEpica, 0, 0, 1000),
    musicas: Array.isArray(r.musicas) ? (r.musicas as unknown[]).map(sanitizeSong).filter((x): x is Song => !!x).slice(0, 30) : [],
    jornal: (() => {
      const j = r.jornal as Record<string, unknown> | undefined;
      return j && typeof j.text === 'string' ? { day: num(j.day, 0), text: j.text.slice(0, 80) } : undefined;
    })(),
    coins: num(r.coins, 0),
    collection: col,
    decks,
    activeDeck: num(r.activeDeck, 0, 0, DECK_SLOTS - 1),
    towerMax: num(r.towerMax, 1, 1, 100),
    andar: Math.min(num(r.towerMax, 1, 1, 100), num(r.andar, num(r.towerMax, 1, 1, 100), 1, 100)),
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

/**
 * Monta o melhor deck possível com a coleção, para quem não quer montar:
 * os 2 elementos que o aluno mais tem, cartas mais raras primeiro, ~45% de
 * Ataques, no máximo 3 Armadilhas e 1 Campo.
 */
export function suggestDeck(collection: Record<string, number>, prefer?: string): string[] {
  const RANK = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'];
  const owned = Object.entries(collection)
    .map(([id, n]) => ({ c: CARD_BY_ID.get(id), n }))
    .filter((x): x is { c: CardDef; n: number } => !!x.c && x.n > 0);
  const byEl = new Map<string, number>();
  for (const { c, n } of owned) byEl.set(c.element, (byEl.get(c.element) ?? 0) + n);
  const top = [...byEl.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
  const main = prefer && byEl.has(prefer) ? prefer : top[0];
  const second = top.find(e => e !== main);
  const score = (c: CardDef) => RANK.indexOf(c.rarity) * 10 + (c.element === main ? 25 : c.element === second ? 12 : 0) + (c.damage ?? 0) / 5;
  const sorted = owned.sort((a, b) => score(b.c) - score(a.c) || a.c.id.localeCompare(b.c.id));
  const deck: string[] = [];
  const add = (want: (c: CardDef) => boolean, limit: number) => {
    for (const { c, n } of sorted) {
      if (deck.length >= limit) return;
      if (!want(c)) continue;
      const have = deck.filter(id => id === c.id).length;
      for (let k = have; k < Math.min(n, maxCopies(c)) && deck.length < limit; k++) deck.push(c.id);
    }
  };
  add(c => c.type === 'attack', 9);
  const typeCount = (t: CardDef['type']) => deck.filter(id => CARD_BY_ID.get(id)!.type === t).length;
  add(c => c.type !== 'attack' && (c.type !== 'trap' || typeCount('trap') < 3) && (c.type !== 'field' || typeCount('field') < 1), DECK_SIZE);
  add(() => true, DECK_SIZE); // completa com o que tiver
  return deck;
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
  const next: Progress = { ...p, coins: p.coins + coins, wins: { ...p.wins, [foe.id]: before + 1 }, collection: { ...p.collection }, stats: { ...p.stats, mesas: (p.stats.mesas ?? 0) + 1 } };
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

// ─── Tapetes ────────────────────────────────────────────────────────────────

/** Compra um tapete (e já passa a usar). Sem moedas, já tem ou ainda sem arte: recusa com o motivo. */
export function buyMat(p: Progress, id: string): { ok: true; progress: Progress } | { ok: false; reason: string } {
  const m = MAT_BY_ID.get(id);
  if (!m) return { ok: false, reason: 'Tapete não existe.' };
  if (p.mats.includes(id)) return { ok: false, reason: 'Você já tem este tapete.' };
  if (m.emBreve) return { ok: false, reason: 'Este tapete chega em breve.' };
  if (p.coins < m.preco) return { ok: false, reason: `Faltam ${m.preco - p.coins} moedas.` };
  return { ok: true, progress: { ...p, coins: p.coins - m.preco, mats: [...p.mats, id], mat: id } };
}

/** Passa a usar um tapete que já tem. */
export function equipMat(p: Progress, id: string): Progress {
  return p.mats.includes(id) ? { ...p, mat: id } : p;
}

// ─── Mochila ────────────────────────────────────────────────────────────────

/** Soma (ou tira, com `n` negativo) itens da mochila; nunca fica negativo. */
export function addItem(p: Progress, id: string, n = 1): Progress {
  const itens = { ...p.itens, [id]: Math.max(0, (p.itens[id] ?? 0) + n) };
  if (!itens[id]) delete itens[id];
  return { ...p, itens };
}

/** Guarda o peixe pescado e o recorde de tamanho. Diz se é a primeira vez e se bateu o recorde. */
export function addCatch(p: Progress, fishId: string, cm: number): { progress: Progress; first: boolean; record: boolean } {
  const before = p.recordes[fishId] ?? 0;
  const next = addItem(p, `peixe:${fishId}`, 1);
  const record = cm > before;
  if (record) next.recordes = { ...p.recordes, [fishId]: cm };
  return { progress: next, first: before === 0, record: record && before > 0 };
}

/** Vende itens da mochila: `price(id)` diz quanto vale cada um (0 = não compra). */
export function sellItems(p: Progress, ids: string[], price: (id: string) => number): { progress: Progress; coins: number; sold: number } {
  let coins = 0, sold = 0;
  const itens = { ...p.itens };
  for (const id of ids) {
    const n = itens[id] ?? 0;
    if (!n) continue;
    coins += n * price(id);
    sold += n;
    delete itens[id];
  }
  return { progress: { ...p, itens, coins: p.coins + coins }, coins, sold };
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
