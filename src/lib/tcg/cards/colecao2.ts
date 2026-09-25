/**
 * Coleção 2: 126 cartas criadas direto para o TCG.
 *
 * Objetivo desta coleção:
 *  - completar a pirâmide de raridade (a maioria é Comum e Incomum);
 *  - dar cartas aos elementos que quase não tinham (Água, Planta, Veneno,
 *    Gelo, Terra), para todo aluno montar um deck do próprio elemento.
 *
 * Identidade de cada elemento, que guia o desenho das cartas:
 *   Água: cura e compra · Planta: sustento e escudo · Veneno: dano que acumula
 *   Gelo: congelar e travar · Terra: armadura e destruir equipamento
 *   Elétrico: velocidade e combo no turno · Vento: compra e ritmo
 *   Luta: dano bruto e combo de Luta · Fogo: queimadura e bônus de dano
 *   Fantasma: cemitério · Aço: equipamento · Sombra: tirar cartas do inimigo
 */

import { original, type Entry } from './build';

const atk = original('attack');
const des = original('challenger');
const eqp = original('equipment');
const arm = original('trap');
const cmp = original('field');

// ─── ÁGUA ────────────────────────────────────────────────────────────────────

const AGUA: Entry[] = [
  atk("Roda d'Água", 'Water', 'common', 'Demon Slayer', { damage: 12 }),
  atk('Tiro de Tubarão', 'Water', 'common', 'One Piece', {
    damage: 10,
    effects: [{ kind: 'heal', amount: 3 }],
  }),
  atk("Chicote d'Água", 'Water', 'common', 'Avatar', {
    damage: 8,
    effects: [{ kind: 'draw', count: 1 }],
  }),
  des('Chá do Tio Iroh', 'Water', 'common', 'Avatar', {
    effects: [{ kind: 'heal', amount: 10 }],
  }),
  arm('Hidrificação', 'Water', 'common', 'Naruto', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'heal', amount: 10 }] },
  }),
  eqp('Guarda-Chuva do Totoro', 'Water', 'common', 'My Neighbor Totoro', {
    slot: 'armor',
    passives: [
      { kind: 'damageReduction', amount: 2, label: 'Guarda-Chuva' },
      { kind: 'onTurnStart', effects: [{ kind: 'heal', amount: 2 }] },
    ],
  }),
  des('Mestre Urokodaki', 'Water', 'common', 'Demon Slayer', {
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Water' }, add: 6, label: 'Treino de Urokodaki' } }],
  }),
  cmp('Chuva Constante', 'Water', 'common', 'Weathering With You', {
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Water' }, add: 3, label: 'Chuva Constante' }],
  }),
  atk("Dragão d'Água", 'Water', 'uncommon', 'Naruto', { damage: 16 }),
  atk('Karatê Tritão', 'Water', 'uncommon', 'One Piece', {
    damage: 12,
    effects: [{ kind: 'pierce' }],
  }),
  des('Prisão de Água', 'Water', 'uncommon', 'Naruto', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'freeze', turns: 1 }],
  }),
  arm('Calmaria', 'Water', 'uncommon', 'Demon Slayer', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'shield', count: 1 }, { kind: 'draw', count: 1 }] },
  }),
  eqp('Clima-Tact', 'Water', 'uncommon', 'One Piece', {
    slot: 'weapon',
    passives: [
      { kind: 'attackBonus', match: { type: 'attack', element: 'Water' }, add: 3, label: 'Clima-Tact' },
      { kind: 'attackBonus', match: { type: 'attack', element: 'Electric' }, add: 3, label: 'Clima-Tact' },
    ],
  }),
  cmp('Grand Line', 'Water', 'uncommon', 'One Piece', {
    passives: [
      { kind: 'attackBonus', match: { type: 'attack', element: 'Water' }, add: 4, label: 'Grand Line' },
      { kind: 'onTurnStart', effects: [{ kind: 'heal', amount: 2 }] },
    ],
  }),
  atk('Cinco Tubarões Famintos', 'Water', 'rare', 'Naruto', {
    damage: 18,
    effects: [{ kind: 'lifesteal', ratio: 0.5 }],
  }),
  des('Bênção da Água Sagrada', 'Water', 'rare', 'Konosuba', {
    effects: [{ kind: 'heal', amount: 20 }, { kind: 'purge', what: 'statuses' }],
  }),
  arm('Contracorrente', 'Water', 'rare', 'Avatar', {
    trap: { trigger: 'opponentAttack', negate: true, effects: [{ kind: 'heal', amount: 8 }] },
  }),
  atk('Mil Tubarões', 'Water', 'epic', 'Naruto', {
    damage: 22,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'lifesteal', ratio: 0.5 }, { kind: 'draw', count: 1 }],
  }),
  atk('Buraikan', 'Water', 'legendary', 'One Piece', {
    damage: 28,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'pierce' }, { kind: 'heal', amount: 10 }],
  }),
];

