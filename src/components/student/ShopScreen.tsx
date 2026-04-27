import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, ArrowLeft, X, Star, Lock, CheckCircle, Zap, Package, Hammer } from "lucide-react";
import { GameIcon } from "@/components/icons/GameIcon";
import { ChestSection } from "@/components/student/ChestSection";
import { CraftPanel } from "@/components/student/CraftPanel";
import { CATEGORY_META, ATTRIBUTES } from "@/types";
import type { ShopItem, InventoryItem, Student, ItemCategory, ItemRarity } from "@/types";
import { toast } from "sonner";

// ─── Rarity ──────────────────────────────────────────────────────────────────

function getRarity(item: ShopItem): ItemRarity {
  if (item.rarity && item.rarity in RARITY) return item.rarity;
  if (item.cost >= 500) return "legendary";
  if (item.cost >= 300) return "epic";
  if (item.cost >= 150) return "rare";
  if (item.cost >= 50)  return "uncommon";
  return "common";
}

const RARITY = {
  common:    { label: "Comum",    color: "#9ca3af", glow: "rgba(156,163,175,0.35)", bg: "rgba(156,163,175,0.05)", bar: "#9ca3af" },
  uncommon:  { label: "Incomum",  color: "#4ade80", glow: "rgba(74,222,128,0.4)",  bg: "rgba(74,222,128,0.05)",  bar: "#4ade80" },
  rare:      { label: "Rara",     color: "#38bdf8", glow: "rgba(56,189,248,0.45)", bg: "rgba(56,189,248,0.06)",  bar: "#38bdf8" },
  epic:      { label: "Épica",    color: "#c084fc", glow: "rgba(192,132,252,0.5)", bg: "rgba(192,132,252,0.07)", bar: "#c084fc" },
  legendary: { label: "Lendária", color: "#f59e0b", glow: "rgba(245,158,11,0.6)",  bg: "rgba(245,158,11,0.08)",  bar: "#f59e0b" },
  mythic:    { label: "Mitica",    color: "#fb7185", glow: "rgba(251,113,133,0.7)", bg: "rgba(251,113,133,0.09)", bar: "#fb7185" },
  unknown:   { label: "???",       color: "#e5e7eb", glow: "rgba(255,255,255,0.85)", bg: "rgba(255,255,255,0.10)", bar: "#e5e7eb" },
} as const;

// ─── Injected CSS ─────────────────────────────────────────────────────────────

