import { useQuery } from '@tanstack/react-query';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import type { BattleCharacter } from '@/types/character';
import { getPointsForLevelUp, getTotalXPForLevel } from '@/lib/progression/xpCalculator';

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

// ─── Stat scaling helpers ─────────────────────────────────────────────────────

/** hp_max = 100 + 10 per level above 1  (lv1→100, lv5→140, lv10→190) */
function hpMaxAtLevel(level: number): number {
  return 100 + Math.max(0, level - 1) * 10;
}

/** energy_max = 100 + 5 per level above 1  (lv1→100, lv5→120, lv10→145) */
function energyMaxAtLevel(level: number): number {
  return 100 + Math.max(0, level - 1) * 5;
}

/** Base attribute (forca/int/etc.) = 10 + 1 per level above 1 */
function baseStatAtLevel(current: number, levelsGained: number): number {
  return current + levelsGained;
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
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnReconnect: false,
    queryFn: async (): Promise<BattleCharacter | null> => {
      // 1. Fetch student academic level (source of truth for level sync)
      const { data: studentRow } = await supabaseStudent
        .from('students')
        .select('level')
        .eq('user_id', userId!)
        .maybeSingle();
      const academicLevel = studentRow?.level ?? 1;

      // 2. Try to find existing character
      const { data, error } = await supabaseStudent
        .from('characters')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Sync level up if student academic level is higher than battle level
        if (academicLevel > (data.level ?? 1)) {
          const levelsGained = academicLevel - (data.level ?? 1);
          const bonuses      = getPointsForLevelUp(levelsGained);

          // Compute every updated value so the returned object is accurate —
          // returning { ...data, level } was wrong because data still carried old stats.
          const newForca        = baseStatAtLevel(data.forca        ?? 10, bonuses.attributePoints);
          const newInteligencia = baseStatAtLevel(data.inteligencia ?? 10, bonuses.attributePoints);
          const newDestreza     = baseStatAtLevel(data.destreza     ?? 10, bonuses.attributePoints);
          const newCarisma      = baseStatAtLevel(data.carisma      ?? 10, bonuses.attributePoints);
          const newAgilidade    = baseStatAtLevel(data.agilidade    ?? 10, bonuses.attributePoints);
          const newResistencia  = baseStatAtLevel(data.resistencia  ?? 10, bonuses.attributePoints);
          const newHpMax        = Math.max(hpMaxAtLevel(academicLevel), data.hp_max ?? 100);
          const newEnergyMax    = Math.max(energyMaxAtLevel(academicLevel), data.energy_max ?? 100);
          const newFreePoints   = (data.free_points ?? 0) + bonuses.freePoints;
          // Ensure xp is cumulative base for the new level
          const newXp           = Math.max(data.xp ?? 0, getTotalXPForLevel(academicLevel));

          await supabaseStudent
            .from('characters')
            .update({
              level:         academicLevel,
              xp:            newXp,
              free_points:   newFreePoints,
              forca:         newForca,
              inteligencia:  newInteligencia,
              destreza:      newDestreza,
              carisma:       newCarisma,
              agilidade:     newAgilidade,
              resistencia:   newResistencia,
              hp_max:        newHpMax,
              hp_current:    newHpMax,    // full HP on level-up
              energy_max:    newEnergyMax,
              updated_at:    new Date().toISOString(),
            })
            .eq('id', data.id);

          return rowToCharacter({
            ...data,
            level:        academicLevel,
            xp:           newXp,
            free_points:  newFreePoints,
            forca:        newForca,
            inteligencia: newInteligencia,
            destreza:     newDestreza,
            carisma:      newCarisma,
            agilidade:    newAgilidade,
            resistencia:  newResistencia,
            hp_max:       newHpMax,
            hp_current:   newHpMax,
            energy_max:   newEnergyMax,
          });
        }

        // Sync students.level UP when character has advanced beyond academic level via battle XP
        const characterLevel = data.level ?? 1;
        if (characterLevel > academicLevel) {
          await supabaseStudent
            .from('students')
            .update({ level: characterLevel })
            .eq('user_id', userId!);
        }

        return rowToCharacter(data);
      }

      // 3. Auto-create — apply correct scaled stats from the start so a student
      //    whose teacher already advanced them to level 5 doesn't start with lv1 stats.
      const levelsAboveOne  = Math.max(0, academicLevel - 1);
      const startStat       = 10 + levelsAboveOne;          // +1 per level
      const startHpMax      = hpMaxAtLevel(academicLevel);
      const startEnergyMax  = energyMaxAtLevel(academicLevel);
      const startFreePoints = levelsAboveOne * 3;            // same as getPointsForLevelUp

      const { data: newChar, error: createError } = await supabaseStudent
        .from('characters')
        .insert({
          user_id:      userId!,
          name:         'Aventureiro',
          class:        'Guerreiro',
          level:        academicLevel,
          xp:           getTotalXPForLevel(academicLevel),
          hp_current:   startHpMax,
          hp_max:       startHpMax,
          energy_max:   startEnergyMax,
          forca:        startStat,
          inteligencia: startStat,
          destreza:     startStat,
          carisma:      startStat,
          agilidade:    startStat,
          resistencia:  startStat,
          free_points:  startFreePoints,
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
