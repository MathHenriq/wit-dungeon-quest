import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string | null;
  requirementType: string;
  requirementValue: number;
  rewardCoins: number;
  rewardDiamonds: number;
  isSecret: boolean;
  isUnlocked?: boolean;
  progress?: number;
}

// Verifica conquistas de um tipo de evento e desbloqueia as que foram atingidas
export async function checkAchievements(
  characterId: string,
  eventType: string,
  eventValue: number
): Promise<Achievement[]> {
  const [{ data: available }, { data: already }] = await Promise.all([
    supabase
      .from('achievements')
      .select('*')
      .eq('requirement_type', eventType),
    supabase
      .from('character_achievements')
      .select('achievement_id')
      .eq('character_id', characterId)
  ]);

  if (!available?.length) return [];

  const unlockedSet = new Set(already?.map(a => a.achievement_id) ?? []);
  const newlyUnlocked: Achievement[] = [];

  for (const ach of available) {
    if (unlockedSet.has(ach.id)) continue;
    if (eventValue < ach.requirement_value) continue;

    // Desbloquear
    await supabase.from('character_achievements').insert({
      character_id:   characterId,
      achievement_id: ach.id,
      progress:       ach.requirement_value
    });

    // Dar recompensas
    if (ach.reward_coins > 0 || ach.reward_diamonds > 0) {
      const { data: char } = await supabase
        .from('characters')
        .select('coins, diamonds')
        .eq('id', characterId)
        .single();

      if (char) {
        await supabase
          .from('characters')
          .update({
            coins:    (char.coins    ?? 0) + (ach.reward_coins    ?? 0),
            diamonds: (char.diamonds ?? 0) + (ach.reward_diamonds ?? 0)
          })
          .eq('id', characterId);
      }
    }

    newlyUnlocked.push({
      id:               ach.id,
      name:             ach.name,
      description:      ach.description,
      category:         ach.category,
      iconUrl:          ach.icon_url,
      requirementType:  ach.requirement_type,
      requirementValue: ach.requirement_value,
      rewardCoins:      ach.reward_coins ?? 0,
      rewardDiamonds:   ach.reward_diamonds ?? 0,
      isSecret:         ach.is_secret ?? false,
      isUnlocked:       true
    });
  }

  return newlyUnlocked;
}

// ── Helpers específicos ──────────────────────────────────────────────────────

export async function checkBattleAchievements(
  characterId: string,
  totalWins: number,
  bossWins: number,
  wasPerfect: boolean,
  durationSeconds: number
): Promise<Achievement[]> {
  const results = await Promise.all([
    checkAchievements(characterId, 'wins',         totalWins),
    checkAchievements(characterId, 'boss_wins',    bossWins),
    wasPerfect         ? checkAchievements(characterId, 'perfect_wins', 1) : Promise.resolve([]),
    durationSeconds < 60 ? checkAchievements(characterId, 'fast_wins',    1) : Promise.resolve([])
  ]);
  return results.flat();
}

export async function checkLevelAchievements(
  characterId: string,
  newLevel: number
): Promise<Achievement[]> {
  return checkAchievements(characterId, 'level', newLevel);
}

export async function checkPvPAchievements(
  characterId: string,
  totalMatches: number,
  totalWins: number,
  rating: number
): Promise<Achievement[]> {
  const results = await Promise.all([
    checkAchievements(characterId, 'pvp_matches', totalMatches),
    checkAchievements(characterId, 'pvp_wins',    totalWins),
    checkAchievements(characterId, 'pvp_rating',  rating)
  ]);
  return results.flat();
}

// Busca todas as conquistas do personagem (para tela de perfil)
export async function getCharacterAchievements(characterId: string): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select(`
      *,
      character_achievements!left (
        unlocked_at,
        progress
      )
    `)
    .eq('character_achievements.character_id', characterId)
    .order('category');

  if (error || !data) return [];

  return data.map(ach => {
    const entry = Array.isArray(ach.character_achievements)
      ? ach.character_achievements[0]
      : ach.character_achievements;

    return {
      id:               ach.id,
      name:             ach.is_secret && !entry ? '???' : ach.name,
      description:      ach.is_secret && !entry ? 'Conquista secreta' : ach.description,
      category:         ach.category,
      iconUrl:          ach.icon_url,
      requirementType:  ach.requirement_type,
      requirementValue: ach.requirement_value,
      rewardCoins:      ach.reward_coins ?? 0,
      rewardDiamonds:   ach.reward_diamonds ?? 0,
      isSecret:         ach.is_secret ?? false,
      isUnlocked:       !!entry,
      progress:         entry?.progress ?? 0
    };
  });
}
