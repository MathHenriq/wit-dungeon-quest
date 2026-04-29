import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Edit3, Loader2, CheckCircle } from "lucide-react";
import { CharacterCustomization } from "@/components/CharacterCustomization";
import { GameIcon } from "@/components/icons/GameIcon";
import { Inventory } from "@/components/inventory/Inventory";
import type { Student, InventoryItem, StudentPet, StudentTitle, ShopItem } from "@/types";
import type { Ability, BattleCharacter } from "@/types/character";
import { ELEMENT_META, canUseAbility } from "@/types/character";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { toast } from "sonner";

// ─── Extended types ────────────────────────────────────────────────────────────
type InventoryItemX = InventoryItem & { is_equipped?: boolean; equipped_slot?: string };
type ShopItemX = ShopItem & { rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" };

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bgAbyss:      "#05080f",
  bgDeep:       "#080e1a",
  bgPanel:      "rgba(10,16,28,0.85)",
  bgSlot:       "rgba(8,12,22,0.9)",
  borderDim:    "rgba(80,120,180,0.15)",
  borderGlow:   "rgba(100,160,255,0.35)",
  borderActive: "rgba(120,200,255,0.6)",
  textPrimary:  "#ddeeff",
  textSecondary:"rgba(180,210,240,0.65)",
  textAccent:   "#7ecfff",
  textMuted:    "rgba(130,165,205,0.5)",
  blue:         "#4a9eff",
  cyan:         "#38d9e8",
  gold:         "#d4a853",
  purple:       "#9b6dff",
  legendary:    "#a855f7",
  rare:         "#3b82f6",
  common:       "#6b7280",
  exotic:       "#eab308",
};

const RARITY_COLOR: Record<string, string> = {
  common:    "#8b949e",
  uncommon:  "#3fb950",
  rare:      "#58a6ff",
  epic:      "#bc8cff",
  legendary: "#e3b341",
  mythic:    "#ff6e6e",
};

const RARITY_BG: Record<string, string> = {
  common:    "rgba(139,148,158,0.08)",
  uncommon:  "rgba(63,185,80,0.1)",
  rare:      "rgba(88,166,255,0.12)",
  epic:      "rgba(188,140,255,0.12)",
  legendary: "rgba(227,179,65,0.14)",
  mythic:    "rgba(255,110,110,0.12)",
};

const RARITY_LABEL: Record<string, string> = {
  common:    "COMUM",
  uncommon:  "INCOMUM",
  rare:      "RARO",
  epic:      "ÉPICO",
  legendary: "LENDÁRIO",
  mythic:    "MÍTICO",
};

const ATTR_META: { key: keyof Student; label: string; iconId: string; color: string; short: string }[] = [
  { key: "attr_forca",        label: "Força",        iconId: "sword",  color: "#ff7a4a", short: "FOR" },
  { key: "attr_destreza",     label: "Destreza",     iconId: "bow",    color: "#4ade80", short: "DES" },
  { key: "attr_inteligencia", label: "Inteligência", iconId: "wand",   color: "#a78bfa", short: "INT" },
  { key: "attr_carisma",      label: "Carisma",      iconId: "heart",  color: "#38d9e8", short: "CAR" },
  { key: "attr_agilidade",    label: "Agilidade",    iconId: "flame",  color: "#fbbf24", short: "AGI" },
  { key: "attr_resistencia",  label: "Resistência",  iconId: "shield", color: "#f87171", short: "RES" },
];

const SLOT_DEFS: { category: string; label: string; iconId: string; col: number; row: number; isCartaEspecial?: boolean }[] = [
  { category: "armamento",      label: "Armamento",     iconId: "sword",  col: 1, row: 1 },
  { category: "armadura",       label: "Armadura",      iconId: "shield", col: 2, row: 1 },
  { category: "carta_especial", label: "Carta Especial", iconId: "star",  col: 1, row: 2, isCartaEspecial: true },
];

/** Categories whose items count as "carta especial" for equipping purposes */
const CARTA_ESPECIAL_CATS = new Set(["colecao", "habilidade", "token", "utilizavel"]);

const TITLE_LABELS: Record<string, string> = {
  helper_of_week:    "AUXILIAR DA SEMANA",
  presence_guardian: "GUARDIÃO DE PRESENÇA",
  attitude_example:  "EXEMPLO DE ATITUDE",
};

const CLASS_COLOR: Record<string, string> = {
  Mago:       "#9b6dff",
  Arqueiro:   "#4ade80",
  Curandeiro: "#38d9e8",
  Guerreiro:  "#ff7a4a",
};

const MAX_ATTR = 25;
const FONT_ORB = "'Orbitron', sans-serif";
const FONT_RAJ = "'Rajdhani', sans-serif";
const FONT_MON = "'Share Tech Mono', monospace";

// ─── CSS ───────────────────────────────────────────────────────────────────────
const HERO_CSS = `
@keyframes hs-orbit-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
@keyframes hs-orbit-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
@keyframes hs-glow-pulse {
  0%, 100% { opacity: 0.45; transform: scale(1);   }
  50%       { opacity: 0.85; transform: scale(1.08); }
}
@keyframes hs-pet-float {
  0%, 100% { transform: translateY(0px);  }
  50%       { transform: translateY(-6px); }
}
@keyframes hs-bar-in {
  from { width: 0% !important; }
}
@keyframes hs-slide-left {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0);     }
}
@keyframes hs-slide-right {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0);    }
}
@keyframes hs-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes hs-xp-shine {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(400%);  }
}
@keyframes hs-power-flicker {
  0%, 93%, 100% { opacity: 1; }
  94%           { opacity: 0.55; }
  96%           { opacity: 0.85; }
}
@keyframes hs-photo-appear {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes hs-tile-in {
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes hs-skill-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(155,109,255,0); }
  50%       { box-shadow: 0 0 12px 3px rgba(155,109,255,0.35); }
}

.hs-equip-tile {
  position: relative;
  cursor: pointer;
  border-radius: 6px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  overflow: hidden;
  animation: hs-tile-in 0.35s ease both;
}
.hs-equip-tile:hover {
  transform: translateY(-3px) scale(1.03);
  z-index: 2;
}
.hs-equip-tile.empty:hover {
  opacity: 0.85;
}

.hs-attr-row {
  display: flex;
  align-items: center;
  gap: 10px;
  animation: hs-slide-right 0.4s ease both;
}

.hs-pet-float { animation: hs-pet-float 3s ease-in-out infinite; }
.hs-power-flicker { animation: hs-power-flicker 7s ease-in-out infinite; }
.hs-orbit-cw  { animation: hs-orbit-cw  60s linear infinite; }
.hs-orbit-ccw { animation: hs-orbit-ccw 45s linear infinite; }
.hs-glow-pulse{ animation: hs-glow-pulse 4s ease-in-out infinite; }

.hs-skill-badge {
  position: relative;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: flex; align-items: center; justify-content: center;
}
.hs-skill-badge:hover {
  transform: scale(1.1);
  animation: hs-skill-pulse 1s ease-in-out infinite;
}
.hs-skill-badge.active {
  animation: hs-skill-pulse 1.5s ease-in-out infinite;
}

.hs-action-panel {
  animation: hs-slide-up 0.2s cubic-bezier(0.22,1,0.36,1) both;
}
`;

