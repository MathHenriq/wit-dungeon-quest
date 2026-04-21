/**
 * Escaneia a pasta de sprites e gera um catálogo automático.
 * Extrai nomes dos arquivos e gera nomes épicos quando necessário.
 *
 * Usage:
 *   npx ts-node scripts/scan-sprites.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const SPRITES_DIR  = 'public/assets/sprites/all';
const BOSSES_DIR   = 'public/assets/sprites/bosses';
const OUTPUT_FILE  = 'src/data/sprites-catalog.json';

// ── Nomes genéricos épicos ────────────────────────────────────────────────────

const GENERIC_ENEMY_NAMES = [
  'Sentinela das Sombras', 'Guardião Corrompido', 'Espectro Errante',
  'Besta Ancestral', 'Criatura do Abismo', 'Demônio Menor',
  'Espírito Vingativo', 'Aberração Arcana', 'Servo das Trevas',
  'Entidade Caótica', 'Assombração Antiga', 'Predador Noturno',
  'Manifestação Sombria', 'Aparição Funesta', 'Fera Dimensional',
  'Construto Animado', 'Elemental Selvagem', 'Horror Profundo',
  'Pesadelo Vivo', 'Anomalia Mágica',
];

const GENERIC_BOSS_NAMES = [
  { name: 'Lorde das Sombras',   title: 'O Eterno' },
  { name: 'Colosso Ancestral',   title: 'Guardião dos Portões' },
  { name: 'Arquidemônio',        title: 'Senhor do Caos' },
  { name: 'Titã Corrompido',     title: 'O Imortal' },
  { name: 'Dragão Abissal',      title: 'Destruidor de Reinos' },
  { name: 'Lich Supremo',        title: 'Mestre da Morte' },
  { name: 'Leviatã',             title: 'Terror das Profundezas' },
  { name: 'Imperador Sombrio',   title: 'O Conquistador' },
  { name: 'Fênix Negra',         title: 'Chama Eterna' },
  { name: 'Hidra Primordial',    title: 'As Mil Cabeças' },
];

// ── Mapeamentos keyword → elemento / nome PT-BR ──────────────────────────────

const KEYWORD_TO_ELEMENT: Record<string, string> = {
  // Fogo
  fire: 'fogo', flame: 'fogo', lava: 'fogo', magma: 'fogo',
  demon: 'fogo', devil: 'fogo', inferno: 'fogo', ember: 'fogo',
  // Água
  water: 'água', aqua: 'água', ocean: 'água', sea: 'água',
  fish: 'água', shark: 'água', jellyfish: 'água',
  // Gelo
  ice: 'gelo', frost: 'gelo', frozen: 'gelo', snow: 'gelo',
  cold: 'gelo', winter: 'gelo', yeti: 'gelo',
  // Terra
  earth: 'terra', rock: 'terra', stone: 'terra', golem: 'terra',
  mountain: 'terra', cave: 'terra', crystal: 'terra',
  // Planta
  plant: 'planta', tree: 'planta', forest: 'planta', nature: 'planta',
  mushroom: 'planta', fungus: 'planta', treant: 'planta', vine: 'planta',
  // Veneno
  poison: 'veneno', toxic: 'veneno', venom: 'veneno', acid: 'veneno',
  spider: 'veneno', snake: 'veneno', scorpion: 'veneno', slime: 'veneno',
  // Sombra / Undead
  shadow: 'sombra', dark: 'sombra', death: 'sombra', undead: 'sombra',
  skeleton: 'sombra', zombie: 'sombra', ghost: 'sombra', wraith: 'sombra',
  phantom: 'sombra', specter: 'sombra', necro: 'sombra', bone: 'sombra',
  // Luz
  light: 'luz', holy: 'luz', angel: 'luz', celestial: 'luz',
  divine: 'luz', radiant: 'luz',
  // Elétrico
  electric: 'elétrico', lightning: 'elétrico', thunder: 'elétrico',
  spark: 'elétrico', volt: 'elétrico', storm: 'elétrico',
  // Ar
  air: 'ar', wind: 'ar', flying: 'ar', bird: 'ar',
  bat: 'ar', wing: 'ar', harpy: 'ar',
  // Normal
  wolf: 'normal', bear: 'normal', lion: 'normal', beast: 'normal',
  rat: 'normal', goblin: 'normal', orc: 'normal', troll: 'normal',
  ogre: 'normal', kobold: 'normal', gnoll: 'normal',
};

const KEYWORD_TO_NAME: Record<string, string> = {
  skeleton: 'Esqueleto',       zombie: 'Zumbi',
  ghost: 'Fantasma',           wraith: 'Espectro',
  phantom: 'Aparição',         spider: 'Aranha',
  bat: 'Morcego',              wolf: 'Lobo',
  bear: 'Urso',                slime: 'Gosma',
  goblin: 'Goblin',            orc: 'Orc',
  troll: 'Troll',              ogre: 'Ogro',
  demon: 'Demônio',            devil: 'Diabo',
  golem: 'Golem',              elemental: 'Elemental',
  dragon: 'Dragão',            snake: 'Serpente',
  scorpion: 'Escorpião',       mushroom: 'Cogumelo',
  treant: 'Treant',            fairy: 'Fada',
  imp: 'Diabrete',             rat: 'Rato',
  eye: 'Olho Maligno',         knight: 'Cavaleiro',
  warrior: 'Guerreiro',        mage: 'Mago',
  wizard: 'Feiticeiro',        lich: 'Lich',
  vampire: 'Vampiro',          werewolf: 'Lobisomem',
  minotaur: 'Minotauro',       centaur: 'Centauro',
  harpy: 'Harpia',             cyclops: 'Ciclope',
  hydra: 'Hidra',              phoenix: 'Fênix',
  griffin: 'Grifo',            gargoyle: 'Gárgula',
  worm: 'Verme',               beetle: 'Besouro',
  ant: 'Formiga',              bee: 'Abelha',
  wasp: 'Vespa',               crab: 'Caranguejo',
  fish: 'Peixe',               shark: 'Tubarão',
  jellyfish: 'Água-viva',      octopus: 'Polvo',
  turtle: 'Tartaruga',         frog: 'Sapo',
  lizard: 'Lagarto',           crocodile: 'Crocodilo',
  bird: 'Pássaro',             crow: 'Corvo',
  owl: 'Coruja',               eagle: 'Águia',
  yeti: 'Yeti',                mummy: 'Múmia',
  scarab: 'Escaravelho',       jackal: 'Chacal',
  cobra: 'Cobra',              plant: 'Planta Carnívora',
  vine: 'Trepadeira',          blob: 'Bolha',
  jelly: 'Gelatina',           ooze: 'Lodo',
  mimic: 'Mímico',             chest: 'Baú Maldito',
  armor: 'Armadura Animada',   sword: 'Espada Possuída',
  skull: 'Crânio Flamejante',  hand: 'Mão Rastejante',
  shadow: 'Sombra',            specter: 'Espectro',
  soul: 'Alma Penada',         spirit: 'Espírito',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getImageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));
}

const ELEMENTS = [
  'fogo', 'água', 'terra', 'ar', 'luz', 'sombra',
  'elétrico', 'gelo', 'planta', 'veneno', 'normal',
];

let genericNameIndex = 0;

function randomElement(): string {
  return ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
}

function extractNameFromFile(filename: string): { name: string; element: string } {
  const baseName = filename
    .replace(/\.(png|jpg|jpeg|gif|webp)$/i, '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\d+/g, ' ')
    .trim();

  const words = baseName.split(/\s+/).filter(Boolean);

  let foundName: string | null = null;
  let foundElement: string | null = null;

  for (const word of words) {
    if (!foundName && KEYWORD_TO_NAME[word]) foundName = KEYWORD_TO_NAME[word];
    if (KEYWORD_TO_ELEMENT[word]) foundElement = KEYWORD_TO_ELEMENT[word];
  }

  if (!foundName) {
    foundName = GENERIC_ENEMY_NAMES[genericNameIndex % GENERIC_ENEMY_NAMES.length];
    genericNameIndex++;
  }

  // Elemento não identificado → sorteia aleatoriamente
  if (!foundElement) foundElement = randomElement();

  return { name: foundName, element: foundElement };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function generateCatalog() {
  console.log('🔍 Escaneando sprites...\n');

  const enemyFiles = getImageFiles(SPRITES_DIR);
  const bossFiles  = getImageFiles(BOSSES_DIR);

  // Se não há bosses separados, usa os últimos inimigos como bosses
  const allBossFiles = bossFiles.length > 0 ? bossFiles : enemyFiles.slice(-10);
  const bossPrefix   = bossFiles.length > 0 ? 'bosses' : 'all';

  console.log(`Inimigos encontrados : ${enemyFiles.length}`);
  console.log(`Bosses encontrados   : ${bossFiles.length}${bossFiles.length === 0 ? ' (usando últimos 10 inimigos)' : ''}\n`);

  // Catálogo de inimigos
  const enemies = enemyFiles.map((file, i) => {
    const { name, element } = extractNameFromFile(file);
    return {
      id: `enemy_${i.toString().padStart(3, '0')}`,
      file: `all/${file}`,
      name,
      element,
      original_filename: file,
    };
  });

  // Catálogo de bosses
  const usedBossNames = new Set<string>();
  const bosses = allBossFiles.map((file, i) => {
    const { element } = extractNameFromFile(file);

    let bossData = GENERIC_BOSS_NAMES[i % GENERIC_BOSS_NAMES.length];
    let attempts = 0;
    while (usedBossNames.has(bossData.name) && attempts < GENERIC_BOSS_NAMES.length) {
      bossData = GENERIC_BOSS_NAMES[(i + ++attempts) % GENERIC_BOSS_NAMES.length];
    }
    usedBossNames.add(bossData.name);

    return {
      id: `boss_${i.toString().padStart(3, '0')}`,
      file: `${bossPrefix}/${file}`,
      name: bossData.name,
      title: bossData.title,
      element,
      original_filename: file,
    };
  });

  const catalog = {
    version: '2.0',
    generated_at: new Date().toISOString(),
    total_enemies: enemies.length,
    total_bosses: bosses.length,
    enemies,
    bosses,
    elements: [
      'fogo', 'água', 'terra', 'ar', 'luz', 'sombra',
      'elétrico', 'gelo', 'planta', 'veneno', 'normal',
    ],
  };

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2));

  console.log(`✓ Catálogo salvo em: ${OUTPUT_FILE}`);
  console.log(`  ${enemies.length} inimigos  |  ${bosses.length} bosses\n`);

  if (enemies.length > 0) {
    console.log('--- Preview inimigos (primeiros 5) ---');
    enemies.slice(0, 5).forEach(e =>
      console.log(`  ${e.id}: ${e.name} [${e.element}]  ← ${e.original_filename}`)
    );
  }
  if (bosses.length > 0) {
    console.log('\n--- Preview bosses (primeiros 3) ---');
    bosses.slice(0, 3).forEach(b =>
      console.log(`  ${b.id}: ${b.name} — ${b.title} [${b.element}]`)
    );
  }

  if (enemies.length === 0) {
    console.log('\n⚠️  Nenhum sprite encontrado em public/assets/sprites/all/');
    console.log('   Adicione arquivos .png/.jpg antes de rodar floors:generate');
  }
}

generateCatalog();
