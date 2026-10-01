import { describe, expect, it } from 'vitest';
import { buyAndOpen, PACKS, PITY, rarityRank, rollPack } from '../packs';
import { disenchant, DUST, forge } from '../forge';
import { emptySong, sanitizeSong, songScore } from '../music';
import { newProgress } from '../progress';
import { rng } from '../minigames';

describe('pacotinhos', () => {
  it('5 cartas; a destaque é no mínimo a raridade do pacote', () => {
    for (const pack of PACKS) {
      const r = rng(pack.price);
      for (let i = 0; i < 200; i++) {
        const res = rollPack(pack, r, 0);
        expect(res.cards).toHaveLength(5);
        expect(rarityRank(res.cards[4].rarity)).toBeGreaterThanOrEqual(rarityRank(pack.rarity));
      }
    }
  });
  it('garantia: no 10º pacote seguido sem Épica, vem Épica ou melhor', () => {
    const r = rng(7);
    for (let i = 0; i < 100; i++) {
      const res = rollPack(PACKS[0], r, PITY - 1);
      expect(Math.max(...res.cards.map(c => rarityRank(c.rarity)))).toBeGreaterThanOrEqual(rarityRank('epic'));
      expect(res.dry).toBe(0);
    }
  });
  it('comprar tira as moedas, põe na coleção e marca as novas', () => {
    const p = { ...newProgress(), coins: 1000, collection: {} };
    const r = buyAndOpen(p, 'comum', rng(3));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.progress.coins).toBe(700);
    expect(Object.values(r.progress.collection).reduce((a, b) => a + b, 0)).toBe(5);
    expect(r.fresh.size).toBeGreaterThan(0);
    expect(buyAndOpen({ ...p, coins: 10 }, 'comum', rng(1)).ok).toBe(false);
  });
});

describe('forja', () => {
  it('desmancha só a cópia extra e dá pó da raridade da carta', () => {
    const p = { ...newProgress(), collection: { 'golpe-conquistador': 3 } };
    const r = disenchant(p, 'golpe-conquistador', 5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.progress.collection['golpe-conquistador']).toBe(1);
    expect(r.progress.po.epic).toBe(DUST.epic.gives * 2);
    expect(disenchant(r.progress, 'golpe-conquistador').ok).toBe(false);
  });
  it('forjar gasta o pó da mesma raridade', () => {
    const p = { ...newProgress(), po: { epic: DUST.epic.costs! } };
    const r = forge(p, 'golpe-conquistador');
    expect(r.ok && r.progress.po.epic).toBe(0);
    expect(forge({ ...newProgress(), po: { rare: 9999 } }, 'golpe-conquistador').ok).toBe(false);
  });
});

describe('música', () => {
  it('música vazia vale 0; com melodia e batida vale mais', () => {
    const s = emptySong();
    expect(songScore(s)).toBe(0);
    s.notas = s.notas.map((_, i) => (i % 2 ? [] : [i % 8]));
    s.bateria = s.bateria.map((_, i) => (i % 4 === 0 ? [0] : i % 4 === 2 ? [1] : []));
    expect(songScore(s)).toBeGreaterThan(0.6);
  });
  it('dado estranho não entra', () => {
    expect(sanitizeSong({ id: 'a', nome: 'x', inst: 'tuba', bpm: 100, notas: [], bateria: [] })).toBeNull();
    expect(sanitizeSong({ id: 'a', nome: 'x', ...emptySong() })?.nome).toBe('x');
  });
});
