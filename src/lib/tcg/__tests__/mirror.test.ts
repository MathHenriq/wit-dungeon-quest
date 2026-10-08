import { describe, expect, it } from 'vitest';
import { createGame, endTurn, playCard, IllegalPlay } from '../engine';
import { planTurn } from '../ai';
import { mirrorState } from '../mirror';
import { CATALOG } from '../cards/catalog';
import type { GameState } from '../types';

// deck aleatório (com semente) de 20
function deck(seed: number) {
  let x = seed;
  const r = () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; };
  return Array.from({ length: 20 }, () => CATALOG[Math.floor(r() * CATALOG.length)]);
}
const strip = (s: GameState) => JSON.parse(JSON.stringify(s));

describe('espelho da partida (base do PvP online)', () => {
  it('espelhar duas vezes volta ao mesmo', () => {
    const s = createGame([{ name: 'A', deck: deck(1) }, { name: 'B', deck: deck(2) }], { seed: 7, firstPlayer: 0 });
    expect(strip(mirrorState(mirrorState(s)))).toEqual(strip(s));
  });
  it('jogar no espelho = espelho de jogar (12 partidas inteiras)', () => {
    for (let g = 0; g < 12; g++) {
      let s = createGame([{ name: 'A', deck: deck(g * 3 + 1) }, { name: 'B', deck: deck(g * 3 + 2) }], { seed: g + 11, firstPlayer: (g % 2) as 0 | 1 });
      let m = mirrorState(s);
      for (let t = 0; t < 60 && s.winner === null; t++) {
        const plan = planTurn(s, 3, g * 1000 + t);
        for (const uid of plan) {
          if (s.winner !== null) break;
          let ok = true;
          try { s = playCard(s, uid); } catch (e) { if (e instanceof IllegalPlay) ok = false; else throw e; }
          if (ok) m = playCard(m, uid);
          expect(strip(mirrorState(m))).toEqual(strip(s));
        }
        if (s.winner !== null) break;
        s = endTurn(s); m = endTurn(m);
        expect(strip(mirrorState(m))).toEqual(strip(s));
      }
    }
  }, 60_000);
});
