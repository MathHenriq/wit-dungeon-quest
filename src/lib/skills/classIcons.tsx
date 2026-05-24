// ============================================================
// Onda 11.4 — Ícones SVG inline para as 12 classes.
// Sem dependência de imagem/emoji. Cada glifo é minimalista,
// monocromático e herda `currentColor` para colorização via CSS.
// ============================================================

import type { FC, SVGProps } from 'react';
import type { ClassType } from './skillsRegistry';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size?: number): SVGProps<SVGSVGElement> => ({
  width: size ?? 48,
  height: size ?? 48,
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

// ─── 12 ícones ────────────────────────────────────────────────────────────────

const Guerreiro: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M24 4v28" />
    <path d="M18 32h12" />
    <path d="M22 34v8h4v-8" />
    <path d="M20 8l4-4 4 4" />
  </svg>
);

const Arqueiro: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M8 8c14 4 22 14 32 32" />
    <path d="M8 8l32 32" />
    <path d="M10 12l-2-4 4 2" />
    <path d="M38 36l4 2-2-4" />
  </svg>
);

const Mago: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <circle cx="24" cy="12" r="6" />
    <path d="M24 18v26" />
    <path d="M18 24h12" />
    <path d="M20 38h8" />
  </svg>
);

const Assassino: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M14 6l8 22" />
    <path d="M22 28l-4 4-4-4 4-4" />
    <path d="M34 6l-8 22" />
    <path d="M26 28l4 4 4-4-4-4" />
  </svg>
);

const Monge: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <rect x="14" y="18" width="20" height="14" rx="3" />
    <path d="M18 18v-4M24 18v-4M30 18v-4" />
    <path d="M14 24h-4M34 24h4" />
  </svg>
);

const Paladino: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 8h24v18c0 10-12 16-12 16s-12-6-12-16V8z" />
    <path d="M24 16v14M18 22h12" />
  </svg>
);

const Curandeiro: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M20 6h8v12h12v8H28v16h-8V26H8v-8h12V6z" />
  </svg>
);

const Invocador: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <circle cx="24" cy="24" r="18" />
    <path d="M24 6l5.3 11.8L42 19l-9 8.6L35 40l-11-5.8L13 40l2-12.4-9-8.6 12.7-1.2L24 6z" />
  </svg>
);

const Samurai: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M6 42c8 0 18-6 24-14s14-18 14-22" />
    <path d="M6 42l4-2M44 6l-2 4" />
    <path d="M16 32l-4 6 6-4" />
  </svg>
);

const Bardo: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <ellipse cx="24" cy="32" rx="10" ry="12" />
    <path d="M24 20V6" />
    <path d="M20 6h8" />
    <path d="M18 30h12M18 34h12" />
  </svg>
);

const Lanceiro: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M10 38L34 14" />
    <path d="M34 14l6-2-2 6-4-4z" />
    <path d="M10 38l-2 4 4-2" />
    <path d="M28 18l4 4" />
  </svg>
);

const Alquimista: FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M18 6h12" />
    <path d="M20 6v10L10 38c-1 2 0 4 2 4h24c2 0 3-2 2-4L28 16V6" />
    <path d="M14 28h20" />
    <circle cx="20" cy="34" r="1.5" fill="currentColor" />
    <circle cx="28" cy="32" r="1.5" fill="currentColor" />
  </svg>
);

// ─── Map ──────────────────────────────────────────────────────────────────────

export const CLASS_ICONS: Record<ClassType, FC<IconProps>> = {
  guerreiro:  Guerreiro,
  arqueiro:   Arqueiro,
  mago:       Mago,
  assassino:  Assassino,
  monge:      Monge,
  paladino:   Paladino,
  curandeiro: Curandeiro,
  invocador:  Invocador,
  samurai:    Samurai,
  bardo:      Bardo,
  lanceiro:   Lanceiro,
  alquimista: Alquimista,
};

// ─── Metadados de UI (label PT-BR, cor, estilo de jogo) ──────────────────────

export interface ClassMeta {
  label:        string;
  color:        string;     // hex — tematização do card / glow
  playStyle:    string;     // 2 linhas, mostrado no card
}

export const CLASS_META: Record<ClassType, ClassMeta> = {
  guerreiro:  { label: 'Guerreiro',  color: '#ef4444', playStyle: 'Tanque de linha de frente. Força bruta\ne resistência para encarar qualquer chefe.' },
  arqueiro:   { label: 'Arqueiro',   color: '#a3e635', playStyle: 'Precisão à distância. Esquiva o que vier\ne devolve com crítico certeiro.' },
  mago:       { label: 'Mago',       color: '#60a5fa', playStyle: 'Domínio arcano puro. Dano mágico devastador\ncom limite mental como única barreira.' },
  assassino:  { label: 'Assassino',  color: '#a855f7', playStyle: 'Ataque súbito, sem rastro. Velocidade e\nveneno antes que o inimigo perceba.' },
  monge:      { label: 'Monge',      color: '#f97316', playStyle: 'Mestre do corpo. Combos físicos rápidos\ne resistência treinada na disciplina.' },
  paladino:   { label: 'Paladino',   color: '#eab308', playStyle: 'Aço sagrado em defesa do grupo. Tanque\ncom presença que inspira aliados.' },
  curandeiro: { label: 'Curandeiro', color: '#34d399', playStyle: 'Sustento e cura. Mantém o grupo vivo\ne floresce no caos do combate prolongado.' },
  invocador:  { label: 'Invocador',  color: '#8b5cf6', playStyle: 'Convoca poderes de outros planos.\nControle de campo, dano sombrio e tóxico.' },
  samurai:    { label: 'Samurai',    color: '#dc2626', playStyle: 'Lâmina única, golpe decisivo. Honra,\nvelocidade e dano físico explosivo.' },
  bardo:      { label: 'Bardo',      color: '#ec4899', playStyle: 'Encantador de massas. Buffs poderosos\ne magia que passa pelas defesas.' },
  lanceiro:   { label: 'Lanceiro',   color: '#06b6d4', playStyle: 'Alcance e disciplina. Ataques precisos\ncom a guarda sempre erguida.' },
  alquimista: { label: 'Alquimista', color: '#84cc16', playStyle: 'Ciência aplicada à batalha. Veneno,\nexplosivos e fórmulas que torcem o jogo.' },
};
