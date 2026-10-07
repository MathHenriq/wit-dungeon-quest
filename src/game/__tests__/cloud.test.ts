import { describe, expect, it } from 'vitest';
import { cloudEnabled, mergeServer, toServerJson } from '../cloud';
import { newProgress } from '../progress';

describe('ligação com o banco (desligada por padrão)', () => {
  it('fica desligada sem VITE_WIT2_DB', () => {
    expect(cloudEnabled()).toBe(false);
  });
  it('o JSON enviado não leva moedas, cartas, pacotes nem Torre', () => {
    const j = toServerJson({ ...newProgress(), coins: 999 });
    for (const k of ['coins', 'collection', 'pacotes', 'po', 'semEpica', 'towerMax', 'andar', 'wins', 'tickets']) expect(j).not.toHaveProperty(k);
    expect(j).toHaveProperty('fome');
  });
  it('ao juntar, o servidor manda nos valores e o JSON dele no resto', () => {
    const local = { ...newProgress(), coins: 50, fome: 20 };
    const m = mergeServer(local, {
      coins: 300, po: { rare: 2 }, semEpica: 3, collection: { x: 1 }, pacotes: { raro: 1 },
      tower: { towerMax: 4, andar: 9, wins: { a: 1 } }, data: { fome: 80 }, version: 2,
    });
    expect(m.coins).toBe(300);
    expect(m.fome).toBe(80);
    expect(m.pacotes).toEqual({ raro: 1 });
    expect(m.andar).toBe(4);   // nunca acima do andar liberado
  });
});
