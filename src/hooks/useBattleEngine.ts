import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BattleEngine,
  type BattleContext, type BattleEnemy, type ItemEffect,
  type ActiveBuffInput, type ConsumableInput,
} from '@/lib/battle';
import type { BattleCharacter, Ability, ElementType } from '@/types/character';
import type { ShopItem } from '@/types';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
// Onda 11.3 — carrega class profile, atributos e passivas agregadas.
import { getClassProfile, getStudentAttributes } from '@/lib/skills/api';
import { aggregatePassives, type PassiveEffectAggregation } from '@/lib/skills/evolutionsRegistry';
import type { ClassType } from '@/lib/skills/skillsRegistry';
import { toLegacyElement } from '@/lib/battle/elementBridge';

async function loadWave11PlayerData(studentId: string | null | undefined, isInRaid: boolean): Promise<{
  playerClass:    ClassType | null;
  playerElement:  ElementType | null;
  playerPassives: PassiveEffectAggregation | null;
}> {
  if (!studentId) return { playerClass: null, playerElement: null, playerPassives: null };
  try {
    const [profile, attrs] = await Promise.all([
      getClassProfile(studentId),
      getStudentAttributes(studentId),
    ]);
    const passives = aggregatePassives(attrs, isInRaid);
    return {
      playerClass:    (profile?.classType as ClassType | null) ?? null,
      playerElement:  toLegacyElement(profile?.primaryElement ?? null),
      playerPassives: passives,
    };
  } catch (err) {
    console.warn('[useBattleEngine] wave11 player data load failed:', err);
    return { playerClass: null, playerElement: null, playerPassives: null };
  }
}

interface ForgeStateRpc {
  active_buffs?: Array<{ key: string; name: string; effect?: string; effect_value?: number; battles_left: number }>;
  consumables?:  Array<{ key: string; name: string; icon?: string; quantity: number; effect?: string; effect_value?: number }>;
}

/** Fetch forge state and resolve buff effect/value (the RPC returns names only, so we
 *  enrich by reading temporary_buffs/consumables in a single query each). */
async function loadForgeBattleData(): Promise<{
  buffs: ActiveBuffInput[];
  consumables: Array<ConsumableInput & { quantity: number }>;
}> {
  try {
    const { data: state } = await supabaseStudent.rpc('get_my_forge_state');
    const s = (state ?? {}) as ForgeStateRpc;
    const buffKeys = (s.active_buffs ?? []).map(b => b.key);
    const consKeys = (s.consumables  ?? []).map(c => c.key);

    const [{ data: buffRows }, { data: consRows }] = await Promise.all([
      buffKeys.length
        ? supabaseStudent.from('temporary_buffs').select('key,effect,effect_value,name').in('key', buffKeys)
        : Promise.resolve({ data: [] as Array<{ key: string; effect: string; effect_value: number; name: string }> }),
      consKeys.length
        ? supabaseStudent.from('consumables').select('key,effect,effect_value,name,icon').in('key', consKeys)
        : Promise.resolve({ data: [] as Array<{ key: string; effect: string; effect_value: number; name: string; icon: string }> }),
    ]);

    const buffMap = new Map((buffRows ?? []).map(r => [r.key, r]));
    const consMap = new Map((consRows ?? []).map(r => [r.key, r]));

    const buffs: ActiveBuffInput[] = (s.active_buffs ?? [])
      .map(b => {
        const meta = buffMap.get(b.key);
        if (!meta) return null;
        return {
          effect:       meta.effect as ActiveBuffInput['effect'],
          effect_value: Number(meta.effect_value),
          name:         meta.name ?? b.name,
        };
      })
      .filter((x): x is ActiveBuffInput => x !== null);

    const consumables = (s.consumables ?? [])
      .map(c => {
        const meta = consMap.get(c.key);
        if (!meta) return null;
        return {
          key:          meta.key,
          name:         meta.name,
          effect:       meta.effect as ConsumableInput['effect'],
          effect_value: Number(meta.effect_value),
          icon:         meta.icon,
          quantity:     c.quantity,
        };
      })
      .filter((x): x is ConsumableInput & { quantity: number } => x !== null);

    return { buffs, consumables };
  } catch (err) {
    console.warn('[useBattleEngine] forge state load failed:', err);
    return { buffs: [], consumables: [] };
  }
}

