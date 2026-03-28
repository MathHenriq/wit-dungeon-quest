import { useQuery } from '@tanstack/react-query';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import type { BattleCharacter } from '@/types/character';

function rowToCharacter(row: any): BattleCharacter {
  return {
    id:           row.id,
    userId:       row.user_id,
    name:         row.name         ?? 'Aventureiro',
    class:        row.class        ?? 'Guerreiro',
    level:        row.level        ?? 1,
    xp:           row.xp           ?? 0,
    hpCurrent:    row.hp_current   ?? 100,
    hpMax:        row.hp_max       ?? 100,
    energyMax:    row.energy_max   ?? 100,
    forca:        row.forca        ?? 10,
    inteligencia: row.inteligencia ?? 10,
    destreza:     row.destreza     ?? 10,
    carisma:      row.carisma      ?? 10,
    agilidade:    row.agilidade    ?? 10,
    resistencia:  row.resistencia  ?? 10,
    ptsFire:      row.pts_fire     ?? 0,
    ptsWater:     row.pts_water    ?? 0,
    ptsElectric:  row.pts_electric ?? 0,
    ptsGrass:     row.pts_grass    ?? 0,
    ptsIce:       row.pts_ice      ?? 0,
    ptsGround:    row.pts_ground   ?? 0,
    ptsFighting:  row.pts_fighting ?? 0,
    ptsSteel:     row.pts_steel    ?? 0,
    ptsPoison:    row.pts_poison   ?? 0,
    ptsDark:      row.pts_dark     ?? 0,
    ptsGhost:     row.pts_ghost    ?? 0,
    ptsFlying:    row.pts_flying   ?? 0,
    freePoints:   row.free_points  ?? 0,
    spriteNormal:      row.sprite_normal       ?? null,
    spritePixelFront:  row.sprite_pixel_front  ?? null,
    spritePixelBack:   row.sprite_pixel_back   ?? null,
    spritePixelAttack: row.sprite_pixel_attack ?? null,
  };
}

/**
 * Fetches (or auto-creates) the battle character for the authenticated student.
 * Uses supabaseStudent so the student's auth token is used.
 */
export function useBattleCharacter(userId: string | undefined) {
  return useQuery({
    queryKey: ['battle-character', userId],
    enabled:  !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<BattleCharacter | null> => {
      // 1. Try to find existing character
      const { data, error } = await supabaseStudent
        .from('characters')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();

      if (error) throw error;
      if (data) return rowToCharacter(data);

      // 2. Auto-create if none exists
      const { data: newChar, error: createError } = await supabaseStudent
        .from('characters')
        .insert({
          user_id:      userId!,
          name:         'Aventureiro',
          class:        'Guerreiro',
          level:        1,
          xp:           0,
          hp_current:   100,
          hp_max:       100,
          energy_max:   100,
          forca:        10,
          inteligencia: 10,
          destreza:     10,
          carisma:      10,
          agilidade:    10,
          resistencia:  10,
          free_points:  0,
          coins:        0,
          diamonds:     0,
        })
        .select()
        .single();

      if (createError) throw createError;
      return rowToCharacter(newChar);
    },
  });
}