// ─── Background ────────────────────────────────────────────────────────────────
function HeroBackground({ classColor }: { classColor: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse 700px 500px at 15% 40%, ${classColor}0d 0%, transparent 65%),
          radial-gradient(ellipse 500px 400px at 85% 65%, rgba(56,217,232,0.06) 0%, transparent 65%),
          radial-gradient(ellipse 400px 300px at 50% 95%, rgba(155,109,255,0.05) 0%, transparent 65%),
          linear-gradient(180deg, #03050c 0%, #05080f 100%)
        `,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(100,160,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100,160,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "56px 56px",
      }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
        <path d="M0,200 C200,100 400,300 600,150 C800,0 1000,250 1280,100" stroke="rgba(74,158,255,0.02)" strokeWidth="0.8" fill="none"/>
        <path d="M0,500 C300,380 600,580 900,420 C1100,300 1200,500 1280,380" stroke="rgba(56,217,232,0.018)" strokeWidth="0.8" fill="none"/>
      </svg>
    </div>
  );
}

// ─── Equipment Action Panel (rich hover panel) ─────────────────────────────────
function EquipActionPanel({
  inv,
  slotDef,
  anchorRect,
  isEquipped,
  onToggleEquip,
  toggling,
  allInvForSlot,
  onEquipItem,
  onMouseEnter,
  onMouseLeave,
}: {
  inv: InventoryItemX | null;
  slotDef: typeof SLOT_DEFS[0];
  anchorRect: DOMRect;
  isEquipped: boolean;
  onToggleEquip: () => void;
  toggling: boolean;
  allInvForSlot: InventoryItemX[];
  onEquipItem: (inv: InventoryItemX) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const item = inv?.item as ShopItemX | undefined;

  const rarity = item?.rarity ?? "common";
  const rc = RARITY_COLOR[rarity] ?? T.common;
  const rb = RARITY_BG[rarity] ?? "rgba(139,148,158,0.08)";
  const totalAttr = item ? (item.attr_forca??0)+(item.attr_destreza??0)+(item.attr_inteligencia??0)+(item.attr_carisma??0)+(item.attr_agilidade??0)+(item.attr_resistencia??0) : 0;

  // Position: appear to the right of the equipment panel, clamped to viewport
  const panelWidth = 300;
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  let left = anchorRect.right + 12;
  if (left + panelWidth > viewW) left = anchorRect.left - panelWidth - 12;
  left = Math.max(8, Math.min(left, viewW - panelWidth - 8));
  let top = anchorRect.top - 20;
  const estimatedH = item ? 460 : 120 + allInvForSlot.length * 52;
  if (top + estimatedH > viewH) top = Math.max(8, viewH - estimatedH - 8);

  const attrs = item ? [
    { label: "FOR", val: item.attr_forca ?? 0,        color: "#ff7a4a" },
    { label: "DES", val: item.attr_destreza ?? 0,     color: "#4ade80" },
    { label: "INT", val: item.attr_inteligencia ?? 0, color: "#a78bfa" },
    { label: "CAR", val: item.attr_carisma ?? 0,      color: "#38d9e8" },
    { label: "AGI", val: item.attr_agilidade ?? 0,    color: "#fbbf24" },
    { label: "RES", val: item.attr_resistencia ?? 0,  color: "#f87171" },
  ].filter(a => a.val > 0) : [];

  // Other items in the same slot category (to pick from)
  const otherItems = allInvForSlot.filter(i => i.id !== inv?.id);

  return (
    <div
      className="hs-action-panel"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed",
        top, left,
        width: panelWidth,
        zIndex: 9000,
        background: "rgba(6,10,20,0.97)",
        border: `1px solid ${item ? rc + "40" : T.borderDim}`,
        borderRadius: 10,
        overflow: "hidden",
        backdropFilter: "blur(24px)",
        boxShadow: `0 16px 48px rgba(0,0,0,0.8), 0 0 0 1px ${item ? rc + "20" : "rgba(60,100,160,0.1)"}`,
        pointerEvents: "auto",
        maxHeight: "80vh",
        display: "flex", flexDirection: "column",
      }}
    >
      {item ? (
        <>
          {/* Rarity top bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${rc}, transparent)`, flexShrink: 0 }} />

          {/* Header: equipped item */}
          <div style={{
            display: "flex", gap: 12, padding: "14px 16px 12px",
            borderBottom: `1px solid rgba(255,255,255,0.06)`,
            background: rb, flexShrink: 0,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 8, flexShrink: 0,
              background: `radial-gradient(circle, ${rc}18 0%, rgba(8,14,24,0.8) 100%)`,
              border: `2px solid ${rc}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} style={{ width: 52, height: 52, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <GameIcon id={slotDef.iconId} size={32} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_MON, fontSize: 9, color: rc, letterSpacing: "1.5px", marginBottom: 4, textTransform: "uppercase" }}>
                {RARITY_LABEL[rarity] ?? rarity} · {slotDef.label}
              </div>
              <div style={{ fontFamily: FONT_RAJ, fontSize: 16, fontWeight: 700, color: T.textPrimary, letterSpacing: "0.5px", lineHeight: 1.2, wordBreak: "break-word" }}>
                {item.name}
              </div>
              {totalAttr > 0 && (
                <div style={{ fontFamily: FONT_MON, fontSize: 11, color: T.cyan, marginTop: 4 }}>+{totalAttr} ATR TOTAL</div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div style={{ padding: "10px 16px 0", fontFamily: FONT_RAJ, fontSize: 13, color: T.textSecondary, lineHeight: 1.5, flexShrink: 0 }}>
              {item.description}
            </div>
          )}

          {/* Attribute bars */}
          {attrs.length > 0 && (
            <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              {attrs.map(a => (
                <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT_MON, fontSize: 9, color: T.textMuted, width: 28, letterSpacing: "1px" }}>{a.label}</span>
                  <div style={{ flex: 1, height: 5, background: "rgba(30,50,80,0.5)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((a.val / 15) * 100, 100)}%`, background: `linear-gradient(90deg, ${a.color}80, ${a.color})`, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: FONT_MON, fontSize: 12, color: a.color, width: 20, textAlign: "right" }}>{a.val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Equip / Unequip button */}
          <div style={{ padding: "10px 16px", borderTop: `1px solid rgba(255,255,255,0.06)`, pointerEvents: "all", flexShrink: 0 }} onMouseEnter={e => e.stopPropagation()}>
            <button
              onClick={e => { e.stopPropagation(); onToggleEquip(); }}
              disabled={toggling}
              style={{
                width: "100%", padding: "9px 0", borderRadius: 7, cursor: toggling ? "wait" : "pointer",
                background: isEquipped ? `linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.25))` : `linear-gradient(135deg, ${rc}20, ${rc}35)`,
                border: `1px solid ${isEquipped ? "rgba(239,68,68,0.4)" : rc + "60"}`,
                color: isEquipped ? "#f87171" : rc,
                fontFamily: FONT_ORB, fontSize: 11, fontWeight: 700, letterSpacing: "2px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              {toggling ? <Loader2 size={14} className="animate-spin" /> : isEquipped ? <><X size={14} /> Desequipar</> : <><CheckCircle size={14} /> Equipar</>}
            </button>
          </div>
        </>
      ) : (
        /* Empty slot header */
        <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${T.borderDim}`, flexShrink: 0 }}>
          <div style={{ fontFamily: FONT_MON, fontSize: 9, color: slotDef.isCartaEspecial ? T.gold : T.textMuted, letterSpacing: "1.5px", marginBottom: 4 }}>
            {slotDef.label.toUpperCase()} · VAZIO
          </div>
          <div style={{ fontFamily: FONT_RAJ, fontSize: 13, color: "rgba(120,150,190,0.5)" }}>
            {slotDef.isCartaEspecial
              ? "Escolha sua carta especial de batalha"
              : "Selecione um item abaixo para equipar"}
          </div>
        </div>
      )}

      {/* Available items for this slot */}
      {otherItems.length > 0 && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px 6px", fontFamily: FONT_MON, fontSize: 8, color: T.textMuted, letterSpacing: "1.5px", flexShrink: 0 }}>
            DISPONÍVEIS NESTE SLOT ({otherItems.length})
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 6, pointerEvents: "all" }}>
            {otherItems.map(oi => {
              const oItem = oi.item as ShopItemX | undefined;
              if (!oItem) return null;
              const or = oItem.rarity ?? "common";
              const orc = RARITY_COLOR[or] ?? T.common;
              const oAttr = (oItem.attr_forca??0)+(oItem.attr_destreza??0)+(oItem.attr_inteligencia??0)+(oItem.attr_carisma??0)+(oItem.attr_agilidade??0)+(oItem.attr_resistencia??0);
              return (
                <div
                  key={oi.id}
                  onClick={e => { e.stopPropagation(); onEquipItem(oi); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                    background: oi.is_equipped ? `${orc}12` : "rgba(8,14,24,0.7)",
                    border: `1px solid ${oi.is_equipped ? orc + "50" : "rgba(60,90,130,0.25)"}`,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = `${orc}18`; (e.currentTarget as HTMLDivElement).style.borderColor = orc + "60"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = oi.is_equipped ? `${orc}12` : "rgba(8,14,24,0.7)"; (e.currentTarget as HTMLDivElement).style.borderColor = oi.is_equipped ? orc + "50" : "rgba(60,90,130,0.25)"; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 5, flexShrink: 0,
                    background: `radial-gradient(circle, ${orc}15, rgba(8,14,24,0.8))`,
                    border: `1px solid ${orc}40`,
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  }}>
                    {oItem.image_url
                      ? <img src={oItem.image_url} alt={oItem.name} style={{ width: 28, height: 28, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <GameIcon id={slotDef.iconId} size={18} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_RAJ, fontSize: 13, fontWeight: 600, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {oItem.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: FONT_MON, fontSize: 8, color: orc, letterSpacing: "0.5px" }}>{RARITY_LABEL[or]?.slice(0,3)}</span>
                      {oAttr > 0 && <span style={{ fontFamily: FONT_MON, fontSize: 8, color: T.cyan }}>+{oAttr}</span>}
                    </div>
                  </div>
                  {oi.is_equipped && (
                    <div style={{ fontFamily: FONT_MON, fontSize: 7, color: orc, letterSpacing: "0.5px", background: `${orc}15`, border: `1px solid ${orc}35`, borderRadius: 3, padding: "2px 5px", flexShrink: 0 }}>
                      ATUAL
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Equipment Panel ───────────────────────────────────────────────────────────
function EquipmentPanel({
  inventory,
  classColor,
  studentId,
  onRefresh,
}: {
  inventory: InventoryItemX[];
  classColor: string;
  studentId: string;
  onRefresh: () => void;
}) {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [togglingCat, setTogglingCat] = useState<string | null>(null);
  const tileRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build equipped-by-category map
  // For carta_especial: any equipped item with ability_key from special categories
  const equippedByCategory = new Map<string, InventoryItemX>();
  for (const inv of inventory) {
    if (!inv.is_equipped || !inv.item) continue;
    const cat = inv.item.category as string;
    // Map special categories → virtual "carta_especial" slot
    if (CARTA_ESPECIAL_CATS.has(cat) && (inv.item as ShopItemX & { ability_key?: string }).ability_key) {
      if (!equippedByCategory.has("carta_especial")) equippedByCategory.set("carta_especial", inv);
    } else if (!equippedByCategory.has(cat)) {
      equippedByCategory.set(cat, inv);
    }
  }

  // All inventory items grouped by virtual slot (for slot picker)
  const inventoryByCategory = new Map<string, InventoryItemX[]>();
  for (const inv of inventory) {
    if (!inv.item) continue;
    const cat = inv.item.category as string;
    const shopItem = inv.item as ShopItemX & { ability_key?: string };
    // Items with ability_key from special categories go into carta_especial picker
    const virtualCat = CARTA_ESPECIAL_CATS.has(cat) && shopItem.ability_key
      ? "carta_especial"
      : cat;
    if (!inventoryByCategory.has(virtualCat)) inventoryByCategory.set(virtualCat, []);
    if (inv.is_equipped) inventoryByCategory.get(virtualCat)!.unshift(inv);
    else inventoryByCategory.get(virtualCat)!.push(inv);
  }

  const handleHover = useCallback((cat: string) => {
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null; }
    const el = tileRefs.current.get(cat);
    if (el) { setAnchorRect(el.getBoundingClientRect()); setHoveredCat(cat); }
  }, []);
  // Delay closing so the mouse can travel from tile → panel without flickering
  const handleLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => { setHoveredCat(null); setAnchorRect(null); }, 150);
  }, []);
  // Called when the mouse enters the panel itself — cancels the pending close
  const handleKeepOpen = useCallback(() => {
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null; }
  }, []);

  // Equip any specific item (handles swapping)
  const handleEquipItem = useCallback(async (inv: InventoryItemX) => {
    if (!inv.item) return;
    const realCat = inv.item.category as string;
    const shopItem = inv.item as ShopItemX & { ability_key?: string };
    const isSpecialCard = CARTA_ESPECIAL_CATS.has(realCat) && !!shopItem.ability_key;
    const virtualCat = isSpecialCard ? "carta_especial" : realCat;

    setTogglingCat(virtualCat);
    try {
      const nowEquipped = !inv.is_equipped;
      if (nowEquipped) {
        if (isSpecialCard) {
          // Unequip ALL currently equipped items in any special-card slot
          const specialEquipped = inventory.filter(i =>
            i.is_equipped && i.item &&
            (CARTA_ESPECIAL_CATS.has(i.item.category as string) ||
             i.equipped_slot === "carta_especial") &&
            i.id !== inv.id
          );
          for (const old of specialEquipped) {
            await supabaseAnon
              .from("student_inventory" as never)
              .update({ is_equipped: false, equipped_slot: null } as never)
              .eq("id", old.id).eq("student_id", studentId);
          }
        } else {
          // Unequip the currently equipped item in the same normal slot
          const current = equippedByCategory.get(virtualCat);
          if (current && current.id !== inv.id) {
            await supabaseAnon
              .from("student_inventory" as never)
              .update({ is_equipped: false, equipped_slot: null } as never)
              .eq("id", current.id).eq("student_id", studentId);
          }
        }
      }
      const slot = nowEquipped ? (isSpecialCard ? "carta_especial" : realCat) : null;
      const { error: updateErr } = await supabaseAnon
        .from("student_inventory" as never)
        .update({ is_equipped: nowEquipped, equipped_slot: slot } as never)
        .eq("id", inv.id)
        .eq("student_id", studentId) as unknown as { error: { message: string } | null };
      if (updateErr) {
        console.error("[EquipmentPanel] update error:", updateErr);
        toast.error(`Erro ao equipar: ${updateErr.message}`);
        return;
      }
      toast.success(nowEquipped ? `${inv.item.name} equipado!` : `${inv.item.name} desequipado`);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar equipamento");
    } finally {
      setTogglingCat(null);
    }
  }, [equippedByCategory, inventory, studentId, onRefresh]);

  const equippedCount = SLOT_DEFS.filter(s => equippedByCategory.get(s.category)?.is_equipped).length;

  const hoveredSlot = hoveredCat ? SLOT_DEFS.find(s => s.category === hoveredCat) : null;
  const hoveredInv = hoveredCat ? (equippedByCategory.get(hoveredCat) ?? null) : null;
  const hoveredAllItems = hoveredCat ? (inventoryByCategory.get(hoveredCat) ?? []) : [];

  return (
    <div style={{
      gridColumn: "1", gridRow: "2",
      background: T.bgPanel,
      borderRight: `1px solid ${T.borderDim}`,
      backdropFilter: "blur(16px)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 10px",
        borderBottom: `1px solid ${T.borderDim}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, background: `linear-gradient(180deg, ${classColor}, transparent)`, borderRadius: 1.5 }} />
          <span style={{ fontFamily: FONT_ORB, fontSize: 10, letterSpacing: "3px", color: T.textSecondary, fontWeight: 700 }}>
            EQUIPAMENTO
          </span>
        </div>
        <div style={{
          fontFamily: FONT_MON, fontSize: 11, color: equippedCount > 0 ? classColor : T.textMuted,
          background: equippedCount > 0 ? `${classColor}12` : "transparent",
          border: `1px solid ${equippedCount > 0 ? classColor + "30" : T.borderDim}`,
          borderRadius: 4, padding: "2px 8px",
        }}>
          {equippedCount}/{SLOT_DEFS.length}
        </div>
      </div>

      {/* 2-column tile grid */}
      <div style={{ flex: 1, padding: "12px 12px", overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 8,
          height: "100%",
        }}>
          {SLOT_DEFS.map((slotDef, idx) => {
            const inv = equippedByCategory.get(slotDef.category);
            const shopItem = inv?.item as (ShopItemX & { ability_key?: string; ability_name?: string }) | undefined;
            const rarity = shopItem?.rarity ?? "common";
            const isCartaEspecial = !!slotDef.isCartaEspecial;
            const emptyColor = isCartaEspecial ? "rgba(212,168,83,0.35)" : "rgba(60,90,130,0.3)";
            const rc = shopItem ? (RARITY_COLOR[rarity] ?? T.common) : emptyColor;
            const rb = shopItem ? (RARITY_BG[rarity] ?? "rgba(8,14,24,0.8)") : isCartaEspecial ? "rgba(12,10,5,0.7)" : "rgba(8,14,24,0.5)";
            const isHovered = hoveredCat === slotDef.category;
            const isEquipped = inv?.is_equipped ?? false;

            // ── Carta especial: render as arcane-card (shop style) ───────────
            if (isCartaEspecial) {
              const ARCANE_RARITY: Record<string, { color: string; glow: string; label: string }> = {
                common:    { color: "#c8d0d8", glow: "rgba(200,208,216,0.3)",  label: "Comum"    },
                uncommon:  { color: "#4ade80", glow: "rgba(74,222,128,0.35)", label: "Incomum"  },
                rare:      { color: "#60c8f8", glow: "rgba(96,200,248,0.4)",  label: "Rara"     },
                epic:      { color: "#b57bee", glow: "rgba(181,123,238,0.45)",label: "Épica"    },
                legendary: { color: "#f5c84b", glow: "rgba(245,200,75,0.55)", label: "Lendária" },
                mythic:    { color: "#f05050", glow: "rgba(240,80,80,0.55)",  label: "Mítica"   },
              };
              const ar = shopItem ? (ARCANE_RARITY[rarity] ?? ARCANE_RARITY.common) : null;
              const goldGlow = "rgba(212,168,83,0.4)";
              const activeAttrs = shopItem ? ATTR_META.filter(a => (shopItem[a.key] ?? 0) > 0) : [];

              return (
                <div
                  key={slotDef.category}
                  ref={el => { if (el) tileRefs.current.set(slotDef.category, el); }}
                  className="hs-equip-tile"
                  style={{
                    animationDelay: `${0.08 + idx * 0.06}s`,
                    gridColumn: "1 / -1",
                    background: shopItem
                      ? `linear-gradient(180deg, #1a1028 0%, #07050c 100%)`
                      : `linear-gradient(180deg, #0d0a14 0%, #06040c 100%)`,
                    border: shopItem
                      ? `3px solid ${ar!.color}`
                      : `2px dashed rgba(212,168,83,0.25)`,
                    borderRadius: 12,
                    boxShadow: shopItem
                      ? isHovered
                        ? `0 0 0 1px rgba(0,0,0,0.8), 0 20px 36px rgba(0,0,0,0.6), 0 0 18px ${ar!.glow}, 0 0 6px ${ar!.glow}`
                        : `0 0 0 1px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5), 0 0 8px ${ar!.glow}`
                      : isHovered
                        ? `0 0 18px ${goldGlow}`
                        : "none",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    padding: 0,
                    transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease",
                    cursor: "pointer",
                    isolation: "isolate",
                  }}
                  onMouseEnter={() => handleHover(slotDef.category)}
                  onMouseLeave={handleLeave}
                >
                  {shopItem && ar ? (
                    <>
                      {/* Art area (Identical to Shop) */}
                      <div style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "4 / 3",
                        background: `radial-gradient(ellipse at 50% 40%, ${ar.glow} 0%, transparent 65%), linear-gradient(180deg, #1a1028 0%, #07050c 100%)`,
                        overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {shopItem.image_url ? (
                          <img
                            src={shopItem.image_url} alt={shopItem.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain", filter: `drop-shadow(0 4px 16px rgba(0,0,0,0.6))`, transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)", transform: isHovered ? "scale(1.08)" : "scale(1)" }}
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <GameIcon id={slotDef.iconId} size={40} />
                        )}
                        
                        {/* Shaders */}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.7) 95%)", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 60%, ${ar.glow})`, mixBlendMode: "screen", opacity: 0.4, pointerEvents: "none" }} />
                        
                        {/* Rarity badge */}
                        <div style={{
                          position: "absolute", top: 8, right: 8,
                          padding: "3px 8px",
                          background: "rgba(8,4,14,0.85)",
                          border: `1px solid ${ar.color}`,
                          color: ar.color,
                          borderRadius: 999,
                          backdropFilter: "blur(6px)",
                          fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700,
                          letterSpacing: "0.18em", textTransform: "uppercase",
                          zIndex: 3,
                        }}>
                          {ar.label}
                        </div>

                        {/* Attribute badges (Bottom Left) */}
                        <div style={{
                          position: "absolute", bottom: 8, left: 8,
                          display: "flex", flexWrap: "wrap", gap: 4, zIndex: 3
                        }}>
                          {activeAttrs.slice(0, 2).map(a => (
                            <div key={a.key} style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              padding: "2px 6px", background: "rgba(8,4,14,0.78)",
                              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
                              color: "#fde68a", fontFamily: FONT_MON, fontSize: 10, fontWeight: 700,
                              backdropFilter: "blur(6px)"
                            }}>
                              <GameIcon id={a.iconId} size={10} /> +{shopItem[a.key]}
                            </div>
                          ))}
                        </div>

                        {/* Equipped Overlay (Checkmark) */}
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)",
                          zIndex: 2, pointerEvents: "none", color: "#4ade80"
                        }}>
                          <div style={{
                            background: "rgba(8,4,14,0.85)", border: "2px solid currentColor",
                            borderRadius: "50%", width: 52, height: 52,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 24px currentColor"
                          }}>
                            <CheckCircle size={26} />
                          </div>
                        </div>
                      </div>

                      {/* Info area (Identical to Shop arcane-foot) */}
                      <div style={{
                        padding: "10px 12px 11px",
                        display: "flex", flexDirection: "column", gap: 4,
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.4))",
                      }}>
                        <div style={{
                          fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700,
                          color: "#f5f5f7", letterSpacing: "0.04em", lineHeight: 1.25,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {shopItem.name}
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          gap: 6, fontFamily: "'Exo 2', sans-serif", fontSize: 10.5,
                          fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase"
                        }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.42)" }}>
                            <GameIcon id={slotDef.iconId} size={11} />
                            {(shopItem as any).category === 'habilidade' ? 'HABILIDADE' : slotDef.label}
                          </span>
                          <span style={{ color: ar.color, fontWeight: 800 }}>EQUIPADA</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Empty state */
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "24px 20px" }}>
                      <div style={{ width: 44, height: 44, border: "1.5px dashed rgba(212,168,83,0.25)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <GameIcon id="star" size={20} />
                      </div>
                      <div>
                        <div style={{ fontFamily: FONT_MON, fontSize: 9, color: T.gold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 3 }}>CARTA ESPECIAL</div>
                        <div style={{ fontFamily: FONT_RAJ, fontSize: 14, color: "rgba(212,168,83,0.4)", fontWeight: 600 }}>Nenhuma equipada</div>
                        <div style={{ fontFamily: FONT_MON, fontSize: 8, color: T.textMuted, marginTop: 2 }}>Passe o mouse para escolher</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // ── Normal slot (armamento / armadura) ───────────────────────────
            return (
              <div
                key={slotDef.category}
                ref={el => { if (el) tileRefs.current.set(slotDef.category, el); }}
                className={`hs-equip-tile ${shopItem ? "has-item" : "empty"}`}
                style={{
                  animationDelay: `${0.08 + idx * 0.06}s`,
                  background: rb,
                  border: `${isEquipped ? "2px" : "1px"} solid ${isHovered ? rc : rc + (shopItem ? "50" : "22")}`,
                  boxShadow: isHovered && shopItem
                    ? `0 0 18px ${rc}30, inset 0 0 12px ${rc}08`
                    : isEquipped ? `0 0 10px ${rc}20` : "none",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "10px 8px 8px", gap: 6,
                }}
                onMouseEnter={() => handleHover(slotDef.category)}
                onMouseLeave={handleLeave}
              >
                {isEquipped && (
                  <div style={{ position: "absolute", top: 5, left: 5, width: 6, height: 6, borderRadius: "50%", background: rc, boxShadow: `0 0 6px ${rc}` }} />
                )}
                {shopItem && (
                  <div style={{ position: "absolute", top: 5, right: 5, fontFamily: FONT_MON, fontSize: 7, color: rc, letterSpacing: "0.5px", background: `${rc}18`, border: `1px solid ${rc}30`, borderRadius: 3, padding: "1px 4px" }}>
                    {RARITY_LABEL[rarity]?.slice(0, 3) ?? "COM"}
                  </div>
                )}
                <div style={{ width: 52, height: 52, borderRadius: 6, background: "rgba(8,14,24,0.7)", border: `1px solid ${shopItem ? rc + "35" : "rgba(50,80,120,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {shopItem ? (
                    shopItem.image_url
                      ? <img src={shopItem.image_url} alt={shopItem.name} style={{ width: 42, height: 42, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <GameIcon id={slotDef.iconId} size={26} />
                  ) : (
                    <div style={{ width: 24, height: 24, border: "1.5px dashed rgba(60,90,130,0.25)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <GameIcon id={slotDef.iconId} size={14} />
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: shopItem ? FONT_RAJ : FONT_MON, fontSize: shopItem ? 11 : 9, fontWeight: shopItem ? 600 : 400, color: shopItem ? T.textPrimary : T.textMuted, letterSpacing: shopItem ? "0.3px" : "1.5px", textTransform: "uppercase", textAlign: "center", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                  {shopItem ? shopItem.name : slotDef.label}
                </div>
                {shopItem && (() => {
                  const t = (shopItem.attr_forca??0)+(shopItem.attr_destreza??0)+(shopItem.attr_inteligencia??0)+(shopItem.attr_carisma??0)+(shopItem.attr_agilidade??0)+(shopItem.attr_resistencia??0);
                  return t > 0 ? <div style={{ fontFamily: FONT_MON, fontSize: 9, color: T.cyan, background: "rgba(56,217,232,0.08)", border: "1px solid rgba(56,217,232,0.2)", borderRadius: 3, padding: "1px 6px" }}>+{t}</div> : null;
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action panel — rendered via portal to escape backdropFilter stacking context */}
      {/* For carta especial always show panel (it's the picker). For normal slots only when items exist. */}
      {hoveredCat && anchorRect && hoveredSlot && (hoveredAllItems.length > 0 || hoveredSlot.isCartaEspecial) && createPortal(
        <EquipActionPanel
          inv={hoveredInv}
          slotDef={hoveredSlot}
          anchorRect={anchorRect}
          isEquipped={hoveredInv?.is_equipped ?? false}
          onToggleEquip={() => hoveredInv && handleEquipItem(hoveredInv)}
          toggling={togglingCat === hoveredCat}
          allInvForSlot={hoveredAllItems}
          onEquipItem={handleEquipItem}
          onMouseEnter={handleKeepOpen}
          onMouseLeave={handleLeave}
        />,
        document.body
      )}
    </div>
  );
}

// ─── Skill Badge ───────────────────────────────────────────────────────────────
function SkillBadge({ skill, active, onClick }: { skill: SkillNode; active: boolean; onClick: () => void }) {
  return (
    <div
      className={`hs-skill-badge ${active ? "active" : ""}`}
      title={skill.name}
      onClick={onClick}
      style={{
        width: 56, height: 56,
        background: active ? "rgba(155,109,255,0.2)" : "rgba(12,18,30,0.8)",
        border: `2px solid ${active ? "rgba(155,109,255,0.7)" : "rgba(80,120,180,0.25)"}`,
        boxShadow: active ? "0 0 14px rgba(155,109,255,0.4)" : "none",
        fontSize: 26, userSelect: "none",
        flexShrink: 0,
      }}
    >
      {skill.icon || "✦"}
    </div>
  );
}

// ─── Character Display ─────────────────────────────────────────────────────────
function CharacterDisplay({
  student,
  title,
  powerLevel,
  classColor,
  battleCharacter,
  equippedAbilities,
  allAbilities,
  onEquipAbility,
  onUnequipAbility,
}: {
  student: Student;
  title: StudentTitle | null;
  powerLevel: number;
  classColor: string;
  battleCharacter: BattleCharacter | null;
  equippedAbilities: { ability_id: string; slot: number }[];
  allAbilities: Ability[];
  onEquipAbility: (id: string, slot: 1 | 2 | 3 | 4) => Promise<void>;
  onUnequipAbility: (slot: 1 | 2 | 3 | 4) => Promise<void>;
}) {
  const hasPhoto = !!student.profile_photo_url;
  const [togglingSlot, setTogglingSlot] = useState<number | null>(null);

  // Build slot map: slot number → Ability
  const slotMap = new Map<number, Ability>();
  for (const eq of equippedAbilities) {
    const abl = allAbilities.find(a => a.id === eq.ability_id);
    if (abl) slotMap.set(eq.slot, abl);
  }
  const equippedSlots: (Ability | null)[] = [1, 2, 3, 4].map(s => slotMap.get(s) ?? null);
  const equippedIds = new Set(equippedAbilities.map(e => e.ability_id));

  // Only show abilities the character has unlocked (meets element point requirement)
  const unlockedAbilities = battleCharacter
    ? allAbilities.filter(a => canUseAbility(battleCharacter, a))
    : [];
  const availableAbilities = unlockedAbilities.filter(a => !equippedIds.has(a.id));

  const handleEquip = async (abilityId: string) => {
    const emptySlot = ([1, 2, 3, 4] as (1 | 2 | 3 | 4)[]).find(s => !slotMap.has(s));
    if (!emptySlot) { toast("Todos os slots estão cheios. Remova uma habilidade primeiro."); return; }
    setTogglingSlot(emptySlot);
    await onEquipAbility(abilityId, emptySlot);
    setTogglingSlot(null);
  };

  const handleUnequip = async (slot: number) => {
    setTogglingSlot(slot);
    await onUnequipAbility(slot as 1 | 2 | 3 | 4);
    setTogglingSlot(null);
  };

  return (
    <div style={{
      gridColumn: "2", gridRow: "2",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      position: "relative", overflow: "hidden",
      padding: "16px 0 16px",
    }}>
      {/* Power level */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, alignSelf: "flex-end", paddingRight: 24, marginBottom: 8 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONT_MON, fontSize: 9, color: T.textMuted, letterSpacing: "2px" }}>PODER</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <polygon points="8,1 15,8 8,15 1,8" fill="none" stroke={T.cyan} strokeWidth="1.5" opacity="0.9" />
              <polygon points="8,4 12,8 8,12 4,8" fill={`${T.cyan}25`} />
            </svg>
            <span
              className="hs-power-flicker"
              style={{
                fontFamily: FONT_ORB, fontSize: 48, fontWeight: 800, lineHeight: 1,
                background: `linear-gradient(180deg, #fff 0%, ${T.cyan} 60%)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 20px ${T.cyan}30)`,
              }}
            >
              {powerLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Character portrait area */}
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        {/* Ambient glow behind character */}
        <div
          className="hs-glow-pulse"
          style={{
            position: "absolute",
            width: 340, height: 340,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${classColor}10 0%, transparent 65%)`,
            top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        {/* Orbital rings */}
        <div className="hs-orbit-cw" style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%",
          border: `1px solid rgba(74,158,255,0.07)`,
          top: "50%", left: "50%", marginTop: -150, marginLeft: -150,
          pointerEvents: "none",
        }}>
          <div style={{ position: "absolute", top: -3, left: "50%", width: 6, height: 6, marginLeft: -3, borderRadius: "50%", background: T.blue, boxShadow: `0 0 8px ${T.blue}` }} />
        </div>
        <div className="hs-orbit-ccw" style={{
          position: "absolute", width: 240, height: 240, borderRadius: "50%",
          border: `1px dashed rgba(56,217,232,0.05)`,
          top: "50%", left: "50%", marginTop: -120, marginLeft: -120,
          pointerEvents: "none",
        }}>
          <div style={{ position: "absolute", bottom: -2.5, left: "50%", width: 5, height: 5, marginLeft: -2.5, borderRadius: "50%", background: T.cyan, boxShadow: `0 0 6px ${T.cyan}` }} />
        </div>

        {/* Main portrait */}
        {hasPhoto ? (
          <div style={{
            position: "relative", zIndex: 2,
            width: 220, height: 260,
            borderRadius: 12,
            overflow: "hidden",
            border: `2px solid ${classColor}40`,
            boxShadow: `0 0 40px ${classColor}20, 0 20px 60px rgba(0,0,0,0.6)`,
            animation: "hs-photo-appear 0.6s ease both",
          }}>
            {/* Color overlay at bottom */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
              background: `linear-gradient(0deg, ${classColor}30, transparent)`,
              zIndex: 1, pointerEvents: "none",
            }} />
            <img
              src={student.profile_photo_url!}
              alt={student.character_name ?? student.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        ) : (
          /* Better fallback: class-specific large silhouette */
          <div style={{
            position: "relative", zIndex: 2,
            width: 200, height: 240,
            borderRadius: 12,
            background: `linear-gradient(180deg, rgba(8,14,24,0.9) 0%, rgba(4,8,16,0.95) 100%)`,
            border: `1px solid ${classColor}40`,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            paddingBottom: 16, overflow: "hidden",
            boxShadow: `0 0 30px ${classColor}15`,
            animation: "hs-photo-appear 0.6s ease both",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(180deg, ${classColor}08, transparent)` }} />
            <svg width="120" height="180" viewBox="0 0 60 90" style={{ opacity: 0.85, filter: `drop-shadow(0 0 20px ${classColor}60)` }}>
              <ellipse cx="30" cy="11" rx="9" ry="10" fill={classColor} />
              <rect x="27" y="20" width="6" height="5" rx="2" fill={classColor} opacity="0.7" />
              <ellipse cx="16" cy="30" rx="7" ry="4" fill={classColor} opacity="0.55" />
              <ellipse cx="44" cy="30" rx="7" ry="4" fill={classColor} opacity="0.55" />
              <path d="M19 26 Q30 22 41 26 L39 54 Q30 58 21 54 Z" fill={classColor} opacity="0.8" />
              <path d="M19 26 L10 48 Q9 54 13 55 L19 42 Z" fill={classColor} opacity="0.7" />
              <path d="M41 26 L50 48 Q51 54 47 55 L41 42 Z" fill={classColor} opacity="0.7" />
              <rect x="20" y="52" width="20" height="4" rx="1" fill={classColor} opacity="0.6" />
              <path d="M21 56 L19 82 Q22 86 25 82 L26 58 Z" fill={classColor} opacity="0.78" />
              <path d="M39 56 L41 82 Q38 86 35 82 L34 58 Z" fill={classColor} opacity="0.78" />
              <ellipse cx="22" cy="83" rx="5" ry="3" fill={classColor} opacity="0.6" />
              <ellipse cx="38" cy="83" rx="5" ry="3" fill={classColor} opacity="0.6" />
              <circle cx="30" cy="37" r="2.5" fill="rgba(255,255,255,0.25)" />
            </svg>
            <span style={{ position: "absolute", bottom: 14, fontFamily: FONT_MON, fontSize: 9, color: classColor, letterSpacing: "2.5px" }}>
              {(student.character_class ?? "HERÓI").toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Title badge */}
      {title && (
        <div style={{
          padding: "6px 18px", marginTop: 8,
          background: "rgba(212,168,83,0.07)",
          border: `1px solid rgba(212,168,83,0.3)`,
          borderRadius: 20, fontFamily: FONT_ORB,
          fontSize: 10, fontWeight: 600, color: T.gold,
          letterSpacing: "4px", textAlign: "center",
          boxShadow: "0 0 16px rgba(212,168,83,0.1)",
        }}>
          {TITLE_LABELS[title.title_type] ?? title.title_type.toUpperCase()}
        </div>
      )}

      {/* Battle Skills Section */}
      <div style={{ width: "100%", padding: "12px 16px 14px", borderTop: `1px solid ${T.borderDim}`, marginTop: 8 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 14, background: `linear-gradient(180deg, ${T.purple}, transparent)`, borderRadius: 1.5 }} />
            <span style={{ fontFamily: FONT_ORB, fontSize: 9, letterSpacing: "2.5px", color: T.textSecondary }}>HABILIDADES DE BATALHA</span>
          </div>
          <span style={{ fontFamily: FONT_MON, fontSize: 9, color: T.textMuted, letterSpacing: "1px" }}>
            {equippedAbilities.length}/4
          </span>
        </div>

        {/* 4 equipped battle skill slots */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 18 }}>
          {equippedSlots.map((abl, idx) => {
            const slot = idx + 1;
            const elMeta = abl ? ELEMENT_META[abl.elementName] : null;
            const elColor = elMeta?.color ?? T.purple;
            const isToggling = togglingSlot === slot;
            return (
              <div
                key={slot}
                onClick={() => abl && !isToggling && handleUnequip(slot)}
                title={abl ? `${abl.name} — clique para remover` : `SLOT ${slot} — vazio`}
                style={{
                  width: 60, height: 68, borderRadius: 10,
                  cursor: abl ? "pointer" : "default",
                  background: abl ? `${elColor}15` : "rgba(8,14,24,0.7)",
                  border: `2px solid ${abl ? elColor + "60" : "rgba(80,120,180,0.18)"}`,
                  boxShadow: abl ? `0 0 18px ${elColor}25` : "none",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  position: "relative", transition: "all 0.18s ease", flexShrink: 0, gap: 4,
                }}
              >
                {/* Slot number tag */}
                <div style={{
                  position: "absolute", top: 3, left: 4,
                  fontFamily: FONT_MON, fontSize: 7, color: abl ? elColor : "rgba(80,120,180,0.3)",
                  letterSpacing: "0.5px",
                }}>
                  {slot}
                </div>

                {isToggling ? (
                  <Loader2 size={18} className="animate-spin" style={{ color: elColor }} />
                ) : abl ? (
                  <>
                    <span style={{ fontSize: 26, lineHeight: 1, userSelect: "none" }}>{elMeta?.icon ?? "✦"}</span>
                    <div style={{
                      fontFamily: FONT_MON, fontSize: 7, color: elColor,
                      whiteSpace: "nowrap", letterSpacing: "0.3px",
                      maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", textAlign: "center",
                    }}>
                      {abl.name}
                    </div>
                  </>
                ) : (
                  <span style={{ fontFamily: FONT_ORB, fontSize: 16, color: "rgba(80,120,180,0.18)", userSelect: "none" }}>+</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Available abilities pool */}
        {!battleCharacter || allAbilities.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, background: "rgba(8,14,24,0.5)", border: `1px dashed ${T.borderDim}` }}>
            <GameIcon id="wand" size={13} />
            <span style={{ fontFamily: FONT_RAJ, fontSize: 12, color: T.textMuted }}>
              {!battleCharacter ? "Crie seu personagem de batalha primeiro" : "Carregando habilidades..."}
            </span>
          </div>
        ) : availableAbilities.length > 0 ? (
          <div>
            <div style={{ fontFamily: FONT_MON, fontSize: 8, color: T.textMuted, letterSpacing: "1.5px", marginBottom: 8 }}>
              DISPONÍVEIS — CLIQUE PARA EQUIPAR
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 120, overflowY: "auto" }}>
              {availableAbilities.map(abl => {
                const elMeta = ELEMENT_META[abl.elementName];
                const elColor = elMeta?.color ?? T.purple;
                return (
                  <div
                    key={abl.id}
                    onClick={() => !togglingSlot && handleEquip(abl.id)}
                    title={`${abl.name}${abl.description ? ': ' + abl.description : ''} (${abl.elementName} · Tier ${abl.tier})`}
                    style={{
                      width: 48, height: 48, borderRadius: 8, cursor: "pointer",
                      background: `${elColor}12`,
                      border: `1px solid ${elColor}30`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 2, transition: "all 0.15s ease", userSelect: "none", flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background = `${elColor}25`;
                      el.style.borderColor = `${elColor}70`;
                      el.style.boxShadow = `0 0 10px ${elColor}20`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background = `${elColor}12`;
                      el.style.borderColor = `${elColor}30`;
                      el.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{elMeta?.icon ?? "✦"}</span>
                    <div style={{ fontFamily: FONT_MON, fontSize: 6, color: elColor, letterSpacing: "0.3px", maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
                      {abl.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: FONT_MON, fontSize: 9, color: T.purple, letterSpacing: "1px", textAlign: "center", background: "rgba(155,109,255,0.06)", border: "1px solid rgba(155,109,255,0.2)", borderRadius: 6, padding: "8px 0" }}>
            ✦ TODOS OS SLOTS EQUIPADOS
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Attribute Row ─────────────────────────────────────────────────────────────
function AttrRow({ attr, value, delay }: { attr: typeof ATTR_META[0]; value: number; delay: string }) {
  const pct = Math.min((value / MAX_ATTR) * 100, 100);
  return (
    <div className="hs-attr-row" style={{ animationDelay: delay }}>
      <div style={{
        width: 34, height: 34,
        background: `${attr.color}14`,
        border: `1px solid ${attr.color}35`,
        borderRadius: 7,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: value > 0 ? `0 0 8px ${attr.color}18` : "none",
      }}>
        <GameIcon id={attr.iconId} size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: FONT_RAJ, fontSize: 12, fontWeight: 600, color: T.textSecondary, letterSpacing: "0.5px" }}>
            {attr.label}
          </span>
        </div>
        <div style={{ height: 6, background: "rgba(20,35,60,0.6)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: `linear-gradient(90deg, ${attr.color}60, ${attr.color})`,
            borderRadius: 3, transition: "width 1.2s ease",
            position: "relative",
          }}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, background: "rgba(255,255,255,0.4)", filter: "blur(2px)" }} />
          </div>
        </div>
      </div>

      <span style={{
        fontFamily: FONT_ORB, fontSize: 16, fontWeight: 700,
        color: value > 0 ? attr.color : T.textMuted,
        width: 26, textAlign: "right", flexShrink: 0,
        textShadow: value > 0 ? `0 0 12px ${attr.color}50` : "none",
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Pet Card ──────────────────────────────────────────────────────────────────
function PetCard({ pet }: { pet: StudentPet }) {
  const pt = pet.pet_type;
  const icon = pet.current_stage === 3 ? pt?.stage3_icon : pet.current_stage === 2 ? pt?.stage2_icon : pt?.stage1_icon;
  const stageName = pet.current_stage === 3 ? pt?.stage3_name : pet.current_stage === 2 ? pt?.stage2_name : pt?.stage1_name;
  const xpToNext = pet.current_stage === 1 ? pt?.evolution_threshold_2 ?? 100 : pet.current_stage === 2 ? pt?.evolution_threshold_3 ?? 200 : null;
  const xpPct = xpToNext ? Math.min((pet.xp / xpToNext) * 100, 100) : 100;

  return (
    <div style={{
      background: "rgba(8,14,24,0.7)",
      border: `1px solid ${T.borderDim}`,
      borderRadius: 10, overflow: "hidden",
    }}>
      <div style={{ padding: "8px 12px 6px", borderBottom: `1px solid ${T.borderDim}`, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 2, height: 13, background: `linear-gradient(180deg, ${T.purple}, transparent)`, borderRadius: 1 }} />
        <span style={{ fontFamily: FONT_ORB, fontSize: 8, letterSpacing: "3px", color: T.textMuted }}>COMPANHEIRO</span>
      </div>

      <div style={{ display: "flex", gap: 12, padding: "10px 12px" }}>
        {/* Pet avatar */}
        <div className="hs-pet-float" style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(155,109,255,0.1)", border: `2px solid rgba(155,109,255,0.3)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, flexShrink: 0,
          boxShadow: "0 0 16px rgba(155,109,255,0.2)",
        }}>
          {icon ?? <svg width="28" height="28" viewBox="0 0 36 36"><circle cx="18" cy="14" r="6" fill={T.purple} opacity="0.7" /><path d="M10 28 Q18 22 26 28" stroke={T.purple} strokeWidth="2" fill="none" opacity="0.6" /></svg>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontFamily: FONT_ORB, fontSize: 11, color: T.textPrimary, letterSpacing: "0.5px", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {pet.name}
            </span>
            <div style={{ background: "rgba(56,217,232,0.1)", border: `1px solid ${T.cyan}30`, borderRadius: 4, padding: "1px 6px", fontFamily: FONT_MON, fontSize: 9, color: T.cyan, flexShrink: 0, marginLeft: 6 }}>
              EST {pet.current_stage}
            </div>
          </div>
          {stageName && <div style={{ fontFamily: FONT_MON, fontSize: 9, color: T.textMuted, letterSpacing: "0.5px", marginBottom: 6 }}>{stageName.toUpperCase()}</div>}
          {xpToNext && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontFamily: FONT_MON, fontSize: 8, color: T.textMuted }}>XP</span>
                <span style={{ fontFamily: FONT_MON, fontSize: 8, color: T.purple }}>{pet.xp}/{xpToNext}</span>
              </div>
              <div style={{ height: 4, background: "rgba(40,60,90,0.4)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${xpPct}%`, background: `linear-gradient(90deg, #7c3aed, ${T.purple})`, borderRadius: 2, transition: "width 1s ease" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {pt?.bonus_type && (
        <div style={{ margin: "0 12px 10px", display: "flex", alignItems: "center", gap: 8, background: "rgba(155,109,255,0.05)", border: `1px solid rgba(155,109,255,0.15)`, borderRadius: 6, padding: "6px 10px" }}>
          <GameIcon id="star" size={13} />
          <span style={{ fontFamily: FONT_MON, fontSize: 9, color: T.purple, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            {pt.bonus_type.replace("_", " ")} · +{pt.bonus_value}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Stats Panel ───────────────────────────────────────────────────────────────
function StatsPanel({ student, pet }: { student: Student; pet: StudentPet | null }) {
  return (
    <div style={{
      gridColumn: "3", gridRow: "2",
      background: T.bgPanel,
      borderLeft: `1px solid ${T.borderDim}`,
      backdropFilter: "blur(16px)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Attributes */}
      <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${T.borderDim}`, flex: "0 0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 3, height: 18, background: `linear-gradient(180deg, ${T.blue}, transparent)`, borderRadius: 1.5 }} />
          <span style={{ fontFamily: FONT_ORB, fontSize: 10, letterSpacing: "3px", color: T.textSecondary, fontWeight: 700 }}>ATRIBUTOS</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {ATTR_META.map((attr, idx) => (
            <AttrRow key={attr.key} attr={attr} value={(student[attr.key] as number) ?? 0} delay={`${0.1 + idx * 0.07}s`} />
          ))}
        </div>
      </div>

      {/* Pet */}
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", overflow: "hidden", justifyContent: "center" }}>
        {pet ? (
          <PetCard pet={pet} />
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
            background: "rgba(8,14,24,0.6)", border: `1px dashed ${T.borderDim}`, borderRadius: 10, padding: 20,
          }}>
            <GameIcon id="dragon" size={32} />
            <span style={{ fontFamily: FONT_MON, fontSize: 9, color: T.textMuted, letterSpacing: "1.5px", textAlign: "center" }}>
              SEM COMPANHEIRO
            </span>
            <span style={{ fontFamily: FONT_RAJ, fontSize: 11, color: "rgba(120,150,190,0.4)", textAlign: "center" }}>
              Desbloqueie um pet na loja
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Top Bar ───────────────────────────────────────────────────────────────────
function HeroTopBar({
  student, classColor, onEdit, onBack,
}: {
  student: Student; classColor: string;
  onEdit: () => void; onBack: () => void;
}) {
  const displayName = student.character_name ?? student.name;

  return (
    <div style={{
      gridColumn: "1 / -1", gridRow: "1",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px",
      background: "rgba(3,5,10,0.9)",
      borderBottom: `1px solid ${T.borderDim}`,
      backdropFilter: "blur(12px)", zIndex: 10,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
          background: "transparent", border: `1px solid ${T.borderDim}`,
          borderRadius: 6, color: T.textMuted, fontFamily: FONT_MON,
          fontSize: 9, letterSpacing: "1.5px", cursor: "pointer", transition: "all 0.2s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.borderGlow; (e.currentTarget as HTMLButtonElement).style.color = T.textAccent; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.borderDim; (e.currentTarget as HTMLButtonElement).style.color = T.textMuted; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          HUB
        </button>

        {/* Avatar + level badge */}
        <div style={{ position: "relative", flexShrink: 0, width: 42, height: 42 }}>
          <div style={{
            width: 42, height: 42,
            border: `2px solid ${classColor}50`, borderRadius: 8,
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${classColor}22, ${classColor}0a)`,
            boxShadow: `0 0 14px ${classColor}25`,
          }}>
            {student.profile_photo_url ? (
              <img
                src={student.profile_photo_url}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span style={{ fontFamily: FONT_ORB, fontSize: 15, fontWeight: 800, color: classColor, lineHeight: 1 }}>
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Level corner badge */}
          <div style={{
            position: "absolute", bottom: -4, right: -6,
            background: classColor, color: "#050b18",
            fontFamily: FONT_MON, fontSize: 9, fontWeight: 800,
            borderRadius: 4, padding: "1px 4px",
            lineHeight: 1.4, letterSpacing: "0.3px",
            boxShadow: `0 0 6px ${classColor}80`,
            pointerEvents: "none",
          }}>
            {student.level}
          </div>
        </div>

        <div>
          <h1 style={{
            fontFamily: FONT_ORB, fontSize: 16, fontWeight: 700, color: T.textPrimary,
            letterSpacing: "3px", textTransform: "uppercase", margin: 0, lineHeight: 1.1,
          }}>
            {displayName}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            {student.character_class && (
              <span style={{ fontFamily: FONT_MON, fontSize: 10, color: classColor, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                {student.character_class}
              </span>
            )}
            {student.character_class && student.race && <span style={{ color: T.textMuted, fontSize: 10 }}>·</span>}
            {student.race && (
              <span style={{ fontFamily: FONT_MON, fontSize: 10, color: T.textSecondary, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                {student.race}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(212,168,83,0.09)", border: `1px solid rgba(212,168,83,0.25)`,
          borderRadius: 7, padding: "6px 13px",
        }}>
          <GameIcon id="coin" size={15} />
          <span style={{ fontFamily: FONT_MON, fontSize: 14, color: T.gold, fontWeight: 700 }}>
            {student.coins.toLocaleString()}
          </span>
        </div>

        <button onClick={onEdit} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
          background: "transparent", border: `1px solid ${T.borderGlow}`,
          borderRadius: 6, color: T.textAccent, fontFamily: FONT_ORB,
          fontSize: 9, letterSpacing: "1.5px", cursor: "pointer", transition: "all 0.2s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(74,158,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.borderColor = T.borderActive; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = T.borderGlow; }}
        >
          <Edit3 size={12} /> EDITAR
        </button>
      </div>
    </div>
  );
}

// ─── Bottom Bar (XP only, no dead shortcuts) ───────────────────────────────────
function HeroBottomBar({ student }: { student: Student }) {
  const xp = (student as Record<string, unknown>).xp as number ?? 0;
  const xpToNext = 50 * student.level * student.level + 100 * student.level;
  const xpPct = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div style={{
      gridColumn: "1 / -1", gridRow: "3",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
      background: "rgba(3,5,10,0.9)",
      borderTop: `1px solid ${T.borderDim}`,
      backdropFilter: "blur(12px)", zIndex: 10,
    }}>
      {/* Left: class + race info */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          padding: "3px 10px",
          background: "rgba(100,160,255,0.06)", border: `1px solid ${T.borderDim}`,
          borderRadius: 4, fontFamily: FONT_ORB, fontSize: 10, color: T.gold,
          letterSpacing: "1px",
        }}>
          NÍV {student.level}
        </div>
        {student.character_class && (
          <span style={{ fontFamily: FONT_MON, fontSize: 10, color: T.textMuted, letterSpacing: "1px" }}>
            {student.character_class.toUpperCase()}{student.race ? ` · ${student.race.toUpperCase()}` : ""}
          </span>
        )}
      </div>

      {/* Right: XP bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: FONT_MON, fontSize: 10, color: T.textMuted }}>
          {xp.toLocaleString()} / {xpToNext.toLocaleString()} XP
        </span>
        <div style={{ position: "relative", width: 220, height: 6, borderRadius: 3, background: "rgba(30,50,80,0.5)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${xpPct}%`,
            background: `linear-gradient(90deg, #92400e, ${T.gold})`,
            borderRadius: 3, transition: "width 1.4s ease",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: 0, width: "30%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              animation: "hs-xp-shine 3.5s ease-in-out infinite",
            }} />
          </div>
        </div>
        <span style={{ fontFamily: FONT_MON, fontSize: 10, color: T.gold, whiteSpace: "nowrap" }}>
          {xpPct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
interface HeroScreenProps {
  student: Student;
  inventory: InventoryItem[];
  onUpdate: () => void;
  onBack: () => void;
}

export function HeroScreen({ student, inventory, onUpdate, onBack }: HeroScreenProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [pet, setPet] = useState<StudentPet | null>(null);
  const [title, setTitle] = useState<StudentTitle | null>(null);
  const [battleCharacter, setBattleCharacter] = useState<BattleCharacter | null>(null);
  const [equippedAbilities, setEquippedAbilities] = useState<{ ability_id: string; slot: number }[]>([]);
  const [allAbilities, setAllAbilities] = useState<Ability[]>([]);

  const refreshEquipped = useCallback(async (charId: string) => {
    const { data } = await supabase
      .from("character_abilities")
      .select("ability_id, slot")
      .eq("character_id", charId)
      .order("slot");
    if (data) setEquippedAbilities(data as { ability_id: string; slot: number }[]);
  }, []);

  useEffect(() => {
    // Pet
    supabaseStudent.from("student_pets").select("*, pet_type:pet_types(*)").eq("student_id", student.id).eq("is_active", true).maybeSingle()
      .then(({ data }) => setPet(data as StudentPet | null));

    // Title
    supabaseStudent.from("student_titles").select("*").eq("student_id", student.id).order("expires_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setTitle(data as StudentTitle | null));

    // Battle character + abilities
    if (student.user_id) {
      supabaseStudent
        .from("characters" as never)
        .select("id, pts_fire, pts_water, pts_electric, pts_grass, pts_ice, pts_ground, pts_fighting, pts_steel, pts_poison, pts_dark, pts_ghost, pts_flying, forca, inteligencia, destreza, carisma, agilidade, resistencia, free_points, level, xp, hp_current, hp_max, energy_max, user_id, name, class")
        .eq("user_id", student.user_id)
        .maybeSingle()
        .then(async ({ data: row }: { data: any }) => {
          if (!row) return;
          const char: BattleCharacter = {
            id: row.id, userId: row.user_id, name: row.name ?? "", class: row.class ?? "",
            level: row.level ?? 1, xp: row.xp ?? 0,
            hpCurrent: row.hp_current ?? 100, hpMax: row.hp_max ?? 100, energyMax: row.energy_max ?? 100,
            forca: row.forca ?? 0, inteligencia: row.inteligencia ?? 0, destreza: row.destreza ?? 0,
            carisma: row.carisma ?? 0, agilidade: row.agilidade ?? 0, resistencia: row.resistencia ?? 0,
            ptsFire: row.pts_fire ?? 0, ptsWater: row.pts_water ?? 0, ptsElectric: row.pts_electric ?? 0,
            ptsGrass: row.pts_grass ?? 0, ptsIce: row.pts_ice ?? 0, ptsGround: row.pts_ground ?? 0,
            ptsFighting: row.pts_fighting ?? 0, ptsSteel: row.pts_steel ?? 0, ptsPoison: row.pts_poison ?? 0,
            ptsDark: row.pts_dark ?? 0, ptsGhost: row.pts_ghost ?? 0, ptsFlying: row.pts_flying ?? 0,
            freePoints: row.free_points ?? 0,
          };
          setBattleCharacter(char);
          refreshEquipped(char.id);
        });
    }

    // Fetch all abilities (global, no auth needed)
    supabase
      .from("abilities")
      .select("*, elements:element_id(name, icon_url, color_hex)")
      .order("tier")
      .then(({ data: ablData }) => {
        if (!ablData) return;
        setAllAbilities((ablData as any[]).map(row => ({
          id:           row.id,
          name:         row.name,
          elementId:    row.element_id,
          elementName:  row.elements?.name,
          tier:         row.tier as 1 | 2 | 3 | 4,
          damageType:   row.damage_type,
          baseDamage:   row.base_damage ?? 0,
          energyCost:   row.energy_cost ?? 0,
          accuracy:     row.accuracy ?? 100,
          requirement:  row.requirement ?? 0,
          description:  row.description ?? "",
          elementColor: row.elements?.color_hex,
          elementIcon:  row.elements?.icon_url,
        } as Ability)));
      });
  }, [student.id, student.user_id, refreshEquipped]);

  const handleEquipAbility = useCallback(async (abilityId: string, slot: 1 | 2 | 3 | 4) => {
    if (!battleCharacter) return;
    await supabase
      .from("character_abilities")
      .upsert({ character_id: battleCharacter.id, ability_id: abilityId, slot }, { onConflict: "character_id,slot" });
    refreshEquipped(battleCharacter.id);
    toast.success("Habilidade equipada!");
  }, [battleCharacter, refreshEquipped]);

  const handleUnequipAbility = useCallback(async (slot: 1 | 2 | 3 | 4) => {
    if (!battleCharacter) return;
    await supabase
      .from("character_abilities")
      .delete()
      .eq("character_id", battleCharacter.id)
      .eq("slot", slot);
    setEquippedAbilities(prev => prev.filter(a => a.slot !== slot));
    toast.success("Habilidade removida.");
  }, [battleCharacter]);

  const inventoryX = inventory as InventoryItemX[];
  const classColor = CLASS_COLOR[student.character_class ?? ""] ?? "#4a9eff";

  const attrSum = (student.attr_forca ?? 0)+(student.attr_destreza ?? 0)+(student.attr_inteligencia ?? 0)+(student.attr_carisma ?? 0)+(student.attr_agilidade ?? 0)+(student.attr_resistencia ?? 0);
  const equippedItems = inventoryX.filter(i => i.is_equipped && i.item);
  const equippedAttrSum = equippedItems.reduce((acc, inv) => {
    const it = inv.item!;
    return acc + (it.attr_forca??0)+(it.attr_destreza??0)+(it.attr_inteligencia??0)+(it.attr_carisma??0)+(it.attr_agilidade??0)+(it.attr_resistencia??0);
  }, 0);
  const powerLevel = (attrSum + equippedAttrSum) * 8 + student.level * 5;


  return (
    <>
      <style>{HERO_CSS}</style>
      <HeroBackground classColor={classColor} />

      <div style={{
        width: "100%", height: "100vh",
        display: "grid",
        gridTemplateColumns: "300px 1fr 310px",
        gridTemplateRows: "64px 1fr 72px",
        position: "relative", zIndex: 1,
        background: T.bgAbyss,
      }}>
        <HeroTopBar student={student} classColor={classColor} onEdit={() => setShowEdit(true)} onBack={onBack} />

        <EquipmentPanel inventory={inventoryX} classColor={classColor} studentId={student.id} onRefresh={onUpdate} />
        <CharacterDisplay
          student={student} title={title} powerLevel={powerLevel} classColor={classColor}
          battleCharacter={battleCharacter}
          equippedAbilities={equippedAbilities}
          allAbilities={allAbilities}
          onEquipAbility={handleEquipAbility}
          onUnequipAbility={handleUnequipAbility}
        />
        <StatsPanel student={student} pet={pet} />

        <HeroBottomBar student={student} />
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }} role="dialog" aria-modal="true">
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }} onClick={() => setShowEdit(false)} />
          <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 680, borderRadius: 12, background: "rgba(6,10,18,0.99)", border: `1px solid ${classColor}25`, maxHeight: "90vh", overflowY: "auto", boxShadow: `0 0 40px ${classColor}12, 0 20px 60px rgba(0,0,0,0.8)` }}>
            <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "rgba(6,10,18,0.99)", borderBottom: `1px solid ${T.borderDim}` }}>
              <h2 style={{ fontFamily: FONT_ORB, fontSize: 13, fontWeight: 700, color: T.textPrimary, letterSpacing: "3px", margin: 0 }}>EDITAR PERSONAGEM</h2>
              <button onClick={() => setShowEdit(false)} style={{ padding: 6, borderRadius: 6, background: "transparent", border: "none", color: T.textMuted, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <CharacterCustomization student={student} onUpdate={() => { onUpdate(); setShowEdit(false); }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
