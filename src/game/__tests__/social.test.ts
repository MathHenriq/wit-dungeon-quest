import { describe, expect, it } from 'vitest';
import { bossShare, nickOk, presenceGoal, socialError } from '../social';
import { peersFromState, zoneTopic } from '../presence';

describe('social', () => {
  it('apelido: mesmo filtro do servidor', () => {
    expect(nickOk('Aninha 2')).toBe(true);
    expect(nickOk('João')).toBe(true);
    expect(nickOk('a')).toBe(false);
    expect(nickOk('<b>oi</b>')).toBe(false);
    expect(nickOk('Merda')).toBe(false);
    expect(nickOk('p0rr4')).toBe(false);    // trocar letra por número não passa
    expect(nickOk('nome muito comprido demais')).toBe(false);
  });
  it('guilda: barra do chefe e meta de presença', () => {
    expect(bossShare({ bossHp: 45, bossMax: 90 })).toBe(0.5);
    expect(bossShare({ bossHp: 0, bossMax: 0 })).toBe(0);
    const m = (presente: boolean) => ({ presente }) as never;
    expect(presenceGoal({ members: [m(true), m(false), m(true)] })).toEqual({ done: 2, total: 3 });
  });
  it('erro desconhecido do servidor vira mensagem genérica (não vaza detalhe)', () => {
    expect(socialError(new Error('duplicate key value violates unique constraint'))).toMatch(/Sem conexão/);
    expect(socialError(new Error('guilda cheia'))).toBe('Guilda cheia.');
  });
  it('presença: canal só da turma, leva o handle (nunca o id do aluno)', () => {
    expect(zoneTopic('t1', 'lago')).toBe('wit2-t1-lago');
    const look = { modelo: 'modelo-01' } as never;
    const peers = peersFromState({ a: [{ id: 'x', handle: 'abc123', nick: 'Lia', look, tx: 1, ty: 1, dir: 'south' }] }, 'eu');
    expect(peers[0].handle).toBe('abc123');
  });
});
