import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://pvnzfiyxwvfmmhvpvrrk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEACHER_ID = process.env.TEACHER_ID!;
const CATALOG_PATH = process.argv[2] ?? 'src/data/anime-items-catalog.json';

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERRO: defina SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!TEACHER_ID) {
  console.error('ERRO: defina TEACHER_ID');
  process.exit(1);
}

if (!fs.existsSync(CATALOG_PATH)) {
  console.error(`ERRO: catalogo nao encontrado: ${CATALOG_PATH}`);
  console.error('Rode primeiro: npm run items:generate');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8')) as Array<Record<string, any>>;

async function importItems() {
  const { data: existing, error: existingError } = await supabase
    .from('shop_items')
    .select('id, name')
    .eq('teacher_id', TEACHER_ID);

  if (existingError) throw existingError;

  const byName = new Map((existing ?? []).map(item => [String(item.name).toLowerCase(), item.id]));
  let inserted = 0;
  let updated = 0;

  for (const item of catalog) {
    const row = {
      teacher_id: TEACHER_ID,
      name: item.name,
      description: item.description,
      category: item.category,
      cost: item.cost,
      diamond_cost: item.diamond_cost ?? 0,
      min_level: item.min_level,
      icon: item.icon,
      image_url: item.image_url,
      is_active: true,
      rarity: item.rarity,
      source_anime: item.source_anime,
      ability_mode: item.ability_mode,
      ability_key: item.ability_key,
      ability_name: item.ability_name,
      ability_description: item.ability_description,
      ability_config: item.ability_config,
      attr_forca: item.attr_forca ?? 0,
      attr_destreza: item.attr_destreza ?? 0,
      attr_inteligencia: item.attr_inteligencia ?? 0,
      attr_carisma: item.attr_carisma ?? 0,
      attr_agilidade: item.attr_agilidade ?? 0,
      attr_resistencia: item.attr_resistencia ?? 0,
    };

    const existingId = byName.get(String(item.name).toLowerCase());
    const query = existingId
      ? supabase.from('shop_items').update(row).eq('id', existingId)
      : supabase.from('shop_items').insert(row);

    const { error } = await query;
    if (error) throw new Error(`${item.name}: ${error.message}`);
    if (existingId) updated++;
    else inserted++;
  }

  console.log(`Importacao concluida para teacher ${TEACHER_ID}`);
  console.log(`Inseridos: ${inserted}`);
  console.log(`Atualizados: ${updated}`);
}

importItems().catch(err => {
  console.error('ERRO:', err.message ?? err);
  process.exit(1);
});
