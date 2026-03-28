import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardRow {
  character_id: string;
  wins: number;
  losses: number;
  rating: number;
  highest_rating: number;
  win_streak: number;
  best_win_streak: number;
  characters: {
    name: string;
    level: number;
    class: string;
    sprite_normal: string | null;
  };
}

const RANK_MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

function winRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total > 0 ? Math.round((wins / total) * 100) : 0;
}

export function Leaderboard() {
  const { data: rows = [], isLoading } = useQuery<LeaderboardRow[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pvp_stats')
        .select(`
          character_id, wins, losses, rating, highest_rating, win_streak, best_win_streak,
          characters:character_id ( name, level, class, sprite_normal )
        `)
        .order('rating', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as LeaderboardRow[];
    },
    refetchInterval: 30_000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <span className="animate-spin text-3xl mr-3">⏳</span> Carregando ranking...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-black text-center mb-6">🏆 Ranking PvP</h1>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg font-semibold">Nenhuma batalha PvP ainda</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-left">
                <th className="p-3 w-10">#</th>
                <th className="p-3">Jogador</th>
                <th className="p-3 text-center">Lvl</th>
                <th className="p-3 text-center">Rating</th>
                <th className="p-3 text-center">V / D</th>
                <th className="p-3 text-center hidden sm:table-cell">Win%</th>
                <th className="p-3 text-center hidden md:table-cell">Streak</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const char = row.characters;
                const wr = winRate(row.wins, row.losses);
                const isPeak = row.rating >= row.highest_rating;

                return (
                  <tr
                    key={row.character_id}
                    className={`border-b transition-colors ${
                      i < 3 ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-3 font-bold text-center text-base">
                      {RANK_MEDAL[i] ?? `${i + 1}`}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {char.sprite_normal ? (
                          <img
                            src={char.sprite_normal}
                            alt={char.name}
                            className="w-10 h-10 rounded-full object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                            ⚔️
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{char.name}</p>
                          <p className="text-xs text-gray-500">{char.class}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-center font-semibold">{char.level}</td>

                    <td className="p-3 text-center">
                      <span className="text-lg font-black">{row.rating}</span>
                      {isPeak && (
                        <span className="ml-1 text-xs text-green-600" title="Rating máximo atual">🔝</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <span className="text-green-600 font-bold">{row.wins}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-500 font-bold">{row.losses}</span>
                    </td>

                    <td className="p-3 text-center hidden sm:table-cell">
                      <span className={`font-semibold ${wr >= 60 ? 'text-green-600' : wr >= 40 ? 'text-gray-700' : 'text-red-500'}`}>
                        {wr}%
                      </span>
                    </td>

                    <td className="p-3 text-center hidden md:table-cell">
                      {row.win_streak >= 3 ? (
                        <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          🔥 {row.win_streak}
                        </span>
                      ) : row.win_streak > 0 ? (
                        <span className="text-gray-600 text-xs">{row.win_streak}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
