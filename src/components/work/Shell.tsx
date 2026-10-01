import type { ReactNode } from 'react';
import { levelOf, PROFESSIONS, TITLES, type ProfId } from '@/game/professions';
import type { Progress } from '@/game/progress';
import { HUNGRY } from '@/game/life';
import { Icon } from '@/components/Icon';

export const font = "font-['Press_Start_2P',monospace]";

/** Moldura das telas de trabalho, mochila, mercado e missões. */
export function Shell({ title, color = '#3c56b0', coins, onClose, children, wide }: {
  title: string; color?: string; coins?: number; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50" onPointerDown={onClose}>
      <div className={`${wide ? 'w-[min(96vw,680px)]' : 'w-[min(94vw,560px)]'} max-h-[94vh] overflow-auto rounded-xl border-4 bg-[#f4efe2] p-4 text-[#2e2a40] ${font}`}
        style={{ borderColor: color }} onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="text-[12px]" style={{ color }}>{title}</div>
          {coins !== undefined && <span className="text-[10px] text-[#8a6a1a] ml-auto flex items-center gap-1"><Icon id="moeda" size={14} /> {coins}</span>}
          <button onClick={onClose} className="px-2 py-1 rounded bg-[#4a4660] text-white text-[10px]">SAIR</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Tabs = <T extends string>({ tabs, value, onChange, color = '#3c56b0' }: { tabs: [T, string][]; value: T; onChange: (t: T) => void; color?: string }) => (
  <div className="flex flex-wrap gap-1 mb-3">
    {tabs.map(([t, l]) => (
      <button key={t} onClick={() => onChange(t)}
        className={`px-2 py-1.5 rounded text-[9px] border-2 ${value === t ? 'text-white' : 'bg-white border-[#c8c0ac]'}`}
        style={value === t ? { background: color, borderColor: color } : undefined}>{l}</button>
    ))}
  </div>
);

/** Barra de nível de uma profissão. */
export function LevelBar({ xp }: { xp: number }) {
  const l = levelOf(xp);
  return (
    <div className="flex items-center gap-2 text-[7px]">
      <span>NV {l.level} · {TITLES[l.level - 1]}</span>
      <div className="flex-1 h-2 rounded bg-black/15 overflow-hidden min-w-[60px]"><div className="h-full bg-[#e8a020]" style={{ width: `${l.next ? (l.into / l.span) * 100 : 100}%` }} /></div>
      <span className="text-[#5a5470]">{l.next ? `${l.xp}/${l.next}` : 'MÁX'}</span>
    </div>
  );
}

/** Barriga (fome): 100 cheia. */
export function HungerBar({ v, compact }: { v: number; compact?: boolean }) {
  const low = v <= HUNGRY;
  return (
    <div className={`flex items-center gap-1 ${compact ? '' : 'text-[8px]'}`} title="Barriga">
      <span className={low ? 'animate-pulse' : ''}><Icon id="fome" size={compact ? 14 : 16} /></span>
      <div className={`${compact ? 'w-12' : 'w-24'} h-2.5 rounded bg-black/30 overflow-hidden border border-white/40`}>
        <div className="h-full" style={{ width: `${v}%`, background: v > 50 ? '#3ac46a' : v > HUNGRY ? '#f0c040' : '#e8485a' }} />
      </div>
    </div>
  );
}

export const profName = (id?: ProfId) => PROFESSIONS.find(p => p.id === id)?.name;
export type { Progress };
