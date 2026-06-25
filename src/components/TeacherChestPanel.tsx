import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GameIcon } from "@/components/icons/GameIcon";
import { toast } from "sonner";
import type { ChestType, ChestOpening } from "@/types";
import { CHEST_VISUALS } from "@/components/student/ChestOpening";

interface TeacherChestPanelProps {
  teacherId: string;
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.85)',
  outline: 'none',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  width: '100%',
};

// Presets rebalanceados (cada linha de drop rates soma exatamente 100%).
// Progressão de custo e raridade monotônica do Tier 1 → 6.
const TIER_PRESETS: Record<number, Partial<typeof DEFAULT_FORM>> = {
  1: { name: 'Baú de Madeira',  costCoins: 50,   costDiamonds: 0,  dropCommon: 75, dropUncommon: 22, dropRare: 3,  dropEpic: 0,  dropLegendary: 0,  dropMythic: 0,  minItems: 1, maxItems: 1 },
  2: { name: 'Baú de Ferro',    costCoins: 150,  costDiamonds: 0,  dropCommon: 45, dropUncommon: 40, dropRare: 13, dropEpic: 2,  dropLegendary: 0,  dropMythic: 0,  minItems: 1, maxItems: 1 },
  3: { name: 'Baú de Prata',    costCoins: 350,  costDiamonds: 0,  dropCommon: 0,  dropUncommon: 35, dropRare: 45, dropEpic: 18, dropLegendary: 2,  dropMythic: 0,  minItems: 1, maxItems: 1 },
  4: { name: 'Baú de Ouro',     costCoins: 700,  costDiamonds: 0,  dropCommon: 0,  dropUncommon: 0,  dropRare: 40, dropEpic: 40, dropLegendary: 18, dropMythic: 2,  minItems: 1, maxItems: 2 },
  5: { name: 'Baú Mítico',      costCoins: 0,    costDiamonds: 60, dropCommon: 0,  dropUncommon: 0,  dropRare: 10, dropEpic: 45, dropLegendary: 35, dropMythic: 10, minItems: 1, maxItems: 2 },
  6: { name: 'Baú Lendário',    costCoins: 0,    costDiamonds: 120,dropCommon: 0,  dropUncommon: 0,  dropRare: 0,  dropEpic: 25, dropLegendary: 50, dropMythic: 25, minItems: 2, maxItems: 3 },
};

const DEFAULT_FORM = {
  name: '', description: '', tier: 1,
  costCoins: 50, costDiamonds: 0, minLevel: 1,
  dropCommon: 80, dropUncommon: 20, dropRare: 0, dropEpic: 0, dropLegendary: 0, dropMythic: 0,
  minItems: 1, maxItems: 1,
  bonusCoinsMin: 0, bonusCoinsMax: 0, bonusXpMin: 0, bonusXpMax: 0,
  isLimited: false, stock: '',
};

const RARITY_LABELS = [
  { key: 'dropCommon' as const,    label: 'Comum',    color: '#969696' },
  { key: 'dropUncommon' as const,  label: 'Incomum',  color: '#4caf50' },
  { key: 'dropRare' as const,      label: 'Raro',     color: '#2196f3' },
  { key: 'dropEpic' as const,      label: 'Épico',    color: '#7c4dff' },
  { key: 'dropLegendary' as const, label: 'Lendário', color: '#ffd700' },
  { key: 'dropMythic' as const,    label: 'Mítico',   color: '#e24b4a' },
];