const SHOP_CSS = `
  @keyframes shop-ember {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.9; }
    50%  { transform: translateY(-120px) translateX(12px) scale(0.6); opacity: 0.5; }
    100% { transform: translateY(-220px) translateX(-8px) scale(0); opacity: 0; }
  }
  @keyframes shop-ember2 {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.7; }
    50%  { transform: translateY(-100px) translateX(-14px) scale(0.5); opacity: 0.3; }
    100% { transform: translateY(-200px) translateX(10px) scale(0); opacity: 0; }
  }
  @keyframes shop-title-pulse {
    0%, 100% { text-shadow: 0 0 18px rgba(245,158,11,0.5), 0 0 36px rgba(245,158,11,0.2); }
    50%       { text-shadow: 0 0 28px rgba(245,158,11,0.85), 0 0 60px rgba(245,158,11,0.4), 0 0 90px rgba(245,158,11,0.15); }
  }
  @keyframes shop-card-in {
    from { opacity: 0; transform: translateY(22px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shop-rune-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes shop-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes shop-sheet-in {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes shop-buy-flash {
    0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.8); }
    70%  { box-shadow: 0 0 0 18px rgba(245,158,11,0); }
    100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
  }
  @keyframes shop-orbit {
    from { transform: rotate(0deg) translateX(28px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
  }
  @keyframes shop-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes shop-scan {
    0%   { top: -10%; opacity: 0; }
    10%  { opacity: 0.25; }
    90%  { opacity: 0.25; }
    100% { top: 110%; opacity: 0; }
  }
  @keyframes shop-coin-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.35); }
    100% { transform: scale(1); }
  }
  @keyframes shop-bg-drift {
    0%   { transform: translate(0, 0); }
    50%  { transform: translate(-20px, -12px); }
    100% { transform: translate(0, 0); }
  }

  .shop-ember-particle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .shop-title-glow { animation: shop-title-pulse 3s ease-in-out infinite; }
  .shop-card-appear { animation: shop-card-in 0.38s cubic-bezier(0.22,1,0.36,1) both; }
  .shop-item-card {
    position: relative;
    border-radius: 14px;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s ease;
    overflow: hidden;
  }
  .shop-item-card:hover {
    transform: translateY(-4px) scale(1.018);
  }
  .shop-item-card .shop-scan-line {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    pointer-events: none; opacity: 0;
  }
  .shop-item-card:hover .shop-scan-line {
    animation: shop-scan 1.8s ease-in-out infinite;
  }
  .shop-buy-btn:not(:disabled):active {
    animation: shop-buy-flash 0.5s ease-out;
  }
  .shop-rune {
    animation: shop-rune-spin 8s linear infinite;
  }
  .shop-rune-ccw {
    animation: shop-rune-spin 12s linear infinite reverse;
  }
  .shop-float { animation: shop-float 3.2s ease-in-out infinite; }
  .shop-shimmer-text {
    background: linear-gradient(90deg, #f59e0b 0%, #fde68a 40%, #f59e0b 60%, #f59e0b 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shop-shimmer 2.5s linear infinite;
  }
  .shop-cat-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 999px;
    font-family: 'Exo 2', sans-serif; font-size: 13px; font-weight: 600;
    letter-spacing: 0.04em; text-transform: uppercase;
    transition: all 0.18s ease; cursor: pointer; border: none;
    white-space: nowrap;
  }
  .shop-cat-btn.active {
    background: rgba(245,158,11,0.18);
    color: #f59e0b;
    box-shadow: 0 0 0 1px rgba(245,158,11,0.35), 0 0 16px rgba(245,158,11,0.15);
  }
  .shop-cat-btn:not(.active) {
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.45);
  }
  .shop-cat-btn:not(.active):hover {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.75);
  }
  .shop-tab-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 8px; cursor: pointer; border: none;
    font-family: 'Exo 2', sans-serif; font-size: 13px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    transition: all 0.18s ease;
    position: relative;
  }
  .shop-tab-btn.active {
    color: #f59e0b;
    background: rgba(245,158,11,0.08);
  }
  .shop-tab-btn.active::after {
    content: ''; position: absolute; bottom: 0; left: 15%; right: 15%; height: 2px;
    background: linear-gradient(90deg, transparent, #f59e0b, transparent);
    border-radius: 99px;
  }
  .shop-tab-btn:not(.active) {
    color: rgba(255,255,255,0.35);
    background: transparent;
  }
  .shop-tab-btn:not(.active):hover {
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.04);
  }
  .shop-detail-sheet {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 60;
    animation: shop-sheet-in 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
`;

// ─── Floating ember particles (CSS only) ─────────────────────────────────────

