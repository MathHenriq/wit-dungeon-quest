import { useState } from 'react';
import { ZONE_NAMES, type ZoneId } from '@/game/world/zone';
import { worldPoint, zoneRect, WORLD_LAYOUT } from '@/game/world/world-map';
import { Icon } from '@/components/Icon';
import { frame, PxButton, PxPanel, Ribbon } from '@/components/pixel/Pixel';
import { PAPER } from '@/components/pixel/pixel';
import './worldmap.css';

/**
 * Mapa-múndi (tecla M ou botão MAPA): a imagem pronta do mundo inteiro
 * (scripts/mapa/mapa-mundo.ts) com o nome de cada área, "você está aqui"
 * piscando no lugar certo e viagem rápida clicando na área.
 */
const AREAS: Record<ZoneId, { icon: string; color: string; text: string }> = {
  fazenda: { icon: 'colheita:milho', color: '#b8862a', text: 'Plantar, regar, colher e cuidar dos bichos.' },
  cidade: { icon: 'moeda', color: '#5a8a2a', text: 'Torre, Loja, Oficina, Arena e as guildas.' },
  lago: { icon: 'peixe', color: '#2a78c8', text: 'Pesca, Casa de Pesca, barquinho e o farol.' },
  wit: { icon: 'sensor', color: '#8a4ac8', text: 'Os cursos do Núcleo WIT e as profissões.' },
};

export function WorldMap({ zone, pos, ready, pending, onClose, onTravel }: {
  zone: ZoneId;
  pos: { tx: number; ty: number };
  /** (não usado: o tamanho de cada área vem de world-map.ts) */
  size?: { w: number; h: number };
  /** Áreas que já existem (as outras aparecem "em obras"). */
  ready: ZoneId[];
  /** Alvos do trabalho de campo que faltam em cada área. */
  pending?: Partial<Record<ZoneId, number>>;
  onClose: () => void;
  onTravel: (to: ZoneId) => void;
}) {
  const [hover, setHover] = useState<ZoneId | null>(null);
  const me = worldPoint(zone, pos.tx, pos.ty);
  const pick = hover ?? zone;
  return (
    <PxPanel title="MAPA DO MUNDO" color="#3c56b0" onClose={onClose} width={900}>
      <div className="wm-frame" style={frame({ ...PAPER, ink: '#5e3a1c', mid: '#c8a06a', inner: '#7a5a34' }, 12, true)}>
        <div className="wm-map" style={{ aspectRatio: `${WORLD_LAYOUT.w} / ${WORLD_LAYOUT.h}` }}>
          <img src={`${import.meta.env.BASE_URL}game/world/mapa.webp`} alt="" draggable={false} />
          {(Object.keys(AREAS) as ZoneId[]).map(z => {
            const r = zoneRect(z), here = z === zone, open = ready.includes(z), a = AREAS[z];
            return (
              <button key={z} className={`wm-area ${here ? 'here' : ''} ${hover === z ? 'hov' : ''}`}
                style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%`, ['--c' as string]: a.color }}
                onMouseEnter={() => setHover(z)} onMouseLeave={() => setHover(h => (h === z ? null : h))}
                onClick={() => { if (!here && open) onTravel(z); }}>
                <span className="wm-name"><Ribbon color={a.color}>{ZONE_NAMES[z].toUpperCase()}</Ribbon></span>
                {!!pending?.[z] && <span className="wm-job"><Icon id="mapa" size={14} /> {pending[z]}</span>}
              </button>
            );
          })}
          <span className="wm-me" style={{ left: `${me.x * 100}%`, top: `${me.y * 100}%` }}><i /><b>VOCÊ</b></span>
          <svg className="wm-rose" viewBox="0 0 15 15" shapeRendering="crispEdges">
            <path d="M7 0h1v6h-1zM6 2h3v1h-3zM7 9h1v6h-1zM0 7h6v1h-6zM9 7h6v1h-6zM6 6h3v3h-3z" fill="#3a2414" />
            <path d="M7 1h1v5h-1z" fill="#e8485a" />
          </svg>
        </div>
      </div>
      <div className="wm-info">
        <span className="ic" style={frame(PAPER, 8, true)}><Icon id={AREAS[pick].icon} size={28} /></span>
        <div className="flex-1">
          <div className="text-[10px] mb-1" style={{ color: AREAS[pick].color }}>{ZONE_NAMES[pick].toUpperCase()}{pick === zone ? ' · VOCÊ ESTÁ AQUI' : ''}</div>
          <div className="text-[8px] leading-4 text-[#6a4a2a]">{AREAS[pick].text}</div>
        </div>
        {pick !== zone && ready.includes(pick) && <PxButton color={AREAS[pick].color} onClick={() => onTravel(pick)}>VIAJAR</PxButton>}
      </div>
      <div className="mt-2 text-[7px] leading-4 text-[#7a5a34]">Clique numa área para viajar até a entrada dela. Andando até a borda de uma área você passa para a do lado.</div>
    </PxPanel>
  );
}
