import { motion } from 'framer-motion';
import type { Ability } from '@/types/character';
import type { BattlePhase } from '@/lib/battle';
import { ELEMENT_META } from '@/types/character';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BattleAbilityMenuProps {
  abilities:     Ability[];
  playerEnergy:  number;
  phase:         BattlePhase;
  onAbility:     (id: string) => void;
  onItem:        () => void;
  onFlee:        () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function damageTypeBadge(type: string) {
  if (type === 'Physical')
    return { label: 'FÍS', color: '#f97316', bg: 'rgba(249,115,22,0.15)' };
  if (type === 'Special')
    return { label: 'ESP', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' };
  return { label: 'STA', color: '#6ee7b7', bg: 'rgba(110,231,183,0.15)' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BattleAbilityMenu({
  abilities,
  playerEnergy,
  phase,
  onAbility,
  onItem,
  onFlee,
}: BattleAbilityMenuProps) {
  const isPlayerTurn = phase === 'PLAYER_TURN';
  const isProcessing = phase === 'ENEMY_TURN' || phase === 'PROCESSING';

  return (
    <div className="flex flex-col gap-2">
      {/* ── Ability grid 2×2 ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}
      >
        {abilities.slice(0, 4).map((ability, i) => {
          const canAfford = playerEnergy >= ability.energyCost;
          const disabled  = !isPlayerTurn || !canAfford;
          const meta      = ELEMENT_META[ability.elementName];
          const badge     = damageTypeBadge(ability.damageType);

          return (
            <motion.button
              key={ability.id}
              onClick={() => !disabled && onAbility(ability.id)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.03, y: -1 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 3,
                padding: '8px 10px',
                borderRadius: 8,
                background: disabled
                  ? 'rgba(255,255,255,0.03)'
                  : `linear-gradient(135deg, ${meta?.gradient
                      ? 'rgba(0,0,0,0)' : 'rgba(0,229,255,0.06)'}, rgba(255,255,255,0.04))`,
                border: `1px solid ${
                  disabled
                    ? 'rgba(255,255,255,0.08)'
                    : meta?.color
                      ? `${meta.color}55`
                      : 'rgba(0,229,255,0.3)'
                }`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? (isProcessing ? 0.5 : 0.6) : 1,
                transition: 'background 0.2s, border-color 0.2s',
                boxShadow: !disabled && !isProcessing
                  ? `0 0 12px ${meta?.color ?? '#00e5ff'}22`
                  : 'none',
                overflow: 'hidden',
                textAlign: 'left',
              }}
            >
              {/* Element stripe */}
              {meta?.color && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 3,
                    height: '100%',
                    background: meta.color,
                    borderRadius: '8px 0 0 8px',
                    opacity: disabled ? 0.3 : 0.8,
                  }}
                />
              )}

              {/* Name + type badge */}
              <div className="flex items-center gap-1.5 w-full pl-2">
                <span style={{ fontSize: '0.65rem' }}>{meta?.icon ?? '⚡'}</span>
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: disabled ? '#64748b' : '#e2e8f0',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {ability.name}
                </span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: badge.color,
                    background: badge.bg,
                    border: `1px solid ${badge.color}44`,
                    borderRadius: 3,
                    padding: '0 3px',
                    letterSpacing: 0.5,
                  }}
                >
                  {badge.label}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-2 pl-2" style={{ fontSize: '0.68rem' }}>
                {ability.damageType !== 'Status' && (
                  <span style={{ color: '#f87171' }} title="Poder">
                    ⚔ {ability.baseDamage}
                  </span>
                )}
                <span
                  style={{
                    color: playerEnergy >= ability.energyCost ? '#67e8f9' : '#f87171',
                    fontWeight: 600,
                  }}
                  title="Custo de energia"
                >
                  ⚡ {ability.energyCost}
                </span>
                <span style={{ color: '#94a3b8' }} title="Precisão">
                  🎯 {ability.accuracy}%
                </span>
              </div>
            </motion.button>
          );
        })}

        {/* Empty slots when fewer than 4 abilities */}
        {Array.from({ length: Math.max(0, 4 - abilities.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.06)',
              minHeight: 56,
            }}
          />
        ))}
      </div>

      {/* ── Items + Flee row ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <motion.button
          onClick={isPlayerTurn ? onItem : undefined}
          disabled={!isPlayerTurn}
          whileHover={isPlayerTurn ? { scale: 1.03 } : {}}
          whileTap={isPlayerTurn ? { scale: 0.97 } : {}}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px',
            borderRadius: 8,
            background: 'rgba(255,215,0,0.07)',
            border: '1px solid rgba(255,215,0,0.25)',
            color: isPlayerTurn ? '#fbbf24' : '#78716c',
            cursor: isPlayerTurn ? 'pointer' : 'not-allowed',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: 1,
            opacity: isPlayerTurn ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
        >
          🧪 ITEM
        </motion.button>

        <motion.button
          onClick={isPlayerTurn ? onFlee : undefined}
          disabled={!isPlayerTurn}
          whileHover={isPlayerTurn ? { scale: 1.03 } : {}}
          whileTap={isPlayerTurn ? { scale: 0.97 } : {}}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: isPlayerTurn ? '#f87171' : '#78716c',
            cursor: isPlayerTurn ? 'pointer' : 'not-allowed',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: 1,
            opacity: isPlayerTurn ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
        >
          🏃 FUGIR
        </motion.button>
      </div>
    </div>
  );
}
