import { describe, it, expect } from 'vitest';
import { canPlay, createGame, endTurn, IllegalPlay, playCard } from '../engine';
import { describeCard } from '../describe';
import { duel, FILLER, inHand, passRound, SAMPLE as C } from './helpers';

/**
 * Cada teste aqui é uma interação que o aluno vai tentar montar. Se alguém
 * mexer no motor e quebrar uma delas, o teste diz qual e por quê.
 */

const vida = (s: ReturnType<typeof duel>, p: 0 | 1) => s.players[p].life;

describe('modificador pendente — o "próximo Fogo ×2"', () => {
  it('dobra DE VERDADE o próximo ataque de Fogo', () => {
    let s = duel({ hand: [C.furia, C.brasa] });
    s = playCard(s, inHand(s, 0, C.furia));
    s = playCard(s, inHand(s, 0, C.brasa));
    expect(vida(s, 1)).toBe(150 - 24); // 12 × 2
    expect(s.players[0].modifiers).toHaveLength(0); // foi consumido
  });

  it('um ataque de outro elemento não consome, e ele sobrevive à troca de turno', () => {
    let s = duel({ hand: [C.furia, C.jato], deck: [C.brasa, FILLER, FILLER] });
    s = playCard(s, inHand(s, 0, C.furia));
    s = playCard(s, inHand(s, 0, C.jato));      // Água: 12, sem dobro
    expect(vida(s, 1)).toBe(138);
    expect(s.players[0].modifiers).toHaveLength(1);

    s = passRound(s);                            // compra a Brasa
    s = playCard(s, inHand(s, 0, C.brasa));
    expect(vida(s, 1)).toBe(138 - 24);
  });

  it('dois ×2 multiplicam: ×4', () => {
    let s = duel({ hand: [C.furia, C.furia, C.brasa] });
    s = playCard(s, inHand(s, 0, C.furia));
    s = playCard(s, inHand(s, 0, C.furia));
    s = playCard(s, inHand(s, 0, C.brasa));
    expect(vida(s, 1)).toBe(150 - 48);
  });

  it('bônus de uso múltiplo dura exatamente N ataques', () => {
    let s = duel({ hand: [C.pira, FILLER, C.brasa], deck: [C.brasa, FILLER, C.brasa] });
    s = playCard(s, inHand(s, 0, C.pira));        // custo: descarta 1
    s = playCard(s, inHand(s, 0, C.brasa));       // 12 + 8
    expect(vida(s, 1)).toBe(130);
    s = passRound(s);
    s = playCard(s, inHand(s, 0, C.brasa));       // 12 + 8, último uso
    expect(vida(s, 1)).toBe(110);
    expect(s.players[0].modifiers).toHaveLength(0);
  });
});

describe('condições e escala', () => {
  it('Rasengan só ganha +10 se OUTRA carta de Vento veio antes no turno', () => {
    let s = duel({ hand: [C.rasengan] });
    s = playCard(s, inHand(s, 0, C.rasengan));
    expect(vida(s, 1)).toBe(130);

    let t = duel({ hand: [C.rajada, C.rasengan] });
    t = playCard(t, inHand(t, 0, C.rajada));
    t = playCard(t, inHand(t, 0, C.rasengan));
    expect(vida(t, 1)).toBe(120);
  });

  it('Rasengan Gigante: o custo de moer põe Vento no cemitério e o próprio ataque escala com isso', () => {
    let s = duel({ hand: [C.rasenganGigante], deck: [C.rajada, C.rasengan, FILLER] });
    s = playCard(s, inHand(s, 0, C.rasenganGigante));
    // 35 base + 5 × 2 cartas de Vento moídas
    expect(vida(s, 1)).toBe(150 - 45);
    expect(s.players[0].graveyard.map(c => c.def.id)).toEqual(['rajada', 'rasengan', 'rasengan-gigante']);
  });

  it('Tsukuyomi: 15 de dano só com 3+ cartas de Sombra no cemitério', () => {
    let s = duel({ hand: [C.tsukuyomi, C.sombra] }, { element: 'Fire' });
    s = playCard(s, inHand(s, 0, C.tsukuyomi), { discard: [inHand(s, 0, C.sombra)] }); // 1 Sombra no cemitério
    expect(vida(s, 1)).toBe(150);

    let t = duel({ hand: [C.sombra, C.sombra, C.tsukuyomi, C.sombra] }, { element: 'Fire' });
    t = playCard(t, inHand(t, 0, C.sombra));
    t = playCard(t, inHand(t, 0, C.sombra));
    t = playCard(t, inHand(t, 0, C.tsukuyomi), { discard: [inHand(t, 0, C.sombra)] }); // + a descartada = 3
    expect(vida(t, 1)).toBe(135);
  });
});

