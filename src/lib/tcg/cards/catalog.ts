/**
 * Catálogo oficial do TCG.
 *
 * Coleção 1 (este arquivo): as cartas da loja do WIT Dungeon 1 traduzidas.
 * Cada entrada guarda o nome que o item tinha na loja (`shop`), para migrar o
 * inventário dos alunos. Coleção 2 (`colecao2.ts`): cartas criadas para o TCG.
 * O texto das cartas NÃO é escrito aqui: sai de `describeCard`, a partir dos efeitos.
 *
 * Raridade = chance de sair no pacotinho, NÃO força. O equilíbrio vem do custo:
 * uma Rara forte cobra mais caro que uma Comum simples. A pirâmide alvo para
 * 300 cartas é 105 Comuns, 72 Incomuns, 54 Raras, 36 Épicas, 20 Lendárias,
 * 9 Míticas e 4 Desconhecidas.
 */

import type { CardDef } from '../types';
import { type Entry, fromShop } from './build';
import { COLECAO_2 } from './colecao2';

const atk = fromShop('attack');
const des = fromShop('challenger');
const eqp = fromShop('equipment');
const arm = fromShop('trap');
const cmp = fromShop('field');

// ─────────────────────────────────────────────────────────────────────────────
// ARMADURAS
// ─────────────────────────────────────────────────────────────────────────────

