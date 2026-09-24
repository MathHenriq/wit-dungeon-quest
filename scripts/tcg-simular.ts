/**
 * Simulador de balanceamento do TCG.
 *
 *   npx vite-node scripts/tcg-simular.ts [partidas=4000]
 *
 * Monta decks aleatórios de 20 cartas do catálogo, joga com uma IA gulosa
 * simples e mede: duração das partidas, vantagem de quem começa e a taxa de
 * vitória de cada carta (quando está no deck). Carta muito acima ou muito
 * abaixo de 50% é candidata a ajuste.
 *
 * A IA é burra de propósito: joga tudo o que pode e ataca com o maior dano.
 * O número serve para COMPARAR cartas entre si, não como verdade absoluta.
 */

import { CATALOG } from '../src/lib/tcg/cards/catalog';
import { createGame, endTurn, playableCards, playCard, IllegalPlay } from '../src/lib/tcg/engine';
import type { CardDef, CardInstance, Element, GameState } from '../src/lib/tcg/types';

const N = Number(process.argv[2] ?? 4000);
const ELEMENTS: Element[] = ['Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Ground', 'Fighting', 'Steel', 'Poison', 'Dark', 'Ghost', 'Flying'];
const RARE = new Set(['legendary', 'mythic', 'unknown']);

// mulberry32. Um LCG simples aqui enviesava o sorteio: algumas cartas
// apareciam 30% mais que outras e sempre junto das mesmas companheiras.
let seed = 12345;
const rnd = () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function randomDeck(): CardDef[] {
  const deck: CardDef[] = [];
  const copies = new Map<string, number>();
  while (deck.length < 20) {
    const c = CATALOG[Math.floor(rnd() * CATALOG.length)];
    const n = copies.get(c.id) ?? 0;
    if (n >= (RARE.has(c.rarity) ? 1 : 2)) continue;
    copies.set(c.id, n + 1);
    deck.push(c);
  }
  return deck;
}

/** Heurística mínima para a IA não se sabotar. */
function worthPlaying(s: GameState, c: CardInstance): boolean {
  const me = s.players[s.active];
  const op = s.players[s.active === 0 ? 1 : 0];
  const effects = c.def.effects ?? [];
  if (effects.some(e => e.kind === 'swapLife') && me.life >= op.life) return false;
  const pay = c.def.cost?.find(k => k.kind === 'payLife');
  if (pay && pay.kind === 'payLife' && me.life - pay.amount < 25) return false;
  if (c.def.type === 'equipment' && me[c.def.slot ?? 'weapon']) return false;
  if (c.def.type === 'field' && s.field?.owner === s.active) return false;
  if (effects.length > 0 && effects.every(e => e.kind === 'heal') && me.life > me.maxLife - 15) return false;
  return true;
}

function playTurn(s: GameState): GameState {
  // 1) tudo que não é Ataque; 2) o Ataque de maior dano base.
  for (let guard = 0; guard < 12; guard++) {
    const c = playableCards(s).find(x => x.def.type !== 'attack' && worthPlaying(s, x));
    if (!c) break;
    try { s = playCard(s, c.uid); } catch (e) { if (!(e instanceof IllegalPlay)) throw e; break; }
    if (s.winner !== null) return s;
  }
  const ataques = playableCards(s).filter(x => x.def.type === 'attack' && worthPlaying(s, x))
    .sort((a, b) => (b.def.damage ?? 0) - (a.def.damage ?? 0));
  if (ataques[0]) s = playCard(s, ataques[0].uid);
  return s;
}

interface Stat { games: number; wins: number }
const perCard = new Map<string, Stat>();
let firstWins = 0;
let decided = 0;
const lengths: number[] = [];

for (let g = 0; g < N; g++) {
  const decks = [randomDeck(), randomDeck()];
  const first = (g % 2) as 0 | 1;
  let s = createGame([
    { name: 'A', element: ELEMENTS[Math.floor(rnd() * 12)], deck: decks[0] },
    { name: 'B', element: ELEMENTS[Math.floor(rnd() * 12)], deck: decks[1] },
  ], { seed: g + 1, firstPlayer: first });

  while (s.winner === null && s.turn < 80) {
    s = playTurn(s);
    if (s.winner === null) s = endTurn(s);
  }
  if (s.winner === null) continue;
  decided++;
  lengths.push(Math.ceil(s.turn / 2));
  if (s.winner === first) firstWins++;
  for (const p of [0, 1] as const) {
    for (const id of new Set(decks[p].map(c => c.id))) {
      const st = perCard.get(id) ?? { games: 0, wins: 0 };
      st.games++;
      if (s.winner === p) st.wins++;
      perCard.set(id, st);
    }
  }
}

lengths.sort((a, b) => a - b);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
console.log(`Partidas: ${N} (${decided} decididas)`);
console.log(`Duração em rodadas: mediana ${lengths[Math.floor(lengths.length / 2)]} · p10 ${lengths[Math.floor(lengths.length * 0.1)]} · p90 ${lengths[Math.floor(lengths.length * 0.9)]}`);
console.log(`Quem começa vence: ${pct(firstWins / decided)}`);

const rows = CATALOG.map(c => {
  const st = perCard.get(c.id) ?? { games: 0, wins: 0 };
  return { c, n: st.games, wr: st.games ? st.wins / st.games : 0 };
}).filter(r => r.n >= 30).sort((a, b) => b.wr - a.wr);

const fmt = (r: typeof rows[number]) =>
  `  ${pct(r.wr).padStart(6)}  n=${String(r.n).padStart(4)}  ${r.c.name} [${r.c.rarity}]`;
console.log('\nMais fortes:');
rows.slice(0, 15).forEach(r => console.log(fmt(r)));
console.log('\nMais fracas:');
rows.slice(-15).forEach(r => console.log(fmt(r)));

const media = (key: (c: CardDef) => string) => {
  const g = new Map<string, { soma: number; n: number }>();
  for (const r of rows) {
    const k = key(r.c);
    const v = g.get(k) ?? { soma: 0, n: 0 };
    v.soma += r.wr; v.n++;
    g.set(k, v);
  }
  return [...g].map(([k, v]) => `${k} ${pct(v.soma / v.n)} (${v.n})`).join(' · ');
};
console.log(`\nMédia por raridade: ${media(c => c.rarity)}`);
console.log(`Média por tipo: ${media(c => c.type)}`);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows.map(r => ({ id: r.c.id, wr: r.wr, n: r.n }))));
}
