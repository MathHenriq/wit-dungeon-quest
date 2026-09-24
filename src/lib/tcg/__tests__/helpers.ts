import { createGame, endTurn } from '../engine';
import type { CardDef, Element, GameState } from '../types';
import { SAMPLE } from '../cards/sample';

/** Carta neutra para encher deck e mão sem interferir. */
export const FILLER: CardDef = {
  id: 'filler', name: 'Pedrinha', type: 'challenger', element: 'Ground', rarity: 'common',
};

interface Side {
  hand?: CardDef[];
  deck?: CardDef[];
  element?: Element;
}

/**
 * Monta uma partida com mãos e decks exatos, e já avança para o primeiro
 * turno em que o jogador A pode atacar.
 *
 * B começa e passa o turno; A então está no turno 2, depois de comprar a
 * carta do topo do deck (por isso o deck de A começa com uma carta neutra).
 * Elemento padrão dos heróis: Fantasma, que é neutro para Fogo, Água e Vento.
 */
export function duel(a: Side, b: Side = {}): GameState {
  let s = createGame([
    { name: 'A', element: a.element ?? 'Ghost', deck: Array(10).fill(FILLER) },
    { name: 'B', element: b.element ?? 'Ghost', deck: Array(10).fill(FILLER) },
  ], { shuffle: false, firstPlayer: 1, seed: 7 });

  const inst = (def: CardDef) => ({ uid: `t${s.nextUid++}`, def });
  s.players[0].hand = (a.hand ?? []).map(inst);
  s.players[0].deck = [FILLER, ...(a.deck ?? Array(10).fill(FILLER))].map(inst);
  s.players[1].hand = (b.hand ?? []).map(inst);
  s.players[1].deck = (b.deck ?? Array(10).fill(FILLER)).map(inst);

  s = endTurn(s); // B passa, começa o turno 2 de A
  return s;
}

/** uid da primeira carta com esse id na mão do jogador. */
export function inHand(s: GameState, player: 0 | 1, def: CardDef): string {
  const c = s.players[player].hand.find(x => x.def.id === def.id);
  if (!c) throw new Error(`${def.name} não está na mão de ${s.players[player].name}`);
  return c.uid;
}

/** Passa o turno do jogador ativo e o do outro, voltando ao mesmo jogador. */
export function passRound(s: GameState): GameState {
  return endTurn(endTurn(s));
}

export { SAMPLE };
