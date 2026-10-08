// Peças comuns das telas de lição (Lessons, Lessons2, Grafico), no kit pixel:
// o passo da lição, o botão grande e o recado de certo/quase.
import type { ReactNode } from 'react';
import { PxBox, PxButton } from '@/components/pixel/Pixel';

export const Head = ({ step, total, children }: { step?: number; total?: number; children: ReactNode }) => (
  <div className="flex justify-between items-start gap-2 text-[8px] mb-2">
    {step !== undefined && <span className="shrink-0 px-1.5 py-0.5 bg-[#2e2a40] text-[#ffd84a]">{step}/{total}</span>}
    <span className="text-[#5a5470] text-right leading-4 flex-1">{children}</span>
  </div>
);

export const Big = ({ onClick, children, color = '#3a78c8', disabled }: { onClick: () => void; children: ReactNode; color?: string; disabled?: boolean }) => (
  <PxButton big color={color} onClick={onClick} disabled={disabled} className="w-full mt-2 disabled:opacity-40">{children}</PxButton>
);

export const Note = ({ ok, children }: { ok: boolean; children: ReactNode }) => (
  <PxBox color={ok ? '#e8f8ec' : '#fdecef'} className="mt-2 text-[8px] leading-4">
    <b style={{ color: ok ? '#3a9a5a' : '#c84a6a' }}>{ok ? 'CERTO! ' : 'QUASE. '}</b>{children}
  </PxBox>
);
