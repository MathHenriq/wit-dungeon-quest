// Peças do visual pixel dos painéis: moldura, faixa de título, abas, botões,
// caixinhas e barra. Usadas pela moldura comum (work/Shell.tsx) e pelas telas
// que tinham o visual copiado à mão.
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { buttonColors, frameUrl, NIGHT, PAPER, shade, WOOD, type FrameColors } from './pixel';
import './pixel.css';

/** Estilo de borda pixel (9-slice): `edge` px de moldura na tela para 8 px da pecinha. */
export const frame = (c: FrameColors, edge = 16, thin = false): CSSProperties => ({
  borderImage: `${frameUrl(c, thin)} 8 fill / ${edge}px / 0 stretch`,
  borderWidth: edge,
});

export function PxPanel({ title, color = '#3c56b0', coins, onClose, wide, width, dark, children }: {
  title: string; color?: string; coins?: number; onClose: () => void; wide?: boolean; width?: number; dark?: boolean; children: ReactNode;
}) {
  const w = width ?? (wide ? 700 : 580);
  return (
    <div className="px-overlay" onPointerDown={onClose}>
      <div className={`px px-panel ${dark ? 'dark' : ''}`} style={{ ...frame(dark ? NIGHT : WOOD, 16), width: `min(96vw, ${w}px)` }}
        onPointerDown={e => e.stopPropagation()}>
        <Ribbon color={color}>{title}</Ribbon>
        <div className="px-top">
          {coins !== undefined && <span className="px-chip" style={frame(PAPER, 8, true)}><Icon id="moeda" size={14} /> {coins}</span>}
          <PxButton color="#b8433a" onClick={onClose} title="Sair">SAIR</PxButton>
        </div>
        <div className="px-body">{children}</div>
      </div>
    </div>
  );
}

export function Ribbon({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="px-ribbon" style={{ ...frame(buttonColors(color), 8, true), ['--rb-lo' as string]: shade(color, -0.45) }}><span>{children}</span></div>
  );
}

export function PxButton({ color = '#3a9a5a', big, ink, children, ...rest }: {
  color?: string; big?: boolean; ink?: boolean; children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`px-btn ${big ? 'big' : ''} ${ink ? 'ink' : ''} ${rest.className ?? ''}`} style={{ ...frame(buttonColors(color), 8, true), ...rest.style }}>
      {children}
    </button>
  );
}

export function PxBox({ children, className = '', style, color }: { children: ReactNode; className?: string; style?: CSSProperties; color?: string }) {
  const c = color ? { ...PAPER, ink: shade(color, -0.3), inner: color } : PAPER;
  return <div className={`px-box ${className}`} style={{ ...frame(c, 8, true), ...style }}>{children}</div>;
}

export function PxTabs<T extends string>({ tabs, value, onChange, color = '#3c56b0' }: {
  tabs: [T, string, string?][]; value: T; onChange: (t: T) => void; color?: string;
}) {
  return (
    <div className="px-tabs">
      {tabs.map(([t, l, icon]) => (
        <button key={t} onClick={() => onChange(t)} className={`px-tab ${value === t ? 'on' : ''}`}
          style={frame(value === t ? buttonColors(color) : PAPER, 8, true)}>
          {icon && <Icon id={icon} size={14} />}{l}
        </button>
      ))}
    </div>
  );
}

/** Barra em gomos (nível, fome, tempo). */
export function PxBar({ value, color = '#e8a020', className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`px-bar ${className}`} style={{ ...frame({ ...PAPER, fill: '#6a4a2a' }, 4, true), ['--bar' as string]: color }}>
      <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}
