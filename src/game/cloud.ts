// Ligação do WIT 2 com o banco (supabase/migrations/*_wit2_*.sql), DESLIGADA por padrão.
// Liga com VITE_WIT2_DB=1 no .env depois que o SQL for aplicado com o OK do
// Matheus. Desligada, nada muda: o progresso fica só no navegador.
//
// Como funciona ligada:
//  * ao abrir: `wit2_load` traz moedas, cartas, pó e pacotes (o servidor manda
//    nesses) e o JSON do resto; `mergeServer` junta com o do navegador;
//  * a cada gravação: `wit2_sync` leva o JSON (com versão; se outro aparelho
//    gravou antes, adota o do servidor) e a DIFERENÇA de moedas desde o último
//    envio (o servidor tem teto de ganho por dia e corrige o local se cortar);
//  * pacote, forja, carta do chefe, Caminho e ticket passam pelas funções do
//    servidor (`cloudBuyPack`, `cloudDust`...), que devolvem o novo saldo.
import type { Progress } from './progress';
import type { PackResult } from './packs';
import type { Rarity } from '@/lib/tcg/types';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';

export const cloudEnabled = (): boolean => import.meta.env.VITE_WIT2_DB === '1';

/** Campos que só o servidor muda (moedas vão por diferença, o resto por função). */
export const SERVER_FIELDS = ['coins', 'collection', 'pacotes', 'po', 'semEpica'] as const;

export interface ServerSnapshot {
  coins: number;
  po: Progress['po'];
  semEpica: number;
  caminho?: string | null;
  collection: Record<string, number>;
  pacotes: Record<string, number>;
  data: Partial<Progress> | null;
  version: number;
}

/** Junta o que veio do servidor com o do navegador: os campos de valor são do servidor; o resto, do JSON salvo lá (ou o local, se o servidor ainda não tem). */
export function mergeServer(local: Progress, s: ServerSnapshot): Progress {
  const fromJson = s.data && Object.keys(s.data).length ? s.data : {};
  const m = {
    ...local,
    ...fromJson,
    coins: s.coins,
    po: s.po ?? {},
    semEpica: s.semEpica ?? 0,
    collection: Object.keys(s.collection ?? {}).length ? s.collection : local.collection,
    pacotes: s.pacotes ?? {},
  } as Progress;
  m.andar = Math.min(m.andar, m.towerMax);
  return m;
}

/** O JSON que vai para o servidor: o progresso sem os campos de valor. */
export function toServerJson(p: Progress): Record<string, unknown> {
  const out: Record<string, unknown> = { ...p };
  for (const k of SERVER_FIELDS) delete out[k];
  delete out.tickets;
  return out;
}