// ─── PLANTA ──────────────────────────────────────────────────────────────────

const PLANTA: Entry[] = [
  atk('Estrela Verde', 'Grass', 'common', 'One Piece', { damage: 12 }),
  atk('Lança de Madeira', 'Grass', 'common', 'Dr. Stone', {
    damage: 8,
    effects: [{ kind: 'heal', amount: 5 }],
  }),
  des('Erva Medicinal', 'Grass', 'common', null, {
    effects: [{ kind: 'heal', amount: 8 }, { kind: 'purge', what: 'statuses' }],
  }),
  des('Kodama', 'Grass', 'common', 'Princess Mononoke', {
    effects: [{ kind: 'draw', count: 1 }, { kind: 'heal', amount: 4 }],
  }),
  eqp('Estilingue Kabuto', 'Grass', 'common', 'One Piece', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Grass' }, add: 3, label: 'Kabuto' }],
  }),
  eqp('Armadura de Madeira', 'Grass', 'common', null, {
    slot: 'armor',
    passives: [{ kind: 'damageReduction', amount: 3, label: 'Armadura de Madeira' }],
  }),
  arm('Raízes Presas', 'Grass', 'common', 'Princess Mononoke', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'damage', amount: 6 }, { kind: 'heal', amount: 6 }] },
  }),
  cmp('Floresta Densa', 'Grass', 'common', 'Princess Mononoke', {
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Grass' }, add: 4, label: 'Floresta Densa' }],
  }),
  atk('Floresta Nativa', 'Grass', 'uncommon', null, {
    damage: 14,
    effects: [{ kind: 'heal', amount: 4 }],
  }),
  atk('Chicote de Videira', 'Grass', 'uncommon', 'Black Clover', {
    damage: 12,
    effects: [{ kind: 'destroy', what: 'weapon' }],
  }),
  des('Árvore Mundial', 'Grass', 'uncommon', 'Black Clover', {
    effects: [{ kind: 'aura', turns: 3, label: 'Árvore Mundial', effects: [{ kind: 'heal', amount: 5 }] }],
  }),
  des('Pólen Sonífero', 'Grass', 'uncommon', 'Frieren', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'freeze', turns: 1 }],
  }),
  arm('Planta Carnívora', 'Grass', 'uncommon', 'One Piece', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'damage', amount: 10 }, { kind: 'heal', amount: 5 }] },
  }),
  eqp('Espada de Madeira', 'Grass', 'uncommon', 'Gintama', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack' }, add: 3, label: 'Espada de Madeira' }],
  }),
  cmp('Campo de Flores', 'Grass', 'uncommon', 'Frieren', {
    passives: [
      { kind: 'attackBonus', match: { type: 'attack', element: 'Grass' }, add: 3, label: 'Campo de Flores' },
      { kind: 'onTurnStart', effects: [{ kind: 'heal', amount: 3 }] },
    ],
  }),
  atk('Nascimento das Árvores', 'Grass', 'rare', 'Naruto', {
    damage: 18,
    effects: [{ kind: 'heal', amount: 8 }],
  }),
  des('Modo Sábio dos Sapos', 'Grass', 'rare', 'Naruto', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'heal', amount: 10 },
      { kind: 'addModifier', spec: { match: { type: 'attack' }, add: 8, uses: 2, label: 'Energia Natural' } },
    ],
  }),
  des('Espírito da Floresta', 'Grass', 'epic', 'Princess Mononoke', {
    cost: [{ kind: 'banish', count: 2 }],
    effects: [
      { kind: 'heal', amount: 20 },
      { kind: 'aura', turns: 3, label: 'Floresta viva', effects: [{ kind: 'heal', amount: 5 }] },
    ],
  }),
  atk('Buda de Mil Mãos', 'Grass', 'legendary', 'Naruto', {
    damage: 30,
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{ kind: 'shield', count: 1 }, { kind: 'heal', amount: 10 }],
  }),
];

