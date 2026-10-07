// Ligação do WIT 2 com o banco (docs/sql/wit2-banco.sql), DESLIGADA por padrão.
// Liga com VITE_WIT2_DB=1 no .env depois que o SQL for aplicado com o OK do
// Matheus. Desligada, nada muda: o progresso fica só no navegador.
//
// Como funciona ligada:
//  * ao abrir: `wit2_load` traz moedas, cartas, pacotes e Torre (o servidor
//    manda nesses) e o JSON do resto; `mergeServer` junta com o do navegador;
//  * a cada gravação: o JSON vai para `wit2_save_progress` (com versão; se
//    outro aparelho gravou antes, adota o do servidor);
//  * moeda, pacote, duelo e ticket passam pelas funções do servidor
//    (`buyPackCloud`, `duelCloud`, `buyRewardCloud`), nunca "lê, soma e grava".
import type { Progress } from './progress';

export const cloudEnabled = (): boolean => import.meta.env.VITE_WIT2_DB === '1';

/** Campos que só o servidor muda. */
export const SERVER_FIELDS = ['coins', 'collection', 'pacotes', 'po', 'semEpica', 'towerMax', 'andar', 'wins'] as const;

export interface ServerSnapshot {
  coins: number;
  po: Progress['po'];
  semEpica: number;
  collection: Record<string, number>;
  pacotes: Record<string, number>;
  tower: { towerMax: number; andar: number; wins: Record<string, number> };
  data: Partial<Progress> | null;
  version: number;
}

/** Junta o que veio do servidor com o do navegador: os campos de valor são do servidor; o resto, do JSON salvo lá (ou o local, se o servidor ainda não tem). */
export function mergeServer(local: Progress, s: ServerSnapshot): Progress {
  const fromJson = s.data && Object.keys(s.data).length ? s.data : {};
  return {
    ...local,
    ...fromJson,
    coins: s.coins,
    po: s.po ?? {},
    semEpica: s.semEpica ?? 0,
    collection: Object.keys(s.collection ?? {}).length ? s.collection : local.collection,
    pacotes: s.pacotes ?? {},
    towerMax: s.tower?.towerMax ?? local.towerMax,
    andar: Math.min(s.tower?.andar ?? local.andar, s.tower?.towerMax ?? local.towerMax),
    wins: s.tower?.wins ?? local.wins,
  } as Progress;
}

/** O JSON que vai para o servidor: o progresso sem os campos de valor. */
export function toServerJson(p: Progress): Record<string, unknown> {
  const out: Record<string, unknown> = { ...p };
  for (const k of SERVER_FIELDS) delete out[k];
  delete out.tickets;
  return out;
}

type Rpc = (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { supabaseStudent } = await import('@/integrations/supabase/studentClient');
  const call = supabaseStudent.rpc.bind(supabaseStudent) as unknown as Rpc;
  const { data, error } = await call(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

let version = 0;
let timer: number | undefined;

/** Ao abrir o jogo: traz do servidor e junta com o local. */
export async function pullProgress(local: Progress): Promise<Progress> {
  if (!cloudEnabled()) return local;
  const s = await rpc<ServerSnapshot>('wit2_load');
  version = s.version ?? 0;
  return mergeServer(local, s);
}

/** Depois de cada gravação local: manda o JSON (agrupa gravações seguidas). */
export function schedulePush(p: Progress, onConflict: (server: Partial<Progress>) => void): void {
  if (!cloudEnabled()) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(async () => {
    try {
      const r = await rpc<{ ok: boolean; version: number; data?: Partial<Progress> }>('wit2_save_progress', { p_data: toServerJson(p), p_version: version });
      version = r.version;
      if (!r.ok && r.data) onConflict(r.data);
    } catch { /* sem rede: tenta na próxima gravação */ }
  }, 1500);
}

export const buyPackCloud = (pack: string) => rpc<string[]>('wit2_buy_pack', { p_pack: pack });
export const openSavedCloud = (pack: string) => rpc<string[]>('wit2_open_saved_pack', { p_pack: pack });
export const duelCloud = (andar: number, kind: 'mesa' | 'chefe', mesa: number, won: boolean) =>
  rpc<{ won: boolean; coins: number; firstWin?: boolean; card?: string; unlocked?: number; limite?: boolean }>('wit2_duel_result', { p_andar: andar, p_kind: kind, p_mesa: mesa, p_won: won });
export const buyRewardCloud = (reward: string) => rpc<string>('wit2_buy_reward', { p_reward: reward });
export const joinCodeCloud = (code: string) => rpc<boolean>('wit2_join_code', { p_code: code });

// professor
export const teacherLessonCloud = (day: string) => rpc<{ lesson: string; delivered: string | null; students: { id: string; nome: string; status: string | null; pack: string | null; viaCode: boolean }[]; tickets: { code: string; student: string; reward: string; at: string }[] }>('wit2_teacher_lesson', { p_day: day });
export const teacherDeliverCloud = (lesson: string, rows: { student: string; status: string; pack?: string }[]) => rpc<number>('wit2_teacher_deliver', { p_lesson: lesson, p_rows: rows });
export const classCodeCloud = (lesson: string) => rpc<string>('wit2_class_code', { p_lesson: lesson });
export const deliverTicketCloud = (code: string) => rpc<boolean>('wit2_teacher_deliver_ticket', { p_code: code });
