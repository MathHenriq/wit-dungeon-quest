import React from 'react';
import { BossDetailPanel } from './BossDetailPanel';
import type { FloorSelectData } from './useFloorSelect';

// ─── SVG icons ────────────────────────────────────────────────────────────────

const BOSS_ICON_PATHS: Record<string, string> = {
  crown:   'M5 18l2-8 3 4 2-7 2 7 3-4 2 8H5z',
  skull:   'M10 2C6.48 2 4 5.48 4 9c0 2.85 1.65 5.35 4.1 6.65L8 18h8l-.1-2.35C18.35 14.35 20 11.85 20 9c0-3.52-2.48-7-10-7z M7.5 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z M12.5 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
  shield:  'M12 2L4 6v6c0 5.5 3.8 10.74 8 12 4.2-1.26 8-6.5 8-12V6l-8-4z',
  spider:  'M12 7a5 5 0 100 10A5 5 0 0012 7z',
  default: 'M12 4a8 8 0 100 16A8 8 0 0012 4z',
};

function BossIconSVG({ icon, color, size = 18 }: { icon: string; color: string; size?: number }) {
  const d = BOSS_ICON_PATHS[icon] ?? BOSS_ICON_PATHS.default;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={d} fill={color} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
            fill="rgba(100,220,180,0.55)" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M8 5l11 7-11 7z" fill="rgba(201,164,74,0.6)" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M18 8h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM12 17a2 2 0 110-4 2 2 0 010 4zM9 8V6a3 3 0 116 0v2H9z"
            fill="rgba(255,255,255,0.12)" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FloorNodeProps {
  floor: FloorSelectData;
  expanded: boolean;
  onToggle: () => void;
  onPlay: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloorNode({ floor, expanded, onToggle, onPlay }: FloorNodeProps) {
  const { status, floor_number, name, theme, boss } = floor;
  const s = status;

  function handleClick() {
    if (s === 'locked') return;
    if (s === 'current')   onPlay();
    if (s === 'completed') {
      // If we have boss detail data, expand the panel (which has its own
      // "Jogar Novamente" button). Otherwise enter the floor directly.
      if (boss) onToggle();
      else      onPlay();
    }
  }

  // Boss icon color
  const bossColor =
    s === 'completed' ? 'rgba(100,220,180,0.55)' :
    s === 'current'   ? 'rgba(201,164,74,0.65)'  :
                        'rgba(255,255,255,0.12)';

  const isVirtual  = String(floor.id).startsWith('virtual_');
  const numLabel   = (s === 'locked' && isVirtual) ? '?' : String(floor_number);
  const nameLabel  = (s === 'locked' && isVirtual) ? '???' : name;
  const themeMap: Record<string, string> = {
    forest: 'Floresta', desert: 'Deserto', cave: 'Caverna',
    castle: 'Castelo', ice: 'Gelo', volcano: 'Vulcao',
    fire: 'Fogo', swamp: 'Pântano', tower: 'Torre',
    labyrinth: 'Labirinto', ruins: 'Ruínas', temple: 'Templo',
    citadel: 'Cidadela', plains: 'Planícies', fortress: 'Fortaleza',
  };
  const themeLabel = (s === 'locked' && isVirtual) ? '???' : (themeMap[theme] ?? theme);
  const bossName   = (s === 'locked' && isVirtual) || !boss ? '???' : boss.name;
  const bossIcon   = boss?.icon ?? 'default';

  return (
    <div className="fs-node">
      {/* Dot on the vertical line */}
      <div className={`fs-node__dot fs-node__dot--${s}`} />

      {/* Main card */}
      <div
        className={`fs-card fs-card--${s}`}
        onClick={handleClick}
        data-floor={floor.id}
      >
        {/* Floor number circle */}
        <div className={`fs-num fs-num--${s}`}>{numLabel}</div>

        {/* Name + theme */}
        <div className="fs-info">
          <div className={`fs-info__name fs-info__name--${s}`}>{nameLabel}</div>
          <div className={`fs-info__theme${s === 'locked' ? ' fs-info__theme--locked' : ''}`}>
            {themeLabel}
          </div>
        </div>

        {/* Boss preview */}
        <div className="fs-boss">
          <div className={`fs-boss__ring fs-boss__ring--${s === 'completed' ? 'defeated' : s === 'current' ? 'active' : 'unknown'}`}>
            <BossIconSVG icon={bossIcon} color={bossColor} size={16} />
          </div>
          <span className={`fs-boss__name${s === 'current' ? ' fs-boss__name--active' : s === 'locked' ? ' fs-boss__name--unknown' : ''}`}>
            {bossName}
          </span>
          {s === 'completed' && boss?.coins != null && (
            <span className="fs-boss__drops">{boss.coins} m / {boss.xp} XP</span>
          )}
        </div>

        {/* Status icon */}
        <div className="fs-status">
          {s === 'completed' && <CheckIcon />}
          {s === 'current'   && <PlayIcon />}
          {s === 'locked'    && <LockIcon />}
        </div>
      </div>

      {/* Expandable boss detail panel (completed only) */}
      {s === 'completed' && boss && (
        <BossDetailPanel boss={boss} open={expanded} onPlay={onPlay} />
      )}
    </div>
  );
}