// ─── VENENO ──────────────────────────────────────────────────────────────────

const VENENO: Entry[] = [
  atk('Ferrão de Borboleta', 'Poison', 'common', 'Demon Slayer', {
    damage: 8,
    effects: [{ kind: 'status', status: 'poison', value: 3, turns: 2 }],
  }),
  atk('Picada de Vespa', 'Poison', 'common', null, {
    damage: 8,
    effects: [{ kind: 'status', status: 'poison', value: 2, turns: 3 }],
  }),
  atk('Ferroada de Escorpião', 'Poison', 'common', null, { damage: 12 }),
  des('Bomba de Gás', 'Poison', 'common', 'My Hero Academia', {
    effects: [{ kind: 'status', status: 'poison', value: 4, turns: 2 }],
  }),
  des('Antídoto', 'Poison', 'common', 'Dr. Stone', {
    effects: [{ kind: 'purge', what: 'statuses' }, { kind: 'heal', amount: 5 }],
  }),
  arm('Nuvem Tóxica', 'Poison', 'common', null, {
    trap: { trigger: 'opponentPlays', filter: { type: 'challenger' }, effects: [{ kind: 'status', status: 'poison', value: 3, turns: 2 }] },
  }),
  eqp('Adaga Envenenada', 'Poison', 'common', null, {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Poison' }, add: 3, label: 'Adaga Envenenada' }],
  }),
  cmp('Pântano Venenoso', 'Poison', 'common', null, {
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Poison' }, add: 3, label: 'Pântano' }],
  }),
  atk('Hidra', 'Poison', 'uncommon', 'One Piece', {
    damage: 12,
    effects: [{ kind: 'status', status: 'poison', value: 4, turns: 3 }],
  }),
  atk('Ashisogi Jizō', 'Poison', 'uncommon', 'Bleach', {
    damage: 10,
    effects: [{
      kind: 'conditional',
      if: { kind: 'hasStatus', status: 'poison' },
      then: [{ kind: 'bonus', add: 10, label: 'Veneno no sangue' }],
    }],
  }),
  des('Veneno de Glicínia', 'Poison', 'uncommon', 'Demon Slayer', {
    cost: [{ kind: 'payLife', amount: 5 }],
    effects: [{ kind: 'status', status: 'poison', value: 5, turns: 3 }],
  }),
  arm('Salamandra Venenosa', 'Poison', 'uncommon', 'Naruto', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'damage', amount: 4 }, { kind: 'status', status: 'poison', value: 5, turns: 3 }] },
  }),
  eqp('Máscara de Gás', 'Poison', 'uncommon', 'Dr. Stone', {
    slot: 'armor',
    passives: [{ kind: 'damageReduction', amount: 2, label: 'Máscara de Gás' }],
    effects: [{ kind: 'purge', what: 'statuses' }],
  }),
  des('Sangue Tóxico', 'Poison', 'uncommon', 'Jujutsu Kaisen', {
    cost: [{ kind: 'payLife', amount: 5 }],
    effects: [
      { kind: 'status', status: 'poison', value: 3, turns: 3 },
      { kind: 'status', status: 'bleed', value: 3, turns: 3 },
    ],
  }),
  atk('Demônio do Veneno', 'Poison', 'rare', 'One Piece', {
    damage: 16,
    cost: [{ kind: 'payLife', amount: 8 }],
    effects: [{ kind: 'status', status: 'poison', value: 5, turns: 3 }],
  }),
  atk('Mil Insetos', 'Poison', 'rare', 'Naruto', {
    damage: 10,
    effects: [{ kind: 'bonus', add: { per: 'graveyard', filter: { element: 'Poison' }, each: 3, max: 15 }, label: 'Enxame' }],
  }),
  des('Veneno Paralisante', 'Poison', 'rare', 'Naruto', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'status', status: 'freeze', turns: 1 },
      { kind: 'status', status: 'poison', value: 4, turns: 2 },
    ],
  }),
  atk('Konjiki Ashisogi Jizō', 'Poison', 'epic', 'Bleach', {
    damage: 16,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      {
        kind: 'conditional',
        if: { kind: 'hasStatus', status: 'poison' },
        then: [{ kind: 'bonus', mult: 2, label: 'Bankai venenoso' }],
      },
      { kind: 'status', status: 'poison', value: 6, turns: 3 },
    ],
  }),
];

