import { ENEMY_SPRITES } from './enemySpriteList';

const BASE_PATH = '/assets/sprites/All/';

/**
 * Deterministically picks a sprite URL for an enemy based on its ID.
 * Using a hash ensures the same enemy always shows the same sprite
 * across sessions — no flickering on re-render.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i);
    hash |= 0; // convert to 32-bit int
  }
  return Math.abs(hash);
}

export function getEnemySpriteUrl(enemyId: string): string {
  const index = hashString(enemyId) % ENEMY_SPRITES.length;
  return BASE_PATH + ENEMY_SPRITES[index];
}

/** Fallback sprite used when nothing else resolves */
export const FALLBACK_SPRITE_URL = BASE_PATH + ENEMY_SPRITES[0];
