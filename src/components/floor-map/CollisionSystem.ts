/** Radius in pixels at which the player triggers a battle. */
export const COLLISION_RADIUS_PX = 48;

export interface MapEnemy {
  id: string;
  positionX: number; // 0–100 (percentage of map width)
  positionY: number; // 0–100 (percentage of map height)
  defeated: boolean;
  isBoss: boolean;
}

function pxX(pct: number, mapW: number) { return (pct / 100) * mapW; }
function pxY(pct: number, mapH: number) { return (pct / 100) * mapH; }

/**
 * Sample N points along the straight path from (fromX,fromY) to (toX,toY)
 * and return the first enemy collision found, along with the stopping point
 * (the step just before the collision radius is crossed).
 */
export function checkPathForCollisions(
  fromX: number, fromY: number,
  toX:   number, toY:   number,
  enemies: MapEnemy[],
  mapW: number, mapH: number,
  steps = 28,
): { id: string; stopX: number; stopY: number } | null {
  const allNormalDefeated = enemies
    .filter(e => !e.isBoss)
    .every(e => e.defeated);

  for (let i = 1; i <= steps; i++) {
    const t  = i / steps;
    const cx = fromX + (toX - fromX) * t;
    const cy = fromY + (toY - fromY) * t;
    const cpx = pxX(cx, mapW);
    const cpy = pxY(cy, mapH);

    for (const e of enemies) {
      if (e.defeated) continue;
      if (e.isBoss && !allNormalDefeated) continue;

      const ex  = pxX(e.positionX, mapW);
      const ey  = pxY(e.positionY, mapH);
      const dist = Math.hypot(cpx - ex, cpy - ey);

      if (dist < COLLISION_RADIUS_PX) {
        const prevT  = Math.max(0, (i - 1) / steps);
        return {
          id:    e.id,
          stopX: fromX + (toX - fromX) * prevT,
          stopY: fromY + (toY - fromY) * prevT,
        };
      }
    }
  }
  return null;
}

/** True when every non-boss enemy is defeated. */
export function isBossUnlocked(enemies: MapEnemy[]): boolean {
  return enemies.filter(e => !e.isBoss).every(e => e.defeated);
}

/** Defeated count vs total (bosses excluded from count). */
export function getProgress(enemies: MapEnemy[]): { defeated: number; total: number } {
  const normal = enemies.filter(e => !e.isBoss);
  return { defeated: normal.filter(e => e.defeated).length, total: normal.length };
}
