import { BattleRewards, LootDrop } from '@/lib/loot/lootGenerator';
import { XPReward, getPointsForLevelUp } from '@/lib/progression/xpCalculator';

interface VictoryScreenProps {
  rewards: BattleRewards;
  xpReward: XPReward;
  onContinue: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common:    'text-gray-500',
  uncommon:  'text-green-600',
  rare:      'text-blue-600',
  epic:      'text-purple-600',
  legendary: 'text-yellow-500'
};

const RARITY_BG: Record<string, string> = {
  common:    'bg-gray-50 border-gray-200',
  uncommon:  'bg-green-50 border-green-200',
  rare:      'bg-blue-50 border-blue-200',
  epic:      'bg-purple-50 border-purple-200',
  legendary: 'bg-yellow-50 border-yellow-300'
};

function ItemDrop({ item }: { item: LootDrop }) {
  return (
    <div className={`flex items-center justify-between border rounded-lg p-3 ${RARITY_BG[item.rarity] ?? 'bg-gray-50 border-gray-200'}`}>
      <span className={`font-semibold capitalize ${RARITY_COLORS[item.rarity] ?? 'text-gray-600'}`}>
        {item.itemName}
        <span className="ml-2 text-xs font-normal opacity-60">({item.rarity})</span>
      </span>
      <span className="text-gray-700 font-bold">×{item.quantity}</span>
    </div>
  );
}

export function VictoryScreen({ rewards, xpReward, onContinue }: VictoryScreenProps) {
  const levelUpPoints = xpReward.leveledUp && xpReward.levelsGained
    ? getPointsForLevelUp(xpReward.levelsGained)
    : null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-t-2xl p-6 text-center text-white">
          <p className="text-5xl mb-1">🏆</p>
          <h1 className="text-3xl font-black tracking-wide">VITÓRIA!</h1>
          {xpReward.leveledUp && (
            <div className="mt-3 bg-white/20 rounded-xl py-2 px-4 inline-block">
              <p className="text-xl font-bold">⬆ LEVEL UP → {xpReward.newLevel}!</p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">

          {/* XP */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="font-bold text-blue-800">XP Ganho</span>
            </div>
            <span className="text-2xl font-black text-blue-600">+{rewards.xp}</span>
          </div>

          {/* Moedas e Diamantes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪙</span>
                <span className="font-bold text-yellow-800 text-sm">Moedas</span>
              </div>
              <span className="text-xl font-black text-yellow-700">+{rewards.coins}</span>
            </div>

            {rewards.diamonds > 0 ? (
              <div className="flex items-center justify-between bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  <span className="font-bold text-cyan-800 text-sm">Diamantes</span>
                </div>
                <span className="text-xl font-black text-cyan-700">+{rewards.diamonds}</span>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center text-gray-400 text-sm">
                Sem diamantes
              </div>
            )}
          </div>

          {/* Itens dropados */}
          {rewards.items.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 mb-2">🎁 Itens Obtidos</h3>
              <div className="space-y-2">
                {rewards.items.map((item, i) => (
                  <ItemDrop key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Bônus de Level Up */}
          {xpReward.leveledUp && levelUpPoints && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-bold text-green-800 mb-2">✨ Bônus de Level Up</h3>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✅ +{levelUpPoints.freePoints} Pontos Elementais Livres</li>
                <li>✅ +{levelUpPoints.attributePoints} em todos os Atributos Base</li>
                <li>✅ HP e Energia completamente restaurados</li>
              </ul>
            </div>
          )}

          {/* Botão */}
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-4 rounded-xl text-xl transition-all active:scale-95 shadow-lg"
          >
            CONTINUAR
          </button>

        </div>
      </div>
    </div>
  );
}
