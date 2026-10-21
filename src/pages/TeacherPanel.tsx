// Painel do professor do WIT 2 (/professor): só o que o professor usa no dia a
// dia, com uma consulta por aba, botão ATUALIZAR e nada em tempo real.
//  * Cadastros: aprovar ou recusar quem pediu para entrar na turma.
//  * Alunos: busca, páginas de 50, senha nova, suspender/reativar, zerar o
//    progresso (reaproveita a conta de teste) e apagar.
//  * Denúncias: o que os alunos denunciaram pelo cartão de perfil (sempre dos
//    alunos de quem está logado): está tudo bem, silenciar o balão, trocar o apelido.
// O master (wit2_masters) escolhe de qual professor ver, ou todos.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  approveStudent, deleteStudent, listReports, listStudents, masterTeachers, PAGE, rejectStudent, resetPassword, resetProgress, resolveReport,
  suspendStudent, type ReportAction, type ReportRow, type StudentPage, type StudentRow, type StudentStatus, type TeacherOption,
} from '@/lib/teacher-api';
import { REPORT_REASONS } from '@/game/report-reasons';

type Tab = 'cadastros' | 'alunos' | 'denuncias';
const TAB_NAME: Record<Tab, string> = { cadastros: 'Cadastros', alunos: 'Alunos', denuncias: 'Denúncias' };
/** De quem ver: os meus, de um professor (master) ou de todos (master). */
type Scope = { kind: 'meus' } | { kind: 'professor'; id: string } | { kind: 'todos' };
type Ask = { row: StudentRow; what: 'recusar' | 'zerar' | 'apagar' | 'senha' | 'suspender' };

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
function ago(iso: string | null): string {
  if (!iso) return 'nunca jogou';
  const d = new Date(iso), now = new Date();
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (days <= 0) return `hoje, ${hm}`;
  if (days === 1) return `ontem, ${hm}`;
  if (days < 30) return `há ${days} dias`;
  return `em ${d.toLocaleDateString('pt-BR')}`;
}