// ─── GELO ────────────────────────────────────────────────────────────────────

const GELO: Entry[] = [
  atk('Estacas de Gelo', 'Ice', 'common', 'Re:Zero', { damage: 12 }),
  atk('Ice Make: Águia', 'Ice', 'common', 'Fairy Tail', {
    damage: 10,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { element: 'Ice' } },
      then: [{ kind: 'bonus', add: 6, label: 'Revoada de gelo' }],
    }],
  }),
  atk('Bola de Neve', 'Ice', 'common', 'Re:Zero', {
    damage: 10,
    effects: [{ kind: 'lock', cardType: 'equipment', turns: 1 }],
  }),
  des('Barreira de Gelo', 'Ice', 'common', 'Avatar', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'shield', count: 1 }],
  }),
  eqp('Espada de Cristal de Gelo', 'Ice', 'common', null, {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Ice' }, add: 3, label: 'Cristal de Gelo' }],
  }),
  eqp('Armadura de Gelo', 'Ice', 'common', 'Fairy Tail', {
    slot: 'armor',
    passives: [{ kind: 'damageReduction', amount: 3, label: 'Armadura de Gelo' }],
  }),
  cmp('Tundra', 'Ice', 'common', null, {
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Ice' }, add: 3, label: 'Tundra' }],
  }),
  atk('Partisan de Gelo', 'Ice', 'uncommon', 'One Piece', {
    damage: 12,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'freeze', turns: 1 }],
  }),
  atk('Primeira Dança: Tsukishiro', 'Ice', 'uncommon', 'Bleach', { damage: 15 }),
  des('Puck, o Espírito', 'Ice', 'uncommon', 'Re:Zero', {
    effects: [{ kind: 'aura', turns: 3, label: 'Puck', effects: [{ kind: 'damage', amount: 5 }] }],
  }),
  arm('Espelhos de Gelo', 'Ice', 'uncommon', 'Naruto', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'shield', count: 1 }, { kind: 'damage', amount: 5 }] },
  }),
  cmp('Era Glacial', 'Ice', 'uncommon', 'One Piece', {
    passives: [
      { kind: 'attackBonus', match: { type: 'attack', element: 'Ice' }, add: 3, label: 'Era Glacial' },
      { kind: 'attackBonus', match: { type: 'attack', element: 'Fire' }, mult: 0.5, label: 'Frio extremo' },
    ],
  }),
  atk('Lótus de Gelo', 'Ice', 'rare', 'Demon Slayer', {
    damage: 16,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'freeze', turns: 1 }],
  }),
  des('Formação de Gelo', 'Ice', 'rare', 'Jujutsu Kaisen', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'lock', cardType: 'attack', turns: 1 },
      { kind: 'lock', cardType: 'challenger', turns: 1 },
    ],
  }),
  atk('Hakka no Togame', 'Ice', 'epic', 'Bleach', {
    damage: 22,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'freeze', turns: 1 }],
  }),
  des('Ice Age', 'Ice', 'legendary', 'One Piece', {
    cost: [{ kind: 'discard', count: 2 }],
    effects: [{ kind: 'damage', amount: 20 }, { kind: 'status', status: 'freeze', turns: 2 }],
  }),
];

