// Trocas e Vitrine entre alunos (plano §11 e decisão do Matheus: troca e venda
// entre alunos continuam, é o destino das duplicatas). Regras que protegem quem
// é criança: só cartas REPETIDAS entram (a primeira fica no álbum dos dois
// lados), no máximo 5 cartas e 1000 moedas de cada lado, a tela mostra se a
// troca está justa pelo valor de pó, e a venda tem preço mínimo e máximo por
// raridade. O servidor (supabase/migrations/*_wit2_trades.sql) confere tudo de novo.
import type { Rarity } from '@/lib/tcg/types';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { DUST } from './forge';

export const TRADE_MAX_CARDS = 5;
export const TRADE_MAX_COINS = 1000;
export const LISTING_MAX = 5;

/** Faixa de preço na Vitrine (moedas), por raridade. */
export const PRICE_BANDS: Record<Rarity, [number, number]> = {
  common: [10, 60], uncommon: [20, 120], rare: [50, 300], epic: [150, 800],
  legendary: [400, 2000], mythic: [1000, 5000], unknown: [2500, 10000],
};

export type CardBag = Record<string, number>;

/** Cópias que dá para trocar ou vender: as que passam de 1. */
export const spareOf = (collection: CardBag, id: string) => Math.max(0, (collection[id] ?? 0) - 1);

export const bagSize = (b: CardBag) => Object.values(b).reduce((s, n) => s + Math.max(0, n), 0);

/** Valor de um lado da troca: pó que as cartas renderiam (+ moedas como estão). */
export function sideValue(cards: CardBag, coins: number): number {
  let v = coins;
  for (const [id, n] of Object.entries(cards)) {
    const c = CARD_BY_ID.get(id);
    if (c) v += DUST[c.rarity].gives * 4 * n;   // 1 de pó ~ 4 moedas (preço médio da Vitrine)
  }
  return v;
}

export type Fairness = 'justa' | 'voce-da-mais' | 'voce-ganha-mais';
/** Justa se um lado não passa de 1,5× o outro (e de 20 moedas de diferença). */
export function fairness(give: number, get: number): Fairness {
  if (Math.abs(give - get) <= 20 || (give <= get * 1.5 && get <= give * 1.5)) return 'justa';
  return give > get ? 'voce-da-mais' : 'voce-ganha-mais';
}

export function checkOffer(myCol: CardBag, give: CardBag, giveCoins: number, myCoins: number, theirSpare: CardBag, want: CardBag, wantCoins: number): string | null {
  if (!bagSize(give) && !giveCoins) return 'Escolha o que você dá.';
  if (!bagSize(want) && !wantCoins) return 'Escolha o que você quer.';
  if (bagSize(give) > TRADE_MAX_CARDS || bagSize(want) > TRADE_MAX_CARDS) return `No máximo ${TRADE_MAX_CARDS} cartas de cada lado.`;
  if (giveCoins > TRADE_MAX_COINS || wantCoins > TRADE_MAX_COINS) return `No máximo ${TRADE_MAX_COINS} moedas de cada lado.`;
  if (giveCoins > myCoins) return 'Você não tem essas moedas.';
  for (const [id, n] of Object.entries(give)) if (n > spareOf(myCol, id)) return 'Só cartas repetidas entram na troca.';
  for (const [id, n] of Object.entries(want)) if (n > (theirSpare[id] ?? 0)) return 'O colega não tem essa carta repetida.';
  return null;
}

export function priceOk(cardId: string, price: number): boolean {
  const c = CARD_BY_ID.get(cardId);
  if (!c || !Number.isInteger(price)) return false;
  const [lo, hi] = PRICE_BANDS[c.rarity];
  return price >= lo && price <= hi;
}

/** Preço sugerido: o meio da faixa. */
export function suggestedPrice(cardId: string): number {
  const c = CARD_BY_ID.get(cardId);
  if (!c) return 0;
  const [lo, hi] = PRICE_BANDS[c.rarity];
  return Math.round((lo + hi) / 2 / 5) * 5;
}