function Btn({ children, tone = 'plain', ...rest }: { children: ReactNode; tone?: 'plain' | 'go' | 'warn' | 'danger' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const tones = {
    plain: 'border-white/20 text-white/85 hover:bg-white/10',
    go: 'border-emerald-400/60 text-emerald-200 hover:bg-emerald-400/15',
    warn: 'border-amber-400/60 text-amber-200 hover:bg-amber-400/15',
    danger: 'border-rose-400/60 text-rose-200 hover:bg-rose-400/15',
  };
  return (
    <button type="button" {...rest}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${tones[tone]} ${rest.className ?? ''}`}>
      {children}
    </button>
  );
}

export default function TeacherPanel() {
  const { teacher, isLoading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab | null>(null);
  const [scope, setScope] = useState<Scope>({ kind: 'meus' });
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<StudentPage | null>(null);
  const [pendingTotal, setPendingTotal] = useState<number | null>(null);
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [busy, setBusy] = useState(false);
  const req = useRef(0);

  const scopeArgs = useCallback(() => (
    scope.kind === 'todos' ? { todos: true } : scope.kind === 'professor' ? { teacher: scope.id } : {}
  ), [scope]);

  // a lista da aba aberta: uma consulta (a resposta velha de uma busca anterior é ignorada)
  const load = useCallback(async () => {
    if (!tab || !teacher) return;
    const n = ++req.current;
    setLoading(true); setError(null);
    try {
      if (tab === 'denuncias') {
        const r = await listReports();
        if (n === req.current) setReports(r);
        return;
      }
      const status: StudentStatus = tab === 'cadastros' ? 'pending' : 'active';
      const r = await listStudents({ status, q: query, offset, ...scopeArgs() });
      if (n !== req.current) return;
      setPage(r);
      if (status === 'pending') setPendingTotal(r.total);
    } catch (e) {
      if (n === req.current) setError(e instanceof Error ? e.message : 'Não deu para carregar.');
    } finally {
      if (n === req.current) setLoading(false);
    }
  }, [tab, teacher, query, offset, scopeArgs]);
  useEffect(() => { void load(); }, [load]);

  // ao abrir: quantos cadastros esperam (abre nessa aba se tiver algum) e, para o master, os professores
  useEffect(() => {
    if (!teacher) return;
    let alive = true;
    listStudents({ status: 'pending', ...scopeArgs() })
      .then(r => { if (!alive) return; setPendingTotal(r.total); setTab(t => t ?? (r.total > 0 ? 'cadastros' : 'alunos')); })
      .catch(() => { if (alive) setTab(t => t ?? 'alunos'); });
    return () => { alive = false; };
  }, [teacher, scopeArgs]);
  useEffect(() => {
    if (!teacher) return;
    masterTeachers().then(setTeachers).catch(() => setTeachers([]));
    // quantas denúncias abertas (o número aparece na aba)
    listReports().then(setReports).catch(() => setReports(null));
  }, [teacher]);

  // busca: espera parar de digitar
  useEffect(() => {
    const t = window.setTimeout(() => { setQuery(q.trim()); setOffset(0); }, 350);
    return () => window.clearTimeout(t);
  }, [q]);

  if (isLoading) return <div className="min-h-screen bg-[#0d1512] text-white/70 flex items-center justify-center text-sm">Carregando...</div>;
  if (!teacher) return <Navigate to="/professor/login" replace />;

  const isMaster = teachers.length > 0;
  const mine = scope.kind === 'meus';
  // uma ação, depois a lista de novo (o aviso da ação fica por cima do da lista)
  const act = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true); setNote(null); setError(null);
    let fail: string | null = null;
    try {
      // false = nada mudou (outra pessoa já tinha resolvido, ou a lista estava velha)
      if (await fn() === false) throw new Error('Nada mudou: a lista estava desatualizada.');
    } catch (e) { fail = e instanceof Error ? e.message : 'Não deu.'; }
    await load();
    setBusy(false);
    if (fail) setError(fail); else { setNote(label); setAsk(null); }
  };
  const go = (t: Tab) => { setTab(t); setOffset(0); setPage(null); setAsk(null); setNote(null); };
  const resolve = (r: ReportRow, a: ReportAction) => {
    const label = { ok: `Denúncia sobre ${r.alvo} resolvida: está tudo bem.`, silenciar: `O balão de ${r.alvo} fica desligado por 7 dias.`, apelido: `O apelido de ${r.alvo} voltou para "Desafiante".` }[a];
    void act(label, () => resolveReport(r.id, a));
  };
  const rows = page?.rows ?? [];
  const total = page?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#0d1512] text-white">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <header className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <div className="text-[11px] uppercase tracking-widest text-emerald-300/80">WIT Dungeon</div>
            <h1 className="text-xl font-bold">Painel do professor</h1>
            <div className="text-xs text-white/55">{teacher.name}</div>
          </div>
          {isMaster && (
            <label className="text-xs text-white/70 flex items-center gap-2">
              Ver
              <select className="rounded-md border border-white/20 bg-[#16221d] px-2 py-1.5 text-xs text-white"
                value={scope.kind === 'professor' ? scope.id : scope.kind}
                onChange={e => {
                  const v = e.target.value;
                  setScope(v === 'meus' ? { kind: 'meus' } : v === 'todos' ? { kind: 'todos' } : { kind: 'professor', id: v });
                  setOffset(0); setPage(null); setAsk(null);
                }}>
                <option value="meus">Meus alunos</option>
                {teachers.filter(t => t.id !== teacher.id).map(t => <option key={t.id} value={t.id}>{t.nome} · {t.alunos}</option>)}
                <option value="todos">Todos os professores</option>
              </select>
            </label>
          )}
          <Btn onClick={() => { void load(); }} disabled={loading}>ATUALIZAR</Btn>
          {teacher.is_admin && <Link to="/professor/admin" className="text-xs text-white/60 underline hover:text-white">contas (admin)</Link>}
          <Btn onClick={() => { void signOut(); }}>SAIR</Btn>
        </header>

        <nav className="mt-5 flex gap-2 border-b border-white/10">
          {(['cadastros', 'alunos', 'denuncias'] as Tab[]).map(t => {
            const badge = t === 'cadastros' ? pendingTotal : t === 'denuncias' ? reports?.length : 0;
            return (
              <button key={t} type="button" onClick={() => go(t)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === t ? 'border-emerald-400 text-white' : 'border-transparent text-white/55 hover:text-white/85'}`}>
                {TAB_NAME[t]}
                {!!badge && <span className={`ml-2 rounded-full px-1.5 text-[11px] font-bold text-black ${t === 'denuncias' ? 'bg-rose-400' : 'bg-amber-400'}`}>{badge}</span>}
              </button>
            );
          })}
        </nav>

        {tab === 'alunos' && (
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar pelo apelido ou nome"
            className="mt-4 w-full rounded-md border border-white/15 bg-[#16221d] px-3 py-2 text-sm text-white placeholder:text-white/35" />
        )}

        <div aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm">
          {error && <span className="text-rose-300">{error} <button type="button" className="underline" onClick={() => { void load(); }}>Tentar de novo</button></span>}
          {!error && note && <span className="text-emerald-300">{note}</span>}
        </div>

        {tab === 'denuncias' ? (
          <Reports rows={reports} loading={loading} busy={busy} onResolve={resolve} />
        ) : (loading && !page) || !tab ? <div className="py-10 text-center text-sm text-white/55">Carregando...</div> : (
          <>
            <div className="mb-2 text-xs text-white/50">
              {total === 0 ? (tab === 'cadastros' ? 'Nenhum cadastro esperando.' : query ? 'Ninguém com esse nome.' : 'Nenhum aluno ainda.')
                : `${offset + 1}–${Math.min(offset + PAGE, total)} de ${total}${loading ? ' · atualizando...' : ''}`}
            </div>
            <ul className="divide-y divide-white/10 rounded-lg border border-white/10 bg-[#111b17]">
              {rows.map(r => (
                <li key={r.id} className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="mr-auto min-w-[10rem]">
                      <div className="font-semibold">{r.nome}</div>
                      <div className="text-xs text-white/55">
                        {tab === 'cadastros'
                          ? `pediu em ${r.criado ? fmtDay(r.criado) : '?'}`
                          : <>andar {r.andar} · {r.moedas} moedas · {ago(r.ultimo)}</>}
                        {!mine && r.professor ? ` · ${r.professor}` : ''}
                      </div>
                      {r.suspenso && <div className="text-xs text-amber-300">suspenso até {fmtDay(r.suspenso)}</div>}
                    </div>
                    {tab === 'cadastros' ? (
                      <div className="flex flex-wrap gap-2">
                        <Btn tone="go" disabled={busy} onClick={() => { void act(`${r.nome} entrou na turma.`, () => approveStudent(r.id)); }}>APROVAR</Btn>
                        <Btn tone="danger" disabled={busy} onClick={() => setAsk({ row: r, what: 'recusar' })}>RECUSAR</Btn>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Btn disabled={busy} onClick={() => setAsk({ row: r, what: 'senha' })}>SENHA</Btn>
                        {r.suspenso
                          ? <Btn tone="go" disabled={busy} onClick={() => { void act(`${r.nome} pode jogar de novo.`, () => suspendStudent(r.id, 0)); }}>REATIVAR</Btn>
                          : <Btn tone="warn" disabled={busy} onClick={() => setAsk({ row: r, what: 'suspender' })}>SUSPENDER</Btn>}
                        <Btn tone="warn" disabled={busy} onClick={() => setAsk({ row: r, what: 'zerar' })}>ZERAR</Btn>
                        <Btn tone="danger" disabled={busy} onClick={() => setAsk({ row: r, what: 'apagar' })}>APAGAR</Btn>
                      </div>
                    )}
                  </div>
                  {ask?.row.id === r.id && (
                    <Confirm ask={ask} busy={busy} onCancel={() => setAsk(null)} onDone={(label, fn) => { void act(label, fn); }}
                      asAdmin={!mine && !!teacher.is_admin} />
                  )}
                </li>
              ))}
            </ul>
            {total > PAGE && (
              <div className="mt-3 flex items-center justify-between">
                <Btn disabled={offset === 0 || loading} onClick={() => setOffset(o => Math.max(0, o - PAGE))}>ANTERIORES</Btn>
                <Btn disabled={offset + PAGE >= total || loading} onClick={() => setOffset(o => o + PAGE)}>PRÓXIMOS</Btn>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Denúncias abertas (dos alunos de quem está logado). Resolver uma vale para todas as do mesmo aluno. */
function Reports({ rows, loading, busy, onResolve }: {
  rows: ReportRow[] | null; loading: boolean; busy: boolean; onResolve: (r: ReportRow, a: ReportAction) => void;
}) {
  if (!rows) return <div className="py-10 text-center text-sm text-white/55">{loading ? 'Carregando...' : 'Não deu para carregar as denúncias.'}</div>;
  return (
    <>
      <div className="mb-2 text-xs text-white/50">
        {rows.length ? `${rows.length} aberta${rows.length > 1 ? 's' : ''}. Só você vê quem denunciou.` : 'Nenhuma denúncia aberta.'}
      </div>
      {!!rows.length && (
        <ul className="divide-y divide-white/10 rounded-lg border border-white/10 bg-[#111b17]">
          {rows.map(r => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3">
              <div className="mr-auto min-w-[12rem]">
                <div className="font-semibold">{r.alvo}{r.alvoApelido && r.alvoApelido !== r.alvo ? ` (no jogo: ${r.alvoApelido})` : ''}</div>
                <div className="text-xs text-white/55">
                  {REPORT_REASONS.find(x => x.id === r.reason)?.label ?? r.reason} · por {r.quem} · {new Date(r.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn tone="go" disabled={busy} onClick={() => onResolve(r, 'ok')}>ESTÁ TUDO BEM</Btn>
                <Btn tone="warn" disabled={busy} onClick={() => onResolve(r, 'silenciar')}>SILENCIAR BALÃO 7 DIAS</Btn>
                <Btn tone="danger" disabled={busy} onClick={() => onResolve(r, 'apelido')}>TROCAR APELIDO</Btn>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** A confirmação (ou o formulário) que abre embaixo do aluno. */
function Confirm({ ask, busy, asAdmin, onCancel, onDone }: {
  ask: Ask; busy: boolean; asAdmin: boolean;
  onCancel: () => void; onDone: (label: string, fn: () => Promise<unknown>) => void;
}) {
  const { row, what } = ask;
  const [pass, setPass] = useState('');
  const [days, setDays] = useState(3);
  const box = 'mt-3 rounded-md border border-white/15 bg-black/25 p-3 text-sm';
  if (what === 'senha') {
    return (
      <div className={box}>
        <div className="mb-2 text-white/80">Senha nova para {row.nome} (pelo menos 6 letras ou números). Anote e passe para o aluno.</div>
        <div className="flex flex-wrap gap-2">
          <input value={pass} onChange={e => setPass(e.target.value)} autoComplete="off" spellCheck={false}
            className="w-48 rounded-md border border-white/20 bg-[#16221d] px-2 py-1.5 text-sm text-white" />
          <Btn tone="go" disabled={busy || pass.trim().length < 6}
            onClick={() => onDone(`Senha nova de ${row.nome}: ${pass.trim()}`, () => resetPassword(row, pass.trim(), asAdmin))}>TROCAR SENHA</Btn>
          <Btn onClick={onCancel}>CANCELAR</Btn>
        </div>
      </div>
    );
  }
  if (what === 'suspender') {
    return (
      <div className={box}>
        <div className="mb-2 text-white/80">Suspender {row.nome}: não entra no jogo até o fim do prazo (ou até você reativar). Se estiver jogando agora, o jogo para de salvar.</div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="rounded-md border border-white/20 bg-[#16221d] px-2 py-1.5 text-sm text-white">
            {[1, 3, 7, 30].map(d => <option key={d} value={d}>{d} {d === 1 ? 'dia' : 'dias'}</option>)}
          </select>
          <Btn tone="warn" disabled={busy} onClick={() => onDone(`${row.nome} suspenso por ${days} ${days === 1 ? 'dia' : 'dias'}.`, () => suspendStudent(row.id, days))}>SUSPENDER</Btn>
          <Btn onClick={onCancel}>CANCELAR</Btn>
        </div>
      </div>
    );
  }
  const text = {
    recusar: `Recusar o cadastro de ${row.nome}? O pedido some; o aluno pode pedir de novo, com o professor certo.`,
    zerar: `Zerar o progresso de ${row.nome}? Moedas, cartas, pacotes, casa, fotos e tudo do jogo voltam ao começo. Não tem volta.`,
    apagar: `Apagar ${row.nome}? Sai da turma e o progresso some. O login continua e ele pode se cadastrar de novo. Não tem volta.`,
  }[what];
  const run = {
    recusar: () => onDone(`Cadastro de ${row.nome} recusado.`, () => rejectStudent(row.id)),
    zerar: () => onDone(`Progresso de ${row.nome} zerado.`, () => resetProgress(row.id)),
    apagar: () => onDone(`${row.nome} apagado.`, () => deleteStudent(row.id)),
  }[what];
  return (
    <div className={box}>
      <div className="mb-2 text-white/80">{text}</div>
      <div className="flex gap-2">
        <Btn tone="danger" disabled={busy} onClick={run}>{what === 'recusar' ? 'RECUSAR' : what === 'zerar' ? 'ZERAR DE VEZ' : 'APAGAR DE VEZ'}</Btn>
        <Btn onClick={onCancel}>CANCELAR</Btn>
      </div>
    </div>
  );
}
