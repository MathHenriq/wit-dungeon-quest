import { describe, expect, it } from 'vitest';
import { decodeDeck, encodeDeck } from '../deck-code';
import { starterDeck } from '../opponents';

describe('código do deck (PvP assíncrono)', () => {
  it('ida e volta com o deck exato e o apelido (acentos inclusive)', () => {
    const ids = starterDeck().map(c => c.id);
    const code = encodeDeck('Lúcia Raio', ids);
    expect(code.startsWith('WIT1-')).toBe(true);
    const d = decodeDeck(code);
    if ('reason' in d) throw new Error(d.reason);
    expect(d.nick).toBe('Lúcia Raio');
    expect(d.cards.map(c => c.id)).toEqual(ids);
  });
  it('recusa código digitado errado, de outro jogo ou com deck incompleto', () => {
    const ids = starterDeck().map(c => c.id);
    const code = encodeDeck('Ana', ids);
    expect(decodeDeck(code.slice(0, -3) + 'abc').ok).toBe(false);
    expect(decodeDeck('XYZ-123').ok).toBe(false);
    expect(decodeDeck(encodeDeck('Ana', ids.slice(0, 10))).ok).toBe(false);
  });
});
