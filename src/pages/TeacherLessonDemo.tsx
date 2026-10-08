// "Aula de hoje" do professor (WIT 2). Três abas: AULA (um toque por aluno,
// pacote padrão por desempenho, código no projetor, ENTREGAR), RESGATES (os
// tickets das Recompensas da Sala) e RELATÓRIO (presença por aula e por aluno,
// alunos em risco, retorno depois da falta, CSV).
// Sem o banco ligado (VITE_WIT2_DB) é DEMONSTRAÇÃO com alunos de mentira;
// ligado, usa as funções do servidor (src/game/cloud.ts).
import { MissionsTab, PostsTab, ReportsTab, StudentsTab, ViradaTab, EventsTab } from '@/components/teacher/TeacherTabs';
import { masterTeachers, type TeacherOpt } from '@/game/teacher-cloud';
import { giveLessonCard, weekCards, weekOf } from '@/game/class-events';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { RARITY_PT } from '@/lib/tcg/labels';
import { useEffect, useMemo, useState } from 'react';
import {
  atRisk, delivery, lessonCode, lessonsCsv, nextStatus, packOf, performanceMix, presenceByLesson, returnAfterAbsence, STATUS_NAME, STATUS_ORDER, studentRates,
  type LessonRow, type LessonStatus,
} from '@/game/lesson';
import { PACK_BY_ID, PACKS, type PackId } from '@/game/packs';
import { REWARD_BY_ID } from '@/game/room-rewards';
import { classCodeCloud, cloudEnabled, deliverTicketCloud, teacherDeliverCloud, teacherLessonCloud } from '@/game/cloud';

const FAKE = [
  'Ana Clara', 'Pedro Henrique', 'Maria Eduarda', 'João Pedro', 'Laura Beatriz', 'Gabriel Lucas', 'Sofia Helena', 'Miguel Ângelo',
  'Alice Maria', 'Arthur Gabriel', 'Helena Sofia', 'Davi Lucca', 'Valentina Rosa', 'Heitor José', 'Isabela Cristina', 'Bernardo Luís',
  'Manuela Vitória', 'Theo Rafael', 'Lívia Fernanda', 'Samuel Augusto',
].map((n, i) => ({ id: `aluno-${i + 1}`, name: n, nick: ['Raio Azul', 'Dragão 7', 'Lua Cheia', 'Ninja WIT', 'Estrela', 'Tigrão', 'Pixel', 'Trovão'][i % 8] + ` ${100 + i * 37}` }));

const COLOR: Record<LessonStatus, string> = { faltou: '#9aa0ad', presente: '#3a8ae8', foi_bem: '#3aa85a', excepcional: '#e8a020' };
const KEY = 'wit.aula-demo';

interface Saved { history: LessonStatus[][]; days?: string[]; lastDay?: string }
const load = (): Saved => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? { history: [] }; } catch { return { history: [] }; } };

/** Tickets de mentira para a aba RESGATES na demonstração. */
const FAKE_TICKETS = [
  { code: 'K7QZ', student: 'aluno-3', reward: 'musica' }, { code: 'B3MX', student: 'aluno-8', reward: 'tablet-15' },
  { code: 'R9TD', student: 'aluno-12', reward: 'vr-10' }, { code: 'H2WP', student: 'aluno-5', reward: 'lugar' },
];
type Tab = 'aula' | 'alunos' | 'missoes' | 'resgates' | 'mural' | 'denuncias' | 'relatorio' | 'virada' | 'eventos';

