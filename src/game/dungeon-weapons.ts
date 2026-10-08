// Armas da masmorra (estilo Soul Knight). Duas no corpo: uma CURTA (espada e
// parentes: mais dano, sem mana, mas de perto, onde o golpe do inimigo pega) e
// uma LONGA (tiro: menos dano, gasta mana, de longe). A curta corta os tiros
// inimigos que pega no arco. Regra de equilíbrio (teste): o dano por segundo
// de uma curta é perto de 2× o de uma longa da mesma raridade.

export type WeaponKind = 'curta' | 'longa';
export type WeaponId =
  | 'espada' | 'katana' | 'adaga' | 'lanca' | 'machado' | 'martelo' | 'foice' | 'punhos'
  | 'pistola' | 'besta' | 'arco' | 'cajado' | 'varinha' | 'canhao' | 'fuzil' | 'livro';

export interface Weapon {
  id: WeaponId;
  name: string;
  kind: WeaponKind;
  /** Dano por golpe (curta) ou por tiro (longa). */
  dmg: number;
  /** Segundos entre um ataque e outro. */
  cd: number;
  /** Curta: alcance do golpe em blocos. Longa: alcance do tiro. */
  range: number;
  /** Curta: abertura do golpe em radianos. */
  arc?: number;
  /** Longa: mana por tiro (0 = de graça, como a pistola inicial). */
  mana?: number;
  /** Longa: velocidade do tiro (blocos/s), quantos tiros e abertura entre eles. */
  speed?: number;
  count?: number;
  spread?: number;
  /** Longa: atravessa inimigos; explode com esse raio. */
  pierce?: boolean;
  blast?: number;
  /** 0 = comum ... 4 = lendária (cai em baú de rank mais alto; custa mais no ferreiro). */
  tier: number;
}

export const WEAPONS: Weapon[] = [
  { id: 'espada', name: 'Espada', kind: 'curta', dmg: 12, cd: 0.38, range: 1.6, arc: 1.9, tier: 0 },
  { id: 'punhos', name: 'Manoplas', kind: 'curta', dmg: 6, cd: 0.16, range: 1.1, arc: 1.3, tier: 1 },
  { id: 'adaga', name: 'Adaga', kind: 'curta', dmg: 8, cd: 0.2, range: 1.3, arc: 1.4, tier: 1 },
  { id: 'lanca', name: 'Lança', kind: 'curta', dmg: 16, cd: 0.5, range: 2.5, arc: 0.7, tier: 1 },
  { id: 'katana', name: 'Katana', kind: 'curta', dmg: 12, cd: 0.28, range: 1.8, arc: 1.6, tier: 2 },
  { id: 'machado', name: 'Machado', kind: 'curta', dmg: 24, cd: 0.7, range: 1.8, arc: 2.4, tier: 2 },
  { id: 'foice', name: 'Foice', kind: 'curta', dmg: 20, cd: 0.55, range: 2.1, arc: 2.6, tier: 3 },
  { id: 'martelo', name: 'Martelo', kind: 'curta', dmg: 34, cd: 0.9, range: 1.7, arc: 2.8, tier: 3 },
  { id: 'pistola', name: 'Pistola de energia', kind: 'longa', dmg: 4, cd: 0.22, range: 9, mana: 0, speed: 11, tier: 0 },
  { id: 'varinha', name: 'Varinha', kind: 'longa', dmg: 2.5, cd: 0.13, range: 8, mana: 1, speed: 12, tier: 1 },
  { id: 'arco', name: 'Arco curto', kind: 'longa', dmg: 7, cd: 0.4, range: 10, mana: 1, speed: 14, tier: 1 },
  { id: 'besta', name: 'Besta', kind: 'longa', dmg: 10, cd: 0.6, range: 11, mana: 2, speed: 16, pierce: true, tier: 2 },
  { id: 'fuzil', name: 'Fuzil de energia', kind: 'longa', dmg: 5, cd: 0.24, range: 10, mana: 1, speed: 15, tier: 2 },
  { id: 'cajado', name: 'Cajado de rubi', kind: 'longa', dmg: 9, cd: 0.5, range: 9, mana: 2, speed: 9, blast: 1.1, tier: 3 },
  { id: 'livro', name: 'Livro mágico', kind: 'longa', dmg: 3, cd: 0.55, range: 8, mana: 3, speed: 10, count: 4, spread: 0.5, tier: 3 },
  { id: 'canhao', name: 'Canhão de mão', kind: 'longa', dmg: 16, cd: 0.95, range: 9, mana: 4, speed: 8, blast: 1.6, tier: 4 },
];
export const WEAPON_BY_ID = new Map(WEAPONS.map(w => [w.id, w]));
export const weapon = (id: WeaponId): Weapon => WEAPON_BY_ID.get(id)!;
export const START_CURTA: WeaponId = 'espada';
export const START_LONGA: WeaponId = 'pistola';

/** Dano por segundo (sem crítico, contando todos os tiros de uma vez). */
export const dps = (w: Weapon) => (w.dmg * (w.count ?? 1)) / w.cd;

/** Arma com nível do ferreiro: +15% de dano por nível (até 5). */
export const MAX_WEAPON_LEVEL = 5;
export const levelMult = (lvl: number) => 1 + 0.15 * Math.max(0, Math.min(MAX_WEAPON_LEVEL, lvl));

/** Arma que cai no baú: raridade pelo rank (0 = E ... 5 = S). `roll` em [0, 1). */
export function chestWeapon(rank: number, roll: number, roll2: number): WeaponId {
  const top = Math.min(4, 1 + Math.floor(rank * 0.7 + roll2 * 1.5));
  const pool = WEAPONS.filter(w => w.tier >= 1 && w.tier <= top);
  return pool[Math.floor(roll * pool.length)].id;
}

/** Ferreiro da Associação: preço para forjar (ter para sempre) e para subir de nível. */
export function forgeCost(w: Weapon): { moedas: number; minerio: Record<string, number> } {
  const t = w.tier;
  return { moedas: 80 + t * 90, minerio: t <= 1 ? { 'minerio:cobre': 6 } : t <= 2 ? { 'minerio:cobre': 4, 'minerio:ferro': 5 } : t <= 3 ? { 'minerio:ferro': 6, 'minerio:ouro': 3 } : { 'minerio:ouro': 8 } };
}
export function upgradeCost(w: Weapon, lvl: number): { moedas: number; minerio: Record<string, number> } {
  const ore = lvl < 2 ? 'minerio:cobre' : lvl < 4 ? 'minerio:ferro' : 'minerio:ouro';
  return { moedas: 40 + lvl * 40 + w.tier * 20, minerio: { [ore]: 3 + lvl * 2 } };
}
