/**
 * Virada WIT 1 → WIT 2: gera, a partir do TypeScript (uma fonte só),
 *   supabase/migrations/20261008120900_wit2_virada_seed.sql  (item da loja → carta, classe → Caminho)
 *   scripts/sql/teste-wit2-7-virada.sql                      (alunos de mentira + o que src/game/migration.ts daria)
 * O teste confere que a função do servidor (wit2_migrate_one) chega no mesmo resultado que `migrateStudent`.
 *
 *   npx vite-node scripts/sql/wit2-virada.ts
 */
import { writeFileSync } from 'node:fs';
import { CARD_ID_BY_SHOP_NAME } from '../../src/lib/tcg/cards/catalog';
import { PATHS } from '../../src/lib/tcg/paths';
import { starterCollection } from '../../src/lib/tcg/opponents';
import { migrateStudent, type Wit1Student } from '../../src/game/migration';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

// ── seed ──
const seed = [
  '-- Gerado por scripts/sql/wit2-virada.ts (não editar à mão). Vem depois de _wit2_virada.sql.',
  'BEGIN;',
  'INSERT INTO public.wit2_shop_map (shop_name, card_id) VALUES',
  [...CARD_ID_BY_SHOP_NAME].map(([n, id]) => `  (${q(n)}, ${q(id)})`).join(',\n') + '\nON CONFLICT (shop_name) DO UPDATE SET card_id = EXCLUDED.card_id;',
  'INSERT INTO public.wit2_class_path (ord, word, path_id) VALUES',
  PATHS.flatMap((p, i) => p.fromClass.map(w => `  (${i}, ${q(w)}, ${q(p.id)})`)).join(',\n') + '\nON CONFLICT (word) DO UPDATE SET ord = EXCLUDED.ord, path_id = EXCLUDED.path_id;',
  'COMMIT;',
];
writeFileSync('supabase/migrations/20261008120900_wit2_virada_seed.sql', seed.join('\n') + '\n');

