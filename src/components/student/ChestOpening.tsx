import { useState, useEffect, useCallback } from "react";
import { X, Check } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { GameIcon } from "@/components/icons/GameIcon";
import { ChestIcon } from "@/components/icons/SaoIcons";
import type { ChestType } from "@/types";
import { useEquippedSkins } from "@/hooks/useEquippedSkins";
import { CornerOrnament } from "@/components/battle/CardActivationAnimation";

// ─── Visual styles (Solo Leveling notification framing) ──────────────────────
const CHEST_CSS = `
@keyframes chest-pop {
  0%   { opacity: 0; transform: translateY(20px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0)    scale(1);    }
}
@keyframes chest-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
@keyframes chest-shake {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  20%      { transform: translate(-4px, 2px) rotate(-2deg); }
  40%      { transform: translate(4px, -2px) rotate(2deg); }
  60%      { transform: translate(-3px, 2px) rotate(-1.5deg); }
  80%      { transform: translate(3px, -2px) rotate(1.5deg); }
}
@keyframes chest-burst {
  0%   { opacity: 0; transform: scale(0.4); }
  50%  { opacity: 1; transform: scale(1.6); }
  100% { opacity: 0; transform: scale(2.6); }
}
@keyframes chest-card-in {
  0%   { opacity: 0; transform: translateY(24px) scale(0.6) rotateY(-30deg); filter: blur(8px); }
  60%  { opacity: 1; transform: translateY(-4px) scale(1.06) rotateY(0deg);  filter: blur(0); }
  100% { opacity: 1; transform: translateY(0)    scale(1)    rotateY(0deg);  filter: blur(0); }
}
@keyframes chest-shine {
  0%   { transform: translateX(-150%) skewX(-25deg); }
  100% { transform: translateX(250%)  skewX(-25deg); }
}

.chest-panel {
  position: relative;
  isolation: isolate;
  width: min(440px, calc(100vw - 32px));
  padding: 22px 28px 24px;
  background: linear-gradient(180deg, rgba(10, 18, 38, 0.96) 0%, rgba(6, 12, 26, 0.98) 100%);
  border: 2px solid var(--ch-tone, #ffffff);
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.06) inset,
    0 0 32px color-mix(in srgb, var(--ch-tone, #ffffff) 50%, transparent),
    0 0 64px color-mix(in srgb, var(--ch-tone, #ffffff) 22%, transparent);
  color: #f5f5f7;
  font-family: 'Rajdhani', sans-serif;
  animation: chest-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.chest-corner {
  position: absolute;
  width: 48px; height: 48px;
  color: var(--ch-tone, #ffffff);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--ch-tone, #ffffff) 70%, transparent));
  pointer-events: none;
}
.chest-corner-tl { top: -10px; left: -10px; }
.chest-corner-tr { top: -10px; right: -10px; transform: scaleX(-1); }
.chest-corner-bl { bottom: -10px; left: -10px; transform: scaleY(-1); }
.chest-corner-br { bottom: -10px; right: -10px; transform: scale(-1, -1); }

.chest-header {
  display: flex; align-items: center; gap: 11px;
  font-weight: 800; letter-spacing: 0.22em; font-size: 14px; text-transform: uppercase;
}
.chest-header-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px;
  border: 2px solid #ffffff; border-radius: 50%;
  font-family: 'Cinzel', serif; font-weight: 900; font-size: 15px; line-height: 1;
  color: #ffffff;
}
.chest-header-text {
  color: #ffffff;
  text-shadow: 0 0 10px color-mix(in srgb, var(--ch-tone, #ffffff) 65%, transparent);
}
.chest-divider {
  height: 1px; margin: 14px 0 18px;
  background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--ch-tone, #ffffff) 85%, transparent) 50%, transparent 100%);
  position: relative;
}
.chest-divider::after {
  content: "";
  position: absolute; left: 50%; top: 50%;
  width: 70px; height: 6px;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse, var(--ch-tone, #ffffff) 0%, transparent 70%);
  filter: blur(2px);
}
.chest-art {
  display: flex; align-items: center; justify-content: center;
  padding: 18px 0 8px;
  position: relative;
}
.chest-art-icon {
  animation: chest-float 3.4s ease-in-out infinite;
  filter: drop-shadow(0 6px 20px color-mix(in srgb, var(--ch-tone, #ffffff) 55%, transparent));
}
.chest-art-icon.shaking { animation: chest-shake 0.5s ease-in-out infinite; }
.chest-art-burst {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.chest-art-burst::before, .chest-art-burst::after {
  content: ""; position: absolute;
  width: 220px; height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--ch-tone, #ffffff) 0%, transparent 60%);
  animation: chest-burst 1s ease-out infinite;
}
.chest-art-burst::after { animation-delay: 0.4s; }
.chest-name {
  font-size: 22px; font-weight: 700; letter-spacing: 0.04em;
  text-align: center; margin: 4px 0 8px; line-height: 1.2;
}
.chest-bracket { color: var(--ch-tone, #ffffff); font-weight: 700; padding: 0 4px; }
.chest-desc {
  text-align: center;
  font-size: 12.5px; line-height: 1.5;
  color: rgba(230, 240, 255, 0.7);
  margin: 0 auto 14px; max-width: 320px;
}
.chest-meta {
  display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;
  margin-bottom: 14px;
}
.chest-meta-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase;
}
.chest-meta-pill.tier {
  background: color-mix(in srgb, var(--ch-tone, #ffffff) 18%, transparent);
  color: var(--ch-tone, #ffffff);
  border: 1px solid color-mix(in srgb, var(--ch-tone, #ffffff) 60%, transparent);
}
.chest-meta-pill.stock {
  background: rgba(239, 68, 68, 0.14);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.55);
}
.chest-error {
  margin: 0 0 14px;
  padding: 8px 12px;
  text-align: center;
  font-size: 12px;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
}
.chest-cta {
  display: block; width: 100%;
  padding: 13px 16px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--ch-tone, #ffffff) 35%, #0a0612) 0%, color-mix(in srgb, var(--ch-tone, #ffffff) 18%, #0a0612) 100%);
  border: 2px solid var(--ch-tone, #ffffff);
  color: #ffffff;
  font-family: 'Orbitron', sans-serif;
  font-size: 13px; font-weight: 800; letter-spacing: 0.35em;
  text-transform: uppercase;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 20px color-mix(in srgb, var(--ch-tone, #ffffff) 35%, transparent);
  transition: transform 0.15s ease, box-shadow 0.25s ease;
}
.chest-cta::before {
  content: "";
  position: absolute; top: -20%; bottom: -20%; left: -40%;
  width: 30%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  transform: skewX(-25deg);
  animation: chest-shine 2.4s ease-in-out infinite;
  pointer-events: none;
}
.chest-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 32px color-mix(in srgb, var(--ch-tone, #ffffff) 60%, transparent);
}
.chest-cta:active { transform: translateY(0); }

.chest-reveal-grid {
  display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;
  width: 100%; max-width: 720px;
  padding: 20px;
}
.chest-reveal-card {
  width: 132px; padding: 12px 12px 14px;
  background: linear-gradient(180deg, rgba(12, 18, 36, 0.92) 0%, rgba(6, 10, 22, 0.96) 100%);
  border: 2px solid var(--card-tone, rgba(255,255,255,0.3));
  border-radius: 6px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  position: relative; isolation: isolate;
  box-shadow: 0 0 18px color-mix(in srgb, var(--card-tone, #ffffff) 35%, transparent);
}
.chest-reveal-card.epic-plus {
  box-shadow:
    0 0 22px color-mix(in srgb, var(--card-tone, #ffffff) 55%, transparent),
    0 0 44px color-mix(in srgb, var(--card-tone, #ffffff) 25%, transparent);
}
.chest-reveal-card::before {
  /* sweeping shine on legendary+ */
  content: "";
  position: absolute; top: 0; bottom: 0; left: -50%;
  width: 30%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--card-tone, #ffffff) 50%, transparent), transparent);
  transform: skewX(-25deg);
  pointer-events: none;
}
.chest-reveal-card.legendary-plus::before {
  animation: chest-shine 1.6s ease-in-out infinite;
}
.chest-reveal-card-icon {
  width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
  background: color-mix(in srgb, var(--card-tone, #ffffff) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--card-tone, #ffffff) 45%, transparent);
}
.chest-reveal-card-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 12.5px; font-weight: 700;
  color: #f5f5f7;
  line-height: 1.2;
  word-break: break-word;
  max-width: 110px;
}
.chest-reveal-card-rarity {
  margin-top: 6px;
  padding: 2px 8px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--card-tone, #ffffff);
  background: color-mix(in srgb, var(--card-tone, #ffffff) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--card-tone, #ffffff) 55%, transparent);
}
`;

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
  unknown:   { label: '???',      labelColor: '#4b5563', borderColor: 'rgba(75,85,99,0.7)',    glowColor: '0 0 30px rgba(75,85,99,0.5)'   },
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'];

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
  items: { item_id: string | null; item_name: string; rarity: string; refunded?: boolean }[];
  // Legacy fields kept optional for back-compat with old chest_openings rows.
  bonus_coins?: number;
  bonus_xp?: number;
  num_items?: number;
  // Patch 3.2 fields
  chest_key?: string;
  count?: number;
  paid_coins?: number;
  paid_diamonds?: number;
  refunded_coins?: number;
}

