import { describe, expect, it } from 'vitest';
import { endTurn, playCard } from '../engine';
import { describeCard } from '../describe';
import type { CardDef } from '../types';
import { duel, inHand, passRound } from './helpers';

const golpe: CardDef = { id: 'golpe', name: 'Golpe', type: 'attack', element: 'Fire', rarity: 'common', damage: 20 };

describe('mecânicas novas', () => {
  it('sangramento acumula e causa dano no início do turno de quem sangra', () => {
    const corte: CardDef = {
      id: 'corte', name: 'Corte', type: 'challenger', element: 'Steel', rarity: 'common',
      effects: [{ kind: 'status', status: 'bleed', value: 4, turns: 2 }, { kind: 'status', status: 'bleed', value: 4, turns: 2 }],
    };
    let s = duel({ hand: [corte] });
    s = playCard(s, inHand(s, 0, corte));
    expect(s.players[1].statuses).toEqual([{ kind: 'bleed', value: 8, turnsLeft: 2 }]);
    s = endTurn(s);
    expect(s.players[1].life).toBe(142);
  });

  it('aura repete o efeito no início dos próximos N turnos e acaba', () => {
    const invocacao: CardDef = {
      id: 'inv', name: 'Invocação', type: 'challenger', element: 'Fire', rarity: 'rare',
      effects: [{ kind: 'aura', turns: 2, label: 'Espectro', effects: [{ kind: 'damage', amount: 10 }] }],
    };
    let s = duel({ hand: [invocacao] });
    s = playCard(s, inHand(s, 0, invocacao));
    expect(s.players[1].life).toBe(150);
    s = passRound(s);
    expect(s.players[1].life).toBe(140);
    s = passRound(s);
    expect(s.players[1].life).toBe(130);
    s = passRound(s);
    expect(s.players[1].life).toBe(130);
    expect(s.players[0].auras).toHaveLength(0);
  });

  it('troca de vida', () => {
    const troca: CardDef = { id: 'troca', name: 'Troca', type: 'challenger', element: 'Ghost', rarity: 'epic', effects: [{ kind: 'swapLife' }] };
    let s = duel({ hand: [troca] });
    s.players[0].life = 30;
    s = playCard(s, inHand(s, 0, troca));
    expect(s.players[0].life).toBe(150);
    expect(s.players[1].life).toBe(30);
  });

  it('roubo de vida usa o dano realmente causado', () => {
    const vampiro: CardDef = { ...golpe, id: 'vamp', effects: [{ kind: 'lifesteal', ratio: 0.5 }] };
    let s = duel({ hand: [vampiro] });
    s.players[0].life = 100;
    s = playCard(s, inHand(s, 0, vampiro));
    expect(s.players[1].life).toBe(130);
    expect(s.players[0].life).toBe(110);
  });

  it('Contra-ataque refletido: o ataque inimigo acerta ele mesmo, com os bônus dele', () => {
    const counter: CardDef = {
      id: 'counter', name: 'Full Counter', type: 'trap', element: 'Fighting', rarity: 'epic',
      trap: { trigger: 'opponentAttack', reflect: true },
    };
    const furia: CardDef = {
      id: 'f', name: 'Fúria', type: 'challenger', element: 'Ghost', rarity: 'rare',
      effects: [{ kind: 'addModifier', spec: { match: { type: 'attack' }, mult: 2, label: 'Fúria' } }],
    };
    let s = duel({ hand: [counter], deck: [golpe, golpe] }, { hand: [furia, golpe] });
    s = playCard(s, inHand(s, 0, counter));
    s = endTurn(s);
    s = playCard(s, inHand(s, 1, furia));
    s = playCard(s, inHand(s, 1, golpe));
    expect(s.players[0].life).toBe(150);
    expect(s.players[1].life).toBe(110); // 20 × 2 no próprio atacante
    expect(s.players[1].modifiers).toHaveLength(0);
  });

  it('ataque inevitável não ativa armadilha e atravessa escudo e armadura', () => {
    const lanca: CardDef = { ...golpe, id: 'lanca', name: 'Lança', effects: [{ kind: 'pierce' }] };
    const espelho: CardDef = { id: 'esp', name: 'Espelho', type: 'trap', element: 'Steel', rarity: 'rare', trap: { trigger: 'opponentAttack', negate: true } };
    const armadura: CardDef = { id: 'arm', name: 'Armadura', type: 'equipment', element: 'Steel', rarity: 'rare', slot: 'armor', passives: [{ kind: 'damageReduction', amount: 5, label: 'Armadura' }] };
    let s = duel({ hand: [lanca] });
    const inst = (def: CardDef) => ({ uid: `x${s.nextUid++}`, def });
    s.players[1].traps.push(inst(espelho));
    s.players[1].armor = inst(armadura);
    s.players[1].shields = 1;
    s = playCard(s, inHand(s, 0, lanca));
    expect(s.players[1].life).toBe(130);
    expect(s.players[1].traps).toHaveLength(1);
    expect(s.players[1].shields).toBe(1);
  });

  it('armadilha com condição só dispara quando a condição vale', () => {
    const volta: CardDef = {
      id: 'volta', name: 'Retorno', type: 'trap', element: 'Ghost', rarity: 'unknown',
      trap: { trigger: 'opponentAttack', negate: true, condition: { kind: 'lifeAtMost', amount: 40 } },
    };
    let s = duel({ hand: [volta] }, { hand: [golpe, golpe], deck: [golpe, golpe, golpe] });
    s = playCard(s, inHand(s, 0, volta));
    s = endTurn(s);
    s = playCard(s, inHand(s, 1, golpe));
    expect(s.players[0].life).toBe(130); // vida alta: não disparou
    s = endTurn(s);
    s.players[0].life = 30;
    s = endTurn(s);
    s = playCard(s, inHand(s, 1, golpe));
    expect(s.players[0].life).toBe(30); // disparou e anulou
  });

  it('quantias por rodada, vida perdida e dano recebido', () => {
    const bigBang: CardDef = { ...golpe, id: 'bb', damage: 10, effects: [{ kind: 'bonus', add: { per: 'round', each: 5, max: 20 }, label: 'Big Bang' }] };
    let s = duel({ hand: [bigBang] });
    // turno 2 = rodada 1
    s = playCard(s, inHand(s, 0, bigBang));
    expect(s.players[1].life).toBe(135);

    const cem: CardDef = { ...golpe, id: 'cem', damage: 0, effects: [{ kind: 'bonus', add: { per: 'lifeLost', each: 0.5 }, label: '100%' }] };
    s = duel({ hand: [cem] });
    s.players[0].life = 90;
    s = playCard(s, inHand(s, 0, cem));
    expect(s.players[1].life).toBe(120);

    const requiem: CardDef = { id: 'rq', name: 'Requiem', type: 'challenger', element: 'Ghost', rarity: 'unknown', effects: [{ kind: 'heal', amount: { per: 'damageTaken', each: 1 } }] };
    s = duel({ hand: [requiem], deck: [golpe, golpe] }, { hand: [golpe] });
    s = endTurn(s);
    s = playCard(s, inHand(s, 1, golpe));
    s = endTurn(s);
    expect(s.players[0].life).toBe(130);
    s = playCard(s, inHand(s, 0, requiem));
    expect(s.players[0].life).toBe(150);
  });

  it('purge limpa status do próprio jogador e bônus do inimigo', () => {
    const pedra: CardDef = { id: 'pedra', name: 'Pedra', type: 'challenger', element: 'Ghost', rarity: 'legendary', effects: [{ kind: 'purge', what: 'statuses' }] };
    const caixao: CardDef = { id: 'cx', name: 'Caixão', type: 'challenger', element: 'Ghost', rarity: 'epic', effects: [{ kind: 'purge', what: 'modifiers', target: 'opponent' }] };
    let s = duel({ hand: [pedra, caixao] });
    s.players[0].statuses.push({ kind: 'poison', value: 5, turnsLeft: 3 });
    s.players[0].locks.push({ cardType: 'attack', turnsLeft: 1 });
    s.players[1].modifiers.push({ match: {}, mult: 2, label: 'x', usesLeft: 1, source: 'x' });
    s = playCard(s, inHand(s, 0, pedra));
    s = playCard(s, inHand(s, 0, caixao));
    expect(s.players[0].statuses).toHaveLength(0);
    expect(s.players[0].locks).toHaveLength(0);
    expect(s.players[1].modifiers).toHaveLength(0);
  });

  it('texto gerado das mecânicas novas', () => {
    expect(describeCard({
      id: 'a', name: 'a', type: 'trap', element: 'Fighting', rarity: 'epic',
      trap: { trigger: 'opponentAttack', reflect: true },
    }).text).toBe('Quando o inimigo jogar um Ataque: o ataque acerta quem atacou, com todos os bônus dele.');
    expect(describeCard({
      id: 'b', name: 'b', type: 'attack', element: 'Fire', rarity: 'rare', damage: 0,
      effects: [{ kind: 'bonus', add: { per: 'lifeLost', each: 0.5 }, label: 'x' }, { kind: 'lifesteal', ratio: 0.5 }],
    }).text).toBe('Este ataque causa dano extra igual à metade da vida que você já perdeu. Recupere vida igual à metade do dano causado.');
  });
});
