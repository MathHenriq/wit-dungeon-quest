import { describe, expect, it } from 'vitest';
import { cloudEnabled, coinDelta, mergeServer, toServerJson } from '../cloud';
import { newProgress } from '../progress';

describe('ligação com o banco (desligada por padrão)', () => {
  it('fica desligada sem VITE_WIT2_DB', () => {
    expect(cloudEnabled()).toBe(false);
  });
  it('o JSON enviado não leva moedas, cartas, pó nem pacotes (a Torre vai no JSON)', () => {
    const j = toServerJson({ ...newProgress(), coins: 999 });
    for (const k of ['coins', 'collection', 'pacotes', 'po', 'semEpica', 'tickets']) expect(j).not.toHaveProperty(k);
    expect(j).toHaveProperty('fome');
    expect(j).toHaveProperty('towerMax');
  });
  it('moedas vão por diferença desde o último saldo conhecido', () => {
    expect(coinDelta(130, 100)).toBe(30);
    expect(coinDelta(70, 100)).toBe(-30);
  });
  it('ao juntar, o servidor manda nos valores e o JSON dele no resto', () => {
    const local = { ...newProgress(), coins: 50, fome: 20 };
    const m = mergeServer(local, {
      coins: 300, po: { rare: 2 }, semEpica: 3, collection: { x: 1 }, pacotes: { raro: 1 },
      data: { fome: 80, towerMax: 4, andar: 9 }, version: 2,
    });
    expect(m.coins).toBe(300);
    expect(m.fome).toBe(80);
    expect(m.pacotes).toEqual({ raro: 1 });
    expect(m.andar).toBe(4);   // nunca acima do andar liberado
  });
});
