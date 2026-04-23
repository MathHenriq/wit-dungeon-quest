import { useState, useEffect, useCallback } from "react";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import type { Student, InventoryItem, ShopItem } from "@/types";
import { ArrowLeftRight, CheckCircle, X, Loader2, Clock, ArrowLeft, Coins } from "lucide-react";
import { toast } from "sonner";
import { GameIcon } from "@/components/icons/GameIcon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeItem {
  id: string;
  trade_id: string;
  side: "proposer" | "receiver";
  item_id: string;
  item?: ShopItem;
}

interface Trade {
  id: string;
  teacher_id: string;
  proposer_id: string;
  receiver_id: string;
  proposer_item_id: string | null;
  receiver_item_id: string | null;
  coins_amount: number;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  resolved_at: string | null;
  proposer_item?: ShopItem;
  receiver_item?: ShopItem | null;
  proposer?: { name: string; character_name: string | null };
  receiver?: { name: string; character_name: string | null };
  trade_items?: TradeItem[];
}

interface Props {
  student: Student;
  inventory: InventoryItem[];
  onBack: () => void;
  onInventoryChanged?: () => void;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Orbitron:wght@700;800&display=swap');

@keyframes tr-scan {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
@keyframes tr-blink {
  0%, 100% { opacity: 1; }
  49%       { opacity: 1; }
  50%       { opacity: 0; }
}
@keyframes tr-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tr-row-in {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes tr-select-glow {
  0%, 100% { box-shadow: inset 0 0 0 1px rgba(0,229,200,0.4), 0 0 12px rgba(0,229,200,0.1); }
  50%       { box-shadow: inset 0 0 0 1px rgba(0,229,200,0.7), 0 0 22px rgba(0,229,200,0.2); }
}
@keyframes tr-arrow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%       { opacity: 1; transform: scale(1.12); }
}
@keyframes tr-hud-drift {
  0%   { background-position: 0 0; }
  100% { background-position: 0 56px; }
}
@keyframes tr-confirmed {
  0%   { opacity: 0; transform: scale(0.8); }
  60%  { opacity: 1; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes tr-line-in {
  from { width: 0; }
  to   { width: 100%; }
}

.tr-screen {
  position: fixed; inset: 0; z-index: 50;
  background: #020409;
  display: flex; flex-direction: column;
  font-family: 'Rajdhani', sans-serif;
  overflow: hidden;
}

/* Scanline overlay */
.tr-scanlines {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0,0,0,0.13) 0px,
    rgba(0,0,0,0.13) 1px,
    transparent 1px,
    transparent 4px
  );
}

/* Moving scan beam */
.tr-beam {
  position: fixed; left: 0; right: 0; height: 120px; z-index: 0; pointer-events: none;
  background: linear-gradient(0deg, transparent 0%, rgba(0,220,210,0.015) 50%, transparent 100%);
  animation: tr-scan 8s linear infinite;
}

/* Grid lines */
.tr-grid {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(0,229,200,0.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,200,0.022) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: tr-hud-drift 6s linear infinite;
}

/* HUD corner brackets */
.tr-panel {
  position: relative;
  background: rgba(4,10,22,0.92);
  border: 1px solid rgba(0,180,170,0.2);
  backdrop-filter: blur(12px);
}
.tr-panel::before, .tr-panel::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  pointer-events: none;
}
.tr-panel::before {
  top: -1px; left: -1px;
  border-top: 2px solid #00dcc8;
  border-left: 2px solid #00dcc8;
}
.tr-panel::after {
  top: -1px; right: -1px;
  border-top: 2px solid #00dcc8;
  border-right: 2px solid #00dcc8;
}

/* Bottom corners via pseudo on inner wrapper */
.tr-panel-inner::before, .tr-panel-inner::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  pointer-events: none;
}
.tr-panel-inner::before {
  bottom: -1px; left: -1px;
  border-bottom: 2px solid #00dcc8;
  border-left: 2px solid #00dcc8;
}
.tr-panel-inner::after {
  bottom: -1px; right: -1px;
  border-bottom: 2px solid #00dcc8;
  border-right: 2px solid #00dcc8;
}

/* Item rows */
.tr-item-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; cursor: pointer;
  transition: background 0.14s ease, border-color 0.14s ease;
  border: 1px solid transparent;
  border-radius: 6px; position: relative;
  animation: tr-row-in 0.28s ease both;
}
.tr-item-row:hover {
  background: rgba(0,220,200,0.06);
  border-color: rgba(0,220,200,0.15);
}
.tr-item-row.selected {
  background: rgba(0,229,200,0.1);
  border-color: rgba(0,229,200,0.4);
  animation: tr-select-glow 2s ease-in-out infinite;
}
.tr-item-row.selected .tr-item-name {
  color: #00f0e0 !important;
}
.tr-item-row.offer-selected {
  background: rgba(255,120,0,0.1);
  border-color: rgba(255,120,0,0.4);
}
.tr-item-row.offer-selected .tr-item-name {
  color: #ff9940 !important;
}

