import * as fs from 'fs';
import * as path from 'path';

type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'unknown';
type ItemCategory = 'armamento' | 'armadura' | 'utilizavel' | 'colecao' | 'habilidade' | 'token';

const ITEMS_DIR = 'public/images/Itens';
const OUTPUT = 'src/data/anime-items-catalog.json';

const RARITY_COST: Record<ItemRarity, { coins: number; diamonds: number; minLevel: number }> = {
  common:    { coins: 50,   diamonds: 5,   minLevel: 1 },
  uncommon:  { coins: 125,  diamonds: 12.5, minLevel: 2 },
  rare:      { coins: 200,  diamonds: 20,  minLevel: 4 },
  epic:      { coins: 400,  diamonds: 40,  minLevel: 7 },
  legendary: { coins: 700,  diamonds: 70,  minLevel: 10 },
  mythic:    { coins: 1000, diamonds: 100, minLevel: 14 },
  unknown:   { coins: 1500, diamonds: 150, minLevel: 18 },
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();
}

function makeNameSet(values: string[]) {
  return new Set(values.map(normalize));
}

const UNKNOWN = makeNameSet([
  'Kamish',
  'Kamishs Wrath',
  'Enuma Elish',
  'Return by Death',
  'Geass Eye',
  'Ultra Instinct',
  'Time Stop',
  'Requiem',
  'The Goal of All Life is Death',
]);

const MYTHIC = makeNameSet([
  'Avalon',
  'Excalibur',
  'Dragon Balls',
  'Zoltraak',
  'Limitless',
  'Hollow Purple',
  'Domain Expansion',
  'Unlimited Blade Works',
  'Requiem Arrow',
  'Spirit Gun',
  'Dragon of the Darkness Flame',
]);

const LEGENDARY = makeNameSet([
  'Berserker Armor',
  'Dragon Slayer',
  'Zangetsu',
  'tensa zanguetsu',
  'Hyorinmaru',
  'Senbonzakura',
  'Murasame',
  'Lostvayne',
  'Chastiefol',
  'Gideon',
  'Rhitta',
  'Mjolnir',
  'Volundr',
  'Z Sword',
  'Potara Earrings',
  'Philosophers Stone',
  'Stone Mask',
  'Stand Arrow',
  'Demon Sword Ragnarok',
  'Death Scythe',
  'Arthur s Excalibur',
]);

const EPIC = makeNameSet([
  'Black Flash',
  'Anti-Magic Slash',
  'Black Divider',
  'Dimension Slash',
  'Full Counter',
  'Cruel Sun',
  'Godspeed',
  'Kakuja Form',
  'Ruler s Authority',
  'Shadow Extraction',
  'One For All Smash',
  'Final Flash',
  'Kamehameha',
  'Kaioken',
  'Hinokami Kagura',
  'Thunderclap and Flash',
  'Fire Dragon Roar',
  'Dragon Force',
  'Flame Alchemy',
  'Equivalent Exchange',
  'Chain Jail',
  'Ten Shadows',
  'Cursed Speech',
  'Inverted Spear of Heaven',
  'Prison Realm',
  'Split Soul Katana',
  'Playful Cloud',
  'Orb of Avarice',
  'Barukas Dagger',
  'Kasakas Venom Fang',
]);

const UNCOMMON = makeNameSet([
  'Kunai',
  'Kunai trovao',
  'Papel explosivo',
  'Shuriken',
  'Senzu Bean',
  'Scouter',
  'Power Pole',
  'ODM Gear',
  'Thunder Spears',
  'Ultrahard Steel Blades',
  'Ignition Gloves',
  'Killuas Yo-Yos',
  'Hisokas Cards',
  'Gons Fishing Rod',
  'State Alchemist Watch',
]);

