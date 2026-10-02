// "Aula de hoje" do professor (WIT 2), em DEMONSTRAÇÃO com dados de mentira
// (nada vai para o banco): para o Matheus aprovar o fluxo antes de ligar no
// servidor (docs/banco-wit2.md). Um toque por aluno, pacote padrão por
// desempenho (trocável), código no projetor e ENTREGAR com resumo.
import { useEffect, useMemo, useState } from 'react';
import { atRisk, delivery, lessonCode, nextStatus, packOf, STATUS_NAME, STATUS_ORDER, type LessonRow, type LessonStatus } from '@/game/lesson';
import { PACK_BY_ID, PACKS, type PackId } from '@/game/packs';

const FAKE = [
  'Ana Clara', 'Pedro Henrique', 'Maria Eduarda', 'João Pedro', 'Laura Beatriz', 'Gabriel Lucas', 'Sofia Helena', 'Miguel Ângelo',
  'Alice Maria', 'Arthur Gabriel', 'Helena Sofia', 'Davi Lucca', 'Valentina Rosa', 'Heitor José', 'Isabela Cristina', 'Bernardo Luís',
  'Manuela Vitória', 'Theo Rafael', 'Lívia Fernanda', 'Samuel Augusto',
].map((n, i) => ({ id: `aluno-${i + 1}`, name: n, nick: ['Raio Azul', 'Dragão 7', 'Lua Cheia', 'Ninja WIT', 'Estrela', 'Tigrão', 'Pixel', 'Trovão'][i % 8] + ` ${100 + i * 37}` }));

const COLOR: Record<LessonStatus, string> = { faltou: '#9aa0ad', presente: '#3a8ae8', foi_bem: '#3aa85a', excepcional: '#e8a020' };
const KEY = 'wit.aula-demo';

interface Saved { history: LessonStatus[][]; lastDay?: string }
const load = (): Saved => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? { history: [] }; } catch { return { history: [] }; } };

export default function TeacherLessonDemo() {
  const today = new Date().toLocaleDateString('pt-BR');
  const [rows, setRows] = useState<LessonRow[]>(() => FAKE.map(s => ({ studentId: s.id, status: 'faltou' })));
  const [saved, setSaved] = useState<Saved>(load);
  const [projector, setProjector] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [menu, setMenu] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<ReturnType<typeof delivery> | null>(null);
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  const d = useMemo(() => delivery(rows), [rows]);
  const risk = useMemo(() => new Set(atRisk(saved.history).map(k => FAKE[k]?.id)), [saved]);
  const secret = `demo-${today}`;
  const code = lessonCode(secret, now);
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
  const deliver = () => {
    const next: Saved = { history: [...saved.history, rows.map(r => r.status)].slice(-12), lastDay: today };
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next); setDone(d); setConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1e1b2c] font-sans">
      <div className="max-w-[960px] mx-auto px-4 py-4">
        <div className="rounded-lg bg-[#fff6d8] border border-[#e8d090] px-3 py-2 text-[12px] mb-3">
          Demonstração com alunos de mentira: nada é gravado no banco. Serve para aprovar o fluxo da aula.
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div>
            <div className="text-[22px] font-bold">Aula de hoje</div>
            <div className="text-[13px] text-[#6a6680]">{today} · {FAKE.length} alunos</div>
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
          {FAKE.map(s => {
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

        <div className="sticky bottom-0 mt-4 py-3 bg-[#f4f2ee]">
          {done ? (
            <div className="rounded-xl bg-[#e8f8ec] border border-[#9ad0a8] p-3 text-[14px]">
              Entregue! {done.grants.length} pacotes ({Object.entries(done.packs).map(([k, n]) => `${n} ${PACK_BY_ID.get(k as PackId)!.name.replace(/^Pacot(e|inho) /, '')}`).join(', ')}).
              Presença: {Math.round(done.rate * 100)}%. Cada aluno vê no jogo: "Você foi bem hoje! Pacote Raro" e o pacote aparece em MEUS PACOTES.
              <button onClick={() => { setDone(null); setRows(FAKE.map(s => ({ studentId: s.id, status: 'faltou' }))); }} className="ml-2 underline">nova aula (demo)</button>
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} className="w-full py-4 rounded-xl bg-[#1e1b2c] text-white text-[17px] font-semibold">
              ENTREGAR · {d.present} presentes · {d.grants.length} pacotes
            </button>
          )}
        </div>
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
