// Habilidades da masmorra: cada carta de Ataque da coleção vira um poder
// (teclas 1–4) com o KIT próprio dela (dungeon-kits.ts): o tornado de fogo
// anda girando e queima, o Titã deixa o caçador gigante, o Zoltraak tem a cena
// do círculo mágico... O PODER sai do dano da carta; a recarga, da raridade
// (ou do kit). A MAESTRIA (0–5) sobe com inimigos derrotados usando a carta:
// +5% por nível; no 3 ganha um extra (mais um projétil, estado mais longo); no
// 5, recarga 20% menor e +15%. Épica para cima tem sprite próprio do GPT.
import type { CardDef, Element, Rarity } from '@/lib/tcg/types';
import { kitOf } from './dungeon-kits';
import { EL_STATUS, MOVE_NAME, STATUS, type Kit, type Move, type StatusId } from './dungeon-moves';

export interface Skill {
  card: string;
  name: string;
  element: Element;
  rarity: Rarity;
  /** Poder (dano de um golpe cheio, d = 1). */
  dmg: number;
  /** Segundos de recarga. */
  cd: number;
  kit: Kit;
  /** Nível de maestria (0–5). */
  lvl: number;
  /** Épica para cima: efeito visual próprio. */
  ownVfx: boolean;
}

const CD: Record<Rarity, number> = { common: 6, uncommon: 7, rare: 8, epic: 10, legendary: 12, mythic: 14, unknown: 16 };
const TOP: Rarity[] = ['epic', 'legendary', 'mythic', 'unknown'];

/** Inimigos derrotados com a carta para cada nível de maestria. */
export const MASTERY_KILLS = [0, 10, 30, 70, 150, 300];
export function masteryLevel(kills: number): number {
  let l = 0;
  for (let k = 0; k < MASTERY_KILLS.length; k++) if (kills >= MASTERY_KILLS[k]) l = k;
  return l;
}
export const masteryMult = (lvl: number) => 1 + 0.05 * lvl + (lvl >= 5 ? 0.15 : 0);

/** A habilidade de uma carta (ou null, se a carta não é de Ataque com dano). */
export function skillOf(c: CardDef, lvl = 0): Skill | null {
  if (c.type !== 'attack' || !(c.damage && c.damage > 0)) return null;
  const kit = kitOf(c.id);
  if (!kit) return null;
  const power = 18 + c.damage * 2.2;
  return {
    card: c.id, name: c.name, element: c.element, rarity: c.rarity,
    dmg: Math.round(power * masteryMult(lvl)), cd: Math.round((kit.cd ?? CD[c.rarity]) * (lvl >= 5 ? 0.8 : 1) * 10) / 10,
    kit, lvl, ownVfx: TOP.includes(c.rarity),
  };
}

/** Quantos espaços de habilidade o caçador tem pelo rank (0 = E ... 5 = S). */
export const skillSlots = (rank: number) => 2 + (rank >= 2 ? 1 : 0) + (rank >= 4 ? 1 : 0);

function statusesOf(moves: Move[]): StatusId[] {
  const out = new Set<StatusId>();
  const add = (h?: { st?: StatusId; st2?: StatusId }) => { if (h?.st) out.add(h.st); if (h?.st2) out.add(h.st2); };
  for (const m of moves) {
    if ('hit' in m) add(m.hit);
    if (m.m === 'transformar') { add(m.stomp?.hit); add(m.aura?.hit); add(m.fim?.hit); add(m.tiro); }
    if (m.m === 'prender') add(m.crush);
    if (m.m === 'proj' && m.abre) add(m.abre.hit);
    if (m.m === 'investida' && m.rastro) add(m.rastro.hit);
    if (m.m === 'tornado' && m.fim) add(m.fim.hit);
  }
  return [...out];
}
/** Etiquetas do Códex: formas, estados e reações que a carta puxa. */
export function kitTags(s: Skill): { formas: string[]; estados: string[]; reacoes: string[] } {
  const formas = [...new Set(s.kit.moves.map(m => MOVE_NAME[m.m]))];
  const sts = statusesOf(s.kit.moves);
  const estados = sts.map(x => STATUS[x].nome);
  const reacoes: string[] = [];
  const el = new Set<string>([s.element, ...s.kit.moves.flatMap(m => ('hit' in m && m.hit.el ? [m.hit.el] : []))]);
  const hasSt = (x: StatusId) => sts.includes(x) || [...el].some(e => EL_STATUS[e as Element] === x);
  if (hasSt('molhado')) reacoes.push('molhado + gelo = congela', 'molhado + raio = choque');
  if (hasSt('lento') || hasSt('congelado')) reacoes.push('gelo em molhado = congela');
  if (hasSt('eletrizado')) reacoes.push('raio em molhado = choque em cadeia');
  if (hasSt('queimar')) reacoes.push('fogo em semente = incêndio', 'fogo em veneno = explosão', 'fogo em gelo = derrete');
  if (hasSt('semente')) reacoes.push('semente + fogo = incêndio');
  if (hasSt('veneno')) reacoes.push('veneno + fogo = explosão tóxica');
  if (s.element === 'Flying') reacoes.push('vento espalha os estados');
  if (s.element === 'Ground' || hasSt('lama')) reacoes.push('terra em molhado = lama');
  if (s.kit.moves.some(m => 'hit' in m && (m.hit.postura ?? 1) >= 2)) reacoes.push('quebra postura');
  return { formas, estados, reacoes: [...new Set(reacoes)] };
}