/* Tab buttons */
.tr-tab {
  flex: 1; padding: 10px 6px; border: none; cursor: pointer;
  font-family: 'Orbitron', sans-serif; font-size: 9px;
  font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  transition: all 0.18s ease;
  position: relative; background: transparent;
}
.tr-tab.active {
  color: #00dcc8;
}
.tr-tab.active::after {
  content: '';
  position: absolute; bottom: 0; left: 20%; right: 20%; height: 2px;
  background: linear-gradient(90deg, transparent, #00dcc8, transparent);
}
.tr-tab:not(.active) { color: rgba(255,255,255,0.28); }
.tr-tab:not(.active):hover { color: rgba(255,255,255,0.6); }

/* Mode toggle (ITENS / MOEDAS) */
.tr-mode-btn {
  flex: 1; padding: 5px 6px; border-radius: 3px; cursor: pointer;
  font-family: 'Share Tech Mono', monospace; font-size: 8px;
  letter-spacing: 1.5px; text-transform: uppercase;
  transition: all 0.15s; border: none;
}
.tr-mode-btn.active {
  background: rgba(0,200,190,0.15);
  border: 1px solid rgba(0,200,190,0.4) !important;
  color: #00f0e0;
}
.tr-mode-btn.coins-active {
  background: rgba(251,191,36,0.12);
  border: 1px solid rgba(251,191,36,0.4) !important;
  color: #fbbf24;
}
.tr-mode-btn:not(.active):not(.coins-active) {
  background: transparent;
  border: 1px solid rgba(0,200,190,0.12) !important;
  color: rgba(0,200,190,0.35);
}

.tr-mono { font-family: 'Share Tech Mono', monospace; }
.tr-orb  { font-family: 'Orbitron', sans-serif; }
.tr-fade { animation: tr-fade-in 0.3s ease both; }

/* Trade card (incoming) */
.tr-trade-card {
  border-radius: 8px; overflow: hidden;
  animation: tr-fade-in 0.3s ease both;
  background: rgba(6,14,28,0.9);
  border: 1px solid rgba(255,120,0,0.25);
}
.tr-trade-card .tr-card-header {
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(255,120,0,0.15);
  background: rgba(255,120,0,0.06);
}

/* Arrow pulse */
.tr-arrow { animation: tr-arrow-pulse 2s ease-in-out infinite; }

/* Confirmed animation */
.tr-confirmed { animation: tr-confirmed 0.4s cubic-bezier(0.22,1,0.36,1) both; }

/* SAO-style status badge */
.tr-status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 3px;
  font-family: 'Share Tech Mono', monospace; font-size: 9px;
  letter-spacing: 1px; text-transform: uppercase; font-weight: bold;
}

/* Scrollbar */
.tr-scroll::-webkit-scrollbar { width: 4px; }
.tr-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 2px; }
.tr-scroll::-webkit-scrollbar-thumb { background: rgba(0,200,190,0.3); border-radius: 2px; }
.tr-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,200,190,0.5); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProposerItems(trade: Trade): ShopItem[] {
  const fromJunction = trade.trade_items
    ?.filter(ti => ti.side === "proposer")
    .map(ti => ti.item)
    .filter(Boolean) as ShopItem[] | undefined;
  if (fromJunction && fromJunction.length > 0) return fromJunction;
  return trade.proposer_item ? [trade.proposer_item] : [];
}

function getReceiverItems(trade: Trade): ShopItem[] {
  const fromJunction = trade.trade_items
    ?.filter(ti => ti.side === "receiver")
    .map(ti => ti.item)
    .filter(Boolean) as ShopItem[] | undefined;
  if (fromJunction && fromJunction.length > 0) return fromJunction;
  return trade.receiver_item ? [trade.receiver_item] : [];
}

function CategoryLabel({ category }: { category: string }) {
  const map: Record<string, { label: string; color: string }> = {
    armamento:  { label: "ARMAMENTO",  color: "#f87171" },
    armadura:   { label: "ARMADURA",   color: "#fb923c" },
    utilizavel: { label: "UTILIZÁVEL", color: "#a78bfa" },
    colecao:    { label: "COLEÇÃO",    color: "#fbbf24" },
    token:      { label: "TOKEN",      color: "#34d399" },
    habilidade: { label: "HABILIDADE", color: "#38bdf8" },
  };
  const m = map[category] ?? { label: category.toUpperCase(), color: "#9ca3af" };
  return (
    <span style={{
      fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
      color: m.color, letterSpacing: "0.8px", opacity: 0.85,
    }}>
      {m.label}
    </span>
  );
}

function ItemIcon({ item, size = 36 }: { item: ShopItem; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "rgba(0,180,170,0.08)",
      border: "1px solid rgba(0,180,170,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative",
    }}>
      {item.image_url ? (
        <img src={item.image_url} alt={item.name}
          style={{ width: size * 0.72, height: size * 0.72, objectFit: "contain" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <GameIcon id={item.icon ?? "gem"} size={size * 0.5} />
      )}
    </div>
  );
}

