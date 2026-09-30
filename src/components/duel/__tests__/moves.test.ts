import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/lib/tcg/cards/catalog';
import { createGame, endTurn, playCard } from '@/lib/tcg/engine';
import type { CardDef, GameState } from '@/lib/tcg/types';
import { diffMoves } from '../moves';

const simple = CATALOG.filter(c => c.type === 'attack' && !c.cost?.length && !c.effects?.length).slice(0, 20);
const withCost = (kind: string) => CATALOG.find(c => c.cost?.some(k => k.kind === kind) && c.cost.length === 1)!;

/** Partida com `card` na mão do jogador 0 e o resto do deck com ataques simples. */
function gameWith(card: CardDef): { s: GameState; uid: string } {
  const deck = [card, ...simple.slice(0, 19)];
  // o outro começa e passa: no turno do jogador 0 ele já pode atacar
  const s = endTurn(createGame([{ name: 'A', deck }, { name: 'B', deck: simple }], { seed: 7, firstPlayer: 1 }));
  const p = s.players[0];
  const i = p.deck.findIndex(c => c.def.id === card.id);
  if (i >= 0) p.hand.push(...p.deck.splice(i, 1));
  return { s, uid: p.hand.find(c => c.def.id === card.id)!.uid };
}

describe('movimentos das cartas (o que a tela anima)', () => {
  it('descarte: a carta paga sai da mão para o cemitério; a jogada sai do centro', () => {
    const card = withCost('discard');
    const { s, uid } = gameWith(card);
    const next = playCard(s, uid);
    const moves = diffMoves(s, next, uid);
    expect(moves.some(m => m.from === 'hand' && m.to === 'grave' && m.uid !== uid)).toBe(true);
    const played = moves.find(m => m.uid === uid);
    if (played) expect(played.from).toBe('center');
  });

  it('mandar do deck ao cemitério: deck → cemitério', () => {
    const card = withCost('mill');
    const { s, uid } = gameWith(card);
    const moves = diffMoves(s, playCard(s, uid), uid);
    expect(moves.filter(m => m.from === 'deck' && m.to === 'grave').length).toBeGreaterThan(0);
  });

  it('compra do começo do turno: deck → mão do outro lado', () => {
    const { s } = gameWith(simple[0]);
    const next = endTurn(s);
    expect(diffMoves(s, next).some(m => m.side === 1 && m.from === 'deck' && m.to === 'hand')).toBe(true);
    expect(diffMoves(s, next).every(m => m.side === 1)).toBe(true);
  });

  it('nada mudou, nada anima', () => {
    const { s } = gameWith(simple[0]);
    expect(diffMoves(s, s)).toEqual([]);
  });
});

describe('conta do golpe no registro (fichas da tela)', () => {
  it('o total da conta é o dano que a vida perdeu', () => {
    const { s, uid } = gameWith(simple[0]);
    const before = s.players[1].life;
    const next = playCard(s, uid);
    const calc = next.log.map(l => l.calc).filter(Boolean).pop()!;
    expect(calc).toBeTruthy();
    expect(calc.base).toBe(simple[0].damage);
    expect(before - next.players[1].life).toBe(calc.total);
  });
});