const ARMADURAS: Entry[] = [
  eqp('Manto da Aurora (Edição Premium)', 'Manto da Aurora', 'Ice', 'uncommon', null, {
    slot: 'armor',
    passives: [
      { kind: 'damageReduction', amount: 4, label: 'Manto da Aurora' },
      { kind: 'onTurnStart', effects: [{ kind: 'heal', amount: 3 }] },
    ],
  }),
  des('Pacto Demoníaco', 'Pacto Demoníaco', 'Dark', 'epic', 'Chainsaw Man', {
    cost: [{ kind: 'payLife', amount: 25 }],
    effects: [{ kind: 'shield', count: 2 }],
  }),
  des('Modo Sábio dos Seis Caminhos', 'Modo Sábio dos Seis Caminhos', 'Flying', 'legendary', 'Naruto', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'heal', amount: 30 },
      { kind: 'addModifier', spec: { match: { type: 'attack' }, mult: 1.5, uses: 3, label: 'Modo Sábio' } },
    ],
  }),
  eqp('Aegis Celestial (Edição Premium)', 'Aegis Celestial', 'Steel', 'rare', null, {
    slot: 'armor',
    passives: [{ kind: 'damageReduction', amount: 5, label: 'Aegis Celestial' }],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// ARMAMENTOS — comuns
// ─────────────────────────────────────────────────────────────────────────────

const ARMAMENTOS_COMUNS: Entry[] = [
  atk('Arthur’s Excalibur', 'Excalibur de Arthur', 'Electric', 'common', 'Fire Force', { damage: 12 }),
  atk('Berserker Rag', 'Fúria Berserker', 'Fighting', 'common', 'Berserk', {
    damage: 16,
    cost: [{ kind: 'payLife', amount: 4 }],
  }),
  eqp('BOTAS DE COURO', 'Botas de Couro', 'Ground', 'common', null, {
    slot: 'armor',
    passives: [{ kind: 'damageReduction', amount: 2, label: 'Botas de Couro' }],
    effects: [{ kind: 'draw', count: 1 }],
  }),
  atk('Cannon Arm', 'Braço-Canhão', 'Steel', 'common', 'Berserk', {
    damage: 8,
    effects: [{ kind: 'destroy', what: 'armor' }],
  }),
  atk('Dark Magician', 'Mago Negro', 'Dark', 'common', 'Yu-Gi-Oh!', {
    damage: 10,
    effects: [{
      kind: 'conditional',
      if: { kind: 'graveyardCount', min: 2, filter: { element: 'Dark' } },
      then: [{ kind: 'bonus', add: 6, label: 'Magia Negra' }],
    }],
  }),
  atk('Disaster', 'Disaster', 'Dark', 'common', 'Seven Deadly Sins', {
    damage: 8,
    effects: [{ kind: 'discardRandom', count: 1 }],
  }),
  atk('enma', 'Enma', 'Steel', 'common', 'One Piece', {
    damage: 12,
    effects: [{
      kind: 'conditional',
      if: { kind: 'lifeAtMost', amount: 90 },
      then: [{ kind: 'bonus', add: 6, label: 'Enma devora o Haki' }],
    }],
  }),
  des('Erasure', 'Apagar', 'Dark', 'common', 'My Hero Academia', {
    effects: [{ kind: 'purge', what: 'modifiers', target: 'opponent' }],
  }),
  atk('Explosion Rush', 'Explosion Rush', 'Fire', 'common', 'My Hero Academia', { damage: 12 }),
  atk('foice tripla', 'Foice Tripla', 'Steel', 'common', 'Naruto', {
    damage: 8,
    effects: [{ kind: 'status', status: 'bleed', value: 3, turns: 2 }],
  }),
  atk('gomu gomu no mi', 'Gomu Gomu no Mi', 'Fighting', 'common', 'One Piece', {
    damage: 10,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { element: 'Fighting' } },
      then: [{ kind: 'bonus', add: 8, label: 'Gear' }],
    }],
  }),
  atk('gura gura', 'Gura Gura no Mi', 'Ground', 'common', 'One Piece', {
    damage: 10,
    effects: [{ kind: 'destroy', what: 'trap' }],
  }),
  atk('Half-Cold Half-Hot', 'Metade Gelo, Metade Fogo', 'Ice', 'common', 'My Hero Academia', {
    damage: 10,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { element: 'Fire' } },
      then: [{ kind: 'bonus', add: 8, label: 'Lado quente' }],
    }],
  }),
  atk('Hamon Overdrive', 'Hamon Overdrive', 'Fire', 'common', 'JoJo', {
    damage: 10,
    effects: [{ kind: 'heal', amount: 4 }],
  }),
  des('Instant Transmission', 'Teletransporte', 'Flying', 'common', 'Dragon Ball', {
    effects: [{ kind: 'draw', count: 1 }],
  }),
  atk('Knight Killer', 'Matadora de Cavaleiros', 'Steel', 'common', 'Solo Leveling', { damage: 12 }),
  arm('Kurapika’s Chains', 'Correntes de Kurapika', 'Steel', 'common', 'Hunter x Hunter', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'damage', amount: 8 }] },
  }),
  cmp('Mana Zone', 'Zona de Mana', 'Flying', 'common', 'Black Clover', {
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Flying' }, add: 4, label: 'Zona de Mana' }],
  }),
  atk('mera mera', 'Mera Mera no Mi', 'Fire', 'common', 'One Piece', {
    damage: 8,
    effects: [{ kind: 'status', status: 'burn', value: 3, turns: 2 }],
  }),
  eqp('nichirin', 'Lâmina Nichirin', 'Steel', 'common', 'Demon Slayer', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack' }, add: 2, label: 'Nichirin' }],
  }),
  atk('Ora Barrage', 'Ora Ora Ora', 'Fighting', 'common', 'JoJo', { damage: 12 }),
  eqp('PEITORAL DE COURO', 'Peitoral de Couro', 'Ground', 'common', null, {
    slot: 'armor',
    passives: [{ kind: 'damageReduction', amount: 3, label: 'Peitoral de Couro' }],
  }),
  des('Predator Eye', 'Olho de Predador', 'Dark', 'common', 'Blue Lock', {
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack' }, add: 6, label: 'Olho de Predador' } }],
  }),
  arm('Puppet naruto', 'Marionete Venenosa', 'Poison', 'common', 'Naruto', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'status', status: 'poison', value: 3, turns: 3 }] },
  }),
  atk('Quick Attack', 'Ataque Rápido', 'Flying', 'common', 'Haikyuu!!', {
    damage: 8,
    effects: [{ kind: 'draw', count: 1 }],
  }),
  eqp('Quinque', 'Quinque', 'Dark', 'common', 'Tokyo Ghoul', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Dark' }, add: 4, label: 'Quinque' }],
  }),
  atk('Rinkaku Kagune', 'Kagune Rinkaku', 'Dark', 'common', 'Tokyo Ghoul', {
    damage: 10,
    effects: [{ kind: 'lifesteal', ratio: 0.5 }],
  }),
  atk('samehada', 'Samehada', 'Water', 'common', 'Naruto', {
    damage: 8,
    effects: [{ kind: 'lifesteal', ratio: 1 }],
  }),
  atk('Sekki', 'Sekki', 'Ghost', 'common', 'Noragami', { damage: 12 }),
  arm('Sharingan', 'Sharingan', 'Dark', 'common', 'Naruto', {
    trap: { trigger: 'opponentPlays', filter: { type: 'challenger' }, effects: [{ kind: 'draw', count: 1 }] },
  }),
  eqp('Staff of Frieren', 'Cajado de Frieren', 'Ice', 'common', 'Frieren', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Ice' }, add: 4, label: 'Cajado de Frieren' }],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// ARMAMENTOS — épicos
// ─────────────────────────────────────────────────────────────────────────────

const ARMAMENTOS_EPICOS: Entry[] = [
  atk('Baruka’s Dagger', 'Adaga de Baruka', 'Ice', 'rare', 'Solo Leveling', {
    damage: 20,
    effects: [{ kind: 'status', status: 'bleed', value: 4, turns: 3 }],
  }),
  atk('Black Divider', 'Black Divider', 'Dark', 'uncommon', 'Black Clover', {
    damage: 22,
    effects: [{ kind: 'destroy', what: 'trap' }],
  }),
  des('Chain Jail', 'Prisão de Correntes', 'Steel', 'rare', 'Hunter x Hunter', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'lock', cardType: 'challenger', turns: 2 }, { kind: 'draw', count: 1 }],
  }),
  des('Cursed Speech', 'Fala Amaldiçoada', 'Dark', 'rare', 'Jujutsu Kaisen', {
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'status', status: 'freeze', turns: 1 }, { kind: 'discardRandom', count: 1 }],
  }),
  atk('Fire Dragon Roar', 'Rugido do Dragão de Fogo', 'Fire', 'rare', 'Fairy Tail', {
    damage: 22,
    effects: [{ kind: 'status', status: 'burn', value: 4, turns: 2 }],
  }),
  atk('Golpe Conquistador', 'Golpe Conquistador', 'Fighting', 'rare', 'One Piece', {
    damage: 22,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'lock', cardType: 'attack', turns: 1 }],
  }),
  atk('Hinokami Kagura', 'Hinokami Kagura', 'Fire', 'epic', 'Demon Slayer', {
    damage: 16,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { element: 'Fire' } },
      then: [{ kind: 'bonus', mult: 2, label: 'Dança do Deus do Fogo' }],
    }],
  }),
  atk('Inverted Spear of Heaven', 'Lança Invertida do Céu', 'Steel', 'rare', 'Jujutsu Kaisen', {
    damage: 18,
    effects: [
      { kind: 'purge', what: 'modifiers', target: 'opponent' },
      { kind: 'destroy', what: 'field' },
    ],
  }),
  des('Kakuja Form', 'Forma Kakuja', 'Dark', 'uncommon', 'Tokyo Ghoul', {
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Dark' }, add: 10, uses: 2, label: 'Kakuja' } }],
  }),
  atk('Kasaka’s Venom Fang', 'Presa Venenosa de Kasaka', 'Poison', 'rare', 'Solo Leveling', {
    damage: 14,
    effects: [{ kind: 'status', status: 'poison', value: 5, turns: 3 }],
  }),
  atk('One For All Smash', 'Smash do One For All', 'Fighting', 'rare', 'My Hero Academia', {
    damage: 30,
    cost: [{ kind: 'payLife', amount: 10 }],
  }),
  eqp('Orb of Avarice', 'Orbe da Avareza', 'Dark', 'uncommon', 'Solo Leveling', {
    slot: 'weapon',
    cost: [{ kind: 'discard', count: 1 }],
    passives: [{ kind: 'attackBonus', match: { type: 'attack' }, add: 6, label: 'Orbe da Avareza' }],
  }),
  atk('Playful Cloud', 'Nuvem Brincalhona', 'Fighting', 'uncommon', 'Jujutsu Kaisen', {
    damage: 18,
    effects: [{ kind: 'bonus', add: { per: 'graveyard', filter: { element: 'Fighting' }, each: 2 }, label: 'Força bruta' }],
  }),
  arm('Prison Realm', 'Reino da Prisão', 'Ghost', 'epic', 'Jujutsu Kaisen', {
    trap: { trigger: 'opponentAttack', negate: true, effects: [{ kind: 'lock', cardType: 'attack', turns: 1 }] },
  }),
  atk('Punho de Ferro', 'Punho de Ferro', 'Fighting', 'uncommon', 'Vinland Saga', {
    damage: 14,
    effects: [{ kind: 'bonus', add: { per: 'graveyard', filter: { type: 'attack', element: 'Fighting' }, each: 6 }, label: 'O punho cresce' }],
  }),
  atk('Split Soul Katana', 'Katana Parte-Alma', 'Steel', 'epic', 'Jujutsu Kaisen', {
    damage: 20,
    effects: [{ kind: 'pierce' }],
  }),
  des('Ten Shadows', 'Dez Sombras', 'Dark', 'rare', 'Jujutsu Kaisen', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'aura', turns: 3, label: 'Shikigami', effects: [{ kind: 'damage', amount: 6 }] }],
  }),
  atk('Toque de Decadência', 'Toque de Decadência', 'Dark', 'rare', 'My Hero Academia', {
    damage: 16,
    effects: [{ kind: 'destroy', what: 'armor' }, { kind: 'destroy', what: 'weapon' }],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// ARMAMENTOS — lendários
// ─────────────────────────────────────────────────────────────────────────────

const ARMAMENTOS_LENDARIOS: Entry[] = [
  atk('Black Whip', 'Chicote Negro', 'Fighting', 'rare', 'My Hero Academia', {
    damage: 28,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'lock', cardType: 'equipment', turns: 2 }],
  }),
  des('Bungee Gum', 'Chiclete Elástico', 'Ghost', 'epic', 'Hunter x Hunter', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'addModifier', spec: { match: { type: 'attack' }, add: 10, uses: 2, label: 'Bungee Gum' } },
    ],
  }),
  eqp('Chastiefol', 'Chastiefol', 'Grass', 'rare', 'Seven Deadly Sins', {
    slot: 'weapon',
    cost: [{ kind: 'discard', count: 1 }],
    passives: [
      { kind: 'attackBonus', match: { type: 'attack', element: 'Grass' }, add: 6, label: 'Chastiefol' },
      { kind: 'onTurnStart', effects: [{ kind: 'heal', amount: 5 }] },
    ],
  }),
  atk('Death Scythe', 'Foice da Morte', 'Ghost', 'epic', 'Soul Eater', {
    damage: 25,
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [{
      kind: 'conditional',
      if: { kind: 'lifeAtMost', amount: 50, owner: 'opponent' },
      then: [{ kind: 'bonus', add: 40, label: 'Ceifar a alma' }],
    }],
  }),
  atk('Demon Sword Ragnarok', 'Espada Demoníaca Ragnarok', 'Dark', 'epic', 'Soul Eater', {
    damage: 24,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'lifesteal', ratio: 0.5 }, { kind: 'status', status: 'bleed', value: 6, turns: 3 }],
  }),
  atk('Dragon Slayer', 'Matadora de Dragões', 'Steel', 'legendary', 'Berserk', {
    damage: 40,
    cost: [{ kind: 'discard', count: 2 }],
  }),
  atk('Espírito da Besta', 'Espírito da Besta', 'Fighting', 'rare', 'Demon Slayer', {
    damage: 20,
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Fighting' }, add: 10, uses: 2, label: 'Respiração da Besta' } }],
  }),
  atk('Gáe Bolg', 'Gáe Bolg', 'Steel', 'epic', 'Fate/stay night', {
    damage: 30,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'pierce' }],
  }),
  atk('Gideon', 'Gideon', 'Ground', 'rare', 'Seven Deadly Sins', {
    damage: 28,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'destroy', what: 'armor' }],
  }),
  cmp('Hyorinmaru', 'Hyorinmaru', 'Ice', 'epic', 'Bleach', {
    passives: [
      { kind: 'attackBonus', match: { type: 'attack', element: 'Ice' }, add: 8, label: 'Hyorinmaru' },
      { kind: 'attackBonus', match: { type: 'attack', element: 'Fire' }, mult: 0.5, label: 'Gelo eterno' },
    ],
    effects: [{ kind: 'damage', amount: 10 }],
  }),
  des('Lostvayne', 'Lostvayne', 'Dark', 'epic', 'Seven Deadly Sins', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'aura', turns: 3, label: 'Clones de Lostvayne', effects: [{ kind: 'damage', amount: 10 }] }],
  }),
  atk('Mjolnir', 'Mjölnir', 'Electric', 'epic', 'Record of Ragnarok', {
    damage: 26,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{
      kind: 'conditional',
      if: { kind: 'lifeAtMost', amount: 90 },
      then: [{ kind: 'bonus', mult: 2, label: 'Digno' }],
    }],
  }),
  atk('Murasame', 'Murasame', 'Poison', 'epic', 'Akame ga Kill', {
    damage: 16,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      {
        kind: 'conditional',
        if: { kind: 'hasStatus', status: 'poison' },
        then: [{ kind: 'bonus', add: 16, label: 'Maldição da Morte' }],
      },
      { kind: 'status', status: 'poison', value: 6, turns: 3 },
    ],
  }),
  atk('Rhitta', 'Rhitta', 'Fire', 'epic', 'Seven Deadly Sins', {
    damage: 20,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'bonus', add: { per: 'round', each: 4, max: 32 }, label: 'Sol do Meio-Dia' }],
  }),
  atk('Senbonzakura', 'Senbonzakura', 'Grass', 'epic', 'Bleach', {
    damage: 16,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'bleed', value: 10, turns: 3 }],
  }),
  atk('tensa zanguetsu', 'Tensa Zangetsu', 'Dark', 'legendary', 'Bleach', {
    damage: 28,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{
      kind: 'conditional',
      if: { kind: 'lifeAtMost', amount: 60 },
      then: [{ kind: 'bonus', add: 30, label: 'Mugetsu' }],
    }],
  }),
  eqp('Volundr', 'Völundr', 'Fire', 'epic', 'Fate', {
    slot: 'weapon',
    cost: [{ kind: 'discard', count: 1 }],
    passives: [
      { kind: 'attackBonus', match: { type: 'attack' }, add: 4, label: 'Völundr' },
      { kind: 'damageReduction', amount: 3, label: 'Forja Divina' },
    ],
  }),
  atk('Z Sword', 'Espada Z', 'Steel', 'rare', 'Dragon Ball', {
    damage: 24,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'draw', count: 2 }],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// ARMAMENTOS — míticos
