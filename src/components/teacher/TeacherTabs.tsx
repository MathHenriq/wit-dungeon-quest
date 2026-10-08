// Abas do professor além da Aula de hoje: Alunos (lista e ficha), Missões da
// sala e Denúncias. Visual da tela do professor (claro, fonte normal, botões
// grandes para tablet), não o pixel do jogo.
import { useEffect, useState } from 'react';
import { createMission, endMission, kindLabel, MISSION_KINDS, missionPct, teacherMissions, teacherStudent, teacherStudents, type Mission, type MissionKind, type StudentCard, type StudentRow } from '@/game/teacher-cloud';
import { teacherReports, teacherResolve, REPORT_REASONS, type ReportRow } from '@/game/social';
import { PACK_BY_ID, PACKS, type PackId } from '@/game/packs';
import { RARITY_PT } from '@/lib/tcg/labels';
import { cloudEnabled } from '@/game/cloud';
import { PATH_BY_ID } from '@/lib/tcg/paths';

const box = 'rounded-lg bg-white border border-[#e4e0d8]';
const btn = 'px-3 py-2 rounded-lg text-[14px] border border-[#d8d4cc] bg-white text-[#1e1b2c] disabled:opacity-40';
const btnOn = 'px-3 py-2 rounded-lg text-[14px] border border-[#1e1b2c] bg-[#1e1b2c] text-white';
const field = 'px-2 py-2 rounded-lg border border-[#d8d4cc] bg-white text-[#1e1b2c]';
const since = (iso: string | null) => {
  if (!iso) return 'nunca';
  const h = (Date.now() - new Date(iso).getTime()) / 3600_000;
  return h < 1 ? 'agora há pouco' : h < 24 ? `há ${Math.round(h)} h` : `há ${Math.round(h / 24)} dias`;
};
const EVENT_PT: Record<string, string> = {
  'stat:mesas': 'mesas vencidas', 'stat:peixes': 'peixes', 'stat:colheitas': 'colheitas', 'stat:entregas': 'entregas', 'stat:minijogos': 'minijogos',
  'stat:vendas': 'vendas no Mercado', 'stat:pvpVitorias': 'vitórias no PvP', chefe: 'venceu o chefe do andar', po: 'desmanchou (pó)', forja: 'forjou (pó)',
  troca: 'troca feita', venda: 'vendeu na Vitrine', compra: 'comprou na Vitrine', recompensa: 'pediu Recompensa da Sala', suspeita: 'SUSPEITA (passou do limite)',
  guilda: 'prêmio da guilda', mentoria: 'bônus de mentor', caminho: 'escolheu o Caminho', missao: 'pegou o prêmio da missão',
};
const eventPt = (k: string) => EVENT_PT[k] ?? (k.startsWith('pacote:') ? `abriu pacote ${k.slice(7)}` : k.startsWith('aula:') ? `aula: ${k.slice(5)}` : k);

