import { describe, expect, it } from 'vitest';
import { addItem, newProgress, sanitizeProgress } from '../progress';
import { applyReward, bump, canCook, chooseProfession, cook, eat, gainXp, playsLeft, RECIPES, spendEnergy, spendPlay } from '../life';
import { levelOf, PROFESSIONS, profTitle } from '../professions';
import { buy, buyPrice, demand, marketPrice, sell } from '../market';
import { claimMission, missionProgress, missionsOf, syncMissions } from '../missions';
import { ITEMS, itemDef } from '../items';

describe('profissões', () => {
  it('nível sobe com a experiência; título mostra o nível', () => {
    expect(levelOf(0).level).toBe(1);
    expect(levelOf(40).level).toBe(2);
    expect(levelOf(10_000).level).toBe(6);
    expect(profTitle('pescador', 130)).toBe('Pescador · Profissional');
  });
  it('escolher cargo e ganhar experiência; subir de nível avisa', () => {
    let p = chooseProfession(newProgress(), 'padeiro');
    expect(p.profissao).toBe('padeiro');
    const r = gainXp(p, 'padeiro', 45);
    expect(r.levelUp).toBe(2);
    p = r.progress;
    expect(gainXp(p, 'padeiro', 1).levelUp).toBeUndefined();
  });
  it('toda profissão com minijogo tem um só minijogo', () => {
    const games = PROFESSIONS.filter(p => p.minigame).map(p => p.minigame);
    expect(new Set(games).size).toBe(games.length);
  });
});

describe('fome e comida', () => {
  it('andar esvazia a barriga; correndo, o dobro; não passa de zero', () => {
    const p = newProgress();
    expect(spendEnergy(p, 60, false).fome).toBeCloseTo(100 - 60 * (100 / 1500));
    expect(100 - spendEnergy(p, 60, true).fome).toBeCloseTo(2 * (100 - spendEnergy(p, 60, false).fome));
    expect(spendEnergy(p, 1e6, true).fome).toBe(0);
  });
  it('comer: tira da mochila, enche a barriga até 100', () => {
    let p = addItem({ ...newProgress(), fome: 90 }, 'pao', 2);
    const r = eat(p, 'pao');
    expect(r.ok).toBe(true);
    if (r.ok) { p = r.progress; expect(p.fome).toBe(100); expect(p.itens.pao).toBe(1); expect(r.gain).toBe(10); }
    expect(eat(p, 'pao').ok).toBe(false);          // cheio
    expect(eat({ ...p, fome: 10 }, 'la').ok).toBe(false);  // não é comida
  });
  it('receitas: usa os ingredientes (curinga pega o peixe mais barato)', () => {
    const r0 = RECIPES.find(r => r.id === 'peixe-assado')!;
    let p = addItem(addItem(newProgress(), 'peixe:dourado', 1), 'peixe:lambari', 1);
    expect(canCook(p, r0)).toBe(true);
    const c = cook(p, r0);
    expect(c.ok).toBe(true);
    if (c.ok) { p = c.progress; expect(p.itens['peixe:lambari']).toBeUndefined(); expect(p.itens['peixe:dourado']).toBe(1); expect(p.itens['peixe-assado']).toBe(1); }
    expect(cook(newProgress(), RECIPES.find(r => r.id === 'salada')!).ok).toBe(false);
  });
  it('toda receita dá algo que vale mais que os ingredientes e enche mais', () => {
    for (const r of RECIPES) {
      const out = itemDef(r.out)!;
      const cost = Object.entries(r.needs).reduce((s, [k, n]) => s + (k.endsWith('*') ? 3 : itemDef(k)!.price) * n, 0);
      expect(out.price, r.id).toBeGreaterThanOrEqual(cost);
      expect(out.food ?? 0, r.id).toBeGreaterThan(0);
    }
  });
});

describe('minijogos por dia', () => {
  it('cada minijogo rende até 5 vezes por dia; no outro dia volta', () => {
    let p = newProgress();
    for (let k = 0; k < 5; k++) p = spendPlay(p, 'forno', 100);
    expect(playsLeft(p, 'forno', 100)).toBe(0);
    expect(playsLeft(p, 'ritmo', 100)).toBe(5);
    expect(playsLeft(p, 'forno', 101)).toBe(5);
  });
  it('a recompensa vai para a mochila, moedas e experiência', () => {
    const r = applyReward(newProgress(), 'musico', { items: { disco: 1 }, coins: 5, xp: 20 });
    expect(r.progress.itens.disco).toBe(1);
    expect(r.progress.coins).toBe(5);
    expect(r.progress.xp.musico).toBe(20);
    expect(r.progress.stats.minijogos).toBe(1);
  });
});

