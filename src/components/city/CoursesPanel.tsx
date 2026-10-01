import { useState } from 'react';
import type { Progress } from '@/game/progress';
import { MissionsList, ProfessionsList } from '@/components/work/LifePanels';
import { Tabs } from '@/components/work/Shell';

/**
 * Núcleo WIT: os cinco cursos e o que a tecnologia faz no jogo (plano §3.7),
 * a escolha do cargo (profissões) e as missões do dia.
 */
const COURSES: { icon: string; name: string; color: string; jobs: string; game: string }[] = [
  { icon: '🧠', name: 'Inteligência Artificial', color: '#4ad0ff', jobs: 'Treinador de IA, cientista de dados', game: 'Treinar o WIT-Bot, rotular dados, modelos que viram itens (previsão de preço, detector de peixe raro).' },
  { icon: '📡', name: 'IoT · Ambientes Inteligentes', color: '#4ae88a', jobs: 'Técnico de IoT, instalador', game: 'Sensores e circuitos: irrigador automático, sonar de peixe, casa e lâmpadas inteligentes.' },
  { icon: '🥽', name: 'Metaverso', color: '#c88aff', jobs: 'Arquiteto do metaverso, designer 3D', game: 'Portal VR para a Sala Virtual, eventos e cosméticos virtuais.' },
  { icon: '📣', name: 'Comunicação Digital', color: '#ff8aa8', jobs: 'Repórter, criador de conteúdo, locutor', game: 'Jornal WIT no telão, Rádio WIT e o mural de postagens.' },
  { icon: '🎮', name: 'Oficina de Games', color: '#ffd84a', jobs: 'Desenvolvedor de games, testador', game: 'Fliperamas com minijogos e fases criadas pelos alunos.' },
];

export function CoursesPanel({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const [tab, setTab] = useState<'cursos' | 'cargos' | 'missoes'>('cargos');
  const [msg, setMsg] = useState<string | null>(null);
  const font = "font-['Press_Start_2P',monospace]";
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55" onPointerDown={onClose}>
      <div className={`w-[min(94vw,640px)] max-h-[92vh] overflow-auto rounded-xl border-4 border-[#8cc63f] bg-[#10202a] p-4 text-white ${font}`} onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] text-[#b8ff7a]">NÚCLEO WIT</div>
          <button onClick={onClose} className="px-2 py-1 rounded bg-[#8cc63f] text-[#10202a] text-[10px]">SAIR</button>
        </div>
        <Tabs tabs={[['cargos', 'PROFISSÕES'], ['missoes', 'MISSÕES'], ['cursos', 'CURSOS']]} value={tab} onChange={t => { setTab(t); setMsg(null); }} color="#5a8a2a" />
        {tab !== 'cursos' && (
          <div className="rounded-lg bg-[#f4efe2] p-2 text-[#2e2a40]">
            {tab === 'cargos' ? <ProfessionsList progress={progress} onMsg={setMsg} /> : <MissionsList progress={progress} onMsg={setMsg} />}
            {msg && <div className="mt-2 text-[9px] text-[#3a9a5a]">{msg}</div>}
          </div>
        )}
        {tab === 'cursos' && <div className="grid gap-2">
          <div className="text-[9px] leading-5 text-white/80">Os cursos do Núcleo e as profissões da Cidade WIT.</div>
          {COURSES.map(c => (
            <div key={c.name} className="rounded-lg border-2 p-2 bg-white/5" style={{ borderColor: c.color }}>
              <div className="text-[10px] mb-1" style={{ color: c.color }}>{c.icon} {c.name.toUpperCase()}</div>
              <div className="text-[8px] leading-4 text-white/90">Profissões: {c.jobs}</div>
              <div className="text-[8px] leading-4 text-white/70">No jogo: {c.game}</div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