describe('trava e congelamento', () => {
  it('Tsukuyomi impede Ataques no próximo turno do inimigo — e só nele', () => {
    let s = duel({ hand: [C.tsukuyomi, FILLER] }, { hand: [C.brasa, C.brasa] });
    s = playCard(s, inHand(s, 0, C.tsukuyomi));
    s = endTurn(s);                               // turno de B
    const bloqueio = canPlay(s, inHand(s, 1, C.brasa));
    expect(bloqueio).toEqual({ ok: false, reason: 'Você não pode jogar Ataques neste turno.' });
    s = passRound(s);                             // próximo turno de B
    expect(canPlay(s, inHand(s, 1, C.brasa)).ok).toBe(true);
  });

  it('Congelamento impede o inimigo de atacar no turno seguinte', () => {
    let s = duel({ hand: [C.congelar] }, { hand: [C.brasa] });
    s = playCard(s, inHand(s, 0, C.congelar));
    s = endTurn(s);
    expect(canPlay(s, inHand(s, 1, C.brasa))).toEqual({ ok: false, reason: 'Congelado: não pode atacar neste turno.' });
  });
});

describe('armadilha', () => {
  it('Espelho Negro anula o ataque, devolve 10 — e o ×2 pendente NÃO é gasto', () => {
    let s = duel({ hand: [C.furia, C.brasa], deck: [C.brasa, FILLER, FILLER] }, { hand: [C.espelho] });
    // B baixa a armadilha no turno dele
    s = endTurn(s);
    s = playCard(s, inHand(s, 1, C.espelho));
    s = endTurn(s);

    s = playCard(s, inHand(s, 0, C.furia));
    s = playCard(s, inHand(s, 0, C.brasa));
    expect(vida(s, 1)).toBe(150);                 // anulado
    expect(vida(s, 0)).toBe(140);                 // levou o reflexo
    expect(s.players[0].modifiers).toHaveLength(1);

    s = passRound(s);
    s = playCard(s, inHand(s, 0, C.brasa));
    expect(vida(s, 1)).toBe(126);                 // agora o ×2 entra
  });
});

describe('custos de sacrifício', () => {
  it('Sacrifício do Guardião: mói 2 do próprio deck e anula o próximo dano', () => {
    let s = duel({ hand: [C.guardiao] }, { hand: [C.brasa, C.brasa] });
    const deckAntes = s.players[0].deck.length;
    s = playCard(s, inHand(s, 0, C.guardiao));
    expect(s.players[0].deck).toHaveLength(deckAntes - 2);
    s = endTurn(s);
    s = playCard(s, inHand(s, 1, C.brasa));
    expect(vida(s, 0)).toBe(150);                 // escudo segurou
    expect(s.players[0].shields).toBe(0);
  });

  it('não dá para jogar se não puder pagar', () => {
    const s = duel({ hand: [C.tsukuyomi] });
    // tira a carta comprada no turno: sobra só o Tsukuyomi, nada para descartar
    s.players[0].hand = s.players[0].hand.filter(c => c.def.id === 'tsukuyomi');
    expect(() => playCard(s, inHand(s, 0, C.tsukuyomi))).toThrow(IllegalPlay);
    expect(canPlay(s, inHand(s, 0, C.tsukuyomi))).toEqual({
      ok: false, reason: 'Precisa descartar 1 carta(s) e só tem 0.',
    });
  });

  it('Pacto de Sangue paga vida e compra 3', () => {
    let s = duel({ hand: [C.pacto] });
    s = playCard(s, inHand(s, 0, C.pacto));
    expect(vida(s, 0)).toBe(130);
    expect(s.players[0].hand).toHaveLength(1 + 3); // a Pedrinha comprada no turno + 3
  });

  it('Chamado dos Mortos bane 2 do cemitério e recupera o último Ataque', () => {
    let s = duel({ hand: [C.sombra, C.sombra, C.brasa, C.ressurreicao] });
    s = playCard(s, inHand(s, 0, C.sombra));
    s = playCard(s, inHand(s, 0, C.sombra));
    s = playCard(s, inHand(s, 0, C.brasa));
    const veus = s.players[0].graveyard.filter(c => c.def.id === 'sombra').map(c => c.uid);
    s = playCard(s, inHand(s, 0, C.ressurreicao), { banish: veus });
    expect(s.players[0].banished.map(c => c.def.id)).toEqual(['sombra', 'sombra']);
    expect(s.players[0].hand.some(c => c.def.id === 'brasa')).toBe(true);
  });
});

