// Habilidades da masmorra: qualquer carta de Ataque da coleção vira um poder
// (teclas 1–4). A tradução é por regra (cobre as 350 cartas sem ajuste à mão):
//   dano     ← o dano da carta (escalado para o combate em tempo real)
//   recarga  ← a raridade (mais rara, mais forte e mais demorada)
//   forma    ← o elemento (fogo explode, água é jato, raio cai do céu...)
//   efeito   ← os efeitos da carta (queimar, congelar, roubar vida, atordoar)
// Épica para cima tem sprite próprio do GPT (public/game/efeitos/<id>.png);
// as outras usam o efeito do elemento, feito em código (dungeon-vfx).
// Cura e suporte (sem dano) não viram habilidade.
import type { CardDef, Effect, Element, Rarity } from '@/lib/tcg/types';

export type SkillShape = 'projetil' | 'linha' | 'area' | 'alvo' | 'arco' | 'chuva';
export type SkillEffect = 'queimar' | 'congelar' | 'roubar' | 'atordoar';

export interface Skill {
  card: string;
  name: string;
  element: Element;
  rarity: Rarity;
  dmg: number;
  /** Segundos de recarga. */
  cd: number;
  shape: SkillShape;
  /** Raio (área, alvo, explosão do projétil) ou largura (linha) em blocos. */
  size: number;
  effect?: SkillEffect;
  /** Épica para cima: efeito visual próprio. */
  ownVfx: boolean;
}

const CD: Record<Rarity, number> = { common: 4.5, uncommon: 5.5, rare: 6.5, epic: 8, legendary: 10, mythic: 12, unknown: 14 };
const TOP: Rarity[] = ['epic', 'legendary', 'mythic', 'unknown'];

/** Forma e tamanho pelo elemento. */
export const ELEMENT_SHAPE: Record<Element, { shape: SkillShape; size: number; effect?: SkillEffect }> = {
  Fire: { shape: 'projetil', size: 1.5, effect: 'queimar' },
  Water: { shape: 'linha', size: 0.8 },
  Grass: { shape: 'area', size: 2.6 },
  Electric: { shape: 'chuva', size: 0.9, effect: 'atordoar' },
  Ice: { shape: 'arco', size: 2.6, effect: 'congelar' },
  Fighting: { shape: 'arco', size: 2.2, effect: 'atordoar' },
  Poison: { shape: 'alvo', size: 2.2, effect: 'queimar' },
  Ground: { shape: 'alvo', size: 2.4 },
  Flying: { shape: 'projetil', size: 0 },
  Ghost: { shape: 'chuva', size: 0.8 },
  Dark: { shape: 'linha', size: 0.9, effect: 'roubar' },
  Steel: { shape: 'arco', size: 2.4 },
};

function walk(effs: Effect[] | undefined, fn: (e: Effect) => void) {
  for (const e of effs ?? []) {
    fn(e);
    if (e.kind === 'conditional') { walk(e.then, fn); walk(e.else, fn); }
    if (e.kind === 'aura') walk(e.effects, fn);
  }
}
/** O efeito que a carta já tem no TCG ganha da regra do elemento. */
function effectOf(c: CardDef): SkillEffect | undefined {
  let out: SkillEffect | undefined;
  walk(c.effects, e => {
    if (e.kind === 'lifesteal') out = 'roubar';
    else if (e.kind === 'status' && e.status === 'freeze') out ??= 'congelar';
    else if (e.kind === 'status') out ??= 'queimar';
    else if (e.kind === 'lock') out ??= 'atordoar';
  });
  return out;
}

/** A habilidade de uma carta (ou null, se a carta não é de Ataque com dano). */
export function skillOf(c: CardDef): Skill | null {
  if (c.type !== 'attack' || !(c.damage && c.damage > 0)) return null;
  const base = ELEMENT_SHAPE[c.element];
  // dano: a carta mais forte bate bem mais, mas sem passar de ~3 inimigos comuns de uma vez
  const dmg = Math.round(18 + c.damage * 2.2);
  return {
    card: c.id, name: c.name, element: c.element, rarity: c.rarity,
    dmg, cd: CD[c.rarity], shape: base.shape, size: base.size,
    effect: effectOf(c) ?? base.effect, ownVfx: TOP.includes(c.rarity),
  };
}

/** Quantos espaços de habilidade o caçador tem pelo rank (0 = E ... 5 = S). */
export const skillSlots = (rank: number) => 2 + (rank >= 2 ? 1 : 0) + (rank >= 4 ? 1 : 0);
