/**
 * WIT Dungeon - Gerador de Andares
 * Usa Google Gemini API (gratuito)
 *
 * Usage:
 *   npm run floors:generate           # gera do andar 1 ao 50
 *   npm run floors:generate -- 25     # retoma a partir do andar 25
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Configuração ──────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = 'gemini-2.0-flash';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

if (!GEMINI_API_KEY) {
  console.error('ERRO: Defina GEMINI_API_KEY');
  console.error('  Windows PowerShell : $env:GEMINI_API_KEY="AIza..."');
  console.error('  Mac/Linux          : export GEMINI_API_KEY="AIza..."');
  process.exit(1);
}

// ── Carregar configurações ────────────────────────────────────────────────────

const catalogPath = 'src/data/sprites-catalog.json';
if (!fs.existsSync(catalogPath)) {
  console.error('ERRO: sprites-catalog.json não encontrado. Rode primeiro: npm run sprites:scan');
  process.exit(1);
}

const spritesCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const floorBlocks    = JSON.parse(fs.readFileSync('src/data/floor-blocks.json', 'utf-8'));

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface GeneratedFloor {
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
    name: string;
    title: string;
    description: string;
    element: string;
    sprite_id: string;
    sprite_file: string;
    hp: number;
    atk: number;
    def: number;
    skills: Array<{
      name: string;
      type: 'attack' | 'defense' | 'buff' | 'debuff';
      element: string;
      power: number;
      description: string;
    }>;
  };
  enemies: Array<{
    name: string;
    element: string;
    sprite_id: string;
    sprite_file: string;
    hp: number;
    atk: number;
    def: number;
  }>;
  quiz: Array<{
    question: string;
    topic: string;
    difficulty: 1 | 2 | 3;
    options: { a: string; b: string; c: string; d: string };
    correct: 'a' | 'b' | 'c' | 'd';
    explanation: string;
  }>;
}

// ── Tracking de sprites já usados ────────────────────────────────────────────

const usedEnemySprites = new Set<string>();
const usedBossSprites  = new Set<string>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBlockForFloor(floorNumber: number) {
  return floorBlocks.blocks.find(
    (b: any) => floorNumber >= b.floors[0] && floorNumber <= b.floors[1]
  );
}

function calculateBossStats(n: number) {
  const b = floorBlocks.balancing;
  return {
    hp:  Math.round(b.boss_hp_base  + n * b.boss_hp_per_floor),
    atk: Math.round(b.boss_atk_base + n * b.boss_atk_per_floor),
    def: Math.round(b.boss_def_base + n * b.boss_def_per_floor),
  };
}

function calculateEnemyCount(n: number): number {
  const b = floorBlocks.balancing;
  return Math.min(8, b.enemies_base + Math.floor(n / 10) * b.enemies_per_10_floors);
}

function getRandomEnemies(count: number): any[] {
  let available = spritesCatalog.enemies.filter((e: any) => !usedEnemySprites.has(e.id));
  if (available.length < count) {
    usedEnemySprites.clear();
    available = [...spritesCatalog.enemies];
  }
  const selected = [...available].sort(() => Math.random() - 0.5).slice(0, count);
  selected.forEach((e: any) => usedEnemySprites.add(e.id));
  return selected;
}

function getRandomBoss(): any {
  let available = spritesCatalog.bosses.filter((b: any) => !usedBossSprites.has(b.id));
  if (available.length === 0) {
    usedBossSprites.clear();
    available = [...spritesCatalog.bosses];
  }
  const selected = available[Math.floor(Math.random() * available.length)];
  usedBossSprites.add(selected.id);
  return selected;
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(floorNumber: number, assignedEnemies: any[], assignedBoss: any): string {
  const block      = getBlockForFloor(floorNumber);
  const bossStats  = calculateBossStats(floorNumber);
  const enemyStats = {
    hp:  Math.round(bossStats.hp  * 0.7),
    atk: Math.round(bossStats.atk * 0.7),
    def: Math.round(bossStats.def * 0.7),
  };

  const enemyList = assignedEnemies.map(e => `- ${e.name} (${e.element})`).join('\n');

  return `
Você é um game designer criando conteúdo para um RPG educacional de IA/programação chamado WIT Dungeon.

## CONTEXTO
- Andar: ${floorNumber} de 50
- Tema visual: ${block.theme} (${block.theme_display})
- Bloco temático: ${block.name}

## INIMIGOS DESTE ANDAR (JÁ DEFINIDOS - NÃO ALTERE OS NOMES)
${enemyList}

## BOSS DESTE ANDAR (JÁ DEFINIDO - NÃO ALTERE)
- Nome: ${assignedBoss.name}
- Título: ${assignedBoss.title}
- Elemento: ${assignedBoss.element}

## STATS (JÁ CALCULADOS)
Boss: HP ${bossStats.hp} | ATK ${bossStats.atk} | DEF ${bossStats.def}
Inimigos: HP ${enemyStats.hp} | ATK ${enemyStats.atk} | DEF ${enemyStats.def}

## SUA TAREFA
1. Crie um NOME para o andar (máx 25 chars, épico, em português)
2. Escreva a LORE do andar (descrição, história, aviso de perigo)
3. Crie uma DESCRIÇÃO para o boss (2-3 frases)
4. Crie 2-3 SKILLS para o boss
5. Gere 10 PERGUNTAS de quiz sobre: ${block.topics.join(', ')}

## REGRAS DO QUIZ
- 4 perguntas fáceis (difficulty: 1)
- 4 perguntas médias (difficulty: 2)
- 2 perguntas difíceis (difficulty: 3)
- Alternativas plausíveis, não óbvias
- Explicação breve para cada resposta correta
- Português BR, tom acessível para adolescentes (14-17 anos)
- Perguntas que testam conhecimento real, não pegadinhas

## OUTPUT (APENAS JSON VÁLIDO, SEM MARKDOWN, SEM TEXTO EXTRA)
{
  "name": "Nome do Andar",
  "lore": {
    "description": "3-4 frases de ambientação",
    "history": "Backstory do local em 2-3 frases",
    "danger_warning": "Cuidado com... (frase curta)"
  },
  "boss_description": "Descrição do boss em 2-3 frases.",
  "boss_skills": [
    {
      "name": "Nome da Skill",
      "type": "attack",
      "element": "${assignedBoss.element}",
      "power": 50,
      "description": "O que esta skill faz"
    }
  ],
  "quiz": [
    {
      "question": "Pergunta?",
      "topic": "tópico específico",
      "difficulty": 1,
      "options": { "a": "...", "b": "...", "c": "...", "d": "..." },
      "correct": "a",
      "explanation": "Porque esta é a resposta correta"
    }
  ]
}

Responda APENAS com o JSON. Sem texto antes ou depois. Sem markdown. Sem \`\`\`. Gere exatamente 10 perguntas.
`.trim();
}

// ── Chamada à API Gemini ──────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API ${response.status}: ${error}`);
  }

  const data = await response.json() as any;

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta inválida do Gemini: ' + JSON.stringify(data));

  return text;
}

// ── Geração de um andar ───────────────────────────────────────────────────────

async function generateFloor(floorNumber: number): Promise<GeneratedFloor> {
  const block      = getBlockForFloor(floorNumber);
  const bossStats  = calculateBossStats(floorNumber);
  const enemyCount = calculateEnemyCount(floorNumber);
  const enemyStats = {
    hp:  Math.round(bossStats.hp  * 0.7),
    atk: Math.round(bossStats.atk * 0.7),
    def: Math.round(bossStats.def * 0.7),
  };

  const assignedEnemies = getRandomEnemies(enemyCount);
  const assignedBoss    = getRandomBoss();

  const responseText = await callGemini(buildPrompt(floorNumber, assignedEnemies, assignedBoss));

  // Limpar possíveis code fences ou texto extra
  let jsonText = responseText.trim();
  if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
  if (jsonText.startsWith('```'))     jsonText = jsonText.slice(3);
  if (jsonText.endsWith('```'))       jsonText = jsonText.slice(0, -3);
  jsonText = jsonText.trim();

  // Extrair JSON caso haja texto antes/depois
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonText = jsonMatch[0];

  let generated: any;
  try {
    generated = JSON.parse(jsonText);
  } catch (parseError) {
    console.error('  JSON inválido (primeiros 500 chars):', jsonText.substring(0, 500));
    throw new Error(`Falha ao parsear JSON: ${parseError}`);
  }

  const floor: GeneratedFloor = {
    floor_number: floorNumber,
    name:         generated.name ?? `Andar ${floorNumber}`,
    theme:        block.theme,
    lore: generated.lore ?? {
      description:    'Um lugar misterioso e perigoso.',
      history:        'Pouco se sabe sobre este local.',
      danger_warning: 'Cuidado com os inimigos à espreita.',
    },
    visual: {
      primary_color: block.colors.primary,
      accent_color:  block.colors.accent,
      fog_color:     block.colors.fog,
      fog_opacity:   0.06,
      particle_type: block.particle_type,
    },
    boss: {
      name:        assignedBoss.name,
      title:       assignedBoss.title,
      description: generated.boss_description ?? 'Um poderoso guardião deste andar.',
      element:     assignedBoss.element,
      sprite_id:   assignedBoss.id,
      sprite_file: assignedBoss.file,
      hp:          bossStats.hp,
      atk:         bossStats.atk,
      def:         bossStats.def,
      skills: generated.boss_skills ?? [{
        name: 'Ataque Básico', type: 'attack',
        element: assignedBoss.element, power: 50,
        description: 'Um ataque direto.',
      }],
    },
    enemies: assignedEnemies.map(e => ({
      name:        e.name,
      element:     e.element,
      sprite_id:   e.id,
      sprite_file: e.file,
      hp:          enemyStats.hp,
      atk:         enemyStats.atk,
      def:         enemyStats.def,
    })),
    quiz: generated.quiz ?? [],
  };

  if (floor.quiz.length !== 10) {
    console.warn(`  ⚠ Quiz com ${floor.quiz.length} perguntas (esperado: 10)`);
  }

  return floor;
}

// ── Geração de todos os andares ───────────────────────────────────────────────

async function generateAllFloors(startFrom: number = 1) {
  const outputDir = 'scripts/output';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const results: GeneratedFloor[] = [];
  const errors: Array<{ floor: number; error: string }> = [];

  // Carregar andares já gerados (para continuar de onde parou)
  for (let i = 1; i < startFrom; i++) {
    const filePath = path.join(outputDir, `floor_${i.toString().padStart(2, '0')}.json`);
    if (fs.existsSync(filePath)) {
      results.push(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    }
  }

  console.log('===========================================');
  console.log('   WIT DUNGEON — GERADOR DE ANDARES');
  console.log('   Usando: Google Gemini 2.0 Flash (Gratuito)');
  console.log('===========================================');
  console.log(`Iniciando a partir do andar ${startFrom}...\n`);

  for (let i = startFrom; i <= 50; i++) {
    process.stdout.write(`Gerando andar ${i}/50... `);
    try {
      const floor = await generateFloor(i);
      results.push(floor);

      fs.writeFileSync(
        path.join(outputDir, `floor_${i.toString().padStart(2, '0')}.json`),
        JSON.stringify(floor, null, 2),
      );

      console.log(`✓ "${floor.name}"  Boss: ${floor.boss.name}  Quiz: ${floor.quiz.length}q`);

      // Gemini free tier: 15 req/min → 1 req a cada ~4,5 s
      if (i < 50) await new Promise(r => setTimeout(r, 4500));

    } catch (err: any) {
      console.log(`✗ ${err.message}`);
      errors.push({ floor: i, error: err.message });
      // Pausa maior após erro (possível rate limit)
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  // Consolidado
  fs.writeFileSync(
    path.join(outputDir, 'all_floors.json'),
    JSON.stringify(results, null, 2),
  );

  console.log('\n===========================================');
  console.log('GERAÇÃO COMPLETA');
  console.log(`Sucesso : ${results.length}/50`);
  console.log(`Erros   : ${errors.length}`);

  if (errors.length > 0) {
    const errFloors = errors.map(e => e.floor).join(', ');
    console.log(`Andares com erro: ${errFloors}`);
    fs.writeFileSync(path.join(outputDir, 'errors.json'), JSON.stringify(errors, null, 2));
    console.log('Detalhes em scripts/output/errors.json');
    console.log('\nPara tentar novamente os que falharam:');
    errors.forEach(e => console.log(`  npm run floors:generate -- ${e.floor}`));
  }

  console.log('\nPróximo passo: npm run floors:insert');
  console.log('===========================================\n');
}

// ── Entrada ───────────────────────────────────────────────────────────────────

const startFrom = parseInt(process.argv[2] ?? '1', 10);
if (isNaN(startFrom) || startFrom < 1 || startFrom > 50) {
  console.error('Uso: npm run floors:generate -- [andar_inicial]  (ex: -- 25)');
  process.exit(1);
}

generateAllFloors(startFrom).catch(console.error);
