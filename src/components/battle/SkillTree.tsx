import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BattleCharacter, ElementType, Ability } from '@/types/character';
import { ELEMENT_META, TIER_LABELS, getElementPoints } from '@/types/character';
import { useAbilities, useEquippedAbilities, useEquipAbility, useUnequipAbility, groupByElement } from '@/hooks/useAbilities';
import { AbilityCard } from './AbilityCard';
import { PointDistributor } from './PointDistributor';
import { useDistributePoints } from '@/hooks/useCharacter';

// ─── Equip bar ────────────────────────────────────────────────────────────────

function EquipBar({
  equipped,
  allAbilities,
  onUnequip,
}: {
  equipped: { ability_id: string; slot: number }[];
  allAbilities: Ability[];
  onUnequip: (slot: 1 | 2 | 3 | 4) => void;
}) {
  const slots = [1, 2, 3, 4] as const;
  const abilityMap = useMemo(
    () => Object.fromEntries(allAbilities.map(a => [a.id, a])),
    [allAbilities],
  );

  return (
    <div
      className="rounded-2xl p-4 mb-6"
      style={{
        background: 'rgba(0,229,255,0.04)',
        border: '1px solid rgba(0,229,255,0.15)',
      }}
    >
      <div className="text-xs text-white/50 mb-3 font-medium flex items-center gap-1">
        <span>⚔️</span>
        <span>Habilidades equipadas ({equipped.length}/4)</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {slots.map(slot => {
          const entry   = equipped.find(e => e.slot === slot);
          const ability = entry ? abilityMap[entry.ability_id] : null;
          const meta    = ability ? ELEMENT_META[ability.elementName] : null;

          return (
            <div
              key={slot}
              className="rounded-xl p-2 min-h-[64px] flex flex-col justify-between"
              style={{
                background: ability ? `${meta!.color}12` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${ability ? meta!.color + '40' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30 font-bold">SLOT {slot}</span>
                {ability && (
                  <span className="text-xs">{meta!.icon}</span>
                )}
              </div>
              {ability ? (
                <>
                  <div className="text-[11px] font-bold text-white leading-tight line-clamp-2">
                    {ability.name}
                  </div>
                  <button
                    onClick={() => onUnequip(slot)}
                    className="mt-1 text-[9px] text-red-400/70 hover:text-red-400 transition-colors text-left"
                  >
                    ✕ remover
                  </button>
                </>
              ) : (
                <div className="text-[10px] text-white/20 italic">vazio</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Element section ──────────────────────────────────────────────────────────

function ElementSection({
  element,
  abilities,
  character,
  equipped,
  onEquip,
  onUnequip,
  filterTier,
}: {
  element: ElementType;
  abilities: Ability[];
  character: BattleCharacter;
  equipped: { ability_id: string; slot: number }[];
  onEquip: (abilityId: string, slot: 1 | 2 | 3 | 4) => void;
  onUnequip: (slot: 1 | 2 | 3 | 4) => void;
  filterTier: number | null;
}) {
  const [open, setOpen] = useState(false);
  const meta        = ELEMENT_META[element];
  const currentPts  = getElementPoints(character, element);
  const unlocked    = abilities.filter(a => currentPts >= a.requirement).length;
  const filtered    = filterTier ? abilities.filter(a => a.tier === filterTier) : abilities;
  const equippedIds = equipped.map(e => e.ability_id);
  const hasEquipped = abilities.some(a => equippedIds.includes(a.id));

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${hasEquipped ? meta.color + '40' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        style={{
          background: open
            ? `linear-gradient(135deg, ${meta.color}18, rgba(0,0,0,0.5))`
            : 'rgba(255,255,255,0.02)',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className="font-bold text-white">{element}</div>
            <div className="text-xs text-white/40">
              {currentPts} pontos · {unlocked}/{abilities.length} desbloqueadas
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress pill */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: `${meta.color}20`, color: meta.color }}
          >
            {Math.round((unlocked / abilities.length) * 100)}%
          </div>
          {/* Mini progress bar */}
          <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(unlocked / abilities.length) * 100}%`,
                background: meta.color,
              }}
            />
          </div>
          {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
        </div>
      </button>

      {/* Ability grid */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-2">
              {/* Tier groups */}
              {[1, 2, 3, 4].map(tier => {
                const tierAbilities = filtered.filter(a => a.tier === tier);
                if (!tierAbilities.length) return null;

                return (
                  <div key={tier} className="mb-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                      Tier {tier} — {TIER_LABELS[tier]}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                      {tierAbilities.map(ability => {
                        const equippedEntry = equipped.find(e => e.ability_id === ability.id);
                        return (
                          <AbilityCard
                            key={ability.id}
                            ability={ability}
                            character={character}
                            isEquipped={!!equippedEntry}
                            equippedSlot={equippedEntry?.slot}
                            equippedCount={equipped.length}
                            onEquip={onEquip}
                            onUnequip={onUnequip}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SkillTree (main) ─────────────────────────────────────────────────────────

interface SkillTreeProps {
  character: BattleCharacter;
}

export function SkillTree({ character }: SkillTreeProps) {
  const [search,     setSearch]     = useState('');
  const [filterTier, setFilterTier] = useState<number | null>(null);

  const { data: abilities = [], isLoading: loadingAbilities } = useAbilities();
  const { data: equipped  = [], isLoading: loadingEquipped  } = useEquippedAbilities(character.id);

  const equipMutation   = useEquipAbility(character.id);
  const unequipMutation = useUnequipAbility(character.id);
  const distributeMut   = useDistributePoints(character.id);

  // Group all abilities by element
  const byElement = useMemo(() => groupByElement(abilities), [abilities]);

  // Filter by search
  const searchLower = search.toLowerCase();
  const filteredByElement = useMemo(() => {
    if (!searchLower) return byElement;
    const result: Record<string, Ability[]> = {};
    Object.entries(byElement).forEach(([el, abs]) => {
      const matches = abs.filter(a =>
        a.name.toLowerCase().includes(searchLower) ||
        a.description.toLowerCase().includes(searchLower),
      );
      if (matches.length) result[el] = matches;
    });
    return result;
  }, [byElement, searchLower]);

  const elements = Object.keys(filteredByElement) as ElementType[];

  function handleEquip(abilityId: string, slot: 1 | 2 | 3 | 4) {
    equipMutation.mutate({ abilityId, slot });
  }

  function handleUnequip(slot: 1 | 2 | 3 | 4) {
    unequipMutation.mutate(slot);
  }

  function handleDistribute(element: ElementType, amount: number) {
    const ptKey = ELEMENT_META[element].ptKey;
    distributeMut.mutate({
      element,
      amount,
      currentFreePoints:    character.freePoints,
      currentElementPoints: (character[ptKey] as number) ?? 0,
    });
  }

  if (loadingAbilities || loadingEquipped) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-white/40">
        <Loader2 size={20} className="animate-spin" />
        <span>Carregando habilidades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">🌳 Árvore de Habilidades</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {abilities.length} habilidades · {equipped.length}/4 equipadas
            {character.freePoints > 0 && (
              <span className="text-yellow-400 ml-2">· {character.freePoints} ponto(s) livre(s)</span>
            )}
          </p>
        </div>

        {/* Tier filter */}
        <div className="flex gap-1">
          {[null, 1, 2, 3, 4].map(t => (
            <button
              key={t ?? 'all'}
              onClick={() => setFilterTier(t)}
              className={cn(
                'text-[10px] font-bold px-2 py-1 rounded-lg transition-colors',
                filterTier === t
                  ? 'bg-white/20 text-white'
                  : 'text-white/30 hover:text-white/60',
              )}
            >
              {t === null ? 'Todos' : `T${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar habilidade..."
          className="w-full pl-8 pr-3 py-2 rounded-xl text-xs text-white placeholder-white/30 outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </div>

      {/* Point distributor (only shown when freePoints > 0) */}
      {character.freePoints > 0 && (
        <PointDistributor
          character={character}
          onDistribute={handleDistribute}
          isLoading={distributeMut.isPending}
        />
      )}

      {/* Equipped bar */}
      {equipped.length > 0 && (
        <EquipBar
          equipped={equipped}
          allAbilities={abilities}
          onUnequip={handleUnequip}
        />
      )}

      {/* Element sections */}
      {elements.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">
          Nenhuma habilidade encontrada.
        </div>
      ) : (
        <div className="space-y-2">
          {elements.map(element => (
            <ElementSection
              key={element}
              element={element}
              abilities={filteredByElement[element]}
              character={character}
              equipped={equipped}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              filterTier={filterTier}
            />
          ))}
        </div>
      )}
    </div>
  );
}
