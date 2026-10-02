// "Aula de hoje" do professor (plano §7.2): um toque por aluno define
// presença e desempenho; cada desempenho tem um pacote padrão que o professor
// pode trocar; ENTREGAR grava tudo de uma vez. Código de 4 dígitos no
// projetor, trocando a cada 30 s. Regras puras: a tela de demonstração usa
// dados de mentira; no banco, a entrega vira uma RPC (docs/banco-wit2.md).
import type { PackId } from './packs';

export type LessonStatus = 'faltou' | 'presente' | 'foi_bem' | 'excepcional';
export const STATUS_ORDER: LessonStatus[] = ['faltou', 'presente', 'foi_bem', 'excepcional'];
export const STATUS_NAME: Record<LessonStatus, string> = { faltou: 'Faltou', presente: 'Presente', foi_bem: 'Foi bem', excepcional: 'Excepcional' };
/** Pacote padrão de cada desempenho (plano §4.2). Faltou não ganha. */
export const DEFAULT_PACK: Record<LessonStatus, PackId | null> = { faltou: null, presente: 'comum', foi_bem: 'raro', excepcional: 'epico' };

/** Um toque: faltou → presente → foi bem → excepcional → faltou. */
export const nextStatus = (s: LessonStatus): LessonStatus => STATUS_ORDER[(STATUS_ORDER.indexOf(s) + 1) % STATUS_ORDER.length];

export interface LessonRow { studentId: string; status: LessonStatus; pack?: PackId | null; viaCode?: boolean }

/** O pacote que o aluno ganha (o trocado pelo professor, ou o padrão do desempenho). */
export const packOf = (r: LessonRow): PackId | null => (r.status === 'faltou' ? null : r.pack !== undefined ? r.pack : DEFAULT_PACK[r.status]);

export interface Delivery { grants: { studentId: string; pack: PackId }[]; counts: Record<LessonStatus, number>; packs: Partial<Record<PackId, number>>; present: number; rate: number }

/** O que o ENTREGAR vai gravar: os pacotes de cada aluno e o resumo da aula. */
export function delivery(rows: LessonRow[]): Delivery {
  const counts: Record<LessonStatus, number> = { faltou: 0, presente: 0, foi_bem: 0, excepcional: 0 };
  const packs: Partial<Record<PackId, number>> = {};
  const grants: Delivery['grants'] = [];
  for (const r of rows) {
    counts[r.status]++;
    const p = packOf(r);
    if (p) { grants.push({ studentId: r.studentId, pack: p }); packs[p] = (packs[p] ?? 0) + 1; }
  }
  const present = rows.length - counts.faltou;
  return { grants, counts, packs, present, rate: rows.length ? present / rows.length : 0 };
}

/**
 * Código da aula: 4 dígitos que dependem do segredo da aula e da janela de
 * 30 s. O servidor aceita o código atual e o anterior (o aluno pode ter
 * digitado no fim da janela).
 */
export function lessonCode(secret: string, now: number, windowMs = 30_000): string {
  const w = Math.floor(now / windowMs);
  let h = 2166136261;
  for (const ch of `${secret}|${w}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return String((h >>> 0) % 10000).padStart(4, '0');
}
export const codeOk = (secret: string, code: string, now: number) => code === lessonCode(secret, now) || code === lessonCode(secret, now - 30_000);

/** Quem precisa de atenção: 2 ou mais faltas seguidas (plano §9, "alunos em risco"). */
export function atRisk(history: LessonStatus[][]): number[] {
  // history[aula][aluno], da mais antiga para a mais nova
  const n = history[0]?.length ?? 0;
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    let streak = 0;
    for (let a = history.length - 1; a >= 0 && history[a][k] === 'faltou'; a--) streak++;
    if (streak >= 2) out.push(k);
  }
  return out;
}
