// Forja (plano §4.3, com o ajuste do Matheus em 01/10): desmanchar uma carta
// repetida dá pó DA RARIDADE DELA (Comum vira pó comum, Rara vira pó raro...);
// forjar uma carta gasta pó da mesma raridade. Nada vira pó sozinho: só a
// cópia extra que o aluno escolhe desmanchar (a carta usada no deck fica).
import type { CardDef, Rarity } from '@/lib/tcg/types';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import type { Progress } from './progress';

/** Pó que uma duplicata rende e quanto custa criar, por raridade. */
export const DUST: Record<Rarity, { gives: number; costs: number | null }> = {
  common: { gives: 5, costs: 40 },
  uncommon: { gives: 10, costs: 80 },
  rare: { gives: 25, costs: 200 },
  epic: { gives: 60, costs: 500 },
  legendary: { gives: 150, costs: 1200 },
  mythic: { gives: 400, costs: 3200 },
  unknown: { gives: 1000, costs: null },   // Desconhecida não se forja
};

export const dustOf = (p: Progress, r: Rarity) => p.po[r] ?? 0;

/** Quantas cópias dá para desmanchar: as que passam de 1 (a carta fica no álbum). */
export const spare = (p: Progress, id: string) => Math.max(0, (p.collection[id] ?? 0) - 1);

export function disenchant(p: Progress, id: string, n = 1): { ok: true; progress: Progress; dust: number; rarity: Rarity } | { ok: false; reason: string } {
  const card = CARD_BY_ID.get(id);
  if (!card) return { ok: false, reason: 'Carta não existe.' };
  const k = Math.min(n, spare(p, id));
  if (k <= 0) return { ok: false, reason: 'Só dá para desmanchar cartas repetidas (a primeira fica no álbum).' };
  const dust = DUST[card.rarity].gives * k;
  return {
    ok: true, dust, rarity: card.rarity,
    progress: { ...p, collection: { ...p.collection, [id]: p.collection[id] - k }, po: { ...p.po, [card.rarity]: dustOf(p, card.rarity) + dust } },
  };
}

export function forge(p: Progress, id: string): { ok: true; progress: Progress; card: CardDef } | { ok: false; reason: string } {
  const card = CARD_BY_ID.get(id);
  if (!card) return { ok: false, reason: 'Carta não existe.' };
  const cost = DUST[card.rarity].costs;
  if (cost === null) return { ok: false, reason: 'Cartas Desconhecidas não podem ser forjadas.' };
  const have = dustOf(p, card.rarity);
  if (have < cost) return { ok: false, reason: `Faltam ${cost - have} de pó.` };
  return {
    ok: true, card,
    progress: { ...p, po: { ...p.po, [card.rarity]: have - cost }, collection: { ...p.collection, [id]: (p.collection[id] ?? 0) + 1 } },
  };
}
