import { useState, useEffect, useCallback } from "react";
import { X, Check } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { GameIcon } from "@/components/icons/GameIcon";
import { ChestIcon } from "@/components/icons/SaoIcons";
import type { ChestType } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

export const CHEST_VISUALS: Record<number, {
  name: string; borderColor: string; glowColor: string; bgColor: string; labelColor: string;
}> = {
  1: { name: 'Madeira',  borderColor: 'rgba(139,115,85,0.5)',  glowColor: 'none',                              bgColor: 'rgba(139,115,85,0.08)',  labelColor: '#8b7355' },
  2: { name: 'Ferro',    borderColor: 'rgba(160,170,180,0.5)', glowColor: 'none',                              bgColor: 'rgba(160,170,180,0.08)', labelColor: '#a0aab4' },
  3: { name: 'Prata',    borderColor: 'rgba(192,192,192,0.5)', glowColor: '0 0 12px rgba(192,192,192,0.2)',   bgColor: 'rgba(192,192,192,0.06)', labelColor: '#c0c0c0' },
  4: { name: 'Ouro',     borderColor: 'rgba(255,215,0,0.6)',   glowColor: '0 0 18px rgba(255,215,0,0.25)',    bgColor: 'rgba(255,215,0,0.07)',   labelColor: '#ffd700' },
  5: { name: 'Mitico',   borderColor: 'rgba(226,75,74,0.6)',   glowColor: '0 0 22px rgba(226,75,74,0.3)',     bgColor: 'rgba(226,75,74,0.07)',   labelColor: '#e24b4a' },
  6: { name: 'Lendario', borderColor: 'rgba(255,215,0,0.7)',   glowColor: '0 0 28px rgba(255,215,0,0.35)',    bgColor: 'rgba(255,215,0,0.09)',   labelColor: '#ffd700' },
};

