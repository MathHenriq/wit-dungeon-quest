import { describe, expect, it } from 'vitest';
import { biteDelay, boardOfDay, FISH, fishWeight, meterFor, meterHit, needleAt, rollFish } from '../fishing';
import { addCatch, newProgress, sellItems } from '../progress';

describe('pesca', () => {
  it('todo peixe tem nome, tamanho e preço coerentes; lixo não vale nada', () => {
    const ids = new Set<string>();
    for (const f of FISH) {
      expect(ids.has(f.id), f.id).toBe(false); ids.add(f.id);
      expect(f.cm[0]).toBeLessThanOrEqual(f.cm[1]);
      if (f.rarity === 'lixo') expect(f.price).toBe(0); else expect(f.price).toBeGreaterThan(0);
    }
  });

  it('o Peixe-Cristal só aparece à noite e os de água funda quase não vêm da margem', () => {
    const cristal = FISH.find(f => f.id === 'peixe-cristal')!;
    expect(fishWeight(cristal, { deep: true, night: false })).toBe(0);
    expect(fishWeight(cristal, { deep: true, night: true })).toBeGreaterThan(0);
    const dourado = FISH.find(f => f.id === 'dourado')!;
    expect(fishWeight(dourado, { deep: true, night: false, boat: true })).toBeGreaterThan(fishWeight(dourado, { deep: false, night: false }) * 10);
  });

  it('o sorteio respeita a raridade: comum muito mais que lendário', () => {
    const count: Record<string, number> = {};
    for (let i = 0; i < 20000; i++) {
      const { fish, cm } = rollFish({ deep: true, night: true, boat: true }, (i * 0.618034) % 1, (i * 0.414213) % 1);
      count[fish.rarity] = (count[fish.rarity] ?? 0) + 1;
      expect(cm).toBeGreaterThanOrEqual(fish.cm[0]);
      expect(cm).toBeLessThanOrEqual(fish.cm[1]);
    }
    expect(count.comum).toBeGreaterThan(count.raro * 3);
    expect(count.raro).toBeGreaterThan(count.lendario * 3);
    expect(count.lendario).toBeGreaterThan(0);
  });

  it('rende moedas perto de um duelo por hora (não mais que o dobro)', () => {
    // um peixe a cada ~13 s (espera + minijogo + aviso), acertando 70%
    let coins = 0;
    const N = 20000;
    for (let i = 0; i < N; i++) coins += rollFish({ deep: i % 3 === 0, night: i % 5 === 0, boat: i % 6 === 0 }, (i * 0.618034) % 1, 0.5).fish.price;
    const perHour = (coins / N) * (3600 / 13) * 0.7;
    expect(perHour).toBeGreaterThan(150);
    expect(perHour).toBeLessThan(1100);
  });

  it('minijogo: a agulha vai e volta; a faixa verde encolhe com a raridade', () => {
    const comum = meterFor(FISH.find(f => f.rarity === 'comum')!, 0.5);
    const lend = meterFor(FISH.find(f => f.rarity === 'lendario')!, 0.5);
    expect(lend.zone[1] - lend.zone[0]).toBeLessThan(comum.zone[1] - comum.zone[0]);
    expect(lend.period).toBeLessThan(comum.period);
    expect(needleAt(comum, 0)).toBe(0);
    expect(needleAt(comum, comum.period / 2)).toBeCloseTo(1);
    const mid = (comum.zone[0] + comum.zone[1]) / 2;
    expect(meterHit(comum, (mid * comum.period) / 2)).toBe(true);
    expect(meterHit(comum, 0)).toBe(false);
    expect(biteDelay(0, { deep: false, night: false })).toBeGreaterThan(2000);
  });

  it('o quadro do dia é igual para todos no mesmo dia e muda no outro', () => {
    expect(boardOfDay(20000)).toEqual(boardOfDay(20000));
    expect(JSON.stringify(boardOfDay(20000))).not.toEqual(JSON.stringify(boardOfDay(20001)));
  });

  it('guardar o peixe: álbum, recorde e venda na Casa de Pesca', () => {
    let p = newProgress();
    const a = addCatch(p, 'tilapia', 30);
    expect(a.first).toBe(true);
    p = a.progress;
    const b = addCatch(p, 'tilapia', 35);
    expect(b.first).toBe(false);
    expect(b.record).toBe(true);
    p = b.progress;
    expect(p.itens['peixe:tilapia']).toBe(2);
    expect(p.recordes.tilapia).toBe(35);
    const s = sellItems(p, ['peixe:tilapia'], () => 3);
    expect(s.coins).toBe(6);
    expect(s.progress.coins).toBe(p.coins + 6);
    expect(s.progress.itens['peixe:tilapia']).toBeUndefined();
  });
});
