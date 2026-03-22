import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { ChestIcon } from "@/components/icons/SaoIcons";
import { GameIcon } from "@/components/icons/GameIcon";
import { ChestOpening, CHEST_VISUALS } from "@/components/student/ChestOpening";
import type { ChestType, Student, ChestOpening as ChestOpeningType } from "@/types";

interface ChestSectionProps {
  student: Student;
  onCoinsChanged: () => void;
}

export function ChestSection({ student, onCoinsChanged }: ChestSectionProps) {
  const [chests, setChests] = useState<ChestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openingChest, setOpeningChest] = useState<ChestType | null>(null);
  const [history, setHistory] = useState<ChestOpeningType[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    load();
  }, [student.teacher_id]);

  async function load() {
    setIsLoading(true);
    const [{ data: chestData }, { data: historyData }] = await Promise.all([
      supabaseStudent
        .from('chest_types')
        .select('*')
        .eq('teacher_id', student.teacher_id)
        .eq('is_active', true)
        .order('tier'),
      supabaseStudent
        .from('chest_openings')
        .select('*')
        .eq('student_id', student.id)
        .order('opened_at', { ascending: false })
        .limit(10),
    ]);
    setChests((chestData ?? []) as unknown as ChestType[]);
    setHistory((historyData ?? []) as unknown as ChestOpeningType[]);
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

  if (!chests.length) return null;

  return (
    <>
      <div className="mb-8">
        {/* Header */}
        <div
          className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: '#c9a44a' }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-sm rotate-45" style={{ background: '#c9a44a' }} />
          Baús Disponíveis
        </div>

        {/* Chest cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {chests.map(chest => {
            const v = CHEST_VISUALS[chest.tier] ?? CHEST_VISUALS[1];
            const canAffordCoins = chest.cost_coins === 0 || student.coins >= chest.cost_coins;
            const canAffordDiamonds = chest.cost_diamonds === 0 || (student.diamonds ?? 0) >= chest.cost_diamonds;
            const meetsLevel = student.level >= chest.min_level;
            const inStock = !chest.is_limited || (chest.stock !== null && chest.stock > 0);
            const canOpen = canAffordCoins && canAffordDiamonds && meetsLevel && inStock;

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
                {/* Chest icon */}
                <div className="mb-3" style={{ filter: v.glowColor !== 'none' ? `drop-shadow(${v.glowColor.replace('box-shadow:', '')})` : undefined }}>
                  <ChestIcon
                    size={52}
                    ringColor={v.labelColor}
                    fillColor={v.labelColor}
                    bgColor={`${v.labelColor}18`}
                  />
                </div>

                <p
                  className="font-bold text-xs mb-1 leading-tight"
                  style={{ color: v.labelColor, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}
                >
                  {chest.name}
                </p>

                {chest.description && (
                  <p className="text-[10px] text-white/30 mb-2 leading-snug">{chest.description}</p>
                )}

                {/* Cost */}
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

                {/* Stock warning */}
                {chest.is_limited && chest.stock !== null && chest.stock <= 5 && (
                  <p className="text-[10px] text-red-400 font-bold animate-pulse mb-2">
                    {chest.stock} restante{chest.stock !== 1 ? 's' : ''}!
                  </p>
                )}

                {/* Level gate */}
                {!meetsLevel && (
                  <p className="text-[10px] text-white/30 mb-2">Nível {chest.min_level}+</p>
                )}

                <button
                  onClick={() => canOpen && setOpeningChest(chest)}
                  disabled={!canOpen}
                  className={`w-full text-xs py-1.5 rounded-lg font-bold transition-all ${canOpen ? 'btn-cyber justify-center' : ''}`}
                  style={
                    !canOpen
                      ? {
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.2)',
                          cursor: 'not-allowed',
                          fontFamily: 'Rajdhani, sans-serif',
                        }
                      : { background: `${v.labelColor}20`, border: `1px solid ${v.borderColor}`, color: v.labelColor }
                  }
                >
                  {!inStock ? 'Esgotado' : !meetsLevel ? 'Bloqueado' : !canAffordCoins || !canAffordDiamonds ? 'Sem recursos' : 'Abrir'}
                </button>
              </div>
            );
          })}
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
          onClose={handleClose}
        />
      )}
    </>
  );
}
