import React from 'react';
import type { FloorBoss } from './useFloorSelect';

// ─── Boss icon paths ──────────────────────────────────────────────────────────

const BOSS_ICON_PATHS: Record<string, string> = {
  crown:   'M5 18l2-8 3 4 2-7 2 7 3-4 2 8H5z',
  skull:   'M10 2C6.48 2 4 5.48 4 9c0 2.85 1.65 5.35 4.1 6.65L8 18h8l-.1-2.35C18.35 14.35 20 11.85 20 9c0-3.52-2.48-7-10-7z M7.5 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z M12.5 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
  shield:  'M12 2L4 6v6c0 5.5 3.8 10.74 8 12 4.2-1.26 8-6.5 8-12V6l-8-4z',
  spider:  'M12 7a5 5 0 100 10A5 5 0 0012 7z M3 7l4 4M3 17l4-4M21 7l-4 4M21 17l-4-4M8 5l1 3M16 5l-1 3M8 19l1-3M16 19l-1-3',
  default: 'M12 4a8 8 0 00-8 8 8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8zm0 14a1 1 0 110-2 1 1 0 010 2zm1-5h-2V7h2v6z',
};

function BossIcon({ icon, size = 28, color }: { icon: string; size?: number; color: string }) {
  const d = BOSS_ICON_PATHS[icon] ?? BOSS_ICON_PATHS.default;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={d} fill={color} />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BossDetailPanelProps {
  boss: FloorBoss;
  open: boolean;
  onPlay?: () => void;
}

export function BossDetailPanel({ boss, open, onPlay }: BossDetailPanelProps) {
  return (
    <div className={`fs-panel${open ? ' fs-panel--open' : ''}`}>
      <div className="fs-panel__inner">
        <div className="fs-panel__portrait">
          <BossIcon icon={boss.icon} size={30} color="rgba(100,220,180,0.5)" />
        </div>

        <div className="fs-panel__details">
          <div className="fs-panel__name">{boss.name}</div>

          <div className="fs-panel__stats">
            <span className="fs-panel__stat">HP <b>{boss.hp}</b></span>
            <span className="fs-panel__stat">ATK <b>{boss.atk}</b></span>
            <span className="fs-panel__stat">DEF <b>{boss.def}</b></span>
          </div>

          <div className="fs-panel__rewards">
            {boss.coins != null && (
              <span className="fs-panel__reward fs-panel__reward--coin">
                {boss.coins} moedas
              </span>
            )}
            {boss.xp != null && (
              <span className="fs-panel__reward fs-panel__reward--xp">
                {boss.xp} XP
              </span>
            )}
            {boss.item && (
              <span className="fs-panel__reward fs-panel__reward--item">
                {boss.item}
              </span>
            )}
          </div>
        </div>

        {onPlay && (
          <button
            type="button"
            className="fs-panel__replay"
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
          >
            Jogar Novamente
          </button>
        )}
      </div>
    </div>
  );
}