function ItemsPreview({ items, size = 30, color = "#00f0e0" }: { items: ShopItem[]; size?: number; color?: string }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 3);
  const rest = items.length - 3;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
      {shown.map(item => (
        <div key={item.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <ItemIcon item={item} size={size} />
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 9, fontWeight: 600,
            color, maxWidth: size + 16, textAlign: "center",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.name}
          </span>
        </div>
      ))}
      {rest > 0 && (
        <span style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
          color: "rgba(0,200,190,0.6)", alignSelf: "center",
        }}>
          +{rest}
        </span>
      )}
    </div>
  );
}

function PanelHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{
      padding: "10px 14px 8px",
      borderBottom: "1px solid rgba(0,180,170,0.15)",
      background: "rgba(0,180,170,0.04)",
      display: "flex", alignItems: "baseline", gap: 10,
    }}>
      <span style={{
        fontFamily: "'Orbitron', sans-serif", fontSize: 9,
        color: "#00dcc8", letterSpacing: "3px", fontWeight: 700,
      }}>
        {label}
      </span>
      {sub && (
        <span style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
          color: "rgba(0,220,200,0.45)", letterSpacing: "1px",
        }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TradingScreen({ student, inventory, onBack, onInventoryChanged }: Props) {
  const [tab, setTab] = useState<"propose" | "incoming" | "history">("propose");
  const [classmates, setClassmates] = useState<Student[]>([]);
  const [receiverId, setReceiverId] = useState("");
  const [myItemIds, setMyItemIds] = useState<string[]>([]);
  const [theirItemIds, setTheirItemIds] = useState<string[]>([]);
  const [theirMode, setTheirMode] = useState<"items" | "coins">("items");
  const [coinsRequested, setCoinsRequested] = useState(0);
  const [receiverInventory, setReceiverInventory] = useState<InventoryItem[]>([]);
  const [isLoadingRecv, setIsLoadingRecv] = useState(false);
  const [isProposing, setIsProposing] = useState(false);
  const [incoming, setIncoming] = useState<Trade[]>([]);
  const [historyTrades, setHistoryTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const myItems = inventory.filter(i => i.item).map(i => ({ inv: i, item: i.item! }));
  const receiverItems = receiverInventory.filter(i => i.item).map(i => ({ inv: i, item: i.item! }));
  const selectedReceiver = classmates.find(c => c.id === receiverId);
  const mySelectedItems = myItems.filter(i => myItemIds.includes(i.item.id));
  const theirSelectedItems = receiverItems.filter(i => theirItemIds.includes(i.item.id));

  function toggleMyItem(id: string) {
    setMyItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleTheirItem(id: string) {
    setTheirItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // Load classmates
  useEffect(() => {
    supabaseAnon
      .from("students")
      .select("id, name, character_name, class_id, level, teacher_id, coins, presencas_consecutivas")
      .eq("class_id", student.class_id)
      .eq("status", "active")
      .then(({ data }) => setClassmates((data ?? []) as Student[]));
  }, [student.class_id]);

  // Load trades
  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: pendingData } = await supabaseAnon
        .from("trades").select("*")
        .eq("receiver_id", student.id).eq("status", "pending")
        .order("created_at", { ascending: false });
      const { data: histData } = await supabaseAnon
        .from("trades").select("*")
        .or(`proposer_id.eq.${student.id},receiver_id.eq.${student.id}`)
        .in("status", ["accepted", "rejected", "cancelled"])
        .order("resolved_at", { ascending: false }).limit(20);

      const allTrades = [...(pendingData ?? []), ...(histData ?? [])] as Trade[];
      const tradeIds = allTrades.map(t => t.id);
      const itemIds = [...new Set(allTrades.flatMap(t => [t.proposer_item_id, t.receiver_item_id]).filter(Boolean))] as string[];
      const studentIds = [...new Set(allTrades.flatMap(t => [t.proposer_id, t.receiver_id]))];

      const [{ data: items }, { data: students }, { data: tradeItemsData }] = await Promise.all([
        itemIds.length > 0 ? supabaseAnon.from("shop_items").select("*").in("id", itemIds) : Promise.resolve({ data: [] }),
        supabaseAnon.from("students").select("id, name, character_name").in("id", studentIds),
        tradeIds.length > 0
          ? supabaseAnon.from("trade_items").select("*, item:shop_items(*)").in("trade_id", tradeIds)
          : Promise.resolve({ data: [] }),
      ]);

      const itemMap: Record<string, ShopItem> = {};
      for (const i of items ?? []) itemMap[i.id] = i as ShopItem;
      const studentMap: Record<string, { name: string; character_name: string | null }> = {};
      for (const s of students ?? []) studentMap[s.id] = { name: s.name, character_name: s.character_name };
      const tradeItemsMap: Record<string, TradeItem[]> = {};
      for (const ti of (tradeItemsData ?? []) as TradeItem[]) {
        if (!tradeItemsMap[ti.trade_id]) tradeItemsMap[ti.trade_id] = [];
        tradeItemsMap[ti.trade_id].push(ti);
      }

      const enrich = (trades: Trade[]): Trade[] => trades.map(t => ({
        ...t,
        proposer_item: t.proposer_item_id ? itemMap[t.proposer_item_id] : undefined,
        receiver_item: t.receiver_item_id ? itemMap[t.receiver_item_id] : null,
        proposer: studentMap[t.proposer_id],
        receiver: studentMap[t.receiver_id],
        trade_items: tradeItemsMap[t.id] ?? [],
      }));

      setIncoming(enrich((pendingData ?? []) as Trade[]));
      setHistoryTrades(enrich((histData ?? []) as Trade[]));
    } finally { setIsLoading(false); }
  }, [student.id]);

  useEffect(() => { loadTrades(); }, [loadTrades]);

  // Load receiver inventory
  useEffect(() => {
    if (!receiverId) { setReceiverInventory([]); return; }
    setIsLoadingRecv(true);
    supabaseAnon.from("student_inventory").select("*, item:shop_items(*)")
      .eq("student_id", receiverId)
      .then(({ data }) => { setReceiverInventory((data ?? []) as InventoryItem[]); setIsLoadingRecv(false); });
  }, [receiverId]);

  async function handlePropose() {
    if (!receiverId) { toast.error("Selecione para quem enviar."); return; }
    if (myItemIds.length === 0) { toast.error("Selecione ao menos um item para oferecer."); return; }
    if (theirMode === "coins" && coinsRequested <= 0) { toast.error("Informe quantas moedas deseja."); return; }
    setIsProposing(true);
    try {
      const { data: trade, error } = await supabaseAnon.from("trades").insert({
        teacher_id: student.teacher_id,
        proposer_id: student.id,
        receiver_id: receiverId,
        proposer_item_id: myItemIds[0],
        receiver_item_id: theirMode === "items" && theirItemIds.length > 0 ? theirItemIds[0] : null,
        coins_amount: theirMode === "coins" ? coinsRequested : 0,
        status: "pending",
      }).select().single();
      if (error || !trade) throw error ?? new Error("Falha ao criar troca");

      const items = [
        ...myItemIds.map(item_id => ({ trade_id: (trade as Trade).id, side: "proposer" as const, item_id })),
        ...(theirMode === "items"
          ? theirItemIds.map(item_id => ({ trade_id: (trade as Trade).id, side: "receiver" as const, item_id }))
          : []),
      ];
      if (items.length > 0) {
        const { error: itemsError } = await supabaseAnon.from("trade_items").insert(items);
        if (itemsError) throw itemsError;
      }

      toast.success("Proposta enviada!");
      setMyItemIds([]); setTheirItemIds([]); setReceiverId(""); setCoinsRequested(0); setTheirMode("items");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erro ao propor troca.");
    } finally { setIsProposing(false); }
  }

  async function handleAccept(tradeId: string) {
    const { data, error } = await supabaseAnon.rpc("execute_trade", { p_trade_id: tradeId });
    if (error || !(data as { success: boolean }).success) {
      toast.error((data as { error?: string })?.error ?? "Erro ao aceitar.");
    } else {
      toast.success("Troca realizada!");
      loadTrades(); onInventoryChanged?.();
    }
  }

  async function handleReject(tradeId: string) {
    await supabaseAnon.from("trades").update({ status: "rejected", resolved_at: new Date().toISOString() }).eq("id", tradeId);
    toast.success("Proposta recusada."); loadTrades();
  }

  const canPropose = myItemIds.length > 0 && !!receiverId && (theirMode !== "coins" || coinsRequested > 0);

  return (
    <>
      <style>{CSS}</style>
      <div className="tr-screen">
        <div className="tr-scanlines" />
        <div className="tr-grid" />
        <div className="tr-beam" />

        {/* ── Top Bar ──────────────────────────────────────────── */}
        <div style={{
          position: "relative", zIndex: 10,
          background: "rgba(2,4,12,0.96)",
          borderBottom: "1px solid rgba(0,180,170,0.18)",
          backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center",
          padding: "0 20px", height: 52, flexShrink: 0,
        }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg, transparent, #00dcc8, transparent)" }} />

          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 4,
            background: "transparent", border: "1px solid rgba(0,180,170,0.2)",
            color: "rgba(0,220,200,0.6)", cursor: "pointer",
            fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: "1px",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,220,200,0.5)"; (e.currentTarget as HTMLButtonElement).style.color = "#00dcc8"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,180,170,0.2)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,220,200,0.6)"; }}
          >
            <ArrowLeft size={13} /> HUB
          </button>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ height: 1, width: 80, background: "linear-gradient(90deg, transparent, rgba(0,200,190,0.4))" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ArrowLeftRight size={14} style={{ color: "#00dcc8", opacity: 0.8 }} />
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 800, color: "#00f0e0", letterSpacing: "5px" }}>
                SISTEMA DE TROCA
              </span>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
                color: "rgba(0,200,190,0.45)", letterSpacing: "2px",
                animation: "tr-blink 1.4s step-end infinite",
              }}>■</span>
            </div>
            <div style={{ height: 1, width: 80, background: "linear-gradient(90deg, rgba(0,200,190,0.4), transparent)" }} />
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "5px 12px", borderRadius: 4,
            background: "rgba(255,180,0,0.07)", border: "1px solid rgba(255,180,0,0.2)",
          }}>
            <GameIcon id="coin" size={14} />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#fbbf24", fontWeight: 700 }}>
              {student.coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── Tab Navigation ───────────────────────────────────── */}
        <div style={{
          position: "relative", zIndex: 10,
          background: "rgba(2,6,16,0.9)",
          borderBottom: "1px solid rgba(0,180,170,0.12)",
          display: "flex",
        }}>
          {(["propose", "incoming", "history"] as const).map(t => (
            <button key={t} className={`tr-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {t === "propose" ? "PROPOSTA"
                : t === "incoming" ? `RECEBIDAS${incoming.length > 0 ? ` [${incoming.length}]` : ""}`
                : "HISTÓRICO"}
            </button>
          ))}
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div style={{
          flex: 1, overflow: "hidden", position: "relative", zIndex: 5,
          padding: "16px 20px", display: "flex", flexDirection: "column",
        }}>

          {/* ══ PROPOSTA TAB ══════════════════════════════════════ */}
          {tab === "propose" && (
            <div className="tr-fade" style={{ flex: 1, display: "flex", gap: 14, overflow: "hidden" }}>

              {/* Left — My Items */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div className="tr-panel tr-panel-inner" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 8 }}>
                  <PanelHeader
                    label="VOCÊ OFERECE"
                    sub={myItemIds.length > 0 ? `${myItemIds.length} SELECIONADO${myItemIds.length > 1 ? "S" : ""}` : "— SELECIONE —"}
                  />
                  <div className="tr-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
                    {myItems.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 0" }}>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "rgba(0,200,190,0.3)", letterSpacing: "2px" }}>
                          INVENTÁRIO VAZIO
                        </div>
                      </div>
                    ) : myItems.map(({ inv, item }, idx) => (
                      <div
                        key={inv.id}
                        className={`tr-item-row${myItemIds.includes(item.id) ? " offer-selected" : ""}`}
                        style={{ animationDelay: `${idx * 0.04}s` }}
                        onClick={() => toggleMyItem(item.id)}
                      >
                        <ItemIcon item={item} size={38} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="tr-item-name" style={{
                            fontFamily: "'Rajdhani', sans-serif", fontSize: 14,
                            fontWeight: 700, color: "#d8f0ee",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {item.name}
                          </div>
                          <CategoryLabel category={item.category} />
                        </div>
                        {(() => {
                          const t = (item.attr_forca ?? 0) + (item.attr_destreza ?? 0) + (item.attr_inteligencia ?? 0) +
                            (item.attr_carisma ?? 0) + (item.attr_agilidade ?? 0) + (item.attr_resistencia ?? 0);
                          return t > 0 ? (
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "rgba(251,191,36,0.8)", letterSpacing: "0.5px" }}>+{t}</span>
                          ) : null;
                        })()}
                        {myItemIds.includes(item.id) && (
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff9940", flexShrink: 0, boxShadow: "0 0 8px #ff9940" }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center — Trade Bridge */}
              <div style={{ width: 180, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>

                {/* Player selector */}
                <div className="tr-panel" style={{ borderRadius: 8, overflow: "hidden" }}>
                  <PanelHeader label="DESTINO" />
                  <div style={{ padding: "8px" }}>
                    <select
                      value={receiverId}
                      onChange={e => { setReceiverId(e.target.value); setTheirItemIds([]); }}
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: 4,
                        background: "rgba(0,180,170,0.08)",
                        border: "1px solid rgba(0,180,170,0.2)",
                        color: receiverId ? "#00f0e0" : "rgba(0,200,190,0.4)",
                        fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600,
                        outline: "none",
                      }}
                    >
                      <option value="" style={{ background: "#020409" }}>— Selecionar —</option>
                      {classmates.filter(c => c.id !== student.id).map(c => (
                        <option key={c.id} value={c.id} style={{ background: "#020409" }}>
                          {c.character_name || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Trade preview */}
                <div className="tr-panel" style={{ borderRadius: 8, flex: 1, display: "flex", flexDirection: "column" }}>
                  <PanelHeader label="RESUMO" />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 10px", gap: 10 }}>

                    {/* Offer side */}
                    <div style={{ width: "100%", padding: "8px 10px", borderRadius: 5, background: "rgba(255,120,0,0.08)", border: "1px solid rgba(255,120,0,0.2)", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: "rgba(255,120,0,0.6)", letterSpacing: "1.5px", marginBottom: 6 }}>OFERECE</div>
                      {mySelectedItems.length > 0 ? (
                        <ItemsPreview items={mySelectedItems.map(i => i.item)} size={28} color="#ff9940" />
                      ) : (
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "rgba(255,120,0,0.3)", letterSpacing: "1px" }}>VAZIO</div>
                      )}
                    </div>

                    <div className="tr-arrow" style={{ color: "#00dcc8" }}>
                      <ArrowLeftRight size={20} />
                    </div>

                    {/* Receive side */}
                    <div style={{ width: "100%", padding: "8px 10px", borderRadius: 5, background: "rgba(0,200,190,0.06)", border: "1px solid rgba(0,200,190,0.18)", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: "rgba(0,200,190,0.5)", letterSpacing: "1.5px", marginBottom: 6 }}>RECEBE</div>
                      {theirMode === "coins" && coinsRequested > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                          <GameIcon id="coin" size={16} />
                          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#fbbf24", fontWeight: 700 }}>{coinsRequested}</span>
                        </div>
                      ) : theirSelectedItems.length > 0 ? (
                        <ItemsPreview items={theirSelectedItems.map(i => i.item)} size={28} color="#00f0e0" />
                      ) : (
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "rgba(0,200,190,0.3)", letterSpacing: "1px" }}>QUALQUER</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Send button */}
                <button
                  onClick={handlePropose}
                  disabled={isProposing || !canPropose}
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 6, cursor: canPropose ? "pointer" : "default",
                    background: canPropose ? "rgba(0,200,190,0.12)" : "rgba(0,200,190,0.03)",
                    border: `1px solid ${canPropose ? "rgba(0,200,190,0.45)" : "rgba(0,200,190,0.12)"}`,
                    color: canPropose ? "#00f0e0" : "rgba(0,200,190,0.25)",
                    fontFamily: "'Orbitron', sans-serif", fontSize: 9,
                    fontWeight: 700, letterSpacing: "3px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.18s ease",
                    boxShadow: canPropose ? "0 0 20px rgba(0,200,190,0.1)" : "none",
                  }}
                >
                  {isProposing ? <Loader2 size={13} className="animate-spin" /> : <ArrowLeftRight size={13} />}
                  ENVIAR
                </button>
              </div>

              {/* Right — Their Items / Coins */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div className="tr-panel tr-panel-inner" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 8 }}>
                  <PanelHeader
                    label={selectedReceiver ? (selectedReceiver.character_name || selectedReceiver.name).toUpperCase() : "CONTRAPARTE"}
                    sub={
                      theirMode === "coins" ? "PAGAMENTO EM MOEDAS"
                        : theirItemIds.length > 0 ? `${theirItemIds.length} SELECIONADO${theirItemIds.length > 1 ? "S" : ""}`
                        : "— OPCIONAL —"
                    }
                  />

                  {/* Mode toggle */}
                  <div style={{ display: "flex", gap: 4, padding: "6px 8px", borderBottom: "1px solid rgba(0,180,170,0.1)" }}>
                    <button
                      className={`tr-mode-btn${theirMode === "items" ? " active" : ""}`}
                      onClick={() => { setTheirMode("items"); setCoinsRequested(0); }}
                    >
                      ITENS
                    </button>
                    <button
                      className={`tr-mode-btn${theirMode === "coins" ? " coins-active" : ""}`}
                      onClick={() => { setTheirMode("coins"); setTheirItemIds([]); }}
                    >
                      MOEDAS
                    </button>
                  </div>

                  {theirMode === "items" ? (
                    <div className="tr-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
                      {!receiverId ? (
                        <div style={{ textAlign: "center", padding: "32px 0" }}>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "rgba(0,200,190,0.25)", letterSpacing: "2px" }}>
                            AGUARDANDO SELEÇÃO
                          </div>
                        </div>
                      ) : isLoadingRecv ? (
                        <div style={{ textAlign: "center", padding: "32px 0" }}>
                          <Loader2 size={18} className="animate-spin" style={{ color: "#00dcc8", display: "inline-block" }} />
                        </div>
                      ) : receiverItems.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 0" }}>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "rgba(0,200,190,0.25)", letterSpacing: "2px" }}>SEM ITENS</div>
                        </div>
                      ) : receiverItems.map(({ inv, item }, idx) => (
                        <div
                          key={inv.id}
                          className={`tr-item-row${theirItemIds.includes(item.id) ? " selected" : ""}`}
                          style={{ animationDelay: `${idx * 0.04}s` }}
                          onClick={() => toggleTheirItem(item.id)}
                        >
                          <ItemIcon item={item} size={38} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="tr-item-name" style={{
                              fontFamily: "'Rajdhani', sans-serif", fontSize: 14,
                              fontWeight: 700, color: "#d8f0ee",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {item.name}
                            </div>
                            <CategoryLabel category={item.category} />
                          </div>
                          {(() => {
                            const t = (item.attr_forca ?? 0) + (item.attr_destreza ?? 0) + (item.attr_inteligencia ?? 0) +
                              (item.attr_carisma ?? 0) + (item.attr_agilidade ?? 0) + (item.attr_resistencia ?? 0);
                            return t > 0 ? (
                              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "rgba(251,191,36,0.8)", letterSpacing: "0.5px" }}>+{t}</span>
                            ) : null;
                          })()}
                          {theirItemIds.includes(item.id) && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00dcc8", flexShrink: 0, boxShadow: "0 0 8px #00dcc8" }} />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Coin input mode */
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "20px 16px" }}>
                      <Coins size={36} style={{ color: "#fbbf24", opacity: 0.8 }} />
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "rgba(251,191,36,0.5)", letterSpacing: "2px", textAlign: "center" }}>
                        MOEDAS SOLICITADAS
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => setCoinsRequested(v => Math.max(0, v - 10))}
                          style={{
                            width: 32, height: 32, borderRadius: 4, cursor: "pointer",
                            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
                            color: "#fbbf24", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >−</button>
                        <input
                          type="number"
                          min={0}
                          value={coinsRequested}
                          onChange={e => setCoinsRequested(Math.max(0, parseInt(e.target.value) || 0))}
                          style={{
                            width: 80, padding: "6px 8px", textAlign: "center", borderRadius: 4,
                            background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.3)",
                            color: "#fbbf24", fontFamily: "'Share Tech Mono', monospace", fontSize: 18,
                            fontWeight: 700, outline: "none",
                          }}
                        />
                        <button
                          onClick={() => setCoinsRequested(v => v + 10)}
                          style={{
                            width: 32, height: 32, borderRadius: 4, cursor: "pointer",
                            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
                            color: "#fbbf24", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >+</button>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[50, 100, 200].map(v => (
                          <button key={v} onClick={() => setCoinsRequested(v)} style={{
                            padding: "3px 10px", borderRadius: 3, cursor: "pointer",
                            background: coinsRequested === v ? "rgba(251,191,36,0.2)" : "rgba(251,191,36,0.05)",
                            border: `1px solid ${coinsRequested === v ? "rgba(251,191,36,0.5)" : "rgba(251,191,36,0.15)"}`,
                            color: "#fbbf24", fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
                          }}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ INCOMING TAB ══════════════════════════════════════ */}
          {tab === "incoming" && (
            <div className="tr-fade" style={{ flex: 1, overflow: "hidden" }}>
              {isLoading ? (
                <div style={{ textAlign: "center", paddingTop: 60 }}>
                  <Loader2 size={24} className="animate-spin" style={{ color: "#00dcc8", display: "inline-block" }} />
                </div>
              ) : incoming.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 80, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "rgba(0,200,190,0.25)", letterSpacing: "3px" }}>
                  NENHUMA PROPOSTA RECEBIDA
                </div>
              ) : (
                <div className="tr-scroll" style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
                  {incoming.map((trade, idx) => {
                    const proposerName = trade.proposer?.character_name || trade.proposer?.name || "?";
                    const propItems = getProposerItems(trade);
                    const recvItems = getReceiverItems(trade);
                    return (
                      <div key={trade.id} className="tr-trade-card" style={{ animationDelay: `${idx * 0.07}s` }}>
                        <div className="tr-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff9940", boxShadow: "0 0 6px #ff9940", animation: "tr-blink 1.6s step-end infinite" }} />
                            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, color: "#ff9940", letterSpacing: "2px" }}>
                              {proposerName.toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "rgba(255,120,0,0.4)", letterSpacing: "1px" }}>
                            {new Date(trade.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                          {/* Proposer items */}
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 5, background: "rgba(255,120,0,0.06)", border: "1px solid rgba(255,120,0,0.15)" }}>
                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: "rgba(255,120,0,0.5)", letterSpacing: "1px", marginBottom: 6 }}>ELE DÁ</div>
                            {propItems.length > 0 ? (
                              <ItemsPreview items={propItems} size={32} color="#ff9940" />
                            ) : (
                              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, color: "#ff9940" }}>—</span>
                            )}
                          </div>

                          <div className="tr-arrow" style={{ color: "#00dcc8", flexShrink: 0 }}>
                            <ArrowLeftRight size={16} />
                          </div>

                          {/* Receiver side */}
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 5, background: "rgba(0,200,190,0.05)", border: "1px solid rgba(0,200,190,0.15)" }}>
                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: "rgba(0,200,190,0.4)", letterSpacing: "1px", marginBottom: 6 }}>ELE QUER</div>
                            {trade.coins_amount > 0 ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <GameIcon id="coin" size={18} />
                                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 15, color: "#fbbf24", fontWeight: 700 }}>{trade.coins_amount}</span>
                                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "rgba(251,191,36,0.5)" }}>MOEDAS</span>
                              </div>
                            ) : recvItems.length > 0 ? (
                              <ItemsPreview items={recvItems} size={32} color="#00f0e0" />
                            ) : (
                              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, color: "#00f0e0" }}>QUALQUER ITEM</span>
                            )}
                          </div>
                        </div>

                        <div style={{ padding: "0 14px 12px", display: "flex", gap: 8 }}>
                          <button onClick={() => handleAccept(trade.id)} style={{
                            flex: 1, padding: "9px 0", borderRadius: 5, cursor: "pointer",
                            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.35)",
                            color: "#34d399", fontFamily: "'Orbitron', sans-serif", fontSize: 8,
                            fontWeight: 700, letterSpacing: "2px",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          }}>
                            <CheckCircle size={12} /> ACEITAR
                          </button>
                          <button onClick={() => handleReject(trade.id)} style={{
                            flex: 1, padding: "9px 0", borderRadius: 5, cursor: "pointer",
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                            color: "#f87171", fontFamily: "'Orbitron', sans-serif", fontSize: 8,
                            fontWeight: 700, letterSpacing: "2px",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          }}>
                            <X size={12} /> RECUSAR
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ HISTORY TAB ══════════════════════════════════════ */}
          {tab === "history" && (
            <div className="tr-fade" style={{ flex: 1, overflow: "hidden" }}>
              {isLoading ? (
                <div style={{ textAlign: "center", paddingTop: 60 }}>
                  <Loader2 size={24} className="animate-spin" style={{ color: "#00dcc8", display: "inline-block" }} />
                </div>
              ) : historyTrades.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 80, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "rgba(0,200,190,0.25)", letterSpacing: "3px" }}>
                  SEM HISTÓRICO
                </div>
              ) : (
                <div className="tr-scroll" style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 80px", gap: 8, padding: "4px 12px 8px", borderBottom: "1px solid rgba(0,180,170,0.15)" }}>
                    {["DATA", "COM QUEM", "VOCÊ DEU", "VOCÊ RECEBEU", "STATUS"].map(h => (
                      <span key={h} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "rgba(0,200,190,0.4)", letterSpacing: "1px" }}>{h}</span>
                    ))}
                  </div>
                  {historyTrades.map((trade, idx) => {
                    const isProposer = trade.proposer_id === student.id;
                    const partner = isProposer ? trade.receiver : trade.proposer;
                    const myItems_h = isProposer ? getProposerItems(trade) : getReceiverItems(trade);
                    const theirItems_h = isProposer ? getReceiverItems(trade) : getProposerItems(trade);
                    const statusMap = {
                      accepted:  { label: "ACEITA",    color: "#34d399", bg: "rgba(52,211,153,0.1)",    border: "rgba(52,211,153,0.3)"  },
                      rejected:  { label: "RECUSADA",  color: "#f87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
                      cancelled: { label: "CANCELADA", color: "#9ca3af", bg: "rgba(156,163,175,0.07)", border: "rgba(156,163,175,0.2)" },
                      pending:   { label: "PENDENTE",  color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)"  },
                    };
                    const s = statusMap[trade.status] ?? statusMap.cancelled;
                    const coinsDisplay = isProposer
                      ? (trade.coins_amount > 0 ? trade.coins_amount : null)
                      : null;
                    return (
                      <div key={trade.id} style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 80px", gap: 8,
                        padding: "10px 12px", borderRadius: 6,
                        background: "rgba(4,10,22,0.7)", border: "1px solid rgba(0,180,170,0.1)",
                        alignItems: "center", animation: "tr-row-in 0.28s ease both",
                        animationDelay: `${idx * 0.05}s`,
                      }}>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "rgba(0,200,190,0.4)", letterSpacing: "0.5px" }}>
                          {trade.resolved_at ? new Date(trade.resolved_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—"}
                        </span>
                        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(200,240,238,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {(partner?.character_name || partner?.name) ?? "?"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {myItems_h.slice(0, 2).map(item => <ItemIcon key={item.id} item={item} size={22} />)}
                          {myItems_h.length > 2 && (
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#ff9940" }}>+{myItems_h.length - 2}</span>
                          )}
                          {myItems_h.length === 0 && (
                            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "#ff9940" }}>—</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {coinsDisplay !== null ? (
                            <>
                              <GameIcon id="coin" size={16} />
                              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>{coinsDisplay}</span>
                            </>
                          ) : (
                            <>
                              {theirItems_h.slice(0, 2).map(item => <ItemIcon key={item.id} item={item} size={22} />)}
                              {theirItems_h.length > 2 && (
                                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#00f0e0" }}>+{theirItems_h.length - 2}</span>
                              )}
                              {theirItems_h.length === 0 && (
                                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "#00f0e0" }}>QUALQUER</span>
                              )}
                            </>
                          )}
                        </div>
                        <span className="tr-status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div style={{
          position: "relative", zIndex: 10, flexShrink: 0,
          borderTop: "1px solid rgba(0,180,170,0.12)",
          background: "rgba(2,4,12,0.95)",
          padding: "6px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg, transparent, #00dcc8, transparent)" }} />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "rgba(0,200,190,0.25)", letterSpacing: "1.5px" }}>
            SISTEMA DE TROCA v3.0 · {student.character_name ?? student.name}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "rgba(0,200,190,0.25)", letterSpacing: "1px" }}>
              <Clock size={9} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
              {new Date().toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