export default function TeacherLessonDemo() {
  const today = new Date().toLocaleDateString('pt-BR');
  const live = cloudEnabled();
  const [tab, setTab] = useState<Tab>(() => {
    const q = new URLSearchParams(window.location.search).get('aba');
    return (['alunos', 'missoes', 'resgates', 'mural', 'denuncias', 'relatorio', 'virada', 'eventos'] as string[]).includes(q ?? '') ? q as Tab : 'aula';
  });
  // master (e-mail na lista do banco): escolhe de qual professor ver
  const [masters, setMasters] = useState<TeacherOpt[]>([]);
  const [viewOf, setViewOf] = useState<string | undefined>(undefined);
  useEffect(() => { masterTeachers().then(setMasters).catch(() => undefined); }, []);
  const [students, setStudents] = useState(FAKE);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [serverCode, setServerCode] = useState<string | null>(null);
  const [tickets, setTickets] = useState<{ code: string; student: string; reward: string; done?: boolean }[]>(live ? [] : FAKE_TICKETS);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<LessonRow[]>(() => FAKE.map(s => ({ studentId: s.id, status: 'faltou' })));
  const [saved, setSaved] = useState<Saved>(load);
  const [projector, setProjector] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [menu, setMenu] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<ReturnType<typeof delivery> | null>(null);
  // Carta da Aula: uma das 3 sugestões da semana (ou nenhuma)
  const [lessonCard, setLessonCard] = useState<string | null>(null);
  const [cardGiven, setCardGiven] = useState<number | null>(null);
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  // banco ligado: a aula do dia vem do servidor (alunos do professor, presenças já marcadas pelo código, tickets)
  useEffect(() => {
    if (!live) return;
    const iso = new Date().toISOString().slice(0, 10);
    teacherLessonCloud(iso).then(l => {
      setLessonId(l.lesson);
      setStudents(l.students.map(x => ({ id: x.id, name: x.nome, nick: '' })));
      setRows(l.students.map(x => ({ studentId: x.id, status: (x.status ?? 'faltou') as LessonStatus, viaCode: x.viaCode, ...(x.pack ? { pack: x.pack as PackId } : {}) })));
      setTickets(l.tickets.map(t => ({ code: t.code, student: t.student, reward: t.reward })));
    }).catch(e => setErr(String(e.message ?? e)));
  }, [live]);
  useEffect(() => {
    if (!live || !lessonId || !projector) return;
    const tick = () => classCodeCloud(lessonId).then(setServerCode).catch(() => undefined);
    tick();
    const t = window.setInterval(tick, 5000);
    return () => window.clearInterval(t);
  }, [live, lessonId, projector]);
  const d = useMemo(() => delivery(rows), [rows]);
  const risk = useMemo(() => new Set(atRisk(saved.history).map(k => students[k]?.id)), [saved, students]);
  const secret = `demo-${today}`;
  const code = live ? serverCode ?? '····' : lessonCode(secret, now);
  const left = 30 - Math.floor((now % 30_000) / 1000);

  const set = (id: string, f: (r: LessonRow) => LessonRow) => setRows(rs => rs.map(r => (r.studentId === id ? f(r) : r)));
  const tap = (id: string) => { if (done) return; set(id, r => ({ ...r, status: nextStatus(r.status), pack: undefined })); };
  // demonstração: um aluno "digita o código" e entra como presente
  const simulate = () => {
    const absent = rows.filter(r => r.status === 'faltou');
    if (!absent.length) return;
    const r = absent[Math.floor(Math.random() * absent.length)];
    set(r.studentId, x => ({ ...x, status: 'presente', viaCode: true }));
  };
  const deliver = async () => {
    if (live && lessonId) {
      try {
        await teacherDeliverCloud(lessonId, rows.map(r => ({ student: r.studentId, status: r.status, pack: packOf(r), viaCode: r.viaCode })));
        if (lessonCard) setCardGiven(await giveLessonCard(lessonId, lessonCard));
      }
      catch (e) { setErr(String((e as Error).message ?? e)); setConfirm(false); return; }
    }
    if (!live && lessonCard) setCardGiven(rows.filter(r => r.status !== 'faltou').length);
    const next: Saved = { history: [...saved.history, rows.map(r => r.status)].slice(-24), days: [...(saved.days ?? []), today].slice(-24), lastDay: today };
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next); setDone(d); setConfirm(false);
  };
  const giveTicket = async (c: string) => {
    if (live) { try { await deliverTicketCloud(c); } catch (e) { setErr(String((e as Error).message ?? e)); return; } }
    setTickets(ts => ts.map(t => (t.code === c ? { ...t, done: true } : t)));
  };
  const nameOf = (id: string) => students.find(x => x.id === id)?.name ?? id;

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1e1b2c] font-sans">
      <div className="max-w-[960px] mx-auto px-4 py-4">
        {!live && <div className="rounded-lg bg-[#fff6d8] border border-[#e8d090] px-3 py-2 text-[12px] mb-3">
          Demonstração com alunos de mentira: nada é gravado no banco. Serve para aprovar o fluxo da aula.
        </div>}
        {err && <div className="rounded-lg bg-[#fde8e8] border border-[#e8a0a0] px-3 py-2 text-[12px] mb-3">Erro do servidor: {err}</div>}
        <div className="flex flex-wrap gap-1 mb-3">
          {([['aula', 'Aula de hoje'], ['alunos', 'Alunos'], ['missoes', 'Missões da sala'], ['resgates', `Resgates (${tickets.filter(t => !t.done).length})`], ['mural', 'Mural'], ['eventos', 'Eventos'], ['denuncias', 'Denúncias'], ['relatorio', 'Relatório'], ...((masters.length > 0 || !live) ? [['virada', 'Virada']] : [])] as [Tab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-[14px] border ${tab === k ? 'bg-[#1e1b2c] text-white border-[#1e1b2c]' : 'bg-white border-[#d8d4cc]'}`}>{l}</button>
          ))}
        </div>
        {masters.length > 0 && (tab === 'alunos' || tab === 'missoes') && (
          <div className="mb-3 text-[13px] flex items-center gap-2">Ver a turma de:
            <select value={viewOf ?? ''} onChange={e => setViewOf(e.target.value || undefined)} className="px-2 py-1.5 rounded-lg border border-[#d8d4cc] bg-white text-[#1e1b2c]">
              <option value="">a minha</option>
              {masters.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.alunos})</option>)}
            </select>
          </div>
        )}
        {tab === 'alunos' && <StudentsTab teacher={viewOf} />}
        {tab === 'missoes' && <MissionsTab teacher={viewOf} />}
        {tab === 'denuncias' && <ReportsTab />}
        {tab === 'mural' && <PostsTab />}
        {tab === 'virada' && <ViradaTab />}
        {tab === 'eventos' && <EventsTab />}
        {tab === 'resgates' && <Tickets tickets={tickets} nameOf={nameOf} onGive={giveTicket} />}
        {tab === 'relatorio' && <Report names={students.map(x => x.name)} saved={saved} />}
        {tab === 'aula' && <>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div>
            <div className="text-[22px] font-bold">Aula de hoje</div>
            <div className="text-[13px] text-[#6a6680]">{today} · {students.length} alunos</div>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setProjector(v => !v)} className="px-3 py-2 rounded-lg bg-white border border-[#d8d4cc] text-[14px]">{projector ? 'Esconder código' : 'Código no projetor'}</button>
            <button onClick={() => setRows(rs => rs.map(r => (r.status === 'faltou' ? { ...r, status: 'presente' } : r)))} disabled={!!done} className="px-3 py-2 rounded-lg bg-white border border-[#d8d4cc] text-[14px] disabled:opacity-40">Todos presentes</button>
          </div>
        </div>

        {projector && (
          <div className="rounded-xl bg-[#1e1b2c] text-white p-5 mb-3 flex flex-wrap items-center gap-4">
            <div>
              <div className="text-[13px] text-white/70">Digite no jogo para marcar presença</div>
              <div className="text-[64px] font-bold tracking-[0.25em] leading-none mt-1">{code}</div>
              <div className="text-[12px] text-white/60 mt-1">troca em {left} s</div>
            </div>
            <button onClick={simulate} disabled={!!done} className="ml-auto px-3 py-2 rounded-lg bg-white/15 text-[13px] disabled:opacity-40">Simular aluno digitando</button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {STATUS_ORDER.map(s => (
            <div key={s} className="rounded-lg bg-white border border-[#e4e0d8] px-3 py-2">
              <div className="text-[12px] text-[#6a6680]">{STATUS_NAME[s]}</div>
              <div className="text-[22px] font-bold" style={{ color: COLOR[s] }}>{d.counts[s]}</div>
            </div>
          ))}
        </div>

        <div className="text-[12px] text-[#6a6680] mb-2">Toque no aluno para mudar: Faltou → Presente → Foi bem → Excepcional. O pacote segue o desempenho; toque no pacote para trocar.</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {students.map(s => {
            const r = rows.find(x => x.studentId === s.id)!;
            const p = packOf(r);
            return (
              <div key={s.id} className="relative flex items-center gap-2 rounded-lg bg-white border border-[#e4e0d8] p-2" style={{ borderLeft: `6px solid ${COLOR[r.status]}` }}>
                <button onClick={() => tap(s.id)} className="flex-1 text-left min-h-[48px]">
                  <div className="text-[15px] font-semibold">{s.name}</div>
                  <div className="text-[12px] text-[#6a6680]">{s.nick}{r.viaCode ? ' · entrou pelo código' : ''}{risk.has(s.id) ? '' : ''}</div>
                  {risk.has(s.id) && <div className="text-[11px] text-[#c84a3a]">2 faltas seguidas antes de hoje</div>}
                </button>
                <button onClick={() => tap(s.id)} className="px-3 py-2 rounded-lg text-white text-[13px] min-w-[104px]" style={{ background: COLOR[r.status] }}>{STATUS_NAME[r.status]}</button>
                <button disabled={r.status === 'faltou' || !!done} onClick={() => setMenu(menu === s.id ? null : s.id)}
                  className="px-2 py-2 rounded-lg border border-[#d8d4cc] text-[12px] min-w-[84px] disabled:opacity-30">{p ? PACK_BY_ID.get(p)!.name.replace(/^Pacot(e|inho) /, '') : 'sem pacote'}</button>
                {menu === s.id && (
                  <div className="absolute right-2 top-full mt-1 z-10 rounded-lg bg-white border border-[#d8d4cc] shadow-lg p-1 w-[180px]">
                    {[...PACKS.map(x => x.id), null].map(id => (
                      <button key={id ?? 'nada'} onClick={() => { set(s.id, x => ({ ...x, pack: id as PackId | null })); setMenu(null); }}
                        className="block w-full text-left px-2 py-1.5 rounded text-[13px] hover:bg-[#f4f2ee]">{id ? PACK_BY_ID.get(id)!.name : 'Sem pacote'}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg bg-white border border-[#e4e0d8] p-3">
          <div className="text-[15px] font-semibold">Carta da Aula</div>
          <div className="text-[12px] text-[#6a6680] mb-2">Quem não faltou ganha 1 cópia ao entregar. As 3 sugestões mudam toda semana.</div>
          <div className="flex flex-wrap gap-2">
            {[...weekCards(weekOf()).map(id => [id, `${CARD_BY_ID.get(id)?.name ?? id} (${RARITY_PT[CARD_BY_ID.get(id)!.rarity]})`] as const), [null, 'Sem carta hoje'] as const].map(([id, label]) => (
              <button key={id ?? 'nada'} disabled={!!done} onClick={() => setLessonCard(id)}
                className={`px-3 py-2 rounded-lg text-[13px] border ${lessonCard === id ? 'bg-[#1e1b2c] text-white border-[#1e1b2c]' : 'bg-white border-[#d8d4cc]'} disabled:opacity-50`}>{label}</button>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 mt-4 py-3 bg-[#f4f2ee]">
          {done ? (
            <div className="rounded-xl bg-[#e8f8ec] border border-[#9ad0a8] p-3 text-[14px]">
              Entregue! {done.grants.length} pacotes ({Object.entries(done.packs).map(([k, n]) => `${n} ${PACK_BY_ID.get(k as PackId)!.name.replace(/^Pacot(e|inho) /, '')}`).join(', ')}).
              Presença: {Math.round(done.rate * 100)}%. Cada aluno vê no jogo: "Você foi bem hoje! Pacote Raro" e o pacote aparece em MEUS PACOTES.
              {cardGiven !== null && lessonCard && ` Carta da Aula (${CARD_BY_ID.get(lessonCard)?.name}): ${cardGiven} alunos ganharam.`}
              {!live && <button onClick={() => { setDone(null); setRows(students.map(s => ({ studentId: s.id, status: 'faltou' }))); }} className="ml-2 underline">nova aula (demo)</button>}
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} className="w-full py-4 rounded-xl bg-[#1e1b2c] text-white text-[17px] font-semibold">
              ENTREGAR · {d.present} presentes · {d.grants.length} pacotes
            </button>
          )}
        </div>
        </>}
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirm(false)}>
          <div className="w-[min(92vw,420px)] rounded-xl bg-white p-4" onClick={e => e.stopPropagation()}>
            <div className="text-[18px] font-bold mb-2">Entregar a aula?</div>
            <div className="text-[14px] leading-6">
              {STATUS_ORDER.map(s => <div key={s}>{STATUS_NAME[s]}: <b>{d.counts[s]}</b></div>)}
              <div className="mt-2">Pacotes: {Object.entries(d.packs).map(([k, n]) => `${n} ${PACK_BY_ID.get(k as PackId)!.name.replace(/^Pacot(e|inho) /, '')}`).join(', ') || 'nenhum'}</div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirm(false)} className="flex-1 py-3 rounded-lg border border-[#d8d4cc]">Voltar</button>
              <button onClick={deliver} className="flex-1 py-3 rounded-lg bg-[#3aa85a] text-white font-semibold">Entregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tickets({ tickets, nameOf, onGive }: { tickets: { code: string; student: string; reward: string; done?: boolean }[]; nameOf: (id: string) => string; onGive: (code: string) => void }) {
  if (!tickets.length) return <div className="text-[14px] text-[#6a6680]">Nenhum ticket esperando.</div>;
  return (
    <div className="grid gap-2">
      <div className="text-[12px] text-[#6a6680]">O aluno mostra o código no jogo; entregue o prêmio e toque em Entregue.</div>
      {tickets.map(t => (
        <div key={t.code} className="flex items-center gap-3 rounded-lg bg-white border border-[#e4e0d8] p-3">
          <span className="px-2 py-1 rounded bg-[#1e1b2c] text-[#ffd84a] tracking-[0.2em] text-[14px] font-mono">{t.code}</span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">{nameOf(t.student)}</div>
            <div className="text-[13px] text-[#6a6680]">{REWARD_BY_ID.get(t.reward)?.nome ?? t.reward}</div>
          </div>
          {t.done ? <span className="text-[13px] text-[#3aa85a]">Entregue</span>
            : <button onClick={() => onGive(t.code)} className="px-4 py-2 rounded-lg bg-[#3aa85a] text-white text-[14px]">Entregue</button>}
        </div>
      ))}
    </div>
  );
}

function Report({ names, saved }: { names: string[]; saved: Saved }) {
  const h = saved.history;
  if (!h.length) return <div className="text-[14px] text-[#6a6680]">Entregue uma aula para o relatório começar.</div>;
  const days = saved.days?.length === h.length ? saved.days : h.map((_, i) => `aula ${i + 1}`);
  const per = presenceByLesson(h), rates = studentRates(h), back = returnAfterAbsence(h), mix = performanceMix(h);
  const risk = new Set(atRisk(h));
  const avg = per.reduce((s, x) => s + x, 0) / per.length;
  const csv = () => {
    const blob = new Blob([lessonsCsv(names, h, days)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'presenca-wit.csv'; a.click();
    URL.revokeObjectURL(a.href);
  };
  const totalMix = mix.presente + mix.foi_bem + mix.excepcional || 1;
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Presença média" value={`${Math.round(avg * 100)}%`} />
        <Stat label="Aulas registradas" value={String(h.length)} />
        <Stat label="Alunos em risco" value={String(risk.size)} tone={risk.size ? '#c84a3a' : undefined} />
        <Stat label="Volta depois de faltar" value={back === null ? '—' : `${back.toFixed(1)} aula(s)`} />
      </div>
      <div className="rounded-lg bg-white border border-[#e4e0d8] p-3">
        <div className="text-[13px] font-semibold mb-2">Presença por aula</div>
        <svg viewBox={`0 0 ${Math.max(1, per.length) * 40} 120`} className="w-full h-[140px]">
          {per.map((p, i) => (
            <g key={i}>
              <rect x={i * 40 + 8} y={100 - p * 90} width={24} height={p * 90} fill="#3a8ae8" />
              <text x={i * 40 + 20} y={100 - p * 90 - 3} fontSize="9" textAnchor="middle" fill="#1e1b2c">{Math.round(p * 100)}%</text>
              <text x={i * 40 + 20} y={114} fontSize="8" textAnchor="middle" fill="#6a6680">{days[i].slice(0, 5)}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="rounded-lg bg-white border border-[#e4e0d8] p-3">
        <div className="text-[13px] font-semibold mb-2">Desempenho de quem veio</div>
        <div className="flex h-5 rounded overflow-hidden">
          <div style={{ width: `${(mix.presente / totalMix) * 100}%`, background: '#3a8ae8' }} />
          <div style={{ width: `${(mix.foi_bem / totalMix) * 100}%`, background: '#3aa85a' }} />
          <div style={{ width: `${(mix.excepcional / totalMix) * 100}%`, background: '#e8a020' }} />
        </div>
        <div className="text-[12px] text-[#6a6680] mt-1">Presente {mix.presente} · Foi bem {mix.foi_bem} · Excepcional {mix.excepcional}</div>
      </div>
      <div className="rounded-lg bg-white border border-[#e4e0d8] p-3">
        <div className="flex items-center mb-2"><div className="text-[13px] font-semibold">Presença por aluno</div>
          <button onClick={csv} className="ml-auto px-3 py-1.5 rounded-lg border border-[#d8d4cc] text-[13px]">Baixar CSV</button></div>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
          {names.map((n, k) => (
            <div key={n} className="flex items-center gap-2 text-[13px]">
              <span className="flex-1 truncate">{n}{risk.has(k) ? ' · em risco' : ''}</span>
              <span className="w-24 h-2 rounded bg-[#eee] overflow-hidden"><i className="block h-full" style={{ width: `${(rates[k] ?? 0) * 100}%`, background: risk.has(k) ? '#c84a3a' : '#3aa85a' }} /></span>
              <span className="w-10 text-right">{Math.round((rates[k] ?? 0) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-white border border-[#e4e0d8] px-3 py-2">
      <div className="text-[12px] text-[#6a6680]">{label}</div>
      <div className="text-[22px] font-bold" style={{ color: tone }}>{value}</div>
    </div>
  );
}
