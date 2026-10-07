/**
 * Gera docs/sql/wit2-seed.sql: o catálogo das cartas (id e raridade), os
 * pacotinhos e as Recompensas da Sala, a partir do TypeScript (uma fonte só).
 *
 *   npx vite-node scripts/sql/wit2-seed.ts
 */
import { writeFileSync } from 'node:fs';
import { CATALOG } from '../../src/lib/tcg/cards/catalog';
import { PACKS } from '../../src/game/packs';
import { ROOM_REWARDS } from '../../src/game/room-rewards';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const lines = [
  '-- Gerado por scripts/sql/wit2-seed.ts (não editar à mão). Rodar depois de wit2-banco.sql.',
  'BEGIN;',
  'INSERT INTO public.wit2_card_catalog (id, rarity) VALUES',
  CATALOG.map(c => `  (${q(c.id)}, ${q(c.rarity)})`).join(',\n') + '\nON CONFLICT (id) DO UPDATE SET rarity = EXCLUDED.rarity;',
  'INSERT INTO public.wit2_pack_defs (id, price, rarity, base, highlight) VALUES',
  PACKS.map(p => `  (${q(p.id)}, ${p.price}, ${q(p.rarity)}, ${q(JSON.stringify(p.base))}::jsonb, ${q(JSON.stringify(p.highlight))}::jsonb)`).join(',\n')
    + '\nON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, rarity = EXCLUDED.rarity, base = EXCLUDED.base, highlight = EXCLUDED.highlight;',
  'INSERT INTO public.wit2_room_rewards (id, nome, preco) VALUES',
  ROOM_REWARDS.map(r => `  (${q(r.id)}, ${q(r.nome)}, ${r.preco})`).join(',\n') + '\nON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, preco = EXCLUDED.preco;',
  'COMMIT;',
];
writeFileSync('docs/sql/wit2-seed.sql', lines.join('\n') + '\n');
console.log(`docs/sql/wit2-seed.sql: ${CATALOG.length} cartas, ${PACKS.length} pacotes, ${ROOM_REWARDS.length} recompensas`);
