// Mercado Central: preço por oferta e procura (plano §3.6). Cada item tem um
// preço base (items.ts); a procura do dia mexe nele (igual para todos no mesmo
// dia) e o quanto o próprio aluno vendeu recentemente derruba o preço (o
// mercado "enche"). O comerciante ganha bônus. Quando houver multijogador, a
// venda de todos os alunos entra no lugar da do aluno.
import type { Progress } from './progress';
import { addItem } from './progress';
import { ITEMS, itemDef } from './items';
import { bump, today } from './life';
import { perkLevel } from './professions';

/** Procura do dia para o item: entre 0,7 e 1,4 (sai da data). */
export function demand(item: string, day: number): number {
  let h = 2166136261;
  for (const c of `${item}|${day}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const r = ((h >>> 0) % 10000) / 10000;
  // um pouco de "memória": metade do dia anterior entra na conta (preço não pula tanto)
  let h2 = 2166136261;
  for (const c of `${item}|${day - 1}`) h2 = Math.imul(h2 ^ c.charCodeAt(0), 16777619);
  const r2 = ((h2 >>> 0) % 10000) / 10000;
  return 0.7 + 0.7 * (r * 0.65 + r2 * 0.35);
}

/** Quanto o mercado está cheio do item: cada venda soma 1; esquece 30% por dia. */
export function saturation(p: Progress, item: string, day: number): number {
  const s = p.mercado.sat[item] ?? 0;
  return s * Math.pow(0.7, Math.max(0, day - p.mercado.day));
}

/** Preço de venda agora (moedas por unidade). */
export function marketPrice(p: Progress, item: string, day = today()): number {
  const base = itemDef(item)?.price ?? 0;
  if (base <= 0) return 0;
  const satF = 1 / (1 + saturation(p, item, day) / 25);
  const art = item === 'quadro' && p.profissao === 'artista' ? 1.2 : 1;
  const bonus = (1 + perkLevel(p.profissao, 'comerciante', p.xp.comerciante ?? 0) * 0.2) * art;
  return Math.max(1, Math.round(base * demand(item, day) * satF * bonus));
}

/** Preço de compra (o Mercado vende comida e coisas da fazenda com margem). */
export function buyPrice(item: string, day = today()): number {
  const base = itemDef(item)?.price ?? 0;
  return Math.max(1, Math.round(base * demand(item, day) * 1.35));
}

/** O que o Mercado vende. */
export const MARKET_SELLS = ['pao', 'leite', 'ovo', 'fruta:maca', 'fruta:laranja', 'suco'];

export type Trend = 'sobe' | 'desce' | 'igual';
export function trend(item: string, day = today()): Trend {
  const a = demand(item, day), b = demand(item, day - 1);
  return a > b * 1.05 ? 'sobe' : a < b * 0.95 ? 'desce' : 'igual';
}

/** Vende `n` unidades no Mercado: cada unidade vendida enche um pouco o mercado (o preço cai aos poucos). */
export function sell(p: Progress, item: string, n: number, day = today()): { progress: Progress; coins: number } {
  const have = Math.min(n, p.itens[item] ?? 0);
  let next: Progress = { ...p, mercado: { day, sat: Object.fromEntries(Object.keys(p.mercado.sat).map(k => [k, saturation(p, k, day)])) } };
  let coins = 0;
  for (let k = 0; k < have; k++) {
    coins += marketPrice(next, item, day);
    next = { ...next, mercado: { day, sat: { ...next.mercado.sat, [item]: (next.mercado.sat[item] ?? 0) + 1 } } };
  }
  next = addItem({ ...next, coins: next.coins + coins }, item, -have);
  return { progress: bump(next, 'vendas', have), coins };
}

export function buy(p: Progress, item: string, day = today()): { ok: true; progress: Progress } | { ok: false; reason: string } {
  const price = buyPrice(item, day);
  if (p.coins < price) return { ok: false, reason: `Faltam ${price - p.coins} moedas.` };
  return { ok: true, progress: addItem({ ...p, coins: p.coins - price }, item, 1) };
}

/** Itens que o Mercado compra (todos com preço). */
export const sellable = (p: Progress) => Object.keys(p.itens).filter(k => (itemDef(k)?.price ?? 0) > 0 && p.itens[k] > 0);

export const ALL_TRADED = ITEMS.filter(i => i.price > 0).map(i => i.id);
