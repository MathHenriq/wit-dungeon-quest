import { useState, useCallback, useRef } from 'react';
import { BattleEngine, type BattleContext, type BattleEnemy, type ItemEffect } from '@/lib/battle';
import type { BattleCharacter, Ability } from '@/types/character';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBattleEngine() {
  const engineRef = useRef<BattleEngine | null>(null);
  const [ctx, setCtx] = useState<BattleContext | null>(null);

  // ── Init ───────────────────────────────────────────────────────────────────
  const startBattle = useCallback(
    (player: BattleCharacter, enemy: BattleEnemy, equippedAbilities: Ability[]) => {
      const engine = new BattleEngine(player, enemy, equippedAbilities);
      engineRef.current = engine;
      const initial = engine.start();
      setCtx(initial);

      // If enemy is faster, auto-trigger its first turn
      if (initial.phase === 'ENEMY_TURN') {
        setTimeout(() => {
          if (!engineRef.current) return;
          const afterEnemy = engineRef.current.enemyTurn();
          setCtx(afterEnemy);
        }, 1200);
      }

      return initial;
    },
    [],
  );

  // ── Player actions ─────────────────────────────────────────────────────────
  const playerAttack = useCallback((abilityId: string) => {
    if (!engineRef.current) return;
    const result = engineRef.current.playerAttack(abilityId);
    setCtx(result);

    // Auto-trigger enemy turn after short delay (for animation)
    if (result.phase === 'ENEMY_TURN') {
      setTimeout(() => {
        if (!engineRef.current) return;
        const afterEnemy = engineRef.current.enemyTurn();
        setCtx(afterEnemy);
      }, 1200);
    }
  }, []);

  const useItem = useCallback((effect: ItemEffect, value: number) => {
    if (!engineRef.current) return;
    const result = engineRef.current.useItem(effect, value);
    setCtx(result);

    if (result.phase === 'ENEMY_TURN') {
      setTimeout(() => {
        if (!engineRef.current) return;
        const afterEnemy = engineRef.current.enemyTurn();
        setCtx(afterEnemy);
      }, 1200);
    }
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

  return {
    ctx,
    isActive: !!ctx,
    startBattle,
    playerAttack,
    useItem,
    flee,
    reset,
  };
}