// ─── TERRA ───────────────────────────────────────────────────────────────────

const TERRA: Entry[] = [
  atk('Caixão de Areia', 'Ground', 'common', 'Naruto', { damage: 12 }),
  des('Muralha de Pedra', 'Ground', 'common', 'Avatar', {
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'shield', count: 1 }],
  }),
  atk('Punho de Rocha', 'Ground', 'common', 'Fairy Tail', {
    damage: 10,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { element: 'Ground' } },
      then: [{ kind: 'bonus', add: 6, label: 'Rocha sobre rocha' }],
    }],
  }),
  eqp('Cabaça de Areia', 'Ground', 'common', 'Naruto', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Ground' }, add: 3, label: 'Cabaça de Areia' }],
  }),
  arm('Areia Movediça', 'Ground', 'common', 'One Piece', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'damage', amount: 4 }, { kind: 'lock', cardType: 'equipment', turns: 2 }] },
  }),
  cmp('Deserto', 'Ground', 'common', 'One Piece', {
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Ground' }, add: 4, label: 'Deserto' }],
  }),
  atk('Sables', 'Ground', 'uncommon', 'One Piece', {
    damage: 12,
    effects: [{ kind: 'destroy', what: 'trap' }],
  }),
  atk('Espinhos de Pedra', 'Ground', 'uncommon', 'Fullmetal Alchemist', { damage: 16 }),
  des('Inquebrável', 'Ground', 'uncommon', 'My Hero Academia', {
    cost: [{ kind: 'payLife', amount: 8 }],
    effects: [{ kind: 'shield', count: 2 }],
  }),
  eqp('Couraça do Titã Encouraçado', 'Ground', 'uncommon', 'Attack on Titan', {
    slot: 'armor',
    cost: [{ kind: 'discard', count: 1 }],
    passives: [{ kind: 'damageReduction', amount: 4, label: 'Titã Encouraçado' }],
  }),
  atk('Machado e Mangual', 'Ground', 'rare', 'Demon Slayer', {
    damage: 20,
    effects: [{ kind: 'destroy', what: 'armor' }],
  }),
  des('Alquimia Artística', 'Ground', 'rare', 'Fullmetal Alchemist', {
    effects: [{ kind: 'damage', amount: 12 }, { kind: 'shield', count: 1 }],
  }),
  atk('Funeral do Deserto', 'Ground', 'epic', 'Naruto', {
    damage: 24,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'destroy', what: 'armor' }],
  }),
];

// ─── ELÉTRICO ────────────────────────────────────────────────────────────────