const SOURCE_RULES: Array<[RegExp, string]> = [
  [/adolla|benimaru|arthur/i, 'Fire Force'],
  [/spirit gun|darkness flame/i, 'Yu Yu Hakusho'],
  [/kunai|shuriken|papel explosivo|samehada|sharingan|puppet/i, 'Naruto'],
  [/enma|gomu|gura|mera/i, 'One Piece'],
  [/zanguetsu|hyorinmaru|senbonzakura|mascara hollow/i, 'Bleach'],
  [/nichirin|hinokami|water breathing|thunderclap/i, 'Demon Slayer'],
  [/black flash|domain|hollow purple|limitless|ten shadows|cursed speech|playful cloud|soul katana|inverted spear|prison realm/i, 'Jujutsu Kaisen'],
  [/kamish|kasaka|baruka|knight killer|orb of avarice|ruler|shadow extraction|bloodlust|stealth/i, 'Solo Leveling'],
  [/avalon|enuma|excalibur|unlimited blade|volundr/i, 'Fate'],
  [/berserk|behelit|dragon slayer|cannon arm|skull knight/i, 'Berserk'],
  [/dragon balls|kamehameha|final flash|kaioken|ultra instinct|potara|scouter|senzu|z sword|power pole|instant transmission/i, 'Dragon Ball'],
  [/fairy tail|erza|lacrima|fire dragon|dragon force|ice make/i, 'Fairy Tail'],
  [/anti-magic|black divider|dimension slash|mana zone/i, 'Black Clover'],
  [/odm|titan|survey corps|thunder spears|ultrahard/i, 'Attack on Titan'],
  [/automail|alchemy|philosopher|equivalent|state alchemist/i, 'Fullmetal Alchemist'],
  [/killua|hisoka|gon|kurapika|chain jail|jajanken|godspeed/i, 'Hunter x Hunter'],
  [/one for all|explosion rush|dark shadow|half-cold|erasure/i, 'My Hero Academia'],
  [/requiem|stand arrow|stone mask|steel balls|ora barrage|time stop|hamon/i, 'JoJo'],
  [/lostvayne|rhitta|gideon|chastiefol|full counter|cruel sun|disaster/i, 'Seven Deadly Sins'],
  [/murasame/i, 'Akame ga Kill'],
  [/death scythe|soul resonance|ragnarok/i, 'Soul Eater'],
  [/millennium|dark magician/i, 'Yu-Gi-Oh!'],
  [/sekki/i, 'Noragami'],
  [/metal vessel/i, 'Magi'],
  [/return by death/i, 'Re:Zero'],
  [/frieren|zoltraak/i, 'Frieren'],
  [/geass/i, 'Code Geass'],
  [/mjolnir/i, 'Record of Ragnarok'],
  [/direct shot|meta vision|predator eye/i, 'Blue Lock'],
  [/quick attack/i, 'Haikyuu!!'],
];

function stripExtension(file: string) {
  const ext = path.extname(file);
  return ext ? file.slice(0, -ext.length) : file;
}

function slugify(value: string) {
  return normalize(value).toLowerCase().replace(/\s+/g, '-');
}

function displayName(value: string) {
  return value.replace(/[,]+$/g, '').replace(/\s+/g, ' ').trim();
}

function sourceFor(name: string) {
  return SOURCE_RULES.find(([pattern]) => pattern.test(name))?.[1] ?? 'Anime';
}

function categoryFor(name: string): ItemCategory {
  if (/armor|armors|cloak|mask|mascara|earrings|watch|scouter|gear|serum|bean|stone|balls|puzzle|mark|lacrima|behelit|arrow|vessel/i.test(name)) {
    return 'colecao';
  }
  if (/breathing|slash|flash|expansion|alchemy|exchange|counter|sun|force|make|jajanken|godspeed|time stop|instinct|kamehameha|kaioken|shift|shot|vision|authority|extraction|bloodlust|stealth|resonance|geass|zoltraak/i.test(name)) {
    return 'habilidade';
  }
  if (/bean|serum/i.test(name)) return 'utilizavel';
  return 'armamento';
}

function rarityFor(name: string): ItemRarity {
  const key = normalize(name);
  if (UNKNOWN.has(key)) return 'unknown';
  if (MYTHIC.has(key)) return 'mythic';
  if (LEGENDARY.has(key)) return 'legendary';
  if (EPIC.has(key)) return 'epic';
  if (UNCOMMON.has(key)) return 'uncommon';
  if (/sword|katana|blade|dagger|armor|domain|dragon|demon|cursed|shadow|hollow|requiem|flame|thunder|burst|crimson/i.test(name)) return 'rare';
  return 'common';
}

function iconFor(category: ItemCategory) {
  const icons: Record<ItemCategory, string> = {
    armamento: 'sword',
    armadura: 'shield',
    utilizavel: 'potion',
    colecao: 'star',
    habilidade: 'wand',
    token: 'scroll',
  };
  return icons[category];
}

