// Vida na Sua Casa: plantas que crescem com rega (uma vez por dia; a cada 5
// regas dão fruto) e a festa (convida os amigos; com o banco ligado eles
// recebem o aviso e podem visitar). Regras puras.
import type { Progress } from './progress';
import { addItem } from './progress';

export const REGAS_POR_FRUTO = 5;

/** Fruto de cada planta pelo nome do sprite (as que não são árvore de fruta dão maçã). */
export function fruitOf(plantId: string): string {
  if (/limoeiro/.test(plantId)) return 'fruta:limao';
  if (/laranj/.test(plantId)) return 'fruta:laranja';
  if (/pessego/.test(plantId)) return 'fruta:pessego';
  return 'fruta:maca';
}

export const plantKey = (id: string, tx: number, ty: number) => `${id}@${tx},${ty}`;

export type WaterResult = { progress: Progress; text: string; fruit?: string };

/** Regar a planta: 1 vez por dia; a 5ª rega dá um fruto e recomeça. */
export function waterPlant(p: Progress, key: string, day: number): WaterResult {
  const cur = p.plantas[key] ?? { regas: 0, dia: -1 };
  if (cur.dia === day) return { progress: p, text: 'Ela já foi regada hoje. Volte amanhã!' };
  const regas = cur.regas + 1;
  if (regas >= REGAS_POR_FRUTO) {
    const fruit = fruitOf(key.split('@')[0]);
    const next = addItem({ ...p, plantas: { ...p.plantas, [key]: { regas: 0, dia: day } } }, fruit, 1);
    return { progress: next, text: 'Ela cresceu e deu fruto! Foi para a mochila.', fruit };
  }
  const falta = REGAS_POR_FRUTO - regas;
  return { progress: { ...p, plantas: { ...p.plantas, [key]: { regas, dia: day } } }, text: `Você regou. Mais ${falta} ${falta === 1 ? 'dia' : 'dias'} de rega e ela dá fruto.` };
}

/** Limpa o estado das plantas que saíram da casa. */
export function prunePlants(p: Progress, keys: string[]): Progress {
  const keep = new Set(keys);
  const plantas = Object.fromEntries(Object.entries(p.plantas).filter(([k]) => keep.has(k)));
  return Object.keys(plantas).length === Object.keys(p.plantas).length ? p : { ...p, plantas };
}