const ELETRICO: Entry[] = [
  atk('Descarga de Um Milhão de Volts', 'Electric', 'common', 'My Hero Academia', { damage: 12 }),
  atk('Chidori Senbon', 'Electric', 'common', 'Naruto', {
    damage: 8,
    effects: [{ kind: 'draw', count: 1 }],
  }),
  des('Bateria Caseira', 'Electric', 'common', 'Dr. Stone', {
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Electric' }, add: 6, label: 'Bateria' } }],
  }),
  eqp('Bastão Dourado', 'Electric', 'common', 'One Piece', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Electric' }, add: 3, label: 'Bastão Dourado' }],
  }),
  atk('Chidori', 'Electric', 'rare', 'Naruto', { damage: 16 }),
  atk('Raikiri', 'Electric', 'uncommon', 'Naruto', {
    damage: 14,
    effects: [{ kind: 'destroy', what: 'trap' }],
  }),
  des('Dragão do Raio', 'Electric', 'uncommon', 'Fairy Tail', {
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Electric' }, add: 6, uses: 2, label: 'Dragão do Raio' } }],
  }),
  arm('Para-Raios', 'Electric', 'uncommon', 'One Piece', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'damage', amount: 5 }, { kind: 'status', status: 'freeze', turns: 2 }] },
  }),
  atk('Railgun', 'Electric', 'epic', 'Toaru Kagaku no Railgun', {
    damage: 18,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'pierce' }],
  }),
  atk('Raigo', 'Electric', 'legendary', 'One Piece', {
    damage: 36,
    cost: [{ kind: 'discard', count: 2 }, { kind: 'mill', count: 1 }],
  }),
];

// ─── VENTO ───────────────────────────────────────────────────────────────────

const VENTO: Entry[] = [
  atk('Respiração do Vento', 'Flying', 'common', 'Demon Slayer', { damage: 12 }),
  des('Planador', 'Flying', 'common', 'Nausicaä', {
    effects: [
      { kind: 'draw', count: 1 },
      { kind: 'addModifier', spec: { match: { type: 'attack', element: 'Flying' }, add: 3, label: 'Corrente de ar' } },
    ],
  }),
  eqp('Penas Afiadas', 'Flying', 'common', 'My Hero Academia', {
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Flying' }, add: 3, label: 'Penas Afiadas' }],
  }),
  atk('Rasengan', 'Flying', 'rare', 'Naruto', {
    damage: 14,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { element: 'Flying' } },
      then: [{ kind: 'bonus', add: 8, label: 'Vento no turno' }],
    }],
  }),
  atk('Tatsumaki', 'Flying', 'uncommon', 'One Piece', { damage: 15 }),
  des('Dobra de Ar', 'Flying', 'uncommon', 'Avatar', {
    effects: [{ kind: 'draw', count: 1 }, { kind: 'destroy', what: 'trap' }],
  }),
  atk('Rasenshuriken', 'Flying', 'epic', 'Naruto', {
    damage: 20,
    cost: [{ kind: 'payLife', amount: 8 }],
    effects: [{ kind: 'status', status: 'bleed', value: 4, turns: 2 }],
  }),
  cmp('Céus de Skypiea', 'Flying', 'rare', 'One Piece', {
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Flying' }, add: 5, label: 'Skypiea' }],
  }),
];

// ─── LUTA ────────────────────────────────────────────────────────────────────

const LUTA: Entry[] = [
  atk('Folha Furacão', 'Fighting', 'common', 'Naruto', { damage: 12 }),
  atk('Soco Normal', 'Fighting', 'common', 'One Punch Man', { damage: 13, flavor: 'Só um soco normal.' }),
  des('Cem Flexões por Dia', 'Fighting', 'common', 'One Punch Man', {
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Fighting' }, add: 6, label: 'Treino' } }],
  }),
  atk('Lótus Primário', 'Fighting', 'uncommon', 'Naruto', {
    damage: 18,
    cost: [{ kind: 'payLife', amount: 5 }],
  }),
  atk('Socos Normais Consecutivos', 'Fighting', 'uncommon', 'One Punch Man', {
    damage: 6,
    effects: [{ kind: 'damage', amount: 5 }, { kind: 'damage', amount: 5 }],
  }),
  eqp('Roupa Pesada do Piccolo', 'Fighting', 'uncommon', 'Dragon Ball', {
    slot: 'armor',
    passives: [
      { kind: 'damageReduction', amount: 2, label: 'Pesos' },
      { kind: 'attackBonus', match: { type: 'attack', element: 'Fighting' }, add: 2, label: 'Pesos' },
    ],
  }),
  des('Oito Portões', 'Fighting', 'rare', 'Naruto', {
    cost: [{ kind: 'payLife', amount: 15 }],
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Fighting' }, mult: 1.5, uses: 2, label: 'Oito Portões' } }],
  }),
  atk('United States of Smash', 'Fighting', 'epic', 'My Hero Academia', {
    damage: 34,
    cost: [{ kind: 'payLife', amount: 15 }, { kind: 'discard', count: 1 }],
  }),
];

