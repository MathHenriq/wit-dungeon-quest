/**
 * Adversários da Torre: deck, vida, nível da IA e recompensa de cada mesa e de
 * cada chefe, gerados a partir do catálogo com semente (o mesmo andar sempre
 * tem os mesmos decks). Nada é montado à mão: a curva vem de `floorProfile`.
 *
 * Quanto mais alto o andar:
 *  - mais vida e deck maior (mesas começam com 60 de vida e 12 cartas);
 *  - raridade máxima sobe (andar 1: Comum/Incomum; andar 90+: tudo);
 *  - cartas mais complexas (custos, armadilhas, campo, combos) entram aos poucos;
 *  - IA mais esperta (Aprendiz → Estudante → Duelista → Mestre).
 */

import { AI_NAMES, type AiLevel } from './ai';
import { CATALOG } from './cards/catalog';
import type { CardDef, Element, Rarity } from './types';

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'];
const RANK = (r: Rarity) => RARITY_ORDER.indexOf(r);
const SINGLE: ReadonlySet<Rarity> = new Set(['legendary', 'mythic', 'unknown']);
export const maxCopies = (c: CardDef) => (SINGLE.has(c.rarity) ? 1 : 2);

export const ELEMENTS: Element[] = ['Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Ground', 'Fighting', 'Steel', 'Poison', 'Dark', 'Ghost', 'Flying'];

/**
 * Complexidade de jogar a carta (não é força): custos, armadilha, campo,
 * condições, bônus guardado, dano que escala. Decks do começo evitam as mais
 * complexas, para o aluno aprender o jogo contra algo que ele entende.
 */
export function complexity(c: CardDef): number {
  let v = 0;
  for (const k of c.cost ?? []) v += k.kind === 'discard' ? 1 : 2;
  if (c.type === 'trap') v += 2;
  if (c.type === 'field') v += 2;
  if (c.type === 'equipment') v += 1;
  const walk = (effects: CardDef['effects'] = []) => {
    for (const e of effects) {
      if (e.kind === 'conditional') { v += 1; walk(e.then); walk(e.else); }
      if (e.kind === 'aura') { v += 1; walk(e.effects); }
      if (e.kind === 'addModifier' || e.kind === 'swapLife' || e.kind === 'lock' || e.kind === 'recover') v += 1;
      if ('amount' in e && typeof e.amount === 'object') v += 1;
      if (e.kind === 'bonus' && typeof e.add === 'object') v += 1;
    }
  };
  walk(c.effects);
  for (const p of c.passives ?? []) if (p.kind === 'onTurnStart') walk(p.effects);
  return v;
}

export type FoeKind = 'mesa' | 'chefe';

export interface FloorProfile {
  life: number;
  deckSize: number;
  ai: AiLevel;
  maxRarity: Rarity;
  maxComplexity: number;
  /** Fração mínima de Ataques no deck. */
  attackShare: number;
}

/** A curva da Torre. Ajustes de dificuldade mexem aqui. */
export function floorProfile(andar: number, kind: FoeKind): FloorProfile {
  const a = Math.max(1, Math.min(100, Math.round(andar)));
  const boss = kind === 'chefe', big = boss && a % 10 === 0;
  const tier = a <= 10 ? 1 : a <= 25 ? 2 : a <= 45 ? 3 : a <= 70 ? 4 : a <= 90 ? 5 : 6;
  const rar = Math.min(6, tier + (boss ? 1 : 0));
  const ai: AiLevel = a <= 10 ? 1 : a <= 30 ? 2 : a <= 70 ? 3 : 4;
  return {
    life: big ? 150 : boss ? Math.min(150, 90 + a) : Math.min(150, 55 + Math.round(a * 0.95)),
    deckSize: big ? 20 : boss ? Math.min(20, 16 + Math.floor(a / 20)) : Math.min(20, 12 + Math.floor(a / 8)),
    ai: (boss ? Math.min(4, ai + 1) : ai) as AiLevel,
    maxRarity: RARITY_ORDER[rar],
    maxComplexity: a <= 5 ? 1 : a <= 15 ? 2 : a <= 30 ? 3 : a <= 50 ? 4 : 99,
    attackShare: a <= 10 ? 0.5 : a <= 40 ? 0.42 : 0.35,
  };
}

