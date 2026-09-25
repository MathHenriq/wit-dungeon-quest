/**
 * Coleção 3: 50 cartas de alto nível (Épica a Desconhecida), os golpes mais
 * icônicos de cada obra. Todas cobram caro: é o custo que as equilibra.
 */

import { original, type Entry } from './build';

const atk = original('attack');
const des = original('challenger');
const arm = original('trap');
const cmp = original('field');

// ─── Desconhecidas ───────────────────────────────────────────────────────────

const DESCONHECIDAS: Entry[] = [
  atk('Soco Sério', 'Fighting', 'unknown', 'One Punch Man', {
    damage: 60,
    cost: [{ kind: 'discard', count: 3 }],
    effects: [{ kind: 'pierce' }],
    flavor: 'Desta vez, é sério.',
  }),
  des('Gear 5', 'Fighting', 'unknown', 'One Piece', {
    cost: [{ kind: 'discard', count: 2 }, { kind: 'payLife', amount: 20 }],
    effects: [
      { kind: 'purge', what: 'statuses' },
      { kind: 'addModifier', spec: { match: { type: 'attack' }, mult: 2, uses: 3, label: 'Nika' } },
    ],
  }),
  cmp('Santuário Malevolente', 'Dark', 'unknown', 'Jujutsu Kaisen', {
    passives: [
      { kind: 'attackBonus', match: { type: 'attack', element: 'Dark' }, mult: 1.5, label: 'Santuário' },
      { kind: 'onTurnStart', effects: [{ kind: 'damage', amount: 8 }] },
    ],
    effects: [{ kind: 'damage', amount: 25 }],
  }),
  des('Mahoraga', 'Ghost', 'unknown', 'Jujutsu Kaisen', {
    cost: [{ kind: 'discard', count: 1 }, { kind: 'banish', count: 3 }],
    effects: [{ kind: 'aura', turns: 4, label: 'Adaptação', effects: [{ kind: 'shield', count: 1 }, { kind: 'damage', amount: 6 }] }],
  }),
  des('Rinne Tensei', 'Ghost', 'unknown', 'Naruto', {
    cost: [{ kind: 'discard', count: 2 }, { kind: 'banish', count: 4 }],
    effects: [{ kind: 'heal', amount: 100 }, { kind: 'purge', what: 'statuses' }],
  }),
  des('Hakai', 'Dark', 'unknown', 'Dragon Ball', {
    cost: [{ kind: 'discard', count: 2 }, { kind: 'payLife', amount: 20 }],
    effects: [
      { kind: 'destroy', what: 'weapon' },
      { kind: 'destroy', what: 'armor' },
      { kind: 'destroy', what: 'field' },
      { kind: 'destroy', what: 'trap' },
      { kind: 'destroy', what: 'trap' },
      { kind: 'destroy', what: 'trap' },
      { kind: 'damage', amount: 30 },
    ],
  }),
];

// ─── Míticas ─────────────────────────────────────────────────────────────────

