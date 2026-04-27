import React from 'react';
import type { EmblemSymbol, EmblemColor } from './guild-types';

interface GuildEmblemProps {
  symbol?: EmblemSymbol | string;
  color?: EmblemColor | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SYMBOL_PATHS: Record<string, React.ReactNode> = {
  shield: (
    <path d="M12 2L4 6v6c0 5.1 3.5 9.8 8 11 4.5-1.2 8-5.9 8-11V6L12 2z"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  sword: (
    <>
      <line x1="12" y1="3" x2="12" y2="17" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9"  y1="6" x2="15" y2="6"  strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10.5" y1="19" x2="13.5" y2="19" strokeWidth="2"   strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  crown: (
    <path d="M3 17L5 7l4.5 4L12 4l2.5 7L19 7l2 10H3z"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  dragon: (
    <>
      <path d="M7 12c0-3 2-6 5-6s5 3 5 6"  strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 14c1-1 3-2 8-2s7 1 8 2"  strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 18c1-2 3-3 4-3s3 1 4 3"  strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9"  cy="11" r="1" />
      <circle cx="15" cy="11" r="1" />
    </>
  ),
  wolf: (
    <>
      <path d="M6 8l-2-4 3 1 1-2 4 3 4-3 1 2 3-1-2 4"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8c0 4 2 7 4 8 2-1 4-4 4-8"
        strokeWidth="1.4" strokeLinecap="round" />
      <line x1="10" y1="12" x2="12" y2="14" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="14" y1="12" x2="12" y2="14" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  phoenix: (
    <>
      <path d="M12 4c-1 2-4 3-4 6 0 2 2 4 4 4s4-2 4-4c0-3-3-4-4-6z"
        strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 10L5 8M16 10l3-2"  strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 16l-2 3M15 16l2 3M12 14v4" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  star: (
    <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  rune: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="1" strokeWidth="1.5" />
      <line x1="9" y1="9"  x2="15" y2="9"  strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="15" x2="13" y2="15" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  axe: (
    <>
      <line x1="7" y1="17" x2="16" y2="8"  strokeWidth="2"   strokeLinecap="round" />
      <path d="M16 8c1-2 4-3 5-2s0 4-2 5l-3-3z"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="5" y1="19" x2="7"  y2="17" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  bow: (
    <>
      <path d="M5 19C6 12 9 7 12 5"   strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5  5C6 12 9 17 12 19" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="5"  x2="5"  y2="19" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="12" x2="18" y2="12" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 10l2 2-2 2" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  fire: (
    <>
      <path d="M12 2c0 4-4 5-4 9a4 4 0 008 0c0-4-4-5-4-9z"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12c0 2-1.5 3-1.5 4a1.5 1.5 0 003 0c0-1-1.5-2-1.5-4z"
        strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  lightning: (
    <path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  skull: (
    <>
      <path d="M8 21h8M9 21v-2h6v2"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3C8 3 5 6 5 10c0 2.5 1 4.5 3 5.5V18h8v-2.5c2-1 3-3 3-5.5 0-4-3-7-7-7z"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5"  cy="10" r="1" />
      <circle cx="14.5" cy="10" r="1" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1" strokeWidth="1.2" />
    </>
  ),
  hammer: (
    <>
      <line x1="8"  y1="16" x2="15" y2="9"   strokeWidth="2"   strokeLinecap="round" />
      <rect x="13" y="3"  width="8"  height="5" rx="1"
        strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="17" y1="8"  x2="15" y2="11"  strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6"  y1="18" x2="8"  y2="16"  strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  chalice: (
    <>
      <path d="M7 3h10l-2 7a5 5 0 01-6 0L7 3z"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="10" x2="12" y2="17" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8"  y1="21" x2="16" y2="21" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
};

export function GuildEmblem({
  symbol = 'shield',
  color  = '#825ADB',
  size   = 'md',
  className = '',
}: GuildEmblemProps) {
  const sizeClass = `guild-emblem--${size}`;
  const iconSize  = size === 'lg' ? 36 : size === 'md' ? 22 : 14;
  const bg        = `${color}14`;
  const border    = `${color}45`;
  const path      = SYMBOL_PATHS[symbol] ?? SYMBOL_PATHS.shield;

  return (
    <div
      className={`guild-emblem ${sizeClass} ${className}`}
      style={{
        background:   bg,
        border:       `1.5px solid ${border}`,
        borderRadius: size === 'lg' ? 12 : size === 'md' ? 8 : 5,
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        style={{ opacity: 0.85 }}
      >
        {path}
      </svg>
    </div>
  );
}
