import { BattleRewards, LootDrop } from '@/lib/loot/lootGenerator';
import { XPReward, getPointsForLevelUp } from '@/lib/progression/xpCalculator';
import type { DropResult, DropRarity } from '@/lib/drops/dropTypes';
import { RARITY_LABEL } from '@/lib/drops/dropTypes';

interface VictoryScreenProps {
  rewards: BattleRewards;
  xpReward: XPReward;
  drops?: DropResult[];
  onContinue: () => void;
}

const DROP_RARITY_STYLE: Record<DropRarity, { dot: string; text: string; border: string; bg: string }> = {
  comum:    { dot: '#94a3b8', text: 'text-slate-300',   border: 'border-slate-500/40',   bg: 'bg-slate-900/40'   },
  incomum:  { dot: '#22c55e', text: 'text-green-300',   border: 'border-green-500/40',   bg: 'bg-green-950/40'   },
  raro:     { dot: '#3b82f6', text: 'text-blue-300',    border: 'border-blue-500/40',    bg: 'bg-blue-950/40'    },
  epico:    { dot: '#a855f7', text: 'text-purple-300',  border: 'border-purple-500/40',  bg: 'bg-purple-950/40'  },
  lendario: { dot: '#f59e0b', text: 'text-amber-300',   border: 'border-amber-500/40',   bg: 'bg-amber-950/40'   },
  mitico:   { dot: '#ef4444', text: 'text-red-300',     border: 'border-red-500/40',     bg: 'bg-red-950/40'     },
  '???':    { dot: 'transparent', text: 'text-fuchsia-200', border: 'border-fuchsia-500/40', bg: 'bg-fuchsia-950/40' },
};

function DropTag({ drop }: { drop: DropResult }) {
  const style = DROP_RARITY_STYLE[drop.rarity];
  const isMystery = drop.rarity === '???';
  return (
    <div className={`flex items-center justify-between border ${style.border} ${style.bg} rounded-lg px-3 py-2`}>
      <div className="flex items-center gap-2 min-w-0">
        <span
          aria-hidden
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={
            isMystery
              ? { background: 'linear-gradient(135deg,#ec4899,#8b5cf6,#22d3ee)' }
              : { backgroundColor: style.dot }
          }
        />
        <span className={`font-semibold uppercase tracking-wider text-sm truncate ${style.text}`}>
          {drop.name}
        </span>
        <span className={`text-[10px] uppercase tracking-[0.2em] opacity-70 ${style.text}`}>
          {RARITY_LABEL[drop.rarity]}
        </span>
      </div>
      <span className="text-white/80 font-bold text-sm shrink-0 ml-2">×{drop.quantity}</span>
    </div>
  );
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

export function VictoryScreen({ rewards, xpReward, drops, onContinue }: VictoryScreenProps) {
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

          {/* Moedas (Patch 2.0 — diamantes não vêm de batalhas, só do professor) */}
          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <span className="font-bold text-yellow-800 text-sm">Moedas</span>
            </div>
            <span className="text-xl font-black text-yellow-700">+{rewards.coins}</span>
          </div>

          {/* Drops temáticos do inimigo */}
          {drops && drops.length > 0 && (
            <div>
              <h3 className="font-black text-white/80 mb-2 uppercase tracking-[0.25em] text-xs">
                Drops Obtidos
              </h3>
              <div className="space-y-2">
                {drops.map((d) => <DropTag key={d.dropItemId} drop={d} />)}
              </div>
            </div>
          )}

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
