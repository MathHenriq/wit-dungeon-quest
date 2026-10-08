import { describe, expect, it } from 'vitest';
import { checkOffer, fairness, PRICE_BANDS, priceOk, sideValue, spareOf, suggestedPrice } from '../trades';
import { CATALOG } from '@/lib/tcg/cards/catalog';

const common = CATALOG.find(c => c.rarity === 'common')!.id;
const epic = CATALOG.find(c => c.rarity === 'epic')!.id;

describe('trocas e Vitrine', () => {
  it('só a cópia extra é trocável', () => {
    expect(spareOf({ a: 3 }, 'a')).toBe(2);
    expect(spareOf({ a: 1 }, 'a')).toBe(0);
    expect(spareOf({}, 'a')).toBe(0);
  });
  it('confere a oferta como o servidor', () => {
    const col = { [common]: 3 };
    expect(checkOffer(col, { [common]: 2 }, 0, 0, { [epic]: 1 }, { [epic]: 1 }, 0)).toBeNull();
    expect(checkOffer(col, { [common]: 3 }, 0, 0, { [epic]: 1 }, { [epic]: 1 }, 0)).toMatch(/repetidas/);
    expect(checkOffer(col, {}, 0, 0, { [epic]: 1 }, { [epic]: 1 }, 0)).toMatch(/dá/);
    expect(checkOffer(col, { [common]: 1 }, 50, 10, { [epic]: 1 }, { [epic]: 1 }, 0)).toMatch(/moedas/);
    expect(checkOffer(col, { [common]: 1 }, 0, 0, {}, { [epic]: 1 }, 0)).toMatch(/colega/);
  });
  it('selo de troca justa: Comum por Épica não é justa', () => {
    expect(fairness(sideValue({ [common]: 1 }, 0), sideValue({ [epic]: 1 }, 0))).toBe('voce-ganha-mais');
    expect(fairness(sideValue({ [epic]: 1 }, 0), sideValue({ [epic]: 1 }, 0))).toBe('justa');
    expect(fairness(100, 10)).toBe('voce-da-mais');
  });
  it('preço da Vitrine dentro da faixa; sugestão no meio', () => {
    const [lo, hi] = PRICE_BANDS.common;
    expect(priceOk(common, lo)).toBe(true);
    expect(priceOk(common, hi + 1)).toBe(false);
    expect(priceOk(common, 10.5)).toBe(false);
    expect(suggestedPrice(common)).toBeGreaterThanOrEqual(lo);
    expect(suggestedPrice(common)).toBeLessThanOrEqual(hi);
  });
});
