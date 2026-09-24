/**
 * Cartas de exemplo. Cada uma existe para exercitar uma mecânica do motor —
 * não são o catálogo final (esse vem da tradução das cartas da loja).
 */

import type { CardDef } from '../types';

export const SAMPLE = {
  // ── Ataques básicos ────────────────────────────────────────────────────────
  brasa: {
    id: 'brasa', name: 'Brasa', type: 'attack', element: 'Fire', rarity: 'common',
    damage: 12,
  },
  jato: {
    id: 'jato', name: "Jato d'Água", type: 'attack', element: 'Water', rarity: 'common',
    damage: 12,
  },
  faisca: {
    id: 'faisca', name: 'Faísca', type: 'attack', element: 'Electric', rarity: 'common',
    damage: 12,
  },
  ferrao: {
    id: 'ferrao', name: 'Ferrão Tóxico', type: 'attack', element: 'Poison', rarity: 'uncommon',
    damage: 8,
    effects: [{ kind: 'status', status: 'poison', value: 5, turns: 3 }],
  },

  // ── O exemplo do Matheus: "dobra o próximo ataque de Fogo" ─────────────────
  furia: {
    id: 'furia', name: 'Fúria Ígnea', type: 'challenger', element: 'Fire', rarity: 'legendary',
    effects: [{
      kind: 'addModifier',
      spec: { match: { type: 'attack', element: 'Fire' }, mult: 2, label: 'Fúria Ígnea' },
    }],
  },
  pira: {
    id: 'pira', name: 'Pira do Dragão', type: 'challenger', element: 'Fire', rarity: 'epic',
    cost: [{ kind: 'discard', count: 1 }],
    effects: [{
      kind: 'addModifier',
      spec: { match: { type: 'attack', element: 'Fire' }, add: 8, uses: 2, label: 'Pira do Dragão' },
    }],
  },

  // ── Condição "jogou outra carta de X neste turno" ──────────────────────────
  rajada: {
    id: 'rajada', name: 'Rajada', type: 'challenger', element: 'Flying', rarity: 'common',
    effects: [{ kind: 'draw', count: 1 }],
  },
  rasengan: {
    id: 'rasengan', name: 'Rasengan', type: 'attack', element: 'Flying', rarity: 'rare',
    damage: 20,
    effects: [{
      kind: 'conditional',
      if: { kind: 'playedThisTurn', filter: { element: 'Flying' } },
      then: [{ kind: 'bonus', add: 10, label: 'Vento no turno' }],
    }],
  },

  // ── Escala com o cemitério, custo de moer o próprio deck ───────────────────
  rasenganGigante: {
    id: 'rasengan-gigante', name: 'Rasengan Gigante', type: 'attack', element: 'Flying', rarity: 'legendary',
    damage: 35,
    cost: [{ kind: 'mill', count: 2 }],
    effects: [{
      kind: 'bonus',
      add: { per: 'graveyard', filter: { element: 'Flying' }, each: 5 },
      label: 'Vento no cemitério',
    }],
  },

  // ── Trava + condição de cemitério, custo de descarte ───────────────────────
  tsukuyomi: {
    id: 'tsukuyomi', name: 'Tsukuyomi', type: 'challenger', element: 'Dark', rarity: 'legendary',
    cost: [{ kind: 'discard', count: 1 }],
    effects: [
      { kind: 'lock', cardType: 'attack', turns: 1 },
      {
        kind: 'conditional',
        if: { kind: 'graveyardCount', min: 3, filter: { element: 'Dark' } },
        then: [{ kind: 'damage', amount: 15 }],
      },
    ],
  },
  sombra: {
    id: 'sombra', name: 'Véu Sombrio', type: 'challenger', element: 'Dark', rarity: 'common',
    effects: [{ kind: 'draw', count: 1 }],
  },

  // ── O outro exemplo: sacrificar o deck para anular o próximo dano ──────────
  guardiao: {
    id: 'guardiao', name: 'Sacrifício do Guardião', type: 'challenger', element: 'Steel', rarity: 'epic',
    cost: [{ kind: 'mill', count: 2 }],
    effects: [{ kind: 'shield', count: 1 }],
  },
  pacto: {
    id: 'pacto', name: 'Pacto de Sangue', type: 'challenger', element: 'Dark', rarity: 'epic',
    cost: [{ kind: 'payLife', amount: 20 }],
    effects: [{ kind: 'draw', count: 3 }],
  },
  ressurreicao: {
    id: 'ressurreicao', name: 'Chamado dos Mortos', type: 'challenger', element: 'Ghost', rarity: 'rare',
    cost: [{ kind: 'banish', count: 2 }],
    effects: [{ kind: 'recover', count: 1, filter: { type: 'attack' } }],
  },
  congelar: {
    id: 'congelar', name: 'Prisão de Gelo', type: 'challenger', element: 'Ice', rarity: 'rare',
    effects: [{ kind: 'status', status: 'freeze', turns: 1 }],
  },

  // ── Armadilha ──────────────────────────────────────────────────────────────
  espelho: {
    id: 'espelho', name: 'Espelho Negro', type: 'trap', element: 'Steel', rarity: 'rare',
    trap: { trigger: 'opponentAttack', negate: true, effects: [{ kind: 'damage', amount: 10 }] },
  },

  // ── Equipamento e Campo ────────────────────────────────────────────────────
  katana: {
    id: 'katana', name: 'Katana Afiada', type: 'equipment', element: 'Steel', rarity: 'rare',
    slot: 'weapon',
    passives: [{ kind: 'attackBonus', match: { type: 'attack' }, add: 5, label: 'Katana' }],
  },
  armadura: {
    id: 'armadura', name: 'Armadura de Rocha', type: 'equipment', element: 'Ground', rarity: 'uncommon',
    slot: 'armor',
    passives: [{ kind: 'damageReduction', amount: 4, label: 'Armadura de Rocha' }],
  },
  vulcao: {
    id: 'vulcao', name: 'Vulcão Desperto', type: 'field', element: 'Fire', rarity: 'epic',
    passives: [{ kind: 'attackBonus', match: { type: 'attack', element: 'Fire' }, add: 5, label: 'Vulcão' }],
  },
} satisfies Record<string, CardDef>;
