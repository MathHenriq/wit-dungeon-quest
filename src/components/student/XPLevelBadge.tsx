import { motion } from 'framer-motion';
import type { BattleCharacter } from '@/types/character';
import {
  getTotalXPForLevel,
  getXPRequiredForLevel,
} from '@/lib/progression/xpCalculator';

// ─── Class icon mapping ───────────────────────────────────────────────────────

const CLASS_ICONS: Record<string, string> = {
  Guerreiro:  '⚔️',
  Mago:       '🔮',
  Arqueiro:   '🏹',
  Ladino:     '🗡️',
  Bardo:      '🎵',
  Druida:     '🌿',
  Paladino:   '🛡️',
  Necromante: '💀',
  Monge:      '🥊',
  Clerigo:    '✨',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface XPLevelBadgeProps {
  character: BattleCharacter;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function XPLevelBadge({ character }: XPLevelBadgeProps) {
  const { level, xp, name, class: charClass } = character;

  // Compute XP within the current level (cumulative - spent on past levels)
  const spentOnPastLevels = getTotalXPForLevel(level);
  const currentLevelXP    = Math.max(0, xp - spentOnPastLevels);
  const xpForNextLevel    = getXPRequiredForLevel(level);
  const progress          = Math.min(1, xpForNextLevel > 0 ? currentLevelXP / xpForNextLevel : 0);
  const pct               = Math.floor(progress * 100);

  const classIcon = CLASS_ICONS[charClass] ?? '⚔️';

  return (
    <div
      style={{
        position:        'fixed',
        bottom:          72,
        left:            16,
        zIndex:          40,
        width:           220,
        background:      'rgba(2, 6, 17, 0.88)',
        border:          '1px solid rgba(0, 229, 255, 0.3)',
        borderRadius:    10,
        padding:         '10px 12px',
        backdropFilter:  'blur(10px)',
        boxShadow:       '0 4px 24px rgba(0,0,0,0.6), 0 0 12px rgba(0,229,255,0.08)',
        fontFamily:      "'Rajdhani', sans-serif",
        pointerEvents:   'none',
        userSelect:      'none',
      }}
    >
      {/* Header row: icon + name + level */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        {/* Class icon */}
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: 'rgba(0,229,255,0.1)',
          border: '1px solid rgba(0,229,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          flexShrink: 0,
        }}>
          {classIcon}
        </div>

        {/* Name + class */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#e2e8f0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.1,
          }}>
            {name}
          </div>
          <div style={{
            fontSize: '0.58rem',
            color: 'rgba(0,229,255,0.55)',
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}>
            {charClass}
          </div>
        </div>

        {/* Level badge */}
        <div style={{
          flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(0,229,255,0.06))',
          border: '1px solid rgba(0,229,255,0.4)',
          borderRadius: 6,
          padding: '2px 7px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '0.38rem',
            color: 'rgba(0,229,255,0.6)',
            fontFamily: "'Press Start 2P', monospace",
            letterSpacing: 0.5,
            lineHeight: 1,
          }}>
            LV
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 900,
            color: '#00e5ff',
            lineHeight: 1,
            fontFamily: "'Rajdhani', sans-serif",
          }}>
            {level}
          </div>
        </div>
      </div>

      {/* XP label + numbers */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
      }}>
        <span style={{
          fontSize: '0.48rem',
          fontFamily: "'Press Start 2P', monospace",
          color: 'rgba(250,204,21,0.7)',
          letterSpacing: 1,
        }}>
          XP
        </span>
        <span style={{
          fontSize: '0.6rem',
          color: 'rgba(250,204,21,0.85)',
          fontWeight: 700,
        }}>
          {currentLevelXP.toLocaleString('pt-BR')} / {xpForNextLevel.toLocaleString('pt-BR')}
          <span style={{ color: 'rgba(250,204,21,0.45)', marginLeft: 4 }}>
            ({pct}%)
          </span>
        </span>
      </div>

      {/* XP progress bar */}
      <div style={{
        height: 6,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <motion.div
          style={{
            height: '100%',
            borderRadius: 3,
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            boxShadow: '0 0 6px rgba(251,191,36,0.5)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
