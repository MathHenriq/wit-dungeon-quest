import React from 'react';
import { PlayerMarker }  from './PlayerMarker';
import { EnemyMarker }   from './EnemyMarker';
import { BossMarker }    from './BossMarker';
import type { FloorMapEnemy, FloorTheme } from './useFloorMap';

// ─── Organic topographic lines (Destiny 2 style) ──────────────────────────────

function TopoLines() {
  return (
    <svg
      className="fm-topo"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Horizontal organic curves */}
      <path d="M0 180 Q200 158 400 196 T800 178 T1200 210 T1600 182"
            stroke="rgba(255,255,255,.06)" strokeWidth="1" fill="none" />
      <path d="M0 310 Q280 282 560 328 T1100 300 T1600 334"
            stroke="rgba(255,255,255,.04)" strokeWidth="1" fill="none" />
      <path d="M0 450 Q240 424 480 466 T960 438 T1440 472 T1600 450"
            stroke="rgba(255,255,255,.05)" strokeWidth="1" fill="none" />
      <path d="M0 590 Q320 560 640 600 T1280 572 T1600 606"
            stroke="rgba(255,255,255,.04)" strokeWidth="1" fill="none" />
      <path d="M0 730 Q260 706 520 744 T1040 718 T1600 748"
            stroke="rgba(255,255,255,.03)" strokeWidth="1" fill="none" />

      {/* Vertical organic curves */}
      <path d="M280 0 Q302 220 278 450 T296 900"
            stroke="rgba(255,255,255,.03)" strokeWidth="1" fill="none" />
      <path d="M760 0 Q738 250 764 500 T744 900"
            stroke="rgba(255,255,255,.04)" strokeWidth="1" fill="none" />
      <path d="M1180 0 Q1204 200 1176 450 T1196 900"
            stroke="rgba(255,255,255,.03)" strokeWidth="1" fill="none" />

      {/* Terrain elevation rings */}
      <ellipse cx="340" cy="320" rx="130" ry="80"
               stroke="rgba(255,255,255,.035)" strokeWidth="1" fill="none" />
      <ellipse cx="340" cy="320" rx="210" ry="130"
               stroke="rgba(255,255,255,.022)" strokeWidth="1" fill="none" />
      <ellipse cx="1140" cy="560" rx="110" ry="70"
               stroke="rgba(255,255,255,.035)" strokeWidth="1" fill="none" />
      <ellipse cx="1140" cy="560" rx="175" ry="115"
               stroke="rgba(255,255,255,.022)" strokeWidth="1" fill="none" />
      <ellipse cx="780" cy="200" rx="160" ry="55"
               stroke="rgba(255,255,255,.028)" strokeWidth="1" fill="none" />

      {/* Diagonal ridge lines */}
      <path d="M80 620 Q300 590 520 640 Q740 686 960 644 Q1180 600 1400 648 Q1560 680 1600 660"
            stroke="rgba(255,255,255,.035)" strokeWidth="1" fill="none" />
      <path d="M0 820 Q400 790 800 830 Q1200 866 1600 828"
            stroke="rgba(255,255,255,.025)" strokeWidth="1" fill="none" />
    </svg>
  );
}

// ─── Atmospheric fog (theme-colored) ─────────────────────────────────────────

const FOG_COLORS: Record<FloorTheme, [string, string]> = {
  forest:  ['rgba(74,124,30,0.10)',  'rgba(74,124,30,0.06)'],
  desert:  ['rgba(201,164,74,0.08)', 'rgba(201,164,74,0.05)'],
  cave:    ['rgba(99,102,241,0.08)', 'rgba(99,102,241,0.05)'],
  castle:  ['rgba(220,38,38,0.08)',  'rgba(180,60,60,0.05)'],
  ice:     ['rgba(6,182,212,0.08)',  'rgba(6,182,212,0.05)'],
};

