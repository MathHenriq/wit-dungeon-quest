import { ZONE_NAMES, type ZoneId } from '@/game/world/zone';
import { Icon } from '@/components/Icon';

/**
 * Mapa-múndi (tecla M ou botão MAPA): as áreas ligadas pelas bordas, com
 * "você está aqui" e a viagem rápida para a entrada de qualquer área.
 */
const AREAS: { id: ZoneId; col: number; row: number; icon: string; color: string; text: string }[] = [
  { id: 'fazenda', col: 1, row: 1, icon: 'colheita:milho', color: '#c8a040', text: 'Plantar, regar, colher e cuidar dos bichos.' },
  { id: 'cidade', col: 2, row: 1, icon: 'moeda', color: '#8cc63f', text: 'Torre, Loja, Oficina, Arena e as guildas.' },
  { id: 'lago', col: 3, row: 1, icon: 'peixe', color: '#4a9ae8', text: 'Pesca, Casa de Pesca, barquinho e o farol.' },
  { id: 'wit', col: 2, row: 2, icon: 'sensor', color: '#b06ae8', text: 'Os cursos do Núcleo WIT e as profissões.' },
];

export function WorldMap({ zone, pos, size, ready, onClose, onTravel }: {
  zone: ZoneId;
  pos: { tx: number; ty: number };
  size: { w: number; h: number };
  /** Áreas que já existem (as outras aparecem "em obras"). */
  ready: ZoneId[];
  onClose: () => void;
  onTravel: (to: ZoneId) => void;
}) {
  const font = "font-['Press_Start_2P',monospace]";
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55" onPointerDown={onClose}>
      <div className={`w-[min(94vw,720px)] rounded-xl border-4 border-[#4a4660] bg-[#f4efe2] p-4 text-[#2e2a40] ${font}`} onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] text-[#3c56b0]">MAPA DO MUNDO</div>
          <button onClick={onClose} className="px-2 py-1 rounded bg-[#4a4660] text-white text-[10px]">FECHAR</button>
        </div>
        <div className="grid grid-cols-3 gap-2" style={{ gridTemplateRows: 'auto auto' }}>
          {AREAS.map(a => {
            const here = a.id === zone, open = ready.includes(a.id);
            return (
              <div key={a.id} style={{ gridColumn: a.col, gridRow: a.row, borderColor: a.color }}
                className={`relative rounded-lg border-4 p-2 min-h-[118px] flex flex-col ${here ? 'bg-white' : 'bg-white/70'}`}>
                <div className="leading-none mb-1"><Icon id={a.icon} size={24} /></div>
                <div className="text-[9px] leading-4" style={{ color: a.color }}>{ZONE_NAMES[a.id].toUpperCase()}</div>
                <div className="text-[8px] leading-4 text-[#5a5470] mt-1 flex-1">{a.text}</div>
                {here && (
                  <>
                    <span className="absolute w-2.5 h-2.5 rounded-full bg-[#e8485a] border-2 border-white animate-pulse"
                      style={{ left: `${8 + (pos.tx / size.w) * 84}%`, top: `${10 + (pos.ty / size.h) * 80}%` }} />
                    <div className="text-[8px] text-[#e8485a] mt-1">VOCÊ ESTÁ AQUI</div>
                  </>
                )}
                {!here && open && (
                  <button onClick={() => onTravel(a.id)} className="mt-1 self-start px-2 py-1 rounded text-white text-[8px]" style={{ background: a.color }}>VIAJAR</button>
                )}
                {!open && <div className="text-[8px] text-[#b0487a] mt-1">EM OBRAS</div>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[8px] leading-4 text-[#5a5470]">Ande até a borda de uma área para passar para a do lado. VIAJAR leva direto para a entrada.</div>
      </div>
    </div>
  );
}
