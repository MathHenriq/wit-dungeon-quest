/**
 * Os 8 Caminhos (decks iniciais) entre si e contra a Torre. Nenhum Caminho
 * pode ser muito melhor que outro (faixa aceitável: ~40% a 60% contra o resto)
 * e todos precisam passar das mesas do começo.
 *
 *   npx vite-node scripts/tcg-caminhos.ts [partidas=40]            relatório
 *   npx vite-node scripts/tcg-caminhos.ts --ajustar sabio,louco 6  busca a variação de cada
 *     Caminho mais perto de 50% contra os outros (grava em scripts/out/caminho-<id>.json)
 *   npx vite-node scripts/tcg-caminhos.ts --juntar                 junta em src/lib/tcg/cards/caminhos.json
 *
 * A busca roda bem em paralelo: um processo por grupo de Caminhos.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { playAiTurn } from '../src/lib/tcg/ai';
import { createGame } from '../src/lib/tcg/engine';
import { generatePathDeck, PATHS, pathDeck, type DeckKnobs, type PathId } from '../src/lib/tcg/paths';
import { tableFoe, TABLE_ELEMENT } from '../src/lib/tcg/opponents';
import { towerBoss } from '../src/lib/tcg/bosses';
import type { CardDef } from '../src/lib/tcg/types';

const tables = Object.keys(TABLE_ELEMENT);
function duel(a: CardDef[], b: CardDef[], seed: number, lifeB?: number, aiB: 1 | 2 | 3 | 4 = 3) {
  let s = createGame([{ name: 'A', deck: a }, { name: 'B', deck: b, life: lifeB }], { seed, firstPlayer: (seed % 2) as 0 | 1 });
  while (s.winner === null && s.turn < 60) s = playAiTurn(s, s.active === 0 ? 3 : aiB, seed);
  return s.winner === 0;
}
const vsField = (deck: CardDef[], field: CardDef[][], n: number, salt: number) => {
  let w = 0, t = 0;
  field.forEach((f, j) => { for (let k = 0; k < n; k++) { w += +duel(deck, f, salt + j * 977 + k * 31); t++; } });
  return w / t;
};

const args = process.argv.slice(2);
if (args[0] === '--ajustar') {
  const ids = args[1].split(',') as PathId[];
  const n = Number(args[2] ?? 6);
  mkdirSync('scripts/out', { recursive: true });
  for (const id of ids) {
    const field = PATHS.filter(p => p.id !== id).map(p => pathDeck(p.id));
    let best = { score: 9, rate: 0, knobs: {} as DeckKnobs, deck: [] as CardDef[] };
    const grid: DeckKnobs[] = [];
    for (const attackDelta of [-0.1, 0, 0.1]) for (const power of [-2, 0, 2, 4]) for (const theme of [1, 0.4]) grid.push({ attackDelta, power, theme });
    // decks fortes demais: menos cartas do tema (mas sempre com a cara do Caminho)
    if (args[3] === '--limitar') { grid.length = 0; for (const cap of [8, 10, 12, 14]) for (const power of [-2, 0, 2]) for (const attackDelta of [-0.1, 0]) grid.push({ cap, power, attackDelta }); }
    for (const knobs of grid) {
      const theme = knobs.theme ?? 1;
      const deck = generatePathDeck(id, knobs);
      const rate = vsField(deck, field, n, 123);
      // perto de 50%, e um pouco de preferência pelo tema cheio (o estilo do Caminho)
      const score = Math.abs(rate - 0.5) + (theme < 1 ? 0.03 : 0);
      if (score < best.score) best = { score, rate, knobs, deck };
    }
    writeFileSync(`scripts/out/caminho-${id}.json`, JSON.stringify({ id, rate: best.rate, knobs: best.knobs, deck: best.deck.map(c => c.id) }, null, 1));
    console.log(id, Math.round(best.rate * 100) + '%', JSON.stringify(best.knobs));
  }
} else if (args[0] === '--juntar') {
  const path = 'src/lib/tcg/cards/caminhos.json';
  const out = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string[]>;
  for (const f of readdirSync('scripts/out').filter(f => f.startsWith('caminho-'))) {
    const r = JSON.parse(readFileSync(`scripts/out/${f}`, 'utf8'));
    out[r.id] = r.deck;
  }
  writeFileSync(path, JSON.stringify(out, null, 1) + '\n');
  console.log('gravado', Object.keys(out).join(', '));
} else {
  const N = Number(args[0] ?? 40);
  const decks = PATHS.map(p => pathDeck(p.id));
  console.log('Caminho        | vs Caminhos | andar 1 | andar 5 | andar 10 | chefe 5 | chefe 10');
  for (let i = 0; i < PATHS.length; i++) {
    const rate = vsField(decks[i], decks.filter((_, j) => j !== i), Math.ceil(N / 7) * 2, 999 + i);
    const tower = (andar: number, boss: boolean) => {
      let tw = 0;
      for (let k = 0; k < N; k++) {
        const f = boss ? towerBoss(andar) : tableFoe(andar, (k % 8) + 1, tables[k % tables.length], 'M');
        tw += +duel(decks[i], f.deck, andar * 999 + k, f.life, f.ai);
      }
      return `${Math.round((tw / N) * 100)}%`;
    };
    console.log(`${PATHS[i].name.padEnd(14)} | ${`${Math.round(rate * 100)}%`.padStart(11)} | ${tower(1, false).padStart(7)} | ${tower(5, false).padStart(7)} | ${tower(10, false).padStart(8)} | ${tower(5, true).padStart(7)} | ${tower(10, true).padStart(8)}`);
  }
}
