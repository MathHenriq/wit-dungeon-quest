/** Ajudantes para declarar cartas de forma compacta (usados pelos arquivos de coleção). */

import type { CardDef, Element, Rarity } from '../types';

export interface Entry {
  /** Nome do item na loja antiga (chave para migração e arte). `null` = carta criada no TCG. */
  shop: string | null;
  card: CardDef;
}

export function slug(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

type Rest = Omit<CardDef, 'id' | 'name' | 'type' | 'element' | 'rarity' | 'anime'>;

/** Carta que veio da loja antiga: guarda o nome original. */
export function fromShop(type: CardDef['type']) {
  return (shop: string, name: string, element: Element, rarity: Rarity, anime: string | null, rest: Rest): Entry => ({
    shop,
    card: { id: slug(name), name, type, element, rarity, ...(anime ? { anime } : {}), ...rest },
  });
}

/** Carta nova, criada direto para o TCG. */
export function original(type: CardDef['type']) {
  return (name: string, element: Element, rarity: Rarity, anime: string | null, rest: Rest): Entry => ({
    shop: null,
    card: { id: slug(name), name, type, element, rarity, ...(anime ? { anime } : {}), ...rest },
  });
}
