/**
 * Insere os andares gerados no banco Supabase.
 * Mapeado para o esquema REAL das tabelas (verificado em 2026-04-13):
 *   floors.id          → INTEGER
 *   enemies.hp_max     → hp
 *   enemies.element_type → element
 *   enemies.sprite_url → sprite_file
 *   boss_battles.title, boss_name, boss_hp
 *   boss_questions.correct_answer, sort_order, options (JSONB)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL         = process.env.SUPABASE_URL ?? 'https://pvnzfiyxwvfmmhvpvrrk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEACHER_ID           = process.env.TEACHER_ID!;

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERRO: defina SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!TEACHER_ID) {
  console.error('ERRO: defina TEACHER_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Floor {
  floor_number: number;
  name: string;
  theme: string;
  lore: { description: string; history: string; danger_warning: string };
  visual: {
    primary_color: string;
    accent_color: string;
    fog_color: string;
    fog_opacity: number;
    particle_type: string;
  };
  boss: {
    name: string; title: string; description: string; element: string;
    sprite_id: string; sprite_file: string;
    hp: number; atk: number; def: number; skills: any[];
  };
  enemies: Array<{
    name: string; element: string; sprite_id: string; sprite_file: string;
    hp: number; atk: number; def: number;
  }>;
  quiz: Array<{
    question: string; topic: string; difficulty: number;
    options: { a: string; b: string; c: string; d: string };
    correct: string; explanation: string;
  }>;
}

async function insertFloors() {
  const inputPath = process.argv[2] ?? 'scripts/output/all_floors.json';
  if (!fs.existsSync(inputPath)) {
    console.error(`ERRO: ${inputPath} não encontrado.`);
    process.exit(1);
  }

  const floorsData: Floor[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  let successCount = 0;
  const insertErrors: Array<{ floor: number; error: string }> = [];

  console.log(`\n📥 Inserindo ${floorsData.length} andares...\n`);

  for (const floor of floorsData) {
    console.log(`Andar ${floor.floor_number}: ${floor.name}`);

    try {
      // ── 1. Floor ────────────────────────────────────────────────────────────
      const { data: floorData, error: floorError } = await supabase
        .from('floors')
        .insert({
          floor_number:         floor.floor_number,
          name:                 floor.name,
          theme:                floor.theme,
          level_min:            floor.floor_number,
          level_max:            floor.floor_number + 2,
          // Novas colunas (adicionadas pela migração)
          lore_description:     floor.lore.description,
          lore_history:         floor.lore.history,
          lore_warning:         floor.lore.danger_warning,
          visual_primary_color: floor.visual.primary_color,
          visual_accent_color:  floor.visual.accent_color,
          visual_fog_color:     floor.visual.fog_color,
          visual_fog_opacity:   floor.visual.fog_opacity,
          visual_particle_type: floor.visual.particle_type,
        })
        .select('id')
        .single();

      if (floorError) throw new Error(`Floor: ${floorError.message}`);
      const floorId: number = floorData.id;
      console.log(`  ✓ Floor id=${floorId}`);

      // ── 2. Boss (enemy com is_boss=true) ────────────────────────────────────
      const { error: bossError } = await supabase.from('enemies').insert({
        floor_id:     floorId,
        name:         floor.boss.name,
        is_boss:      true,
        // Colunas existentes mapeadas
        hp_max:       floor.boss.hp,
        element_type: floor.boss.element,
        sprite_url:   floor.boss.sprite_file,
        lore:         floor.boss.description,
        // Novas colunas
        sprite_id:    floor.boss.sprite_id,
        skills:       floor.boss.skills,
        title:        floor.boss.title,
        description:  floor.boss.description,
        atk:          floor.boss.atk,
        def_fisica:   floor.boss.def,
      });
      if (bossError) throw new Error(`Boss: ${bossError.message}`);
      console.log(`  ✓ Boss: ${floor.boss.name}`);

      // ── 3. Inimigos normais ──────────────────────────────────────────────────
      const enemiesData = floor.enemies.map(e => ({
        floor_id:     floorId,
        name:         e.name,
        is_boss:      false,
        hp_max:       e.hp,
        element_type: e.element,
        sprite_url:   e.sprite_file,
        sprite_id:    e.sprite_id,
        atk:          e.atk,
        def_fisica:   e.def,
      }));
      const { error: enemiesError } = await supabase.from('enemies').insert(enemiesData);
      if (enemiesError) throw new Error(`Enemies: ${enemiesError.message}`);
      console.log(`  ✓ ${floor.enemies.length} inimigos`);

      // ── 4. Boss battle (container do quiz) ──────────────────────────────────
      const { data: bossBattle, error: bbError } = await supabase
        .from('boss_battles')
        .insert({
          teacher_id:  TEACHER_ID,
          title:       `Quiz - ${floor.name}`,
          boss_name:   floor.boss.name,
          boss_hp:     floor.boss.hp,
          difficulty:  'normal',
          is_active:   true,
        })
        .select('id')
        .single();
      if (bbError) throw new Error(`BossBattle: ${bbError.message}`);

      // ── 5. Perguntas ────────────────────────────────────────────────────────
      const questionsData = floor.quiz.map((q, i) => ({
        boss_id:        bossBattle.id,
        question_text:  q.question,
        question_type:  'multiple_choice',
        // options como JSONB: { a, b, c, d }
        options:        q.options,
        correct_answer: q.correct,
        sort_order:     i + 1,
        damage:         25,
        // Novas colunas
        explanation:    q.explanation,
        topic:          q.topic,
        difficulty:     q.difficulty,
      }));
      const { error: questionsError } = await supabase.from('boss_questions').insert(questionsData);
      if (questionsError) throw new Error(`Questions: ${questionsError.message}`);
      console.log(`  ✓ ${floor.quiz.length} perguntas`);

      // ── 6. Link floor ↔ quiz ─────────────────────────────────────────────────
      const { error: linkError } = await supabase.from('floor_boss_quizzes').insert({
        floor_id:       floorId,
        boss_battle_id: bossBattle.id,
      });
      if (linkError) throw new Error(`Link: ${linkError.message}`);

      console.log(`  ✓ Concluído!\n`);
      successCount++;

    } catch (err: any) {
      console.error(`  ✗ ERRO: ${err.message}\n`);
      insertErrors.push({ floor: floor.floor_number, error: err.message });
    }
  }

  console.log('══════════════════════════════════');
  console.log(`Sucesso : ${successCount}/${floorsData.length}`);
  console.log(`Erros   : ${insertErrors.length}`);
  if (insertErrors.length > 0) {
    fs.writeFileSync('scripts/output/insert_errors.json', JSON.stringify(insertErrors, null, 2));
    console.log('Detalhes em scripts/output/insert_errors.json');
  }
  console.log('══════════════════════════════════\n');
}

insertFloors().catch(console.error);