// ─── Rarity → icon mapping ────────────────────────────────────────────────────

const RARITY_ICON: Record<string, string> = {
  common:    'pack',
  uncommon:  'scroll',
  rare:      'gem',
  epic:      'wand',
  legendary: 'crown',
  mythic:    'star',
  unknown:   'chest',
};

// ─── ItemRevealCard ───────────────────────────────────────────────────────────

function ItemRevealCard({ item }: { item: { item_id?: string | null; item_name: string; rarity: string }; big?: boolean }) {
  const rs = RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common;
  const isEpicPlus = ['epic', 'legendary', 'mythic'].includes(item.rarity);
  const isLegendaryPlus = ['legendary', 'mythic'].includes(item.rarity);
  const iconId = RARITY_ICON[item.rarity] ?? 'pack';
  const { skinsByBaseId } = useEquippedSkins();
  const skinImage = item.item_id ? skinsByBaseId[item.item_id]?.visual_data?.image_url : null;

  return (
    <div
      className={[
        "chest-reveal-card",
        isEpicPlus ? "epic-plus" : "",
        isLegendaryPlus ? "legendary-plus" : "",
      ].filter(Boolean).join(" ")}
      style={{ ['--card-tone' as string]: rs.labelColor } as React.CSSProperties}
    >
      <div className="chest-reveal-card-icon">
        {skinImage ? (
          <img
            src={skinImage}
            alt={item.item_name}
            style={{ width: 52, height: 52, objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <GameIcon
            id={iconId}
            size={36}
            ringColor={rs.labelColor}
            fillColor={rs.labelColor}
            bgColor="transparent"
          />
        )}
      </div>
      <div className="chest-reveal-card-name">{item.item_name}</div>
      <span className="chest-reveal-card-rarity">{rs.label}</span>
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
  /** Patch 3.2: 1 or 10. 10x applies a 5% discount on the cost. */
  count?: number;
  /** Patch 4.3: when set, open as a free granted chest and consume the grant. */
  grantId?: string;
  onClose: (refreshCoins?: boolean) => void;
}

export function ChestOpening({ chestType, studentId, count = 1, grantId, onClose }: ChestOpeningProps) {
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

    // Patch 3.2: new RPC signature uses chest_key + count. Falls back to
    // the legacy signature if chest_key isn't set (older teacher chests).
    const chestKey = (chestType as ChestType & { chest_key?: string | null }).chest_key;
    let data: unknown = null;
    let error: { message?: string } | null = null;

    if (chestKey) {
      // Try v2 first; fall back to v1 only if PostgREST can't see v2
      // (older deploys missing the wrapper migration).
      let r = await supabaseStudent.rpc('open_chest_v2' as never, {
        p_chest_key: chestKey, p_count: grantId ? 1 : count, p_grant_id: grantId ?? null,
      });
      if (r.error && /not.found|does not exist|PGRST/i.test(r.error.message ?? '')) {
        r = await supabaseStudent.rpc('open_chest' as never, {
          p_chest_key: chestKey, p_count: grantId ? 1 : count, p_grant_id: grantId ?? null,
        });
      }
      data = r.data; error = r.error;
    } else {
      // Legacy chests (per-teacher, no chest_key) — keep old call working.
      const r = await supabaseStudent.rpc('open_chest' as never, {
        p_student_id: studentId, p_chest_type_id: chestType.id,
      });
      data = r.data; error = r.error;
    }

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

    // After opening animation, start revealing.
    // - Single open: per-item sequential reveal (drama).
    // - Multi-open (10x): faster cascade so the full grid lands in ~2.5s.
    const stagger = count > 1 ? 120 : 650;
    setTimeout(() => {
      setPhase('revealing');
      res.items.forEach((_, i) => {
        setTimeout(() => setRevealedIndex(i), i * stagger);
      });
      setTimeout(() => setPhase('summary'), res.items.length * stagger + 900);
    }, 1400);
  }, [phase, studentId, chestType.id, chestType, count]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)' }}
    >
      <style>{CHEST_CSS}</style>

      {/* Close X (only when safe to dismiss) */}
      {(phase === 'idle' || phase === 'appearing' || phase === 'summary') && (
        <button
          onClick={() => onClose(phase === 'summary')}
          className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white/90 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', zIndex: 10 }}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      )}

      {/* ─── Phases: appearing / idle / opening — same Solo-Leveling panel ── */}
      {(phase === 'appearing' || phase === 'idle' || phase === 'opening') && (
        <div
          className="chest-panel"
          style={{ ['--ch-tone' as string]: visual.labelColor } as React.CSSProperties}
        >
          <span className="chest-corner chest-corner-tl"><CornerOrnament /></span>
          <span className="chest-corner chest-corner-tr"><CornerOrnament /></span>
          <span className="chest-corner chest-corner-bl"><CornerOrnament /></span>
          <span className="chest-corner chest-corner-br"><CornerOrnament /></span>

          {/* Header */}
          <div className="chest-header">
            <span className="chest-header-icon" aria-hidden>!</span>
            <span className="chest-header-text">
              {phase === 'opening' ? 'ABRINDO...' : 'BAÚ ENCONTRADO'}
            </span>
          </div>

          <div className="chest-divider" />

          {/* Chest icon — floats normally, shakes during opening */}
          <div className="chest-art">
            <div className={`chest-art-icon ${phase === 'opening' ? 'shaking' : ''}`}>
              <ChestIcon
                size={148}
                ringColor={visual.labelColor}
                fillColor={visual.labelColor}
                bgColor={visual.bgColor}
              />
            </div>
            {phase === 'opening' && (
              <div
                className="chest-art-burst"
                style={{ ['--ch-tone' as string]: visual.labelColor } as React.CSSProperties}
              />
            )}
          </div>

          {/* Name in brackets */}
          <h2 className="chest-name">
            <span className="chest-bracket">[</span>
            {chestType.name}
            <span className="chest-bracket">]</span>
          </h2>

          {chestType.description && (
            <p className="chest-desc">{chestType.description}</p>
          )}

          {/* Tier + stock meta pills */}
          <div className="chest-meta">
            <span className="chest-meta-pill tier">
              ★ Tier {chestType.tier} · {visual.name}
            </span>
            {chestType.is_limited && chestType.stock !== null && chestType.stock !== undefined && (
              <span className="chest-meta-pill stock">
                {chestType.stock} restante{chestType.stock !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {errorMsg && <div className="chest-error">{errorMsg}</div>}

          {/* Open CTA — disabled while opening */}
          <button
            onClick={phase === 'idle' ? handleOpen : undefined}
            className="chest-cta"
            disabled={phase !== 'idle'}
            style={phase !== 'idle' ? { opacity: 0.7, cursor: 'wait' } : undefined}
          >
            {phase === 'opening' ? 'Sorteando…' : count > 1 ? `Abrir ${count}×` : 'Abrir Baú'}
          </button>
        </div>
      )}

      {/* ─── Revealing: items cascade in ────────────────────────────────────── */}
      {phase === 'revealing' && result && (
        <div className="flex flex-col items-center w-full">
          <div
            className="chest-header mb-4"
            style={{ ['--ch-tone' as string]: revealColor } as React.CSSProperties}
          >
            <span className="chest-header-icon" aria-hidden>!</span>
            <span className="chest-header-text">RECOMPENSAS</span>
          </div>
          <div className="chest-reveal-grid">
            {result.items.map((item, i) => (
              <div
                key={i}
                style={{
                  visibility: i <= revealedIndex ? 'visible' : 'hidden',
                  animation: i <= revealedIndex
                    ? 'chest-card-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both'
                    : 'none',
                }}
              >
                <ItemRevealCard item={item} />
              </div>
            ))}
          </div>

          {/* Background tint flash when revealing legendary+ */}
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

      {/* ─── Summary: final layout with continue ──────────────────────────── */}
      {phase === 'summary' && result && (
        <div
          className="chest-panel"
          style={{
            ['--ch-tone' as string]: revealColor,
            maxWidth: 'min(720px, calc(100vw - 32px))',
            width: 'min(720px, calc(100vw - 32px))',
          } as React.CSSProperties}
        >
          <span className="chest-corner chest-corner-tl"><CornerOrnament /></span>
          <span className="chest-corner chest-corner-tr"><CornerOrnament /></span>
          <span className="chest-corner chest-corner-bl"><CornerOrnament /></span>
          <span className="chest-corner chest-corner-br"><CornerOrnament /></span>

          {isEpicLoot && <GoldParticles color={revealColor} />}

          <div className="chest-header">
            <span className="chest-header-icon" aria-hidden>!</span>
            <span className="chest-header-text">
              {isEpicLoot ? 'Item Extraordinário!' : 'Baú Aberto!'}
            </span>
          </div>

          <div className="chest-divider" />

          <div className="chest-reveal-grid" style={{ padding: '8px 0' }}>
            {result.items.map((item, i) => (
              <ItemRevealCard key={i} item={item} />
            ))}
          </div>

          {((result.bonus_coins ?? 0) > 0 || (result.bonus_xp ?? 0) > 0 || (result.refunded_coins ?? 0) > 0) && (
            <div className="flex gap-5 justify-center my-3">
              {(result.refunded_coins ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#fbbf24' }}>
                  <GameIcon id="coin" size={16} /> +{result.refunded_coins} reembolso
                </div>
              )}
              {(result.bonus_coins ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#fbbf24' }}>
                  <GameIcon id="coin" size={16} /> +{result.bonus_coins} moedas
                </div>
              )}
              {(result.bonus_xp ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#67e8f9' }}>
                  <GameIcon id="star" size={16} /> +{result.bonus_xp} XP
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => onClose(true)}
            className="chest-cta"
            style={{ marginTop: 6 }}
          >
            <Check size={15} style={{ display: 'inline', marginRight: 8, verticalAlign: '-3px' }} />
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