describe('equipamento, campo e elementos', () => {
  it('Katana soma antes, Armadura subtrai depois', () => {
    let s = duel({ hand: [C.katana, C.brasa] }, { hand: [C.armadura] });
    s = endTurn(s);
    s = playCard(s, inHand(s, 1, C.armadura));
    s = endTurn(s);
    s = playCard(s, inHand(s, 0, C.katana));
    s = playCard(s, inHand(s, 0, C.brasa));
    expect(vida(s, 1)).toBe(150 - (12 + 5 - 4));
  });

  it('Campo vale para os dois lados', () => {
    let s = duel({ hand: [C.vulcao, C.brasa] }, { hand: [C.brasa] });
    s = playCard(s, inHand(s, 0, C.vulcao));
    s = playCard(s, inHand(s, 0, C.brasa));
    expect(vida(s, 1)).toBe(150 - 17);
    s = endTurn(s);
    s = playCard(s, inHand(s, 1, C.brasa));
    expect(vida(s, 0)).toBe(150 - 17);
  });

  it('fraqueza dobra e imunidade zera', () => {
    let s = duel({ hand: [C.brasa] }, { element: 'Grass' });
    s = playCard(s, inHand(s, 0, C.brasa));
    expect(vida(s, 1)).toBe(126);

    let t = duel({ hand: [C.faisca] }, { element: 'Ground' });
    t = playCard(t, inHand(t, 0, C.faisca));
    expect(vida(t, 1)).toBe(150);
  });

  it('veneno acumula e causa dano no início do turno do envenenado', () => {
    // Herói de Fogo: Veneno contra Fantasma (o padrão) sairia pela metade.
    let s = duel({ hand: [C.ferrao], deck: [C.ferrao, FILLER, FILLER] }, { element: 'Fire' });
    s = playCard(s, inHand(s, 0, C.ferrao));      // 8
    s = endTurn(s);                               // B sofre 5
    expect(vida(s, 1)).toBe(150 - 8 - 5);
    s = endTurn(s);
    s = playCard(s, inHand(s, 0, C.ferrao));      // 8, veneno vira 10
    s = endTurn(s);                               // B sofre 10
    expect(vida(s, 1)).toBe(137 - 8 - 10);
  });
});

describe('regras de turno', () => {
  it('quem começa não ataca no primeiro turno, e só 1 Ataque por turno', () => {
    const inicio = createGame([
      { name: 'A', element: 'Ghost', deck: [C.brasa, C.brasa, C.brasa, FILLER, FILLER, FILLER] },
      { name: 'B', element: 'Ghost', deck: Array(6).fill(FILLER) },
    ], { shuffle: false });
    expect(canPlay(inicio, inHand(inicio, 0, C.brasa)).ok).toBe(false);

    let s = duel({ hand: [C.brasa, C.brasa] });
    s = playCard(s, inHand(s, 0, C.brasa));
    expect(canPlay(s, inHand(s, 0, C.brasa))).toEqual({ ok: false, reason: 'Só 1 Ataque por turno.' });
  });

  it('deck vazio causa fadiga crescente em vez de derrota', () => {
    let s = duel({ deck: [] });
    s.players[0].deck = [];
    s = passRound(s);
    expect(vida(s, 0)).toBe(145);
    s = passRound(s);
    expect(vida(s, 0)).toBe(135);
  });

  it('mão acima de 7 descarta no fim do turno', () => {
    let s = duel({ hand: Array(8).fill(FILLER) });
    s = endTurn(s);
    expect(s.players[0].hand).toHaveLength(7);
    expect(s.players[0].graveyard).toHaveLength(2);
  });
});

describe('garantias do motor', () => {
  it('não altera o estado de entrada', () => {
    const s = duel({ hand: [C.brasa] });
    const antes = JSON.stringify(s);
    playCard(s, inHand(s, 0, C.brasa));
    expect(JSON.stringify(s)).toBe(antes);
  });

  it('o estado é JSON e a mesma semente gera a mesma partida', () => {
    const deck = [C.brasa, C.jato, C.furia, C.pira, C.rasengan, C.rajada, C.katana];
    const mk = () => createGame([
      { name: 'A', element: 'Fire', deck },
      { name: 'B', element: 'Water', deck },
    ], { seed: 99 });
    const g1 = mk();
    const g2 = mk();
    expect(JSON.parse(JSON.stringify(g1))).toEqual(g1);
    expect(g1.players[0].hand.map(c => c.def.id)).toEqual(g2.players[0].hand.map(c => c.def.id));
  });
});

describe('texto gerado a partir do efeito', () => {
  it('descreve as cartas de exemplo sem mentir', () => {
    expect(describeCard(C.furia).text).toBe('Seu próximo Ataque de Fogo causa o dobro de dano.');
    expect(describeCard(C.rasengan).text).toBe('Se você jogou outra carta de Vento neste turno: este ataque causa +10 de dano.');
    expect(describeCard(C.guardiao)).toEqual({
      cost: 'Mande 2 cartas do topo do seu deck ao cemitério.',
      text: 'Anule o próximo dano que você receber.',
    });
    expect(describeCard(C.espelho).text).toBe('Quando o inimigo jogar um Ataque: anule essa carta e cause 10 de dano.');
  });
});

describe('a corrente de combos que vence o jogo', () => {
  it('Pira + Fúria + Katana + Vulcão + Brasa contra herói de Planta = 120', () => {
    let s = duel({ hand: [C.vulcao, C.katana, C.pira, FILLER, C.furia, C.brasa] }, { element: 'Grass' });
    for (const c of [C.vulcao, C.katana, C.pira, C.furia, C.brasa]) {
      s = playCard(s, inHand(s, 0, c));
    }
    // (12 + 5 Katana + 5 Vulcão + 8 Pira) × 2 Fúria × 2 fraqueza
    expect(vida(s, 1)).toBe(150 - 120);
  });
});
