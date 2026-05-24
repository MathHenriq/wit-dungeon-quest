import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import type { BattleCharacter, ElementType } from '@/types/character';
import { ELEMENT_META } from '@/types/character';
import { useAbilities, useEquippedAbilities, useEquipAbility, useUnequipAbility, groupByElement } from '@/hooks/useAbilities';
import { useDistributePoints } from '@/hooks/useCharacter';
import { useClassProfile } from '@/hooks/useClassProfile';
import { applyClassVariant } from '@/lib/skills/abilityVariants';
import { useQuery } from '@tanstack/react-query';
import { getMasteredElements } from '@/lib/skills/api';
import { SkillTreeCanvas } from './SkillTreeCanvas';
import { SkillDetailPanel } from './SkillDetailPanel';
import type { Ability } from '@/types/character';
import '@/styles/skilltree.css';

/* ═══════════════════════════════════════════════════════════════════════════
   SKILL TREE PAGE — Full-screen immersive cosmic tree
   ═══════════════════════════════════════════════════════════════════════════ */

interface SkillTreePageProps {
  character: BattleCharacter;
  studentId?: string;
  onBack: () => void;
}

export function SkillTreePage({ character, studentId, onBack }: SkillTreePageProps) {
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [filterElement, setFilterElement] = useState<ElementType | null>(null);

  // Data
  const { data: rawAbilities = [], isLoading: loadingAbilities } = useAbilities();
  const resolvedStudentId = studentId ?? character.studentId;
  const { data: classProfile } = useClassProfile(resolvedStudentId);
  const wave11Class = classProfile?.classType ?? null;

  // Patch 2.0 — filtro de elementos: só os destravados pelo aluno aparecem
  // na árvore (principal + secundário + dominados). Antes mostrava os 12.
  const { data: masteredElements = [] } = useQuery({
    queryKey: ['skills', 'mastery', resolvedStudentId],
    queryFn:  () => getMasteredElements(resolvedStudentId!),
    enabled:  !!resolvedStudentId,
    staleTime: 60_000,
  });

  const allowedElements = useMemo(() => {
    const set = new Set<string>();
    if (classProfile?.primaryElement)   set.add(String(classProfile.primaryElement).toLowerCase());
    if (classProfile?.secondaryElement) set.add(String(classProfile.secondaryElement).toLowerCase());
    masteredElements.forEach(e => set.add(String(e).toLowerCase()));
    return set;
  }, [classProfile?.primaryElement, classProfile?.secondaryElement, masteredElements]);

  const variantAbilities = useMemo(
    () => (wave11Class ? rawAbilities.map(a => applyClassVariant(a, wave11Class)) : rawAbilities),
    [rawAbilities, wave11Class],
  );

  // Fallback: se aluno não tem nenhum elemento atribuído ainda, mostra tudo
  // (evita tela vazia em estado raro de classe sem elemento).
  const abilities = useMemo(() => {
    if (allowedElements.size === 0) return variantAbilities;
    return variantAbilities.filter(a => allowedElements.has(String(a.elementName).toLowerCase()));
  }, [variantAbilities, allowedElements]);

  // Keep selected ability in sync with class-variant names when class loads
  const selectedAbilityResolved = useMemo(
    () => (selectedAbility ? abilities.find(a => a.id === selectedAbility.id) ?? selectedAbility : null),
    [abilities, selectedAbility],
  );
  const { data: equipped = [], isLoading: loadingEquipped } = useEquippedAbilities(character.id);
  const equipMutation = useEquipAbility(character.id);
  const unequipMutation = useUnequipAbility(character.id);
  const distributeMut = useDistributePoints(character.id);

  // Derived
  const equippedMap = useMemo(
    () => new Map(equipped.map(e => [e.ability_id, e.slot])),
    [equipped],
  );

  const elements = useMemo(() => {
    const set = new Set<ElementType>();
    abilities.forEach(a => set.add(a.elementName));
    return Array.from(set);
  }, [abilities]);

  const abilityMap = useMemo(
    () => new Map(abilities.map(a => [a.id, a])),
    [abilities],
  );

  // Handlers
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
      currentFreePoints: character.freePoints,
      currentElementPoints: (character[ptKey] as number) ?? 0,
    });
  }

  // Loading state
  if (loadingAbilities || loadingEquipped) {
    return (
      <div className="skill-tree-root flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-cyan-400 mx-auto mb-4" />
          <p
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Exo 2, sans-serif' }}
          >
            Carregando árvore...
          </p>
        </div>
      </div>
    );
  }

  const selectedSlot = selectedAbilityResolved ? equippedMap.get(selectedAbilityResolved.id) : undefined;

  return (
    <div className="skill-tree-root">
      {/* ── Cosmic background ──────────────────────────────────── */}
      <div className="st-cosmos">
        <div className="st-nebula st-nebula--1" />
        <div className="st-nebula st-nebula--2" />
        <div className="st-nebula st-nebula--3" />
      </div>
      <div className="st-vignette" />

      {/* ── Top bar ────────────────────────────────────────────── */}
      <div className="st-top-bar">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-400/70 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft size={14} />
            HUB
          </button>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <h1 className="st-top-bar__title">Árvore de Habilidades</h1>
            <p className="st-top-bar__subtitle">
              {abilities.length} habilidades · {equipped.length}/4 equipadas
              {character.freePoints > 0 && (
                <span className="text-yellow-400 ml-2">
                  · {character.freePoints} ponto(s) livre(s)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats summary */}
        <div className="hidden md:flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.15)',
              color: '#00e5ff',
            }}
          >
            Lv. {character.level}
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)',
              color: '#22c55e',
            }}
          >
            HP {character.hpCurrent}/{character.hpMax}
          </div>
        </div>
      </div>

      {/* ── Free points banner ─────────────────────────────────── */}
      <AnimatePresence>
        {character.freePoints > 0 && (
          <motion.div
            className="st-points-banner"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <Sparkles size={16} className="text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">
              {character.freePoints} ponto(s) para distribuir
            </span>
            <div className="flex flex-wrap gap-1.5 ml-2">
              {elements.map(el => {
                const meta = ELEMENT_META[el];
                return (
                  <button
                    key={el}
                    onClick={() => handleDistribute(el, 1)}
                    disabled={distributeMut.isPending}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all hover:scale-110"
                    style={{
                      background: `${meta.color}15`,
                      border: `1px solid ${meta.color}40`,
                    }}
                    title={`+1 ${el}`}
                  >
                    {meta.icon}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Element filter tabs ────────────────────────────────── */}
      <div className="st-element-tabs">
        {/* All button */}
        <button
          className={`st-element-tab ${filterElement === null ? 'st-element-tab--active' : ''}`}
          style={{
            '--tab-color': '#00e5ff',
            '--tab-bg': 'rgba(0,229,255,0.08)',
            '--tab-glow': 'rgba(0,229,255,0.2)',
          } as React.CSSProperties}
          onClick={() => setFilterElement(null)}
        >
          ✦
          <span className="st-element-tab__tooltip" style={{ color: '#00e5ff' }}>Todos</span>
        </button>

        {elements.map(el => {
          const meta = ELEMENT_META[el];
          return (
            <button
              key={el}
              className={`st-element-tab ${filterElement === el ? 'st-element-tab--active' : ''}`}
              style={{
                '--tab-color': meta.color,
                '--tab-bg': `${meta.color}12`,
                '--tab-glow': `${meta.color}30`,
              } as React.CSSProperties}
              onClick={() => setFilterElement(filterElement === el ? null : el)}
            >
              {meta.icon}
              <span className="st-element-tab__tooltip" style={{ color: meta.color }}>{el}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main canvas ────────────────────────────────────────── */}
      <SkillTreeCanvas
        abilities={abilities}
        character={character}
        equipped={equipped}
        selectedAbility={selectedAbility}
        filterElement={filterElement}
        onSelectAbility={setSelectedAbility}
      />

      {/* ── Detail panel ───────────────────────────────────────── */}
      <SkillDetailPanel
        ability={selectedAbilityResolved}
        character={character}
        isEquipped={selectedAbilityResolved ? !!equippedMap.get(selectedAbilityResolved.id) : false}
        equippedSlot={selectedSlot}
        occupiedSlots={equipped.map(e => e.slot)}
        onEquip={handleEquip}
        onUnequip={handleUnequip}
        onClose={() => setSelectedAbility(null)}
        onDistribute={handleDistribute}
      />

      {/* ── Equip bar (bottom) ─────────────────────────────────── */}
      <div className="st-equip-bar">
        {([1, 2, 3, 4] as const).map(slot => {
          const entry = equipped.find(e => e.slot === slot);
          const ability = entry ? abilityMap.get(entry.ability_id) : null;
          const meta = ability ? ELEMENT_META[ability.elementName] : null;

          return (
            <div
              key={slot}
              className={`st-equip-slot ${ability ? 'st-equip-slot--filled' : ''}`}
              style={ability && meta ? { borderColor: `${meta.color}40`, background: `${meta.color}08` } : undefined}
              onClick={() => ability && setSelectedAbility(ability)}
            >
              <span className="st-equip-slot__num">SLOT {slot}</span>
              {ability && meta ? (
                <>
                  <span className="st-equip-slot__icon">{meta.icon}</span>
                  <span className="st-equip-slot__name">{ability.name}</span>
                  <button
                    className="st-equip-slot__remove"
                    onClick={e => { e.stopPropagation(); handleUnequip(slot); }}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className="st-equip-slot__icon" style={{ opacity: 0.15, fontSize: 14 }}>—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bottom info bar ─────────────────────────────────────── */}
      <div
        className="absolute bottom-2 left-4 z-30 text-[9px] font-mono tracking-[0.3em] text-white/15"
      >
        YGGDRASIL // ÁRVORE DE HABILIDADES v1.0
      </div>
    </div>
  );
}
