/**
 * Gera supabase/migrations/20261008120100_wit2_seed.sql: o catálogo das cartas (id e raridade), os
 * pacotinhos e as Recompensas da Sala, a partir do TypeScript (uma fonte só).
 *
 *   npx vite-node scripts/sql/wit2-seed.ts
 */
import { writeFileSync } from 'node:fs';
import { CATALOG, EVOLVED } from '../../src/lib/tcg/cards/catalog';
import { PACKS } from '../../src/game/packs';
import { ROOM_REWARDS } from '../../src/game/room-rewards';
import { DUST } from '../../src/game/forge';
import { PRICE_BANDS } from '../../src/game/trades';
import { ALL_TRADED } from '../../src/game/market';
import { itemDef } from '../../src/game/items';
import { starterCollection } from '../../src/lib/tcg/opponents';
import { PATHS, pathDeck } from '../../src/lib/tcg/paths';
import { towerBoss } from '../../src/lib/tcg/bosses';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const lines = [
  '-- Gerado por scripts/sql/wit2-seed.ts (não editar à mão). Vem depois de _wit2_core.sql.',
  'BEGIN;',
  'INSERT INTO public.wit2_card_catalog (id, rarity, base) VALUES',
  // as 350 e as versões "+" (evolução); o pacotinho só sorteia as 350 (base = true)
  [...CATALOG.map(c => `  (${q(c.id)}, ${q(c.rarity)}, true)`), ...EVOLVED.map(c => `  (${q(c.id)}, ${q(c.rarity)}, false)`)].join(',\n') + '\nON CONFLICT (id) DO UPDATE SET rarity = EXCLUDED.rarity, base = EXCLUDED.base;',
  'INSERT INTO public.wit2_pack_defs (id, price, rarity, base, highlight) VALUES',
  PACKS.map(p => `  (${q(p.id)}, ${p.price}, ${q(p.rarity)}, ${q(JSON.stringify(p.base))}::jsonb, ${q(JSON.stringify(p.highlight))}::jsonb)`).join(',\n')
    + '\nON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, rarity = EXCLUDED.rarity, base = EXCLUDED.base, highlight = EXCLUDED.highlight;',
  'INSERT INTO public.wit2_room_rewards (id, nome, preco) VALUES',
  ROOM_REWARDS.map(r => `  (${q(r.id)}, ${q(r.nome)}, ${r.preco})`).join(',\n') + '\nON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, preco = EXCLUDED.preco;',
  // coleção inicial (dada uma vez, quando o aluno entra no WIT 2)
  'INSERT INTO public.wit2_starter (card_id, qty) VALUES',
  Object.entries(starterCollection()).map(([id, n]) => `  (${q(id)}, ${n})`).join(',\n') + '\nON CONFLICT (card_id) DO UPDATE SET qty = EXCLUDED.qty;',
  // deck de cada Caminho (escolhido uma vez)
  'INSERT INTO public.wit2_path_cards (path_id, card_id, qty) VALUES',
  PATHS.flatMap(pt => {
    const n = new Map<string, number>();
    for (const c of pathDeck(pt.id)) n.set(c.id, (n.get(c.id) ?? 0) + 1);
    return [...n].map(([id, k]) => `  (${q(pt.id)}, ${q(id)}, ${k})`);
  }).join(',\n') + '\nON CONFLICT (path_id, card_id) DO UPDATE SET qty = EXCLUDED.qty;',
  // deck do chefe de cada andar (a carta ganha tem de sair daqui)
  'INSERT INTO public.wit2_boss_cards (andar, card_id) VALUES',
  Array.from({ length: 100 }, (_, i) => i + 1).flatMap(a => [...new Set(towerBoss(a).deck.map(c => c.id))].map(id => `  (${a}, ${q(id)})`)).join(',\n') + '\nON CONFLICT DO NOTHING;',
  // regras da forja
  'INSERT INTO public.wit2_dust_rules (rarity, gives, costs) VALUES',
  Object.entries(DUST).map(([r, d]) => `  (${q(r)}, ${d.gives}, ${d.costs ?? 'NULL'})`).join(',\n') + '\nON CONFLICT (rarity) DO UPDATE SET gives = EXCLUDED.gives, costs = EXCLUDED.costs;',
  // faixa de preço da Vitrine (venda entre alunos)
  'INSERT INTO public.wit2_price_bands (rarity, lo, hi) VALUES',
  Object.entries(PRICE_BANDS).map(([r, [lo, hi]]) => `  (${q(r)}, ${lo}, ${hi})`).join(',\n') + '\nON CONFLICT (rarity) DO UPDATE SET lo = EXCLUDED.lo, hi = EXCLUDED.hi;',
  // itens que o Mercado compra (o Mercado da turma só aceita estes)
  'INSERT INTO public.wit2_market_items (item, price) VALUES',
  ALL_TRADED.map(id => `  (${q(id)}, ${itemDef(id)!.price})`).join(',\n') + '\nON CONFLICT (item) DO UPDATE SET price = EXCLUDED.price;',
  'COMMIT;',
];
writeFileSync('supabase/migrations/20261008120100_wit2_seed.sql', lines.join('\n') + '\n');
console.log(`supabase/migrations/20261008120100_wit2_seed.sql: ${CATALOG.length} cartas + ${EVOLVED.length} evoluídas, ${PACKS.length} pacotes, ${ROOM_REWARDS.length} recompensas`);
