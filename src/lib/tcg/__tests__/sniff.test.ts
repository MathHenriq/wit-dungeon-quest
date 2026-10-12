import { describe, expect, it } from 'vitest';
import { canSniff, createGame, endTurn, sniff } from '../engine';
import { mirrorState } from '../mirror';
import { pathDeck } from '../paths';

const game = () => createGame([{ name: 'A', deck: pathDeck('desafiante') }, { name: 'B', deck: pathDeck('louco') }], { seed: 9, firstPlayer: 0 });

describe('faro do pet', () => {
  it('uma vez por partida, só no próprio turno; manda o topo para o fundo ou deixa', () => {
    const s = game();
    expect(canSniff(s, 1)).toBe(false);
    const top = s.players[0].deck[0].uid, size = s.players[0].deck.length;
    const b = sniff(s, 0, true);
    expect(b.players[0].deck.at(-1)!.uid).toBe(top);
    expect(b.players[0].deck).toHaveLength(size);
    expect(b.players[0].hand).toEqual(s.players[0].hand);
    expect(canSniff(b, 0)).toBe(false);
    expect(sniff(b, 0, true)).toBe(b);
    const k = sniff(s, 0, false);
    expect(k.players[0].deck[0].uid).toBe(top);
    expect(canSniff(endTurn(k), 1)).toBe(true);
  });
  it('é simétrico: farejar no espelho dá o espelho (PvP online)', () => {
    const s = endTurn(game());
    const a = sniff(s, 1, true);
    const m = sniff(mirrorState(s), 0, true);
    expect(mirrorState(m).players.map(p => p.deck.map(c => c.uid))).toEqual(a.players.map(p => p.deck.map(c => c.uid)));
  });
});
