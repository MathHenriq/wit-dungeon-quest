// Chamadas do painel do professor (/professor): uma função do banco por ação
// (supabase/migrations/*_wit2_salvar_tudo.sql, *_wit2_professor_apagar.sql e as
// denúncias de *_wit2_social.sql), cada uma com prazo para responder, para o
// painel nunca ficar carregando para sempre.
import { supabase } from '@/integrations/supabase/client';
import type { ReportReason } from '@/game/report-reasons';

export type StudentStatus = 'pending' | 'active';
export interface StudentRow {
  id: string;
  nome: string;
  status: StudentStatus;
  criado: string | null;
  /** Suspenso até (só se ainda vale). */
  suspenso: string | null;
  andar: number;
  moedas: number;
  /** Última vez que o jogo salvou. */
  ultimo: string | null;
  professor: string | null;
  /** Usuário de login (para o master redefinir a senha pela função de admin). */
  login: string | null;
}
export interface StudentPage { total: number; rows: StudentRow[] }
/** Denúncia aberta contra um aluno do professor (quem denunciou só o professor vê). */
export interface ReportRow { id: number; reason: ReportReason; at: string; alvo: string; alvoApelido: string | null; quem: string }
export type ReportAction = 'ok' | 'silenciar' | 'apelido';
export interface TeacherOption { id: string; nome: string; alunos: number }

export const PAGE = 50;
const TIMEOUT_MS = 15000;

function withTimeout<T>(p: PromiseLike<T>): Promise<T> {
  return new Promise((ok, fail) => {
    const t = window.setTimeout(() => fail(new Error('O banco demorou para responder. Tente de novo.')), TIMEOUT_MS);
    p.then(v => { window.clearTimeout(t); ok(v); }, e => { window.clearTimeout(t); fail(e); });
  });
}

type Rpc = (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
async function call<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const rpc = supabase.rpc.bind(supabase) as unknown as Rpc;
  const { data, error } = await withTimeout(rpc(fn, args));
  if (error) {
    if (error.message === 'forbidden') throw new Error('Sem permissão para isso.');
    // função que ainda não foi aplicada no banco (docs/sql/APLICAR.md)
    if (/could not find the function/i.test(error.message)) throw new Error('Essa ação ainda não foi ligada no banco. Avise quem cuida do sistema.');
    throw new Error(error.message);
  }
  return data as T;
}

/** Uma página da lista. `teacher` = de qual professor (master); `todos` = de todos (master). */
export const listStudents = (o: { status: StudentStatus; q?: string; offset?: number; teacher?: string | null; todos?: boolean }) =>
  call<StudentPage>('wit2_teacher_list', {
    p_status: o.status, p_q: o.q ?? '', p_limit: PAGE, p_offset: o.offset ?? 0, p_teacher: o.teacher ?? null, p_todos: !!o.todos,
  });
export const approveStudent = (id: string) => call<boolean>('wit2_teacher_approve', { p_student: id });
export const rejectStudent = (id: string) => call<boolean>('wit2_teacher_reject', { p_student: id });
/** 0 dias = reativa. Devolve até quando ficou suspenso. */
export const suspendStudent = (id: string, days: number) => call<string | null>('wit2_teacher_suspend', { p_student: id, p_days: days });
export const resetProgress = (id: string) => call<boolean>('wit2_teacher_reset', { p_student: id });
export const deleteStudent = (id: string) => call<boolean>('wit2_teacher_delete', { p_student: id });
/** Denúncias abertas contra os alunos de quem está logado. */
export const listReports = () => call<ReportRow[]>('wit2_teacher_reports');
/** Resolve todas as denúncias abertas daquele aluno: ok, silenciar o balão 7 dias ou o apelido volta para "Desafiante". */
export const resolveReport = (id: number, action: ReportAction) => call<boolean>('wit2_teacher_resolve', { p_report: id, p_action: action });
/** Só o master recebe a lista (os outros recebem []). */
export const masterTeachers = () => call<TeacherOption[]>('wit2_master_teachers');

/**
 * Nova senha para o aluno. O professor dele usa a função do professor; o
 * admin, com aluno de outro professor, a de admin.
 */
export async function resetPassword(row: StudentRow, password: string, asAdmin: boolean): Promise<void> {
  const { data, error } = await withTimeout(asAdmin && row.login
    ? supabase.functions.invoke<{ ok: boolean }>('admin-reset-password', { body: { auth_user_id: row.login, new_password: password } })
    : supabase.functions.invoke<{ ok: boolean }>('teacher-reset-student-password', { body: { student_id: row.id, new_password: password } }));
  if (!error && data?.ok) return;
  let detail: string | undefined;
  const ctx = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;
  if (ctx?.json) {
    try { const j = await ctx.json() as { detail?: string; error?: string }; detail = j.detail ?? j.error; } catch { /* sem corpo */ }
  }
  const nice: Record<string, string> = {
    'student has no login (no auth user)': 'Esse aluno não tem login.',
    'password too short (min 6)': 'A senha precisa de pelo menos 6 letras ou números.',
    'forbidden: student belongs to another teacher': 'Esse aluno é de outro professor.',
  };
  throw new Error((detail && nice[detail]) ?? detail ?? error?.message ?? 'Não deu para trocar a senha.');
}