// ─────────────────────────────────────────────────────────────────────────────

const ARMAMENTOS_MITICOS: Entry[] = [
  eqp('Avalon', 'Avalon', 'Steel', 'legendary', 'Fate', {
    slot: 'armor',
    cost: [{ kind: 'discard', count: 2 }],
    passives: [
      { kind: 'damageReduction', amount: 8, label: 'Avalon' },
      { kind: 'onTurnStart', effects: [{ kind: 'heal', amount: 5 }] },
    ],
  }),
  atk('Dragon of the Darkness Flame', 'Dragão das Chamas Negras', 'Dark', 'epic', 'Yu Yu Hakusho', {
    damage: 35,
    cost: [{ kind: 'payLife', amount: 20 }],
    effects: [{ kind: 'status', status: 'burn', value: 8, turns: 3 }],
  }),
  atk('Excalibur', 'Excalibur', 'Steel', 'legendary', 'Fate', {
    damage: 40,
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{
      kind: 'conditional',
      if: { kind: 'lifeAtLeast', amount: 120 },
      then: [{ kind: 'bonus', add: 20, label: 'Julgamento do Rei' }],
    }],
  }),
  atk('Hollow Purple', 'Vazio Roxo', 'Ghost', 'mythic', 'Jujutsu Kaisen', {
    damage: 35,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'pierce' },
      {
        kind: 'conditional',
        if: { kind: 'playedThisTurn', filter: { element: 'Ghost' }, min: 2 },
        then: [{ kind: 'bonus', mult: 2, label: 'Azul + Vermelho' }],
      },
    ],
  }),
  atk('Kagune Liberado', 'Kagune Liberado', 'Dark', 'epic', 'Tokyo Ghoul', {
    damage: 30,
    cost: [{ kind: 'payLife', amount: 15 }],
    effects: [{ kind: 'status', status: 'bleed', value: 6, turns: 3 }, { kind: 'lifesteal', ratio: 0.5 }],
  }),
  arm('Kyoka Suigetsu', 'Kyoka Suigetsu', 'Dark', 'mythic', 'Bleach', {
    trap: { trigger: 'opponentPlays', negate: true, effects: [{ kind: 'shield', count: 2 }] },
  }),
  des('Limitless', 'Ilimitado', 'Ghost', 'legendary', 'Jujutsu Kaisen', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{ kind: 'shield', count: 3 }, { kind: 'damage', amount: 15 }],
  }),
  atk('Spirit Gun', 'Reigan', 'Ghost', 'legendary', 'Yu Yu Hakusho', {
    damage: 20,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'bonus', add: { per: 'damageTaken', each: 1, max: 60 }, label: 'Carga espiritual' }],
  }),
  des('Unlimited Blade Works', 'Unlimited Blade Works', 'Steel', 'mythic', 'Fate', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'aura', turns: 4, label: 'Mil lâminas', effects: [{ kind: 'damage', amount: 10 }] },
      { kind: 'addModifier', spec: { match: { type: 'attack', element: 'Steel' }, mult: 2, label: 'Trace On' } },
    ],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// ARMAMENTOS — raros e incomuns