/** Delay before the enemy replies, so the player's attack animation can land. */
const ENEMY_TURN_DELAY_MS = 2200;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBattleEngine() {
  const engineRef = useRef<BattleEngine | null>(null);
  const [ctx, setCtx] = useState<BattleContext | null>(null);
  const [consumables, setConsumables] = useState<Array<ConsumableInput & { quantity: number }>>([]);
  const buffsTickedRef = useRef(false);
  /** Timer id for the pending enemy turn, so we can cancel and de-duplicate it. */
  const enemyTurnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True once the hook unmounts — stops late timers from touching React state. */
  const unmountedRef = useRef(false);

  const cancelPendingEnemyTurn = useCallback(() => {
    if (enemyTurnTimerRef.current !== null) {
      clearTimeout(enemyTurnTimerRef.current);
      enemyTurnTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (enemyTurnTimerRef.current !== null) clearTimeout(enemyTurnTimerRef.current);
      enemyTurnTimerRef.current = null;
    };
  }, []);

  const tickActiveBuffs = useCallback(async () => {
    if (buffsTickedRef.current) return;
    buffsTickedRef.current = true;
    try {
      await supabaseStudent.rpc('tick_my_active_buffs');
    } catch (err) {
      console.warn('[useBattleEngine] tick_my_active_buffs failed:', err);
    }
  }, []);

  const maybeTickOnEnd = useCallback((next: BattleContext) => {
    if (next.phase === 'VICTORY' || next.phase === 'DEFEAT' || next.phase === 'FLED') {
      void tickActiveBuffs();
    }
  }, [tickActiveBuffs]);

  /**
   * Queue the enemy's reply after the attack animation.
   *
   * Every action used to inline its own `setTimeout`, which caused two bugs:
   * a double-tap on Atacar ran the engine twice — the second call no-ops and
   * returns a snapshot still in ENEMY_TURN, so a *second* timer was armed and
   * the enemy got two turns — and no timer was ever cleared, so a battle left
   * mid-animation fired its enemy turn into whatever battle came next.
   *
   * One timer at a time, bound to the engine that armed it.
   */
  const scheduleEnemyTurn = useCallback((result: BattleContext) => {
    if (result.phase !== 'ENEMY_TURN') return;
    if (enemyTurnTimerRef.current !== null) return; // already queued — ignore the double tap
    const engineAtSchedule = engineRef.current;
    enemyTurnTimerRef.current = setTimeout(() => {
      enemyTurnTimerRef.current = null;
      if (unmountedRef.current) return;
      // A new battle may have replaced the engine while this timer was pending.
      if (!engineRef.current || engineRef.current !== engineAtSchedule) return;
      const afterEnemy = engineRef.current.enemyTurn();
      setCtx(afterEnemy);
      maybeTickOnEnd(afterEnemy);
    }, ENEMY_TURN_DELAY_MS);
  }, [maybeTickOnEnd]);

  // ── Init ───────────────────────────────────────────────────────────────────
  const startBattle = useCallback(
    async (
      player: BattleCharacter,
      enemy: BattleEnemy,
      equippedAbilities: Ability[],
      equippedItem: ShopItem | null = null,
      raidPhase?: number,
    ) => {
      // A battle abandoned mid-animation can still have an enemy turn queued.
      cancelPendingEnemyTurn();
      buffsTickedRef.current = false;
      const isInRaid = typeof raidPhase === 'number';
      const [{ buffs, consumables: cons }, wave11] = await Promise.all([
        loadForgeBattleData(),
        loadWave11PlayerData(player.studentId, isInRaid),
      ]);
      setConsumables(cons);
      const engine = new BattleEngine(
        player, enemy, equippedAbilities, equippedItem, buffs, raidPhase,
        wave11.playerClass, wave11.playerElement, wave11.playerPassives,
        null, null, // PvE: no enemy class/passives
      );
      engineRef.current = engine;
      const initial = engine.start();
      setCtx(initial);

      // If enemy is faster, auto-trigger its first turn
      scheduleEnemyTurn(initial);

      return initial;
    },
    [cancelPendingEnemyTurn, scheduleEnemyTurn],
  );

  // ── Player actions ─────────────────────────────────────────────────────────
  const playerAttack = useCallback((abilityId: string) => {
    if (!engineRef.current) return;
    const result = engineRef.current.playerAttack(abilityId);
    setCtx(result);
    maybeTickOnEnd(result);

    // Auto-trigger enemy turn after short delay (for animation)
    scheduleEnemyTurn(result);
  }, [maybeTickOnEnd, scheduleEnemyTurn]);

  const useItem = useCallback((effect: ItemEffect, value: number, abilityId?: string) => {
    if (!engineRef.current) return;
    const result = engineRef.current.useItem(effect, value, abilityId);
    setCtx(result);
    maybeTickOnEnd(result);

    scheduleEnemyTurn(result);
  }, [maybeTickOnEnd, scheduleEnemyTurn]);

  const useEquipmentAbility = useCallback(async () => {
    if (!engineRef.current) return;
    const result = await engineRef.current.useEquipmentAbility();
    setCtx(result);
    maybeTickOnEnd(result);

    scheduleEnemyTurn(result);
  }, [maybeTickOnEnd, scheduleEnemyTurn]);

  const useConsumable = useCallback(async (cKey: string, abilityId?: string) => {
    if (!engineRef.current) return;
    const stock = consumables.find(c => c.key === cKey);
    if (!stock || stock.quantity <= 0) return;
    // The engine ignores actions outside PLAYER_TURN, but the RPC below has
    // already spent the item by then — check first so nothing is lost.
    if (engineRef.current.getContext().phase !== 'PLAYER_TURN') return;

    try {
      const { data, error } = await supabaseStudent.rpc('consume_my_consumable', { p_consumable_key: cKey });
      if (error) {
        console.warn('[useBattleEngine] consume_my_consumable failed:', error);
        return;
      }
      const res = data as { success: boolean; remaining?: number; consumable?: ConsumableInput };
      if (!res?.success || !res.consumable) return;

      setConsumables(prev =>
        prev
          .map(c => (c.key === cKey ? { ...c, quantity: res.remaining ?? 0 } : c))
          .filter(c => c.quantity > 0),
      );

      const result = engineRef.current.useConsumable(res.consumable, abilityId);
      setCtx(result);
      maybeTickOnEnd(result);

      scheduleEnemyTurn(result);
    } catch (err) {
      console.warn('[useBattleEngine] useConsumable error:', err);
    }
  }, [consumables, maybeTickOnEnd, scheduleEnemyTurn]);

  const flee = useCallback(() => {
    if (!engineRef.current) return;
    cancelPendingEnemyTurn();
    const result = engineRef.current.flee();
    setCtx(result);
    maybeTickOnEnd(result);
  }, [cancelPendingEnemyTurn, maybeTickOnEnd]);

  const reset = useCallback(() => {
    cancelPendingEnemyTurn();
    engineRef.current = null;
    setCtx(null);
  }, [cancelPendingEnemyTurn]);

  return {
    ctx,
    isActive: !!ctx,
    consumables,
    startBattle,
    playerAttack,
    useItem,
    useEquipmentAbility,
    useConsumable,
    flee,
    reset,
  };
}