type Rpc = (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { supabaseStudent } = await import('@/integrations/supabase/studentClient');
  const call = supabaseStudent.rpc.bind(supabaseStudent) as unknown as Rpc;
  const { data, error } = await call(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

/** As funções do professor usam a sessão do professor (outro cliente). */
export async function rpcTeacher<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { supabase } = await import('@/integrations/supabase/client');
  const call = supabase.rpc.bind(supabase) as unknown as Rpc;
  const { data, error } = await call(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

// ─── sincronia ───────────────────────────────────────────────────────────────
// `base` = as moedas que o servidor já conhece. Cada envio manda `local - base`
// e passa a contar com ele; se o servidor cortou (teto do dia), a resposta
// corrige o local pela diferença.

let version = 0;
let base = 0;
let timer: number | undefined;
let pending: { p: Progress; onFix: Fix } | null = null;
let inflight: Promise<void> = Promise.resolve();
/** Correção depois do envio: `coinFix` soma no saldo atual; `data` (conflito de aparelho) substitui o JSON. */
type Fix = (coinFix: number, data?: Partial<Progress>) => void;

/** Ao abrir o jogo: traz do servidor e junta com o local. */
export async function pullProgress(local: Progress): Promise<Progress> {
  if (!cloudEnabled()) return local;
  const s = await rpc<ServerSnapshot>('wit2_load');
  version = s.version ?? 0;
  base = s.coins;
  return mergeServer(local, s);
}

/** Moedas a mandar agora (puro, para teste). */
export const coinDelta = (local: number, known: number) => local - known;

async function send(p: Progress, onFix: Fix): Promise<void> {
  const delta = coinDelta(p.coins, base);
  base = p.coins;
  try {
    const r = await rpc<{ ok: boolean; coins: number; version?: number; data?: Partial<Progress> }>('wit2_sync', { p_coins_delta: delta, p_data: toServerJson(p), p_version: version });
    if (r.version !== undefined) version = r.version;
    const coinFix = r.coins - base;    // teto do dia: o servidor cortou (ou gasto deixaria negativo)
    base = r.coins;
    const data = !r.ok && r.data ? r.data : undefined;   // outro aparelho gravou antes
    if (coinFix || data) onFix(coinFix, data);
  } catch {
    base -= delta;   // sem rede: a diferença vai na próxima
  }
}

/** Depois de cada gravação local: manda (agrupa gravações seguidas). */
export function schedulePush(p: Progress, onFix: Fix): void {
  if (!cloudEnabled()) return;
  window.clearTimeout(timer);
  pending = { p, onFix };
  timer = window.setTimeout(() => { void flush(); }, 1500);
}

/** Manda já o que estiver esperando (antes de uma operação de valor). */
export async function flush(): Promise<void> {
  window.clearTimeout(timer);
  const job = pending;
  pending = null;
  const prev = inflight;
  inflight = (async () => { await prev; if (job) await send(job.p, job.onFix); })();
  await inflight;
}

/** Depois de uma operação de valor: o saldo do servidor passa a ser o conhecido. */
const known = (coins: number | undefined) => { if (typeof coins === 'number') base = coins; };

/**
 * Depois de algo que mexeu nos valores no servidor (troca, Vitrine): traz só
 * moedas, cartas, pó e pacotes (o resto do progresso local fica).
 */
export async function refreshValues(p: Progress): Promise<Progress> {
  if (!cloudEnabled()) return p;
  await flush();
  const s = await rpc<ServerSnapshot>('wit2_load');
  base = s.coins;
  return { ...p, coins: s.coins, po: s.po ?? {}, semEpica: s.semEpica ?? 0, collection: s.collection ?? p.collection, pacotes: s.pacotes ?? {} };
}

// ─── operações de valor (com a chave ligada, só o servidor muda cartas e pó) ──

type OpenOk = { ok: true; progress: Progress; result: PackResult; fresh: Set<string> };
type Fail = { ok: false; reason: string };
interface DrawResp { cards: string[]; pity: boolean; semEpica: number; coins: number }

function applyDraw(p: Progress, r: DrawResp, extra: Partial<Progress> = {}): OpenOk {
  const collection = { ...p.collection };
  const fresh = new Set<string>();
  for (const id of r.cards) { if (!collection[id]) fresh.add(id); collection[id] = (collection[id] ?? 0) + 1; }
  known(r.coins);
  const cards = r.cards.map(id => CARD_BY_ID.get(id)!).filter(Boolean);
  const stats = { ...p.stats, pacotes: (p.stats.pacotes ?? 0) + 1 };
  return { ok: true, progress: { ...p, ...extra, coins: r.coins, collection, semEpica: r.semEpica, stats }, result: { cards, pity: r.pity, dry: r.semEpica }, fresh };
}

const why = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e);
  const nice: Record<string, string> = {
    'moedas insuficientes': 'Moedas insuficientes.', 'sem esse pacote guardado': 'Você não tem esse pacote guardado.',
    'só cartas repetidas': 'Só dá para desmanchar cartas repetidas (a primeira fica no álbum).', 'pó insuficiente': 'Pó insuficiente.',
    'não se forja': 'Cartas Desconhecidas não podem ser forjadas.', 'precisa de 3 cópias': 'Precisa de 3 cópias.', 'essa carta não evolui': 'Essa carta não evolui.', 'já tem 3 tickets esperando': 'Você já tem 3 tickets esperando.',
  };
  return nice[m] ?? 'Sem conexão com o servidor. Tente de novo.';
};

export async function cloudBuyPack(p: Progress, id: string): Promise<OpenOk | Fail> {
  try { await flush(); return applyDraw(p, await rpc<DrawResp>('wit2_buy_pack', { p_pack: id })); } catch (e) { return { ok: false, reason: why(e) }; }
}
export async function cloudOpenSaved(p: Progress, id: string): Promise<OpenOk | Fail> {
  try {
    await flush();
    const r = await rpc<DrawResp>('wit2_open_saved_pack', { p_pack: id });
    const left = { ...p.pacotes, [id]: (p.pacotes[id] ?? 1) - 1 };
    if (!left[id]) delete left[id];
    return applyDraw(p, r, { pacotes: left });
  } catch (e) { return { ok: false, reason: why(e) }; }
}
export async function cloudDust(p: Progress, id: string, n: number): Promise<{ ok: true; progress: Progress; dust: number; rarity: Rarity } | Fail> {
  try {
    const r = await rpc<{ dust: number; rarity: Rarity; qty: number; po: Progress['po'] }>('wit2_dust', { p_card: id, p_n: n });
    return { ok: true, dust: r.dust, rarity: r.rarity, progress: { ...p, po: r.po, collection: { ...p.collection, [id]: r.qty } } };
  } catch (e) { return { ok: false, reason: why(e) }; }
}
export async function cloudForge(p: Progress, id: string): Promise<{ ok: true; progress: Progress } | Fail> {
  try {
    const r = await rpc<{ qty: number; po: Progress['po'] }>('wit2_forge', { p_card: id });
    return { ok: true, progress: { ...p, po: r.po, collection: { ...p.collection, [id]: r.qty } } };
  } catch (e) { return { ok: false, reason: why(e) }; }
}
export async function cloudEvolve(p: Progress, id: string): Promise<{ ok: true; progress: Progress } | Fail> {
  try {
    const r = await rpc<{ qty: number; plus: number; po: Progress['po'] }>('wit2_evolve', { p_card: id });
    return { ok: true, progress: { ...p, po: r.po, collection: { ...p.collection, [id]: r.qty, [id + '+']: r.plus } } };
  } catch (e) { return { ok: false, reason: why(e) }; }
}
/** Carta do chefe: o local já somou; o servidor confere e devolve quantas o aluno tem de verdade. */
export async function cloudBossCard(andar: number, card: string): Promise<number | null> {
  try { await flush(); return await rpc<number>('wit2_boss_card', { p_andar: andar, p_card: card }); } catch { return null; }
}
export async function cloudChoosePath(path: string): Promise<Record<string, number> | null> {
  try { return await rpc<Record<string, number>>('wit2_choose_path', { p_path: path }); } catch { return null; }
}
export async function cloudBuyReward(reward: string): Promise<{ ok: true; code: string; coins: number } | Fail> {
  try { await flush(); const r = await rpc<{ code: string; coins: number }>('wit2_buy_reward', { p_reward: reward }); known(r.coins); return { ok: true, ...r }; } catch (e) { return { ok: false, reason: why(e) }; }
}
export async function cloudCancelTicket(code: string): Promise<{ ok: true; coins: number } | Fail> {
  try { await flush(); const r = await rpc<{ coins: number }>('wit2_cancel_ticket', { p_code: code }); known(r.coins); return { ok: true, ...r }; } catch (e) { return { ok: false, reason: why(e) }; }
}

export const joinCodeCloud = (code: string) => rpc<boolean>('wit2_join_code', { p_code: code });

// professor
export const teacherLessonCloud = (day: string) => rpcTeacher<{ lesson: string; delivered: string | null; students: { id: string; nome: string; status: string | null; pack: string | null; viaCode: boolean; andar: number }[]; tickets: { code: string; student: string; reward: string; at: string }[] }>('wit2_teacher_lesson', { p_day: day });
export const teacherDeliverCloud = (lesson: string, rows: { student: string; status: string; pack?: string | null; viaCode?: boolean }[]) => rpcTeacher<number>('wit2_teacher_deliver', { p_lesson: lesson, p_rows: rows });
export const classCodeCloud = (lesson: string) => rpcTeacher<string>('wit2_class_code', { p_lesson: lesson });
export const deliverTicketCloud = (code: string) => rpcTeacher<boolean>('wit2_teacher_deliver_ticket', { p_code: code });
