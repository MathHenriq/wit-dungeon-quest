// Ligação do WIT 2 com o banco (supabase/migrations/*_wit2_*.sql).
//
// O aluno em /wit2 só joga depois de carregar do banco (cloud-boot.ts): daí
// em diante a ligação fica ligada e o banco é a verdade. Sem login (ex.:
// /cidade-demo aberta direto) o jogo é só demonstração, no navegador.
//
//  * ao abrir: `wit2_load(p_session)` assume a sessão (um computador por vez) e
//    traz moedas, cartas, pó, pacotes e tickets (o servidor manda nesses), o
//    JSON do resto, a casa e as chaves pequenas do navegador (`_local`);
//  * a cada gravação: `wit2_sync` leva o JSON e a DIFERENÇA de moedas desde o
//    último envio (o servidor tem teto de ganho por dia e corrige o local se
//    cortar). Se outro computador abriu o jogo, o servidor recusa e esta janela
//    para de gravar e pede para recarregar;
//  * pacote, forja, carta do chefe, Caminho, ticket e cristal passam pelas
//    funções do servidor (`cloudBuyPack`, `cloudDust`...), que devolvem o saldo.
import type { Progress } from './progress';
import type { PackResult } from './packs';
import type { Rarity } from '@/lib/tcg/types';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';

let online = false;
/** Ligada: aluno em /wit2 com o progresso carregado do banco. */
export const cloudEnabled = (): boolean => online;

/** Chaves pequenas do navegador que vão no JSON do progresso (em `_local`) e voltam ao abrir. */
export const SYNCED_KEYS = ['wit.fazenda', 'wit.visual', 'wit.historia', 'wit.radio', 'wit.som', 'wit.quebra', 'wit.fase', 'wit.cartaAula', 'wit.onde'] as const;
export type SyncedKey = typeof SYNCED_KEYS[number];
/** Campo do JSON onde vão as chaves acima. */
export const LOCAL_FIELD = '_local';
const store = (): Storage | null => { try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; } };

/** As chaves pequenas do navegador, como estão (texto). */
export function collectLocal(st: Pick<Storage, 'getItem'> | null = store()): Record<string, string> {
  const out: Record<string, string> = {};
  if (!st) return out;
  for (const k of SYNCED_KEYS) { try { const v = st.getItem(k); if (v !== null) out[k] = v; } catch { /* sem armazenamento */ } }
  return out;
}
/** Põe no navegador as chaves que vieram do banco (e tira as que o banco não tem). */
export function writeLocal(raw: unknown, st: Pick<Storage, 'setItem' | 'removeItem'> | null = store()): void {
  if (!st) return;
  const m = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  for (const k of SYNCED_KEYS) {
    try { const v = m[k]; if (typeof v === 'string') st.setItem(k, v); else st.removeItem(k); } catch { /* sem armazenamento */ }
  }
}
/** Grava uma chave pequena no navegador e manda para o banco junto com o progresso (se mudou). */
export function saveLocal(key: SyncedKey, value: string): void {
  const st = store();
  try {
    if (st?.getItem(key) === value) return;
    st?.setItem(key, value);
  } catch { /* sem armazenamento */ }
  queue();
}

/** Campo do JSON com os pacotes que esta janela conhecia no último envio. */
export const SEEN_PACKS = 'pacotesVistos';

/** Campos que só o servidor muda (moedas vão por diferença, o resto por função). */
export const SERVER_FIELDS = ['coins', 'collection', 'pacotes', 'po', 'semEpica'] as const;

export interface ServerSnapshot {
  coins: number;
  po: Progress['po'];
  semEpica: number;
  caminho?: string | null;
  collection: Record<string, number>;
  pacotes: Record<string, number>;
  data: (Partial<Progress> & { [LOCAL_FIELD]?: unknown; [SEEN_PACKS]?: unknown }) | null;
  version: number;
  tickets?: Progress['tickets'];
  /** A casa salva (wit2_house). */
  house?: unknown;
}

/**
 * O progresso a partir do banco: o banco é a base (sobre um progresso novo); os
 * campos de valor vêm das tabelas dele e o resto do JSON. O navegador não entra.
 */
export function fromServer(fresh: Progress, s: ServerSnapshot): Progress {
  const data: Record<string, unknown> = { ...(s.data ?? {}) };
  delete data[LOCAL_FIELD];
  delete data[SEEN_PACKS];
  const m = {
    ...fresh,
    ...data,
    coins: s.coins,
    po: s.po ?? {},
    semEpica: s.semEpica ?? 0,
    collection: Object.keys(s.collection ?? {}).length ? s.collection : fresh.collection,
    pacotes: s.pacotes ?? {},
    tickets: Array.isArray(s.tickets) ? s.tickets : [],
    ...(s.caminho ? { caminho: s.caminho } : {}),
  } as Progress;
  m.andar = Math.min(m.andar, m.towerMax);
  return m;
}

