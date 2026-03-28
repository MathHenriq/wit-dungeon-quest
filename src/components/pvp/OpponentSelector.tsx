import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { findOpponents, type PvPOpponent } from '@/lib/pvp/matchmaking';
import type { BattleCharacter } from '@/types/character';

interface OpponentSelectorProps {
  character: BattleCharacter;
  onSelectOpponent: (opponent: PvPOpponent) => void;
}

function WinRate({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  if (total === 0) return <span className="text-gray-400 text-xs">Sem histórico</span>;
  const pct = Math.round((wins / total) * 100);
  return (
    <span className={`text-xs font-semibold ${pct >= 60 ? 'text-green-600' : pct >= 40 ? 'text-gray-600' : 'text-red-500'}`}>
      {wins}V / {losses}D ({pct}%)
    </span>
  );
}

function RatingBadge({ diff }: { diff: number }) {
  if (diff === 0) return null;
  const label = diff > 0 ? `+${diff}` : `${diff}`;
  const color = diff > 0 ? 'text-red-500' : 'text-green-600';
  return <span className={`text-xs font-bold ${color} ml-1`}>({label})</span>;
}

export function OpponentSelector({ character, onSelectOpponent }: OpponentSelectorProps) {
  const [selected, setSelected] = useState<PvPOpponent | null>(null);

  const { data: myRating } = useQuery({
    queryKey: ['pvp-rating', character.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pvp_stats')
        .select('rating')
        .eq('character_id', character.id)
        .single();
      return data?.rating ?? 1000;
    }
  });

  const rating = myRating ?? 1000;

  const {
    data: opponents = [],
    isLoading,
    refetch,
    isFetching
  } = useQuery<PvPOpponent[]>({
    queryKey: ['pvp-opponents', character.id, rating],
    queryFn: () => findOpponents(character.id, character.level, rating),
    enabled: !!myRating
  });

  return (
    <div className="max-w-4xl mx-auto p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">⚔️ Arena PvP</h1>
          <p className="text-gray-500 text-sm mt-1">
            {character.name} · Lvl {character.level} · Rating{' '}
            <span className="font-bold text-blue-600">{rating}</span>
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition-all"
        >
          {isFetching ? '⏳' : '🔄'} Buscar Oponentes
        </button>
      </div>

      {/* Lista de oponentes */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <span className="animate-spin text-3xl mr-3">⏳</span> Buscando oponentes...
        </div>
      ) : opponents.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl">
          <p className="text-4xl mb-3">😶</p>
          <p className="text-lg font-semibold">Nenhum oponente disponível agora</p>
          <p className="text-sm mt-1">Tente novamente mais tarde ou suba de nível!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opponents.map((opp) => {
            const isSelected = selected?.id === opp.id;
            const levelDiff  = opp.level - character.level;
            const ratingDiff = opp.rating - rating;

            return (
              <button
                key={opp.id}
                onClick={() => setSelected(isSelected ? null : opp)}
                className={`text-left border-2 rounded-2xl p-4 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.01]'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                }`}
              >
                {/* Topo do card */}
                <div className="flex items-center gap-3 mb-3">
                  {opp.spriteUrl ? (
                    <img
                      src={opp.spriteUrl}
                      alt={opp.name}
                      className="w-14 h-14 rounded-full object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-2xl">
                      ⚔️
                    </div>
                  )}
                  <div>
                    <p className="font-black text-lg leading-tight">{opp.name}</p>
                    <p className="text-sm text-gray-500">{opp.class}</p>
                    <WinRate wins={opp.wins} losses={opp.losses} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Nível:</span>
                    <span className="font-bold">{opp.level}</span>
                    {levelDiff !== 0 && (
                      <span className={`text-xs font-bold ${levelDiff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        ({levelDiff > 0 ? `+${levelDiff}` : levelDiff})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Rating:</span>
                    <span className="font-bold">{opp.rating}</span>
                    <RatingBadge diff={ratingDiff} />
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 text-center text-blue-600 text-xs font-bold">
                    ✅ Selecionado
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Botão de desafio */}
      {selected && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => onSelectOpponent(selected)}
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-95 text-white font-black px-10 py-4 rounded-xl text-xl shadow-lg transition-all"
          >
            ⚔️ DESAFIAR {selected.name.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
}
