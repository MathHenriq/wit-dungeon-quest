/**
 * Simulação da Torre: o deck inicial do aluno (jogado pela IA Duelista, que
 * representa um aluno razoável) contra as mesas e os chefes de cada faixa de
 * andares. Mostra taxa de vitória, duração e moedas por hora de jogo.
 *
 *   npx vite-node scripts/tcg-torre.ts [partidas por andar=40] [nível do aluno=3]
 *
 * Um "aluno" com o deck inicial não deve passar do andar 20 ou 30 sem melhorar
 * o deck: é isso que dá sentido aos pacotinhos e às cartas dos chefes.
 */
import { playAiTurn, type AiLevel } from '../src/lib/tcg/ai';
import { createGame } from '../src/lib/tcg/engine';
import { bossFoe, coinsFor, floorProfile, starterDeck, tableFoe, TABLE_ELEMENT, TABLES_FOR_BOSS } from '../src/lib/tcg/opponents';
import type { CardDef } from '../src/lib/tcg/types';

const N = Number(process.argv[2] ?? 40);
const STUDENT = Number(process.argv[3] ?? 3) as AiLevel;
const SEC_PER_TURN = { player: 20, foe: 6 };   // o aluno pensa; a IA joga rápido
const tables = Object.keys(TABLE_ELEMENT);

function duel(deck: CardDef[], foe: ReturnType<typeof tableFoe>, seed: number) {
  let s = createGame([
    { name: 'Aluno', element: 'Fighting', deck },
    { name: foe.name, element: foe.element, deck: foe.deck, life: foe.life },
  ], { seed, firstPlayer: (seed % 2) as 0 | 1 });
  let secs = 0;
  while (s.winner === null && s.turn < 60) {
    const who = s.active;
    s = playAiTurn(s, who === 0 ? STUDENT : foe.ai, seed);
    secs += who === 0 ? SEC_PER_TURN.player : SEC_PER_TURN.foe;
  }
  return { won: s.winner === 0, rounds: Math.ceil(s.turn / 2), secs };
}

const deck = starterDeck();
console.log(`Aluno: deck inicial, jogado pela IA nível ${STUDENT}; ${N} partidas por linha\n`);
console.log('andar | mesa: vitória  rodadas  min  moedas | chefe: vitória  min  moedas | moedas/hora (1ª vez)');
for (const andar of [1, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
  const m = { won: 0, rounds: 0, secs: 0 }, b = { won: 0, secs: 0 };
  for (let k = 0; k < N; k++) {
    const t = duel(deck, tableFoe(andar, (k % 8) + 1, tables[k % tables.length], 'Mesa'), andar * 1000 + k);
    m.won += +t.won; m.rounds += t.rounds; m.secs += t.secs;
    const c = duel(deck, bossFoe(andar, 'Chefe'), andar * 5000 + k);
    b.won += +c.won; b.secs += c.secs;
  }
  const mw = m.won / N, bw = b.won / N;
  const mMin = m.secs / N / 60, bMin = b.secs / N / 60;
  // um andar na primeira vez: TABLES_FOR_BOSS mesas vencidas (+ as derrotas até vencer) e o chefe
  const tries = (w: number) => (w > 0 ? 1 / w : 99);
  const minutes = TABLES_FOR_BOSS * tries(mw) * mMin + tries(bw) * bMin;
  const coins = TABLES_FOR_BOSS * coinsFor(andar, 'mesa') + coinsFor(andar, 'chefe');
  const p = floorProfile(andar, 'mesa');
  console.log(
    `${String(andar).padStart(5)} | ${(mw * 100).toFixed(0).padStart(5)}%  ${(m.rounds / N).toFixed(1).padStart(6)}  ${mMin.toFixed(1).padStart(4)}  ${String(coinsFor(andar, 'mesa')).padStart(5)}`
    + ` | ${(bw * 100).toFixed(0).padStart(5)}%  ${bMin.toFixed(1).padStart(4)}  ${String(coinsFor(andar, 'chefe')).padStart(5)}`
    + ` | ${minutes < 900 ? Math.round(coins / (minutes / 60)) : '—'}   (vida ${p.life}, deck ${p.deckSize}, IA ${p.ai}, até ${p.maxRarity})`,
  );
}
