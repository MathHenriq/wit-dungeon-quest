import { supabase } from '@/integrations/supabase/client';

export interface PvPOpponent {
  id: string;
  name: string;
  level: number;
  class: string;
  rating: number;
  wins: number;
  losses: number;
  spriteUrl?: string | null;
}

export async function findOpponents(
  characterId: string,
  characterLevel: number,
  characterRating: number
): Promise<PvPOpponent[]> {
  const { data: opponents } = await supabase
    .from('characters')
    .select(`
      id, name, level, class, sprite_normal,
      pvp_stats ( rating, wins, losses )
    `)
    .neq('id', characterId)
    .gte('level', characterLevel - 5)
    .lte('level', characterLevel + 5)
    .limit(20);

  if (!opponents) return [];

  return opponents
    .filter((opp) => {
      const stats = Array.isArray(opp.pvp_stats) ? opp.pvp_stats[0] : opp.pvp_stats;
      const rating: number = stats?.rating ?? 1000;
      return Math.abs(rating - characterRating) <= 200;
    })
    .map((opp) => {
      const stats = Array.isArray(opp.pvp_stats) ? opp.pvp_stats[0] : opp.pvp_stats;
      return {
        id: opp.id,
        name: opp.name,
        level: opp.level,
        class: opp.class,
        rating: stats?.rating ?? 1000,
        wins: stats?.wins ?? 0,
        losses: stats?.losses ?? 0,
        spriteUrl: opp.sprite_normal ?? null
      };
    })
    .sort(
      (a, b) =>
        Math.abs(a.rating - characterRating) - Math.abs(b.rating - characterRating)
    );
}

// Sistema ELO simplificado (K=32)
export function calculateRatingChange(
  winnerRating: number,
  loserRating: number,
  isDraw = false
): { winnerChange: number; loserChange: number } {
  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser  = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  if (isDraw) {
    return {
      winnerChange: Math.round(K * (0.5 - expectedWinner)),
      loserChange:  Math.round(K * (0.5 - expectedLoser))
    };
  }

  return {
    winnerChange: Math.round(K * (1 - expectedWinner)),
    loserChange:  Math.round(K * (0 - expectedLoser))
  };
}
