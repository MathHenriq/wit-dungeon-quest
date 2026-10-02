// Pescador: "Diário do lago". Cada peixe pescado entra numa tabela (dia, hora,
// lugar, tamanho). A Casa de Pesca mostra os gráficos dos dados do próprio
// aluno e faz uma pergunta por dia que só se responde olhando para eles.
import { FISH_BY_ID } from './fishing';

export type Spot = 'margem' | 'funda' | 'barco';
export interface LogEntry { f: string; cm: number; h: number; w: Spot; d: number }

export const MAX_LOG = 80;
export const PERIODS = ['madrugada', 'manhã', 'tarde', 'noite'] as const;
export const SPOTS: Spot[] = ['margem', 'funda', 'barco'];
export const SPOT_NAME: Record<Spot, string> = { margem: 'na margem', funda: 'água funda', barco: 'de barco' };
/** Precisa de pelo menos isto para a pergunta do dia. */
export const MIN_FOR_QUESTION = 8;

/** 0–5 madrugada, 5–12 manhã, 12–18 tarde, 18–24 noite. */
export const periodOf = (h: number) => (h < 5 ? 0 : h < 12 ? 1 : h < 18 ? 2 : 3);
const rare = (e: LogEntry) => { const r = FISH_BY_ID.get(e.f)?.rarity; return r === 'raro' || r === 'epico' || r === 'lendario'; };
const isTrash = (e: LogEntry) => FISH_BY_ID.get(e.f)?.rarity === 'lixo';

export const addLog = (log: LogEntry[], e: LogEntry): LogEntry[] => [e, ...log].slice(0, MAX_LOG);

export const byPeriod = (log: LogEntry[]) => PERIODS.map((_, k) => log.filter(e => !isTrash(e) && periodOf(e.h) === k).length);
export const rareBySpot = (log: LogEntry[]) => SPOTS.map(s => log.filter(e => e.w === s && rare(e)).length);
export const countBySpot = (log: LogEntry[]) => SPOTS.map(s => log.filter(e => e.w === s && !isTrash(e)).length);
export const trashCount = (log: LogEntry[]) => log.filter(isTrash).length;

export interface LogQuestion { text: string; options: string[]; answer: number; why: string }

const argmaxUnique = (xs: number[]) => { const m = Math.max(...xs); return xs.filter(x => x === m).length === 1 && m > 0 ? xs.indexOf(m) : -1; };

/** A pergunta do dia (muda com o dia). Sem dados que respondam sem empate, null. */
export function logQuestion(log: LogEntry[], day: number): LogQuestion | null {
  if (log.length < MIN_FOR_QUESTION) return null;
  const qs: LogQuestion[] = [];
  const per = byPeriod(log), pk = argmaxUnique(per);
  if (pk >= 0) qs.push({ text: 'Olhando o seu diário: em que período você pescou MAIS peixes?', options: PERIODS.map(p => p), answer: pk, why: `A barra mais alta é a da ${PERIODS[pk]} (${per[pk]} peixes).` });
  const rs = rareBySpot(log), rk = argmaxUnique(rs);
  if (rk >= 0) qs.push({ text: 'Onde saíram mais peixes RAROS ou melhores, no seu diário?', options: SPOTS.map(s => SPOT_NAME[s]), answer: rk, why: `${rs[rk]} raros ${SPOT_NAME[SPOTS[rk]]}. Para achar peixe raro, vá onde os dados mostram.` });
  const cs = countBySpot(log), ck = argmaxUnique(cs);
  if (ck >= 0) qs.push({ text: 'Em que lugar você mais pescou (contando todos os peixes)?', options: SPOTS.map(s => SPOT_NAME[s]), answer: ck, why: `${cs[ck]} peixes ${SPOT_NAME[SPOTS[ck]]}.` });
  if (!qs.length) return null;
  return qs[day % qs.length];
}

export function sanitizeLog(raw: unknown): LogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(e => e && typeof e.f === 'string' && FISH_BY_ID.has(e.f)).slice(0, MAX_LOG).map(e => ({
    f: e.f, cm: Math.max(0, Math.min(999, Number(e.cm) || 0)), h: Math.max(0, Math.min(23, Math.floor(Number(e.h) || 0))),
    w: SPOTS.includes(e.w) ? e.w : 'margem', d: Math.max(0, Number(e.d) || 0),
  }));
}