export function TeacherChestPanel({ teacherId }: TeacherChestPanelProps) {
  const [chests, setChests] = useState<ChestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openings, setOpenings] = useState<Record<string, ChestOpening[]>>({});
  const [loadingOpenings, setLoadingOpenings] = useState<string | null>(null);

  const [form, setForm] = useState({ ...DEFAULT_FORM });

  const f = (key: keyof typeof form, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const total = form.dropCommon + form.dropUncommon + form.dropRare + form.dropEpic + form.dropLegendary + form.dropMythic;

  useEffect(() => { load(); }, [teacherId]);

  async function load() {
    setIsLoading(true);
    const { data } = await supabase.from('chest_types').select('*').eq('teacher_id', teacherId).order('tier');
    setChests((data ?? []) as unknown as ChestType[]);
    setIsLoading(false);
  }

  function applyPreset(tier: number) {
    const preset = TIER_PRESETS[tier];
    if (preset) setForm(prev => ({ ...prev, ...preset, tier }));
    else setForm(prev => ({ ...prev, tier }));
  }

  async function save() {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (total !== 100) { toast.error(`Drop rates devem somar 100% (atual: ${total}%)`); return; }

    setIsSaving(true);
    const payload = {
      teacher_id: teacherId,
      // chest_key é obrigatório para a RPC open_chest_v2 conseguir abrir o baú.
      // Sem ele o app cai no caminho legado (open_chest(uuid,uuid)) que foi
      // removido do banco, resultando em "Erro ao abrir o baú".
      chest_key: `tchest_${crypto.randomUUID()}`,
      name: form.name.trim(),
      description: form.description.trim() || null,
      tier: form.tier,
      cost_coins: form.costCoins,
      cost_diamonds: form.costDiamonds,
      min_level: form.minLevel,
      drop_common: form.dropCommon,
      drop_uncommon: form.dropUncommon,
      drop_rare: form.dropRare,
      drop_epic: form.dropEpic,
      drop_legendary: form.dropLegendary,
      drop_mythic: form.dropMythic,
      min_items: form.minItems,
      max_items: form.maxItems,
      bonus_coins_min: form.bonusCoinsMin,
      bonus_coins_max: form.bonusCoinsMax,
      bonus_xp_min: form.bonusXpMin,
      bonus_xp_max: form.bonusXpMax,
      is_limited: form.isLimited,
      stock: form.isLimited && form.stock !== '' ? Number(form.stock) : null,
      is_active: true,
    };

    const { error } = await supabase.from('chest_types').insert(payload as never);
    setIsSaving(false);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    toast.success('Baú criado!');
    setForm({ ...DEFAULT_FORM });
    setShowForm(false);
    await load();
  }

  async function toggleActive(chest: ChestType) {
    await supabase.from('chest_types').update({ is_active: !chest.is_active } as never).eq('id', chest.id);
    await load();
  }

  async function deleteChest(id: string) {
    setDeletingId(id);
    await supabase.from('chest_types').delete().eq('id', id);
    setDeletingId(null);
    await load();
  }

  async function loadOpenings(chestId: string) {
    setLoadingOpenings(chestId);
    const { data } = await supabase
      .from('chest_openings')
      .select('*, students(name)')
      .eq('chest_type_id', chestId)
      .order('opened_at', { ascending: false })
      .limit(20);
    setOpenings(prev => ({ ...prev, [chestId]: (data ?? []) as unknown as ChestOpening[] }));
    setLoadingOpenings(null);
  }

  async function toggleExpand(chestId: string) {
    if (expandedId === chestId) {
      setExpandedId(null);
    } else {
      setExpandedId(chestId);
      if (!openings[chestId]) await loadOpenings(chestId);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={28} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)} className="btn-cyber text-sm">
          <Plus size={15} /> {showForm ? 'Cancelar' : 'Criar Baú'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="holo-panel space-y-5">
          <h3 className="section-title text-base">
            <GameIcon id="chest" size={18} /> Criar Baú
          </h3>

          {/* Preset picker */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Tier (preset)</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map(t => {
                const v = CHEST_VISUALS[t];
                return (
                  <button
                    key={t}
                    onClick={() => applyPreset(t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: form.tier === t ? `${v.bgColor}` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${form.tier === t ? v.borderColor : 'rgba(255,255,255,0.08)'}`,
                      color: form.tier === t ? v.labelColor : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    T{t} — {v.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Nome</label>
              <input style={inputStyle} value={form.name} onChange={e => f('name', e.target.value)} placeholder="Baú de Ouro" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Descrição (opcional)</label>
              <input style={inputStyle} value={form.description} onChange={e => f('description', e.target.value)} placeholder="..." />
            </div>
          </div>

          {/* Cost */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Custo</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-yellow-400/60 mb-1">Moedas</label>
                <input type="number" min="0" style={{ ...inputStyle, color: '#ffd700' }} value={form.costCoins} onChange={e => f('costCoins', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-cyan-400/60 mb-1">Diamantes</label>
                <input type="number" min="0" style={{ ...inputStyle, color: '#00e5ff' }} value={form.costDiamonds} onChange={e => f('costDiamonds', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Nível mín.</label>
                <input type="number" min="1" style={inputStyle} value={form.minLevel} onChange={e => f('minLevel', Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Drop rates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/40 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Drop Rates</p>
              <span className={`text-xs font-bold ${total === 100 ? 'text-green-400' : 'text-red-400'}`}>
                Total: {total}% {total === 100 ? '✓' : '— deve ser 100'}
              </span>
            </div>
            <div className="space-y-2">
              {RARITY_LABELS.map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-semibold flex-shrink-0" style={{ color }}>{label}</span>
                  <input
                    type="range" min="0" max="100"
                    value={form[key]}
                    onChange={e => f(key, Number(e.target.value))}
                    className="flex-1"
                    style={{ accentColor: color }}
                  />
                  <input
                    type="number" min="0" max="100"
                    value={form[key]}
                    onChange={e => f(key, Number(e.target.value))}
                    style={{ ...inputStyle, width: '56px', textAlign: 'center', color, padding: '4px 8px' }}
                  />
                  <span className="text-xs text-white/30 w-4">%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Items per opening */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Itens por Abertura</p>
            <div className="flex gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1">Mínimo</label>
                <input type="number" min="1" max="5" style={{ ...inputStyle, width: '80px' }} value={form.minItems} onChange={e => f('minItems', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Máximo</label>
                <input type="number" min="1" max="5" style={{ ...inputStyle, width: '80px' }} value={form.maxItems} onChange={e => f('maxItems', Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Bonus */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Bônus (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-yellow-400/60 mb-1">Moedas bônus (min–max)</label>
                <div className="flex gap-2">
                  <input type="number" min="0" style={{ ...inputStyle, color: '#ffd700' }} value={form.bonusCoinsMin} onChange={e => f('bonusCoinsMin', Number(e.target.value))} placeholder="0" />
                  <input type="number" min="0" style={{ ...inputStyle, color: '#ffd700' }} value={form.bonusCoinsMax} onChange={e => f('bonusCoinsMax', Number(e.target.value))} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-cyan-400/60 mb-1">XP bônus (min–max)</label>
                <div className="flex gap-2">
                  <input type="number" min="0" style={{ ...inputStyle, color: '#00e5ff' }} value={form.bonusXpMin} onChange={e => f('bonusXpMin', Number(e.target.value))} placeholder="0" />
                  <input type="number" min="0" style={{ ...inputStyle, color: '#00e5ff' }} value={form.bonusXpMax} onChange={e => f('bonusXpMax', Number(e.target.value))} placeholder="0" />
                </div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={form.isLimited} onChange={e => f('isLimited', e.target.checked)} className="w-4 h-4 accent-cyan-400" />
              <span className="text-sm text-white/60">Estoque limitado</span>
            </label>
            {form.isLimited && (
              <input
                type="number" min="1"
                style={{ ...inputStyle, width: '120px' }}
                value={form.stock}
                onChange={e => f('stock', e.target.value)}
                placeholder="Quantidade"
              />
            )}
          </div>

          <button onClick={save} disabled={isSaving || total !== 100} className="btn-cyber w-full justify-center">
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Salvar Baú
          </button>
        </div>
      )}

      {/* Chest list */}
      {chests.length === 0 && !showForm ? (
        <div className="holo-panel text-center py-10">
          <GameIcon id="chest" size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-white/30 text-sm">Nenhum baú criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chests.map(chest => {
            const v = CHEST_VISUALS[chest.tier] ?? CHEST_VISUALS[1];
            const isExpanded = expandedId === chest.id;
            return (
              <div
                key={chest.id}
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${chest.is_active ? v.borderColor : 'rgba(255,255,255,0.06)'}`, background: chest.is_active ? v.bgColor : 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-3 p-4">
                  <GameIcon id="chest" size={36} ringColor={v.labelColor} fillColor={v.labelColor} bgColor={`${v.labelColor}18`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>{chest.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ color: v.labelColor, background: `${v.labelColor}18`, border: `1px solid ${v.borderColor}` }}>T{chest.tier}</span>
                      {!chest.is_active && <span className="text-xs text-white/30">(inativo)</span>}
                      {chest.is_limited && chest.stock !== null && (
                        <span className="text-xs text-red-400 font-bold animate-pulse">{chest.stock} restantes</span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-white/40 mt-1 flex-wrap">
                      {chest.cost_coins > 0 && <span className="text-yellow-400">{chest.cost_coins} moedas</span>}
                      {chest.cost_diamonds > 0 && <span className="text-cyan-400">{chest.cost_diamonds} diamantes</span>}
                      <span>{chest.min_items}–{chest.max_items} item{chest.max_items > 1 ? 's' : ''}</span>
                    </div>
                    {/* Drop rate mini bars */}
                    <div className="flex gap-1 mt-2">
                      {[
                        { pct: chest.drop_common,    c: '#969696' },
                        { pct: chest.drop_uncommon,  c: '#4caf50' },
                        { pct: chest.drop_rare,      c: '#2196f3' },
                        { pct: chest.drop_epic,      c: '#7c4dff' },
                        { pct: chest.drop_legendary, c: '#ffd700' },
                        { pct: chest.drop_mythic,    c: '#e24b4a' },
                      ].filter(r => r.pct > 0).map((r, i) => (
                        <div key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${r.c}20`, color: r.c }}>
                          {r.pct}%
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(chest)}
                      className="text-xs px-2 py-1 rounded-lg font-bold transition-all"
                      style={{
                        background: chest.is_active ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${chest.is_active ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        color: chest.is_active ? '#00e5ff' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {chest.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      onClick={() => toggleExpand(chest.id)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors"
                      title="Ver histórico"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => deleteChest(chest.id)}
                      disabled={deletingId === chest.id}
                      className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 transition-colors"
                    >
                      {deletingId === chest.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                    <button onClick={() => toggleExpand(chest.id)} className="p-1 text-white/20">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Histórico de Aberturas
                    </p>
                    {loadingOpenings === chest.id ? (
                      <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-cyan-400" /></div>
                    ) : (openings[chest.id] ?? []).length === 0 ? (
                      <p className="text-xs text-white/20 text-center py-3">Nenhuma abertura ainda.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(openings[chest.id] ?? []).map(op => (
                          <div key={op.id} className="text-xs rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white/60 font-semibold">
                                {(op as unknown as { students: { name: string } }).students?.name ?? 'Aluno'}
                              </span>
                              <span className="text-white/25">{new Date(op.opened_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {op.items_received.map((item, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                  style={{ color: item.rarity === 'legendary' ? '#ffd700' : item.rarity === 'epic' ? '#7c4dff' : item.rarity === 'mythic' ? '#e24b4a' : item.rarity === 'rare' ? '#2196f3' : 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)' }}>
                                  {item.item_name}
                                </span>
                              ))}
                              {op.bonus_coins > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] text-yellow-400">+{op.bonus_coins} moedas</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
