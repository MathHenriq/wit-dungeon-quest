// Estúdio de Comunicação: escrever a matéria. Uma testemunha conta o que viu;
// o repórter tira da fala o lide (QUEM, O QUÊ, ONDE, QUANDO), escolhe uma
// foto do álbum (opcional) e publica. Matéria certinha vai para o jornalzinho.
import { useMemo, useState } from 'react';
import { LIDE, LIDE_NAME, lideHits, lideText, pautas, publish, type Lide } from '@/game/press';
import { loadPhotos } from '@/game/photos';
import { loadProgress, saveProgress } from '@/game/progress';
import { today } from '@/game/life';
import { play } from '@/game/sfx';
import { Icon } from '@/components/Icon';
import type { GameProps } from './Minigames';

const INK = '#2e2a40', RED = '#c84a6a';

/** Retrato do GPT (folha testemunhas, na ordem do prompt). */
const WITNESSES = ['Tião', 'recepcionista', 'WIT-Bot', 'morador', 'padaria', 'entregador', 'fazenda', 'Central'];
const witness = (who: string) => WITNESSES.findIndex(w => who.includes(w));

export function Materia({ seed, onDone, towerMax = 1, day = 0 }: GameProps) {
  const list = useMemo(() => pautas(day, seed, towerMax), [day, seed, towerMax]);
  const photos = useMemo(() => loadPhotos(), []);
  const [i, setI] = useState(0);
  const [lide, setLide] = useState<Lide>({});
  const [foto, setFoto] = useState<string | undefined>();
  const [checked, setChecked] = useState(false);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState<string | undefined>();
  const p = list[i];
  const full = LIDE.every(s => lide[s]);
  const hits = checked ? lideHits(p, lide) : 0;

  const check = () => {
    if (!full) return;
    const h = lideHits(p, lide);
    setChecked(true);
    setTotal(t => t + h);
    play(h === 4 ? 'win' : h >= 2 ? 'coin' : 'lose');
    if (h === 4) {
      // certinha: sai no jornalzinho (com a foto escolhida)
      const text = lideText(lide);
      saveProgress(publish(loadProgress(), today(), text, foto));
      if (!best) setBest(text);
    }
  };
  const next = () => {
    if (i + 1 >= list.length) { onDone({ score: total / (list.length * 4), hits: total, headline: best }); return; }
    setI(i + 1); setLide({}); setFoto(undefined); setChecked(false); play('click');
  };

  return (
    <div style={{ color: INK }}>
      <div className="flex items-center justify-between text-[8px] mb-2">
        <span>PAUTA {i + 1}/{list.length}</span>
        <span className="text-[#5a5470]">Toda notícia responde: quem? o quê? onde? quando?</span>
      </div>
      {/* a testemunha */}
      <div className="flex gap-2 items-start mb-3">
        <div className="shrink-0 w-14 h-14 rounded-full bg-[#ffd8e0] border-2 border-[#e8a0b4] flex items-center justify-center overflow-hidden">
          {witness(p.event.testemunha) >= 0
            ? <img src={`${import.meta.env.BASE_URL}game/cenas/testemunhas-${witness(p.event.testemunha)}.png`} alt="" className="w-full h-full object-cover" />
            : <Icon id="jornal" size={26} />}
        </div>
        <div className="relative flex-1 rounded-lg bg-white border-2 border-[#e8c0cc] p-2.5 text-[9px] leading-[17px]">
          "{p.event.fala}"
          <div className="text-[7px] text-[#8a8498] mt-1">— {p.event.testemunha}</div>
        </div>
      </div>
      {/* o lide */}
      <div className="grid gap-1.5">
        {LIDE.map(s => (
          <div key={s} className="flex flex-wrap items-center gap-1.5">
            <span className="w-[62px] text-[8px]" style={{ color: RED }}>{LIDE_NAME[s]}</span>
            {p.options[s].map(o => {
              const on = lide[s] === o, right = o === p.event[s];
              const cls = !checked
                ? on ? 'bg-[#c84a6a] text-white border-[#c84a6a]' : 'bg-white border-[#d8d0c0] hover:border-[#c84a6a]'
                : right ? 'bg-[#c8f0d0] border-[#3a9a5a]' : on ? 'bg-[#f8c8c8] border-[#e8485a] line-through' : 'bg-white border-[#e0d8c4] opacity-50';
              return <button key={o} disabled={checked} onClick={() => { setLide(l => ({ ...l, [s]: o })); play('click'); }}
                className={`px-2 py-1.5 rounded border-2 text-[8px] leading-3 ${cls}`}>{o}</button>;
            })}
          </div>
        ))}
      </div>
      {/* foto */}
      <div className="mt-3 text-[8px]">
        <div className="mb-1 text-[#5a5470]">FOTO DA MATÉRIA {photos.length ? '(opcional)' : '· tire fotos com a CÂMERA pela cidade'}</div>
        {photos.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {photos.map(ph => (
              <button key={ph.id} disabled={checked} onClick={() => setFoto(f => (f === ph.id ? undefined : ph.id))}
                className={`shrink-0 rounded border-2 overflow-hidden ${foto === ph.id ? 'border-[#c84a6a]' : 'border-transparent opacity-80'}`}>
                <img src={ph.data} alt={ph.lugar} className="w-[72px] h-[44px] object-cover block" />
              </button>
            ))}
          </div>
        )}
      </div>
      {/* a matéria montada, no papel de jornal */}
      <div className="mt-3 rounded-md bg-[#fbf8f0] border-2 border-[#2e2a40] p-3">
        <div className="text-[7px] tracking-widest border-b-2 border-[#2e2a40] pb-1 mb-2 flex justify-between"><span>JORNAL WIT</span><span>SUA MATÉRIA</span></div>
        <div className="flex gap-2">
          {foto && <img src={photos.find(x => x.id === foto)?.data} alt="" className="w-[96px] h-[60px] object-cover border border-[#2e2a40] shrink-0" />}
          <div className="text-[10px] leading-[18px] min-h-[36px]" style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}>{lideText(lide) || <span className="text-[#a8a4b4] font-normal">Escolha as quatro partes...</span>}</div>
        </div>
      </div>
      {checked && (
        <div className="mt-2 text-[8px] leading-4" style={{ color: hits === 4 ? '#3a9a5a' : RED }}>
          {hits === 4 ? 'Matéria certinha! Saiu no jornalzinho do Estúdio.' : `${hits} de 4 certas. O certo está em verde: releia a fala da testemunha.`}
        </div>
      )}
      <div className="mt-3 flex justify-end">
        {!checked
          ? <button disabled={!full} onClick={check} className={`px-4 py-2 rounded-lg text-white text-[10px] border-b-4 ${full ? 'bg-[#c84a6a] border-[#8a2a44]' : 'bg-[#a8a4b4] border-[#8a86a0]'}`}>PUBLICAR</button>
          : <button onClick={next} className="px-4 py-2 rounded-lg text-white text-[10px] bg-[#4a4660] border-b-4 border-[#2a2840]">{i + 1 >= list.length ? 'TERMINAR' : 'PRÓXIMA PAUTA'}</button>}
      </div>
    </div>
  );
}
