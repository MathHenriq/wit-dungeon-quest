import { useState, useEffect } from "react";
import { Loader2, Gift } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { ChestIcon } from "@/components/icons/SaoIcons";
import { GameIcon } from "@/components/icons/GameIcon";
import { ChestOpening, CHEST_VISUALS } from "@/components/student/ChestOpening";
import type { ChestType, Student, ChestOpening as ChestOpeningType } from "@/types";

interface ChestGrant { id: string; chest_key: string; reason: string | null; granted_at: string }
interface ActiveEventLite { id: string; name: string; color_primary: string | null; ends_at: string | null }

interface ChestSectionProps {
  student: Student;
  onCoinsChanged: () => void;
  /** Patch 3.4: when true, only show chests that cost diamonds (premium shop). */
  diamondOnly?: boolean;
}

export function ChestSection({ student, onCoinsChanged, diamondOnly = false }: ChestSectionProps) {
  const [chests, setChests] = useState<ChestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openingChest, setOpeningChest] = useState<ChestType | null>(null);
  const [openingCount, setOpeningCount] = useState<number>(1);
  const [openingGrantId, setOpeningGrantId] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<ChestOpeningType[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [grants, setGrants] = useState<ChestGrant[]>([]);
  const [events, setEvents] = useState<ActiveEventLite[]>([]);

  useEffect(() => {
    load();
  }, [student.teacher_id, diamondOnly]);

  async function load() {
    setIsLoading(true);
    // Patch 3.2: fetch teacher-owned AND global (teacher_id IS NULL) chests.
    const [{ data: chestData }, { data: historyData }] = await Promise.all([
      supabaseStudent
        .from('chest_types')
        .select('*')
        .or(`teacher_id.eq.${student.teacher_id},teacher_id.is.null`)
        .eq('is_active', true)
        .order('tier'),
      supabaseStudent
        .from('chest_openings')
        .select('*')
        .eq('student_id', student.id)
        .order('opened_at', { ascending: false })
        .limit(10),
    ]);
    const allChests = (chestData ?? []) as unknown as ChestType[];
    setChests(diamondOnly ? allChests.filter(c => (c.cost_diamonds ?? 0) > 0) : allChests);
    setHistory((historyData ?? []) as unknown as ChestOpeningType[]);

    // Patch 4.3: free chest grants the student has not opened yet.
    const { data: grantsData } = await supabaseStudent.rpc('get_my_chest_grants');
    setGrants((grantsData ?? []) as ChestGrant[]);

    // Patch 5.2: active events for grouping/banner of event chests.
    const { data: eventsData } = await supabaseStudent.rpc('list_active_events');
    setEvents((eventsData ?? []) as ActiveEventLite[]);

    setIsLoading(false);
  }

  function handleClose(refreshCoins?: boolean) {
    setOpeningChest(null);
    if (refreshCoins) {
      onCoinsChanged();
      load();
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!chests.length && grants.length === 0) return null;

  function renderChestCard(chest: ChestType) {
    const v = CHEST_VISUALS[chest.tier] ?? CHEST_VISUALS[1];
    const canAffordCoins = chest.cost_coins === 0 || student.coins >= chest.cost_coins;
    const canAffordDiamonds = chest.cost_diamonds === 0 || (student.diamonds ?? 0) >= chest.cost_diamonds;
    const meetsLevel = student.level >= chest.min_level;
    const inStock = !chest.is_limited || (chest.stock !== null && chest.stock > 0);
    const canOpen = canAffordCoins && canAffordDiamonds && meetsLevel && inStock;
    const cost10coins    = Math.floor(chest.cost_coins    * 10 * 0.95);
    const cost10diamonds = Math.floor(chest.cost_diamonds * 10 * 0.95);
    const can10 =
      student.coins >= cost10coins &&
      (student.diamonds ?? 0) >= cost10diamonds &&
      meetsLevel && inStock;

    return (
      <div
        key={chest.id}
        className="rounded-xl p-4 flex flex-col items-center text-center transition-all"
        style={{
          background: v.bgColor,
          border: `1px solid ${v.borderColor}`,
          boxShadow: v.glowColor !== 'none' ? v.glowColor : undefined,
          opacity: canOpen ? 1 : 0.5,
        }}
      >
        <div className="mb-3" style={{ filter: v.glowColor !== 'none' ? `drop-shadow(${v.glowColor.replace('box-shadow:', '')})` : undefined }}>
          <ChestIcon size={52} ringColor={v.labelColor} fillColor={v.labelColor} bgColor={`${v.labelColor}18`} />
        </div>
        <p className="font-bold text-xs mb-1 leading-tight" style={{ color: v.labelColor, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
          {chest.name}
        </p>
        {chest.description && (<p className="text-[10px] text-white/30 mb-2 leading-snug">{chest.description}</p>)}
        <div className="flex flex-col items-center gap-1 mb-3 text-xs">
          {chest.cost_coins > 0 && (
            <span className={`flex items-center gap-1 font-bold ${canAffordCoins ? 'text-yellow-400' : 'text-red-400'}`}>
              <GameIcon id="coin" size={12} /> {chest.cost_coins}
            </span>
          )}
          {chest.cost_diamonds > 0 && (
            <span className={`flex items-center gap-1 font-bold ${canAffordDiamonds ? 'text-cyan-400' : 'text-red-400'}`}>
              <GameIcon id="gem" size={12} /> {chest.cost_diamonds}
            </span>
          )}
        </div>
        {chest.is_limited && chest.stock !== null && chest.stock <= 5 && (
          <p className="text-[10px] text-red-400 font-bold animate-pulse mb-2">{chest.stock} restante{chest.stock !== 1 ? 's' : ''}!</p>
        )}
        {!meetsLevel && (<p className="text-[10px] text-white/30 mb-2">Nível {chest.min_level}+</p>)}
        <div className="w-full flex gap-1.5">
          <button
            onClick={() => { if (canOpen) { setOpeningCount(1); setOpeningChest(chest); } }}
            disabled={!canOpen}
            className={`flex-1 text-xs py-1.5 rounded-lg font-bold transition-all ${canOpen ? 'btn-cyber justify-center' : ''}`}
            style={!canOpen
              ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed', fontFamily: 'Rajdhani, sans-serif' }
              : { background: `${v.labelColor}20`, border: `1px solid ${v.borderColor}`, color: v.labelColor }}
          >
            {!inStock ? 'Esgotado' : !meetsLevel ? 'Bloqueado' : !canAffordCoins || !canAffordDiamonds ? 'Sem recursos' : 'Abrir 1×'}
          </button>
          {(chest.cost_coins > 0 || chest.cost_diamonds > 0) && (
            <button
              onClick={() => { if (can10) { setOpeningCount(10); setOpeningChest(chest); } }}
              disabled={!can10}
              title={`Abrir 10× com 5% de desconto`}
              className={`text-xs py-1.5 px-2 rounded-lg font-bold transition-all ${can10 ? 'btn-cyber justify-center' : ''}`}
              style={!can10
                ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed', fontFamily: 'Rajdhani, sans-serif' }
                : { background: `${v.labelColor}28`, border: `1px solid ${v.borderColor}`, color: v.labelColor }}
            >
              10× <span style={{ fontSize: 9, opacity: 0.7 }}>-5%</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  function openGrant(g: ChestGrant) {
    const chest = chests.find(c => (c as ChestType & { chest_key?: string }).chest_key === g.chest_key);
    if (!chest) return;
    setOpeningCount(1);
    setOpeningGrantId(g.id);
    setOpeningChest(chest);
  }

  return (
    <>
      <style>{EVT_CHEST_CSS}</style>
      {/* Patch 4.3: free granted chests (e.g. Top 1 Guilda) */}
      {grants.length > 0 && (
        <div className="mb-8">
          <div
            className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"
            style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f05050' }}
          >
            <Gift size={14} />
            Baús Conquistados
            <span style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
              padding: '2px 8px', borderRadius: 999,
              background: 'rgba(240,80,80,0.15)', border: '1px solid rgba(240,80,80,0.35)',
              color: '#f87171', letterSpacing: '0.05em',
            }}>{grants.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {grants.map(g => {
              const matchChest = chests.find(c => (c as ChestType & { chest_key?: string }).chest_key === g.chest_key);
              const v = CHEST_VISUALS[matchChest?.tier ?? 3] ?? CHEST_VISUALS[1];
              return (
                <div
                  key={g.id}
                  className="rounded-xl p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.02]"
                  onClick={() => openGrant(g)}
                  style={{
                    background: v.bgColor,
                    border: `1.5px solid ${v.borderColor}`,
                    boxShadow: v.glowColor !== 'none' ? v.glowColor : undefined,
                    position: 'relative',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 9, fontWeight: 800,
                    padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(74,222,128,0.18)', color: '#4ade80',
                    border: '1px solid rgba(74,222,128,0.45)',
                    letterSpacing: '0.1em',
                  }}>GRÁTIS</span>
                  <div className="mb-3">
                    <ChestIcon size={48} ringColor={v.labelColor} fillColor={v.labelColor} bgColor={`${v.labelColor}18`} />
                  </div>
                  <p className="font-bold text-xs mb-1 leading-tight" style={{ color: v.labelColor, fontFamily: 'Rajdhani, sans-serif' }}>
                    {matchChest?.name ?? g.chest_key}
                  </p>
                  <p className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {g.reason ?? 'Prêmio conquistado'}
                  </p>
                  <button
                    className="text-xs font-bold uppercase tracking-wider rounded-md py-1.5 px-3 mt-auto"
                    style={{
                      background: `${v.labelColor}22`,
                      border: `1px solid ${v.labelColor}`,
                      color: v.labelColor,
                      fontFamily: 'Rajdhani, sans-serif',
                    }}
                  >
                    Abrir
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patch 5.2: event-themed chest groups */}
      {events.length > 0 && (() => {
        const eventChests = chests.filter(c => !!c.event_id);
        if (eventChests.length === 0) return null;
        return events.map(evt => {
          const group = eventChests.filter(c => c.event_id === evt.id);
          if (group.length === 0) return null;
          const tone = evt.color_primary || '#f59e0b';
          return (
            <div key={evt.id} className="mb-8 evt-chest-group" style={{ ['--evt-tone' as string]: tone } as React.CSSProperties}>
              <div className="evt-chest-banner">
                <span className="evt-chest-flag">EVENTO</span>
                <span className="evt-chest-name">{evt.name}</span>
                <span className="evt-chest-spacer" />
                <span className="evt-chest-end">somem ao fim do evento</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {group.map(chest => renderChestCard(chest))}
              </div>
            </div>
          );
        });
      })()}

      <div className="mb-8" style={{ display: chests.filter(c => !c.event_id).length ? undefined : 'none' }}>
        {/* Header */}
        <div
          className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: '#c9a44a' }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-sm rotate-45" style={{ background: '#c9a44a' }} />
          Baús Disponíveis
        </div>

        {/* Chest cards grid (event chests are rendered separately above) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {chests.filter(c => !c.event_id).map(chest => renderChestCard(chest))}
        </div>

        {/* History toggle */}
        {history.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="text-xs text-white/30 hover:text-white/50 transition-colors flex items-center gap-1.5"
              style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}
            >
              <span className="inline-block w-1 h-1 rounded-full bg-current" />
              {showHistory ? 'Ocultar' : 'Ver'} histórico de baús
            </button>

            {showHistory && (
              <div className="mt-3 space-y-2">
                {history.map(op => (
                  <div
                    key={op.id}
                    className="rounded-lg p-3 text-xs"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 font-semibold">
                        {op.items_received.length} item{op.items_received.length > 1 ? 's' : ''} recebidos
                      </span>
                      <span className="text-white/25">{new Date(op.opened_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {op.items_received.map((item, i) => {
                        const rarityColors: Record<string, string> = {
                          legendary: '#ffd700', epic: '#7c4dff', mythic: '#e24b4a',
                          rare: '#2196f3', uncommon: '#4caf50', common: '#969696',
                        };
                        const c = rarityColors[item.rarity] ?? '#969696';
                        return (
                          <span key={i} className="px-2 py-0.5 rounded font-bold" style={{ color: c, background: `${c}12`, border: `1px solid ${c}30` }}>
                            {item.item_name}
                          </span>
                        );
                      })}
                      {op.bonus_coins > 0 && <span className="text-yellow-400 px-1">+{op.bonus_coins} moedas</span>}
                      {op.bonus_xp > 0 && <span className="text-cyan-400 px-1">+{op.bonus_xp} XP</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider before individual items */}
      <div
        className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"
        style={{ fontFamily: 'Rajdhani, sans-serif', color: 'rgba(255,255,255,0.3)' }}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-sm rotate-45 bg-white/20" />
        Itens Individuais
      </div>

      {/* Full-screen chest opening */}
      {openingChest && (
        <ChestOpening
          chestType={openingChest}
          studentId={student.id}
          count={openingCount}
          grantId={openingGrantId}
          onClose={(r) => { handleClose(r); setOpeningCount(1); setOpeningGrantId(undefined); }}
        />
      )}
    </>
  );
}

// Patch 5.2: dedicated banner styling for event chest groups.
const EVT_CHEST_CSS = `
@keyframes evt-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.evt-chest-group {
  --evt-tone: #f59e0b;
  position: relative;
  padding: 14px 14px 16px;
  border-radius: 14px;
  background:
    radial-gradient(ellipse at top right, color-mix(in srgb, var(--evt-tone) 14%, transparent), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)) ,
    rgba(255,255,255,0.02);
  border: 1px solid color-mix(in srgb, var(--evt-tone) 35%, rgba(255,255,255,0.08));
  box-shadow: 0 0 24px color-mix(in srgb, var(--evt-tone) 12%, transparent);
}
.evt-chest-banner {
  display: flex; align-items: center; gap: 10px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  margin-bottom: 12px;
}
.evt-chest-flag {
  font-size: 10px; padding: 2px 8px; border-radius: 999px;
  background: color-mix(in srgb, var(--evt-tone) 22%, transparent);
  color: var(--evt-tone);
  border: 1px solid color-mix(in srgb, var(--evt-tone) 50%, transparent);
}
.evt-chest-name {
  font-size: 13px; color: #fff;
  background: linear-gradient(90deg,
    var(--evt-tone),
    color-mix(in srgb, var(--evt-tone) 60%, #fff),
    var(--evt-tone));
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: evt-shimmer 5s linear infinite;
}
.evt-chest-spacer { flex: 1; }
.evt-chest-end {
  font-size: 9.5px; letter-spacing: 0.18em;
  color: rgba(255,255,255,0.35);
  font-family: 'Share Tech Mono', monospace;
}
`;
