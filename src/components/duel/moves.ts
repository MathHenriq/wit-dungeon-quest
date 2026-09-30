// Para onde cada carta foi entre dois estados do duelo: é o que a tela anima
// (descarte voando da mão para o cemitério, cartas do deck virando e caindo no
// cemitério, carta banida se desfazendo, compra voando do deck para a mão...).
// Puro: compara os dois estados, carta a carta, pelo uid.
import type { CardDef, GameState } from '@/lib/tcg/types';

export type Zone = 'hand' | 'deck' | 'grave' | 'banish' | 'weapon' | 'armor' | 'trap0' | 'trap1' | 'trap2' | 'field' | 'center';

export interface Move {
  side: 0 | 1;
  uid: string;
  card: CardDef;
  from: Zone;
  to: Zone;
}

function zoneOf(s: GameState, side: 0 | 1, uid: string): { zone: Zone; card: CardDef } | null {
  const p = s.players[side];
  const find = (list: { uid: string; def: CardDef }[], zone: Zone) => {
    const c = list.find(x => x.uid === uid);
    return c ? { zone, card: c.def } : null;
  };
  return find(p.hand, 'hand') ?? find(p.deck, 'deck') ?? find(p.graveyard, 'grave') ?? find(p.banished, 'banish')
    ?? (p.weapon?.uid === uid ? { zone: 'weapon' as Zone, card: p.weapon.def } : null)
    ?? (p.armor?.uid === uid ? { zone: 'armor' as Zone, card: p.armor.def } : null)
    ?? p.traps.map((t, i) => (t.uid === uid ? { zone: `trap${i}` as Zone, card: t.def } : null)).find(Boolean)
    ?? (s.field?.owner === side && s.field.card.uid === uid ? { zone: 'field' as Zone, card: s.field.card.def } : null);
}

const uidsOf = (s: GameState, side: 0 | 1): string[] => {
  const p = s.players[side];
  return [...p.hand, ...p.deck, ...p.graveyard, ...p.banished, ...(p.weapon ? [p.weapon] : []), ...(p.armor ? [p.armor] : []), ...p.traps,
    ...(s.field?.owner === side ? [s.field.card] : [])].map(c => c.uid);
};

/**
 * As cartas que mudaram de lugar. A carta jogada (`played`) sai do centro da
 * mesa (onde a tela a mostra), não da mão. Armadilha que só trocou de vaga
 * (a da frente saiu) não conta como movimento.
 */
export function diffMoves(prev: GameState, next: GameState, played?: string): Move[] {
  const out: Move[] = [];
  for (const side of [0, 1] as const) {
    const seen = new Set([...uidsOf(prev, side), ...uidsOf(next, side)]);
    for (const uid of seen) {
      const a = zoneOf(prev, side, uid), b = zoneOf(next, side, uid);
      if (!a || !b || a.zone === b.zone) continue;
      if (a.zone.startsWith('trap') && b.zone.startsWith('trap')) continue;
      out.push({ side, uid, card: b.card, from: uid === played && a.zone === 'hand' ? 'center' : a.zone, to: b.zone });
    }
  }
  return out;
}
