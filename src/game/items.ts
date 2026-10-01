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
  /** Ícone em public/game/icons/itens (ver src/game/icons.ts). */
  icon: string;
  kind: ItemKind;
  /** Preço base em moedas (0 = não se vende). */
  price: number;
  /** Quanto enche a barriga (0 = não se come). */
  food?: number;
  about?: string;
}

const CROP_FOOD: Record<string, number> = { cenoura: 8, alface: 6, morango: 6, tomate: 8, milho: 10, girassol: 0, abobora: 18 };

const BASE: ItemDef[] = [
  // fazenda
  { id: 'ovo', name: 'Ovo', icon: 'ovo', kind: 'fazenda', price: 4 },
  { id: 'leite', name: 'Leite', icon: 'leite', kind: 'fazenda', price: 7, food: 8 },
  { id: 'la', name: 'Lã', icon: 'la', kind: 'fazenda', price: 9 },
  { id: 'fruta:maca', name: 'Maçã', icon: 'fruta:maca', kind: 'fazenda', price: 3, food: 10 },
  { id: 'fruta:laranja', name: 'Laranja', icon: 'fruta:laranja', kind: 'fazenda', price: 3, food: 10 },
  { id: 'fruta:pessego', name: 'Pêssego', icon: 'fruta:pessego', kind: 'fazenda', price: 3, food: 10 },
  { id: 'fruta:limao', name: 'Limão', icon: 'fruta:limao', kind: 'fazenda', price: 3, food: 4 },
  // comida pronta (padaria e receitas)
  { id: 'pao', name: 'Pão', icon: 'pao', kind: 'comida', price: 4, food: 25, about: 'Quentinho, da Padaria da Dona Rosa.' },
  { id: 'pao-bisnaga', name: 'Bisnaga', icon: 'pao-bisnaga', kind: 'comida', price: 6, food: 25, about: 'Feita por você na Padaria.' },
  { id: 'pao-tranca', name: 'Pão Trançado', icon: 'pao-tranca', kind: 'comida', price: 9, food: 28, about: 'Feito por você na Padaria.' },
  { id: 'pao-redondo', name: 'Pão Redondo', icon: 'pao-redondo', kind: 'comida', price: 6, food: 25, about: 'Feito por você na Padaria.' },
  { id: 'pao-forma', name: 'Pão de Forma', icon: 'pao-forma', kind: 'comida', price: 8, food: 30, about: 'Feito por você na Padaria.' },
  { id: 'bolo', name: 'Bolo', icon: 'bolo', kind: 'comida', price: 12, food: 40 },
  { id: 'omelete', name: 'Omelete', icon: 'omelete', kind: 'comida', price: 10, food: 28 },
  { id: 'salada', name: 'Salada', icon: 'salada', kind: 'comida', price: 22, food: 35 },
  { id: 'pipoca', name: 'Pipoca', icon: 'pipoca', kind: 'comida', price: 15, food: 15 },
  { id: 'peixe-assado', name: 'Peixe Assado', icon: 'peixe-assado', kind: 'comida', price: 8, food: 30 },
  { id: 'vitamina', name: 'Vitamina de Fruta', icon: 'vitamina', kind: 'comida', price: 14, food: 30 },
  { id: 'bolo-cenoura', name: 'Bolo de Cenoura', icon: 'bolo-cenoura', kind: 'comida', price: 24, food: 45 },
  { id: 'torta-abobora', name: 'Torta de Abóbora', icon: 'torta-abobora', kind: 'comida', price: 48, food: 55 },
  // doces da Dona Ana (Oficina de Cartas)
  { id: 'rosquinha', name: 'Rosquinha', icon: 'rosquinha', kind: 'comida', price: 5, food: 14 },
  { id: 'sorvete', name: 'Sorvete', icon: 'sorvete', kind: 'comida', price: 6, food: 12 },
  { id: 'pirulito', name: 'Pirulito', icon: 'pirulito', kind: 'comida', price: 2, food: 5 },
  { id: 'picole', name: 'Picolé', icon: 'picole', kind: 'comida', price: 3, food: 8 },
  { id: 'chocolate', name: 'Barra de Chocolate', icon: 'chocolate', kind: 'comida', price: 6, food: 15 },
  { id: 'cupcake', name: 'Cupcake', icon: 'cupcake', kind: 'comida', price: 7, food: 18 },
  { id: 'suco', name: 'Suco', icon: 'suco', kind: 'comida', price: 3, food: 12, about: 'Da máquina da praça.' },
  // o que as profissões fazem
  { id: 'disco', name: 'Disco', icon: 'disco', kind: 'produto', price: 18, about: 'Gravado no Estúdio de Música.' },
  { id: 'disco-ouro', name: 'Disco de Ouro', icon: 'disco-ouro', kind: 'produto', price: 45, about: 'Uma gravação perfeita!' },
  { id: 'quadro', name: 'Quadro', icon: 'quadro', kind: 'produto', price: 20, about: 'Pintado no Ateliê.' },
  { id: 'modelo-ia', name: 'Modelo de IA', icon: 'modelo-ia', kind: 'produto', price: 22, about: 'Treinado no Laboratório de IA.' },
  { id: 'sensor', name: 'Sensor IoT', icon: 'sensor', kind: 'produto', price: 15, about: 'Montado na Casa Inteligente. 3 sensores viram um irrigador.' },
  { id: 'irrigador', name: 'Irrigador Automático', icon: 'irrigador', kind: 'produto', price: 0, about: 'Rega sozinho 8 canteiros da fazenda todo dia. Usar: na mochila.' },
  { id: 'cubo-virtual', name: 'Cubo Virtual', icon: 'cubo-virtual', kind: 'produto', price: 16, about: 'Um objeto 3D feito no Metaverso.' },
  { id: 'tiquete', name: 'Tíquete de Fliperama', icon: 'tiquete', kind: 'produto', price: 2, about: 'Ganho testando jogos na Oficina de Games.' },
];

export const ITEMS: ItemDef[] = [
  ...BASE,
  ...CROPS.map(c => ({ id: `colheita:${c.id}`, name: c.name, icon: `colheita:${c.id}`, kind: 'colheita' as const, price: c.sellPrice, food: CROP_FOOD[c.id] || undefined })),
  ...CROPS.map(c => ({ id: `semente:${c.id}`, name: `Semente de ${c.name}`, icon: 'semente', kind: 'semente' as const, price: 0 })),
  ...FISH.map(f => ({ id: `peixe:${f.id}`, name: f.name, icon: 'peixe', kind: 'peixe' as const, price: f.price })),
];
export const ITEM_BY_ID = new Map(ITEMS.map(i => [i.id, i]));

export const itemDef = (id: string): ItemDef | undefined => ITEM_BY_ID.get(id);
export const itemLabel = (id: string) => ITEM_BY_ID.get(id)?.name ?? id;
/** Id do ícone (public/game/icons/itens). */
export const itemIcon = (id: string) => ITEM_BY_ID.get(id)?.icon ?? 'pacote';