// ── teste ──
const names = [...CARD_ID_BY_SHOP_NAME.keys()];
const fx: (Wit1Student & { uuid: string; name: string })[] = [
  { uuid: 'dddddddd-0000-0000-0000-000000000001', name: 'Veterana', id: 'a', level: 32, xp: 9000, coins: 300, diamonds: 10, characterClass: 'Maga Arcana',
    shopItems: [names[0], names[5], names[40], 'Espada que sumiu'], materials: [{ rarity: 'rare', quantity: 4 }, { rarity: 'common', quantity: 3 }], consumables: 2,
    attributePoints: 25, skillPoints: 12, titles: ['helper_of_week', 'presence_guardian'] },
  { uuid: 'dddddddd-0000-0000-0000-000000000002', name: 'Teste', id: 'b', isTest: true, level: 50, xp: 1, coins: 9999, diamonds: 0, shopItems: [], materials: [], consumables: 0, attributePoints: 0, skillPoints: 0, titles: [] },
  { uuid: 'dddddddd-0000-0000-0000-000000000003', name: 'Novato', id: 'c', level: 3, xp: 40, coins: 50, diamonds: 0, characterClass: null, shopItems: [], materials: [], consumables: 0, attributePoints: 0, skillPoints: 0, titles: [] },
  { uuid: 'dddddddd-0000-0000-0000-000000000004', name: 'Paladino', id: 'd', level: 15, xp: 2000, coins: 0, diamonds: 2.6, characterClass: 'Paladíno', shopItems: [names[7]], materials: [{ rarity: 'epic', quantity: 1 }], consumables: 0, attributePoints: 99, skillPoints: 99, titles: [] },
];
const sql: string[] = [
  '-- Gerado por scripts/sql/wit2-virada.ts (não editar à mão): a virada no servidor dá o mesmo que src/game/migration.ts.',
  '\\set ON_ERROR_STOP on',
  'SELECT set_config(\'test.uid\', \'\', false);',
];
const mats = new Map<string, string>();
for (const s of fx) {
  sql.push(`INSERT INTO students (id, name, coins, level, xp, diamonds, character_class, is_test_account) VALUES (${q(s.uuid)}, ${q(s.name)}, ${s.coins}, ${s.level}, ${s.xp}, ${s.diamonds}, ${s.characterClass ? q(s.characterClass) : 'NULL'}, ${!!s.isTest});`);
  for (const n of s.shopItems) {
    sql.push(`INSERT INTO shop_items (name) SELECT ${q(n)} WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = ${q(n)});`);
    sql.push(`INSERT INTO student_inventory (student_id, item_id) SELECT ${q(s.uuid)}, id FROM shop_items WHERE name = ${q(n)};`);
  }
  for (const m of s.materials) {
    if (!mats.has(m.rarity)) { mats.set(m.rarity, m.rarity); sql.push(`INSERT INTO materials (name, rarity) VALUES (${q('mat-' + m.rarity)}, ${q(m.rarity)});`); }
    sql.push(`INSERT INTO student_inventory_materials (student_id, material_id, quantity) SELECT ${q(s.uuid)}, id, ${m.quantity} FROM materials WHERE rarity = ${q(m.rarity)};`);
  }
  if (s.consumables) sql.push(`INSERT INTO student_consumables (student_id, consumable_id, quantity) VALUES (${q(s.uuid)}, gen_random_uuid(), ${s.consumables});`);
  if (s.attributePoints) sql.push(`INSERT INTO student_attribute_points (student_id, forca, inteligencia) VALUES (${q(s.uuid)}, ${Math.ceil(s.attributePoints / 2)}, ${Math.floor(s.attributePoints / 2)});`);
  if (s.skillPoints) sql.push(`INSERT INTO student_skill_points (student_id, total_earned) VALUES (${q(s.uuid)}, ${s.skillPoints});`);
  for (const t of s.titles) sql.push(`INSERT INTO student_titles (student_id, title_type) VALUES (${q(s.uuid)}, ${q(t)});`);
}
sql.push(
  "SELECT set_config('test.email', 'ninguem@exemplo.com', false);",
  `DO $$ BEGIN PERFORM wit2_migrate_student('dddddddd-0000-0000-0000-000000000001'); RAISE EXCEPTION 'devia recusar'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;`,
  "SELECT set_config('test.email', 'master@exemplo.com', false);",
  "INSERT INTO wit2_masters VALUES ('master@exemplo.com') ON CONFLICT DO NOTHING;",
  `SELECT (wit2_migrate_status()->>'migrados')::int = 0 AND (wit2_migrate_status()->>'teste')::int >= 1 AS "status antes da virada";`,
);
const sortArr = (e: string) => `(SELECT coalesce(jsonb_agg(v ORDER BY v), '[]'::jsonb) FROM jsonb_array_elements_text(${e}) v)`;
const first = fx[0];
const exp = migrateStudent(first);
if ('skipped' in exp) throw new Error('fixture');
const r = exp.report;
sql.push(
  `CREATE TEMP TABLE rep AS SELECT wit2_migrate_student(${q(first.uuid)}) AS j;`,
  `SELECT (j->>'cards')::int = ${r.cards} AND (j->>'coins')::int = ${r.coins} AND (j->>'talentPoints')::int = ${r.talentPoints} AND j->>'path' = ${q(r.path)} FROM rep;`,
  `SELECT j->'packs' = ${q(JSON.stringify(r.packs))}::jsonb AND j->'dust' = ${q(JSON.stringify(r.dust))}::jsonb FROM rep;`,
  `SELECT ${sortArr("j->'titles'")} = ${q(JSON.stringify([...r.titles].sort()))}::jsonb AND ${sortArr("j->'unknownItems'")} = ${q(JSON.stringify([...r.unknownItems].sort()))}::jsonb FROM rep;`,
  // a coleção no servidor = a do TS (coleção inicial + as cartas da loja)
  ...Object.entries(exp.progress.collection).filter(([id]) => !(id in starterCollection()) || exp.progress.collection[id] !== starterCollection()[id])
    .map(([id, n]) => `SELECT (SELECT qty FROM wit2_cards WHERE student_id = ${q(first.uuid)} AND card_id = ${q(id)}) = ${n} AS ${q('carta ' + id).replace(/'/g, '"')};`),
  `SELECT (SELECT coins FROM wit2_wallet WHERE student_id = ${q(first.uuid)}) = ${exp.progress.coins} AS "moedas na carteira";`,
  ...Object.entries(exp.report.packs).map(([id, n]) => `SELECT (SELECT qty FROM wit2_packs WHERE student_id = ${q(first.uuid)} AND pack_id = ${q(id)}) = ${n} AS "pacote ${id}";`),
  `SELECT (SELECT data->'legado'->>'nivel' FROM wit2_progress WHERE student_id = ${q(first.uuid)})::int = ${first.level} AND (SELECT data->>'caminhoSugerido' FROM wit2_progress WHERE student_id = ${q(first.uuid)}) = ${q(r.path)} AS "legado no progresso";`,
  // idempotente
  `SELECT (wit2_migrate_student(${q(first.uuid)})->>'ja')::boolean AS "rodar de novo não dá de novo";`,
  `SELECT (SELECT coins FROM wit2_wallet WHERE student_id = ${q(first.uuid)}) = ${exp.progress.coins} AS "moedas não dobraram";`,
  // todos de uma vez: pula a conta de teste
  `SELECT (wit2_migrate_all()->>'migrados')::int >= 2 AS "migra os que faltam";`,
  `SELECT NOT EXISTS (SELECT 1 FROM wit2_legacy WHERE student_id = ${q(fx[1].uuid)}) AS "conta de teste fica de fora";`,
);
for (const s of [fx[2], fx[3]]) {
  const e = migrateStudent(s);
  if ('skipped' in e) continue;
  sql.push(`SELECT (report->>'coins')::int = ${e.report.coins} AND (report->>'talentPoints')::int = ${e.report.talentPoints} AND report->>'path' = ${q(e.report.path)} AND report->'packs' = ${q(JSON.stringify(e.report.packs))}::jsonb AND report->'dust' = ${q(JSON.stringify(e.report.dust))}::jsonb FROM wit2_legacy WHERE student_id = ${q(s.uuid)};`);
}
sql.push(`SELECT (wit2_migrate_all()->>'migrados')::int = 0 AS "segunda vez: ninguém";`, "SELECT set_config('test.email', '', false);");
writeFileSync('scripts/sql/teste-wit2-7-virada.sql', sql.join('\n') + '\n');
console.log(`virada: ${CARD_ID_BY_SHOP_NAME.size} itens da loja, ${PATHS.length} Caminhos; teste com ${fx.length} alunos`);
