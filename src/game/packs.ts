// Pacotinhos (plano §4.2): 5 cartas, 4 do nível do pacote e 1 destaque que é
// no mínimo da raridade do nome, com chance pequena de vir acima. Garantia:
// 10 pacotes sem Épica ou melhor → o próximo destaque é Épica ou melhor.
// Tudo aqui é configuração (o painel do master vai mexer nisso depois).
// Funções puras; o sorteio recebe o gerador para os testes repetirem.
import type { CardDef, Rarity } from '@/lib/tcg/types';
import { CATALOG } from '@/lib/tcg/cards/catalog';
import type { Progress } from './progress';

export type PackId = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'mitico';

export interface PackDef {
  id: PackId;
  name: string;
  price: number;
  /** Raridade que dá nome ao pacote (cor e brilho). */
  rarity: Rarity;
  /** As 4 cartas de base: raridade de cada sorteio, com peso. */
  base: [Rarity, number][];
  /** A carta destaque: raridade com peso. */
  highlight: [Rarity, number][];
}

export const PACKS: PackDef[] = [
  { id: 'comum', name: 'Pacotinho Comum', price: 300, rarity: 'common',
    base: [['common', 80], ['uncommon', 20]],
    highlight: [['common', 60], ['uncommon', 25], ['rare', 12], ['epic', 2.5], ['legendary', 0.5]] },
  { id: 'incomum', name: 'Pacotinho Incomum', price: 700, rarity: 'uncommon',
    base: [['common', 60], ['uncommon', 40]],
    highlight: [['uncommon', 75], ['rare', 20], ['epic', 4], ['legendary', 1]] },
  { id: 'raro', name: 'Pacotinho Raro', price: 1500, rarity: 'rare',
    base: [['common', 50], ['uncommon', 50]],
    highlight: [['rare', 80], ['epic', 16], ['legendary', 3], ['mythic', 1]] },
  { id: 'epico', name: 'Pacotinho Épico', price: 4000, rarity: 'epic',
    base: [['uncommon', 60], ['rare', 40]],
    highlight: [['epic', 85], ['legendary', 12], ['mythic', 2.5], ['unknown', 0.5]] },
  { id: 'lendario', name: 'Pacotinho Lendário', price: 10000, rarity: 'legendary',
    base: [['rare', 60], ['epic', 40]],
    highlight: [['legendary', 90], ['mythic', 9], ['unknown', 1]] },
  { id: 'mitico', name: 'Pacotinho Mítico', price: 25000, rarity: 'mythic',
    base: [['epic', 60], ['legendary', 40]],
    highlight: [['mythic', 98], ['unknown', 2]] },
];
export const PACK_BY_ID = new Map(PACKS.map(p => [p.id, p]));

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'];
export const rarityRank = (r: Rarity) => RARITY_ORDER.indexOf(r);
/** Pacotes seguidos sem Épica ou melhor até a garantia. */
export const PITY = 10;

const BY_RARITY = new Map<Rarity, CardDef[]>(RARITY_ORDER.map(r => [r, CATALOG.filter(c => c.rarity === r)]));

function weighted<T>(list: [T, number][], r: number): T {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let x = r * total;
  for (const [v, w] of list) { if (x < w) return v; x -= w; }
  return list[list.length - 1][0];
}

export interface PackResult {
  cards: CardDef[];
  /** A garantia agiu neste pacote. */
  pity: boolean;
  /** Pacotes seguidos sem Épica ou melhor depois deste. */
  dry: number;
}

/** Sorteia as 5 cartas (a destaque é a última). `dry` = pacotes seguidos sem Épica ou melhor até agora. */
export function rollPack(pack: PackDef, rnd: () => number, dry = 0): PackResult {
  const pick = (r: Rarity) => { const pool = BY_RARITY.get(r)!; return pool[Math.floor(rnd() * pool.length) % pool.length]; };
  const cards: CardDef[] = [];
  for (let i = 0; i < 4; i++) cards.push(pick(weighted(pack.base, rnd())));
  let hl = weighted(pack.highlight, rnd());
  let pity = false;
  if (dry + 1 >= PITY && rarityRank(hl) < rarityRank('epic')) {
    // garantia: sorteia de novo só entre Épica ou melhor (mesmas proporções, com Épica no mínimo)
    const up = pack.highlight.filter(([r]) => rarityRank(r) >= rarityRank('epic'));
    hl = up.length ? weighted(up, rnd()) : 'epic';
    pity = true;
  }
  cards.push(pick(hl));
  const best = Math.max(...cards.map(c => rarityRank(c.rarity)));
  return { cards, pity, dry: best >= rarityRank('epic') ? 0 : dry + 1 };
}

/** Compra e abre na hora: tira as moedas, põe as cartas na coleção e conta a garantia. */
export function buyAndOpen(p: Progress, id: PackId, rnd: () => number): { ok: true; progress: Progress; result: PackResult; fresh: Set<string> } | { ok: false; reason: string } {
  const pack = PACK_BY_ID.get(id);
  if (!pack) return { ok: false, reason: 'Pacotinho não existe.' };
  if (p.coins < pack.price) return { ok: false, reason: `Faltam ${pack.price - p.coins} moedas.` };
  return openPack({ ...p, coins: p.coins - pack.price }, id, rnd);
}

/** Abre um pacote (comprado ou ganho): cartas na coleção, garantia contada. `fresh` = cartas que o aluno ainda não tinha. */
export function openPack(p: Progress, id: PackId, rnd: () => number): { ok: true; progress: Progress; result: PackResult; fresh: Set<string> } | { ok: false; reason: string } {
  const pack = PACK_BY_ID.get(id);
  if (!pack) return { ok: false, reason: 'Pacotinho não existe.' };
  const result = rollPack(pack, rnd, p.semEpica);
  const collection = { ...p.collection };
  const fresh = new Set<string>();
  for (const c of result.cards) {
    if (!collection[c.id]) fresh.add(c.id);
    collection[c.id] = (collection[c.id] ?? 0) + 1;
  }
  const stats = { ...p.stats, pacotes: (p.stats.pacotes ?? 0) + 1 };
  return { ok: true, progress: { ...p, collection, semEpica: result.dry, stats }, result, fresh };
}

/** Abre um pacote guardado (ganho do professor ou do legado do WIT 1). */
export function openSaved(p: Progress, id: PackId, rnd: () => number): ReturnType<typeof openPack> {
  if (!(p.pacotes[id] > 0)) return { ok: false, reason: 'Você não tem esse pacote guardado.' };
  const left = { ...p.pacotes, [id]: p.pacotes[id] - 1 };
  if (!left[id]) delete left[id];
  return openPack({ ...p, pacotes: left }, id, rnd);
}

/** Guarda pacotes fechados (o professor dá, a migração dá). */
export const givePacks = (p: Progress, id: PackId, n = 1): Progress => ({ ...p, pacotes: { ...p.pacotes, [id]: (p.pacotes[id] ?? 0) + n } });