/** Gerador com semente (mulberry32). */
export function seeded(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deck temático: ~55% do elemento principal, ~20% do secundário, o resto de
 * qualquer um; Ataques suficientes; respeita cópias, raridade e complexidade.
 * Cartas mais raras que o permitido nunca entram; dentro do permitido, as de
 * raridade mais alta aparecem mais em andares altos (o deck "cresce").
 */
export function themedDeck(opts: {
  size: number; element: Element; second?: Element; maxRarity: Rarity; maxComplexity: number;
  attackShare: number; seed: number; pool?: readonly CardDef[]; rareBias?: number;
}): CardDef[] {
  const r = seeded(opts.seed);
  const pool = (opts.pool ?? CATALOG).filter(c => RANK(c.rarity) <= RANK(opts.maxRarity) && complexity(c) <= opts.maxComplexity);
  const weight = (c: CardDef) => {
    let w = c.element === opts.element ? 6 : c.element === opts.second ? 2.5 : 0.6;
    w *= 1 + (opts.rareBias ?? 0) * RANK(c.rarity);
    return w;
  };
  const deck: CardDef[] = [];
  const copies = new Map<string, number>();
  const pick = (cands: CardDef[]) => {
    const free = cands.filter(c => (copies.get(c.id) ?? 0) < maxCopies(c));
    if (!free.length) return false;
    const total = free.reduce((s, c) => s + weight(c), 0);
    let x = r() * total;
    for (const c of free) {
      x -= weight(c);
      if (x <= 0) { deck.push(c); copies.set(c.id, (copies.get(c.id) ?? 0) + 1); return true; }
    }
    const c = free[free.length - 1];
    deck.push(c); copies.set(c.id, (copies.get(c.id) ?? 0) + 1);
    return true;
  };
  const attacks = pool.filter(c => c.type === 'attack');
  const needAtk = Math.ceil(opts.size * opts.attackShare);
  while (deck.length < needAtk && pick(attacks));
  // no máximo 2 armadilhas e 1 campo em decks pequenos, para não travar o aprendiz
  const cap = (t: CardDef['type']) => (t === 'trap' ? Math.max(2, Math.floor(opts.size / 5)) : t === 'field' ? 1 : 99);
  while (deck.length < opts.size) {
    const cands = pool.filter(c => deck.filter(d => d.type === c.type).length < cap(c.type));
    if (!pick(cands)) break;
  }
  return deck;
}

// ─── Mesas e chefes da Torre ────────────────────────────────────────────────

/** Elemento de cada mesa temática (sprites em public/game/interior). */
export const TABLE_ELEMENT: Record<string, Element> = {
  'mesa-fogo': 'Fire', 'mesa-agua': 'Water', 'mesa-eletrico': 'Electric', 'mesa-planta': 'Grass',
  'mesa-gelo': 'Ice', 'mesa-terra': 'Ground', 'mesa-luta': 'Fighting', 'mesa-metal': 'Steel',
  'mesa-veneno': 'Poison', 'mesa-sombrio': 'Dark', 'mesa-fantasma': 'Ghost', 'mesa-voador': 'Flying',
};

export interface Foe {
  id: string;
  name: string;
  kind: FoeKind;
  andar: number;
  element: Element;
  life: number;
  ai: AiLevel;
  deck: CardDef[];
  /** Moedas na primeira vitória; nas seguintes, `REPLAY_SHARE` disso. */
  coins: number;
}

/** Elemento do chefe de cada andar (gira pelos 12, sem repetir o anterior). */
export function bossElement(andar: number): Element {
  return ELEMENTS[(andar * 5 + 3) % 12];
}

/** Adversário da mesa `mesa` (1 a 8) do andar; `table` é o sprite da mesa (dá o elemento). */
export function tableFoe(andar: number, mesa: number, table: string, name: string): Foe {
  const p = floorProfile(andar, 'mesa');
  const r = seeded(andar * 131 + mesa * 17);
  const element = TABLE_ELEMENT[table] ?? ELEMENTS[Math.floor(r() * 12)];
  const second = ELEMENTS[Math.floor(r() * 12)];
  return {
    id: `torre-${andar}-mesa-${mesa}`, name, kind: 'mesa', andar, element, life: p.life, ai: p.ai,
    deck: themedDeck({ size: p.deckSize, element, second, maxRarity: p.maxRarity, maxComplexity: p.maxComplexity, attackShare: p.attackShare, seed: andar * 1009 + mesa * 97, rareBias: andar / 60 }),
    coins: coinsFor(andar, 'mesa'),
  };
}

export function bossFoe(andar: number, name: string): Foe {
  const p = floorProfile(andar, 'chefe');
  const element = bossElement(andar);
  return {
    id: `torre-${andar}-chefe`, name, kind: 'chefe', andar, element, life: p.life, ai: p.ai,
    deck: themedDeck({ size: p.deckSize, element, second: ELEMENTS[(andar * 7) % 12], maxRarity: p.maxRarity, maxComplexity: p.maxComplexity + 1, attackShare: p.attackShare, seed: andar * 7919 + 1, rareBias: 0.4 + andar / 50 }),
    coins: coinsFor(andar, 'chefe'),
  };
}

// ─── Moedas ─────────────────────────────────────────────────────────────────
//
// Referência (docs/plano-wit2.md §4): Pacote Comum = 300 moedas; 15 min de
// tablet = 600. A meta é o jogo render mais ou menos 1 Pacote Comum por hora
// de duelos no começo e uns 3 por hora nos andares altos, com a sala (o
// professor dando pacotes direto) continuando a fonte principal. Revencer a
// mesma mesa rende pouco, para não valer a pena ficar farmando o andar 1.
// Os números saem da simulação: `npx vite-node scripts/tcg-torre.ts`.

/** Fração das moedas quando a mesa ou o chefe já foi vencido antes. */
export const REPLAY_SHARE = 0.2;

export function coinsFor(andar: number, kind: FoeKind): number {
  const a = Math.max(1, Math.min(100, Math.round(andar)));
  const mesa = 6 + Math.round(a * 0.4);
  if (kind === 'mesa') return mesa;
  return a % 10 === 0 ? mesa * 6 : mesa * 3;
}

/** Moedas de uma vitória (primeira ou repetida). Derrota não dá moeda. */
export function rewardFor(foe: Pick<Foe, 'coins'>, timesWonBefore: number): number {
  return timesWonBefore > 0 ? Math.max(1, Math.round(foe.coins * REPLAY_SHARE)) : foe.coins;
}

/** Quantas mesas do andar precisam ser vencidas para desafiar o chefe. */
export const TABLES_FOR_BOSS = 4;

// ─── Deck inicial do aluno ──────────────────────────────────────────────────

/**
 * Deck inicial "O Desafiante" (equilibrado): 20 Comuns e Incomuns simples,
 * metade Ataques, espalhados em 4 elementos. É o ponto de partida; o aluno
 * melhora com as cartas dos chefes e dos pacotinhos.
 */
export function starterDeck(): CardDef[] {
  const els: Element[] = ['Fire', 'Water', 'Fighting', 'Electric'];
  const out: CardDef[] = [];
  els.forEach((element, i) => {
    out.push(...themedDeck({ size: 5, element, maxRarity: 'uncommon', maxComplexity: 1, attackShare: 0.6, seed: 4242 + i, pool: CATALOG.filter(c => c.element === element) }));
  });
  return out.slice(0, 20);
}

/** Coleção inicial: o deck inicial + algumas Comuns a mais, para já dar o que trocar no construtor. */
export function starterCollection(): Record<string, number> {
  const col: Record<string, number> = {};
  for (const c of starterDeck()) col[c.id] = (col[c.id] ?? 0) + 1;
  const extra = themedDeck({ size: 12, element: 'Grass', second: 'Ice', maxRarity: 'uncommon', maxComplexity: 2, attackShare: 0.4, seed: 777 });
  for (const c of extra) col[c.id] = Math.min(maxCopies(c), (col[c.id] ?? 0) + 1);
  return col;
}

export { AI_NAMES };
