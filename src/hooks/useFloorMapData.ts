/**
 * Phase-4 Supabase hook for the FloorMap system.
 *
 * Loads:
 *  - Full floor record (name, theme, background_url, ...)
 *  - All enemies for the floor with their map positions
 *  - Which enemies this character has already defeated
 *
 * Returns FloorMapEnemy[] with `defeated` already resolved.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase }         from '@/integrations/supabase/client';
import { supabaseStudent }  from '@/integrations/supabase/studentClient';
import type { FloorData, FloorMapEnemy, FloorTheme } from '@/components/floor-map';
import type { ElementType } from '@/types/character';

// ─── useFloorMapEnemies ───────────────────────────────────────────────────────

/**
 * Returns enemies for a floor with positions and defeat state merged in.
 * Falls back to evenly-distributed positions when position_x/y are still 50
 * (i.e. the teacher hasn't set them yet via the migration default).
 */
export function useFloorMapEnemies(
  floorId:     string | null,
  characterId: string | null,
) {
  const enemiesQuery = useQuery({
    queryKey: ['floor-map-enemies', floorId],
    enabled:  !!floorId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<FloorMapEnemy[]> => {
      const { data, error } = await supabase
        .from('enemies')
        .select('*')
        .eq('floor_id', floorId!)
        .order('is_boss', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((r: any, idx: number): FloorMapEnemy => ({
        id:          r.id,
        positionX:   r.position_x ?? defaultX(idx, data.length),
        positionY:   r.position_y ?? defaultY(idx, data.length, r.is_boss),
        defeated:    false,
        isBoss:      r.is_boss   ?? false,
        name:        r.name,
        level:       r.level,
        iconType:    r.icon_type ?? 'skull',
        hpMax:       r.hp_max,
        defFisica:   r.def_fisica,
        defMagica:   r.def_magica,
        velocidade:  r.velocidade,
        elementType: r.element_type as ElementType,
        elementTypeSecondary: (r.element_type_secondary ?? null) as ElementType | null,
        ability1:    r.ability_1 ?? null,
        ability2:    r.ability_2 ?? null,
        ability3:    r.ability_3 ?? null,
        ability4:    r.ability_4 ?? null,
        specialAbilityName:   r.special_ability_name   ?? null,
        specialAbilityEffect: r.special_ability_effect ?? null,
        specialTrigger:       r.special_trigger        ?? null,
      }));
    },
  });

  const defeatsQuery = useQuery({
    queryKey: ['floor-enemy-defeats', characterId, floorId],
    enabled:  !!characterId && !!floorId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabaseStudent
        .from('floor_enemy_defeats')
        .select('enemy_id');
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.enemy_id));
    },
  });

  // Merge defeat state. If the floor is *fully* cleared (every enemy and the
  // boss already in floor_enemy_defeats), treat the entry as a replay and
  // reset the local defeat flags so the player can walk and fight again.
  // Partial progress (some enemies defeated, boss alive) is preserved.
  const merged: FloorMapEnemy[] = (enemiesQuery.data ?? []).map(e => ({
    ...e,
    defeated: defeatsQuery.data?.has(e.id) ?? false,
  }));
  const allCleared = merged.length > 0 && merged.every(e => e.defeated);
  const enemies: FloorMapEnemy[] = allCleared
    ? merged.map(e => ({ ...e, defeated: false }))
    : merged;

  return {
    enemies,
    isLoading: enemiesQuery.isLoading || defeatsQuery.isLoading,
    error:     enemiesQuery.error || defeatsQuery.error,
  };
}

// ─── useRecordFloorEnemyDefeat ────────────────────────────────────────────────

export function useRecordFloorEnemyDefeat(characterId: string | null, floorId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ enemyId, isBoss }: { enemyId: string; isBoss: boolean }) => {
      if (!characterId) throw new Error('No character ID');

      // Record individual defeat
      await supabaseStudent
        .from('floor_enemy_defeats')
        .upsert({ character_id: characterId, enemy_id: enemyId });

      // Also update the aggregate progress row.
      // character_progress PK is (character_id, floor_id) — there is no
      // `id` column. Earlier `.eq('id', existing.id)` calls silently
      // matched nothing. UPSERT on the composite key fixes it.
      const { data: existing } = await supabaseStudent
        .from('character_progress')
        .select('enemies_defeated, boss_defeated, completed_at')
        .eq('character_id', characterId)
        .eq('floor_id', floorId!)
        .maybeSingle();

      const nowIso         = new Date().toISOString();
      const prevDefeated   = existing?.enemies_defeated ?? 0;
      const prevBoss       = existing?.boss_defeated    ?? false;
      const newEnemies     = isBoss ? prevDefeated : prevDefeated + 1;
      const newBoss        = isBoss || prevBoss;
      const newCompletedAt = isBoss && !prevBoss
        ? nowIso
        : existing?.completed_at ?? null;

      await supabaseStudent.from('character_progress').upsert({
        character_id:     characterId,
        floor_id:         floorId!,
        enemies_defeated: newEnemies,
        boss_defeated:    newBoss,
        completed_at:     newCompletedAt,
      }, { onConflict: 'character_id,floor_id' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['floor-enemy-defeats', characterId, floorId] });
      qc.invalidateQueries({ queryKey: ['floor_progress', characterId] });
    },
  });
}

// ─── Fallback position helpers ────────────────────────────────────────────────

/** Distribute enemies in a rough grid when positions haven't been set. */
function defaultX(index: number, total: number): number {
  const cols = Math.ceil(Math.sqrt(total));
  return 15 + ((index % cols) / Math.max(cols - 1, 1)) * 70;
}

function defaultY(index: number, total: number, isBoss: boolean): number {
  if (isBoss) return 82;
  const cols = Math.ceil(Math.sqrt(total - 1)); // exclude boss
  const row  = Math.floor(index / cols);
  const rows = Math.ceil((total - 1) / cols);
  return 18 + (row / Math.max(rows - 1, 1)) * 55;
}
