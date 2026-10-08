// Abas do professor além da Aula de hoje: Alunos (lista e ficha), Missões da
// sala e Denúncias. Visual da tela do professor (claro, fonte normal, botões
// grandes para tablet), não o pixel do jogo.
import { useEffect, useState } from 'react';
import { createMission, endMission, migrateAll, migrateStatus, VIRADA_LIGADA, type MigrateStatus, kindLabel, MISSION_KINDS, missionPct, teacherMissions, teacherStudent, teacherStudents, type Mission, type MissionKind, type StudentCard, type StudentRow } from '@/game/teacher-cloud';
import { moderatePost, MURAL_FRASES, teacherPosts, teacherReports, teacherResolve, REPORT_REASONS, type ReportRow, type TeacherPost } from '@/game/social';
import { PACK_BY_ID, PACKS, type PackId } from '@/game/packs';
import { DIAMOND_TO_COINS, legacyPacks } from '@/game/migration';
import { closeVote, leader, openVote, teacherVotes, themeLabel, VOTE_THEMES, votePct, type Vote } from '@/game/class-events';
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

const DEMO_POSTS: TeacherPost[] = [
  { id: 1, kind: 'foto', frase: null, foto: null, at: new Date().toISOString(), esperando: true, aluno: 'Beto Lima' },
  { id: 2, kind: 'frase', frase: 4, foto: null, at: new Date().toISOString(), esperando: false, aluno: 'Ana Souza' },
];
/** Mural da turma: fotos esperando aprovação e o que já está no mural (esconder). */
export function PostsTab() {
  const live = cloudEnabled();
  const [rows, setRows] = useState<TeacherPost[] | null>(null);
  const load = () => { (live ? teacherPosts() : Promise.resolve(DEMO_POSTS)).then(setRows).catch(() => setRows([])); };
  useEffect(load, [live]);
  const act = async (id: number, ok: boolean) => { if (live) { await moderatePost(id, ok); load(); } else setRows(r => (r ?? []).map(x => (x.id === id ? { ...x, esperando: false } : x)).filter(x => ok || x.id !== id)); };
  return (
    <div className="grid gap-2">
      <div className="text-[12px] text-[#6a6680]">Frases e fases aparecem direto (são da lista pronta). Foto só aparece no mural depois que você aprovar.</div>
      {!rows && <div>Carregando...</div>}
      {rows?.map(p => (
        <div key={p.id} className={`${box} p-3 flex flex-wrap items-center gap-3`}>
          {p.kind === 'foto' && (p.foto ? <img src={p.foto} alt="" className="w-[160px] rounded" /> : <div className="w-[160px] h-[90px] rounded bg-[#e8e4dc] flex items-center justify-center text-[12px] text-[#6a6680]">foto</div>)}
          <div className="flex-1 min-w-[200px]">
            <div className="text-[15px] font-semibold">{p.aluno}</div>
            <div className="text-[13px]">{p.kind === 'frase' ? `"${MURAL_FRASES[p.frase ?? 0]}"` : p.kind === 'fase' ? 'publicou uma fase de fliperama' : 'mandou uma foto do álbum do jogo'}</div>
            {p.esperando && <div className="text-[12px] text-[#c8862a]">esperando a sua aprovação</div>}
          </div>
          {p.esperando && <button className={btnOn} onClick={() => void act(p.id, true)}>Aprovar</button>}
          <button className={btn} onClick={() => void act(p.id, false)}>{p.esperando ? 'Recusar' : 'Esconder'}</button>
        </div>
      ))}
      {rows && !rows.length && <div className="text-[14px] text-[#6a6680]">Nada no mural ainda.</div>}
    </div>
  );
}