// ─────────────────────────────────────────────────────────────────────────────

const ARMAMENTOS_RAROS: Entry[] = [
  atk('Adolla Burst', 'Adolla Burst', 'Fire', 'rare', 'Fire Force', {
    damage: 16,
    effects: [{ kind: 'status', status: 'burn', value: 3, turns: 2 }],
  }),
  eqp('Automail Blade', 'Lâmina de Automail', 'Steel', 'rare', 'Fullmetal Alchemist', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack' }, add: 3, label: 'Automail' }],
  }),
  atk('Benimaru’s Crimson Moon', 'Lua Carmesim de Benimaru', 'Fire', 'rare', 'Fire Force', {
    damage: 18,
    effects: [{
      kind: 'conditional',
      if: { kind: 'hasStatus', status: 'burn' },
      then: [{ kind: 'bonus', add: 8, label: 'Chamas carmesim' }],
    }],
  }),
  atk('Dark Shadow', 'Dark Shadow', 'Dark', 'rare', 'My Hero Academia', {
    damage: 14,
    effects: [{ kind: 'bonus', add: { per: 'graveyard', filter: { element: 'Dark' }, each: 3, max: 15 }, label: 'Cresce no escuro' }],
  }),
  atk('Dragon Cleave', 'Corte do Dragão', 'Fighting', 'rare', 'Hunter x Hunter', { damage: 20 }),
  eqp('Lâmina Estelar (Edição Premium)', 'Lâmina Estelar', 'Flying', 'rare', null, {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Flying' }, add: 5, label: 'Lâmina Estelar' }],
  }),
  atk('Skull Knight Sword', 'Espada do Cavaleiro da Caveira', 'Steel', 'rare', 'Berserk', {
    damage: 16,
    effects: [{ kind: 'status', status: 'bleed', value: 4, turns: 2 }],
  }),
];