const MITICAS: Entry[] = [
  des('Susanoo', 'Dark', 'mythic', 'Naruto', {
    cost: [{ kind: 'discard', count: 1 }, { kind: 'payLife', amount: 10 }],
    effects: [
      { kind: 'shield', count: 2 },
      { kind: 'addModifier', spec: { match: { type: 'attack' }, add: 15, label: 'Susanoo' } },
    ],
  }),
  des('Modo Kurama', 'Fire', 'mythic', 'Naruto', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{ kind: 'aura', turns: 3, label: 'Chakra da Kurama', effects: [{ kind: 'damage', amount: 10 }, { kind: 'heal', amount: 5 }] }],
  }),
  arm('Kamui', 'Ghost', 'mythic', 'Naruto', {
    trap: { trigger: 'opponentAttack', negate: true, effects: [{ kind: 'damage', amount: 10 }, { kind: 'draw', count: 2 }] },
  }),
  des('Shinra Tensei', 'Flying', 'mythic', 'Naruto', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'destroy', what: 'weapon' },
      { kind: 'destroy', what: 'armor' },
      { kind: 'destroy', what: 'trap' },
      { kind: 'destroy', what: 'trap' },
      { kind: 'damage', amount: 20 },
    ],
  }),
  des('Chibaku Tensei', 'Ground', 'mythic', 'Naruto', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'damage', amount: 25 },
      { kind: 'lock', cardType: 'attack', turns: 1 },
      { kind: 'lock', cardType: 'challenger', turns: 1 },
    ],
  }),
  atk('Tengai Shinsei', 'Ground', 'mythic', 'Naruto', {
    damage: 45,
    cost: [{ kind: 'discard', count: 2 }, { kind: 'mill', count: 2 }],
  }),
  atk('Bajrang Gun', 'Fighting', 'mythic', 'One Piece', {
    damage: 40,
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{ kind: 'destroy', what: 'armor' }],
  }),
  atk('Sanzen Sekai', 'Steel', 'mythic', 'One Piece', {
    damage: 30,
    cost: [{ kind: 'discard', count: 1 }, { kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'status', status: 'bleed', value: 8, turns: 3 }],
  }),
  atk('Décima Terceira Forma', 'Fire', 'mythic', 'Demon Slayer', {
    damage: 25,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'pierce' },
      {
        kind: 'conditional',
        if: { kind: 'playedThisTurn', filter: { element: 'Fire' } },
        then: [{ kind: 'bonus', mult: 2, label: 'Dança do Sol completa' }],
      },
    ],
  }),
  atk('Titã Colossal', 'Fire', 'mythic', 'Attack on Titan', {
    damage: 35,
    cost: [{ kind: 'payLife', amount: 20 }, { kind: 'mill', count: 2 }],
    effects: [{ kind: 'status', status: 'burn', value: 8, turns: 3 }],
  }),
  atk('Fuga', 'Fire', 'mythic', 'Jujutsu Kaisen', {
    damage: 30,
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{ kind: 'status', status: 'burn', value: 12, turns: 2 }, { kind: 'destroy', what: 'field' }],
  }),
  des('All For One', 'Dark', 'mythic', 'My Hero Academia', {
    cost: [{ kind: 'payLife', amount: 15 }],
    effects: [
      { kind: 'discardRandom', count: 2 },
      { kind: 'purge', what: 'modifiers', target: 'opponent' },
      { kind: 'draw', count: 2 },
    ],
  }),
  atk('Modo Demônio', 'Dark', 'mythic', 'Black Clover', {
    damage: 30,
    cost: [{ kind: 'discard', count: 1 }, { kind: 'payLife', amount: 10 }],
    effects: [
      { kind: 'pierce' },
      { kind: 'purge', what: 'all', target: 'opponent' },
      { kind: 'destroy', what: 'field' },
    ],
  }),
  cmp('Zanka no Tachi', 'Fire', 'mythic', 'Bleach', {
    passives: [
      { kind: 'attackBonus', match: { type: 'attack', element: 'Fire' }, add: 10, label: 'Zanka no Tachi' },
      { kind: 'onTurnStart', effects: [{ kind: 'damage', amount: 5 }] },
    ],
    effects: [{ kind: 'damage', amount: 20 }],
  }),
  atk('Gon Adulto', 'Fighting', 'mythic', 'Hunter x Hunter', {
    damage: 30,
    cost: [{ kind: 'payLife', amount: 20 }],
    effects: [{ kind: 'bonus', add: { per: 'lifeLost', each: 0.5 }, label: 'Tudo o que eu tenho' }],
  }),
  des('Ultra Ego', 'Dark', 'mythic', 'Dragon Ball', {
    cost: [{ kind: 'payLife', amount: 15 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack' }, add: 12, uses: 3, label: 'Ultra Ego' } }],
  }),
];

// ─── Lendárias ───────────────────────────────────────────────────────────────

const LENDARIAS: Entry[] = [
  atk('Kirin', 'Electric', 'legendary', 'Naruto', {
    damage: 30,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'pierce' },
      {
        kind: 'conditional',
        if: { kind: 'playedThisTurn', filter: { element: 'Fire' } },
        then: [{ kind: 'bonus', add: 15, label: 'Nuvens aquecidas' }],
      },
    ],
  }),
  des('Tsukuyomi Infinito', 'Dark', 'legendary', 'Naruto', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'lock', cardType: 'attack', turns: 1 },
      { kind: 'lock', cardType: 'challenger', turns: 1 },
      { kind: 'lock', cardType: 'equipment', turns: 1 },
      { kind: 'discardRandom', count: 1 },
    ],
  }),
  des('Kotoamatsukami', 'Dark', 'legendary', 'Naruto', {
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [
      { kind: 'purge', what: 'modifiers', target: 'opponent' },
      { kind: 'lock', cardType: 'trap', turns: 2 },
      { kind: 'draw', count: 2 },
    ],
  }),
  des('Izanagi', 'Ghost', 'legendary', 'Naruto', {
    cost: [{ kind: 'discard', count: 1 }, { kind: 'banish', count: 2 }],
    effects: [{ kind: 'heal', amount: { per: 'damageTaken', each: 1 } }, { kind: 'shield', count: 1 }],
  }),
  atk('Sessenta e Quatro Palmas', 'Fighting', 'legendary', 'Naruto', {
    damage: 8,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'damage', amount: 4 }, { kind: 'damage', amount: 4 }, { kind: 'damage', amount: 4 },
      { kind: 'damage', amount: 4 }, { kind: 'damage', amount: 4 }, { kind: 'damage', amount: 4 },
      { kind: 'lock', cardType: 'challenger', turns: 1 },
    ],
  }),
  atk('Kamui Raikiri', 'Electric', 'legendary', 'Naruto', {
    damage: 26,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'pierce' }],
  }),
  atk('Genki Dama', 'Flying', 'legendary', 'Dragon Ball', {
    damage: 20,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'bonus', add: { per: 'graveyard', each: 2, max: 30 }, label: 'Energia de todos' }],
  }),
  atk('Makankosappo', 'Dark', 'legendary', 'Dragon Ball', {
    damage: 30,
    cost: [{ kind: 'discard', count: 1 }, { kind: 'skipDraw' }],
    effects: [{ kind: 'pierce' }],
  }),
  atk('Red Hawk', 'Fire', 'legendary', 'One Piece', {
    damage: 28,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'burn', value: 6, turns: 2 }],
  }),
  atk('Kong Gun', 'Fighting', 'legendary', 'One Piece', {
    damage: 35,
    cost: [{ kind: 'discard', count: 1 }, { kind: 'payLife', amount: 10 }],
  }),
  des('Vasto Lorde', 'Dark', 'legendary', 'Bleach', {
    cost: [{ kind: 'payLife', amount: 15 }],
    effects: [
      { kind: 'purge', what: 'statuses' },
      { kind: 'addModifier', spec: { match: { type: 'attack' }, add: 15, uses: 2, label: 'Vasto Lorde' } },
    ],
  }),
  atk('Nona Forma: Rengoku', 'Fire', 'legendary', 'Demon Slayer', {
    damage: 32,
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{ kind: 'status', status: 'burn', value: 6, turns: 2 }],
  }),
  atk('Névoa Obscura', 'Flying', 'legendary', 'Demon Slayer', {
    damage: 22,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'draw', count: 2 }],
  }),
  des('Igris, o Cavaleiro de Sangue', 'Steel', 'legendary', 'Solo Leveling', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'shield', count: 1 },
      { kind: 'aura', turns: 3, label: 'Igris', effects: [{ kind: 'damage', amount: 10 }] },
    ],
  }),
  atk('Beru, o Rei Formiga', 'Poison', 'legendary', 'Solo Leveling', {
    damage: 26,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'poison', value: 6, turns: 3 }, { kind: 'lifesteal', ratio: 0.5 }],
  }),
  des('Meruem', 'Poison', 'legendary', 'Hunter x Hunter', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'damage', amount: 20 }, { kind: 'heal', amount: 20 }],
  }),
  atk('Ataque Giratório', 'Flying', 'legendary', 'Attack on Titan', {
    damage: 28,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'bleed', value: 6, turns: 2 }],
  }),
  atk('Titã de Ataque', 'Fighting', 'legendary', 'Attack on Titan', {
    damage: 30,
    cost: [{ kind: 'payLife', amount: 15 }],
    effects: [{ kind: 'destroy', what: 'armor' }],
  }),
  des('Predador', 'Water', 'legendary', 'Tensei Shitara Slime Datta Ken', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'purge', what: 'modifiers', target: 'opponent' },
      { kind: 'recover', count: 1, filter: { type: 'attack' } },
      { kind: 'draw', count: 1 },
    ],
  }),
  atk('Star Burst Stream', 'Steel', 'legendary', 'Sword Art Online', {
    damage: 10,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'damage', amount: 3 }, { kind: 'damage', amount: 3 }, { kind: 'damage', amount: 3 },
      { kind: 'damage', amount: 3 }, { kind: 'damage', amount: 3 }, { kind: 'damage', amount: 3 },
      { kind: 'damage', amount: 3 }, { kind: 'damage', amount: 3 },
    ],
  }),
];

