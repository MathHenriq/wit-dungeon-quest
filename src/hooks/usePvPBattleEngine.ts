import { useState, useCallback, useRef } from 'react';
import { BattleEngine, type BattleContext, type BattleEnemy, type ItemEffect } from '@/lib/battle';
import type { BattleCharacter, Ability } from '@/types/character';

/**
 * Like useBattleEngine but for PvP: no auto-triggered enemy turns.
 * The caller is responsible for calling applyEnemyAction() when the
 * opponent broadcasts their chosen ability.
 */
export function usePvPBattleEngine() {
  const engineRef = useRef<BattleEngine | null>(null);
  const [ctx, setCtx] = useState<BattleContext | null>(null);

  const startBattle = useCallback(
    (player: BattleCharacter, enemy: BattleEnemy, equippedAbilities: Ability[]) => {
      const engine = new BattleEngine(player, enemy, equippedAbilities);
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
