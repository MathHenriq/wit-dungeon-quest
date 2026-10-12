import { describe, expect, it } from 'vitest';
import { FALAS, peersFromState } from '../presence';

describe('cidade compartilhada (canal por área)', () => {
  it('lista os colegas sem a gente mesmo, sem repetidos e sem lixo', () => {
    const look = { modelo: 'modelo-01' } as never;
    const state = {
      a: [{ id: 'eu', nick: 'Eu', look, tx: 1, ty: 1, dir: 'south' }],
      b: [{ id: 'ana', nick: 'Ana', look, tx: 5, ty: 6, dir: 'west' }, { id: 'ana', nick: 'Ana', look, tx: 5, ty: 7, dir: 'west' }],
      c: [{ id: 'quebrado', nick: 'X' }],
    };
    const peers = peersFromState(state, 'eu');
    expect(peers.map(p => p.id)).toEqual(['ana']);
    expect(peers[0].ty).toBe(7);
  });

  it('balão só com frase pronta (índice válido)', () => {
    const look = { modelo: 'modelo-01' } as never;
    const st = (fala: unknown) => peersFromState({ a: [{ id: 'ana', nick: 'Ana', look, tx: 1, ty: 1, fala }] }, 'eu')[0].fala;
    expect(st({ i: 1, t: 5 })).toEqual({ i: 1, t: 5 });
    expect(st({ i: FALAS.length, t: 5 })).toBeUndefined();
    expect(st({ i: 'palavrão', t: 5 })).toBeUndefined();
    expect(st('texto livre')).toBeUndefined();
  });
});
