import { useState, useCallback, useRef } from 'react';
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBattleEngine() {
  const engineRef = useRef<BattleEngine | null>(null);
  const [ctx, setCtx] = useState<BattleContext | null>(null);
  const [consumables, setConsumables] = useState<Array<ConsumableInput & { quantity: number }>>([]);
  const buffsTickedRef = useRef(false);

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

  // ── Init ───────────────────────────────────────────────────────────────────
  const startBattle = useCallback(
    async (
      player: BattleCharacter,
      enemy: BattleEnemy,
      equippedAbilities: Ability[],
      equippedItem: ShopItem | null = null,
      raidPhase?: number,
    ) => {
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
      if (initial.phase === 'ENEMY_TURN') {
        setTimeout(() => {
          if (!engineRef.current) return;
          const afterEnemy = engineRef.current.enemyTurn();
          setCtx(afterEnemy);
          maybeTickOnEnd(afterEnemy);
        }, 2200);
      }

      return initial;
    },
    [maybeTickOnEnd],
  );

  // ── Player actions ─────────────────────────────────────────────────────────
  const playerAttack = useCallback((abilityId: string) => {
    if (!engineRef.current) return;
    const result = engineRef.current.playerAttack(abilityId);
    setCtx(result);
    maybeTickOnEnd(result);

    // Auto-trigger enemy turn after short delay (for animation)
    if (result.phase === 'ENEMY_TURN') {
      setTimeout(() => {
        if (!engineRef.current) return;
        const afterEnemy = engineRef.current.enemyTurn();
        setCtx(afterEnemy);
        maybeTickOnEnd(afterEnemy);
      }, 2200);
    }
  }, [maybeTickOnEnd]);

  const useItem = useCallback((effect: ItemEffect, value: number, abilityId?: string) => {
    if (!engineRef.current) return;
    const result = engineRef.current.useItem(effect, value, abilityId);
    setCtx(result);
    maybeTickOnEnd(result);

    if (result.phase === 'ENEMY_TURN') {
      setTimeout(() => {
        if (!engineRef.current) return;
        const afterEnemy = engineRef.current.enemyTurn();
        setCtx(afterEnemy);
        maybeTickOnEnd(afterEnemy);
      }, 2200);
    }
  }, [maybeTickOnEnd]);

  const useEquipmentAbility = useCallback(async () => {
    if (!engineRef.current) return;
    const result = await engineRef.current.useEquipmentAbility();
    setCtx(result);
    maybeTickOnEnd(result);

    if (result.phase === 'ENEMY_TURN') {
      setTimeout(() => {
        if (!engineRef.current) return;
        const afterEnemy = engineRef.current.enemyTurn();
        setCtx(afterEnemy);
        maybeTickOnEnd(afterEnemy);
      }, 2200);
    }
  }, [maybeTickOnEnd]);

  const useConsumable = useCallback(async (cKey: string, abilityId?: string) => {
    if (!engineRef.current) return;
    const stock = consumables.find(c => c.key === cKey);
    if (!stock || stock.quantity <= 0) return;

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

      if (result.phase === 'ENEMY_TURN') {
        setTimeout(() => {
          if (!engineRef.current) return;
          const afterEnemy = engineRef.current.enemyTurn();
          setCtx(afterEnemy);
          maybeTickOnEnd(afterEnemy);
        }, 2200);
      }
    } catch (err) {
      console.warn('[useBattleEngine] useConsumable error:', err);
    }
  }, [consumables, maybeTickOnEnd]);

  const flee = useCallback(() => {
    if (!engineRef.current) return;
    const result = engineRef.current.flee();
    setCtx(result);
    maybeTickOnEnd(result);
  }, [maybeTickOnEnd]);

  const reset = useCallback(() => {
    engineRef.current = null;
    setCtx(null);
  }, []);

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