const ARMAMENTOS_INCOMUNS: Entry[] = [
  des('Gon’s Fishing Rod', 'Vara de Pesca do Gon', 'Water', 'uncommon', 'Hunter x Hunter', {
    effects: [{ kind: 'recover', count: 1, filter: { type: 'attack' } }],
  }),
  atk('Hisoka’s Cards', 'Cartas do Hisoka', 'Flying', 'uncommon', 'Hunter x Hunter', {
    damage: 8,
    effects: [{ kind: 'bonus', add: { per: 'hand', each: 2, max: 12 }, label: 'Baralho na mão' }],
  }),
  eqp('Ignition Gloves', 'Luvas de Ignição', 'Fire', 'uncommon', 'Katekyo Hitman Reborn!', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Fire' }, add: 4, label: 'Luvas de Ignição' }],
  }),
  atk('Killua’s Yo-Yos', 'Ioiôs do Killua', 'Electric', 'uncommon', 'Hunter x Hunter', { damage: 15 }),
  atk('Kunai', 'Kunai', 'Steel', 'uncommon', 'Naruto', {
    damage: 10,
    effects: [{ kind: 'status', status: 'bleed', value: 3, turns: 2 }],
  }),
  atk('Kunai trovão', 'Kunai do Deus do Trovão', 'Electric', 'uncommon', 'Naruto', {
    damage: 10,
    effects: [{ kind: 'draw', count: 1 }],
  }),
  arm('Papel explosivo', 'Papel Explosivo', 'Fire', 'uncommon', 'Naruto', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'damage', amount: 12 }] },
  }),
  eqp('Power Pole', 'Bastão Mágico', 'Fighting', 'uncommon', 'Dragon Ball', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Fighting' }, add: 4, label: 'Bastão Mágico' }],
  }),
  atk('Thunder Spears', 'Lanças-Trovão', 'Electric', 'uncommon', 'Attack on Titan', {
    damage: 18,
    cost: [{ kind: 'mill', count: 1 }],
  }),
  atk('Ultrahard Steel Blades', 'Lâminas de Aço Ultraduro', 'Steel', 'uncommon', 'Attack on Titan', { damage: 15 }),
];

// ─────────────────────────────────────────────────────────────────────────────
// ARMAMENTOS — desconhecidos
// ─────────────────────────────────────────────────────────────────────────────