/** O JSON que vai para o servidor: o progresso sem os campos de valor (e os pacotes que o aluno já viu). */
export function toServerJson(p: Progress): Record<string, unknown> {
  const out: Record<string, unknown> = { ...p };
  for (const k of SERVER_FIELDS) delete out[k];
  delete out.tickets;
  out[SEEN_PACKS] = p.pacotes;
  return out;
}

/** Pacotes que chegaram de fora (professor, missão da sala, chefe da guilda) desde o último envio. */
export function newPacks(s: Pick<ServerSnapshot, 'pacotes' | 'data'>): [string, number][] {
  const raw = s.data?.[SEEN_PACKS];
  const seen = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return Object.entries(s.pacotes ?? {})
    .map(([id, n]): [string, number] => [id, n - (typeof seen[id] === 'number' ? seen[id] as number : 0)])
    .filter(([, d]) => d > 0);
}

/** Tem aluno logado neste navegador? Sem login (ex.: /cidade-demo aberta direto) o jogo fica offline em silêncio. */
export async function studentSignedIn(): Promise<boolean> {
  try {
    const { supabaseStudent } = await import('@/integrations/supabase/studentClient');
    const { data } = await supabaseStudent.auth.getSession();
    return !!data.session;
  } catch { return false; }
}

/** O nickname do cadastro do aluno (já conferido pelo servidor: sem o nome real). */
export async function myNickname(): Promise<string | null> {
  try {
    const { supabaseStudent } = await import('@/integrations/supabase/studentClient');
    const { data: u } = await supabaseStudent.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabaseStudent.from('students').select('character_name').eq('user_id', u.user.id).maybeSingle();
    const n = (data as { character_name?: string | null } | null)?.character_name?.trim();
    return n || null;
  } catch { return null; }
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
// corrige o local pela diferença. Só a sessão que abriu o jogo por último grava.

let session = '';
let version = 0;
let base = 0;
let timer: number | undefined;
let retry = 0;
let wanted = false;
let inflight: Promise<void> = Promise.resolve();
let current: () => Progress | null = () => null;
/** Moedas cortadas pelo servidor: soma no saldo do navegador. */
type Fix = (coinFix: number) => void;
let fixCoins: Fix = () => undefined;

/** Salvo, salvando, sem rede (tenta de novo sozinho) ou outra sessão assumiu (recarregar). */
export type SyncState = 'salvo' | 'salvando' | 'sem-rede' | 'outra-sessao';
let state: SyncState = 'salvo';
const watchers = new Set<(s: SyncState) => void>();
export const syncState = (): SyncState => state;
export function watchSync(fn: (s: SyncState) => void): () => void {
  watchers.add(fn);
  fn(state);
  return () => { watchers.delete(fn); };
}
function setState(s: SyncState): void {
  if (s === state) return;
  state = s;
  for (const fn of watchers) fn(s);
}

let listening = false;
/** Liga a sincronia depois do `wit2_load(p_session)` (cloud-boot.ts). */
export function startSync(o: { session: string; version: number; coins: number; current: () => Progress | null; fix: Fix }): void {
  session = o.session; version = o.version ?? 0; base = o.coins ?? 0; current = o.current; fixCoins = o.fix;
  retry = 0; wanted = false; online = true; setState('salvo');
  if (listening || typeof window === 'undefined') return;
  listening = true;
  // ao esconder ou fechar a aba, manda na hora o que estiver esperando
  const now = () => { void flush(); sendPhotos(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') now(); });
  window.addEventListener('pagehide', now);
}
/** Desliga (testes, ou sair do jogo). */
export function stopSync(): void {
  if (typeof window !== 'undefined') window.clearTimeout(timer);
  online = false; wanted = false; setState('salvo');
}

/** Moedas a mandar agora (puro, para teste). */
export const coinDelta = (local: number, known: number) => local - known;

function queue(): void {
  if (!online || state === 'outra-sessao') return;
  wanted = true;
  if (state !== 'sem-rede') setState('salvando');
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { void flush(); }, 1000);
}

/** Depois de cada gravação local do progresso (progress.ts): manda em 1 s, agrupando as seguidas. */
export function schedulePush(): void { queue(); }

async function send(p: Progress): Promise<void> {
  const delta = coinDelta(p.coins, base);
  base = p.coins;
  try {
    const r = await rpc<{ ok: boolean; sessao?: boolean; coins?: number; version?: number }>('wit2_sync', {
      p_coins_delta: delta, p_data: { ...toServerJson(p), [LOCAL_FIELD]: collectLocal() }, p_version: version, p_session: session,
    });
    if (!r.ok) {
      // outro computador (ou outra janela) abriu o jogo, ou o professor zerou o progresso:
      // esta janela para de gravar e pede para recarregar
      base -= delta;
      setState('outra-sessao');
      return;
    }
    if (typeof r.version === 'number') version = r.version;
    const coins = typeof r.coins === 'number' ? r.coins : base;
    const coinFix = coins - base;    // teto do dia: o servidor cortou (ou gasto deixaria negativo)
    base = coins;
    if (coinFix) fixCoins(coinFix);
    retry = 0;
    setState(wanted ? 'salvando' : 'salvo');
  } catch (e) {
    base -= delta;   // sem rede: a diferença vai na próxima
    // o aluno não existe mais no banco (o professor apagou): para, como outra sessão
    if (e instanceof Error && e.message === 'forbidden') { setState('outra-sessao'); return; }
    wanted = true;
    setState('sem-rede');
    retry = Math.min(retry + 1, 6);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { void flush(); }, [2, 4, 8, 15, 30, 60][retry - 1] * 1000);
  }
}

/** Manda já o que estiver esperando (antes de uma operação de valor, ao esconder a aba). */
export async function flush(): Promise<void> {
  if (typeof window !== 'undefined') window.clearTimeout(timer);
  const prev = inflight;
  inflight = (async () => {
    await prev;
    if (!wanted || !online || state === 'outra-sessao') return;
    wanted = false;
    const p = current();
    if (p) await send(p);
  })();
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
    'limite de pó do dia': 'Hoje os cristais já viraram o máximo de pó. Amanhã tem mais.',
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
/** Carta do chefe do portal (o servidor confere o rank liberado e sorteia do deck do chefe; 3 por dia). */
export async function cloudDungeonCard(rank: number): Promise<string | null> {
  try { await flush(); return await rpc<string>('wit2_dungeon_claim', { p_rank: rank }); } catch { return null; }
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

/** Cristal da masmorra vira pó (o pó é do servidor): usa só os que cabem no teto do dia e diz quantos. */
export async function cloudCrystalDust(item: string, n: number): Promise<{ ok: true; po: Progress['po']; usados: number; ganho: number } | Fail> {
  try {
    await flush();
    const r = await rpc<{ po: Progress['po']; usados: number; ganho: number }>('wit2_crystals_dust', { p_item: item, p_n: n });
    return { ok: true, ...r };
  } catch (e) { return { ok: false, reason: why(e) }; }
}

// ─── fotos (o álbum inteiro numa linha: wit2_photos) ─────────────────────────
let photoTimer: number | undefined;
let photoList: unknown[] | null = null;
function sendPhotos(): void {
  window.clearTimeout(photoTimer);
  const list = photoList;
  photoList = null;
  if (list && online && state !== 'outra-sessao') void rpc('wit2_photos_save', { p_list: list }).catch(err => console.error('fotos', err));
}
/** Depois de cada mudança no álbum: manda em 1,5 s (ou na hora, ao fechar a aba). */
export function cloudSavePhotos(list: unknown[]): void {
  if (!online) return;
  photoList = list;
  window.clearTimeout(photoTimer);
  photoTimer = window.setTimeout(sendPhotos, 1500);
}
export async function cloudLoadPhotos(): Promise<unknown[] | null> {
  try { return await rpc<unknown[]>('wit2_photos_get'); } catch { return null; }
}

export const joinCodeCloud = (code: string) => rpc<boolean>('wit2_join_code', { p_code: code });

// professor
export const teacherLessonCloud = (day: string) => rpcTeacher<{ lesson: string; delivered: string | null; students: { id: string; nome: string; status: string | null; pack: string | null; viaCode: boolean; andar: number }[]; tickets: { code: string; student: string; reward: string; at: string }[] }>('wit2_teacher_lesson', { p_day: day });
export const teacherDeliverCloud = (lesson: string, rows: { student: string; status: string; pack?: string | null; viaCode?: boolean }[]) => rpcTeacher<number>('wit2_teacher_deliver', { p_lesson: lesson, p_rows: rows });
export const classCodeCloud = (lesson: string) => rpcTeacher<string>('wit2_class_code', { p_lesson: lesson });
export const deliverTicketCloud = (code: string) => rpcTeacher<boolean>('wit2_teacher_deliver_ticket', { p_code: code });
