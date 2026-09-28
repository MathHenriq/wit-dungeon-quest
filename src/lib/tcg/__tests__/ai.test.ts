import { describe, expect, it } from 'vitest';
import { planTurn, playAiTurn, type AiLevel } from '../ai';
import { canPlay, createGame, playCard } from '../engine';
import {
  bossFoe, coinsFor, complexity, floorProfile, maxCopies, RARITY_ORDER, rewardFor, starterCollection, starterDeck, tableFoe,
} from '../opponents';
import type { CardDef } from '../types';

const levels: AiLevel[] = [1, 2, 3, 4];

describe('IA', () => {
  it.each(levels)('nível %i só faz jogadas válidas e termina a partida', level => {
    for (let k = 0; k < 4; k++) {
      const foe = tableFoe(20 + k * 20, 1 + k, 'mesa-fogo', 'X');
      let s = createGame([
        { name: 'A', element: 'Water', deck: starterDeck() },
        { name: 'B', element: foe.element, deck: foe.deck, life: foe.life },
      ], { seed: k + 3, firstPlayer: (k % 2) as 0 | 1 });
      while (s.winner === null && s.turn < 80) {
        for (const uid of planTurn(s, level, k)) {
          expect(canPlay(s, uid).ok).toBe(true);
          s = playCard(s, uid);
          if (s.winner !== null) break;
        }
        if (s.winner === null) s = playAiTurn(s, level, k); // termina o turno (e joga o que sobrou)
      }
      expect(s.winner).not.toBeNull();
    }
  });

  it('é reproduzível: mesma semente, mesmo plano', () => {
    const s = createGame([
      { name: 'A', element: 'Fire', deck: starterDeck() },
      { name: 'B', element: 'Fire', deck: starterDeck() },
    ], { seed: 9, firstPlayer: 1 });
    for (const level of levels) expect(planTurn(s, level, 5)).toEqual(planTurn(s, level, 5));
  });
});

describe('adversários da Torre', () => {
  const valid = (deck: CardDef[], size: number, maxRarity: string, maxCx: number) => {
    expect(deck).toHaveLength(size);
    const n = new Map<string, number>();
    for (const c of deck) {
      n.set(c.id, (n.get(c.id) ?? 0) + 1);
      expect(n.get(c.id)!).toBeLessThanOrEqual(maxCopies(c));
      expect(RARITY_ORDER.indexOf(c.rarity)).toBeLessThanOrEqual(RARITY_ORDER.indexOf(maxRarity as never));
      expect(complexity(c)).toBeLessThanOrEqual(maxCx);
    }
  };

  it('decks de mesa e de chefe respeitam tamanho, cópias, raridade e complexidade', () => {
    for (const andar of [1, 7, 15, 33, 50, 77, 100]) {
      for (let mesa = 1; mesa <= 8; mesa++) {
        const p = floorProfile(andar, 'mesa'), f = tableFoe(andar, mesa, 'mesa-agua', 'X');
        valid(f.deck, p.deckSize, p.maxRarity, p.maxComplexity);
        expect(f.deck.filter(c => c.type === 'attack').length).toBeGreaterThanOrEqual(Math.ceil(p.deckSize * p.attackShare));
      }
      const pb = floorProfile(andar, 'chefe');
      valid(bossFoe(andar, 'X').deck, pb.deckSize, pb.maxRarity, pb.maxComplexity + 1);
    }
  });

  it('o mesmo andar sempre tem os mesmos decks', () => {
    expect(tableFoe(12, 3, 'mesa-gelo', 'X').deck.map(c => c.id)).toEqual(tableFoe(12, 3, 'mesa-gelo', 'X').deck.map(c => c.id));
  });

  it('a Torre só fica mais difícil subindo', () => {
    let prev = floorProfile(1, 'mesa');
    for (let a = 2; a <= 100; a++) {
      const p = floorProfile(a, 'mesa');
      expect(p.life).toBeGreaterThanOrEqual(prev.life);
      expect(p.deckSize).toBeGreaterThanOrEqual(prev.deckSize);
      expect(p.ai).toBeGreaterThanOrEqual(prev.ai);
      expect(RARITY_ORDER.indexOf(p.maxRarity)).toBeGreaterThanOrEqual(RARITY_ORDER.indexOf(prev.maxRarity));
      expect(p.maxComplexity).toBeGreaterThanOrEqual(prev.maxComplexity);
      prev = p;
    }
  });

  it('moedas: chefe vale mais que mesa, sobem com o andar, revencer rende pouco', () => {
    for (let a = 1; a <= 100; a++) {
      expect(coinsFor(a, 'chefe')).toBeGreaterThan(coinsFor(a, 'mesa'));
      if (a > 1) expect(coinsFor(a, 'mesa')).toBeGreaterThanOrEqual(coinsFor(a - 1, 'mesa'));
    }
    const foe = { coins: 60 };
    expect(rewardFor(foe, 0)).toBe(60);
    expect(rewardFor(foe, 3)).toBe(12);
    // subir a Torre inteira pela primeira vez rende menos de 100 Pacotes Comuns (300 cada)
    let total = 0;
    for (let a = 1; a <= 100; a++) total += 8 * coinsFor(a, 'mesa') + coinsFor(a, 'chefe');
    expect(total).toBeLessThan(30000);
  });

  it('o deck inicial é simples, jogável e cabe na coleção inicial', () => {
    const deck = starterDeck();
    valid(deck, 20, 'uncommon', 1);
    expect(deck.filter(c => c.type === 'attack').length).toBeGreaterThanOrEqual(10);
    const col = starterCollection();
    const need = new Map<string, number>();
    for (const c of deck) need.set(c.id, (need.get(c.id) ?? 0) + 1);
    for (const [id, n] of need) expect(col[id] ?? 0).toBeGreaterThanOrEqual(n);
  });
});
