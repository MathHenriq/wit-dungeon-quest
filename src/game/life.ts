// O dia a dia do aluno fora do duelo: contadores do que ele faz (missões e
// Jornal WIT), experiência das profissões, fome e comida, receitas e o limite
// de minijogos por dia. Funções puras sobre o Progress.
import type { Progress } from './progress';
import { addItem } from './progress';
import { itemDef } from './items';
import { levelOf, PROF_BY_ID, type ProfId } from './professions';

/** Dia do jogo para missões e limites: o dia de verdade (muda à meia-noite). */
export const today = (now = Date.now()) => Math.floor((now - new Date(now).getTimezoneOffset() * 60_000) / 86_400_000);

// ─── contadores e experiência ───────────────────────────────────────────────

/** Soma `n` no contador `key` (peixes, colheitas, mesas, entregas...). */
export function bump(p: Progress, key: string, n = 1): Progress {
  return { ...p, stats: { ...p.stats, [key]: (p.stats[key] ?? 0) + n } };
}

/** Dá experiência numa profissão. Diz se subiu de nível. */
export function gainXp(p: Progress, prof: ProfId, n: number): { progress: Progress; levelUp?: number } {
  const before = p.xp[prof] ?? 0, after = before + Math.max(0, Math.round(n));
  const l0 = levelOf(before).level, l1 = levelOf(after).level;
  return { progress: { ...p, xp: { ...p.xp, [prof]: after } }, levelUp: l1 > l0 ? l1 : undefined };
}

/** Escolhe o cargo (pode trocar quando quiser; a experiência de cada profissão fica guardada). */
export function chooseProfession(p: Progress, prof: ProfId): Progress {
  return PROF_BY_ID.has(prof) ? { ...p, profissao: prof } : p;
}

// ─── fome ───────────────────────────────────────────────────────────────────

/** Quanto a barriga esvazia por segundo andando (correndo, o dobro). Cheia → vazia em ~25 min andando. */
export const HUNGER_PER_SEC = 100 / (25 * 60);
export const HUNGRY = 25;

export function spendEnergy(p: Progress, seconds: number, running: boolean): Progress {
  const fome = Math.max(0, p.fome - seconds * HUNGER_PER_SEC * (running ? 2 : 1));
  return fome === p.fome ? p : { ...p, fome };
}

/** Come um item da mochila. */
export function eat(p: Progress, item: string): { ok: true; progress: Progress; gain: number } | { ok: false; reason: string } {
  const def = itemDef(item);
  if (!def?.food) return { ok: false, reason: 'Isso não dá para comer.' };
  if ((p.itens[item] ?? 0) <= 0) return { ok: false, reason: 'Você não tem isso na mochila.' };
  if (p.fome >= 100) return { ok: false, reason: 'Você está de barriga cheia!' };
  const gain = Math.min(def.food, 100 - p.fome);
  return { ok: true, progress: bump({ ...addItem(p, item, -1), fome: p.fome + gain }, 'comidas'), gain };
}

// ─── receitas ───────────────────────────────────────────────────────────────

export interface Recipe { id: string; out: string; needs: Record<string, number>; where: string }

/** Ingrediente "qualquer peixe" e "qualquer fruta" aparecem como peixe:* e fruta:*. */
export const RECIPES: Recipe[] = [
  { id: 'omelete', out: 'omelete', needs: { ovo: 2 }, where: 'Casa da Fazenda' },
  { id: 'pipoca', out: 'pipoca', needs: { 'colheita:milho': 1 }, where: 'Casa da Fazenda' },
  { id: 'salada', out: 'salada', needs: { 'colheita:alface': 1, 'colheita:tomate': 1, 'colheita:cenoura': 1 }, where: 'Casa da Fazenda' },
  { id: 'peixe-assado', out: 'peixe-assado', needs: { 'peixe:*': 1 }, where: 'Casa da Fazenda' },
  { id: 'vitamina', out: 'vitamina', needs: { 'fruta:*': 2, leite: 1 }, where: 'Casa da Fazenda' },
  { id: 'bolo-cenoura', out: 'bolo-cenoura', needs: { 'colheita:cenoura': 2, ovo: 1, leite: 1 }, where: 'Casa da Fazenda' },
  { id: 'torta-abobora', out: 'torta-abobora', needs: { 'colheita:abobora': 1, ovo: 2, leite: 1 }, where: 'Casa da Fazenda' },
];

/** Quais itens da mochila servem para um ingrediente (o curinga pega os comuns primeiro). */
function candidates(p: Progress, need: string): string[] {
  if (!need.endsWith(':*')) return (p.itens[need] ?? 0) > 0 ? [need] : [];
  const prefix = need.slice(0, -1);
  return Object.keys(p.itens).filter(k => k.startsWith(prefix) && p.itens[k] > 0 && (itemDef(k)?.price ?? 0) > 0)
    .sort((a, b) => (itemDef(a)?.price ?? 0) - (itemDef(b)?.price ?? 0));
}

export function canCook(p: Progress, r: Recipe): boolean {
  return Object.entries(r.needs).every(([need, n]) => candidates(p, need).reduce((s, k) => s + (p.itens[k] ?? 0), 0) >= n);
}

export function cook(p: Progress, r: Recipe): { ok: true; progress: Progress } | { ok: false; reason: string } {
  if (!canCook(p, r)) return { ok: false, reason: 'Faltam ingredientes.' };
  let next = p;
  for (const [need, n] of Object.entries(r.needs)) {
    let left = n;
    for (const k of candidates(next, need)) {
      const take = Math.min(left, next.itens[k] ?? 0);
      next = addItem(next, k, -take);
      left -= take;
      if (!left) break;
    }
  }
  return { ok: true, progress: bump(addItem(next, r.out, 1), 'receitas') };
}

// ─── minijogos: quantas vezes por dia rendem ────────────────────────────────

export const PLAYS_PER_DAY = 5;

export function playsLeft(p: Progress, game: string, day = today()): number {
  return PLAYS_PER_DAY - (p.jogos.day === day ? p.jogos.n[game] ?? 0 : 0);
}

export function usePlay(p: Progress, game: string, day = today()): Progress {
  const n = p.jogos.day === day ? { ...p.jogos.n } : {};
  n[game] = (n[game] ?? 0) + 1;
  return { ...p, jogos: { day, n } };
}

/**
 * Resultado de um minijogo: itens, moedas e experiência (com o bônus do
 * cargo e o limite do dia já aplicados por quem chama).
 */
export interface Reward { items: Record<string, number>; coins: number; xp: number }

export function applyReward(p: Progress, prof: ProfId, r: Reward): { progress: Progress; levelUp?: number } {
  let next: Progress = { ...p, coins: p.coins + r.coins };
  for (const [k, n] of Object.entries(r.items)) next = addItem(next, k, n);
  next = bump(next, 'minijogos');
  return gainXp(next, prof, r.xp);
}
