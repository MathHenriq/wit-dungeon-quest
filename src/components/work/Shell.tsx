import type { ReactNode } from 'react';
import { levelOf, PROFESSIONS, TITLES, type ProfId } from '@/game/professions';
import type { Progress } from '@/game/progress';
import { HUNGRY } from '@/game/life';
import { Icon } from '@/components/Icon';
import { PxBar, PxPanel, PxTabs } from '@/components/pixel/Pixel';

export const font = "font-['Press_Start_2P',monospace]";

/** Moldura das telas de trabalho, mochila, mercado e missões (pixel: madeira e pergaminho). */
export function Shell({ title, color = '#3c56b0', coins, onClose, children, wide }: {
  title: string; color?: string; coins?: number; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  return <PxPanel title={title} color={color} coins={coins} onClose={onClose} wide={wide}>{children}</PxPanel>;
}

export const Tabs = <T extends string>({ tabs, value, onChange, color = '#3c56b0' }: { tabs: [T, string, string?][]; value: T; onChange: (t: T) => void; color?: string }) => (
  <PxTabs tabs={tabs} value={value} onChange={onChange} color={color} />
);

/** Barra de nível de uma profissão. */
export function LevelBar({ xp }: { xp: number }) {
  const l = levelOf(xp);
  return (
    <div className="flex items-center gap-2 text-[7px]">
      <span>NV {l.level} · {TITLES[l.level - 1]}</span>
      <PxBar value={l.next ? l.into / l.span : 1} className="flex-1 min-w-[60px]" />
      <span className="text-[#7a5a34]">{l.next ? `${l.xp}/${l.next}` : 'MÁX'}</span>
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
