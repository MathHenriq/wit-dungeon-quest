// Loja de Móveis (shopping): os móveis da casa passam a ser comprados. Os da
// casa inicial (HOUSE_START) e alguns básicos já vêm de graça; o resto custa
// pelo tipo e pelo tamanho. Comprou uma vez, põe quantas cópias quiser.
import type { Progress } from './progress';
import { HOUSE_CATS, HOUSE_START, type Manifest } from './interior/room';

const BASE: Record<string, number> = {
  sofa: 220, poltrona: 120, cama: 260, mesa: 140, armario: 200, tapete: 90, planta: 60, luz: 70,
  eletronico: 320, parede: 80, cozinha: 240, banheiro: 200, gamer: 380, extra: 160, jardim: 120,
};

/** Os que já vêm com a casa. */
export const FREE_FURNITURE = new Set(HOUSE_START.map(p => p.id));

export function furniturePrice(m: Manifest, id: string): number {
  const d = m[id];
  if (!d || FREE_FURNITURE.has(id)) return 0;
  const base = BASE[d.cat ?? ''] ?? 150;
  // maior custa mais (1 a 2×), arredondado de 10 em 10
  const area = Math.max(1, (d.w * d.h) / (16 * 16));
  return Math.round((base * Math.min(2, 0.7 + area * 0.15)) / 10) * 10;
}

export const ownsFurniture = (p: Pick<Progress, 'moveis'>, id: string) => FREE_FURNITURE.has(id) || p.moveis.includes(id);

export function buyFurniture(p: Progress, m: Manifest, id: string): { ok: true; progress: Progress } | { ok: false; reason: string } {
  if (!m[id] || !HOUSE_CATS.some(c => c.id === m[id].cat)) return { ok: false, reason: 'Esse móvel não está à venda.' };
  if (ownsFurniture(p, id)) return { ok: false, reason: 'Você já tem esse móvel.' };
  const price = furniturePrice(m, id);
  if (p.coins < price) return { ok: false, reason: `Faltam ${price - p.coins} moedas.` };
  return { ok: true, progress: { ...p, coins: p.coins - price, moveis: [...p.moveis, id] } };
}
