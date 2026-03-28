import { useEffect, useState } from 'react';
import type { Achievement } from '@/lib/achievements/achievementChecker';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

const CATEGORY_COLOR: Record<string, string> = {
  battle:      'from-red-600 to-orange-500',
  progression: 'from-blue-600 to-cyan-500',
  collection:  'from-purple-600 to-violet-500',
  pvp:         'from-yellow-500 to-amber-600',
  special:     'from-emerald-500 to-teal-600'
};

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const gradient = CATEGORY_COLOR[achievement.category] ?? 'from-yellow-500 to-orange-500';

  return (
    <div className={`achievement-toast fixed top-20 right-4 z-[9999] bg-gradient-to-r ${gradient} rounded-xl shadow-2xl p-4 w-80 border border-white/20`}>
      {/* Header */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs font-black tracking-widest text-white/80 uppercase">
          🏆 Conquista Desbloqueada!
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Ícone */}
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-3xl">
          {achievement.iconUrl ? (
            <img src={achievement.iconUrl} alt={achievement.name} className="w-10 h-10 object-contain" />
          ) : (
            '🏅'
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-base leading-tight">{achievement.name}</p>
          <p className="text-white/80 text-xs mt-0.5 leading-snug line-clamp-2">{achievement.description}</p>

          {/* Recompensas */}
          {(achievement.rewardCoins > 0 || achievement.rewardDiamonds > 0) && (
            <div className="flex gap-2 mt-1.5 text-xs font-bold text-white">
              {achievement.rewardCoins > 0 && (
                <span className="bg-white/20 rounded px-1.5 py-0.5">🪙 +{achievement.rewardCoins}</span>
              )}
              {achievement.rewardDiamonds > 0 && (
                <span className="bg-white/20 rounded px-1.5 py-0.5">💎 +{achievement.rewardDiamonds}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar (countdown visual) */}
      <div className="mt-3 h-0.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/60 rounded-full"
          style={{ animation: 'progressDrain 4s linear forwards' }}
        />
      </div>

      <style>{`
        @keyframes progressDrain {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ── Manager: exibe conquistas em fila ────────────────────────────────────────

interface AchievementManagerProps {
  achievements: Achievement[];
  onClear?: () => void;
}

export function AchievementManager({ achievements, onClear }: AchievementManagerProps) {
  const [queue, setQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    if (achievements.length > 0) {
      setQueue(achievements);
    }
  }, [achievements]);

  const handleDismiss = () => {
    setQueue(prev => {
      const next = prev.slice(1);
      if (next.length === 0) onClear?.();
      return next;
    });
  };

  if (queue.length === 0) return null;

  return <AchievementToast achievement={queue[0]} onDismiss={handleDismiss} />;
}