const ARMAMENTOS_DESCONHECIDOS: Entry[] = [
  des('Coordenadas do Titã Fundador', 'Coordenada', 'Ground', 'mythic', 'Attack on Titan', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'damage', amount: 20 },
      { kind: 'lock', cardType: 'attack', turns: 2 },
    ],
  }),
  atk('Enuma Elish', 'Enuma Elish', 'Flying', 'legendary', 'Fate', {
    damage: 50,
    cost: [{ kind: 'discard', count: 3 }],
    effects: [{ kind: 'pierce' }],
  }),
  des('Kamish', 'Kamish, o Dragão', 'Fire', 'mythic', 'Solo Leveling', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'status', status: 'burn', value: 6, turns: 3 },
      { kind: 'aura', turns: 4, label: 'Kamish ataca', effects: [{ kind: 'damage', amount: 12 }] },
    ],
  }),
  atk('Kamish’s Wrath', 'Fúria de Kamish', 'Fire', 'epic', 'Solo Leveling', {
    damage: 20,
    cost: [{ kind: 'discard', count: 2 }, { kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'bonus', add: { per: 'lifeLost', owner: 'opponent', each: 0.5 }, label: 'Aura do Monarca' }],
  }),
  des('Requiem', 'King Crimson', 'Dark', 'legendary', 'JoJo', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'heal', amount: { per: 'damageTaken', each: 1 } },
      { kind: 'purge', what: 'statuses' },
    ],
  }),
  arm('Return by Death', 'Retorno pela Morte', 'Ghost', 'unknown', 'Re:Zero', {
    trap: {
      trigger: 'opponentAttack',
      negate: true,
      condition: { kind: 'lifeAtMost', amount: 50 },
      effects: [{ kind: 'heal', amount: 50 }, { kind: 'draw', count: 2 }],
    },
  }),
  des('Time Leap', 'Time Leap', 'Electric', 'unknown', 'Steins;Gate', {
    cost: [{ kind: 'discard', count: 2 }, { kind: 'skipDraw' }],
    effects: [
      { kind: 'heal', amount: { per: 'damageTaken', each: 1 } },
      { kind: 'addModifier', spec: { match: { type: 'attack' }, mult: 2, label: 'El Psy Kongroo' } },
    ],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// COLEÇÃO
// ─────────────────────────────────────────────────────────────────────────────

const COLECAO: Entry[] = [
  des('Behelit', 'Behelit', 'Dark', 'common', 'Berserk', {
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'draw', count: 2 }],
  }),
  eqp('ESPADA SIMPLES', 'Espada Simples', 'Steel', 'common', null, {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Steel' }, add: 3, label: 'Espada Simples' }],
  }),
  atk('Espadinha', 'Espadinha', 'Steel', 'common', null, {
    damage: 10,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { type: 'equipment' } },
      then: [{ kind: 'bonus', add: 6, label: 'Recém-equipado' }],
    }],
  }),
  des('Fairy Tail Mark', 'Marca da Fairy Tail', 'Fire', 'common', 'Fairy Tail', {
    effects: [{ kind: 'heal', amount: 5 }, { kind: 'draw', count: 1 }],
  }),
  eqp('Metal Vessel', 'Recipiente de Metal', 'Electric', 'common', 'Magi', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Electric' }, add: 4, label: 'Recipiente de Metal' }],
  }),
  des('Millennium Puzzle', 'Enigma do Milênio', 'Dark', 'common', 'Yu-Gi-Oh!', {
    effects: [{ kind: 'draw', count: 2 }],
  }),
  atk('Pequena espada', 'Pequena Espada', 'Steel', 'common', null, {
    damage: 10,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { element: 'Steel' } },
      then: [{ kind: 'bonus', add: 6, label: 'Aço com aço' }],
    }],
  }),
  atk('Steel Balls', 'Esferas de Aço', 'Steel', 'common', 'JoJo', {
    damage: 10,
    effects: [{ kind: 'bonus', add: { per: 'graveyard', filter: { element: 'Steel' }, each: 2, max: 10 }, label: 'Rotação' }],
  }),
  eqp('Survey Corps cloak', 'Capa da Tropa de Exploração', 'Flying', 'common', 'Attack on Titan', {
    slot: 'armor',
    passives: [
      { kind: 'damageReduction', amount: 2, label: 'Capa' },
      { kind: 'attackBonus', match: { type: 'attack', element: 'Flying' }, add: 2, label: 'Asas da Liberdade' },
    ],
  }),
  des('Titan serum', 'Soro de Titã', 'Ground', 'common', 'Attack on Titan', {
    effects: [{ kind: 'heal', amount: 12 }],
  }),
  eqp('Berserker Armor', 'Armadura Berserker', 'Dark', 'legendary', 'Berserk', {
    slot: 'armor',
    cost: [{ kind: 'payLife', amount: 20 }],
    passives: [
      { kind: 'damageReduction', amount: 4, label: 'Armadura Berserker' },
      { kind: 'attackBonus', match: { type: 'attack' }, mult: 1.5, label: 'Fúria Berserker' },
      { kind: 'onTurnStart', effects: [{ kind: 'damage', amount: 4, target: 'self' }] },
    ],
  }),
  eqp('Coroa do Crepúsculo (Premium)', 'Coroa do Crepúsculo', 'Dark', 'rare', null, {
    slot: 'armor',
    passives: [
      { kind: 'damageReduction', amount: 3, label: 'Coroa do Crepúsculo' },
      { kind: 'onTurnStart', effects: [{ kind: 'heal', amount: 4 }] },
    ],
  }),
  des('Philosopher’s Stone', 'Pedra Filosofal', 'Fire', 'epic', 'Fullmetal Alchemist', {
    cost: [{ kind: 'banish', count: 3 }],
    effects: [{ kind: 'heal', amount: 40 }, { kind: 'purge', what: 'statuses' }],
  }),
  des('Potara Earrings', 'Brincos Potara', 'Flying', 'epic', 'Dragon Ball', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack' }, mult: 2, uses: 2, label: 'Fusão Potara' } }],
  }),
  des('Stand Arrow', 'Flecha do Stand', 'Ghost', 'rare', 'JoJo', {
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'aura', turns: 3, label: 'Stand desperto', effects: [{ kind: 'draw', count: 1 }, { kind: 'damage', amount: 6 }] }],
  }),
  des('Stone Mask', 'Máscara de Pedra', 'Dark', 'rare', 'JoJo', {
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [
      { kind: 'purge', what: 'statuses' },
      { kind: 'aura', turns: 5, label: 'Vampirismo', effects: [{ kind: 'heal', amount: 8 }] },
    ],
  }),
  des('Dragon Balls', 'Esferas do Dragão', 'Flying', 'legendary', 'Dragon Ball', {
    cost: [{ kind: 'banish', count: 5 }],
    effects: [{ kind: 'heal', amount: 50 }, { kind: 'draw', count: 2 }],
  }),
  des('Requiem Arrow', 'Flecha Requiem', 'Ghost', 'legendary', 'JoJo', {
    cost: [{ kind: 'discard', count: 2 }, { kind: 'payLife', amount: 15 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack' }, mult: 3, label: 'Requiem' } }],
  }),
  des('Dragon Lacrima', 'Lacrima de Dragão', 'Fire', 'rare', 'Fairy Tail', {
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Fire' }, add: 8, label: 'Lacrima de Dragão' } }],
  }),
  eqp('Erza’s Armors', 'Armaduras da Erza', 'Steel', 'rare', 'Fairy Tail', {
    slot: 'armor',
    passives: [{ kind: 'damageReduction', amount: 4, label: 'Armaduras da Erza' }],
  }),
  des('Mascara hollow', 'Máscara Hollow', 'Dark', 'rare', 'Bleach', {
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Dark' }, add: 12, label: 'Hollow' } }],
  }),
  eqp('ODM Gear', 'Equipamento 3D', 'Flying', 'uncommon', 'Attack on Titan', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Flying' }, add: 2, label: 'Equipamento 3D' }],
    effects: [{ kind: 'draw', count: 1 }],
  }),
  des('Scouter', 'Scouter', 'Electric', 'uncommon', 'Dragon Ball', {
    cost: [{ kind: 'skipDraw' }],
    effects: [{ kind: 'draw', count: 2 }],
  }),
  des('Senzu Bean', 'Semente dos Deuses', 'Grass', 'uncommon', 'Dragon Ball', {
    effects: [{ kind: 'heal', amount: 20 }, { kind: 'purge', what: 'statuses' }],
  }),
  eqp('State Alchemist Watch', 'Relógio de Alquimista Federal', 'Ground', 'uncommon', 'Fullmetal Alchemist', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Ground' }, add: 4, label: 'Alquimia' }],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// HABILIDADES
// ─────────────────────────────────────────────────────────────────────────────

const HABILIDADES: Entry[] = [
  // comuns
  des('Bloodlust', 'Sede de Sangue', 'Dark', 'common', 'Solo Leveling', {
    effects: [{ kind: 'discardRandom', count: 1 }],
  }),
  atk('Direct Shot', 'Chute Direto', 'Flying', 'common', 'Blue Lock', { damage: 12 }),
  atk('Ice Make', 'Ice Make', 'Ice', 'common', 'Fairy Tail', { damage: 12 }),
  atk('Jajanken', 'Jajanken', 'Fighting', 'common', 'Hunter x Hunter', {
    damage: 16,
    cost: [{ kind: 'discard', count: 1 }],
  }),
  des('Meta Vision', 'Meta Visão', 'Flying', 'common', 'Blue Lock', {
    effects: [
      { kind: 'draw', count: 1 },
      { kind: 'addModifier', spec: { match: { type: 'attack', element: 'Flying' }, add: 4, label: 'Meta Visão' } },
    ],
  }),
  des('Ruler’s Authority', 'Autoridade do Governante', 'Ghost', 'common', 'Solo Leveling', {
    effects: [{ kind: 'destroy', what: 'trap' }],
  }),
  des('Soul Resonance', 'Ressonância de Almas', 'Ghost', 'common', 'Soul Eater', {
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Ghost' }, add: 4, uses: 2, label: 'Ressonância' } }],
  }),
  arm('Stealth', 'Furtividade', 'Dark', 'common', 'Solo Leveling', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'shield', count: 1 }] },
  }),
  des('Titan Shift', 'Transformação em Titã', 'Ground', 'common', 'Attack on Titan', {
    cost: [{ kind: 'payLife', amount: 6 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Ground' }, add: 10, label: 'Titã' } }],
  }),
  atk('Water Breathing', 'Respiração da Água', 'Water', 'common', 'Demon Slayer', { damage: 12 }),

  // épicas
  atk('Anti-Magic Slash', 'Corte Antimagia', 'Dark', 'uncommon', 'Black Clover', {
    damage: 20,
    effects: [{ kind: 'destroy', what: 'field' }],
  }),
  atk('Black Flash', 'Black Flash', 'Fighting', 'epic', 'Jujutsu Kaisen', {
    damage: 14,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { element: 'Fighting' } },
      then: [{ kind: 'bonus', mult: 2.5, label: 'Faísca negra' }],
    }],
  }),
  des('Caixão das Estrelas', 'Caixão das Estrelas', 'Ghost', 'uncommon', 'Frieren', {
    effects: [{ kind: 'damage', amount: 15 }, { kind: 'purge', what: 'modifiers', target: 'opponent' }],
  }),
  atk('Cruel Sun', 'Sol Cruel', 'Fire', 'rare', 'Seven Deadly Sins', {
    damage: 22,
    effects: [{ kind: 'status', status: 'burn', value: 4, turns: 2 }],
  }),
  atk('Dimension Slash', 'Corte Dimensional', 'Dark', 'rare', 'Black Clover', {
    damage: 18,
    effects: [{ kind: 'pierce' }],
  }),
  des('Dragon Force', 'Dragon Force', 'Fire', 'uncommon', 'Fairy Tail', {
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Fire' }, add: 8, uses: 3, label: 'Dragon Force' } }],
  }),
  des('Equivalent Exchange', 'Troca Equivalente', 'Ground', 'uncommon', 'Fullmetal Alchemist', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'draw', count: 3 }],
  }),
  atk('Final Flash', 'Final Flash', 'Electric', 'epic', 'Dragon Ball', {
    damage: 30,
    cost: [{ kind: 'skipDraw' }],
  }),
  atk('Flame Alchemy', 'Alquimia das Chamas', 'Fire', 'uncommon', 'Fullmetal Alchemist', {
    damage: 18,
    effects: [{ kind: 'status', status: 'burn', value: 5, turns: 3 }],
  }),
  atk('Fogo Infernal', 'Fogo Infernal', 'Fire', 'epic', 'Mushoku Tensei', {
    damage: 16,
    effects: [
      { kind: 'status', status: 'burn', value: 8, turns: 3 },
      { kind: 'status', status: 'burn', value: 3, turns: 2, target: 'self' },
    ],
  }),
  arm('Full Counter', 'Full Counter', 'Dark', 'epic', 'Seven Deadly Sins', {
    cost: [{ kind: 'discard', count: 1 }],
    trap: { trigger: 'opponentAttack', reflect: true },
  }),
  des('Godspeed', 'Velocidade Divina', 'Electric', 'rare', 'Hunter x Hunter', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'shield', count: 1 },
      { kind: 'addModifier', spec: { match: { type: 'attack', element: 'Electric' }, add: 8, label: 'Velocidade Divina' } },
    ],
  }),
  des('Kaioken', 'Kaioken', 'Fighting', 'epic', 'Dragon Ball', {
    cost: [{ kind: 'payLife', amount: 15 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack' }, mult: 2, label: 'Kaioken' } }],
  }),
  atk('Kamehameha', 'Kamehameha', 'Water', 'epic', 'Dragon Ball', {
    damage: 25,
    cost: [{ kind: 'discard', count: 1 }],
  }),
  atk('Magia de Roswaal', 'Magia de Roswaal', 'Fire', 'uncommon', 'Re:Zero', {
    damage: 18,
    effects: [{
      kind: 'conditional',
      if: { kind: 'lifeAtLeast', amount: 120 },
      then: [{ kind: 'bonus', add: 18, label: 'Mana transbordando' }],
    }],
  }),
  des('Ope Ope no Mi (ROOM)', 'ROOM', 'Ghost', 'uncommon', 'One Piece', {
    effects: [{ kind: 'destroy', what: 'trap' }, { kind: 'destroy', what: 'trap' }, { kind: 'draw', count: 1 }],
  }),
  eqp('Orbe Cromático (Edição Premium)', 'Orbe Cromático', 'Electric', 'uncommon', null, {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack' }, add: 3, label: 'Orbe Cromático' }],
    effects: [{ kind: 'draw', count: 1 }],
  }),
  des('Rugido do Titã Fundador', 'Rugido do Titã Fundador', 'Ground', 'epic', 'Attack on Titan', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'damage', amount: 12 },
      { kind: 'lock', cardType: 'attack', turns: 1 },
      { kind: 'heal', amount: 15 },
    ],
  }),
  des('Shadow Extraction', 'Extração de Sombras', 'Dark', 'rare', 'Solo Leveling', {
    cost: [{ kind: 'payLife', amount: 10 }],
    effects: [{ kind: 'recover', count: 2, filter: { type: 'attack' } }],
  }),
  des('Soul Switch', 'Troca de Almas', 'Ghost', 'epic', 'Jujutsu Kaisen', {
    cost: [{ kind: 'discard', count: 2 }, { kind: 'mill', count: 2 }, { kind: 'skipDraw' }],
    effects: [{ kind: 'swapLife' }],
  }),
  atk('Thunderclap and Flash', 'Primeira Forma: Relâmpago', 'Electric', 'rare', 'Demon Slayer', {
    damage: 24,
    cost: [{ kind: 'mill', count: 1 }],
  }),

  // lendárias
  atk('Big Bang Attack', 'Big Bang Attack', 'Electric', 'legendary', 'Dragon Ball', {
    damage: 20,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'bonus', add: { per: 'round', each: 5, max: 40 }, label: 'Orgulho Saiyajin' }],
  }),
  des('Edo Tensei', 'Edo Tensei', 'Ghost', 'epic', 'Naruto', {
    cost: [{ kind: 'banish', count: 2 }],
    effects: [{ kind: 'aura', turns: 4, label: 'Reanimados', effects: [{ kind: 'damage', amount: 8 }] }],
  }),
  des('Jaula de Espinhos', 'Jaula de Espinhos', 'Grass', 'epic', 'Frieren', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'lock', cardType: 'attack', turns: 1 },
      { kind: 'status', status: 'bleed', value: 6, turns: 3 },
    ],
  }),
  des('O Avatar', 'Estado Avatar', 'Flying', 'rare', 'Avatar', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack' }, add: 6, uses: 4, label: 'Estado Avatar' } }],
  }),

  // míticas
  atk('Contrato com o Diabo', 'Contrato com o Diabo', 'Dark', 'legendary', 'Chainsaw Man', {
    damage: 70,
    cost: [{ kind: 'payLife', amount: 40 }],
  }),
  cmp('Domain Expansion', 'Expansão de Domínio', 'Ghost', 'mythic', 'Jujutsu Kaisen', {
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Ghost' }, mult: 1.5, label: 'Domínio' }],
    effects: [{ kind: 'damage', amount: 20 }],
  }),
  des('Haki do Rei Conquistador', 'Haki do Rei', 'Fighting', 'legendary', 'One Piece', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'damage', amount: 25 },
      { kind: 'lock', cardType: 'attack', turns: 1 },
      { kind: 'lock', cardType: 'challenger', turns: 1 },
    ],
  }),
  atk('Zoltraak', 'Zoltraak', 'Dark', 'legendary', 'Frieren', {
    damage: 30,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'pierce' }, { kind: 'destroy', what: 'armor' }],
  }),

  // rara
  cmp('Campo de Hidratação', 'Campo de Hidratação', 'Water', 'rare', 'Demon Slayer', {
    passives: [
      { kind: 'attackBonus', match: { type: 'attack', element: 'Water' }, add: 4, label: 'Campo de Hidratação' },
      { kind: 'onTurnStart', effects: [{ kind: 'heal', amount: 3 }] },
    ],
  }),

  // desconhecidas
  des('Geass Eye', 'Olho do Geass', 'Dark', 'mythic', 'Code Geass', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'discardRandom', count: 2 },
      { kind: 'lock', cardType: 'attack', turns: 1 },
    ],
  }),
  atk('Modo 100%', 'Modo 100%', 'Ghost', 'unknown', 'Mob Psycho 100', {
    damage: 10,
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{ kind: 'bonus', add: { per: 'lifeLost', each: 1 }, label: '100%' }],
  }),
  des('Time Stop', 'Za Warudo', 'Steel', 'unknown', 'JoJo', {
    cost: [{ kind: 'discard', count: 3 }],
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'damage', amount: 10 },
      { kind: 'damage', amount: 10 },
      { kind: 'damage', amount: 10 },
      { kind: 'lock', cardType: 'attack', turns: 2 },
    ],
  }),
  des('Ultra Instinct', 'Instinto Superior', 'Flying', 'mythic', 'Dragon Ball', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [
      { kind: 'shield', count: 1 },
      { kind: 'aura', turns: 4, label: 'Esquiva automática', effects: [{ kind: 'shield', count: 1 }] },
    ],
  }),

  // token
  eqp('Selo do Vazio (Premium)', 'Selo do Vazio', 'Ghost', 'rare', null, {
    slot: 'armor',
    passives: [
      { kind: 'damageReduction', amount: 3, label: 'Selo do Vazio' },
      { kind: 'attackBonus', match: { type: 'attack' }, add: 3, label: 'Vazio' },
    ],
  }),
];

const ENTRIES: Entry[] = [
  ...ARMADURAS,
  ...ARMAMENTOS_COMUNS,
  ...ARMAMENTOS_EPICOS,
  ...ARMAMENTOS_LENDARIOS,
  ...ARMAMENTOS_MITICOS,
  ...ARMAMENTOS_RAROS,
  ...ARMAMENTOS_INCOMUNS,
  ...ARMAMENTOS_DESCONHECIDOS,
  ...COLECAO,
  ...HABILIDADES,
  ...COLECAO_2,
];

/** Todas as cartas oficiais. */
export const CATALOG: readonly CardDef[] = ENTRIES.map(e => e.card);

/** Carta pelo id. */
export const CARD_BY_ID: ReadonlyMap<string, CardDef> = new Map(CATALOG.map(c => [c.id, c]));

/** Nome do item na loja antiga → id da carta nova. Para migrar inventários e arte. */
export const CARD_ID_BY_SHOP_NAME: ReadonlyMap<string, string> = new Map(
  ENTRIES.flatMap(e => (e.shop ? [[e.shop, e.card.id] as const] : [])),
);