describe('mercado', () => {
  it('procura do dia entre 0,7 e 1,4 e igual para todos no mesmo dia', () => {
    for (let d = 0; d < 50; d++) {
      const x = demand('colheita:milho', d);
      expect(x).toBeGreaterThanOrEqual(0.7); expect(x).toBeLessThanOrEqual(1.4);
      expect(demand('colheita:milho', d)).toBe(x);
    }
  });
  it('vender muito do mesmo item baixa o preço; o mercado esquece com os dias', () => {
    let p = addItem(newProgress(), 'colheita:abobora', 40);
    const p0 = marketPrice(p, 'colheita:abobora', 10);
    const r = sell(p, 'colheita:abobora', 30, 10);
    p = r.progress;
    expect(marketPrice(p, 'colheita:abobora', 10)).toBeLessThan(p0);
    expect(marketPrice(p, 'colheita:abobora', 20)).toBeGreaterThan(marketPrice(p, 'colheita:abobora', 10) * (demand('colheita:abobora', 20) / demand('colheita:abobora', 10)));
    expect(r.coins).toBeGreaterThan(0);
    expect(p.itens['colheita:abobora']).toBe(10);
  });
  it('comerciante vende mais caro; comprar custa mais que vender', () => {
    const p = addItem(newProgress(), 'pao', 5);
    const c = { ...chooseProfession(p, 'comerciante'), xp: { comerciante: 500 } };
    expect(marketPrice(c, 'pao', 3)).toBeGreaterThanOrEqual(marketPrice(p, 'pao', 3));
    expect(buyPrice('pao', 3)).toBeGreaterThan(marketPrice(p, 'pao', 3));
    expect(buy({ ...p, coins: 0 }, 'pao', 3).ok).toBe(false);
  });
  it('todo item vendável tem nome e ícone', () => {
    for (const i of ITEMS) { expect(i.name.length).toBeGreaterThan(1); expect(i.icon.length).toBeGreaterThan(0); }
  });
});

describe('missões do dia', () => {
  it('três missões de contadores diferentes; contam a partir do começo do dia', () => {
    for (let d = 0; d < 30; d++) {
      const ms = missionsOf(d);
      expect(ms).toHaveLength(3);
      expect(new Set(ms.map(m => m.stat)).size).toBe(3);
    }
    const day = 40, m = missionsOf(day)[0];
    let p = syncMissions(bump(newProgress(), m.stat, 100), day);
    expect(missionProgress(p, m)).toBe(0);
    expect(claimMission(p, m.id, day).ok).toBe(false);
    p = bump(p, m.stat, m.target);
    const r = claimMission(p, m.id, day);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.coins).toBe(m.reward); expect(claimMission(r.progress, m.id, day).ok).toBe(false); }
  });
  it('progresso salvo estranho continua válido', () => {
    const p = sanitizeProgress({ profissao: 'astronauta', fome: 900, xp: { padeiro: 30 }, missoes: { day: 'x' } });
    expect(p.profissao).toBeUndefined();
    expect(p.fome).toBe(100);
    expect(p.xp.padeiro).toBe(30);
    expect(p.missoes.day).toBe(0);
  });
});

describe('bônus das profissões no mapa', () => {
  it('irrigador rega canteiros plantados quando o dia vira', async () => {
    const { newFarm, nextDay } = await import('../farm');
    const f = { ...newFarm(0), irrig: 1, plots: { '1,1': { wet: false, crop: 'cenoura' as const, stage: 0, idle: 0 }, '2,1': { wet: false, stage: 0, idle: 0 } } };
    const r = nextDay(f, 1);
    expect(r.farm.plots['1,1'].wet).toBe(true);
    expect(r.farm.plots['2,1'].wet).toBe(false);
  });
  it('3 sensores viram um irrigador; regador maior para o fazendeiro', async () => {
    const { craftIrrigator, canSize } = await import('../life');
    const { newProgress, addItem } = await import('../progress');
    const r = craftIrrigator(addItem(newProgress(), 'sensor', 4));
    expect(r.ok && r.progress.itens).toEqual({ sensor: 1, irrigador: 1 });
    expect(canSize({ ...newProgress(), profissao: 'fazendeiro', xp: { fazendeiro: 130 } })).toBe(35);
  });
  it('vitória na Torre conta para as missões', async () => {
    const { applyDuel, newProgress } = await import('../progress');
    const { tableFoe } = await import('../../lib/tcg/opponents');
    const r = applyDuel(newProgress(), tableFoe(1, 0, 'mesa-1', 'Teste'), true, 0);
    expect(r.progress.stats.mesas).toBe(1);
  });
});

describe('salvar e carregar', () => {
  it('prazo da entrega e fome quebrada sobrevivem ao salvar', async () => {
    const { sanitizeProgress, newProgress } = await import('../progress');
    const ate = Date.now() + 60_000;
    const p = sanitizeProgress(JSON.parse(JSON.stringify({ ...newProgress(), fome: 93.67, entrega: { zona: 'cidade', porta: 'x', nome: 'X', ate } })));
    expect(p.entrega!.ate).toBe(ate);
    expect(p.fome).toBeCloseTo(93.67);
  });
});
