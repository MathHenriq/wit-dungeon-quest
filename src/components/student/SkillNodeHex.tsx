import { memo } from 'react';
import { Lock, Swords, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Ability, BattleCharacter } from '@/types/character';
import { ELEMENT_META, getElementPoints } from '@/types/character';

/* ── Hex size by tier ──────────────────────────────────────────────── */
const TIER_SIZE: Record<number, string> = {
  1: 'st-hex--sm',
  2: 'st-hex--md',
  3: 'st-hex--lg',
  4: 'st-hex--xl',
};

/* ── Props ─────────────────────────────────────────────────────────── */
interface SkillNodeHexProps {
  ability: Ability;
  character: BattleCharacter;
  isEquipped: boolean;
  equippedSlot?: number;
  isSelected: boolean;
  x: number;
  y: number;
  onClick: (ability: Ability) => void;
}

export const SkillNodeHex = memo(function SkillNodeHex({
  ability,
  character,
  isEquipped,
  equippedSlot,
  isSelected,
  x,
  y,
  onClick,
}: SkillNodeHexProps) {
  const meta = ELEMENT_META[ability.elementName];
  const currentPts = getElementPoints(character, ability.elementName);
  const isLocked = currentPts < ability.requirement;
  const isAvailable = !isLocked;

  const hexBg = isLocked
    ? 'rgba(20, 20, 35, 0.8)'
    : `linear-gradient(135deg, ${meta.color}35 0%, rgba(10, 10, 25, 0.9) 100%)`;

  const hexBorder = isEquipped
    ? '#22c55e'
    : isLocked
    ? 'rgba(255,255,255,0.08)'
    : `${meta.color}88`;

  return (
    <motion.div
      className={cn(
        'st-node',
        isLocked && 'st-node--locked',
        isAvailable && !isEquipped && 'st-node--available',
        isEquipped && 'st-node--equipped',
        isSelected && 'st-node--selected',
      )}
      style={{ left: x, top: y }}
      onClick={() => onClick(ability)}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: Math.random() * 0.3, type: 'spring', damping: 15 }}
    >
      {/* Glow aura */}
      <div
        className="st-hex__glow"
        style={{ background: isEquipped ? '#22c55e' : meta.color }}
      />

      <div className={cn('st-hex', TIER_SIZE[ability.tier])}>
        {/* Outer border */}
        <div
          className="st-hex__border"
          style={{ background: hexBorder }}
        />

        {/* Inner shape */}
        <div
          className="st-hex__shape"
          style={{ background: hexBg }}
        />

        {/* Lock overlay */}
        {isLocked && (
          <div className="st-lock-overlay">
            <Lock size={16} color="rgba(255,255,255,0.3)" />
          </div>
        )}

        {/* Element icon */}
        {!isLocked && (
          <span className="st-hex__icon" style={{ color: meta.color }}>
            {meta.icon}
          </span>
        )}

        {/* Tier badge */}
        <div className={cn('st-tier-badge', `st-tier-badge--${ability.tier}`)}>
          {ability.tier}
        </div>

        {/* Equipped slot badge */}
        {isEquipped && equippedSlot && (
          <div className="st-slot-badge">{equippedSlot}</div>
        )}
      </div>

      {/* Name label */}
      <div
        className="st-node__label"
        style={{ color: isLocked ? 'rgba(255,255,255,0.2)' : isEquipped ? '#22c55e' : meta.color }}
      >
        {ability.name}
      </div>

      {/* Mini stats on hover — desktop only */}
      {!isLocked && (
        <div
          className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
          style={{
            bottom: 'calc(100% + 28px)',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontSize: 9,
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            gap: 6,
          }}
        >
          {ability.baseDamage > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Swords size={8} /> {ability.baseDamage}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Zap size={8} /> {ability.energyCost}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Target size={8} /> {ability.accuracy}%
          </span>
        </div>
      )}
    </motion.div>
  );
});
