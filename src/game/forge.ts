// Forja (plano §4.3, com o ajuste do Matheus em 01/10): desmanchar uma carta
// repetida dá pó DA RARIDADE DELA (Comum vira pó comum, Rara vira pó raro...);
// forjar uma carta gasta pó da mesma raridade. Nada vira pó sozinho: só a
// cópia extra que o aluno escolhe desmanchar (a carta usada no deck fica).
import { hasTalent } from './grimoire';
import type { CardDef, Rarity } from '@/lib/tcg/types';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { EVOLVE_SUFFIX, isEvolved } from '@/lib/tcg/evolve';
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
  // talento do Grimório: +25% de pó
  const dust = Math.round(DUST[card.rarity].gives * k * (hasTalent(p, 'po-extra') ? 1.25 : 1));
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

// ─── evolução (versão "+", src/lib/tcg/evolve.ts) ──────────────────────────

/** Pó para evoluir: metade do custo de forjar a raridade (Desconhecida: o de dar pó). */
export const evolveCost = (r: Rarity) => Math.round((DUST[r].costs ?? DUST[r].gives * 2) / 2);
/** Cópias da carta que a evolução gasta (a 1ª fica no álbum: precisa ter 3). */
export const EVOLVE_COPIES = 2;

export function canEvolve(p: Progress, id: string): string | null {
  const c = CARD_BY_ID.get(id);
  if (!c || isEvolved(id)) return 'Essa carta não evolui.';
  if (!CARD_BY_ID.has(id + EVOLVE_SUFFIX)) return 'Essa carta não tem versão +.';
  if (spare(p, id) < EVOLVE_COPIES) return `Precisa de 3 cópias (tem ${p.collection[id] ?? 0}).`;
  if (dustOf(p, c.rarity) < evolveCost(c.rarity)) return `Faltam ${evolveCost(c.rarity) - dustOf(p, c.rarity)} de pó.`;
  return null;
}

/** 2 cópias repetidas + pó viram 1 versão "+". */
export function evolve(p: Progress, id: string): { ok: true; progress: Progress; card: CardDef } | { ok: false; reason: string } {
  const why = canEvolve(p, id);
  if (why) return { ok: false, reason: why };
  const c = CARD_BY_ID.get(id)!, plus = CARD_BY_ID.get(id + EVOLVE_SUFFIX)!;
  return {
    ok: true, card: plus,
    progress: {
      ...p,
      po: { ...p.po, [c.rarity]: dustOf(p, c.rarity) - evolveCost(c.rarity) },
      collection: { ...p.collection, [id]: p.collection[id] - EVOLVE_COPIES, [plus.id]: (p.collection[plus.id] ?? 0) + 1 },
    },
  };
}
