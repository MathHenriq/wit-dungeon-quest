import type { CardType, Element, Rarity, StatusKind } from './types';

/** Nomes em português usados no log e no texto das cartas. */

export const ELEMENT_PT: Record<Element, string> = {
  Fire: 'Fogo', Water: 'Água', Electric: 'Elétrico', Grass: 'Planta',
  Ice: 'Gelo', Ground: 'Terra', Fighting: 'Luta', Steel: 'Aço',
  Poison: 'Veneno', Dark: 'Sombra', Ghost: 'Fantasma', Flying: 'Vento',
};

export const TYPE_PT: Record<CardType, string> = {
  attack: 'Ataque',
  challenger: 'Desafiante',
  equipment: 'Equipamento',
  trap: 'Armadilha',
  field: 'Campo',
};

/** Plural, para frases como "não pode jogar Ataques". */
export const TYPE_PT_PLURAL: Record<CardType, string> = {
  attack: 'Ataques',
  challenger: 'cartas de Desafiante',
  equipment: 'Equipamentos',
  trap: 'Armadilhas',
  field: 'cartas de Campo',
};

export const RARITY_PT: Record<Rarity, string> = {
  common: 'Comum', uncommon: 'Incomum', rare: 'Rara', epic: 'Épica',
  legendary: 'Lendária', mythic: 'Mítica', unknown: 'Desconhecida',
};

export const STATUS_PT: Record<StatusKind, string> = {
  burn: 'Queimadura',
  poison: 'Veneno',
  bleed: 'Sangramento',
  freeze: 'Congelamento',
};

/** Raridades que usam o visual full art. */
export const FULL_ART_RARITIES: ReadonlySet<Rarity> = new Set(['legendary', 'mythic', 'unknown']);