function FogLayer({ theme }: { theme: FloorTheme }) {
  const [c1, c2] = FOG_COLORS[theme] ?? FOG_COLORS.forest;
  return (
    <div
      className="fm-fog"
      style={{
        background: `
          radial-gradient(ellipse 70% 60% at 28% 38%, ${c1} 0%, transparent 65%),
          radial-gradient(ellipse 55% 50% at 72% 62%, ${c2} 0%, transparent 55%)
        `,
      }}
    />
  );
}

// ─── Zone labels (ghost text) ─────────────────────────────────────────────────

const ZONE_LABELS: Record<FloorTheme, Array<{ label: string; top: string; left: string }>> = {
  forest: [
    { label: 'Clareira Norte',  top: '14%', left: '10%' },
    { label: 'Bosque Antigo',   top: '58%', left: '38%' },
    { label: 'Trilha dos Ventos', top: '28%', left: '68%' },
  ],
  desert: [
    { label: 'Dunas Ardentes',  top: '14%', left: '10%' },
    { label: 'Ruinas Perdidas', top: '58%', left: '38%' },
    { label: 'Oasis Proibido',  top: '28%', left: '68%' },
  ],
  cave: [
    { label: 'Tunel Profundo',      top: '14%', left: '10%' },
    { label: 'Camara das Sombras',  top: '58%', left: '38%' },
    { label: 'Abismo',              top: '28%', left: '68%' },
  ],
  castle: [
    { label: 'Torre Norte',    top: '14%', left: '10%' },
    { label: 'Patio Central',  top: '58%', left: '38%' },
    { label: 'Catacomba',      top: '28%', left: '68%' },
  ],
  ice: [
    { label: 'Tundra Gelada',  top: '14%', left: '10%' },
    { label: 'Pico Nevado',    top: '58%', left: '38%' },
    { label: 'Cripta de Gelo', top: '28%', left: '68%' },
  ],
};

function ZoneLabels({ theme }: { theme: FloorTheme }) {
  const labels = ZONE_LABELS[theme] ?? ZONE_LABELS.forest;
  return (
    <>
      {labels.map(({ label, top, left }) => (
        <span
          key={label}
          className="fm-zone-label"
          style={{ top, left }}
        >
          {label}
        </span>
      ))}
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MapCanvasProps {
  mapRef: React.RefObject<HTMLDivElement>;
  theme: FloorTheme;
  backgroundUrl?: string | null;
  enemies: FloorMapEnemy[];
  bossUnlocked: boolean;
  playerX: number;
  playerY: number;
  isMoving: boolean;
  ripples: { x: number; y: number; key: number }[];
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MapCanvas({
  mapRef, theme, backgroundUrl, enemies, bossUnlocked,
  playerX, playerY, isMoving, ripples, onClick,
}: MapCanvasProps) {
  const bgStyle = backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : {};

  return (
    <div className="fm-canvas" ref={mapRef} onClick={onClick}>

      {/* Layer 0 — background */}
      <div className={`fm-bg fm-bg--${theme}`} style={bgStyle} />

      {/* Layer 1 — organic topo lines */}
      <TopoLines />

      {/* Layer 2 — atmospheric fog */}
      <FogLayer theme={theme} />

      {/* Layer 3 — vignette */}
      <div className="fm-vignette" />

      {/* Layer 4 — scanlines */}
      <div className="fm-scanlines" />

      {/* Layer 5 — ghost zone labels */}
      <ZoneLabels theme={theme} />

      {/* Layer 6 — click ripples */}
      {ripples.map(r => (
        <div
          key={r.key}
          className="fm-ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}

      {/* Layer 7 — enemy markers */}
      {enemies.map(e => {
        if (e.isBoss) {
          return (
            <BossMarker
              key={e.id}
              x={e.positionX}
              y={e.positionY}
              name={e.name}
              level={e.level}
              locked={!bossUnlocked}
            />
          );
        }
        return (
          <EnemyMarker
            key={e.id}
            x={e.positionX}
            y={e.positionY}
            name={e.name}
            iconType={e.iconType}
            spriteUrl={e.spriteUrl}
            defeated={e.defeated}
            level={e.level}
          />
        );
      })}

      {/* Layer 8 — player marker */}
      <PlayerMarker x={playerX} y={playerY} isMoving={isMoving} />
    </div>
  );
}