function abilityFor(name: string, rarity: ItemRarity, category: ItemCategory) {
  const unique = rarity === 'legendary' || rarity === 'mythic' || rarity === 'unknown';
  const baseDamage: Record<ItemRarity, number> = {
    common: 20,
    uncommon: 35,
    rare: 55,
    epic: 80,
    legendary: 110,
    mythic: 140,
    unknown: 180,
  };
  const effect =
    /flame|fire|sun|burn|adolla|benimaru|kamehameha|final flash/i.test(name) ? 'burn' :
    /thunder|electric|killua|godspeed|flash/i.test(name) ? 'shock' :
    /blood|murasame|dagger|katana|blade|sword|kunai|scythe/i.test(name) ? 'bleed' :
    /shadow|dark|hollow|cursed|demon|death|requiem/i.test(name) ? 'curse' :
    /ice|cold|hyorinmaru|frieren|zoltraak/i.test(name) ? 'freeze' :
    /bean|avalon|recovery|senzu/i.test(name) ? 'heal' :
    'focus';

  return {
    mode: unique ? 'unique' : 'combo',
    key: `${slugify(name)}_${unique ? 'unique' : 'combo'}`,
    name: unique ? `Legado: ${displayName(name)}` : `Ativar ${displayName(name)}`,
    description: unique
      ? `Habilidade unica de ${displayName(name)}. Reservada para efeitos especiais de batalha.`
      : `Causa ${baseDamage[rarity]} de dano e aplica ${effect}.`,
    config: {
      damage: baseDamage[rarity],
      cooldown: unique ? 5 : rarity === 'epic' ? 4 : 3,
      energyCost: Math.max(10, Math.round(baseDamage[rarity] / 4)),
      effects: category === 'utilizavel'
        ? [{ type: 'heal', value: baseDamage[rarity], duration: 0, chance: 100 }]
        : [{ type: effect, value: Math.max(5, Math.round(baseDamage[rarity] * 0.18)), duration: unique ? 3 : 2, chance: unique ? 100 : 60 }],
    },
  };
}

if (!fs.existsSync(ITEMS_DIR)) {
  console.error(`ERRO: pasta nao encontrada: ${ITEMS_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(ITEMS_DIR)
  .filter(file => fs.statSync(path.join(ITEMS_DIR, file)).isFile())
  .sort((a, b) => a.localeCompare(b, 'pt-BR'));

const items = files.map(file => {
  const name = displayName(stripExtension(file));
  const rarity = rarityFor(name);
  const category = categoryFor(name);
  const pricing = RARITY_COST[rarity];
  const ability = abilityFor(name, rarity, category);

  return {
    slug: slugify(name),
    name,
    source_anime: sourceFor(name),
    rarity,
    category,
    cost: pricing.coins,
    diamond_cost: pricing.diamonds,
    min_level: pricing.minLevel,
    icon: iconFor(category),
    image_url: `/images/Itens/${encodeURIComponent(file)}`,
    description: `${name} canaliza uma tecnica de ${sourceFor(name)} adaptada para o WIT Dungeon.`,
    attr_forca: category === 'armamento' ? Math.ceil(pricing.minLevel / 2) : 0,
    attr_destreza: /kunai|shuriken|gear|yo-yo|cards|shot|vision/i.test(name) ? Math.ceil(pricing.minLevel / 2) : 0,
    attr_inteligencia: category === 'habilidade' ? Math.ceil(pricing.minLevel / 2) : 0,
    attr_carisma: /geass|mark|puzzle|magician|requiem/i.test(name) ? Math.ceil(pricing.minLevel / 3) : 0,
    attr_agilidade: /flash|godspeed|odm|instant|stealth|quick/i.test(name) ? Math.ceil(pricing.minLevel / 2) : 0,
    attr_resistencia: /armor|shield|cloak|stone|avalon|titan|berserker/i.test(name) ? Math.ceil(pricing.minLevel / 2) : 0,
    ability_mode: ability.mode,
    ability_key: ability.key,
    ability_name: ability.name,
    ability_description: ability.description,
    ability_config: ability.config,
  };
});

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(items, null, 2) + '\n', 'utf-8');

const counts = items.reduce<Record<string, number>>((acc, item) => {
  acc[item.rarity] = (acc[item.rarity] ?? 0) + 1;
  return acc;
}, {});

console.log(`Catalogo gerado: ${OUTPUT}`);
console.log(`Itens: ${items.length}`);
console.log(counts);
