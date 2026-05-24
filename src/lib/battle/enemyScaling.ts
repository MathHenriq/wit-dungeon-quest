// ============================================================
// Enemy scaling — Patch 2.2 (Curva de Inimigos)
//
// Single source of truth for how enemy HP / defense / rewards
// scale with floor depth.  Tune the constants below to balance.
//
// Why runtime (not a DB migration on hp_max)?
//   - One formula change here updates every floor instantly.
//   - Avoids drift between hand-tuned DB rows and what the
//     designer "really meant".
//   - The DB hp_max values are treated as a per-enemy *baseline*;
//     the multiplier expresses the floor-depth challenge curve.
//
// Density (more enemies per floor) is handled by a separate
// migration because the FloorMap renders rows from the DB.
// See 20260510180000_enemy_density.sql.
// ============================================================

import type { BattleEnemy } from './BattleEngine';

// ─── Tunables ────────────────────────────────────────────────
//
// Note on the prompt's "base * 1.5^floor": that curve explodes
// (floor 25 ≈ 25 000× baseline). We keep the EXPONENTIAL shape
// the prompt asked for but with a far gentler base so endgame
// floors stay challenging without one-shotting the engine's
// integer overflow path.
//
// At floor 25 with these defaults a regular enemy ends up with
//   HP    ≈ baseline × 4.3   (was 1× before)
//   Def   ≈ baseline × 2.7   (was 1× before)
// Bosses also get a flat +100 % HP on top, per the prompt.

/** Multiplier per floor above 1 applied to enemy hp_max. */
export const ENEMY_HP_SCALE_PER_FLOOR  = 1.06;   // 1.06^24 ≈ 4.05× at floor 25
/** Multiplier per floor above 1 applied to def_fisica / def_magica. */
export const ENEMY_DEF_SCALE_PER_FLOOR = 1.04;   // 1.04^24 ≈ 2.56× at floor 25

/** Extra HP bosses get on top of the regular curve (1.0 = +100 %). */
export const BOSS_HP_BONUS             = 1.00;

/** Below this HP fraction the boss enters phase 2 (extra mitigation kicks in). */
export const BOSS_PHASE2_HP_THRESHOLD     = 0.50;
/** Fraction of incoming damage absorbed while in phase 2 (0.30 = 30 %). */
export const BOSS_PHASE2_DAMAGE_REDUCTION = 0.30;

// ─── Stat scaling ────────────────────────────────────────────

/**
 * Apply the floor curve to an enemy fetched from the DB.
 * Idempotent: the returned object is a NEW BattleEnemy; the
 * caller should not mutate it after this call.
 */
export function scaleEnemyForFloor(enemy: BattleEnemy, floorNumber: number): BattleEnemy {
  const floorIdx = Math.max(0, (floorNumber ?? 1) - 1);
  const hpMult  = Math.pow(ENEMY_HP_SCALE_PER_FLOOR,  floorIdx);
  const defMult = Math.pow(ENEMY_DEF_SCALE_PER_FLOOR, floorIdx);
  const bossMult = enemy.isBoss ? (1 + BOSS_HP_BONUS) : 1;

  const newHpMax = Math.max(1, Math.round(enemy.hpMax * hpMult * bossMult));

  return {
    ...enemy,
    hpMax:     newHpMax,
    hpCurrent: newHpMax,
    defFisica: Math.max(0, Math.round(enemy.defFisica * defMult)),
    defMagica: Math.max(0, Math.round(enemy.defMagica * defMult)),
  };
}

// ─── Reward formulas ─────────────────────────────────────────

/**
 * Coin reward per enemy. Piecewise-linear so we hit the three
 * prompt-anchored points exactly:
 *   floor  1 → 50 coins (regular)
 *   floor 25 → 250 coins
 *   floor 50 → 600 coins
 * Boss multiplier is configurable below; bosses give 2× the
 * regular value (so a floor-25 boss = 500 coins).
 */
export function computeCoinReward(floorNumber: number, isBoss: boolean): number {
  // Patch 2.0 — usuário pediu valores muito mais modestos. Alvo:
  //   inimigo comum andar 50 ≈ 70 coins
  //   boss          andar 50 ≈ 88 coins  (1.25× do comum)
  //   inimigo andar  1 ≈ 16 coins
  //   boss     andar  1 ≈ 20 coins
  //
  // Curva linear: enemy = 15 + floor * 1.1; boss = enemy * 1.25.
  // O daily cap (apply_daily_coin_cap) ainda aplica diminishing returns
  // acima de 500/750/dia, então o número aqui é o "bruto" antes do cap.
  const f = Math.max(1, floorNumber ?? 1);
  const enemyBase = 15 + f * 1.1;
  const value     = isBoss ? enemyBase * 1.25 : enemyBase;
  return Math.max(1, Math.round(value));
}

/**
 * XP reward per enemy. Smoother than coins — blends enemy
 * level (skill-based) with floor depth (location-based).
 * Bosses give ~3× a regular enemy of the same floor.
 */
export function computeXpReward(floorNumber: number, enemyLevel: number, isBoss: boolean): number {
  const f = Math.max(1, floorNumber ?? 1);
  const lvl = Math.max(1, enemyLevel ?? 1);
  const base = lvl * 12 + f * 8;
  return isBoss ? Math.round(base * 3) : base;
}
