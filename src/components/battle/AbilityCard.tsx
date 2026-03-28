import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Zap, Target, Shield, Swords, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ability, BattleCharacter } from '@/types/character';
import { ELEMENT_META, TIER_LABELS, getElementPoints } from '@/types/character';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAMAGE_TYPE_STYLE: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  Physical: { label: 'Físico',   icon: <Swords  size={10} />, color: 'bg-orange-500/80' },
  Special:  { label: 'Especial', icon: <Zap     size={10} />, color: 'bg-blue-500/80'   },
  Status:   { label: 'Suporte',  icon: <Shield  size={10} />, color: 'bg-slate-500/80'  },
};

const TIER_BORDER: Record<number, string> = {
  1: 'border-white/20',
  2: 'border-blue-400/40',
  3: 'border-purple-400/50',
  4: 'border-yellow-400/70',
};

const TIER_GLOW: Record<number, string> = {
  1: '',
  2: 'shadow-[0_0_12px_rgba(96,165,250,0.3)]',
  3: 'shadow-[0_0_16px_rgba(168,85,247,0.4)]',
  4: 'shadow-[0_0_24px_rgba(250,204,21,0.5)]',
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function AbilityTooltip({ ability, currentPoints }: { ability: Ability; currentPoints: number }) {
  const meta = ELEMENT_META[ability.elementName];
  const missing = Math.max(0, ability.requirement - currentPoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-xl p-3 text-xs pointer-events-none"
      style={{
        background: 'rgba(10,10,20,0.97)',
        border: `1px solid ${meta.color}44`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 12px ${meta.color}22`,
      }}
    >
      <div className="font-bold text-white mb-1">{ability.name}</div>
      <div className="text-white/60 mb-2 leading-relaxed">{ability.description}</div>
      <div className="space-y-1 text-white/70">
        {ability.baseDamage > 0 && <div>⚔️ Dano: <span className="text-white font-medium">{ability.baseDamage}</span></div>}
        <div>⚡ Energia: <span className="text-white font-medium">{ability.energyCost}</span></div>
        <div>🎯 Precisão: <span className="text-white font-medium">{ability.accuracy}%</span></div>
        {ability.effectType && (
          <div>✨ Efeito: <span className="text-white font-medium capitalize">{ability.effectType.replace('_', ' ')} ({Math.round((ability.effectChance ?? 0) * 100)}%)</span></div>
        )}
        <div className="border-t border-white/10 pt-1 mt-1">
          <span style={{ color: meta.color }}>
            {meta.icon} Req: {ability.requirement} pts {missing > 0 ? `(faltam ${missing})` : '✓'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── AbilityCard ──────────────────────────────────────────────────────────────

interface AbilityCardProps {
  ability:       Ability;
  character:     BattleCharacter;
  isEquipped:    boolean;
  equippedCount: number;
  onEquip:       (abilityId: string, slot: 1 | 2 | 3 | 4) => void;
  onUnequip:     (slot: 1 | 2 | 3 | 4) => void;
  equippedSlot?: number;
}

export function AbilityCard({
  ability,
  character,
  isEquipped,
  equippedCount,
  onEquip,
  onUnequip,
  equippedSlot,
}: AbilityCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const meta        = ELEMENT_META[ability.elementName];
  const currentPts  = getElementPoints(character, ability.elementName);
  const isLocked    = currentPts < ability.requirement;
  const canEquip    = !isLocked && !isEquipped && equippedCount < 4;
  const dmType      = DAMAGE_TYPE_STYLE[ability.damageType];

  function handleEquip() {
    if (!canEquip) return;
    // find next empty slot (1–4)
    const nextSlot = ([1, 2, 3, 4] as const).find(s => s > equippedCount) ?? 1;
    onEquip(ability.id, nextSlot as 1 | 2 | 3 | 4);
  }

  function handleUnequip() {
    if (equippedSlot) onUnequip(equippedSlot as 1 | 2 | 3 | 4);
  }

  return (
    <motion.div
      layout
      className={cn(
        'relative rounded-xl border p-3 text-white select-none transition-all duration-200',
        TIER_BORDER[ability.tier],
        TIER_GLOW[ability.tier],
        isLocked   ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        isEquipped && 'ring-2 ring-green-400/60',
      )}
      style={{
        background: isLocked
          ? 'rgba(255,255,255,0.04)'
          : `linear-gradient(135deg, ${meta.color}22 0%, rgba(0,0,0,0.6) 100%)`,
        borderColor: isLocked ? 'rgba(255,255,255,0.1)' : `${meta.color}55`,
      }}
      whileHover={!isLocked ? { scale: 1.03 } : {}}
      whileTap={!isLocked ? { scale: 0.97 } : {}}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <AbilityTooltip ability={ability} currentPoints={currentPts} />
        )}
      </AnimatePresence>

      {/* Tier badge */}
      <div
        className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: `${meta.color}33`, color: meta.color, border: `1px solid ${meta.color}55` }}
      >
        T{ability.tier}
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 pr-8">
        <span className="text-lg leading-none">{meta.icon}</span>
        <span className="font-bold text-xs leading-tight line-clamp-2">{ability.name}</span>
      </div>

      {/* Damage type badge */}
      <div className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded mb-2', dmType.color)}>
        {dmType.icon}
        {dmType.label}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 text-[10px] text-white/70">
        {ability.baseDamage > 0 && (
          <span className="flex items-center gap-0.5">
            <Swords size={9} /> {ability.baseDamage}
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <Zap size={9} /> {ability.energyCost}
        </span>
        <span className="flex items-center gap-0.5">
          <Target size={9} /> {ability.accuracy}%
        </span>
      </div>

      {/* Req bar */}
      <div className="mt-2">
        <div className="flex justify-between text-[9px] text-white/50 mb-0.5">
          <span>Req: {ability.requirement} pts</span>
          <span style={{ color: isLocked ? '#f87171' : '#4ade80' }}>
            {currentPts}/{ability.requirement}
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: isLocked ? '#f87171' : meta.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (currentPts / ability.requirement) * 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center bg-black/40 gap-1">
          <Lock size={20} className="text-white/40" />
          <span className="text-[10px] text-white/40">
            Faltam {ability.requirement - currentPts} pts
          </span>
        </div>
      )}

      {/* Equipped badge */}
      {isEquipped && (
        <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          SLOT {equippedSlot}
        </div>
      )}

      {/* Action button */}
      {!isLocked && (
        <button
          onClick={isEquipped ? handleUnequip : handleEquip}
          disabled={!isEquipped && !canEquip}
          className={cn(
            'mt-2 w-full text-[10px] font-bold py-1 rounded-lg transition-colors',
            isEquipped
              ? 'bg-red-500/80 hover:bg-red-500 text-white'
              : canEquip
              ? 'bg-green-500/80 hover:bg-green-500 text-white'
              : 'bg-white/10 text-white/30 cursor-not-allowed',
          )}
        >
          {isEquipped ? '✕ Remover' : canEquip ? '+ Equipar' : '4/4 slots'}
        </button>
      )}
    </motion.div>
  );
}
