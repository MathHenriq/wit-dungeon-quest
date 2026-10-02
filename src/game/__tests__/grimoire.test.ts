import { describe, expect, it } from 'vitest';
import { deckSlots, freePoints, grimoirePoints, learn, versoOf } from '../grimoire';
import { newProgress, sanitizeProgress } from '../progress';
import { disenchant } from '../forge';
import { canMulligan, createGame, mulligan } from '@/lib/tcg/engine';
import { pathDeck } from '@/lib/tcg/paths';

describe('Grimório', () => {
  it('pontos pela Torre; custo, pré-requisito e só uma vez', () => {
    let p = { ...newProgress(), towerMax: 9 };
    expect(grimoirePoints(p)).toBe(4);
    expect('reason' in learn(p, 'po-extra')).toBe(true);            // precisa do Estojo Extra
    p = (learn(p, 'deck-extra') as { progress: typeof p }).progress;
    expect(deckSlots(p)).toBe(4);
    expect(freePoints(p)).toBe(2);
    expect('reason' in learn(p, 'deck-extra')).toBe(true);
    expect('reason' in learn(p, 'po-extra')).toBe(true);            // faltam pontos (custa 3)
    p = (learn(p, 'verso-dourado') as { progress: typeof p }).progress;
    expect(versoOf({ ...p, verso: 'dourado' })).toBe('dourado');
    expect(versoOf({ ...p, verso: 'noite' })).toBe('classico');     // não aprendeu esse
    expect(sanitizeProgress(JSON.parse(JSON.stringify(p))).grimorio).toEqual(['deck-extra', 'verso-dourado']);
  });
  it('Martelo do Ferreiro dá 25% a mais de pó', () => {
    const base = { ...newProgress(), towerMax: 20, collection: { ...newProgress().collection } };
    const id = Object.keys(base.collection)[0];
    base.collection[id] = 3;
    const normal = disenchant(base, id, 2) as { dust: number };
    const comTalento = disenchant({ ...base, grimorio: ['deck-extra', 'po-extra'] }, id, 2) as { dust: number };
    expect(comTalento.dust).toBe(Math.round(normal.dust * 1.25));
  });
  it('Embaralhar de Novo: só no 1º turno, antes de jogar, uma vez', () => {
    const s = createGame([{ name: 'A', deck: pathDeck('desafiante') }, { name: 'B', deck: pathDeck('louco') }], { seed: 5, firstPlayer: 0 });
    expect(canMulligan(s, 0)).toBe(true);
    expect(canMulligan(s, 1)).toBe(false);
    const m = mulligan(s, 0);
    expect(m.players[0].hand).toHaveLength(s.players[0].hand.length);
    expect(m.players[0].hand.length + m.players[0].deck.length).toBe(s.players[0].hand.length + s.players[0].deck.length);
    expect(canMulligan(m, 0)).toBe(false);
    expect(mulligan(m, 0)).toBe(m);
  });
});
