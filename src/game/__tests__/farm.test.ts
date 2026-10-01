import { describe, expect, it } from 'vitest';
import { actionAt, applyAction, CAN_SIZE, MAX_CAN, catchUp, CROPS, DAY_MS, newFarm, nextDay, sanitizeFarm, sellPrice } from '../farm';

describe('fazenda', () => {
  it('toda planta dá lucro sobre a semente', () => {
    for (const c of CROPS) {
      const harvests = c.regrow ? 3 : 1;
      expect(c.sellPrice * harvests, c.id).toBeGreaterThan(c.seedPrice);
      expect(sellPrice(`colheita:${c.id}`)).toBe(c.sellPrice);
    }
  });

  it('arar → plantar → regar → crescer um dia por vez → colher', () => {
    let f = newFarm(0);
    expect(actionAt(f, 5, 5, 'cenoura', 3).kind).toBe('arar');
    f = applyAction(f, 5, 5, { kind: 'arar' }).farm;
    expect(actionAt(f, 5, 5, 'cenoura', 3)).toEqual({ kind: 'plantar', crop: 'cenoura' });
    f = applyAction(f, 5, 5, { kind: 'plantar', crop: 'cenoura' }).farm;
    expect(actionAt(f, 5, 5, 'cenoura', 3).kind).toBe('regar');
    for (let d = 0; d < 3; d++) {
      f = applyAction(f, 5, 5, { kind: 'regar' }).farm;
      expect(actionAt(f, 5, 5, 'cenoura', 3).kind).toBe('nada');   // já regado hoje
      f = nextDay(f, (d + 1) * DAY_MS).farm;
    }
    expect(f.water).toBe(CAN_SIZE - 3);
    expect(actionAt(f, 5, 5, null, 0)).toEqual({ kind: 'colher', crop: 'cenoura' });
    const r = applyAction(f, 5, 5, { kind: 'colher', crop: 'cenoura' });
    expect(r.harvested).toBe('cenoura');
    expect(r.farm.plots['5,5'].crop).toBeUndefined();
  });

  it('sem regar não cresce; morango e tomate dão de novo', () => {
    let f = applyAction(applyAction(newFarm(0), 1, 1, { kind: 'arar' }).farm, 1, 1, { kind: 'plantar', crop: 'morango' }).farm;
    f = nextDay(f, DAY_MS).farm;
    expect(f.plots['1,1'].stage).toBe(0);
    for (let d = 0; d < 4; d++) f = nextDay(applyAction(f, 1, 1, { kind: 'regar' }).farm, DAY_MS * (d + 2)).farm;
    const r = applyAction(f, 1, 1, { kind: 'colher', crop: 'morango' });
    expect(r.harvested).toBe('morango');
    expect(r.farm.plots['1,1'].crop).toBe('morango');
    expect(r.farm.plots['1,1'].stage).toBe(2);
  });

  it('a caixa de envio paga quando o dia vira; terra vazia volta a ser grama', () => {
    let f = newFarm(0);
    f = { ...f, bin: { 'colheita:milho': 2, ovo: 3 } };
    f = applyAction(f, 2, 2, { kind: 'arar' }).farm;
    const r = nextDay(f, DAY_MS);
    expect(r.paid).toBe(2 * 12 + 3 * 4);
    expect(r.farm.bin).toEqual({});
    f = nextDay(nextDay(r.farm, 2 * DAY_MS).farm, 3 * DAY_MS).farm;
    expect(f.plots['2,2']).toBeUndefined();
  });

  it('voltando depois de um tempo, vira no máximo um dia', () => {
    const f = newFarm(0);
    expect(catchUp(f, DAY_MS - 1)).toBeNull();
    expect(catchUp(f, DAY_MS * 10)!.farm.day).toBe(2);
  });

  it('dado salvo estranho vira um estado válido', () => {
    const f = sanitizeFarm({ plots: { '3,4': { crop: 'banana', stage: 99 }, 'x': {} }, bin: { lixo: 5, ovo: 2 }, water: 999 }, 1000);
    expect(f.plots['3,4'].crop).toBeUndefined();
    expect(f.plots.x).toBeUndefined();
    expect(f.bin).toEqual({ ovo: 2 });
    expect(f.water).toBe(MAX_CAN);
  });
});