export function StudentsTab({ teacher }: { teacher?: string }) {
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [sort, setSort] = useState<'nome' | 'andar' | 'ultimo'>('nome');
  const [open, setOpen] = useState<StudentRow | null>(null);
  const [card, setCard] = useState<StudentCard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setRows(null); teacherStudents(teacher).then(setRows).catch(e => setErr(String(e?.message ?? e))); }, [teacher]);
  useEffect(() => { setCard(null); if (open) teacherStudent(open.id).then(setCard).catch(e => setErr(String(e?.message ?? e))); }, [open]);
  const sorted = [...(rows ?? [])].sort((a, b) => sort === 'andar' ? b.andar - a.andar : sort === 'ultimo' ? (b.ultimo ?? '').localeCompare(a.ultimo ?? '') : a.nome.localeCompare(b.nome));
  return (
    <div>
      {err && <div className="text-[13px] text-[#c84a3a] mb-2">{err}</div>}
      <div className="flex items-center gap-2 mb-2 text-[13px]">
        <span className="text-[#6a6680]">Ordenar:</span>
        {(['nome', 'andar', 'ultimo'] as const).map(k => (
          <button key={k} onClick={() => setSort(k)} className={sort === k ? btnOn : btn}>{k === 'ultimo' ? 'último acesso' : k}</button>
        ))}
      </div>
      {!rows && <div className="text-[14px]">Carregando...</div>}
      <div className="grid gap-1.5">
        {sorted.map(s => (
          <button key={s.id} onClick={() => setOpen(s)} className={`${box} text-left p-3 flex flex-wrap items-center gap-3`}>
            <div className="flex-1 min-w-[180px]">
              <div className="text-[15px] font-semibold">{s.nome}</div>
              <div className="text-[12px] text-[#6a6680]">{s.apelido ? `no jogo: ${s.apelido} · ` : ''}último acesso {since(s.ultimo)}</div>
            </div>
            <span className="text-[13px]">andar <b>{s.andar}</b></span>
            <span className="text-[13px]">{s.moedas} moedas</span>
            <span className="text-[13px]">{s.cartas} cartas</span>
            <span className="text-[13px]">{s.presencas} aulas</span>
            {s.suspeitas > 0 && <span className="px-2 py-1 rounded bg-[#fde8e8] text-[#c84a3a] text-[12px]">{s.suspeitas} suspeita{s.suspeitas > 1 ? 's' : ''}</span>}
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20" onClick={() => setOpen(null)}>
          <div className="w-[min(94vw,640px)] max-h-[88vh] overflow-auto rounded-xl bg-white p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center mb-2"><div className="text-[20px] font-bold flex-1">{open.nome}</div><button className={btn} onClick={() => setOpen(null)}>Fechar</button></div>
            {!card && <div>Carregando...</div>}
            {card && <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-[13px]">
                <div className={`${box} p-2`}>Andar<br /><b className="text-[20px]">{card.andar}</b></div>
                <div className={`${box} p-2`}>Moedas<br /><b className="text-[20px]">{card.moedas}</b></div>
                <div className={`${box} p-2`}>Profissão<br /><b>{card.profissao ?? '—'}</b></div>
                <div className={`${box} p-2`}>Caminho<br /><b>{card.caminho ? PATH_BY_ID.get(card.caminho as never)?.name ?? card.caminho : '—'}</b></div>
              </div>
              <div className="text-[13px] mb-1 font-semibold">Coleção</div>
              <div className="flex flex-wrap gap-1.5 mb-3 text-[12px]">
                {Object.entries(card.porRaridade).map(([r, n]) => <span key={r} className="px-2 py-1 rounded bg-[#f4f2ee]">{RARITY_PT[r as keyof typeof RARITY_PT] ?? r}: {n}</span>)}
              </div>
              <div className="text-[13px] mb-1 font-semibold">O que mais faz</div>
              <div className="flex flex-wrap gap-1.5 mb-3 text-[12px]">
                {Object.entries(card.stats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => <span key={k} className="px-2 py-1 rounded bg-[#f4f2ee]">{eventPt('stat:' + k)}: {n}</span>)}
              </div>
              <div className="text-[13px] mb-1 font-semibold">Aulas</div>
              <div className="flex flex-wrap gap-1.5 mb-3 text-[12px]">
                {card.aulas.map(a => <span key={a.dia} className="px-2 py-1 rounded bg-[#f4f2ee]">{a.dia.slice(5).split('-').reverse().join('/')}: {a.status.replace('_', ' ')}</span>)}
                {!card.aulas.length && <span className="text-[#6a6680]">nenhuma registrada</span>}
              </div>
              <div className="text-[13px] mb-1 font-semibold">Últimos acontecimentos</div>
              <div className="grid gap-0.5 text-[12px]">
                {card.eventos.map((e, i) => <div key={i} className={e.kind === 'suspeita' ? 'text-[#c84a3a]' : ''}>{new Date(e.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {eventPt(e.kind)}{e.value > 1 ? ` (${e.value})` : ''}</div>)}
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

export function MissionsTab({ teacher }: { teacher?: string }) {
  const [list, setList] = useState<Mission[] | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<MissionKind>('mesas');
  const [target, setTarget] = useState(100);
  const [pack, setPack] = useState<PackId>('comum');
  const [days, setDays] = useState(7);
  const [msg, setMsg] = useState<string | null>(null);
  const load = () => { teacherMissions(teacher).then(setList).catch(e => setMsg(String(e?.message ?? e))); };
  useEffect(load, [teacher]);
  const create = async () => {
    try { await createMission(title.trim() || `${target} ${kindLabel(kind)}`, kind, target, pack, days); setMsg('Missão criada: aparece no mural do jogo.'); setTitle(''); load(); }
    catch (e) { setMsg(String((e as Error)?.message ?? e)); }
  };
  return (
    <div>
      <div className={`${box} p-3 mb-3`}>
        <div className="text-[16px] font-bold mb-2">Nova missão da sala</div>
        <div className="text-[12px] text-[#6a6680] mb-2">A turma inteira soma junto. Batida a meta, cada aluno pega 1 pacote guardado no jogo.</div>
        <div className="flex flex-wrap gap-2 items-center text-[14px]">
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} placeholder="nome (opcional)" className={`${field} flex-1 min-w-[200px]`} />
          <span>Meta:</span>
          <input type="number" min={1} value={target} onChange={e => setTarget(Math.max(1, Math.floor(+e.target.value || 1)))} className={`${field} w-24`} />
          <select value={kind} onChange={e => setKind(e.target.value as MissionKind)} className={field}>
            {MISSION_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <span>em</span>
          <select value={days} onChange={e => setDays(+e.target.value)} className={field}>
            {[3, 7, 14, 30].map(d => <option key={d} value={d}>{d} dias</option>)}
          </select>
          <span>Prêmio:</span>
          <select value={pack} onChange={e => setPack(e.target.value as PackId)} className={field}>
            {PACKS.filter(p => p.id !== 'mitico').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => void create()} className="px-4 py-2 rounded-lg bg-[#1e1b2c] text-white">Criar</button>
        </div>
        {msg && <div className="text-[13px] mt-2">{msg}</div>}
      </div>
      {!list && <div>Carregando...</div>}
      <div className="grid gap-2">
        {list?.map(m => (
          <div key={m.id} className={`${box} p-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[15px] font-semibold flex-1">{m.title}</div>
              <span className={`px-2 py-1 rounded text-[12px] ${m.ativa ? 'bg-[#e8f8ec] text-[#2a8a4a]' : 'bg-[#f4f2ee] text-[#6a6680]'}`}>{m.ativa ? `até ${new Date(m.ends).toLocaleDateString('pt-BR')}` : 'encerrada'}</span>
              {m.ativa && <button className={btn} onClick={() => void endMission(m.id).then(load)}>Encerrar</button>}
            </div>
            <div className="text-[12px] text-[#6a6680] mb-1">{m.progress}/{m.target} {kindLabel(m.kind)} · prêmio {PACK_BY_ID.get(m.pack)?.name ?? m.pack}{m.pegaram !== undefined ? ` · ${m.pegaram} já pegaram` : ''}</div>
            <div className="h-3 rounded bg-[#f0ece4] overflow-hidden"><div className="h-full bg-[#3aa85a]" style={{ width: `${missionPct(m)}%` }} /></div>
          </div>
        ))}
        {list && !list.length && <div className="text-[14px] text-[#6a6680]">Nenhuma missão ainda.</div>}
      </div>
    </div>
  );
}

const DEMO_REPORTS: ReportRow[] = [
  { id: 1, reason: 'apelido', at: new Date(Date.now() - 3600_000).toISOString(), alvo: 'Caio Reis', alvoApelido: 'CaioGamer', quem: 'Duda Alves' },
];
export function ReportsTab() {
  const live = cloudEnabled();
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const load = () => { (live ? teacherReports() : Promise.resolve(DEMO_REPORTS)).then(setRows).catch(() => setRows([])); };
  useEffect(load, [live]);
  const resolve = async (id: number, a: 'ok' | 'silenciar' | 'apelido') => {
    if (live) await teacherResolve(id, a); else setRows(r => (r ?? []).filter(x => x.id !== id));
    if (live) load();
  };
  return (
    <div className="grid gap-2">
      <div className="text-[12px] text-[#6a6680]">O que os alunos denunciaram pelo cartão de perfil. Só você vê quem denunciou.</div>
      {!rows && <div>Carregando...</div>}
      {rows?.map(r => (
        <div key={r.id} className={`${box} p-3 flex flex-wrap items-center gap-2`}>
          <div className="flex-1 min-w-[220px]">
            <div className="text-[15px] font-semibold">{r.alvo}{r.alvoApelido ? ` (no jogo: ${r.alvoApelido})` : ''}</div>
            <div className="text-[12px] text-[#6a6680]">{REPORT_REASONS.find(x => x.id === r.reason)?.label ?? r.reason} · por {r.quem} · {new Date(r.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <button className={btn} onClick={() => void resolve(r.id, 'ok')}>Está tudo bem</button>
          <button className={btn} onClick={() => void resolve(r.id, 'silenciar')}>Silenciar balão 7 dias</button>
          <button className={btn} onClick={() => void resolve(r.id, 'apelido')}>Trocar apelido</button>
        </div>
      ))}
      {rows && !rows.length && <div className="text-[14px] text-[#6a6680]">Nenhuma denúncia aberta.</div>}
    </div>
  );
}
