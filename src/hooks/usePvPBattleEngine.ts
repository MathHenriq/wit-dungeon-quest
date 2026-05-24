import { useState, useCallback, useRef } from 'react';
import { BattleEngine, type BattleContext, type BattleEnemy, type ItemEffect } from '@/lib/battle';
import type { BattleCharacter, Ability, ElementType } from '@/types/character';
// Onda 11.3 — em PvP carregamos perfil/passivas dos DOIS lados.
import { getClassProfile, getStudentAttributes } from '@/lib/skills/api';
import { aggregatePassives, type PassiveEffectAggregation } from '@/lib/skills/evolutionsRegistry';
import type { ClassType } from '@/lib/skills/skillsRegistry';
import { toLegacyElement } from '@/lib/battle/elementBridge';

interface SideData {
  classType: ClassType | null;
  element:   ElementType | null;
  passives:  PassiveEffectAggregation | null;
}

async function loadSide(studentId: string | null | undefined): Promise<SideData> {
  if (!studentId) return { classType: null, element: null, passives: null };
  try {
    const [profile, attrs] = await Promise.all([
      getClassProfile(studentId),
      getStudentAttributes(studentId),
    ]);
    // PvP nunca é raid context — `isInRaid=false`.
    return {
      classType: (profile?.classType as ClassType | null) ?? null,
      element:   toLegacyElement(profile?.primaryElement ?? null),
      passives:  aggregatePassives(attrs, false),
    };
  } catch (err) {
    console.warn('[usePvPBattleEngine] side data load failed:', err);
    return { classType: null, element: null, passives: null };
  }
}

/**
 * Like useBattleEngine but for PvP: no auto-triggered enemy turns.
 * The caller is responsible for calling applyEnemyAction() when the
 * opponent broadcasts their chosen ability.
 *
 * Onda 11.3: studentId no `player` E no `enemy` (BattleCharacter.studentId
 * existe em ambos os lados em PvP) habilita afinidade/passivas dos dois.
 */
export function usePvPBattleEngine() {
  const engineRef = useRef<BattleEngine | null>(null);
  const [ctx, setCtx] = useState<BattleContext | null>(null);

  const startBattle = useCallback(
    async (
      player: BattleCharacter,
      enemy: BattleEnemy,
      equippedAbilities: Ability[],
      /** Onda 11.3 — opcional para preservar callers legacy; quando undefined, PvP usa só passivas do lado do `player`. */
      opponentStudentId?: string | null,
    ) => {
      const [pSide, eSide] = await Promise.all([
        loadSide(player.studentId),
        loadSide(opponentStudentId ?? null),
      ]);
      // Onda 11.3 — no PvP, sobrescreve o elementType "Fire" hardcoded em
      // charToEnemy() pelo elemento primário real do oponente, quando conhecido.
      // Isso ativa a tabela de efetividade entre os dois alunos (item do prompt).
      const enemyWithElement: BattleEnemy = eSide.element
        ? { ...enemy, elementType: eSide.element }
        : enemy;
      const engine = new BattleEngine(
        player, enemyWithElement, equippedAbilities,
        null, // equippedItem
        [],   // activeBuffs
        undefined, // raidPhase
        pSide.classType, pSide.element, pSide.passives,
        eSide.classType, eSide.passives,
      );
      engineRef.current = engine;
      const initial = engine.start();
      setCtx(initial);
      return initial;
    },
    [],
  );

  const playerAttack = useCallback((abilityId: string) => {
    if (!engineRef.current) return;
    const result = engineRef.current.playerAttack(abilityId);
    setCtx(result);
    // No auto-enemy-turn — opponent broadcasts their action via realtime
  }, []);

  const applyEnemyAction = useCallback((abilityId: string) => {
    if (!engineRef.current) return;
    const result = engineRef.current.enemyAttackWith(abilityId);
    setCtx(result);
  }, []);

  const useItem = useCallback((effect: ItemEffect, value: number, abilityId?: string) => {
    if (!engineRef.current) return;
    const result = engineRef.current.useItem(effect, value, abilityId);
    setCtx(result);
    // No auto-enemy-turn in PvP
  }, []);

  const flee = useCallback(() => {
    if (!engineRef.current) return;
    const result = engineRef.current.flee();
    setCtx(result);
  }, []);

  const reset = useCallback(() => {
    engineRef.current = null;
    setCtx(null);
  }, []);

  return { ctx, isActive: !!ctx, startBattle, playerAttack, applyEnemyAction, useItem, flee, reset };
}

export type PvPBattleEngineControls = ReturnType<typeof usePvPBattleEngine>;
