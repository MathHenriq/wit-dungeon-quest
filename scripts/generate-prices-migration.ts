import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(), 'src/data/anime-items-catalog.json');
const items = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

const migrationName = '20260427090000_update_anime_item_prices.sql';
const migrationPath = path.join(process.cwd(), 'supabase/migrations', migrationName);

let sql = `-- Migration to apply 2:1 price ratio to shop_items\n\n`;
sql += `WITH new_prices (name, cost, diamond_cost) AS (\n  VALUES\n`;

const values = items.map(item => `    ('${item.name.replace(/'/g, "''")}', ${item.cost}, ${item.diamond_cost})`);
sql += values.join(',\n');
sql += `\n)\n`;
sql += `UPDATE public.shop_items s\n`;
sql += `SET cost = p.cost, diamond_cost = p.diamond_cost\n`;
sql += `FROM new_prices p\n`;
sql += `WHERE s.name = p.name;\n`;

fs.writeFileSync(migrationPath, sql, 'utf-8');
console.log('Migration created at', migrationPath);
