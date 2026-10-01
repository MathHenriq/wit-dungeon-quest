// Tudo o que vai na mochila: peixes, colheitas, coisas da fazenda, comida,
// o que cada profissão produz. Preço base (o Mercado mexe nele com a oferta e
// a procura), quanto mata a fome e o ícone. Os peixes vêm de fishing.ts e as
// plantas de farm.ts; o resto está aqui.
import { CROPS } from './farm';
import { FISH } from './fishing';

export type ItemKind = 'peixe' | 'colheita' | 'fazenda' | 'comida' | 'produto' | 'semente';

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  kind: ItemKind;
  /** Preço base em moedas (0 = não se vende). */
  price: number;
  /** Quanto enche a barriga (0 = não se come). */
  food?: number;
  about?: string;
}

const CROP_ICON: Record<string, string> = { cenoura: '🥕', alface: '🥬', morango: '🍓', tomate: '🍅', milho: '🌽', girassol: '🌻', abobora: '🎃' };
const CROP_FOOD: Record<string, number> = { cenoura: 8, alface: 6, morango: 6, tomate: 8, milho: 10, girassol: 0, abobora: 18 };

const BASE: ItemDef[] = [
  // fazenda
  { id: 'ovo', name: 'Ovo', icon: '🥚', kind: 'fazenda', price: 4 },
  { id: 'leite', name: 'Leite', icon: '🥛', kind: 'fazenda', price: 7, food: 8 },
  { id: 'la', name: 'Lã', icon: '🧶', kind: 'fazenda', price: 9 },
  { id: 'fruta:maca', name: 'Maçã', icon: '🍎', kind: 'fazenda', price: 3, food: 10 },
  { id: 'fruta:laranja', name: 'Laranja', icon: '🍊', kind: 'fazenda', price: 3, food: 10 },
  { id: 'fruta:pessego', name: 'Pêssego', icon: '🍑', kind: 'fazenda', price: 3, food: 10 },
  { id: 'fruta:limao', name: 'Limão', icon: '🍋', kind: 'fazenda', price: 3, food: 4 },
  // comida pronta (padaria e receitas)
  { id: 'pao', name: 'Pão', icon: '🍞', kind: 'comida', price: 4, food: 25, about: 'Quentinho, da Padaria da Dona Rosa.' },
  { id: 'bolo', name: 'Bolo', icon: '🍰', kind: 'comida', price: 12, food: 40 },
  { id: 'omelete', name: 'Omelete', icon: '🍳', kind: 'comida', price: 10, food: 28 },
  { id: 'salada', name: 'Salada', icon: '🥗', kind: 'comida', price: 22, food: 35 },
  { id: 'pipoca', name: 'Pipoca', icon: '🍿', kind: 'comida', price: 15, food: 15 },
  { id: 'peixe-assado', name: 'Peixe Assado', icon: '🐟', kind: 'comida', price: 8, food: 30 },
  { id: 'vitamina', name: 'Vitamina de Fruta', icon: '🥤', kind: 'comida', price: 14, food: 30 },
  { id: 'bolo-cenoura', name: 'Bolo de Cenoura', icon: '🧁', kind: 'comida', price: 24, food: 45 },
  { id: 'torta-abobora', name: 'Torta de Abóbora', icon: '🥧', kind: 'comida', price: 48, food: 55 },
  { id: 'suco', name: 'Suco', icon: '🧃', kind: 'comida', price: 3, food: 12, about: 'Da máquina da praça.' },
  // o que as profissões fazem
  { id: 'disco', name: 'Disco', icon: '💿', kind: 'produto', price: 18, about: 'Gravado no Estúdio de Música.' },
  { id: 'disco-ouro', name: 'Disco de Ouro', icon: '📀', kind: 'produto', price: 45, about: 'Uma gravação perfeita!' },
  { id: 'quadro', name: 'Quadro', icon: '🖼️', kind: 'produto', price: 20, about: 'Pintado no Ateliê.' },
  { id: 'modelo-ia', name: 'Modelo de IA', icon: '🧠', kind: 'produto', price: 22, about: 'Treinado no Laboratório de IA.' },
  { id: 'sensor', name: 'Sensor IoT', icon: '📡', kind: 'produto', price: 15, about: 'Montado na Casa Inteligente. 3 sensores viram um irrigador.' },
  { id: 'irrigador', name: 'Irrigador Automático', icon: '💦', kind: 'produto', price: 0, about: 'Rega sozinho 8 canteiros da fazenda todo dia. Usar: na mochila.' },
  { id: 'cubo-virtual', name: 'Cubo Virtual', icon: '🧊', kind: 'produto', price: 16, about: 'Um objeto 3D feito no Metaverso.' },
  { id: 'tiquete', name: 'Tíquete de Fliperama', icon: '🎟️', kind: 'produto', price: 2, about: 'Ganho testando jogos na Oficina de Games.' },
];

export const ITEMS: ItemDef[] = [
  ...BASE,
  ...CROPS.map(c => ({ id: `colheita:${c.id}`, name: c.name, icon: CROP_ICON[c.id] ?? '🌱', kind: 'colheita' as const, price: c.sellPrice, food: CROP_FOOD[c.id] || undefined })),
  ...CROPS.map(c => ({ id: `semente:${c.id}`, name: `Semente de ${c.name}`, icon: '🌱', kind: 'semente' as const, price: 0 })),
  ...FISH.map(f => ({ id: `peixe:${f.id}`, name: f.name, icon: f.rarity === 'lixo' ? (f.id === 'bota' ? '🥾' : '🥫') : '🐟', kind: 'peixe' as const, price: f.price })),
];
export const ITEM_BY_ID = new Map(ITEMS.map(i => [i.id, i]));

export const itemDef = (id: string): ItemDef | undefined => ITEM_BY_ID.get(id);
export const itemLabel = (id: string) => ITEM_BY_ID.get(id)?.name ?? id;
export const itemIcon = (id: string) => ITEM_BY_ID.get(id)?.icon ?? '📦';
