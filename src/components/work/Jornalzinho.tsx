// Jornalzinho WIT: 1 moeda no Estúdio de Comunicação e lê o dia todo. As
// matérias do aluno (com foto) vêm primeiro; depois as notas do jogo, as fotos
// do álbum e a dica do WIT-Bot.
import { useMemo, useState } from 'react';
import { buyPaper, edition, PAPER_PRICE } from '@/game/press';
import { loadPhotos } from '@/game/photos';
import { saveProgress, type Progress } from '@/game/progress';
import { today } from '@/game/life';
import { play } from '@/game/sfx';
import { Icon } from '@/components/Icon';

const serif = { fontFamily: 'Georgia, "Times New Roman", serif' };

export function Jornalzinho({ progress }: { progress: Progress }) {
  const day = today();
  const [msg, setMsg] = useState<string | null>(null);
  const photos = useMemo(() => loadPhotos(), []);
  const ed = useMemo(() => edition(day, progress), [day, progress]);
  const photo = (id?: string) => photos.find(p => p.id === id);

  if (progress.jornalDia !== day) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto w-[220px] rounded bg-[#fbf8f0] border-2 border-[#2e2a40] p-3 rotate-[-3deg] shadow-[6px_6px_0_#0003]">
          <div className="text-[18px] tracking-tight border-b-4 border-double border-[#2e2a40] pb-1" style={{ ...serif, fontWeight: 900 }}>JORNAL WIT</div>
          <div className="text-[9px] mt-2 leading-4" style={serif}>{ed.manchete}</div>
          <div className="mt-2 h-10 bg-[repeating-linear-gradient(#2e2a4022_0_2px,transparent_2px_6px)]" />
        </div>
        <div className="text-[8px] text-[#5a5470] mt-4 mb-2">Edição de hoje: as manchetes da cidade, as suas matérias e as suas fotos.</div>
        <button onClick={() => {
          const r = buyPaper(progress, day);
          if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
          saveProgress(r.progress); play('coin');
        }} className="px-4 py-2 rounded-lg bg-[#c84a6a] text-white text-[10px] border-b-4 border-[#8a2a44] inline-flex items-center gap-1.5">
          COMPRAR · {PAPER_PRICE} <Icon id="moeda" size={12} />
        </button>
        {msg && <div className="mt-2 text-[8px] text-[#e8485a]">{msg}</div>}
      </div>
    );
  }

  const d = new Date();
  return (
    <div className="rounded bg-[#fbf8f0] border-2 border-[#2e2a40] p-3 text-[#1e1a28]" style={serif}>
      <div className="flex justify-between text-[9px] border-b border-[#2e2a40] pb-1">
        <span>Nº {ed.numero}</span><span>{d.toLocaleDateString('pt-BR')}</span><span>1 moeda</span>
      </div>
      <div className="text-center text-[32px] leading-none my-1.5 tracking-tight" style={{ fontWeight: 900 }}>JORNAL WIT</div>
      <div className="text-center text-[9px] border-y-4 border-double border-[#2e2a40] py-0.5 mb-2">O jornal dos alunos do Núcleo WIT</div>
      {/* manchete: a matéria mais nova do aluno (com a foto dela) */}
      <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-3 items-start">
        <div>
          <div className="text-[20px] leading-[25px]" style={{ fontWeight: 800 }}>{ed.manchete}</div>
          {ed.materias[0] && <div className="text-[9px] text-[#c84a6a] mt-1">Por você, repórter do Jornal WIT</div>}
        </div>
        {photo(ed.materias[0]?.foto) && (
          <div className="w-full sm:w-[260px]">
            <img src={photo(ed.materias[0]?.foto)!.data} alt="" className="w-full aspect-[16/9] object-cover border border-[#2e2a40]" />
            <div className="text-[9px] italic text-[#5a5470]">Foto: {photo(ed.materias[0]?.foto)!.lugar}</div>
          </div>
        )}
      </div>
      {ed.materias.length > 1 && (
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          {ed.materias.slice(1).map((m, k) => {
            const ph = photo(m.foto);
            return (
              <div key={k} className="border-t-2 border-[#2e2a40] pt-1.5">
                {ph && <img src={ph.data} alt={ph.lugar} className="w-full aspect-[16/9] object-cover border border-[#2e2a40]" />}
                <div className="text-[12px] leading-[17px] mt-1" style={{ fontWeight: 700 }}>{m.text}</div>
              </div>
            );
          })}
        </div>
      )}
      <div className="grid sm:grid-cols-[1fr_180px] gap-3">
        <div>
          <div className="text-[10px] tracking-widest border-b border-[#2e2a40] mb-1" style={{ fontWeight: 700 }}>NOTAS DA CIDADE</div>
          {ed.notas.map((n, k) => <div key={k} className="text-[12px] leading-[17px] py-1 border-b border-dotted border-[#2e2a4055]">{n}</div>)}
        </div>
        <div>
          <div className="text-[10px] tracking-widest border-b border-[#2e2a40] mb-1" style={{ fontWeight: 700 }}>DICA DO WIT-BOT</div>
          <div className="text-[11px] leading-[16px] bg-[#e8f4d8] p-2 border border-[#5a9a2a]">{ed.dica}</div>
          {photos.length > 0 && <>
            <div className="text-[10px] tracking-widest border-b border-[#2e2a40] mt-3 mb-1" style={{ fontWeight: 700 }}>FOTOS DO LEITOR</div>
            <div className="grid grid-cols-2 gap-1">
              {photos.slice(0, 4).map(p => <img key={p.id} src={p.data} alt={p.lugar} title={p.lugar} className="w-full aspect-[16/9] object-cover border border-[#2e2a40]" />)}
            </div>
          </>}
        </div>
      </div>
      {!ed.materias.length && <div className="text-[10px] italic text-[#5a5470] mt-3">Quer sair aqui? Escreva uma matéria (aba TRABALHO) e tire fotos com a CÂMERA.</div>}
    </div>
  );
}