const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 7.3) % 85}%`,
  bottom: `${2 + (i * 11) % 18}%`,
  size: 3 + (i % 3) * 1.5,
  delay: `${(i * 0.7) % 4}s`,
  duration: `${3.5 + (i * 0.4) % 2.5}s`,
  color: i % 4 === 0 ? '#c084fc' : i % 3 === 0 ? '#38bdf8' : i % 2 === 0 ? '#fbbf24' : '#f97316',
  anim: i % 2 === 0 ? 'shop-ember' : 'shop-ember2',
}));

// ─── Category config ──────────────────────────────────────────────────────────

type ShopTab = 'loja' | 'baus' | 'forja';
type RarityFilter = ItemRarity | 'all';

const CATEGORIES: { key: ItemCategory | 'all'; label: string; iconId: string }[] = [
  { key: 'all',        label: 'Todos',      iconId: 'store'  },
  { key: 'armamento',  label: 'Armamento',  iconId: 'sword'  },
  { key: 'armadura',   label: 'Armadura',   iconId: 'shield' },
  { key: 'utilizavel', label: 'Utilizável', iconId: 'potion' },
  { key: 'colecao',    label: 'Coleção',    iconId: 'star'   },
  { key: 'habilidade', label: 'Habilidade', iconId: 'wand'   },
  { key: 'token',      label: 'Token',      iconId: 'scroll' },
];

const RARITY_FILTERS: { key: RarityFilter; label: string }[] = [
  { key: 'all',       label: 'Todas' },
  { key: 'common',    label: 'Comum' },
  { key: 'uncommon',  label: 'Incomum' },
  { key: 'rare',      label: 'Rara' },
  { key: 'epic',      label: 'Epica' },
  { key: 'legendary', label: 'Lendaria' },
  { key: 'mythic',    label: 'Mitica' },
  { key: 'unknown',   label: '???' },
];

function formatPrice(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShopScreenProps {
  items: ShopItem[];
  inventory: InventoryItem[];
  student: Student;
  onPurchase: (item: ShopItem) => Promise<void>;
  onPurchaseWithDiamonds: (item: ShopItem) => Promise<void>;
  onCoinsChanged: () => void;
  onBack: () => void;
}

// ─── ItemDetailSheet ─────────────────────────────────────────────────────────

function ItemDetailSheet({
  item,
  owned,
  cantAfford,
  cantAffordDiamonds,
  belowLevel,
  buying,
  buyingWithDiamonds,
  onBuy,
  onBuyWithDiamonds,
  onClose,
}: {
  item: ShopItem;
  owned: boolean;
  cantAfford: boolean;
  cantAffordDiamonds: boolean;
  belowLevel: boolean;
  buying: boolean;
  buyingWithDiamonds: boolean;
  onBuy: () => void;
  onBuyWithDiamonds: () => void;
  onClose: () => void;
}) {
  const rarity = getRarity(item);
  const r = RARITY[rarity];
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.colecao;
  const activeAttrs = ATTRIBUTES.filter(a => (item[a.key] ?? 0) > 0);
  const locked = belowLevel || (owned && item.category !== 'token');
  const hasDiamondOption = (item.diamond_cost ?? 0) > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="shop-detail-sheet"
        style={{
          background: `linear-gradient(180deg, rgba(8,5,14,0.98) 0%, rgba(12,8,20,0.99) 100%)`,
          borderTop: `2px solid ${r.color}`,
          boxShadow: `0 -24px 80px ${r.glow}, 0 -4px 20px rgba(0,0,0,0.8)`,
          padding: '0',
          maxHeight: '62vh',
        }}
      >
        {/* Rarity glow strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${r.color}80, transparent)`,
        }} />

        <div style={{ padding: '20px 24px 28px' }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '4px 8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: "'Exo 2', sans-serif", fontSize: 12,
            }}
          >
            <X size={13} /> Fechar
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 22, alignItems: 'start' }}>
            {/* Left: Image */}
            <div>
              <div
                className="shop-float"
                style={{
                  width: 150, height: 150, borderRadius: 16,
                  background: `radial-gradient(circle at 50% 60%, ${r.bg} 0%, rgba(8,5,14,0.6) 100%)`,
                  border: `1px solid ${r.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: `0 0 30px ${r.glow}`,
                  position: 'relative',
                }}
              >
                {/* Rune ring */}
                <svg
                  className="shop-rune"
                  width="100" height="100"
                  viewBox="0 0 100 100"
                  background: `radial-gradient(circle at 50% 60%, ${r.bg} 0%, rgba(8,5,14,0.6) 100%)`,
                  border: `1px solid ${r.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: `0 0 30px ${r.glow}`,
                  position: 'relative',
                }}
              >
                {/* Rune ring */}
                <svg
                  className="shop-rune"
                  width="100" height="100"
                  viewBox="0 0 100 100"
                  style={{ position: 'absolute', opacity: 0.18 }}
                >
                  <circle cx="50" cy="50" r="44" fill="none" stroke={r.color} strokeWidth="0.8" strokeDasharray="4 6" />
                  <circle cx="50" cy="50" r="36" fill="none" stroke={r.color} strokeWidth="0.5" strokeDasharray="2 8" />
                </svg>
                {item.image_url ? (
                  <div style={{ position: 'relative', zIndex: 1, width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={item.image_url} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.6))', borderRadius: 8 }} />
                  </div>
                ) : (
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <GameIcon id={meta.iconId} size={52} />
                  </div>
                )}
              </div>

              {/* Rarity badge */}
              <div style={{
                marginTop: 8, textAlign: 'center',
                fontFamily: "'Exo 2', sans-serif", fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: r.color, textShadow: `0 0 8px ${r.glow}`,
              }}>
                ✦ {r.label} ✦
              </div>
            </div>

            {/* Right: Info */}
            <div>
              {/* Category badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 99,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: "'Exo 2', sans-serif", fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase',
                marginBottom: 6,
              }}>
                <GameIcon id={meta.iconId} size={11} /> {meta.label}
                {item.min_level > 1 && (
                  <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.3)' }}>· Nv. {item.min_level}+</span>
                )}
              </div>

              {/* Item name */}
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700,
                color: '#fff', lineHeight: 1.2, marginBottom: 8,
                textShadow: `0 0 16px ${r.glow}`,
              }}>
                {item.name}
              </div>

              {/* Description */}
              {item.description && (
                <p style={{
                  fontFamily: "'Exo 2', sans-serif", fontSize: 13,
                  color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, marginBottom: 10,
                }}>
                  {item.description}
                </p>
              )}

              {/* Attributes */}
              {activeAttrs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {activeAttrs.map(a => (
                    <span key={a.key} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 8,
                      background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.18)',
                      fontFamily: "'Share Tech Mono', monospace", fontSize: 12,
                      color: '#67e8f9',
                    }}>
                      <GameIcon id={a.iconId} size={12} /> +{item[a.key]}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer: price + buttons */}
              {owned && item.category !== 'token' ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                  padding: '10px 20px', borderRadius: 10,
                  background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
                  fontFamily: "'Exo 2', sans-serif", fontSize: 13, fontWeight: 700,
                  color: '#67e8f9', letterSpacing: '0.06em', alignSelf: 'flex-start',
                }}>
                  <CheckCircle size={15} /> Adquirido
                </div>
              ) : belowLevel ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                  padding: '10px 20px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  fontFamily: "'Exo 2', sans-serif", fontSize: 13, fontWeight: 600,
                  color: 'rgba(239,68,68,0.7)', alignSelf: 'flex-start',
                }}>
                  <Lock size={13} /> Nível {item.min_level} necessário
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {/* Coins button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontFamily: "'Share Tech Mono', monospace", fontSize: 20, fontWeight: 700,
                      color: '#f59e0b', minWidth: 90,
                    }}>
                      <GameIcon id="coin" size={18} />
                      {item.cost.toLocaleString()}
                    </div>
                    <button
                      className="shop-buy-btn"
                      disabled={cantAfford || buying || buyingWithDiamonds}
                      onClick={onBuy}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 20px', borderRadius: 10, cursor: cantAfford ? 'not-allowed' : 'pointer',
                        background: cantAfford ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${r.color}22, ${r.color}40)`,
                        border: `1px solid ${cantAfford ? 'rgba(255,255,255,0.08)' : r.color + '60'}`,
                        boxShadow: cantAfford ? 'none' : `0 0 20px ${r.glow}`,
                        fontFamily: "'Exo 2', sans-serif", fontSize: 13, fontWeight: 800,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: cantAfford ? 'rgba(255,255,255,0.2)' : r.color,
                        transition: 'all 0.2s ease', opacity: cantAfford ? 0.5 : 1,
                      }}
                    >
                      {buying ? (
                        <><Loader2 size={14} className="animate-spin" /> Comprando...</>
                      ) : cantAfford ? (
                        <>Moedas insuficientes</>
                      ) : (
                        <><Zap size={14} /> Comprar</>
                      )}
                    </button>
                  </div>

                  {/* Diamond button (only if item has diamond price) */}
                  {hasDiamondOption && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: "'Share Tech Mono', monospace", fontSize: 20, fontWeight: 700,
                        color: '#63b3ed', minWidth: 90,
                      }}>
                        <GameIcon id="gem" size={18} />
                        {formatPrice(item.diamond_cost)}
                      </div>
                      <button
                        disabled={cantAffordDiamonds || buyingWithDiamonds || buying}
                        onClick={onBuyWithDiamonds}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 20px', borderRadius: 10, cursor: cantAffordDiamonds ? 'not-allowed' : 'pointer',
                          background: cantAffordDiamonds ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, rgba(99,179,237,0.15), rgba(99,179,237,0.3))',
                          border: `1px solid ${cantAffordDiamonds ? 'rgba(255,255,255,0.08)' : 'rgba(99,179,237,0.5)'}`,
                          boxShadow: cantAffordDiamonds ? 'none' : '0 0 20px rgba(99,179,237,0.3)',
                          fontFamily: "'Exo 2', sans-serif", fontSize: 13, fontWeight: 800,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: cantAffordDiamonds ? 'rgba(255,255,255,0.2)' : '#63b3ed',
                          transition: 'all 0.2s ease', opacity: cantAffordDiamonds ? 0.5 : 1,
                        }}
                      >
                        {buyingWithDiamonds ? (
                          <><Loader2 size={14} className="animate-spin" /> Comprando...</>
                        ) : cantAffordDiamonds ? (
                          <>Diamantes insuficientes</>
                        ) : (
                          <><GameIcon id="gem" size={14} /> Comprar com diamantes</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ItemCard ─────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  owned,
  cantAfford,
  belowLevel,
  index,
  onClick,
}: {
  item: ShopItem;
  owned: boolean;
  cantAfford: boolean;
  belowLevel: boolean;
  index: number;
  onClick: () => void;
}) {
  const rarity = getRarity(item);
  const r = RARITY[rarity];
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.colecao;
  const activeAttrs = ATTRIBUTES.filter(a => (item[a.key] ?? 0) > 0);

  const statusLabel = owned && item.category !== 'token'
    ? { text: 'Adquirido', color: '#67e8f9' }
    : belowLevel
    ? { text: `Nv. ${item.min_level}+`, color: 'rgba(239,68,68,0.7)' }
    : cantAfford
    ? { text: 'Sem moedas', color: 'rgba(156,163,175,0.5)' }
    : null;

  return (
    <div
      className="shop-item-card shop-card-appear"
      style={{
        animationDelay: `${index * 0.045}s`,
        background: `linear-gradient(160deg, ${r.bg} 0%, rgba(8,5,14,0.6) 100%)`,
        border: `1px solid ${r.color}28`,
        boxShadow: `inset 0 0 0 0 transparent`,
        opacity: belowLevel ? 0.65 : 1,
      }}
      onClick={onClick}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${r.glow}, 0 0 0 1px ${r.color}40`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
    >
      {/* Scan line effect */}
      <div className="shop-scan-line" />

      {/* Rarity left bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, transparent, ${r.color}, transparent)`,
        borderRadius: '14px 0 0 14px',
      }} />

      {/* Image area */}
      <div style={{
        height: 156, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: `radial-gradient(ellipse at 50% 80%, ${r.color}12 0%, transparent 70%)`,
        borderRadius: '14px 14px 0 0',
      }}>
        {/* Rune circle (shows on hover via opacity) */}
        <svg width="118" height="118" viewBox="0 0 80 80"

        {/* Owned overlay */}
        {owned && item.category !== 'token' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)', borderRadius: '14px 14px 0 0',
          }}>
            <CheckCircle size={28} style={{ color: '#67e8f9', opacity: 0.9 }} />
          </div>
        )}

        {/* Locked overlay */}
        {belowLevel && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', borderRadius: '14px 14px 0 0',
          }}>
            <Lock size={24} style={{ color: 'rgba(239,68,68,0.7)' }} />
          </div>
        )}

        {/* Rarity top-right tag */}
        <div style={{
          position: 'absolute', top: 7, right: 8,
          fontFamily: "'Exo 2', sans-serif", fontSize: 9, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: r.color, textShadow: `0 0 6px ${r.glow}`,
          background: `${r.color}15`, padding: '2px 6px', borderRadius: 6,
          border: `1px solid ${r.color}30`,
        }}>
          {r.label}
        </div>
      </div>

      {/* Info area */}
      <div style={{ padding: '10px 14px 12px' }}>
        {/* Category + name */}
        <div style={{
          fontFamily: "'Exo 2', sans-serif", fontSize: 10, fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)', marginBottom: 3,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <GameIcon id={meta.iconId} size={10} /> {meta.label}
        </div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 600,
          color: '#fff', lineHeight: 1.25, marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>

        {/* Attr badges (max 3) */}
        {activeAttrs.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {activeAttrs.slice(0, 3).map(a => (
              <span key={a.key} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '2px 7px', borderRadius: 6,
                background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.15)',
                fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                color: '#67e8f9',
              }}>
                <GameIcon id={a.iconId} size={10} /> +{item[a.key]}
              </span>
            ))}
          </div>
        )}

        {/* Price row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: "'Share Tech Mono', monospace", fontSize: 15, fontWeight: 700,
              color: '#f59e0b',
            }}>
              <GameIcon id="coin" size={14} /> {item.cost}
            </div>
            {(item.diamond_cost ?? 0) > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: "'Share Tech Mono', monospace", fontSize: 12, fontWeight: 700,
                color: '#63b3ed',
              }}>
                <GameIcon id="gem" size={12} /> {formatPrice(item.diamond_cost)}
              </div>
            )}
          </div>

          {statusLabel ? (
            <span style={{
              fontFamily: "'Exo 2', sans-serif", fontSize: 10, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: statusLabel.color,
            }}>
              {statusLabel.text}
            </span>
          ) : (
            <span style={{
              fontFamily: "'Exo 2', sans-serif", fontSize: 10, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: r.color, textShadow: `0 0 8px ${r.glow}`,
            }}>
              Ver item →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ShopScreen ──────────────────────────────────────────────────────────

export function ShopScreen({ items, inventory, student, onPurchase, onPurchaseWithDiamonds, onCoinsChanged, onBack }: ShopScreenProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>('loja');
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'all'>('all');
  const [activeRarity, setActiveRarity] = useState<RarityFilter>('all');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyingWithDiamonds, setBuyingWithDiamonds] = useState(false);

  const ownedItemIds = new Set(inventory.map(i => i.item_id));

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesRarity = activeRarity === 'all' || getRarity(item) === activeRarity;
    return matchesCategory && matchesRarity;
  });

  const handleBuy = useCallback(async () => {
    if (!selectedItem) return;
    setBuying(true);
    try {
      await onPurchase(selectedItem);
      setSelectedItem(null);
    } finally {
      setBuying(false);
    }
  }, [selectedItem, onPurchase]);

  const handleBuyWithDiamonds = useCallback(async () => {
    if (!selectedItem) return;
    setBuyingWithDiamonds(true);
    try {
      await onPurchaseWithDiamonds(selectedItem);
      setSelectedItem(null);
    } finally {
      setBuyingWithDiamonds(false);
    }
  }, [selectedItem, onPurchaseWithDiamonds]);

  // Close detail on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedItem(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 40,
        background: '#060309',
        fontFamily: "'Exo 2', sans-serif",
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Injected CSS */}
      <style>{SHOP_CSS}</style>

      {/* ── Background layers ── */}
      {/* Aurora bleed from top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 280,
        background: 'radial-gradient(ellipse at 30% -10%, rgba(124,58,237,0.18) 0%, transparent 60%), radial-gradient(ellipse at 70% -5%, rgba(245,158,11,0.12) 0%, transparent 55%)',
        pointerEvents: 'none', zIndex: 0,
        animation: 'shop-bg-drift 12s ease-in-out infinite',
      }} />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: `
          linear-gradient(rgba(245,158,11,0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.8) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />
      {/* Bottom fog */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
        background: 'linear-gradient(0deg, rgba(124,58,237,0.08) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Ember particles */}
      {EMBERS.map(e => (
        <div
          key={e.id}
          className="shop-ember-particle"
          style={{
            left: e.left, bottom: e.bottom,
            width: e.size, height: e.size,
            background: e.color,
            boxShadow: `0 0 ${e.size * 3}px ${e.color}`,
            animation: `${e.anim} ${e.duration} ${e.delay} ease-out infinite`,
          }}
        />
      ))}

      {/* ── Header ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center',
        padding: '14px 20px',
        background: 'rgba(6,3,9,0.92)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        backdropFilter: 'blur(16px)',
        flexShrink: 0,
      }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontFamily: "'Exo 2', sans-serif", fontSize: 12, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f59e0b'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,158,11,0.3)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <ArrowLeft size={13} /> HUB
        </button>

        {/* Centered title */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Ornamental line */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 1,
          }}>
            <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5))' }} />
            <Star size={8} style={{ color: '#f59e0b', opacity: 0.6 }} />
            <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, rgba(245,158,11,0.5), transparent)' }} />
          </div>
          <h1
            className="shop-title-glow"
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 'clamp(14px, 2.5vw, 20px)',
              fontWeight: 700,
              letterSpacing: '0.25em',
              color: '#f59e0b',
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            EMPÓRIO ARCANO
          </h1>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 1,
          }}>
            <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5))' }} />
            <Star size={8} style={{ color: '#f59e0b', opacity: 0.6 }} />
            <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, rgba(245,158,11,0.5), transparent)' }} />
          </div>
        </div>

        {/* Coins */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10, padding: '6px 14px',
        }}>
          <GameIcon id="coin" size={16} />
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 16, fontWeight: 700, color: '#f59e0b',
          }}>
            {student.coins >= 1000 ? `${(student.coins / 1000).toFixed(1)}k` : student.coins}
          </span>
        </div>

        {/* Diamonds */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(99,179,237,0.08)',
          border: '1px solid rgba(99,179,237,0.25)',
          borderRadius: 10, padding: '6px 14px',
        }} title="Diamantes — conquistados em sala de aula">
          <GameIcon id="gem" size={16} />
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 16, fontWeight: 700, color: '#63b3ed',
          }}>
            {formatPrice(student.diamonds ?? 0)}
          </span>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex',
        background: 'rgba(6,3,9,0.88)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {([
          { key: 'loja',  label: 'Loja',  icon: <GameIcon id="store" size={14} /> },
          { key: 'baus',  label: 'Baús',  icon: <GameIcon id="chest" size={14} /> },
          { key: 'forja', label: 'Forja', icon: <Hammer size={13} /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            className={`shop-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5,
        overflowX: 'hidden',
      }}>

        {/* ── LOJA TAB ── */}
        {activeTab === 'loja' && (
          <div>
            {/* Category filter */}
            <div style={{
              display: 'flex', gap: 8, padding: '14px 20px 12px',
              overflowX: 'auto', flexShrink: 0,
              background: 'rgba(6,3,9,0.7)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              position: 'sticky', top: 0, zIndex: 4,
              backdropFilter: 'blur(12px)',
            }}>
              {CATEGORIES.map(cat => {
                const count = cat.key === 'all'
                  ? items.length
                  : items.filter(i => i.category === cat.key).length;
                if (count === 0 && cat.key !== 'all') return null;
                return (
                  <button
                    key={cat.key}
                    className={`shop-cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.key)}
                  >
                    <GameIcon id={cat.iconId} size={13} />
                    {cat.label}
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: activeCategory === cat.key ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.06)',
                      fontSize: 10, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace",
                      color: activeCategory === cat.key ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rarity filter */}
            <div style={{
              display: 'flex', gap: 8, padding: '10px 20px 12px',
              overflowX: 'auto', flexShrink: 0,
              background: 'rgba(6,3,9,0.58)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              position: 'sticky', top: 52, zIndex: 3,
              backdropFilter: 'blur(12px)',
            }}>
              {RARITY_FILTERS.map(filter => {
                const count = items.filter(item => {
                  const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
                  const matchesRarity = filter.key === 'all' || getRarity(item) === filter.key;
                  return matchesCategory && matchesRarity;
                }).length;
                if (count === 0 && filter.key !== 'all') return null;
                const active = activeRarity === filter.key;
                const tone = filter.key === 'all' ? '#f59e0b' : RARITY[filter.key].color;
                return (
                  <button
                    key={filter.key}
                    className={`shop-cat-btn ${active ? 'active' : ''}`}
                    onClick={() => setActiveRarity(filter.key)}
                    style={{
                      borderColor: active ? `${tone}80` : undefined,
                      color: active ? tone : undefined,
                    }}
                  >
                    {filter.label}
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: active ? `${tone}25` : 'rgba(255,255,255,0.06)',
                      fontSize: 10, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace",
                      color: active ? tone : 'rgba(255,255,255,0.3)',
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Item grid */}
            <div style={{ padding: '20px 20px 80px' }}>
              {filteredItems.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '80px 20px',
                  color: 'rgba(255,255,255,0.25)',
                  fontFamily: "'Cinzel', serif", fontSize: 15, letterSpacing: '0.1em',
                }}>
                  <div style={{ marginBottom: 16, opacity: 0.4 }}>
                    <GameIcon id="store" size={52} />
                  </div>
                  <p>Nenhum item nesta categoria.</p>
                  <p style={{ fontSize: 12, marginTop: 6, fontFamily: "'Exo 2', sans-serif", fontWeight: 400 }}>
                    O mestre ainda não colocou itens à venda.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
                  gap: 16,
                }}>
                  {filteredItems.map((item, idx) => {
                    const owned = ownedItemIds.has(item.id);
                    const cantAfford = student.coins < item.cost;
                    const belowLevel = student.level < item.min_level;
                    return (
                      <ItemCard
                        key={item.id}
                        item={item}
                        owned={owned}
                        cantAfford={cantAfford}
                        belowLevel={belowLevel}
                        index={idx}
                        onClick={() => setSelectedItem(item)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BAÚS TAB ── */}
        {activeTab === 'baus' && (
          <div style={{ padding: '24px 20px 80px' }}>
            <ChestSection student={student} onCoinsChanged={onCoinsChanged} />
          </div>
        )}

        {/* ── FORJA TAB ── */}
        {activeTab === 'forja' && (
          <div style={{ padding: '24px 20px 80px' }}>
            <CraftPanel studentId={student.id} teacherId={student.teacher_id} onCoinsChanged={onCoinsChanged} />
          </div>
        )}
      </div>

      {/* ── Item Detail Sheet ── */}
      {selectedItem && (() => {
        const owned = ownedItemIds.has(selectedItem.id);
        const cantAfford = student.coins < selectedItem.cost;
        const cantAffordDiamonds = (student.diamonds ?? 0) < (selectedItem.diamond_cost ?? 0);
        const belowLevel = student.level < selectedItem.min_level;
        return (
          <ItemDetailSheet
            item={selectedItem}
            owned={owned}
            cantAfford={cantAfford}
            cantAffordDiamonds={cantAffordDiamonds}
            belowLevel={belowLevel}
            buying={buying}
            buyingWithDiamonds={buyingWithDiamonds}
            onBuy={handleBuy}
            onBuyWithDiamonds={handleBuyWithDiamonds}
            onClose={() => setSelectedItem(null)}
          />
        );
      })()}
    </div>
  );
}
