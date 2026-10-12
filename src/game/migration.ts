// Migração WIT 1 → WIT 2 (docs/plano-wit2.md §10), sem zerar ninguém. Função
// pura: recebe o que o aluno tinha no WIT 1 (já lido do banco) e devolve o
// progresso do WIT 2 e um relatório do que foi convertido. Quem rodar no dia
// da virada só lê as tabelas antigas, chama `migrateStudent` e grava o
// resultado. Conta de teste fica de fora.
//
//   Cartas da loja antiga   → a carta equivalente da Coleção 1 (pelo nome do item)
//   Classe                  → sugestão de Caminho (o aluno escolhe no 1º acesso)
//   Nível e XP              → guardados em `legado` + Pacotes de Legado (proposta abaixo)
//   Moedas e diamantes      → moedas (1 diamante = 20 moedas)
//   Títulos                 → mantidos + "Veterano WIT 1"
//   Pontos de atributo/skill→ pontos do Grimório (1 a cada 10, no máximo 6)
//   Materiais e consumíveis → pó da forja
import { CARD_BY_ID, CARD_ID_BY_SHOP_NAME } from '@/lib/tcg/cards/catalog';
import { suggestPath } from '@/lib/tcg/paths';
import type { Rarity } from '@/lib/tcg/types';
import { DUST } from './forge';
import { givePacks, type PackId } from './packs';
import { newProgress, type Progress } from './progress';

export const DIAMOND_TO_COINS = 20;
export const OLD_POINTS_PER_TALENT = 10;
export const MAX_LEGACY_TALENTS = 6;

/** O que o aluno tinha no WIT 1 (tabelas students, student_inventory + shop_items, materiais, títulos). */
export interface Wit1Student {
  id: string;
  isTest?: boolean;
  level: number;
  xp: number;
  coins: number;
  diamonds: number;
  characterClass?: string | null;
  /** Nomes dos itens da loja antiga que ele tinha (um por item; repetido = mais de um). */
  shopItems: string[];
  /** Materiais da forja antiga, pela raridade. */
  materials: { rarity: 'common' | 'uncommon' | 'rare' | 'epic'; quantity: number }[];
  /** Consumíveis (poções etc.): viram pó comum. */
  consumables: number;
  /** Pontos de atributo (somados) e de skill ganhos no total. */
  attributePoints: number;
  skillPoints: number;
  /** Títulos antigos (student_titles.title_type). */
  titles: string[];
}

/**
 * Pacotes de Legado por nível (PROPOSTA, plano §10 diz "a definir"): 1 Comum
 * a cada 5 níveis, 1 Raro a cada 15 e 1 Épico a cada 30. Um aluno nível 20
 * ganha 4 Comuns + 1 Raro. Mexer aqui muda para todos.
 */
export function legacyPacks(level: number): Partial<Record<PackId, number>> {
  const out: Partial<Record<PackId, number>> = {};
  const comum = Math.floor(level / 5), raro = Math.floor(level / 15), epico = Math.floor(level / 30);
  if (comum) out.comum = comum;
  if (raro) out.raro = raro;
  if (epico) out.epico = epico;
  return out;
}

/** Títulos antigos → ids de título do WIT 2 (titles.ts). */
export const OLD_TITLES: Record<string, string> = {
  helper_of_week: 'ajudante-semana',
  presence_guardian: 'guardiao-presenca',
  attitude_example: 'exemplo-atitude',
};

export interface MigrationReport { cards: number; unknownItems: string[]; coins: number; packs: Partial<Record<PackId, number>>; dust: Partial<Record<Rarity, number>>; talentPoints: number; titles: string[]; path: string }

export function migrateStudent(s: Wit1Student): { progress: Progress; report: MigrationReport } | { skipped: string } {
  if (s.isTest) return { skipped: 'conta de teste' };
  let p = newProgress();

  // cartas: o item da loja vira a carta da Coleção 1 (o deck inicial continua; o Caminho vem no 1º acesso)
  const collection = { ...p.collection };
  const unknown: string[] = [];
  let cards = 0;
  for (const name of s.shopItems) {
    const id = CARD_ID_BY_SHOP_NAME.get(name.trim());
    if (id && CARD_BY_ID.has(id)) { collection[id] = (collection[id] ?? 0) + 1; cards++; } else if (!unknown.includes(name)) unknown.push(name);
  }

  // pó: materiais pela raridade (metade do pó de uma carta da mesma raridade) e consumíveis como pó comum
  const po: Partial<Record<Rarity, number>> = {};
  for (const m of s.materials) {
    const v = Math.round((DUST[m.rarity].gives / 2) * Math.max(0, m.quantity));
    if (v) po[m.rarity] = (po[m.rarity] ?? 0) + v;
  }
  if (s.consumables > 0) po.common = (po.common ?? 0) + Math.round((DUST.common.gives / 2) * s.consumables);

  const coins = Math.max(0, Math.round(s.coins)) + Math.max(0, Math.round(s.diamonds)) * DIAMOND_TO_COINS;
  const talentPoints = Math.min(MAX_LEGACY_TALENTS, Math.floor((Math.max(0, s.attributePoints) + Math.max(0, s.skillPoints)) / OLD_POINTS_PER_TALENT));
  const titles = ['veterano', ...s.titles.map(t => OLD_TITLES[t]).filter((t): t is string => !!t)];
  const packs = legacyPacks(s.level);
  const path = suggestPath(s.characterClass);

  p = { ...p, collection, coins, po, legado: { nivel: Math.max(1, s.level), xp: Math.max(0, s.xp), titulos: [...new Set(titles)], pontos: talentPoints }, caminhoSugerido: path };
  for (const [id, n] of Object.entries(packs)) p = givePacks(p, id as PackId, n!);

  return { progress: p, report: { cards, unknownItems: unknown, coins, packs, dust: po, talentPoints, titles: [...new Set(titles)], path } };
}
