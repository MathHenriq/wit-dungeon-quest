import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, ArrowLeft, X, Star, Lock, CheckCircle, Zap, Package, Hammer, Gem, ArrowRightLeft, Info } from "lucide-react";
import { GameIcon } from "@/components/icons/GameIcon";
import { ChestSection } from "@/components/student/ChestSection";
import { CraftPanel } from "@/components/student/CraftPanel";
import { ForgePanel } from "@/components/student/ForgePanel";
import { CATEGORY_META, ATTRIBUTES } from "@/types";
import type { ShopItem, InventoryItem, Student, ItemCategory, ItemRarity } from "@/types";
import { toast } from "sonner";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { useEquippedSkins, resolveItemImage } from "@/hooks/useEquippedSkins";

// ─── Rarity ──────────────────────────────────────────────────────────────────

function getRarity(item: ShopItem): ItemRarity {
  // Prefer the explicit rarity column (set for all seeded items).
  if (item.rarity && item.rarity in RARITY) return item.rarity;
  // Fallback aligned with Patch 2.4 pricing curve.
  if (item.cost >= 4000) return "legendary";
  if (item.cost >= 1500) return "epic";
  if (item.cost >=  600) return "rare";
  if (item.cost >=  250) return "uncommon";
  return "common";
}

const RARITY = {
  common:    { label: "Comum",    color: "#c8d0d8", glow: "rgba(200,208,216,0.3)",  bg: "rgba(200,208,216,0.05)", bar: "#c8d0d8" },
  uncommon:  { label: "Incomum",  color: "#4ade80", glow: "rgba(74,222,128,0.35)", bg: "rgba(74,222,128,0.05)",  bar: "#4ade80" },
  rare:      { label: "Rara",     color: "#60c8f8", glow: "rgba(96,200,248,0.4)",  bg: "rgba(96,200,248,0.06)",  bar: "#60c8f8" },
  epic:      { label: "Épica",    color: "#b57bee", glow: "rgba(181,123,238,0.45)", bg: "rgba(181,123,238,0.07)", bar: "#b57bee" },
  legendary: { label: "Lendária", color: "#f5c84b", glow: "rgba(245,200,75,0.55)", bg: "rgba(245,200,75,0.08)",  bar: "#f5c84b" },
  mythic:    { label: "Mítica",   color: "#f05050", glow: "rgba(240,80,80,0.55)",  bg: "rgba(240,80,80,0.08)",   bar: "#f05050" },
  unknown:   { label: "???",      color: "#4b5563", glow: "rgba(75,85,99,0.5)",    bg: "rgba(75,85,99,0.08)",    bar: "#4b5563" },
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
  
  /* Greed Island Card Styles */
  .greed-card {
    position: relative;
    background: #fdfbf7;
    border: 4px solid #111;
    border-radius: 4px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 4px 6px 0px rgba(0,0,0,0.4);
    height: 100%;
  }
  .greed-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 6px 10px 0px rgba(0,0,0,0.5);
  }
  .greed-card.locked {
    filter: grayscale(0.7) brightness(0.8);
  }

  /* ── Arcane Card (compact, premium) ── */
  .arcane-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 1280px) { .arcane-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
  @media (max-width: 1020px) { .arcane-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  @media (max-width: 760px)  { .arcane-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; } }
  @media (max-width: 500px)  { .arcane-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } }

  .arcane-card {
    --rarity: #c8d0d8;
    --rarity-glow: rgba(200,208,216,0.3);
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    cursor: pointer;
    overflow: hidden;
    background: linear-gradient(180deg, #1a1028 0%, #07050c 100%);
    border: 3px solid var(--rarity);
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.8),
      0 10px 20px rgba(0,0,0,0.5);
    transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease;
    isolation: isolate;
  }
  .arcane-card::after {
    content: '';
    position: absolute; inset: -3px;
    border-radius: 12px;
    box-shadow: 0 0 18px var(--rarity-glow), 0 0 6px var(--rarity-glow);
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
    z-index: 2;
  }
  .arcane-card:hover {
    transform: translateY(-6px);
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.8),
      0 20px 36px rgba(0,0,0,0.6);
  }
  .arcane-card:hover::after { opacity: 1; }
  .arcane-card.locked { filter: grayscale(0.55) brightness(0.65); }

  .arcane-art {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background:
      radial-gradient(ellipse at 50% 40%, var(--rarity-glow) 0%, transparent 65%),
      linear-gradient(180deg, #1a1028 0%, #07050c 100%);
  }
  .arcane-art img {
    width: 100%; height: 100%;
    object-fit: contain;
    object-position: center center;
    transition: transform 0.55s cubic-bezier(0.22,1,0.36,1);
    filter: drop-shadow(0 4px 16px rgba(0,0,0,0.6));
  }
  .arcane-card:hover .arcane-art img { transform: scale(1.08); }
  .arcane-art-fallback {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    color: var(--rarity);
    opacity: 0.6;
  }
  .arcane-art-shade {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.7) 95%);
    pointer-events: none;
  }
  .arcane-art-tint {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 60%, var(--rarity-glow) 200%);
    mix-blend-mode: screen;
    opacity: 0.4;
    pointer-events: none;
  }

  .arcane-cost {
    position: absolute; top: 8px; left: 8px;
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 9px 4px 7px;
    background: rgba(8,4,14,0.85);
    border: 1px solid rgba(245,158,11,0.5);
    border-radius: 999px;
    backdrop-filter: blur(6px);
    color: #fbbf24;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px; font-weight: 700;
    z-index: 3;
  }
  .arcane-rarity-badge {
    position: absolute; top: 8px; right: 8px;
    padding: 3px 8px;
    background: rgba(8,4,14,0.85);
    border: 1px solid var(--rarity);
    color: var(--rarity);
    border-radius: 999px;
    backdrop-filter: blur(6px);
    font-family: 'Cinzel', serif;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    z-index: 3;
  }
  .arcane-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(2px);
    z-index: 3;
  }
  .arcane-overlay-icon {
    background: rgba(8,4,14,0.85);
    border: 2px solid currentColor;
    border-radius: 50%;
    width: 52px; height: 52px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 24px currentColor;
  }

  .arcane-attrs {
    position: absolute;
    left: 8px; right: 8px; bottom: 8px;
    display: flex; flex-wrap: wrap; gap: 4px;
    z-index: 3;
  }
  .arcane-attr {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 6px;
    background: rgba(8,4,14,0.78);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: #fde68a;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px; font-weight: 700;
    backdrop-filter: blur(6px);
  }

  .arcane-foot {
    padding: 10px 12px 11px;
    display: flex; flex-direction: column; gap: 4px;
    border-top: 1px solid rgba(255,255,255,0.06);
    background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.4));
  }
  .arcane-name {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    color: #f5f5f7;
    letter-spacing: 0.04em;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
  .arcane-meta {
    display: flex; align-items: center; justify-content: space-between;
    gap: 6px;
    font-family: 'Exo 2', sans-serif;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .arcane-cat {
    display: inline-flex; align-items: center; gap: 4px;
    color: rgba(255,255,255,0.42);
  }
  .arcane-status {
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .greed-header {
    display: flex;
    border: 3px solid #111;
    margin-bottom: 6px;
    background: #fdfbf7;
    height: 34px;
    border-radius: 2px;
  }
  .greed-header-left, .greed-header-right {
    flex: 0 0 46px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cinzel', serif;
    font-weight: 800;
    font-size: 14px;
    color: #111;
  }
  .greed-header-left {
    border-right: 3px solid #111;
  }
  .greed-header-right {
    border-left: 3px solid #111;
    font-size: 11px;
    flex-direction: column;
    line-height: 1;
  }
  .greed-header-center {
    flex: 1;
    display: flex; align-items: center; justify-content: center;
    text-align: center;
    font-family: 'Cinzel', serif;
    font-weight: 800;
    font-size: 12px;
    color: #111;
    padding: 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .greed-image-wrapper {
    border: 3px solid #111;
    background: #fff;
    padding: 4px;
    margin-bottom: 6px;
    border-radius: 2px;
  }
  .greed-image-container {
    width: 100%;
    height: 130px;
    background: #000;
    display: flex; justify-content: center; align-items: center;
    overflow: hidden;
    position: relative;
    border: 2px solid #111;
  }

  .greed-body-wrapper {
    flex: 1;
    padding: 6px;
    border: 3px solid #111;
    display: flex; flex-direction: column;
    border-radius: 2px;
  }
  .greed-body-inner {
    background: #f8f9fa;
    border: 2px solid #111;
    flex: 1;
    padding: 6px 8px;
    color: #111;
    font-family: 'Exo 2', sans-serif;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 0 8px rgba(0,0,0,0.05);
  }

  /* Sheet styles */
  .greed-sheet {
    position: fixed; inset: 0; z-index: 60;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: shop-card-in 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  .greed-sheet-content {
    background: #fdfbf7;
    border: 4px solid #111;
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    max-width: 600px;
    display: flex;
    gap: 24px;
    box-shadow: 8px 12px 0px rgba(0,0,0,0.6);
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
  }
  @media (max-width: 640px) {
    .greed-sheet-content {
      flex-direction: column;
      align-items: center;
    }
    .greed-sheet-content > div:first-child {
      width: 240px;
    }
  }
  
  .greed-buy-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px; border-radius: 4px; cursor: pointer;
    border: 3px solid #111;
    font-family: 'Exo 2', sans-serif; font-size: 14px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.05em;
    transition: all 0.15s ease;
    box-shadow: 3px 3px 0px #111;
    width: 100%;
  }
  .greed-buy-btn:not(:disabled):hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0px #111;
  }
  .greed-buy-btn:not(:disabled):active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0px #111;
  }
  .greed-buy-btn:disabled {
    opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none;
  }

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

type ShopTab = 'loja' | 'premium' | 'baus' | 'forja';
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

// Patch 2.4: Mítica and ??? are no longer sold by the shop — they drop
// only via chests. The filter pills for them were removed so they don't
// show up as "0 items" tabs. Items of those rarities are also stripped
// from the shop's visible item list (see filteredItems below).
const RARITY_FILTERS: { key: RarityFilter; label: string }[] = [
  { key: 'all',       label: 'Todas' },
  { key: 'common',    label: 'Comum' },
  { key: 'uncommon',  label: 'Incomum' },
  { key: 'rare',      label: 'Rara' },
  { key: 'epic',      label: 'Epica' },
  { key: 'legendary', label: 'Lendaria' },
];

const SHOP_HIDDEN_RARITIES: ReadonlySet<ItemRarity> = new Set(['mythic', 'unknown']);

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
  const { skinsByBaseId } = useEquippedSkins();
  const effectiveImage = resolveItemImage(item, skinsByBaseId);
  const locked = belowLevel || (owned && item.category !== 'token');
  const hasDiamondOption = (item.diamond_cost ?? 0) > 0;

  return (
    <div className="greed-sheet">
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="greed-sheet-content">
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: -16, right: -16,
            background: '#111', color: '#fff', border: '3px solid #fff',
            borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}
        >
          <X size={20} strokeWidth={3} />
        </button>

        {/* Left: The Card itself (scaled up) */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div className="greed-card" style={{ cursor: 'default', transform: 'none', boxShadow: 'none' }}>
            <div className="greed-header">
              <div className="greed-header-left">{item.cost}</div>
              <div className="greed-header-center" style={{ fontSize: 14 }}>{item.name}</div>
              <div className="greed-header-right">
                <span style={{ fontSize: 9 }}>{r.label.substring(0,3).toUpperCase()}</span>
                <span style={{ fontSize: 9 }}>{meta.label.substring(0,3).toUpperCase()}</span>
              </div>
            </div>

            <div className="greed-image-wrapper">
              <div className="greed-image-container" style={{ height: 220 }}>
                {effectiveImage ? (
                  <img src={effectiveImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ color: '#fff' }}>
                    <GameIcon id={meta.iconId} size={80} />
                  </div>
                )}
              </div>
            </div>

            <div className="greed-body-wrapper" style={{ background: r.color }}>
              <div className="greed-body-inner" style={{ fontSize: 13, minHeight: 120 }}>
                <div className="greed-body-desc">
                  {item.description ? item.description : "Uma carta valiosa e misteriosa..."}
                </div>
                
                <div className="greed-body-footer" style={{ marginTop: 12 }}>
                   {activeAttrs.map(a => (
                     <span key={a.key} style={{ fontWeight: 800, color: '#111', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                       <GameIcon id={a.iconId} size={12} /> +{item[a.key]} {a.label}
                     </span>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info and Purchase */}
        <div style={{ display: 'flex', flexDirection: 'column', color: '#111', fontFamily: "'Exo 2', sans-serif" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 800, margin: '0 0 16px', borderBottom: '2px solid #111', paddingBottom: 8 }}>
              {item.name}
            </h2>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ background: r.color, color: '#111', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', border: '2px solid #111' }}>
                {r.label}
              </div>
              <div style={{ background: '#111', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                <GameIcon id={meta.iconId} size={12} /> {meta.label}
              </div>
            </div>

            <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, opacity: 0.8, marginBottom: 24 }}>
              "Esta carta aguarda um mestre digno..."
            </p>

            {/* Requisitos / Status */}
            <div style={{ background: 'rgba(0,0,0,0.05)', border: '2px solid #111', padding: 12, borderRadius: 4, marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: '#666' }}>Status</div>
              {owned && item.category !== 'token' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 800 }}>
                  <CheckCircle size={18} /> Você já possui esta carta!
                </div>
              ) : belowLevel ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 800 }}>
                  <Lock size={18} /> Nível {item.min_level} necessário para usar.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#111', fontWeight: 800 }}>
                  Carta disponível para aquisição.
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
            <button
              className="greed-buy-btn"
              disabled={cantAfford || buying || buyingWithDiamonds || (owned && item.category !== 'token')}
              onClick={onBuy}
              style={{ background: '#f59e0b', color: '#111' }}
            >
              {buying ? (
                <><Loader2 size={16} className="animate-spin" /> Adquirindo...</>
              ) : (owned && item.category !== 'token') ? (
                "Adquirida"
              ) : (
                <>
                  <GameIcon id="coin" size={16} /> 
                  Comprar por {item.cost} Moedas
                </>
              )}
            </button>

            {hasDiamondOption && (
              <button
                className="greed-buy-btn"
                disabled={cantAffordDiamonds || buying || buyingWithDiamonds || (owned && item.category !== 'token')}
                onClick={onBuyWithDiamonds}
                style={{ background: '#63b3ed', color: '#111' }}
              >
                {buyingWithDiamonds ? (
                  <><Loader2 size={16} className="animate-spin" /> Adquirindo...</>
                ) : (
                  <>
                    <GameIcon id="gem" size={16} /> 
                    Comprar por {formatPrice(item.diamond_cost)} Diamantes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const { skinsByBaseId } = useEquippedSkins();
  const effectiveImage = resolveItemImage(item, skinsByBaseId);

  const statusLabel = owned && item.category !== 'token'
    ? { text: 'Adquirido', color: '#059669' }
    : belowLevel
    ? { text: `Nv. ${item.min_level}+`, color: '#dc2626' }
    : cantAfford
    ? { text: 'Sem moedas', color: '#6b7280' }
    : null;

  return (
    <div
      className={`arcane-card shop-card-appear ${belowLevel ? 'locked' : ''}`}
      style={{
        animationDelay: `${index * 0.045}s`,
        ['--rarity' as string]: r.color,
        ['--rarity-glow' as string]: r.glow,
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="arcane-art">
        {effectiveImage ? (
          <img src={effectiveImage} alt={item.name} />
        ) : (
          <div className="arcane-art-fallback">
            <GameIcon id={meta.iconId} size={64} />
          </div>
        )}
        <div className="arcane-art-tint" />
        <div className="arcane-art-shade" />

        <span className="arcane-cost">
          <GameIcon id="coin" size={11} />
          {item.cost}
        </span>
        <span className="arcane-rarity-badge">{r.label}</span>

        {activeAttrs.length > 0 && (
          <div className="arcane-attrs">
            {activeAttrs.slice(0, 3).map(a => (
              <span key={a.key} className="arcane-attr">
                <GameIcon id={a.iconId} size={10} />
                +{item[a.key]}
              </span>
            ))}
          </div>
        )}

        {owned && item.category !== 'token' && (
          <div className="arcane-overlay" style={{ color: '#4ade80' }}>
            <div className="arcane-overlay-icon"><CheckCircle size={26} /></div>
          </div>
        )}
        {belowLevel && (
          <div className="arcane-overlay" style={{ color: '#ef4444' }}>
            <div className="arcane-overlay-icon"><Lock size={24} /></div>
          </div>
        )}
      </div>

      <div className="arcane-foot">
        <div className="arcane-name" title={item.name}>{item.name}</div>
        <div className="arcane-meta">
          <span className="arcane-cat">
            <GameIcon id={meta.iconId} size={11} />
            {meta.label}
          </span>
          {statusLabel ? (
            <span className="arcane-status" style={{ color: statusLabel.color }}>
              {statusLabel.text}
            </span>
          ) : (
            <span className="arcane-status" style={{ color: r.color }}>
              Nv. {item.min_level}+
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
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertAmount, setConvertAmount] = useState<number>(1);
  const [converting, setConverting] = useState(false);

  const ownedItemIds = new Set(inventory.map(i => i.item_id));

  const filteredItems = items.filter(item => {
    // Patch 2.4: hide Mítica + ??? from the shop entirely (chest-only).
    // Patch 3.4: hide premium cards — they live in the Premium tab.
    if (item.is_premium) return false;
    if (SHOP_HIDDEN_RARITIES.has(getRarity(item))) return false;
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesRarity = activeRarity === 'all' || getRarity(item) === activeRarity;
    return matchesCategory && matchesRarity;
  });

  const premiumItems = items.filter(item => item.is_premium);

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

  const handleConvert = useCallback(async () => {
    const amount = Math.max(1, Math.floor(convertAmount));
    if (amount <= 0) return;
    if ((student.diamonds ?? 0) < amount) {
      toast.error("Diamantes insuficientes");
      return;
    }
    setConverting(true);
    try {
      const { data, error } = await supabaseStudent.rpc('convert_diamonds_to_coins', { p_amount: amount });
      if (error) {
        toast.error("Falha na conversão", { description: error.message });
        return;
      }
      const result = data as { success: boolean; error?: string; coins_gained?: number };
      if (!result?.success) {
        toast.error("Conversão não realizada", { description: result?.error ?? "Erro desconhecido" });
        return;
      }
      toast.success(`+${result.coins_gained} moedas`, { description: `${amount} diamante(s) convertido(s).` });
      setConvertOpen(false);
      setConvertAmount(1);
      onCoinsChanged();
    } finally {
      setConverting(false);
    }
  }, [convertAmount, student.diamonds, onCoinsChanged]);

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

        {/* Diamonds + convert */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(99,179,237,0.08)',
          border: '1px solid rgba(99,179,237,0.25)',
          borderRadius: 10, padding: '6px 8px 6px 14px', marginLeft: 8,
        }} title="Diamantes — vêm de atividades no GSA e prêmios. Convertem em moeda, mas perdem o status premium.">
          <GameIcon id="gem" size={16} />
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 16, fontWeight: 700, color: '#63b3ed',
          }}>
            {formatPrice(student.diamonds ?? 0)}
          </span>
          <button
            onClick={() => { setConvertAmount(1); setConvertOpen(true); }}
            disabled={(student.diamonds ?? 0) <= 0}
            title="Converter diamantes em moedas (1:5)"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginLeft: 4,
              padding: '3px 8px', borderRadius: 6,
              background: (student.diamonds ?? 0) > 0 ? 'rgba(99,179,237,0.18)' : 'rgba(99,179,237,0.06)',
              border: '1px solid rgba(99,179,237,0.35)',
              color: '#63b3ed', cursor: (student.diamonds ?? 0) > 0 ? 'pointer' : 'not-allowed',
              fontFamily: "'Exo 2', sans-serif", fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'all 0.15s ease',
              opacity: (student.diamonds ?? 0) > 0 ? 1 : 0.5,
            }}
          >
            <ArrowRightLeft size={11} /> 1:5
          </button>
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
          { key: 'loja',    label: 'Loja',    icon: <GameIcon id="store" size={14} /> },
          // Premium tab hidden (Wave B) — items stay in DB, just no UI for now.
          // { key: 'premium', label: 'Premium', icon: <Gem size={13} /> },
          { key: 'baus',    label: 'Baús',    icon: <GameIcon id="chest" size={14} /> },
          { key: 'forja',   label: 'Forja',   icon: <Hammer size={13} /> },
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
            {/* Patch 2.4: chest-only rarities notice */}
            <div style={{
              padding: '10px 20px',
              background: 'linear-gradient(90deg, rgba(240,80,80,0.05), rgba(75,85,99,0.05))',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10, letterSpacing: '1.5px',
              color: 'rgba(255,255,255,0.55)',
            }}>
              <span style={{
                padding: '2px 7px', borderRadius: 4,
                background: 'rgba(240,80,80,0.12)',
                border: '1px solid rgba(240,80,80,0.3)',
                color: '#f87171',
              }}>MITICA</span>
              <span style={{
                padding: '2px 7px', borderRadius: 4,
                background: 'rgba(75,85,99,0.18)',
                border: '1px solid rgba(120,120,120,0.4)',
                color: '#a8a8a8',
              }}>???</span>
              <span>agora apenas via baus</span>
              <span style={{ opacity: 0.4, marginLeft: 'auto' }}>chest_drop_only</span>
            </div>

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
                // Patch 2.4: exclude hidden rarities so category counts agree with the grid.
                const shopItems = items.filter(i => !SHOP_HIDDEN_RARITIES.has(getRarity(i)));
                const count = cat.key === 'all'
                  ? shopItems.length
                  : shopItems.filter(i => i.category === cat.key).length;
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
                  // Match the visibility rule used by filteredItems so the
                  // pill counts agree with what's actually displayed.
                  if (SHOP_HIDDEN_RARITIES.has(getRarity(item))) return false;
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
                <div className="arcane-grid">
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

        {/* ── PREMIUM TAB ── */}
        {activeTab === 'premium' && (
          <div style={{ padding: '20px 20px 80px' }}>
            {/* Intro card */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              background: 'linear-gradient(135deg, rgba(99,179,237,0.08), rgba(124,58,237,0.06))',
              border: '1px solid rgba(99,179,237,0.25)',
              borderRadius: 14, padding: '16px 18px', marginBottom: 24,
            }}>
              <div style={{
                flexShrink: 0, width: 38, height: 38, borderRadius: 10,
                background: 'rgba(99,179,237,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#63b3ed',
              }}>
                <Gem size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#cfe7ff', marginBottom: 6,
                }}>
                  Loja Premium
                </div>
                <div style={{
                  fontFamily: "'Exo 2', sans-serif", fontSize: 12.5, lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.65)',
                }}>
                  Cartas exclusivas e baús especiais comprados apenas com diamantes.
                  Diamantes vêm de atividades no GSA e prêmios. Você pode convertê-los
                  em moedas (1:5), mas perdem o status premium nessa troca.
                </div>
              </div>
            </div>

            {/* Premium cards grid */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
              fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
            }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,179,237,0.4))' }} />
              <span>Cartas Premium</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(99,179,237,0.4), transparent)' }} />
            </div>
            {premiumItems.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: "'Exo 2', sans-serif", fontSize: 13,
              }}>
                Nenhuma carta premium disponível no momento.
              </div>
            ) : (
              <div className="arcane-grid" style={{ marginBottom: 32 }}>
                {premiumItems.map((item, idx) => {
                  const owned = ownedItemIds.has(item.id);
                  const cantAfford = (student.diamonds ?? 0) < (item.diamond_cost ?? 0);
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

            {/* Premium chests */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
              fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
            }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,179,237,0.4))' }} />
              <span>Baús Premium</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(99,179,237,0.4), transparent)' }} />
            </div>
            <ChestSection student={student} onCoinsChanged={onCoinsChanged} diamondOnly />
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
            {/* Patch 3.3: materials-based forge first; legacy skill-tree craft below */}
            <ForgePanel />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />
            <CraftPanel studentId={student.id} teacherId={student.teacher_id} onCoinsChanged={onCoinsChanged} />
          </div>
        )}
      </div>

      {/* ── Diamond → Coin conversion modal ── */}
      {convertOpen && (() => {
        const ownedDiamonds = student.diamonds ?? 0;
        const amount = Math.max(1, Math.min(ownedDiamonds, Math.floor(convertAmount || 0)));
        const gainedCoins = amount * 5;
        const insufficient = ownedDiamonds < amount;
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 70,
            background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            animation: 'shop-card-in 0.25s cubic-bezier(0.22,1,0.36,1) both',
          }} onClick={() => !converting && setConvertOpen(false)}>
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%', maxWidth: 460,
                background: 'linear-gradient(180deg, #0c1220 0%, #060912 100%)',
                border: '1px solid rgba(99,179,237,0.35)',
                borderRadius: 16, padding: 24,
                boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(99,179,237,0.15)',
                color: '#e6f0ff',
                fontFamily: "'Exo 2', sans-serif",
              }}
            >
              <button
                onClick={() => setConvertOpen(false)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <ArrowRightLeft size={18} style={{ color: '#63b3ed' }} />
                <h2 style={{
                  margin: 0, fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#cfe7ff',
                }}>Converter Diamantes</h2>
              </div>
              <p style={{
                margin: '0 0 16px', fontSize: 12.5, lineHeight: 1.5,
                color: 'rgba(255,255,255,0.55)',
              }}>
                Cada diamante vira <strong style={{ color: '#fbbf24' }}>5 moedas</strong>.
                Conversão é <strong>permanente</strong>: você perde o status premium dos diamantes trocados.
              </p>

              {/* Wallet snapshot */}
              <div style={{
                display: 'flex', gap: 10, marginBottom: 18,
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
              }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GameIcon id="gem" size={14} />
                  <span style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Saldo</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'Share Tech Mono', monospace", color: '#63b3ed', fontWeight: 700 }}>
                    {ownedDiamonds}
                  </span>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GameIcon id="coin" size={14} />
                  <span style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Atuais</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'Share Tech Mono', monospace", color: '#f59e0b', fontWeight: 700 }}>
                    {student.coins}
                  </span>
                </div>
              </div>

              {/* Amount input */}
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                Quantidade de diamantes
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  type="number"
                  min={1}
                  max={ownedDiamonds}
                  value={convertAmount}
                  onChange={e => setConvertAmount(Math.max(1, Number(e.target.value) || 1))}
                  disabled={converting || ownedDiamonds <= 0}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(99,179,237,0.3)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#fff',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
                {[1, 5, 10].filter(n => n <= ownedDiamonds).map(n => (
                  <button
                    key={n}
                    onClick={() => setConvertAmount(n)}
                    disabled={converting}
                    style={{
                      padding: '0 12px', borderRadius: 8,
                      background: 'rgba(99,179,237,0.1)',
                      border: '1px solid rgba(99,179,237,0.3)',
                      color: '#63b3ed', cursor: 'pointer',
                      fontWeight: 700, fontSize: 12,
                    }}
                  >{n}</button>
                ))}
                {ownedDiamonds > 0 && (
                  <button
                    onClick={() => setConvertAmount(ownedDiamonds)}
                    disabled={converting}
                    style={{
                      padding: '0 12px', borderRadius: 8,
                      background: 'rgba(99,179,237,0.18)',
                      border: '1px solid rgba(99,179,237,0.4)',
                      color: '#cfe7ff', cursor: 'pointer',
                      fontWeight: 700, fontSize: 12,
                    }}
                  >Max</button>
                )}
              </div>

              {/* Preview */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: '14px 16px', marginBottom: 20,
                background: 'linear-gradient(90deg, rgba(99,179,237,0.08), rgba(245,158,11,0.08))',
                border: '1px solid rgba(245,158,11,0.18)',
                borderRadius: 10,
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#63b3ed', fontWeight: 700 }}>
                  <GameIcon id="gem" size={16} /> {amount}
                </span>
                <ArrowRightLeft size={14} style={{ opacity: 0.6 }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontWeight: 700, fontFamily: "'Share Tech Mono', monospace" }}>
                  <GameIcon id="coin" size={16} /> +{gainedCoins}
                </span>
              </div>

              <button
                onClick={handleConvert}
                disabled={converting || insufficient || ownedDiamonds <= 0}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  background: 'linear-gradient(90deg, #63b3ed, #f59e0b)',
                  border: 'none', color: '#0a0a14', cursor: converting ? 'wait' : 'pointer',
                  fontFamily: "'Exo 2', sans-serif", fontWeight: 800, fontSize: 14,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  opacity: (converting || insufficient || ownedDiamonds <= 0) ? 0.6 : 1,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                {converting ? (<><Loader2 size={14} className="animate-spin" /> Convertendo...</>) : 'Confirmar conversão'}
              </button>

              <p style={{
                margin: '12px 0 0', textAlign: 'center', fontSize: 11,
                color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em',
                display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center', width: '100%',
              }}>
                <Info size={11} /> Operação irreversível.
              </p>
            </div>
          </div>
        );
      })()}

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
