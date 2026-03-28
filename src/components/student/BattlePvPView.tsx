import { useState } from 'react';
import type { BattleCharacter } from '@/types/character';
import { OpponentSelector } from '@/components/pvp/OpponentSelector';
import type { PvPOpponent } from '@/lib/pvp/matchmaking';
import { Leaderboard } from '@/components/pvp/Leaderboard';

interface BattlePvPViewProps {
  character: BattleCharacter;
}

export function BattlePvPView({ character }: BattlePvPViewProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (showLeaderboard) {
    return (
      <div>
        <button
          onClick={() => setShowLeaderboard(false)}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded"
        >
          ← Voltar para Arena
        </button>
        <Leaderboard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">⚔️ Arena PvP</h2>
        <button
          onClick={() => setShowLeaderboard(true)}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
        >
          🏆 Ver Ranking
        </button>
      </div>

      <OpponentSelector
        character={character}
        onSelectOpponent={(opponent: PvPOpponent) => {
          alert(`Batalha PvP vs ${opponent.name} será implementada!`);
        }}
      />
    </div>
  );
}
