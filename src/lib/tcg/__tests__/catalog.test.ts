import { describe, expect, it } from 'vitest';
import { CARD_ID_BY_SHOP_NAME, CATALOG } from '../cards/catalog';
import { describeCard } from '../describe';
import { createGame, playableCards, playCard, endTurn } from '../engine';
import shopNames from './shop-names.json';

describe('catálogo', () => {
  it('cobre exatamente os itens da loja', () => {
    expect([...CARD_ID_BY_SHOP_NAME.keys()].sort()).toEqual(shopNames);
  });

  it('ids únicos', () => {
    const ids = CATALOG.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CATALOG.map(c => [c.name, c] as const))('%s é coerente e tem texto', (_, c) => {
    if (c.type === 'attack') expect(c.damage).toBeGreaterThanOrEqual(0);
    else expect(c.damage).toBeUndefined();
    if (c.type === 'equipment') expect(c.slot).toBeDefined();
    if (c.type === 'trap') expect(c.trap).toBeDefined();
    if (c.type !== 'attack') {
      expect(c.effects?.some(e => e.kind === 'bonus' || e.kind === 'pierce' || e.kind === 'lifesteal') ?? false).toBe(false);
    }
    const { cost, text } = describeCard(c);
    const tudo = `${cost ?? ''} ${text}`;
    expect(tudo).not.toMatch(/undefined|NaN|\[object/);
    if (c.type !== 'attack') expect(text.length).toBeGreaterThan(0);
  });

  it('toda carta pode ser jogada sem quebrar o motor', () => {
    for (const c of CATALOG) {
      let s = createGame([
        { name: 'A', element: 'Fire', deck: [c, ...CATALOG.slice(0, 19)] },
        { name: 'B', element: 'Water', deck: CATALOG.slice(20, 40) },
      ], { shuffle: false, firstPlayer: 1, seed: 1 });
      s = endTurn(s);
      s.players[0].graveyard = s.players[0].deck.splice(0, 6); // combustível para custos de banir
      const inst = s.players[0].hand.find(x => x.def.id === c.id)!;
      if (playableCards(s).some(x => x.uid === inst.uid)) {
        expect(() => { s = playCard(s, inst.uid); }).not.toThrow();
        expect(() => endTurn(endTurn(s))).not.toThrow();
      }
    }
  });
});
