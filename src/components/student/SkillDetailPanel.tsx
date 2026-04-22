import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Zap, Target, Shield, Sparkles, Lock, Check } from 'lucide-react';
import type { Ability, BattleCharacter } from '@/types/character';
import { ELEMENT_META, TIER_LABELS, getElementPoints } from '@/types/character';
import type { ElementType } from '@/types/character';

/* ── Damage type config ────────────────────────────────────────────── */
const DAMAGE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  Physical: { label: 'Físico', icon: <Swords size={12} />, color: '#f97316' },
  Special:  { label: 'Especial', icon: <Zap size={12} />, color: '#3b82f6' },
  Status:   { label: 'Suporte', icon: <Shield size={12} />, color: '#94a3b8' },
};

/* ── Props ─────────────────────────────────────────────────────────── */
interface SkillDetailPanelProps {
  ability: Ability | null;
  character: BattleCharacter;
  isEquipped: boolean;
  equippedSlot?: number;
  occupiedSlots: number[];
  onEquip: (abilityId: string, slot: 1 | 2 | 3 | 4) => void;
  onUnequip: (slot: 1 | 2 | 3 | 4) => void;
  onClose: () => void;
  onDistribute?: (element: ElementType, amount: number) => void;
}

export function SkillDetailPanel({
  ability,
  character,
  isEquipped,
  equippedSlot,
  occupiedSlots,
  onEquip,
  onUnequip,
  onClose,
  onDistribute,
}: SkillDetailPanelProps) {
  return (
    <AnimatePresence mode="wait">
      {ability && (
        <motion.div
          key={ability.id}
          className="st-detail-panel"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <PanelContent
            ability={ability}
            character={character}
            isEquipped={isEquipped}
            equippedSlot={equippedSlot}
            occupiedSlots={occupiedSlots}
            onEquip={onEquip}
            onUnequip={onUnequip}
            onClose={onClose}
            onDistribute={onDistribute}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Panel content ─────────────────────────────────────────────────── */
function PanelContent({
  ability,
  character,
  isEquipped,
  equippedSlot,
  occupiedSlots,
  onEquip,
  onUnequip,
  onClose,
  onDistribute,
}: {
  ability: Ability;
  character: BattleCharacter;
  isEquipped: boolean;
  equippedSlot?: number;
  occupiedSlots: number[];
  onEquip: (abilityId: string, slot: 1 | 2 | 3 | 4) => void;
  onUnequip: (slot: 1 | 2 | 3 | 4) => void;
  onClose: () => void;
  onDistribute?: (element: ElementType, amount: number) => void;
}) {
  const meta = ELEMENT_META[ability.elementName];
  const currentPts = getElementPoints(character, ability.elementName);
  const isLocked = currentPts < ability.requirement;
  const canEquip = !isLocked && !isEquipped && occupiedSlots.length < 4;
  const missing = Math.max(0, ability.requirement - currentPts);
  const dmg = DAMAGE_CONFIG[ability.damageType];
  const reqPercent = Math.min(100, (currentPts / Math.max(1, ability.requirement)) * 100);

  function handleEquip() {
    if (!canEquip) return;
    // Find first empty slot (1-4)
    const emptySlot = ([1, 2, 3, 4] as const).find(s => !occupiedSlots.includes(s));
    if (!emptySlot) return;
    onEquip(ability.id, emptySlot);
  }

  function handleUnequip() {
    if (equippedSlot) onUnequip(equippedSlot as 1 | 2 | 3 | 4);
  }

  return (
    <div className="p-5">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/5 transition-all z-10"
      >
        <X size={16} />
      </button>

      {/* ── Header ─────────────────────────────────── */}
      <div className="st-animate-fade-up mb-6">
        {/* Element & tier label */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md"
            style={{
              background: `${meta.color}18`,
              border: `1px solid ${meta.color}40`,
              color: meta.color,
            }}
          >
            {meta.icon} {ability.elementName}
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Tier {ability.tier} — {TIER_LABELS[ability.tier]}
          </span>
        </div>

        {/* Ability name */}
        <h2
          className="text-2xl font-bold text-white mb-1"
          style={{
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.06em',
            textShadow: `0 0 20px ${meta.color}40`,
          }}
        >
          {ability.name}
        </h2>

        {/* Damage type */}
        {dmg && (
          <div
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md mt-1"
            style={{
              background: `${dmg.color}18`,
              color: dmg.color,
              border: `1px solid ${dmg.color}30`,
            }}
          >
            {dmg.icon}
            {dmg.label}
          </div>
        )}
      </div>

      {/* ── Icon showcase ──────────────────────────── */}
      <div className="st-animate-fade-up flex justify-center mb-6" style={{ animationDelay: '0.05s' }}>
        <div className="relative">
          {/* Glow behind */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{ background: meta.color, transform: 'scale(2)' }}
          />
          <div
            className="relative w-20 h-20 flex items-center justify-center"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: `linear-gradient(135deg, ${meta.color}40, rgba(10, 10, 25, 0.95))`,
              border: `2px solid ${meta.color}`,
            }}
          >
            <span className="text-3xl" style={{ filter: `drop-shadow(0 0 8px ${meta.color})` }}>
              {meta.icon}
            </span>
          </div>
          {/* Equipped badge */}
          {isEquipped && (
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-2 border-green-400 flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.5)]">
              <Check size={14} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* ── Description ────────────────────────────── */}
      <div className="st-animate-fade-up mb-6" style={{ animationDelay: '0.1s' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {ability.description || 'Sem descrição disponível.'}
        </p>
      </div>

      {/* ── Stats Grid ─────────────────────────────── */}
      <div
        className="st-animate-fade-up grid grid-cols-3 gap-3 mb-6"
        style={{ animationDelay: '0.15s' }}
      >
        {ability.baseDamage > 0 && (
          <StatBox
            icon={<Swords size={14} />}
            label="Dano"
            value={ability.baseDamage.toString()}
            color="#f97316"
          />
        )}
        <StatBox
          icon={<Zap size={14} />}
          label="Energia"
          value={ability.energyCost.toString()}
          color="#3b82f6"
        />
        <StatBox
          icon={<Target size={14} />}
          label="Precisão"
          value={`${ability.accuracy}%`}
          color="#22c55e"
        />
      </div>

      {/* ── Effect ─────────────────────────────────── */}
      {ability.effectType && (
        <div className="st-animate-fade-up mb-6" style={{ animationDelay: '0.2s' }}>
          <div
            className="p-3 rounded-xl"
            style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-1">
              <Sparkles size={12} />
              EFEITO ESPECIAL
            </div>
            <p className="text-xs text-white/60 capitalize">
              {ability.effectType.replace('_', ' ')} — {Math.round((ability.effectChance ?? 0) * 100)}% de chance
              {ability.effectValue ? ` (${ability.effectValue})` : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── Requirement bar ────────────────────────── */}
      <div className="st-animate-fade-up mb-6" style={{ animationDelay: '0.25s' }}>
        <div
          className="p-4 rounded-xl"
          style={{
            background: isLocked ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
            border: `1px solid ${isLocked ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.icon} Requisito {ability.elementName}
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: isLocked ? '#ef4444' : '#22c55e' }}
            >
              {currentPts} / {ability.requirement}
            </span>
          </div>
          <div className="st-stat-bar">
            <div
              className="st-stat-bar__fill"
              style={{
                width: `${reqPercent}%`,
                background: isLocked
                  ? 'linear-gradient(90deg, #ef4444, #f87171)'
                  : `linear-gradient(90deg, ${meta.color}, ${meta.color}cc)`,
              }}
            />
          </div>
          {isLocked && (
            <p className="text-xs text-red-400/70 mt-2 flex items-center gap-1">
              <Lock size={10} />
              Faltam {missing} pontos em {ability.elementName}
            </p>
          )}
        </div>
      </div>

      {/* ── Action button ──────────────────────────── */}
      <div className="st-animate-fade-up" style={{ animationDelay: '0.3s' }}>
        {isLocked ? (
          onDistribute && character.freePoints > 0 ? (
            <button
              onClick={() => onDistribute(ability.elementName, Math.min(character.freePoints, missing))}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${meta.color}25, ${meta.color}10)`,
                border: `1px solid ${meta.color}50`,
                color: meta.color,
                boxShadow: `0 4px 16px ${meta.color}18`,
              }}
            >
              <Sparkles size={14} />
              Gastar {Math.min(character.freePoints, missing)} ponto(s) em {ability.elementName}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.25)',
              }}
            >
              <Lock size={14} />
              Bloqueado — sem pontos livres
            </button>
          )
        ) : isEquipped ? (
          <button
            onClick={handleUnequip}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#ef4444',
            }}
          >
            <X size={14} />
            Remover do Slot {equippedSlot}
          </button>
        ) : canEquip ? (
          <button
            onClick={handleEquip}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${meta.color}30, ${meta.color}15)`,
              border: `1px solid ${meta.color}60`,
              color: meta.color,
              boxShadow: `0 4px 16px ${meta.color}20`,
            }}
          >
            <Zap size={14} />
            Equipar Habilidade
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            4/4 Slots Ocupados
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Stat box ──────────────────────────────────────────────────────── */
function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="p-3 rounded-xl text-center"
      style={{
        background: `${color}0a`,
        border: `1px solid ${color}22`,
      }}
    >
      <div className="flex justify-center mb-1.5" style={{ color }}>
        {icon}
      </div>
      <div className="text-lg font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>
        {value}
      </div>
      <div className="text-[9px] font-semibold uppercase tracking-widest text-white/40">
        {label}
      </div>
    </div>
  );
}