// ─── Épicas ──────────────────────────────────────────────────────────────────

const EPICAS: Entry[] = [
  des('Leitura de Mentes', 'Ghost', 'epic', 'Spy x Family', {
    cost: [{ kind: 'skipDraw' }],
    effects: [{ kind: 'draw', count: 2 }, { kind: 'discardRandom', count: 1 }],
  }),
  des('Operação Strix', 'Steel', 'epic', 'Spy x Family', {
    effects: [
      { kind: 'destroy', what: 'trap' },
      { kind: 'destroy', what: 'trap' },
      { kind: 'lock', cardType: 'trap', turns: 2 },
      { kind: 'draw', count: 1 },
    ],
  }),
  atk('Punho Kaiju', 'Fighting', 'epic', 'Kaiju No. 8', {
    damage: 26,
    cost: [{ kind: 'payLife', amount: 8 }],
  }),
  atk('Turbo', 'Ghost', 'epic', 'Dandadan', {
    damage: 18,
    effects: [
      { kind: 'draw', count: 1 },
      {
        kind: 'conditional',
        if: { kind: 'playedThisTurn', filter: { element: 'Ghost' } },
        then: [{ kind: 'bonus', add: 10, label: 'Velocidade turbo' }],
      },
    ],
  }),
  arm('Assassino Aposentado', 'Steel', 'epic', 'Sakamoto Days', {
    trap: { trigger: 'opponentAttack', negate: true, effects: [{ kind: 'damage', amount: 10 }] },
  }),
  des('Himmel, o Herói', 'Steel', 'epic', 'Frieren', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'shield', count: 1 },
      { kind: 'heal', amount: 15 },
      { kind: 'addModifier', spec: { match: { type: 'attack' }, add: 8, label: 'Coragem do herói' } },
    ],
  }),
  atk('Punho Divergente', 'Fighting', 'epic', 'Jujutsu Kaisen', {
    damage: 16,
    effects: [{ kind: 'damage', amount: 10 }],
  }),
  atk('Howitzer Impact', 'Fire', 'epic', 'My Hero Academia', {
    damage: 24,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'burn', value: 4, turns: 2 }],
  }),
];

export const COLECAO_3: Entry[] = [...DESCONHECIDAS, ...MITICAS, ...LENDARIAS, ...EPICAS];