// ─── FOGO ────────────────────────────────────────────────────────────────────

const FOGO: Entry[] = [
  atk('Bola de Fogo', 'Fire', 'common', 'Naruto', { damage: 12 }),
  des('Calcifer', 'Fire', 'common', "Howl's Moving Castle", {
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Fire' }, add: 6, label: 'Calcifer' } }],
  }),
  atk('Diable Jambe', 'Fire', 'uncommon', 'One Piece', { damage: 15 }),
  atk('Sol Nascente', 'Fire', 'uncommon', 'Demon Slayer', {
    damage: 12,
    effects: [{ kind: 'status', status: 'burn', value: 3, turns: 2 }],
  }),
  atk('Amaterasu', 'Fire', 'mythic', 'Naruto', {
    damage: 30,
    cost: [{ kind: 'payLife', amount: 20 }, { kind: 'discard', count: 1 }],
    effects: [{ kind: 'status', status: 'burn', value: 10, turns: 3 }],
  }),
];

// ─── FANTASMA, AÇO E SOMBRA ──────────────────────────────────────────────────

const OUTROS: Entry[] = [
  des('Dimple', 'Ghost', 'common', 'Mob Psycho 100', {
    effects: [{ kind: 'draw', count: 1 }, { kind: 'heal', amount: 3 }],
  }),
  atk('Turbo Vovó', 'Ghost', 'common', 'Dandadan', { damage: 12 }),
  des('Sem-Rosto', 'Ghost', 'uncommon', 'Spirited Away', {
    effects: [{ kind: 'discardRandom', count: 1 }, { kind: 'draw', count: 1 }],
  }),
  arm('Maldição de Rika', 'Ghost', 'uncommon', 'Jujutsu Kaisen', {
    trap: { trigger: 'opponentAttack', effects: [{ kind: 'damage', amount: 12 }] },
  }),
  atk('Amor Puro', 'Ghost', 'rare', 'Jujutsu Kaisen', {
    damage: 16,
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{ kind: 'bonus', add: { per: 'graveyard', filter: { element: 'Ghost' }, each: 3, max: 12 }, label: 'Rika' }],
  }),
  atk('Shuriken Gigante', 'Steel', 'common', 'Naruto', { damage: 12 }),
  des('Afiar a Lâmina', 'Steel', 'common', 'Demon Slayer', {
    effects: [{ kind: 'addModifier', spec: { match: { type: 'attack', element: 'Steel' }, add: 6, label: 'Lâmina afiada' } }],
  }),
  atk('Oni Giri', 'Steel', 'uncommon', 'One Piece', { damage: 16 }),
  des('Imitação de Sombra', 'Dark', 'common', 'Naruto', {
    effects: [{ kind: 'lock', cardType: 'equipment', turns: 1 }, { kind: 'draw', count: 1 }],
  }),
  atk('Getsuga Tenshō', 'Dark', 'uncommon', 'Bleach', { damage: 16 }),
];

export const COLECAO_2: Entry[] = [
  ...AGUA, ...PLANTA, ...VENENO, ...GELO, ...TERRA,
  ...ELETRICO, ...VENTO, ...LUTA, ...FOGO, ...OUTROS,
];
