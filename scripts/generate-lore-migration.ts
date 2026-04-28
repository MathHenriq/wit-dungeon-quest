import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(), 'src/data/anime-items-catalog.json');
const items = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

const migrationName = process.argv[2] ?? '20260428010000_update_anime_shop_lore.sql';
const migrationPath = path.join(process.cwd(), 'supabase/migrations', migrationName);

let sql = `-- Migration to apply generated lore to existing anime shop_items\n\n`;
sql += `WITH new_lore (name, description, source_anime) AS (\n  VALUES\n`;

const values = items.map(item => `    ('${item.name.replace(/'/g, "''")}', '${item.description.replace(/'/g, "''")}', '${item.source_anime.replace(/'/g, "''")}')`);
sql += values.join(',\n');
sql += `\n)\n`;
sql += `UPDATE public.shop_items s\n`;
sql += `SET description = l.description,\n`;
sql += `    source_anime = l.source_anime\n`;
sql += `FROM new_lore l\n`;
sql += `WHERE s.name = l.name;\n`;

fs.writeFileSync(migrationPath, sql, 'utf-8');
console.log('Migration created at', migrationPath);