export const RARITY_STYLES: Record<string, {
  label: string; labelColor: string; borderColor: string; glowColor: string;
}> = {
  common:    { label: 'Comum',    labelColor: '#969696', borderColor: 'rgba(150,150,150,0.3)', glowColor: 'none' },
  uncommon:  { label: 'Incomum',  labelColor: '#4caf50', borderColor: 'rgba(76,175,80,0.4)',   glowColor: 'none' },
  rare:      { label: 'Raro',     labelColor: '#2196f3', borderColor: 'rgba(33,150,243,0.5)',  glowColor: '0 0 12px rgba(33,150,243,0.25)' },
  epic:      { label: 'Epico',    labelColor: '#7c4dff', borderColor: 'rgba(124,77,255,0.55)', glowColor: '0 0 16px rgba(124,77,255,0.3)' },
  legendary: { label: 'Lendario', labelColor: '#ffd700', borderColor: 'rgba(255,215,0,0.65)',  glowColor: '0 0 22px rgba(255,215,0,0.35)' },
  mythic:    { label: 'Mitico',   labelColor: '#e24b4a', borderColor: 'rgba(226,75,74,0.65)',  glowColor: '0 0 26px rgba(226,75,74,0.4)' },
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

function getBestRarity(items: { rarity: string }[]): string {
  let best = 'common';
  for (const item of items) {
    if (RARITY_ORDER.indexOf(item.rarity) > RARITY_ORDER.indexOf(best)) {
      best = item.rarity;
    }
  }
  return best;
}

// ─── OpenResult ───────────────────────────────────────────────────────────────

interface OpenResult {
  success: boolean;
  error?: string;
  items: { item_id: string; item_name: string; rarity: string }[];
  bonus_coins: number;
  bonus_xp: number;
  num_items: number;
}

// ─── Rarity → icon mapping ────────────────────────────────────────────────────

const RARITY_ICON: Record<string, string> = {
  common:    'pack',
  uncommon:  'scroll',
  rare:      'gem',
  epic:      'wand',
  legendary: 'crown',
  mythic:    'star',
};

// ─── ItemRevealCard ───────────────────────────────────────────────────────────

function ItemRevealCard({ item, big = false }: { item: { item_name: string; rarity: string }; big?: boolean }) {
  const rs = RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common;
  const isEpicPlus = ['epic', 'legendary', 'mythic'].includes(item.rarity);
  const size = big ? 96 : 72;
  const iconId = RARITY_ICON[item.rarity] ?? 'pack';

  return (
    <div
      className="flex flex-col items-center text-center rounded-xl p-3 transition-all duration-500"
      style={{
        width: big ? 120 : 96,
        background: 'rgba(10,14,26,0.8)',
        border: `2px solid ${rs.borderColor}`,
        boxShadow: rs.glowColor !== 'none' ? rs.glowColor : undefined,
        animation: isEpicPlus ? 'glow-breathe 2s ease-in-out infinite' : undefined,
      }}
    >
      <GameIcon id={iconId} size={size / 2} ringColor={rs.labelColor} fillColor={rs.labelColor} bgColor={`${rs.labelColor}18`} />
      <p
        className="mt-2 font-bold leading-tight"
        style={{
          fontSize: big ? '11px' : '9px',
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'Rajdhani, sans-serif',
          letterSpacing: '0.5px',
          maxWidth: big ? 100 : 76,
          wordBreak: 'break-word',
        }}
      >
        {item.item_name}
      </p>
      <span
        className="mt-1 px-2 py-0.5 rounded-full uppercase font-bold"
        style={{
          fontSize: '8px',
          letterSpacing: '1px',
          color: rs.labelColor,
          background: `${rs.labelColor}18`,
          border: `1px solid ${rs.borderColor}`,
        }}
      >
        {rs.label}
      </span>
    </div>
  );
}

// ─── Particle bursts for legendary/mythic ────────────────────────────────────

function GoldParticles({ color }: { color: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[101] overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            opacity: Math.random() * 0.8 + 0.2,
            animation: `float-up ${1 + Math.random() * 2}s ease-out forwards`,
            animationDelay: `${Math.random() * 0.8}s`,
            transform: `scale(${0.5 + Math.random()})`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Phase types ─────────────────────────────────────────────────────────────

type OpeningPhase = 'appearing' | 'idle' | 'opening' | 'revealing' | 'summary';

// ─── ChestOpening ─────────────────────────────────────────────────────────────

interface ChestOpeningProps {
  chestType: ChestType;
  studentId: string;
  onClose: (refreshCoins?: boolean) => void;
}

export function ChestOpening({ chestType, studentId, onClose }: ChestOpeningProps) {
  const [phase, setPhase] = useState<OpeningPhase>('appearing');
  const [result, setResult] = useState<OpenResult | null>(null);
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const visual = CHEST_VISUALS[chestType.tier] ?? CHEST_VISUALS[1];

  // Phase 1: chest appears → ready to tap
  useEffect(() => {
    const t = setTimeout(() => setPhase('idle'), 800);
    return () => clearTimeout(t);
  }, []);

  const bestRarity = result ? getBestRarity(result.items) : 'common';
  const revealColor = RARITY_STYLES[bestRarity]?.labelColor ?? '#00e5ff';
  const isEpicLoot = ['legendary', 'mythic'].includes(bestRarity);

  const handleOpen = useCallback(async () => {
    if (phase !== 'idle') return;
    setPhase('opening');

    const { data, error } = await supabaseStudent.rpc('open_chest' as never, {
      p_student_id: studentId,
      p_chest_type_id: chestType.id,
    });

    if (error || !data) {
      setErrorMsg('Erro ao abrir o baú. Tente novamente.');
      setPhase('idle');
      return;
    }

    const res = data as OpenResult;
    if (!res.success) {
      setErrorMsg(res.error ?? 'Não foi possível abrir o baú.');
      setPhase('idle');
      return;
    }

    setResult(res);

    // After opening animation (1.4s), start revealing items
    setTimeout(() => {
      setPhase('revealing');
      res.items.forEach((_, i) => {
        setTimeout(() => setRevealedIndex(i), i * 650);
      });
      // Go to summary after all items revealed
      setTimeout(() => setPhase('summary'), res.items.length * 650 + 900);
    }, 1400);
  }, [phase, studentId, chestType.id]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(8px)' }}
    >
      {/* Close button (only on idle/error) */}
      {(phase === 'idle' || phase === 'appearing') && (
        <button
          onClick={() => onClose(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-white/30 hover:text-white/70 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <X size={18} />
        </button>
      )}

      {/* PHASE: appearing / idle */}
      {(phase === 'appearing' || phase === 'idle') && (
        <div
          className="flex flex-col items-center text-center cursor-pointer select-none"
          onClick={phase === 'idle' ? handleOpen : undefined}
        >
          <div
            className="relative mb-6"
            style={{
              animation: phase === 'idle' ? 'glow-breathe 2s ease-in-out infinite' : 'fade-in-up 0.6s ease-out',
            }}
          >
            <ChestIcon
              size={140}
              ringColor={visual.labelColor}
              fillColor={visual.labelColor}
              bgColor={visual.bgColor}
            />
            {visual.glowColor !== 'none' && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: visual.glowColor, borderRadius: '50%' }}
              />
            )}
          </div>

          <p
            className="font-bold tracking-widest mb-2"
            style={{ color: visual.labelColor, fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', letterSpacing: '4px' }}
          >
            {chestType.name.toUpperCase()}
          </p>

          {chestType.description && (
            <p className="text-xs text-white/30 mb-4 max-w-xs">{chestType.description}</p>
          )}

          {chestType.is_limited && chestType.stock !== null && (
            <div
              className="mb-4 px-3 py-1 rounded-full text-xs font-bold animate-pulse"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}
            >
              {chestType.stock} restante{chestType.stock !== 1 ? 's' : ''}
            </div>
          )}

          {errorMsg && (
            <p className="text-red-400 text-sm mb-4 px-4 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {errorMsg}
            </p>
          )}

          {phase === 'idle' && (
            <p
              className="text-xs uppercase tracking-widest animate-pulse"
              style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '3px' }}
            >
              Toque para abrir
            </p>
          )}
        </div>
      )}

      {/* PHASE: opening — light burst */}
      {phase === 'opening' && (
        <div className="flex flex-col items-center">
          <div className="relative">
            <ChestIcon
              size={140}
              ringColor={visual.labelColor}
              fillColor={visual.labelColor}
              bgColor={visual.bgColor}
            />
            {/* Expanding light */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: `radial-gradient(circle, ${visual.labelColor}44, transparent 70%)`,
                animationDuration: '0.8s',
              }}
            />
            <div
              className="absolute inset-[-20px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${visual.labelColor}22, transparent 70%)`,
                animation: 'glow-breathe 0.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* PHASE: revealing — items appear one by one */}
      {phase === 'revealing' && result && (
        <div className="w-full max-w-lg">
          <p
            className="text-center mb-6 text-xs uppercase tracking-widest text-white/30"
            style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '3px' }}
          >
            Itens Recebidos
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {result.items.map((item, i) => (
              <div
                key={i}
                style={{
                  opacity: i <= revealedIndex ? 1 : 0,
                  transform: i <= revealedIndex ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(20px)',
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <ItemRevealCard item={item} big />
              </div>
            ))}
          </div>

          {/* Epic+ flash */}
          {revealedIndex >= 0 && ['legendary', 'mythic'].includes(result.items[revealedIndex]?.rarity ?? '') && (
            <div
              className="fixed inset-0 pointer-events-none z-[99]"
              style={{
                background: `radial-gradient(ellipse at center, ${RARITY_STYLES[result.items[revealedIndex].rarity]?.labelColor ?? '#fff'}30 0%, transparent 60%)`,
                animation: 'fade-in-up 0.3s ease-out',
              }}
            />
          )}
        </div>
      )}

      {/* PHASE: summary */}
      {phase === 'summary' && result && (
        <div className="w-full max-w-md flex flex-col items-center text-center">
          {isEpicLoot && <GoldParticles color={revealColor} />}

          <p
            className="font-bold tracking-widest mb-5"
            style={{
              color: isEpicLoot ? revealColor : 'rgba(255,255,255,0.6)',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: isEpicLoot ? '20px' : '14px',
              letterSpacing: '4px',
              textShadow: isEpicLoot ? `0 0 20px ${revealColor}88` : undefined,
            }}
          >
            {isEpicLoot ? 'ITEM EXTRAORDINARIO!' : 'Baú Aberto!'}
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-5">
            {result.items.map((item, i) => (
              <ItemRevealCard key={i} item={item} big />
            ))}
          </div>

          {(result.bonus_coins > 0 || result.bonus_xp > 0) && (
            <div className="flex gap-4 justify-center mb-5">
              {result.bonus_coins > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-yellow-400 font-bold">
                  <GameIcon id="coin" size={16} /> +{result.bonus_coins} moedas
                </div>
              )}
              {result.bonus_xp > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-cyan-400 font-bold">
                  <GameIcon id="star" size={16} /> +{result.bonus_xp} XP
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => onClose(true)}
            className="btn-cyber px-8 py-2.5 text-sm justify-center"
          >
            <Check size={15} /> Continuar
          </button>
        </div>
      )}
    </div>
  );
}