/** Virada WIT 1 → WIT 2 (só o master): como está, o que cada um recebe e o botão (desligado). */
export function ViradaTab() {
  const [st, setSt] = useState<MigrateStatus | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [sure, setSure] = useState(false);
  useEffect(() => { migrateStatus().then(setSt).catch(e => setMsg(String((e as Error).message ?? e))); }, []);
  const run = async () => {
    try { const r = await migrateAll(); setMsg(`${r.migrados} alunos migrados${r.falhas.length ? `, ${r.falhas.length} com erro` : ''}.`); setSt(await migrateStatus()); }
    catch (e) { setMsg(String((e as Error).message ?? e)); }
    setSure(false);
  };
  const levels = [5, 10, 15, 20, 30, 45];
  return (
    <div className="grid gap-3">
      <div className={`${box} p-3`}>
        <div className="text-[18px] font-bold">Virada para o WIT 2</div>
        <div className="text-[13px] text-[#6a6680] mt-1 leading-5">
          Cada aluno do WIT 1 passa para o WIT 2 sem perder nada: os itens da loja viram as cartas iguais, as moedas continuam (1 diamante = {DIAMOND_TO_COINS} moedas),
          materiais e poções viram pó da forja, os pontos de atributo e de skill viram pontos do Grimório (até 6), os títulos ficam e todos ganham o título Veterano.
          Rodar de novo não dá nada em dobro. Conta de teste fica de fora.
        </div>
      </div>
      {st && (
        <div className="grid grid-cols-3 gap-2">
          {([['Alunos', st.alunos], ['Já migrados', st.migrados], ['Contas de teste', st.teste]] as [string, number][]).map(([l, n]) => (
            <div key={l} className={`${box} px-3 py-2`}><div className="text-[12px] text-[#6a6680]">{l}</div><div className="text-[22px] font-bold">{n}</div></div>
          ))}
        </div>
      )}
      <div className={`${box} p-3`}>
        <div className="text-[14px] font-semibold mb-1">Pacotes de Legado (pelo nível no WIT 1)</div>
        <table className="text-[13px] w-full"><tbody>
          <tr className="text-[#6a6680]"><td>Nível</td>{levels.map(l => <td key={l}>{l}</td>)}</tr>
          {(['comum', 'raro', 'epico'] as PackId[]).map(id => (
            <tr key={id}><td>{PACK_BY_ID.get(id)!.name}</td>{levels.map(l => <td key={l}>{legacyPacks(l)[id] ?? 0}</td>)}</tr>
          ))}
        </tbody></table>
        <div className="text-[12px] text-[#6a6680] mt-1">Proposta: 1 Comum a cada 5 níveis, 1 Raro a cada 15, 1 Épico a cada 30. Os pacotes ficam guardados em MEUS PACOTES.</div>
      </div>
      {!!st?.itensSemCarta.length && (
        <div className={`${box} p-3 text-[13px]`}>
          <div className="font-semibold mb-1">Itens da loja antiga sem carta igual ({st.itensSemCarta.length})</div>
          <div className="text-[#6a6680]">{st.itensSemCarta.join(' · ')}</div>
          <div className="text-[12px] text-[#6a6680] mt-1">Estes ficam no relatório do aluno e não viram carta.</div>
        </div>
      )}
      <div className={`${box} p-3 flex flex-wrap items-center gap-2`}>
        {!sure
          ? <button className={btn} disabled={!VIRADA_LIGADA} onClick={() => setSure(true)}>Virar todos agora</button>
          : <><span className="text-[14px]">Tem certeza? Isso não se desfaz.</span><button className={btnOn} onClick={() => void run()}>Sim, virar</button><button className={btn} onClick={() => setSure(false)}>Cancelar</button></>}
        {!VIRADA_LIGADA && <span className="text-[13px] text-[#6a6680]">Desligado até você escolher o dia (chave VIRADA_LIGADA em teacher-cloud.ts). O WIT 1 continua no ar.</span>}
      </div>
      {msg && <div className="text-[13px]">{msg}</div>}
    </div>
  );
}

/** Eventos da turma: votação do tema da próxima coleção. */
export function EventsTab() {
  const [votes, setVotes] = useState<Vote[] | null>(null);
  const [pick, setPick] = useState<string[]>([]);
  const [days, setDays] = useState(3);
  const [msg, setMsg] = useState<string | null>(null);
  const load = () => { teacherVotes().then(setVotes).catch(e => { setVotes([]); setMsg(String((e as Error).message ?? e)); }); };
  useEffect(load, []);
  const toggle = (id: string) => setPick(p => (p.includes(id) ? p.filter(x => x !== id) : p.length < 4 ? [...p, id] : p));
  const open = async () => {
    try { await openVote(pick, days); setPick([]); setMsg('Votação aberta! Os alunos votam no mural da praça (aba VOTAÇÃO).'); load(); }
    catch (e) { setMsg(String((e as Error).message ?? e)); }
  };
  return (
    <div className="grid gap-3">
      <div className={`${box} p-3`}>
        <div className="text-[18px] font-bold">Votação: tema da próxima coleção</div>
        <div className="text-[13px] text-[#6a6680] mt-1">Escolha de 2 a 4 temas. Cada aluno vota uma vez no mural da praça e pode trocar o voto até fechar. Abrir uma nova fecha a anterior.</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {VOTE_THEMES.map(t => <button key={t.id} onClick={() => toggle(t.id)} className={pick.includes(t.id) ? btnOn : btn}>{t.label}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-[14px]">
          Fica aberta por
          <select value={days} onChange={e => setDays(+e.target.value)} className={field}>{[1, 2, 3, 5, 7, 14].map(d => <option key={d} value={d}>{d} {d === 1 ? 'dia' : 'dias'}</option>)}</select>
          <button className={btnOn} disabled={pick.length < 2} onClick={() => void open()} style={pick.length < 2 ? { opacity: 0.4 } : undefined}>Abrir votação ({pick.length})</button>
        </div>
      </div>
      {msg && <div className="text-[13px]">{msg}</div>}
      {!votes && <div>Carregando...</div>}
      {votes?.map(v => {
        const win = leader(v);
        return (
          <div key={v.id} className={`${box} p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-[15px] font-semibold flex-1">{v.aberta ? 'Aberta' : 'Fechada'} · {v.total} votos{!v.aberta && win ? ` · venceu ${themeLabel(win)}` : ''}</div>
              {v.aberta && <button className={btn} onClick={() => void closeVote(v.id).then(load)}>Fechar agora</button>}
            </div>
            {v.options.map(o => (
              <div key={o} className="flex items-center gap-2 text-[13px] mb-1">
                <div className="w-[160px]">{themeLabel(o)}</div>
                <div className="flex-1 h-3 rounded bg-[#eee8dc]"><div className="h-full rounded bg-[#7a5ac8]" style={{ width: `${votePct(v, o)}%` }} /></div>
                <div className="w-[70px] text-right">{v.votos[o] ?? 0} ({votePct(v, o)}%)</div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
