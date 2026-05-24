// ============================================================
// Onda 11.4 — Ícones SVG inline para os 12 elementos (namespace
// lowercase do skillsRegistry). Sem emoji, sem PNG.
// ============================================================

import type { FC, SVGProps } from 'react';
import type { ElementType } from './skillsRegistry';

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

const Fire: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M24 6c4 6 10 10 10 18a10 10 0 11-20 0c0-4 2-6 4-8 0 4 2 6 4 6 0-6-2-10 2-16z" />
  </svg>
);
const Water: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M24 6c-8 10-14 18-14 24a14 14 0 1028 0c0-6-6-14-14-24z" />
  </svg>
);
const Grass: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M24 42c0-14 6-22 18-26-2 14-8 22-18 26z" />
    <path d="M24 42c0-14-6-22-18-26 2 14 8 22 18 26z" />
    <path d="M24 26v16" />
  </svg>
);
const Electric: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M28 4l-12 22h10l-4 18 16-24H28l4-16z" />
  </svg>
);
const Ice: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M24 4v40M4 24h40M10 10l28 28M38 10L10 38" />
    <path d="M20 8l4-4 4 4M20 40l4 4 4-4M8 20l-4 4 4 4M40 20l4 4-4 4" />
  </svg>
);
const Fighting: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M14 8l8 6-2 8 8 6-2 8 8 4" />
    <path d="M8 18l6 4M16 26l6 4M24 34l6 4" />
  </svg>
);
const Poison: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <circle cx="24" cy="20" r="12" />
    <circle cx="20" cy="18" r="1.5" fill="currentColor" />
    <circle cx="28" cy="18" r="1.5" fill="currentColor" />
    <path d="M18 24c2 2 4 3 6 3s4-1 6-3" />
    <path d="M14 36h20" />
  </svg>
);
const Ground: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M6 38l8-14 6 8 6-12 8 18z" />
    <path d="M6 38h36" />
  </svg>
);
const Flying: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M4 28c8-12 16-12 20-6 4-6 12-6 20 6-6 0-12 4-20 12-8-8-14-12-20-12z" />
  </svg>
);
const Ghost: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M12 22a12 12 0 1124 0v18l-4-4-4 4-4-4-4 4-4-4-4 4V22z" />
    <circle cx="20" cy="22" r="1.5" fill="currentColor" />
    <circle cx="28" cy="22" r="1.5" fill="currentColor" />
  </svg>
);
const Steel: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <circle cx="24" cy="24" r="8" />
    <path d="M24 4v8M24 36v8M4 24h8M36 24h8M10 10l6 6M32 32l6 6M38 10l-6 6M10 38l6-6" />
  </svg>
);
const Dark: FC<IconProps> = ({ size, ...r }) => (
  <svg {...base(size)} {...r}>
    <path d="M30 6a18 18 0 100 36 14 14 0 010-36z" />
  </svg>
);

export const ELEMENT_ICONS: Record<ElementType, FC<IconProps>> = {
  fire: Fire, water: Water, grass: Grass, electric: Electric, ice: Ice, fighting: Fighting,
  poison: Poison, ground: Ground, flying: Flying, ghost: Ghost, steel: Steel, dark: Dark,
};

export const ELEMENT_META_PT: Record<ElementType, { label: string; color: string; theme: string; sampleSkill: string }> = {
  fire:     { label: 'Fogo',     color: '#ef4444', theme: 'Chama incandescente. Dano contínuo e queima.',          sampleSkill: 'Brasa — 25 de dano flamejante.' },
  water:    { label: 'Água',     color: '#3b82f6', theme: 'Fluxo e adaptação. Pressão e correntes.',               sampleSkill: 'Jato d’Água — 25 de dano fluido.' },
  grass:    { label: 'Planta',   color: '#84cc16', theme: 'Vida verde. Sustento e enredamento.',                   sampleSkill: 'Espinhos — 25 de dano vegetal.' },
  electric: { label: 'Elétrico', color: '#facc15', theme: 'Velocidade do raio. Paralisia.',                        sampleSkill: 'Choque — 25 de dano elétrico.' },
  ice:      { label: 'Gelo',     color: '#67e8f9', theme: 'Frio cortante. Lentidão e congelamento.',               sampleSkill: 'Estilhaço — 25 de dano congelante.' },
  fighting: { label: 'Lutador',  color: '#dc2626', theme: 'Corpo a corpo puro. Disciplina marcial.',               sampleSkill: 'Soco Duplo — 25 de dano físico.' },
  poison:   { label: 'Veneno',   color: '#a855f7', theme: 'Toxinas que corroem. Dano que perdura.',                sampleSkill: 'Picada — 25 de dano tóxico.' },
  ground:   { label: 'Terra',    color: '#d97706', theme: 'Solo, rocha e tremor. Defesa pesada.',                  sampleSkill: 'Pedregulho — 25 de dano terrestre.' },
  flying:   { label: 'Voador',   color: '#a78bfa', theme: 'Domínio dos céus. Ataques aéreos rápidos.',             sampleSkill: 'Investida Aérea — 25 de dano voador.' },
  ghost:    { label: 'Fantasma', color: '#7c3aed', theme: 'Sombras espectrais. Atravessa defesas.',                sampleSkill: 'Aparição — 25 de dano espectral.' },
  steel:    { label: 'Aço',      color: '#94a3b8', theme: 'Metal forjado. Defesa e cortes precisos.',              sampleSkill: 'Lâmina — 25 de dano de aço.' },
  dark:     { label: 'Sombrio',  color: '#1f2937', theme: 'Trevas profundas. Engano e dor mental.',                sampleSkill: 'Mordida Sombria — 25 de dano sombrio.' },
};
