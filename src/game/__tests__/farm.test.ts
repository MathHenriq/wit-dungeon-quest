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

describe('fazenda, 2ª onda: estações, chuva, adubo, qualidade e feira', () => {
  it('estações de 7 dias; toda estação tem pelo menos 3 plantas', async () => {
    const { seasonOf, SEASONS, CROPS } = await import('../farm');
    expect(seasonOf(1)).toBe('primavera');
    expect(seasonOf(8)).toBe('verao');
    expect(seasonOf(29)).toBe('primavera');
    for (const se of SEASONS) expect(CROPS.filter(c => c.seasons.includes(se)).length, se).toBeGreaterThanOrEqual(3);
  });
  it('fora de época não planta', async () => {
    const { actionAt, newFarm } = await import('../farm');
    const f = { ...newFarm(0), plots: { '1,1': { wet: false, stage: 0, idle: 0 } } };
    expect(actionAt(f, 1, 1, 'abobora', 3).kind).toBe('nada');      // dia 1 = primavera
    expect(actionAt(f, 1, 1, 'cenoura', 3).kind).toBe('plantar');
  });
  it('chove ~1 em 4 dias (verão menos) e a chuva rega', async () => {
    const { rainOn, nextDay, newFarm } = await import('../farm');
    const days = Array.from({ length: 280 }, (_, i) => i + 1);
    const share = days.filter(rainOn).length / days.length;
    expect(share).toBeGreaterThan(0.12);
    expect(share).toBeLessThan(0.32);
    const f = { ...newFarm(0), plots: { '1,1': { wet: false, crop: 'cenoura' as const, stage: 0, idle: 0 } } };
    expect(nextDay(f, 1, true).farm.plots['1,1'].stage).toBe(1);
  });
  it('regado todo dia = prata; e adubado = ouro (colhe 2); esqueceu um dia = normal', async () => {
    const { applyAction, nextDay, newFarm } = await import('../farm');
    let f = { ...newFarm(0), plots: { '1,1': { wet: false, stage: 0, idle: 0 } } };
    f = applyAction(f, 1, 1, { kind: 'plantar', crop: 'cenoura' }).farm;
    f = applyAction(f, 1, 1, { kind: 'adubar' }).farm;
    for (let d = 0; d < 3; d++) { f = applyAction(f, 1, 1, { kind: 'regar' }).farm; f = { ...nextDay(f, d).farm, water: 20 }; }
    const r = applyAction(f, 1, 1, { kind: 'colher', crop: 'cenoura' });
    expect(r.quality).toBe('ouro');
    expect(r.amount).toBe(2);
    let g = { ...newFarm(0), plots: { '1,1': { wet: false, stage: 0, idle: 0 } } };
    g = applyAction(g, 1, 1, { kind: 'plantar', crop: 'cenoura' }).farm;
    g = nextDay(g, 0).farm;   // esqueceu de regar
    for (let d = 0; d < 3; d++) { g = applyAction(g, 1, 1, { kind: 'regar' }).farm; g = { ...nextDay(g, d).farm, water: 20 }; }
    expect(applyAction(g, 1, 1, { kind: 'colher', crop: 'cenoura' }).quality).toBe('normal');
  });
  it('sábado é feira: a caixa paga 50% a mais', async () => {
    const { nextDay, newFarm } = await import('../farm');
    const normal = nextDay({ ...newFarm(0), day: 5, bin: { ovo: 10 } }, 1).paid;
    const feira = nextDay({ ...newFarm(0), day: 6, bin: { ovo: 10 } }, 1).paid;
    expect(feira).toBe(Math.round(normal * 1.5));
  });
});
